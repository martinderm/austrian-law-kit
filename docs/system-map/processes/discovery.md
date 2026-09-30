---
type: process
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/tools/ris_search.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
consumes: [../objects/tools.md, ../objects/ris.md]
produces: [../objects/ris.md]
---

# discovery

## Input → Movement → Output
Suchanfrage → direkte Auflösung oder API-/HTML-Discovery → gerankte SearchHits.

## Why this shape
Identität, Herkunft und Gültigkeit bleiben bis zur Ausgabe nachvollziehbar. Die technische Bewegung setzt die fachliche Freigabe durch den Agenten voraus.

## Steps
1. Validiert Scope, Landesfilter und Stichtag, normalisiert die Query und erkennt direkte Dokumentkennungen. Quelle: [plugin/openclaw-austrian-law/src/tools/ris_search.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_search.ts) — `plugin/openclaw-austrian-law/src/tools/ris_search.ts:1`.
2. Löst Kurzzitate und kanonische Gesetzeskennungen auf; nutzt die offizielle API und den verfügbaren HTML-Fallback. Quelle: [plugin/openclaw-austrian-law/src/ris/query-resolver.ts](../../../plugin/openclaw-austrian-law/src/ris/query-resolver.ts) — `plugin/openclaw-austrian-law/src/ris/query-resolver.ts:72`.
3. Filtert exakte Abschnittskennungen, bewertet Treffer und gibt SearchHits zurück. Quelle: [plugin/openclaw-austrian-law/src/ris/search-ranking.ts](../../../plugin/openclaw-austrian-law/src/ris/search-ranking.ts) — `plugin/openclaw-austrian-law/src/ris/search-ranking.ts:205`.

## If you change this
- **Hits:** Suchschemas, API-Mapping, Ranking und Suchfixtures.
- **Does not hit:** JUSLINE-Detailparser.

## Surfaces
CLI und OpenClaw rufen die Tool-Funktionen auf; externe Quellen liefern Daten; Cache-Helfer persistieren bei Abrufen Artefakte.

## See
[tools](../objects/tools.md), [ris](../objects/ris.md).
Quelle: [plugin/openclaw-austrian-law/src/tools/ris_search.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_search.ts).
