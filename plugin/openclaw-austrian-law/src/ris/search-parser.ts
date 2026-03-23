import type { SearchHit } from "../types/tool-contracts.js";
import { resolveRisBaseUrl } from "./runtime.js";

function decodeHtml(text: string): string {
  const decoded = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

  return decoded;
}

function stripTags(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSourceIdFromUrl(url: URL): string | undefined {
  const keys = ["Dokumentnummer", "DokNr", "Gesetzesnummer", "GZ", "Index"];
  for (const key of keys) {
    const value = url.searchParams.get(key);
    if (value && value.trim().length > 0) return value.trim();
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

export function parseRisSearchHtml(html: string, maxHits: number): SearchHit[] {
  const linkRegex = /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)')[^>]*>([\s\S]*?)<\/a>/gi;
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) && hits.length < maxHits) {
    const hrefRaw = decodeHtml(match[1] ?? match[2] ?? "");
    if (!/Dokument\.wxe/i.test(hrefRaw)) continue;

    const sourceUrl = new URL(hrefRaw, resolveRisBaseUrl());
    const sourceUrlString = sourceUrl.toString();
    if (seen.has(sourceUrlString)) continue;

    const titleRaw = stripTags(decodeHtml(match[3] ?? ""));
    if (!titleRaw) continue;

    const sourceId = extractSourceIdFromUrl(sourceUrl);
    const stableId = toStableIdFromSourceId(sourceId);

    hits.push({
      stable_id: stableId ?? "",
      source_id: sourceId,
      title: titleRaw,
      source_url: sourceUrlString,
    });

    seen.add(sourceUrlString);
  }

  return hits;
}
