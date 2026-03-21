# Testfälle: Tool Registry (textuell)

## Ziel

Sicherstellen, dass die zentrale Tool-Registry vollständig und konsistent ist.

## Fall 1: Jede geplante Tool-ID genau einmal

**Erwartung:**
- `ris_search`
- `ris_fetch_segment`
- `ris_fetch_whole_law`
- `jusline_fetch_discussions`
- `jusline_list_decisions`
- `law_cache_get`
- `law_cache_put`

Jede ID ist in der Registry genau einmal vorhanden.

## Fall 2: Jede Registry-Definition verweist auf Stub

**Erwartung:**
- Zu jeder Tool-ID ist eine Stub-Funktion zugeordnet.
- Stub liefert in dieser Phase `NOT_IMPLEMENTED`.

## Fall 3: Keine Tool-ID ohne dokumentierten Vertrag

**Erwartung:**
- Jede Registry-ID ist in `docs/tool-contracts.md` beschrieben.
- Jede Registry-ID ist in `src/types/tool-contracts.ts` typisiert.

## Fall 4: Keine undokumentierte zusätzliche Tool-ID

**Erwartung:**
- Keine weiteren IDs außerhalb der vereinbarten 7 Tools in Registry/Definitionen.
- Keine impliziten Alias-IDs in der Registry.
