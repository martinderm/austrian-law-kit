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

export type RetrievalMethod =
  | "direct_source_id"
  | "eli_url"
  | "norm_document_url"
  | "ris_api_discovery"
  | "ris_html_search"
  | "web_search_fallback";

export type VerificationStatus =
  | "verified_current"
  | "historical_valid_for_stichtag"
  | "stichtag_mismatch"
  | "insufficient_metadata"
  | "unverified_fallback";

export interface VerificationReceipt {
  source_id?: string | null;
  gesetzesnummer?: string | null;
  dokumentnummer?: string | null;
  eli?: string | null;
  paragraf?: string | null;
  consolidated_as_of: string | null;
  retrieved_at: string;
  effective_from?: string | null;
  effective_to?: string | null;
  norm_status?: "in_force" | "current" | "historical" | "repealed" | "unknown";
  kundmachungsorgan?: string | null;
  raw_content_sha256: string;
  normalized_content_sha256: string;
  content_sha256: string;
  retrieval_method: RetrievalMethod;
  cached: boolean;
  verification_status: VerificationStatus;
  fallback_reason?: string | null;
  stichtag: string;
  warning?: string | null;
}

export interface LegalReviewJudicatureItem {
  source_id?: string;
  title: string;
  url?: string;
  court?: string;
  decision_date?: string;
  case_number?: string;
  summary?: string;
}

export interface LegalReviewResponse {
  norm_text: string;
  metadata: {
    title: string;
    stable_id: string;
    source_id?: string;
    verification_receipt: VerificationReceipt;
    [key: string]: unknown;
  };
  paraphrase?: string;
  judicature?: LegalReviewJudicatureItem[];
  conclusion?: string;
}

export interface CachedArtifact {
  stable_id: string;
  frontmatter: FrontmatterBase;
  content: string;
  metadata?: Record<string, unknown> & {
    verification_receipt?: VerificationReceipt;
  };
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
  stichtag?: string;
}
export type RisSearchOutput = ToolResult<{
  hits: SearchHit[];
  best_candidate?: SearchHit;
  normalized_query?: string;
  resolver_kind?: "sourceId" | "normRef" | "freeText";
  stichtag?: string;
}>;

export interface RisFetchSegmentInput {
  sourceId?: string;
  sourceUrl?: string;
  contentUrl?: string;
  segmentRef?: string;
  refresh?: boolean;
  stichtag?: string;
}
export type RisFetchSegmentOutput = ToolResult<{
  artifact: CachedArtifact;
  receipt?: VerificationReceipt;
}>;

export interface RisFetchWholeLawInput {
  query?: string;
  sourceId?: string;
  sourceUrl?: string;
  wholeLawUrl?: string;
  scope?: RisScope;
  state?: AustrianState;
  refresh?: boolean;
  stichtag?: string;
}
export type RisFetchWholeLawOutput = ToolResult<{
  artifact: CachedArtifact;
  receipt?: VerificationReceipt;
}>;

export interface RisSyncLawsItem {
  query?: string;
  sourceId?: string;
  wholeLawUrl?: string;
  segmentUrl?: string;
  paragraph?: string;
  sectionRef?: string;
  scope?: RisScope;
  state?: AustrianState;
  refresh?: boolean;
  stichtag?: string;
}

export interface RisSyncLawsInput {
  laws: RisSyncLawsItem[];
  stichtag?: string;
}

export interface SyncedLawResult {
  query?: string;
  paragraph?: string;
  stable_id?: string;
  source_id?: string;
  title?: string;
  law_id?: string;
  source_url?: string;
  cached: boolean;
  ok: boolean;
  error?: string;
  receipt?: VerificationReceipt;
}

export type RisSyncLawsOutput = ToolResult<{
  total: number;
  synced: number;
  cached: number;
  failed: number;
  deduplicated?: number;
  laws: SyncedLawResult[];
}>;

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
