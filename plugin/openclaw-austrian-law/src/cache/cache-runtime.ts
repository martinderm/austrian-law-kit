import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import { getSettings, getSettingsFileDir, configureSettingsWorkspaceDir } from "../config/settings.js";

const CACHE_ROOT_ENV = "OPENCLAW_AUSTRIAN_LAW_CACHE_ROOT";
const DEFAULT_CACHE_ROOT = path.join("memory", "references", "austrian-law");

const cacheRootScope = new AsyncLocalStorage<string | undefined>();
let cacheRootOverride: string | undefined;

export function configureCacheRoot(cacheRoot: string | undefined): void {
  const normalized = cacheRoot?.trim();
  cacheRootOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function deriveWorkspaceScopedCacheRoot(workspaceDir: string): string {
  const settings = getSettings();
  if (settings.cacheRoot && settings.cacheRoot.trim().length > 0) {
    return path.resolve(workspaceDir, settings.cacheRoot.trim());
  }
  return path.resolve(workspaceDir, DEFAULT_CACHE_ROOT);
}

export function resolveToolContextCacheRoot(params: {
  configuredCacheRoot?: string;
  workspaceDir?: string;
}): string | undefined {
  const workspaceDir = params.workspaceDir?.trim();
  if (workspaceDir) {
    configureSettingsWorkspaceDir(workspaceDir);
  }

  const configured = params.configuredCacheRoot?.trim();
  if (configured) {
    return path.resolve(configured);
  }

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

  const settings = getSettings();
  if (settings.cacheRoot && settings.cacheRoot.trim().length > 0) {
    return path.resolve(getSettingsFileDir(), settings.cacheRoot.trim());
  }

  return path.resolve(getSettingsFileDir(), DEFAULT_CACHE_ROOT);
}

const DATA_ROOT_ENV = "OPENCLAW_AUSTRIAN_LAW_DATA_ROOT";
const DEFAULT_DATA_ROOT = path.join("data", "austrian-law");
let dataRootOverride: string | undefined;

export function configureDataRoot(dataRoot: string | undefined): void {
  const normalized = dataRoot?.trim();
  dataRootOverride = normalized && normalized.length > 0 ? normalized : undefined;
}

export function resolveDataRoot(): string {
  if (dataRootOverride) {
    return path.resolve(dataRootOverride);
  }

  const fromEnv = process.env[DATA_ROOT_ENV]?.trim();
  if (fromEnv && fromEnv.length > 0) {
    return path.resolve(fromEnv);
  }

  const settings = getSettings();
  if (settings.dataRoot && settings.dataRoot.trim().length > 0) {
    return path.resolve(getSettingsFileDir(), settings.dataRoot.trim());
  }

  const normalizedSuffix = DEFAULT_CACHE_ROOT.replace(/\\/g, "/");

  const scopedCacheRoot = cacheRootScope.getStore();
  if (scopedCacheRoot) {
    const normPath = scopedCacheRoot.replace(/\\/g, "/");
    if (normPath.endsWith(normalizedSuffix)) {
      const workspaceDir = normPath.substring(0, normPath.length - normalizedSuffix.length);
      return path.resolve(workspaceDir, DEFAULT_DATA_ROOT);
    }
  }

  if (cacheRootOverride) {
    const normPath = cacheRootOverride.replace(/\\/g, "/");
    if (normPath.endsWith(normalizedSuffix)) {
      const workspaceDir = normPath.substring(0, normPath.length - normalizedSuffix.length);
      return path.resolve(workspaceDir, DEFAULT_DATA_ROOT);
    }
  }

  return path.resolve(getSettingsFileDir(), DEFAULT_DATA_ROOT);
}
