---
type: object
cluster: verification
universe: live
status: verified
entity: tests/test_austrian_law_cli.py
verified_at: 2026-10-19
revision: 2af21a4
---

# Quality

Zwei Offline-Python-Unittestsuiten und statische Vertragsnotizen sichern die CLI-Oberfläche.

## Why this shape
Offline-Fixtures und synthetische XML-Snapshots machen Abruf- und Parserfehler reproduzierbar, ohne Upstream-Abrufe zu brauchen.

## Shape
Aktuelle Suite: `python -B -m unittest discover tests` — 25 Tests, OK in < 0,3 s (Ausführungsnachweis 2026-10-19).
- [tests/test_austrian_law_cli.py](../../../tests/test_austrian_law_cli.py) — CLI-, Receipt- und Parsing-Tests, u. a. gegen den amtlichen XML-Snapshot [fixtures/ris/nor40258475-segment.xml](../../../fixtures/ris/nor40258475-segment.xml) (`test_austrian_law_cli.py:88`).
- [tests/test_issue12.py](../../../tests/test_issue12.py) — Regressions aus Issue #12: falsche/abgelaufene Kandidaten, artikelqualifizierte Paragraphen, vergifteter Cache, Raw-Pfade und OGD-Request-Parameter, offline mit synthetischem XML (`test_issue12.py:1`).
- [tests/skill/](../../../tests/skill) — textuelle Vertragsnotizen (Frontmatter, Quellenpolitik, Stable IDs, Response-Struktur); sprachunabhängige Verhaltensspezifikation.
- [fixtures/ris/](../../../fixtures/ris) — reale amtliche XML-/HTML-Snapshots als Regression-Anker; [fixtures/ris-api/](../../../fixtures/ris-api) dokumentiert echte OGD-API-Antworten.

## Connected to
[tools](tools.md), [ris](ris.md), [jusline](jusline.md), [cache](cache.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** Passende Fixture-/Testsuite und zugehörige Vertragsnotizen; Suite-Routing bei neuer Testdatei.
- **Does not hit:** Produktivcode allein durch Änderung einer Testbeschreibung.

## Surfaces
Maintainer/Agenten führen die Suite lokal aus; es gibt kein npm/CI-Gate. Live-Checks gegen externe Quellen sind nicht Teil der Suite.

## See
Quelle: [tests/test_austrian_law_cli.py](../../../tests/test_austrian_law_cli.py). [Änderungsrouting](../effects/CONTEXT.md).
