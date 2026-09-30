---
type: process
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
consumes: [../objects/policy.md, ../objects/tools.md, ../objects/jusline.md]
produces: [../objects/jusline.md, ../objects/cache.md]
---

# secondary-context

## Input → Movement → Output
Explizit gewünschter Sekundärkontext → Query-Index oder JUSLINE-Abruf und Detail-Preview → Hits und sekundäre Cache-Artefakte.

## Why this shape
Identität, Herkunft und Gültigkeit bleiben bis zur Ausgabe nachvollziehbar. Die technische Bewegung setzt die fachliche Freigabe durch den Agenten voraus.

## Steps
1. Prüft Entscheidungs-Query und Cache-Reuse; lädt bei Bedarf die Liste und erstellt Entscheidungs-Previews. Quelle: [plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts](../../../plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts) — `plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts:1`.
2. Verarbeitet Diskussionslisten und Kommentar-Previews auf dem getrennten Sekundärpfad. Quelle: [plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts](../../../plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts) — `plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts:1`.
3. Liest bzw. aktualisiert den Query-Index nach query/kind/limit; refresh umgeht Wiederverwendung. Quelle: [plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts](../../../plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts) — `plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts:1`.

## If you change this
- **Hits:** Listen-/Detailparser, TTL/refresh, Preview-Metadaten und JUSLINE-Tests.
- **Does not hit:** RIS-Verifikationsstatus.

## Surfaces
CLI und OpenClaw rufen die Tool-Funktionen auf; externe Quellen liefern Daten; Cache-Helfer persistieren bei Abrufen Artefakte.

## See
[policy](../objects/policy.md), [tools](../objects/tools.md), [jusline](../objects/jusline.md), [cache](../objects/cache.md).
Quelle: [plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts](../../../plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts).
