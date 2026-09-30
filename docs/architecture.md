# Architekturüberblick

Das Toolkit trennt die fachliche Orchestrierung in [SKILL.md](../SKILL.md) von der TypeScript-Laufzeit in [plugin/openclaw-austrian-law/](../plugin/openclaw-austrian-law/). Die Laufzeit kann über eine Standalone-CLI oder den optionalen OpenClaw-Plugin-Entrypoint genutzt werden.

Die sechs öffentlichen Tools teilen typisierte Ergebnisse, Eingabeschemata, RIS-/JUSLINE-Abrufmodule und lokale Cache-Helfer. RIS ist die Primärquelle; JUSLINE ergänzt nur ausdrücklich angeforderten Sekundärkontext. TypeScript ist wegen des OpenClaw-Ökosystems eine [dokumentierte Sprachentscheidung](decision-log.md).

Markdown-Artefakte und JSON-Metadaten liegen in getrennten Workspace-Wurzeln: [Runtime-Layout](runtime-layout.md). Diese Nutzdaten werden nicht in das Repository eingecheckt.

Objekte, tatsächliche Prozesse, Grenzen und Änderungsauswirkungen sind in der [ICM-System-Map](system-map/README.md) kartiert. Aktive Aufgaben stehen in [GitHub Issues](https://github.com/martinderm/austrian-law-kit/issues).
