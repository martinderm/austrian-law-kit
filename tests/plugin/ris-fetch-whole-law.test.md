# ris_fetch_whole_law (Testplan MVP)

Ziel: `ris_fetch_whole_law` als dritte produktive RIS-Funktion prüfen, ohne Segmentmodellierung.

## Scope

- Input-Auflösung (`sourceId`/`sourceUrl`)
- URL-Bau für RIS-Dokumentseite
- Mapping in `RisFetchWholeLawOutput`
- Fehlerbehandlung (`VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`)

## Fixtures

- `fixtures/ris/whole-law-detail-sample.html`

## Testfälle

### 1) Input-Auflösung: sourceId -> URL

**Given**
- `sourceId = "NOR12082462"`

**When**
- `buildRisWholeLawUrl({ sourceId })`

**Then**
- URL enthält `Dokument.wxe`
- URL enthält `Dokumentnummer=NOR12082462`

---

### 2) Input-Auflösung: sourceUrl direkt

**Given**
- gültige RIS-`sourceUrl`

**When**
- `ris_fetch_whole_law`

**Then**
- URL wird direkt verwendet
- `source_id` wird aus URL übernommen, falls nicht direkt angegeben

---

### 3) Mapping in Artifact-Vertrag

**Given**
- Fixture-HTML einer RIS-Dokumentseite

**When**
- Parser + Tool-Mapping

**Then**
- `artifact.stable_id` ist gesetzt (kein leerer String)
- `frontmatter.doc_type = norm_document`
- Pflichtfelder im Frontmatter sind vorhanden
- `content` enthält bereinigten Text

---

### 4) VALIDATION_ERROR bei fehlendem Identifier

**Given**
- weder `sourceId` noch `sourceUrl`

**When**
- `ris_fetch_whole_law`

**Then**
- Fehler `VALIDATION_ERROR`

---

### 5) NOT_FOUND

**Given**
- HTTP 404 oder RIS-Not-Found-Seite

**When**
- `ris_fetch_whole_law`

**Then**
- Fehler `NOT_FOUND`

---

### 6) UPSTREAM_UNAVAILABLE

**Given**
- Netzwerkfehler / HTTP 5xx / unparsebare Antwort

**When**
- `ris_fetch_whole_law`

**Then**
- Fehler `UPSTREAM_UNAVAILABLE`

---

### 7) Keine Segment-Logik in diesem Schritt

**Given**
- erfolgreicher Run

**Then**
- keine Segmentketten-/Unterstruktur-Extraktion
- kein Aufruf von `ris_fetch_segment`
