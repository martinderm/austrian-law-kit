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

## 🚦 Projektstatus (Übergabe)

### Bereits abgeschlossene Phasen
- Fachlicher Vertrag: Quellenpolitik + Response Contract + Rechtsberatungsgrenze
- Datenvertrag: Stable ID, Frontmatter, Memory-Layout
- OpenClaw-formnahes Plugin-Skelett (Manifest + `openclaw.extensions` + Entry)
- Zentrale Tool-Registry mit stub-basierter Tool-Registrierung
- Lokale Cache-Helfer (Stable-ID, Pfadableitung, Serialisierung), **ohne I/O/Netzwerk**

### Nächster empfohlener Schritt
- Lokale Cache-I/O-Schicht einführen und `law_cache_get` / `law_cache_put` von reinem Stub auf lokale Dateiverarbeitung umstellen (weiterhin ohne Netzlogik).

### Bewusst noch nicht implementiert
- RIS-/JUSLINE-Fetching
- HTML/XML-Parser
- inhaltliche Extraktion/Normalisierung
- produktive Cache-Engine mit I/O-Layer

### Wichtigste Doku zum Weitermachen
- `docs/current-status.md`
- `docs/next-session.md`
- `docs/tool-contracts.md`
- `docs/tool-registration-plan.md`
- `docs/cache-implementation-plan.md`
- `docs/stable-id-strategy.md`
- `docs/frontmatter-schema.md`

## Nächste Schritte

1. Antwortvertrag und Zitationsschema schärfen
2. Fixture-Sets für RIS/JUSLINE sammeln
3. Testfälle für Quellenpolitik und Antwortstruktur ergänzen
4. Plugin-Schnittstellen definieren (ohne Vollimplementierung)
