import type { ToolName } from "./types/shared.js";

export const TOOL_NAMES: readonly ToolName[] = [
  "ris_search",
  "ris_fetch_segment",
  "ris_fetch_whole_law",
  "jusline_fetch_discussions",
  "jusline_list_decisions",
  "law_cache_get",
  "law_cache_put",
] as const;

export interface PluginSkeletonInfo {
  id: "austrian-law-kit";
  status: "skeleton";
  implemented: false;
  toolsPlanned: readonly ToolName[];
}

export const pluginSkeletonInfo: PluginSkeletonInfo = {
  id: "austrian-law-kit",
  status: "skeleton",
  implemented: false,
  toolsPlanned: TOOL_NAMES,
};
