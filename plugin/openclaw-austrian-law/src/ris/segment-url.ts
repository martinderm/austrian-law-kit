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
    const host = url.hostname.toLowerCase();

    // Check if a custom base URL override is configured (e.g. test environments)
    const customBase = resolveRisBaseUrl();
    if (customBase) {
      const customUrl = new URL(customBase);
      if (customUrl.hostname.toLowerCase() === host) {
        return url.protocol === "https:" || url.protocol === "http:";
      }
    }

    // Official production hosts must strictly use HTTPS
    if (ALLOWED_RIS_HOSTS.has(host)) {
      return url.protocol === "https:";
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

const DOCUMENT_ID_PATTERN = /\b(NOR\d+|LOO\d+|GEMREA_[0-9A-Z_]+|GEMRE_[0-9A-Z_]+)\b/i;

export function extractDocumentIdFromRisPath(pathname: string): string | null {
  const isDocumentPath = /\/Dokumente\//i.test(pathname);
  const isEliPath = /\/eli\//i.test(pathname);
  if (!isDocumentPath && !isEliPath) return null;

  const match = pathname.match(DOCUMENT_ID_PATTERN);
  return match?.[1] ? match[1].toUpperCase() : null;
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

  return extractDocumentIdFromRisPath(url.pathname);
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
