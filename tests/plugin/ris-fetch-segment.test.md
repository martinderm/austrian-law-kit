# ris_fetch_segment (Testplan MVP)

Ziel: `ris_fetch_segment` als zweite produktive RIS-Funktion prüfen, ohne Whole-Law-Logik.

## Scope

- Input-Auflösung (`sourceId`/`sourceUrl`)
- URL-Bau für RIS-Dokumentseite
- Mapping in `RisFetchSegmentOutput`
- Fehlerbehandlung (`VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED`)

## Fixtures

- `fixtures/ris/segment-detail-sample.html`

## Testfälle

### 1) Input-Auflösung: sourceId -> URL

**Given**
- `sourceId = "NOR12082462"`

**When**
- `buildRisSegmentUrl({ sourceId })`

**Then**
- URL enthält `Dokument.wxe`
- URL enthält `Dokumentnummer=NOR12082462`

---

### 2) Input-Auflösung: sourceUrl direkt

**Given**
- gültige RIS-`sourceUrl`

**When**
- `ris_fetch_segment`

**Then**
- URL wird direkt verwendet
- `source_id` wird aus URL übernommen, falls nicht direkt angegeben

---

### 3) Mapping in Artifact-Vertrag

**Given**
- Fixture-HTML einer RIS-Detailseite

**When**
- Parser + Tool-Mapping

**Then**
- `artifact.stable_id` ist gesetzt (kein leerer String)
- `frontmatter.doc_type = norm_segment`
- Pflichtfelder im Frontmatter sind vorhanden
- `content` enthält bereinigten Text

---

### 4) VALIDATION_ERROR bei fehlendem Identifier

**Given**
- weder `sourceId` noch `sourceUrl`

**When**
- `ris_fetch_segment`

**Then**
- Fehler `VALIDATION_ERROR`

---

### 5) NOT_IMPLEMENTED für segmentRef

**Given**
- `segmentRef` gesetzt

**When**
- `ris_fetch_segment`

**Then**
- Fehler `NOT_IMPLEMENTED`

---

### 6) NOT_FOUND

**Given**
- HTTP 404 oder RIS-Not-Found-Seite

**When**
- `ris_fetch_segment`

**Then**
- Fehler `NOT_FOUND`

---

### 7) UPSTREAM_UNAVAILABLE

**Given**
- Netzwerkfehler / HTTP 5xx / unparsebare Antwort

**When**
- `ris_fetch_segment`

**Then**
- Fehler `UPSTREAM_UNAVAILABLE`

---

### 8) Keine Whole-Law-Extraktion

**Given**
- erfolgreicher Run

**Then**
- keine Whole-Law-Logik
- kein Aufruf von `ris_fetch_whole_law`
