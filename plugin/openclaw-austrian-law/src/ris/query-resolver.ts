const LAW_ALIASES: Record<string, string> = {
  abgb: "ABGB",
  stvo: "StVO",
  stvo1960: "StVO",
  stgb: "StGB",
  avg: "AVG",
  gewo: "GewO",
  emrk: "EMRK",
};

export type RisResolvedQuery =
  | {
      kind: "sourceId";
      rawQuery: string;
      normalizedQuery: string;
      sourceId: string;
    }
  | {
      kind: "normRef";
      rawQuery: string;
      normalizedQuery: string;
      lawAbbreviation: string;
      sectionRef: string;
      searchVariants: string[];
    }
  | {
      kind: "freeText";
      rawQuery: string;
      normalizedQuery: string;
      searchVariants: string[];
    };

function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeLawToken(token: string): string {
  const compact = token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return LAW_ALIASES[compact] ?? token.toUpperCase();
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = collapseWhitespace(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

export function resolveRisQuery(query: string): RisResolvedQuery {
  const rawQuery = query;
  const normalizedQuery = collapseWhitespace(
    query
      .replace(/\bparagraph\b/gi, "§")
      .replace(/\bpar\.?\b/gi, "§")
      .replace(/\bartikel\b/gi, "Art")
      .replace(/\barticle\b/gi, "Art")
      .replace(/\s*§\s*/g, " § ")
      .replace(/\s*art\.?\s*/gi, " Art "),
  );

  const sourceIdMatch = normalizedQuery.match(/\b(?:NOR|LOO)[0-9A-Z]+\b/i);
  if (sourceIdMatch) {
    return {
      kind: "sourceId",
      rawQuery,
      normalizedQuery,
      sourceId: sourceIdMatch[0].toUpperCase(),
    };
  }

  const paragraphFirst = normalizedQuery.match(/^(§|Art)\s*([0-9]+[a-zA-Z]?)\s+([A-Za-zÄÖÜäöü][A-Za-zÄÖÜäöü0-9\-.]*)$/i);
  if (paragraphFirst) {
    const marker = /^art$/i.test(paragraphFirst[1]) ? "Art" : "§";
    const sectionNumber = paragraphFirst[2];
    const lawAbbreviation = normalizeLawToken(paragraphFirst[3]);
    const sectionRef = `${marker} ${sectionNumber}`;
    return {
      kind: "normRef",
      rawQuery,
      normalizedQuery,
      lawAbbreviation,
      sectionRef,
      searchVariants: dedupe([
        `${lawAbbreviation} ${sectionRef}`,
        `${sectionRef} ${lawAbbreviation}`,
        `${lawAbbreviation} ${sectionNumber}`,
        `${sectionNumber} ${lawAbbreviation}`,
      ]),
    };
  }

  const lawFirst = normalizedQuery.match(/^([A-Za-zÄÖÜäöü][A-Za-zÄÖÜäöü0-9\-.]*)\s+(§|Art)?\s*([0-9]+[a-zA-Z]?)$/i);
  if (lawFirst) {
    const lawAbbreviation = normalizeLawToken(lawFirst[1]);
    const marker = lawFirst[2] && /^art$/i.test(lawFirst[2]) ? "Art" : "§";
    const sectionNumber = lawFirst[3];
    const sectionRef = `${marker} ${sectionNumber}`;
    return {
      kind: "normRef",
      rawQuery,
      normalizedQuery,
      lawAbbreviation,
      sectionRef,
      searchVariants: dedupe([
        `${lawAbbreviation} ${sectionRef}`,
        `${sectionRef} ${lawAbbreviation}`,
        `${lawAbbreviation} ${sectionNumber}`,
        `${sectionNumber} ${lawAbbreviation}`,
      ]),
    };
  }

  return {
    kind: "freeText",
    rawQuery,
    normalizedQuery,
    searchVariants: dedupe([normalizedQuery]),
  };
}
