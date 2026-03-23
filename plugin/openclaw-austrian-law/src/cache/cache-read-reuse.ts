import type { CachedArtifact } from "../types/tool-contracts.js";
import { readArtifactByStableId } from "./cache-io.js";

export interface CacheReadReuseResult {
  hit: boolean;
  artifact?: CachedArtifact;
  warning?: string;
}

export async function tryReadCachedRisArtifact(params: {
  stableId: string;
  docType: "norm_segment" | "norm_document";
}): Promise<CacheReadReuseResult> {
  try {
    const artifact = await readArtifactByStableId({
      stableId: params.stableId,
      source: "ris",
      docType: params.docType,
      includeMetadata: false,
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
