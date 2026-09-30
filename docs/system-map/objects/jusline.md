---
type: object
cluster: retrieval
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/jusline/runtime.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
---

# Jusline

JUSLINE liefert optionale Entscheidungs- und Diskussionslisten samt Detail-Previews.

## Why this shape
Sekundärkontext bleibt von RIS-Normnachweisen getrennt.

## Shape
Liste und Diskussion nutzen getrennte Parser. Details tragen u. a. Geschäftszeichen, Gericht, ECLI und Textabschnitte; Query-Reuse hat 24h TTL und refresh-Umgehung.

- [plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts](../../../plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts) — `plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts:1`
- [plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts](../../../plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts) — `plugin/openclaw-austrian-law/src/tools/jusline_fetch_discussions.ts:1`
- [plugin/openclaw-austrian-law/src/jusline/decision-detail.ts](../../../plugin/openclaw-austrian-law/src/jusline/decision-detail.ts) — `plugin/openclaw-austrian-law/src/jusline/decision-detail.ts:1`
- [plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts](../../../plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts) — `plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts:1`

## Connected to
[policy](policy.md), [tools](tools.md), [cache](cache.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** JUSLINE-Parser, Preview-Artefakte, Frontmatter, Query-Index sowie JUSLINE-Detail-/Tool-Tests.
- **Does not hit:** RIS-Stichtagsbewertung durch reine JUSLINE-Selektoränderungen.

## Surfaces
JUSLINE-Upstream wird gelesen; Tools schreiben sekundäre Preview-Caches.

## See
Quelle: [plugin/openclaw-austrian-law/src/jusline/runtime.ts](../../../plugin/openclaw-austrian-law/src/jusline/runtime.ts). [Änderungsrouting](../effects/CONTEXT.md).
