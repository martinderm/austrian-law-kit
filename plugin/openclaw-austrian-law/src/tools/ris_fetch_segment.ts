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
  resolveSourceIdFromInputOrUrl,
} from "./ris-fetch-common.js";
import type { CachedArtifact, RisFetchSegmentInput, RisFetchSegmentOutput } from "../types/tool-contracts.js";

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
  const cacheRead = await tryReadCachedRisArtifact({ stableId, docType: "norm_segment" });
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

    const artifact: CachedArtifact = {
      stable_id: stableId,
      frontmatter: {
        stable_id: stableId,
        source: "ris",
        source_url: sourceUrl,
        doc_type: "norm_segment",
        title: parsed.title,
        fetched_at: new Date().toISOString(),
        version_label: "unknown",
        fassung_typ: "Arbeitsfassung",
        source_id: sourceId,
      },
      content: parsed.content,
    };

    const cacheWrite = await writeThroughCacheForRisArtifact(artifact);

    const warnings = buildCacheWarnings({ cacheRead, cacheWrite });

    return {
      ok: true,
      data: {
        artifact,
      },
      meta: {
        tool: "ris_fetch_segment",
        source: "ris",
        timestamp: new Date().toISOString(),
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
