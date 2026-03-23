# RIS Cache Integration Plan (MVP)

## Zielbild (MVP)

Die bestehenden RIS-Fetch-Tools (`ris_fetch_segment`, `ris_fetch_whole_law`) bleiben der Primärpfad für Abruf + Parsing.
Nach einem **erfolgreichen** RIS-Ergebnis wird das erzeugte Artifact **optional** in den lokalen Cache geschrieben (write-through).

## Wann Cache geschrieben wird

- nur nach erfolgreichem Fetch + Parse (`ok: true` Hauptpfad)
- pro erfolgreich erzeugtem Artifact ein Write-Versuch
- keine Cache-First-Strategie in diesem Schritt

## Verhalten bei Cache-Fehlern

- Cache-Schreibfehler machen den RIS-Tool-Call **nicht** fehlerhaft
- der Hauptpfad bleibt `ok: true`
- Cache ist in diesem Schritt eine Best-Effort-Nebenwirkung

## Kapselung

- kleine Helper-Schicht für write-through (`src/cache/cache-write-through.ts`)
- Fetch-/Parserlogik bleibt in RIS-Tools
- Cache-I/O bleibt in bestehender Cache-Schicht gekapselt

## Bewusst noch nicht in diesem Schritt

- kein Cache-First-Verhalten für RIS-Fetch-Tools
- keine Änderungen an `law_cache_get` / `law_cache_put`-Vertrag
- kein Retry-/Queue-Mechanismus für Cache-Schreibfehler
- keine JUSLINE-bezogene Cache-Logik
