# Testfälle: Cache Paths (textuell)

## Ziel

Sicherstellen, dass relative Cache-Pfade aus Stable ID + Quelle + Dokumenttyp korrekt abgeleitet werden.

## Fall 1: RIS Normsegment

**Erwartung:**
- Markdown unter `ris/norms/<stable_id>.md`
- Metadata unter `ris/metadata/<stable_id>.json`

## Fall 2: RIS Gesamtdokument

**Erwartung:**
- Markdown unter `ris/documents/<stable_id>.md`

## Fall 3: JUSLINE Material

**Erwartung:**
- Markdown unter `jusline/materials/<stable_id>.md`
- Metadata unter `jusline/metadata/<stable_id>.json`

## Fall 4: Quellen-Mismatch

**Erwartung:**
- wenn `stable_id`-Prefix und `frontmatter.source` nicht zusammenpassen => Fehler

## Fall 5: Keine Dateisystemabhängigkeit

**Erwartung:**
- nur relative Strings
- kein Read/Write
