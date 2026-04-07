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
2. Für `ris_fetch_segment` und `ris_fetch_whole_law` bevorzugt eine saubere `sourceId` bzw. eine RIS-URL mit auflösbarer `Dokumentnummer` verwenden.
3. RIS-Fetch-Tools nicht mit frei geratenen ELI-/Paragraf-URLs füttern, wenn daraus keine `sourceId` ableitbar ist.
4. Wenn alte Cache-Artefakte einen Re-Test verfälschen könnten, `refresh: true` verwenden, um den Inhalt frisch zu laden.
5. Erst danach gezielt Segment oder Gesamtdokument laden.
6. Erst danach zusammenfassen oder vorsichtig einordnen.

### JUSLINE (Sekundärquelle)
JUSLINE nur ergänzend nutzen und intern sauber trennen:
- `jusline_fetch_discussions` -> Diskussionen/Kommentare
- `jusline_list_decisions` -> Entscheidungslisten

Regeln:
- Diskussionen/Kommentare und Entscheidungen niemals vermischen.
- JUSLINE-Inhalte nicht als Primärbeleg für Normwortlaut darstellen.
- Wenn JUSLINE verwendet wird, das in der Quellenlage klar kenntlich machen.
- `refresh: true` als gezielten Force-Reload verwenden, wenn ein Re-Test nicht durch ältere Artefakte oder Query-Index-Reuse verfälscht werden soll.
- Bei JUSLINE berücksichtigt der Cache zusätzlich einen Query-Index über `query + kind + limit` mit 24h TTL; ohne `refresh` kann daher bewusst Wiederverwendung auftreten.
- JUSLINE-Treffer liefern je nach Tool und Seitentyp über die Basistreffer hinaus nur optional angereicherte Metadaten; fehlende Felder nicht erraten.

Typische JUSLINE-Nutzung:
1. Zuerst RIS-Wortlaut bzw. RIS-Fundstelle klären.
2. Nur bei ausdrücklichem Bedarf oder erkennbarem Zusatznutzen ergänzend JUSLINE laden.
3. Für Kommentare `jusline_fetch_discussions`, für Entscheidungslisten `jusline_list_decisions` verwenden.
4. Bei Re-Checks oder Parser-Tests `refresh: true` setzen.
5. In der Antwort klar trennen: RIS für Normwortlaut, JUSLINE nur für Zusatzkontext.

Für konkrete JUSLINE-Felder, Detail-Previews, Grenzen und Antwortdisziplin siehe `references/jusline.md`.

### Bei unklarer Lage
- Zuerst Quellenstatus klären, dann interpretieren.
- Bei `VALIDATION_ERROR` der RIS-Fetch-Tools zuerst die RIS-Fundstelle sauber über `ris_search` bzw. eine belastbare `sourceId` auflösen.
- Nicht vorschnell auf `web_fetch` oder allgemeine Websuche ausweichen, wenn das Ziel eigentlich eine RIS-Primärquelle ist.
- `web_fetch` für RIS-Normtexte nur als Notbehelf verwenden und dann die geringere Verlässlichkeit ausdrücklich markieren.
- Lieber enger und sauberer antworten als zu weit extrapolieren.

## Caching-/Memory-Hinweis

Zielstruktur für Instanzen:
- `memory/references/austrian-law/ris/...`
- `memory/references/austrian-law/jusline/...`

Im aktuellen Plugin-Stand werden Cache/Artefakte standardmäßig aus dem **Workspace des aufrufenden Agenten** abgeleitet; ein expliziter `cacheRoot` bleibt optionaler Override.

Dateien mit stabilen Identifikatoren benennen und YAML-Frontmatter verwenden.
