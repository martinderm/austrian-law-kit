import { risFetchWholeLawStub } from "./ris_fetch_whole_law.js";
import { risFetchSegmentStub } from "./ris_fetch_segment.js";
import { risSearchStub } from "./ris_search.js";
import { resolveRisQuery } from "../ris/query-resolver.js";
import { extractSourceIdFromRisUrl } from "../ris/segment-url.js";
import { extractSourceIdFromWholeLawUrl } from "../ris/whole-law-url.js";
import { validateStichtag } from "../ris/verification-receipt.js";
import type {
  CachedArtifact,
  RisSyncLawsInput,
  RisSyncLawsItem,
  RisSyncLawsOutput,
  SyncedLawResult,
  VerificationReceipt,
  VerificationStatus,
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
  let verifiedCurrent = 0;
  let historicalValid = 0;
  let stichtagMismatch = 0;
  let insufficientMetadata = 0;

  for (const item of input.laws) {
    const effectiveStichtag = item.stichtag || input.stichtag;
    try {
      if (isSegmentItem(item)) {
        let segmentSourceId = item.sourceId;
        let contentUrl = item.segmentUrl;

        if (!segmentSourceId && contentUrl) {
          segmentSourceId = extractSourceIdFromRisUrl(contentUrl) ?? undefined;
        }

        // If query is present and no direct ID/URL, search and loop over candidates
        if (!segmentSourceId && !contentUrl && item.query?.trim()) {
          const resolved = resolveRisQuery(item.query.trim());
          if (resolved.kind === "sourceId") {
            segmentSourceId = resolved.sourceId;
          } else {
            const searchResult = await risSearchStub({
              query: item.query.trim(),
              scope: item.scope,
              state: item.state,
              limit: 10,
              stichtag: effectiveStichtag,
            });

            if (!searchResult.success || !searchResult.data.hits || searchResult.data.hits.length === 0) {
              failed++;
              results.push({
                query: item.query,
                paragraph: item.paragraph,
                ok: false,
                cached: false,
                error: searchResult.error?.message || `No RIS search candidates found for query '${item.query}'`,
              });
              continue;
            }

            const discardedCandidates: Array<{
              source_id?: string;
              title?: string;
              reason: string;
              verification_status?: VerificationStatus;
            }> = [];

            let matchedResult: {
              artifact: CachedArtifact;
              receipt?: VerificationReceipt;
              isCacheHit: boolean;
              sourceId: string;
              contentUrl?: string;
            } | undefined;

            for (const cand of searchResult.data.hits) {
              const fetchCand = await risFetchSegmentStub({
                sourceId: cand.source_id,
                contentUrl: cand.xml_content_url ?? cand.content_url,
                refresh: item.refresh,
                stichtag: effectiveStichtag,
              });

              if (fetchCand.success && fetchCand.data?.artifact) {
                const receipt = fetchCand.data.receipt;
                const status = receipt?.verification_status;

                if (status === "verified_current" || status === "historical_valid_for_stichtag") {
                  const isCacheHit = fetchCand.meta?.notices?.some((n) => n.includes("cache_hit")) ?? false;
                  matchedResult = {
                    artifact: fetchCand.data.artifact,
                    receipt,
                    isCacheHit,
                    sourceId: cand.source_id ?? fetchCand.data.artifact.frontmatter.source_id ?? "",
                    contentUrl: cand.xml_content_url ?? cand.content_url,
                  };
                  break;
                } else {
                  discardedCandidates.push({
                    source_id: cand.source_id,
                    title: cand.title,
                    reason: receipt?.warning || `Candidate ${cand.source_id} not valid on stichtag ${effectiveStichtag}`,
                    verification_status: status,
                  });
                }
              } else {
                discardedCandidates.push({
                  source_id: cand.source_id,
                  title: cand.title,
                  reason: fetchCand.error?.message || "Failed to fetch candidate segment",
                  verification_status: undefined,
                });
              }
            }

            if (matchedResult) {
              const { artifact, receipt, isCacheHit, sourceId } = matchedResult;
              if (receipt?.verification_status === "verified_current") {
                verifiedCurrent++;
              } else {
                historicalValid++;
              }

              if (isCacheHit) {
                cached++;
              } else {
                synced++;
              }

              const dedupeKey = buildSyncDedupeKey({
                representation: "segment",
                sourceId,
                paragraph: item.paragraph,
                stichtag: effectiveStichtag,
                query: item.query,
              });

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
                receipt,
                discarded_candidates: discardedCandidates.length > 0 ? discardedCandidates : undefined,
              };

              seenEntries.set(dedupeKey, resItem);
              results.push(resItem);
              continue;
            } else {
              // No valid candidate on stichtag
              stichtagMismatch++;
              failed++;
              results.push({
                query: item.query,
                paragraph: item.paragraph,
                ok: false,
                cached: false,
                error: `stichtag_mismatch: no in-force norm version found for query '${item.query}' on stichtag ${effectiveStichtag} (${discardedCandidates.length} candidate(s) evaluated and discarded)`,
                discarded_candidates: discardedCandidates,
              });
              continue;
            }
          }
        }

        // Direct sourceId or URL resolution
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
          if (prior.receipt?.verification_status === "verified_current") {
            verifiedCurrent++;
          } else if (prior.receipt?.verification_status === "historical_valid_for_stichtag") {
            historicalValid++;
          } else if (prior.receipt?.verification_status === "stichtag_mismatch") {
            stichtagMismatch++;
          } else {
            insufficientMetadata++;
          }
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
          const receipt = fetchResult.data.receipt;
          const status = receipt?.verification_status;
          const isCacheHit = fetchResult.meta?.notices?.some((n) => n.includes("cache_hit")) ?? false;

          if (status === "verified_current") {
            verifiedCurrent++;
            if (isCacheHit) cached++; else synced++;
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
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          } else if (status === "historical_valid_for_stichtag") {
            historicalValid++;
            if (isCacheHit) cached++; else synced++;
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
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          } else if (status === "stichtag_mismatch") {
            stichtagMismatch++;
            failed++;
            const resItem: SyncedLawResult = {
              query: item.query,
              paragraph: item.paragraph || artifact.frontmatter.segment_ref,
              stable_id: artifact.stable_id,
              source_id: artifact.frontmatter.source_id,
              title: artifact.frontmatter.title || artifact.frontmatter.law_title,
              law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
              source_url: artifact.frontmatter.source_url,
              cached: isCacheHit,
              ok: false,
              error: receipt?.warning || `stichtag_mismatch: norm version ${artifact.frontmatter.source_id} not valid on stichtag ${effectiveStichtag}`,
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          } else {
            insufficientMetadata++;
            if (isCacheHit) cached++; else synced++;
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
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          }
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
          if (prior.receipt?.verification_status === "verified_current") {
            verifiedCurrent++;
          } else if (prior.receipt?.verification_status === "historical_valid_for_stichtag") {
            historicalValid++;
          } else if (prior.receipt?.verification_status === "stichtag_mismatch") {
            stichtagMismatch++;
          } else {
            insufficientMetadata++;
          }
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
          const receipt = fetchResult.data.receipt;
          const status = receipt?.verification_status;
          const isCacheHit = fetchResult.meta?.notices?.some((n) => n.includes("cache_hit")) ?? false;

          if (status === "verified_current") {
            verifiedCurrent++;
            if (isCacheHit) cached++; else synced++;
            const resItem: SyncedLawResult = {
              query: item.query,
              stable_id: artifact.stable_id,
              source_id: artifact.frontmatter.source_id,
              title: artifact.frontmatter.title || artifact.frontmatter.law_title,
              law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
              source_url: artifact.frontmatter.source_url,
              cached: isCacheHit,
              ok: true,
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          } else if (status === "historical_valid_for_stichtag") {
            historicalValid++;
            if (isCacheHit) cached++; else synced++;
            const resItem: SyncedLawResult = {
              query: item.query,
              stable_id: artifact.stable_id,
              source_id: artifact.frontmatter.source_id,
              title: artifact.frontmatter.title || artifact.frontmatter.law_title,
              law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
              source_url: artifact.frontmatter.source_url,
              cached: isCacheHit,
              ok: true,
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          } else if (status === "stichtag_mismatch") {
            stichtagMismatch++;
            failed++;
            const resItem: SyncedLawResult = {
              query: item.query,
              stable_id: artifact.stable_id,
              source_id: artifact.frontmatter.source_id,
              title: artifact.frontmatter.title || artifact.frontmatter.law_title,
              law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
              source_url: artifact.frontmatter.source_url,
              cached: isCacheHit,
              ok: false,
              error: receipt?.warning || `stichtag_mismatch: whole law ${artifact.frontmatter.source_id} not valid on stichtag ${effectiveStichtag}`,
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          } else {
            insufficientMetadata++;
            if (isCacheHit) cached++; else synced++;
            const resItem: SyncedLawResult = {
              query: item.query,
              stable_id: artifact.stable_id,
              source_id: artifact.frontmatter.source_id,
              title: artifact.frontmatter.title || artifact.frontmatter.law_title,
              law_id: (artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
              source_url: artifact.frontmatter.source_url,
              cached: isCacheHit,
              ok: true,
              receipt,
            };
            seenEntries.set(dedupeKey, resItem);
            results.push(resItem);
          }
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
    const stichtagOnlyFailure = stichtagMismatch === failed;
    return {
      success: false,
      error: {
        code: stichtagOnlyFailure ? "NO_VALID_VERSION_FOR_STICHTAG" : "UPSTREAM_UNAVAILABLE",
        message: stichtagOnlyFailure
          ? `No requested law has a valid version for the requested stichtag`
          : `Failed to sync all ${input.laws.length} requested laws`,
        retryable: !stichtagOnlyFailure,
        details: {
          total: input.laws.length,
          failed,
          verified_current: verifiedCurrent,
          historical_valid_for_stichtag: historicalValid,
          stichtag_mismatch: stichtagMismatch,
          insufficient_metadata: insufficientMetadata,
          laws: results,
        },
      },
      meta: {
        tool: "ris_sync_laws",
        source: "ris",
        timestamp: new Date().toISOString(),
        notices: [
          `synced:${synced}`,
          `cached:${cached}`,
          `failed:${failed}`,
          `deduplicated:${deduplicated}`,
          `verified_current:${verifiedCurrent}`,
          `historical_valid_for_stichtag:${historicalValid}`,
          `stichtag_mismatch:${stichtagMismatch}`,
          `insufficient_metadata:${insufficientMetadata}`,
        ],
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
      verified_current: verifiedCurrent,
      historical_valid_for_stichtag: historicalValid,
      stichtag_mismatch: stichtagMismatch,
      insufficient_metadata: insufficientMetadata,
      laws: results,
    },
    meta: {
      tool: "ris_sync_laws",
      source: "ris",
      timestamp: new Date().toISOString(),
      notices: [
        `synced:${synced}`,
        `cached:${cached}`,
        `failed:${failed}`,
        `deduplicated:${deduplicated}`,
        `verified_current:${verifiedCurrent}`,
        `historical_valid_for_stichtag:${historicalValid}`,
        `stichtag_mismatch:${stichtagMismatch}`,
        `insufficient_metadata:${insufficientMetadata}`,
      ],
    },
  };
}
