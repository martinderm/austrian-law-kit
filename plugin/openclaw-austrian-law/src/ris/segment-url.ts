import { resolveRisBaseUrl } from "./runtime.js";

const ALLOWED_RIS_HOSTS = new Set([
  "www.ris.bka.gv.at",
  "data.bka.gv.at",
  "ogd.ris.bka.gv.at",
  "ris.bka.gv.at",
]);

export function isSafeRisUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (ALLOWED_RIS_HOSTS.has(host)) return true;
    const customBase = resolveRisBaseUrl();
    if (customBase) {
      const customUrl = new URL(customBase);
      if (customUrl.hostname.toLowerCase() === host) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function validateSafeRisUrl(urlString: string): void {
  if (!isSafeRisUrl(urlString)) {
    throw new Error(`unsafe URL / untrusted domain: ${urlString}`);
  }
}

function normalizeSourceId(sourceId: string): string {
  return sourceId.trim();
}

function inferRisCollectionFromSourceId(sourceId: string): "Bundesnormen" | "Landesnormen" {
  return /^L/i.test(sourceId.trim()) ? "Landesnormen" : "Bundesnormen";
}

export function extractSourceIdFromRisUrl(sourceUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(sourceUrl);
  } catch {
    return null;
  }

  const docNo = url.searchParams.get("Dokumentnummer")?.trim();
  if (docNo && docNo.length > 0) return docNo;

  const pathMatch = url.pathname.match(/\b(NOR[0-9A-Z]+|LOO[0-9A-Z]+|GEMREA_[0-9A-Z]+|GEMRE_[0-9A-Z]+)\b/i);
  if (pathMatch?.[1]) return pathMatch[1].toUpperCase();

  return null;
}

export function buildRisSegmentUrl(params: { sourceId?: string; sourceUrl?: string }): string {
  if (params.sourceUrl && params.sourceUrl.trim().length > 0) {
    validateSafeRisUrl(params.sourceUrl);
    const parsed = new URL(params.sourceUrl);
    return parsed.toString();
  }

  if (!params.sourceId || params.sourceId.trim().length === 0) {
    throw new Error("Either sourceId or sourceUrl is required");
  }

  const normalizedSourceId = normalizeSourceId(params.sourceId);
  const base = new URL("/Dokument.wxe", resolveRisBaseUrl());
  base.searchParams.set("Abfrage", inferRisCollectionFromSourceId(normalizedSourceId));
  base.searchParams.set("Dokumentnummer", normalizedSourceId);
  return base.toString();
}

export function normalizeStableIdFromSourceId(sourceId: string): string {
  const normalized = sourceId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    throw new Error("Unable to derive stable_id from sourceId");
  }

  return `ris:segment:${normalized}`;
}
