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

**Lokale Cache-I/O-Schicht einführen** (kein Netzwerk):
- kleine File-Layer-Funktionen für
  - Markdown-Artefakt schreiben/lesen
  - Metadata-JSON schreiben/lesen
- Nutzung der bestehenden Helfer:
  - Stable-ID-Helfer
  - Cache-Pfad-Ableitung
  - Serialisierung/Parsing

## Abnahmekriterien für diesen Schritt

- `law_cache_get` / `law_cache_put` können lokal (Dateisystem) arbeiten.
- Keine Fetch-/Parser-/RIS-/JUSLINE-Netzlogik eingeführt.
- Frontmatter-Pflichtfelder bleiben konsistent mit Vertrag.
- Fehlerfälle (Datei fehlt, ungültige stable_id, source mismatch) sind sauber behandelt.

## Ausdrücklich noch NICHT machen

- kein RIS-Fetching
- kein JUSLINE-Fetching
- keine HTML/XML-Parser
- keine inhaltliche Normalisierung von Rechtstexten
- keine produktive Interpretation/Extraction-Engine
