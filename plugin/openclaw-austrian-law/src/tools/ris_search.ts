import { resolveRisQuery } from "../ris/query-resolver.js";
import { buildRisSearchUrl } from "../ris/url-builder.js";
import { parseRisSearchHtml } from "../ris/search-parser.js";
import type { SearchHit, RisSearchInput, RisSearchOutput } from "../types/tool-contracts.js";

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
    };

    return {
      ok: true,
      data: {
        hits: [hit],
        normalized_query: resolved.normalizedQuery,
        resolver_kind: resolved.kind,
      },
      meta: { tool: "ris_search", source: "ris", timestamp: new Date().toISOString(), notices: ["resolver_shortcut: sourceId detected, RIS HTML search skipped"] },
    };
  }

  const searchQuery = resolved.kind === "normRef" ? resolved.searchVariants[0] ?? resolved.normalizedQuery : resolved.normalizedQuery;
  const url = buildRisSearchUrl({ query: searchQuery, limit });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; austrian-law-kit/0.1)",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown fetch error";
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS search request failed: ${message}`,
        retryable: true,
      },
      meta: { tool: "ris_search", source: "ris" },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS search returned HTTP ${response.status}`,
        details: { status: response.status, url },
        retryable: response.status >= 500,
      },
      meta: { tool: "ris_search", source: "ris" },
    };
  }

  try {
    const html = await response.text();
    const hits = parseRisSearchHtml(html, limit);

    return {
      ok: true,
      data: {
        hits,
        normalized_query: resolved.normalizedQuery,
        resolver_kind: resolved.kind,
      },
      meta: {
        tool: "ris_search",
        source: "ris",
        timestamp: new Date().toISOString(),
        notices: resolved.kind === "normRef" ? [`resolver_variant: using normalized reference query '${searchQuery}'`] : undefined,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parse error";
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS search response could not be parsed: ${message}`,
      },
      meta: { tool: "ris_search", source: "ris" },
    };
  }
}
