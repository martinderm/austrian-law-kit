# OGD-RIS API V2.6 — Praktische Query-Rezepte

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## 1. Bundesrecht nach Titel suchen
- Endpunkt: `/Bundesrecht`
- `Applikation=BrKons`
- Titel-/Suchparameter setzen
- Paginierung explizit angeben

## 2. Bundesrecht per Gesetzesnummer
- Endpunkt: `/Bundesrecht`
- `Applikation=BrKons`
- `Gesetzesnummer=<id>`
- optional `Fassung.FassungVom`

## 3. Landesrecht mit Bundesland
- Endpunkt: `/Landesrecht`
- `Applikation=LrKons`
- passendes Bundesland-Flag setzen
- Titel-/Suchparameter ergänzen

## 4. Gemeinden scoped query
- Endpunkt: `/Gemeinden`
- `Applikation=Gr` oder `GrA`
- Bundesland / Gemeinde / Bezirk / Gemeindeverband sauber kombinieren

## 5. Änderungen seit Datum
- Endpunkt: `/History`
- Anwendung auswählen
- `AenderungenVon` bzw. Zeitfenster setzen

## Projektregel
Diese Rezepte sollen später mit echten Beispiel-Requests/-Responses ergänzt werden, sobald der erste API-Client im Repo entsteht.
