import type { CachedArtifact, VerificationReceipt } from "../types/tool-contracts.js";
import { dataRootPathExists, readArtifactByStableId } from "./cache-io.js";

export interface CacheReadReuseResult {
  hit: boolean;
  artifact?: CachedArtifact;
  warning?: string;
}

export async function applyCachedReceiptProvenance(
  receipt: VerificationReceipt,
  existingReceipt: VerificationReceipt | undefined,
): Promise<void> {
  if (existingReceipt) {
    if (existingReceipt.raw_content_sha256) receipt.raw_content_sha256 = existingReceipt.raw_content_sha256;
    if (existingReceipt.gesetzesnummer) receipt.gesetzesnummer = existingReceipt.gesetzesnummer;
    if (existingReceipt.dokumentnummer) receipt.dokumentnummer = existingReceipt.dokumentnummer;
    if (existingReceipt.eli) receipt.eli = existingReceipt.eli;
    if (existingReceipt.retrieval_method) receipt.retrieval_method = existingReceipt.retrieval_method;
    if (existingReceipt.retrieved_at) receipt.retrieved_at = existingReceipt.retrieved_at;
    if (existingReceipt.receipt_version !== undefined) receipt.receipt_version = existingReceipt.receipt_version;
    if (existingReceipt.raw_source_path !== undefined) receipt.raw_source_path = existingReceipt.raw_source_path;
    if (existingReceipt.raw_source_saved !== undefined) receipt.raw_source_saved = existingReceipt.raw_source_saved;
    if (existingReceipt.source_url_official !== undefined) receipt.source_url_official = existingReceipt.source_url_official;
    if (existingReceipt.content_url_final !== undefined) receipt.content_url_final = existingReceipt.content_url_final;
    if (existingReceipt.content_type !== undefined) receipt.content_type = existingReceipt.content_type;
    if (existingReceipt.raw_source_encoding !== undefined) receipt.raw_source_encoding = existingReceipt.raw_source_encoding;
  }

  const warnings: string[] = [];
  if (!existingReceipt?.raw_content_sha256 || !existingReceipt?.retrieved_at) {
    warnings.push("legacy cache receipt: provenance incomplete (no original raw hash/retrieval time)");
  }

  const rawSourcePath = existingReceipt?.raw_source_path;
  if (existingReceipt && (!rawSourcePath || rawSourcePath.trim().length === 0)) {
    warnings.push("legacy cache receipt: no archived raw source (pre-raw-archive artifact)");
  } else if (rawSourcePath && rawSourcePath.trim().length > 0) {
    const rawSourceExists = await dataRootPathExists(rawSourcePath);
    if (!rawSourceExists) {
      warnings.push(`raw_source_missing: archived raw source file not found (${rawSourcePath})`);
    }
  }

  for (const found of warnings) {
    receipt.warning = receipt.warning ? `${receipt.warning}; ${found}` : found;
  }
}

async function tryReadCachedArtifact(params: {
  stableId: string;
  source: "ris" | "jusline";
  docType: CachedArtifact["frontmatter"]["doc_type"];
}): Promise<CacheReadReuseResult> {
  try {
    const artifact = await readArtifactByStableId({
      stableId: params.stableId,
      source: params.source,
      docType: params.docType,
      includeMetadata: true,
    });

    return { hit: true, artifact };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cache read error";

    if (message.includes("ENOENT") || message.includes("no such file")) {
      return { hit: false };
    }

    if (message.includes("Cache consistency mismatch")) {
      return { hit: false, warning: `cache_conflict: ${message}` };
    }

    return { hit: false, warning: `cache_read_failed: ${message}` };
  }
}

export async function tryReadCachedRisArtifact(params: {
  stableId: string;
  docType: "norm_segment" | "norm_document";
}): Promise<CacheReadReuseResult> {
  return tryReadCachedArtifact({
    stableId: params.stableId,
    source: "ris",
    docType: params.docType,
  });
}

export async function tryReadCachedJuslineArtifact(params: {
  stableId: string;
  docType: "decision" | "discussion" | "commentary";
}): Promise<CacheReadReuseResult> {
  return tryReadCachedArtifact({
    stableId: params.stableId,
    source: "jusline",
    docType: params.docType,
  });
}
