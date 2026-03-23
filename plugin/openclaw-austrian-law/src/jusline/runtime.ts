const DEFAULT_JUSLINE_BASE_URL = "https://www.jusline.at";

let juslineBaseUrlOverride: string | undefined;

export function configureJuslineBaseUrl(baseUrl: string | undefined): void {
  const normalized = baseUrl?.trim();
  juslineBaseUrlOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveJuslineBaseUrl(): string {
  return juslineBaseUrlOverride ?? DEFAULT_JUSLINE_BASE_URL;
}
