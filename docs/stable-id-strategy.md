# Stable ID Strategy

Diese Regeln stabilisieren Dateinamen, Referenzen und Index-Verknüpfungen für `memory/references/austrian-law/`.

## Ziel der Stable IDs

- Eindeutige, reproduzierbare Identifikatoren für gecachte Rechtsartefakte.
- Entkopplung von instabilen UI-/Seitentiteln.
- Stabile Verweise zwischen Markdown, JSON-Metadaten und Index-Dateien.

## Allgemeine Regeln

1. Stable IDs werden nur aus **quellstabilen Feldern** gebildet.
2. Gleicher Input muss immer dieselbe ID erzeugen.
3. Zeichenraum: lowercase, dateisicher/URL-sicher (`[a-z0-9._:-]`).
4. Präfix ist verpflichtend: `ris:` oder `jusline:`.
5. Wenn Primärfelder fehlen, greift dokumentierte Fallback-Reihenfolge.
6. Wenn auch Fallbacks fehlen: **keine künstliche ID erfinden**, Fall als Lücke markieren.

## Ausdrücklich verbotene Bestandteile

Nicht zulässig für Stable IDs:
- freie Überschriften
- instabile UI-Labels
- bloße Seitentitel

## Bevorzugte Quellfelder und Fallback-Reihenfolge

## 1) RIS Normsegmente

**Bevorzugte Felder (in Reihenfolge):**
1. RIS-Dokumentidentifikator (`doc-id`)
2. segment-spezifische Kennung (`segment-id`, z. B. Paragraph/Artikel/Absatz)
3. Fassungskennung (`version-id`, falls vorhanden)

**Fallback-Reihenfolge:**
- A: `doc-id + segment-id + version-id`
- B: `doc-id + segment-id`
- C: kein weiterer Fallback (wenn segment-id fehlt → Lücke markieren)

**Schema:**
`ris:normseg:<doc-id>:<segment-id>[:<version-id>]`

## 2) RIS Gesamtdokumente

**Bevorzugte Felder (in Reihenfolge):**
1. RIS-Dokumentidentifikator (`doc-id`)
2. Fassungskennung (`version-id`, falls vorhanden)

**Fallback-Reihenfolge:**
- A: `doc-id + version-id`
- B: `doc-id`
- C: kein weiterer Fallback

**Schema:**
`ris:doc:<doc-id>[:<version-id>]`

## 3) JUSLINE Diskussionen/Kommentare

**Bevorzugte Felder (in Reihenfolge):**
1. JUSLINE-Material-Identifier (`material-id`, falls vorhanden)
2. kanonisierter URL-Pfadslug (`slug`)

**Fallback-Reihenfolge:**
- A: `material-id`
- B: `slug`
- C: kein weiterer Fallback

**Schema:**
`jusline:mat:<material-id-or-slug>`

## 4) Spätere Entscheidungen

**Bevorzugte Felder (in Reihenfolge):**
1. amtlicher/gerichtlicher Entscheidungs-Identifier (`decision-id`)
2. Entscheidungsdatum (ISO, nur wenn zur Eindeutigkeit nötig)

**Fallback-Reihenfolge:**
- A: `decision-id`
- B: `decision-id + date`
- C: bei fehlender belastbarer Kennung keine ID erzeugen

**Schemas:**
- RIS: `ris:dec:<decision-id>` (optional mit `:<date>` wenn nötig)
- JUSLINE: `jusline:dec:<decision-id-or-slug>`

## Konkrete Beispiel-IDs (mind. 6)

1. `ris:normseg:bundesrecht.bgbli_2000_100:par-5-abs-2:v2026-01-01`
2. `ris:normseg:bundesrecht.bgbli_2000_100:art-3`
3. `ris:doc:bundesrecht.bgbli_2000_100:v2026-01-01`
4. `ris:doc:bundesrecht.bgbli_2000_100`
5. `jusline:mat:kommentar-12345`
6. `jusline:mat:stgb-146-betrug-kommentar`
7. `ris:dec:ogh_12os34_26x`
8. `jusline:dec:ogh-12os34-26x-2026-02-14`

## Index-Referenzregeln

- `index/by-stable-id.json`: `stable_id` → relativer Markdown-Pfad
- `index/by-source-id.json`: `source_id` → `stable_id`
- Ein `source_id` zeigt auf genau eine aktive `stable_id`; ältere Stände werden über `supersedes` im Frontmatter verknüpft.
