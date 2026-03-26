# cache-io-consistency (Testplan)

Ziel: lokale Cache-Konsistenzregeln verifizieren, ohne RIS-/JUSLINE-Fetching und ohne Parser-Ausweitung.

## Scope

- `law_cache_put`
- `law_cache_get`
- Konsistenzprüfung in `readArtifactByStableId` (Pfad-Erwartung vs. Frontmatter)
- agentbezogene Cache-Root-Ableitung aus dem Plugin-Tool-Kontext
- optionaler `cacheRoot`-Override aus Plugin-Konfiguration

## Testfälle

### 1) Workspace des aufrufenden Agenten wird standardmäßig verwendet

**Given**
- Plugin-Tool-Kontext enthält `workspaceDir=/tmp/agent-a/workspace`.
- Plugin-Konfiguration enthält keinen `cacheRoot`-Override.

**When**
- ein RIS-Fetch-Tool schreibt ein Artefakt.

**Then**
- Artefakt liegt unter `/tmp/agent-a/workspace/memory/references/austrian-law/...`.
- Kein Abhängigkeitszwang auf globales `process.cwd()`.

---

### 2) cacheRoot aus Plugin-Konfiguration überschreibt den Agent-Workspace

**Given**
- Plugin wird mit `cacheRoot=/tmp/law-cache-a` initialisiert.
- Tool-Kontext enthält zusätzlich einen `workspaceDir`.

**When**
- ein RIS-Fetch-Tool schreibt ein Artefakt.

**Then**
- Artefakt liegt unter `/tmp/law-cache-a/...`.
- Der Override hat Vorrang vor dem Agent-Workspace.

---

### 3) Env-Var nur Fallback

**Given**
- Plugin-Konfiguration enthält keinen `cacheRoot`.
- Tool-Kontext enthält keinen `workspaceDir`.
- `OPENCLAW_AUSTRIAN_LAW_CACHE_ROOT=/tmp/law-cache-env` gesetzt.

**When**
- `law_cache_put` schreibt ein Artefakt.

**Then**
- Zielpfad nutzt Env-Var-Fallback.

---

### 4) law_cache_put validiert stableId gegen frontmatter.stable_id

**Given**
- `stableId !== frontmatter.stable_id`.

**When**
- `law_cache_put` wird aufgerufen.

**Then**
- Fehlercode `VALIDATION_ERROR`.

---

### 5) law_cache_get mit explizitem docType (ohne Heuristik)

**Given**
- Artefakt existiert unter korrektem Pfad.

**When**
- `law_cache_get({ stableId, docType })`.

**Then**
- Treffer ohne DocType-Suchheuristik.
- `ok: true` und korrektes Artefakt.

---

### 6) law_cache_get ohne docType (Übergangsheuristik)

**Given**
- Artefakt existiert, `docType` wird nicht mitgegeben.

**When**
- `law_cache_get({ stableId })`.

**Then**
- Heuristische DocType-Erkennung findet den Pfad.
- `ok: true`.

---

### 7) Konsistenzbruch source -> CONFLICT

**Given**
- Datei liegt am erwarteten Pfad, Frontmatter enthält aber `source` ≠ angefragte Quelle.

**When**
- `law_cache_get` liest Artefakt.

**Then**
- Fehlercode `CONFLICT` mit Hinweis auf `frontmatter.source`.

---

### 8) Konsistenzbruch doc_type -> CONFLICT

**Given**
- Datei liegt am Pfad für `docType=A`, Frontmatter enthält aber `doc_type=B`.

**When**
- `law_cache_get` liest Artefakt.

**Then**
- Fehlercode `CONFLICT` mit Hinweis auf `frontmatter.doc_type`.

---

### 9) Fehlendes Artefakt -> NOT_FOUND

**Given**
- Kein passender Cache-Eintrag vorhanden.

**When**
- `law_cache_get` wird aufgerufen.

**Then**
- Fehlercode `NOT_FOUND`.

## Nicht im Scope

- RIS-/JUSLINE-Netzlogik
- HTML/XML-Parser
- inhaltliche Extraktion oder Normalisierung
