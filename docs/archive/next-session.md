# Next Session

## So weitermachen (kurz)

1. Erst Verträge lesen (`docs/tool-contracts.md`, `docs/frontmatter-schema.md`).
2. Dann den aktuellen Plugin-Stand prüfen (`docs/current-status.md`).
3. Offene Verbesserungen in `docs/open-improvements.md` prüfen.
4. Danach nur den nächsten klar abgegrenzten Schritt umsetzen, ohne Scope-Sprung. Vorher bei Bedarf `npm run test:smoke` im Plugin-Verzeichnis ausführen.

## Reihenfolge: Welche Dateien zuerst lesen

1. `README.md`
2. `docs/current-status.md`
3. `docs/open-improvements.md`
4. `docs/tool-contracts.md`
5. `docs/frontmatter-schema.md`
6. `docs/stable-id-strategy.md`
7. `docs/decision-log.md`

Dann Code:
- `plugin/openclaw-austrian-law/index.ts`
- `plugin/openclaw-austrian-law/src/index.ts`
- `plugin/openclaw-austrian-law/src/tools/`

Abgeschlossene Implementierungspläne liegen archiviert in `docs/archive/` (mit Version-Mapping in `docs/archive/README.md`).

## Nächster konkreter Implementierungsschritt

**Top Priority:** Plugin-Packaging auf compiled Runtime-Output umstellen (`index.ts`/ggf. `setup-entry.ts` -> `dist/*.js`), damit Doctor-/Discovery-Warnungen verschwinden.

**Danach nur noch sehr kleine Zusatzinvarianten oder gezielte Fixture-Klärungen ergänzen:**
- klare Trennung von Diskussionen/Kommentaren und Entscheidungen beibehalten
- RIS-first-Architektur unverändert lassen
- agentbezogene Cache-Isolation bei weiteren Plugin-Schritten nicht wieder auf globalen `process.cwd()`-Default zurückfallen lassen

## Abnahmekriterien für diesen Schritt

- bestehende RIS-MVP-Tools bleiben stabil nutzbar.
- keine neue RIS-Funktion in diesem Schritt.
- JUSLINE bleibt klar Sekundärquelle und strikt getrennt von RIS-Primärlogik.

## Ausdrücklich noch NICHT machen

- keine breite HTML/XML-Parser-Ausweitung
- keine inhaltliche Normalisierung von Rechtstexten
- keine produktive Interpretation/Extraction-Engine
