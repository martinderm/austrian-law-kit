# Installation (Scaffold)

## Ziel

Dieses Dokument beschreibt die Übernahme des Scaffold-Repositories in eine OpenClaw-Arbeitsumgebung.

## Voraussetzungen

- Laufende OpenClaw-Instanz
- Zugriff auf den Ziel-Workspace der Instanz
- Git verfügbar

## Schritte

1. Repository in `projects/` klonen oder kopieren.
2. Skill-Ordner `skills/austrian-law/` in der Zielinstanz referenzieren oder übernehmen.
3. Beispielkonfiguration aus `example-config/` prüfen und an die Instanz anpassen.
4. Zielpfad für Memory-Referenzen gemäß `docs/memory-layout.md` vorbereiten.

## Wichtiger Hinweis

Dieses Scaffold enthält bewusst **keinen produktiven Plugin-Code**. Für produktive Nutzung sind zusätzliche Implementierungsschritte nötig.
