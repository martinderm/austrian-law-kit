import type { ToolName } from "../types/shared.js";

export type ToolInputSchema = {
  type: "object";
  additionalProperties: boolean;
  properties: Record<string, unknown>;
  required?: string[];
};

export const TOOL_INPUT_SCHEMAS: Record<ToolName, ToolInputSchema> = {
  ris_search: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string" },
      limit: { type: "number" },
      docType: { type: "string", enum: ["norm", "decision", "material"] },
      scope: { type: "string", enum: ["bund", "land", "municipal"] },
      state: { type: "string", enum: ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"] },
      municipality: { type: "string" },
      district: { type: "string" },
      authentic: { type: "boolean" },
    },
    required: ["query"],
  },
  ris_fetch_segment: {
    type: "object",
    additionalProperties: false,
    properties: {
      sourceId: { type: "string" },
      sourceUrl: { type: "string" },
      contentUrl: { type: "string" },
      segmentRef: { type: "string" },
      refresh: { type: "boolean" },
    },
  },
  ris_fetch_whole_law: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string" },
      sourceId: { type: "string" },
      sourceUrl: { type: "string" },
      wholeLawUrl: { type: "string" },
      scope: { type: "string", enum: ["bund", "land", "municipal"] },
      state: { type: "string", enum: ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"] },
      refresh: { type: "boolean" },
    },
  },
  ris_sync_laws: {
    type: "object",
    additionalProperties: false,
    properties: {
      laws: {
        type: "array",
        items: {
          type: "object",
          properties: {
            query: { type: "string" },
            sourceId: { type: "string" },
            wholeLawUrl: { type: "string" },
            scope: { type: "string", enum: ["bund", "land", "municipal"] },
            state: { type: "string", enum: ["Burgenland", "Kärnten", "Niederösterreich", "Oberösterreich", "Salzburg", "Steiermark", "Tirol", "Vorarlberg", "Wien"] },
            refresh: { type: "boolean" },
          },
        },
      },
    },
    required: ["laws"],
  },
  jusline_fetch_discussions: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string" },
      limit: { type: "number" },
      refresh: { type: "boolean" },
    },
    required: ["query"],
  },
  jusline_list_decisions: {
    type: "object",
    additionalProperties: false,
    properties: {
      query: { type: "string" },
      limit: { type: "number" },
      refresh: { type: "boolean" },
    },
    required: ["query"],
  },
};

export const TOOL_SCHEMA_REFS: Record<ToolName, string> = {
  ris_search: "schemas:ris_search.input",
  ris_fetch_segment: "schemas:ris_fetch_segment.input",
  ris_fetch_whole_law: "schemas:ris_fetch_whole_law.input",
  ris_sync_laws: "schemas:ris_sync_laws.input",
  jusline_fetch_discussions: "schemas:jusline_fetch_discussions.input",
  jusline_list_decisions: "schemas:jusline_list_decisions.input",
};
