import { buildRisApiUrl, extractRisApiHitsMeta, fetchRisApiJson, hasMoreRisApiPages, RisApiError } from "./client.js";
import { mapApiDocumentReferences } from "./mappers.js";
import type { RisApiSearchCandidate, RisApiSearchRequest, RisApiSearchResult } from "./types.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dedupeCandidates(candidates: RisApiSearchCandidate[]): RisApiSearchCandidate[] {
  const seen = new Set<string>();
  const result: RisApiSearchCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.hit.source_id ?? candidate.hit.source_url;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

const MAX_API_PAGES = 3;

export async function searchBundesrechtApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  const notices: string[] = ["api_search: Bundesrecht"];
  const warnings: string[] = [];
  let lastError: RisApiError | undefined;
  const aggregateHits: RisApiSearchCandidate[] = [];

  for (let page = 1; page <= MAX_API_PAGES; page += 1) {
    const url = buildRisApiUrl("/Bundesrecht", {
      Applikation: "BrKons",
      Titel: request.lawTitle,
      Suchworte: request.keywords,
      Seitennummer: String(page),
    });

    try {
      const payload = await fetchRisApiJson(url);
      const refs = asArray(payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference);
      const mapped = mapApiDocumentReferences(refs, request);
      aggregateHits.push(...mapped.hits);
      warnings.push(...mapped.warnings);

      const meta = extractRisApiHitsMeta(payload);
      if (page > 1) notices.push(`api_pagination_used: Bundesrecht page ${page}`);
      if (!hasMoreRisApiPages(meta) || dedupeCandidates(aggregateHits).length >= request.limit) {
        break;
      }
    } catch (error) {
      if (error instanceof RisApiError) {
        lastError = error;
        warnings.push(`api_error_type: ${error.code}`);
        break;
      }
      warnings.push("api_error_type: UNKNOWN_ERROR");
      break;
    }
  }

  const dedupedHits = dedupeCandidates(aggregateHits);
  if (dedupedHits.length > 0) {
    return {
      ok: true,
      hits: dedupedHits.slice(0, request.limit),
      notices,
      warnings,
    };
  }

  if (lastError) {
    return {
      ok: false,
      errorCode: "UPSTREAM_UNAVAILABLE",
      message: lastError.message,
      retryable: typeof lastError.status === "number" ? lastError.status >= 500 : true,
      notices,
      warnings,
      details: { ...(lastError.details ?? {}), api_error_type: lastError.code },
    };
  }

  return {
    ok: false,
    errorCode: "NOT_FOUND",
    message: "RIS API returned no usable Bundesrecht hits",
    notices,
    warnings,
    details: { query: request.query, normalizedQuery: request.normalizedQuery },
  };
}
