# RIS Fetch Whole Law Plan (MVP)

## Scope von `ris_fetch_whole_law`

Dieser Schritt implementiert **nur** `ris_fetch_whole_law` als dritte produktive RIS-Funktion.

In Scope:
- Eingabe für ein RIS-Gesamtdokument auflösen
- RIS-Dokumentseite laden
- minimale Metadaten + Text extrahieren
- Ergebnis in `RisFetchWholeLawOutput` mappen
- saubere Fehlerbehandlung

Out of Scope:
- JUSLINE
- tiefe Unterstruktur-/Segmentmodellierung
- inhaltliche Interpretation oder rechtliche Normalisierung

## Unterstützte Input-Form (MVP)

- `sourceId` (bevorzugt)
- oder `sourceUrl` (direkter RIS-Link)

Regel: mindestens einer der beiden Identifier muss vorhanden sein.

## Extrahierte Felder (MVP)

- `title`
- `source_url`
- `source_id` (aus Input oder URL)
- `content` als minimal bereinigter Seiten-Text
- `frontmatter` mit Pflichtfeldern:
  - `stable_id`
  - `source`
  - `source_url`
  - `doc_type` (`norm_document`)
  - `title`
  - `fetched_at`
  - `version_label` (MVP: `unknown`)
  - `fassung_typ` (MVP: `Arbeitsfassung`)

## Parser-Grenze (MVP)

- Der Parser extrahiert bewusst nur **minimal bereinigten Seiteninhalt**.
- Er ist **noch kein robuster Normtext-Extractor**.
- Tiefere Struktur-/Bereinigungslogik folgt in späteren Schritten.

## Bewusst noch nicht unterstützt

- Segmentketten-/Unterstrukturmodellierung
- inhaltliche Segmentinterpretation
- versionierte Spezialpfade über die Grundform hinaus
