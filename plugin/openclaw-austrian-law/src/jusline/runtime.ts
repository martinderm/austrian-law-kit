import { getSettings } from "../config/settings.js";

const DEFAULT_JUSLINE_BASE_URL = "https://www.jusline.at";

let juslineBaseUrlOverride: string | undefined;

export function configureJuslineBaseUrl(baseUrl: string | undefined): void {
  const normalized = baseUrl?.trim();
  juslineBaseUrlOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveJuslineBaseUrl(): string {
  if (juslineBaseUrlOverride) {
    return juslineBaseUrlOverride;
  }
  const settings = getSettings();
  if (settings.juslineBaseUrl && settings.juslineBaseUrl.trim().length > 0) {
    return settings.juslineBaseUrl.trim();
  }
  return DEFAULT_JUSLINE_BASE_URL;
}
