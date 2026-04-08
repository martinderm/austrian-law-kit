# RIS Linking — praktische Regeln für das Projekt

## Tokens entfernen
- `WxeFunctionToken` und ähnliche Session-/Funktions-Token nie in stabile Referenzen übernehmen.

## Identifier ernst nehmen
- `Gesetzesnummer` für konsolidiertes Recht systematisch mitführen
- `Dokumentnummer` für konkrete Einzeltexte systematisch mitführen

## Datumsformate beachten
- RIS nutzt je nach Endpunkt unterschiedliche Datumsformate
- `FassungVom` ist besonders heikel und darf nicht blind vereinheitlicht werden

## Auswahl des Linktyps
- aktuelle Gesamtfassung -> `GeltendeFassung.wxe`
- aktuelle Einzelnorm -> `NormDokument.wxe`
- feste historische/konkrete Version -> `Dokument.wxe`
- BGBl/LGBl extern -> ELI bevorzugen, wenn verfügbar
