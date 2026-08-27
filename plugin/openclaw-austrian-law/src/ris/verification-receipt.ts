import crypto from "node:crypto";
import type {
  VerificationReceipt,
  VerificationStatus,
  RetrievalMethod,
} from "../types/tool-contracts.js";

export interface ComputeReceiptParams {
  sourceId?: string | null;
  gesetzesnummer?: string | null;
  dokumentnummer?: string | null;
  eli?: string | null;
  paragraf?: string | null;
  consolidatedAsOf?: string | null;
  retrievedAt?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  kundmachungsorgan?: string | null;
  rawContent?: string;
  content: string;
  retrievalMethod: RetrievalMethod;
  cached?: boolean;
  stichtag?: string;
  fallbackReason?: string | null;
  normStatus?: "in_force" | "current" | "historical" | "repealed" | "unknown";
}

export function computeSha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

export function computeContentSha256(content: string): string {
  return computeSha256(content);
}

/**
 * Returns today's date in Europe/Vienna timezone as YYYY-MM-DD.
 */
export function getViennaTodayDate(): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vienna",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

/**
 * Validates whether a string is a strict and real calendar date in YYYY-MM-DD format.
 */
export function isValidIsoDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [yStr, mStr, dStr] = dateStr.split("-");
  const year = Number.parseInt(yStr ?? "", 10);
  const month = Number.parseInt(mStr ?? "", 10);
  const day = Number.parseInt(dStr ?? "", 10);

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * Normalizes input date strings (YYYY-MM-DD or DD.MM.YYYY).
 * Returns undefined if invalid or empty.
 */
export function normalizeDateString(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  const trimmed = dateStr.trim();
  if (!trimmed) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return isValidIsoDate(trimmed) ? trimmed : undefined;
  }

  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match && match[1] && match[2] && match[3]) {
    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];
    const candidate = `${year}-${month}-${day}`;
    return isValidIsoDate(candidate) ? candidate : undefined;
  }

  return undefined;
}

export interface StichtagValidationResult {
  valid: boolean;
  stichtag: string;
  isDefault: boolean;
  error?: string;
}

/**
 * Validates the requested stichtag parameter fail-closed.
 * Rejects invalid format or nonexistent dates with an error.
 */
export function validateStichtag(stichtag?: string): StichtagValidationResult {
  if (!stichtag || stichtag.trim().length === 0) {
    return {
      valid: true,
      stichtag: getViennaTodayDate(),
      isDefault: true,
    };
  }

  const normalized = normalizeDateString(stichtag);
  if (!normalized) {
    return {
      valid: false,
      stichtag: "",
      isDefault: false,
      error: `Invalid stichtag: "${stichtag}". Must be a valid calendar date in format YYYY-MM-DD (e.g. 2026-01-01) or DD.MM.YYYY.`,
    };
  }

  return {
    valid: true,
    stichtag: normalized,
    isDefault: false,
  };
}

export function evaluateStichtagValidity(params: {
  stichtag: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  consolidatedAsOf?: string;
  normStatus?: "in_force" | "current" | "historical" | "repealed" | "unknown";
  retrievalMethod: RetrievalMethod;
}): { status: VerificationStatus; warning?: string } {
  const targetDate = params.stichtag;
  const effectiveFrom = params.effectiveFrom;
  const effectiveTo = params.effectiveTo;
  const viennaToday = getViennaTodayDate();
  const isTargetToday = targetDate === viennaToday;

  if (params.retrievalMethod === "web_search_fallback") {
    return {
      status: "unverified_fallback",
      warning: "unverified_fallback: retrieval was performed via web search fallback without direct primary source verification",
    };
  }

  // Check temporal bounds if dates are present
  if (effectiveFrom && targetDate < effectiveFrom) {
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: norm version is not yet in force on stichtag ${targetDate} (effective_from: ${effectiveFrom})`,
    };
  }

  if (effectiveTo && targetDate > effectiveTo) {
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: norm version was repealed before stichtag ${targetDate} (effective_to: ${effectiveTo})`,
    };
  }

  if (params.normStatus === "repealed") {
    if (effectiveTo && targetDate <= effectiveTo) {
      // Historical date when it was still in force before repeal
      return { status: isTargetToday ? "verified_current" : "historical_valid_for_stichtag" };
    }
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: norm is marked as repealed for stichtag ${targetDate}`,
    };
  }

  if (params.normStatus === "historical") {
    if (isTargetToday) {
      return {
        status: "stichtag_mismatch",
        warning: `stichtag_mismatch: historical version requested for current date ${targetDate} without current validity`,
      };
    }
    if (effectiveFrom && targetDate >= effectiveFrom && (!effectiveTo || targetDate <= effectiveTo)) {
      return { status: "historical_valid_for_stichtag" };
    }
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: historical norm not valid on stichtag ${targetDate}`,
    };
  }

  // If no date evidence and status unknown -> insufficient metadata
  if (!effectiveFrom && !effectiveTo && !params.consolidatedAsOf && (!params.normStatus || params.normStatus === "unknown")) {
    return {
      status: "insufficient_metadata",
      warning: "insufficient_metadata: RIS response did not contain sufficient validity dates or status metadata",
    };
  }

  if (isTargetToday) {
    return { status: "verified_current" };
  }

  return { status: "historical_valid_for_stichtag" };
}

export function buildVerificationReceipt(params: ComputeReceiptParams): VerificationReceipt {
  const stichtagCheck = validateStichtag(params.stichtag);
  const targetStichtag = stichtagCheck.valid ? stichtagCheck.stichtag : getViennaTodayDate();

  const effectiveFrom = normalizeDateString(params.effectiveFrom) ?? null;
  const effectiveTo = normalizeDateString(params.effectiveTo) ?? null;
  // FAIL-CLOSED: consolidated_as_of is populated EXCLUSIVELY from parsed metadata, never fallback to stichtag or effectiveFrom!
  const consolidatedAsOf = normalizeDateString(params.consolidatedAsOf) ?? null;
  const retrievedAt = params.retrievedAt || new Date().toISOString();

  let status: VerificationStatus;
  let warning: string | undefined;

  if (!stichtagCheck.valid) {
    status = "insufficient_metadata";
    warning = stichtagCheck.error;
  } else {
    const evaluation = evaluateStichtagValidity({
      stichtag: targetStichtag,
      effectiveFrom: effectiveFrom ?? undefined,
      effectiveTo: effectiveTo ?? undefined,
      consolidatedAsOf: consolidatedAsOf ?? undefined,
      normStatus: params.normStatus,
      retrievalMethod: params.retrievalMethod,
    });
    status = evaluation.status;
    warning = evaluation.warning;
  }

  const rawSha = computeSha256(params.rawContent || params.content);
  const normalizedSha = computeSha256(params.content);

  const receipt: VerificationReceipt = {
    source_id: params.sourceId ?? null,
    gesetzesnummer: params.gesetzesnummer ?? null,
    dokumentnummer: params.dokumentnummer ?? params.sourceId ?? null,
    eli: params.eli ?? null,
    paragraf: params.paragraf ?? null,
    consolidated_as_of: consolidatedAsOf,
    retrieved_at: retrievedAt,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
    norm_status: params.normStatus,
    kundmachungsorgan: params.kundmachungsorgan ?? null,
    raw_content_sha256: rawSha,
    normalized_content_sha256: normalizedSha,
    content_sha256: normalizedSha,
    retrieval_method: params.retrievalMethod,
    cached: params.cached ?? false,
    verification_status: status,
    fallback_reason: params.fallbackReason ?? null,
    stichtag: targetStichtag,
    warning: warning ?? null,
  };

  return receipt;
}
