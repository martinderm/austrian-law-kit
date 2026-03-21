# Cache Implementation Plan (lokale Hilfslogik)

## Ziel

Dieser Schritt implementiert rein lokale, deterministische Hilfsfunktionen für den Cache-Layer:
- Stable-ID-Verarbeitung
- Cache-Pfad-Ableitung
- Serialisierung von Cache-Artefakten (Markdown + YAML-Frontmatter, JSON-Metadaten)

Ohne Netzwerk, ohne Parser, ohne Dateisystemzugriff.

## Übersetzung: Vertrag -> Dateiablage

Eingabe ist ein `CachedArtifact` mit:
- `stable_id`
- `frontmatter`
- `content`
- optional `metadata`

Daraus werden lokal abgeleitet:
1. relativer Markdown-Zielpfad gemäß `docs/memory-layout.md`
2. relativer JSON-Metadatenpfad
3. Markdown-Text mit YAML-Frontmatter
4. JSON-Text für Metadaten

## In diesem Schritt implementiert

- `src/cache/stable-id.ts`
  - Prefix-/Quellenprüfung
  - Normalisierung/Validierung bestehender `stable_id`-Werte
- `src/cache/cache-paths.ts`
  - Ableitung relativer Zielpfade aus `stable_id`, `source`, `doc_type`
- `src/cache/serialize-artifact.ts`
  - kontrollierte Frontmatter-Serialisierung
  - Markdown- und Metadata-String-Erzeugung
- optional `src/cache/parse-artifact.ts`
  - einfache Gegenfunktion für das eigene, kontrollierte Format

## Bewusst noch nicht implementiert

- Dateisystem-I/O (lesen/schreiben)
- Konkurrenz-/Locking-Strategien
- Migrationslogik für alte Cache-Versionen
- Netz-/Fetch-Pfade
- RIS-/JUSLINE-spezifische Extraktion/Normalisierung

## Designhinweis

Für die Scaffold-Phase wird eine einfache, kontrollierte YAML-Serialisierung verwendet.
Komplexe YAML-Features (verschachtelte Strukturen, Anchors, Typ-Tags) sind bewusst out-of-scope.
