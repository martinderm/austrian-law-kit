# RIS Parser Hardening Plan (MVP)

## Ziel dieses Schritts

Punktuelle Robustheitsverbesserungen in den bestehenden RIS-MVP-Parsern,
ohne neue Funktionalität und ohne Vertragsänderung.

## Geplante kleine Verbesserungen

- etwas robustere HTML-Entity-Dekodierung (inkl. häufiger numerischer Entities)
- stabileres Tag-Stripping (Kommentare/zusätzliche Whitespace-Fälle)
- robustere Titel-Erkennung bei kleinen Variationen:
  - `h1` bevorzugt
  - fallback `h2`
  - fallback `<title>`
- robustere Content-Erkennung bei kleinen Layout-Varianten:
  - `main` bevorzugt
  - fallback `article`
  - fallback `div` mit `id`/`class`-Hinweisen wie `content`/`main`
  - letzter fallback `body`
- Search-Parser: Link-Erkennung toleranter (`href` mit einfachen oder doppelten Quotes)

## Ausdrücklich NICHT in diesem Schritt

- keine neue RIS-Funktion
- kein JUSLINE
- keine tiefe Strukturmodellierung (keine Segmentketten)
- keine inhaltliche Normtext-Interpretation
- keine Vertragsänderung
- kein großer Refactor
