---
type: process
universe: live
status: verified
entity: scripts/lib/ris_ogd_client.py
verified_at: 2026-10-12
consumes: [../objects/tools.md, ../objects/ris.md]
produces: [../objects/ris.md, ../objects/cache.md]
---

# fetch-and-verify

## Input → Movement → Output
Gesetz, Paragraf und Stichtag → Schnelle Kanonische Auflösung / Cache-Prüfung oder RIS-API/XML-Abruf → XML-Parsing & Receipt v2 → Normartefakt mit 5-Schichten-Nachweis.

## Why this shape
Reine Python 3 Standardbibliothek (Zero Dependencies), deterministisches XML-Parsing und kryptografischer Integritätsnachweis vor Ausgabe an den Agenten.

## Steps
1. Validiert Gesetzesabkürzung über `references/canonical-laws.json` und prüft lokalen Disk-Cache (`data/cache/`).
2. Cache-Treffer werden wie neue XML-Kandidaten auf Identität, Inhalt und (bei Gesetzesabfragen) Geltung geprüft. Ungültige Cache-Treffer lösen OGD-Neuauflösung mit Abschnittsfilter und `Fassung.FassungVom` aus; kein Fallback auf beliebige Treffer. Quelle: [scripts/lib/ris_ogd_client.py](../../../scripts/lib/ris_ogd_client.py).
3. Parst den Normtext hierarchisch mit `xml.etree.ElementTree` in Dokumentreihenfolge.
4. Generiert das `VerificationReceipt` (v2) mit dualen SHA-256 Prüfsummen und Stichtagsprüfung in `Europe/Vienna`. Quelle: [scripts/lib/receipt.py](../../../scripts/lib/receipt.py).
5. Fragt optional amtliche Höchstgerichts-Entscheidungen über die RIS-Judikatur API ab. Quelle: [scripts/lib/ris_judikatur.py](../../../scripts/lib/ris_judikatur.py).
6. Archiviert akzeptiertes XML (auch bei Cache-Hits) unter `data/ris/raw/<sha256>.xml`, referenziert es per POSIX-Pfad und schreibt neue Ergebnisse atomar in den Cache. CLI formatiert die 5-Schichten-Ausgabe.

## Surfaces
CLI (`scripts/austrian_law_cli.py`) wird von Agenten oder Terminals aufgerufen; liefert Text oder Structured JSON Envelope (`--json`).

## See
[tools](../objects/tools.md), [ris](../objects/ris.md), [cache](../objects/cache.md).
Quelle: [scripts/lib/ris_ogd_client.py](../../../scripts/lib/ris_ogd_client.py).
