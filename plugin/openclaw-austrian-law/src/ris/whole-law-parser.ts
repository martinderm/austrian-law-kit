export interface ParsedRisWholeLaw {
  title: string;
  content: string;
  lawTitle?: string;
}

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

function normalizeText(html: string): string {
  return decodeHtml(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractFirstNonEmpty(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const raw = match?.[1];
    if (!raw) continue;
    const value = normalizeText(raw);
    if (value.length > 0) return value;
  }
  return null;
}

function extractDocumentHeadingTitle(html: string): string {
  const title = extractFirstNonEmpty(html, [
    /<h1\b[^>]*id\s*=\s*["']Title["'][^>]*>([\s\S]*?)<\/h1>/i,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i,
  ]);

  if (title) return title;
  throw new Error("Unable to extract title from RIS whole-law page");
}

function extractLawTitle(html: string): string | undefined {
  return extractFirstNonEmpty(html, [
    /<div\b[^>]*class\s*=\s*["'][^"']*p[^"']*["'][^>]*>[\s\S]*?<h3>\s*Langtitel\s*<\/h3>([\s\S]*?)<\/div>/i,
    /<div\b[^>]*class\s*=\s*["'][^"']*p[^"']*["'][^>]*>[\s\S]*?<h3>\s*Kurztitel\s*<\/h3>([\s\S]*?)<\/div>/i,
  ]) ?? undefined;
}

function extractDocumentContentBlocks(html: string): string[] {
  const blocks = Array.from(
    html.matchAll(/<div\b[^>]*class\s*=\s*["'][^"']*documentContent[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*(?=<div\b[^>]*class\s*=\s*["'][^"']*documentContent[^"']*["'][^>]*>|<\/div>\s*<div id=|<div id="BottomPageNavigation")/gi),
  )
    .map((match) => normalizeText(match[1] ?? ""))
    .filter((value) => value.length > 0);

  if (blocks.length > 0) return blocks;

  const textContainers = Array.from(
    html.matchAll(/<div\b[^>]*id\s*=\s*["'][^"']*_TextContainer_[^"']*["'][^>]*class\s*=\s*["'][^"']*embeddedContent[^"']*["'][^>]*>[\s\S]*?<h3\b[^>]*>\s*Text\s*<\/h3>\s*<div>([\s\S]*?)<\/div>\s*<\/div>/gi),
  )
    .map((match) => normalizeText(match[1] ?? ""))
    .filter((value) => value.length > 0);

  return textContainers;
}

function extractContent(html: string): string {
  const blocks = extractDocumentContentBlocks(html);
  if (blocks.length > 0) return blocks.join("\n\n");

  const fallback = extractFirstNonEmpty(html, [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]);

  if (fallback) return fallback;
  throw new Error("Unable to extract content from RIS whole-law page");
}

export function looksLikeRisWholeLawNotFound(html: string): boolean {
  return /kein treffer|nicht gefunden|es wurden keine dokumente/i.test(normalizeText(html));
}

export function parseRisWholeLawHtml(html: string): ParsedRisWholeLaw {
  const headingTitle = extractDocumentHeadingTitle(html);
  const lawTitle = extractLawTitle(html);

  return {
    title: lawTitle ?? headingTitle,
    content: extractContent(html),
    lawTitle,
  };
}
