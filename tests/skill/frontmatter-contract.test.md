# Testfälle: Frontmatter Contract (textuell)

## Ziel

Absichern, dass gecachte Markdown-Dateien den Frontmatter-Vertrag einhalten.

## Pflichtfelder

- `stable_id`
- `source`
- `source_url`
- `doc_type`
- `title`
- `fetched_at`
- `version_label`
- `fassung_typ`

## Fall 1: RIS Normsegment

**Erwartung:**
- `source=ris`
- `doc_type=norm_segment`
- `fassung_typ` ist `Arbeitsfassung` oder `verbindliche Fassung`

## Fall 2: RIS Gesamtdokument

**Erwartung:**
- `source=ris`
- `doc_type=norm_document`
- `representation=whole_law`
- Titel ist der eigentliche Langtitel der Norm, nicht die ausschweifende RIS-Seitenüberschrift
- Stable ID passt zum `ris:doc:`-Schema

## Fall 3: JUSLINE Kommentar

**Erwartung:**
- `source=jusline`
- `doc_type=commentary` oder `discussion`
- Hinweis im Inhalt/Metadaten, dass JUSLINE Sekundärquelle ist

## Fall 4: Fehlende Pflichtfelder

**Erwartung:**
- Dokument gilt als ungültig
- Lücke wird explizit benannt, nicht stillschweigend ergänzt
