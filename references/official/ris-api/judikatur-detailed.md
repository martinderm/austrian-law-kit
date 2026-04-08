# OGD-RIS API V2.6 — Judikatur (detaillierte Arbeitsnotizen)

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## Relevanter Endpunkt
- `GET https://data.bka.gv.at/ris/api/v2.6/Judikatur`

## Befund aus der Analyse
Das Handbuch erwähnt eine breite Judikatur-Unterstützung mit zahlreichen Applikationen. Für das Projekt ist das wichtig, weil eine künftige Ausweitung über Normtexte hinaus sauber auf offizielle Strukturen aufsetzen könnte.

## Genannte Applikationen laut Analyse
- `Vfgh`
- `Vwgh`
- `Normenliste`
- `Justiz`
- `Bvwg`
- `Lvwg`
- `Dsk`
- `Dok`
- `Pvak`
- `Gbk`
- `AsylGH`
- `Uvs`
- `Ubas`
- `Umse`
- `Bks`
- `Verg`

## Relevante Konsequenzen
- Judikatur ist nicht ein einziger homogener Block, sondern applikationsgetrennt
- Ein späterer Ausbau des Plugins sollte daher `Judikatur` nicht als monolithisches Tool modellieren
- besser wären getrennte Modi oder klare Applikationsparameter

## Für openclaw-austrian-law-kit
Aktuell ist Judikatur nicht Kern des MVP. Das Dokument zeigt aber, dass dafür später eine offizielle API-Basis vorhanden ist und JUSLINE dafür nicht die einzige Route wäre.

## Empfehlung
Für später:
- zuerst RIS-Normen-Discovery stabilisieren
- danach optional eigenes Judikatur-Modul/API-Client aufbauen
