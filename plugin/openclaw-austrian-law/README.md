# austrian-law-kit (Plugin MVP)

Natives OpenClaw-Plugin für österreichische Rechtsquellen mit **RIS als Primärquelle** und **JUSLINE als optionaler Sekundärquelle**.

## Struktur (OpenClaw-konform)

- `openclaw.plugin.json`
  - Manifest für Discovery + Config-Validierung (manifest-first)
- `package.json`
  - enthält `openclaw.extensions` mit Extension-Entry
- `index.ts`
  - Root-Entry-Point der Plugin-Extension (wird über `openclaw.extensions` geladen)
  - nutzt die dokumentierte `definePluginEntry`-Form aus `openclaw/plugin-sdk/core`
- `src/index.ts`
  - interne Konstante/Typen für Toolnamen
- `src/tools/`, `src/cache/`, `src/types/`, `src/ris/`, `src/jusline/`
  - konkrete MVP-Implementierungen für Tool-Logik, Cache und Parser/Resolver

## Registrierte Tools

Produktiv im MVP:
- `ris_search`
- `ris_fetch_segment`
- `ris_fetch_whole_law`
- `jusline_fetch_discussions`
- `jusline_list_decisions`


## Datenvertrag als Voraussetzung

Die Tool-Implementierung orientiert sich an folgenden Verträgen:
- `docs/stable-id-strategy.md`
- `docs/frontmatter-schema.md`
- `docs/memory-layout.md`

## Aktueller Status

- Root-Entry-Point vorhanden
- Manifest + Paketmetadaten vorhanden
- MVP-Tools werden registriert
- RIS- und JUSLINE-MVP-Logik ist vorhanden
- Cache wird standardmäßig aus dem Workspace des aufrufenden Agenten abgeleitet; `cacheRoot` bleibt optionaler Override
- JUSLINE nutzt zusätzlich einen Query-Index (`query + kind + limit`) mit 24h TTL; `refresh=true` wirkt als Force-Reload und bypassed Query-Index + Artefakt-Reuse

## Hinweis zu externen Quellen

Die Lizenz dieses Plugins erfasst nur den Plugin-Code selbst.

Für externe Quellen gilt insbesondere:
- **RIS** bleibt die vorgesehene Primärquelle.
- **JUSLINE** ist nur als optionale Sekundärquelle gedacht.
- Nutzung, Abruf, Speicherung oder Weiterverarbeitung von JUSLINE-Inhalten kann zusätzlichen Nutzungsbedingungen oder urheberrechtlichen Grenzen unterliegen.
- Wer das Plugin mit JUSLINE verwendet, sollte diese Rahmenbedingungen selbst prüfen.

## SDK-/Abhängigkeits-Hinweis

Für dieses schlanke MVP sind im Paket keine zusätzlichen Runtime-Abhängigkeiten nötig.
Der Import `openclaw/plugin-sdk/core` wird im OpenClaw-Plugin-Laufzeitkontext aufgelöst.

## Lokale Checks

Im Plugin-Ordner:
- `npm run test:parser-smoke`
- `npm run test:tool-smoke`
- `npm run test:smoke`

## Nächster Schritt

Nächste sinnvolle Schritte sind Parser-Härtung gegen weitere RIS-/JUSLINE-Varianten, breitere Fixture-Abdeckung und weitere Verbesserungen an der RIS-Discovery-Logik.
