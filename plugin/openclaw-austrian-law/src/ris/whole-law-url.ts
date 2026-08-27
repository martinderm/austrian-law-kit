import { resolveRisBaseUrl } from "./runtime.js";
import { validateSafeRisUrl } from "./segment-url.js";

function inferRisCollectionFromSourceId(sourceId: string): "Bundesnormen" | "Landesnormen" {
  return /^L/i.test(sourceId.trim()) ? "Landesnormen" : "Bundesnormen";
}

function inferCollectionFromWholeLawUrl(url: URL): "Bundesnormen" | "Landesnormen" | null {
  const queryAbfrage = url.searchParams.get("Abfrage")?.trim();
  if (!queryAbfrage) return null;
  if (/^Bundesnormen$/i.test(queryAbfrage)) return "Bundesnormen";
  if (/^Lr[A-Z]/.test(queryAbfrage) || /^Landesnormen$/i.test(queryAbfrage)) return "Landesnormen";
  return null;
}

export function extractSourceIdFromWholeLawUrl(sourceUrl: string): string | null {
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

  const lawId = url.searchParams.get("Gesetzesnummer")?.trim();
  if (lawId && lawId.length > 0) {
    const collection = inferCollectionFromWholeLawUrl(url) ?? "Bundesnormen";
    return `LAW:${collection}:${lawId}`;
  }

  return null;
}

export function buildRisWholeLawUrl(params: { sourceId?: string; sourceUrl?: string }): string {
  if (params.sourceUrl && params.sourceUrl.trim().length > 0) {
    validateSafeRisUrl(params.sourceUrl);
    const parsed = new URL(params.sourceUrl);
    return parsed.toString();
  }

  if (!params.sourceId || params.sourceId.trim().length === 0) {
    throw new Error("Either sourceId or sourceUrl is required");
  }

  const normalizedSourceId = params.sourceId.trim();
  const base = new URL("/Dokument.wxe", resolveRisBaseUrl());
  base.searchParams.set("Abfrage", inferRisCollectionFromSourceId(normalizedSourceId));
  base.searchParams.set("Dokumentnummer", normalizedSourceId);
  return base.toString();
}

export function normalizeWholeLawStableIdFromSourceId(sourceId: string): string {
  const normalized = sourceId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) {
    throw new Error("Unable to derive stable_id from sourceId");
  }

  return `ris:doc:${normalized}`;
}
