# OGD-RIS API V2.6 — Migrationsplan (detailliert)

## Ziel
Die Discovery für RIS soll primär auf der offiziellen OGD-RIS-API basieren. HTML-Suche über `Ergebnis.wxe` wird auf Fallback reduziert.

## Bestehender HTML-basierter Stand
- `ris_search` nutzt aktuell RIS-HTML-Suche mit Resolver-/Fallback-Logik
- das ist inzwischen deutlich gehärtet, bleibt aber fragil
- Direct-Document-Sprünge und Parameterempfindlichkeit zeigen die Grenzen dieser Route

## Zielarchitektur
### Stufe 1
- neuer RIS-API-Client für Bundesrecht (`BrKons`)
- `ris_search` probiert zuerst API, dann HTML-Fallback

### Stufe 2
- Landesrecht (`LrKons`) über offiziellen API-Pfad
- bestehende explizite Bundesländerliste weiterverwenden

### Stufe 3
- Gemeinden (`Gr` / `GrA`)
- History-Endpunkt für Änderungen/Sync

## Konkrete Feldfolgen für das Projekt
Mittelfristig sollten sauber getrennt geführt werden:
- Scope / Bereich
- Applikation
- Dokumentnummer
- Gesetzesnummer
- Titel / Kurzinformation
- Content-URLs
- Fassungsbezug

## Reihenfolge der Umsetzung
1. kleinen Bundesrecht-API-Client bauen
2. erste Live-Responses sichern und Feldmapping notieren
3. `ris_search` auf API-first umstellen
4. Landesrecht mit expliziten Bundesländern ergänzen
5. HTML-Suche nur noch als Fallback bzw. für Spezialfälle behalten

## Risiko
- Ohne echte Live-Responses besteht noch Restunsicherheit beim genauen Feldmapping
- deshalb zuerst klein, verifiziert und mit Fixtures arbeiten
