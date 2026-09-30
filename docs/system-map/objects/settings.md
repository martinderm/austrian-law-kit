---
type: object
cluster: configuration
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/config/settings.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
---

# Settings

Settings und Ausführungskontext bestimmen Upstreams und Datenwurzeln.

## Why this shape
Mehrere Agent-Workspaces benötigen explizite Kontextauflösung.

## Shape
settings.json-Namensraum austrian-law-kit, optionaler Env-Settings-Pfad und Workspace-/cwd-Fallback. cacheRoot nutzt AsyncLocalStorage; dataRoot nutzt Overrides/Env/Settings/Default. Diese Mechanismen sind nicht identisch.

- [plugin/openclaw-austrian-law/src/config/settings.ts](../../../plugin/openclaw-austrian-law/src/config/settings.ts) — `plugin/openclaw-austrian-law/src/config/settings.ts:38`
- [plugin/openclaw-austrian-law/src/config/settings.ts](../../../plugin/openclaw-austrian-law/src/config/settings.ts) — `plugin/openclaw-austrian-law/src/config/settings.ts:46`
- [plugin/openclaw-austrian-law/src/cache/cache-runtime.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-runtime.ts) — `plugin/openclaw-austrian-law/src/cache/cache-runtime.ts:54`
- [plugin/openclaw-austrian-law/src/cache/cache-runtime.ts](../../../plugin/openclaw-austrian-law/src/cache/cache-runtime.ts) — `plugin/openclaw-austrian-law/src/cache/cache-runtime.ts:86`

## Connected to
[tools](tools.md), [cache](cache.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** CLI-/Plugin-Kontext, Cache-Isolation, Pfadauflösung und Tool-/CLI-Tests.
- **Does not hit:** Stable-ID-Format durch bloße Wurzelkonfiguration.

## Surfaces
CLI/Plugin konfigurieren; Runtime liest. Lokale Settings sind keine Map-Inputs.

## See
Quelle: [plugin/openclaw-austrian-law/src/config/settings.ts](../../../plugin/openclaw-austrian-law/src/config/settings.ts). [Änderungsrouting](../effects/CONTEXT.md).
