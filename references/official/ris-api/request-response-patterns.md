# OGD-RIS API V2.6 — Request-/Response-Muster

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## Allgemeines

Das Handbuch beschreibt eine offizielle JSON-API unter:
- `https://data.bka.gv.at/ris/api/v2.6/`

Die API dient primär der strukturierten Abfrage von RIS-Metadaten und verweist für eigentliche Dokumentinhalte häufig auf weiterführende Content-URLs.

## HTTP / Transport
- REST-Stil
- laut Analyse GET und POST vorgesehen
- Response-Format: JSON
- technischer Unterbau laut Handbuch auf ASP.NET MVC / Web API

## Antwortcharakter
Die API liefert nach Analyse nicht einfach den ganzen Dokumenttext als beliebigen Freitext, sondern eher:
- strukturierte Such-/Treffermetadaten
- Referenzen auf Inhalte
- Content-URLs bzw. ähnliche Verweise
- bei bestimmten Fällen Hinweise auf Gesamtfassungen / Detailinhalte

## Content-Abruf
Für das Projekt ist wichtig:
- Discovery und Metadaten können API-basiert erfolgen
- der eigentliche Normtext kann weiterhin über RIS-Dokument-URLs, HTML, PDF, RTF oder andere verlinkte Inhaltsformate kommen
- das Projekt sollte daher Metadaten- und Content-Abruf logisch trennen

## Fehlerbild
Laut Analyse ist ein strukturiertes Error-Objekt vorgesehen, sinngemäß über Felder wie:
- `OgdSearchResult.Error.Applikation`
- `OgdSearchResult.Error.Message`

Zusätzlich können Serverfehler via HTTP-500 auftreten.

## Konsequenz für das Projekt
- `ris_search` sollte API-Antworten nicht wie HTML-Ergebnisse behandeln
- eigener API-Client + Transformationsschicht sinnvoll
- Ranking und `best_candidate` auf Basis der JSON-Metadaten aufbauen
