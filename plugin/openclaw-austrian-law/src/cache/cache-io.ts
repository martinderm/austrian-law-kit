import { createHash } from "node:crypto";
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

const RENAME_RETRY_CODES = new Set(["EPERM", "EACCES", "EBUSY", "EEXIST"]);

function errorCode(error: unknown): string | undefined {
  return (error as NodeJS.ErrnoException | undefined)?.code;
}

function consistencyMismatch(detail: string): Error {
  return new Error(`Cache consistency mismatch: ${detail}`);
}

function buildGenerationId(markdownContent: string, metadataContent: string): string {
  return createHash("sha256")
    .update(markdownContent, "utf8")
    .update("\u0000", "utf8")
    .update(metadataContent, "utf8")
    .digest("hex")
    .slice(0, 16);
}

async function removeFileBestEffort(filePath: string): Promise<void> {
  try {
    await fs.rm(filePath, { force: true });
  } catch {
    return;
  }
}

async function sweepOrphanedTemps(finalPath: string): Promise<void> {
  const dir = path.dirname(finalPath);
  const prefix = `${path.basename(finalPath)}.tmp-`;
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return;
  }
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith(prefix))
      .map((entry) => removeFileBestEffort(path.join(dir, entry))),
  );
}

async function assertTempWritten(filePath: string, content: string): Promise<void> {
  const stats = await fs.stat(filePath);
  const expectedSize = Buffer.byteLength(content, "utf8");
  if (!stats.isFile() || stats.size !== expectedSize) {
    throw new Error(`Cache write temp verification failed: ${filePath}`);
  }
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  try {
    await fs.rename(from, to);
    return;
  } catch (error) {
    if (!RENAME_RETRY_CODES.has(errorCode(error) ?? "")) {
      throw error;
    }
  }
  await fs.rename(from, to);
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

  let parsed: Pick<CachedArtifact, "frontmatter" | "content">;
  try {
    parsed = parseSerializedArtifactMarkdown(markdownRaw);
  } catch (error) {
    throw consistencyMismatch(
      `incomplete artifact pair (markdown unreadable): ${error instanceof Error ? error.message : "unknown markdown error"}`,
    );
  }

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
    let metadataRaw: string;
    try {
      metadataRaw = await fs.readFile(metadataPath, "utf8");
    } catch (error) {
      if (errorCode(error) === "ENOENT") {
        throw consistencyMismatch("incomplete artifact pair (metadata missing)");
      }
      throw error;
    }

    let metadataParsed: { stable_id?: unknown; frontmatter?: unknown; metadata?: Record<string, unknown> };
    try {
      metadataParsed = JSON.parse(metadataRaw) as typeof metadataParsed;
    } catch (error) {
      throw consistencyMismatch(
        `incomplete artifact pair (metadata unreadable): ${error instanceof Error ? error.message : "unknown metadata error"}`,
      );
    }

    if (!metadataParsed || typeof metadataParsed !== "object") {
      throw consistencyMismatch("incomplete artifact pair (metadata malformed)");
    }

    const metadataStableId = metadataParsed.stable_id;
    const metadataFrontmatter = metadataParsed.frontmatter;
    if (
      typeof metadataStableId !== "string"
      || metadataStableId.length === 0
      || !metadataFrontmatter
      || typeof metadataFrontmatter !== "object"
    ) {
      throw consistencyMismatch("incomplete artifact pair (metadata structure incomplete)");
    }

    if (metadataStableId !== parsed.frontmatter.stable_id) {
      throw consistencyMismatch("metadata/markdown generation mismatch (stable_id)");
    }

    const markdownFetchedAt = parsed.frontmatter.fetched_at;
    const metadataFetchedAt = (metadataFrontmatter as Record<string, unknown>).fetched_at;
    if (
      markdownFetchedAt !== undefined
      && metadataFetchedAt !== undefined
      && String(markdownFetchedAt) !== String(metadataFetchedAt)
    ) {
      throw consistencyMismatch("metadata/markdown generation mismatch (fetched_at)");
    }

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

  const generationId = buildGenerationId(serialized.markdownContent, serialized.metadataContent);
  const markdownTempPath = `${markdownPath}.tmp-${generationId}`;
  const metadataTempPath = `${metadataPath}.tmp-${generationId}`;
  const metadataBackupPath = `${metadataPath}.prev-${generationId}`;

  await ensureParentDir(markdownPath);
  await ensureParentDir(metadataPath);
  await sweepOrphanedTemps(markdownPath);
  await sweepOrphanedTemps(metadataPath);

  let metadataBackedUp = false;
  const rollbackMetadata = async (): Promise<void> => {
    if (metadataBackedUp) {
      await renameWithRetry(metadataBackupPath, metadataPath);
      metadataBackedUp = false;
      return;
    }
    await removeFileBestEffort(metadataPath);
  };

  try {
    await fs.writeFile(markdownTempPath, serialized.markdownContent, "utf8");
    await fs.writeFile(metadataTempPath, serialized.metadataContent, "utf8");
    await assertTempWritten(markdownTempPath, serialized.markdownContent);
    await assertTempWritten(metadataTempPath, serialized.metadataContent);

    try {
      await renameWithRetry(metadataPath, metadataBackupPath);
      metadataBackedUp = true;
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }

    try {
      await renameWithRetry(metadataTempPath, metadataPath);
      await renameWithRetry(markdownTempPath, markdownPath);
    } catch (publishError) {
      await rollbackMetadata();
      throw publishError;
    }

    if (metadataBackedUp) {
      await removeFileBestEffort(metadataBackupPath);
      metadataBackedUp = false;
    }
  } catch (error) {
    await removeFileBestEffort(markdownTempPath);
    await removeFileBestEffort(metadataTempPath);
    throw error;
  }

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
