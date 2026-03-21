# Testfälle: Error Contracts (textuell)

## Ziel

Sicherstellen, dass Fehlerformat und Fehlerklassen konsistent verwendet werden.

## Fall 1: Gemeinsame Fehlerstruktur

**Erwartung:**
- Fehlerobjekt enthält mindestens:
  - `code`
  - `message`
- optional:
  - `details`
  - `retryable`

## Fall 2: Result-Format ist konsistent

**Erwartung:**
- `ok=true` => `data` vorhanden, kein `error`
- `ok=false` => `error` vorhanden, kein `data`

## Fall 3: Nicht implementierte Stubs

**Erwartung:**
- Jeder Tool-Stub liefert aktuell `NOT_IMPLEMENTED`
- Fehlerform entspricht gemeinsamer Struktur

## Fall 4: Policy-nahe Fehler für Sekundärquelle

**Erwartung:**
- Vertrag sieht `POLICY_BLOCKED` für JUSLINE-bezogene Einschränkungen vor
- keine impliziten/undokumentierten Policy-Fehlercodes
