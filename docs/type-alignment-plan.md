# Type Alignment Plan

## Ziel

Konsistente Ausrichtung zwischen:
1. Dokumentationsvertrag (`docs/frontmatter-schema.md`, `docs/tool-contracts.md`)
2. TypeScript-Typen (`src/types/*`)
3. Laufzeitschemas (`src/tools/schemas.ts`)

## Aktueller Stand

- Frontmatter-Basistyp ist in `src/types/frontmatter.ts` eingeführt.
- `CachedArtifact.frontmatter` verweist auf den Basistyp statt auf unstrukturiertes `Record`.
- Tool-Input-Schemas sind pro Tool in `schemas.ts` hinterlegt.
- Tool-Ergebnisse werden über `format-result.ts` einheitlich in `content` überführt.

## Bewusst noch generische Bereiche

- `metadata` bleibt `Record<string, unknown>`.
- optionale Frontmatter-Felder bleiben überwiegend stringbasiert.
- keine spezialisierten Frontmatter-Subtypen pro `doc_type` in dieser Phase.

## Nächste Spezialisierungen (später)

- Frontmatter-Subtypen je `doc_type` (z. B. `NormSegmentFrontmatter`).
- stärkere Typisierung für Datums-/Referenzfelder.
- engeres Mapping zwischen Laufzeitschema und TS-Typen (inkl. Validierungsableitung).
