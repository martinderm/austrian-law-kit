# openclaw-austrian-law-kit

Portables Scaffold-Repository für einen österreichischen Rechts-Agenten in OpenClaw.

## Zweck

Dieses Repository liefert eine übertragbare Grundstruktur für:
- Workspace-Skill (MVP)
- spätere native Plugin-Entwicklung
- dokumentiertes Memory-/Cache-Zielmodell
- Tests, Fixtures und Beispiel-Config
- Installation und Migration in neue Instanzen

## Leitprinzipien

1. **Repository-first, portabel**: Keine harte Kopplung an eine konkrete lokale Instanz.
2. **Quellenhierarchie**: RIS ist Primärquelle, JUSLINE Sekundärquelle.
3. **Transparenz**: Antworten trennen Wortlaut, Quelle, Unsicherheit und Einordnung.
4. **Inkrementelle Umsetzung**: Erst Skill + Doku, dann Plugin + Parser + Caching.

## Lizenz und Quellenhinweis

Dieses Repository steht unter der **MIT-Lizenz** (siehe `LICENSE`).

Wichtig zur Quellnutzung:
- Die Lizenz dieses Repositories gilt nur für den Code und die mitgelieferte Projektdokumentation.
- Inhalte und Nutzungsbedingungen externer Quellen, insbesondere **JUSLINE**, werden dadurch nicht mitlizenziert.
- JUSLINE ist im Projekt bewusst nur als **optionale Sekundärquelle** vorgesehen.
- Wer JUSLINE-Funktionen nutzt, muss die Nutzungsbedingungen und urheberrechtlichen Rahmenbedingungen der Quelle selbst prüfen und einhalten.

## Scope (aktueller Stand)

Enthalten sind:
- Dokumentations- und Vertragsbasis
- Skill-Gerüst unter `skills/austrian-law/`
- produktive RIS-MVP-Tools:
  - `ris_search`
  - `ris_fetch_segment`
  - `ris_fetch_whole_law`
- produktive JUSLINE-MVP-Funktionen:
  - `jusline_fetch_discussions` (Sekundärquelle)
  - `jusline_list_decisions` (Sekundärquelle)
- lokale Cache-I/O plus write-through und gezielte cache-read Wiederverwendung für RIS-Artefakte
- JUSLINE-Query-Index für Cache-Reuse über `query + kind + limit` (TTL 24h, `refresh=true` als Force-Reload)
- optionale JUSLINE-Detail-Previews für Kommentare und Entscheidungen mit angereicherten Metadaten/Artefakten, wenn die Quelle sie hergibt
- agentbezogene Cache-Ableitung über den Workspace des aufrufenden Agenten (mit optionalem `cacheRoot`-Override)
- Tests, Fixtures und Beispiel-Config
- kleine ausführbare Parser-Smoke-Tests für die MVP-Parser
- kleine ausführbare Tool-Smoke-Tests für die MVP-Tool-Layer
- zusätzliche RIS-Live-Fixtures für reale Normdokument- und Suchstrukturen
- reichere RIS-Segment-Artefakte mit Gesetzes-/Normmetadaten im Frontmatter und JSON
- optionales `refresh`-Flag für Fetch-Tools, um Cache-Wiederverwendung gezielt zu überspringen
- optionale Templates für spätere Memory-Initialisierung

Bewusst noch eingeschränkt:
- JUSLINE bleibt trotz MVP-Funktionen klar Sekundärquelle
- Parser sind im MVP weiter regex-basiert (noch kein DOM-/Selektor-Parser)
- keine inhaltliche juristische Interpretation/Normalisierung

## Strukturüberblick

- `docs/` Architektur, Quellenpolitik, Memory-Layout, Status/Übergaben
- `skills/austrian-law/` fachliches Skill-Gerüst
- `example-config/` übertragbare Konfigurationsbeispiele
- `plugin/` native Plugin-Implementierung (MVP + Stubs)
- `tests/`, `fixtures/` testbare Entwicklung inkl. realitätsnaher Snapshot-Extrakte
- `templates/memory/` optionale Vorlagen für Instanzen

## Lokaler Smoke-Test-Workflow

Im Verzeichnis `plugin/openclaw-austrian-law/`:

- Parser-Smoke-Tests: `npm run test:parser-smoke`
- Tool-Smoke-Tests: `npm run test:tool-smoke`
- beide Smoke-Test-Sets zusammen: `npm run test:smoke`

## Standalone CLI-Nutzung (Harness-Agnostisch)

Das Toolkit ist so konzipiert, dass es **vollständig unabhängig** von einer laufenden OpenClaw-Gateway-Instanz als eigenständiges CLI-Tool ausgeführt werden kann. Die Tools werden über das integrierte TypeScript-CLI-Interface unter `plugin/openclaw-austrian-law/bin/cli.ts` ausgeführt.

### CLI-Ausführung

Navigiere in den Plugin-Ordner `plugin/openclaw-austrian-law/` und führe Befehle über `npx tsx bin/cli.ts` aus:

```powershell
# 1. Suche nach Normen (z. B. ABGB § 1293)
npx tsx bin/cli.ts --workspace "C:/absolute/path/to/workspace" ris_search '{"query": "ABGB § 1293", "limit": 1}'

# 2. Segment abrufen (z. B. NOR12019035)
npx tsx bin/cli.ts --workspace "C:/absolute/path/to/workspace" ris_fetch_segment '{"sourceId": "NOR12019035"}'
```

### CLI-Optionen

- `--workspace <dir>`: Leitet den Dokumenten-Cache (`memory/references/austrian-law/`) und den Metadaten-Cache (`data/austrian-law/`) relativ zu diesem Agenten-Workspace ab (Empfohlen!).
- `--cache-root <dir>`: Setzt einen direkten absoluten Pfad für den Dokumenten-Cache fest (der Metadaten-Cache wird dabei automatisch im selben Elternverzeichnis unter `data/` abgeleitet).
- `--ris-base-url <url>`: Optionale Überschreibung der RIS Web-URL.
- `--ris-api-base-url <url>`: Optionale Überschreibung der OGD-RIS-API-URL.
- `--jusline-base-url <url>`: Optionale Überschreibung der JUSLINE Web-URL.

### Konfiguration über settings.json

Das Toolkit sucht beim Start (oder bei der Übergabe des `--workspace`-Parameters) automatisch nach einer `settings.json` direkt im Workspace-Root (`settings.json`). Um Konflikte mit anderen Workspace-Einstellungen zu vermeiden, sind alle Parameter unter dem Namensraum `"austrian-law-kit"` geschachtelt.

Beispiel für `settings.json`:
```json
{
  "austrian-law-kit": {
    "cacheRoot": "memory/references/austrian-law",
    "dataRoot": "data/austrian-law",
    "risBaseUrl": "https://www.ris.bka.gv.at",
    "risApiBaseUrl": "https://data.bka.gv.at/ris/api/v2.6/",
    "juslineBaseUrl": "https://www.jusline.at"
  }
}
```

Wenn relative Pfade in `settings.json` angegeben werden, werden diese relativ zum Workspace-Root (Verzeichnis der Einstellungsdatei) aufgelöst. CLI-Parameter oder Umgebungsvariablen haben stets Vorrang vor den Werten aus `settings.json`.



## Plugin lokal einbinden

Aus dem Plugin-Ordner `plugin/openclaw-austrian-law/` gibt es zwei einfache Wege:

- normale Installation (OpenClaw legt eine Kopie unter `extensions/<plugin-id>` an):
  `openclaw plugins install <pfad-zum-pluginordner>`
- Entwicklung per Link (empfohlen während laufender Arbeit):
  `openclaw plugins install --link <pfad-zum-pluginordner>`

Aktuelle interne Plugin-ID: `austrian-law-kit`

**Wichtig für lokale Entwicklung:** Ein bloßer Gateway-Reload reicht bei Plugin-Code-Änderungen nicht. OpenClaw lädt den tatsächlich installierten Plugin-Ordner unter `extensions/<plugin-id>`. Nach Änderungen im Repo daher zuerst den installierten Plugin-Stand per `openclaw plugins update austrian-law-kit` oder `openclaw plugins install --force <pfad-zum-pluginordner>` aktualisieren, erst danach den Gateway reloaden/restarten und den Installationsordner bzw. `openclaw plugins inspect austrian-law-kit` verifizieren.

## Skill mit ausrollen

Das Plugin allein reicht für einen guten Agentenlauf nicht aus. Zusätzlich sollte auch das Workspace-Skill
`skills/austrian-law/` in den Ziel-Agent-Workspace übernommen werden, damit Quellenhierarchie, Antwortstruktur,
Rechtsberatungsgrenze, JUSLINE-Trennung und die saubere RIS-Fetch-Disziplin auch promptseitig wirksam sind.

Kurz gesagt:
- **Plugin** = Tools, Cache, technische Laufzeit
- **Skill** = fachliche Orchestrierung, Antwortdisziplin, Quellenpolitik

## 🚦 Projektstatus (Übergabe)

### Bereits abgeschlossene Phasen
- Fachlicher Vertrag: Quellenpolitik + Response Contract + Rechtsberatungsgrenze
- Workspace-Skill `skills/austrian-law/` auf aktuellen MVP-Stand nachgezogen
- Datenvertrag: Stable ID, Frontmatter, Memory-Layout
- OpenClaw-formnahes Plugin-MVP (Manifest + `openclaw.extensions` + Entry)
- Produktive RIS-MVP-Tools (`ris_search`, `ris_fetch_segment`, `ris_fetch_whole_law`)
- Produktive JUSLINE-MVP-Funktionen (`jusline_fetch_discussions`, `jusline_list_decisions`) als Sekundärquelle
- optionale JUSLINE-Detail-Previews für Kommentare und Entscheidungsdetailseiten mit angereicherten Metadaten
- Lokale Cache-I/O inkl. write-through + gezielte cache-read Wiederverwendung
- JUSLINE-Query-Index mit 24h TTL und `refresh=true` als Force-Reload-Semantik
- Meta-Signaltrennung (`notices` vs `warnings`) und Parser-Härtungen für MVP
- kleine ausführbare Parser-/Tool-Smoke-Tests für den aktuellen MVP-Stand

### Nächster empfohlener Schritt
- kleine Parser-Smoke-Edge-Cases oder minimale Fixture-Klärungen nachziehen, ohne RIS-Primärlogik anzutasten.

### Bewusst noch nicht implementiert
- DOM-/Selektor-basierter HTML-Parser (aktuell MVP-regex-basiert)
- breitere automatisierte Testabdeckung über die Smoke-Tests hinaus
- inhaltliche juristische Interpretation/Normalisierung

### Wichtigste Doku zum Weitermachen
- `docs/current-status.md`
- `docs/next-session.md`
- `docs/tool-contracts.md`
- `docs/tool-registration-plan.md`
- `docs/cache-implementation-plan.md`
- `docs/stable-id-strategy.md`
- `docs/frontmatter-schema.md`

## Nächste Schritte

1. Fixture- und Testabdeckung für JUSLINE-Edge-Cases gezielt ausbauen
2. Parser mittelfristig von Regex auf DOM-/Selektor-Zugriff umstellen
3. Fixture- und Testabdeckung für Cache-/Meta-Signal-Edge-Cases weiter ausbauen
4. Dokumentationspflege (`current-status`, `next-session`, `changelog`) pro Schritt strikt nachziehen
