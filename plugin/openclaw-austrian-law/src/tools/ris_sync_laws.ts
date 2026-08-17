import { risFetchWholeLawStub } from "./ris_fetch_whole_law.js";
import type {
  RisSyncLawsInput,
  RisSyncLawsOutput,
  SyncedLawResult,
} from "../types/tool-contracts.js";

export async function risSyncLawsStub(input: RisSyncLawsInput): Promise<RisSyncLawsOutput> {
  if (!input || !Array.isArray(input.laws) || input.laws.length === 0) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid ris_sync_laws input: 'laws' must be a non-empty array",
      },
      meta: { tool: "ris_sync_laws", source: "ris" },
    };
  }

  const results: SyncedLawResult[] = [];
  let synced = 0;
  let cached = 0;
  let failed = 0;

  for (const item of input.laws) {
    try {
      const fetchResult = await risFetchWholeLawStub(item);
      if (fetchResult.ok && fetchResult.data?.artifact) {
        const artifact = fetchResult.data.artifact;
        const isCacheHit = fetchResult.meta?.notices?.some((n) => n.includes("cache_hit")) ?? false;
        if (isCacheHit) {
          cached++;
        } else {
          synced++;
        }
        results.push({
          query: item.query,
          stable_id: artifact.stable_id,
          title: artifact.frontmatter.title || artifact.frontmatter.law_title,
          law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
          source_url: artifact.frontmatter.source_url,
          cached: isCacheHit,
          ok: true,
        });
      } else {
        failed++;
        results.push({
          query: item.query,
          ok: false,
          cached: false,
          error: fetchResult.error?.message || "Failed to fetch whole law",
        });
      }
    } catch (error) {
      failed++;
      results.push({
        query: item.query,
        ok: false,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error during sync",
      });
    }
  }

  if (failed === input.laws.length) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `Failed to sync all ${input.laws.length} requested laws`,
        details: { total: input.laws.length, failed, laws: results },
      },
      meta: {
        tool: "ris_sync_laws",
        source: "ris",
        timestamp: new Date().toISOString(),
        notices: [`synced:${synced}`, `cached:${cached}`, `failed:${failed}`],
      },
    };
  }

  return {
    ok: true,
    data: {
      total: input.laws.length,
      synced,
      cached,
      failed,
      laws: results,
    },
    meta: {
      tool: "ris_sync_laws",
      source: "ris",
      timestamp: new Date().toISOString(),
      notices: [`synced:${synced}`, `cached:${cached}`, `failed:${failed}`],
    },
  };
}
