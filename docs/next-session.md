# Next Session

## So weitermachen (kurz)

1. Erst Verträge lesen.
2. Dann den aktuellen Plugin-Stand prüfen.
3. Danach nur den nächsten lokalen Schritt umsetzen (Cache-I/O), ohne Netzlogik.

## Reihenfolge: Welche Dateien zuerst lesen

1. `README.md`
2. `docs/current-status.md`
3. `docs/tool-contracts.md`
4. `docs/tool-registration-plan.md`
5. `docs/cache-implementation-plan.md`
6. `docs/frontmatter-schema.md`
7. `docs/stable-id-strategy.md`

Dann Code:
- `plugin/openclaw-austrian-law/index.ts`
- `plugin/openclaw-austrian-law/src/tools/registry.ts`
- `plugin/openclaw-austrian-law/src/cache/*`

## Nächster konkreter Implementierungsschritt

**Nach RIS-MVP-Härtung: gezielte Qualitätsabsicherung fortsetzen (ohne neue RIS-Funktionen):**
- Edge-Cases für Parser-/Meta-Signale in Tests weiter absichern
- selektive Parser-Robustheit weiter verbessern, ohne Scope-Ausweitung

## Abnahmekriterien für diesen Schritt

- bestehende RIS-MVP-Tools bleiben stabil nutzbar.
- keine neue RIS-Funktion in diesem Schritt.
- Keine JUSLINE-Produktivlogik eingeführt.

## Ausdrücklich noch NICHT machen

- kein JUSLINE-Fetching
- keine breite HTML/XML-Parser-Ausweitung
- keine inhaltliche Normalisierung von Rechtstexten
- keine produktive Interpretation/Extraction-Engine
