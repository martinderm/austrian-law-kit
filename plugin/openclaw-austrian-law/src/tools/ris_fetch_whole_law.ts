import type { RisFetchWholeLawInput, RisFetchWholeLawOutput } from "../types/tool-contracts.js";

// TODO: implement tool logic in later step (no fetching/parsing in scaffold phase).
export async function risFetchWholeLawStub(_input: RisFetchWholeLawInput): Promise<RisFetchWholeLawOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "ris_fetch_whole_law not implemented yet" },
    meta: { tool: "ris_fetch_whole_law", source: "ris" },
  };
}
