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

## Scope (aktueller Stand)

Enthalten sind:
- Dokumentations- und Vertragsbasis
- Skill-Gerüst unter `skills/austrian-law/`
- produktive RIS-MVP-Tools:
  - `ris_search`
  - `ris_fetch_segment`
  - `ris_fetch_whole_law`
- erste produktive JUSLINE-MVP-Funktion:
  - `jusline_fetch_discussions` (Sekundärquelle)
- lokale Cache-I/O plus write-through und gezielte cache-read Wiederverwendung für RIS-Artefakte
- Tests, Fixtures und Beispiel-Config
- optionale Templates für spätere Memory-Initialisierung

Bewusst noch eingeschränkt:
- `jusline_list_decisions` ist noch Stub
- Parser sind MVP-regex-basiert (noch kein DOM-/Selektor-Parser)
- keine inhaltliche juristische Interpretation/Normalisierung

## Strukturüberblick

- `docs/` Architektur, Quellenpolitik, Memory-Layout, Status/Übergaben
- `skills/austrian-law/` fachliches Skill-Gerüst
- `example-config/` übertragbare Konfigurationsbeispiele
- `plugin/` native Plugin-Implementierung (MVP + Stubs)
- `tests/`, `fixtures/` testbare Entwicklung inkl. realitätsnaher Snapshot-Extrakte
- `templates/memory/` optionale Vorlagen für Instanzen

## 🚦 Projektstatus (Übergabe)

### Bereits abgeschlossene Phasen
- Fachlicher Vertrag: Quellenpolitik + Response Contract + Rechtsberatungsgrenze
- Datenvertrag: Stable ID, Frontmatter, Memory-Layout
- OpenClaw-formnahes Plugin-Skelett (Manifest + `openclaw.extensions` + Entry)
- Produktive RIS-MVP-Tools (`ris_search`, `ris_fetch_segment`, `ris_fetch_whole_law`)
- Erste produktive JUSLINE-MVP-Funktion (`jusline_fetch_discussions`) als Sekundärquelle
- Lokale Cache-I/O inkl. write-through + gezielte cache-read Wiederverwendung
- Meta-Signaltrennung (`notices` vs `warnings`) und Parser-Härtungen für MVP

### Nächster empfohlener Schritt
- Optionales `jusline_list_decisions` als klar getrennte Sekundärquellen-Funktion evaluieren (ohne RIS-first aufzubrechen).

### Bewusst noch nicht implementiert
- Produktivlogik für `jusline_list_decisions`
- DOM-/Selektor-basierter HTML-Parser (aktuell MVP-regex-basiert)
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

1. `jusline_list_decisions` als optionale, klar getrennte Sekundärquellen-Funktion evaluieren
2. Parser mittelfristig von Regex auf DOM-/Selektor-Zugriff umstellen
3. Fixture- und Testabdeckung für Edge-Cases (Cache/Parser/Meta-Signale) ausbauen
4. Dokumentationspflege (`current-status`, `next-session`, `changelog`) pro Schritt strikt nachziehen
