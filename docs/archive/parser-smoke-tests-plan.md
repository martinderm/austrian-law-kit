# Parser Smoke Tests Plan

Ziel dieses kleinen Schritts: die bestehenden MVP-Parser mit wenigen, ausführbaren Smoke-Tests gegen belastbare Fixtures absichern.

## Welche Parser jetzt direkt geprüft werden

- `plugin/openclaw-austrian-law/src/ris/search-parser.ts`
- `plugin/openclaw-austrian-law/src/ris/segment-parser.ts`
- `plugin/openclaw-austrian-law/src/ris/whole-law-parser.ts`
- `plugin/openclaw-austrian-law/src/jusline/discussions-parser.ts`
- `plugin/openclaw-austrian-law/src/jusline/decisions-parser.ts`

## Welche Fixtures dafür als belastbar gelten

### RIS
- `fixtures/ris/search-result-sample.html`
- `fixtures/ris/segment-detail-sample.html`
- `fixtures/ris/whole-law-detail-sample.html`

### JUSLINE
- `fixtures/jusline/stgb-paragraf-111-discussions-variant.html`
- `fixtures/jusline/stgb-paragraf-111-decisions-variant.html`
- `fixtures/jusline/stgb-paragraf-111-no-decisions.html`
- `fixtures/jusline/stvo-paragraf-4.html`

Für den JUSLINE-Härtungsschritt dienen die beiden Variant-Fixtures als primäre Verifikationsbasis, weil sie gezielt parserrelevante Strukturen isolieren und UTF-8-sauber gehalten sind.

## Welche Kerninvarianten die Smoke-Tests prüfen

- Parser liefert mindestens einen Treffer, wenn die Fixture einen positiven Fall darstellt
- Titel sind nicht leer
- `stable_id` ist nicht leer, wenn sie vom Parser erwartet wird
- RIS-Parser liefern nichtleeren Inhalt
- JUSLINE-Diskussionen liefern nur Kommentar-/Diskussions-URLs
- JUSLINE-Entscheidungen liefern nur Entscheidungs-URLs
- Negativ-Fixtures liefern keine Treffer oder den erwarteten Negativzustand

## Was bewusst noch nicht gemacht wird

- keine Vollabdeckung aller Parser-Zweige
- keine End-to-End-Tests über Tool-Layer und HTTP
- keine schwere Test-Infrastruktur oder externes Test-Framework
- keine Snapshot-Orgie
- keine Vertragsprüfung auf jeder Feldebene
- keine neue Parser-Funktionalität
