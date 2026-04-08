import { buildRisApiUrl, fetchRisApiJson, RisApiError } from "./client.js";
import { mapApiDocumentReferences } from "./mappers.js";
import type { RisApiSearchRequest, RisApiSearchResult } from "./types.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function searchBundesrechtApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  const url = buildRisApiUrl("/Bundesrecht", {
    Applikation: "BrKons",
    Titel: request.lawTitle,
    Suchworte: request.keywords,
    Seitennummer: "1",
  });

  try {
    const payload = await fetchRisApiJson(url);
    const refs = asArray(payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference);
    const mapped = mapApiDocumentReferences(refs, request);

    if (mapped.hits.length === 0) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
        message: "RIS API returned no usable Bundesrecht hits",
        notices: ["api_search: Bundesrecht"],
        warnings: mapped.warnings,
        details: { url },
      };
    }

    return {
      ok: true,
      hits: mapped.hits.slice(0, request.limit),
      notices: ["api_search: Bundesrecht", ...mapped.notices],
      warnings: mapped.warnings,
    };
  } catch (error) {
    if (error instanceof RisApiError) {
      return {
        ok: false,
        errorCode: "UPSTREAM_UNAVAILABLE",
        message: error.message,
        retryable: typeof error.status === "number" ? error.status >= 500 : true,
        notices: ["api_search: Bundesrecht"],
        details: error.details,
      };
    }

    return {
      ok: false,
      errorCode: "UPSTREAM_UNAVAILABLE",
      message: error instanceof Error ? error.message : "Unknown RIS API error",
      retryable: true,
      notices: ["api_search: Bundesrecht"],
      details: { url },
    };
  }
}
