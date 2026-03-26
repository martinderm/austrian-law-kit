import { parseJuslineDecisionsHtml, looksLikeJuslineNoDecisions } from "../jusline/decisions-parser.js";
import { buildJuslineDiscussionsUrl } from "../jusline/url-builder.js";
import type {
  JuslineListDecisionsInput,
  JuslineListDecisionsOutput,
} from "../types/tool-contracts.js";

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return 10;
  if (!Number.isFinite(limit) || limit < 1) return 1;
  return Math.min(Math.floor(limit), 30);
}

export async function juslineListDecisionsStub(
  input: JuslineListDecisionsInput,
): Promise<JuslineListDecisionsOutput> {
  if (typeof input.query !== "string" || input.query.trim().length < 3) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "query must be a JUSLINE URL or path with at least 3 characters",
      },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
    };
  }

  let url: string;
  try {
    url = buildJuslineDiscussionsUrl(input.query);
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid jusline_list_decisions input",
      },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
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
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE request failed: ${error instanceof Error ? error.message : "Unknown fetch error"}`,
        retryable: true,
      },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
    };
  }

  if (response.status === 404) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "JUSLINE page not found" },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE request returned HTTP ${response.status}`,
        details: { status: response.status, source_url: url },
        retryable: response.status >= 500,
      },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
    };
  }

  let html: string;
  try {
    html = await response.text();
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE response body could not be read: ${error instanceof Error ? error.message : "Unknown body read error"}`,
      },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
    };
  }

  try {
    const hits = parseJuslineDecisionsHtml(html, normalizeLimit(input.limit));

    if (hits.length === 0 && looksLikeJuslineNoDecisions(html)) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "No JUSLINE decisions found for this page" },
        meta: { tool: "jusline_list_decisions", source: "jusline" },
      };
    }

    if (hits.length === 0) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "No JUSLINE decision entries detected" },
        meta: { tool: "jusline_list_decisions", source: "jusline" },
      };
    }

    return {
      ok: true,
      data: { hits },
      meta: { tool: "jusline_list_decisions", source: "jusline", timestamp: new Date().toISOString() },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `JUSLINE response could not be parsed: ${error instanceof Error ? error.message : "Unknown parse error"}`,
      },
      meta: { tool: "jusline_list_decisions", source: "jusline" },
    };
  }
}
