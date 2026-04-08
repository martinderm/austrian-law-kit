# OGD-RIS API V2.6 — Schemas und XSDs

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## Befund
Das Handbuch erwähnt Request-/Response-Schemas bzw. XSD-Dateien für mehrere Anwendungsbereiche.

## Genannte Bereiche laut Analyse
- Bundesrecht
- Landesrecht
- Gemeinden
- Judikatur
- Bezirke
- Sonstige
- History
- allgemeine Request-/Typdefinitionen

## Warum das relevant ist
Auch wenn das Projekt nicht XML-zentriert gebaut werden soll, sind diese Schemas nützlich für:
- Begriffs- und Feldklarheit
- Abgleich erwarteter Parameterstrukturen
- saubere Typisierung eines späteren API-Clients
- Dokumentation, welche Parameter wirklich offiziell vorgesehen sind

## Empfehlung für das Projekt
- XSDs nicht blind in die Runtime ziehen
- aber als Referenzmaterial oder zur Typ-/Client-Entwicklung mitdenken
- eventuell später in `references/official/ris-api/schemas/` spiegeln, wenn konkret damit gearbeitet wird
