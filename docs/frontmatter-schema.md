# Frontmatter Schema (Markdown Cache)

Diese Spezifikation gilt für gecachte Markdown-Dateien unter `memory/references/austrian-law/`.

## Pflichtfelder

- `stable_id` (string) — stabile ID gemäß `docs/stable-id-strategy.md`
- `source` (enum: `ris` | `jusline`)
- `source_url` (string, URL)
- `doc_type` (enum: `norm_segment` | `norm_document` | `discussion` | `commentary` | `decision`)
- `title` (string)
- `fetched_at` (string, ISO-8601)
- `version_label` (string, z. B. `konsolidiert`)
- `fassung_typ` (enum: `Arbeitsfassung` | `verbindliche Fassung`)

## Optionale Felder

- `source_id` (string) — quellspezifischer Original-Identifier
- `effective_date` (string, ISO-8601 date)
- `published_date` (string, ISO-8601 date)
- `language` (string, z. B. `de`)
- `jurisdiction` (string, z. B. `AT`)
- `segment_ref` (string, z. B. `§ 5 Abs. 2`)
- `norm_ref` (string)
- `decision_ref` (string)
- `supersedes` (string, stable_id einer älteren Fassung)
- `checksum` (string, Hash über normalisierten Inhalt)
- `notes` (string)

## Beispiel: RIS Normsegment

```yaml
stable_id: ris:normseg:bundesrecht.BGBlI_2000_100:par-5-abs-2:v2026-01-01
source: ris
source_url: https://www.ris.bka.gv.at/...
doc_type: norm_segment
title: Beispielgesetz § 5 Abs. 2
fetched_at: 2026-03-21T12:00:00+01:00
version_label: konsolidiert
fassung_typ: Arbeitsfassung
source_id: bundesrecht.BGBlI_2000_100
segment_ref: "§ 5 Abs. 2"
language: de
jurisdiction: AT
```

## Beispiel: RIS Gesamtdokument

```yaml
stable_id: ris:doc:bundesrecht.BGBlI_2000_100:v2026-01-01
source: ris
source_url: https://www.ris.bka.gv.at/...
doc_type: norm_document
title: Beispielgesetz (Gesamtdokument)
fetched_at: 2026-03-21T12:01:00+01:00
version_label: konsolidiert
fassung_typ: Arbeitsfassung
source_id: bundesrecht.BGBlI_2000_100
language: de
jurisdiction: AT
```

## Beispiel: JUSLINE Diskussion/Kommentar

```yaml
stable_id: jusline:mat:beispiel-kommentar-123
source: jusline
source_url: https://www.jusline.at/...
doc_type: commentary
title: Diskussion zu Beispielgesetz
fetched_at: 2026-03-21T12:02:00+01:00
version_label: nicht-amtlich
fassung_typ: Arbeitsfassung
source_id: kommentar-123
language: de
jurisdiction: AT
notes: Nur ergänzende Sekundärquelle; RIS bleibt maßgeblich.
```
