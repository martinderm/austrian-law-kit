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

**Nach der Cache-Härtung RIS-Logik starten (weiterhin ohne JUSLINE-Ausbau als Priorität):**
- zuerst `ris_search` mit klarer Trennung zu Cache-Layer
- weiterhin ohne HTML/XML-Parser-Ausweitung in diesem Schritt

## Abnahmekriterien für diesen Schritt

- Cache-I/O bleibt entkoppelt und unverändert stabil.
- `ris_search` liefert nur strukturierte Treffer-Referenzen im bestehenden Tool-Vertrag.
- Keine JUSLINE-Produktivlogik eingeführt.

## Ausdrücklich noch NICHT machen

- kein RIS-Fetching
- kein JUSLINE-Fetching
- keine HTML/XML-Parser
- keine inhaltliche Normalisierung von Rechtstexten
- keine produktive Interpretation/Extraction-Engine
