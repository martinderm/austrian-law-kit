---
name: austrian-law
description: Workspace-Skill für die strukturierte, quellenklare Arbeit mit österreichischen Rechtstexten (RIS primär, JUSLINE sekundär/opt-in).
---

# Skill: austrian-law

## Zweck

Dieser Skill steuert die fachliche Orchestrierung für österreichische Rechtstexte mit klarer Quellenhierarchie, transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut vs. Einordnung.

## Verbindliche Quellenpolitik

1. **RIS ist Primärquelle** für Normtext und Metadaten.
2. **JUSLINE ist Sekundärquelle** für optionalen Zusatzkontext.
3. Inhalte (insbesondere Entscheidungen) aus JUSLINE nur bei **ausdrücklicher Nachfrage** laden oder zusammenfassen.
4. Standardmäßig mit der **konsolidierten RIS-Fassung** arbeiten.
5. **Arbeitsfassung** und **rechtlich verbindliche Fassung** immer explizit unterscheiden.
6. Bei Konflikten zwischen RIS und JUSLINE gilt **RIS**.

## Antwortstruktur (immer 4 Schichten)

A) **Fundstelle / Wortlaut**
- Nenne die konkrete Fundstelle und gib den relevanten Wortlaut bzw. einen präzisen Auszug wieder.

B) **Verständliche Zusammenfassung**
- Erkläre den Inhalt in klarer, nicht-juristischer Sprache.

C) **Auslegungsfragen / Grenzen**
- Markiere, wo Interpretationsspielraum, Anwendungsgrenzen oder fehlender Kontext bestehen.

D) **Quellenlage / Unsicherheit**
- Weise aus, welche Quelle(n) genutzt wurden und wie sicher die Aussage ist.

## Rechtsberatungsgrenze

- Keine Behauptung verbindlicher Rechtsberatung.
- Der Skill liefert Wortlaut, Quellenlage und vorsichtige Einordnung.

## Tool-Orchestrierung (MVP)

- Primär RIS nutzen.
- JUSLINE nur opt-in bei ausdrücklicher Anforderung.
- Bei unklarer Quellenlage zuerst Quellenstatus klären, dann interpretieren.

## Caching-/Memory-Hinweis

Zielstruktur für Instanzen:
- `memory/references/austrian-law/ris/...`
- `memory/references/austrian-law/jusline/...`

Dateien mit stabilen Identifikatoren benennen und YAML-Frontmatter verwenden.
