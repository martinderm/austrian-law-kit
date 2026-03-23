import { promises as fs } from "node:fs";
import path from "node:path";
import type { CachedArtifact } from "../types/tool-contracts.js";
import { buildCacheRelativePaths } from "./cache-paths.js";
import { parseSerializedArtifactMarkdown } from "./parse-artifact.js";
import { buildSerializedArtifact } from "./serialize-artifact.js";

const CACHE_ROOT_ENV = "OPENCLAW_AUSTRIAN_LAW_CACHE_ROOT";
const DEFAULT_CACHE_ROOT = path.join("memory", "references", "austrian-law");

export function resolveCacheRoot(): string {
  const fromEnv = process.env[CACHE_ROOT_ENV]?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : path.resolve(process.cwd(), DEFAULT_CACHE_ROOT);
}

export function toAbsoluteCachePath(relativePath: string): string {
  return path.join(resolveCacheRoot(), relativePath);
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

  const markdownPath = toAbsoluteCachePath(paths.markdownPath);
  const markdownRaw = await fs.readFile(markdownPath, "utf8");
  const parsed = parseSerializedArtifactMarkdown(markdownRaw);

  let metadata: Record<string, unknown> | undefined;
  if (params.includeMetadata) {
    const metadataPath = toAbsoluteCachePath(paths.metadataPath);
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

  const markdownPath = toAbsoluteCachePath(serialized.markdownPath);
  const metadataPath = toAbsoluteCachePath(serialized.metadataPath);

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
    await fs.access(toAbsoluteCachePath(paths.markdownPath));
    return true;
  } catch {
    return false;
  }
}
