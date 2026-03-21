import type { ToolResult } from "./shared.js";

export interface SearchHit {
  stable_id: string;
  source_id?: string;
  title: string;
  source_url: string;
  snippet?: string;
}

export interface CachedArtifact {
  stable_id: string;
  frontmatter: Record<string, unknown>;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface RisSearchInput {
  query: string;
  limit?: number;
  docType?: "norm" | "decision" | "material";
}
export type RisSearchOutput = ToolResult<{ hits: SearchHit[] }>;

export interface RisFetchSegmentInput {
  docId: string;
  segmentId: string;
  versionId?: string;
}
export type RisFetchSegmentOutput = ToolResult<{ artifact: CachedArtifact }>;

export interface RisFetchWholeLawInput {
  docId: string;
  versionId?: string;
}
export type RisFetchWholeLawOutput = ToolResult<{ artifact: CachedArtifact }>;

export interface JuslineFetchDiscussionsInput {
  query: string;
  limit?: number;
}
export type JuslineFetchDiscussionsOutput = ToolResult<{ hits: SearchHit[] }>;

export interface JuslineListDecisionsInput {
  query: string;
  limit?: number;
}
export type JuslineListDecisionsOutput = ToolResult<{ hits: SearchHit[] }>;

export interface LawCacheGetInput {
  stableId: string;
  includeMetadata?: boolean;
}
export type LawCacheGetOutput = ToolResult<{ artifact: CachedArtifact }>;

export interface LawCachePutInput {
  stableId: string;
  frontmatter: Record<string, unknown>;
  content: string;
  metadata?: Record<string, unknown>;
}
export type LawCachePutOutput = ToolResult<{
  stable_id: string;
  updated: boolean;
  path?: string;
}>;
