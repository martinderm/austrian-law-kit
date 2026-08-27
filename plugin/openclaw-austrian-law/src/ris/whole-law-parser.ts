export interface ParsedRisWholeLaw {
  title: string;
  content: string;
  lawTitle?: string;
  consolidatedAsOf?: string;
  consolidatedAsOfRaw?: string;
  gesetzesnummer?: string;
  promulgation?: string;
  normStatus?: "in_force" | "current" | "historical" | "repealed" | "unknown";
  eli?: string;
}

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return undefined;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function decodeHtml(text: string): string {
  const decoded = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#167;/gi, "§")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
  return fixMojibake(decoded);
}

function fixMojibake(text: string): string {
  if (!/[ÃÂâǬ]/.test(text)) return text;
  const replacements: Array<[RegExp, string]> = [
    [/â€“/g, "–"],
    [/â€”/g, "—"],
    [/â€ž/g, "„"],
    [/â€œ/g, "“"],
    [/â€ /g, "”"],
    [/â€™/g, "’"],
    [/â€˜/g, "‘"],
    [/â€¦/g, "…"],
    [/Ã¤/g, "ä"],
    [/Ã¶/g, "ö"],
    [/Ã¼/g, "ü"],
    [/Ã„/g, "Ä"],
    [/Ã–/g, "Ö"],
    [/Ãœ/g, "Ü"],
    [/ÃŸ/g, "ß"],
    [/Â§/g, "§"],
    [/Â /g, " "],
  ];
  let fixed = text;
  for (const [pattern, replacement] of replacements) {
    fixed = fixed.replace(pattern, replacement);
  }
  return fixed;
}

function deduplicateExpandedSentences(text: string): string {
  return text.replace(/([A-ZÄÖÜ][^\n.!?]+(?:Abs\.|Absatz)[^\n.!?]+[.!?])\s+([A-ZÄÖÜ][^\n.!?]+(?:Abs\.|Absatz)[^\n.!?]+[.!?])/g, (full, s1, s2) => {
    const norm1 = s1.toLowerCase().replace(/absatz\s+(?:eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|\d+)/g, "abs").replace(/[^a-z0-9]/g, "");
    const norm2 = s2.toLowerCase().replace(/absatz\s+(?:eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|\d+)/g, "abs").replace(/[^a-z0-9]/g, "");
    if (norm1 === norm2) {
      return s1.includes("Abs.") ? s1 : s2;
    }
    return full;
  });
}

function cleanScreenreaderAndFormatting(text: string): string {
  let cleaned = text
    .replace(/§\s*(\d+[a-zA-Z]*)\.\s*Paragraph\s*(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|[a-zA-Z]+),?\s*/gi, "§ $1.\n")
    .replace(/(?:^|\n)\s*-\s*\((\d+)\)\s*Absatz\s*(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|[a-zA-Z]+),?\s*/gi, "\n($1) ")
    .replace(/\((\d+)\)\s*Absatz\s*(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|[a-zA-Z]+),?\s*/gi, "($1) ")
    .replace(/^§\s*0\s*\n+Langtitel/gim, "## Langtitel")
    .replace(/^§\s*0\s*\n+Kurztitel/gim, "## Kurztitel")
    .replace(/^(\d+\.\s*Teil:[^\n]+)/gim, "## $1")
    .replace(/^([I|V|X]+\.\s*Hauptstück:[^\n]+)/gim, "## $1")
    .replace(/^([I|V|X]+\.\s*Abschnitt:[^\n]+)/gim, "## $1")
    .replace(/^§\s*(\d+[a-zA-Z]*)\s*\n+Text(?:\s*\n+([^\n]+))?/gim, (_, num, subtitle) => {
      return subtitle ? `### § ${num} ${subtitle}` : `### § ${num}`;
    })
    .replace(/\n+Text\n+/g, "\n\n");

  cleaned = deduplicateExpandedSentences(cleaned);
  return cleaned.replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function normalizeText(html: string): string {
  const strippedHtml = html
    .replace(/<span\b[^>]*class\s*=\s*["'][^"']*(?:sr-only|screenreader|visually-hidden)[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<[^>]+>/g, " ");

  const decoded = decodeHtml(strippedHtml);
  const collapsed = decoded.replace(/[ \t\f\v]+/g, " ");
  return cleanScreenreaderAndFormatting(collapsed);
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

function extractWholeLawConsolidatedAsOf(html: string): { date?: string; raw?: string } {
  const match = html.match(/Fassung\s+vom\s+(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})/i) ||
                html.match(/FassungVom=(\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4})/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    const iso = raw.includes("-") ? raw : toIsoDate(raw);
    return { date: iso, raw };
  }
  return {};
}

function extractWholeLawGesetzesnummer(html: string): string | undefined {
  const match = html.match(/Gesetzesnummer=(\d+)/i);
  return match?.[1]?.trim();
}

function extractWholeLawPromulgation(html: string): string | undefined {
  const stfMatch = html.match(/StF:\s*([^<\n]+)/i);
  return stfMatch?.[1]?.trim();
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
  const fassung = extractWholeLawConsolidatedAsOf(html);
  const gesetzesnummer = extractWholeLawGesetzesnummer(html);
  const promulgation = extractWholeLawPromulgation(html);

  return {
    title: lawTitle ?? headingTitle,
    content: extractContent(html),
    lawTitle,
    consolidatedAsOf: fassung.date,
    consolidatedAsOfRaw: fassung.raw,
    gesetzesnummer,
    promulgation,
    normStatus: looksLikeRisWholeLawNotFound(html) ? "unknown" : "in_force",
  };
}
