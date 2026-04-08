# OGD-RIS API V2.6 — Parameter-Referenz (arbeitsrelevant)

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## Allgemeine Muster

### Paginierung
- `DokumenteProSeite`
- `Seitennummer`

### Sortierung
Laut Analyse zweiteilige Struktur, z. B.:
- Richtung (`SortDirection`)
- Sortierspalte (`SortedByColumn`)

### Fassungsbezug / Zeitbezug
- `Fassung.FassungVom`
- weitere Zeiträume für Inkrafttreten / Außerkrafttreten
- Änderungsfilter wie `ImRisSeit`

### Abschnitts-/Normbezug
- Parametergruppen für Bereiche/Abschnitte, z. B. sinngemäß:
  - `Abschnitt.Typ`
  - Abschnittsgrenzen / von-bis-Strukturen

### Identifier
- `Gesetzesnummer`
- applikationsabhängig weitere Kennungen / Geschäftszahlen / Dokumentnummern

## Bundesrecht
Wichtige Arbeitsparameter laut Analyse:
- `Applikation=BrKons`
- `Titel`
- `Suchworte`
- `Gesetzesnummer`
- `Fassung.FassungVom`
- Sortierung / Paginierung

## Landesrecht
Wichtige Arbeitsparameter laut Analyse:
- `Applikation=LrKons`
- explizite Bundesland-Flags, z. B. `SucheInOberoesterreich=true`
- Titel-/Suchparameter
- Fassungsbezug

## Gemeinden
Wichtige Arbeitsparameter laut Analyse:
- `Applikation=Gr` oder `GrA`
- Bundesland
- Gemeinde
- Bezirk
- Gemeindeverband
- FassungVom

## History
Wichtige Arbeitsparameter laut Analyse:
- `Anwendung`
- `AenderungenVon`
- `AenderungenBis`
- `IncludeDeletedDocuments`

## Projektregel
Beim späteren API-Client nicht alles in einen generischen unstrukturierten Param-Blob kippen, sondern pro Bereich klar typisieren:
- Bundesrecht-Request
- Landesrecht-Request
- Gemeinden-Request
- History-Request
