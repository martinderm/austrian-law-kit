# JUSLINE-Referenz

## Zweck

Diese Referenz ergänzt den Skill nur für JUSLINE-spezifisches Verhalten. RIS bleibt Primärquelle; JUSLINE ist Sekundärquelle und opt-in.

## Tools

- `jusline_fetch_discussions`
  - Zweck: Diskussionen/Kommentare von JUSLINE-Paragrafseiten laden
  - Input: `query`, optional `limit`, optional `refresh`
  - Query-Form: volle JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`

- `jusline_list_decisions`
  - Zweck: Entscheidungslisten von JUSLINE-Paragrafseiten laden
  - Input: `query`, optional `limit`, optional `refresh`
  - Query-Form: volle JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`

## Refresh- und Cache-Semantik

- JUSLINE nutzt zusätzlich einen Query-Index über `query + kind + limit` mit 24h TTL.
- Ohne `refresh: true` kann ein früherer Trefferzustand bewusst wiederverwendet werden.
- `refresh: true` bedeutet Force-Reload: Query-Index und Artefakt-Reuse werden bypassed.
- Für Live-Checks, Parser-Nachtests und gezielte Verifikation `refresh: true` bevorzugen.

## Typische Trefferfelder

Basistreffer aus beiden Tools:
- `stable_id`
- `source_id`
- `title`
- `source_url`
- optional `snippet`

Zusätzliche Kontexthilfen in Tool-Antworten können je nach Query vorkommen:
- `source_path`
- `law_slug`
- `segment_ref`
- Notices wie `cache_refresh`

## Kommentare/Discussions: mögliche Detailfelder

Bei Kommentar-Detailseiten können ergänzende Felder auftauchen, wenn die Seite sie tatsächlich hergibt:
- `author_name`
- `author_profile_url`
- `citation`
- `published_date`
- `published_date_raw`
- `rating_value`
- `rating_count`
- `views_count`
- `comment_version`
- `body_markdown`
- im Fehlerfall `fetch_error`

Wichtig:
- Diese Felder sind optional.
- Fehlende Felder nicht interpolieren.
- `body_markdown` ist Zusatzkontext, kein Primärbeleg für den Normwortlaut.

## Entscheidungen: mögliche Detailfelder

Bei Entscheidungsdetails werden folgende Felder aus Listen und Detailseiten strukturiert extrahiert:
- `case_number` / `geschaeftszahl` (z. B. `5Ob121/08t`, `Ra 2021/05/0123`, `G 12/2023`, `W123 2123456-1`)
- `rechtssatznummer` (z. B. `RS0012345`)
- `document_type` (z. B. `Entscheidung`, `Rechtssatz`, `Erkenntnis`)
- `court` (z. B. `OGH`, `VwGH`, `VfGH`, `BVwG`, `LG für ZRS Wien`)
- `published_date` (ISO `YYYY-MM-DD`) & `published_date_raw` (`DD.MM.YYYY`)
- `fundstellen` (z. B. `SZ 2008/123`, `EvBl 2009/45`, `wobl 2009/12`)
- `norms` (Liste angewandter Rechtsnormen, z. B. `["MRG § 2", "ABGB § 1096"]`)
- `rechtssatz` & `leitsatz`
- `spruch` (Tenor/Spruch bei Volltexten)
- `vorinstanzen` (Verfahrensgang)
- `schlagworte` (Stichworte/Keywords)
- `entscheidungstexte` (assoziierte Leitentscheidungen)
- `ecli` (European Case Law Identifier)
- `updated_at` (Zuletzt aktualisiert am)
- `body_markdown` (strukturierte Markdown-Aufbereitung mit Metadaten-Block)
- im Fehlerfall `fetch_error`

Wichtig:
- Entscheidungslisten und Entscheidungsdetails nicht mit Kommentaren vermischen.
- `court` und `law_title` nicht verwechseln: Gericht separat führen, Normtitel nur setzen, wenn er ohnehin bereits belastbar vorliegt; sonst weglassen.
- Rechtssatz, Normen und Entscheidungstexte sind Sekundärkontext und nicht mit RIS-Normwortlaut gleichzusetzen.
- Keine rohen Preview-Blöcke wie „Extrahierter Kontext“ in Decision-Artefakte rendern.

## Antwortdisziplin

Wenn JUSLINE verwendet wird:
- Herkunft klar benennen: `JUSLINE (Sekundärquelle)`.
- RIS und JUSLINE in der Antwort sichtbar trennen.
- Bei Konflikten RIS vorziehen.
- Entscheidungen nur nennen, wenn sie gefragt sind oder fachlich wirklich nötig sind.
- Aus JUSLINE keine stärkere Sicherheit ableiten als die Quelle hergibt.

## Wann JUSLINE sinnvoll ist

- Wenn nach Kommentaren, Diskussionen oder Literaturhinweisen gefragt wird
- Wenn nach Entscheidungslisten zu einer Norm gefragt wird
- Wenn zusätzlicher Kontext nützlich ist, nachdem RIS-Wortlaut bereits geklärt wurde

## Wann JUSLINE nicht vorgeschoben werden soll

- Wenn eigentlich nur der Normwortlaut, die Gliederung oder RIS-Metadaten gebraucht werden
- Wenn RIS noch gar nicht sauber aufgelöst wurde
- Wenn JUSLINE bloß als schneller Ersatz für RIS dienen würde
