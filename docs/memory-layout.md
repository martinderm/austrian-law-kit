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
      │  ├─ documents/
      │  │  └─ <stable-id>.md
      │  ├─ decisions/
      │  │  └─ <stable-id>.md
      │  └─ metadata/
      │     └─ <stable-id>.json
      └─ jusline/
         ├─ materials/
         │  └─ <stable-id>.md
         ├─ decisions/
         │  └─ <stable-id>.md
         └─ metadata/
            └─ <stable-id>.json
```

## Dateitypen nach Quelle

### `ris/`
- `norms/`: RIS-Normsegmente (z. B. Paragraph/Artikel)
- `documents/`: RIS-Gesamtdokumente (volle Fassung)
- `decisions/`: RIS-Entscheidungen (wenn im Scope)
- `metadata/`: technische JSON-Metadaten pro Stable ID

### `jusline/`
- `materials/`: Diskussionen, Kommentare, Zusatzmaterial
- `decisions/`: JUSLINE-Entscheidungen nur bei ausdrücklicher Nachfrage
- `metadata/`: technische JSON-Metadaten pro Stable ID

## Beziehung zwischen `.md` und `.json`

- Für jede inhaltliche Datei `<stable-id>.md` ist eine korrespondierende Metadatei `<stable-id>.json` vorgesehen.
- `.md` enthält:
  - YAML-Frontmatter gemäß `docs/frontmatter-schema.md`
  - normalisierten, lesbaren Inhalt
- `.json` enthält:
  - technische Zusatzdaten (z. B. Normalisierungsdetails, Rohquellen-Referenzen, Checksums, Parsing-Hinweise)

## Index-Dateien und Verweise auf Stable IDs

- `index/by-stable-id.json`
  - Mapping: `stable_id` → relativer Pfad zur `.md`
  - Beispiel: `ris:doc:bundesrecht.bgbli_2000_100:v2026-01-01` → `ris/documents/ris:doc:bundesrecht.bgbli_2000_100:v2026-01-01.md`

- `index/by-source-id.json`
  - Mapping: `source_id` → `stable_id`
  - dient Reconciliation bei erneutem Abruf derselben Quelle

## Optionale Artefakte

- `decisions/` unter `ris/` und `jusline/` sind optional, solange Entscheidungen noch nicht im Scope sind.
- zusätzliche JSON-Felder in `metadata/` sind optional, solange Pflichtfelder aus dem Frontmatter-Vertrag abgedeckt bleiben.
- templates unter `templates/memory/` sind optional und nur Initialisierungshilfe, nicht Runtime-Quelle.

Stable-ID-Regeln: `docs/stable-id-strategy.md`
Frontmatter-Vertrag: `docs/frontmatter-schema.md`
