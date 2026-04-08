# RIS API Migration Plan for `austrian-law-kit`

Stand: 2026-04-08
Status: vorgeschlagene Umsetzungsrichtung

## Ziel
`ris_search` und spätere RIS-Discovery sollen primär auf der offiziellen OGD-RIS-API basieren. HTML-Suche über `Ergebnis.wxe` bleibt Fallback.

## Leitidee
- direkte Dokumentnummern sofort auflösen
- offizielle API für Discovery/Metadaten bevorzugen
- HTML-Suche nur noch als robuste Rest-/Fallback-Schicht behalten
- bestehende Fetch-Tools weiterverwenden, aber besser mit Metadaten und stabilen URLs versorgen

## Konkrete Architektur

### Neue Schicht `src/ris-api/`
- `client.ts`
- `types.ts`
- `errors.ts`
- `mappers.ts`
- `bundesrecht.ts`
- `landesrecht.ts`
- optional später `gemeinden.ts`

### Verantwortlichkeiten
- API-Requests gegen `https://data.bka.gv.at/ris/api/v2.6/`
- JSON-Responses holen
- auf interne Suchtreffer mappen
- keine HTML-Parser in dieser Schicht

## `ris_search` künftig
1. Query resolven (`NOR...`, `LOO...`, Normreferenz, Freitext)
2. direkte Dokument-ID sofort als Treffer zurückgeben
3. API-first-Discovery
4. bei fehlendem API-Support oder Fehlschlag HTML-Fallback
5. Ranking/`best_candidate`

## Priorisierte Umsetzung

### Phase 1
- Bundesrecht-API-Client für `Applikation=BrKons`
- erste JSON-Response-Fixtures sichern
- Mapping auf bestehende `SearchHit`-Struktur

### Phase 2
- `ris_search` für `scope=bund` auf API-first umstellen
- HTML-Suche als Fallback belassen

### Phase 3
- Landesrecht-API-Client für `Applikation=LrKons`
- bestehende harte Bundesländer-Liste weiterverwenden

### Phase 4
- Gemeinden (`Gr`, `GrA`)
- `History`-Endpunkt für spätere inkrementelle Updates

## Interne Felder, die mittelfristig wichtig werden
- `scope`
- `application`
- `source_id`
- `law_id` / `Gesetzesnummer`
- `source_url`
- `content_url`
- `whole_law_url`
- `match_reason`
- `confidence`

## Warum dieser Weg
- offizielle, stabilere Discovery-Basis
- weniger fragile HTML-Logik
- bestehende Resolver-/Ranking-Arbeit bleibt nützlich
- schrittweise Migration möglich, ohne den aktuellen MVP hart wegzuwerfen
