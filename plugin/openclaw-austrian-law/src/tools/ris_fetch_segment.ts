import type { RisFetchSegmentInput, RisFetchSegmentOutput } from "../types/tool-contracts.js";

// TODO: implement tool logic in later step (no fetching/parsing in scaffold phase).
export async function risFetchSegmentStub(_input: RisFetchSegmentInput): Promise<RisFetchSegmentOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "ris_fetch_segment not implemented yet" },
    meta: { tool: "ris_fetch_segment", source: "ris" },
  };
}
