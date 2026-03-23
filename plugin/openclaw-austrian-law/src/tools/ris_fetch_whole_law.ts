import { looksLikeRisWholeLawNotFound, parseRisWholeLawHtml } from "../ris/whole-law-parser.js";
import {
  buildRisWholeLawUrl,
  extractSourceIdFromWholeLawUrl,
  normalizeWholeLawStableIdFromSourceId,
} from "../ris/whole-law-url.js";
import type { RisFetchWholeLawInput, RisFetchWholeLawOutput } from "../types/tool-contracts.js";

function resolveSourceId(input: RisFetchWholeLawInput, sourceUrl: string): string | null {
  if (input.sourceId && input.sourceId.trim().length > 0) return input.sourceId.trim();
  return extractSourceIdFromWholeLawUrl(sourceUrl);
}

export async function risFetchWholeLawStub(input: RisFetchWholeLawInput): Promise<RisFetchWholeLawOutput> {
  let sourceUrl: string;
  try {
    sourceUrl = buildRisWholeLawUrl({ sourceId: input.sourceId, sourceUrl: input.sourceUrl });
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid ris_fetch_whole_law input",
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  const sourceId = resolveSourceId(input, sourceUrl);
  if (!sourceId) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Unable to resolve source_id (provide sourceId or sourceUrl with Dokumentnummer)",
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      method: "GET",
      headers: { accept: "text/html,application/xhtml+xml" },
    });
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS whole-law request failed: ${error instanceof Error ? error.message : "Unknown fetch error"}`,
        retryable: true,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  if (response.status === 404) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "RIS whole-law document not found" },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS whole-law request returned HTTP ${response.status}`,
        details: { status: response.status, source_url: sourceUrl },
        retryable: response.status >= 500,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
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
        message: `RIS whole-law response body could not be read: ${error instanceof Error ? error.message : "Unknown body read error"}`,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  if (looksLikeRisWholeLawNotFound(html)) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "RIS did not return a matching whole-law document" },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  try {
    const parsed = parseRisWholeLawHtml(html);
    const stableId = normalizeWholeLawStableIdFromSourceId(sourceId);

    return {
      ok: true,
      data: {
        artifact: {
          stable_id: stableId,
          frontmatter: {
            stable_id: stableId,
            source: "ris",
            source_url: sourceUrl,
            doc_type: "norm_document",
            title: parsed.title,
            fetched_at: new Date().toISOString(),
            version_label: "unknown",
            fassung_typ: "Arbeitsfassung",
            source_id: sourceId,
          },
          content: parsed.content,
        },
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris", timestamp: new Date().toISOString() },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS whole-law response could not be parsed: ${error instanceof Error ? error.message : "Unknown parse error"}`,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }
}
