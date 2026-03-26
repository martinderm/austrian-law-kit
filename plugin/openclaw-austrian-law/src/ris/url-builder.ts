import { resolveRisBaseUrl } from "./runtime.js";

export function buildRisSearchUrl(params: { query: string; limit: number }): string {
  const base = new URL("/Ergebnis.wxe", resolveRisBaseUrl());
  const today = new Date().toISOString().slice(0, 10);

  base.searchParams.set("Abfrage", "Bundesnormen");
  base.searchParams.set("Kundmachungsorgan", "");
  base.searchParams.set("Index", "");
  base.searchParams.set("Titel", params.query);
  base.searchParams.set("Gesetzesnummer", "");
  base.searchParams.set("VonArtikel", "");
  base.searchParams.set("BisArtikel", "");
  base.searchParams.set("VonParagraf", "");
  base.searchParams.set("BisParagraf", "");
  base.searchParams.set("VonAnlage", "");
  base.searchParams.set("BisAnlage", "");
  base.searchParams.set("Typ", "");
  base.searchParams.set("Kundmachungsnummer", "");
  base.searchParams.set("Unterzeichnungsdatum", "");
  base.searchParams.set("FassungVom", today);
  base.searchParams.set("VonInkrafttretedatum", "");
  base.searchParams.set("BisInkrafttretedatum", "");
  base.searchParams.set("VonAusserkrafttretedatum", "");
  base.searchParams.set("BisAusserkrafttretedatum", "");
  base.searchParams.set("NormabschnittnummerKombination", "Und");
  base.searchParams.set("ImRisSeitVonDatum", "");
  base.searchParams.set("ImRisSeitBisDatum", "");
  base.searchParams.set("ImRisSeit", "Undefined");
  base.searchParams.set("ResultPageSize", String(params.limit));
  base.searchParams.set("Suchworte", "");

  return base.toString();
}
