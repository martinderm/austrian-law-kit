# RIS Linking — Datumsformate und Encoding

Quelle:
- `LinksaufDokumenteimRISsetzen.pdf`

## Datumsformate

### Standardformat im RIS-Linking-Kontext
- `TT.MM.JJJJ`

### Besonderheit `FassungVom`
Laut Dokument gibt es Endpunkte, bei denen `FassungVom` nicht im Punktformat, sondern im amerikanischen Format verwendet wird:
- `MM-DD-YYYY`

## ELI-Datum
- `JJJJMMTT`

## URL-Encoding
Wichtige Sonderzeichen müssen korrekt URL-kodiert werden, insbesondere Umlaute und Sonderzeichen.

Beispiele laut Dokument:
- `ö` -> `%c3%b6`
- `Ö` -> `%c3%96`
- `ä` -> `%c3%a4`
- `Ä` -> `%c3%84`
- `ü` -> `%c3%bc`
- `Ü` -> `%c3%9c`
- `ß` -> `%c3%9f`
- `/` -> `%2f`

## Projektregel
Datums- und Encodingslogik darf nicht blind vereinheitlicht werden. Endpunktspezifische Regeln müssen im Code oder in klaren Hilfsfunktionen abgebildet werden.
