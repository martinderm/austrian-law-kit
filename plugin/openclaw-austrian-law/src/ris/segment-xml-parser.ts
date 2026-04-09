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
    .replace(/\s*\n\s*/g, "\n")
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

function extractTextSection(xml: string): string {
  const start = xml.indexOf('<ueberschrift typ="titel" halign="j">Text</ueberschrift>');
  if (start < 0) throw new Error("Unable to locate Text section in RIS segment XML");

  const after = xml.slice(start);
  const nextMeta = after.indexOf('<ueberschrift typ="titel" halign="j">Anmerkung</ueberschrift>');
  const section = nextMeta >= 0 ? after.slice(0, nextMeta) : after;

  const paragraphPattern = /<absatz\b[^>]*ct=["']text["'][^>]*>([\s\S]*?)<\/absatz>/gi;
  const listElementPattern = /<listelem\b[^>]*ct=["']text["'][^>]*>[\s\S]*?<symbol[^>]*>([\s\S]*?)<\/symbol>([\s\S]*?)<\/listelem>/gi;
  const closingPattern = /<schlussteil\b[^>]*ct=["']text["'][^>]*>([\s\S]*?)<\/schlussteil>/gi;

  const lines: string[] = [];

  let paragraphMatch: RegExpExecArray | null;
  while ((paragraphMatch = paragraphPattern.exec(section)) !== null) {
    const text = normalizeXmlText(paragraphMatch[1] ?? "")
      .replace(/^§\s*\d+[a-zA-Z]*\.\s*/i, "")
      .trim();
    if (text) lines.push(text);
  }

  let closingMatch: RegExpExecArray | null;
  while ((closingMatch = closingPattern.exec(section)) !== null) {
    const text = normalizeXmlText(closingMatch[1] ?? "").trim();
    if (text) lines.push(text);
  }

  let listMatch: RegExpExecArray | null;
  while ((listMatch = listElementPattern.exec(section)) !== null) {
    const symbol = normalizeXmlText(listMatch[1] ?? "").trim();
    const text = normalizeXmlText(listMatch[2] ?? "").trim();
    const value = [symbol, text].filter(Boolean).join(" ").trim();
    if (value) lines.push(value);
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
