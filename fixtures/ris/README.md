# RIS Fixture Notes

Diese RIS-Fixtures enthalten reduzierte oder direkt übernommene Live-Snapshots aus echten RIS-Seiten, die konkrete Parser-Probleme aus dem Live-Test abbilden.

## Live-abgeleitete Fixtures

- `abgb-search-live.html`
  - reduzierte Trefferliste aus einer echten RIS-Suche nach ABGB
  - dient zur Absicherung des aktuellen Such-Parsers gegen die reale `bocList`-Struktur

- `nor12018853-live.html`
- `nor12019064-live.html`
- `nor40214078-live.html`
  - echte RIS-Normdokumentseiten anhand konkreter Dokumentnummern
  - dienen zur Absicherung, dass der Segment-Parser den Normtext statt Navigationsinhalt extrahiert

- `abgb-whole-law-live.html`
  - reduzierte echte `GeltendeFassung`-Seite des ABGB
  - dient zur Absicherung des Whole-Law-Parsers gegen reale `documentContent`-/`TextContainer`-Blöcke

## Zweck

Diese Fixtures wurden ergänzt, nachdem Live-Tests gezeigt haben, dass die frühere MVP-Extraktion teils nur Navigationsinhalt wie "Startseite / Bund / Länder / Bezirke / Gemeinden" zurückgab.

Die neuen Live-Fixtures sollen genau diesen Fehler reproduzierbar machen und verhindern, dass Parser-Änderungen wieder auf Navigations-Stub statt Normtext zurückfallen.
