export interface ParsedRisWholeLaw {
  title: string;
  content: string;
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

function stripTags(html: string): string {
  return decodeHtml(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractFirstNonEmpty(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const raw = match?.[1];
    if (!raw) continue;
    const value = stripTags(raw);
    if (value.length > 0) return value;
  }
  return null;
}

function extractTitle(html: string): string {
  const title = extractFirstNonEmpty(html, [
    /<h1\b[^>]*>([\s\S]*?)<\/h1>/i,
    /<h2\b[^>]*>([\s\S]*?)<\/h2>/i,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i,
  ]);

  if (title) return title;
  throw new Error("Unable to extract title from RIS whole-law page");
}

function extractContent(html: string): string {
  const content = extractFirstNonEmpty(html, [
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div\b[^>]*(?:id|class)\s*=\s*["'][^"']*(?:content|main)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]);

  if (content) return content;
  throw new Error("Unable to extract content from RIS whole-law page");
}

export function looksLikeRisWholeLawNotFound(html: string): boolean {
  return /kein treffer|nicht gefunden|es wurden keine dokumente/i.test(stripTags(html));
}

export function parseRisWholeLawHtml(html: string): ParsedRisWholeLaw {
  return {
    title: extractTitle(html),
    content: extractContent(html),
  };
}
