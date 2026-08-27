# Frontmatter Schema (Markdown Cache)

Diese Spezifikation gilt für gecachte Markdown-Dateien unter `memory/references/austrian-law/`.

## Pflichtfelder

- `stable_id` (string) — stabile ID gemäß `docs/stable-id-strategy.md`
- `source` (enum: `ris` | `jusline`) — Herkunftsquelle
- `source_url` (string, URL) — kanonische Abruf-URL
- `doc_type` (enum: `norm_segment` | `norm_document` | `discussion` | `commentary` | `decision`) — Dokumenttyp
- `title` (string) — sachlicher Dokumenttitel (nur Anzeige, nie für ID-Bildung)
- `fetched_at` (string, ISO-8601 datetime) — Abrufzeitpunkt
- `version_label` (string) — **technische/inhaltliche Fassungsbezeichnung** (z. B. `konsolidiert`, `nicht-amtlich`, `stand-2026-03`)
- `fassung_typ` (enum: `Arbeitsfassung` | `verbindliche Fassung`) — **rechtlicher Status der Fassung**

## Optionale Felder

- `source_id` (string) — quellspezifischer Original-Identifier
- `effective_date` (string, ISO-8601 date) — Inkrafttreten/Beginn
- `published_date` (string, ISO-8601 date) — Veröffentlichungsdatum
- `language` (string) — Sprachcode, z. B. `de`
- `jurisdiction` (string) — Rechtsraum, z. B. `AT`
- `segment_ref` (string) — Segmentreferenz, z. B. `§ 5 Abs. 2`
- `norm_ref` (string) — referenzierte Normkennung
- `decision_ref` (string) — referenzierte Entscheidungskennung (ECLI oder GZ)
- `case_number` (string) — gerichtliche Geschäftszahl (z. B. `5Ob121/08t`, `Ra 2021/05/0123`, `G 12/2023`)
- `rechtssatznummer` (string) — OGH-Rechtssatznummer (z. B. `RS0012345`)
- `ecli` (string) — European Case Law Identifier (z. B. `ECLI:AT:OGH0002:2008:0050OB00121.08T.0909.000`)
- `court` (string) — erkennendes Gericht (z. B. `OGH`, `VwGH`, `VfGH`, `LG für ZRS Wien`)
- `fundstellen` (array of string) — Veröffentlichungen in Fachzeitschriften (z. B. `["SZ 2008/123", "EvBl 2009/45", "wobl 2009/12"]`)
- `norms` (array of string) — Liste der angewandten Normen
- `supersedes` (string) — stable_id einer ersetzten älteren Fassung
- `checksum` (string) — Hash des normalisierten Inhalts
- `notes` (string) — kurze Zusatzhinweise
- `representation` (enum: `segment` | `whole_law`) — Darstellungsform des Normabrufs, ohne den `doc_type` zu verändern

## Bedeutungsabgrenzung (kritisch)

- `version_label` beschreibt **was** inhaltlich/technisch vorliegt (z. B. konsolidierter Stand, nicht-amtliche Aufbereitung).
- `fassung_typ` beschreibt **welchen rechtlichen Status** diese Fassung hat (Arbeitsfassung vs. verbindliche Fassung).

## Beispiel-Frontmatter: RIS Normsegment

```yaml
stable_id: ris:normseg:bundesrecht.bgbli_2000_100:par-5-abs-2:v2026-01-01
source: ris
source_url: https://www.ris.bka.gv.at/...
doc_type: norm_segment
title: Beispielgesetz § 5 Abs. 2
fetched_at: 2026-03-21T12:00:00+01:00
version_label: konsolidiert
fassung_typ: Arbeitsfassung
source_id: bundesrecht.bgbli_2000_100
segment_ref: "§ 5 Abs. 2"
language: de
jurisdiction: AT
```

## Beispiel-Frontmatter: RIS Gesamtdokument

```yaml
stable_id: ris:doc:bundesrecht.bgbli_2000_100:v2026-01-01
source: ris
source_url: https://www.ris.bka.gv.at/...
doc_type: norm_document
title: Beispielgesetz
fetched_at: 2026-03-21T12:01:00+01:00
version_label: konsolidiert
fassung_typ: Arbeitsfassung
source_id: bundesrecht.bgbli_2000_100
representation: whole_law
language: de
jurisdiction: AT
```

## Beispiel-Frontmatter: JUSLINE Diskussion/Kommentar

```yaml
stable_id: jusline:mat:stgb-146-betrug-kommentar
source: jusline
source_url: https://www.jusline.at/...
doc_type: commentary
title: Diskussion zu § 146 StGB
fetched_at: 2026-03-21T12:02:00+01:00
version_label: nicht-amtlich
fassung_typ: Arbeitsfassung
source_id: kommentar-123
language: de
jurisdiction: AT
notes: Sekundärquelle; RIS bleibt für Wortlaut und Metadaten maßgeblich.
```

## Beispiel-Frontmatter: JUSLINE Entscheidung

```yaml
stable_id: jusline:dec:275153
source: jusline
source_url: https://www.jusline.at/entscheidung/275153
doc_type: decision
title: TE OGH 2008/9/9 5Ob121/08t
fetched_at: 2026-08-27T21:00:00.000Z
version_label: nicht-amtlich
fassung_typ: Arbeitsfassung
source_id: "275153"
case_number: 5Ob121/08t
rechtssatznummer: RS0012345
court: OGH
published_date: "2008-09-09"
published_date_raw: "09.09.2008"
ecli: ECLI:AT:OGH0002:2008:0050OB00121.08T.0909.000
fundstellen:
  - SZ 2008/123
  - EvBl 2009/45
  - wobl 2009/12
norms:
  - MRG § 2
  - ABGB § 1096
language: de
jurisdiction: AT
notes: Sekundärquelle; RIS bleibt für Wortlaut und Metadaten maßgeblich.
```
