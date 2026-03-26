export interface ParsedRisSegment {
  title: string;
  content: string;
  lawTitle?: string;
  lawAbbreviation?: string;
  lawSlug?: string;
  lawType?: string;
  effectiveDate?: string;
  effectiveDateRaw?: string;
  indexLabel?: string;
  promulgation?: string;
  heading?: string;
  segmentRef?: string;
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

function extractFieldByHeading(html: string, heading: string): string | undefined {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `<div\\b[^>]*class\\s*=\\s*["'][^"']*p[^"']*["'][^>]*>[\\s\\S]*?<h3>\\s*${escaped}\\s*<\\/h3>([\\s\\S]*?)<\\/div>`,
    "i",
  );
  const raw = html.match(pattern)?.[1];
  if (!raw) return undefined;
  const value = normalizeText(raw);
  return value.length > 0 ? value : undefined;
}

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return undefined;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function deriveLawSlug(lawAbbreviation: string | undefined): string | undefined {
  if (!lawAbbreviation) return undefined;
  const slug = lawAbbreviation
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-zäöüß]+/g, "")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
  return slug.length > 0 ? slug : undefined;
}

function extractTitle(html: string): string {
  const title = extractFirstNonEmpty(html, [
    /<div\b[^>]*class\s*=\s*["'][^"']*document[^"']*["'][^>]*>[\s\S]*?<h2\b[^>]*class\s*=\s*["'][^"']*onlyScreenreader[^"']*["'][^>]*>([\s\S]*?)<\/h2>/i,
    /<h1\b[^>]*id\s*=\s*["']Title["'][^>]*>([\s\S]*?)<\/h1>/i,
    /<title\b[^>]*>([\s\S]*?)<\/title>/i,
  ]);

  if (title) return title;
  throw new Error("Unable to extract title from RIS document page");
}

function extractContent(html: string): string {
  const textContainer = extractFirstNonEmpty(html, [
    /<div\b[^>]*id\s*=\s*["'][^"']*_TextContainer_[^"']*["'][^>]*class\s*=\s*["'][^"']*embeddedContent[^"']*["'][^>]*>[\s\S]*?<h3\b[^>]*>\s*Text\s*<\/h3>\s*<div>([\s\S]*?)<\/div>\s*<\/div>\s*(?=<div\b[^>]*id\s*=\s*["'][^"']*_(?:AnmerkungContainer|VeroeffentlichungsdatumAenderungsdatumContainer|GesetzesnummerContainer|EliContainer|AlteDokumentnummerContainer)_[^"']*["'])/i,
    /<div\b[^>]*id\s*=\s*["'][^"']*_TextContainer_[^"']*["'][^>]*class\s*=\s*["'][^"']*embeddedContent[^"']*["'][^>]*>[\s\S]*?<h3\b[^>]*>\s*Text\s*<\/h3>\s*<div>([\s\S]*?)<\/div>\s*<\/div>/i,
  ]);

  if (textContainer) return textContainer;

  const contentBlock = extractFirstNonEmpty(html, [
    /<div\b[^>]*class\s*=\s*["'][^"']*contentBlock[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div\b[^>]*class\s*=\s*["'][^"']*documentContent[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]);

  if (contentBlock) return contentBlock;
  throw new Error("Unable to extract content from RIS document page");
}

function extractHeading(html: string): string | undefined {
  return extractFirstNonEmpty(html, [
    /<h4\b[^>]*class\s*=\s*["'][^"']*UeberschrPara[^"']*["'][^>]*>[\s\S]*?<span[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/i,
    /<h4\b[^>]*class\s*=\s*["'][^"']*UeberschrPara[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i,
  ]) ?? undefined;
}

export function looksLikeRisNotFound(html: string): boolean {
  return /kein treffer|nicht gefunden|es wurden keine dokumente/i.test(normalizeText(html));
}

export function parseRisSegmentHtml(html: string): ParsedRisSegment {
  const lawAbbreviation = extractFieldByHeading(html, "Abkürzung");
  const effectiveDateRaw = extractFieldByHeading(html, "Inkrafttretensdatum");
  const heading = extractHeading(html);
  const segmentRef = extractFieldByHeading(html, "§/Artikel/Anlage");

  return {
    title: extractTitle(html),
    content: extractContent(html),
    lawTitle: extractFieldByHeading(html, "Kurztitel"),
    lawAbbreviation,
    lawSlug: deriveLawSlug(lawAbbreviation),
    lawType: extractFieldByHeading(html, "Typ"),
    effectiveDate: toIsoDate(effectiveDateRaw),
    effectiveDateRaw,
    indexLabel: extractFieldByHeading(html, "Index"),
    promulgation: extractFieldByHeading(html, "Kundmachungsorgan"),
    heading,
    segmentRef,
  };
}
