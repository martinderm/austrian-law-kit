# OGD-RIS API V2.6 — Gemeinden

## Relevanter Endpunkt
- `GET https://data.bka.gv.at/ris/api/v2.6/Gemeinden`

## Relevante Applikationen laut Handbuch
- `Gr` — Gemeinderecht
- `GrA` — authentische/rechtsverbindliche Gemeinderechtsfassung

## Erwähnte Filter laut Analyse
- Bundesland
- Gemeinde
- Bezirk
- Gemeindeverband
- Index
- FassungVom

## Relevanz für das Projekt
Gemeinderecht scheint offiziell über die API vorgesehen zu sein. Das ist wichtig, weil HTML-Scraping für Gemeinden sonst schnell unübersichtlich und instabil wird.

## Empfehlung
- Gemeinden nicht als Nachgedanken an die Bundes-/Landes-HTML-Suche ankleben
- stattdessen als eigenen API-Scope konzipieren
- erst nach stabiler Bundes-/Landes-API-Integration ausbauen
