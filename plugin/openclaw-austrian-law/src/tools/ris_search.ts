import { buildRisSearchUrl } from "../ris/url-builder.js";
import { parseRisSearchHtml } from "../ris/search-parser.js";
import type { RisSearchInput, RisSearchOutput } from "../types/tool-contracts.js";

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
  const url = buildRisSearchUrl({ query, limit });

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { "accept": "text/html,application/xhtml+xml" },
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
      data: { hits },
      meta: { tool: "ris_search", source: "ris", timestamp: new Date().toISOString() },
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
