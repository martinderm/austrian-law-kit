# Testfälle: Stable ID Rules (textuell)

## Ziel

Absichern, dass Stable IDs reproduzierbar, quellstabil und typkonsistent gebildet werden.

## Fall 1: RIS Normsegment mit vollständigen Feldern

**Input:**
- doc-id vorhanden
- segment-id vorhanden
- version-id vorhanden

**Erwartung:**
- ID-Format: `ris:normseg:<doc-id>:<segment-id>:<version-id>`
- keine Verwendung von Freitext-Titeln

## Fall 2: RIS Gesamtdokument ohne version-id

**Input:**
- doc-id vorhanden
- version-id fehlt

**Erwartung:**
- ID-Format: `ris:doc:<doc-id>`
- `version_label` im Frontmatter muss gesetzt sein

## Fall 3: JUSLINE Material ohne stabilen Material-Identifier

**Input:**
- kein material-id
- kanonischer URL-Slug vorhanden

**Erwartung:**
- ID-Format: `jusline:mat:<slug>`
- slug ist normalisiert (lowercase, dateisicher)

## Fall 4: Verbotene Bestandteile

**Input:**
- nur Seitentitel oder UI-Label verfügbar

**Erwartung:**
- keine Stable-ID-Erzeugung aus Seitentitel/UI-Label
- Fall wird als Lücke markiert
