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

**Nach `ris_fetch_whole_law`-MVP: Cache-Anbindung für RIS-Artefakte aktivieren (ohne Refactor):**
- `law_cache_put` nach erfolgreichem RIS-Fetch gezielt nutzen
- `law_cache_get` für schnelle Wiederverwendung nutzen
- klare Trennung zwischen Fetch- und Cache-Verantwortung beibehalten

## Abnahmekriterien für diesen Schritt

- bestehende RIS-MVP-Tools bleiben stabil nutzbar.
- Cache-Nutzung ist optional und robust (kein Hard-Fail bei Cache-Problemen).
- Keine JUSLINE-Produktivlogik eingeführt.

## Ausdrücklich noch NICHT machen

- kein JUSLINE-Fetching
- keine breite HTML/XML-Parser-Ausweitung
- keine inhaltliche Normalisierung von Rechtstexten
- keine produktive Interpretation/Extraction-Engine
