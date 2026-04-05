import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import { resolveCacheRoot } from "./cache-runtime.js";

export type JuslineQueryIndexKind = "discussions" | "decisions";

export interface JuslineQueryIndexRecord {
  query: string;
  kind: JuslineQueryIndexKind;
  limit: number;
  stable_ids: string[];
  stored_at: string;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

function buildIndexKey(params: { query: string; kind: JuslineQueryIndexKind; limit: number }): string {
  const normalized = JSON.stringify({
    query: normalizeQuery(params.query),
    kind: params.kind,
    limit: params.limit,
  });
  return createHash("sha1").update(normalized).digest("hex");
}

function buildIndexPath(params: { query: string; kind: JuslineQueryIndexKind; limit: number }): string {
  return path.join(resolveCacheRoot(), "jusline", "query-index", `${buildIndexKey(params)}.json`);
}

export async function readJuslineQueryIndex(params: {
  query: string;
  kind: JuslineQueryIndexKind;
  limit: number;
}): Promise<JuslineQueryIndexRecord | null> {
  try {
    const filePath = buildIndexPath(params);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as JuslineQueryIndexRecord;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ENOENT") || message.includes("no such file")) return null;
    throw error;
  }
}

export async function writeJuslineQueryIndex(record: JuslineQueryIndexRecord): Promise<string> {
  const filePath = buildIndexPath({ query: record.query, kind: record.kind, limit: record.limit });
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(record, null, 2), "utf8");
  return filePath;
}
