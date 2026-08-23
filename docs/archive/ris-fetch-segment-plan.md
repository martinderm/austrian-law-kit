# RIS Fetch Segment Plan (MVP)

## Scope von `ris_fetch_segment`

Dieser Schritt implementiert **nur** `ris_fetch_segment` als zweite produktive RIS-Funktion.

In Scope:
- Eingabe für einen einzelnen RIS-Eintrag auflösen
- RIS-Detailseite laden
- minimale Metadaten + Text extrahieren
- Ergebnis in `RisFetchSegmentOutput` mappen
- saubere Fehlerbehandlung

Out of Scope:
- `ris_fetch_whole_law`
- JUSLINE
- tiefe Struktur-/Segmentketten-Extraktion
- inhaltliche Interpretation oder Normalisierung

## Unterstützte Input-Form (MVP)

- `sourceId` (bevorzugt)
- oder `sourceUrl` (direkter RIS-Link)
- `segmentRef` ist bewusst noch nicht unterstützt und liefert `NOT_IMPLEMENTED`

## Extrahierte Felder (MVP)

- `title`
- `source_url`
- `source_id` (aus Input oder URL)
- `content` als minimal bereinigter Seiten-Text
- `frontmatter` mit Pflichtfeldern:
  - `stable_id`
  - `source`
  - `source_url`
  - `doc_type` (`norm_segment`)
  - `title`
  - `fetched_at`
  - `version_label` (MVP: `unknown`)
  - `fassung_typ` (MVP: `Arbeitsfassung`)

## Parser-Grenze (MVP)

- Der aktuelle Parser extrahiert bewusst nur **minimal bereinigten Seiteninhalt**.
- Er ist **noch kein robuster Normtext-Extractor**.
- Tiefere Struktur-/Bereinigungslogik folgt in späteren Schritten.

## Bewusst noch nicht unterstützt

- explizite Segmentauswahl über `segmentRef`
- Whole-Law-Abruf
- robuste Versionserkennung aus RIS
- tiefe HTML/XML-Strukturmodellierung
