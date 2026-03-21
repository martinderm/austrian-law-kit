import type {
  JuslineListDecisionsInput,
  JuslineListDecisionsOutput,
} from "../types/tool-contracts.js";

// TODO: implement tool logic in later step (no fetching/parsing in scaffold phase).
export async function juslineListDecisionsStub(
  _input: JuslineListDecisionsInput,
): Promise<JuslineListDecisionsOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "jusline_list_decisions not implemented yet" },
    meta: { tool: "jusline_list_decisions", source: "jusline" },
  };
}
