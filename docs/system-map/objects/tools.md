---
type: object
cluster: interface
universe: live
status: verified
entity: plugin/openclaw-austrian-law/src/tools/registry.ts
verified_at: 2026-09-30
revision: 2a94740e69a38706d0a57fcaceab8c6122b60a82
---

# Tools

Sechs Tool-Funktionen werden über Registry, CLI und OpenClaw exponiert.

## Why this shape
Gemeinsame Typen und Schemata stabilisieren mehrere Aufrufoberflächen.

## Shape
Vier RIS- und zwei JUSLINE-Tools. ToolResult trägt success/data/error/meta. CLI besitzt eine eigene Funktionstabelle; Änderungen müssen beide Oberflächen berücksichtigen. main und openclaw.extensions zeigen noch auf index.ts.

- [plugin/openclaw-austrian-law/src/tools/registry.ts](../../../plugin/openclaw-austrian-law/src/tools/registry.ts) — `plugin/openclaw-austrian-law/src/tools/registry.ts:13`
- [plugin/openclaw-austrian-law/src/tools/schemas.ts](../../../plugin/openclaw-austrian-law/src/tools/schemas.ts) — `plugin/openclaw-austrian-law/src/tools/schemas.ts:10`
- [plugin/openclaw-austrian-law/bin/cli.ts](../../../plugin/openclaw-austrian-law/bin/cli.ts) — `plugin/openclaw-austrian-law/bin/cli.ts:43`
- [plugin/openclaw-austrian-law/package.json](../../../plugin/openclaw-austrian-law/package.json) — `plugin/openclaw-austrian-law/package.json:28`

## Connected to
[policy](policy.md), [ris](ris.md), [jusline](jusline.md), [settings](settings.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** shared.ts, tool-contracts.ts, definitions.ts, schemas.ts, registry.ts, CLI und Plugin-Registrierung; Tool- und CLI-Tests.
- **Does not hit:** Quellenpolitik bei reinem Packaging.

## Surfaces
CLI und OpenClaw lesen/führen aus; Maintainer schreiben.

## See
Quelle: [plugin/openclaw-austrian-law/src/tools/registry.ts](../../../plugin/openclaw-austrian-law/src/tools/registry.ts). [Änderungsrouting](../effects/CONTEXT.md).
