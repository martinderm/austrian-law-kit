import { resolveRisBaseUrl } from "./runtime.js";

export function buildRisSearchUrl(params: { query: string; limit: number }): string {
  const base = new URL("/Ergebnis.wxe", resolveRisBaseUrl());

  base.searchParams.set("Abfrage", "Bundesnormen");
  base.searchParams.set("Suchworte", params.query);
  base.searchParams.set("ResultPageSize", String(params.limit));
  base.searchParams.set("SucheNachRechtssatz", "False");
  base.searchParams.set("SucheNachText", "True");

  return base.toString();
}
