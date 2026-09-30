---
type: object
cluster: persistence
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/cache/cache-io.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
---

# Cache

Stable IDs verbinden Markdown-Artefakte mit JSON-Metadaten in getrennten Wurzeln.

## Why this shape
Nachweisbarer Inhalt und technische Metadaten benötigen konsistente Identität.

## Shape
cache-paths.ts prüft Stable-ID/Quelle und ersetzt Doppelpunkte im Dateinamen. cache-io.ts schreibt Markdown und JSON separat per writeFile; kein atomarer Zweidatei-Commit. Allgemeine by-source-id-/by-stable-id-Indizes des archivierten Modells sind ghosts.

- [plugin/openclaw-austrian-law/src/cache/cache-paths.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-paths.ts) — `plugin/openclaw-austrian-law/src/cache/cache-paths.ts:25`
- [plugin/openclaw-austrian-law/src/cache/cache-io.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-io.ts) — `plugin/openclaw-austrian-law/src/cache/cache-io.ts:13`
- [plugin/openclaw-austrian-law/src/cache/cache-io.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-io.ts) — `plugin/openclaw-austrian-law/src/cache/cache-io.ts:74`
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
