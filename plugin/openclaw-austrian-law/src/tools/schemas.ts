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
    },
    required: ["query"],
  },
  ris_fetch_segment: {
    type: "object",
    additionalProperties: false,
    properties: {
      sourceId: { type: "string" },
      sourceUrl: { type: "string" },
      segmentRef: { type: "string" },
      refresh: { type: "boolean" },
    },
  },
  ris_fetch_whole_law: {
    type: "object",
    additionalProperties: false,
    properties: {
      sourceId: { type: "string" },
      sourceUrl: { type: "string" },
      refresh: { type: "boolean" },
    },
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
  law_cache_get: {
    type: "object",
    additionalProperties: false,
    properties: {
      stableId: { type: "string" },
      docType: {
        type: "string",
        enum: ["norm_segment", "norm_document", "decision", "discussion", "commentary"],
      },
      includeMetadata: { type: "boolean" },
    },
    required: ["stableId"],
  },
  law_cache_put: {
    type: "object",
    additionalProperties: false,
    properties: {
      stableId: { type: "string" },
      frontmatter: {
        type: "object",
        additionalProperties: true,
        properties: {
          stable_id: { type: "string" },
          source: { type: "string", enum: ["ris", "jusline"] },
          source_url: { type: "string" },
          doc_type: {
            type: "string",
            enum: ["norm_segment", "norm_document", "discussion", "commentary", "decision"],
          },
          title: { type: "string" },
          fetched_at: { type: "string" },
          version_label: { type: "string" },
          fassung_typ: { type: "string", enum: ["Arbeitsfassung", "verbindliche Fassung"] },
        },
        required: [
          "stable_id",
          "source",
          "source_url",
          "doc_type",
          "title",
          "fetched_at",
          "version_label",
          "fassung_typ"
        ],
      },
      content: { type: "string" },
      metadata: { type: "object", additionalProperties: true },
    },
    required: ["stableId", "frontmatter", "content"],
  },
};

export const TOOL_SCHEMA_REFS: Record<ToolName, string> = {
  ris_search: "schemas:ris_search.input",
  ris_fetch_segment: "schemas:ris_fetch_segment.input",
  ris_fetch_whole_law: "schemas:ris_fetch_whole_law.input",
  jusline_fetch_discussions: "schemas:jusline_fetch_discussions.input",
  jusline_list_decisions: "schemas:jusline_list_decisions.input",
  law_cache_get: "schemas:law_cache_get.input",
  law_cache_put: "schemas:law_cache_put.input",
};
