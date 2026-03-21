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

## Welche Dateitypen wohin gehören

### `ris/`
- `norms/`: RIS-Normsegmente (z. B. Paragraphen/Artikel als einzelne Markdown-Dateien)
- `documents/`: RIS-Gesamtdokumente (vollständige konsolidierte Fassungen)
- `decisions/`: RIS-Entscheidungen (sofern im Scope)
- `metadata/`: JSON-Metadaten pro `stable_id`

### `jusline/`
- `materials/`: Diskussionen/Kommentare/Zusatzmaterialien
- `decisions/`: JUSLINE-Entscheidungen nur bei expliziter Nachfrage
- `metadata/`: JSON-Metadaten pro `stable_id`

## Zusammenhang Markdown und JSON-Metadaten

- Für jede `<stable-id>.md` soll es eine korrespondierende `<stable-id>.json` in `metadata/` geben.
- Markdown enthält den nutzbaren Inhalt + YAML-Frontmatter.
- JSON enthält technische Zusatzdaten (Normalisierungsdetails, Rohquellen-Referenzen, ggf. Hashes), die nicht in den Fließtext gehören.

## Index-Dateien und Stable-ID-Verweise

- `index/by-stable-id.json`
  - mappt `stable_id` → relativer Markdown-Pfad
  - Beispiel: `ris:doc:bundesrecht.xyz:v2026-01-01` → `ris/documents/ris:doc:bundesrecht.xyz:v2026-01-01.md`

- `index/by-source-id.json`
  - mappt quellspezifische IDs (`source_id`) → `stable_id`
  - dient der Wiederauffindung bei erneutem Abruf derselben Quelle

Stable-ID-Regeln: siehe `docs/stable-id-strategy.md`.
Frontmatter-Regeln: siehe `docs/frontmatter-schema.md`.
