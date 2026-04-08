# Offizielle RIS API Referenz

Quelle:
- data.gv.at Resource API: `https://www.data.gv.at/api/hub/store/data/69942f5890073b38542a02d8`
- lokal gespiegelt als PDF: `data-gv-at-69942f5890073b38542a02d8.pdf`

## Identifizierte Ressource

- **Titel:** OGD-RIS API Handbuch V2.6
- **Typ:** offizielle Dokumentation der OGD-RIS REST-API des österreichischen Rechtsinformationssystems (RIS)
- **Stand laut Dokument:** Februar 2026

## Zentrale Befunde für openclaw-austrian-law-kit

1. Es gibt eine **offizielle JSON-API** unter:
   - `https://data.bka.gv.at/ris/api/v2.6/`

2. Relevante Endpunkte laut Analyse:
   - `/Bundesrecht` mit `Applikation=BrKons`
   - `/Landesrecht` mit `Applikation=LrKons`
   - `/Gemeinden` mit `Applikation=Gr` oder `GrA`
   - `/History`

3. Für Landesrecht sind explizite Bundesland-Flags vorgesehen (nicht bloß Freitext-Query).

4. Die JSON-API liefert offenbar vor allem **strukturierte Metadaten + Content-URLs**, nicht zwingend den vollständigen Normtext direkt im JSON.

5. Für das Projekt bedeutet das:
   - mittelfristig sollte `ris_search` für Discovery primär auf die offizielle API migriert werden
   - HTML-Suche sollte nur noch Fallback sein
   - `ris_fetch_segment` / `ris_fetch_whole_law` können weiterhin Dokument-URLs aus RIS nutzen, aber idealerweise API-gestützt aufgelöst

## Kurzempfehlung

- Nächster großer Architektur-Schritt: eigener RIS-API-Client für Discovery/Metadaten
- Reihenfolge:
  1. Bundesrecht via API (`BrKons`)
  2. Landesrecht via API (`LrKons`)
  3. Gemeinden / weitere Anwendungen
  4. History-Endpunkt für inkrementelle Updates
