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
- `decision_ref` (string) — referenzierte Entscheidungskennung
- `supersedes` (string) — stable_id einer ersetzten älteren Fassung
- `checksum` (string) — Hash des normalisierten Inhalts
- `notes` (string) — kurze Zusatzhinweise

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
title: Beispielgesetz (Gesamtdokument)
fetched_at: 2026-03-21T12:01:00+01:00
version_label: konsolidiert
fassung_typ: Arbeitsfassung
source_id: bundesrecht.bgbli_2000_100
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
