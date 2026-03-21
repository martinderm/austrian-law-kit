const STABLE_ID_ALLOWED = /^[a-z0-9._:-]+$/;

export type StableIdSource = "ris" | "jusline";

export function normalizeStableId(input: string): string {
  return input.trim().toLowerCase();
}

export function isStableIdFormatValid(stableId: string): boolean {
  return STABLE_ID_ALLOWED.test(stableId);
}

export function getStableIdSource(stableId: string): StableIdSource | null {
  const normalized = normalizeStableId(stableId);
  if (normalized.startsWith("ris:")) return "ris";
  if (normalized.startsWith("jusline:")) return "jusline";
  return null;
}

export function hasStableIdPrefix(stableId: string): boolean {
  return getStableIdSource(stableId) !== null;
}

export function isStableIdValid(stableId: string): boolean {
  const normalized = normalizeStableId(stableId);
  return hasStableIdPrefix(normalized) && isStableIdFormatValid(normalized);
}

export function assertStableId(stableId: string): string {
  const normalized = normalizeStableId(stableId);
  if (!isStableIdValid(normalized)) {
    throw new Error(`Invalid stable_id: ${stableId}`);
  }
  return normalized;
}
