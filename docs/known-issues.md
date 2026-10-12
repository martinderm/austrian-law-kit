# Known Issues & Technical Debt: austrian-law-kit

> **Status:** Under Refactoring (Blueprint: `german-law-kit`)  
> **Last Updated:** 2026-10-12  
> **Ablageort:** `docs/known-issues.md`  
> **Zweck:** Schlanke Erfassung aktuell offener architektonischer und technischer Ungereimtheiten in `austrian-law-kit` als Handoff für das anstehende Python-Refactoring.

---

## 1. Übersicht der offenen Punkte

| ID | Komponente / Pfad | Typ | Schweregrad | Status | Kurzbeschreibung |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ALK-01`** | `plugin/openclaw-austrian-law/` | `standard-violation` | `high` | `in_progress` | TypeScript/Node.js Monolith statt standardisiertem Python 3 stdlib |
| **`ALK-02`** | `src/ris/*-parser.ts` | `brittle-parser` | `high` | `in_progress` | Brüchige Regex-Parser auf HTML statt nativem RIS-XML-Parsing |
| **`ALK-03`** | `src/jusline/` (8 Dateien) | `third-party-risk` | `high` | `open` | Fragiles Web-Scraping einer privaten Plattform (JUSLINE) statt amtlicher RIS-Judikatur |
| **`ALK-04`** | `src/cache/` (10 Dateien) | `over-engineering` | `medium` | `in_progress` | Aufgeblähte 10-Dateien-Cache-Architektur mit künstlicher Memory/Data-Silo-Trennung |
| **`ALK-05`** | `src/ris/query-resolver.ts` | `over-engineering` | `medium` | `in_progress` | 5+ konkurrierende Fallback-Stufen und heuristisches String-Ranking |
| **`ALK-06`** | `bin/cli.ts` | `ux-cli` | `medium` | `in_progress` | JSON-String-Argumente im CLI führen zu Windows-PowerShell Quoting-Fehlern |
| **`ALK-07`** | `tests/tool-smoke.test.ts` | `test-bloat` | `low` | `open` | 141 KB Test-Boilerplate mit schweren Mock-Schichten statt schneller Fixture-Tests |

---

## 2. Detaillierte Problembeschreibungen & Handlungsanweisungen

### `ALK-01`: TypeScript/Node.js Monolith statt Python 3 (stdlib-only)
- **Betroffene Dateien:** `plugin/openclaw-austrian-law/` (`package.json`, `tsconfig.json`, `dist/bin/cli.js`, `node_modules/`)
- **Typ & Schweregrad:** `standard-violation` | `high`
- **Ist-Zustand:** Das Kit ist in TypeScript implementiert und benötigt `node`, `npm`, `tsx` sowie hunderte MB Abhängigkeiten in `node_modules`.
- **Warum problematisch:** Verletzt die Kernregel in `skills/AGENTS.md` (*„Python-first: All tools in scripts/ must be Python 3, stdlib-only“*). Läuft nicht out-of-the-box in reinen Python-Agent-Harnesses.
- **Soll-Zustand:** Vollständige Umstellung auf 100 % Python 3 (Standardbibliothek: `urllib.request`, `xml.etree.ElementTree`, `hashlib`, `json`, `argparse`).
- **Akzeptanzkriterien:**
  - [x] Python-Ersatz `scripts/austrian_law_cli.py` und `scripts/lib/` implementiert & mit 16 Tests abgesichert.
  - [ ] Altes Verzeichnis `plugin/openclaw-austrian-law/` vollständig entfernen.

---

### `ALK-02`: Regex auf RIS-HTML statt amtliches XML-Parsing
- **Betroffene Dateien:** `src/ris/search-parser.ts`, `src/ris/segment-parser.ts`, `src/ris/whole-law-parser.ts`
- **Typ & Schweregrad:** `brittle-parser` | `high`
- **Ist-Zustand:** HTML-Seiten des RIS werden mit komplexen regulären Ausdrücken zerlegt (*„Parser sind im MVP weiter regex-basiert“*).
- **Warum problematisch:** Äußerst fehleranfällig bei kleinen Layout-, Whitespace- oder DOM-Änderungen des Bundeskanzleramts (BKA).
- **Soll-Zustand:** Nutzung der offiziellen RIS-XML-Endpunkte (`/Dokumente/Bundesrecht/.../Dokument.xml`). Parsing via Python `xml.etree.ElementTree` analog zu `german-law-kit`.
- **Akzeptanzkriterien:**
  - [x] XML-Parsing in `scripts/lib/ris_ogd_client.py` für Metadaten und Hierarchie implementiert.
  - [ ] Regex-HTML-Parser in `src/ris/` deprecaten.

---

### `ALK-03`: JUSLINE Web-Scraping statt amtlicher RIS-Judikatur
- **Betroffene Dateien:** `src/jusline/` (`discussions-parser.ts`, `decisions-parser.ts`, `comment-detail.ts`, `artifact-previews.ts`, `common.ts`)
- **Typ & Schweregrad:** `third-party-risk` | `high`
- **Ist-Zustand:** Web-Scraping der privaten Plattform `jusline.at` für Entscheidungslisten und Forenbeiträge.
- **Warum problematisch:** Urheberrechtlich heikel, kein stabiler API-Vertrag, bricht bei Cloudflare/Bot-Protection sofort ab.
- **Soll-Zustand:** Entfernen des Scrapings. Leitentscheidungen von OGH, VfGH und VwGH direkt über die amtliche RIS-Justiz-Schnittstelle (OGD) beziehen.
- **Akzeptanzkriterien:**
  - [x] OGD-Judikatur-Client in `scripts/lib/ris_judikatur.py` vorbereitet.
  - [ ] Ordner `src/jusline/` vollständig entfernen.

---

### `ALK-04`: 10-Dateien-Cache-Architektur
- **Betroffene Dateien:** `src/cache/` (`cache-io.ts`, `cache-paths.ts`, etc.)
- **Typ & Schweregrad:** `over-engineering` | `medium`
- **Ist-Zustand:** Extrem fragmentierte Cache-Schicht, die künstlich zwischen `memory/references/` und `data/` trennt.
- **Warum problematisch:** Schwer nachvollziehbar, fehleranfälliges Pfad-Handling auf Windows (`\` vs. `/`).
- **Soll-Zustand:** Ein einziges, kompaktes Python-Modul `scripts/lib/storage.py` mit atomarem Schreiben (`tempfile` + `os.replace`), Markdown-Export mit YAML-Frontmatter und begleitender `.receipt.json` (SHA-256).
- **Akzeptanzkriterien:**
  - [x] `scripts/lib/storage.py` mit atomarem Cache und SHA-256 Receipts implementiert.
  - [ ] Altes TypeScript-Cache-System ablösen.

---

### `ALK-05`: 5+ Fallback-Stufen und unscharfes Ranking
- **Betroffene Dateien:** `src/ris/query-resolver.ts`, `src/ris/search-ranking.ts`
- **Typ & Schweregrad:** `over-engineering` | `medium`
- **Ist-Zustand:** Mehrstufige Kaskade mit heuristischer Ähnlichkeitsberechnung.
- **Warum problematisch:** Nicht-deterministische Treffer; Abkürzungen wie „MRG § 16“ liefern unerwartete Ergebnisse.
- **Soll-Zustand:** Klarer 2-Stufen-Pfad:
  1. Schneller Lookup über `references/canonical-laws.json` (z. B. `ABGB` $\rightarrow$ Gesetzesnummer `10001622`).
  2. Strukturierte Abfrage der RIS-OGD-API bei unbekannten Begriffen.
- **Akzeptanzkriterien:**
  - [x] `references/canonical-laws.json` angelegt und in Python-Lookup integriert.

---

### `ALK-06`: CLI-Quoting auf Windows
- **Betroffene Dateien:** `bin/cli.ts`
- **Typ & Schweregrad:** `ux-cli` | `medium`
- **Ist-Zustand:** Befehle verlangen ein JSON-Objekt als String-Parameter (`node cli.js ris_search '{"query": "..."}'`).
- **Warum problematisch:** In Windows PowerShell führt das Escaping von Single- und Double-Quotes (`'` / `"`) regelmäßig zu Parsing-Fehlern.
- **Soll-Zustand:** Standardisierte CLI-Flags via `argparse`:
  `python scripts/austrian_law_cli.py fetch --slug abgb --paragraph 1293 --json`
- **Akzeptanzkriterien:**
  - [x] Standard-CLI mit Flags `--slug`, `--paragraph`, `--source-id`, `--json` in `austrian_law_cli.py` bereitgestellt.

---

### `ALK-07`: 141 KB Test-Boilerplate
- **Betroffene Dateien:** `tests/tool-smoke.test.ts`
- **Typ & Schweregrad:** `test-bloat` | `low`
- **Ist-Zustand:** Riesige Testdatei mit über 3.500 Zeilen Mock-Code.
- **Warum problematisch:** Hoher Wartungsaufwand bei API-Änderungen, testet vor allem interne Mocks statt Parsing-Logik.
- **Soll-Zustand:** Kompakte Unittests (`unittest`) auf Basis von echten statischen RIS-XML-Fixtures.
- **Akzeptanzkriterien:**
  - [x] `tests/test_austrian_law_cli.py` mit 16 Offline-Tests in < 0,1s etabliert.

---

> 📦 **Archiv**: Behobene Issues wandern nach vollständiger Verifikation und Bereinigung der Altlasten nach [`docs/archive/resolved-issues.md`](archive/resolved-issues.md).
