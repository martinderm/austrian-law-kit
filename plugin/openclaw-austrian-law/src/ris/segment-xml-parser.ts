import { getViennaTodayDate } from "./verification-receipt.js";

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
    .replace(/<gdash\b[^>]*\/>/gi, "-")
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

function extractTopLevelBlocks(input: string): Array<{ tag: string; block: string }> {
  const blocks: Array<{ tag: string; block: string }> = [];
  const startRe = /<([a-z][a-z0-9]*)\b[^>]*>/gi;
  let cursor = 0;
  while (cursor < input.length) {
    startRe.lastIndex = cursor;
    const match = startRe.exec(input);
    if (!match) {
      if (input.slice(cursor).trim().length > 0) {
        throw new Error("Unclassified content in RIS segment text section");
      }
      break;
    }
    if (input.slice(cursor, match.index).trim().length > 0) {
      throw new Error("Unclassified content in RIS segment text section");
    }
    const tag = (match[1] ?? "").toLowerCase();
    const raw = match[0];
    if (raw.endsWith("/>")) {
      cursor = match.index + raw.length;
      continue;
    }
    const end = findMatchingTag(input, match.index, tag);
    if (end < 0) throw new Error(`Unterminated <${tag}> block in RIS segment text section`);
    blocks.push({ tag, block: input.slice(match.index, end) });
    cursor = end;
  }
  return blocks;
}

function extractTextSection(xml: string): string {
  const marker = '<ueberschrift typ="titel" halign="j">Text</ueberschrift>';
  const start = xml.indexOf(marker);
  if (start < 0) throw new Error("Unable to locate Text section in RIS segment XML");

  const after = xml.slice(start + marker.length);
  const boundaries = [after.indexOf('<ueberschrift typ="titel"'), after.indexOf("</abschnitt>")]
    .filter((index) => index >= 0);
  const section = boundaries.length > 0 ? after.slice(0, Math.min(...boundaries)) : after;

  const lines: string[] = [];
  for (const { tag, block } of extractTopLevelBlocks(section)) {
    if (tag === "ueberschrift") {
      const headingText = normalizeXmlText(block).trim();
      if (headingText) lines.push(`## ${headingText}`);
      continue;
    }
    if (tag === "absatz") {
      const ct = block.match(/^<absatz\b[^>]*\bct=["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (ct !== "text") {
        throw new Error(`Unclassified top-level block in RIS segment text section: <absatz ct="${ct ?? ""}">`);
      }
      const inner = block.replace(/^<absatz\b[^>]*>/i, "").replace(/<\/absatz>$/i, "");
      const paragraph = normalizeLeadingParagraphMarker(normalizeXmlText(inner));
      if (paragraph) lines.push(paragraph);
      continue;
    }
    if (tag === "liste") {
      lines.push(...renderXmlList(block, 0));
      continue;
    }
    if (tag === "schlussteil") {
      const text = normalizeXmlText(block).trim();
      if (text) lines.push(text);
      continue;
    }
    throw new Error(`Unclassified top-level block in RIS segment text section: <${tag}>`);
  }

  const result = lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!result) throw new Error("Unable to extract text content from RIS segment XML");
  return result;
}

function resolveStichtagIso(stichtag?: string): string {
  if (stichtag) {
    const trimmed = stichtag.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const iso = toIsoDate(trimmed);
    if (iso) return iso;
  }
  return getViennaTodayDate();
}

function deriveNormStatus(params: {
  promulgation?: string;
  repealedDate?: string;
  effectiveDate?: string;
  stichtag?: string;
}): "in_force" | "current" | "historical" | "repealed" | "unknown" {
  if (params.promulgation && /aufgehoben/i.test(params.promulgation)) return "repealed";
  const stichtag = resolveStichtagIso(params.stichtag);
  if (params.repealedDate && params.repealedDate < stichtag) return "repealed";
  if (params.effectiveDate) {
    return stichtag < params.effectiveDate ? "unknown" : "in_force";
  }
  return "unknown";
}

function extractXmlConsolidatedAsOf(xml: string): { date?: string; raw?: string } {
  const direct = extractByCt(xml, "fassung_vom");
  if (direct) {
    return { date: toIsoDate(direct), raw: direct };
  }
  const match = xml.match(/<fassung_vom>([\s\S]*?)<\/fassung_vom>/i) ||
                xml.match(/Fassung\s+vom\s+(\d{1,2}\.\d{1,2}\.\d{4}|\d{4}-\d{2}-\d{2})/i);
  if (match && match[1]) {
    const raw = match[1].trim();
    const iso = raw.includes("-") ? raw : toIsoDate(raw);
    return { date: iso, raw };
  }
  return {};
}

function extractXmlDokumentnummer(xml: string): string | undefined {
  const byCt = extractByCt(xml, "dokumentnummer");
  if (byCt && /^[A-Z0-9]+$/i.test(byCt.trim())) return byCt.trim();
  const byShortCt = extractByCt(xml, "doknr");
  if (byShortCt && /^NOR\d+$/i.test(byShortCt.trim())) return byShortCt.trim();
  const match = xml.match(/<dokumentnummer>([\s\S]*?)<\/dokumentnummer>/i) ||
                xml.match(/<id>([A-Z0-9]+)<\/id>/i);
  return match?.[1]?.trim();
}

function extractXmlGesetzesnummer(xml: string): string | undefined {
  const byCt = extractByCt(xml, "gesetzesnummer");
  if (byCt && /^\d+$/.test(byCt.trim())) return byCt.trim();
  const byShortCt = extractByCt(xml, "gesnr");
  if (byShortCt && /^\d+$/.test(byShortCt.trim())) return byShortCt.trim();
  const match = xml.match(/<gesetzesnummer>([\s\S]*?)<\/gesetzesnummer>/i);
  return match?.[1]?.trim();
}

function extractXmlEli(xml: string): string | undefined {
  const byCt = extractByCt(xml, "eli");
  if (byCt && byCt.startsWith("http")) return byCt.trim();
  const match = xml.match(/<eli>([\s\S]*?)<\/eli>/i) || xml.match(/(\/eli\/bgbl\/[^\s<"']+)/i);
  if (match?.[1]) {
    const val = match[1].trim();
    return val.startsWith("http") ? val : `https://www.ris.bka.gv.at${val}`;
  }
  return undefined;
}

export function parseRisSegmentXml(xml: string, options: { stichtag?: string } = {}): ParsedRisSegmentXml {
  const lawTitle = extractByCt(xml, "kurztitel");
  const lawAbbreviation = extractByCt(xml, "abkuerzung");
  const effectiveDateRaw = extractByCt(xml, "ikra");
  const repealedDateRaw = extractByCt(xml, "akra");
  const promulgation = extractByCt(xml, "kundmachungsorgan");
  const segmentRef = extractByCt(xml, "artikel_anlage");
  const effectiveDate = toIsoDate(effectiveDateRaw);
  const repealedDate = toIsoDate(repealedDateRaw);
  const fassung = extractXmlConsolidatedAsOf(xml);
  const gesetzesnummer = extractXmlGesetzesnummer(xml);
  const dokumentnummer = extractXmlDokumentnummer(xml);
  const eli = extractXmlEli(xml);

  return {
    title: extractTitle(xml),
    content: extractTextSection(xml),
    lawTitle,
    lawAbbreviation,
    lawSlug: deriveLawSlug(lawAbbreviation),
    lawType: extractByCt(xml, "typ"),
    effectiveDate,
    effectiveDateRaw,
    repealedDate,
    repealedDateRaw,
    consolidatedAsOf: fassung.date,
    consolidatedAsOfRaw: fassung.raw,
    gesetzesnummer,
    dokumentnummer,
    eli,
    normStatus: deriveNormStatus({ promulgation, repealedDate, effectiveDate, stichtag: options.stichtag }),
    indexLabel: extractByCt(xml, "index"),
    promulgation,
    heading: extractParaHeading(xml),
    segmentRef,
  };
}
