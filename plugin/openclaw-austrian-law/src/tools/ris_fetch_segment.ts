import { tryReadCachedRisArtifact } from "../cache/cache-read-reuse.js";
import { writeThroughCacheForRisArtifact } from "../cache/cache-write-through.js";
import { lookupRisApiBySourceId } from "../ris-api/lookup.js";
import { parseRisSegmentHtml, looksLikeRisNotFound } from "../ris/segment-parser.js";
import { parseRisSegmentXml } from "../ris/segment-xml-parser.js";
import {
  buildRisSegmentUrl,
  extractSourceIdFromRisUrl,
  normalizeStableIdFromSourceId,
  validateSafeRisUrl,
} from "../ris/segment-url.js";
import { buildVerificationReceipt } from "../ris/verification-receipt.js";
import {
  buildCacheHitMeta,
  buildCacheWarnings,
  buildRefreshMeta,
  resolveSourceIdFromInputOrUrl,
} from "./ris-fetch-common.js";
import type { CachedArtifact, RetrievalMethod, RisFetchSegmentInput, RisFetchSegmentOutput } from "../types/tool-contracts.js";

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
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: "segmentRef-specific extraction is outside current ris_fetch_segment MVP scope",
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  const initialRetrievalMethod: RetrievalMethod = input.sourceUrl || input.contentUrl
    ? ((input.sourceUrl?.includes("/eli/") || input.contentUrl?.includes("/eli/")) ? "eli_url" : "norm_document_url")
    : "direct_source_id";

  let sourceUrl: string;
  try {
    if (input.contentUrl?.trim()) {
      validateSafeRisUrl(input.contentUrl.trim());
      sourceUrl = input.contentUrl.trim();
    } else {
      sourceUrl = buildRisSegmentUrl({ sourceId: input.sourceId, sourceUrl: input.sourceUrl });
    }
  } catch (error) {
    return {
      success: false,
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
      success: false,
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
    const receipt = buildVerificationReceipt({
      sourceId,
      gesetzesnummer: (cacheRead.artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined,
      dokumentnummer: sourceId,
      eli: cacheRead.artifact.frontmatter.source_url?.includes("/eli/") ? cacheRead.artifact.frontmatter.source_url : undefined,
      paragraf: cacheRead.artifact.frontmatter.segment_ref,
      consolidatedAsOf: cacheRead.artifact.frontmatter.effective_date,
      effectiveFrom: cacheRead.artifact.frontmatter.effective_date,
      effectiveTo: cacheRead.artifact.frontmatter.repealed_date,
      kundmachungsorgan: cacheRead.artifact.frontmatter.promulgation,
      content: cacheRead.artifact.content,
      retrievalMethod: "cache_hit",
      stichtag: input.stichtag,
      normStatus: cacheRead.artifact.frontmatter.norm_status,
    });
    cacheRead.artifact.metadata = {
      ...(cacheRead.artifact.metadata ?? {}),
      verification_receipt: receipt,
    };
    return {
      success: true,
      data: { artifact: cacheRead.artifact, receipt },
      meta: buildCacheHitMeta("ris_fetch_segment"),
    };
  }

  let apiLookup = undefined as Awaited<ReturnType<typeof lookupRisApiBySourceId>>;
  let apiLookupWarning: string | undefined;
  if (!input.sourceUrl && !input.contentUrl) {
    try {
      apiLookup = await lookupRisApiBySourceId(sourceId);
    } catch (error) {
      apiLookupWarning = `api_lookup_failed: ${error instanceof Error ? error.message : "Unknown API lookup error"}`;
    }
  }
  const directXmlUrl = /\.xml(?:$|[?#])/i.test(sourceUrl) ? sourceUrl : undefined;
  const directHtmlUrl = directXmlUrl ? undefined : sourceUrl;
  const effectiveXmlUrl = apiLookup?.xmlContentUrl ?? directXmlUrl;
  const effectiveHtmlUrl = apiLookup?.contentUrl ?? directHtmlUrl ?? sourceUrl;
  const effectiveSourceUrl = effectiveXmlUrl ?? effectiveHtmlUrl;

  let response: Response;
  let responseFormat: "xml" | "html" = effectiveXmlUrl ? "xml" : "html";
  try {
    response = await fetch(effectiveSourceUrl, {
      method: "GET",
      headers: { accept: responseFormat === "xml" ? "application/xml,text/xml,text/html,application/xhtml+xml" : "text/html,application/xhtml+xml,application/xml,text/xml" },
    });
  } catch (error) {
    return {
      success: false,
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
      success: false,
      error: { code: "NOT_FOUND", message: "RIS document not found" },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  if (!response.ok) {
    const is503 = response.status === 503;
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: is503
          ? "RIS upstream temporarily unavailable (HTTP 503)"
          : `RIS segment request returned HTTP ${response.status}`,
        details: { status: response.status, source_url: effectiveSourceUrl },
        retryable: response.status >= 500,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  let rawBody: string;
  try {
    rawBody = await response.text();
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("xml") || /^\s*<\?xml\b/i.test(rawBody)) {
      responseFormat = "xml";
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS response body could not be read: ${error instanceof Error ? error.message : "Unknown body read error"}`,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  if (responseFormat === "html" && looksLikeRisNotFound(rawBody)) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "RIS did not return a matching document" },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

  try {
    const parsed = responseFormat === "xml"
      ? parseRisSegmentXml(rawBody)
      : parseRisSegmentHtml(rawBody);

    const displayTitle = buildDisplayTitle({
      segmentRef: parsed.segmentRef,
      lawAbbreviation: parsed.lawAbbreviation ?? apiLookup?.lawAbbreviation,
      lawTitle: parsed.lawTitle,
      heading: parsed.heading,
      normStatus: parsed.normStatus,
      fallbackTitle: parsed.title,
    });

    const receipt = buildVerificationReceipt({
      sourceId,
      gesetzesnummer: apiLookup?.lawId,
      dokumentnummer: sourceId,
      eli: apiLookup?.documentUrl?.includes("/eli/") ? apiLookup.documentUrl : (effectiveSourceUrl.includes("/eli/") ? effectiveSourceUrl : undefined),
      paragraf: parsed.segmentRef,
      consolidatedAsOf: parsed.effectiveDate,
      effectiveFrom: parsed.effectiveDate,
      effectiveTo: parsed.repealedDate,
      kundmachungsorgan: parsed.promulgation,
      content: parsed.content,
      retrievalMethod: initialRetrievalMethod,
      stichtag: input.stichtag,
      normStatus: parsed.normStatus,
    });

    const artifact: CachedArtifact = {
      stable_id: stableId,
      frontmatter: {
        stable_id: stableId,
        source: "ris",
        source_url: effectiveSourceUrl,
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
        law_abbreviation: parsed.lawAbbreviation ?? apiLookup?.lawAbbreviation,
        law_slug: parsed.lawSlug,
        law_type: parsed.lawType,
        index_label: parsed.indexLabel,
        promulgation: parsed.promulgation,
        heading: parsed.heading,
      },
      content: parsed.content,
      metadata: {
        verification_receipt: receipt,
        ris_extracted: {
          display_title: displayTitle,
          law_slug: parsed.lawSlug ?? apiLookup?.lawAbbreviation?.toLowerCase(),
          heading: parsed.heading,
          law_abbreviation: parsed.lawAbbreviation ?? apiLookup?.lawAbbreviation,
        },
        ...(apiLookup ? {
          ris_api: {
            application: apiLookup.application,
            scope: apiLookup.scope,
            state: apiLookup.state,
            law_id: apiLookup.lawId,
            document_url: apiLookup.documentUrl,
            content_url: apiLookup.contentUrl,
            xml_content_url: apiLookup.xmlContentUrl,
            whole_law_url: apiLookup.wholeLawUrl,
          },
        } : {}),
      },
    };

    const cacheWrite = await writeThroughCacheForRisArtifact(artifact);

    const warnings = [
      ...buildCacheWarnings({ cacheRead, cacheWrite }),
      ...(apiLookupWarning ? [apiLookupWarning] : []),
      ...(receipt.warning ? [receipt.warning] : []),
    ];
    const notices = [
      ...(apiLookup?.xmlContentUrl ? ["api_lookup_used: preferred xml_content_url for segment fetch"]
        : apiLookup?.contentUrl ? ["api_lookup_used: preferred content_url for segment fetch"]
        : []),
      `retrieval_method: ${receipt.retrieval_method}`,
      `verification_status: ${receipt.verification_status}`,
    ];

    const refreshMeta = refresh ? buildRefreshMeta("ris_fetch_segment") : undefined;
    const combinedNotices = [
      ...(refreshMeta?.notices ?? []),
      ...notices,
    ];

    return {
      success: true,
      data: {
        artifact,
        receipt,
      },
      meta: {
        tool: "ris_fetch_segment",
        source: "ris" as const,
        timestamp: new Date().toISOString(),
        ...(combinedNotices.length > 0 ? { notices: combinedNotices } : {}),
        ...(warnings.length > 0 ? { warnings } : {}),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS segment response could not be parsed: ${error instanceof Error ? error.message : "Unknown parse error"}`,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }
}
