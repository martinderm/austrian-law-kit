# Tool Contracts (MVP-Stand, laufend nachziehen)

Dieses Dokument definiert die aktuellen Tool-Verträge für das Plugin `austrian-law-kit` auf MVP-Niveau.

## Gemeinsamer Rahmen

- Alle Tools liefern ein gemeinsames Result-Format mit `success` (boolean), optional `data`, optional `error`, optional `meta`.
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

**Zweck:** Abruf eines einzelnen RIS-Eintrags als `norm_segment` inklusive maschinenlesbarem `VerificationReceipt` und Stichtagsprüfung.

**Input:**
- `sourceId?: string` (z. B. RIS-Dokumentnummer wie `NOR40273695`)
- `sourceUrl?: string` (direkte RIS-Dokument-URL oder ELI-URL)
- `contentUrl?: string` (bereits aufgelöste Inhalts-URL)
- `segmentRef?: string` (derzeit außerhalb MVP, führt zu `NOT_IMPLEMENTED`)
- `refresh?: boolean` (optional; ignoriert vorhandenen Cache und holt den Inhalt frisch)
- `stichtag?: string` (optional; ISO-Datum YYYY-MM-DD zur Gültigkeitsprüfung, Default: Tagesdatum)

Regel: mindestens `sourceId`, `sourceUrl` oder `contentUrl` muss vorhanden sein. Alle URLs werden auf vertrauenswürdige RIS-Domains geprüft.

**Output:**
- `artifact`: segmentbezogenes Artefakt (`stable_id`, `frontmatter`, `content`, `metadata`)
- `receipt`: maschinenlesbarer `VerificationReceipt` mit:
  - `source_id`, `gesetzesnummer`, `dokumentnummer`, `eli`, `paragraf`
  - `consolidated_as_of`, `retrieved_at`, `effective_from`, `effective_to`, `kundmachungsorgan`
  - `raw_content_sha256`, `normalized_content_sha256` (Duale SHA-256 Hashes)
  - `cached: boolean` (Provenienzkennzeichnung für lokale Cache-Treffer)
  - `retrieval_method` (`direct_source_id`, `eli_url`, `norm_document_url`, `ris_api_discovery`, `ris_html_search`, `web_search_fallback`)
  - `verification_status` (`verified_current`, `historical_valid_for_stichtag`, `stichtag_mismatch`, `insufficient_metadata`, `unverified_fallback`)
  - `fallback_reason`, `warning`

**Fehlerklassen:**
- `VALIDATION_ERROR` (inkl. unsichere/fremde Domains, ungültige Stichtage)
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE` (inkl. HTTP 503 retryable)
- `NOT_IMPLEMENTED`

## Tool: `ris_fetch_whole_law` (Primärquelle)

**Zweck:** Abruf eines einzelnen RIS-Gesamtdokuments als `norm_document` mit `representation: "whole_law"` und `VerificationReceipt`.

**Fast-Path (Kanonische Gesetze):**
- Wird `query` oder `sourceId` mit einem bekannten Gesetzeskürzel (z. B. `"MRG"`, `"WEG"`, `"HeizKG"`, `"EStG"`, `"ABGB"`) übergeben, löst das Tool direkt über die Kanonische Gesetzesnummern-Tabelle auf die offizielle RIS-Gesamtfassungs-URL auf (`https://www.ris.bka.gv.at/GeltendeFassung.wxe?Abfrage=Bundesnormen&Gesetzesnummer=...`), ohne Suchschleife.

**Input:**
- `query?: string` (Gesetzesname/Kürzel zur automatischen oder kanonischen Auflösung)
- `sourceId?: string` (z. B. RIS-Dokumentnummer, Gesetzeskürzel oder `LAW:Bundesnormen:10002894`)
- `sourceUrl?: string` (direkte RIS-Dokument-URL oder ELI-URL)
- `wholeLawUrl?: string` (bereits aufgelöste Gesamtfassungs-URL)
- `scope?: "bund" | "land" | "municipal"`
- `state?: AustrianState`
- `refresh?: boolean`
- `stichtag?: string`

**Output:**
- `artifact`: dokumentbezogenes Artefakt (`stable_id`, `frontmatter`, `content`, `metadata`)
- `receipt`: maschinenlesbarer `VerificationReceipt` (inkl. `raw_content_sha256`, `normalized_content_sha256`, `cached`)

**Fehlerklassen:**
- `VALIDATION_ERROR` (inkl. unsichere Domains, ungültige Stichtage)
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE` (inkl. HTTP 503 retryable)

## Tool: `ris_sync_laws` (Primärquelle)

**Zweck:** Batch-Synchronisation einzelner Paragrafen mehrerer Gesetze oder ganzer Gesetze in einem einzigen Schritt mit automatischer Deduplizierung.

**Input:**
- `stichtag?: string` (optionaler globaler Stichtag für alle Items)
- `laws: RisSyncLawsItem[]` (Array, mindestens 1 Element)
  - Je Item:
    - `query?: string` (z. B. `"MieWeG § 1"`, `"ABGB § 1096"`, `"HeizKG"`)
    - `sourceId?: string` (z. B. `"NOR40273695"`)
    - `paragraph?: string` (z. B. `"§ 29"`, `"1"`)
    - `wholeLawUrl?: string`
    - `segmentUrl?: string`
    - `scope?: "bund" | "land" | "municipal"`
    - `state?: AustrianState`
    - `refresh?: boolean`
    - `stichtag?: string`

**Output:**
- `total: number` — Gesamtanzahl angeforderter Items
- `synced: number` — frisch aus dem RIS heruntergeladene Items
- `cached: number` — aus Cache oder Deduplizierung bediente Items
- `failed: number` — fehlgeschlagene Abrufe oder nicht auflösbare Stichtagsabweichungen
- `deduplicated?: number` — Anzahl deduplizierter Anfragen im Batch
- `verified_current: number` — am Stichtag tagesaktuell in Kraft befindliche Fassungen
- `historical_valid_for_stichtag: number` — am historischen Stichtag gültige Fassungen
- `stichtag_mismatch: number` — Fassungen, die am gewünschten Stichtag nicht in Kraft waren
- `insufficient_metadata: number` — Treffer mit unzureichenden zeitlichen Metadaten
- `laws: SyncedLawResult[]` — pro Item:
  - `query?: string`
  - `paragraph?: string`
  - `stable_id?: string`
  - `source_id?: string`
  - `title?: string`
  - `law_id?: string`
  - `source_url?: string`
  - `cached: boolean`
  - `ok: boolean` (nur `true`, wenn am Stichtag gültig)
  - `receipt?: VerificationReceipt`
  - `error?: string`
  - `discarded_candidates?: Array<{ source_id?: string; title?: string; reason: string; verification_status?: VerificationStatus }>`

**Verhalten:**
- **Kandidaten-Schleife bei Query-Auflösung**: Wenn ein Paragraf per Query angefordert wird (z. B. `MRG § 3`), prüft `ris_sync_laws` die RIS-Treffer der Reihe nach und verwirft historische Fassungen mit `stichtag_mismatch` automatisch, bis die am Stichtag gültige Fassung ermittelt ist.
- **Fail-Closed Stichtagsdisziplin**: Wird keine am Stichtag gültige Fassung gefunden, meldet das Item `ok: false`, inkrementiert `stichtag_mismatch` und `failed`. `synced` suggeriert keine Aktualität.
- **Deduplizierung**: Dedupliziert über einen mehrdimensionalen Schlüssel (`${representation}::${sourceIdOrUrl}::${paragraph}::${stichtag}`), sodass Anfragen nach demselben Paragrafen mit unterschiedlichen Stichtagen eigenständig geprüft werden.
- Liefert den `VerificationReceipt` pro synchronisiertem Item.

## Tool: `jusline_list_decisions` (Sekundärquelle)

**Zweck:** Abruf von Entscheidungslisten zu einem Paragrafen von JUSLINE mit strukturierter Metadaten-Extraktion und Preview-Caching.

**Input:**
- `query: string` (JUSLINE-URL oder Pfad wie `"stgb/paragraf/111"`, `"mrg/paragraf/2"`)
- `limit?: number` (Standard: 10, max: 30)
- `refresh?: boolean` (Force-Reload unter Umgehung des 24h-Query-Index)

**Output:**
- `hits: SearchHit[]` — Liste gefundener Gerichtsentscheidungen (`stable_id`, `source_id`, `title`, `source_url`, `snippet`)
- Im Hintergrund generierte Preview-Artefakte mit tiefen Metadaten:
  - `case_number` / `geschaeftszahl` (z. B. `5Ob121/08t`, `Ra 2021/05/0123`, `G 12/2023`)
  - `rechtssatznummer` (z. B. `RS0012345`)
  - `court` (z. B. `OGH`, `VwGH`, `VfGH`, `BVwG`, `LG für ZRS Wien`)
  - `published_date` & `published_date_raw`
  - `fundstellen` (Fachzeitschriften-Zitate)
  - `norms` (angewandte Normen)
  - `rechtssatz`, `leitsatz`, `spruch`, `vorinstanzen`, `ecli`

**Fehlerklassen:**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`

## Tool: `jusline_fetch_discussions` (Sekundärquelle)

**Zweck:** Abruf von nicht-amtlichen Diskussionen und Gesetzeskommentaren von JUSLINE-Paragrafseiten.

**Input:**
- `query: string`
- `limit?: number`
- `refresh?: boolean`

**Output:**
- `hits: SearchHit[]` — Liste gefundener Kommentare und Diskussionen mit Autoren-, Bewertungs- und Zeitstempel-Metadaten.

