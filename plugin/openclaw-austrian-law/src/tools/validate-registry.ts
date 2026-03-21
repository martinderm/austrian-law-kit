import type { ToolName } from "../types/shared.js";
import { TOOL_DEFINITIONS } from "./definitions.js";
import { TOOL_STUBS } from "./registry.js";
import { TOOL_INPUT_SCHEMAS } from "./schemas.js";

export type RegistryValidationResult = {
  ok: boolean;
  errors: string[];
};

export function validateToolRegistry(): RegistryValidationResult {
  const errors: string[] = [];

  const names = TOOL_DEFINITIONS.map((d) => d.name);
  const unique = new Set(names);
  if (unique.size !== names.length) {
    errors.push("Duplicate tool IDs in TOOL_DEFINITIONS.");
  }

  for (const definition of TOOL_DEFINITIONS) {
    if (!TOOL_STUBS[definition.name]) {
      errors.push(`Missing stub for tool: ${definition.name}`);
    }
    if (!definition.inputSchemaRef) {
      errors.push(`Missing inputSchemaRef in definition: ${definition.name}`);
    }
    if (!TOOL_INPUT_SCHEMAS[definition.name]) {
      errors.push(`Missing input schema object for tool: ${definition.name}`);
    }
  }

  const definitionNames = new Set(TOOL_DEFINITIONS.map((d) => d.name));
  for (const stubName of Object.keys(TOOL_STUBS) as ToolName[]) {
    if (!definitionNames.has(stubName)) {
      errors.push(`Undocumented extra stub tool: ${stubName}`);
    }
  }
  for (const schemaName of Object.keys(TOOL_INPUT_SCHEMAS) as ToolName[]) {
    if (!definitionNames.has(schemaName)) {
      errors.push(`Undocumented extra schema tool: ${schemaName}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
