# Runtime-Layout

Der aktive Cache verteilt Markdown und JSON auf getrennte Wurzeln. Maßgeblich sind [cache-runtime.ts](../plugin/openclaw-austrian-law/src/cache/cache-runtime.ts), [cache-paths.ts](../plugin/openclaw-austrian-law/src/cache/cache-paths.ts) und [cache-io.ts](../plugin/openclaw-austrian-law/src/cache/cache-io.ts).

```text
<workspace>/
├─ memory/references/austrian-law/       # Standard-cacheRoot: Markdown
│  ├─ ris/norms/<encoded-stable-id>.md
│  ├─ ris/documents/<encoded-stable-id>.md
│  ├─ ris/decisions/<encoded-stable-id>.md
│  ├─ jusline/materials/<encoded-stable-id>.md
│  ├─ jusline/decisions/<encoded-stable-id>.md
│  └─ jusline/query-index/<query-hash>.json  # Query-Reuse, Ausnahme: JSON unter cacheRoot
└─ data/austrian-law/                    # Standard-dataRoot: JSON
   ├─ ris/metadata/<encoded-stable-id>.json
   └─ jusline/metadata/<encoded-stable-id>.json
```

Doppelpunkte der Stable ID werden im Dateinamen durch Unterstriche ersetzt. Das fachliche Identifikatorformat bleibt unverändert. Die Zuordnung von doc_type zu Unterordnern liegt ausschließlich in cache-paths.ts.

Die Wurzeln können durch CLI-/Plugin-Kontext, Umgebungsvariablen oder settings.json überschrieben werden; die genaue Präzedenz steht in cache-runtime.ts. Relative Einstellungen werden anhand des Settings-Verzeichnisses bzw. des übergebenen Workspace-Kontexts aufgelöst. cacheRoot und dataRoot haben unterschiedliche Kontextmechanismen; ihre Isolation darf nicht gleichgesetzt werden.

Der JUSLINE-Query-Index ist ein eigener Cache-Reuse-Mechanismus: [jusline-query-index.ts](../plugin/openclaw-austrian-law/src/cache/jusline-query-index.ts). Allgemeine by-stable-id.json-/by-source-id.json-Indizes und ein templates/memory/-Scaffold aus dem alten Zielmodell sind nicht als aktive Implementierung vorhanden.

Formate: [Frontmatter](frontmatter-schema.md), [Stable-ID-Strategie](stable-id-strategy.md). Änderungsauswirkungen: [Cache-Karte](system-map/objects/cache.md).
