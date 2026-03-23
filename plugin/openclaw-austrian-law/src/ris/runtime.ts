const DEFAULT_RIS_BASE_URL = "https://www.ris.bka.gv.at";

let risBaseUrlOverride: string | undefined;

export function configureRisBaseUrl(baseUrl: string | undefined): void {
  const normalized = baseUrl?.trim();
  risBaseUrlOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveRisBaseUrl(): string {
  return risBaseUrlOverride ?? DEFAULT_RIS_BASE_URL;
}
