import { promises as fs } from "node:fs";

import { computeSha256 } from "../ris/verification-receipt.js";
import { toAbsoluteDataRootPath, writeFileAtomically } from "./cache-io.js";

export interface ArchivedRawSource {
  sha256: string;
  relativePath: string;
  saved: boolean;
  warning?: string;
}

async function readExistingText(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

export async function archiveRawSource(params: {
  body: string;
  format: "xml" | "html";
  contentType?: string;
}): Promise<ArchivedRawSource> {
  const sha256 = computeSha256(params.body);
  const relativePath = `ris/raw/${sha256}.${params.format}`;
  const absolutePath = toAbsoluteDataRootPath(relativePath);

  try {
    const existing = await readExistingText(absolutePath);
    if (existing !== undefined) {
      if (existing === params.body) {
        return { sha256, relativePath, saved: true };
      }
      return {
        sha256,
        relativePath,
        saved: false,
        warning: `raw archive collision for hash ${sha256}`,
      };
    }

    await writeFileAtomically(absolutePath, params.body);
    return { sha256, relativePath, saved: true };
  } catch (error) {
    return {
      sha256,
      relativePath,
      saved: false,
      warning: `raw_source_archive_failed: ${error instanceof Error ? error.message : "unknown raw archive error"}`,
    };
  }
}
