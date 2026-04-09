import { normalizeAustrianState } from "../ris/collections.js";
import type { SearchHit } from "../types/tool-contracts.js";
import type { RisApiContentUrl, RisApiDocumentReference, RisApiSearchCandidate, RisApiSearchRequest, RisApiScope } from "./types.js";

function stripHtml(text: string | undefined): string | undefined {
  if (!text) return undefined;
  return text.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractContentUrls(ref: RisApiDocumentReference): RisApiContentUrl[] {
  const contentReferences = asArray(ref.Data?.Dokumentliste?.ContentReference as { Urls?: { ContentUrl?: RisApiContentUrl | RisApiContentUrl[] } } | { Urls?: { ContentUrl?: RisApiContentUrl | RisApiContentUrl[] } }[] | undefined);
  return contentReferences.flatMap((entry) => asArray(entry?.Urls?.ContentUrl));
}

function findContentUrl(items: RisApiContentUrl[], dataType: string): string | undefined {
  return items.find((item) => item.DataType?.toLowerCase() === dataType.toLowerCase())?.Url;
}

function stableIdFromSourceId(sourceId: string): string {
  return `ris:doc:${sourceId.trim().toLowerCase()}`;
}

function buildTitle(parts: Array<string | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" – ");
}

function resolveScopedEli(ref: RisApiDocumentReference, isBund: boolean): string | undefined {
  if (isBund) {
    return ref.Data?.Metadaten?.Bundesrecht?.Eli ?? ref.Data?.Metadaten?.Bundesrecht?.BrKons?.Eli;
  }
  return ref.Data?.Metadaten?.Landesrecht?.LrKons?.Eli;
}

function matchesRequestState(scope: RisApiScope, request: RisApiSearchRequest, candidateState: string | undefined): boolean {
  if (scope !== "land") return true;
  if (!request.state) return true;
  return normalizeAustrianState(candidateState) === request.state;
}

function maybeMatchReason(hit: SearchHit, request: RisApiSearchRequest, sectionRef: string | undefined): string | undefined {
  const title = hit.title.toLowerCase();
  const lawTitle = request.lawTitle?.toLowerCase();
  const keywords = request.keywords?.toLowerCase();

  if (lawTitle && sectionRef && title.includes(lawTitle.toLowerCase()) && title.includes(sectionRef.toLowerCase())) {
    return "official RIS API result matches law and section reference";
  }
  if (lawTitle && title.includes(lawTitle)) {
    return "official RIS API result matches requested law title";
  }
  if (keywords && title.includes(keywords)) {
    return "official RIS API result matches requested keywords";
  }
  return "official RIS API discovery result";
}

export function mapApiDocumentReferences(
  refs: RisApiDocumentReference[],
  request: RisApiSearchRequest,
): { hits: RisApiSearchCandidate[]; warnings: string[]; notices: string[] } {
  const warnings: string[] = [];
  const notices: string[] = [];
  const hits: RisApiSearchCandidate[] = [];
  const seen = new Set<string>();
  let filteredStateMismatches = 0;

  for (const ref of refs) {
    const technical = ref.Data?.Metadaten?.Technisch;
    const general = ref.Data?.Metadaten?.Allgemein;
    const bundesrecht = ref.Data?.Metadaten?.Bundesrecht;
    const landesrecht = ref.Data?.Metadaten?.Landesrecht;

    const sourceId = technical?.ID?.trim();
    if (!sourceId) continue;

    const app = technical?.Applikation;
    const isBund = app === "BrKons";
    const isLand = app === "LrKons";
    if (!isBund && !isLand) continue;

    const scoped = isBund ? bundesrecht : landesrecht;
    const scopedDetails = isBund ? bundesrecht?.BrKons : landesrecht?.LrKons;
    const state = landesrecht?.Bundesland;

    if (!matchesRequestState(request.scope, request, state)) {
      filteredStateMismatches += 1;
      continue;
    }

    const contentUrls = extractContentUrls(ref);
    const htmlUrl = findContentUrl(contentUrls, "Html");
    const xmlUrl = findContentUrl(contentUrls, "Xml");
    const sourceUrl = general?.DokumentUrl ?? resolveScopedEli(ref, isBund) ?? htmlUrl ?? xmlUrl;
    if (!sourceUrl) continue;
    if (seen.has(sourceUrl)) continue;

    const sectionRef = scopedDetails?.ArtikelParagraphAnlage;
    const lawTitle = scoped?.Kurztitel ?? stripHtml(scoped?.Titel) ?? sourceId;
    const title = buildTitle([
      lawTitle,
      sectionRef && sectionRef !== "§ 0" ? sectionRef : undefined,
    ]);

    const hit: SearchHit = {
      stable_id: stableIdFromSourceId(sourceId),
      source_id: sourceId,
      title,
      source_url: sourceUrl,
      match_reason: maybeMatchReason({ stable_id: stableIdFromSourceId(sourceId), source_id: sourceId, title, source_url: sourceUrl }, request, sectionRef),
      application: isBund ? "BrKons" : "LrKons",
      scope: isBund ? "bund" : "land",
      state: normalizeAustrianState(state),
      law_id: scopedDetails?.Gesetzesnummer,
      content_url: htmlUrl,
      whole_law_url: scopedDetails?.GesamteRechtsvorschriftUrl,
      document_url: general?.DokumentUrl,
      document_type: scopedDetails?.Dokumenttyp,
      legal_type: scopedDetails?.Typ,
      section_ref: sectionRef,
      paragraph_number: scopedDetails?.Paragraphnummer,
      law_abbreviation: isBund ? bundesrecht?.BrKons?.Abkuerzung : undefined,
      promulgation: scopedDetails?.Kundmachungsorgan,
      published_at: general?.Veroeffentlicht,
      changed_at: general?.Geaendert,
    };

    hits.push({
      hit,
      application: isBund ? "BrKons" : "LrKons",
      scope: isBund ? "bund" : "land",
      state: normalizeAustrianState(state),
      lawId: scopedDetails?.Gesetzesnummer,
      lawAbbreviation: isBund ? bundesrecht?.BrKons?.Abkuerzung : undefined,
      contentUrl: htmlUrl,
      xmlContentUrl: xmlUrl,
      wholeLawUrl: scopedDetails?.GesamteRechtsvorschriftUrl,
      documentUrl: general?.DokumentUrl,
    });
    seen.add(sourceUrl);
  }

  if (request.scope === "land" && request.state) {
    notices.push(`api_land_state_filter: ${request.state}`);
  }
  if (filteredStateMismatches > 0) {
    warnings.push(`api_state_mismatch_filtered_count: ${filteredStateMismatches}`);
  }

  return { hits, warnings, notices };
}
