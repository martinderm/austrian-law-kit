import type { LawCachePutInput, LawCachePutOutput } from "../types/tool-contracts.js";

// TODO: implement cache write in later step (no cache implementation in scaffold phase).
export async function lawCachePutStub(_input: LawCachePutInput): Promise<LawCachePutOutput> {
  return {
    ok: false,
    error: { code: "NOT_IMPLEMENTED", message: "law_cache_put not implemented yet" },
    meta: { tool: "law_cache_put", source: "internal" },
  };
}
