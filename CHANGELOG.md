# Changelog

## 0.18.1 - Exakte Abschnittsauflösung, XML-Konsistenz & CLI-Fehlersemantik
- Exakte Paragrafenfilter leiten die Kennung vorrangig aus `section_ref` ab; `KSchG § 6` akzeptiert damit keine Treffer für `§§ 6a–6c`, selbst wenn das RIS-Feld `Paragraphnummer` nur `6` enthält.
- API-Suchergebnisse tragen `xml_content_url`; query-basierte Segment-Synchronisation verwendet XML-first mit HTML-Fallback. Raw-Hashes bewahren die konkrete Upstream-Repräsentation, normalisierte Hashes gleichen reine Darstellungsunterschiede aus.
- Reine Stichtagsfehler liefern `NO_VALID_VERSION_FOR_STICHTAG` (`retryable: false`) statt `UPSTREAM_UNAVAILABLE`.
- Die CLI wertet sowohl `success: false` als auch `ok: false` als Fehlschlag und setzt nach Ausgabe des JSON einen Exit-Code ungleich null.
- Paket-, Lockfile-, Plugin-Manifest-, User-Agent- und Dokumentationsversion sind auf `0.18.1` synchronisiert; Regressionstests decken die neuen Verträge ab.

## 0.18.0 - Stichtagsbezogene Auflösung konsolidierter RIS-Normen & Robuste Batch-Synchronisation
- **Stichtagsbezogenes Suchranking (`src/ris/search-ranking.ts` & `src/tools/ris_search.ts`)**:
  - `rankRisSearchHits` bewertet Kandidaten anhand von `effective_from`, `effective_to`, `norm_status`, `consolidated_as_of` und dem gewünschten Stichtag (Zeitzone `Europe/Vienna`).
  - Am Stichtag in Kraft befindliche Fassungen (`verified_current` / `historical_valid_for_stichtag`) erhalten einen starken Ranking-Bonus (`+250`), abgelaufene oder noch nicht in Kraft getretene Fassungen (`stichtag_mismatch`) einen deutlichen Abzug (`-300`).
  - Historische Fassungen (z. B. `NOR12040713` für `MRG § 3` oder `NOR40045312` für `KSchG § 6`) werden nicht mehr allein wegen exakter Paragraphenübereinstimmung als `best_candidate` priorisiert.
- **Kandidaten-Prüfschleife in `ris_sync_laws` (`src/tools/ris_sync_laws.ts`)**:
  - Bei Query-Auflösung (z. B. `MRG § 3` am Stichtag `2026-08-28`) evaluiert `ris_sync_laws` die RIS-Treffer der Reihe nach: Historische Fassungen mit `stichtag_mismatch` werden automatisch verworfen (und in `discarded_candidates` dokumentiert), bis die am Stichtag gültige Fassung (`NOR40167127`) ermittelt ist.
  - Wird kein Treffer am Stichtag gefunden, schlägt das Item fail-closed mit deklariertem `stichtag_mismatch` und `ok: false` fehl; keine historische Fassung wird als erfolgreicher Sync gezählt.
- **Differenzierte Batch-Zähler (`src/types/tool-contracts.ts` & `src/tools/ris_sync_laws.ts`)**:
  - `RisSyncLawsOutput` liefert getrennte Zähler für `verified_current`, `historical_valid_for_stichtag`, `stichtag_mismatch`, `insufficient_metadata`, `synced`, `cached`, `failed`. `synced` suggeriert keine Aktualität.
- **Strukturierte Netzwerkfehler-Diagnose**:
  - Bei Netzwerkfehlern (z. B. `fetch failed`) geben alle Tools (`ris_fetch_segment`, `ris_fetch_whole_law`, `ris_search`, `ris-api/client.ts`) `retryable: true`, Fehlerphase (`phase`) und Upstream-URL nachvollziehbar im Fehlerobjekt aus.
- **Erweiterte Regressions-Suite (`tests/legal-regression.test.ts`)**:
  - 4 neue Regressionstests für `MRG § 3` (`NOR40167127`), `KSchG § 6` (`NOR40274264`), gemischte Stichtags-Batches und Netzwerkfehler-Diagnose (76 Tests über 6 Testsuiten zu 100% grün).

## 0.17.0 - JUSLINE Detail-Extraktion für Gerichtsentscheidungen
- **Strukturierte Metadaten-Extraktion aus JUSLINE-Entscheidungen (`src/jusline/decision-detail.ts`)**:
  - **Gerichtliche Geschäftszahl (`case_number` / `geschaeftszahl`)**: Automatische Erkennung und Normalisierung von Geschäftszahlen für alle österreichischen Höchst- und Instanzgerichte (OGH wie `5Ob121/08t`, `1Ob23/15k`, `9Os12/21p`; VwGH wie `Ra 2021/05/0123`; VfGH wie `G 12/2023`, `V 45/2022`, `B 123/2012`; BVwG wie `W123 2123456-1`; LVwG wie `LVwG-AV-123/001-2022`).
  - **OGH-Rechtssatznummer (`rechtssatznummer`)**: Automatische Extraktion kanonischer RS-Nummern (`RS0012345`) für nahtlose Querbezüge zum RIS-Justiz-Datenbestand.
  - **Erkennendes Gericht (`court`)**: Strukturierte Erkennung von OGH, VwGH, VfGH, BVwG, LVwG, OLG, LG für ZRS/Strafsachen, BG.
  - **Entscheidungs- und Spruchdatum**: Robustes Parsing von österreichischen Datumsformaten (`DD.MM.YYYY` und `YYYY/M/D`) mit Konvertierung in ISO `YYYY-MM-DD`.
  - **ECLI-Extraktion (`ecli`)**: Flexible Erkennung von `ECLI:AT:...` sowohl über JUSLINE-Link-Präfixe als auch über globale ECLI-Muster.
  - **Fundstellen & Publikationen (`fundstellen`)**: Automatische Erfassung von Zitaten in führenden österreichischen Fachzeitschriften (SZ, EvBl, wobl, immolex, ecolex, RdW, Zak, JBl, ÖJZ, ZVR, MietSlg).
  - **Gliederungsabschnitte**: Saubere Trennung von `rechtssatz`, `leitsatz`, `spruch`, `vorinstanzen` (Verfahrensgang), `schlagworte` und `entscheidungstexte`.
- **Flexible HTML-Label-Extraktion (`src/jusline/common.ts`)**:
  - `takeHtmlAfterStrongLabel` und `takeTextAfterStrongLabel` unterstützen jetzt neben dem Standard-JUSLINE-Muster auch Überschriften (`<h3>`, `<h4>`), Definitionslisten (`<dt>/<dd>`) und Inline-Labels.
- **Erweitertes Markdown- und Frontmatter-Schema (`src/jusline/artifact-previews.ts` & `src/types/frontmatter.ts`)**:
  - Decision-Artefakte enthalten im Frontmatter und Markdown-Kopf strukturierte Metadatenfelder (`case_number`, `rechtssatznummer`, `court`, `fundstellen`, `ecli`, `norms`).
- **Neue Test-Suite (`tests/jusline-decision-detail.test.ts`)**:
  - 9 spezialisierte Komponententests für Geschäftszahlen-, ECLI-, RS-Nummern-, Datums-, Fundstellen- und Listenparsing (6 Testsuiten mit insgesamt 72 Tests zu 100% grün).

## 0.16.0 - Kanonische RIS-Gesetzesnummern-Tabelle & Fail-Closed RIS-Verifikation
- **Kanonische Gesetzesnummern-Tabelle (`src/ris/canonical-laws.ts`)**:
  - Vorindizierte $O(1)$-Registry für über 50 österreichische Kern-Bundesgesetze (ABGB, MRG, WEG, WGG, HeizKG, MieWeG, KSchG, FAGG, VRUG, VKrG, HIKrG, UGB, GmbHG, AktG, GewO, EStG, UStG, BAO, GebG, GrEStG, B-VG, AVG, VStG, VVG, VwGVG, VwGG, VfGG, SPG, DSG, StGB, StPO, StVO, KFG, ZPO, JN, EO, IO, ASVG, AngG, ArbVG, AZG, ARG, UrlG, DHG, UWG, KartG, UrhG, PatG, MSchG, BVergG).
  - Deterministische Lookups nach Slug, Standard-Abkürzung, Gesetzesnummer oder Alias.
- **API-Suchbeschleunigung**:
  - `resolveRisQuery` reichert Normzitate und Freitexte automatisch mit `lawId` (`Gesetzesnummer`) und `canonicalTitle` an.
  - `searchBundesrechtApi` setzt bei vorhandener `lawId` prioritäre Suchversuche mit exakter `Gesetzesnummer` (`law_id+paragraph_field`), wodurch Treffer unmittelbar auf Seite 1 gefunden werden.
- **Fast-Path für Gesamtfassungen**:
  - `ris_fetch_whole_law` löst bekannte Gesetzeskürzel (z. B. `query: "MRG"`, `sourceId: "HeizKG"`) direkt auf die offizielle RIS-Gesamtfassungs-URL auf, ohne vorgelagerte Suchschleifen.
- **Fail-Closed Verification Receipt & Metadaten**:
  - Exakte Datumsvalidierung im Format `YYYY-MM-DD` inklusive Kalenderprüfung (Schaltjahre, Monatsgrenzen); ungültige Stichtage liefern fail-closed `VALIDATION_ERROR`.
  - Zeitzonen-Präzision für Tagesdatum strikt in `Europe/Vienna`.
  - `consolidated_as_of` enthält ausschließlich das tatsächlich aus Metadaten geparste Datum („Fassung vom“); fehlt die Angabe, bleibt es strikt `null` (keine Vermischung mit Stichtag oder Titel).
  - Duale SHA-256 Hashes: `raw_content_sha256` (Upstream-Antwort) und `normalized_content_sha256` (bereinigter Normtext).
  - Provenienz für Cache-Treffer: `cached: true` wird im Receipt ausgewiesen, die ursprüngliche `retrieval_method` bleibt erhalten.
  - Neuer Status `insufficient_metadata`, falls die zeitliche Geltung anhand der RIS-Metadaten nicht belegbar ist.
- **Multi-dimensionale Batch-Deduplizierung**:
  - Deduplizierungsschlüssel `${representation}::${sourceIdOrUrl}::${paragraph}::${stichtag}` in `ris_sync_laws` verhindert das versehentliche Zusammenlegen von Anfragen mit unterschiedlichen Stichtagen.
- **Rechtsstands-Regressionstests & Testsuiten**:
  - 5 Testsuiten mit insgesamt 63 Tests (`test:parser-smoke`, `test:tool-smoke`, `test:canonical-laws`, `test:legal-regression`, `test:cli-json`) zu 100% grün.

## 0.15.0 - Robuste RIS-Primärrechtsprüfung, Verification Receipt, Stichtag-Validierung & Batch-Deduplizierung
- **Capability-Check**: Dokumentierter Integritätscheck vor Rechtsrecherchen zur Sicherstellung der Verfügbarkeit von `ris_fetch_segment`, `ris_fetch_whole_law`, `ris_sync_laws`, `ris_search`.
- **Gestufter RIS-Fallback**:
  - Stufe 1: Direkte `sourceId` / `Dokumentnummer`
  - Stufe 2: Offizielle ELI- oder NormDokument-URL mit URL-Safety-Domainprüfung (`www.ris.bka.gv.at`, `ogd.ris.bka.gv.at`, `data.bka.gv.at`)
  - Stufe 3: RIS-Websuche ausschließlich als gekennzeichneter Notbehelf (`web_search_fallback` / `unverified_fallback`)
- **Maschinenlesbarer Verification Receipt**:
  - Jede Rechtsprüfung erzeugt einen Receipt mit `source_id`, `gesetzesnummer`, `dokumentnummer`, `eli`, `paragraf`, `consolidated_as_of`, `retrieved_at`, `effective_from`, `effective_to`, `kundmachungsorgan`, `content_sha256`, `retrieval_method`, `verification_status`, `fallback_reason`.
- **Automatische Stichtagsprüfung**:
  - Validiert Fassungen gegen den gewünschten Stichtag (`stichtag` / `as_of_date`); verhindert stillschweigendes Ausgeben historischer Fassungen (`stichtag_mismatch`).
- **Batch-Synchronisation & Deduplizierung (`ris_sync_laws`)**:
  - Unterstützt das gleichzeitige Synchronisieren einzelner Paragrafen mehrerer Gesetze (`laws: [...]`) und ganzer Normen.
  - Identische Dokumentnummern / `sourceId`s innerhalb eines Batches werden dedupliziert (`deduplicated` Metrik).
- **5-Schichten-Antwortformat**:
  - Saubere Trennung von A) Normwortlaut, B) Metadaten & Verification Receipt, C) Verständliche Zusammenfassung, D) Judikatur & Leitsätze (Sekundärkontext), E) Schlussfolgerung & Rechtsunsicherheit.
- **Ausschließliche Primärrechtsquelle**:
  - RIS ist alleinige Primärquelle; Sekundärquellen (JUSLINE etc.) dürfen einen fehlenden RIS-Beleg niemals ersetzen.
- **Umfassende Regressionstests**:
  - RIS-503 und unsichere/fremde URLs
  - Tagesaktuelle vs. historische Fassungen (Stichtagsvalidierung)
  - MRG § 29 ab 01.01.2026 mit Receipt und 5-Schichten-Schema
  - MieWeG §§ 1, 2 und 4 (Batch Sync)
  - KSchG §§ 1 und 6 (Batch Sync mit SHA-256)
  - ABGB §§ 1096, 1111, 1117 und 1118 (Batch Sync)
  - HeizKG-Gesamtfassung (`representation: "whole_law"`)
  - Batch-Deduplizierung identischer Dokumentnummern

## 0.14.0 - Kurzzitate-Auflösung & Offline-/Sandbox-CLI
- **Zuverlässige Kurzzitate-Auflösung**: `ris_search` löst nun gängige Kurzzitate wie „MRG § 29“, „§ 29 MRG“, „MRG 29“, „EStG § 33“, „WEG § 16“, „Art 140 B-VG“ etc. in allen Schreibweisen zuverlässig auf.
- **Anführungszeichen-Bereinigung**: Typografische Anführungszeichen (`„...“`, `”...“`, `«...»`, `"..."`, `'...'`) werden im Query-Resolver vor der Mustererkennung bereinigt.
- **Erweiterte Gesetzes-Aliase & generische Erkennung**: `LAW_ALIASES` um alle gängigen österreichischen Gesetzeskürzel erweitert und generische Erkennung für Paragrafen- und Artikelbezüge integriert.
- **RIS API Bundesrecht Pagination & Paragraf-Matching**: Bei gezielten Paragrafenabfragen paginiert `searchBundesrechtApi` bis zum Auffinden des exakten Paragrafen (bzw. bis zum Seitenende), statt starr nach Seite 3 abzubrechen.
- **HTML Fallback Suchworte-Bereinigung**: Bei `normRef` wird `Suchworte` im HTML-Fallback nicht mehr mit dem Gesamtzitat übersteuert, wodurch Treffer bei Ausfall der RIS API zuverlässig gefunden werden.
- **Offline / Sandbox CLI**: `tsx` als lokale DevDependency integriert; `build`-Script erzeugt ein lauffähiges `dist/`, wodurch die Standalone-CLI via `npm run cli`, `npm run cli:dist` oder direkt `node dist/bin/cli.js` ohne Netzwerk-Downloads und sandbox-tauglich läuft.
- **Regressionstests**: Neue Tests für Kurzzitate, Anführungszeichen, API-Pagination und HTML-Fallback in `tool-smoke.test.ts` ergänzt.

## 0.13.0 - Harness-Agnostischer CLI-Support, Cache-Path-Splitting & Namespaced Settings
- **Harness-Agnostisches CLI**: `bin/cli.ts` hinzugefügt, um die Tools standalone über `npx tsx bin/cli.ts` auszuführen.
- **Zwei-Wege-Cache**: Physische Trennung von Referenz-Dokumenten (Markdown in `memory/references/`) und strukturierten Metadaten (JSON in `data/`).
- **Namenraum-Einstellungen**: Einstellungen werden nun automatisch aus `settings.json` im Workspace-Root unter dem Namensraum `"austrian-law-kit"` geladen.
- **Pfade konfigurierbar**: Unterstützung für benutzerdefinierte `cacheRoot`- und `dataRoot`-Pfade in `settings.json`, relativ zum Workspace-Root aufgelöst.
- **Thread-sichere Scopes**: Integration von `AsyncLocalStorage` zur dynamischen und isolierten Pfadauflösung während multi-tenanter Agenten-Läufe in OpenClaw.
- **Dokumentations-Härtung**: `README.md` und `SKILL.md` umfassend aktualisiert, um den harness-agnostischen Ansatz, die `settings.json`-Spezifikation und Datenisolations-Vorschriften für geteilte Repositories zu dokumentieren.
- **Repository-Umbenennung**: Repository auf `austrian-law-kit` umgestellt und die Standard-Branch-Konfiguration auf `main` aktualisiert.

## 0.12.0 - JUSLINE Query-Index + Refresh-Semantik
- JUSLINE-Query-Index für `query + kind + limit` ergänzt, damit Artefaktmengen vor erneutem Upstream-Fetch wiederverwendet werden können
- Query-Index-TTL auf 24 Stunden festgelegt
- `refresh=true` für JUSLINE als Force-Reload-Semantik geschärft (Index und Artefakt-Reuse werden bypassed)
- Meta-Signale unterscheiden jetzt zwischen `full_cache_hit`, `partial_cache_hit` und `cache_miss`
- Root-/Plugin-/Status-Doku auf den tatsächlichen Cache-Stand nachgezogen

## 0.11.0 - JUSLINE Decisions MVP + Parser-Smokes
- `jusline_list_decisions` als zweite produktive JUSLINE-MVP-Funktion ergänzt (Sekundärquelle)
- JUSLINE-Entscheidungsparser ergänzt und gegen doppelte/reine Entscheidungslinks gehärtet
- Parser-Smoke-Tests für RIS und JUSLINE als kleine ausführbare Checks ergänzt
- zusätzliche Live-/Varianten-Fixtures für RIS und JUSLINE ergänzt
- Plugin-/Root-Doku auf den tatsächlichen MVP-Stand nachgezogen

## 0.10.0 - JUSLINE Discussions MVP
- `jusline_fetch_discussions` als erste produktive JUSLINE-MVP-Funktion ergänzt (Sekundärquelle)
- JUSLINE URL-/Pfad-Auflösung ergänzt (`src/jusline/url-builder.ts`)
- Diskussionen/Kommentare-Parser ergänzt (`src/jusline/discussions-parser.ts`)
- reale Snapshot-Extrakt-Fixtures (positiv/negativ) + Testplan ergänzt
- Entscheidungen in diesem Schritt bewusst ignoriert

## 0.9.1 - JUSLINE Fixture-Härtung
- JUSLINE-Fixtures als reduzierte Snapshot-Extrakte klar dokumentiert
- Relevante/weggelassene Sektionen transparent gemacht (`fixtures/jusline/README.md`)

## 0.9.0 - RIS Parser Härtung (MVP)
- robustere HTML-Entity-Decodierung und Tag-Stripping in RIS-Parsern
- robustere Titel-/Content-Fallbacks in Segment/Whole-Law-Parsern
- tolerantere Link-Erkennung im RIS-Search-Parser

## 0.8.0 - RIS MVP Hardening (kleine Konsolidierungen)
- gemeinsame Mini-Helfer für Source-ID-Auflösung und Cache-Meta ergänzt
- Duplikate in `ris_fetch_segment`/`ris_fetch_whole_law` reduziert (ohne Vertragsänderung)

## 0.7.0 - Meta-Signale geschärft
- `meta.notices` und `meta.warnings` semantisch getrennt
- `cache_hit` als Notice, Cache-Probleme als Warning geführt

## 0.6.0 - Cache-Read Wiederverwendung für RIS-Tools
- gezielte cache-read Wiederverwendung bei eindeutigem Stable-ID-Match ergänzt
- Cache-Miss/Cache-Konflikt als Nebenpfad, Hauptpfad bleibt stabil

## 0.5.0 - Write-Through Caching für RIS-Tools
- optionales write-through Caching nach erfolgreichen RIS-Fetches ergänzt
- Cache-Schreibfehler entkoppelt vom RIS-Hauptpfad (`ok: true` bleibt erhalten)

## 0.4.0 - Lokale Cache-Helfer (ohne I/O)
- Stable-ID-Helfer ergänzt (`src/cache/stable-id.ts`)
- Cache-Pfad-Ableitung ergänzt (`src/cache/cache-paths.ts`)
- Artefakt-Serialisierung (Markdown+Frontmatter/Metadata-JSON) ergänzt
- optionale Parse-Gegenfunktion für Scaffold-Format ergänzt
- textuelle Tests für Stable-ID/Pfade/Serialisierung ergänzt

## 0.3.0 - Stub-Tool-Registrierung + Schema-Vorbereitung
- zentrale Tool-Definition/Registry mit Stubs eingeführt
- Plugin-Entry registriert alle Tools stub-basiert via `registerTool(...)`
- Input-Schemaobjekte pro Tool ergänzt
- lokale Registry-Konsistenzprüfung ergänzt
- Ergebnisformat über zentrales `format-result` gekapselt
- Frontmatter-Basistyp eingeführt und in Tool-Contracts verdrahtet

## 0.2.0 - Vertrags- und Plugin-Skelett-Härtung
- Quellenpolitik/Response-Contract geschärft
- Stable-ID- und Frontmatter-Spezifikation ergänzt
- OpenClaw-konformes Plugin-Skelett angelegt (Manifest + `openclaw.extensions` + Root-Entry)
- textuelle Vertrags-/Registry-Tests ergänzt

## 0.1.0 - Scaffold
- Initiales Repository-Scaffold erstellt
- Dokumentationsgerüst angelegt
- Skill-Gerüst unter `skills/austrian-law/` angelegt
- Platzhalter für Plugin/Tests/Fixtures/Configs ergänzt
