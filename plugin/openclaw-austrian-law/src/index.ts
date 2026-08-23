import type { ToolName } from "./types/shared.js";

export const TOOL_NAMES: readonly ToolName[] = [
  "ris_search",
  "ris_fetch_segment",
  "ris_fetch_whole_law",
  "ris_sync_laws",
  "jusline_fetch_discussions",
  "jusline_list_decisions",
] as const;

export interface PluginInfo {
  id: "austrian-law-kit";
  status: string;
  implemented: boolean;
  toolsPlanned: readonly ToolName[];
}

export const pluginInfo: PluginInfo = {
  id: "austrian-law-kit",
  status: "mvp",
  implemented: true,
  toolsPlanned: TOOL_NAMES,
};
