export type ToolName =
  | "ris_search"
  | "ris_fetch_segment"
  | "ris_fetch_whole_law"
  | "jusline_fetch_discussions"
  | "jusline_list_decisions"
  | "law_cache_get"
  | "law_cache_put";

export type ToolSourceKind = "ris" | "jusline" | "internal";

export type ToolDefinitionStatus = "stub";

export type ToolErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "POLICY_BLOCKED"
  | "UPSTREAM_UNAVAILABLE"
  | "NOT_IMPLEMENTED"
  | "INTERNAL_ERROR";

export interface ToolError {
  code: ToolErrorCode;
  message: string;
  details?: Record<string, unknown>;
  retryable?: boolean;
}

export interface ToolMeta {
  tool: ToolName;
  source: ToolSourceKind;
  timestamp?: string;
}

export type ToolResult<TData> = {
  ok: true;
  data: TData;
  error?: never;
  meta?: ToolMeta;
} | {
  ok: false;
  data?: never;
  error: ToolError;
  meta?: ToolMeta;
};
