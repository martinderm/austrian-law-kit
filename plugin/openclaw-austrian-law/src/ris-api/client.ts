import { resolveRisApiBaseUrl } from "./runtime.js";
import type { RisApiHitsMeta, RisApiSearchResponseEnvelope } from "./types.js";

const RIS_API_HEADERS = {
  accept: "application/json",
  "user-agent": "Mozilla/5.0 (compatible; austrian-law-kit/0.18.1)",
};

export type RisApiErrorCode = "HTTP_ERROR" | "INVALID_JSON" | "API_ERROR";

export class RisApiError extends Error {
  code: RisApiErrorCode;
  status?: number;
  details?: Record<string, unknown>;

  constructor(code: RisApiErrorCode, message: string, options?: { status?: number; details?: Record<string, unknown> }) {
    super(message);
    this.name = "RisApiError";
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

export function buildRisApiUrl(pathname: string, params: Record<string, string | undefined>): string {
  const normalizedPath = pathname.replace(/^\/+/, "");
  const url = new URL(normalizedPath, resolveRisApiBaseUrl());
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function extractRisApiHitsMeta(payload: RisApiSearchResponseEnvelope): RisApiHitsMeta {
  const hits = payload.OgdSearchResult?.OgdDocumentResults?.Hits;
  return {
    totalHits: parseOptionalInt(hits?.["#text"]),
    pageNumber: parseOptionalInt(hits?.["@pageNumber"]),
    pageSize: parseOptionalInt(hits?.["@pageSize"]),
  };
}

export function hasMoreRisApiPages(meta: RisApiHitsMeta): boolean {
  if (!meta.totalHits || !meta.pageNumber || !meta.pageSize) return false;
  return meta.pageNumber * meta.pageSize < meta.totalHits;
}

export async function fetchRisApiJson(url: string): Promise<RisApiSearchResponseEnvelope> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: RIS_API_HEADERS,
    });
  } catch (error) {
    throw new RisApiError("HTTP_ERROR", `Network error during RIS API request from ${url}: ${error instanceof Error ? error.message : "fetch failed"}`, {
      details: { phase: "fetch_api_http_request", url, error: error instanceof Error ? error.message : String(error) },
    });
  }

  if (!response.ok) {
    throw new RisApiError("HTTP_ERROR", `RIS API returned HTTP ${response.status}`, {
      status: response.status,
      details: { phase: "fetch_api_http_response", url },
    });
  }

  let payload: RisApiSearchResponseEnvelope;
  try {
    payload = await response.json() as RisApiSearchResponseEnvelope;
  } catch (error) {
    throw new RisApiError("INVALID_JSON", `RIS API response was not valid JSON: ${error instanceof Error ? error.message : "Unknown parse error"}`, {
      details: { url },
    });
  }

  const apiError = payload?.OgdSearchResult?.Error;
  if (apiError?.Message) {
    throw new RisApiError("API_ERROR", apiError.Message, {
      details: { url, application: apiError.Applikation },
    });
  }

  return payload;
}
