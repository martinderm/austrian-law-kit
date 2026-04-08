import { tryReadCachedRisArtifact } from "../cache/cache-read-reuse.js";
import { writeThroughCacheForRisArtifact } from "../cache/cache-write-through.js";
import { parseRisSegmentHtml, looksLikeRisNotFound } from "../ris/segment-parser.js";
import {
  buildRisSegmentUrl,
  extractSourceIdFromRisUrl,
  normalizeStableIdFromSourceId,
} from "../ris/segment-url.js";
import {
  buildCacheHitMeta,
  buildCacheWarnings,
  buildRefreshMeta,
  resolveSourceIdFromInputOrUrl,
} from "./ris-fetch-common.js";
import type { CachedArtifact, RisFetchSegmentInput, RisFetchSegmentOutput } from "../types/tool-contracts.js";

function buildDisplayTitle(params: {
  segmentRef?: string;
  lawAbbreviation?: string;
  lawTitle?: string;
  heading?: string;
  normStatus?: "current" | "historical" | "repealed";
  fallbackTitle: string;
}): string {
  const lawLabel = params.lawAbbreviation || params.lawTitle;
  const base = [params.segmentRef, lawLabel].filter(Boolean).join(" ").trim();
  const heading = params.heading?.trim();
  const headingSuffix = heading
    ? heading.replace(/^§\s*\d+[a-zA-Z]*\.?\s*/, "").trim().replace(/^[.–\-\s]+/, "")
    : "";
  const titleCore = base || heading || params.fallbackTitle;
  const withHeading = headingSuffix && !titleCore.includes(headingSuffix)
    ? `${titleCore} – ${headingSuffix}`
    : titleCore;

  if (params.normStatus === "repealed") return `${withHeading} (historisch/aufgehoben)`;
  if (params.normStatus === "historical") return `${withHeading} (historisch)`;
  return withHeading;
}

export async function risFetchSegmentStub(input: RisFetchSegmentInput): Promise<RisFetchSegmentOutput> {
  if (input.segmentRef && input.segmentRef.trim().length > 0) {
    return {
      ok: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "segmentRef-specific extraction is outside current ris_fetch_segment MVP scope",
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  let sourceUrl: string;
  try {
    sourceUrl = buildRisSegmentUrl({ sourceId: input.sourceId, sourceUrl: input.sourceUrl });
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid ris_fetch_segment input",
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  const sourceId = resolveSourceIdFromInputOrUrl({
    sourceId: input.sourceId,
    sourceUrl,
    extractFromUrl: extractSourceIdFromRisUrl,
  });
  if (!sourceId) {
    return {
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Unable to resolve source_id (provide sourceId or sourceUrl with Dokumentnummer)",
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  const stableId = normalizeStableIdFromSourceId(sourceId);
  const refresh = input.refresh === true;
  const cacheRead = refresh
    ? { hit: false, artifact: undefined, warning: undefined }
    : await tryReadCachedRisArtifact({ stableId, docType: "norm_segment" });
  if (cacheRead.hit && cacheRead.artifact) {
    return {
      ok: true,
      data: { artifact: cacheRead.artifact },
      meta: buildCacheHitMeta("ris_fetch_segment"),
    };
  }

  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      method: "GET",
      headers: { accept: "text/html,application/xhtml+xml" },
    });
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS segment request failed: ${error instanceof Error ? error.message : "Unknown fetch error"}`,
        retryable: true,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  if (response.status === 404) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "RIS document not found" },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS segment request returned HTTP ${response.status}`,
        details: { status: response.status, source_url: sourceUrl },
        retryable: response.status >= 500,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  let html: string;
  try {
    html = await response.text();
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS response body could not be read: ${error instanceof Error ? error.message : "Unknown body read error"}`,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  if (looksLikeRisNotFound(html)) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "RIS did not return a matching document" },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  try {
    const parsed = parseRisSegmentHtml(html);

    const displayTitle = buildDisplayTitle({
      segmentRef: parsed.segmentRef,
      lawAbbreviation: parsed.lawAbbreviation,
      lawTitle: parsed.lawTitle,
      heading: parsed.heading,
      normStatus: parsed.normStatus,
      fallbackTitle: parsed.title,
    });

    const artifact: CachedArtifact = {
      stable_id: stableId,
      frontmatter: {
        stable_id: stableId,
        source: "ris",
        source_url: sourceUrl,
        doc_type: "norm_segment",
        title: displayTitle,
        fetched_at: new Date().toISOString(),
        version_label: parsed.effectiveDateRaw ?? "unknown",
        fassung_typ: "Arbeitsfassung",
        source_id: sourceId,
        effective_date: parsed.effectiveDate,
        effective_date_raw: parsed.effectiveDateRaw,
        repealed_date: parsed.repealedDate,
        repealed_date_raw: parsed.repealedDateRaw,
        norm_status: parsed.normStatus,
        segment_ref: parsed.segmentRef,
        law_title: parsed.lawTitle,
        law_abbreviation: parsed.lawAbbreviation,
        law_slug: parsed.lawSlug,
        law_type: parsed.lawType,
        index_label: parsed.indexLabel,
        promulgation: parsed.promulgation,
        heading: parsed.heading,
      },
      content: parsed.content,
      metadata: {
        ris_extracted: {
          display_title: displayTitle,
          law_slug: parsed.lawSlug,
          heading: parsed.heading,
        },
      },
    };

    const cacheWrite = await writeThroughCacheForRisArtifact(artifact);

    const warnings = buildCacheWarnings({ cacheRead, cacheWrite });

    return {
      ok: true,
      data: {
        artifact,
      },
      meta: {
        ...(refresh ? buildRefreshMeta("ris_fetch_segment") : {
          tool: "ris_fetch_segment",
          source: "ris" as const,
          timestamp: new Date().toISOString(),
        }),
        ...(warnings.length > 0 ? { warnings } : {}),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS segment response could not be parsed: ${error instanceof Error ? error.message : "Unknown parse error"}`,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }
}
