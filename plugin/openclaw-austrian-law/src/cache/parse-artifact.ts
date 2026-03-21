import type { FrontmatterBase } from "../types/frontmatter.js";
import type { CachedArtifact } from "../types/tool-contracts.js";

function parseYamlScalar(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return trimmed;
}

export function parseSerializedArtifactMarkdown(markdown: string): Pick<CachedArtifact, "frontmatter" | "content"> {
  const parts = markdown.split("\n---\n");
  if (!markdown.startsWith("---\n") || parts.length < 2) {
    throw new Error("Invalid artifact markdown format");
  }

  const yamlBlock = parts[0].slice(4);
  const content = parts.slice(1).join("\n---\n").replace(/^\n/, "");
  const lines = yamlBlock.split("\n").filter(Boolean);

  const parsed: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const valueRaw = line.slice(idx + 1);
    parsed[key] = parseYamlScalar(valueRaw);
  }

  return {
    frontmatter: parsed as unknown as FrontmatterBase,
    content,
  };
}
