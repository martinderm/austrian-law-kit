export type DerivedContext = {
  source_path: string | null;
  law_slug: string | null;
  segment_ref: string | null;
};

export function decodeHtmlEntities(text: string | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/&uuml;/gi, "ü")
    .replace(/&ouml;/gi, "ö")
    .replace(/&auml;/gi, "ä")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&Auml;/g, "Ä")
    .replace(/&szlig;/gi, "ß")
    .replace(/&sect;/gi, "§")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanScreenreaderAndDuplicates(text: string): string {
  let cleaned = text
    .replace(/§\s*(\d+[a-zA-Z]*)\.\s*Paragraph\s*(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|[a-zA-Z]+),?\s*/gi, "§ $1 ")
    .replace(/\((\d+)\)\s*Absatz\s*(?:\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|[a-zA-Z]+),?\s*/gi, "($1) ")
    .replace(/Paragraph\s+(\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn),\s*Absatz\s+(\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn),?\s*/gi, "§ $1 Abs $2 ")
    .replace(/Absatz\s+(\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn),?\s*/gi, "Abs $1 ");

  cleaned = cleaned.replace(/([A-ZÄÖÜ][^\n.!?]+[.!?])\s+([A-ZÄÖÜ][^\n.!?]+[.!?])/g, (full, s1, s2) => {
    const norm1 = s1.toLowerCase().replace(/paragraph|absatz|abs|\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn/g, "").replace(/[^a-z]/g, "");
    const norm2 = s2.toLowerCase().replace(/paragraph|absatz|abs|\d+|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn/g, "").replace(/[^a-z]/g, "");
    if (norm1.length > 10 && norm1 === norm2) {
      return s1.includes("§") ? s1 : s2;
    }
    return full;
  });

  return cleaned;
}

export function stripTags(html: string): string {
  const decoded = decodeHtmlEntities(
    html
      .replace(/<span\b[^>]*class\s*=\s*["'][^"']*(?:sr-only|screenreader|visually-hidden)[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, " ")
      .replace(/<!--[^]*?-->/g, " ")
      .replace(/<script[^]*?<\/script>/gi, " ")
      .replace(/<style[^]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  ) ?? "";

  return cleanScreenreaderAndDuplicates(decoded);
}

export function parseAustrianDate(raw: string | undefined): { iso?: string; raw?: string } {
  if (!raw) return {};
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{2}|\d{4})$/);
  if (!m) return { raw: trimmed };
  const [, dd, mm, yy] = m;
  const year = yy.length === 2 ? `20${yy}` : yy;
  return { iso: `${year}-${mm}-${dd}`, raw: trimmed };
}

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, { method: "GET", headers: { accept: "text/html,application/xhtml+xml" } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return await response.text();
}

export function deriveContextFromQuery(query: string): DerivedContext {
  const trimmed = query.trim();
  const pathLike = trimmed.replace(/^https?:\/\/www\.jusline\.at\//i, "").replace(/^\/+/, "");
  const match = pathLike.match(/^gesetz\/([^/]+)\/paragraf\/([^/?#]+)$/i)
    ?? pathLike.match(/^([^/]+)\/paragraf\/([^/?#]+)$/i);

  if (!match) {
    return {
      source_path: pathLike || null,
      law_slug: null,
      segment_ref: null,
    };
  }

  const lawSlug = match[1]?.toLowerCase() ?? null;
  const paragraphRaw = match[2] ?? null;

  return {
    source_path: `${lawSlug}/paragraf/${paragraphRaw}`,
    law_slug: lawSlug,
    segment_ref: paragraphRaw ? `§ ${paragraphRaw}` : null,
  };
}

export function takeTextAfterStrongLabel(html: string, label: string): string | undefined {
  const regex = new RegExp(`<p><strong>${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/strong><\\/p>\\s*([\\s\\S]*?)(?=<div>\\s*<p><strong>|<\\/div>\\s*<div>\\s*<p><strong>|<\\/div>\\s*<\\/div>)`, "i");
  const match = html.match(regex);
  const text = match?.[1] ? stripTags(match[1]) : undefined;
  return text || undefined;
}

export function takeHtmlAfterStrongLabel(html: string, label: string): string | undefined {
  const regex = new RegExp(`<p><strong>${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<\\/strong><\\/p>\\s*([\\s\\S]*?)(?=<div>\\s*<p><strong>|<\\/div>\\s*<div>\\s*<p><strong>|<\\/div>\\s*<\\/div>)`, "i");
  return html.match(regex)?.[1]?.trim() || undefined;
}
