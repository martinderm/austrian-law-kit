# Tool Contracts (MVP-Stand, laufend nachziehen)

Dieses Dokument definiert die aktuellen Tool-Verträge für das Plugin `austrian-law-kit` auf MVP-Niveau.

## Gemeinsamer Rahmen

- Alle Tools liefern ein gemeinsames Result-Format mit `ok`, optional `data`, optional `error`, optional `meta`.
- Fehler folgen einer gemeinsamen Fehlerstruktur mit `code`, `message`, optional `details`, optional `retryable`.
- **Primärquelle:** RIS
- **Sekundärquelle:** JUSLINE (nur bei fachlich explizitem Bedarf)

## Tool: `ris_search` (Primärquelle)

**Zweck:** Optionale Discovery-Stufe für RIS, um aus einer Suchanfrage zunächst belastbare Referenzen aufzulösen.

**Wichtig:** `ris_search` ist nicht als alleiniger Backbone des Abrufflusses gedacht. Wenn eine belastbare `sourceId` oder `sourceUrl` bereits bekannt ist, sollen direkt `ris_fetch_segment` oder `ris_fetch_whole_law` verwendet werden.

**Input (MVP):**
- `query: string`
- `limit?: number`
- `docType?: "norm" | "decision" | "material"`
- `scope?: "bund" | "land" | "municipal"`
- `state?: AustrianState`
- `municipality?: string` (für `scope: "municipal"`)
- `district?: string` (für `scope: "municipal"`)
- `authentic?: boolean` (für `scope: "municipal"`, nutzt `GrA` statt `Gr`)

**Output (MVP):**
- Trefferliste mit Referenzen (`stable_id`, `source_id`, `title`, `source_url`, optional `snippet`)
- optional `best_candidate` als bestgerankter Treffer
- bei RIS-Treffern optionale Zusatzfelder wie `match_reason`, `confidence`, `normalized_query`, `resolver_kind`
- im API-first-Pfad zusätzlich erste Metadatenfelder wie `application`, `scope`, `state`, `municipality`, `district`, `law_id`, `content_url`, `whole_law_url`, `document_type`, `legal_type`, `section_ref`

**Aktueller Suchpfad (MVP):**
- direkte `NOR...`-/`LOO...`-/`GEMRE...`-Dokumentnummern werden sofort aufgelöst
- Bundesrecht läuft bevorzugt über die offizielle OGD-RIS-API (`/Bundesrecht`, `Applikation=BrKons`)
- Landesrecht nutzt einen ersten OGD-RIS-API-Pfad (`/Landesrecht`, `Applikation=LrKons`) mit zusätzlichem clientseitigem State-Filter und state-spezifischen Titelvarianten
- Gemeinderecht läuft öffentlich über den OGD-RIS-API-Endpunkt `/Gemeinden` mit `Applikation=Gr` oder `GrA`
- HTML-Suche über RIS bleibt Fallback für Bundes- und Landesrecht; für Gemeinderecht gibt es derzeit keinen HTML-Fallbackpfad

**Bekannte Grenzen (MVP):**
- kann 0 Treffer trotz plausibler Query liefern
- kann an RIS-Upstream-Fehlern scheitern (z. B. HTTP-500)
- Landesrecht-Filter der offiziellen API wirken in Live-Tests nicht zuverlässig; daher werden state-fremde Treffer clientseitig verworfen und state-spezifische Titelvarianten nachprobiert
- ist daher nur als best-effort Discovery-Hilfe einzuplanen
- bei Fehlschlag sollte auf bekannte `sourceId`, direkte RIS-URL oder alternative Auflösung gewechselt werden

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `NOT_IMPLEMENTED`
- `UPSTREAM_UNAVAILABLE`

## Tool: `ris_fetch_segment` (Primärquelle)

**Zweck:** Abruf eines einzelnen RIS-Eintrags als `norm_segment` (MVP).

**Input (MVP):**
- `sourceId?: string` (z. B. RIS-Dokumentnummer)
- `sourceUrl?: string` (direkte RIS-Dokument-URL)
- `contentUrl?: string` (bereits aufgelöste Inhalts-URL, z. B. aus `ris_search`)
- `segmentRef?: string` (derzeit außerhalb MVP, führt zu `NOT_IMPLEMENTED`)
- `refresh?: boolean` (optional; ignoriert vorhandenen Cache und holt den Inhalt frisch)

Regel: mindestens `sourceId`, `sourceUrl` oder `contentUrl` muss vorhanden sein.

**Output (MVP):**
- segmentbezogenes Artefakt (`stable_id`, `frontmatter`, `content`)
- Frontmatter enthält mindestens Pflichtfelder plus `source_id`, wenn belastbar ableitbar
- optional zusätzliche API-Metadaten unter `metadata.ris_api`, wenn ein offizieller Lookup für die `sourceId` erfolgreich war

**Aktueller Abrufpfad (MVP):**
- explizite `sourceUrl` wird direkt verwendet
- bei bloßer `sourceId` versucht das Tool zuerst einen offiziellen RIS-API-Lookup
- wenn verfügbar, wird eine konkretere `content_url` bevorzugt
- wenn der Lookup fehlschlägt, bleibt der bisherige direkte RIS-Abruf als Fallback bestehen

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`
- `NOT_IMPLEMENTED`

## Tool: `ris_fetch_whole_law` (Primärquelle)

**Zweck:** Abruf eines einzelnen RIS-Gesamtdokuments als `norm_document` (MVP).

**Input (MVP):**
- `sourceId?: string` (z. B. RIS-Dokumentnummer)
- `sourceUrl?: string` (direkte RIS-Dokument-URL)
- `wholeLawUrl?: string` (bereits aufgelöste Gesamtfassungs-URL, z. B. aus `ris_search`)
- `refresh?: boolean` (optional; ignoriert vorhandenen Cache und holt den Inhalt frisch)

Regel: mindestens `sourceId`, `sourceUrl` oder `wholeLawUrl` muss vorhanden sein.

**Output (MVP):**
- dokumentbezogenes Artefakt (`stable_id`, `frontmatter`, `content`)
- Frontmatter enthält mindestens Pflichtfelder plus `source_id`, wenn belastbar ableitbar
- optional zusätzliche API-Metadaten unter `metadata.ris_api`, wenn ein offizieller Lookup für die `sourceId` erfolgreich war

**Aktueller Abrufpfad (MVP):**
- explizite `sourceUrl` wird direkt verwendet
- bei bloßer `sourceId` versucht das Tool zuerst einen offiziellen RIS-API-Lookup
- wenn verfügbar, wird eine passende `whole_law_url` bevorzugt
- wenn der Lookup fehlschlägt, bleibt der bisherige direkte RIS-Abruf als Fallback bestehen

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`

## Tool: `jusline_fetch_discussions` (Sekundärquelle)

**Zweck:** Optionale Abrufe von Diskussionen/Kommentaren aus JUSLINE (MVP).

**Input (MVP):**
- `query: string` (JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`)
- `limit?: number`
- `refresh?: boolean` (optional; erzwingt frischen Abruf ohne Query-Index- oder Artefakt-Reuse)

**Output (MVP):**
- Diskussions-/Kommentartreffer (`stable_id`, `source_id`, `title`, `source_url`, optional `snippet`)
- je nach Query zusätzlich Kontexthinweise in `meta`, z. B. `source_path`, `law_slug`, `segment_ref`
- bei Cache-/Refresh-Verhalten optionale `notices`, z. B. `cache_refresh`
- aus Treffern können intern Preview-Artefakte für Kommentar-Detailseiten erzeugt werden

**Optionale angereicherte Kommentar-Detailfelder (kontextabhängig):**
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
- `fetch_error`

**Hinweise (MVP):**
- JUSLINE nutzt einen Query-Index über `query + kind + limit` mit 24h TTL.
- Ohne `refresh` kann daher bewusst Wiederverwendung auftreten.
- Fehlende Detailfelder dürfen nicht als garantiert angenommen werden.

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`
- `NOT_IMPLEMENTED` (nur außerhalb MVP)

## Tool: `jusline_list_decisions` (Sekundärquelle)

**Zweck:** Optionale Auflistung von Entscheidungen aus JUSLINE (MVP).

**Input (MVP):**
- `query: string` (JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`)
- `limit?: number`
- `refresh?: boolean` (optional; erzwingt frischen Abruf ohne Query-Index- oder Artefakt-Reuse)

**Output (MVP):**
- Entscheidungsreferenzen (`stable_id`, `source_id`, `title`, `source_url`, optional `snippet`)
- je nach Query zusätzlich Kontexthinweise in `meta`, z. B. `source_path`, `law_slug`, `segment_ref`
- bei Cache-/Refresh-Verhalten optionale `notices`, z. B. `cache_refresh`
- aus Listentreffern können intern Preview-Artefakte für Entscheidungsdetailseiten erzeugt werden

**Optionale angereicherte Entscheidungs-Detailfelder (kontextabhängig):**
- `document_type`
- `court`
- `published_date_raw`
- `teaser`
- `norms`
- `rechtssatz`
- `entscheidungstexte`
- `ecli`
- `updated_at`
- `body_markdown`
- `fetch_error`

**Hinweise (MVP):**
- JUSLINE nutzt einen Query-Index über `query + kind + limit` mit 24h TTL.
- Ohne `refresh` kann daher bewusst Wiederverwendung auftreten.
- Detailseiten werden nur ergänzend verwertet; RIS bleibt Primärquelle für Normwortlaut und Primärmetadaten.

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`

## Tool: `ris_sync_laws` (Primärquelle)

**Zweck:** Batch-Synchronisation mehrerer Gesetze in einem einzigen Schritt. Iteriert intern über `ris_fetch_whole_law` und aggregiert die Ergebnisse mit Cache-Statistiken.

**Input (MVP):**
- `laws: RisSyncLawsItem[]` (Array, mindestens 1 Element)
  - Je Item:
    - `query?: string`
    - `sourceId?: string`
    - `wholeLawUrl?: string`
    - `scope?: "bund" | "land" | "municipal"`
    - `state?: AustrianState`
    - `refresh?: boolean`

**Output (MVP):**
- `total: number` — Gesamtanzahl angeforderter Gesetze
- `synced: number` — frisch abgerufene Gesetze
- `cached: number` — aus Cache bediente Gesetze
- `failed: number` — fehlgeschlagene Abrufe
- `laws: SyncedLawResult[]` — pro Gesetz:
  - `query?: string`
  - `stable_id?: string`
  - `title?: string`
  - `law_id?: string`
  - `source_url?: string`
  - `cached: boolean`
  - `ok: boolean`
  - `error?: string`

**Verhalten:**
- Wenn alle Gesetze fehlschlagen, liefert das Tool `ok: false` mit `UPSTREAM_UNAVAILABLE`.
- Teilfehler werden pro Item in `laws[].error` gemeldet; das Gesamtergebnis bleibt `ok: true`.
- Cache-Hits werden über `meta.notices` signalisiert (`synced:N`, `cached:N`, `failed:N`).

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `UPSTREAM_UNAVAILABLE`

