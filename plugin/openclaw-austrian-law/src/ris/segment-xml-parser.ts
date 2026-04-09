export interface ParsedRisSegmentXml {
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

function decodeXml(text: string): string {
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

function normalizeXmlText(text: string): string {
  return decodeXml(text)
    .replace(/<tab\b[^>]*\/>/gi, " ")
    .replace(/<feld\b[^>]*>[\s\S]*?<\/feld>/gi, " ")
    .replace(/<span\b[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<i\b[^>]*>/gi, "")
    .replace(/<\/i>/gi, "")
    .replace(/<gldsym\b[^>]*>/gi, "")
    .replace(/<\/gldsym>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .trim();
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

function extractByCt(xml: string, ct: string): string | undefined {
  const escaped = ct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(new RegExp(`<absatz\\b[^>]*ct=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/absatz>`, "i"));
  if (!match?.[1]) return undefined;
  const value = normalizeXmlText(match[1]);
  return value.length > 0 ? value : undefined;
}

function extractParaHeading(xml: string): string | undefined {
  const match = xml.match(/<ueberschrift\b[^>]*typ=["']para["'][^>]*ct=["']text["'][^>]*>([\s\S]*?)<\/ueberschrift>/i);
  if (!match?.[1]) return undefined;
  const value = normalizeXmlText(match[1]);
  return value.length > 0 ? value : undefined;
}

function extractTitle(xml: string): string {
  const lawTitle = extractByCt(xml, "kurztitel");
  const segmentRef = extractByCt(xml, "artikel_anlage");
  const title = [lawTitle, segmentRef].filter(Boolean).join(" ").trim();
  return title || "RIS Dokument";
}

function normalizeLeadingParagraphMarker(text: string): string {
  return text.replace(/^§\s*\d+[a-zA-Z]*\.\s*/i, "").trim();
}

function skipWs(input: string, index: number): number {
  while (index < input.length && /\s/.test(input[index] ?? "")) index += 1;
  return index;
}

function findMatchingTag(input: string, start: number, tagName: string): number {
  const tokenRe = new RegExp(`<(/?)${tagName}\\b[^>]*>`, "gi");
  tokenRe.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tokenRe.exec(input)) !== null) {
    if (match[1] === "/") {
      depth -= 1;
      if (depth === 0) return tokenRe.lastIndex;
    } else {
      depth += 1;
    }
  }
  return -1;
}

function splitTopLevelTags(input: string, tagName: string): string[] {
  const out: string[] = [];
  const startRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = startRe.exec(input)) !== null) {
    const start = match.index;
    const end = findMatchingTag(input, start, tagName);
    if (end < 0) break;
    out.push(input.slice(start, end));
    startRe.lastIndex = end;
  }
  return out;
}

function extractImmediateTagContent(input: string, tagName: string): string | undefined {
  const re = new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return input.match(re)?.[1];
}

function extractFirstTopLevelTag(input: string, tagName: string): string | undefined {
  const startRe = new RegExp(`<${tagName}\\b[^>]*>`, "i");
  const match = startRe.exec(input);
  if (!match || match.index < 0) return undefined;
  const end = findMatchingTag(input, match.index, tagName);
  if (end < 0) return undefined;
  return input.slice(match.index, end);
}

function parseListelem(listElemBlock: string): { symbol?: string; text?: string } {
  const body = listElemBlock
    .replace(/^<listelem\b[^>]*>/i, "")
    .replace(/<\/listelem>$/i, "");

  const symbol = normalizeXmlText(extractImmediateTagContent(body, "symbol") ?? "").trim() || undefined;
  let textPart = body;
  const symbolBlock = body.match(/<symbol\b[^>]*>[\s\S]*?<\/symbol>/i)?.[0];
  if (symbolBlock) textPart = textPart.replace(symbolBlock, "");
  const text = normalizeXmlText(textPart).trim() || undefined;
  return { symbol, text };
}

function renderXmlList(listBlock: string, indent = 0): string[] {
  const lines: string[] = [];
  const content = listBlock.replace(/^<liste\b[^>]*>/i, "").replace(/<\/liste>$/i, "");
  let cursor = 0;

  while (cursor < content.length) {
    cursor = skipWs(content, cursor);
    if (cursor >= content.length) break;

    const nextEnum = content.indexOf("<aufzaehlung", cursor);
    const nextClosing = content.indexOf("<schlussteil", cursor);

    let nextType: "aufzaehlung" | "schlussteil" | null = null;
    let nextIndex = -1;

    if (nextEnum >= 0 && (nextClosing < 0 || nextEnum < nextClosing)) {
      nextType = "aufzaehlung";
      nextIndex = nextEnum;
    } else if (nextClosing >= 0) {
      nextType = "schlussteil";
      nextIndex = nextClosing;
    }

    if (!nextType || nextIndex < 0) break;

    if (nextType === "schlussteil") {
      const end = findMatchingTag(content, nextIndex, "schlussteil");
      if (end < 0) break;
      const block = content.slice(nextIndex, end);
      const text = normalizeXmlText(block).trim();
      if (text) lines.push(`${"  ".repeat(indent)}${text}`.trimEnd());
      cursor = end;
      continue;
    }

    const end = findMatchingTag(content, nextIndex, "aufzaehlung");
    if (end < 0) break;
    const enumBlock = content.slice(nextIndex, end);
    const enumIndentRaw = enumBlock.match(/\bebene=["']([^"']+)["']/i)?.[1];
    const enumLevel = Number.parseFloat(enumIndentRaw ?? "1");
    const effectiveIndent = Number.isFinite(enumLevel) ? Math.max(indent, Math.round(enumLevel) - 1) : indent;
    const enumBody = enumBlock.replace(/^<aufzaehlung\b[^>]*>/i, "").replace(/<\/aufzaehlung>$/i, "");

    const enumItems = splitTopLevelTags(enumBody, "listelem");
    for (const item of enumItems) {
      const parsed = parseListelem(item);
      const bulletText = [parsed.symbol, parsed.text].filter(Boolean).join(" ").trim();
      if (bulletText) lines.push(`${"  ".repeat(effectiveIndent)}- ${bulletText}`.trimEnd());
    }

    cursor = end;
  }

  return lines;
}

function extractTextSection(xml: string): string {
  const start = xml.indexOf('<ueberschrift typ="titel" halign="j">Text</ueberschrift>');
  if (start < 0) throw new Error("Unable to locate Text section in RIS segment XML");

  const after = xml.slice(start);
  const nextMeta = after.indexOf('<ueberschrift typ="titel" halign="j">Anmerkung</ueberschrift>');
  const section = nextMeta >= 0 ? after.slice(0, nextMeta) : after;

  const heading = extractParaHeading(section);
  const paragraphPattern = /<absatz\b[^>]*ct=["']text["'][^>]*>([\s\S]*?)<\/absatz>/gi;
  const paragraphs = Array.from(section.matchAll(paragraphPattern))
    .map((match) => normalizeLeadingParagraphMarker(normalizeXmlText(match[1] ?? "")))
    .filter(Boolean);

  const lines: string[] = [];
  if (heading) lines.push(`## ${heading}`);
  if (paragraphs[0]) lines.push(paragraphs[0]);

  const topLevelLists = splitTopLevelTags(section, "liste");
  if (topLevelLists[0]) {
    lines.push(...renderXmlList(topLevelLists[0], 0));
  }

  for (const paragraph of paragraphs.slice(1)) {
    lines.push(paragraph);
  }

  const result = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!result) throw new Error("Unable to extract text content from RIS segment XML");
  return result;
}

function deriveNormStatus(params: { promulgation?: string; repealedDate?: string; }): "current" | "historical" | "repealed" | undefined {
  if (params.promulgation && /aufgehoben/i.test(params.promulgation)) return "repealed";
  if (params.repealedDate) return "repealed";
  return "current";
}

export function parseRisSegmentXml(xml: string): ParsedRisSegmentXml {
  const lawTitle = extractByCt(xml, "kurztitel");
  const lawAbbreviation = extractByCt(xml, "abkuerzung");
  const effectiveDateRaw = extractByCt(xml, "ikra");
  const repealedDateRaw = extractByCt(xml, "akra");
  const promulgation = extractByCt(xml, "kundmachungsorgan");
  const segmentRef = extractByCt(xml, "artikel_anlage");
  const repealedDate = toIsoDate(repealedDateRaw);

  return {
    title: extractTitle(xml),
    content: extractTextSection(xml),
    lawTitle,
    lawAbbreviation,
    lawSlug: deriveLawSlug(lawAbbreviation),
    lawType: extractByCt(xml, "typ"),
    effectiveDate: toIsoDate(effectiveDateRaw),
    effectiveDateRaw,
    repealedDate,
    repealedDateRaw,
    normStatus: deriveNormStatus({ promulgation, repealedDate }),
    indexLabel: extractByCt(xml, "index"),
    promulgation,
    heading: extractParaHeading(xml),
    segmentRef,
  };
}
