import type { SearchHit } from "../types/tool-contracts.js";
import { resolveRisBaseUrl } from "./runtime.js";

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(text: string): string {
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
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
  const linkRegex = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) && hits.length < maxHits) {
    const hrefRaw = decodeHtml(match[1]);
    if (!/Dokument\.wxe/i.test(hrefRaw)) continue;

    const sourceUrl = new URL(hrefRaw, resolveRisBaseUrl());
    const sourceUrlString = sourceUrl.toString();
    if (seen.has(sourceUrlString)) continue;

    const titleRaw = stripTags(decodeHtml(match[2]));
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
