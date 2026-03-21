# Testfälle: Artifact Serialization (textuell)

## Ziel

Sicherstellen, dass Cache-Artefakte lokal serialisierbar sind (Markdown + YAML-Frontmatter + JSON-Metadata).

## Fall 1: Pflichtfelder im Frontmatter

**Erwartung:**
- serialisiertes YAML enthält die Pflichtfelder aus dem Frontmatter-Vertrag.

## Fall 2: Markdown-Struktur

**Erwartung:**
- Format:
  - `---`
  - YAML-Block
  - `---`
  - Leerzeile
  - Inhalt

## Fall 3: Metadata-JSON

**Erwartung:**
- JSON enthält mindestens `stable_id`, `source`, `doc_type`, `source_url`.

## Fall 4: Deterministische Pfad-/Inhaltserzeugung

**Erwartung:**
- gleicher Input => gleicher Markdown-/JSON-Output
- keine Netzwerk- oder Parserabhängigkeit

## Fall 5: Optionale Parse-Gegenfunktion

**Erwartung:**
- parse-Funktion verarbeitet das eigene Serialisierungsformat konsistent.
