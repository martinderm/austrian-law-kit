# Architektur

## Zielbild

`openclaw-austrian-law-kit` ist ein portables Scaffold, das in neue OpenClaw-Instanzen übertragen werden kann. Das Repository trennt bewusst:
- **Policy/Orchestrierung** (Skill)
- **technische Datenverarbeitung** (späteres Plugin)
- **Memory-/Cache-Zielmodell** (dokumentiert + optional als Template)
- **Qualitätssicherung** (Tests/Fixtures)
- **Betriebsübernahme** (Install/Migration)

## Schichtenmodell

1. **Skill-Schicht (`SKILL.md` im Repo-Root)**
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

## Implementierungsstand
 
- Plugin-Implementierung, Parserlogik und Netzwerk-/Abrufautomatisierung sind nun vollständig als MVP implementiert.
