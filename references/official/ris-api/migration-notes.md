# OGD-RIS API V2.6 — Migrationsnotizen für openclaw-austrian-law-kit

## Zielbild
`ris_search` soll für Discovery primär die offizielle OGD-RIS-API verwenden. HTML-Suche über `Ergebnis.wxe` bleibt nur Fallback.

## Warum
- offizielle, dokumentierte Schnittstelle
- JSON statt fragiler HTML-Parser
- sauberere Metadaten
- offizielle Unterstützung für Bund, Länder, Gemeinden und weitere Bereiche
- besser geeignet für stabile OSS-Architektur

## Empfohlene Reihenfolge
1. Bundesrecht (`Bundesrecht`, `Applikation=BrKons`)
2. Landesrecht (`Landesrecht`, `Applikation=LrKons`)
3. Gemeinden (`Gemeinden`, `Gr` / `GrA`)
4. `History` für inkrementelle Updates

## Konkrete Folgen für den aktuellen Code
- `ris_search` braucht mittelfristig einen API-Client-Pfad neben dem aktuellen HTML-Fallback
- `sourceId`, `Gesetzesnummer`, Applikation und Scope sollten sauber getrennte Konzepte werden
- Ranking/`best_candidate` kann größtenteils bleiben, aber auf JSON-Metadaten statt HTML-Trefferlisten arbeiten
- Fetch-Tools können für den eigentlichen Dokumentinhalt weiterhin RIS-Dokument-URLs verwenden, idealerweise aus API-Metadaten abgeleitet

## Vorsichtspunkte
- JSON-Antworten enthalten laut Analyse nicht immer den Volltext direkt, sondern häufig Content-URLs
- die API-Struktur je Anwendungsgruppe vor dem Umbau noch konkret gegen echte Responses verifizieren
