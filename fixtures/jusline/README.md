# JUSLINE Fixture Notes

Diese Fixture-Dateien sind **reduzierte Snapshot-Extrakte** aus realen Seiten:

- Positiv (Kommentare): `stgb-paragraf-111.html` basiert auf
  `https://www.jusline.at/gesetz/stgb/paragraf/111`
- Positiv (Entscheidungen): `stgb-paragraf-111-decisions.html` basiert auf
  `https://www.jusline.at/gesetz/stgb/paragraf/111`
- Negativ: `stvo-paragraf-4.html` basiert auf
  `https://www.jusline.at/gesetz/stvo/paragraf/4`

## Warum reduziert?

Für Parser-Tests werden nur die relevanten Bereiche benötigt. Große, volatile Bereiche
(Navigation, Login-Modal, Tracking/Ads, generisches Layout) sind bewusst entfernt,
um Testdaten stabil und wartbar zu halten.

## Behaltene Sektionen

- Kommentar-/Diskussionsblöcke (positiver Fall)
- Entscheidungslisten/Gerichtsgruppen (positiver Fall)
- expliziter "keine Kommentare"-Hinweis (negativer Fall)
- Entscheidungs-Header als Gegenprobe, damit Diskussionen/Entscheidungen sauber getrennt testbar bleiben

Die Extrakte sind damit realitätsnah, aber testfokussiert.
