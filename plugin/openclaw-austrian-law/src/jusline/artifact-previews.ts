import { buildSerializedArtifact } from "../cache/serialize-artifact.js";
import type { CachedArtifact, SearchHit } from "../types/tool-contracts.js";
import { fetchCommentDetailPreview, hasUsefulCommentDetail } from "./comment-detail.js";
import { deriveContextFromQuery, type DerivedContext, decodeHtmlEntities, fetchHtml, parseAustrianDate } from "./common.js";
import { fetchDecisionDetailPreview, hasUsefulDecisionDetail, parseDecisionEntriesFromListHtml } from "./decision-detail.js";

type LiveCaseKind = "discussions" | "decisions";

type LiveCaseInput = {
  query: string;
  limit?: number;
  refresh?: boolean;
};

export type PreviewArtifactRecord = {
  stable_id: string;
  markdown_path: string;
  metadata_path: string;
  markdown_content: string;
  metadata_content: string;
};

export type SkippedPreviewRecord = {
  reason: string;
  source_url: string;
  source_id?: string;
  title?: string;
};

async function buildCommentArtifact(hit: SearchHit, input: LiveCaseInput, context: DerivedContext): Promise<{ artifact?: CachedArtifact; skipped?: SkippedPreviewRecord }> {
  const fetchedAt = new Date().toISOString();
  const title = decodeHtmlEntities(hit.title) ?? hit.title;
  const snippet = decodeHtmlEntities(hit.snippet);
  const detail = await fetchCommentDetailPreview(hit.source_url);

  if (!hasUsefulCommentDetail(detail, snippet)) {
    return {
      skipped: {
        reason: detail.fetch_error ? `comment-detail-missing:${detail.fetch_error}` : "comment-detail-missing",
        source_url: hit.source_url,
        source_id: hit.source_id,
        title,
      },
    };
  }

  const contentLines: string[] = [
    `# ${title}`,
    "",
    `- Quelle: JUSLINE (Sekundärquelle)`,
    `- Abruf-URL: ${hit.source_url}`,
  ];
  if (context.source_path) contentLines.push(`- Normpfad: ${context.source_path}`);
  if (context.law_slug) contentLines.push(`- Norm: ${context.law_slug}`);
  if (context.segment_ref) contentLines.push(`- Segment: ${context.segment_ref}`);
  if (hit.source_id) contentLines.push(`- JUSLINE-ID: ${hit.source_id}`);
  if (detail.author_name) contentLines.push(`- Autor/in: ${detail.author_name}`);
  if (detail.published_date_raw) contentLines.push(`- Erstellt am: ${detail.published_date_raw}`);
  if (detail.rating_value != null) contentLines.push(`- Bewertung: ${String(detail.rating_value).replace('.', ',')} bei ${detail.rating_count ?? 0} Bewertungen`);
  if (detail.views_count != null) contentLines.push(`- Aufrufe: ${detail.views_count}`);
  contentLines.push("", "## Extrahierter Kontext", "");
  if (detail.body_markdown) contentLines.push(detail.body_markdown);
  else if (snippet) contentLines.push(snippet);
  else contentLines.push("Kein Snippet extrahiert; Treffer nur über Titel/Link erkannt.");
  contentLines.push("", "## Hinweise", "", "- Nicht-amtliche Sekundärquelle.", "- RIS bleibt für Normwortlaut und Primärmetadaten maßgeblich.", "- Dieses Artefakt ist ein Kontextbaustein zur referenzierten Normstelle.");

  return {
    artifact: {
      stable_id: hit.stable_id,
      frontmatter: {
        stable_id: hit.stable_id,
        source: "jusline",
        source_url: hit.source_url,
        doc_type: "commentary",
        title,
        fetched_at: fetchedAt,
        version_label: "nicht-amtlich",
        fassung_typ: "Arbeitsfassung",
        source_id: hit.source_id,
        language: "de",
        jurisdiction: "AT",
        segment_ref: context.segment_ref ?? undefined,
        law_slug: context.law_slug ?? undefined,
        norm_ref: context.source_path ?? undefined,
        notes: "Sekundärquelle; RIS bleibt für Wortlaut und Metadaten maßgeblich.",
        ...(detail.published_date ? { published_date: detail.published_date } : {}),
        ...(detail.published_date_raw ? { published_date_raw: detail.published_date_raw } : {}),
        ...(detail.author_name ? { author_name: detail.author_name } : {}),
        ...(detail.author_profile_url ? { author_url: detail.author_profile_url } : {}),
        ...(detail.rating_value != null ? { rating_value: detail.rating_value } : {}),
        ...(detail.rating_count != null ? { rating_count: detail.rating_count } : {}),
        ...(detail.views_count != null ? { views_count: detail.views_count } : {}),
        ...(detail.comment_version ? { comment_version: detail.comment_version } : {}),
        ...(detail.citation ? { citation: detail.citation } : {}),
      },
      content: contentLines.join("\n"),
      metadata: {
        tool: "jusline_fetch_discussions",
        query: input.query,
        source_path: context.source_path,
        extracted_snippet: snippet,
        comment_detail_preview: detail,
        preview_only: true,
      },
    },
  };
}

async function buildDecisionArtifactsFromListHit(hit: SearchHit, input: LiveCaseInput, context: DerivedContext): Promise<{ artifacts: CachedArtifact[]; skipped: SkippedPreviewRecord[] }> {
  const listHtml = await fetchHtml(hit.source_url);
  const detailEntries = parseDecisionEntriesFromListHtml(listHtml, 3);
  const artifacts: CachedArtifact[] = [];
  const skipped: SkippedPreviewRecord[] = [];

  for (const entry of detailEntries) {
    const detail = await fetchDecisionDetailPreview(entry.source_url);
    const stableId = `jusline:dec:${entry.source_id}`;
    const parsedDate = parseAustrianDate(entry.published_date_raw ?? detail.updated_at);

    if (!hasUsefulDecisionDetail(detail, entry.teaser)) {
      skipped.push({
        reason: detail.fetch_error ? `decision-detail-missing:${detail.fetch_error}` : "decision-detail-missing",
        source_url: entry.source_url,
        source_id: entry.source_id,
        title: entry.title,
      });
      continue;
    }

    const effectiveCourt = detail.court ?? entry.court;
    const effectiveGz = detail.geschaeftszahl ?? entry.geschaeftszahl;
    const effectiveDate = detail.decision_date ?? parsedDate.iso;
    const effectiveDateRaw = detail.decision_date_raw ?? parsedDate.raw ?? entry.published_date_raw;

    const contentLines: string[] = [
      `# ${entry.title}`,
      "",
      `- Quelle: JUSLINE (Sekundärquelle)`,
      `- Abruf-URL: ${entry.source_url}`,
    ];
    if (context.source_path) contentLines.push(`- Normpfad: ${context.source_path}`);
    if (context.law_slug) contentLines.push(`- Norm: ${context.law_slug}`);
    if (context.segment_ref) contentLines.push(`- Segment: ${context.segment_ref}`);
    contentLines.push(`- JUSLINE-ID: ${entry.source_id}`);
    if (effectiveGz) contentLines.push(`- Geschäftszahl: ${effectiveGz}`);
    if (detail.rechtssatznummer) contentLines.push(`- Rechtssatznummer: ${detail.rechtssatznummer}`);
    if (effectiveCourt) contentLines.push(`- Gericht: ${effectiveCourt}`);
    if (entry.document_type) contentLines.push(`- Dokumenttyp: ${entry.document_type}`);
    if (effectiveDateRaw) contentLines.push(`- Datum: ${effectiveDateRaw}`);

    if (detail.norms && detail.norms.length > 0) {
      contentLines.push("", "### Normen", "");
      for (const norm of detail.norms) contentLines.push(`- ${norm}`);
    }
    if (detail.rechtssatz) {
      contentLines.push("", "### Rechtssatz", "", detail.rechtssatz);
    } else if (detail.leitsatz) {
      contentLines.push("", "### Leitsatz", "", detail.leitsatz);
    } else if (entry.teaser) {
      contentLines.push("", "### Leitsatz / Vorschau", "", `> ${entry.teaser}`);
    }
    if (detail.spruch) {
      contentLines.push("", "### Spruch", "", detail.spruch);
    }
    if (detail.fundstellen && detail.fundstellen.length > 0) {
      contentLines.push("", "### Fundstellen", "");
      for (const f of detail.fundstellen) contentLines.push(`- ${f}`);
    }
    if (detail.entscheidungstexte && detail.entscheidungstexte.length > 0) {
      contentLines.push("", "### Entscheidungstexte", "");
      for (const text of detail.entscheidungstexte) contentLines.push(`- ${text}`);
    }
    if (detail.vorinstanzen) {
      contentLines.push("", "### Verfahrensgang", "", detail.vorinstanzen);
    }
    if (detail.schlagworte && detail.schlagworte.length > 0) {
      contentLines.push("", "### Schlagworte", "");
      for (const s of detail.schlagworte) contentLines.push(`- ${s}`);
    }
    if (detail.ecli || detail.updated_at) {
      contentLines.push("", "### Metadaten", "");
      if (detail.ecli) contentLines.push(`- ECLI: ${detail.ecli}`);
      if (detail.updated_at) contentLines.push(`- Zuletzt aktualisiert: ${detail.updated_at}`);
    }

    const hasSubstantiveDetail = Boolean(
      detail.rechtssatz
      || detail.leitsatz
      || detail.spruch
      || detail.geschaeftszahl
      || detail.rechtssatznummer
      || (detail.entscheidungstexte && detail.entscheidungstexte.length > 0)
      || (detail.norms && detail.norms.length > 0)
      || (detail.fundstellen && detail.fundstellen.length > 0)
      || detail.ecli,
    );

    contentLines.push("", "## Hinweise", "", "- Nicht-amtliche Sekundärquelle.", "- RIS bleibt für Normwortlaut und Primärmetadaten maßgeblich.", "- Dieses Artefakt basiert primär auf dem Listentreffer; Detailseiten werden nur ergänzend verwertet.");

    artifacts.push({
      stable_id: stableId,
      frontmatter: {
        stable_id: stableId,
        source: "jusline",
        source_url: entry.source_url,
        doc_type: "decision",
        title: entry.title,
        fetched_at: new Date().toISOString(),
        version_label: "nicht-amtlich",
        fassung_typ: "Arbeitsfassung",
        source_id: entry.source_id,
        language: "de",
        jurisdiction: "AT",
        segment_ref: context.segment_ref ?? undefined,
        law_slug: context.law_slug ?? undefined,
        norm_ref: context.source_path ?? undefined,
        notes: "Sekundärquelle; RIS bleibt für Wortlaut und Metadaten maßgeblich.",
        ...(effectiveDate ? { published_date: effectiveDate } : {}),
        ...(effectiveDateRaw ? { published_date_raw: effectiveDateRaw } : {}),
        ...(detail.ecli ? { decision_ref: detail.ecli, ecli: detail.ecli } : {}),
        ...(effectiveGz ? { case_number: effectiveGz } : {}),
        ...(detail.rechtssatznummer ? { rechtssatznummer: detail.rechtssatznummer } : {}),
        ...(effectiveCourt ? { court: effectiveCourt } : {}),
        ...(entry.document_type ? { index_label: entry.document_type } : {}),
        ...(detail.fundstellen && detail.fundstellen.length > 0 ? { fundstellen: detail.fundstellen } : {}),
        ...(detail.norms && detail.norms.length > 0 ? { norms: detail.norms } : {}),
      },
      content: contentLines.join("\n"),
      metadata: {
        tool: "jusline_list_decisions",
        query: input.query,
        source_path: context.source_path,
        list_source_url: hit.source_url,
        list_stable_id: hit.stable_id,
        extracted_snippet: decodeHtmlEntities(hit.snippet),
        decision_list_entry: entry,
        decision_detail_preview: detail,
        decision_detail_used_as_primary_source: hasSubstantiveDetail,
        preview_only: true,
      },
    });
  }

  return { artifacts, skipped };
}

export async function buildJuslineArtifactPreviews(args: { hits: SearchHit[]; kind: LiveCaseKind; input: LiveCaseInput; context?: DerivedContext }): Promise<{ previews: PreviewArtifactRecord[]; skipped: SkippedPreviewRecord[] }> {
  const previews: PreviewArtifactRecord[] = [];
  const skipped: SkippedPreviewRecord[] = [];
  const context = args.context ?? deriveContextFromQuery(args.input.query);

  for (const hit of args.hits) {
    if (args.kind === "decisions") {
      const result = await buildDecisionArtifactsFromListHit(hit, args.input, context);
      for (const artifact of result.artifacts) {
        const serialized = buildSerializedArtifact(artifact);
        previews.push({
          stable_id: artifact.stable_id,
          markdown_path: serialized.markdownPath.replace(/jusline\/decisions\//, "jusline/decisions/detail/"),
          metadata_path: serialized.metadataPath,
          markdown_content: serialized.markdownContent,
          metadata_content: serialized.metadataContent,
        });
      }
      skipped.push(...result.skipped);
      continue;
    }

    const result = await buildCommentArtifact(hit, args.input, context);
    if (result.artifact) {
      const serialized = buildSerializedArtifact(result.artifact);
      previews.push({
        stable_id: result.artifact.stable_id,
        markdown_path: serialized.markdownPath.replace(/jusline\/materials\//, "jusline/materials/detail/"),
        metadata_path: serialized.metadataPath,
        markdown_content: serialized.markdownContent,
        metadata_content: serialized.metadataContent,
      });
    }
    if (result.skipped) skipped.push(result.skipped);
  }

  return { previews, skipped };
}

export { deriveContextFromQuery };
