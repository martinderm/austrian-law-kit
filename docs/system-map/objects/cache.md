---
type: object
cluster: persistence
universe: live
status: verified
entity: scripts/lib/storage.py
verified_at: 2026-10-12
---

# Cache

Schlanker atomarer Disk-Cache (`scripts/lib/storage.py`) mit Rohquellen-Archivierung.

## Why this shape
Reine Python 3 Standardbibliothek (Zero Dependencies), unterbrechungsfreies atomares Schreiben (`tempfile` + `os.replace`) und sichere Aufbewahrung amtlicher Rohquellen.

## Shape
`AtomicDiskCache` verwaltet zwei Verzeichnisse:
- `data/cache/`: Bereinigte und geparste Normtexte im Dateisystem mit Stichtagsbezug.
- `data/ris/raw/`: Unveränderte Roh-XML-Dateien, sha-adressiert (`<sha256>.xml`), automatisch dedupliziert.
Schreiboperationen erfolgen über temporäre Dateien im selben Verzeichnis mit anschließendem atomarem `os.replace` und Retry-Strategie bei Windows-Locks.

- [scripts/lib/storage.py](../../../scripts/lib/storage.py)

## Connected to
[ris](ris.md), [tools](tools.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** Cache-Layout, Pfadstrukturen, Unittests.
- **Does not hit:** RIS Upstream API-Endpunkte.

## Surfaces
Tools schreiben und lesen Cache-Dateien; Agenten lesen Normtexte.

## See
Quelle: [scripts/lib/storage.py](../../../scripts/lib/storage.py). [Änderungsrouting](../effects/CONTEXT.md).
