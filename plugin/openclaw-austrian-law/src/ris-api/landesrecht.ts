import { buildRisApiUrl, fetchRisApiJson, RisApiError } from "./client.js";
import { mapApiDocumentReferences } from "./mappers.js";
import type { RisApiSearchRequest, RisApiSearchResult } from "./types.js";

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
  Burgenland: ["Burgenländische", "Bgld."],
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
    const url = buildRisApiUrl("/Landesrecht", {
      Applikation: "LrKons",
      Titel: titleVariant,
      Suchworte: request.keywords,
      Seitennummer: "1",
      [stateFlag ?? ""]: stateFlag ? "true" : undefined,
    });

    try {
      const payload = await fetchRisApiJson(url);
      const refs = asArray(payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference);
      const mapped = mapApiDocumentReferences(refs, request);
      aggregateWarnings.push(...mapped.warnings);

      if (mapped.hits.length > 0) {
        return {
          ok: true,
          hits: mapped.hits.slice(0, request.limit),
          notices: [
            ...aggregateNotices,
            ...mapped.notices,
            `api_land_title_variant_used: ${titleVariant}`,
          ],
          warnings: [...aggregateWarnings, ...(stateFlag ? [`api_state_flag_used: ${stateFlag}`] : [])],
        };
      }

      aggregateWarnings.push(`api_land_title_variant_no_results: ${titleVariant}`);
    } catch (error) {
      if (error instanceof RisApiError) {
        lastError = error;
        aggregateWarnings.push(`api_land_title_variant_failed: ${titleVariant}`);
        continue;
      }

      aggregateWarnings.push(`api_land_title_variant_failed: ${titleVariant}`);
    }
  }

  if (lastError) {
    return {
      ok: false,
      errorCode: "UPSTREAM_UNAVAILABLE",
      message: lastError.message,
      retryable: typeof lastError.status === "number" ? lastError.status >= 500 : true,
      notices: aggregateNotices,
      warnings: aggregateWarnings,
      details: lastError.details,
    };
  }

  return {
    ok: false,
    errorCode: "NOT_FOUND",
    message: "RIS API returned no usable Landesrecht hits after state filtering and title variants",
    notices: aggregateNotices,
    warnings: [...aggregateWarnings, ...(stateFlag ? [`api_state_flag_used: ${stateFlag}`] : [])],
    details: { state: request.state, triedTitleVariants: titleVariants },
  };
}
