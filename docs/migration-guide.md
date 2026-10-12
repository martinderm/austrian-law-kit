# Migrationsanleitung: Umstellung auf Python 3 (austrian-law-kit)

Diese Anleitung beschreibt die Migration von der historischen TypeScript/Node.js-Implementierung (`plugin/openclaw-austrian-law`) auf die schlanke, robuste **Python 3 Standardbibliothek (Zero Dependencies)**-Architektur.

---

## 1. Status der vorhandenen Daten in den Workspaces

Alle zuvor abgerufenen Daten in den Workspaces (z. B. `immo-punk`, `openclaw-master`) bleiben uneingeschränkt nutzbar:

- **Normtexte (`memory/references/austrian-law/ris/norms/*.md`):**
  Liegen als Standard-Markdown mit YAML-Frontmatter vor. Sie sind für alle KI-Agenten und LLMs unmittelbar und ohne Transformation lesbar.
- **Gesetzestexte (`memory/references/austrian-law/ris/documents/*.md`):**
  Unverändert als Gesamtfassungen im Markdown-Format erhalten.
- **Kryptografische Prüfnachweise (`data/austrian-law/ris/metadata/*.json`):**
  Die Hashes (`raw_content_sha256`) sind bitgenau identisch berechnet (z. B. MRG § 29: `0f9247d...`). Das Schema des *Verification Receipt v2* ist 1:1 kompatibel.
- **Historische JUSLINE-Daten (`memory/references/austrian-law/jusline/`):**
  Verbleiben als statisches Lesearchiv. Neue Judikaturabfragen werden nicht mehr über privates HTML-Scraping ausgeführt, sondern amtlich aus der offiziellen RIS-Justiz-Schnittstelle des Bundeskanzleramts (BKA) bezogen.

---

## 2. Befehls-Mapping: Alt (TypeScript) vs. Neu (Python)

Der historische Aufruf über `npx tsx .agents/skills/austrian-law-kit/plugin/openclaw-austrian-law/bin/cli.ts` entfällt ersatzlos. Es werden weder `node`, `npm` noch externe Python-Pakete (`pip`) benötigt.

Verwende stattdessen die zentrale CLI:
```bash
python .agents/skills/austrian-law-kit/scripts/austrian_law_cli.py <subcommand> [flags]
```

### Konkretes Mapping der Werkzeuge:

| Vorherige TypeScript-Aktion | Neuer Python 3 CLI-Befehl |
| :--- | :--- |
| **Einzelnorm abrufen**<br>`tool: "ris_fetch_segment"`<br>`arguments: { "sourceId": "NOR..." }` | `python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --json`<br>*(oder mit direkter NOR-ID: `--law NOR40273695`)* |
| **Einzelnorm mit OGH-Judikatur**<br>*(Kombination aus RIS + JUSLINE)* | `python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --include-decisions --json` |
| **Gesamtes Gesetz laden**<br>`tool: "ris_fetch_whole_law"`<br>`arguments: { "query": "MRG" }` | `python scripts/austrian_law_cli.py fetch_whole_law --law mrg --json` |
| **Normsuche im RIS**<br>`tool: "ris_search"`<br>`arguments: { "query": "Mietzinsminderung" }` | `python scripts/austrian_law_cli.py search_law --query "Mietzinsminderung" --limit 5 --json` |
| **OGH-Rechtsprechung suchen**<br>`tool: "jusline_list_decisions"` *(Scraping)* | `python scripts/austrian_law_cli.py search_decisions --norm MRG --paragraph "§ 29" --court OGH --limit 3 --json` *(Amtlich via RIS)* |
| **Kanonischen Katalog listen**<br>`canonical-laws.ts` | `python scripts/austrian_law_cli.py list_canonical --json` |

---

## 3. Umstellung von JSON-Request-Pipelines

Falls ein Workspace (wie `immo-punk`) einen Dateiaustausch via `data/austrian-law/requests/request.json` dokumentiert hat:

1. **Direktaufruf bevorzugen:**
   Statt JSON-Dateien manuell zu serialisieren, sollte der Agent den Python-Befehl mit `--json` direkt ausführen. Das Ergebnis wird im standardisierten CLI Envelope zurückgegeben:
   ```json
   {
     "action": "fetch_norm",
     "success": true,
     "state": "verified_current",
     "message": "...",
     "data": {
       "receipt": { ... },
       "norm": { ... },
       "formatted_output": "# ... 5-Schichten-Markdown ..."
     },
     "error": null
   }
   ```

2. **Skript-Migration in Workspaces:**
   In Anleitungen (wie `ANLEITUNG-AUFRUFMODUS.md`) die Zeile:
   ```powershell
   # ALT:
   npx tsx .agents/skills/austrian-law-kit/plugin/openclaw-austrian-law/bin/cli.ts --file request.json --output result.json
   ```
   durch den direkten Python-Aufruf ersetzen:
   ```powershell
   # NEU:
   python .agents/skills/austrian-law-kit/scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --include-decisions --json
   ```

3. **Batch-Abfragen:**
   Mehrere Normen können in PowerShell oder Bash sequenziell als separate Aufrufe ausgeführt werden. Jeder Aufruf ist dank lokaler XML-Zwischenspeicherung und nativer Standardbibliothek in < 0,1 Sekunden abgeschlossen.

---

## 4. Vorteile nach der Migration

- **Keine Node/npm-Abhängigkeiten:** Keine `node_modules`, keine `package.json`, keine Build-Schritte.
- **Offizielle Rechtsquellen:** Kein fehleranfälliges Web-Scraping von Drittanbietern mehr; alle Judikaturdaten stammen direkt aus der RIS-Justiz-OGD-Schnittstelle der Republik Österreich.
- **Determinismus:** Deterministisches XML-Parsing via `xml.etree.ElementTree` anstelle von unzuverlässigen HTML-Regex-Ausdrücken.
- **Plattformunabhängig:** Läuft ohne Setup auf Windows, Linux und macOS.
