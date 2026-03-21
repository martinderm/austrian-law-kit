# Testfälle: Stable ID Rules (textuell)

## Ziel

Absichern, dass Stable IDs reproduzierbar, quellstabil und typkonsistent gebildet werden.

## Fall 1: RIS Normsegment mit vollständigen Feldern

**Input:**
- `doc-id` vorhanden
- `segment-id` vorhanden
- `version-id` vorhanden

**Erwartung:**
- Format: `ris:normseg:<doc-id>:<segment-id>:<version-id>`
- Ergebnis ist lowercase/dateisicher

## Fall 2: RIS Normsegment ohne version-id

**Input:**
- `doc-id` vorhanden
- `segment-id` vorhanden
- `version-id` fehlt

**Erwartung:**
- Format: `ris:normseg:<doc-id>:<segment-id>`
- `version_label` muss im Frontmatter gesetzt werden

## Fall 3: RIS Gesamtdokument ohne version-id

**Input:**
- `doc-id` vorhanden
- `version-id` fehlt

**Erwartung:**
- Format: `ris:doc:<doc-id>`
- keine künstliche Versionskennung erzeugen

## Fall 4: JUSLINE Material ohne material-id

**Input:**
- kein `material-id`
- kanonischer URL-Slug vorhanden

**Erwartung:**
- Format: `jusline:mat:<slug>`
- slug wird normalisiert

## Fall 5: Entscheidungen

**Input:**
- `decision-id` vorhanden

**Erwartung:**
- RIS: `ris:dec:<decision-id>`
- JUSLINE: `jusline:dec:<decision-id-or-slug>`

## Fall 6: Verbotene Bestandteile

**Input:**
- nur Überschrift/UI-Label/Seitentitel vorhanden

**Erwartung:**
- keine ID-Erzeugung aus diesen Werten
- Fall als Lücke markieren
