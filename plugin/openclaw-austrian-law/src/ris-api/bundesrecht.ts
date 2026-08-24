import { buildRisApiUrl, extractRisApiHitsMeta, fetchRisApiJson, hasMoreRisApiPages, RisApiError } from "./client.js";
import { mapApiDocumentReferences } from "./mappers.js";
import type { RisApiSearchCandidate, RisApiSearchRequest, RisApiSearchResult } from "./types.js";

function extractRequestedParagraph(normalizedQuery: string): string | undefined {
  const match = normalizedQuery.match(/(?:^|\s)(?:§|art)\s*([0-9]+[a-zA-Z]?)(?:\s|$)/i);
  return match?.[1]?.toLowerCase();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function dedupeCandidates(candidates: RisApiSearchCandidate[]): RisApiSearchCandidate[] {
  const seen = new Set<string>();
  const result: RisApiSearchCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.hit.source_id ?? candidate.hit.source_url;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result;
}

const MAX_API_PAGES = 3;

function buildBundesrechtAttempts(request: RisApiSearchRequest): Array<{ title?: string; keywords?: string; paragraphFrom?: string; paragraphTo?: string; articleFrom?: string; articleTo?: string; label: string }> {
  const attempts: Array<{ title?: string; keywords?: string; paragraphFrom?: string; paragraphTo?: string; articleFrom?: string; articleTo?: string; label: string }> = [];
  const push = (
    title: string | undefined,
    keywords: string | undefined,
    label: string,
    extra?: { paragraphFrom?: string; paragraphTo?: string; articleFrom?: string; articleTo?: string },
  ) => {
    if (!title && !keywords) return;
    if (attempts.some((entry) => entry.title === title && entry.keywords === keywords && entry.paragraphFrom === extra?.paragraphFrom && entry.articleFrom === extra?.articleFrom)) return;
    attempts.push({ title, keywords, label, ...extra });
  };

  if (request.headingRemainder && request.lawTitle && request.paragraphNumber) {
    push(request.lawTitle, request.headingRemainder, "title+paragraph_field+heading", { paragraphFrom: request.paragraphNumber });
    push(request.lawTitle, `${request.lawTitle} § ${request.paragraphNumber} ${request.headingRemainder}`, "law+paragraph+heading", { paragraphFrom: request.paragraphNumber });
    push(request.lawTitle, `${request.headingRemainder} ${request.lawTitle} § ${request.paragraphNumber}`, "heading+law+paragraph", { paragraphFrom: request.paragraphNumber });
  }

  if (request.lawTitle && request.paragraphNumber) {
    push(request.lawTitle, undefined, "title+paragraph_field", { paragraphFrom: request.paragraphNumber });
    push(request.lawTitle, `${request.lawTitle} ${request.paragraphNumber}`, "law+number", { paragraphFrom: request.paragraphNumber });
    push(request.lawTitle, `${request.lawTitle} § ${request.paragraphNumber}`, "law+section", { paragraphFrom: request.paragraphNumber });
    push(undefined, `${request.lawTitle} ${request.paragraphNumber}`, "keywords_only_law+number", { paragraphFrom: request.paragraphNumber });
  }

  if (request.headingRemainder && request.lawTitle && !request.paragraphNumber) {
    push(request.lawTitle, request.headingRemainder, "title+heading_only");
  }

  if (request.lawTitle && request.articleNumber) {
    push(request.lawTitle, undefined, "title+article_field", { articleFrom: request.articleNumber });
  }

  push(request.lawTitle, request.keywords, "default");
  push(request.lawTitle, undefined, "title_only");
  return attempts;
}

export async function searchBundesrechtApi(request: RisApiSearchRequest): Promise<RisApiSearchResult> {
  const notices: string[] = ["api_search: Bundesrecht"];
  const warnings: string[] = [];
  let lastError: RisApiError | undefined;
  const aggregateHits: RisApiSearchCandidate[] = [];
  const attempts = buildBundesrechtAttempts(request);

  for (const attempt of attempts) {
    let foundInAttempt = false;
    for (let page = 1; page <= MAX_API_PAGES; page += 1) {
      const url = buildRisApiUrl("/Bundesrecht", {
        Applikation: "BrKons",
        Titel: attempt.title,
        Suchworte: attempt.keywords,
        VonParagraf: attempt.paragraphFrom,
        BisParagraf: attempt.paragraphTo,
        VonArtikel: attempt.articleFrom,
        BisArtikel: attempt.articleTo,
        Seitennummer: String(page),
      });

      try {
        const payload = await fetchRisApiJson(url);
        const refs = asArray(payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference);
        const mapped = mapApiDocumentReferences(refs, request);
        aggregateHits.push(...mapped.hits);
        warnings.push(...mapped.warnings);

        const meta = extractRisApiHitsMeta(payload);
        if (page > 1) notices.push(`api_pagination_used: Bundesrecht page ${page}`);
        if (mapped.hits.length > 0) {
          foundInAttempt = true;
        }
        if (!hasMoreRisApiPages(meta) || dedupeCandidates(aggregateHits).length >= request.limit) {
          break;
        }
      } catch (error) {
        if (error instanceof RisApiError) {
          lastError = error;
          warnings.push(`api_error_type: ${error.code}`);
          break;
        }
        warnings.push("api_error_type: UNKNOWN_ERROR");
        break;
      }
    }

    const dedupedAfterAttempt = dedupeCandidates(aggregateHits);
    const requestedParagraph = extractRequestedParagraph(request.normalizedQuery);
    const exactAfterAttempt = requestedParagraph
      ? dedupedAfterAttempt.filter((candidate) => candidate.hit.paragraph_number?.toLowerCase() === requestedParagraph)
      : [];

    if (exactAfterAttempt.length > 0) {
      notices.push(`api_attempt_used: ${attempt.label}`);
      notices.push(`api_exact_paragraph_match_count: ${exactAfterAttempt.length}`);
      return {
        success: true,
        hits: exactAfterAttempt.slice(0, request.limit),
        notices,
        warnings,
      };
    }

    if (foundInAttempt) {
      notices.push(`api_attempt_used: ${attempt.label}`);
      break;
    }
  }

  const dedupedHits = dedupeCandidates(aggregateHits);
  const requestedParagraph = extractRequestedParagraph(request.normalizedQuery);

  if (dedupedHits.length > 0) {
    if (requestedParagraph) {
      warnings.push(`api_exact_paragraph_missing: ${requestedParagraph}`);
    }
    return {
      success: true,
      hits: dedupedHits.slice(0, request.limit),
      notices,
      warnings,
    };
  }

  if (lastError) {
    return {
      success: false,
      errorCode: "UPSTREAM_UNAVAILABLE",
      message: lastError.message,
      retryable: typeof lastError.status === "number" ? lastError.status >= 500 : true,
      notices,
      warnings,
      details: { ...(lastError.details ?? {}), api_error_type: lastError.code },
    };
  }

  return {
    success: false,
    errorCode: "NOT_FOUND",
    message: "RIS API returned no usable Bundesrecht hits",
    notices,
    warnings,
    details: { query: request.query, normalizedQuery: request.normalizedQuery },
  };
}
