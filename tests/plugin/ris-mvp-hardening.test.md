# ris-mvp-hardening (Testplan)

Ziel: kleine Konsolidierungen in der RIS-MVP-Schicht verifizieren, ohne Funktionsänderung.

## Scope

- `ris_fetch_segment` bleibt verhaltensgleich
- `ris_fetch_whole_law` bleibt verhaltensgleich
- gemeinsame Hilfslogik bleibt klein und tool-neutral

## Testfälle

### 1) Segment: Input-Auflösung bleibt gleich

**Given**
- `sourceId` gesetzt

**Then**
- Source-ID-Auflösung bleibt identisch zum bisherigen Verhalten

---

### 2) Whole-Law: Input-Auflösung bleibt gleich

**Given**
- nur `sourceUrl` gesetzt

**Then**
- Source-ID wird wie bisher über URL-Extractor abgeleitet

---

### 3) Cache-Hit-Meta bleibt konsistent

**Given**
- Cache-Hit bei Segment/Whole-Law

**Then**
- `meta.notices` enthält `cache_hit: reused cached artifact`
- keine Warnung für reinen Cache-Hit

---

### 4) Cache-Warnungen bleiben konsistent

**Given**
- Cache-Read-Konflikt oder Cache-Write-Fehler

**Then**
- `meta.warnings` enthält weiterhin die bisherigen Warnhinweise
- Hauptpfad bleibt unverändert erfolgreich, wenn RIS-Ergebnis erfolgreich ist

---

### 5) Keine neue Funktionalität eingeschlichen

**Then**
- keine neue RIS-Funktion
- keine Vertragsänderung
- keine JUSLINE-Auswirkung
