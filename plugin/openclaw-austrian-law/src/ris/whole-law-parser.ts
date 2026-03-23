export interface ParsedRisWholeLaw {
  title: string;
  content: string;
}

function decodeHtml(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(html: string): string {
  return decodeHtml(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html: string): string {
  const h1 = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    const value = stripTags(h1[1]);
    if (value.length > 0) return value;
  }

  const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (title?.[1]) {
    const value = stripTags(title[1]);
    if (value.length > 0) return value;
  }

  throw new Error("Unable to extract title from RIS whole-law page");
}

function extractContent(html: string): string {
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (main?.[1]) {
    const value = stripTags(main[1]);
    if (value.length > 0) return value;
  }

  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (body?.[1]) {
    const value = stripTags(body[1]);
    if (value.length > 0) return value;
  }

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
