import { RIS_API_ENDPOINTS } from "./applications.js";
import { buildRisApiUrl, extractRisApiHitsMeta, fetchRisApiJson } from "./client.js";
import type { RisApiHitsMeta, RisApiSearchResponseEnvelope } from "./types.js";

export interface RisApiHistoryRawRequest {
  application?: string;
  changedFrom?: string;
  changedTo?: string;
  includeDeletedDocuments?: boolean;
  page?: number;
}

export interface RisApiRawResponse {
  payload: RisApiSearchResponseEnvelope;
  hitsMeta: RisApiHitsMeta;
  url: string;
}

export async function fetchHistoryApiRaw(request: RisApiHistoryRawRequest): Promise<RisApiRawResponse> {
  const url = buildRisApiUrl(RIS_API_ENDPOINTS.History, {
    Anwendung: request.application,
    AenderungenVon: request.changedFrom,
    AenderungenBis: request.changedTo,
    IncludeDeletedDocuments: request.includeDeletedDocuments ? "true" : undefined,
    Seitennummer: String(request.page ?? 1),
  });
  const payload = await fetchRisApiJson(url);
  return {
    payload,
    hitsMeta: extractRisApiHitsMeta(payload),
    url,
  };
}
