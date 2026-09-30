---
type: object
cluster: retrieval
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/ris/verification-receipt.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
---

# Ris

RIS-Discovery und Fetch erzeugen Normartefakte samt Stichtagsnachweis.

## Why this shape
Identität, zeitliche Geltung und Abrufrepräsentation müssen getrennt bleiben.

## Shape
API-Clients für Bund/Land/Gemeinden; HTML-Fallback und HTML-/XML-Parser. Receipt hält zwei Hashes, Abrufmethode, Cache-Provenienz und Gültigkeitsstatus. History ist intern, kein siebentes öffentliches Tool.

- [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts) — `plugin/openclaw-austrian-law/src/ris/verification-receipt.ts:241`
- [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts) — `plugin/openclaw-austrian-law/src/ris/verification-receipt.ts:163`
- [plugin/openclaw-austrian-law/src/ris-api/client.ts](../../../plugin/openclaw-austrian-law/src/ris-api/client.ts) — `plugin/openclaw-austrian-law/src/ris-api/client.ts:1`
- [plugin/openclaw-austrian-law/src/ris/canonical-laws.ts](../../../plugin/openclaw-austrian-law/src/ris/canonical-laws.ts) — `plugin/openclaw-austrian-law/src/ris/canonical-laws.ts:7`

## Connected to
[tools](tools.md), [cache](cache.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** RIS-Tools, Suchranking, Batch-Kandidatenprüfung, Receipt-/Cache-Metadaten und Parser-/Rechtsstands-Regressionen.
- **Does not hit:** JUSLINE-HTML-Selektoren bei reinem RIS-Ranking.

## Surfaces
RIS-Upstreams werden gelesen; Tools schreiben Artefakte über Cache-Helfer.

## See
Quelle: [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts). [Änderungsrouting](../effects/CONTEXT.md).
