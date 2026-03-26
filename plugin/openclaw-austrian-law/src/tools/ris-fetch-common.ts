import type { ToolName } from "../types/shared.js";
import type { CacheReadReuseResult } from "../cache/cache-read-reuse.js";
import type { CacheWriteThroughResult } from "../cache/cache-write-through.js";

export function resolveSourceIdFromInputOrUrl(params: {
  sourceId?: string;
  sourceUrl: string;
  extractFromUrl: (url: string) => string | null;
}): string | null {
  if (params.sourceId && params.sourceId.trim().length > 0) {
    return params.sourceId.trim();
  }
  return params.extractFromUrl(params.sourceUrl);
}

export function buildCacheHitMeta(tool: ToolName) {
  return {
    tool,
    source: "ris" as const,
    timestamp: new Date().toISOString(),
    notices: ["cache_hit: reused cached artifact"],
  };
}

export function buildRefreshMeta(tool: ToolName) {
  return {
    tool,
    source: "ris" as const,
    timestamp: new Date().toISOString(),
    notices: ["cache_refresh: bypassed cached artifact and fetched fresh content"],
  };
}

export function buildCacheWarnings(params: {
  cacheRead: CacheReadReuseResult;
  cacheWrite: CacheWriteThroughResult;
}): string[] {
  const warnings: string[] = [];
  if (params.cacheRead.warning) warnings.push(params.cacheRead.warning);
  if (!params.cacheWrite.cached) warnings.push(`cache_write_failed: ${params.cacheWrite.cacheError}`);
  return warnings;
}
