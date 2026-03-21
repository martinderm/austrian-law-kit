# Architektur

## Zielbild

`openclaw-austrian-law-kit` ist ein portables Scaffold, das in neue OpenClaw-Instanzen übertragen werden kann. Das Repository trennt bewusst:
- **Policy/Orchestrierung** (Skill)
- **technische Datenverarbeitung** (späteres Plugin)
- **Memory-/Cache-Zielmodell** (dokumentiert + optional als Template)
- **Qualitätssicherung** (Tests/Fixtures)
- **Betriebsübernahme** (Install/Migration)

## Schichtenmodell

1. **Skill-Schicht (`skills/austrian-law/`)**
   - Definiert Quellenpolitik, Antwortstruktur und Verhaltensgrenzen.
   - Steuert, wann welche Quelle genutzt werden darf.

2. **Plugin-Schicht (`plugin/openclaw-austrian-law/`)** *(später)*
   - URL-Bildung, Fetching, Parsing, Normalisierung, Cache-I/O.
   - Strukturierte Tools statt ad-hoc Orchestrierung.

3. **Daten-/Memory-Schicht (`memory/references/austrian-law/`)**
   - Zielstruktur dokumentiert in `docs/memory-layout.md`.
   - Herkunft explizit getrennt nach `ris/` und `jusline/`.

## Designentscheidungen

- **RIS-first** ist fachlich und technisch ein harter Default.
- **JUSLINE opt-in**: nur bei ausdrücklicher Nachfrage für Zusatzkontext.
- **Stable IDs** für Dateinamen und Referenzen statt Freitext-Titel.
- **YAML-Frontmatter** in gecachten Markdown-Dateien für Nachvollziehbarkeit.

## Nicht-Ziele in diesem Schritt

- Keine produktive Plugin-Implementierung
- Keine Parserlogik
- Keine Netzwerk-/Abrufautomatisierung
