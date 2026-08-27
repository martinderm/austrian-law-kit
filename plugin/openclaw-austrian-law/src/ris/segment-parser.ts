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
  consolidatedAsOf?: string;
  consolidatedAsOfRaw?: string;
  gesetzesnummer?: string;
  dokumentnummer?: string;
  eli?: string;
  normStatus?: "in_force" | "current" | "historical" | "repealed" | "unknown";
  indexLabel?: string;
  promulgation?: string;
  heading?: string;
  segmentRef?: string;
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
  if (!/[ÃÂâ�Ǭ�]/.test(text)) return text;

  const replacements: Array<[RegExp, string]> = [
    [/â€“/g, "–"],
    [/â€”/g, "—"],
    [/â€ž/g, "„"],
    [/â€œ/g, "“"],
    [/â€/g, "“"],
    [/â€/g, "”"],
    [/â€™/g, "’"],
    [/â€˜/g, "‘"],
    [/â€¦/g, "…"],
    [/â€/g, "–"],
    [/Ã¤/g, "ä"],
    [/Ã¶/g, "ö"],
    [/Ã¼/g, "ü"],
    [/Ã„/g, "Ä"],
    [/Ã–/g, "Ö"],
    [/Ãœ/g, "Ü"],
    [/ÃŸ/g, "ß"],
    [/Ã¡/g, "á"],
    [/Ã©/g, "é"],
    [/Ã¨/g, "è"],
    [/Ã /g, "à"],
    [/Â§/g, "§"],
    [/Â /g, " "],
    [/Ǭ/g, "ü"],
    [/�Y/g, "ß"],
    [/��/g, "§"],
    [/�\?/g, "–"],
  ];

  let fixed = text;
  for (const [pattern, replacement] of replacements) {
    fixed = fixed.replace(pattern, replacement);
  }

  return fixed;
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
  const patterns = [
    new RegExp(
      `<div\\b[^>]*class\\s*=\\s*["'][^"']*(?:contentBlock|p|embeddedContent)[^"']*["'][^>]*>[\\s\\S]*?<h[1-6]\\b[^>]*>[\\s\\S]*?${escaped}[\\s\\S]*?<\\/h[1-6]>([\\s\\S]*?)<\\/div>`,
      "i",
    ),
    new RegExp(
      `<div\\b[^>]*class\\s*=\\s*["'][^"']*p[^"']*["'][^>]*>[\\s\\S]*?<h3>\\s*${escaped}\\s*<\\/h3>([\\s\\S]*?)<\\/div>`,
      "i",
    ),
    new RegExp(
      `<div\\b[^>]*class\\s*=\\s*["'][^"']*contentBlock[^"']*["'][^>]*>[\\s\\S]*?<h1\\b[^>]*class\\s*=\\s*["'][^"']*Titel[^"']*["'][^>]*>[\\s\\S]*?${escaped}[\\s\\S]*?<\\/h1>([\\s\\S]*?)<\\/div>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const raw = html.match(pattern)?.[1];
    if (!raw) continue;
    const value = normalizeText(raw);
    if (value.length > 0) return value;
  }

  return undefined;
}

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return undefined;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function normalizeSegmentRef(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value
    .replace(/\bParagraph\s+\d+[a-zA-Z]*\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return normalized.length > 0 ? normalized : undefined;
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
    .replace(/Schlagworte[\s\S]*$/i, "")
    .replace(/Zuletzt aktualisiert am[\s\S]*$/i, "")
    .replace(/Dokumentnummer[\s\S]*$/i, "")
    .replace(/Bitte klicken Sie auf einen der folgenden Links,[\s\S]*$/i, "")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractTextFromNodePreservingBlocks(html: string): string {
  return decodeHtml(html)
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<span\b[^>]*class\s*=\s*["'][^"']*sr-only[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<span\b[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/gi, "$1")
    .replace(/<span\b[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectTopLevelBlocks(html: string): string[] {
  const blocks: string[] = [];

  const headingPattern = /<h[45]\b[^>]*>[\s\S]*?<\/h[45]>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingPattern.exec(html)) !== null) {
    blocks.push(headingMatch[0]);
  }

  const absPattern = /<div\b[^>]*class\s*=\s*["'][^"']*Abs[^"']*AlignJustify[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;
  let absMatch: RegExpExecArray | null;
  while ((absMatch = absPattern.exec(html)) !== null) {
    blocks.push(absMatch[0]);
  }

  const paragraphPattern = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  let paragraphMatch: RegExpExecArray | null;
  while ((paragraphMatch = paragraphPattern.exec(html)) !== null) {
    blocks.push(paragraphMatch[0]);
  }

  const listPattern = /<ol\b[^>]*class\s*=\s*["'][^"']*wai-list[^"']*["'][^>]*>[\s\S]*?<\/ol>/gi;
  let listMatch: RegExpExecArray | null;
  while ((listMatch = listPattern.exec(html)) !== null) {
    blocks.push(listMatch[0]);
  }

  return blocks;
}

function renderList(html: string): string {
  const itemPattern = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  const rendered: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(html)) !== null) {
    const itemHtml = match[1] ?? "";
    const markerMatch = itemHtml.match(/<div\b[^>]*class\s*=\s*["'][^"']*AufzaehlungE\d+[^"']*["'][^>]*>\s*(?:<span\b[^>]*aria-hidden\s*=\s*["']true["'][^>]*>)?\s*([a-z]\))/i);
    const marker = markerMatch?.[1]?.trim();
    const text = extractTextFromNodePreservingBlocks(itemHtml)
      .replace(/^[a-z]\)\s*/i, "")
      .trim();

    if (!text) continue;
    rendered.push(marker ? `- ${marker} ${text}` : `- ${text}`);
  }

  return rendered.join("\n");
}

function promoteOrphanHeadings(text: string): string {
  return text
    .replace(/(^|\n\n)([A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+\.)\n(§\s*\d+[a-zA-Z]*\.)/gm, "$1## $2\n## $3")
    .replace(/(^|\n\n)([A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+\.)\n(Art\.?\s*\d+[a-zA-Z]*\.)/gm, "$1## $2\n## $3");
}

function renderSegmentMarkdown(html: string): string {
  const headingMatches = Array.from(html.matchAll(/<h[45]\b[^>]*>([\s\S]*?)<\/h[45]>/gi));
  const absMatches = Array.from(html.matchAll(/<div\b[^>]*class\s*=\s*["'][^"']*Abs[^"']*AlignJustify[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi));
  const listMatches = Array.from(html.matchAll(/<ol\b[^>]*class\s*=\s*["'][^"']*wai-list[^"']*["'][^>]*>([\s\S]*?)<\/ol>/gi));
  const paragraphMatches = Array.from(html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi));

  const rendered: string[] = [];

  for (const match of headingMatches) {
    const heading = extractTextFromNodePreservingBlocks(match[0]);
    if (heading) rendered.push(`## ${heading}`);
  }

  if (absMatches.length > 0) {
    for (let i = 0; i < absMatches.length; i += 1) {
      const text = extractTextFromNodePreservingBlocks(absMatches[i]?.[0] ?? "")
        .replace(/\n([a-z]\))/gi, "\n- $1")
        .replace(/\n-\s+([a-z]\))/gi, "\n- $1")
        .trim();
      if (text) rendered.push(text);

      if (i === 0 && listMatches[0]?.[0]) {
        const list = renderList(listMatches[0][0]);
        if (list) rendered.push(list);
      }
    }
  } else {
    for (const match of paragraphMatches) {
      const text = extractTextFromNodePreservingBlocks(match[0]).trim();
      if (text) rendered.push(text);
    }
  }

  const normalized = promoteOrphanHeadings(
    rendered
      .join("\n\n")
      .replace(/^##\s+/gm, "## ")
      .replace(/\n-\s+/g, "\n- ")
      .replace(/(^|\n\n)(\((?:\d+[a-z]?)\))/g, "$1$2")
      .replace(/([.!?])\s+(\((?:\d+[a-z]?)\))/g, "$1\n\n$2")
      .replace(/\n{3,}/g, "\n\n"),
  );

  return cleanupVisibleText(normalized);
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
    const normalizedBlock = normalizeForDedupe(block);
    if (!normalizedBlock || normalizedSeen.has(normalizedBlock)) continue;
    normalizedSeen.add(normalizedBlock);
    result.push(block);
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
    const content = dedupeAdjacentParagraphs(promoteOrphanHeadings(renderSegmentMarkdown(textContainerMatch[1])));
    if (content && content.length > 30) return content;

    const fallbackContent = dedupeAdjacentParagraphs(promoteOrphanHeadings(normalizeText(textContainerMatch[1])));
    if (fallbackContent) return fallbackContent;
  }

  const textHeadingIndex = html.indexOf(">Text</h1>");
  if (textHeadingIndex >= 0) {
    const afterHeading = html.slice(textHeadingIndex + ">Text</h1>".length);
    const nextContentBlockIndex = afterHeading.search(/<div\b[^>]*class\s*=\s*["'][^"']*contentBlock[^"']*["'][^>]*>/i);
    const nextMainCloseIndex = afterHeading.search(/<\/main>|<\/body>/i);
    const endCandidates = [nextContentBlockIndex, nextMainCloseIndex].filter((value) => value >= 0);
    const textSection = endCandidates.length > 0
      ? afterHeading.slice(0, Math.min(...endCandidates))
      : afterHeading;

    const rendered = dedupeAdjacentParagraphs(promoteOrphanHeadings(renderSegmentMarkdown(textSection)));
    if (rendered && rendered.length > 30) return rendered;

    const fallbackContent = dedupeAdjacentParagraphs(promoteOrphanHeadings(normalizeText(textSection)));
    if (fallbackContent) return fallbackContent;
  }

  const contentBlock = extractFirstNonEmpty(html, [
    /<div\b[^>]*class\s*=\s*["'][^"']*documentContent[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<body\b[^>]*>([\s\S]*?)<\/body>/i,
  ]);

  if (contentBlock) return dedupeAdjacentParagraphs(promoteOrphanHeadings(contentBlock));
  throw new Error("Unable to extract content from RIS document page");
}

function extractHeading(html: string): string | undefined {
  return extractFirstNonEmpty(html, [
    /<h5\b[^>]*class\s*=\s*["'][^"']*GldSymbol[^"']*["'][^>]*>[\s\S]*?<span[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/i,
    /<h4\b[^>]*class\s*=\s*["'][^"']*UeberschrPara[^"']*["'][^>]*>[\s\S]*?<span[^>]*aria-hidden\s*=\s*["']true["'][^>]*>([\s\S]*?)<\/span>/i,
    /<h4\b[^>]*class\s*=\s*["'][^"']*UeberschrPara[^"']*["'][^>]*>([\s\S]*?)<\/h4>/i,
  ]) ?? undefined;
}

function extractConsolidatedAsOf(html: string): { date?: string; raw?: string } {
  const directHeading = extractFieldByHeading(html, "Fassung vom");
  if (directHeading) {
    return { date: toIsoDate(directHeading), raw: directHeading };
  }
  const match = html.match(/Fassung\s+vom\s+(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})/i) ||
                html.match(/FassungVom=(\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}\.\d{4})/i);
  if (match && match[1]) {
    const raw = match[1];
    const iso = raw.includes("-") ? raw : toIsoDate(raw);
    return { date: iso, raw };
  }
  return {};
}

function extractGesetzesnummer(html: string): string | undefined {
  const direct = extractFieldByHeading(html, "Gesetzesnummer");
  if (direct && /^\d+$/.test(direct.trim())) return direct.trim();
  const match = html.match(/Gesetzesnummer=(\d+)/i) || html.match(/data-norm-popup=["'](\d+)["']/i);
  return match?.[1]?.trim();
}

function extractDokumentnummer(html: string): string | undefined {
  const direct = extractFieldByHeading(html, "Dokumentnummer");
  if (direct && /^[A-Z0-9]+$/i.test(direct.trim())) return direct.trim();
  const match = html.match(/Dokumentnummer=([A-Z0-9]+)/i) || html.match(/\/Bundesnormen\/([A-Z0-9]+)\//i);
  return match?.[1]?.trim();
}

function extractEli(html: string): string | undefined {
  const direct = extractFieldByHeading(html, "ELI");
  if (direct && direct.startsWith("http")) return direct.trim();
  const match = html.match(/href=["'](\/eli\/bgbl\/[^"']+)["']/i);
  if (match?.[1]) {
    return `https://www.ris.bka.gv.at${match[1]}`;
  }
  return undefined;
}

function deriveNormStatus(params: {
  promulgation?: string;
  repealedDate?: string;
  effectiveDate?: string;
}): "in_force" | "current" | "historical" | "repealed" | "unknown" {
  if (params.promulgation && /aufgehoben/i.test(params.promulgation)) return "repealed";
  if (params.repealedDate) return "repealed";
  if (params.effectiveDate) return "in_force";
  return "unknown";
}

export function looksLikeRisNotFound(html: string): boolean {
  return /kein treffer|nicht gefunden|es wurden keine dokumente/i.test(normalizeText(html));
}

export function parseRisSegmentHtml(html: string): ParsedRisSegment {
  const lawAbbreviation = extractFieldByHeading(html, "Abkürzung") ?? extractFieldByHeading(html, "Abkuerzung");
  const effectiveDateRaw = extractFieldByHeading(html, "Inkrafttretensdatum");
  const repealedDateRaw = extractFieldByHeading(html, "Außerkrafttretensdatum") ?? extractFieldByHeading(html, "Aussenkrafttretensdatum");
  const promulgation = extractFieldByHeading(html, "Kundmachungsorgan");
  const heading = extractHeading(html);
  const segmentRef = normalizeSegmentRef(
    extractFieldByHeading(html, "§/Artikel/Anlage") ?? extractFieldByHeading(html, "/Artikel/Anlage"),
  );
  const effectiveDate = toIsoDate(effectiveDateRaw);
  const repealedDate = toIsoDate(repealedDateRaw);
  const fassung = extractConsolidatedAsOf(html);
  const gesetzesnummer = extractGesetzesnummer(html);
  const dokumentnummer = extractDokumentnummer(html);
  const eli = extractEli(html);

  return {
    title: extractTitle(html),
    content: extractContent(html),
    lawTitle: extractFieldByHeading(html, "Kurztitel"),
    lawAbbreviation,
    lawSlug: deriveLawSlug(lawAbbreviation),
    lawType: extractFieldByHeading(html, "Typ"),
    effectiveDate,
    effectiveDateRaw,
    repealedDate,
    repealedDateRaw,
    consolidatedAsOf: fassung.date,
    consolidatedAsOfRaw: fassung.raw,
    gesetzesnummer,
    dokumentnummer,
    eli,
    normStatus: deriveNormStatus({ promulgation, repealedDate, effectiveDate }),
    indexLabel: extractFieldByHeading(html, "Index"),
    promulgation,
    heading,
    segmentRef,
  };
}
