---
type: process
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts
verified_at: 2026-09-30
revision: af817c5
consumes: [../objects/tools.md, ../objects/ris.md]
produces: [../objects/ris.md, ../objects/cache.md]
---

# batch-sync

## Input → Movement → Output
Liste von Normanfragen → Deduplizierung und Kandidatenprüfung je Stichtag → Einzelresultate und getrennte I/O-/Gültigkeitszähler.

## Why this shape
Identität, Herkunft und Gültigkeit bleiben bis zur Ausgabe nachvollziehbar. Die technische Bewegung setzt die fachliche Freigabe durch den Agenten voraus.

## Steps
1. Leitet Stichtag und Abrufrepräsentation je Item ab, dedupliziert und prüft Suchkandidaten durch die Fetch-Tools; fachfremde Kandidaten (abweichende Gesetzes- oder Paragraphidentität, ohne aufzulösende Identität) werden vor der zeitlichen Prüfung verworfen und mit Grund in `discarded_candidates` ausgewiesen — kein stiller Erfolg allein wegen zeitlicher Gültigkeit. Quelle: [plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts) — `plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts:1`.
2. Aggregiert getrennte I/O- und Gültigkeitszähler (Identitätsverwerfungen getrennt von `stichtag_mismatch`); Batches ohne identitätspassenden, zeitlich gültigen Kandidaten erhalten NO_VALID_VERSION_FOR_STICHTAG (Message unterscheidet reine Stichtags- von Identitätsfällen). Quelle: [plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts) — `plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts:495`.

## If you change this
- **Hits:** Batch-Verträge, Kandidatenranking, Deduplizierung und Tool-/Rechtsstands-Tests.
- **Does not hit:** JUSLINE-HTML-Extraktion.

## Surfaces
CLI und OpenClaw rufen die Tool-Funktionen auf; externe Quellen liefern Daten; Cache-Helfer persistieren bei Abrufen Artefakte.

## See
[tools](../objects/tools.md), [ris](../objects/ris.md), [cache](../objects/cache.md).
Quelle: [plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts).
