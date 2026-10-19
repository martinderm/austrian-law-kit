# Tool Contracts

Dieses Dokument definiert die aktuellen Verträge der Python-3-CLI (`scripts/austrian_law_cli.py`). Die historischen TypeScript-Plugin-Verträge (`ris_search`, `ris_fetch_segment`, `ris_fetch_whole_law`, `ris_sync_laws`, `jusline_*`) sind mit der Python-Migration entfallen; zur Migration alter Workspaces siehe [migration-guide](migration-guide.md).

## Gemeinsamer Rahmen

- Alle Befehle liefern mit `--json` einen **Structured CLI Envelope**: `{ success, state, message, data, error }`.
  - Quelle: `output_envelope()` in `scripts/austrian_law_cli.py`.
- Ohne `--json` wird eine menschenlesbare Ausgabe geschrieben (`formatted_output` bzw. `guide_markdown`), Fehler gehen mit Status in `stderr`.
- **Primärquelle:** RIS (Normtext, Struktur, Fassungsstand, Metadaten)
- **Sekundärquelle:** amtliche RIS-Judikatur (OGH/VfGH/VwGH; nur bei fachlich explizitem Bedarf)
- Fehler sind fail-closed: fehlende Belege, ungültige Stichtage oder ungeeignete Kandidaten werden gemeldet, nicht erraten.

## Befehl: `fetch_norm` (Primärquelle)

**Zweck:** Einzelnorm abrufen, gegen den amtlichen RIS-XML-Stream verifizieren, Verification Receipt (v2) erzeugen und die 5-Schichten-Ausgabe formatieren.

**Input:**
- `--law` (Pflicht): Gesetzeskürzel/Slug, Gesetzes- oder Dokumentnummer (z. B. `mrg`, `abgb`, `NOR40273695`)
- `--paragraph` (Pflicht): Paragraf (z. B. `§ 29`, `1293`)
- `--stichtag`: ISO-Datum (YYYY-MM-DD) zur Gültigkeitsprüfung, Default: Tagesdatum in `Europe/Vienna`
- `--include-decisions`: amtliche OGH-Rechtsprechung beifügen
- `--decisions-limit`: max. Judikaturtreffer (Default 3)
- `--force-refresh`: Cache ignorieren und neu laden
- `--cache-dir`: benutzerdefinierter Cache-Ordner

**Output (`data`):**
- `norm`: geparste Norm mit Text und amtlichen Metadaten
- `receipt`: maschinenlesbarer `VerificationReceipt` v2 (`source_id`, `gesetzesnummer`, `dokumentnummer`, `eli`, `paragraf`, `consolidated_as_of`, `retrieved_at`, `effective_from`, `effective_to`, `kundmachungsorgan`, `raw_content_sha256`, `normalized_content_sha256`, `cached`, `retrieval_method`, `verification_status`, `raw_source_path`)
- `formatted_output`: 5-Schichten-Markdown
- `decisions`: amtliche Judikatur (immer im Payload; leere Liste ohne `--include-decisions`)

**Fehlerverhalten:** Cache-Treffer wie neue Kandidaten auf Identität, Inhalt und Geltung geprüft; ungeeignete Treffer lösen OGD-Neuauflösung aus. `verification_status: stichtag_mismatch` bei abgelaufener/zukünftiger Geltung.

## Befehl: `fetch_whole_law` (Primärquelle)

**Zweck:** Amtliche Gesamtfassung eines Gesetzes herunterladen und im lokalen Cache vorhalten.

**Input:** `--law` (Pflicht), `--stichtag`, `--force-refresh`, `--cache-dir`, `--json`.

**Output:** Gesamtfassung im Cache (`data/cache/`), Envelope mit `success`/`state`/`message`.

## Befehl: `search_law` (Primärquelle, Discovery)

**Zweck:** Normsuche über die offizielle OGD-RIS-API.

**Input:**
- `--query` (Pflicht): Suchbegriff oder Normtitel
- `--scope`: `bund` (Default) oder `land`
- `--limit`: max. Treffer (Default 5)

**Output:** Trefferliste mit amtlichen Referenzen (`doknr`, Titel, URLs). Suchergebnisse sind Discovery-Hilfe; als Beleg gilt erst der verifizierte `fetch_norm`-Abruf.

## Befehl: `search_decisions` (Sekundärquelle)

**Zweck:** Amtliche Rechtsprechung über die RIS-Justiz-OGD-Schnittstelle.

**Input:** `--query`, `--norm`, `--paragraph`, `--court` (Default `OGH`), `--limit` (Default 3), `--json`.

**Output:** strukturierte Entscheidungslisten mit Geschäftszahlen, Rechtssatznummern, ECLI und Leitsatztexten.

## Befehl: `list_canonical` (Katalog)

**Zweck:** Die über 50 vorindizierten Kern-Bundesgesetze aus [`references/canonical-laws.json`](../references/canonical-laws.json) auflisten. Fehlt die Datei, folgt ein expliziter Fehler (`canonical-laws.json missing`).

## Befehl: `migration_guide` (Migrationsanleitung)

**Zweck:** Kurze Anleitung zur Migration historischer TypeScript-Workspace-Aufrufe auf die Python-CLI. Detaildokumentation: [migration-guide](migration-guide.md).

## Cache & Rohquellen (Querschnitt)

- Atomarer Disk-Cache: `AtomicDiskCache` in `scripts/lib/storage.py` (`tempfile` + `os.replace`).
- Rohquellen-Archivierung: unveränderter Upstream-Antwortkörper wird sha-adressiert unter `data/ris/raw/<sha256>.xml` archiviert (`archive_raw_source()`), Dedupe nach Prüfsumme; gleiche Inhalte überschreiben sich nicht, verschiedene Inhalte niemals kollidieren.
- Cache-Layout und Wurzeln: [runtime-layout](runtime-layout.md). Frontmatter-Schema: [frontmatter-schema](frontmatter-schema.md). Stable IDs: [stable-id-strategy](stable-id-strategy.md).
