# RIS Linking — Endpunkte im Detail

Quelle:
- `LinksaufDokumenteimRISsetzen.pdf`

## Kernendpunkte

### `Dokument.wxe`
Direktlink auf ein Einzeldokument via Dokumentnummer.

**Nutzen im Projekt:**
- geeignet für exakte Versionen / konkrete Dokumente
- gut für direkte `source_url`, wenn eine feste Dokumentnummer vorliegt

### `Ergebnis.wxe`
Suchergebnisliste bzw. je nach Anfrage auch direkter Sprung auf eindeutige Treffer.

**Nutzen im Projekt:**
- aktuell MVP-Discovery, aber fragil
- mittelfristig eher Fallback gegenüber offizieller API

### `GeltendeFassung.wxe`
Gesamte aktuelle bzw. stichtagsbezogene Fassung einer Rechtsvorschrift.

**Nutzen im Projekt:**
- stark für stabile Referenzen auf aktuelle Gesamtfassungen
- sollte bei Gesamtgesetz-Links bevorzugt geprüft werden

### `NormDokument.wxe`
Aktuelle Einzelnorm innerhalb der geltenden Fassung.

**Nutzen im Projekt:**
- stark für stabile Deep Links auf einzelne Paragraphen/Artikel/Anlagen
- besonders interessant für `ris_fetch_segment`

## Judikatur-Endpunkte laut Dokument
- `JudikaturEntscheidung.wxe`
- `JudikaturRechtssaetze.wxe`
- `VfghEntscheidung.wxe`
- `VwghRechtssatzkette.wxe`
- `VergEntscheidung.wxe`

## Arbeitsregel
Nicht jede funktionierende RIS-URL ist gleich gut. Je nach Zweck sollte ein gezielt stabiler Endpunkt gewählt werden.
