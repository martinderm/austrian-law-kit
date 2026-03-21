# Testfälle: Stable ID Helpers (textuell)

## Ziel

Sicherstellen, dass Stable-ID-Hilfsfunktionen konsistent und deterministisch arbeiten.

## Fall 1: Prefix-Erkennung

**Erwartung:**
- `ris:...` => Quelle `ris`
- `jusline:...` => Quelle `jusline`
- unbekannte Prefixe => invalid

## Fall 2: Normalisierung

**Erwartung:**
- Eingaben werden getrimmt und lowercase normalisiert.
- Validierung läuft gegen normalisierte Form.

## Fall 3: Formatvalidierung

**Erwartung:**
- nur erlaubte Zeichen `[a-z0-9._:-]`
- bei Verstoß: invalid bzw. Exception bei `assertStableId`

## Fall 4: Quelle aus Stable ID

**Erwartung:**
- `getStableIdSource` ist deterministisch
- keine impliziten Heuristiken außerhalb Prefix
