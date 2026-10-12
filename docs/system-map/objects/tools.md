---
type: object
cluster: interface
universe: live
status: verified
entity: scripts/austrian_law_cli.py
verified_at: 2026-10-12
---

# Tools

Python 3 CLI-Werkzeuge für österreichische Rechtsrecherche (`scripts/austrian_law_cli.py`).

## Why this shape
Reine Python 3 Standardbibliothek (Zero Dependencies), standardisierter Structured CLI Envelope (`--json`) und ergonomische CLI-Flags statt fehleranfälliger JSON-String-Argumente.

## Shape
Sechs zentrale CLI-Befehle:
- `fetch_norm`: Einzelnorm abrufen, verifizieren, duale SHA-256 Hashes und Receipt erzeugen.
- `fetch_whole_law`: Amtliche Gesamtfassung im lokalen Cache vorhalten.
- `search_law`: Normsuche über die offizielle OGD RIS-API v2.6.
- `search_decisions`: Amtliche Höchstgerichts-Judikatur (OGH, VfGH, VwGH) aus RIS-Justiz.
- `list_canonical`: 52 vorindizierte Bundesgesetze auflisten.
- `migration_guide`: Kurze Migrationsanleitung für Altsysteme und Workspaces abrufen.

- [scripts/austrian_law_cli.py](../../../scripts/austrian_law_cli.py)
- [scripts/lib/ris_ogd_client.py](../../../scripts/lib/ris_ogd_client.py)
- [scripts/lib/ris_judikatur.py](../../../scripts/lib/ris_judikatur.py)
- [references/canonical-laws.json](../../../references/canonical-laws.json)
- [docs/migration-guide.md](../../../docs/migration-guide.md)

## Connected to
[policy](policy.md), [ris](ris.md), [cache](cache.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** CLI-Router, Subcommand-Parser, Argument-Validation, Structured Envelope.
- **Does not hit:** Amtliche RIS Upstream-Schnittstellen.

## Surfaces
CLI-Aufrufer (Terminal, AI-Harnesses) lesen/führen aus; Maintainer pflegen CLI und Argumente.

## See
Quelle: [scripts/austrian_law_cli.py](../../../scripts/austrian_law_cli.py). [Änderungsrouting](../effects/CONTEXT.md).
