import { risFetchWholeLawStub } from "./ris_fetch_whole_law.js";
import { risFetchSegmentStub } from "./ris_fetch_segment.js";
import { risSearchStub } from "./ris_search.js";
import { resolveRisQuery } from "../ris/query-resolver.js";
import { extractSourceIdFromRisUrl } from "../ris/segment-url.js";
import { extractSourceIdFromWholeLawUrl } from "../ris/whole-law-url.js";
import { validateStichtag } from "../ris/verification-receipt.js";
import type {
  RisSyncLawsInput,
  RisSyncLawsItem,
  RisSyncLawsOutput,
  SyncedLawResult,
} from "../types/tool-contracts.js";

function isSegmentItem(item: RisSyncLawsItem): boolean {
  if (item.paragraph && item.paragraph.trim().length > 0) return true;
  if (item.sectionRef && item.sectionRef.trim().length > 0) return true;
  if (item.segmentUrl && item.segmentUrl.trim().length > 0) return true;
  if (item.sourceId && /^(NOR|LOO|GEMRE)/i.test(item.sourceId.trim())) return true;
  if (item.query && item.query.trim().length > 0) {
    const resolved = resolveRisQuery(item.query.trim());
    if (resolved.kind === "normRef") return true;
    if (resolved.kind === "sourceId" && /^(NOR|LOO|GEMRE)/i.test(resolved.sourceId)) return true;
  }
  return false;
}

function buildSyncDedupeKey(params: {
  representation: "segment" | "whole_law";
  sourceId?: string;
  paragraph?: string;
  stichtag?: string;
  query?: string;
}): string {
  const rep = params.representation;
  const source = (params.sourceId || params.query || "").trim().toLowerCase();
  const para = (params.paragraph || "").trim().toLowerCase();
  const stichtag = (params.stichtag || "current").trim();
  return `${rep}::${source}::${para}::${stichtag}`;
}

export async function risSyncLawsStub(input: RisSyncLawsInput): Promise<RisSyncLawsOutput> {
  if (!input || !Array.isArray(input.laws) || input.laws.length === 0) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid ris_sync_laws input: 'laws' must be a non-empty array",
      },
      meta: { tool: "ris_sync_laws", source: "ris" },
    };
  }

  if (input.stichtag) {
    const rootStichtagCheck = validateStichtag(input.stichtag);
    if (!rootStichtagCheck.valid) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: rootStichtagCheck.error!,
        },
        meta: { tool: "ris_sync_laws", source: "ris" },
      };
    }
  }

  const results: SyncedLawResult[] = [];
  const seenEntries = new Map<string, SyncedLawResult>();
  let synced = 0;
  let cached = 0;
  let failed = 0;
  let deduplicated = 0;

  for (const item of input.laws) {
    const effectiveStichtag = item.stichtag || input.stichtag;
    try {
      if (isSegmentItem(item)) {
        let segmentSourceId = item.sourceId;
        let contentUrl = item.segmentUrl;

        if (!segmentSourceId && contentUrl) {
          segmentSourceId = extractSourceIdFromRisUrl(contentUrl) ?? undefined;
        }

        // If query is present and no direct ID/URL, search or resolve first
        if (!segmentSourceId && !contentUrl && item.query?.trim()) {
          const resolved = resolveRisQuery(item.query.trim());
          if (resolved.kind === "sourceId") {
            segmentSourceId = resolved.sourceId;
          } else {
            const searchResult = await risSearchStub({
              query: item.query.trim(),
              scope: item.scope,
              state: item.state,
              limit: 5,
              stichtag: effectiveStichtag,
            });
            if (searchResult.success && (searchResult.data.best_candidate || searchResult.data.hits[0])) {
              const cand = searchResult.data.best_candidate || searchResult.data.hits[0];
              segmentSourceId = cand.source_id;
              contentUrl = cand.content_url;
            }
          }
        }

        const dedupeKey = buildSyncDedupeKey({
          representation: "segment",
          sourceId: segmentSourceId,
          paragraph: item.paragraph,
          stichtag: effectiveStichtag,
          query: item.query,
        });

        // Deduplication check
        if (seenEntries.has(dedupeKey)) {
          const prior = seenEntries.get(dedupeKey)!;
          deduplicated++;
          cached++;
          results.push({
            ...prior,
            query: item.query || prior.query,
            paragraph: item.paragraph || prior.paragraph,
            cached: true,
          });
          continue;
        }

        const fetchResult = await risFetchSegmentStub({
          sourceId: segmentSourceId,
          contentUrl,
          refresh: item.refresh,
          stichtag: effectiveStichtag,
        });

        if (fetchResult.success && fetchResult.data?.artifact) {
          const artifact = fetchResult.data.artifact;
          const isCacheHit = fetchResult.meta?.notices?.some((n) => n.includes("cache_hit")) ?? false;
          if (isCacheHit) {
            cached++;
          } else {
            synced++;
          }
          const resItem: SyncedLawResult = {
            query: item.query,
            paragraph: item.paragraph || artifact.frontmatter.segment_ref,
            stable_id: artifact.stable_id,
            source_id: artifact.frontmatter.source_id,
            title: artifact.frontmatter.title || artifact.frontmatter.law_title,
            law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
            source_url: artifact.frontmatter.source_url,
            cached: isCacheHit,
            ok: true,
            receipt: fetchResult.data.receipt,
          };
          seenEntries.set(dedupeKey, resItem);
          results.push(resItem);
        } else {
          failed++;
          results.push({
            query: item.query,
            paragraph: item.paragraph,
            ok: false,
            cached: false,
            error: fetchResult.error?.message || "Failed to fetch law segment",
          });
        }
      } else {
        // Whole law fetch
        let wholeSourceId = item.sourceId;
        const wholeUrl = item.wholeLawUrl;
        if (!wholeSourceId && wholeUrl) {
          wholeSourceId = extractSourceIdFromWholeLawUrl(wholeUrl) ?? undefined;
        }

        const dedupeKey = buildSyncDedupeKey({
          representation: "whole_law",
          sourceId: wholeSourceId,
          stichtag: effectiveStichtag,
          query: item.query,
        });

        if (seenEntries.has(dedupeKey)) {
          const prior = seenEntries.get(dedupeKey)!;
          deduplicated++;
          cached++;
          results.push({
            ...prior,
            query: item.query || prior.query,
            cached: true,
          });
          continue;
        }

        const fetchResult = await risFetchWholeLawStub({
          ...item,
          stichtag: effectiveStichtag,
        });

        if (fetchResult.success && fetchResult.data?.artifact) {
          const artifact = fetchResult.data.artifact;
          const isCacheHit = fetchResult.meta?.notices?.some((n) => n.includes("cache_hit")) ?? false;
          if (isCacheHit) {
            cached++;
          } else {
            synced++;
          }
          const resItem: SyncedLawResult = {
            query: item.query,
            stable_id: artifact.stable_id,
            source_id: artifact.frontmatter.source_id,
            title: artifact.frontmatter.title || artifact.frontmatter.law_title,
            law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
            source_url: artifact.frontmatter.source_url,
            cached: isCacheHit,
            ok: true,
            receipt: fetchResult.data.receipt,
          };
          seenEntries.set(dedupeKey, resItem);
          results.push(resItem);
        } else {
          failed++;
          results.push({
            query: item.query,
            ok: false,
            cached: false,
            error: fetchResult.error?.message || "Failed to fetch whole law",
          });
        }
      }
    } catch (error) {
      failed++;
      results.push({
        query: item.query,
        paragraph: item.paragraph,
        ok: false,
        cached: false,
        error: error instanceof Error ? error.message : "Unknown error during sync",
      });
    }
  }

  if (failed === input.laws.length) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `Failed to sync all ${input.laws.length} requested laws`,
        details: { total: input.laws.length, failed, laws: results },
      },
      meta: {
        tool: "ris_sync_laws",
        source: "ris",
        timestamp: new Date().toISOString(),
        notices: [`synced:${synced}`, `cached:${cached}`, `failed:${failed}`, `deduplicated:${deduplicated}`],
      },
    };
  }

  return {
    success: true,
    data: {
      total: input.laws.length,
      synced,
      cached,
      failed,
      deduplicated,
      laws: results,
    },
    meta: {
      tool: "ris_sync_laws",
      source: "ris",
      timestamp: new Date().toISOString(),
      notices: [`synced:${synced}`, `cached:${cached}`, `failed:${failed}`, `deduplicated:${deduplicated}`],
    },
  };
}
