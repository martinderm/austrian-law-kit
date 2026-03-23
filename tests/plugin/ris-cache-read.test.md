# ris-cache-read (Testplan MVP)

Ziel: gezielte Cache-Read-Wiederverwendung in RIS-Fetch-Tools prüfen.

## Scope

- `ris_fetch_segment` / `ris_fetch_whole_law` können passende Cache-Einträge wiederverwenden
- Cache-Miss führt zum normalen RIS-Fetch
- Cache-Konflikt/Read-Fehler zerstört den Hauptpfad nicht
- kein globales Cache-First

## Testfälle

### 1) Segment: eindeutiger Cache-Hit

**Given**
- passendes `norm_segment`-Artifact im Cache
- Stable ID aus Input eindeutig ableitbar

**When**
- `ris_fetch_segment`

**Then**
- `ok: true`
- Return kommt aus Cache
- `meta.warnings` enthält `cache_hit: ...`

---

### 2) Whole-Law: eindeutiger Cache-Hit

**Given**
- passendes `norm_document`-Artifact im Cache
- Stable ID aus Input eindeutig ableitbar

**When**
- `ris_fetch_whole_law`

**Then**
- `ok: true`
- Return kommt aus Cache
- `meta.warnings` enthält `cache_hit: ...`

---

### 3) Cache-Miss -> normaler RIS-Fetch

**Given**
- kein passender Cache-Eintrag

**When**
- RIS-Fetch-Tool aufgerufen

**Then**
- normaler RIS-Fetch läuft
- `ok: true` bei erfolgreichem RIS-Antwortpfad

---

### 4) Cache-Konflikt/Read-Fehler

**Given**
- Cache-Read liefert Konflikt oder Lesefehler

**When**
- RIS-Fetch-Tool aufgerufen

**Then**
- kein Hard-Fail nur wegen Cache
- normaler RIS-Fetch-Pfad bleibt aktiv
- Hinweis in `meta.warnings` (z. B. `cache_conflict` / `cache_read_failed`)

---

### 5) Kein globales Cache-First

**Then**
- keine Änderung an `ris_search`
- keine Änderung an JUSLINE-Tools
