import type { SearchHit } from "../types/tool-contracts.js";
import type { RisResolvedQuery } from "./query-resolver.js";
import { evaluateStichtagValidity, getViennaTodayDate, validateStichtag } from "./verification-receipt.js";

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count += 1;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

function scoreSourceMetadata(hit: SearchHit): number {
  let score = 0;
  const title = normalize(hit.title);
  const documentType = normalize(hit.document_type);
  const sectionRef = normalize(hit.section_ref);
  const paragraphNumber = normalize(hit.paragraph_number);
  const legalType = normalize(hit.legal_type);
  const sourceUrl = normalize(hit.source_url);

  if (sectionRef === "" || sectionRef === "§ 0" || paragraphNumber === "0") score += 14;
  if (sourceUrl.includes("/p0/")) score += 10;
  if (documentType === "norm") score += 8;
  if (documentType === "paragraph") score -= 8;
  if (legalType.includes("stamm")) score += 10;

  if (title.startsWith("authentische interpretation")) score -= 40;
  if (hasAny(title, [" authentische interpretation", " richtlinie, anpassung", " novell", " änderung", " kundmachung", " durchführungsverordnung"])) score -= 18;

  const promulgation = normalize(hit.promulgation);
  if (promulgation.includes("aufgehoben")) score -= 35;
  if (promulgation.includes("zuletzt geändert durch") || promulgation.includes("kundgemacht am")) score += 10;
  if (hit.changed_at) {
    const year = parseInt(hit.changed_at.slice(0, 4), 10);
    if (!isNaN(year) && year >= 1990) {
      score += Math.min(25, Math.floor((year - 1990) / 2));
    }
  }

  return score;
}

function scoreNormRefHit(hit: SearchHit, resolved: RisResolvedQuery & { kind: "normRef" }): { score: number; matchReason: string; confidence: "high" | "medium" | "low" } {
  const title = normalize(hit.title);
  const sourceId = normalize(hit.source_id);
  const law = normalize(resolved.lawAbbreviation);
  const section = normalize(resolved.sectionRef);
  const sectionNumber = normalize(resolved.sectionRef.replace(/^§\s*/i, "").replace(/^art\s*/i, ""));
  const lawAbbreviation = normalize(hit.law_abbreviation);
  const sectionRef = normalize(hit.section_ref);
  const paragraphNumber = normalize(hit.paragraph_number);
  const documentType = normalize(hit.document_type);

  let score = scoreSourceMetadata(hit);
  let matchReason = "resolved sourceId candidate from RIS result";
  let confidence: "high" | "medium" | "low" = "low";

  const hasLaw = title.includes(law) || lawAbbreviation === law;
  const sectionMention = title.includes(section) || title.includes(`§ ${sectionNumber}`) || title.includes(`art ${sectionNumber}`);
  const exactSectionRef = sectionRef === section;
  const exactParagraphNumber = paragraphNumber === sectionNumber;
  const hasSection = sectionMention || exactSectionRef || exactParagraphNumber;
  const hasWrongParagraph = !!sectionNumber && !!paragraphNumber && paragraphNumber !== sectionNumber;
  const isWholeLaw = documentType === "norm" && (sectionRef === "" || sectionRef === "§ 0" || paragraphNumber === "0");

  if (hasWrongParagraph) {
    score -= 140;
  }

  if (isWholeLaw && hasLaw && !hasSection) {
    score -= 90;
  }

  if (exactSectionRef || exactParagraphNumber) {
    score += 140;
    matchReason = hasLaw ? "exact paragraph metadata matches requested norm reference" : "exact paragraph metadata matches requested section";
    confidence = hasLaw ? "high" : "medium";
  } else if (hasLaw && sectionMention) {
    score += 120;
    matchReason = "title matches law and section reference";
    confidence = "high";
  } else if (hasSection) {
    score += 85;
    matchReason = "title matches section reference";
    confidence = "medium";
  } else if (hasLaw) {
    score += 35;
    matchReason = "title matches law reference only";
    confidence = isWholeLaw ? "low" : "medium";
  } else if (sourceId) {
    score += 20;
  }

  return { score, matchReason, confidence };
}

function scoreFreeTextHit(hit: SearchHit, resolved: RisResolvedQuery & { kind: "freeText" }): { score: number; matchReason: string; confidence: "high" | "medium" | "low" } {
  const title = normalize(hit.title);
  const query = normalize(resolved.normalizedQuery);
  const queryTokens = query.split(/\s+/).filter(Boolean);

  let score = scoreSourceMetadata(hit);
  let matchReason = "unranked fallback candidate";
  let confidence: "high" | "medium" | "low" = "low";

  if (query && title === query) {
    score += 95;
    matchReason = "title exactly matches normalized query";
    confidence = "high";
  } else if (query && title.startsWith(query)) {
    score += 82;
    matchReason = "title starts with normalized query";
    confidence = "high";
  } else if (query && title.includes(query)) {
    score += 70;
    matchReason = "title contains normalized query";
    confidence = "medium";
  }

  const tokenHits = queryTokens.reduce((sum, token) => sum + Math.min(2, countOccurrences(title, token)), 0);
  score += tokenHits * 6;

  if (queryTokens.length > 1 && tokenHits >= queryTokens.length) {
    score += 10;
  }

  return { score, matchReason, confidence };
}

function scoreHit(hit: SearchHit, resolved: RisResolvedQuery, targetStichtag: string): {
  score: number;
  matchReason: string;
  confidence: "high" | "medium" | "low";
  verificationStatus: SearchHit["verification_status"];
} {
  let base: { score: number; matchReason: string; confidence: "high" | "medium" | "low" };

  if (resolved.kind === "sourceId") {
    base = { score: 100, matchReason: "direct sourceId match", confidence: "high" };
  } else if (resolved.kind === "normRef") {
    base = scoreNormRefHit(hit, resolved);
  } else {
    base = scoreFreeTextHit(hit, resolved);
  }

  let score = base.score;
  let matchReason = base.matchReason;
  let confidence = base.confidence;

  // Stichtag and Temporal Validity Evaluation
  const temporalEval = evaluateStichtagValidity({
    stichtag: targetStichtag,
    effectiveFrom: hit.effective_from,
    effectiveTo: hit.effective_to,
    consolidatedAsOf: hit.consolidated_as_of,
    normStatus: hit.norm_status,
    retrievalMethod: "ris_api_discovery",
  });

  const verificationStatus = temporalEval.status;

  if (verificationStatus === "verified_current") {
    score += 250;
    matchReason = `${matchReason} (in force on stichtag ${targetStichtag})`;
  } else if (verificationStatus === "historical_valid_for_stichtag") {
    score += 200;
    matchReason = `${matchReason} (historical version valid for stichtag ${targetStichtag})`;
  } else if (verificationStatus === "stichtag_mismatch") {
    score -= 300;
    matchReason = `${matchReason} (stichtag_mismatch for ${targetStichtag})`;
    confidence = "low";
  } else if (verificationStatus === "insufficient_metadata") {
    score -= 40;
  }

  // Recency bonus: prefer more recent amendment/promulgation dates when base scores are close
  const dateCandidate = hit.changed_at || hit.published_at || hit.effective_from || hit.consolidated_as_of;
  if (dateCandidate) {
    const yr = parseInt(dateCandidate.slice(0, 4), 10);
    if (!isNaN(yr) && yr >= 1970) {
      score += Math.min(50, Math.floor((yr - 1970) / 1.5));
    }
  }

  // Document ID generation heuristic: NOR40xxx are modern consolidated versions vs NOR12xxx older legacy IDs
  if (hit.source_id?.toUpperCase().startsWith("NOR40")) {
    score += 20;
  }

  return { score, matchReason, confidence, verificationStatus };
}

export function rankRisSearchHits(hits: SearchHit[], resolved: RisResolvedQuery, stichtag?: string): SearchHit[] {
  const stichtagCheck = validateStichtag(stichtag);
  const targetStichtag = stichtagCheck.valid ? stichtagCheck.stichtag : getViennaTodayDate();

  return [...hits]
    .map((hit) => {
      const ranked = scoreHit(hit, resolved, targetStichtag);
      return {
        ...hit,
        match_reason: ranked.matchReason,
        confidence: ranked.confidence,
        verification_status: ranked.verificationStatus,
        __score: ranked.score,
      } as SearchHit & { __score: number };
    })
    .sort((a, b) => b.__score - a.__score)
    .map(({ __score, ...hit }) => hit);
}

