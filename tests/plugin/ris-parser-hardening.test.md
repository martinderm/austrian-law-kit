# ris-parser-hardening (Testplan)

Ziel: punktuelle Robustheitsverbesserungen der RIS-MVP-Parser absichern.

## Scope

- robustere Titel-/Content-Erkennung bei kleinen HTML-Variationen
- robustere Link-Erkennung in `ris_search`
- keine neue Funktionalität, kein Scope-Sprung

## Fixtures

- `fixtures/ris/parser-hardening-sample.html`

## Testfälle

### 1) Search-Parser: Link mit einfachen Quotes

**Given**
- Ergebnisliste mit `<a href='...'>` statt doppelten Quotes

**When**
- `parseRisSearchHtml`

**Then**
- Treffer wird weiterhin erkannt und gemappt

---

### 2) Titel-Fallback auf `h2`

**Given**
- Detailseite ohne `h1`, aber mit `h2`

**When**
- Segment-/Whole-Law-Parser laufen

**Then**
- Titel wird robust erkannt

---

### 3) Content-Fallback auf `article`/`div content`

**Given**
- Seite ohne `<main>`, aber mit `<article>` oder `<div id="content">`

**When**
- Segment-/Whole-Law-Parser laufen

**Then**
- Content wird weiterhin extrahiert

---

### 4) Entity/Whitespace-Robustheit

**Given**
- HTML enthält `&nbsp;`, numerische Entities und Kommentare

**Then**
- bereinigter Text bleibt lesbar und stabil

---

### 5) Keine Funktionsausweitung

**Then**
- `ris_search`, `ris_fetch_segment`, `ris_fetch_whole_law` bleiben im MVP-Scope
- keine JUSLINE-Auswirkungen
