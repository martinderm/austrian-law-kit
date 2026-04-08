import type { SearchHit } from "../types/tool-contracts.js";
import { resolveRisBaseUrl } from "./runtime.js";

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(text: string): string {
  return decodeHtml(text)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSourceIdFromHref(hrefRaw: string): string | undefined {
  const decoded = decodeHtml(hrefRaw);
  const pathMatch = decoded.match(/\/(NOR[0-9A-Z]+)(?:[/?#]|$)/i);
  if (pathMatch?.[1]) return pathMatch[1].toUpperCase();

  try {
    const url = new URL(decoded, resolveRisBaseUrl());
    const keys = ["Dokumentnummer", "DokNr", "Gesetzesnummer", "GZ", "Index"];
    for (const key of keys) {
      const value = url.searchParams.get(key);
      if (value && value.trim().length > 0) return value.trim().toUpperCase();
    }
  } catch {
    // ignore malformed URL candidates and continue with undefined
  }

  return undefined;
}

function toStableIdFromSourceId(sourceId: string | undefined): string | undefined {
  if (!sourceId) return undefined;
  const normalized = sourceId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!normalized) return undefined;
  return `ris:doc:${normalized}`;
}

function buildSourceUrl(hrefRaw: string, sourceId: string): string {
  const href = decodeHtml(hrefRaw).trim();
  if (/^https?:\/\//i.test(href)) return href;
  if (/\/Dokumente\/Bundesnormen\//i.test(href)) {
    return new URL(`/Dokument.wxe?Abfrage=Bundesnormen&Dokumentnummer=${sourceId}`, resolveRisBaseUrl()).toString();
  }
  return new URL(href, resolveRisBaseUrl()).toString();
}

export function parseRisSearchHtml(html: string, maxHits: number): SearchHit[] {
  const rowRegex = /<tr\b[^>]*class\s*=\s*["'][^"']*bocListDataRow[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi;
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = rowRegex.exec(html)) && hits.length < maxHits) {
    const rowHtml = match[1] ?? "";
    const linkMatch = rowHtml.match(/<a\b[^>]*href\s*=\s*["']([^"']*(?:\/eli\/|\/Dokumente\/Bundesnormen\/)[^"']*)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const sourceId = extractSourceIdFromHref(linkMatch[1]);
    if (!sourceId) continue;

    const sourceUrl = buildSourceUrl(linkMatch[1], sourceId);
    if (seen.has(sourceUrl)) continue;

    const titleMatch = rowHtml.match(/<td\b[^>]*class\s*=\s*["'][^"']*bocListTextContent[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
    const title = stripTags(titleMatch?.[1] ?? linkMatch[2] ?? "");
    if (!title) continue;

    hits.push({
      stable_id: toStableIdFromSourceId(sourceId) ?? "",
      source_id: sourceId,
      title,
      source_url: sourceUrl,
    });

    seen.add(sourceUrl);
  }

  return hits;
}

export function parseRisDirectDocumentHit(html: string, fallbackUrl: string): SearchHit | undefined {
  const sourceIdMatch = html.match(/\bNOR[0-9A-Z]+\b/i);
  const sourceId = sourceIdMatch?.[0]?.toUpperCase();
  if (!sourceId) return undefined;

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = stripTags(titleMatch?.[1] ?? "");
  if (!title) return undefined;

  return {
    stable_id: toStableIdFromSourceId(sourceId) ?? "",
    source_id: sourceId,
    title,
    source_url: fallbackUrl,
    match_reason: "RIS search resolved directly to a document",
    confidence: "high",
  };
}
