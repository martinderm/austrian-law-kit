# Parser Smoke Edge Cases Plan

Ziel dieses kleinen Schritts: die vorhandenen ausführbaren Parser-Smoke-Tests um wenige zusätzliche Edge-Cases ergänzen, ohne daraus eine vollständige Testmatrix zu machen.

## Welche zusätzlichen Edge-Cases jetzt ergänzt werden

- Deduplizierung bei wiederholten RIS-/JUSLINE-Links bleibt stabil
- Parser ignorieren weiterhin falsche Linktypen innerhalb desselben HTML-Ausschnitts
- optionale Snippet-Felder dürfen fehlen, ohne das Ergebnis unbrauchbar zu machen
- Title-/Content-Fallbacks bei kleinen RIS-Variationen bleiben funktionsfähig

## Warum diese Fälle wichtig sind

- Doppelte Treffer sind ein typischer Parser-Schmutzfehler und sollten früh auffallen.
- Gemischte Linktypen kommen auf JUSLINE-Seiten realistisch vor; die Trennung Diskussionen vs. Entscheidungen ist fachlich zentral.
- Optionale Felder wie `snippet` dürfen im MVP nicht unnötig harte Abhängigkeiten erzeugen.
- Kleine HTML-Variationen bei RIS-Titeln oder Container-Strukturen sollen die Smoke-Testbasis robuster machen, ohne gleich eine neue Parser-Generation zu bauen.

## Was bewusst nicht gemacht wird

- keine Vollabdeckung aller Parserzweige
- keine breite Fehlerpfad-Matrix
- keine neue Testarchitektur oder externes Framework
- keine neue Parser-Funktionalität
- keine Tool- oder Vertragsänderung
- keine End-to-End-Tests über HTTP oder Tool-Layer
