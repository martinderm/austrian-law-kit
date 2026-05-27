import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { resolveDataRoot } from "../cache/cache-runtime.js";

export interface Settings {
  risBaseUrl?: string;
  risApiBaseUrl?: string;
  juslineBaseUrl?: string;
  [key: string]: unknown;
}

let loadedSettings: Settings | null = null;
let lastResolvedDataRoot: string | null = null;

export function getSettings(): Settings {
  const dataRoot = resolveDataRoot();
  if (loadedSettings && lastResolvedDataRoot === dataRoot) {
    return loadedSettings;
  }

  lastResolvedDataRoot = dataRoot;
  const settingsPath = path.join(dataRoot, "settings.json");
  if (existsSync(settingsPath)) {
    try {
      const raw = readFileSync(settingsPath, "utf8");
      loadedSettings = JSON.parse(raw) as Settings;
    } catch (e) {
      console.warn(`[austrian-law-kit] Warning: Failed to parse settings.json at ${settingsPath}`, e);
      loadedSettings = {};
    }
  } else {
    loadedSettings = {};
  }
  return loadedSettings;
}

export function clearSettingsCache(): void {
  loadedSettings = null;
  lastResolvedDataRoot = null;
}
