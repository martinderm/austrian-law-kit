import { assertStableId } from "../cache/stable-id.js";
import { artifactExistsByStableId, writeArtifact } from "../cache/cache-io.js";
import type { LawCachePutInput, LawCachePutOutput } from "../types/tool-contracts.js";

export async function lawCachePutStub(input: LawCachePutInput): Promise<LawCachePutOutput> {
  try {
    const stableId = assertStableId(input.stableId);

    if (input.frontmatter.stable_id !== stableId) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "stableId and frontmatter.stable_id must match",
          details: {
            stableId,
            frontmatterStableId: input.frontmatter.stable_id,
          },
        },
        meta: { tool: "law_cache_put", source: "internal" },
      };
    }

    const existedBefore = await artifactExistsByStableId({
      stableId,
      source: input.frontmatter.source,
      docType: input.frontmatter.doc_type,
    });

    const written = await writeArtifact({
      stable_id: stableId,
      frontmatter: input.frontmatter,
      content: input.content,
      metadata: input.metadata,
    });

    return {
      ok: true,
      data: {
        stable_id: stableId,
        updated: existedBefore,
        path: written.markdownPath,
      },
      meta: { tool: "law_cache_put", source: "internal", timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      ok: false,
      error: {
        code: message.startsWith("Invalid stable_id") || message.includes("stable_id/source mismatch")
          ? "VALIDATION_ERROR"
          : "INTERNAL_ERROR",
        message,
      },
      meta: { tool: "law_cache_put", source: "internal" },
    };
  }
}
