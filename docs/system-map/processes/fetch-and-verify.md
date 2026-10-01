---
type: process
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/tools/ris_fetch_segment.ts
verified_at: 2026-09-30
revision: 275ff6e
consumes: [../objects/tools.md, ../objects/ris.md, ../objects/settings.md]
produces: [../objects/ris.md, ../objects/cache.md]
---

# fetch-and-verify

## Input → Movement → Output
Source-ID/URL/Query und Stichtag → Cache-Prüfung oder Abruf, Parsing und Receipt → Normartefakt mit Nachweis.

## Why this shape
Identität, Herkunft und Gültigkeit bleiben bis zur Ausgabe nachvollziehbar. Die technische Bewegung setzt die fachliche Freigabe durch den Agenten voraus.

## Steps
1. Validiert Identifikator, URL und Stichtag; prüft einen vorhandenen Segment-Cache oder lädt den Segmentinhalt; leitet Rechtsstands- und Titelbeschriftung in beiden Pfaden stichtagsabhängig ab. Pfadidentität kommt nur aus echten Dokumentpfaden oder Dokumentnummer-Parametern; bei URL-only-Abrufen entscheidet die aus dem Inhalt gelöste amtliche Dokumentnummer, sonst bricht der Abruf fail-closed ab. Quelle: [plugin/openclaw-austrian-law/src/tools/ris_fetch_segment.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_fetch_segment.ts) — `plugin/openclaw-austrian-law/src/tools/ris_fetch_segment.ts:1`.
2. Löst Gesamtfassungen aus Kennung, URL oder Query auf; liest Cache oder lädt die Gesamtfassung. Quelle: [plugin/openclaw-austrian-law/src/tools/ris_fetch_whole_law.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_fetch_whole_law.ts) — `plugin/openclaw-austrian-law/src/tools/ris_fetch_whole_law.ts:1`.
3. Erzeugt aus Inhalt und Metadaten den Receipt mit Hashes und Stichtagsstatus (inkl. fail-closed-Fassungsstand-Prüfung ohne engere Geltungsgrenzen). Quelle: [plugin/openclaw-austrian-law/src/ris/verification-receipt.ts](../../../plugin/openclaw-austrian-law/src/ris/verification-receipt.ts) — `plugin/openclaw-austrian-law/src/ris/verification-receipt.ts:251`.
4. Persistiert frisch erzeugte Artefakte über die gemeinsamen Cache-Helfer. Quelle: [plugin/openclaw-austrian-law/src/cache/cache-write-through.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-write-through.ts) — `plugin/openclaw-austrian-law/src/cache/cache-write-through.ts:1`.

## If you change this
- **Hits:** Abrufrepräsentationen, Receipts, Cache-Provenienz und Rechtsstands-Regressionen.
- **Does not hit:** JUSLINE-Query-TTL.

## Surfaces
CLI und OpenClaw rufen die Tool-Funktionen auf; externe Quellen liefern Daten innerhalb einer konfigurierbaren Abort-Deadline (Request und Body-Lesen, Fehlerklassen UPSTREAM_TIMEOUT/CANCELLED/UPSTREAM_UNAVAILABLE); die amtliche Rohquelle wird vor der Konvertierung sha-adressiert archiviert und im Receipt referenziert (auch bei Parserfehlern als Diagnosebeleg); Cache-Helfer persistieren bei Abrufen Artefakte atomar als geprüfte Generation.

## See
[tools](../objects/tools.md), [ris](../objects/ris.md), [settings](../objects/settings.md), [cache](../objects/cache.md).
Quelle: [plugin/openclaw-austrian-law/src/tools/ris_fetch_segment.ts](../../../plugin/openclaw-austrian-law/src/tools/ris_fetch_segment.ts).
