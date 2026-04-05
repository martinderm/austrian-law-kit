# Live-Tests

Hier liegen **ausführbare Live-Checks** gegen echte Upstream-Seiten.

Zweck:
- keine Fixture-/Mock-Tests
- keine Vertragsdoku
- schneller Realitätscheck gegen aktuelle RIS-/JUSLINE-Seiten

## Aktuell vorhanden

- `jusline-live-check.ts` — kleiner Live-Testblock für JUSLINE Diskussionen/Entscheidungen

## Ausführung

Vom Repo-Root:

```bash
npm exec --yes --package tsx -- tsx tests/live/jusline-live-check.ts
```

Der Check liefert:
- pro Testfall `PASS` oder `FAIL`
- Trefferzahl bzw. Fehlercode
- am Ende eine kleine JSON-Zusammenfassung
- zusätzlich Ergebnisdateien unter `tests/live/results/`

## Ergebnisdateien

Nach jedem Lauf werden geschrieben:

- `tests/live/results/jusline-live-check.latest.json`
- `tests/live/results/jusline-live-check-<timestamp>.json`
- `tests/live/results/jusline-live-check.latest.md`
- `tests/live/results/jusline-live-check-<timestamp>.md`

Damit kann man sowohl den letzten Stand direkt ansehen als auch einzelne Läufe nachvollziehen.
Die Markdown-Dateien sind für schnelles menschliches Mitschauen gedacht; JSON bleibt die maschinenfreundliche Form.

## Hinweis

Diese Checks hängen vom aktuellen Upstream-Stand ab. Sie sind deshalb bewusst **ergänzend** zu den stabileren Fixture-/Smoke-Tests gedacht, nicht als deren Ersatz.
