import crypto from "node:crypto";
import type { VerificationReceipt, VerificationStatus, RetrievalMethod } from "../types/tool-contracts.js";

export interface ComputeReceiptParams {
  sourceId?: string;
  gesetzesnummer?: string;
  dokumentnummer?: string;
  eli?: string;
  paragraf?: string;
  consolidatedAsOf?: string;
  retrievedAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  kundmachungsorgan?: string;
  content: string;
  retrievalMethod: RetrievalMethod;
  stichtag?: string;
  fallbackReason?: string;
  normStatus?: "current" | "historical" | "repealed";
}

export function computeContentSha256(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function normalizeDateString(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  const trimmed = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return undefined;
}

export function evaluateStichtagValidity(params: {
  stichtag?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  consolidatedAsOf?: string;
  normStatus?: "current" | "historical" | "repealed";
  retrievalMethod: RetrievalMethod;
}): { status: VerificationStatus; warning?: string } {
  const targetDate = normalizeDateString(params.stichtag) || new Date().toISOString().slice(0, 10);
  const effectiveFrom = normalizeDateString(params.effectiveFrom);
  const effectiveTo = normalizeDateString(params.effectiveTo);
  const today = new Date().toISOString().slice(0, 10);
  const isTargetToday = targetDate === today;

  if (params.retrievalMethod === "web_search_fallback") {
    return {
      status: "unverified_fallback",
      warning: "unverified_fallback: retrieval was performed via web search fallback without direct primary source ID",
    };
  }

  if (effectiveFrom && targetDate < effectiveFrom) {
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: version not yet in force on stichtag ${targetDate} (effective_from: ${effectiveFrom})`,
    };
  }

  if (effectiveTo && targetDate > effectiveTo) {
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: version was repealed before stichtag ${targetDate} (effective_to: ${effectiveTo})`,
    };
  }

  if (params.normStatus === "repealed" && isTargetToday && !effectiveTo) {
    return {
      status: "stichtag_mismatch",
      warning: `stichtag_mismatch: norm marked as repealed for current stichtag ${targetDate}`,
    };
  }

  if (isTargetToday) {
    return { status: "verified_current" };
  }

  return { status: "historical_valid_for_stichtag" };
}

export function buildVerificationReceipt(params: ComputeReceiptParams): VerificationReceipt {
  const targetStichtag = normalizeDateString(params.stichtag) || new Date().toISOString().slice(0, 10);
  const effectiveFrom = normalizeDateString(params.effectiveFrom);
  const effectiveTo = normalizeDateString(params.effectiveTo);
  const consolidatedAsOf = normalizeDateString(params.consolidatedAsOf) || effectiveFrom || targetStichtag;
  const retrievedAt = params.retrievedAt || new Date().toISOString();

  const { status, warning } = evaluateStichtagValidity({
    stichtag: targetStichtag,
    effectiveFrom,
    effectiveTo,
    consolidatedAsOf,
    normStatus: params.normStatus,
    retrievalMethod: params.retrievalMethod,
  });

  const receipt: VerificationReceipt = {
    source_id: params.sourceId,
    gesetzesnummer: params.gesetzesnummer,
    dokumentnummer: params.dokumentnummer || params.sourceId,
    eli: params.eli,
    paragraf: params.paragraf,
    consolidated_as_of: consolidatedAsOf,
    retrieved_at: retrievedAt,
    effective_from: effectiveFrom,
    effective_to: effectiveTo,
    kundmachungsorgan: params.kundmachungsorgan,
    content_sha256: computeContentSha256(params.content),
    retrieval_method: params.retrievalMethod,
    verification_status: status,
    fallback_reason: params.fallbackReason,
    stichtag: targetStichtag,
    warning,
  };

  return receipt;
}
