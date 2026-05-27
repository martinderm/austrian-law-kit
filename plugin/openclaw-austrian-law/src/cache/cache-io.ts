import { promises as fs } from "node:fs";
import path from "node:path";
import type { CachedArtifact } from "../types/tool-contracts.js";
import { buildCacheRelativePaths } from "./cache-paths.js";
import { resolveCacheRoot, resolveDataRoot } from "./cache-runtime.js";
import { parseSerializedArtifactMarkdown } from "./parse-artifact.js";
import { buildSerializedArtifact } from "./serialize-artifact.js";

export function toAbsoluteMarkdownPath(relativePath: string): string {
  return path.join(resolveCacheRoot(), relativePath);
}

export function toAbsoluteMetadataPath(relativePath: string): string {
  return path.join(resolveDataRoot(), relativePath);
}

async function ensureParentDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function readArtifactByStableId(params: {
  stableId: string;
  source: "ris" | "jusline";
  docType: CachedArtifact["frontmatter"]["doc_type"];
  includeMetadata: boolean;
}): Promise<CachedArtifact> {
  const paths = buildCacheRelativePaths({
    stableId: params.stableId,
    frontmatter: { source: params.source, doc_type: params.docType },
  });

  const markdownPath = toAbsoluteMarkdownPath(paths.markdownPath);
  const markdownRaw = await fs.readFile(markdownPath, "utf8");
  const parsed = parseSerializedArtifactMarkdown(markdownRaw);

  if (parsed.frontmatter.source !== params.source) {
    throw new Error(
      `Cache consistency mismatch: frontmatter.source=${parsed.frontmatter.source} expected=${params.source}`,
    );
  }

  if (parsed.frontmatter.doc_type !== params.docType) {
    throw new Error(
      `Cache consistency mismatch: frontmatter.doc_type=${parsed.frontmatter.doc_type} expected=${params.docType}`,
    );
  }

  let metadata: Record<string, unknown> | undefined;
  if (params.includeMetadata) {
    const metadataPath = toAbsoluteMetadataPath(paths.metadataPath);
    const metadataRaw = await fs.readFile(metadataPath, "utf8");
    const metadataParsed = JSON.parse(metadataRaw) as { metadata?: Record<string, unknown> };
    metadata = metadataParsed.metadata ?? {};
  }

  return {
    stable_id: params.stableId,
    frontmatter: parsed.frontmatter,
    content: parsed.content,
    metadata,
  };
}

export async function writeArtifact(artifact: CachedArtifact): Promise<{ markdownPath: string }> {
  const serialized = buildSerializedArtifact(artifact);

  const markdownPath = toAbsoluteMarkdownPath(serialized.markdownPath);
  const metadataPath = toAbsoluteMetadataPath(serialized.metadataPath);

  await ensureParentDir(markdownPath);
  await ensureParentDir(metadataPath);

  await Promise.all([
    fs.writeFile(markdownPath, serialized.markdownContent, "utf8"),
    fs.writeFile(metadataPath, serialized.metadataContent, "utf8"),
  ]);

  return { markdownPath };
}

export async function artifactExistsByStableId(params: {
  stableId: string;
  source: "ris" | "jusline";
  docType: CachedArtifact["frontmatter"]["doc_type"];
}): Promise<boolean> {
  const paths = buildCacheRelativePaths({
    stableId: params.stableId,
    frontmatter: { source: params.source, doc_type: params.docType },
  });

  try {
    await fs.access(toAbsoluteMarkdownPath(paths.markdownPath));
    return true;
  } catch {
    return false;
  }
}
