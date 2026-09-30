import type { CachedArtifact, VerificationReceipt } from "../types/tool-contracts.js";
import { readArtifactByStableId } from "./cache-io.js";

export interface CacheReadReuseResult {
  hit: boolean;
  artifact?: CachedArtifact;
  warning?: string;
}

export function applyCachedReceiptProvenance(
  receipt: VerificationReceipt,
  existingReceipt: VerificationReceipt | undefined,
): void {
  if (existingReceipt) {
    if (existingReceipt.raw_content_sha256) receipt.raw_content_sha256 = existingReceipt.raw_content_sha256;
    if (existingReceipt.gesetzesnummer) receipt.gesetzesnummer = existingReceipt.gesetzesnummer;
    if (existingReceipt.dokumentnummer) receipt.dokumentnummer = existingReceipt.dokumentnummer;
    if (existingReceipt.eli) receipt.eli = existingReceipt.eli;
    if (existingReceipt.retrieval_method) receipt.retrieval_method = existingReceipt.retrieval_method;
    if (existingReceipt.retrieved_at) receipt.retrieved_at = existingReceipt.retrieved_at;
  }

  if (!existingReceipt?.raw_content_sha256 || !existingReceipt?.retrieved_at) {
    const legacyWarning = "legacy cache receipt: provenance incomplete (no original raw hash/retrieval time)";
    receipt.warning = receipt.warning ? `${receipt.warning}; ${legacyWarning}` : legacyWarning;
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
