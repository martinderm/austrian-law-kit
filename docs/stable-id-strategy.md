# Stable ID Strategy

Diese Regeln stabilisieren Dateinamen, Referenzen und Index-Verknüpfungen für `memory/references/austrian-law/`.

## Grundprinzipien

- Stable IDs müssen aus **quellstabilen Identifikatoren** gebildet werden.
- IDs müssen reproduzierbar sein (gleicher Input → gleiche ID).
- IDs sind lowercase, URL-/dateisicher (`[a-z0-9._:-]`).

## Verbotene ID-Bestandteile

Nicht zulässig für Stable IDs:
- freie Überschriften
- instabile UI-Labels
- bloße Seitentitel

## Präfixe

- `ris:` für RIS-basierte Inhalte
- `jusline:` für JUSLINE-basierte Inhalte

## Regeln nach Dokumenttyp

### 1) RIS Normsegmente

**Bevorzugte Felder (in Reihenfolge):**
1. RIS-Dokumentidentifikator
2. Segment-Kennung (z. B. Paragraph/Artikel/Absatz)
3. konsistente Fassungskennung (falls vorhanden)

**Format (Schema):**
`ris:normseg:<doc-id>:<segment-id>[:<version-id>]`

**Fallback:**
- Wenn `version-id` fehlt: Segment ohne Version führen und `version_label` im Frontmatter pflegen.

### 2) RIS Gesamtdokumente

**Bevorzugte Felder (in Reihenfolge):**
1. RIS-Dokumentidentifikator
2. konsistente Fassungskennung (falls vorhanden)

**Format (Schema):**
`ris:doc:<doc-id>[:<version-id>]`

**Fallback:**
- Ohne `version-id`: `ris:doc:<doc-id>` und Fassung über Frontmatter-Felder kennzeichnen.

### 3) JUSLINE Materialien (Diskussion/Kommentar)

**Bevorzugte Felder (in Reihenfolge):**
1. JUSLINE-interner Material-Identifier (falls vorhanden)
2. kanonischer Pfadslug aus URL

**Format (Schema):**
`jusline:mat:<material-id-or-slug>`

**Fallback:**
- Wenn kein stabiler Material-Identifier vorliegt: kanonisierten URL-Pfad als slug verwenden.

### 4) Spätere Entscheidungen

**Bevorzugte Felder (in Reihenfolge):**
1. gerichtlicher/amtlicher Entscheidungs-Identifikator
2. Entscheidungsdatum (ISO, falls Teil des Identifikators notwendig)
3. Quelle (`ris` oder `jusline`) als Präfix

**Format (Schema):**
- RIS: `ris:dec:<decision-id>`
- JUSLINE (nur wenn separat geführt): `jusline:dec:<decision-id-or-slug>`

## Index-Referenzregeln

- `index/by-stable-id.json`: stable_id → relativer Dateipfad
- `index/by-source-id.json`: source_id → stable_id
- Ein `source_id` darf auf genau eine aktive `stable_id` zeigen; historische Versionen über `supersedes` im Frontmatter referenzieren.
