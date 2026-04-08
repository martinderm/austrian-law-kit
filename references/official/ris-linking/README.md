# RIS Linking Referenz

Quelle:
- PDF: `LinksaufDokumenteimRISsetzen.pdf`
- Ursprung: `https://www.ris.bka.gv.at/RisInfo/LinksaufDokumenteimRISsetzen.pdf`
- Stand laut Dokument: Jänner 2026

## Worum es geht

Das Dokument beschreibt stabile Linkmuster für Suchabfragen und Deep Links auf RIS-Dokumente. Für `openclaw-austrian-law-kit` ist es besonders relevant für `source_url`, stabile Referenzen, Direktlinks auf Einzeldokumente und Links auf aktuelle Fassungen.

## Wichtigste Muster

### Einzeldokument über Dokumentnummer
- `Dokument.wxe?Abfrage=<App>&Dokumentnummer=<ID>`
- geeignet für feste, konkrete Dokumentversionen
- für Bundesrecht z. B. `Abfrage=Bundesnormen&Dokumentnummer=NOR...`

### Gesamte geltende Fassung
- `GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=<ID>`
- geeignet für aktuelle Gesamtfassung einer Rechtsvorschrift

### Einzelnorm in geltender Fassung
- `NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=<ID>&Paragraf=<Nr>`
- analog auch für Artikel/Anlage

### ELI-Links
- BGBl: `https://www.ris.bka.gv.at/eli/bgbl/{Teil}/{Jahr}/{Nummer}/{JJJJMMTT}`
- LGBl: `https://www.ris.bka.gv.at/eli/lgbl/{BL}/{Jahr}/{Nummer}/{JJJJMMTT}`
- für externe stabile Referenzen bevorzugt, wenn verfügbar

## Relevante Regeln

- `WxeFunctionToken` bzw. ähnliche Session-Token nie in stabile Referenzen übernehmen
- `Gesetzesnummer` ist für konsolidiertes Recht ein zentraler stabiler Identifier
- `Dokumentnummer` ist zentral für Einzeldokumente über viele RIS-Applikationen
- Datumsformate sind endpunktspezifisch, insbesondere `FassungVom` beachten
- Landesrecht hat applikationsspezifische Kürzel; ELI ist für LGBl besonders attraktiv als stabiler externer Link

## Empfehlung für das Projekt

1. `source_url` nicht nur als irgendeine funktionierende URL betrachten, sondern je nach Zweck bewusst wählen:
   - aktuelle Gesamtfassung -> `GeltendeFassung.wxe`
   - aktuelle Einzelnorm -> `NormDokument.wxe`
   - feste Dokumentversion -> `Dokument.wxe`
2. Für externe/public-facing Referenzen ELI bevorzugen, wenn vorhanden.
3. In gecachten/speicherbaren Referenzen alle Session-/Funktions-Token entfernen.
4. Für Bundes-/Landesrecht mittelfristig zusätzlich `Gesetzesnummer` als eigenes Feld systematisch mitführen.
