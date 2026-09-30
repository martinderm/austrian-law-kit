---
type: object
cluster: retrieval
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/ris/verification-receipt.ts
verified_at: 2026-09-30
revision: 7fc5439
---

# Ris

RIS-Discovery und Fetch erzeugen Normartefakte samt Stichtagsnachweis.

## Why this shape
Identität, zeitliche Geltung und Abrufrepräsentation müssen getrennt bleiben.

## Shape
API-Clients für Bund/Land/Gemeinden; HTML-Fallback und HTML-/XML-Parser. Der XML-Parser rendert den Textabschnitt als Single-Pass-Dokumentwanderer: alle Top-Level-`absatz ct="text"`-, `liste`- und `schlussteil`-Blöcke bleiben in Dokumentreihenfolge erhalten; unbekannte Top-Level-Blöcke schlagen laut fehl statt stiller Auslassung. Metadaten-Kurz-CTs `doknr`/`gesnr` werden zusätzlich zu den Lang-CTs gelesen; Fehlen bleibt `undefined`. Pfadidentität aus RIS-URLs wird nur aus echten Dokumentpfaden (`/Dokumente/`, `/eli/`) oder `Dokumentnummer`-Parametern abgeleitet — Endpunktnamen wie `NormDokument.wxe` erzeugen keine künstliche ID; bei URL-only-Abrufen entscheidet die aus dem Inhalt gelöste amtliche Dokumentnummer über Stable ID, Receipt und Cache, sonst fail closed. Rechtsstandsableitung (`deriveNormStatus`, HTML- und XML-Parität) ist stichtagsabhängig: `repealed` erst nach Ablauf des Außerkrafttretedatums, vor Inkrafttreten `unknown` — Titel-Beschriftung und Receipt tragen denselben Stichtag. Receipt hält zwei Hashes, Abrufmethode, Cache-Provenienz und Gültigkeitsstatus; die Receipt-Evaluation selbst bleibt stichtagsunabhängig in `evaluateStichtagValidity` gebündelt. History ist intern, kein siebentes öffentliches Tool.

- [plugin/openclaw-austrian-law/src/ris/segment-xml-parser.ts](../../../plugin/openclaw-austrian-law/src/ris/segment-xml-parser.ts) — `plugin/openclaw-austrian-law/src/ris/segment-xml-parser.ts:1`
- [plugin/openclaw-austrian-law/src/ris/segment-url.ts](../../../plugin/openclaw-austrian-law/src/ris/segment-url.ts) — `plugin/openclaw-austrian-law/src/ris/segment-url.ts:49`
- [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts) — `plugin/openclaw-austrian-law/src/ris/verification-receipt.ts:241`
- [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts) — `plugin/openclaw-austrian-law/src/ris/verification-receipt.ts:163`
- [plugin/openclaw-austrian-law/src/ris-api/client.ts](../../../plugin/openclaw-austrian-law/src/ris-api/client.ts) — `plugin/openclaw-austrian-law/src/ris-api/client.ts:1`
- [plugin/openclaw-austrian-law/src/ris/canonical-laws.ts](../../../plugin/openclaw-austrian-law/src/ris/canonical-laws.ts) — `plugin/openclaw-austrian-law/src/ris/canonical-laws.ts:7`

## Connected to
[tools](tools.md), [cache](cache.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** RIS-Tools, Suchranking, Batch-Kandidatenprüfung, Receipt-/Cache-Metadaten und Parser-/Rechtsstands-Regressionen; Änderungen an Textabschnitt-Wanderer, Metadaten-CTs oder Stichtagsableitung ziehen Parser-Regressionen (parser-smoke) und Tool-Smoke-Tests nach sich.
- **Does not hit:** JUSLINE-HTML-Selektoren bei reinem RIS-Ranking.

## Surfaces
RIS-Upstreams werden gelesen; Tools schreiben Artefakte über Cache-Helfer.

## See
Quelle: [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts). [Änderungsrouting](../effects/CONTEXT.md).
