# Änderungsauswirkungen — Routing

Inputs: Änderungsauftrag. Nicht den gesamten Baum laden; die Karten tragen die Details.

| Änderung | Zuerst öffnen |
| :--- | :--- |
| Quellen-/Antwortpolitik | [Policy](../objects/policy.md) |
| Tool hinzufügen oder Input/Output ändern | [Tools](../objects/tools.md), [Qualität](../objects/quality.md) |
| RIS-Suche, Kürzel, State/Scope, Ranking | [RIS](../objects/ris.md), [Discovery](../processes/discovery.md) |
| Stichtag, Receipt, HTML/XML-Hash | [RIS](../objects/ris.md), [Fetch](../processes/fetch-and-verify.md), [Batch](../processes/batch-sync.md) |
| Stable ID, Frontmatter, Persistenz | [Cache](../objects/cache.md), [Settings](../objects/settings.md) |
| Agent-Workspace oder Cache-Wurzeln | [Settings](../objects/settings.md), [Cache](../objects/cache.md) |
| JUSLINE-Listen, Details oder TTL | [JUSLINE](../objects/jusline.md), [Sekundärkontext](../processes/secondary-context.md) |
| Installation, CLI oder Plugin-Packaging | [Tools](../objects/tools.md), [Settings](../objects/settings.md) |
| docs/-Bereinigung oder Backlog | [Policy](../objects/policy.md), [Dokumentationsindex](../../README.md) |

Process: Hits/Does not hit der Karten gegen den konkreten Diff prüfen; Scope und passende Tests ableiten.
Outputs: Änderungsliste und synchron aktualisierte Karten. Offene Arbeit in GitHub Issues.
Human Check: Schnittstellen, Verträge und System-Map widersprechen sich nicht; Quelllinks und Katalogzwillinge bleiben gültig.
