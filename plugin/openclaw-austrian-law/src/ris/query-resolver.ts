const LAW_ALIASES: Record<string, string> = {
  abgb: "ABGB",
  stvo: "StVO",
  stvo1960: "StVO",
  stgb: "StGB",
  avg: "AVG",
  gewo: "GewO",
  emrk: "EMRK",
  mrg: "MRG",
  weg: "WEG",
  ustg: "UStG",
  estg: "EStG",
  kschg: "KSchG",
  asvg: "ASVG",
  zpo: "ZPO",
  bvg: "B-VG",
  "b-vg": "B-VG",
  io: "IO",
  ugb: "UGB",
  gmbhg: "GmbHG",
  aktg: "AktG",
  bao: "BAO",
  vstg: "VStG",
  spg: "SPG",
  dsg: "DSG",
  wgg: "WGG",
  stpo: "StPO",
  geo: "Geo",
  vwgg: "VwGG",
  vfgg: "VfGG",
  asgg: "ASGG",
  eodg: "EODG",
  urhg: "UrhG",
  patg: "PatG",
  mschg: "MSchG",
  uwg: "UWG",
  kartg: "KartG",
  bvergg: "BVergG",
  bverg: "BVergG",
  angg: "AngG",
  arbvg: "ArbVG",
  azg: "AZG",
  arg: "ARG",
  urlg: "UrlG",
  dhg: "DHG",
  eheg: "EheG",
  mieweg: "MieWeG",
  heizkg: "HeizKG",
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
      headingRemainder?: string;
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

function cleanQueryQuotes(query: string): string {
  return query
    .replace(/^[\s"„“”«»'‘‚’`´]+|[\s"„“”«»'‘‚’`´]+$/g, "")
    .trim();
}

function normalizeLawToken(token: string): string {
  const compact = token.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return LAW_ALIASES[compact] ?? (token.includes("-") ? token.toUpperCase() : (LAW_ALIASES[token.toLowerCase()] ?? token));
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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractNormRef(
  normalizedQuery: string,
): { lawAbbreviation: string; sectionRef: string; headingRemainder?: string } | null {
  const paragraphFirst = normalizedQuery.match(/^(§|Art\.?)\s*([0-9]+[a-zA-Z]?)\s+([A-Za-zÄÖÜäöü][A-Za-zÄÖÜäöü0-9\-.]*)\b(?:\s+(.*))?$/i);
  if (paragraphFirst) {
    const marker = /^art/i.test(paragraphFirst[1]) ? "Art" : "§";
    const sectionNumber = paragraphFirst[2];
    const lawAbbreviation = normalizeLawToken(paragraphFirst[3]);
    const sectionRef = `${marker} ${sectionNumber}`;
    const remainder = collapseWhitespace(paragraphFirst[4] ?? "");
    return {
      lawAbbreviation,
      sectionRef,
      headingRemainder: remainder || undefined,
    };
  }

  const lawTokens = Object.keys(LAW_ALIASES)
    .map((key) => LAW_ALIASES[key])
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => b.length - a.length);

  for (const alias of lawTokens) {
    const aliasPattern = escapeRegex(alias);
    const lawFirst = normalizedQuery.match(new RegExp(`^(${aliasPattern})\\s*(?:,\\s*)?(?:(§|Art\\.?)\\s*)?([0-9]+[a-zA-Z]?)\\b(?:\\s+(.*))?$`, "i"));
    if (!lawFirst) continue;
    const marker = lawFirst[2] && /^art/i.test(lawFirst[2]) ? "Art" : "§";
    const sectionNumber = lawFirst[3];
    const sectionRef = `${marker} ${sectionNumber}`;
    const remainder = collapseWhitespace(lawFirst[4] ?? "");
    return {
      lawAbbreviation: normalizeLawToken(lawFirst[1]),
      sectionRef,
      headingRemainder: remainder || undefined,
    };
  }

  const genericLawFirstWithMarker = normalizedQuery.match(/^([A-Za-zÄÖÜäöü][A-Za-zÄÖÜäöü0-9\-.]*)\s*(?:,\s*)?(§|Art\.?)\s*([0-9]+[a-zA-Z]?)\b(?:\s+(.*))?$/i);
  if (genericLawFirstWithMarker) {
    const marker = /^art/i.test(genericLawFirstWithMarker[2]) ? "Art" : "§";
    const sectionNumber = genericLawFirstWithMarker[3];
    const lawAbbreviation = normalizeLawToken(genericLawFirstWithMarker[1]);
    const sectionRef = `${marker} ${sectionNumber}`;
    const remainder = collapseWhitespace(genericLawFirstWithMarker[4] ?? "");
    return {
      lawAbbreviation,
      sectionRef,
      headingRemainder: remainder || undefined,
    };
  }

  return null;
}

export function resolveRisQuery(query: string): RisResolvedQuery {
  const rawQuery = query;
  const cleaned = cleanQueryQuotes(query);
  const normalizedQuery = collapseWhitespace(
    cleaned
      .replace(/\bparagraph\b/gi, "§")
      .replace(/\bpar\.?\b/gi, "§")
      .replace(/\bartikel\b/gi, "Art")
      .replace(/\barticle\b/gi, "Art")
      .replace(/\s*§\s*/g, " § ")
      .replace(/\s*art\.?\s*/gi, " Art ")
      .replace(/,\s*(§|Art|[0-9])/gi, " $1"),
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

  const normRef = extractNormRef(normalizedQuery);
  if (normRef) {
    const sectionNumber = normRef.sectionRef.replace(/^§\s*/i, "").replace(/^Art\s*/i, "");
    return {
      kind: "normRef",
      rawQuery,
      normalizedQuery,
      lawAbbreviation: normRef.lawAbbreviation,
      sectionRef: normRef.sectionRef,
      headingRemainder: normRef.headingRemainder,
      searchVariants: dedupe([
        `${normRef.lawAbbreviation} ${normRef.sectionRef}`,
        `${normRef.sectionRef} ${normRef.lawAbbreviation}`,
        `${normRef.lawAbbreviation} ${sectionNumber}`,
        `${sectionNumber} ${normRef.lawAbbreviation}`,
        normRef.headingRemainder ? `${normRef.lawAbbreviation} ${normRef.sectionRef} ${normRef.headingRemainder}` : "",
        normRef.headingRemainder ? `${normRef.sectionRef} ${normRef.lawAbbreviation} ${normRef.headingRemainder}` : "",
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
