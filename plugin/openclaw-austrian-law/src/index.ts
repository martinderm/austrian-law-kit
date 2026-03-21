export const TOOL_NAMES = [
  "ris_search",
  "ris_fetch_segment",
  "ris_fetch_whole_law",
  "jusline_fetch_discussions",
  "jusline_list_decisions",
  "law_cache_get",
  "law_cache_put"
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export interface PluginSkeletonInfo {
  id: "openclaw-austrian-law";
  status: "skeleton";
  implemented: false;
  toolsPlanned: readonly ToolName[];
}

export const pluginSkeletonInfo: PluginSkeletonInfo = {
  id: "openclaw-austrian-law",
  status: "skeleton",
  implemented: false,
  toolsPlanned: TOOL_NAMES
};
