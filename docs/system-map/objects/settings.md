---
type: object
cluster: configuration
universe: live
status: verified
entity: scripts/austrian_law_cli.py
verified_at: 2026-10-19
revision: 2af21a4
---

# Settings

Settings und Ausführungskontext bestimmen Upstreams und Datenwurzeln.

## Why this shape
Mehrere Agent-Workspaces benötigen explizite Kontextauflösung ohne Dateikonfiguration.

## Shape
Aktuelle Python-CLI: `get_default_cache_dir()` nutzt `Path.cwd()/data/cache` (`austrian_law_cli.py:39`); `--cache-dir` überschreibt diesen Pfad je Befehl. Die Datenwurzel ist der Cache-Elternordner (`storage.py:29`); Rohquellen liegen unter `<Datenwurzel>/ris/raw/` (`storage.py:30`).

- [scripts/austrian_law_cli.py](../../../scripts/austrian_law_cli.py)
- [scripts/lib/storage.py](../../../scripts/lib/storage.py)

## Connected to
[tools](tools.md), [cache](cache.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** CLI-Kontext, Cache-Isolation, Pfadauflösung und Tool-/CLI-Tests.
- **Does not hit:** Stable-ID-Format durch bloße Wurzelkonfiguration.

## Surfaces
CLI konfiguriert; Runtime liest. Es gibt kein settings.json und keine Env-Overrides; lokale Daten sind keine Map-Inputs.

## See
Quelle: [scripts/austrian_law_cli.py](../../../scripts/austrian_law_cli.py). [Änderungsrouting](../effects/CONTEXT.md).
