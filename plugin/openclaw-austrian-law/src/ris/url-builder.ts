import { resolveRisBaseUrl } from "./runtime.js";

const RIS_RESULT_PAGE_SIZE = 100;

export function buildRisSearchUrl(params: { query: string; limit: number; lawTitle?: string; paragraphFrom?: string; paragraphTo?: string; keywords?: string; scope?: "bund" | "land"; state?: string }): string {
  const base = new URL("/Ergebnis.wxe", resolveRisBaseUrl());
  const today = new Date().toISOString().slice(0, 10);

  const scope = params.scope ?? "bund";
  base.searchParams.set("Abfrage", scope === "land" ? "Landesnormen" : "Bundesnormen");
  base.searchParams.set("Kundmachungsorgan", "");
  if (scope === "land") {
    base.searchParams.set("Bundesland", params.state ?? "");
    base.searchParams.set("BundeslandDefault", params.state ?? "");
  }
  base.searchParams.set("Index", "");
  base.searchParams.set("Titel", params.lawTitle ?? params.query);
  base.searchParams.set("Gesetzesnummer", "");
  base.searchParams.set("VonArtikel", "");
  base.searchParams.set("BisArtikel", "");
  base.searchParams.set("VonAnlage", "");
  base.searchParams.set("BisAnlage", "");
  base.searchParams.set("Typ", "");
  base.searchParams.set("Kundmachungsnummer", "");
  base.searchParams.set("Unterzeichnungsdatum", "");
  base.searchParams.set("FassungVom", today.split("-").reverse().join("."));
  base.searchParams.set("VonInkrafttretedatum", "");
  base.searchParams.set("BisInkrafttretedatum", "");
  base.searchParams.set("VonAusserkrafttretedatum", "");
  base.searchParams.set("BisAusserkrafttretedatum", "");
  base.searchParams.set("NormabschnittnummerKombination", "Und");
  base.searchParams.set("ImRisSeitVonDatum", "");
  base.searchParams.set("ImRisSeitBisDatum", "");
  base.searchParams.set("ImRisSeit", "Undefined");
  base.searchParams.set("ResultPageSize", String(RIS_RESULT_PAGE_SIZE));
  base.searchParams.set("Suchworte", params.keywords ?? "");
  base.searchParams.set("Position", "1");
  base.searchParams.set("SkipToDocumentPage", "true");
  base.searchParams.set("VonParagraf", params.paragraphFrom ?? "");
  base.searchParams.set("BisParagraf", params.paragraphTo ?? "");

  return base.toString();
}
