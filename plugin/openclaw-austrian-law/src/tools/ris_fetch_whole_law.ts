import { tryReadCachedRisArtifact } from "../cache/cache-read-reuse.js";
import { writeThroughCacheForRisArtifact } from "../cache/cache-write-through.js";
import { lookupRisApiBySourceId } from "../ris-api/lookup.js";
import { looksLikeRisWholeLawNotFound, parseRisWholeLawHtml } from "../ris/whole-law-parser.js";
import {
  buildRisWholeLawUrl,
  extractSourceIdFromWholeLawUrl,
  normalizeWholeLawStableIdFromSourceId,
} from "../ris/whole-law-url.js";
import { validateSafeRisUrl } from "../ris/segment-url.js";
import { buildVerificationReceipt, validateStichtag } from "../ris/verification-receipt.js";
import {
  buildCacheHitMeta,
  buildCacheWarnings,
  buildRefreshMeta,
  resolveSourceIdFromInputOrUrl,
} from "./ris-fetch-common.js";
import { risSearchStub } from "./ris_search.js";
import type { CachedArtifact, RetrievalMethod, RisFetchWholeLawInput, RisFetchWholeLawOutput } from "../types/tool-contracts.js";

export async function risFetchWholeLawStub(input: RisFetchWholeLawInput): Promise<RisFetchWholeLawOutput> {
  const stichtagCheck = validateStichtag(input.stichtag);
  if (!stichtagCheck.valid) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: stichtagCheck.error!,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  let fallbackReason: string | undefined;
  let initialRetrievalMethod: RetrievalMethod = input.sourceId
    ? "direct_source_id"
    : input.sourceUrl || input.wholeLawUrl
    ? ((input.sourceUrl?.includes("/eli/") || input.wholeLawUrl?.includes("/eli/")) ? "eli_url" : "norm_document_url")
    : "web_search_fallback";

  if (!input.wholeLawUrl && !input.sourceId && !input.sourceUrl && input.query?.trim()) {
    fallbackReason = `Auto-resolve via query '${input.query.trim()}'`;
    initialRetrievalMethod = "ris_api_discovery";
    const searchResult = await risSearchStub({
      query: input.query.trim(),
      scope: input.scope,
      state: input.state,
      limit: 5,
      stichtag: input.stichtag,
    });
    if (!searchResult.success) {
      return {
        success: false,
        error: searchResult.error,
        meta: { tool: "ris_fetch_whole_law", source: "ris" },
      };
    }
    const candidate = searchResult.data.best_candidate?.whole_law_url
      ? searchResult.data.best_candidate
      : searchResult.data.hits.find((h) => !!h.whole_law_url);
    if (!candidate || !candidate.whole_law_url) {
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: `Could not resolve whole law URL for query '${input.query}'`,
        },
        meta: { tool: "ris_fetch_whole_law", source: "ris" },
      };
    }
    input = {
      ...input,
      wholeLawUrl: candidate.whole_law_url,
      sourceId: extractSourceIdFromWholeLawUrl(candidate.whole_law_url) ?? candidate.source_id,
    };
  }

  let sourceUrl: string;
  try {
    if (input.wholeLawUrl?.trim()) {
      validateSafeRisUrl(input.wholeLawUrl.trim());
      sourceUrl = input.wholeLawUrl.trim();
    } else {
      sourceUrl = buildRisWholeLawUrl({ sourceId: input.sourceId, sourceUrl: input.sourceUrl });
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid ris_fetch_whole_law input",
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  const sourceId = resolveSourceIdFromInputOrUrl({
    sourceId: input.sourceId,
    sourceUrl,
    extractFromUrl: extractSourceIdFromWholeLawUrl,
  });
  if (!sourceId) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Unable to resolve source_id (provide sourceId or sourceUrl with Dokumentnummer)",
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  const stableId = normalizeWholeLawStableIdFromSourceId(sourceId);
  const refresh = input.refresh === true;
  const cacheRead = refresh
    ? { hit: false, artifact: undefined, warning: undefined }
    : await tryReadCachedRisArtifact({ stableId, docType: "norm_document" });
  if (cacheRead.hit && cacheRead.artifact) {
    const existingReceipt = cacheRead.artifact.metadata?.verification_receipt as any;
    const receipt = buildVerificationReceipt({
      sourceId,
      gesetzesnummer: (cacheRead.artifact.metadata?.ris_api as Record<string, unknown>)?.law_id as string | undefined ?? existingReceipt?.gesetzesnummer,
      dokumentnummer: sourceId,
      eli: cacheRead.artifact.frontmatter.source_url?.includes("/eli/") ? cacheRead.artifact.frontmatter.source_url : existingReceipt?.eli,
      paragraf: "Gesamte Rechtsvorschrift",
      consolidatedAsOf: existingReceipt?.consolidated_as_of ?? null,
      effectiveFrom: cacheRead.artifact.frontmatter.effective_date,
      effectiveTo: cacheRead.artifact.frontmatter.repealed_date,
      kundmachungsorgan: cacheRead.artifact.frontmatter.promulgation,
      content: cacheRead.artifact.content,
      rawContent: existingReceipt?.raw_content_sha256 ? undefined : cacheRead.artifact.content,
      retrievalMethod: existingReceipt?.retrieval_method ?? initialRetrievalMethod,
      cached: true,
      stichtag: input.stichtag,
      normStatus: cacheRead.artifact.frontmatter.norm_status,
      fallbackReason,
    });
    cacheRead.artifact.metadata = {
      ...(cacheRead.artifact.metadata ?? {}),
      verification_receipt: receipt,
    };
    return {
      success: true,
      data: { artifact: cacheRead.artifact, receipt },
      meta: buildCacheHitMeta("ris_fetch_whole_law"),
    };
  }

  let apiLookup = undefined as Awaited<ReturnType<typeof lookupRisApiBySourceId>>;
  let apiLookupWarning: string | undefined;
  if (!input.sourceUrl && !input.wholeLawUrl) {
    try {
      apiLookup = await lookupRisApiBySourceId(sourceId);
    } catch (error) {
      apiLookupWarning = `api_lookup_failed: ${error instanceof Error ? error.message : "Unknown API lookup error"}`;
    }
  }
  const effectiveSourceUrl = apiLookup?.wholeLawUrl ?? sourceUrl;

  let response: Response;
  try {
    response = await fetch(effectiveSourceUrl, {
      method: "GET",
      headers: { accept: "text/html,application/xhtml+xml" },
    });
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS whole-law request failed: ${error instanceof Error ? error.message : "Unknown fetch error"}`,
        retryable: true,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  if (response.status === 404) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "RIS whole-law document not found" },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
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
          : `RIS whole-law request returned HTTP ${response.status}`,
        details: { status: response.status, source_url: effectiveSourceUrl },
        retryable: response.status >= 500,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  let html: string;
  try {
    html = await response.text();
  } catch (error) {
    return {
      success: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: `RIS whole-law response body could not be read: ${error instanceof Error ? error.message : "Unknown body read error"}`,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  if (looksLikeRisWholeLawNotFound(html)) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "RIS did not return a matching whole-law document" },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }

  try {
    const parsed = parseRisWholeLawHtml(html);

    const urlGesetzesnummer = (() => {
      try {
        const u = new URL(effectiveSourceUrl);
        const gn = u.searchParams.get("Gesetzesnummer");
        if (gn && /^\d+$/.test(gn.trim())) return gn.trim();
      } catch {
        const match = effectiveSourceUrl.match(/Gesetzesnummer=(\d+)/i);
        if (match?.[1]) return match[1];
      }
      return undefined;
    })();

    const receipt = buildVerificationReceipt({
      sourceId,
      gesetzesnummer: parsed.gesetzesnummer ?? urlGesetzesnummer ?? apiLookup?.lawId,
      dokumentnummer: sourceId,
      eli: apiLookup?.documentUrl?.includes("/eli/") ? apiLookup.documentUrl : (effectiveSourceUrl.includes("/eli/") ? effectiveSourceUrl : undefined),
      paragraf: "Gesamte Rechtsvorschrift",
      consolidatedAsOf: parsed.consolidatedAsOf,
      effectiveFrom: undefined,
      effectiveTo: undefined,
      kundmachungsorgan: parsed.promulgation,
      rawContent: html,
      content: parsed.content,
      retrievalMethod: initialRetrievalMethod,
      cached: false,
      stichtag: input.stichtag,
      normStatus: parsed.normStatus,
      fallbackReason,
    });

    const artifact: CachedArtifact = {
      stable_id: stableId,
      frontmatter: {
        stable_id: stableId,
        source: "ris",
        source_url: effectiveSourceUrl,
        doc_type: "norm_document",
        title: parsed.title,
        fetched_at: new Date().toISOString(),
        version_label: "unknown",
        fassung_typ: "Arbeitsfassung",
        source_id: sourceId,
        law_title: parsed.lawTitle,
        representation: "whole_law",
      },
      content: parsed.content,
      metadata: {
        verification_receipt: receipt,
        ris_extracted: {
          representation: "whole_law",
          law_title: parsed.lawTitle,
        },
        ...(apiLookup ? {
          ris_api: {
            application: apiLookup.application,
            scope: apiLookup.scope,
            state: apiLookup.state,
            law_id: apiLookup.lawId,
            document_url: apiLookup.documentUrl,
            content_url: apiLookup.contentUrl,
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
      ...(apiLookup?.wholeLawUrl ? ["api_lookup_used: preferred whole_law_url for whole-law fetch"] : []),
      `retrieval_method: ${receipt.retrieval_method}`,
      `verification_status: ${receipt.verification_status}`,
    ];

    const refreshMeta = refresh ? buildRefreshMeta("ris_fetch_whole_law") : undefined;
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
        tool: "ris_fetch_whole_law",
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
        message: `RIS whole-law response could not be parsed: ${error instanceof Error ? error.message : "Unknown parse error"}`,
      },
      meta: { tool: "ris_fetch_whole_law", source: "ris" },
    };
  }
}
