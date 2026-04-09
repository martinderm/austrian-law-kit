# Current Status

Stand: 2026-04-08 (laufend aktualisiert)

## Kurzstand 2026-04-08

- Der RIS-API-Migrationsblock ist auf Branch `feat/ris-api-client` fachlich und technisch umgesetzt und nach GitHub gepusht.
- Der reale OpenClaw-Toolvertrag wurde extern über `avvocado` gegengeprüft.
- `ris_search` akzeptiert jetzt im Live-Betrieb wieder `scope`, `state` und `municipality`.
- `ris_search(scope="land", state="Oberösterreich", query="Bauordnung")` liefert live reguläre Landesrecht-Treffer, u. a. `LOO11000699` (`Oö. Bauordnung 1994`).
- `ris_fetch_whole_law(sourceId="NOR40214078")` liefert live wieder ein echtes Whole-Law-Artifact mit korrekter `GeltendeFassung.wxe?...`-URL.
- Der konkrete Gemeinderecht-Testfall `Flächenwidmungsplan` / `Gänserndorf` lief technisch sauber, ergab aber `NOT_FOUND`.
- Die frühere Runtime-Diskrepanz war kein reiner Repo-Codefehler, sondern hing am real geladenen Plugin-Zustand; bereinigt wurden doppelter Ladepfad plus ergänzte Plugin-Konfiguration (`risApiBaseUrl`).
- Offen für morgen: Merge-/Abschlussschritt nach `master`, letzter Gesamtcheck und ggf. Schlussdoku für Release-Nähe.

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
- Der Tool-Einstieg enthält einen Resolver für häufige Fälle wie direkte `NOR...`-/`LOO...`-Dokumentnummern oder typische Normreferenzen (`§ 1293 ABGB`, `ABGB 1293`).
- Direkte Dokumentnummern können ohne vorgelagerte Suche direkt als Kandidat zurückgegeben werden.
- Für Bundesrecht läuft Discovery nun **API-first** über die offizielle OGD-RIS-API (`/Bundesrecht`, `Applikation=BrKons`); HTML-Suche bleibt Fallback.
- Für Landesrecht gibt es einen ersten API-Pfad (`/Landesrecht`, `Applikation=LrKons`) mit explizitem Bundesland-Kontext, zusätzlichem clientseitigem State-Filter und state-spezifischen Titelvarianten (z. B. `Burgenländisches Baugesetz`, `Oö. Bauordnung`, `Wiener Bauordnung`), weil die API-Flags laut Live-Tests nicht zuverlässig nur das gewünschte Bundesland zurückliefern.
- Für Gemeinderecht gibt es jetzt einen öffentlichen API-Pfad über `ris_search` mit `scope: "municipal"`; gesucht wird über `/Gemeinden` mit `Applikation=Gr` oder `GrA`, optional scoped nach Bundesland, Gemeinde und Bezirk.
- Extern live bestätigt: Nach Bereinigung des doppelten Plugin-Ladepfads und ergänzter Plugin-Konfiguration akzeptiert der real exponierte Tool-Vertrag jetzt `scope`, `state`, `municipality` und liefert für Landesrecht wieder reguläre Treffer statt Schemafehler.
- Für typische Normreferenzen probiert das Tool mehrere normalisierte Suchvarianten; bei API-Ausfall oder fehlenden Treffern wird auf HTML-Fallback mit Retry bei temporären 5xx-Fehlern zurückgegangen.
- Treffer werden nicht nur roh zurückgegeben, sondern mit `best_candidate`, `match_reason`, grober `confidence` sowie ersten Metadaten wie `application`, `scope`, `law_id`, `content_url`, `whole_law_url`, `document_type`, `legal_type`, `section_ref`, `municipality` und `district` angereichert.
- Der frühere kleine `ris_search`-Härtungsplan (Resolver, Retry/Fallbacks, Ranking, Doku-Nachzug) gilt im Wesentlichen als abgearbeitet; offener Restpunkt ist höchstens weitere Parser-Härtung.
- `docType` ist im MVP auf `norm` beschränkt; andere Werte liefern explizit `NOT_IMPLEMENTED`.
- Bekannte operative Grenzen: Landesrecht liefert über die API derzeit teils state-fremde Treffer trotz gesetztem Bundesland-Flag; state-spezifische Titelvarianten verbessern die Trefferlage deutlich, aber es gibt noch keine Garantie für beliebige freie Landes-Suchanfragen. Konkreter offener Fall aus der Live-Prüfung: Niederösterreich liefert für `Bauordnung` derzeit bevorzugt die `Authentische Interpretation NÖ Bauordnung 2014 ...` statt der Stammnorm. Dieser Sonderfall ist bewusst dokumentiert und bis auf Weiteres geparkt.
- Für den History-Endpunkt existiert jetzt ein interner typed Raw-Client; live funktionierte das Zeitfenster ohne `Anwendung`-Filter, während getestete `Anwendung`-Werte (`BrKons`, `LrKons` etc.) derzeit zu API-Fehlern führten.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED` ohne stille Fallbacks.

## RIS Fetch Segment (MVP)

- `ris_fetch_segment` lädt einen einzelnen RIS-Eintrag via `sourceId` oder `sourceUrl`.
- Wenn nur `sourceId` vorliegt, versucht das Tool jetzt zuerst einen offiziellen RIS-API-Lookup und bevorzugt daraus für den eigentlichen Abruf zuerst `xml_content_url`, sonst `content_url`.
- Für komplexere RIS-Segmente wird damit bevorzugt die XML-Repräsentation interpretiert; HTML bleibt Fallback.
- Ergebnis ist ein `norm_segment`-Artifact mit Pflicht-Frontmatter + minimal bereinigtem `content`.
- API-abgeleitete Zusatzinfos wie `application`, `scope`, `state`, `law_id`, `content_url`, `xml_content_url`, `whole_law_url` landen zusätzlich unter `metadata.ris_api`, sofern verfügbar.
- `segmentRef` ist bewusst außerhalb des MVP und liefert explizit `NOT_IMPLEMENTED`.
- Fehlerbehandlung: `VALIDATION_ERROR`, `NOT_FOUND`, `UPSTREAM_UNAVAILABLE`, `NOT_IMPLEMENTED`.

## RIS Fetch Whole Law (MVP)

- `ris_fetch_whole_law` lädt ein RIS-Gesamtdokument via `sourceId` oder `sourceUrl`.
- Wenn nur `sourceId` vorliegt, versucht das Tool jetzt zuerst einen offiziellen RIS-API-Lookup und bevorzugt daraus eine passende `whole_law_url` (`GeltendeFassung.wxe`) für den eigentlichen Abruf.
- Extern live bestätigt: Für `ris_fetch_whole_law(sourceId="NOR40214078")` verwendet der reale Laufzeitpfad nun wieder die korrekte `GeltendeFassung.wxe?...`-URL und liefert ein Whole-Law-Artifact statt des früheren alten Dokument-Links.
- Zusätzlich gehärtet: `ris_fetch_whole_law` akzeptiert nun auch direkte `GeltendeFassung.wxe?...&Gesetzesnummer=...`-URLs ohne `Dokumentnummer`; dazu existiert ein gezielter Regressionstest.
- Whole-Law-Artefakte setzen jetzt `representation=whole_law` im Frontmatter und in den JSON-Metadaten; der kanonische Titel wird dabei auf den eigentlichen Langtitel der Norm reduziert.
- Ergebnis ist ein `norm_document`-Artifact mit Pflicht-Frontmatter + minimal bereinigtem `content`.
- API-abgeleitete Zusatzinfos wie `application`, `scope`, `state`, `law_id`, `content_url`, `whole_law_url` landen zusätzlich unter `metadata.ris_api`, sofern verfügbar.
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
- Zusätzlicher Regressionstest für den konkreten StGB-§-111-Fall (`NOR40173633`) stellt sicher, dass nicht bloß Kurztitel-Metadaten, sondern der eigentliche Paragraphentext extrahiert wird.
- RIS-Segment-Artefakte enthalten jetzt exemplarisch reichere Metadaten wie Kurztitel, Abkürzung, Slug, Typ, Inkrafttretensdatum, Index, Kundmachungsorgan und Überschrift.
- Neu geschärft: Der problematische StGB-Fall `NOR40254282` mit verschachtelten Listen wird über XML jetzt vollständig genug extrahiert, ohne die frühere HTML-Regex-Bastelei weiter aufzublasen.
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
