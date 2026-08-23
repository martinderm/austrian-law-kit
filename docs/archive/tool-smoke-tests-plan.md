# Tool Smoke Tests Plan

Ziel dieses kleinen Schritts: die bestehenden MVP-Tools zusätzlich zu den Parser-Smoke-Tests mit wenigen ausführbaren Smoke-Tests auf Tool-Ebene absichern.

## Welche MVP-Tools jetzt direkt geprüft werden

- `ris_search`
- `ris_fetch_segment`
- `ris_fetch_whole_law`
- `jusline_fetch_discussions`
- `jusline_list_decisions`

## Welche Pfade die Smoke-Tests prüfen

- erfolgreicher Parse-/Mapping-Pfad mit Fixture-basiertem Fetch-Mock
- offensichtlicher `VALIDATION_ERROR` bei klar schlechtem Input
- ausgewählte `NOT_FOUND`-Pfade, sofern sie mit vorhandenen Fixtures sauber und stabil prüfbar sind
- keine breite Fehlerpfad-Matrix und keine Vollabdeckung aller Kombinationen

## Welche Fixtures und Mocks dafür genutzt werden

### RIS
- `fixtures/ris/search-result-sample.html`
- `fixtures/ris/segment-detail-sample.html`
- `fixtures/ris/whole-law-detail-sample.html`
- kontrollierte Fetch-Mocks für HTTP-Status und Response-Text

### JUSLINE
- `fixtures/jusline/stgb-paragraf-111-discussions-variant.html`
- `fixtures/jusline/stgb-paragraf-111-decisions-variant.html`
- `fixtures/jusline/stgb-paragraf-111-no-decisions.html`
- `fixtures/jusline/stvo-paragraf-4.html`
- kontrollierte Fetch-Mocks für HTTP-Status und Response-Text

## Was bewusst nicht gemacht wird

- keine End-to-End-HTTP-Tests gegen echte Upstreams
- keine vollständige Fehlerpfad-Matrix pro Tool
- keine neue Testinfrastruktur oder schweres Framework
- keine Vertragsänderung
- keine neue Tool-Funktionalität
- keine Ausweitung auf Cache- oder Registry-Kompletttests
