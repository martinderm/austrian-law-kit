---
type: object
cluster: verification
universe: live
status: verified
entity: plugin/openclaw-austrian-law/package.json
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
---

# Quality

Sechs ausführbare Testsuiten und statische Vertragsnotizen sichern unterschiedliche Oberflächen.

## Why this shape
Offline-Fixtures machen Abruf- und Parserfehler reproduzierbar.

## Shape
npm test aggregiert sechs Suiten; npm run check prüft TypeScript, build erzeugt dist. tests/skill/ und tests/plugin/ enthalten Markdown-Akzeptanznotizen; tests/live/ ist ein separater manueller Upstream-Check. Historische Testzahlen sind keine neue Ausführungsevidenz.

- [plugin/openclaw-austrian-law/package.json](../../../plugin/openclaw-austrian-law/package.json) — `plugin/openclaw-austrian-law/package.json:19`
- [plugin/openclaw-austrian-law/package.json](../../../plugin/openclaw-austrian-law/package.json) — `plugin/openclaw-austrian-law/package.json:10`
- [tests/live/README.md](../../../tests/live/README.md) — `tests/live/README.md:1`

## Connected to
[tools](tools.md), [ris](ris.md), [jusline](jusline.md), [cache](cache.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** Passende Fixture-/Testsuite und zugehörige Vertragsnotizen; Suite-Routing bei neuer Testdatei.
- **Does not hit:** Produktivcode allein durch Änderung einer Testbeschreibung.

## Surfaces
Maintainer/CI führen aus; Live-Checks greifen auf externe Quellen zu.

## See
Quelle: [plugin/openclaw-austrian-law/package.json](../../../plugin/openclaw-austrian-law/package.json). [Änderungsrouting](../effects/CONTEXT.md).
