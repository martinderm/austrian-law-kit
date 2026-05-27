import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";

export interface Settings {
  cacheRoot?: string;
  dataRoot?: string;
  risBaseUrl?: string;
  risApiBaseUrl?: string;
  juslineBaseUrl?: string;
  [key: string]: unknown;
}

interface GlobalSettings {
  "austrian-law-kit"?: Settings;
  [key: string]: unknown;
}

let loadedSettings: Settings | null = null;
let settingsFileDir: string | null = null;
let configuredWorkspaceDir: string | undefined;

const workspaceDirScope = new AsyncLocalStorage<string | undefined>();

export function configureSettingsWorkspaceDir(workspaceDir: string | undefined): void {
  configuredWorkspaceDir = workspaceDir ? path.resolve(workspaceDir) : undefined;
  clearSettingsCache();
}

export async function runWithWorkspaceDir<T>(
  workspaceDir: string | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const resolved = workspaceDir ? path.resolve(workspaceDir) : undefined;
  return await workspaceDirScope.run(resolved, fn);
}

export function resolveWorkspaceDir(): string {
  const scoped = workspaceDirScope.getStore();
  if (scoped) {
    return scoped;
  }
  return configuredWorkspaceDir ?? process.cwd();
}

export function getSettingsFileDir(): string {
  if (!loadedSettings) {
    getSettings();
  }
  return settingsFileDir ?? resolveWorkspaceDir();
}

export function getSettings(): Settings {
  if (loadedSettings) {
    return loadedSettings;
  }

  const workspaceDir = resolveWorkspaceDir();
  const lookupDirs: string[] = [workspaceDir];
  if (workspaceDir !== process.cwd()) {
    lookupDirs.push(process.cwd());
  }

  // Check env variable
  const envSettingsPath = process.env.OPENCLAW_AUSTRIAN_LAW_SETTINGS_PATH;
  if (envSettingsPath) {
    const resolvedEnv = path.resolve(envSettingsPath);
    if (existsSync(resolvedEnv)) {
      try {
        const stats = statSync(resolvedEnv);
        if (stats.isDirectory()) {
          lookupDirs.unshift(resolvedEnv);
        } else {
          const raw = readFileSync(resolvedEnv, "utf8");
          const parsed = JSON.parse(raw) as GlobalSettings;
          loadedSettings = parsed["austrian-law-kit"] ?? {};
          settingsFileDir = path.dirname(resolvedEnv);
          return loadedSettings;
        }
      } catch (e) {
        console.warn(`[austrian-law-kit] Warning: Failed to parse settings from env path ${resolvedEnv}`, e);
      }
    }
  }

  // Search candidates
  for (const dir of lookupDirs) {
    const file = path.join(dir, "settings.json");
    if (existsSync(file)) {
      try {
        const raw = readFileSync(file, "utf8");
        const parsed = JSON.parse(raw) as GlobalSettings;
        loadedSettings = parsed["austrian-law-kit"] ?? {};
        settingsFileDir = path.dirname(file);
        return loadedSettings;
      } catch (e) {
        console.warn(`[austrian-law-kit] Warning: Failed to parse settings at ${file}`, e);
      }
    }
  }

  loadedSettings = {};
  settingsFileDir = workspaceDir;
  return loadedSettings;
}

export function clearSettingsCache(): void {
  loadedSettings = null;
  settingsFileDir = null;
}
