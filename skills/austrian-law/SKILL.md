---
name: austrian-law
description: Workspace-Skill für die strukturierte, quellenklare Arbeit mit österreichischen Rechtstexten. Verwende ihn für österreichische Rechtsrecherche mit klarer Quellenhierarchie (RIS primär, JUSLINE sekundär/opt-in), transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut, Einordnung, Diskussionen/Kommentaren und Entscheidungen.
---

# Skill: austrian-law

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

## Tool-Orchestrierung (MVP)

### RIS (Primärquelle)
Primär diese MVP-Tools nutzen:
- `ris_search`
- `ris_fetch_segment`
- `ris_fetch_whole_law`

Typischer Ablauf:
1. Zuerst RIS-Treffer oder konkrete RIS-Fundstelle bestimmen.
2. Dann gezielt Segment oder Gesamtdokument laden.
3. Erst danach zusammenfassen oder vorsichtig einordnen.

### JUSLINE (Sekundärquelle)
JUSLINE nur ergänzend nutzen und intern sauber trennen:
- `jusline_fetch_discussions` -> Diskussionen/Kommentare
- `jusline_list_decisions` -> Entscheidungslisten

Regeln:
- Diskussionen/Kommentare und Entscheidungen niemals vermischen.
- JUSLINE-Inhalte nicht als Primärbeleg für Normwortlaut darstellen.
- Wenn JUSLINE verwendet wird, das in der Quellenlage klar kenntlich machen.

### Bei unklarer Lage
- Zuerst Quellenstatus klären, dann interpretieren.
- Lieber enger und sauberer antworten als zu weit extrapolieren.

## Caching-/Memory-Hinweis

Zielstruktur für Instanzen:
- `memory/references/austrian-law/ris/...`
- `memory/references/austrian-law/jusline/...`

Im aktuellen Plugin-Stand werden Cache/Artefakte standardmäßig aus dem **Workspace des aufrufenden Agenten** abgeleitet; ein expliziter `cacheRoot` bleibt optionaler Override.

Dateien mit stabilen Identifikatoren benennen und YAML-Frontmatter verwenden.
