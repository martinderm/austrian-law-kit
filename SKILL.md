---
name: austrian-law-kit
description: Workspace-Skill für die strukturierte, quellenklare Arbeit mit österreichischen Rechtstexten. Verwende ihn für österreichische Rechtsrecherche mit klarer Quellenhierarchie (RIS primär, JUSLINE sekundär/opt-in), transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut, Einordnung, Diskussionen/Kommentaren und Entscheidungen.
triggers: [austrian law, österreichisches recht, statute, regulation, RIS, JUSLINE, Gesetz, Paragraf]
category: legal
blast_radius: workspace_scoped
language: typescript
---

# Skill: austrian-law-kit

## Zweck

Dieser Skill steuert die fachliche Orchestrierung für österreichische Rechtstexte mit klarer Quellenhierarchie, transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut vs. Einordnung.

## Verbindliche Quellenpolitik

1. **RIS ist Primärquelle** für Normtext, Struktur und Metadaten.
2. **JUSLINE ist Sekundärquelle** für optionalen Zusatzkontext.
3. JUSLINE nur ergänzend nutzen, nicht als Ersatz für RIS.
4. Inhalte aus JUSLINE standardmäßig nur bei **ausdrücklicher Nachfrage** oder klar erkennbarem Zusatznutzen laden.
5. Standardmäßig mit der **konsolidierten RIS-Fassung** arbeiten.
6. **Arbeitsfassung** und **verbindliche Fassung** immer explizit unterscheiden.
7. Bei Konflikten zwischen RIS und JUSLINE gilt **RIS**.

## Antwortstruktur (standardmäßig 4 Schichten)

A) **Fundstelle / Wortlaut**
- Nenne die konkrete Fundstelle und gib den relevanten Wortlaut bzw. einen präzisen Auszug wieder.

B) **Verständliche Zusammenfassung**
- Erkläre den Inhalt in klarer, nicht-juristischer Sprache.

C) **Auslegungsfragen / Grenzen**
- Markiere, wo Interpretationsspielraum, Anwendungsgrenzen oder fehlender Kontext bestehen.

D) **Quellenlage / Unsicherheit**
- Weise aus, welche Quelle(n) genutzt wurden und wie sicher die Aussage ist.

Bei sehr kleinen, rein mechanischen Nachfragen darf die Antwort knapper sein, die Trennung von Quelle, Einordnung und Unsicherheit bleibt aber bestehen.

## Rechtsberatungsgrenze

- Keine Behauptung verbindlicher Rechtsberatung.
- Der Skill liefert Wortlaut, Quellenlage und vorsichtige Einordnung.
- Keine künstliche Sicherheit bei unklarer Quellenlage oder fehlendem Sachverhaltskontext.

## Datenintegrität

- Fehlende Informationen dürfen nicht erfunden oder glatt ergänzt werden.
- Lücken müssen ausdrücklich benannt werden.
- Wortlaut, Paraphrase und ergänzende Interpretation sauber auseinanderhalten.

## Verfügbare Tools

### RIS (Primärquelle)
- `ris_sync_laws` — Batch-Synchronisation mehrerer Gesetze
- `ris_fetch_whole_law` — Gesetzesvolltext
- `ris_fetch_segment` — Einzelner Paragraf
- `ris_search` — Discovery-Hilfe (nicht als alleiniger Einstieg modellieren)

### JUSLINE (Sekundärquelle)
- `jusline_fetch_discussions` — Diskussionen/Kommentare
- `jusline_list_decisions` — Entscheidungslisten

Bekannte `sourceId` oder RIS-URL → direkt Fetch-Tools nutzen.
`ris_search` nur wenn Referenz unbekannt. Bei unklarer Lage: Quellenstatus klären vor Interpretation.

## Referenzen (bei Bedarf laden)

- **Tool-Orchestrierung & Ablaufdetails**: `references/tool-orchestration.md`
- **JUSLINE-Felder, Grenzen, Antwortdisziplin**: `references/jusline.md`
- **Tool-Verträge (Input/Output/Fehler)**: `docs/tool-contracts.md`
- **CLI-Nutzung & JSON-Formate**: `README.md`
- **Frontmatter-Schema**: `docs/frontmatter-schema.md`
- **Stable-ID-Strategie**: `docs/stable-id-strategy.md`
