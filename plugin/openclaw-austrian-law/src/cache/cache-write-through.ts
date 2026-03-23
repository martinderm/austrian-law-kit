import type { CachedArtifact } from "../types/tool-contracts.js";
import { writeArtifact } from "./cache-io.js";

export interface CacheWriteThroughResult {
  cached: boolean;
  cachePath?: string;
  cacheError?: string;
}

export async function writeThroughCacheForRisArtifact(
  artifact: CachedArtifact,
): Promise<CacheWriteThroughResult> {
  try {
    const written = await writeArtifact(artifact);
    return { cached: true, cachePath: written.markdownPath };
  } catch (error) {
    return {
      cached: false,
      cacheError: error instanceof Error ? error.message : "Unknown cache write error",
    };
  }
}
