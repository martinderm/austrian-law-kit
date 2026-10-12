---
type: object
cluster: retrieval
universe: live
status: deprecated
entity: scripts/lib/ris_judikatur.py
verified_at: 2026-10-12
---

# Jusline (Deprecated) / RIS-Judikatur

Das frühere Web-Scraping privater JUSLINE-Seiten wurde im Python-Refactoring vollständig durch die amtliche **RIS-Judikatur OGD API v2.6** (`scripts/lib/ris_judikatur.py`) ersetzt.

## Why this shape
Rechtsprechung (OGH, VfGH, VwGH) wird direkt aus den amtlichen RIS-OGD-Endpunkten des Bundeskanzleramts bezogen, um Urheberrechtsfragen, Bot-Protection und HTML-Scraping-Fragilität auszuschließen.

## Shape
Abfrage über `search_case_law()` gegen `https://data.bka.gv.at/ris/api/v2.6/Judikatur?Applikation=Justiz`.
Extrahiert strukturierte `CourtDecision`-Objekte mit Geschäftszahlen, Rechtssatznummern, ECLI, Entscheidungsdaten und Leitsatztexten aus dem amtlichen XML.

- [scripts/lib/ris_judikatur.py](../../../scripts/lib/ris_judikatur.py)

## Connected to
[tools](tools.md), [ris](ris.md), [policy](policy.md). Prozesse: [Prozesskatalog](../processes/CONTEXT.md).

## Surfaces
RIS-Judikatur OGD-Schnittstelle wird gelesen; CLI exponiert `search_decisions` und `--include-decisions`.
