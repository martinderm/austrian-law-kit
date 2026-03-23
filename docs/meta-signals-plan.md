# Meta Signals Plan (MVP)

## Ziel

Meta-Signale in RIS-MVP-Tools semantisch klar halten:
- **Notices** für neutrale Hinweise
- **Warnings** für degradierte Nebenpfade oder Probleme

## Aktuelle Signalarten

### Notices (neutral)
- `cache_hit: ...`
  - bedeutet: Ergebnis wurde erfolgreich aus passendem Cache-Eintrag wiederverwendet
  - ist kein Fehler und keine Degradierung

### Warnings (problembezogen)
- `cache_conflict: ...`
- `cache_read_failed: ...`
- `cache_write_failed: ...`

Diese Signale zeigen Probleme im Cache-Nebenpfad, ohne den RIS-Hauptpfad zwingend fehlschlagen zu lassen.

## Verwendung in RIS-MVP-Tools

- `ris_fetch_segment`
- `ris_fetch_whole_law`

Regeln:
1. Hauptpfad bleibt unverändert (`ok: true` bei erfolgreichem RIS-Ergebnis).
2. Cache-Hit wird als `meta.notices` ausgegeben.
3. Cache-Probleme werden als `meta.warnings` ausgegeben.
4. Keine semantische Vermischung von Hinweis und Warnung.

## Out of Scope

- keine neuen RIS-Funktionen
- kein JUSLINE
- kein Umbau auf globales Event-/Telemetry-Schema
- keine Änderung der fachlichen Tool-Verträge
