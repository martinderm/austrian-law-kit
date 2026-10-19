---
type: process
universe: leftover
status: stale
entity: plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts
verified_at: 2026-10-19
revision: 2af21a4
consumes: [../objects/tools.md, ../objects/ris.md]
produces: [../objects/ris.md, ../objects/cache.md]
---

# batch-sync (entfernt)

Historischer Prozess der TypeScript-Laufzeit: Batch-Synchronisation einzelner Paragrafen mehrerer Gesetze oder ganzer Gesetze (`ris_sync_laws`) mit Deduplizierung über `${representation}::${sourceIdOrUrl}::${paragraph}::${stichtag}` und getrennten I/O-/Gültigkeitszählern (`discarded_candidates`, `NO_VALID_VERSION_FOR_STICHTAG`). Die TypeScript-Implementierung wurde mit dem Python-Refactoring entfernt (`cc2103c`); ein Python-Ersatz wurde nicht übernommen.

**Heutiger Ersatzweg:** Einzelne `fetch_norm`-Aufrufe je Paragraf (`fetch-and-verify`); der Disk-Cache dedupliziert über den Prüfsummen-/Key-Mechanismus (`storage.py`).

## If you change this
Kein aktiver Code — Karte dient nur der Historie.

## Surfaces
Keine aktive Oberfläche; Tracking von Wiedereinführungswünschen: [GitHub Issues](https://github.com/martinderm/austrian-law-kit/issues).

## See
[fetch-and-verify](fetch-and-verify.md), [tools](../objects/tools.md).
