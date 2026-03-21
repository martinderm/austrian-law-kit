import type { ToolName } from "../types/shared.js";
import { TOOL_DEFINITIONS, type ToolDefinition } from "./definitions.js";
import { risSearchStub } from "./ris_search.js";
import { risFetchSegmentStub } from "./ris_fetch_segment.js";
import { risFetchWholeLawStub } from "./ris_fetch_whole_law.js";
import { juslineFetchDiscussionsStub } from "./jusline_fetch_discussions.js";
import { juslineListDecisionsStub } from "./jusline_list_decisions.js";
import { lawCacheGetStub } from "./law_cache_get.js";
import { lawCachePutStub } from "./law_cache_put.js";

export const TOOL_STUBS: Record<ToolName, (...args: unknown[]) => Promise<unknown>> = {
  ris_search: risSearchStub as (...args: unknown[]) => Promise<unknown>,
  ris_fetch_segment: risFetchSegmentStub as (...args: unknown[]) => Promise<unknown>,
  ris_fetch_whole_law: risFetchWholeLawStub as (...args: unknown[]) => Promise<unknown>,
  jusline_fetch_discussions: juslineFetchDiscussionsStub as (...args: unknown[]) => Promise<unknown>,
  jusline_list_decisions: juslineListDecisionsStub as (...args: unknown[]) => Promise<unknown>,
  law_cache_get: lawCacheGetStub as (...args: unknown[]) => Promise<unknown>,
  law_cache_put: lawCachePutStub as (...args: unknown[]) => Promise<unknown>,
};

export interface ToolRegistryEntry {
  definition: ToolDefinition;
  stub: (...args: unknown[]) => Promise<unknown>;
}

export const TOOL_REGISTRY: readonly ToolRegistryEntry[] = TOOL_DEFINITIONS.map((definition) => ({
  definition,
  stub: TOOL_STUBS[definition.name],
}));
