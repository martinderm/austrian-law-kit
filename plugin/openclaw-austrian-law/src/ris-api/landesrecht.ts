import { buildRisApiUrl, extractRisApiHitsMeta, fetchRisApiJson, hasMoreRisApiPages, RisApiError } from "./client.js";
import { mapApiDocumentReferences } from "./mappers.js";
import { extractSectionNumber } from "../ris/section-ref.js";
import type { RisApiSearchCandidate, RisApiSearchRequest, RisApiSearchResult } from "./types.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const STATE_FLAG_BY_NAME: Record<string, string> = {
  Burgenland: "SucheInBurgenland",
  "Kärnten": "SucheInKaernten",
  "Niederösterreich": "SucheInNiederoesterreich",
  "Oberösterreich": "SucheInOberoesterreich",
  Salzburg: "SucheInSalzburg",
  Steiermark: "SucheInSteiermark",
  Tirol: "SucheInTirol",
  Vorarlberg: "SucheInVorarlberg",
  Wien: "SucheInWien",
};

const STATE_TITLE_PREFIXES: Record<string, string[]> = {
  Burgenland: ["Burgenländisches", "Burgenländische", "Bgld."],
  "Kärnten": ["Kärntner"],
  "Niederösterreich": ["NÖ"],
  "Oberösterreich": ["Oö."],
  Salzburg: ["Salzburger"],
  Steiermark: ["Steiermärkisches", "Steiermärkische"],
  Tirol: ["Tiroler"],
  Vorarlberg: ["Vorarlberger"],
  Wien: ["Wiener"],
};

const STATE_TITLE_SUFFIXES: Record<string, string[]> = {
  Wien: ["für Wien"],
};

const MAX_API_PAGES = 3;

function extractRequestedParagraph(normalizedQuery: string): string | undefined {
  const match = normalizedQuery.match(/(?:^|\s)(?:§|art)\s*([0-9]+[a-zA-Z]?)(?:\s|$)/i);
  return match?.[1]?.toLowerCase();
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
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

function containsStateMarker(text: string, state: string): boolean {
  const haystack = text.toLowerCase();
  const prefixes = STATE_TITLE_PREFIXES[state] ?? [];
  const suffixes = STATE_TITLE_SUFFIXES[state] ?? [];
  return [state, ...prefixes, ...suffixes]
    .map((value) => value.toLowerCase())
    .some((marker) => haystack.includes(marker));
}

function buildTitleVariants(request: RisApiSearchRequest): string[] {
  const base = request.lawTitle ?? request.normalizedQuery;
  if (!request.state || containsStateMarker(base, request.state)) {
    return [base];
  }

  const prefixes = STATE_TITLE_PREFIXES[request.state] ?? [];
  const suffixes = STATE_TITLE_SUFFIXES[request.state] ?? [];

  return dedupe([
    base,
    ...prefixes.map((prefix) => `${prefix} ${base}`),
    ...suffixes.map((suffix) => `${base} ${suffix}`),
  ]);
}

export async function searchLandesrechtApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  const stateFlag = request.state ? STATE_FLAG_BY_NAME[request.state] : undefined;
  const titleVariants = buildTitleVariants(request);
  const aggregateWarnings: string[] = [];
  const aggregateNotices: string[] = ["api_search: Landesrecht"];
  let lastError: RisApiError | undefined;

  for (const titleVariant of titleVariants) {
    const variantHits: RisApiSearchCandidate[] = [];

    for (let page = 1; page <= MAX_API_PAGES; page += 1) {
      const url = buildRisApiUrl("/Landesrecht", {
        Applikation: "LrKons",
        Titel: titleVariant,
        Suchworte: request.keywords,
        VonParagraf: request.paragraphNumber,
        VonArtikel: request.articleNumber,
        Seitennummer: String(page),
        [stateFlag ?? ""]: stateFlag ? "true" : undefined,
      });

      try {
        const payload = await fetchRisApiJson(url);
        const refs = asArray(payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference);
        const mapped = mapApiDocumentReferences(refs, request);
        variantHits.push(...mapped.hits);
        aggregateWarnings.push(...mapped.warnings);
        aggregateNotices.push(...mapped.notices);

        const meta = extractRisApiHitsMeta(payload);
        if (page > 1) aggregateNotices.push(`api_pagination_used: Landesrecht page ${page}`);
        if (!hasMoreRisApiPages(meta) || dedupeCandidates(variantHits).length >= request.limit) {
          break;
        }
      } catch (error) {
        if (error instanceof RisApiError) {
          lastError = error;
          aggregateWarnings.push(`api_error_type: ${error.code}`);
          aggregateWarnings.push(`api_land_title_variant_failed: ${titleVariant}`);
          break;
        }

        aggregateWarnings.push("api_error_type: UNKNOWN_ERROR");
        aggregateWarnings.push(`api_land_title_variant_failed: ${titleVariant}`);
        break;
      }
    }

    const dedupedHits = dedupeCandidates(variantHits);
    const requestedParagraph = extractRequestedParagraph(request.normalizedQuery);
    const exactParagraphHits = requestedParagraph
      ? dedupedHits.filter((candidate) => extractSectionNumber(candidate.hit.section_ref, candidate.hit.paragraph_number) === requestedParagraph)
      : [];
    if (exactParagraphHits.length > 0) {
      return {
        success: true,
        hits: exactParagraphHits.slice(0, request.limit),
        notices: [
          ...aggregateNotices,
          `api_land_title_variant_used: ${titleVariant}`,
          `api_exact_paragraph_match_count: ${exactParagraphHits.length}`,
        ],
        warnings: [...aggregateWarnings, ...(stateFlag ? [`api_state_flag_used: ${stateFlag}`] : [])],
      };
    }
    if (dedupedHits.length > 0) {
      return {
        success: true,
        hits: dedupedHits.slice(0, request.limit),
        notices: [
          ...aggregateNotices,
          `api_land_title_variant_used: ${titleVariant}`,
        ],
        warnings: [...aggregateWarnings, ...(stateFlag ? [`api_state_flag_used: ${stateFlag}`] : [])],
      };
    }

    aggregateWarnings.push(`api_land_title_variant_no_results: ${titleVariant}`);
  }

  if (lastError) {
    return {
      success: false,
      errorCode: "UPSTREAM_UNAVAILABLE",
      message: lastError.message,
      retryable: typeof lastError.status === "number" ? lastError.status >= 500 : true,
      notices: aggregateNotices,
      warnings: [...aggregateWarnings, ...(stateFlag ? [`api_state_flag_used: ${stateFlag}`] : [])],
      details: { ...(lastError.details ?? {}), api_error_type: lastError.code },
    };
  }

  return {
    success: false,
    errorCode: "NOT_FOUND",
    message: "RIS API returned no usable Landesrecht hits after state filtering and title variants",
    notices: aggregateNotices,
    warnings: [...aggregateWarnings, ...(stateFlag ? [`api_state_flag_used: ${stateFlag}`] : [])],
    details: { state: request.state, triedTitleVariants: titleVariants },
  };
}
