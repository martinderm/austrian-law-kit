# Decision Log

## 2026-03-21 — Repository-first Aufbau
**Entscheidung:** Portables Scaffold statt instanzspezifischer Direktintegration.
**Warum:** Wiederverwendbarkeit und saubere Migration in neue OpenClaw-Instanzen.

## 2026-03-21 — RIS-first Quellenpolitik
**Entscheidung:** RIS als Primärquelle, JUSLINE nur sekundär/opt-in.
**Warum:** Verlässlichkeit bei Normwortlaut/Metadaten und klare Konfliktauflösung.

## 2026-03-21 — Vertragsgetriebene Entwicklung
**Entscheidung:** Erst Doku-/Datenvertrag, dann Tool-Typen/Registry, dann Implementierung.
**Warum:** Stabilere Schnittstellen und weniger Umbauten in späteren Phasen.

## 2026-03-21 — Manifest-first Plugin-Skelett
**Entscheidung:** OpenClaw-konformes Plugin mit Manifest + `openclaw.extensions` + Root-Entry.
**Warum:** Discovery/Config-Validierung und Ladepfad früh korrekt aufsetzen.

## 2026-03-21 — Stub-first Tool-Registrierung
**Entscheidung:** Alle Tools früh strukturell registrieren, aber nur mit `NOT_IMPLEMENTED`.
**Warum:** Schnittstellen und Registry-Verhalten testbar machen ohne voreilige Logik.

## 2026-03-21 — Lokale Cache-Helfer vor I/O/Netzwerk
**Entscheidung:** Stable-ID, Pfade, Serialisierung zuerst lokal und deterministisch bauen.
**Warum:** Solide Basis für lokale Artefaktpersistenz ohne externe Abhängigkeiten.

## 2026-04-08 — RIS-Fetch nutzt API-Metadaten, wenn `sourceId` bekannt ist
**Entscheidung:** `ris_fetch_segment` und `ris_fetch_whole_law` versuchen bei bloßer `sourceId` zuerst einen offiziellen RIS-API-Lookup und bevorzugen daraus `content_url` bzw. `whole_law_url`.
**Warum:** Belastbarere Ziel-URLs, weniger Raterei über generische `Dokument.wxe`-Links und bessere Anschlussfähigkeit an die API-first-Discovery.

## 2026-04-08 — Landesrecht bleibt trotz API-first defensiv
**Entscheidung:** State-spezifische Titelvarianten bleiben aktiv, und bekannte API-Missgriffe werden offen als Limit dokumentiert statt schöngeredet.
**Warum:** Die Live-Prüfung über alle Bundesländer war weitgehend brauchbar, aber nicht makellos; konkret liefert Niederösterreich für `Bauordnung` derzeit bevorzugt eine authentische Interpretation statt der Stammnorm.
**Folge:** Dieser Niederösterreich-Sonderfall wird vorerst nicht weiter optimiert, solange kein klarer belastbarer Lösungsweg vorliegt.

## 2026-04-08 — Gemeinderecht wird öffentlich über `ris_search` integriert
**Entscheidung:** Gemeinderecht bleibt nicht bei internen Raw-Clients stehen, sondern wird als öffentlicher `ris_search`-Pfad mit `scope: "municipal"` nutzbar gemacht.
**Warum:** Sonst wäre die API-Erweiterung nur halb umgesetzt. Die offizielle `/Gemeinden`-API liefert belastbare strukturierte Treffer, die sich in den bestehenden Discovery-Vertrag einpassen lassen.

## 2026-04-08 — History bleibt intern und defensiv
**Entscheidung:** Der History-Endpunkt wird vorerst als interner typed Raw-Client geführt, nicht als öffentliches Such-Tool.
**Warum:** Live funktionierte das Zeitfenster ohne `Anwendung`-Filter, aber getestete `Anwendung`-Werte wie `BrKons` oder `LrKons` lieferten API-Fehler. Das taugt derzeit als Sync-/Diagnose-Baustein, nicht als sauberer User-Search-Contract.

## 2026-04-08 — Runtime-Zustand ist Teil der Abnahme, nicht nur der Repo-Stand
**Entscheidung:** Für das Austrian-Law-Plugin gilt Arbeit erst dann als wirklich umgesetzt, wenn der reale OpenClaw-Toolvertrag extern geprüft zum Repo-Stand passt.
**Warum:** Die Probleme rund um `ris_search`-Schema und `ris_fetch_whole_law` saßen zeitweise nicht mehr im Quellcode, sondern im tatsächlich geladenen Plugin-Zustand.
**Folge:** Bei Plugin-Änderungen werden künftig nicht nur Repo-Code und Tests geprüft, sondern immer auch der reale Laufzeitpfad. Doppelte Ladepfade sind zu vermeiden; plugin-spezifische Konfiguration wie `risApiBaseUrl` muss im tatsächlich geladenen Eintrag vorhanden sein.

## 2026-08-23 — TypeScript als bewusste Sprachentscheidung (dokumentierte Ausnahme)
**Entscheidung:** Die Plugin- und Tool-Implementierung bleibt in TypeScript, nicht Python.
**Warum:** Das OpenClaw-Plugin-System ist nativ TypeScript-basiert (ESM, `openclaw.extensions`, `registerTool()`). Eine Python-Implementierung müsste über einen Subprocess-Bridge-Layer angebunden werden, was zusätzliche Komplexität und Latenz erzeugt. TypeScript ermöglicht direkte Plugin-Integration, typisierte Tool-Contracts und Wiederverwendung des OpenClaw-SDK.
**Grundlage:** Die `agent-architecture/skill-engineering-and-modularity.md` erlaubt seit 2026-08-23 explizit alternative Scriptsprachen bei dokumentierter, nachvollziehbarer Begründung (Ökosystem-Kompatibilität).
**Folge:** Die allgemeinen Skill-Prinzipien (Structured CLI Envelope, Cross-Platform-Invarianten, atomare Dateioperationen) gelten weiterhin sprachunabhängig.

## 2026-08-23 — blast_radius auf workspace_scoped korrigiert
**Entscheidung:** `blast_radius` von `read_only` auf `workspace_scoped` geändert.
**Warum:** Der Skill schreibt aktiv Cache-Dateien in `memory/references/austrian-law/` und `data/austrian-law/` im Workspace. Das sind Filesystem-Mutationen, die über reines Lesen hinausgehen — auch wenn nur Cache-Daten betroffen sind.

## 2026-08-24 — CLI Envelope: `ok` → `success` (Standard-Alignment)
**Entscheidung:** Das ToolResult-Envelope-Feld `ok` wird auf `success` umbenannt, gemäß dem Shared-Skills CLI-Envelope-Standard.
**Warum:** Der Standard definiert `success`/`action`/`state`/`message`/`data`/`error`. Das alte `ok`-Feld war funktional identisch, aber nicht standard-konform. Da die primären Konsumenten LLMs sind, die die aktuelle Doku lesen, gibt es keinen praktischen Breaking-Change-Impact.
**Scope:** `ToolResult<T>` in `shared.ts`, `RisApiSearchResult` in `ris-api/types.ts`, alle Tool- und API-Implementierungen, Smoke-Tests.
