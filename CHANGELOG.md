# Changelog

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
