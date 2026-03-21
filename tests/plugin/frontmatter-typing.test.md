# Testfälle: Frontmatter Typing (textuell)

## Ziel

Sicherstellen, dass Frontmatter-Pflichtfelder typseitig sichtbar sind.

## Fall 1: Basistyp enthält Pflichtfelder

**Erwartung:**
- `FrontmatterBase` enthält mindestens:
  - `stable_id`
  - `source`
  - `source_url`
  - `doc_type`
  - `title`
  - `fetched_at`
  - `version_label`
  - `fassung_typ`

## Fall 2: CachedArtifact nutzt FrontmatterBase

**Erwartung:**
- `CachedArtifact.frontmatter` ist kein unstrukturiertes `Record` mehr.
- Vertragsbezug auf `docs/frontmatter-schema.md` erkennbar.

## Fall 3: Optionale Felder bleiben scaffold-tauglich

**Erwartung:**
- optionale Felder sind vorhanden, aber nicht über-spezialisiert.
- keine erzwungene Vollspezialisierung pro Dokumenttyp in dieser Phase.
