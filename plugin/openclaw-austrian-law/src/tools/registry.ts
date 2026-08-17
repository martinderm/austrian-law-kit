import type { ToolName, ToolResult } from "../types/shared.js";
import { TOOL_DEFINITIONS, type ToolDefinition } from "./definitions.js";
import { TOOL_INPUT_SCHEMAS, type ToolInputSchema } from "./schemas.js";
import { risSearchStub } from "./ris_search.js";
import { risFetchSegmentStub } from "./ris_fetch_segment.js";
import { risFetchWholeLawStub } from "./ris_fetch_whole_law.js";
import { risSyncLawsStub } from "./ris_sync_laws.js";
import { juslineFetchDiscussionsStub } from "./jusline_fetch_discussions.js";
import { juslineListDecisionsStub } from "./jusline_list_decisions.js";

export type ToolStub = (input: unknown) => Promise<ToolResult<unknown>>;

export const TOOL_STUBS: Record<ToolName, ToolStub> = {
  ris_search: risSearchStub as ToolStub,
  ris_fetch_segment: risFetchSegmentStub as ToolStub,
  ris_fetch_whole_law: risFetchWholeLawStub as ToolStub,
  ris_sync_laws: risSyncLawsStub as ToolStub,
  jusline_fetch_discussions: juslineFetchDiscussionsStub as ToolStub,
  jusline_list_decisions: juslineListDecisionsStub as ToolStub,
};

export interface ToolRegistryEntry {
  definition: ToolDefinition;
  inputSchema: ToolInputSchema;
  stub: ToolStub;
}

export const TOOL_REGISTRY: readonly ToolRegistryEntry[] = TOOL_DEFINITIONS.map((definition) => ({
  definition,
  inputSchema: TOOL_INPUT_SCHEMAS[definition.name],
  stub: TOOL_STUBS[definition.name],
}));
