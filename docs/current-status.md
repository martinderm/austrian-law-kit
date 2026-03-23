# Current Status

Stand: 2026-03-23 (laufend aktualisiert)

## Was bereits umgesetzt ist

### 1) Fachlicher Vertrag (Skill + Doku)
- Quellenpolitik ist festgelegt: **RIS primär**, **JUSLINE sekundär/opt-in**.
- Antwortvertrag mit 4 Schichten ist dokumentiert.
- Trennung von **Arbeitsfassung** vs. **verbindliche Fassung** ist durchgezogen.
- Rechtsberatungsgrenze ist explizit festgelegt.

Relevante Dateien:
- `skills/austrian-law/SKILL.md`
- `docs/source-policy.md`
- `docs/response-contract.md`

### 2) Datenvertrag (Stable ID, Frontmatter, Memory-Layout)
- Stable-ID-Strategie inkl. Fallbacks und verbotener Bestandteile dokumentiert.
- Frontmatter-Pflicht-/Optionalfelder dokumentiert.
- Zielstruktur unter `memory/references/austrian-law/` inkl. Index-Logik dokumentiert.

Relevante Dateien:
- `docs/stable-id-strategy.md`
- `docs/frontmatter-schema.md`
- `docs/memory-layout.md`

### 3) Plugin-Skelett (OpenClaw-formnah)
- Manifest vorhanden (`openclaw.plugin.json`) mit dokumentierten Feldern.
- `package.json` mit `openclaw.extensions` vorhanden.
- Root-Entry-Point vorhanden (`plugin/openclaw-austrian-law/index.ts`).

Relevante Dateien:
- `plugin/openclaw-austrian-law/openclaw.plugin.json`
- `plugin/openclaw-austrian-law/package.json`
- `plugin/openclaw-austrian-law/index.ts`

### 4) Tool-Verträge + Registry
- Tool-Verträge sind typisiert (`src/types/tool-contracts.ts`).
- Zentrale Definitions-/Registry-Schicht vorhanden.
- `ris_search` ist als erste RIS-MVP-Funktion produktiv angebunden.
- `ris_fetch_segment` ist als zweite RIS-MVP-Funktion produktiv angebunden.
- `ris_fetch_whole_law` ist als dritte RIS-MVP-Funktion produktiv angebunden.
- `jusline_fetch_discussions` ist als erste JUSLINE-MVP-Funktion (Sekundärquelle) produktiv angebunden.
- übrige Tools sind weiterhin Stub-basiert.
- Laufzeitnahe Input-Schemaobjekte vorhanden.
- Lokale Registry-Konsistenzprüfung vorhanden.

Relevante Dateien:
- `plugin/openclaw-austrian-law/src/tools/definitions.ts`
- `plugin/openclaw-austrian-law/src/tools/registry.ts`
- `plugin/openclaw-austrian-law/src/tools/schemas.ts`
- `plugin/openclaw-austrian-law/src/tools/validate-registry.ts`

### 5) Lokale Cache-Schicht (mit I/O)
- Stable-ID-Helfer implementiert.
- Relative Cache-Pfade ableitbar.
- Markdown+Frontmatter und Metadata-JSON serialisierbar.
- Lokale Dateisystem-I/O für Lesen/Schreiben vorhanden.
- Konsistenzprüfung beim Lesen vorhanden (`source`/`doc_type` gegen Pfadkontext).

Relevante Dateien:
- `plugin/openclaw-austrian-law/src/cache/stable-id.ts`
- `plugin/openclaw-austrian-law/src/cache/cache-paths.ts`
- `plugin/openclaw-austrian-law/src/cache/serialize-artifact.ts`
- `plugin/openclaw-austrian-law/src/cache/parse-artifact.ts`
- `plugin/openclaw-austrian-law/src/cache/cache-runtime.ts`
- `plugin/openclaw-austrian-law/src/cache/cache-io.ts`

## Was aktuell nur Scaffold/Stub ist

- RIS-Produktivlogik umfasst aktuell `ris_search` + `ris_fetch_segment` + `ris_fetch_whole_law` (MVP).
- `jusline_list_decisions` bleibt Stub-basiert (`NOT_IMPLEMENTED`).
- Keine tiefe Segment-/Unterstrukturmodellierung, keine inhaltliche Norm-Parserlogik.
- `law_cache_get` / `law_cache_put` arbeiten lokal über Dateisystem-I/O (ohne Netzlogik).

## RIS Search (MVP)

- `ris_search` baut eine RIS-Ergebnis-URL für Bundesnormen und ruft die Trefferliste via HTTP ab.
- Ergebnis-Mapping liefert `title`, `source_url`, optional `source_id` und `stable_id` (nur wenn robust ableitbar).
- `docType` ist im MVP auf `norm` beschränkt; andere Werte liefern explizit `NOT_IMPLEMENTED`.
- Fehlerbehandlung: `VALIDATION_ERROR`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED` ohne stille Fallbacks.

## RIS Fetch Segment (MVP)

- `ris_fetch_segment` lädt einen einzelnen RIS-Eintrag via `sourceId` oder `sourceUrl`.
- Ergebnis ist ein `norm_segment`-Artifact mit Pflicht-Frontmatter + minimal bereinigtem `content`.
- `segmentRef` ist bewusst außerhalb des MVP und liefert explizit `NOT_IMPLEMENTED`.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED`.

## RIS Fetch Whole Law (MVP, neu)

- `ris_fetch_whole_law` lädt ein RIS-Gesamtdokument via `sourceId` oder `sourceUrl`.
- Ergebnis ist ein `norm_document`-Artifact mit Pflicht-Frontmatter + minimal bereinigtem `content`.
- `stable_id` wird robust aus `source_id` abgeleitet; keine leeren Stable IDs.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`.

## JUSLINE Discussions (MVP, neu)

- `jusline_fetch_discussions` lädt Diskussionen/Kommentare von JUSLINE-Paragrafseiten.
- Unterstützt JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`.
- Extrahiert nur Kommentar-/Diskussions-Hits (`title`, `source_url`, `source_id`, optional `snippet`).
- Entscheidungen/Judikatur auf derselben Seite werden bewusst ignoriert.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`.

## Cache-Schicht (neu geschärft)

- Cache-Root wird beim Plugin-Register aus `api.pluginConfig.cacheRoot` gebunden und in die Cache-I/O-Schicht injiziert; Env-Var ist nur Fallback.
- `law_cache_get` akzeptiert optional `docType` zur Reduktion der DocType-Heuristik.
- Beim Lesen wird Konsistenz geprüft: `frontmatter.source` und `frontmatter.doc_type` müssen zum angefragten Pfad passen, sonst `CONFLICT`.
- RIS-Fetch-Tools nutzen optionales write-through Caching (Best-Effort, kein Hard-Fail auf Cache-Schreibfehler).
- RIS-Fetch-Tools nutzen gezielte Cache-Read-Wiederverwendung bei eindeutigem Stable-ID-Match (kein globales Cache-First).
- Meta-Signale: `cache_hit` als `notices`, Cache-Probleme (`cache_conflict`/`cache_read_failed`/`cache_write_failed`) als `warnings`.
- Kleine RIS-MVP-Härtung: gemeinsame Mini-Helfer für Source-ID-Auflösung/Cache-Meta reduzieren Duplikate ohne Verhaltensänderung.
- Parser-Härtung: robustere Titel-/Content-Fallbacks und toleranteres HTML-Decoding bei kleinen Seitenvariationen.

## Wichtigste Architekturentscheidungen

1. **Repository-first** statt instanzspezifischer Direktlösung.
2. **Manifest-first Pluginstruktur** (OpenClaw-konforme Basis).
3. **Vertragsgetriebene Entwicklung**: Doku-Vertrag -> TS-Typen -> Laufzeitschemas.
4. **RIS-first Policy** als harte Leitplanke.
5. **Deterministische Stable-ID-/Cache-Helfer** vor externer Logik.

## Bekannte Risiken

- Feldverfügbarkeit/Benennung in echten RIS-/JUSLINE-Antworten kann von Annahmen abweichen.
- Vereinfachte YAML-Serialisierung ist absichtlich eingeschränkt.
- DocType-Heuristik in `law_cache_get` bleibt als Übergang aktiv, solange `docType` nicht immer explizit mitgegeben wird.
- Die naheliegende Alternative zu Regex ist ein echter HTML-Parser mit DOM-/Selektor-Zugriff; sollte eingebaut werden.

## Empfohlene nächste 3 Schritte (Reihenfolge)

1. **`jusline_list_decisions` optional evaluieren** (klar getrennt von `jusline_fetch_discussions`, weiterhin Sekundärquelle).
2. **Parser mittelfristig auf DOM-/Selektor-Basis umstellen** (Regex nur als MVP-Übergang).
3. **Gezielte automatisierte Tests erweitern** (JUSLINE-MVP + Cache-/Meta-Signal-Edge-Cases).
