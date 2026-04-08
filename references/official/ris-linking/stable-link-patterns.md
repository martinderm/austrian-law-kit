# RIS Linking — stabile Linkmuster

Quelle:
- `LinksaufDokumenteimRISsetzen.pdf`

## Kerntypen

### Einzeldokument
- `Dokument.wxe?Abfrage=<App>&Dokumentnummer=<ID>`
- gut für feste, konkrete Dokumentversionen

### Gesamte geltende Fassung
- `GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=<ID>`
- gut für aktuelle Gesamtfassungen

### Einzelnorm in geltender Fassung
- `NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=<ID>&Paragraf=<Nr>`
- analog auch für `Artikel` oder `Anlage`

## Projektregel
`source_url` nicht zufällig aus Such-/UI-URLs übernehmen, sondern je nach Zweck bewusst auf einen stabilen Linktyp abbilden.
