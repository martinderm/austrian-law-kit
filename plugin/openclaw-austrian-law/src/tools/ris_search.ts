import type { RisSearchInput, RisSearchOutput } from "../types/tool-contracts.js";

// TODO: implement tool logic in later step (no fetching/parsing in scaffold phase).
export async function risSearchStub(_input: RisSearchInput): Promise<RisSearchOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "ris_search not implemented yet" },
    meta: { tool: "ris_search", source: "ris" },
  };
}
