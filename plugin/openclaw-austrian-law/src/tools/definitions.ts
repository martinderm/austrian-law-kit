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
    status: "mvp",
    description: "Lädt einen einzelnen RIS-Eintrag als norm_segment (MVP).",
    inputSchemaRef: TOOL_SCHEMA_REFS.ris_fetch_segment,
    outputSchemaRef: "contracts:RisFetchSegmentOutput",
  },
  {
    name: "ris_fetch_whole_law",
    sourceKind: "ris",
    status: "mvp",
    description: "Lädt ein RIS-Gesamtdokument als norm_document (MVP).",
    inputSchemaRef: TOOL_SCHEMA_REFS.ris_fetch_whole_law,
    outputSchemaRef: "contracts:RisFetchWholeLawOutput",
  },
  {
    name: "ris_sync_laws",
    sourceKind: "ris",
    status: "mvp",
    description: "Synchronisiert mehrere Gesetze in einem Aufruf via Name/Query oder URL (MVP).",
    inputSchemaRef: TOOL_SCHEMA_REFS.ris_sync_laws,
    outputSchemaRef: "contracts:RisSyncLawsOutput",
  },
  {
    name: "jusline_fetch_discussions",
    sourceKind: "jusline",
    status: "mvp",
    description: "Lädt optionale Diskussionen/Kommentare aus JUSLINE (Sekundärquelle, MVP).",
    inputSchemaRef: TOOL_SCHEMA_REFS.jusline_fetch_discussions,
    outputSchemaRef: "contracts:JuslineFetchDiscussionsOutput",
  },
  {
    name: "jusline_list_decisions",
    sourceKind: "jusline",
    status: "mvp",
    description: "Listet optionale JUSLINE-Entscheidungen (Sekundärquelle, MVP).",
    inputSchemaRef: TOOL_SCHEMA_REFS.jusline_list_decisions,
    outputSchemaRef: "contracts:JuslineListDecisionsOutput",
  },
] as const;
