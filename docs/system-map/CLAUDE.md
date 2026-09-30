# Austrian Law Kit — System-Map

ICM Form 6; Karte des Repository-Istzustands. Einstieg für Änderungen, keine zweite Spezifikation.

| Frage | Karte |
| :--- | :--- |
| Fachliche Steuerung und Dokumentationspflege | [Policy](objects/policy.md) |
| Öffentliche Tools, CLI und Plugin | [Tool-Oberfläche](objects/tools.md) |
| RIS-Auflösung, Parser und Stichtagsnachweise | [RIS](objects/ris.md) |
| JUSLINE-Sekundärkontext | [JUSLINE](objects/jusline.md) |
| Stable IDs, Artefakte und persistente Caches | [Cache](objects/cache.md) |
| Workspace-Konfiguration und Isolation | [Settings](objects/settings.md) |
| Tests und Fixtures | [Qualität](objects/quality.md) |
| Tatsächliche Abrufflüsse | [Prozesse](processes/CONTEXT.md) |
| Was trifft eine Änderung? | [Auswirkungen](effects/CONTEXT.md) |

Namensfallen: `*Stub` und `TOOL_STUBS` bezeichnen aktive Implementierungen, nicht leere Stubs. „Plugin“ meint die optionale OpenClaw-Anbindung; dieselben Tool-Funktionen laufen auch per CLI. `representation: whole_law` ist eine Darstellung, kein zusätzlicher doc_type.

Lade [CONTEXT.md](CONTEXT.md) und nur die zum Auftrag passende Karte. Neue Aufgaben: [GitHub Issues](https://github.com/martinderm/austrian-law-kit/issues). Metadatenregeln: [_meta/schema.md](_meta/schema.md).
