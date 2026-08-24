import { normalizeAustrianState } from "../ris/collections.js";
import { RIS_API_APPLICATIONS, RIS_API_ENDPOINTS } from "./applications.js";
import { buildRisApiUrl, extractRisApiHitsMeta, fetchRisApiJson, hasMoreRisApiPages, RisApiError } from "./client.js";
import type { AustrianState, SearchHit } from "../types/tool-contracts.js";
import type { RisApiContentUrl, RisApiDocumentReference, RisApiHitsMeta, RisApiSearchCandidate, RisApiSearchRequest, RisApiSearchResponseEnvelope, RisApiSearchResult } from "./types.js";

export interface RisApiGemeindenRawRequest {
  query?: string;
  state?: AustrianState;
  municipality?: string;
  district?: string;
  authentic?: boolean;
  page?: number;
}

export interface RisApiRawResponse {
  payload: RisApiSearchResponseEnvelope;
  hitsMeta: RisApiHitsMeta;
  url: string;
}

const GEMEINDEN_STATE_FLAG_BY_NAME: Record<AustrianState, string> = {
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

const MAX_API_PAGES = 3;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function findContentUrl(items: RisApiContentUrl[], dataType: string): string | undefined {
  return items.find((item) => item.DataType?.toLowerCase() === dataType.toLowerCase())?.Url;
}

function stableIdFromSourceId(sourceId: string): string {
  return `ris:doc:${sourceId.trim().toLowerCase()}`;
}

function normalizeTitle(ref: RisApiDocumentReference): string | undefined {
  const gemeinden = ref.Data?.Metadaten?.Gemeinden;
  return gemeinden?.Kurztitel?.trim() || gemeinden?.Titel?.trim();
}

function mapGemeindenRefs(refs: RisApiDocumentReference[], request: RisApiSearchRequest): RisApiSearchCandidate[] {
  const hits: RisApiSearchCandidate[] = [];
  const seen = new Set<string>();

  for (const ref of refs) {
    const technical = ref.Data?.Metadaten?.Technisch;
    const general = ref.Data?.Metadaten?.Allgemein;
    const gemeinden = ref.Data?.Metadaten?.Gemeinden;
    const sourceId = technical?.ID?.trim();
    if (!sourceId || !gemeinden) continue;

    const normalizedState = normalizeAustrianState(gemeinden.Bundesland);
    if (request.state && normalizedState !== request.state) continue;
    if (request.municipality && gemeinden.Gemeinde && gemeinden.Gemeinde.toLowerCase() !== request.municipality.toLowerCase()) continue;
    const district = gemeinden.GrA?.Bezirk ?? gemeinden.Gr?.Bezirk;
    if (request.district && district && district.toLowerCase() !== request.district.toLowerCase()) continue;

    const contentRefs = asArray(ref.Data?.Dokumentliste?.ContentReference);
    const contentUrls = contentRefs.flatMap((entry) => asArray(entry?.Urls?.ContentUrl));
    const preferredContentUrl = findContentUrl(contentUrls, request.authentic ? "Authentisch" : "Html")
      ?? findContentUrl(contentUrls, "Html")
      ?? findContentUrl(contentUrls, "Authentisch");
    const sourceUrl = general?.DokumentUrl ?? preferredContentUrl;
    if (!sourceUrl || seen.has(sourceUrl)) continue;

    const title = normalizeTitle(ref) ?? sourceId;
    const hit: SearchHit = {
      stable_id: stableIdFromSourceId(sourceId),
      source_id: sourceId,
      title,
      source_url: sourceUrl,
      match_reason: request.municipality
        ? "official RIS API municipal result matches scoped municipality"
        : "official RIS API municipal discovery result",
      confidence: request.municipality ? "high" : "medium",
      application: request.authentic ? "GrA" : "Gr",
      scope: "municipal",
      state: normalizedState,
      municipality: gemeinden.Gemeinde,
      district,
      document_url: general?.DokumentUrl,
      content_url: preferredContentUrl,
      document_type: "Norm",
      legal_type: gemeinden.Typ,
      promulgation: gemeinden.GrA?.KundmachungsorganNr,
      published_at: gemeinden.GrA?.Kundmachungsdatum ?? gemeinden.Gr?.Inkrafttretensdatum,
      changed_at: general?.Geaendert,
    };

    hits.push({
      hit,
      application: request.authentic ? "GrA" : "Gr",
      scope: "municipal",
      state: normalizedState,
      municipality: gemeinden.Gemeinde,
      district,
      contentUrl: preferredContentUrl,
      documentUrl: general?.DokumentUrl,
    });
    seen.add(sourceUrl);
  }

  return hits;
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

export async function searchGemeindenApiRaw(request: RisApiGemeindenRawRequest): Promise<RisApiRawResponse> {
  const stateFlag = request.state ? GEMEINDEN_STATE_FLAG_BY_NAME[request.state] : undefined;
  const url = buildRisApiUrl(RIS_API_ENDPOINTS.Gemeinden, {
    Applikation: request.authentic ? RIS_API_APPLICATIONS.GEMEINDERECHT_AUTH : RIS_API_APPLICATIONS.GEMEINDERECHT,
    Suchworte: request.query,
    Gemeinde: request.municipality,
    Bezirk: request.district,
    Seitennummer: String(request.page ?? 1),
    [stateFlag ?? ""]: stateFlag ? "true" : undefined,
  });
  const payload = await fetchRisApiJson(url);
  return {
    payload,
    hitsMeta: extractRisApiHitsMeta(payload),
    url,
  };
}

export async function searchGemeindenApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  const notices = ["api_search: Gemeinden"];
  const warnings: string[] = [];
  const aggregateHits: RisApiSearchCandidate[] = [];
  let lastError: RisApiError | undefined;

  for (let page = 1; page <= MAX_API_PAGES; page += 1) {
    try {
      const raw = await searchGemeindenApiRaw({
        query: request.paragraphNumber ?? request.articleNumber ?? request.keywords ?? request.normalizedQuery,
        state: request.state,
        municipality: request.municipality,
        district: request.district,
        authentic: request.authentic,
        page,
      });
      const refs = asArray(raw.payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference);
      aggregateHits.push(...mapGemeindenRefs(refs, request));
      if (page > 1) notices.push(`api_pagination_used: Gemeinden page ${page}`);
      if (!hasMoreRisApiPages(raw.hitsMeta) || dedupeCandidates(aggregateHits).length >= request.limit) break;
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

  const deduped = dedupeCandidates(aggregateHits);
  if (deduped.length > 0) {
    if (request.state) notices.push(`api_municipal_state_filter: ${request.state}`);
    if (request.municipality) notices.push(`api_municipality_filter: ${request.municipality}`);
    if (request.district) notices.push(`api_district_filter: ${request.district}`);
    if (request.authentic) notices.push("api_municipal_authentic: true");
    return {
      success: true,
      hits: deduped.slice(0, request.limit),
      notices,
      warnings,
    };
  }

  if (lastError) {
    return {
      success: false,
      errorCode: "UPSTREAM_UNAVAILABLE",
      message: lastError.message,
      retryable: typeof lastError.status === "number" ? lastError.status >= 500 : true,
      notices,
      warnings,
      details: { ...(lastError.details ?? {}), api_error_type: lastError.code },
    };
  }

  return {
    success: false,
    errorCode: "NOT_FOUND",
    message: "RIS API returned no usable Gemeinden hits",
    notices,
    warnings,
    details: {
      query: request.query,
      state: request.state,
      municipality: request.municipality,
      district: request.district,
      authentic: request.authentic,
    },
  };
}
