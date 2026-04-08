# OGD-RIS API V2.6 — Überblick

Quelle:
- PDF: `data-gv-at-69942f5890073b38542a02d8.pdf`
- data.gv.at Resource API: `https://www.data.gv.at/api/hub/store/data/69942f5890073b38542a02d8`

## Was das ist

Offizielle Dokumentation der OGD-RIS API V2.6 des österreichischen Rechtsinformationssystems (RIS).

## Basis
- REST-API-Basis: `https://data.bka.gv.at/ris/api/v2.6/`
- Liefert JSON-Antworten
- Beispiele/weitere Inhalte laut Handbuch zusätzlich über begleitende Ressourcen

## Relevanz für openclaw-austrian-law-kit

Die API ist die deutlich stabilere Grundlage für Discovery und Metadaten als die fragile HTML-Suche über `Ergebnis.wxe`.

## Strategische Empfehlung

1. API für Discovery/Metadaten bevorzugen
2. HTML-/Dokument-URLs nur noch für eigentlichen Content-Abruf verwenden
3. History-Endpunkt für spätere inkrementelle Updates einplanen

## Zentrale Endpunktgruppen
- `Bundesrecht`
- `Landesrecht`
- `Gemeinden`
- `Judikatur`
- `Sonstige`
- `History`
- `version`
