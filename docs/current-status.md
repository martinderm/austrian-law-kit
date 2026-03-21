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

### 5) Lokale Cache-Helfer (ohne I/O)
- Stable-ID-Helfer implementiert.
- Relative Cache-Pfade ableitbar.
- Markdown+Frontmatter und Metadata-JSON serialisierbar.
- Optionale Parse-Gegenfunktion vorhanden.

Relevante Dateien:
- `plugin/openclaw-austrian-law/src/cache/stable-id.ts`
- `plugin/openclaw-austrian-law/src/cache/cache-paths.ts`
- `plugin/openclaw-austrian-law/src/cache/serialize-artifact.ts`
- `plugin/openclaw-austrian-law/src/cache/parse-artifact.ts`

## Was aktuell nur Scaffold/Stub ist

- Alle registrierten Tools sind Stub-basiert (`NOT_IMPLEMENTED`).
- Kein Fetching, keine Parser, keine RIS-/JUSLINE-Netzlogik.
- Kein Dateisystem-I/O für Cache-Lesen/Schreiben.

## Wichtigste Architekturentscheidungen

1. **Repository-first** statt instanzspezifischer Direktlösung.
2. **Manifest-first Pluginstruktur** (OpenClaw-konforme Basis).
3. **Vertragsgetriebene Entwicklung**: Doku-Vertrag -> TS-Typen -> Laufzeitschemas.
4. **RIS-first Policy** als harte Leitplanke.
5. **Deterministische Stable-ID-/Cache-Helfer** vor externer Logik.

## Bekannte Risiken

- Feldverfügbarkeit/Benennung in echten RIS-/JUSLINE-Antworten kann von Annahmen abweichen.
- Vereinfachte YAML-Serialisierung ist absichtlich eingeschränkt.
- Ohne I/O-Phase sind Pfad-/Serialisierungsannahmen noch nicht end-to-end verifiziert.

## Empfohlene nächste 3 Schritte (Reihenfolge)

1. **Lokale Cache-I/O-Schicht ergänzen** (lesen/schreiben auf Basis bestehender Helfer, weiterhin ohne Netzwerk).
2. **`law_cache_get` / `law_cache_put` auf echte lokale I/O umstellen** (Stub -> lokal funktionsfähig).
3. **Erst danach** RIS-seitige Logik starten (`ris_search` zuerst, weiterhin ohne JUSLINE-Ausbau als Priorität).
