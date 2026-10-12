# Known Issues & Technical Debt: austrian-law-kit

> **Status:** Under Refactoring (Blueprint: `german-law-kit`)  
> **Last Updated:** 2026-10-12  
> **Zweck:** Verbindliche Dokumentation der architektonischen und technischen Ungereimtheiten in `austrian-law-kit` als Handoff für das anstehende Python-Refactoring.

---

## 1. Übersicht

| ID | Komponente / Pfad | Typ | Schweregrad | Status | Kurzbeschreibung |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`ALK-01`** | `plugin/openclaw-austrian-law/` | `standard-violation` | `high` | `open` | TypeScript/Node.js Monolith statt standardisiertem Python 3 stdlib |
| **`ALK-02`** | `src/ris/*-parser.ts` | `brittle-parser` | `high` | `open` | Brüchige Regex-Parser auf HTML statt nativem RIS-XML-Parsing |
| **`ALK-03`** | `src/jusline/` (8 Dateien) | `third-party-risk` | `high` | `open` | Fragiles Web-Scraping einer privaten Plattform (JUSLINE) statt amtlicher RIS-Judikatur |
| **`ALK-04`** | `src/cache/` (10 Dateien) | `over-engineering` | `medium` | `open` | Aufgeblähte 10-Dateien-Cache-Architektur mit künstlicher Memory/Data-Silo-Trennung |
| **`ALK-05`** | `src/ris/query-resolver.ts` | `over-engineering` | `medium` | `open` | 5+ konkurrierende Fallback-Stufen und heuristisches String-Ranking |
| **`ALK-06`** | `bin/cli.ts` | `ux-cli` | `medium` | `open` | JSON-String-Argumente im CLI führen zu Windows-PowerShell Quoting-Fehlern |
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
  - [ ] Keine Abhängigkeit von `node`/`npm`.
  - [ ] Alle CLI-Werkzeuge laufen direkt unter `python scripts/<tool>.py`.

---

### `ALK-02`: Regex auf RIS-HTML statt amtliches XML-Parsing
- **Betroffene Dateien:** `src/ris/search-parser.ts`, `src/ris/segment-parser.ts`, `src/ris/whole-law-parser.ts`
- **Typ & Schweregrad:** `brittle-parser` | `high`
- **Ist-Zustand:** HTML-Seiten des RIS werden mit komplexen regulären Ausdrücken zerlegt (*„Parser sind im MVP weiter regex-basiert“*).
- **Warum problematisch:** Äußerst fehleranfällig bei kleinen Layout-, Whitespace- oder DOM-Änderungen des Bundeskanzleramts (BKA).
- **Soll-Zustand:** Nutzung der offiziellen RIS-XML-Endpunkte (`/Dokumente/Bundesrecht/.../Dokument.xml`). Parsing via Python `xml.etree.ElementTree` analog zu `german-law-kit`.
- **Akzeptanzkriterien:**
  - [ ] Paragrafen und Gesamtfassungen werden deterministisch aus XML-Tags extrahiert.
  - [ ] Null Regex-Matching auf HTML-Strings.

---

### `ALK-03`: JUSLINE Web-Scraping statt amtlicher RIS-Judikatur
- **Betroffene Dateien:** `src/jusline/` (`discussions-parser.ts`, `decisions-parser.ts`, `comment-detail.ts`, `artifact-previews.ts`, `common.ts`)
- **Typ & Schweregrad:** `third-party-risk` | `high`
- **Ist-Zustand:** Web-Scraping der privaten Plattform `jusline.at` für Entscheidungslisten und Forenbeiträge.
- **Warum problematisch:** Urheberrechtlich heikel, kein stabiler API-Vertrag, bricht bei Cloudflare/Bot-Protection sofort ab.
- **Soll-Zustand:** Entfernen des Scrapings. Leitentscheidungen von OGH, VfGH und VwGH direkt über die amtliche RIS-Justiz-Schnittstelle (OGD) beziehen.
- **Akzeptanzkriterien:**
  - [ ] Ordner `src/jusline/` vollständig entfernt.
  - [ ] Judikatur-Recherche stützt sich ausschließlich auf amtliche RIS-Quellen.

---

### `ALK-04`: 10-Dateien-Cache-Architektur
- **Betroffene Dateien:** `src/cache/` (`cache-io.ts`, `cache-paths.ts`, `cache-read-reuse.ts`, `cache-runtime.ts`, `cache-write-through.ts`, `jusline-query-index.ts`, `parse-artifact.ts`, `raw-source-archive.ts`, `serialize-artifact.ts`, `stable-id.ts`)
- **Typ & Schweregrad:** `over-engineering` | `medium`
- **Ist-Zustand:** Extrem fragmentierte Cache-Schicht, die künstlich zwischen `memory/references/` und `data/` trennt.
- **Warum problematisch:** Schwer nachvollziehbar, fehleranfälliges Pfad-Handling auf Windows (`\` vs. `/`).
- **Soll-Zustand:** Ein einziges, kompaktes Python-Modul `storage.py` (~100 Zeilen) mit atomarem Schreiben (`tempfile` + `os.replace`), Markdown-Export mit YAML-Frontmatter und begleitender `.receipt.json` (SHA-256).
- **Akzeptanzkriterien:**
  - [ ] Reduktion der 10 Cache-Dateien auf eine saubere `storage.py`.

---

### `ALK-05`: 5+ Fallback-Stufen und unscharfes Ranking
- **Betroffene Dateien:** `src/ris/query-resolver.ts`, `src/ris/search-ranking.ts`
- **Typ & Schweregrad:** `over-engineering` | `medium`
- **Ist-Zustand:** Mehrstufige Kaskade (`direct_source_id`, `eli_url`, `norm_document_url`, `ris_api_discovery`, `ris_html_search`, `web_search_fallback`) mit heuristischer Ähnlichkeitsberechnung.
- **Warum problematisch:** Nicht-deterministische Treffer; Abkürzungen wie „MRG § 16“ liefern unerwartete Ergebnisse.
- **Soll-Zustand:** Klarer 2-Stufen-Pfad:
  1. Schneller Lookup über `config/canonical_laws.json` (z. B. `ABGB` $\rightarrow$ Gesetzesnummer `10001622`).
  2. Strukturierte Abfrage der RIS-OGD-API bei unbekannten Begriffen.
- **Akzeptanzkriterien:**
  - [ ] Deterministische Auflösung bekannter Gesetzeskürzel in $O(1)$.

---

### `ALK-06`: CLI-Quoting auf Windows
- **Betroffene Dateien:** `bin/cli.ts`
- **Typ & Schweregrad:** `ux-cli` | `medium`
- **Ist-Zustand:** Befehle verlangen ein JSON-Objekt als String-Parameter (`node cli.js ris_search '{"query": "..."}'`).
- **Warum problematisch:** In Windows PowerShell führt das Escaping von Single- und Double-Quotes (`'` / `"`) regelmäßig zu Parsing-Fehlern.
- **Soll-Zustand:** Standardisierte CLI-Flags via `argparse`:
  `python scripts/fetch_law.py --slug abgb --paragraph 1293 --json`
- **Akzeptanzkriterien:**
  - [ ] Keine zwingende JSON-String-Übergabe auf der Kommandozeile.

---

### `ALK-07`: 141 KB Test-Boilerplate
- **Betroffene Dateien:** `tests/tool-smoke.test.ts`
- **Typ & Schweregrad:** `test-bloat` | `low`
- **Ist-Zustand:** Riesige Testdatei mit über 3.500 Zeilen Mock-Code.
- **Warum problematisch:** Hoher Wartungsaufwand bei API-Änderungen, testet vor allem interne Mocks statt Parsing-Logik.
- **Soll-Zustand:** Kompakte Unittests (`unittest`) auf Basis von echten statischen RIS-XML-Fixtures in `tests/fixtures/`.
- **Akzeptanzkriterien:**
  - [ ] Gesamte Testsuite läuft offline in < 0,5 Sekunden durch.
