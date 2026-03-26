import type { SearchHit } from "../types/tool-contracts.js";
import { resolveJuslineBaseUrl } from "./runtime.js";

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

function stripTags(html: string): string {
  return decodeHtml(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSourceId(sourceId: string): string {
  return sourceId.trim().replace(/[^0-9]+/g, "");
}

function buildStableId(sourceId: string): string {
  return `jusline:comment:${normalizeSourceId(sourceId)}`;
}

function normalizeSummary(text: string): string | undefined {
  const cleaned = stripTags(text);
  if (!cleaned) return undefined;
  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
}

export function parseJuslineDiscussionsHtml(html: string, limit: number): SearchHit[] {
  const commentLinkRegex = /<a\b[^>]*href\s*=\s*["'](\/gesetzeskommentare\/(\d+))(?:["'#?][^"']*)?["'][^>]*>([\s\S]*?)<\/a>/gi;

  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = commentLinkRegex.exec(html)) && hits.length < limit) {
    const href = match[1];
    const sourceId = normalizeSourceId(match[2] ?? "");
    const anchorText = stripTags(match[3] ?? "");
    if (!anchorText || !sourceId) continue;

    const sourceUrl = new URL(href, resolveJuslineBaseUrl()).toString();
    if (seen.has(sourceUrl)) continue;

    const remainder = html.slice(match.index, Math.min(html.length, match.index + 1600));
    const summaryMatch = remainder.match(/<p\b[^>]*>([\s\S]*?)<a\b[^>]*>\s*mehr\s*lesen\s*\.{0,3}/iu);
    const snippet = summaryMatch?.[1] ? normalizeSummary(summaryMatch[1]) : undefined;

    hits.push({
      stable_id: buildStableId(sourceId),
      source_id: sourceId,
      title: anchorText,
      source_url: sourceUrl,
      ...(snippet ? { snippet } : {}),
    });

    seen.add(sourceUrl);
  }

  return hits;
}

export function looksLikeJuslineNoDiscussions(html: string): boolean {
  const text = stripTags(html);
  return /keine\s+kommentare\s+zu\s+diesen\s+paragrafen/i.test(text)
    || /0\s+kommentare\s+zu/i.test(text);
}
