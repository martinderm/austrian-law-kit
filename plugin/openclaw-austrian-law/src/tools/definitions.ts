import type { ToolName, ToolSourceKind, ToolDefinitionStatus } from "../types/shared.js";
import { TOOL_SCHEMA_REFS } from "./schemas.js";

export interface ToolDefinition {
  name: ToolName;
  sourceKind: ToolSourceKind;
  status: ToolDefinitionStatus;
  description: string;
  inputSchemaRef: string;
  outputSchemaRef?: string;
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: "ris_search",
    sourceKind: "ris",
    status: "mvp",
    description: "Sucht RIS-Treffer (Primärquelle, MVP).",
    inputSchemaRef: TOOL_SCHEMA_REFS.ris_search,
    outputSchemaRef: "contracts:RisSearchOutput",
  },
  {
    name: "ris_fetch_segment",
    sourceKind: "ris",
    status: "stub",
    description: "Lädt ein RIS-Normsegment (Primärquelle).",
    inputSchemaRef: TOOL_SCHEMA_REFS.ris_fetch_segment,
    outputSchemaRef: "contracts:RisFetchSegmentOutput",
  },
  {
    name: "ris_fetch_whole_law",
    sourceKind: "ris",
    status: "stub",
    description: "Lädt ein RIS-Gesamtdokument (Primärquelle).",
    inputSchemaRef: TOOL_SCHEMA_REFS.ris_fetch_whole_law,
    outputSchemaRef: "contracts:RisFetchWholeLawOutput",
  },
  {
    name: "jusline_fetch_discussions",
    sourceKind: "jusline",
    status: "stub",
    description: "Lädt optionale Diskussionen/Kommentare aus JUSLINE (Sekundärquelle).",
    inputSchemaRef: TOOL_SCHEMA_REFS.jusline_fetch_discussions,
    outputSchemaRef: "contracts:JuslineFetchDiscussionsOutput",
  },
  {
    name: "jusline_list_decisions",
    sourceKind: "jusline",
    status: "stub",
    description: "Listet optionale JUSLINE-Entscheidungen (Sekundärquelle).",
    inputSchemaRef: TOOL_SCHEMA_REFS.jusline_list_decisions,
    outputSchemaRef: "contracts:JuslineListDecisionsOutput",
  },
  {
    name: "law_cache_get",
    sourceKind: "internal",
    status: "stub",
    description: "Liest Law-Cache-Artefakte per Stable ID.",
    inputSchemaRef: TOOL_SCHEMA_REFS.law_cache_get,
    outputSchemaRef: "contracts:LawCacheGetOutput",
  },
  {
    name: "law_cache_put",
    sourceKind: "internal",
    status: "stub",
    description: "Schreibt/aktualisiert Law-Cache-Artefakte.",
    inputSchemaRef: TOOL_SCHEMA_REFS.law_cache_put,
    outputSchemaRef: "contracts:LawCachePutOutput",
  },
] as const;
