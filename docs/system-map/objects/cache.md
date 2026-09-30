---
type: object
cluster: persistence
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/cache/cache-io.ts
verified_at: 2026-09-30
revision: af817c5
---

# Cache

Stable IDs verbinden Markdown-Artefakte mit JSON-Metadaten in getrennten Wurzeln.

## Why this shape
Nachweisbarer Inhalt und technische Metadaten benötigen konsistente Identität.

## Shape
cache-paths.ts prüft Stable-ID/Quelle und ersetzt Doppelpunkte im Dateinamen. cache-io.ts schreibt Markdown und JSON separat per writeFile; kein atomarer Zweidatei-Commit. Cache-Lesehelfer reichen die Metadaten (inkl. persistiertem Verification Receipt) an die Fetch-Tools durch: Cache-Hits restaurieren Original-`raw_content_sha256`, `gesetzesnummer`, `dokumentnummer`, `eli`, `retrieval_method` und ursprüngliches `retrieved_at` über `applyCachedReceiptProvenance` und markieren Lücken in Legacy-Artefakten mit einer Warnung statt der Behauptung vollständiger Provenienz. Whole-law-Frontmatters persistieren `norm_status` und `promulgation` frisch, damit Cache-Hits die Felder verfügbar haben; historische Gesamtgesetz-Anfragen tragen versionsuffigierte Stable IDs (`:v<Stichtag>`), und unversionierte heutige Einträge bleiben kompatibel. Allgemeine by-source-id-/by-stable-id-Indizes des archivierten Modells sind ghosts.

- [plugin/openclaw-austrian-law/src/cache/cache-paths.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-paths.ts) — `plugin/openclaw-austrian-law/src/cache/cache-paths.ts:25`
- [plugin/openclaw-austrian-law/src/cache/cache-io.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-io.ts) — `plugin/openclaw-austrian-law/src/cache/cache-io.ts:13`
- [plugin/openclaw-austrian-law/src/cache/cache-io.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-io.ts) — `plugin/openclaw-austrian-law/src/cache/cache-io.ts:74`
- [plugin/openclaw-austrian-law/src/cache/cache-read-reuse.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-read-reuse.ts) — `plugin/openclaw-austrian-law/src/cache/cache-read-reuse.ts:10`
- [plugin/openclaw-austrian-law/src/cache/cache-runtime.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-runtime.ts) — `plugin/openclaw-austrian-law/src/cache/cache-runtime.ts:86`

## Connected to
[ris](ris.md), [jusline](jusline.md), [settings](settings.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** Stable-ID-Helfer, Frontmatter, Serializer/Parser, Cache-Reuse, JUSLINE-Index, runtime-layout.md und Cache-Tests.
- **Does not hit:** RIS-Netzwerk-Endpunkte bei bloßer Dateinamenänderung.

## Surfaces
Tools lesen und schreiben; Agenten lesen Markdown. Laufzeitdaten bleiben git-ignoriert.

## See
Quelle: [plugin/openclaw-austrian-law/src/cache/cache-io.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-io.ts). [Änderungsrouting](../effects/CONTEXT.md).
