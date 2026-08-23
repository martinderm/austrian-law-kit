# RIS Cache Read Plan (MVP)

## Zielbild

Gezielte Wiederverwendung bereits gecachter RIS-Artefakte als **optionale Beschleunigung**
für `ris_fetch_segment` und `ris_fetch_whole_law`.

Wichtig: kein globales Cache-First-Verhalten.

## Wo Cache-Read eingesetzt wird

- nur in RIS-Fetch-Tools
- nur bei eindeutig ableitbarer Stable ID aus dem angefragten Identifier
- nur für genau passenden `doc_type` (`norm_segment` bzw. `norm_document`)

## Was ausdrücklich NICHT gemacht wird

- kein globales Cache-First für alle Tools
- keine Änderungen an JUSLINE
- kein Umbau der RIS-Parser
- keine Vertragsaufblähung nur für Cache-Read

## Verhalten bei Cache-Miss und Konflikten

- Cache-Miss ist **kein Fehler** und führt zum normalen RIS-Fetch
- Cache-Konflikt/Read-Fehler ist **kein Hard-Fail**
- Konflikte/Read-Probleme werden als Hinweis (`meta.warnings`) sichtbar gemacht

## Zusammenspiel Cache-Read + RIS-Fetch

1. stabile ID aus Input ableiten
2. gezielter Cache-Read-Versuch
3. bei Cache-Hit: schneller erfolgreicher Return
4. bei Miss/Konflikt: normaler RIS-Fetch-Pfad
5. nach RIS-Erfolg weiterhin optionales write-through Caching
