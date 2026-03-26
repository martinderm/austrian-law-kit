import type { FrontmatterBase } from "../types/frontmatter.js";
import { assertStableId, getStableIdSource } from "./stable-id.js";

export type CachePathPair = {
  markdownPath: string;
  metadataPath: string;
};

function resolveDocFolder(source: FrontmatterBase["source"], docType: FrontmatterBase["doc_type"]): string {
  if (source === "ris") {
    if (docType === "norm_segment") return "ris/norms";
    if (docType === "norm_document") return "ris/documents";
    if (docType === "decision") return "ris/decisions";
    return "ris/documents";
  }

  if (docType === "decision") return "jusline/decisions";
  return "jusline/materials";
}

function encodeStableIdForPath(stableId: string): string {
  return stableId.replace(/:/g, "_");
}

export function buildCacheRelativePaths(params: {
  stableId: string;
  frontmatter: Pick<FrontmatterBase, "source" | "doc_type">;
}): CachePathPair {
  const stableId = assertStableId(params.stableId);
  const sourceFromId = getStableIdSource(stableId);

  if (!sourceFromId || sourceFromId !== params.frontmatter.source) {
    throw new Error(
      `stable_id/source mismatch: stable_id=${stableId}, source=${params.frontmatter.source}`,
    );
  }

  const docFolder = resolveDocFolder(params.frontmatter.source, params.frontmatter.doc_type);

  const pathStableId = encodeStableIdForPath(stableId);

  return {
    markdownPath: `${docFolder}/${pathStableId}.md`,
    metadataPath: `${params.frontmatter.source}/metadata/${pathStableId}.json`,
  };
}
