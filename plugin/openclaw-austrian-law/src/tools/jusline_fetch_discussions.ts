import type {
  JuslineFetchDiscussionsInput,
  JuslineFetchDiscussionsOutput,
} from "../types/tool-contracts.js";

// TODO: implement tool logic in later step (no fetching/parsing in scaffold phase).
export async function juslineFetchDiscussionsStub(
  _input: JuslineFetchDiscussionsInput,
): Promise<JuslineFetchDiscussionsOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "jusline_fetch_discussions not implemented yet" },
    meta: { tool: "jusline_fetch_discussions", source: "jusline" },
  };
}
