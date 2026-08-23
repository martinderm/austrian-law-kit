# RIS MVP Hardening Plan

## Ziel dieses Schritts

Kleine, lokale Härtung der bestehenden RIS-MVP-Schicht für bessere Wartbarkeit,
ohne Funktionsänderung und ohne Vertragsänderung.

## Geplante kleine Verbesserungen

- Wiederkehrende Mini-Logik aus `ris_fetch_segment` und `ris_fetch_whole_law` konsolidieren
- konsistente Behandlung von:
  - Source-ID-Auflösung (Input vs. URL)
  - Cache-Hit-Notice-Meta
  - Warnungsaggregation für Cache-Read/Cache-Write-Probleme
- Duplikate reduzieren, damit zukünftige Bugfixes an einer Stelle landen

## Ausdrücklich NICHT in diesem Schritt

- keine neue RIS-Funktion
- keine JUSLINE-Logik
- keine Parser-Erweiterung
- keine Vertragsänderung
- keine neue Cache-Architektur
- kein globales Refactoring

## Erwarteter Effekt

- gleiches Laufzeitverhalten wie bisher
- weniger Copy/Paste in RIS-MVP-Tools
- klarere, konsistentere Meta-Signale
