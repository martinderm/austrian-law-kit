# openclaw-austrian-law (Plugin Skeleton)

Natives OpenClaw-Plugin-Skelett für den Austrian-Law-Stack.

## Korrigierte Struktur (OpenClaw-konform)

- `openclaw.plugin.json`
  - Manifest für Discovery + Config-Validierung (manifest-first)
- `package.json`
  - enthält `openclaw.extensions` mit Extension-Entry
- `index.ts`
  - Root-Entry-Point der Plugin-Extension (wird über `openclaw.extensions` geladen)
  - nutzt die dokumentierte `definePluginEntry`-Form aus `openclaw/plugin-sdk/core`
- `src/index.ts`
  - interne Konstante/Typen für geplante Toolnamen
- `src/tools/`, `src/cache/`, `src/types/`
  - reine Platzhalterstruktur

## Geplante Tools (noch ohne Implementierung)

- `ris_search`
- `ris_fetch_segment`
- `ris_fetch_whole_law`
- `jusline_fetch_discussions`
- `jusline_list_decisions`
- `law_cache_get`
- `law_cache_put`

## Datenvertrag als Voraussetzung

Die spätere Tool-Implementierung hängt von folgenden Verträgen ab:
- `docs/stable-id-strategy.md`
- `docs/frontmatter-schema.md`
- `docs/memory-layout.md`

## Aktueller Status

- Root-Entry-Point vorhanden
- Manifest + Paketmetadaten vorhanden
- MVP-Tools werden registriert
- RIS- und JUSLINE-MVP-Logik ist vorhanden
- Cache wird standardmäßig aus dem Workspace des aufrufenden Agenten abgeleitet; `cacheRoot` bleibt optionaler Override

## SDK-/Abhängigkeits-Hinweis

Für dieses reine Skeleton sind im Paket keine zusätzlichen Runtime-Abhängigkeiten nötig.
Der Import `openclaw/plugin-sdk/core` wird im OpenClaw-Plugin-Laufzeitkontext aufgelöst.

## Nächster Schritt

Im nächsten Schritt wird die Tool-Registrierung vorbereitet (weiterhin ohne echte Fetch-/Parserlogik).
