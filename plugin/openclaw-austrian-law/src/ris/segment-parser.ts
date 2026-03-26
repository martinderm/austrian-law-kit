export interface ParsedRisSegment {
  title: string;
  content: string;
  lawTitle?: string;
  lawAbbreviation?: string;
  lawSlug?: string;
  lawType?: string;
  effectiveDate?: string;
  effectiveDateRaw?: string;
  repealedDate?: string;
  repealedDateRaw?: string;
  normStatus?: "current" | "historical" | "repealed";
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
    .replace(/&#167;/gi, "§")
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
  const pre = lawAbbreviation
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
  const slug = pre.replace(/\d+/g, "").replace(/[^a-z]+/g, "");
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

function cleanupVisibleText(text: string): string {
  return text
    .replace(/Paragraph\s+\d+[a-zA-Z]*,\s*[^.]+\.\s*-\s*/g, "")
    .replace(/\((\d+)\)\s*Absatz\s+[^,]+,\s*/g, "($1) ")
    .replace(/-\s*([a-z])\)\s*Litera\s+\1\s*/gi, "- $1) ")
    .replace(/\s+(\(\d+\))/g, "\n$1")
    .replace(/\s+([a-z]\))/gi, "\n$1")
    .replace(/Schlagworte[\s\S]*$/i, "")
    .replace(/Zuletzt aktualisiert am[\s\S]*$/i, "")
    .replace(/Dokumentnummer[\s\S]*$/i, "")
    .replace(/Bitte klicken Sie auf einen der folgenden Links,[\s\S]*$/i, "")
    .replace(/\s+-\s+/g, "\n- ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeVisibleTextHtml(html: string): string {
  const ariaHiddenParts = Array.from(
    html.matchAll(/<span\b[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/gi),
  )
    .map((match) => normalizeText(match[1] ?? ""))
    .filter((value) => value.length > 0);

  if (ariaHiddenParts.length > 0) {
    return cleanupVisibleText(ariaHiddenParts.join("\n\n"));
  }

  return html.replace(/<span\b[^>]*class\s*=\s*["'][^"']*sr-only[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "");
}

function normalizeForDedupe(text: string): string {
  return text
    .toLowerCase()
    .replace(/paragraph/g, "§")
    .replace(/absatz/g, "abs")
    .replace(/abs\./g, "abs")
    .replace(/eins/g, "1")
    .replace(/zwei/g, "2")
    .replace(/drei/g, "3")
    .replace(/vier/g, "4")
    .replace(/fuenf|fünf/g, "5")
    .replace(/sechs/g, "6")
    .replace(/sieben/g, "7")
    .replace(/acht/g, "8")
    .replace(/neun/g, "9")
    .replace(/zehn/g, "10")
    .replace(/[.,;:]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeAdjacentParagraphs(text: string): string {
  const blocks = text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const normalizedSeen = new Set<string>();
  const result: string[] = [];

  for (const block of blocks) {
    const sentenceParts = block
      .split(/(?<=[.!?;])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const dedupedSentences: string[] = [];
    const sentenceSeen = new Set<string>();
    for (const sentence of sentenceParts) {
      const normalizedSentence = normalizeForDedupe(sentence);
      if (sentenceSeen.has(normalizedSentence)) continue;
      sentenceSeen.add(normalizedSentence);
      dedupedSentences.push(sentence);
    }

    const dedupedBlock = dedupedSentences.join(" ").trim();
    const normalizedBlock = normalizeForDedupe(dedupedBlock);
    if (!normalizedBlock || normalizedSeen.has(normalizedBlock)) continue;
    normalizedSeen.add(normalizedBlock);
    result.push(dedupedBlock);
  }

  return result.join("\n\n");
}

function extractContent(html: string): string {
  const textContainerMatch = html.match(
    /<div\b[^>]*id\s*=\s*["'][^"']*_TextContainer_[^"']*["'][^>]*class\s*=\s*["'][^"']*embeddedContent[^"']*["'][^>]*>[\s\S]*?<h3\b[^>]*>\s*Text\s*<\/h3>\s*<div>([\s\S]*?)<\/div>\s*<\/div>\s*(?=<div\b[^>]*id\s*=\s*["'][^"']*_(?:AnmerkungContainer|VeroeffentlichungsdatumAenderungsdatumContainer|GesetzesnummerContainer|EliContainer|AlteDokumentnummerContainer|KurztitelContainer|AbkuerzungContainer|TypContainer|IndexContainer|KundmachungsorganContainer|InkrafttretensdatumContainer|AussenkrafttretensdatumContainer)_[^"']*["'])/i,
  ) ?? html.match(
    /<div\b[^>]*id\s*=\s*["'][^"']*_TextContainer_[^"']*["'][^>]*class\s*=\s*["'][^"']*embeddedContent[^"']*["'][^>]*>[\s\S]*?<h3\b[^>]*>\s*Text\s*<\/h3>\s*<div>([\s\S]*?)<\/div>\s*<\/div>/i,
  );

  if (textContainerMatch?.[1]) {
    const visibleHtml = sanitizeVisibleTextHtml(textContainerMatch[1]);
    const content = dedupeAdjacentParagraphs(normalizeText(visibleHtml));
    if (content && content.length > 30) return content;

    const fallbackContent = dedupeAdjacentParagraphs(normalizeText(textContainerMatch[1]));
    if (fallbackContent) return fallbackContent;
  }

  const contentBlock = extractFirstNonEmpty(html, [
    /<div\b[^>]*class\s*=\s*["'][^"']*contentBlock[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div\b[^>]*class\s*=\s*["'][^"']*documentContent[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]);

  if (contentBlock) return dedupeAdjacentParagraphs(contentBlock);
  throw new Error("Unable to extract content from RIS document page");
}

function extractHeading(html: string): string | undefined {
  return extractFirstNonEmpty(html, [
    /<h5\b[^>]*class\s*=\s*["'][^"']*GldSymbol[^"']*["'][^>]*>[\s\S]*?<span[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/i,
    /<h4\b[^>]*class\s*=\s*["'][^"']*UeberschrPara[^"']*["'][^>]*>[\s\S]*?<span[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/i,
    /<h4\b[^>]*class\s*=\s*["'][^"']*UeberschrPara[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i,
  ]) ?? undefined;
}

function deriveNormStatus(params: {
  promulgation?: string;
  repealedDate?: string;
}): "current" | "historical" | "repealed" | undefined {
  if (params.promulgation && /aufgehoben/i.test(params.promulgation)) return "repealed";
  if (params.repealedDate) return "repealed";
  return "current";
}

export function looksLikeRisNotFound(html: string): boolean {
  return /kein treffer|nicht gefunden|es wurden keine dokumente/i.test(normalizeText(html));
}

export function parseRisSegmentHtml(html: string): ParsedRisSegment {
  const lawAbbreviation = extractFieldByHeading(html, "Abkürzung") ?? extractFieldByHeading(html, "Abkuerzung");
  const effectiveDateRaw = extractFieldByHeading(html, "Inkrafttretensdatum");
  const repealedDateRaw = extractFieldByHeading(html, "Außerkrafttretensdatum") ?? extractFieldByHeading(html, "Außerkrafttretensdatum");
  const promulgation = extractFieldByHeading(html, "Kundmachungsorgan");
  const heading = extractHeading(html);
  const segmentRef = extractFieldByHeading(html, "§/Artikel/Anlage") ?? extractFieldByHeading(html, "�/Artikel/Anlage");
  const repealedDate = toIsoDate(repealedDateRaw);

  return {
    title: extractTitle(html),
    content: extractContent(html),
    lawTitle: extractFieldByHeading(html, "Kurztitel"),
    lawAbbreviation,
    lawSlug: deriveLawSlug(lawAbbreviation),
    lawType: extractFieldByHeading(html, "Typ"),
    effectiveDate: toIsoDate(effectiveDateRaw),
    effectiveDateRaw,
    repealedDate,
    repealedDateRaw,
    normStatus: deriveNormStatus({ promulgation, repealedDate }),
    indexLabel: extractFieldByHeading(html, "Index"),
    promulgation,
    heading,
    segmentRef,
  };
}
