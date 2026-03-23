# ris-cache-integration (Testplan MVP)

Ziel: optionale Write-Through-Cache-Anbindung für RIS-Fetch-Tools verifizieren.

## Scope

- `ris_fetch_segment` / `ris_fetch_whole_law` versuchen nach Erfolg ein Cache-Write
- Cache-Schreibfehler beeinflussen den RIS-Erfolg nicht
- keine Cache-First-Logik

## Testfälle

### 1) Segment-Fetch schreibt erfolgreich in Cache

**Given**
- gültiger RIS-Segmentabruf
- schreibbarer Cache-Root

**When**
- `ris_fetch_segment` liefert erfolgreiches Artifact

**Then**
- Tool-Result bleibt `ok: true`
- Cache-Datei (Markdown + Metadata) wird geschrieben

---

### 2) Whole-Law-Fetch schreibt erfolgreich in Cache

**Given**
- gültiger RIS-Whole-Law-Abruf
- schreibbarer Cache-Root

**When**
- `ris_fetch_whole_law` liefert erfolgreiches Artifact

**Then**
- Tool-Result bleibt `ok: true`
- Cache-Datei (Markdown + Metadata) wird geschrieben

---

### 3) Cache-Write-Fehler macht Hauptpfad nicht kaputt

**Given**
- erfolgreicher RIS-Fetch + Parse
- Cache-Pfad nicht schreibbar / writeArtifact wirft Fehler

**When**
- `ris_fetch_segment` oder `ris_fetch_whole_law`

**Then**
- Tool-Result bleibt `ok: true`
- Artifact bleibt vollständig im Response enthalten
- kein Upstream-/Validation-Fehler nur wegen Cache

---

### 4) Keine Cache-First-Logik

**Given**
- bereits vorhandener Cache-Eintrag

**When**
- RIS-Fetch-Tool wird aufgerufen

**Then**
- Tool ruft weiterhin RIS-Fetch-Pfad auf
- kein vorzeitiger Return nur aus Cache

---

### 5) Keine JUSLINE-Auswirkungen

**Then**
- keine Änderungen an JUSLINE-Tools/Flows
