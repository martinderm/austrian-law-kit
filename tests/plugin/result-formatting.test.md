# Testfälle: Result Formatting (textuell)

## Ziel

Sicherstellen, dass Tool-Ergebnisse einheitlich über das Format-Hilfsmodul ausgegeben werden.

## Fall 1: formatToolResult kapselt Ausgabeform

**Erwartung:**
- `formatToolResult(...)` liefert nur `content` mit Text-Payload.
- `index.ts` enthält kein direktes `JSON.stringify(...)` mehr.

## Fall 2: Erfolgs-/Fehlerresultat gleiches Hüllformat

**Erwartung:**
- sowohl `ok=true` als auch `ok=false` werden in dieselbe `content`-Struktur überführt.

## Fall 3: Keine undokumentierten Zusatzfelder

**Erwartung:**
- keine zusätzlichen Rückgabefelder wie `details`.
- Ausgabe bleibt API-vorsichtig und konsistent.
