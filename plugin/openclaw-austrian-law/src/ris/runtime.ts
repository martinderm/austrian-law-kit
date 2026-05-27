import { getSettings } from "../config/settings.js";

const DEFAULT_RIS_BASE_URL = "https://www.ris.bka.gv.at";

let risBaseUrlOverride: string | undefined;

export function configureRisBaseUrl(baseUrl: string | undefined): void {
  const normalized = baseUrl?.trim();
  risBaseUrlOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveRisBaseUrl(): string {
  if (risBaseUrlOverride) {
    return risBaseUrlOverride;
  }
  const settings = getSettings();
  if (settings.risBaseUrl && settings.risBaseUrl.trim().length > 0) {
    return settings.risBaseUrl.trim();
  }
  return DEFAULT_RIS_BASE_URL;
}
