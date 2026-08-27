import { fetchHtml, parseAustrianDate, stripTags, takeHtmlAfterStrongLabel, takeTextAfterStrongLabel } from "./common.js";

export type DecisionListEntry = {
  source_url: string;
  source_id: string;
  title: string;
  geschaeftszahl?: string;
  teaser?: string;
  document_type?: string;
  court?: string;
  published_date_raw?: string;
};

export type DecisionDetailPreview = {
  source_url: string;
  source_id?: string;
  title?: string;
  geschaeftszahl?: string;
  court?: string;
  decision_date?: string;
  decision_date_raw?: string;
  rechtssatznummer?: string;
  fundstellen?: string[];
  norms?: string[];
  rechtssatz?: string;
  leitsatz?: string;
  spruch?: string;
  schlagworte?: string[];
  vorinstanzen?: string;
  entscheidungstexte?: string[];
  ecli?: string;
  updated_at?: string;
  body_markdown?: string;
  fetch_error?: string;
};

export function splitNormLines(text: string | undefined): string[] | undefined {
  if (!text) return undefined;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) return undefined;

  const withBreaks = collapsed
    .replace(/[;\t]+/g, "\n")
    .replace(/,\s+(?=[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9./()-]*\s*§)/g, "\n")
    .replace(/\s+(?=[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9./()-]+\s+§\s*\d+)/g, "\n")
    .replace(/\s+(?=(?:Art\.?|Artikel)\s*\d+)/gi, "\n");

  const normalized = withBreaks
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\s+/g, " "));

  return normalized.length > 0 ? normalized : undefined;
}

export function parseDecisionTextsFromHtml(html: string | undefined): string[] | undefined {
  if (!html) return undefined;
  const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]))
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function extractGeschaeftszahl(text?: string, title?: string, html?: string): string | undefined {
  if (html) {
    const fromLabel = takeTextAfterStrongLabel(html, "Geschäftszahl");
    if (fromLabel) return fromLabel.trim();
  }

  const sources = [title, text].filter((s): s is string => Boolean(s && s.trim()));
  for (const src of sources) {
    // 1. OGH Geschäftszahlen (z. B. 5Ob121/08t, 1 Ob 23/15k, 9 Os 12/21p, 8 ObA 45/22h, 2 Nd 1/20)
    const oghMatch = src.match(/\b(\d{1,2}\s*(?:Ob|Os|ObA|ObS|ObW|ObT|Nd|Nc|Ns|Ur)\s*\d+[0-9a-zA-Z]*(?:\/\d{2,4}[a-zA-Z]?)?)\b/i);
    if (oghMatch) return oghMatch[1].replace(/\s+/g, "");

    // 2. BVwG / LVwG Geschäftszahlen (z. B. W123 2123456-1, LVwG-AV-123/001-2022) - vor VfGH prüfen
    const adminCourtMatch = src.match(/\b([A-Z]\d{3}\s+\d{6,8}-\d+(?:\/\d+[a-zA-Z]*)?|LVwG-[A-Za-z0-9/_-]+)\b/);
    if (adminCourtMatch) return adminCourtMatch[1].trim();

    // 3. VwGH Geschäftszahlen (z. B. Ra 2021/05/0123, Ro 2019/12/0045, 2008/05/0123)
    const vwghMatch = src.match(/\b((?:Ra|Ro|Fr|Fe|Fw|Vw)\s*\d{4}\/\d{2}\/\d{4}|\d{4}\/\d{2}\/\d{4})\b/i);
    if (vwghMatch) return vwghMatch[1].trim();

    // 4. VfGH Geschäftszahlen (z. B. G 12/2023, V 45/2022, B 123/2012, E 1234/2020)
    const vfghMatch = src.match(/\b((?:G|V|B|E|K|A|KI|KR|UA)\s*\d+(?:\/\d{2,4})?|W\s*(?:[I|V|X]+|\d+)\s*\/\d{2,4})\b/i);
    if (vfghMatch) return vfghMatch[1].trim();
  }

  return undefined;
}

export function extractRechtssatznummer(text?: string, html?: string): string | undefined {
  if (html) {
    const fromLabel = takeTextAfterStrongLabel(html, "Rechtssatznummer") ?? takeTextAfterStrongLabel(html, "RS-Nummer");
    if (fromLabel) {
      const m = fromLabel.match(/\b(RS\d{7})\b/i);
      if (m) return m[1].toUpperCase();
    }
  }

  if (text) {
    const m = text.match(/\b(RS\d{7})\b/i);
    if (m) return m[1].toUpperCase();
  }

  return undefined;
}

export function extractCourt(text?: string, title?: string, html?: string): string | undefined {
  if (html) {
    const fromLabel = takeTextAfterStrongLabel(html, "Gericht");
    if (fromLabel) return fromLabel.trim();
  }

  const sources = [title, text].filter((s): s is string => Boolean(s && s.trim()));
  for (const src of sources) {
    // Höchstgerichte & Spezialgerichte
    const supremeMatch = src.match(/\b(OGH|VwGH|VfGH|BVwG|ASG Wien|HG Wien)\b/i);
    if (supremeMatch) return supremeMatch[1].trim();

    // Landesgerichte & Oberlandesgerichte mit Zusatz (z. B. LG für ZRS Wien, LG für Strafsachen Wien, OLG Wien)
    const complexCourtMatch = src.match(/\b((?:LG|OLG)\s+(?:für\s+(?:ZRS|Strafsachen)\s+[A-Za-zÄÖÜäöü]+|[A-Za-zÄÖÜäöü]+(?:\s+[A-Za-zÄÖÜäöü]+)?)|LVwG(?:\s+[A-Za-zÄÖÜäöü]+)?|BG(?:\s+[A-Za-zÄÖÜäöü]+)?)\b/i);
    if (complexCourtMatch) return complexCourtMatch[1].trim();
  }

  return undefined;
}

export function extractDecisionDate(text?: string, title?: string, html?: string): { iso?: string; raw?: string } {
  if (html) {
    const fromLabel = takeTextAfterStrongLabel(html, "Entscheidungsdatum") ?? takeTextAfterStrongLabel(html, "Datum");
    if (fromLabel) {
      const parsed = parseAustrianDate(fromLabel);
      if (parsed.iso || parsed.raw) return parsed;
    }
  }

  const sources = [title, text].filter((s): s is string => Boolean(s && s.trim()));
  for (const src of sources) {
    // Format YYYY/M/D (z. B. 2008/9/9)
    const slashMatch = src.match(/\b(\d{4})\/(\d{1,2})\/(\d{1,2})\b/);
    if (slashMatch) {
      const [, yyyy, mm, dd] = slashMatch;
      const isoMm = mm.padStart(2, "0");
      const isoDd = dd.padStart(2, "0");
      return {
        iso: `${yyyy}-${isoMm}-${isoDd}`,
        raw: `${isoDd}.${isoMm}.${yyyy}`,
      };
    }

    // Format DD.MM.YYYY
    const dotMatch = src.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
    if (dotMatch) {
      return parseAustrianDate(dotMatch[0]);
    }
  }

  return {};
}

export function extractEcli(html: string, text?: string): string | undefined {
  // 1. JUSLINE ECLI anchor structure (mit vorangestelltem oder aufgeteiltem Prefix)
  const ecliPrefixMatch = html.match(/European Case Law Identifier \(ECLI\)<\/strong><\/p>\s*([^<\s]+)\s*<a[^>]*>([^<]+)<\/a>/i);
  if (ecliPrefixMatch) {
    const combined = `${stripTags(ecliPrefixMatch[1])}${stripTags(ecliPrefixMatch[2])}`.trim().toUpperCase();
    if (combined.startsWith("ECLI:AT:")) return combined;
  }

  // 2. Direct full ECLI regex (mindestens 4 Segmente wie ECLI:AT:OGH0002:2008:...)
  const sources = [html, text].filter((s): s is string => Boolean(s));
  for (const src of sources) {
    const directMatch = src.match(/\b(ECLI:AT:[A-Za-z0-9]+:\d{4}:[A-Za-z0-9.:_-]+)\b/i);
    if (directMatch) return directMatch[1].toUpperCase();

    const genericMatch = src.match(/\b(ECLI:AT:[A-Za-z0-9.:_-]{15,})\b/i);
    if (genericMatch) return genericMatch[1].toUpperCase();
  }

  return undefined;
}

export function extractFundstellen(html: string, text?: string): string[] | undefined {
  const citations: string[] = [];
  const fromHtml = takeHtmlAfterStrongLabel(html, "Fundstelle")
    ?? takeHtmlAfterStrongLabel(html, "Fundstellen")
    ?? takeHtmlAfterStrongLabel(html, "Veröffentlichungen")
    ?? takeHtmlAfterStrongLabel(html, "Zitiervorschlag");

  const sources = [fromHtml, text].filter((s): s is string => Boolean(s));
  for (const src of sources) {
    const matches = src.matchAll(/\b((?:SZ|EvBl|wobl|immolex|ecolex|RdW|Zak|JBl|ÖJZ|ZVR|JAP|RZ|MietSlg)\s+(?:\d{4}\/\d+|\d+,\s*\d+|\d+\/\d+[a-zA-Z]?))\b/gi);
    for (const m of matches) {
      const cleaned = m[1].replace(/\s+/g, " ").trim();
      if (!citations.includes(cleaned)) {
        citations.push(cleaned);
      }
    }
  }

  return citations.length > 0 ? citations : undefined;
}

export function extractSchlagworte(html: string): string[] | undefined {
  const raw = takeTextAfterStrongLabel(html, "Schlagworte") ?? takeTextAfterStrongLabel(html, "Stichworte");
  if (!raw) return undefined;
  const items = raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

export function parseDecisionEntriesFromListHtml(html: string, maxItems: number): DecisionListEntry[] {
  const entries = [...html.matchAll(/<div class="list-group-item">([\s\S]*?)<hr>\s*<\/div>/gi)];
  const out: DecisionListEntry[] = [];
  for (const m of entries) {
    if (out.length >= maxItems) break;
    const block = m[1];
    const hrefMatch = block.match(/<a href="(\/entscheidung\/(\d+))"[^>]*><h3>([\s\S]*?)<i class="fa fa-link"><\/i><\/h3><\/a>/i);
    if (!hrefMatch) continue;
    const rawTitle = stripTags(hrefMatch[3]);
    const teaserMatch = block.match(/<p class="small">[\s\S]*?(?:<span[^>]*>Norm:<\/span>[\s\S]*?)?(?:<span[^>]*>Rechtssatz:<\/span>[\s\S]*?)?<a href="\/entscheidung\/\d+"[^>]*>mehr lesen\.\.\.<\/a>/i);
    const metaMatch = block.match(/fa-(?:balance-scale|legal)[^>]*><\/i>\s*([^|<]+)\|[\s\S]*?fa-info-circle[^>]*><\/i>\s*([^|<]+)\|[\s\S]*?fa-clock-o[^>]*><\/i>\s*([0-9]{2}\.[0-9]{2}\.[0-9]{4})/i);

    const geschaeftszahl = extractGeschaeftszahl(block, rawTitle);

    out.push({
      source_url: `https://www.jusline.at${hrefMatch[1]}`,
      source_id: hrefMatch[2],
      title: rawTitle,
      geschaeftszahl,
      ...(teaserMatch ? { teaser: stripTags(teaserMatch[0].replace(/mehr lesen\.\.\./i, "")) } : {}),
      ...(metaMatch ? { document_type: stripTags(metaMatch[1]), court: stripTags(metaMatch[2]), published_date_raw: stripTags(metaMatch[3]) } : {}),
    });
  }
  return out;
}

export async function fetchDecisionDetailPreview(url: string): Promise<DecisionDetailPreview> {
  try {
    const html = await fetchHtml(url);
    const title = stripTags(html.match(/<title>([^<]+)<\/title>/i)?.[1] ?? "");
    const fullText = stripTags(html);

    const normHtml = takeHtmlAfterStrongLabel(html, "Norm");
    const norms = splitNormLines(normHtml ? stripTags(normHtml) : undefined);
    const rechtssatz = takeTextAfterStrongLabel(html, "Rechtssatz");
    const leitsatz = takeTextAfterStrongLabel(html, "Leitsatz");
    const spruch = takeTextAfterStrongLabel(html, "Spruch") ?? takeTextAfterStrongLabel(html, "Tenor");
    const vorinstanzen = takeTextAfterStrongLabel(html, "Verfahrensgang") ?? takeTextAfterStrongLabel(html, "Vorinstanzen");
    const schlagworte = extractSchlagworte(html);
    const fundstellen = extractFundstellen(html, fullText);
    const entscheidungstexte = parseDecisionTextsFromHtml(takeHtmlAfterStrongLabel(html, "Entscheidungstexte"));
    const updatedMatch = html.match(/Zuletzt aktualisiert am<\/strong><\/p>\s*([0-9]{2}\.[0-9]{2}\.[0-9]{4})/i);

    const ecli = extractEcli(html, fullText);
    const updated = updatedMatch?.[1];
    const geschaeftszahl = extractGeschaeftszahl(fullText, title, html);
    const rechtssatznummer = extractRechtssatznummer(fullText, html);
    const court = extractCourt(fullText, title, html);
    const dateParsed = extractDecisionDate(fullText, title, html);

    const bodyLines: string[] = [];
    if (norms?.length) {
      bodyLines.push("### Normen", "");
      for (const norm of norms) bodyLines.push(`- ${norm}`);
      bodyLines.push("");
    }
    if (rechtssatz) {
      bodyLines.push("### Rechtssatz", "", rechtssatz, "");
    } else if (leitsatz) {
      bodyLines.push("### Leitsatz", "", leitsatz, "");
    }
    if (spruch) {
      bodyLines.push("### Spruch", "", spruch, "");
    }
    if (fundstellen?.length) {
      bodyLines.push("### Fundstellen", "");
      for (const f of fundstellen) bodyLines.push(`- ${f}`);
      bodyLines.push("");
    }
    if (entscheidungstexte?.length) {
      bodyLines.push("### Entscheidungstexte", "");
      for (const entry of entscheidungstexte) bodyLines.push(`- ${entry}`);
      bodyLines.push("");
    }
    if (vorinstanzen) {
      bodyLines.push("### Verfahrensgang", "", vorinstanzen, "");
    }
    if (schlagworte?.length) {
      bodyLines.push("### Schlagworte", "");
      for (const s of schlagworte) bodyLines.push(`- ${s}`);
      bodyLines.push("");
    }
    if (ecli || updated || geschaeftszahl || rechtssatznummer) {
      bodyLines.push("### Metadaten", "");
      if (geschaeftszahl) bodyLines.push(`- Geschäftszahl: ${geschaeftszahl}`);
      if (rechtssatznummer) bodyLines.push(`- Rechtssatznummer: ${rechtssatznummer}`);
      if (court) bodyLines.push(`- Gericht: ${court}`);
      if (dateParsed.raw) bodyLines.push(`- Datum: ${dateParsed.raw}`);
      if (ecli) bodyLines.push(`- ECLI: ${ecli}`);
      if (updated) bodyLines.push(`- Zuletzt aktualisiert: ${updated}`);
      bodyLines.push("");
    }

    const bodyMarkdown = bodyLines.join("\n").trim();

    return {
      source_url: url,
      ...(title ? { title } : {}),
      ...(geschaeftszahl ? { geschaeftszahl } : {}),
      ...(court ? { court } : {}),
      ...(dateParsed.iso ? { decision_date: dateParsed.iso } : {}),
      ...(dateParsed.raw ? { decision_date_raw: dateParsed.raw } : {}),
      ...(rechtssatznummer ? { rechtssatznummer } : {}),
      ...(fundstellen?.length ? { fundstellen } : {}),
      ...(norms ? { norms } : {}),
      ...(rechtssatz ? { rechtssatz } : {}),
      ...(leitsatz ? { leitsatz } : {}),
      ...(spruch ? { spruch } : {}),
      ...(schlagworte?.length ? { schlagworte } : {}),
      ...(vorinstanzen ? { vorinstanzen } : {}),
      ...(entscheidungstexte ? { entscheidungstexte } : {}),
      ...(ecli ? { ecli } : {}),
      ...(updated ? { updated_at: updated } : {}),
      ...(bodyMarkdown ? { body_markdown: bodyMarkdown } : {}),
    };
  } catch (error) {
    return { source_url: url, fetch_error: error instanceof Error ? error.message : String(error) };
  }
}

export function hasUsefulDecisionDetail(detail: DecisionDetailPreview, teaser?: string): boolean {
  return Boolean(
    detail.rechtssatz
    || detail.leitsatz
    || detail.spruch
    || detail.geschaeftszahl
    || detail.rechtssatznummer
    || (detail.entscheidungstexte && detail.entscheidungstexte.length > 0)
    || (detail.norms && detail.norms.length > 0)
    || (detail.fundstellen && detail.fundstellen.length > 0)
    || detail.ecli
    || detail.updated_at
    || teaser,
  );
}
