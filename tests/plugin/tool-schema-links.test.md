# Testfälle: Tool Schema Links (textuell)

## Ziel

Sicherstellen, dass jede Tool-Definition auf ein konkretes Input-Schema verweist.

## Fall 1: Definition -> Schema-Referenz

**Erwartung:**
- Jede Definition enthält `inputSchemaRef`.
- `inputSchemaRef` ist pro Tool eindeutig und nachvollziehbar.

## Fall 2: Definition -> Schema-Objekt

**Erwartung:**
- Für jede Tool-ID existiert ein Eintrag in `TOOL_INPUT_SCHEMAS`.
- Registry enthält `inputSchema` je Tool.

## Fall 3: Keine schema-losen Tools

**Erwartung:**
- Keine Tool-Definition ohne Schema-Bezug.
- Keine zusätzliche Tool-ID ohne Schema.
