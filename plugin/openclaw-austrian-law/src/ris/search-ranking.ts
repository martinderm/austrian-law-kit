import type { SearchHit } from "../types/tool-contracts.js";
import type { RisResolvedQuery } from "./query-resolver.js";

function normalize(value: string | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreHit(hit: SearchHit, resolved: RisResolvedQuery): { score: number; matchReason: string; confidence: "high" | "medium" | "low" } {
  if (resolved.kind === "sourceId") {
    return { score: 100, matchReason: "direct sourceId match", confidence: "high" };
  }

  const title = normalize(hit.title);
  const sourceId = normalize(hit.source_id);

  if (resolved.kind === "normRef") {
    const law = normalize(resolved.lawAbbreviation);
    const section = normalize(resolved.sectionRef);
    const hasLaw = title.includes(law);
    const hasSection = title.includes(section);

    if (hasLaw && hasSection) {
      return { score: 100, matchReason: "title matches law and section reference", confidence: "high" };
    }
    if (hasSection) {
      return { score: 80, matchReason: "title matches section reference", confidence: "medium" };
    }
    if (hasLaw) {
      return { score: 60, matchReason: "title matches law reference", confidence: "medium" };
    }
    if (sourceId) {
      return { score: 40, matchReason: "resolved sourceId candidate from RIS result", confidence: "low" };
    }
  }

  if (resolved.kind === "freeText") {
    const query = normalize(resolved.normalizedQuery);
    if (query && title.includes(query)) {
      return { score: 70, matchReason: "title contains normalized query", confidence: "medium" };
    }
  }

  return { score: 10, matchReason: "unranked fallback candidate", confidence: "low" };
}

export function rankRisSearchHits(hits: SearchHit[], resolved: RisResolvedQuery): SearchHit[] {
  return [...hits]
    .map((hit) => {
      const ranked = scoreHit(hit, resolved);
      return {
        ...hit,
        match_reason: hit.match_reason ?? ranked.matchReason,
        confidence: hit.confidence ?? ranked.confidence,
        __score: ranked.score,
      } as SearchHit & { __score: number };
    })
    .sort((a, b) => b.__score - a.__score)
    .map(({ __score, ...hit }) => hit);
}
