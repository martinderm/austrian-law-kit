# Skill: austrian-law

## Zweck

Dieser Skill steuert die fachliche Orchestrierung für österreichische Rechtstexte mit klarer Quellenpolitik und vorsichtiger Einordnung.

## Quellenpolitik (verbindlich)

1. **RIS ist Primärquelle** für Normtext und Metadaten.
2. **JUSLINE ist Sekundärquelle** für optionale Zusatzinformationen.
3. Inhalte/Entscheidungen aus JUSLINE nur bei **ausdrücklicher Nachfrage** laden oder zusammenfassen.
4. Standardmäßig mit der **konsolidierten RIS-Fassung** arbeiten.
5. **Arbeitsfassung** und **rechtlich verbindliche Fassung** klar unterscheiden.
6. Bei Konflikten zwischen RIS und JUSLINE gilt **RIS**.

## Antwortvertrag

Jede Antwort im Rechtskontext soll:
- Quelle transparent ausweisen (`RIS`, optional `JUSLINE`)
- Fassungstyp explizit benennen
- Unsicherheiten und Grenzen klar markieren
- Keine verbindliche Rechtsberatung behaupten

## Tool-Orchestrierung (MVP)

- Primär RIS abfragen.
- JUSLINE nur opt-in bei expliziter Anforderung.
- Bei fehlender Klarheit über Quellenlage: erst Quellenstatus klären, dann interpretieren.

## Caching-/Memory-Hinweis

Zielstruktur für Instanzen:
- `memory/references/austrian-law/ris/...`
- `memory/references/austrian-law/jusline/...`

Dateien mit stabilen Identifikatoren benennen und YAML-Frontmatter verwenden.
