# OGD-RIS API V2.6 — Bundesrecht

## Relevanter Endpunkt
- `GET https://data.bka.gv.at/ris/api/v2.6/Bundesrecht`

## Relevante Applikationen laut Handbuch
- `BrKons` — Bundesrecht konsolidiert
- `BgblAuth` — BGBl authentisch ab 2004
- `BgblPdf` — BGBl 1945–2003
- `BgblAlt` — historische Gesetzblätter
- `Begut` — Begutachtungsentwürfe
- `RegV` — Regierungsvorlagen
- `Erv` — Austrian Laws / englische Übersetzungen

## Für das Projekt zuerst relevant
### `BrKons`
Für konsolidiertes Bundesrecht ist `BrKons` der wichtigste Einstiegspunkt.

## Wichtige Parameter-Hinweise
- `Applikation=BrKons`
- Titel-/Suchparameter für Discovery
- `Gesetzesnummer` als starker Identifier
- Fassungsbezug über `Fassung.FassungVom`
- Paginierung über `DokumenteProSeite` und `Seitennummer`
- Sortierung über strukturierte Sortierparameter

## Praktische Nutzung im Projekt
- `ris_search` sollte mittelfristig Discovery über `Bundesrecht?Applikation=BrKons` machen
- `Gesetzesnummer` sollte als Feld in der internen Datenstruktur ernsthaft mitgeführt werden
- aus API-Metadaten können danach stabile Content-URLs für HTML/PDF/RTF abgeleitet oder übernommen werden

## Migrationsidee
1. Query -> API-Request an `Bundesrecht`
2. JSON-Metadaten auswerten
3. besten Treffer bestimmen
4. Content-URL oder `GesamteRechtsvorschriftUrl` für Fetch-Schritt verwenden
