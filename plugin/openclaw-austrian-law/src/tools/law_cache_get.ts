import { promises as fs } from "node:fs";
import { assertStableId, getStableIdSource } from "../cache/stable-id.js";
import { buildCacheRelativePaths } from "../cache/cache-paths.js";
import { readArtifactByStableId, toAbsoluteCachePath } from "../cache/cache-io.js";
import type { LawCacheGetInput, LawCacheGetOutput } from "../types/tool-contracts.js";

const DOC_TYPE_CANDIDATES: LawCacheGetInputDocType[] = [
  "norm_segment",
  "norm_document",
  "decision",
  "discussion",
  "commentary",
];

type LawCacheGetInputDocType =
  | "norm_segment"
  | "norm_document"
  | "decision"
  | "discussion"
  | "commentary";

async function detectDocType(stableId: string, source: "ris" | "jusline"): Promise<LawCacheGetInputDocType | null> {
  for (const docType of DOC_TYPE_CANDIDATES) {
    try {
      const paths = buildCacheRelativePaths({
        stableId,
        frontmatter: { source, doc_type: docType },
      });

      await fs.access(toAbsoluteCachePath(paths.markdownPath));
      return docType;
    } catch {
      // try next candidate
    }
  }

  return null;
}

export async function lawCacheGetStub(input: LawCacheGetInput): Promise<LawCacheGetOutput> {
  try {
    const stableId = assertStableId(input.stableId);
    const source = getStableIdSource(stableId);

    if (!source) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: `Unable to detect source from stable_id: ${stableId}` },
        meta: { tool: "law_cache_get", source: "internal" },
      };
    }

    const docType = await detectDocType(stableId, source);
    if (!docType) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `No cache artifact found for stable_id: ${stableId}` },
        meta: { tool: "law_cache_get", source: "internal" },
      };
    }

    const artifact = await readArtifactByStableId({
      stableId,
      source,
      docType,
      includeMetadata: input.includeMetadata ?? false,
    });

    if (artifact.frontmatter.stable_id !== stableId) {
      return {
        ok: false,
        error: {
          code: "CONFLICT",
          message: "Stored frontmatter stable_id differs from requested stableId",
          details: {
            requested: stableId,
            stored: artifact.frontmatter.stable_id,
          },
        },
        meta: { tool: "law_cache_get", source: "internal" },
      };
    }

    return {
      ok: true,
      data: { artifact },
      meta: { tool: "law_cache_get", source: "internal", timestamp: new Date().toISOString() },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return {
      ok: false,
      error: {
        code: message.includes("ENOENT") ? "NOT_FOUND" : "INTERNAL_ERROR",
        message,
      },
      meta: { tool: "law_cache_get", source: "internal" },
    };
  }
}
