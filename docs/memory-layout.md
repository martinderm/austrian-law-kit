# Memory-/Cache-Layout (Zielstruktur)

Dieses Dokument beschreibt die **instanzweite Zielstruktur** unter:

`memory/references/austrian-law/`

Das Repository legt diese Struktur nicht als produktiven Runtime-State an, sondern dokumentiert sie und bietet optionale Templates.

## Zielstruktur

```text
memory/
└─ references/
   └─ austrian-law/
      ├─ index/
      │  ├─ by-stable-id.json
      │  └─ by-source-id.json
      ├─ ris/
      │  ├─ norms/
      │  │  └─ <stable-id>.md
      │  ├─ decisions/
      │  │  └─ <stable-id>.md
      │  └─ metadata/
      │     └─ <stable-id>.json
      └─ jusline/
         ├─ materials/
         │  └─ <stable-id>.md
         └─ metadata/
            └─ <stable-id>.json
```

## Dateinamen

- Dateinamen basieren auf **stabilen Identifikatoren**, nicht auf Überschriften.
- `<stable-id>` wird aus verlässlichen Quellkennzeichen abgeleitet.

## Frontmatter in Markdown-Caches

Jede Markdown-Datei soll YAML-Frontmatter enthalten, z. B.:

```yaml
source: ris
source_url: https://www.ris.bka.gv.at/...
stable_id: ris:...
doc_type: norm
fetched_at: 2026-03-21T11:00:00+01:00
version_label: konsolidierte-fassung
binding_status: arbeitsfassung
```

Danach folgt der extrahierte/normalisierte Inhalt.

## Hinweise

- `ris/` und `jusline/` sind bewusst getrennt für transparente Herkunft.
- Konfliktauflösung erfolgt fachlich immer RIS-first.
