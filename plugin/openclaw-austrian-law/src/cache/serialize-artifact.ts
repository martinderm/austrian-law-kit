import type { CachedArtifact } from "../types/tool-contracts.js";
import { buildCacheRelativePaths } from "./cache-paths.js";

function formatYamlScalar(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return '""';
  const text = String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n");
  return `"${text}"`;
}

export function serializeFrontmatterYaml(frontmatter: Record<string, unknown>): string {
  const preferredOrder = [
    "stable_id",
    "source",
    "source_url",
    "doc_type",
    "title",
    "fetched_at",
    "version_label",
    "fassung_typ",
  ];

  const keys = Object.keys(frontmatter);
  const ordered = [
    ...preferredOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferredOrder.includes(k)).sort(),
  ];

  return ordered.map((key) => `${key}: ${formatYamlScalar(frontmatter[key])}`).join("\n");
}

export function serializeArtifactMarkdown(artifact: CachedArtifact): string {
  const yaml = serializeFrontmatterYaml(artifact.frontmatter as unknown as Record<string, unknown>);
  return `---\n${yaml}\n---\n\n${artifact.content}`;
}

export function serializeArtifactMetadataJson(artifact: CachedArtifact): string {
  return JSON.stringify(
    {
      stable_id: artifact.stable_id,
      frontmatter: artifact.frontmatter,
      metadata: artifact.metadata ?? {},
    },
    null,
    2,
  );
}

export function buildSerializedArtifact(artifact: CachedArtifact): {
  markdownPath: string;
  metadataPath: string;
  markdownContent: string;
  metadataContent: string;
} {
  const paths = buildCacheRelativePaths({
    stableId: artifact.stable_id,
    frontmatter: {
      source: artifact.frontmatter.source,
      doc_type: artifact.frontmatter.doc_type,
    },
  });

  return {
    markdownPath: paths.markdownPath,
    metadataPath: paths.metadataPath,
    markdownContent: serializeArtifactMarkdown(artifact),
    metadataContent: serializeArtifactMetadataJson(artifact),
  };
}
