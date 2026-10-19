# Runtime-Layout

Der aktive Cache liegt standardmäßig unter `<cwd>/data/cache/`; die Datenwurzel ist der Cache-Elternordner. Maßgeblich sind [`scripts/austrian_law_cli.py`](../scripts/austrian_law_cli.py) (`get_default_cache_dir()`, `--cache-dir`) und [`scripts/lib/storage.py`](../scripts/lib/storage.py).

```text
<workspace>/
└── data/                                  # Datenwurzel (Elternverzeichnis des Caches)
   ├── cache/<law>_<para>_<stichtag>.xml   # Cache: unveränderte amtliche XML-Antworten je Norm und Stichtag
   └── ris/raw/<sha256>.xml                # amtliche Rohquellen, sha-adressiert, Dedupe nach Prüfsumme
```

- Cache-Schreibvorgänge sind atomar (`tempfile` + `os.replace`); der Cache-Key ergibt sich aus bereinigtem Gesetzeskürzel, Paragrafen-Slug und Stichtag (`ris_ogd_client.py`, `cache_key`).
- Cached XML wird vor Ausgabe erneut geparst und auf Identität, Inhalt und Geltung geprüft — Cache-Hits durchlaufen dieselbe Validierung wie frische Kandidaten.
- Die Rohquellen-Archivierung (`archive_raw_source()`) bewahrt den unveränderten Upstream-Antwortkörper auch bei Parserfehlern als Diagnosebeleg; archivierte Datei und `raw_content_sha256` bezeichnen denselben dekodierten UTF-8-String.
- `--cache-dir` legt den Cache-Ordner direkt fest; die Datenwurzel (und damit `ris/raw/`) ist dessen Elternverzeichnis. Alte Caches werden nicht migriert.
- Ein Markdown-Frontmatter-Cache, JUSLINE-Query-Index und by-stable-id-Indizes aus der TypeScript-Ära sind nicht Bestandteil der Python-Laufzeit.

Formate: [Frontmatter](frontmatter-schema.md), [Stable-ID-Strategie](stable-id-strategy.md). Änderungsauswirkungen: [Cache-Karte](system-map/objects/cache.md).
