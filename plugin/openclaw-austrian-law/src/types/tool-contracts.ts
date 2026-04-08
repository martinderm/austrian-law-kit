import type { ToolResult } from "./shared.js";
import type { FrontmatterBase } from "./frontmatter.js";

export interface SearchHit {
  stable_id: string;
  source_id?: string;
  title: string;
  source_url: string;
  snippet?: string;
  match_reason?: string;
  confidence?: "high" | "medium" | "low";
  scope?: RisScope;
  application?: string;
  state?: AustrianState;
  municipality?: string;
  district?: string;
  law_id?: string;
  content_url?: string;
  whole_law_url?: string;
  document_url?: string;
  document_type?: string;
  legal_type?: string;
  section_ref?: string;
  paragraph_number?: string;
  law_abbreviation?: string;
  promulgation?: string;
  published_at?: string;
  changed_at?: string;
}

export interface CachedArtifact {
  stable_id: string;
  frontmatter: FrontmatterBase;
  content: string;
  metadata?: Record<string, unknown>;
}

export type RisScope = "bund" | "land" | "municipal";
export type AustrianState =
  | "Burgenland"
  | "Kärnten"
  | "Niederösterreich"
  | "Oberösterreich"
  | "Salzburg"
  | "Steiermark"
  | "Tirol"
  | "Vorarlberg"
  | "Wien";

export interface RisSearchInput {
  query: string;
  limit?: number;
  docType?: "norm" | "decision" | "material";
  scope?: RisScope;
  state?: AustrianState;
  municipality?: string;
  district?: string;
  authentic?: boolean;
}
export type RisSearchOutput = ToolResult<{
  hits: SearchHit[];
  best_candidate?: SearchHit;
  normalized_query?: string;
  resolver_kind?: "sourceId" | "normRef" | "freeText";
}>;

export interface RisFetchSegmentInput {
  sourceId?: string;
  sourceUrl?: string;
  contentUrl?: string;
  segmentRef?: string;
  refresh?: boolean;
}
export type RisFetchSegmentOutput = ToolResult<{ artifact: CachedArtifact }>;

export interface RisFetchWholeLawInput {
  sourceId?: string;
  sourceUrl?: string;
  wholeLawUrl?: string;
  refresh?: boolean;
}
export type RisFetchWholeLawOutput = ToolResult<{ artifact: CachedArtifact }>;

export interface JuslineFetchDiscussionsInput {
  query: string;
  limit?: number;
  refresh?: boolean;
}
export type JuslineFetchDiscussionsOutput = ToolResult<{ hits: SearchHit[] }>;

export interface JuslineListDecisionsInput {
  query: string;
  limit?: number;
  refresh?: boolean;
}
export type JuslineListDecisionsOutput = ToolResult<{ hits: SearchHit[] }>;

export interface LawCacheGetInput {
  stableId: string;
  docType?: "norm_segment" | "norm_document" | "decision" | "discussion" | "commentary";
  includeMetadata?: boolean;
}
export type LawCacheGetOutput = ToolResult<{ artifact: CachedArtifact }>;

export interface LawCachePutInput {
  stableId: string;
  frontmatter: FrontmatterBase;
  content: string;
  metadata?: Record<string, unknown>;
}
export type LawCachePutOutput = ToolResult<{
  stable_id: string;
  updated: boolean;
  path?: string;
}>;
