# OGD-RIS API V2.6 — History / Änderungen

## Relevanter Endpunkt
- `GET https://data.bka.gv.at/ris/api/v2.6/History`

## Zweck
Änderungsverfolgung über RIS-Anwendungen hinweg.

## Relevante Parameter laut Analyse
- `Anwendung`
- `AenderungenVon`
- `AenderungenBis`
- `IncludeDeletedDocuments`

## Relevanz für das Projekt
Der History-Endpunkt ist wichtig für spätere inkrementelle Synchronisation, z. B.:
- lokale Indizes aktualisieren
- nur geänderte Dokumente neu abrufen
- Caches gezielt invalidieren statt blind zu refreshen

## Empfehlung
Nicht im ersten API-Migrationsschritt anfangen, aber früh architektonisch mitdenken.
