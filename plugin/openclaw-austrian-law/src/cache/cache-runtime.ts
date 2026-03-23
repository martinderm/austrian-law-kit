import path from "node:path";

const CACHE_ROOT_ENV = "OPENCLAW_AUSTRIAN_LAW_CACHE_ROOT";
const DEFAULT_CACHE_ROOT = path.join("memory", "references", "austrian-law");

let cacheRootOverride: string | undefined;

export function configureCacheRoot(cacheRoot: string | undefined): void {
  const normalized = cacheRoot?.trim();
  cacheRootOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveCacheRoot(): string {
  if (cacheRootOverride) {
    return path.resolve(cacheRootOverride);
  }

  const fromEnv = process.env[CACHE_ROOT_ENV]?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return path.resolve(fromEnv);
  }

  return path.resolve(process.cwd(), DEFAULT_CACHE_ROOT);
}
