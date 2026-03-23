# JUSLINE Fixture Notes

Diese Fixture-Dateien sind **reduzierte Snapshot-Extrakte** aus realen Seiten:

- Positiv: `stgb-paragraf-111.html` basiert auf
  `https://www.jusline.at/gesetz/stgb/paragraf/111`
- Negativ: `stvo-paragraf-4.html` basiert auf
  `https://www.jusline.at/gesetz/stvo/paragraf/4`

## Warum reduziert?

Für Parser-Tests werden nur die relevanten Bereiche benötigt. Große, volatile Bereiche
(Navigation, Login-Modal, Tracking/Ads, generisches Layout) sind bewusst entfernt,
um Testdaten stabil und wartbar zu halten.

## Behaltene Sektionen

- Kommentar-/Diskussionsblöcke (positiver Fall)
- expliziter "keine Kommentare"-Hinweis (negativer Fall)
- Entscheidungs-Header als Gegenprobe, damit der Parser diese in diesem MVP-Schritt ignoriert

Die Extrakte sind damit realitätsnah, aber testfokussiert.
