import { fetchRisApiJson, buildRisApiUrl } from "./client.js";
import { mapApiDocumentReferences } from "./mappers.js";
import type { RisApiSearchCandidate, RisApiDocumentReference } from "./types.js";

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function inferScopeFromSourceId(sourceId: string): "bund" | "land" {
  return /^L/i.test(sourceId.trim()) ? "land" : "bund";
}

export async function lookupRisApiBySourceId(sourceId: string): Promise<RisApiSearchCandidate | undefined> {
  const normalized = sourceId.trim().toUpperCase();
  if (!normalized) return undefined;

  const scope = inferScopeFromSourceId(normalized);
  const pathname = scope === "land" ? "/Landesrecht" : "/Bundesrecht";
  const application = scope === "land" ? "LrKons" : "BrKons";
  const url = buildRisApiUrl(pathname, {
    Applikation: application,
    Suchworte: normalized,
    Seitennummer: "1",
  });

  const payload = await fetchRisApiJson(url);
  const refs = asArray(payload.OgdSearchResult?.OgdDocumentResults?.OgdDocumentReference as RisApiDocumentReference | RisApiDocumentReference[] | undefined);
  const mapped = mapApiDocumentReferences(refs, {
    query: normalized,
    normalizedQuery: normalized,
    limit: 10,
    scope,
    keywords: normalized,
  });

  return mapped.hits.find((entry) => entry.hit.source_id?.toUpperCase() === normalized);
}
