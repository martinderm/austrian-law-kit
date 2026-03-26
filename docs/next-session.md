# Next Session

## So weitermachen (kurz)

1. Erst Verträge lesen.
2. Dann den aktuellen Plugin-Stand prüfen.
3. Danach nur den nächsten klar abgegrenzten Schritt umsetzen (derzeit: nächste kleine JUSLINE-MVP-Härtung oder Testergänzung), ohne Scope-Sprung.

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

**Nach der aktuellen JUSLINE-MVP-Härtung: nur den nächsten kleinen Parser-/Fixture-Schritt angehen (weiterhin Sekundärquelle):**
- klare Trennung Diskussionen vs. Entscheidungen beibehalten
- RIS-first-Architektur unverändert lassen

## Abnahmekriterien für diesen Schritt

- bestehende RIS-MVP-Tools bleiben stabil nutzbar.
- keine neue RIS-Funktion in diesem Schritt.
- JUSLINE bleibt klar Sekundärquelle und strikt getrennt von RIS-Primärlogik.

## Ausdrücklich noch NICHT machen

- keine breite HTML/XML-Parser-Ausweitung
- keine inhaltliche Normalisierung von Rechtstexten
- keine produktive Interpretation/Extraction-Engine
