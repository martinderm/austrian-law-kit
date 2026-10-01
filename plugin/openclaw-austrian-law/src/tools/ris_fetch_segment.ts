import {
  applyCachedReceiptProvenance,
  tryReadCachedRisArtifact,
  type CacheReadReuseResult,
} from "../cache/cache-read-reuse.js";
import { writeThroughCacheForRisArtifact } from "../cache/cache-write-through.js";
import { archiveRawSource } from "../cache/raw-source-archive.js";
import { lookupRisApiBySourceId } from "../ris-api/lookup.js";
import { deriveNormStatus, parseRisSegmentHtml, looksLikeRisNotFound } from "../ris/segment-parser.js";
import { parseRisSegmentXml } from "../ris/segment-xml-parser.js";
import {
  buildRisSegmentUrl,
  extractSourceIdFromRisUrl,
  normalizeStableIdFromSourceId,
  validateSafeRisUrl,
} from "../ris/segment-url.js";
import {
  buildAbortToolError,
  classifyFetchAbort,
  createFetchAbortSignal,
  readResponseBodyText,
  resolveFetchTimeoutMs,
} from "../ris/fetch-timeout.js";
import { buildVerificationReceipt, validateStichtag } from "../ris/verification-receipt.js";
import {
  buildCacheHitMeta,
  buildCacheWarnings,
  buildRefreshMeta,
  resolveSourceIdFromInputOrUrl,
} from "./ris-fetch-common.js";
import type { CachedArtifact, RetrievalMethod, RisFetchSegmentInput, RisFetchSegmentOutput } from "../types/tool-contracts.js";

export function buildDisplayTitle(params: {
  segmentRef?: string;
  lawAbbreviation?: string;
  lawTitle?: string;
  heading?: string;
  normStatus?: "in_force" | "current" | "historical" | "repealed" | "unknown";
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

async function serveSegmentCacheHit(params: {
  artifact: CachedArtifact;
  sourceId: string;
  initialRetrievalMethod: RetrievalMethod;
  stichtag: string;
}): Promise<RisFetchSegmentOutput> {
  const existingReceipt = params.artifact.metadata?.verification_receipt;
  const cacheNormStatus = deriveNormStatus({
    promulgation: params.artifact.frontmatter.promulgation,
    repealedDate: params.artifact.frontmatter.repealed_date,
    effectiveDate: params.artifact.frontmatter.effective_date,
    stichtag: params.stichtag,
  });
  const cacheDisplayTitle = buildDisplayTitle({
    segmentRef: params.artifact.frontmatter.segment_ref,
    lawAbbreviation: params.artifact.frontmatter.law_abbreviation,
    lawTitle: params.artifact.frontmatter.law_title,
    heading: params.artifact.frontmatter.heading,
    normStatus: cacheNormStatus,
    fallbackTitle: params.artifact.frontmatter.title,
  });
  const receipt = buildVerificationReceipt({
    sourceId: params.sourceId,
    gesetzesnummer: (params.artifact.metadata?.ris_api as Record<string, unknown> | undefined)?.law_id as string | undefined ?? existingReceipt?.gesetzesnummer,
    dokumentnummer: params.sourceId,
    eli: params.artifact.frontmatter.source_url?.includes("/eli/") ? params.artifact.frontmatter.source_url : existingReceipt?.eli,
    paragraf: params.artifact.frontmatter.segment_ref,
    consolidatedAsOf: existingReceipt?.consolidated_as_of ?? null,
    effectiveFrom: params.artifact.frontmatter.effective_date,
    effectiveTo: params.artifact.frontmatter.repealed_date,
    kundmachungsorgan: params.artifact.frontmatter.promulgation,
    content: params.artifact.content,
    rawContent: existingReceipt?.raw_content_sha256 ? undefined : params.artifact.content,
    retrievalMethod: existingReceipt?.retrieval_method ?? params.initialRetrievalMethod,
    cached: true,
    stichtag: params.stichtag,
    normStatus: cacheNormStatus,
  });
  await applyCachedReceiptProvenance(receipt, existingReceipt);

  const artifact: CachedArtifact = {
    ...params.artifact,
    frontmatter: {
      ...params.artifact.frontmatter,
      norm_status: cacheNormStatus,
      title: cacheDisplayTitle,
    },
    metadata: {
      ...(params.artifact.metadata ?? {}),
      verification_receipt: receipt,
    },
  };

  return {
    success: true,
    data: { artifact, receipt },
    meta: buildCacheHitMeta("ris_fetch_segment"),
  };
}

export async function risFetchSegmentStub(input: RisFetchSegmentInput): Promise<RisFetchSegmentOutput> {
  const stichtagCheck = validateStichtag(input.stichtag);
  if (!stichtagCheck.valid) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: stichtagCheck.error!,
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }

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

  const knownSourceId = resolveSourceIdFromInputOrUrl({
    sourceId: input.sourceId,
    sourceUrl,
    extractFromUrl: extractSourceIdFromRisUrl,
  });

  const refresh = input.refresh === true;
  let stableId: string | undefined;
  let cacheRead: CacheReadReuseResult = { hit: false };
  if (knownSourceId) {
    stableId = normalizeStableIdFromSourceId(knownSourceId);
    if (!refresh) {
      cacheRead = await tryReadCachedRisArtifact({ stableId, docType: "norm_segment" });
      if (cacheRead.hit && cacheRead.artifact) {
        return await serveSegmentCacheHit({
          artifact: cacheRead.artifact,
          sourceId: knownSourceId,
          initialRetrievalMethod,
          stichtag: stichtagCheck.stichtag,
        });
      }
    }
  }

  let apiLookup = undefined as Awaited<ReturnType<typeof lookupRisApiBySourceId>>;
  let apiLookupWarning: string | undefined;
  if (knownSourceId && !input.sourceUrl && !input.contentUrl) {
    try {
      apiLookup = await lookupRisApiBySourceId(knownSourceId);
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
  const timeoutMs = resolveFetchTimeoutMs();
  const abortHandle = createFetchAbortSignal(timeoutMs);
  try {
    response = await fetch(effectiveSourceUrl, {
      method: "GET",
      headers: { accept: responseFormat === "xml" ? "application/xml,text/xml,text/html,application/xhtml+xml" : "text/html,application/xhtml+xml,application/xml,text/xml" },
      signal: abortHandle.signal,
    });
  } catch (error) {
    const abortKind = classifyFetchAbort(error, abortHandle);
    if (abortKind) {
      return {
        success: false,
        error: buildAbortToolError({ kind: abortKind, phase: "request", url: effectiveSourceUrl, timeoutMs }),
        meta: { tool: "ris_fetch_segment", source: "ris" },
      };
    }
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `Network error during RIS segment fetch from ${effectiveSourceUrl}: ${error instanceof Error ? error.message : "fetch failed"}`,
        details: { phase: "fetch_segment_http_request", url: effectiveSourceUrl, error: error instanceof Error ? error.message : String(error) },
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
  let contentType = "";
  try {
    rawBody = await readResponseBodyText(response, abortHandle);
    contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (contentType.includes("xml") || /^\s*<\?xml\b/i.test(rawBody)) {
      responseFormat = "xml";
    }
  } catch (error) {
    const abortKind = classifyFetchAbort(error, abortHandle);
    if (abortKind) {
      return {
        success: false,
        error: buildAbortToolError({ kind: abortKind, phase: "body_read", url: effectiveSourceUrl, timeoutMs }),
        meta: { tool: "ris_fetch_segment", source: "ris" },
      };
    }
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

  const archivedRaw = await archiveRawSource({ body: rawBody, format: responseFormat, contentType });

  try {
    const parsed = responseFormat === "xml"
      ? parseRisSegmentXml(rawBody, { stichtag: stichtagCheck.stichtag })
      : parseRisSegmentHtml(rawBody, { stichtag: stichtagCheck.stichtag });

    const resolvedSourceId = knownSourceId ?? parsed.dokumentnummer?.trim() ?? null;
    if (!resolvedSourceId) {
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Unable to resolve source_id (provide sourceId or sourceUrl with Dokumentnummer)",
        },
        meta: { tool: "ris_fetch_segment", source: "ris" },
      };
    }

    if (!stableId) {
      stableId = normalizeStableIdFromSourceId(resolvedSourceId);
      if (!refresh) {
        cacheRead = await tryReadCachedRisArtifact({ stableId, docType: "norm_segment" });
        if (cacheRead.hit && cacheRead.artifact) {
          return await serveSegmentCacheHit({
            artifact: cacheRead.artifact,
            sourceId: resolvedSourceId,
            initialRetrievalMethod,
            stichtag: stichtagCheck.stichtag,
          });
        }
      }
    }

    const displayTitle = buildDisplayTitle({
      segmentRef: parsed.segmentRef,
      lawAbbreviation: parsed.lawAbbreviation ?? apiLookup?.lawAbbreviation,
      lawTitle: parsed.lawTitle,
      heading: parsed.heading,
      normStatus: parsed.normStatus,
      fallbackTitle: parsed.title,
    });

    const receipt = buildVerificationReceipt({
      sourceId: resolvedSourceId,
      gesetzesnummer: parsed.gesetzesnummer ?? apiLookup?.lawId,
      dokumentnummer: parsed.dokumentnummer ?? resolvedSourceId,
      eli: parsed.eli ?? (apiLookup?.documentUrl?.includes("/eli/") ? apiLookup.documentUrl : (effectiveSourceUrl.includes("/eli/") ? effectiveSourceUrl : undefined)),
      paragraf: parsed.segmentRef,
      consolidatedAsOf: parsed.consolidatedAsOf,
      effectiveFrom: parsed.effectiveDate,
      effectiveTo: parsed.repealedDate,
      kundmachungsorgan: parsed.promulgation,
      rawContent: rawBody,
      content: parsed.content,
      retrievalMethod: initialRetrievalMethod,
      cached: false,
      stichtag: input.stichtag,
      normStatus: parsed.normStatus,
      receiptVersion: 2,
      rawSourcePath: archivedRaw.relativePath,
      rawSourceSaved: archivedRaw.saved,
      sourceUrlOfficial: input.contentUrl ?? input.sourceUrl,
      contentUrlFinal: effectiveSourceUrl !== (input.contentUrl ?? input.sourceUrl) ? effectiveSourceUrl : undefined,
      contentType: contentType || undefined,
    });

    if (archivedRaw.warning) {
      receipt.warning = receipt.warning ? `${receipt.warning}; ${archivedRaw.warning}` : archivedRaw.warning;
    }

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
        source_id: resolvedSourceId,
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
        details: { phase: "parse_segment_response", raw_source_path: archivedRaw.relativePath },
      },
      meta: { tool: "ris_fetch_segment", source: "ris" },
    };
  }
}
