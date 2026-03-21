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
- Dokumentationsgerüst
- Skill-Gerüst unter `skills/austrian-law/`
- Beispiel-Config-Gerüst
- Platzhalter für Plugin, Tests und Fixtures
- optionale Templates für spätere Memory-Initialisierung

Nicht enthalten (absichtlich):
- produktiver Plugin-Code
- Parser-/Normalizer-Implementierung
- produktive Netz-/Fetch-Logik

## Strukturüberblick

- `docs/` Architektur, Quellenpolitik, Memory-Layout, Install/Migration
- `skills/austrian-law/` fachliches Skill-Gerüst
- `example-config/` übertragbare Konfigurationsbeispiele
- `plugin/` Platzhalterstruktur für spätere native Tools
- `tests/`, `fixtures/` Platzhalter für testbare Entwicklung
- `templates/memory/` optionale Vorlagen für Instanzen

## Nächste Schritte

1. Antwortvertrag und Zitationsschema schärfen
2. Fixture-Sets für RIS/JUSLINE sammeln
3. Testfälle für Quellenpolitik und Antwortstruktur ergänzen
4. Plugin-Schnittstellen definieren (ohne Vollimplementierung)
