import { searchRisApi } from "../ris-api/index.js";
import { AUSTRIAN_STATES, normalizeAustrianState } from "../ris/collections.js";
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

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function extractRequestedSectionNumber(resolved: ReturnType<typeof resolveRisQuery>): string | undefined {
  if (resolved.kind !== "normRef") return undefined;
  return resolved.sectionRef.replace(/^§\s*/i, "").replace(/^Art\s*/i, "").trim() || undefined;
}

function filterExactSectionHits(hits: SearchHit[], resolved: ReturnType<typeof resolveRisQuery>): SearchHit[] {
  const requestedSection = extractRequestedSectionNumber(resolved);
  if (!requestedSection) return hits;
  const exact = hits.filter((hit) => (hit.paragraph_number ?? "").trim().toLowerCase() === requestedSection.toLowerCase());
  return exact.length > 0 ? exact : [];
}

function validateInput(input: RisSearchInput): string | null {
  if (typeof input.query !== "string" || input.query.trim().length < 2) {
    return "query must be a non-empty string with at least 2 characters";
  }

  if (input.scope === "land") {
    const normalizedState = normalizeAustrianState(input.state);
    if (!normalizedState) {
      return `state must be one of: ${AUSTRIAN_STATES.join(", ")}`;
    }
  }

  if (input.scope === "municipal" && input.state) {
    const normalizedState = normalizeAustrianState(input.state);
    if (!normalizedState) {
      return `state must be one of: ${AUSTRIAN_STATES.join(", ")}`;
    }
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

function buildResolverShortcutHit(sourceId: string, scope: "bund" | "land" | "municipal"): SearchHit {
  const abfrage = scope === "land"
    ? "Landesnormen"
    : scope === "municipal"
      ? (sourceId.toUpperCase().startsWith("GEMREA_") ? "GemeinderechtAuth" : "Gemeinderecht")
      : "Bundesnormen";
  return {
    stable_id: `ris:doc:${sourceId.toLowerCase()}`,
    source_id: sourceId,
    title: sourceId,
    source_url: `https://www.ris.bka.gv.at/Dokument.wxe?Abfrage=${abfrage}&Dokumentnummer=${sourceId}`,
    match_reason: "direct sourceId detected in query",
    confidence: "high",
    scope,
    application: scope === "municipal" ? (sourceId.toUpperCase().startsWith("GEMREA_") ? "GrA" : "Gr") : undefined,
  };
}

export async function risSearchStub(input: RisSearchInput): Promise<RisSearchOutput> {
  const validationMessage = validateInput(input);
  if (validationMessage) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: validationMessage },
      meta: { tool: "ris_search", source: "ris" },
    };
  }

  if (input.docType && input.docType !== "norm") {
    return {
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: `docType=${input.docType} is outside current ris_search MVP scope (supported: norm)`,
      },
      meta: { tool: "ris_search", source: "ris" },
    };
  }

  const query = input.query.trim();
  const limit = normalizeLimit(input.limit);
  const scope = input.scope ?? "bund";
  const state = scope === "land" || scope === "municipal" ? normalizeAustrianState(input.state) : undefined;
  const resolved = resolveRisQuery(query);

  if (resolved.kind === "sourceId") {
    const hit = buildResolverShortcutHit(resolved.sourceId, scope);
    return {
      success: true,
      data: {
        hits: [hit],
        best_candidate: hit,
        normalized_query: resolved.normalizedQuery,
        resolver_kind: resolved.kind,
      },
      meta: {
        tool: "ris_search",
        source: "ris",
        timestamp: new Date().toISOString(),
        notices: [
          "resolver_shortcut: sourceId detected, RIS search skipped",
          ...(scope === "land" && state ? [`scope: land/${state}`] : []),
        ],
      },
    };
  }

  const searchQueries = resolved.kind === "normRef" ? resolved.searchVariants : [resolved.normalizedQuery];
  const notices: string[] = [];
  const warnings: string[] = [];

  if (resolved.kind === "normRef") {
    notices.push(`resolver_variants: ${searchQueries.join(" | ")}`);
  }

  let lastApiFailure: { message: string; retryable?: boolean; details?: Record<string, unknown> } | undefined;

  for (const searchQuery of searchQueries) {
    const apiResult = await searchRisApi({
      query,
      normalizedQuery: searchQuery,
      limit,
      scope,
      state,
      lawTitle: resolved.kind === "normRef" ? resolved.lawAbbreviation : searchQuery,
      keywords: resolved.kind === "normRef"
        ? (resolved.headingRemainder ?? searchQuery)
        : searchQuery,
      paragraphNumber: resolved.kind === "normRef" && /^§/i.test(resolved.sectionRef)
        ? resolved.sectionRef.replace(/^§\s*/i, "")
        : undefined,
      articleNumber: resolved.kind === "normRef" && /^Art/i.test(resolved.sectionRef)
        ? resolved.sectionRef.replace(/^Art\s*/i, "")
        : undefined,
      headingRemainder: resolved.kind === "normRef" ? resolved.headingRemainder : undefined,
      municipality: input.municipality?.trim() || undefined,
      district: input.district?.trim() || undefined,
      authentic: input.authentic,
    });

    notices.push(...(apiResult.notices ?? []));
    warnings.push(...(apiResult.warnings ?? []));

    if (apiResult.success) {
      const apiHits = apiResult.hits.map((entry) => entry.hit);
      const exactSectionHits = resolved.kind === "normRef" ? filterExactSectionHits(apiHits, resolved) : apiHits;
      if (resolved.kind !== "normRef" || exactSectionHits.length > 0) {
        const rankedHits = rankRisSearchHits(exactSectionHits, resolved).slice(0, limit);
        return {
          success: true,
          data: {
            hits: rankedHits,
            best_candidate: rankedHits[0],
            normalized_query: resolved.normalizedQuery,
            resolver_kind: resolved.kind,
            stichtag: input.stichtag,
          },
          meta: {
            tool: "ris_search",
            source: "ris",
            timestamp: new Date().toISOString(),
            notices: dedupeStrings(notices),
            warnings: dedupeStrings(warnings),
          },
        };
      }
      warnings.push(`api_variant_exact_section_missing: ${searchQuery}`);
    }

    if (!apiResult.success && apiResult.errorCode === "UPSTREAM_UNAVAILABLE") {
      lastApiFailure = {
        message: apiResult.message,
        retryable: apiResult.retryable,
        details: apiResult.details,
      };
      warnings.push(`api_variant_failed: ${searchQuery}`);
      continue;
    }

    warnings.push(`api_variant_no_results: ${searchQuery}`);
  }

  if (scope === "municipal") {
    if (lastApiFailure) {
      return {
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: lastApiFailure.message,
          details: lastApiFailure.details,
          retryable: lastApiFailure.retryable,
        },
        meta: { tool: "ris_search", source: "ris", notices: dedupeStrings(notices), warnings: dedupeStrings(warnings) },
      };
    }

    return {
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "RIS municipal API returned no usable hits for any tried search variant",
        details: { searchQueries, municipality: input.municipality, district: input.district, authentic: input.authentic },
      },
      meta: { tool: "ris_search", source: "ris", notices: dedupeStrings(notices), warnings: dedupeStrings(warnings) },
    };
  }

  let lastUpstreamError: { status?: number; url?: string; attempts?: number; message?: string } | undefined;

  for (const searchQuery of searchQueries) {
    const url = resolved.kind === "normRef"
      ? buildRisSearchUrl({
          query: searchQuery,
          limit,
          scope,
          state,
          lawTitle: resolved.lawAbbreviation,
          paragraphFrom: resolved.sectionRef.replace(/^§\s*/i, "").replace(/^Art\s*/i, ""),
          paragraphTo: resolved.sectionRef.replace(/^§\s*/i, "").replace(/^Art\s*/i, ""),
          keywords: resolved.headingRemainder ?? undefined,
        })
      : buildRisSearchUrl({ query: searchQuery, limit, scope, state });
    const fetchResult = await fetchWithRetry(url);

    if (fetchResult.error) {
      const message = fetchResult.error instanceof Error ? fetchResult.error.message : "Unknown fetch error";
      lastUpstreamError = { url, attempts: fetchResult.attempts, message };
      warnings.push(`html_variant_failed: ${searchQuery}`);
      continue;
    }

    const response = fetchResult.response;
    if (!response) continue;

    if (!response.ok) {
      lastUpstreamError = { status: response.status, url, attempts: fetchResult.attempts };
      if (response.status >= 500) {
        warnings.push(`html_variant_upstream_5xx: ${searchQuery}`);
        continue;
      }
      return {
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: `RIS HTML search returned HTTP ${response.status}`,
          details: { status: response.status, url, attempts: fetchResult.attempts },
          retryable: response.status >= 500,
        },
        meta: { tool: "ris_search", source: "ris", warnings: dedupeStrings(warnings), notices: dedupeStrings(notices) },
      };
    }

    try {
      const html = await response.text();
      const hits = parseRisSearchHtml(html, limit);
      if (hits.length === 0) {
        const directHit = parseRisDirectDocumentHit(html, url);
        if (directHit) {
          return {
            success: true,
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
              notices: dedupeStrings([...notices, `html_fallback_direct_document: ${searchQuery}`]),
              warnings: dedupeStrings(warnings),
            },
          };
        }

        warnings.push(`html_variant_no_results: ${searchQuery}`);
        continue;
      }

      const filteredHtmlHits = resolved.kind === "normRef" ? filterExactSectionHits(hits, resolved) : hits;
      if (resolved.kind === "normRef" && filteredHtmlHits.length === 0) {
        warnings.push(`html_variant_exact_section_missing: ${searchQuery}`);
        continue;
      }

      const rankedHits = rankRisSearchHits(filteredHtmlHits, resolved);

      return {
        success: true,
        data: {
          hits: rankedHits,
          best_candidate: rankedHits[0],
          normalized_query: resolved.normalizedQuery,
          resolver_kind: resolved.kind,
          stichtag: input.stichtag,
        },
        meta: {
          tool: "ris_search",
          source: "ris",
          timestamp: new Date().toISOString(),
          notices: dedupeStrings([...notices, "html_fallback_used"]),
          warnings: dedupeStrings(warnings),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error";
      return {
        success: false,
        error: {
          code: "UPSTREAM_UNAVAILABLE",
          message: `RIS HTML search response could not be parsed: ${message}`,
          details: { url, searchQuery },
        },
        meta: { tool: "ris_search", source: "ris", notices: dedupeStrings(notices), warnings: dedupeStrings(warnings) },
      };
    }
  }

  if (lastUpstreamError) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: lastUpstreamError.status
          ? `RIS HTML search returned HTTP ${lastUpstreamError.status}`
          : `RIS HTML search request failed: ${lastUpstreamError.message ?? "Unknown fetch error"}`,
        details: { html: lastUpstreamError, api: lastApiFailure },
        retryable: typeof lastUpstreamError.status === "number" ? lastUpstreamError.status >= 500 : true,
      },
      meta: { tool: "ris_search", source: "ris", notices: dedupeStrings(notices), warnings: dedupeStrings(warnings) },
    };
  }

  if (lastApiFailure) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: lastApiFailure.message,
        details: lastApiFailure.details,
        retryable: lastApiFailure.retryable,
      },
      meta: { tool: "ris_search", source: "ris", notices: dedupeStrings(notices), warnings: dedupeStrings(warnings) },
    };
  }

  return {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "RIS API and HTML fallback returned no usable hits for any tried search variant",
      details: { searchQueries },
    },
    meta: { tool: "ris_search", source: "ris", notices: dedupeStrings(notices), warnings: dedupeStrings(warnings) },
  };
}
