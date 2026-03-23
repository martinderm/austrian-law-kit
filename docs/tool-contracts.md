# Tool Contracts (Planungsstand, ohne Implementierung)

Dieses Dokument definiert die geplanten Tool-Verträge für das Plugin `openclaw-austrian-law`.

## Gemeinsamer Rahmen

- Alle Tools liefern ein gemeinsames Result-Format mit `ok`, optional `data`, optional `error`, optional `meta`.
- Fehler folgen einer gemeinsamen Fehlerstruktur mit `code`, `message`, optional `details`, optional `retryable`.
- **Primärquelle:** RIS
- **Sekundärquelle:** JUSLINE (nur bei fachlich explizitem Bedarf)

## Tool: `ris_search` (Primärquelle)

**Zweck:** Suche nach Rechtsquellen/Normtreffern in RIS.

**Input (geplant):**
- `query: string`
- `limit?: number`
- `docType?: "norm" | "decision" | "material"`

**Output (geplant):**
- Trefferliste mit Referenzen (`stable_id`, `source_id`, `title`, `source_url`, optional `snippet`)

**Fehlerklassen (geplant):**
- `VALIDATION_ERROR`
- `NOT_IMPLEMENTED`
- `UPSTREAM_UNAVAILABLE`

## Tool: `ris_fetch_segment` (Primärquelle)

**Zweck:** Abruf eines einzelnen RIS-Eintrags als `norm_segment` (MVP).

**Input (MVP):**
- `sourceId?: string` (z. B. RIS-Dokumentnummer)
- `sourceUrl?: string` (direkte RIS-Dokument-URL)
- `segmentRef?: string` (derzeit außerhalb MVP, führt zu `NOT_IMPLEMENTED`)

Regel: mindestens `sourceId` oder `sourceUrl` muss vorhanden sein.

**Output (MVP):**
- segmentbezogenes Artefakt (`stable_id`, `frontmatter`, `content`)
- Frontmatter enthält mindestens Pflichtfelder plus `source_id`, wenn belastbar ableitbar

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

Regel: mindestens `sourceId` oder `sourceUrl` muss vorhanden sein.

**Output (MVP):**
- dokumentbezogenes Artefakt (`stable_id`, `frontmatter`, `content`)
- Frontmatter enthält mindestens Pflichtfelder plus `source_id`, wenn belastbar ableitbar

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`

## Tool: `jusline_fetch_discussions` (Sekundärquelle)

**Zweck:** Optionale Abrufe von Diskussionen/Kommentaren aus JUSLINE (MVP).

**Input (MVP):**
- `query: string` (JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`)
- `limit?: number`

**Output (MVP):**
- Materialliste (`stable_id`, `source_id`, `title`, `source_url`, optional `snippet`)

**Fehlerklassen (MVP):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UPSTREAM_UNAVAILABLE`
- `NOT_IMPLEMENTED` (nur außerhalb MVP)

## Tool: `jusline_list_decisions` (Sekundärquelle)

**Zweck:** Optionale Auflistung von Entscheidungen aus JUSLINE.

**Input (geplant):**
- `query: string`
- `limit?: number`

**Output (geplant):**
- Entscheidungsreferenzen (`stable_id`, `source_id`, `title`, `source_url`)

**Fehlerklassen (geplant):**
- `VALIDATION_ERROR`
- `POLICY_BLOCKED`
- `NOT_IMPLEMENTED`

## Tool: `law_cache_get` (intern)

**Zweck:** Lesen eines Cache-Artefakts per Stable ID.

**Input (geplant):**
- `stableId: string`
- `docType?: "norm_segment" | "norm_document" | "decision" | "discussion" | "commentary"`
- `includeMetadata?: boolean`

**Output (geplant):**
- Cacheeintrag (`stable_id`, `content`, optional `metadata`)

**Fehlerklassen (geplant):**
- `VALIDATION_ERROR`
- `NOT_FOUND`
- `NOT_IMPLEMENTED`

## Tool: `law_cache_put` (intern)

**Zweck:** Schreiben/Aktualisieren eines Cache-Artefakts.

**Input (geplant):**
- `stableId: string`
- `frontmatter: Record<string, unknown>`
- `content: string`
- `metadata?: Record<string, unknown>`

**Output (geplant):**
- Speicherbestätigung (`stable_id`, `updated`, optional `path`)

**Fehlerklassen (geplant):**
- `VALIDATION_ERROR`
- `CONFLICT`
- `NOT_IMPLEMENTED`
