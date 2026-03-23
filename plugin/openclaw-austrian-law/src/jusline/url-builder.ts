import { resolveJuslineBaseUrl } from "./runtime.js";

function normalizePathInput(query: string): string | null {
  const normalized = query.trim().replace(/^\/+/, "").replace(/\s+/g, "");
  if (/^[a-z0-9_-]+\/paragraf\/[a-z0-9_-]+$/i.test(normalized)) {
    return `/gesetz/${normalized.toLowerCase()}`;
  }
  if (/^gesetz\/[a-z0-9_-]+\/paragraf\/[a-z0-9_-]+$/i.test(normalized)) {
    return `/${normalized.toLowerCase()}`;
  }
  return null;
}

export function buildJuslineDiscussionsUrl(query: string): string {
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    throw new Error("query must contain at least 3 characters");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed);
    if (!/jusline\.at$/i.test(parsed.hostname)) {
      throw new Error("query URL must target jusline.at");
    }
    return parsed.toString();
  }

  const path = normalizePathInput(trimmed);
  if (!path) {
    throw new Error("query must be a JUSLINE URL or a path like stgb/paragraf/111");
  }

  return new URL(path, resolveJuslineBaseUrl()).toString();
}
