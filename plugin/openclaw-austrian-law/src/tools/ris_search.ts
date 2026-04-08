import { resolveRisQuery } from "../ris/query-resolver.js";
import { rankRisSearchHits } from "../ris/search-ranking.js";
import { buildRisSearchUrl } from "../ris/url-builder.js";
import { parseRisDirectDocumentHit, parseRisSearchHtml } from "../ris/search-parser.js";
import type { SearchHit, RisSearchInput, RisSearchOutput } from "../types/tool-contracts.js";

const SEARCH_HEADERS = {
  accept: "text/html,application/xhtml+xml",
  "user-agent": "Mozilla/5.0 (compatible; austrian-law-kit/0.1)",
};

const MAX_RETRIES = 2;

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return 10;
  if (!Number.isFinite(limit) || limit < 1) return 1;
  return Math.min(Math.floor(limit), 50);
}

function validateInput(input: RisSearchInput): string | null {
  if (typeof input.query !== "string" || input.query.trim().length < 2) {
    return "query must be a non-empty string with at least 2 characters";
  }

  return null;
}

async function fetchRisSearch(url: string): Promise<Response> {
  return fetch(url, {
    method: "GET",
    headers: SEARCH_HEADERS,
  });
}

async function fetchWithRetry(url: string): Promise<{ response?: Response; error?: unknown; attempts: number }> {
  let attempts = 0;
  let lastError: unknown;

  while (attempts <= MAX_RETRIES) {
    attempts += 1;
    try {
      const response = await fetchRisSearch(url);
      if (response.status >= 500 && attempts <= MAX_RETRIES) {
        continue;
      }
      return { response, attempts };
    } catch (error) {
      lastError = error;
      if (attempts > MAX_RETRIES) break;
    }
  }

  return { error: lastError, attempts };
}

export async function risSearchStub(input: RisSearchInput): Promise<RisSearchOutput> {
  const validationMessage = validateInput(input);
  if (validationMessage) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: validationMessage },
      meta: { tool: "ris_search", source: "ris" },
    };
  }

  if (input.docType && input.docType !== "norm") {
    return {
      ok: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: `docType=${input.docType} is outside current ris_search MVP scope (supported: norm)`,
      },
      meta: { tool: "ris_search", source: "ris" },
    };
  }

  const query = input.query.trim();
  const limit = normalizeLimit(input.limit);
  const resolved = resolveRisQuery(query);

  if (resolved.kind === "sourceId") {
    const sourceId = resolved.sourceId;
    const hit: SearchHit = {
      stable_id: `ris:doc:${sourceId.toLowerCase()}`,
      source_id: sourceId,
      title: sourceId,
      source_url: `https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=${sourceId}`,
      match_reason: "direct sourceId detected in query",
      confidence: "high",
    };

    return {
      ok: true,
      data: {
        hits: [hit],
        best_candidate: hit,
        normalized_query: resolved.normalizedQuery,
        resolver_kind: resolved.kind,
      },
      meta: { tool: "ris_search", source: "ris", timestamp: new Date().toISOString(), notices: ["resolver_shortcut: sourceId detected, RIS HTML search skipped"] },
    };
  }

  const searchQueries = resolved.kind === "normRef"
    ? resolved.searchVariants
    : [resolved.normalizedQuery];

  const notices: string[] = [];
  const warnings: string[] = [];

  if (resolved.kind === "normRef") {
    notices.push(`resolver_variants: ${searchQueries.join(" | ")}`);
  }

  let lastUpstreamError: { status?: number; url?: string; attempts?: number; message?: string } | undefined;

  for (const searchQuery of searchQueries) {
    const url = resolved.kind === "normRef"
      ? buildRisSearchUrl({
          query: searchQuery,
          limit,
          lawTitle: resolved.lawAbbreviation,
          paragraphFrom: resolved.sectionRef.replace(/^§\s*/i, "").replace(/^Art\s*/i, ""),
          paragraphTo: resolved.sectionRef.replace(/^§\s*/i, "").replace(/^Art\s*/i, ""),
          keywords: searchQuery,
        })
      : buildRisSearchUrl({ query: searchQuery, limit });
    const fetchResult = await fetchWithRetry(url);

    if (fetchResult.error) {
      const message = fetchResult.error instanceof Error ? fetchResult.error.message : "Unknown fetch error";
      lastUpstreamError = { url, attempts: fetchResult.attempts, message };
      warnings.push(`search_variant_failed: ${searchQuery}`);
      continue;
    }

    const response = fetchResult.response;
    if (!response) continue;

    if (!response.ok) {
      lastUpstreamError = { status: response.status, url, attempts: fetchResult.attempts };
      if (response.status >= 500) {
        warnings.push(`search_variant_upstream_5xx: ${searchQuery}`);
        continue;
      }
      return {
        ok: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: `RIS search returned HTTP ${response.status}`,
          details: { status: response.status, url, attempts: fetchResult.attempts },
          retryable: response.status >= 500,
        },
        meta: { tool: "ris_search", source: "ris", warnings },
      };
    }

    try {
      const html = await response.text();
      const hits = parseRisSearchHtml(html, limit);
      if (hits.length === 0) {
        const directHit = parseRisDirectDocumentHit(html, url);
        if (directHit) {
          return {
            ok: true,
            data: {
              hits: [directHit],
              best_candidate: directHit,
              normalized_query: resolved.normalizedQuery,
              resolver_kind: resolved.kind,
            },
            meta: {
              tool: "ris_search",
              source: "ris",
              timestamp: new Date().toISOString(),
              notices: [...notices, `resolver_direct_document: ${searchQuery}`],
              warnings,
            },
          };
        }

        warnings.push(`search_variant_no_results: ${searchQuery}`);
        continue;
      }

      const rankedHits = rankRisSearchHits(hits, resolved);

      return {
        ok: true,
        data: {
          hits: rankedHits,
          best_candidate: rankedHits[0],
          normalized_query: resolved.normalizedQuery,
          resolver_kind: resolved.kind,
        },
        meta: {
          tool: "ris_search",
          source: "ris",
          timestamp: new Date().toISOString(),
          notices,
          warnings,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error";
      return {
        ok: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: `RIS search response could not be parsed: ${message}`,
          details: { url, searchQuery },
        },
        meta: { tool: "ris_search", source: "ris", notices, warnings },
      };
    }
  }

  if (lastUpstreamError) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: lastUpstreamError.status
          ? `RIS search returned HTTP ${lastUpstreamError.status}`
          : `RIS search request failed: ${lastUpstreamError.message ?? "Unknown fetch error"}`,
        details: lastUpstreamError,
        retryable: typeof lastUpstreamError.status === "number" ? lastUpstreamError.status >= 500 : true,
      },
      meta: { tool: "ris_search", source: "ris", notices, warnings },
    };
  }

  return {
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "RIS search returned no usable hits for any tried search variant",
      details: { searchQueries },
    },
    meta: { tool: "ris_search", source: "ris", notices, warnings },
  };
}
