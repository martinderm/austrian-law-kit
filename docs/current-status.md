# Current Status

Stand: 2026-04-07 (laufend aktualisiert)

## Was bereits umgesetzt ist

### 1) Fachlicher Vertrag (Skill + Doku)
- Quellenpolitik ist festgelegt: **RIS primär**, **JUSLINE sekundär/opt-in**.
- Antwortvertrag mit 4 Schichten ist dokumentiert.
- Trennung von **Arbeitsfassung** vs. **verbindliche Fassung** ist durchgezogen.
- Rechtsberatungsgrenze ist explizit festgelegt.
- Das Workspace-Skill `skills/austrian-law/` bildet den aktuellen MVP-Stand inkl. konkreter RIS-/JUSLINE-MVP-Tools und agentbezogener Cache-Ableitung ab.

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
- `jusline_list_decisions` ist als zweite JUSLINE-MVP-Funktion (Sekundärquelle) produktiv angebunden.
- Cache-Tools bleiben weiterhin Stub-basiert.
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

## Was aktuell noch eingeschränkt ist

- RIS-Produktivlogik umfasst aktuell `ris_search` + `ris_fetch_segment` + `ris_fetch_whole_law` (MVP).
- JUSLINE-MVP umfasst aktuell `jusline_fetch_discussions` + `jusline_list_decisions` als klar getrennte Sekundärquellen-Funktionen.
- Keine tiefe Segment-/Unterstrukturmodellierung, keine inhaltliche Norm-Parserlogik.

## RIS Search (MVP)

- `ris_search` ist als **optionale Discovery-Hilfe** gedacht, nicht als alleiniger Einstiegspunkt für RIS-Abrufe.
- Zweck: aus einer menschlichen Suchanfrage zunächst eine belastbare RIS-Referenz (`sourceId` / `sourceUrl`) ableiten.
- Der Tool-Einstieg enthält jetzt einen kleinen Resolver für häufige Fälle wie direkte `NOR...`-Dokumentnummern oder typische Normreferenzen (`§ 1293 ABGB`, `ABGB 1293`).
- Direkte `NOR...`-Treffer können ohne vorgelagerte RIS-HTML-Suche direkt als Kandidat zurückgegeben werden.
- Für typische Normreferenzen probiert das Tool mehrere normalisierte Suchvarianten und wiederholt Requests bei temporären 5xx-Fehlern in kleinem Rahmen.
- Treffer werden nicht nur roh zurückgegeben, sondern mit `best_candidate`, `match_reason` und grober `confidence` angereichert.
- Der frühere kleine `ris_search`-Härtungsplan (Resolver, Retry/Fallbacks, Ranking, Doku-Nachzug) gilt im Wesentlichen als abgearbeitet; offener Restpunkt ist höchstens weitere Parser-Härtung.
- `ris_search` baut weiterhin RIS-Ergebnis-URLs für Bundesnormen und parst die Trefferliste aus HTML.
- `docType` ist im MVP auf `norm` beschränkt; andere Werte liefern explizit `NOT_IMPLEMENTED`.
- Bekannte operative Grenzen: je nach RIS-Verhalten sind 0 Treffer trotz plausibler Query oder Upstream-Fehler weiterhin möglich; daher bleibt ein Fallback auf bekannte Dokumentnummern, direkte RIS-URLs oder alternative Auflösung einzuplanen.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED` ohne stille Fallbacks.

## RIS Fetch Segment (MVP)

- `ris_fetch_segment` lädt einen einzelnen RIS-Eintrag via `sourceId` oder `sourceUrl`.
- Ergebnis ist ein `norm_segment`-Artifact mit Pflicht-Frontmatter + minimal bereinigtem `content`.
- `segmentRef` ist bewusst außerhalb des MVP und liefert explizit `NOT_IMPLEMENTED`.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED`.

## RIS Fetch Whole Law (MVP)

- `ris_fetch_whole_law` lädt ein RIS-Gesamtdokument via `sourceId` oder `sourceUrl`.
- Ergebnis ist ein `norm_document`-Artifact mit Pflicht-Frontmatter + minimal bereinigtem `content`.
- `stable_id` wird robust aus `source_id` abgeleitet; keine leeren Stable IDs.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`.

## JUSLINE Discussions (MVP)

- `jusline_fetch_discussions` lädt Diskussionen/Kommentare von JUSLINE-Paragrafseiten.
- Unterstützt JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`.
- Extrahiert nur Kommentar-/Diskussions-Hits (`title`, `source_url`, `source_id`, optional `snippet`).
- Entscheidungen/Judikatur auf derselben Seite werden bewusst ignoriert.
- Aus geeigneten Treffern können ergänzende Kommentar-Preview-Artefakte erzeugt werden.
- Diese Preview-Artefakte enthalten, wenn verfügbar, zusätzliche Metadaten wie Autor/in, Zitiervorschlag, Datum, Bewertung, Aufrufe, Versionshinweis und extrahierten Kontext.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`.

## JUSLINE Decisions (MVP)

- `jusline_list_decisions` lädt Entscheidungslisten von JUSLINE-Paragrafseiten.
- Unterstützt JUSLINE-URL oder Pfadform wie `stgb/paragraf/111`.
- Extrahiert nur Entscheidungs-Hits (`title`, `source_url`, `source_id`, optional `snippet`).
- Diskussionen/Kommentare auf derselben Seite werden bewusst ignoriert.
- Aus geeigneten Listentreffern können ergänzende Entscheidungs-Preview-Artefakte erzeugt werden.
- Diese Preview-Artefakte können, wenn verfügbar, zusätzliche Angaben wie Dokumenttyp, Gericht, Datum, Normen, Rechtssatz, Entscheidungstexte und ECLI enthalten.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`.

## Cache-Schicht (neu geschärft)

- Cache-Root wird pro Tool-Aufruf aus dem Plugin-Tool-Kontext abgeleitet: standardmäßig aus dem Workspace des aufrufenden Agenten, optional mit `api.pluginConfig.cacheRoot` als Override; Env-Var bleibt nur Fallback.
- Beim Lesen wird Konsistenz geprüft: `frontmatter.source` und `frontmatter.doc_type` müssen zum angefragten Pfad passen, sonst `CONFLICT`.
- RIS-Fetch-Tools nutzen optionales write-through Caching (Best-Effort, kein Hard-Fail auf Cache-Schreibfehler).
- RIS-Fetch-Tools nutzen gezielte Cache-Read-Wiederverwendung bei eindeutigem Stable-ID-Match (kein globales Cache-First).
- Meta-Signale: `cache_hit` als `notices`, Cache-Probleme (`cache_conflict`/`cache_read_failed`/`cache_write_failed`) als `warnings`.
- Kleine RIS-MVP-Härtung: gemeinsame Mini-Helfer für Source-ID-Auflösung/Cache-Meta reduzieren Duplikate ohne Verhaltensänderung.
- Parser-Härtung: robustere Titel-/Content-Fallbacks und toleranteres HTML-Decoding bei kleinen Seitenvariationen.
- RIS-Parser wurden gegen echte Live-Snapshots nachgeschärft, damit Segment-/Whole-Law-Fetches den Normtext statt Navigationsstub extrahieren.
- RIS-Segment-Artefakte enthalten jetzt exemplarisch reichere Metadaten wie Kurztitel, Abkürzung, Slug, Typ, Inkrafttretensdatum, Index, Kundmachungsorgan und Überschrift.
- Fetch-Tools unterstützen jetzt optional `refresh`, um vorhandene Cache-Artefakte gezielt zu ignorieren und frisch neu zu laden.
- JUSLINE nutzt zusätzlich einen Query-Index mit 24h TTL über `query + kind + limit`; bei `refresh=true` wird dieser Index bewusst ignoriert und frisch aufgebaut, inklusive Bypass von Query-Index- und Artefakt-Reuse.
- JUSLINE-MVP-Härtung: robustere Link-/Snippet-Erkennung, sauberere Negativfälle und zusätzliche Fixture-Varianten ohne Vertragsänderung.
- JUSLINE-Preview-Artefakte für Kommentare und Entscheidungen werden als ergänzende Kontextbausteine serialisiert; sie bleiben ausdrücklich Sekundärquelle.
- Kleine ausführbare Parser-Smoke-Tests decken jetzt RIS- und JUSLINE-MVP-Parser direkt gegen Fixtures ab.
- Kleine ausführbare Tool-Smoke-Tests decken jetzt die bestehenden RIS-/JUSLINE-MVP-Tools mit kontrollierten Fetch-Mocks ab.
- Tool-Fabrik-Smoketests prüfen zusätzlich die agentbezogene Cache-Ableitung: ohne Override landet RIS-Cache im Workspace des aufrufenden Agenten, mit `cacheRoot`-Override am konfigurierten Ziel.
- Für die lokale Nutzung gibt es jetzt getrennte Skripte für Parser-/Tool-Smoke-Tests plus ein gemeinsames `test:smoke`-Skript.
- Die Smoke-Tests prüfen zusätzlich einige gezielte Edge-Cases wie Deduplizierung, optionale Snippets und gemischte Linktypen.

## Wichtigste Architekturentscheidungen

1. **Repository-first** statt instanzspezifischer Direktlösung.
2. **Manifest-first Pluginstruktur** (OpenClaw-konforme Basis).
3. **Vertragsgetriebene Entwicklung**: Doku-Vertrag -> TS-Typen -> Laufzeitschemas.
4. **RIS-first Policy** als harte Leitplanke.
5. **Deterministische Stable-ID-/Cache-Helfer** vor externer Logik.

## Bekannte Risiken

- Feldverfügbarkeit/Benennung in echten RIS-/JUSLINE-Antworten kann von Annahmen abweichen.
- Vereinfachte YAML-Serialisierung ist absichtlich eingeschränkt.
- Die naheliegende Alternative zu Regex ist ein echter HTML-Parser mit DOM-/Selektor-Zugriff; sollte eingebaut werden.

## Empfohlene nächste 3 Schritte (Reihenfolge)

1. **Gezielte Tests/Fixtures für JUSLINE-Entscheidungslisten erweitern** (ohne RIS-Änderungen).
2. **Parser mittelfristig auf DOM-/Selektor-Basis umstellen** (Regex nur als MVP-Übergang).
3. **Gezielte automatisierte Tests erweitern** (Cache-/Meta-Signal-Edge-Cases).
