---
type: process
universe: live
status: verified
entity: scripts/lib/ris_ogd_client.py
verified_at: 2026-10-19
revision: 2af21a4
consumes: [../objects/tools.md, ../objects/ris.md]
produces: [../objects/ris.md]
---

# discovery

## Input → Movement → Output
Suchanfrage → direkte Auflösung oder OGD-API-Discovery → gefilterte Treffer mit amtlichen Referenzen.

## Why this shape
Identität, Herkunft und Gültigkeit bleiben bis zur Ausgabe nachvollziehbar. Die technische Bewegung setzt die fachliche Freigabe durch den Agenten voraus.

## Steps
Aktueller Python-Pfad: `search_ris_ogd_api()` baut die OGD-Abfrage mit Abschnittstyp-Filter (`Abschnitt.Typ: Paragraph`) bei Paragrafenangabe und `Fassung.FassungVom`-Stichtagsfilter (`ris_ogd_client.py:264-273`), iteriert seitenweise über `Seitennummer` (`ris_ogd_client.py:280-282`) und mappt die Treffer inklusive Paragraphen- und Artikelkennungen (`ris_ogd_client.py:330-331`). Kanonische Gesetzeskürzel löst `resolve_canonical_law()` über `references/canonical-laws.json` vorab auf (`ris_ogd_client.py:41-57`). Die XML-Validierung erfolgt beim nachgelagerten Fetch (`fetch_norm`).

## If you change this
- **Hits:** Suchschemas, API-Mapping, Kanonische Auflösung und Suchfixtures.
- **Does not hit:** Judikatur-Discovery (`ris_judikatur.py`).

## Surfaces
CLI (`search_law`) ruft die Discovery auf; externe OGD-Quellen liefern Daten; der Disk-Cache persistiert beim Fetch Artefakte.

## See
[tools](../objects/tools.md), [ris](../objects/ris.md).
Quelle: [scripts/lib/ris_ogd_client.py](../../../scripts/lib/ris_ogd_client.py).
