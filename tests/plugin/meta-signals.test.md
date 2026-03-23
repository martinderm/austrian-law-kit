# meta-signals (Testplan MVP)

Ziel: semantische Trennung von `notices` und `warnings` für Cache-bezogene Meta-Signale prüfen.

## Scope

- `cache_hit` ist Notice (kein Warning)
- `cache_conflict` / `cache_read_failed` / `cache_write_failed` bleiben Warnings
- erfolgreicher RIS-Hauptpfad bleibt unverändert

## Testfälle

### 1) Cache-Hit in `ris_fetch_segment`

**Given**
- passender Cache-Eintrag vorhanden

**When**
- `ris_fetch_segment`

**Then**
- `ok: true`
- `meta.notices` enthält `cache_hit: ...`
- `meta.warnings` enthält **keinen** `cache_hit`-Eintrag

---

### 2) Cache-Hit in `ris_fetch_whole_law`

**Given**
- passender Cache-Eintrag vorhanden

**When**
- `ris_fetch_whole_law`

**Then**
- `ok: true`
- `meta.notices` enthält `cache_hit: ...`
- `meta.warnings` enthält **keinen** `cache_hit`-Eintrag

---

### 3) Cache-Read-Konflikt

**Given**
- Cache-Read liefert Konflikt

**When**
- RIS-Fetch-Tool läuft weiter über Fetch-Pfad

**Then**
- Hauptpfad bleibt intakt
- `meta.warnings` enthält `cache_conflict: ...`

---

### 4) Cache-Read-Fehler

**Given**
- Cache-Read wirft Lesefehler

**Then**
- Hauptpfad bleibt intakt
- `meta.warnings` enthält `cache_read_failed: ...`

---

### 5) Cache-Write-Fehler

**Given**
- RIS-Fetch erfolgreich, Cache-Write schlägt fehl

**Then**
- `ok: true`
- `meta.warnings` enthält `cache_write_failed: ...`

---

### 6) Keine Funktionsausweitung

**Then**
- keine neue RIS-Funktion
- keine JUSLINE-Auswirkungen
