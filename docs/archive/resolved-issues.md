# Resolved Issues & Architecture Archive: austrian-law-kit

> **Ablageort:** `docs/archive/resolved-issues.md`  
> **Zweck:** Historisches Archiv aller behobenen Ungereimtheiten und geschlossenen Issues für `austrian-law-kit`.  
> **Aktive Issues:** Siehe <https://github.com/martinderm/austrian-law-kit/issues>.

---

## 1. Übersicht geschlossener Issues

Archiviert am 2026-10-19 (Close-out von [`docs/known-issues.md`](../known-issues.md), GitHub Issue #13). Die Legacy-TypeScript-Verzeichnisse `plugin/openclaw-austrian-law/`, `src/` und `bin/` sind seit Commit `cc2103c` entfernt; der Python-3-stdlib-Ersatz läuft produktiv.

| ID | Komponente | Gelöst am | Behoben in | Kurzbeschreibung der Lösung |
| :--- | :--- | :--- | :--- | :--- |
| **`ALK-01`** | `plugin/openclaw-austrian-law/` | 2026-10-19 | `cc2103c` | TypeScript/Node.js Monolith entfernt; Ersatz: `scripts/austrian_law_cli.py` + `scripts/lib/` (Python 3, stdlib-only, Zero Dependencies) |
| **`ALK-02`** | `src/ris/*-parser.ts` | 2026-10-19 | `cc2103c` | Regex-HTML-Parser entfernt; Parsing via amtliche RIS-OGD-XML-Endpunkte in `scripts/lib/ris_ogd_client.py` (`xml.etree.ElementTree`) |
| **`ALK-03`** | `src/jusline/` | 2026-10-19 | `cc2103c` | JUSLINE-Web-Scraping entfernt; Judikatur von OGH/VfGH/VwGH über amtliche RIS-OGD-Schnittstelle in `scripts/lib/ris_judikatur.py` |
| **`ALK-04`** | `src/cache/` | 2026-10-19 | `cc2103c` | 10-Dateien-Cache-Architektur entfernt; Ersatz: kompaktes `scripts/lib/storage.py` (atomares Schreiben via `tempfile` + `os.replace`, SHA-256-Receipts) |
| **`ALK-05`** | `src/ris/query-resolver.ts` | 2026-10-19 | `cc2103c` | Fallback-Kaskade ersetzt durch 2-Stufen-Pfad: `references/canonical-laws.json`-Lookup → strukturierte RIS-OGD-API-Abfrage |
| **`ALK-06`** | `bin/cli.ts` | 2026-10-19 | `cc2103c` | JSON-String-Argument-CLI entfernt; Flag-CLI via `argparse` (`--slug`, `--paragraph`, `--source-id`, `--json`) in `scripts/austrian_law_cli.py` |
| **`ALK-07`** | `tests/tool-smoke.test.ts` | 2026-10-19 | `cc2103c` | 141-KB-Mock-Boilerplate entfernt; Ersatz: `tests/test_austrian_law_cli.py` + `tests/test_issue12.py` (25 Offline-Unittests, < 0,3 s) |

---

## 2. Archivierte Problemdokumentationen & Lösungen

Kompakt archivierte Ausgangsbeschreibungen aus [`docs/known-issues.md`](../known-issues.md) (Stand 2026-10-12) mit Lösungsvermerk:

### `ALK-01`: TypeScript/Node.js Monolith statt Python 3 (stdlib-only)
- **Ausgangslage:** Kit in TypeScript, abhängig von `node`, `npm`, `tsx` und hundertfachen MB in `node_modules`; verletzte die Python-first-Regel.
- **Lösung:** Vollständige Migration auf Python 3 Standardbibliothek (`urllib.request`, `xml.etree.ElementTree`, `hashlib`, `json`, `argparse`). Legacy-Verzeichnis `plugin/openclaw-austrian-law/` vollständig entfernt.

### `ALK-02`: Regex auf RIS-HTML statt amtliches XML-Parsing
- **Ausgangslage:** RIS-HTML-Seiten wurden mit komplexen Regexen zerlegt; hochbrisant bei Layout- oder DOM-Änderungen des BKA.
- **Lösung:** Parsing über die offiziellen RIS-XML-Endpunkte (`/Dokumente/Bundesrecht/.../Dokument.xml`) mit `xml.etree.ElementTree` in `scripts/lib/ris_ogd_client.py`.

### `ALK-03`: JUSLINE Web-Scraping statt amtlicher RIS-Judikatur
- **Ausgangslage:** Web-Scraping der privaten Plattform `jusline.at` (urheberrechtlich heikel, kein API-Vertrag, bricht bei Bot-Protection ab).
- **Lösung:** Scraping entfernt; Leitentscheidungen von OGH, VfGH und VwGH über die amtliche RIS-Justiz-Schnittstelle (OGD) via `scripts/lib/ris_judikatur.py`.

### `ALK-04`: 10-Dateien-Cache-Architektur
- **Ausgangslage:** Fragmentierte Cache-Schicht mit künstlicher Memory/Data-Trennung und fehleranfälligem Windows-Pfad-Handling.
- **Lösung:** Ein kompaktes `scripts/lib/storage.py` mit atomarem Schreiben (`tempfile` + `os.replace`), Markdown-Export mit YAML-Frontmatter und begleitender `.receipt.json` (SHA-256).

### `ALK-05`: 5+ Fallback-Stufen und unscharfes Ranking
- **Ausgangslage:** Mehrstufige Kaskade mit heuristischer Ähnlichkeitsberechnung; nicht-deterministische Treffer (z. B. „MRG § 16“).
- **Lösung:** Klarer 2-Stufen-Pfad: schneller Lookup über `references/canonical-laws.json` (z. B. `ABGB` → Gesetzesnummer `10001622`), danach strukturierte RIS-OGD-API-Abfrage.

### `ALK-06`: CLI-Quoting auf Windows
- **Ausgangslage:** Befehle verlangten ein JSON-Objekt als String-Parameter (`node cli.js ris_search '{"query": "..."}'`); in PowerShell regelmäßig Parsing-Fehler.
- **Lösung:** Standardisierte Flag-CLI via `argparse`: `python scripts/austrian_law_cli.py fetch --slug abgb --paragraph 1293 --json`.

### `ALK-07`: 141 KB Test-Boilerplate
- **Ausgangslage:** Riesige Mock-Testdatei (`tool-smoke.test.ts`, über 3.500 Zeilen), testete vor allem interne Mocks statt Parsing-Logik.
- **Lösung:** Kompakte Unittests auf echten Fixtures und synthetischen RIS-XML-Snapshots: `tests/test_austrian_law_cli.py`, `tests/test_issue12.py` — 25 Tests in < 0,3 s, offline.
