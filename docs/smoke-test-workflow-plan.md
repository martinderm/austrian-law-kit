# Smoke Test Workflow Plan

Ziel dieses kleinen Schritts: die bereits vorhandenen Smoke-Tests für Parser- und Tool-Layer lokal leichter auffindbar und bequemer ausführbar machen.

## Welche Smoke-Tests aktuell existieren

- Parser-Smoke-Tests für die MVP-Parser unter `plugin/openclaw-austrian-law/tests/parser-smoke.test.ts`
- Tool-Smoke-Tests für die MVP-Tools unter `plugin/openclaw-austrian-law/tests/tool-smoke.test.ts`

## Wie sie lokal ausgeführt werden

Im Plugin-Verzeichnis `plugin/openclaw-austrian-law/`:

- nur Parser-Smoke-Tests: `npm run test:parser-smoke`
- nur Tool-Smoke-Tests: `npm run test:tool-smoke`
- beide zusammen: `npm run test:smoke`

## Welche kleinen Workflow-Verbesserungen jetzt gemacht werden

- gemeinsames Sammel-Script für alle Smoke-Tests
- klarere README-Hinweise für den lokalen Testlauf
- klarere Unterscheidung zwischen Parser-Smoke und Tool-Smoke in der Projektdoku
- Hinweise im Status/Next-Session-Text, dass beide Smoke-Test-Arten bereits vorhanden sind

## Was bewusst nicht gemacht wird

- keine neue Testarchitektur
- kein externes Test-Framework
- keine neuen Parser- oder Tool-Funktionen
- keine E2E-Testläufe gegen echte Upstreams
- keine umfassende CI-/Pipeline-Umstellung
