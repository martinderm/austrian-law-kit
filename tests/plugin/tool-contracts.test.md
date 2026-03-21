# Testfälle: Tool Contracts (textuell)

## Ziel

Sicherstellen, dass alle geplanten Tools einen dokumentierten und typisierten Vertrag haben.

## Fall 1: Vollständige Toolliste vorhanden

**Erwartung:**
- Verträge vorhanden für:
  - `ris_search`
  - `ris_fetch_segment`
  - `ris_fetch_whole_law`
  - `jusline_fetch_discussions`
  - `jusline_list_decisions`
  - `law_cache_get`
  - `law_cache_put`

## Fall 2: Quelle je Tool klar

**Erwartung:**
- RIS-Tools als Primärquelle markiert
- JUSLINE-Tools als Sekundärquelle markiert
- Cache-Tools als interne Tools markiert

## Fall 3: Input/Output pro Tool definiert

**Erwartung:**
- Jeder Toolvertrag hat Input-Felder
- Jeder Toolvertrag hat Output-Form
- Keine impliziten, undokumentierten Felder

## Fall 4: Skeleton ohne Implementierung

**Erwartung:**
- Stub-Dateien pro Tool vorhanden
- nur Platzhalter/NOT_IMPLEMENTED
- keine Netzwerk- oder Parserlogik
