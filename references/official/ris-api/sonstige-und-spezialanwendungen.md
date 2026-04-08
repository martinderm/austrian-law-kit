# OGD-RIS API V2.6 — Sonstige und Spezialanwendungen

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## Bundes-Spezialanwendungen
Zusätzlich zu `BrKons` sind laut Analyse u. a. relevant:
- `BgblAuth`
- `BgblPdf`
- `BgblAlt`
- `Begut`
- `RegV`
- `Erv`

## Sonstige Anwendungen laut Analyse
- `PruefGewO`
- `Avsv`
- `Spg`
- `Avn`
- `KmGer`
- `Mrp`
- `Erlaesse`

## Bedeutung für das Projekt
Diese Bereiche sind nicht der erste MVP-Schritt, zeigen aber:
- die offizielle API ist breiter als nur konsolidiertes Recht
- spätere Erweiterungen können sich auf offizielle Strukturen stützen
- Discovery-Architektur sollte daher modular sein und nicht nur auf einen Bundesnormen-Sonderfall zugeschnitten werden

## Empfehlung
- im ersten API-Ausbau nicht übernehmen
- aber bei der Modellierung von Applikationen/Scopes schon berücksichtigen, dass mehr als `BrKons` und `LrKons` existiert
