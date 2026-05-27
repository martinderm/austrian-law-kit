# Next Session

## So weitermachen (kurz)

1. Erst Verträge lesen.
2. Dann den aktuellen Plugin-Stand prüfen.
3. Danach nur den nächsten klar abgegrenzten Schritt umsetzen (derzeit: höchstens noch 1-2 kleine Tool-/Parser-Smoke-Edge-Cases oder eine minimale Fixture-Ergänzung), ohne Scope-Sprung. Vorher bei Bedarf `npm run test:smoke` im Plugin-Verzeichnis ausführen.

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
- `plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts`
- `plugin/openclaw-austrian-law/src/jusline/*`

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
