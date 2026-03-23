# Current Status

Stand: 2026-03-21 (Pause/Übergabepunkt)

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

### 4) Tool-Verträge + Registry + Stub-Registrierung
- Tool-Verträge sind typisiert (`src/types/tool-contracts.ts`).
- Zentrale Definitions-/Registry-Schicht vorhanden.
- Stub-Tools werden strukturell im Entry-Point registriert.
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

- RIS-/JUSLINE-Tools bleiben Stub-basiert (`NOT_IMPLEMENTED`).
- Kein Fetching, keine Parser, keine RIS-/JUSLINE-Netzlogik.
- `law_cache_get` / `law_cache_put` arbeiten lokal über Dateisystem-I/O (ohne Netzlogik).

## Cache-Schicht (neu geschärft)

- Cache-Root wird beim Plugin-Register aus Plugin-Konfiguration gebunden (`cacheRoot`) und in die Cache-I/O-Schicht injiziert; Env-Var ist nur Fallback.
- `law_cache_get` akzeptiert optional `docType` zur Reduktion der DocType-Heuristik.
- Beim Lesen wird Konsistenz geprüft: `frontmatter.source` und `frontmatter.doc_type` müssen zum angefragten Pfad passen, sonst `CONFLICT`.

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

## Empfohlene nächste 3 Schritte (Reihenfolge)

1. **`ris_search` als erste RIS-Produktivlogik starten** (weiterhin ohne JUSLINE-Ausbau als Priorität).
2. **DocType-Heuristik weiter reduzieren**, indem Aufrufer `docType` konsequent mitgeben.
3. **Gezielte automatisierte Tests ergänzen** (Cache-I/O + spätere RIS-Schnittstellen).
