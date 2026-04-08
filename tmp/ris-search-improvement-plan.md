# Temporärer Umsetzungsplan: ris_search verbessern

Stand: 2026-04-08
Status: offen bis Umsetzung abgeschlossen

## Ziel
`ris_search` von einer fragilen HTML-Trefferliste zu einer hilfreichen Discovery-/Resolver-Stufe weiterentwickeln.

## PR 1: Query-Resolver vor die Suche setzen
- Query normalisieren
- direkte `NOR...`-`sourceId` erkennen
- typische Referenzen wie `§ 1293 ABGB`, `ABGB 1293`, `§ 4 StVO` erkennen
- internes Resolver-Objekt einführen (`sourceId | normRef | freeText`)
- Tests für Parsing/Normalisierung ergänzen

## PR 2: Mehrstufige Suchstrategie mit Fallbacks
- `sourceId` direkt als Kandidat behandeln
- bei `law + paragraph` mehrere Query-Strategien nacheinander probieren
- 1 bis 2 Retries bei 5xx mit kleinem Backoff
- Fehler sauberer trennen: `NO_RESULTS`, `UPSTREAM_UNAVAILABLE`, `PARSE_ERROR`
- Fetch-Mock-Tests für Fallbacks und Retry ergänzen

## PR 3: Trefferbewertung und best_candidate
- Ranking für exakte/teilweise Treffer
- `match_reason` und optionale `confidence`
- `best_candidate` plus Alternativen im Output

## PR 4: Parser härten
- mittelfristig von Regex auf HTML-Parser/Selektoren umstellen
- mehr echte RIS-Fixtures sammeln
- Parser robuster gegen Layout-Änderungen machen

## PR 5: Doku und Skill nachziehen
- `ris_search` als Resolver/Discovery-Tool dokumentieren
- Grenzen und Fallback-Strategie dokumentieren
- Beispiele ergänzen

## Priorität
1. PR 1 Resolver
2. PR 2 Fallbacks + Retry
3. PR 3 Ranking
4. PR 5 Doku
5. PR 4 Parser-Härtung

## Definition of Done
- direkte `NOR...`-Erkennung
- typische Normreferenzen werden erkannt
- Fallback-Strategien bei leeren Treffern
- Retry bei 5xx
- sauberere Fehlersignale
- hilfreicherer Output für nachgelagerte Fetch-Tools
