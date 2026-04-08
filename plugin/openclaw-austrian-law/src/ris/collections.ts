import type { AustrianState, RisScope } from "../types/tool-contracts.js";

export const DEFAULT_RIS_SCOPE: RisScope = "bund";

export const AUSTRIAN_STATES: AustrianState[] = [
  "Burgenland",
  "Kärnten",
  "Niederösterreich",
  "Oberösterreich",
  "Salzburg",
  "Steiermark",
  "Tirol",
  "Vorarlberg",
  "Wien",
];

const STATE_ALIASES: Record<string, AustrianState> = {
  burgenland: "Burgenland",
  kärnten: "Kärnten",
  kaernten: "Kärnten",
  niederösterreich: "Niederösterreich",
  niederoesterreich: "Niederösterreich",
  oberösterreich: "Oberösterreich",
  oberoesterreich: "Oberösterreich",
  salzburg: "Salzburg",
  steiermark: "Steiermark",
  tirol: "Tirol",
  vorarlberg: "Vorarlberg",
  wien: "Wien",
};

export function normalizeAustrianState(value: string | undefined): AustrianState | undefined {
  if (!value) return undefined;
  return STATE_ALIASES[value.trim().toLowerCase()];
}
