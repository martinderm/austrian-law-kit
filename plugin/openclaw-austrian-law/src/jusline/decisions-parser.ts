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
    .replace(/<!--[^]*?-->/g, " ")
    .replace(/<script[^]*?<\/script>/gi, " ")
    .replace(/<style[^]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDecisionSourceId(sourceId: string): string {
  return sourceId.toLowerCase().replace(/[^a-z0-9/_:-]+/g, "").replace(/^\/+|\/+$/g, "");
}

function buildStableId(sourceId: string): string {
  return `jusline:dec:${normalizeDecisionSourceId(sourceId).replace(/\//g, ":")}`;
}

function normalizeSnippet(text: string): string | undefined {
  const cleaned = stripTags(text);
  if (!cleaned) return undefined;
  return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
}

function extractDecisionsSection(html: string): string {
  const marker = html.search(/<div\b[^>]*id\s*=\s*["']decissions["'][^>]*>/i);
  if (marker < 0) return html;

  const fromMarker = html.slice(marker);
  const nextHeading = fromMarker.search(/<h2\b[^>]*>\s*<span\b[^>]*class\s*=\s*["'][^"']*capitalize[^"']*["'][^>]*>\s*\d+\s*<\/span>\s*Kommentare\s+zu/iu);
  if (nextHeading <= 0) return fromMarker;

  return fromMarker.slice(0, nextHeading);
}

export function parseJuslineDecisionsHtml(html: string, limit: number): SearchHit[] {
  const decisionsSection = extractDecisionsSection(html);

  const decisionLinkRegex = /<a\b[^>]*href\s*=\s*["'](\/entscheidungen\/([^"'#?]+))(?:["'#?][^"']*)?["'][^>]*>([\s\S]*?)<\/a>/gi;

  const hits: SearchHit[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = decisionLinkRegex.exec(decisionsSection)) && hits.length < limit) {
    const href = match[1];
    const sourceId = normalizeDecisionSourceId(match[2] ?? "");
    const title = stripTags(match[3] ?? "");

    if (!href || !sourceId || !title) continue;

    const sourceUrl = new URL(href, resolveJuslineBaseUrl()).toString();
    if (seen.has(sourceUrl)) continue;

    const remainder = decisionsSection.slice(match.index, Math.min(decisionsSection.length, match.index + 600));
    const badgeMatch = remainder.match(/<div\b[^>]*class\s*=\s*["'][^"']*badge[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const periodMatch = remainder.match(/<span\b[^>]*class\s*=\s*["'][^"']*text-nowrap[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);

    const snippetParts = [periodMatch?.[1], badgeMatch?.[1]]
      .map((part) => (part ? normalizeSnippet(part) : undefined))
      .filter((part): part is string => Boolean(part));

    hits.push({
      stable_id: buildStableId(sourceId),
      source_id: sourceId,
      title,
      source_url: sourceUrl,
      ...(snippetParts.length > 0 ? { snippet: snippetParts.join(" | ") } : {}),
    });

    seen.add(sourceUrl);
  }

  return hits;
}

export function looksLikeJuslineNoDecisions(html: string): boolean {
  const text = stripTags(html);
  return /keine\s+entscheidungen\s+zu\s+diesen\s+paragrafen/i.test(text)
    || /0\s+entscheidungen\s+zu/i.test(text);
}
