# Architekturüberblick

Das Toolkit trennt die fachliche Orchestrierung in [SKILL.md](../SKILL.md) von der Python-3-Laufzeit in [`scripts/austrian_law_cli.py`](../scripts/austrian_law_cli.py) und [`scripts/lib/`](../scripts/lib/). Die Laufzeit ist eine Standardbibliothek-Anwendung (Zero Dependencies) und wird über eine Flag-CLI bedient.

Die sechs CLI-Befehle (`fetch_norm`, `fetch_whole_law`, `search_law`, `search_decisions`, `list_canonical`, `migration_guide`) teilen den Structured CLI Envelope (`--json`), die amtlichen RIS-OGD-Module (`ris_ogd_client.py`, `ris_judikatur.py`) und den atomaren Disk-Cache (`storage.py`). RIS ist die Primärquelle; amtliche Judikatur (OGH/VfGH/VwGH via RIS-Justiz) ergänzt ausdrücklich angeforderten Sekundärkontext. Python 3 (stdlib-only) ist die [dokumentierte Sprachentscheidung](decision-log.md).

Markdown-Artefakte, JSON-Metadaten und Rohquellen-Archiv liegen in getrennten Workspace-Wurzeln: [Runtime-Layout](runtime-layout.md). Diese Nutzdaten werden nicht in das Repository eingecheckt.

Objekte, tatsächliche Prozesse, Grenzen und Änderungsauswirkungen sind in der [ICM-System-Map](system-map/README.md) kartiert. Aktive Aufgaben stehen in [GitHub Issues](https://github.com/martinderm/austrian-law-kit/issues).
