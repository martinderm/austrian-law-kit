import { fetchHtml, stripTags, takeHtmlAfterStrongLabel, takeTextAfterStrongLabel } from "./common.js";

export type DecisionListEntry = {
  source_url: string;
  source_id: string;
  title: string;
  teaser?: string;
  document_type?: string;
  court?: string;
  published_date_raw?: string;
};

export type DecisionDetailPreview = {
  source_url: string;
  title?: string;
  norms?: string[];
  rechtssatz?: string;
  entscheidungstexte?: string[];
  ecli?: string;
  updated_at?: string;
  body_markdown?: string;
  fetch_error?: string;
};

function splitNormLines(text: string | undefined): string[] | undefined {
  if (!text) return undefined;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (!collapsed) return undefined;

  const withBreaks = collapsed
    .replace(/\s+(?=(?:[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9./()-]*\s+)?§\s*\d+[a-zA-Z0-9]*)/g, "\n")
    .replace(/\s+(?=[A-ZÄÖÜ][A-Za-zÄÖÜäöüß0-9./()-]+\s+§\s*\d+)/g, "\n")
    .replace(/\s+(?=Art\.?\s*\d+)/g, "\n");

  const normalized = withBreaks
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.replace(/\s+/g, " "));

  return normalized.length > 0 ? normalized : undefined;
}

function parseDecisionTextsFromHtml(html: string | undefined): string[] | undefined {
  if (!html) return undefined;
  const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]))
    .map((t) => t.replace(/\s+/g, " ").trim())
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
    const teaserMatch = block.match(/<p class="small">[\s\S]*?(?:<span[^>]*>Norm:<\/span>[\s\S]*?)?(?:<span[^>]*>Rechtssatz:<\/span>[\s\S]*?)?<a href="\/entscheidung\/\d+"[^>]*>mehr lesen\.\.\.<\/a>/i);
    const metaMatch = block.match(/fa-(?:balance-scale|legal)[^>]*><\/i>\s*([^|<]+)\|[\s\S]*?fa-info-circle[^>]*><\/i>\s*([^|<]+)\|[\s\S]*?fa-clock-o[^>]*><\/i>\s*([0-9]{2}\.[0-9]{2}\.[0-9]{4})/i);

    out.push({
      source_url: `https://www.jusline.at${hrefMatch[1]}`,
      source_id: hrefMatch[2],
      title: stripTags(hrefMatch[3]),
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

    const normHtml = takeHtmlAfterStrongLabel(html, "Norm");
    const norms = splitNormLines(normHtml ? stripTags(normHtml) : undefined);
    const rechtssatz = takeTextAfterStrongLabel(html, "Rechtssatz");
    const entscheidungstexte = parseDecisionTextsFromHtml(takeHtmlAfterStrongLabel(html, "Entscheidungstexte"));
    const ecliPrefixMatch = html.match(/European Case Law Identifier \(ECLI\)<\/strong><\/p>\s*([^<\s]+)\s*<a[^>]*>([^<]+)<\/a>/i);
    const updatedMatch = html.match(/Zuletzt aktualisiert am<\/strong><\/p>\s*([0-9]{2}\.[0-9]{2}\.[0-9]{4})/i);

    const ecli = ecliPrefixMatch ? `${stripTags(ecliPrefixMatch[1])}${stripTags(ecliPrefixMatch[2])}` : undefined;
    const updated = updatedMatch?.[1];

    const bodyLines: string[] = [];
    if (norms?.length) {
      bodyLines.push("### Normen", "");
      for (const norm of norms) bodyLines.push(`- ${norm}`);
      bodyLines.push("");
    }
    if (rechtssatz) {
      bodyLines.push("### Rechtssatz", "", rechtssatz, "");
    }
    if (entscheidungstexte?.length) {
      bodyLines.push("### Entscheidungstexte", "");
      for (const entry of entscheidungstexte) bodyLines.push(`- ${entry}`);
      bodyLines.push("");
    }
    if (ecli || updated) {
      bodyLines.push("### Metadaten", "");
      if (ecli) bodyLines.push(`- ECLI: ${ecli}`);
      if (updated) bodyLines.push(`- Zuletzt aktualisiert: ${updated}`);
      bodyLines.push("");
    }

    const bodyMarkdown = bodyLines.join("\n").trim();

    return {
      source_url: url,
      ...(title ? { title } : {}),
      ...(norms ? { norms } : {}),
      ...(rechtssatz ? { rechtssatz } : {}),
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
    || (detail.entscheidungstexte && detail.entscheidungstexte.length > 0)
    || (detail.norms && detail.norms.length > 0)
    || detail.ecli
    || detail.updated_at
    || teaser,
  );
}
