---
type: object
cluster: retrieval
universe: live
status: verified
entity: scripts/lib/ris_ogd_client.py
verified_at: 2026-10-12
---

# Ris

RIS-Discovery und Fetch erzeugen Normartefakte samt Stichtagsnachweis (Receipt v2).

## Why this shape
Identität, zeitliche Geltung und Abrufrepräsentation müssen getrennt bleiben.

## Shape
Natives XML-Parsing via Python `xml.etree.ElementTree` für Bundesnormen (`/Dokumente/Bundesnormen/{NOR-ID}/{NOR-ID}.xml`) und Landesnormen. Offizielle OGD REST API v2.6 für gezielte Discovery.
Issue #12: Abschnittssuche nutzt `Abschnitt.Von/Bis/Typ` und `Fassung.FassungVom`.
Ein einfacher Paragraph matcht auch artikelqualifizierte Kennungen. Gesetzesabrufe
akzeptieren nur XML mit passender Gesetzes-/Abschnittsidentität, nichtleerem Text
und gültigem Stichtag; ungeeignete Kandidaten und Cache-Treffer werden übersprungen.
Direkt-IDs behalten die Stichtagswarnung statt automatischer Fassungsersetzung.
Verification Receipt v2 erzeugt duale Hashes (`raw_content_sha256` vs. `normalized_content_sha256`), führt Stichtagsvalidierung in `Europe/Vienna` durch und archiviert Rohquellen sha-adressiert unter `data/ris/raw/<sha256>.xml`.

- [scripts/lib/ris_ogd_client.py](../../../scripts/lib/ris_ogd_client.py)
- [scripts/lib/receipt.py](../../../scripts/lib/receipt.py)
- [references/canonical-laws.json](../../../references/canonical-laws.json)

## Connected to
[tools](tools.md), [cache](cache.md), [quality](quality.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## If you change this
- **Hits:** RIS-Client, XML-Parser, Receipt-Generierung, Stichtags-Prüfung und Unittests.
- **Does not hit:** Reine CLI-Flag-Erweiterungen.

## Surfaces
RIS-Upstreams werden über `urllib.request` gelesen; `storage.py` archiviert Rohdaten.

## See
Quelle: [scripts/lib/ris_ogd_client.py](../../../scripts/lib/ris_ogd_client.py). [Änderungsrouting](../effects/CONTEXT.md).
