---
type: process
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
consumes: [../objects/tools.md, ../objects/ris.md]
produces: [../objects/ris.md, ../objects/cache.md]
---

# batch-sync

## Input → Movement → Output
Liste von Normanfragen → Deduplizierung und Kandidatenprüfung je Stichtag → Einzelresultate und getrennte I/O-/Gültigkeitszähler.

## Why this shape
Identität, Herkunft und Gültigkeit bleiben bis zur Ausgabe nachvollziehbar. Die technische Bewegung setzt die fachliche Freigabe durch den Agenten voraus.

## Steps
1. Leitet Stichtag und Abrufrepräsentation je Item ab, dedupliziert und prüft Suchkandidaten durch die Fetch-Tools. Quelle: [plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts) — `plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts:1`.
2. Aggregiert getrennte I/O- und Gültigkeitszähler; ausschließlich zeitlich gescheiterte Batches erhalten NO_VALID_VERSION_FOR_STICHTAG. Quelle: [plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts) — `plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts:495`.

## If you change this
- **Hits:** Batch-Verträge, Kandidatenranking, Deduplizierung und Tool-/Rechtsstands-Tests.
- **Does not hit:** JUSLINE-HTML-Extraktion.

## Surfaces
CLI und OpenClaw rufen die Tool-Funktionen auf; externe Quellen liefern Daten; Cache-Helfer persistieren bei Abrufen Artefakte.

## See
[tools](../objects/tools.md), [ris](../objects/ris.md), [cache](../objects/cache.md).
Quelle: [plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_sync_laws.ts).
