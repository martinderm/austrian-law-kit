import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";

const CACHE_ROOT_ENV = "OPENCLAW_AUSTRIAN_LAW_CACHE_ROOT";
const DEFAULT_CACHE_ROOT = path.join("memory", "references", "austrian-law");

const cacheRootScope = new AsyncLocalStorage<string | undefined>();
let cacheRootOverride: string | undefined;

export function configureCacheRoot(cacheRoot: string | undefined): void {
  const normalized = cacheRoot?.trim();
  cacheRootOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function deriveWorkspaceScopedCacheRoot(workspaceDir: string): string {
  return path.resolve(workspaceDir, DEFAULT_CACHE_ROOT);
}

export function resolveToolContextCacheRoot(params: {
  configuredCacheRoot?: string;
  workspaceDir?: string;
}): string | undefined {
  const configured = params.configuredCacheRoot?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  const workspaceDir = params.workspaceDir?.trim();
  if (workspaceDir) {
    return deriveWorkspaceScopedCacheRoot(workspaceDir);
  }

  return undefined;
}

export async function runWithCacheRoot<T>(
  cacheRoot: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const normalized = cacheRoot?.trim();
  const scoped = normalized && normalized.length > 0 ? path.resolve(normalized) : undefined;
  return await cacheRootScope.run(scoped, fn);
}

export function resolveCacheRoot(): string {
  const scopedCacheRoot = cacheRootScope.getStore();
  if (scopedCacheRoot) {
    return scopedCacheRoot;
  }

  if (cacheRootOverride) {
    return path.resolve(cacheRootOverride);
  }

  const fromEnv = process.env[CACHE_ROOT_ENV]?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return path.resolve(fromEnv);
  }

  return path.resolve(process.cwd(), DEFAULT_CACHE_ROOT);
}
