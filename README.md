# austrian-law-kit

Portables, harness-agnostisches Toolkit für österreichische Rechts-Agenten.
Implementiert in **100 % Python 3 Standardbibliothek (zero pip dependencies)** nach dem Vorbild von `german-law-kit`.

## Zweck

Dieses Repository liefert eine übertragbare, agenten-agnostische Grundstruktur für:
- **Harness-Agnostische CLI-Nutzung**: Direkte Ausführung aller RIS-Recherchetätigkeiten über eine Standalone-CLI ohne Abhängigkeit von Node.js oder externen Gateways.
- **Offizielle Primärrechtsprüfung (RIS OGD XML)**: Deterministisches Parsing amtlicher Bundes- und Landesnormen direkt aus den XML-Endpunkten des Bundeskanzleramts (BKA).
- **Amtliche Höchstgerichts-Judikatur (RIS-Justiz)**: Direkte Anbindung der RIS-OGD-Judikatur-Schnittstelle für OGH-, VfGH- und VwGH-Entscheidungen und Leitsätze.
- **Kanonischer Gesetzeskatalog**: Vorindizierte $O(1)$-Auflösung für über 50 österreichische Kern-Bundesgesetze (ABGB, MRG, WEG, EStG, UGB, StGB, etc.).
- **Kryptografischer Verification Receipt (v2)**: Duale SHA-256 Hashes (Roh- vs. bereinigter Text), Stichtagsprüfung in `Europe/Vienna` und lückenlose Rohquellen-Archivierung.
- **100 % Offline-Testbarkeit**: Deterministische Test-Suite mit lokalen statischen Fixtures.

## Leitprinzipien

1. **Python-first & Zero Dependencies**: Läuft out-of-the-box mit Python 3.10+ auf jedem Betriebssystem (Windows, Linux, macOS). Keine `pip`-Pakete, kein Node/npm.
2. **Quellenhierarchie**: RIS ist alleinige Primärquelle für Normtexte; RIS-Justiz liefert amtliche Judikatur. Kein fragiles Scraping privater Plattformen.
3. **Transparenz & 5 Schichten**: Jede Antwort trennt sauber A) Normwortlaut, B) Receipt, C) Zusammenfassung, D) Judikatur und E) Rechtsunsicherheit.
4. **Stichtags-Disziplin**: Klare zeitliche Prüfung verhindert das stillschweigende Ausgeben historischer oder noch nicht in Kraft getretener Fassungen.

## Schnellstart & CLI-Nutzung

### 1. Einzelnorm abrufen und verifizieren
```bash
python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --json
```

Mit amtlichen OGH-Entscheidungen:
```bash
python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --include-decisions --json
```

Mit historischem Prüfstichtag:
```bash
python scripts/austrian_law_cli.py fetch_norm --law abgb --paragraph "§ 1293" --stichtag 2020-01-01 --json
```

### 2. Gesamtes Gesetz im Cache vorhalten
```bash
python scripts/austrian_law_cli.py fetch_whole_law --law weg --json
```

### 3. Normsuche über die offizielle OGD-API
```bash
python scripts/austrian_law_cli.py search_law --query "Mietrechtsgesetz" --limit 5 --json
```

### 4. Amtliche Rechtsprechung suchen
```bash
python scripts/austrian_law_cli.py search_decisions --norm MRG --paragraph "§ 29" --court OGH --limit 3 --json
```

### 5. Kanonischen Katalog auflisten
```bash
python scripts/austrian_law_cli.py list_canonical --json
```

### 6. Migrationsanleitung für bestehende Workspaces
```bash
python scripts/austrian_law_cli.py migration_guide
```
*Ausführlicher Leitfaden:* Siehe [docs/migration-guide.md](docs/migration-guide.md).

## Lokale Test-Ausführung

### Speicherpfade und PowerShell

Cache und Rohquellen liegen standardmäßig im **aufrufenden Arbeitsverzeichnis**:
`data/cache/` und `data/ris/raw/<sha256>.xml`. Der Skill-Installationsort bleibt unverändert.
`--cache-dir <ordner>` überschreibt den Cache; Rohquellen liegen dann unter
`<ordner>/../ris/raw/`. `raw_source_path` ist ein POSIX-Pfad relativ zum
Elternverzeichnis der Datenwurzel (standardmäßig dem aufrufenden Workspace),
auch bei Cache-Hits. Bestehende Installations-Caches werden nicht automatisch migriert.

In PowerShell bevorzugt die Nummer ohne `§` übergeben, etwa `--paragraph 7`.
Für Unicode-Aufrufe `python -X utf8 scripts/austrian_law_cli.py ...` verwenden;
ein bereits von der Shell beschädigtes Zeichen wird nicht erraten oder repariert.

Bei Gesetzesabfragen werden nur nichtleere, identitätsgleiche und am Stichtag
gültige XML-Segmente übernommen. Direkte Dokumentkennungen behalten dagegen
ihren expliziten historischen Bezug und können `stichtag_mismatch` ausweisen.
`consolidated_as_of` stammt aus dem RIS-XML-Feld „Zuletzt aktualisiert am“
(`geaendert`), ersatzweise `fassung_vom`: kein Beleg für Geltung am Abruftag.

Alle Unittests sind 100 % offline ausführbar:
```bash
python -m unittest discover tests -v
```

## Verzeichnisstruktur

- `SKILL.md`: Fachliche Skill-Richtlinien und 5-Schichten-Antwortformat.
- `references/canonical-laws.json`: Kanonischer Katalog von 52 Kern-Bundesgesetzen.
- `scripts/austrian_law_cli.py`: Zentraler CLI-Router mit Structured JSON Envelope.
- `scripts/lib/`:
  - `ris_ogd_client.py`: XML-Parser (`xml.etree.ElementTree`) und OGD-Client (`urllib.request`).
  - `ris_judikatur.py`: Amtliche RIS-Justiz-API für OGH/VfGH/VwGH.
  - `storage.py`: Atomarer Disk-Cache (`tempfile` + `os.replace`) und Rohquellen-Archivierung.
  - `receipt.py`: Verification Receipt v2 Engine und 5-Schichten-Formatter.
- `tests/test_austrian_law_cli.py`: Offline-Unittests.
- `docs/known-issues.md`: Aktuelle Ungereimtheiten & Refactoring-Roadmap (Archiv: `docs/archive/resolved-issues.md`).
- `docs/migration-guide.md`: Anleitung zur schrittweisen Umstellung historischer TypeScript/Workspace-Workflows.
- `docs/system-map/`: ICM Form 6 System-Map.

## Lizenz

MIT-Lizenz (siehe `LICENSE`).
Amtliche Rechtstexte und Judikatur unterliegen als Rechtsnormen der Republik Österreich keinem Urheberrecht (§ 7 Abs. 1 UrhG).
