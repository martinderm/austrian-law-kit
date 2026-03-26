# JUSLINE Fixture Notes

Diese Fixture-Dateien sind **reduzierte Snapshot-Extrakte** aus realen Seiten:

- Positiv (Kommentare): `stgb-paragraf-111.html` basiert auf
  `https://www.jusline.at/gesetz/stgb/paragraf/111`
- Positiv (Entscheidungen): `stgb-paragraf-111-decisions.html` basiert auf
  `https://www.jusline.at/gesetz/stgb/paragraf/111`
- Variante (Kommentare, belastbar für MVP-Härtung): `stgb-paragraf-111-discussions-variant.html`
- Variante (Entscheidungen, belastbar für MVP-Härtung): `stgb-paragraf-111-decisions-variant.html`
- Negativ (synthetisch, keine Entscheidungslinks): `stgb-paragraf-111-no-decisions.html`
- Negativ: `stvo-paragraf-4.html` basiert auf
  `https://www.jusline.at/gesetz/stvo/paragraf/4`

## Warum reduziert?

Für Parser-Tests werden nur die relevanten Bereiche benötigt. Große, volatile Bereiche
(Navigation, Login-Modal, Tracking/Ads, generisches Layout) sind bewusst entfernt,
um Testdaten stabil und wartbar zu halten.

## Behaltene Sektionen

- Kommentar-/Diskussionsblöcke (positiver Fall)
- Entscheidungslisten/Gerichtsgruppen (positiver Fall)
- synthetischer Entscheidungs-Panel-Extrakt ohne Einzel-Links (negativer Fall für Decision-Parsing)
- expliziter "keine Kommentare"-Hinweis (negativer Fall)
- Entscheidungs-Header als Gegenprobe, damit Diskussionen/Entscheidungen sauber getrennt testbar bleiben

## Belastbarkeit für den aktuellen MVP-Härtungsschritt

- Die beiden Variant-Fixtures `stgb-paragraf-111-discussions-variant.html` und
  `stgb-paragraf-111-decisions-variant.html` sind UTF-8-sauber und als belastbare Basis für diesen Härtungsschritt gedacht.
- Einige ältere Snapshot-Fixtures aus früheren Schritten zeigen lokal Mojibake-Spuren in Textfeldern. Für diesen Schritt sind sie nur ergänzende Referenz,
  nicht die maßgebliche Verifikationsbasis für die neuen Parser-Härtungen.
- Die Variant-Fixtures fokussieren bewusst auf parserrelevante Link-/Snippet-Strukturen, nicht auf vollständige Seitentreue.

Die Extrakte sind damit realitätsnah, aber testfokussiert.
