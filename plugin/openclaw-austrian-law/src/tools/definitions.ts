import type { ToolName, ToolSourceKind, ToolDefinitionStatus } from "../types/shared.js";

export interface ToolDefinition {
  name: ToolName;
  sourceKind: ToolSourceKind;
  status: ToolDefinitionStatus;
  description: string;
  inputSchemaRef?: string;
  outputSchemaRef?: string;
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
  {
    name: "ris_search",
    sourceKind: "ris",
    status: "stub",
    description: "Sucht RIS-Treffer (Primärquelle).",
    inputSchemaRef: "contracts:RisSearchInput",
    outputSchemaRef: "contracts:RisSearchOutput",
  },
  {
    name: "ris_fetch_segment",
    sourceKind: "ris",
    status: "stub",
    description: "Lädt ein RIS-Normsegment (Primärquelle).",
    inputSchemaRef: "contracts:RisFetchSegmentInput",
    outputSchemaRef: "contracts:RisFetchSegmentOutput",
  },
  {
    name: "ris_fetch_whole_law",
    sourceKind: "ris",
    status: "stub",
    description: "Lädt ein RIS-Gesamtdokument (Primärquelle).",
    inputSchemaRef: "contracts:RisFetchWholeLawInput",
    outputSchemaRef: "contracts:RisFetchWholeLawOutput",
  },
  {
    name: "jusline_fetch_discussions",
    sourceKind: "jusline",
    status: "stub",
    description: "Lädt optionale Diskussionen/Kommentare aus JUSLINE (Sekundärquelle).",
    inputSchemaRef: "contracts:JuslineFetchDiscussionsInput",
    outputSchemaRef: "contracts:JuslineFetchDiscussionsOutput",
  },
  {
    name: "jusline_list_decisions",
    sourceKind: "jusline",
    status: "stub",
    description: "Listet optionale JUSLINE-Entscheidungen (Sekundärquelle).",
    inputSchemaRef: "contracts:JuslineListDecisionsInput",
    outputSchemaRef: "contracts:JuslineListDecisionsOutput",
  },
  {
    name: "law_cache_get",
    sourceKind: "internal",
    status: "stub",
    description: "Liest Law-Cache-Artefakte per Stable ID.",
    inputSchemaRef: "contracts:LawCacheGetInput",
    outputSchemaRef: "contracts:LawCacheGetOutput",
  },
  {
    name: "law_cache_put",
    sourceKind: "internal",
    status: "stub",
    description: "Schreibt/aktualisiert Law-Cache-Artefakte.",
    inputSchemaRef: "contracts:LawCachePutInput",
    outputSchemaRef: "contracts:LawCachePutOutput",
  },
] as const;
