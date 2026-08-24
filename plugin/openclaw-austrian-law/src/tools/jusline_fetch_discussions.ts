import { tryReadCachedJuslineArtifact } from "../cache/cache-read-reuse.js";
import { writeJuslineQueryIndex, readJuslineQueryIndex } from "../cache/jusline-query-index.js";
import { writeThroughCacheForJuslineArtifact } from "../cache/cache-write-through.js";
import { buildJuslineArtifactPreviews, deriveContextFromQuery } from "../jusline/artifact-previews.js";
import { buildJuslineDiscussionsUrl } from "../jusline/url-builder.js";
import {
  looksLikeJuslineNoDiscussions,
  parseJuslineDiscussionsHtml,
} from "../jusline/discussions-parser.js";
import { buildCacheHitMeta, buildCacheWarnings, buildRefreshMeta } from "./ris-fetch-common.js";
import type {
  JuslineFetchDiscussionsInput,
  JuslineFetchDiscussionsOutput,
} from "../types/tool-contracts.js";

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return 10;
  if (!Number.isFinite(limit) || limit < 1) return 1;
  return Math.min(Math.floor(limit), 30);
}

export async function juslineFetchDiscussionsStub(
  input: JuslineFetchDiscussionsInput,
): Promise<JuslineFetchDiscussionsOutput> {
  if (typeof input.query !== "string" || input.query.trim().length < 3) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "query must be a JUSLINE URL or path with at least 3 characters",
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  let url: string;
  try {
    url = buildJuslineDiscussionsUrl(input.query);
  } catch (error) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid jusline_fetch_discussions input",
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  if (/\/entscheidungen\//i.test(url)) {
    return {
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "Decision pages are outside current jusline_fetch_discussions MVP scope",
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { accept: "text/html,application/xhtml+xml" },
    });
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE request failed: ${error instanceof Error ? error.message : "Unknown fetch error"}`,
        retryable: true,
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  if (response.status === 404) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "JUSLINE page not found" },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE request returned HTTP ${response.status}`,
        details: { status: response.status, source_url: url },
        retryable: response.status >= 500,
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  let html: string;
  try {
    html = await response.text();
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE response body could not be read: ${error instanceof Error ? error.message : "Unknown body read error"}`,
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }

  try {
    const hits = parseJuslineDiscussionsHtml(html, normalizeLimit(input.limit));

    if (hits.length === 0 && looksLikeJuslineNoDiscussions(html)) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "No JUSLINE discussions/comments found for this page" },
        meta: { tool: "jusline_fetch_discussions", source: "jusline" },
      };
    }

    if (hits.length === 0) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "No JUSLINE discussion/comment entries detected" },
        meta: { tool: "jusline_fetch_discussions", source: "jusline" },
      };
    }

    const refresh = input.refresh === true;
    const effectiveLimit = normalizeLimit(input.limit);
    let cacheCoverage: "full" | "partial" | "miss" = "miss";
    const queryIndex = refresh ? null : await readJuslineQueryIndex({ query: input.query, kind: "discussions", limit: effectiveLimit });
    if (queryIndex && queryIndex.stable_ids.length > 0) {
      let cachedCount = 0;
      for (const stableId of queryIndex.stable_ids) {
        const cached = await tryReadCachedJuslineArtifact({ stableId, docType: "commentary" });
        if (cached.hit && cached.artifact) cachedCount += 1;
      }
      if (cachedCount === queryIndex.stable_ids.length) {
        return {
          success: true,
          data: { hits },
          meta: {
            ...buildCacheHitMeta("jusline_fetch_discussions", "jusline"),
            notices: ["cache_hit: reused cached artifact", "full_cache_hit"],
          },
        };
      }
      cacheCoverage = cachedCount > 0 ? "partial" : "miss";
    }

    const previewResult = await buildJuslineArtifactPreviews({
      hits,
      kind: "discussions",
      input,
      context: deriveContextFromQuery(input.query),
    });

    const cacheRead = { hit: false, artifact: undefined, warning: undefined };

    const cacheWrites = await Promise.all(
      previewResult.previews.map(async (preview) => {
        const metadataParsed = JSON.parse(preview.metadata_content) as {
          stable_id: string;
          frontmatter: Record<string, unknown>;
          metadata?: Record<string, unknown>;
        };
        return await writeThroughCacheForJuslineArtifact({
          stable_id: preview.stable_id,
          frontmatter: metadataParsed.frontmatter as any,
          content: preview.markdown_content.replace(/^---\n[\s\S]*?\n---\n\n/, ""),
          metadata: metadataParsed.metadata,
        });
      }),
    );

    const warnings = buildCacheWarnings({
      cacheRead,
      cacheWrite: cacheWrites.find((entry) => !entry.cached) ?? { cached: true },
    });

    await writeJuslineQueryIndex({
      query: input.query,
      kind: "discussions",
      limit: effectiveLimit,
      stable_ids: previewResult.previews.map((preview) => preview.stable_id),
      stored_at: new Date().toISOString(),
    });

    return {
      success: true,
      data: { hits },
      meta: {
        ...(refresh ? buildRefreshMeta("jusline_fetch_discussions", "jusline") : {
          tool: "jusline_fetch_discussions",
          source: "jusline" as const,
          timestamp: new Date().toISOString(),
          notices: [cacheCoverage === "partial" ? "partial_cache_hit" : "cache_miss"],
        }),
        warnings: [
          ...warnings,
          `preview_cache_written:${cacheWrites.filter((entry) => entry.cached).length}`,
          `preview_cache_skipped:${previewResult.skipped.length}`,
          `query_index_written:${previewResult.previews.length}`,
        ],
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE response could not be parsed: ${error instanceof Error ? error.message : "Unknown parse error"}`,
      },
      meta: { tool: "jusline_fetch_discussions", source: "jusline" },
    };
  }
}
