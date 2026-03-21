import type { LawCacheGetInput, LawCacheGetOutput } from "../types/tool-contracts.js";

// TODO: implement cache read in later step (no cache implementation in scaffold phase).
export async function lawCacheGetStub(_input: LawCacheGetInput): Promise<LawCacheGetOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "law_cache_get not implemented yet" },
    meta: { tool: "law_cache_get", source: "internal" },
  };
}
