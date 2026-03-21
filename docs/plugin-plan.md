# Plugin Plan (ohne Implementierung)

## Ziel

Planung der nativen Plugin-Toolschicht, ohne bereits Parser/Fetching/Produktivlogik zu bauen.

## Geplante Tools und Rollen

1. `ris_search`
   - findet RIS-Treffer für Suchbegriffe und liefert strukturierte Referenzen
2. `ris_fetch_segment`
   - liefert ein einzelnes Normsegment (z. B. Paragraph)
3. `ris_fetch_whole_law`
   - liefert Gesamtdokument/Fassung eines Gesetzes
4. `jusline_fetch_discussions`
   - liefert optionale Diskussionen/Kommentare (Sekundärquelle)
5. `jusline_list_decisions`
   - listet Entscheidungen aus JUSLINE (nur bei explizitem Bedarf)
6. `law_cache_get`
   - liest Artefakte aus dem lokalen Law-Cache
7. `law_cache_put`
   - schreibt/aktualisiert Artefakte im lokalen Law-Cache

## Abgrenzung Skill vs Plugin

- **Skill**: fachliche Regeln, Quellenpolitik, Antwortstruktur, Sicherheits-/Unsicherheitskommunikation.
- **Plugin**: technische Ausführung (Suche/Abruf/Normalisierung/Cache-Zugriff) mit stabilen Tool-Interfaces.

## Struktur für das Plugin-Skelett

- Manifest: `plugin/openclaw-austrian-law/openclaw.plugin.json`
- Paketmetadaten: `plugin/openclaw-austrian-law/package.json` mit `openclaw.extensions`
- Root Entry: `plugin/openclaw-austrian-law/index.ts`
- interne Platzhalter: `plugin/openclaw-austrian-law/src/*`

## Implementierungsreihenfolge (später)

1. Tool-Registrierung als Stubs am Root-Entry
2. Cache-Basis (`law_cache_get`, `law_cache_put`) gemäß Datenvertrag
3. RIS primär (`ris_search`, `ris_fetch_segment`, `ris_fetch_whole_law`)
4. JUSLINE sekundär (`jusline_fetch_discussions`, `jusline_list_decisions`)
5. Integrationshärtung + Tests

## Leitplanke

Bis zur nächsten Phase bleiben alle Tools reine Platzhalter ohne echte externe Zugriffe.
