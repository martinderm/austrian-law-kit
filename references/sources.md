# Quellenverzeichnis (Learning Forward)

Konsultierte Quellen und Dokumentationen fuer den austrian-law-kit Skill,
persistiert nach dem Learning-Forward-Prinzip.

## Primaerquellen (RIS - Rechtsinformationssystem des Bundes)

| Quelle | URL | Typ | Zuletzt geprueft |
|:---|:---|:---|:---|
| RIS OGD API v2.6 Spezifikation | https://data.bka.gv.at/ris/api/v2.6/ | REST API | 2026-04-08 |
| RIS Web-Frontend | https://www.ris.bka.gv.at | Web | 2026-04-08 |
| RIS Verlinkungsleitfaden (PDF) | Amtliche Publikation des BKA | PDF (lokal: `references/official/ris-linking/LinksaufDokumenteimRISsetzen.pdf`) | 2026-03-21 |
| RIS OGD Metadatenbeschreibung (PDF) | https://data.gv.at | PDF (lokal: `references/official/ris-api/data-gv-at-69942f5890073b38542a02d8.pdf`) | 2026-04-08 |

### Lokale Aufbereitung

- `references/official/ris-api/` — 16 thematische Markdown-Zusammenfassungen der OGD-API-Spezifikation
- `references/official/ris-linking/` — 7 thematische Markdown-Zusammenfassungen des Verlinkungsleitfadens

## Sekundaerquellen (JUSLINE)

| Quelle | URL | Typ | Zuletzt geprueft |
|:---|:---|:---|:---|
| JUSLINE Web-Frontend | https://www.jusline.at | Web | 2026-04-08 |

### Lokale Aufbereitung

- `references/jusline.md` — JUSLINE-spezifische Tool-Referenz, Felder, Grenzen und Antwortdisziplin

## Verlaesslichkeitseinschaetzung

| Quelle | Autoritaet | Stabilitaet | Hinweise |
|:---|:---|:---|:---|
| RIS OGD API | Hoch (amtlich, BKA) | Mittel (API-Versionen, gelegentliche Upstream-Fehler) | Einzelne Landesrecht-Filter wirken in Live-Tests nicht zuverlaessig |
| RIS Web | Hoch (amtlich, BKA) | Hoch | HTML-Struktur kann sich aendern; Parser-Haertung noetig |
| JUSLINE | Niedrig (nicht-amtlich, privat) | Niedrig | Nutzerbasierte Inhalte, keine Garantie fuer Aktualitaet oder Korrektheit |
