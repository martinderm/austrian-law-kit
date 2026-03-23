# ris_search (Testplan MVP)

Ziel: `ris_search` als erste produktive RIS-Funktion prüfen, ohne Segment-Fetching und ohne JUSLINE.

## Scope

- URL-Bau für RIS-Suche
- Mapping der Trefferliste in `RisSearchOutput`
- Fehlerbehandlung (`VALIDATION_ERROR`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED`)

## Fixtures

- `fixtures/ris/search-result-sample.html`

## Testfälle

### 1) URL-Bau: query + limit korrekt

**Given**
- `query = "ABGB"`, `limit = 5`

**When**
- `buildRisSearchUrl({ query, limit })`

**Then**
- URL enthält `Ergebnis.wxe`
- URL enthält `Abfrage=Bundesnormen`
- URL enthält `Suchworte=ABGB`
- URL enthält `ResultPageSize=5`

---

### 2) Parser mappt Treffer in Vertragsform

**Given**
- Fixture-HTML mit zwei RIS-Dokumentlinks

**When**
- `parseRisSearchHtml(html, 10)`

**Then**
- `hits.length >= 2`
- jeder Treffer enthält `title`, `source_url`
- `source_id` wird gesetzt, falls aus Query-Parametern ableitbar
- `stable_id` nur wenn aus `source_id` robust normalisiert ableitbar (sonst leer)

---

### 3) Validation: leere/zu kurze Query

**Given**
- `query = " "` oder `query = "a"`

**When**
- `ris_search`

**Then**
- Fehler `VALIDATION_ERROR`

---

### 4) Scope-Grenze docType

**Given**
- `docType = "decision"` oder `"material"`

**When**
- `ris_search`

**Then**
- Fehler `NOT_IMPLEMENTED` (MVP unterstützt nur `norm`)

---

### 5) Upstream-Fehler

**Given**
- Fetch wirft Netzwerkfehler oder RIS liefert HTTP 5xx/4xx

**When**
- `ris_search`

**Then**
- Fehler `UPSTREAM_UNAVAILABLE`
- keine stillen Fallbacks

---

### 6) Keine Segment-Extraktion in diesem Schritt

**Given**
- erfolgreicher `ris_search` Run

**Then**
- keine Segment-/Volltext-Extraktion
- keine Calls auf `ris_fetch_segment`
