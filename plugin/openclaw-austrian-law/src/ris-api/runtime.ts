import { getSettings } from "../config/settings.js";

const DEFAULT_RIS_API_BASE_URL = "https://data.bka.gv.at/ris/api/v2.6/";

let risApiBaseUrlOverride: string | undefined;

export function configureRisApiBaseUrl(baseUrl: string | undefined): void {
  const normalized = baseUrl?.trim();
  risApiBaseUrlOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveRisApiBaseUrl(): string {
  if (risApiBaseUrlOverride) {
    return risApiBaseUrlOverride;
  }
  const settings = getSettings();
  if (settings.risApiBaseUrl && settings.risApiBaseUrl.trim().length > 0) {
    return settings.risApiBaseUrl.trim();
  }
  return DEFAULT_RIS_API_BASE_URL;
}
