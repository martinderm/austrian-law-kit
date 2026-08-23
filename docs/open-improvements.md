# Offene Handlungsfelder (Architecture Review 2026-08-23)

Quelle: Architecture-Review gegen `agent-architecture/skill-engineering-and-modularity.md`,
`icm-workspace-architecture.md` und `harness-agnostic-workspace-design.md`.

---

## Erledigt

- [x] #1 TypeScript-Nutzung als bewusste Ausnahme dokumentiert (decision-log.md)
- [x] #3 SKILL.md Frontmatter vervollstaendigt (triggers, blast_radius, category, language)
- [x] #5 blast_radius auf workspace_scoped korrigiert (catalog + decision-log)
- [x] #6 Veraltete Pfadreferenzen in current-status.md und architecture.md gefixt
- [x] #7 architecture.md aktualisiert (Nicht-Ziele -> Implementierungsstand)
- [x] #8 ris_sync_laws durchregistriert (tool-contracts.md + TOOL_NAMES)
- [x] #9 SKILL.md doppelte Nummerierung behoben
- [x] #10 src/index.ts Skeleton-Status auf MVP aktualisiert
- [x] #11 references/sources.md angelegt
- [x] #12 next-session.md ueberarbeitet
- [x] #2 SKILL.md entschlackt (192 -> ~75 Zeilen, Details nach references/tool-orchestration.md)

---

## Offen

### CLI Envelope an Standard anpassen (eigenstaendiger Refactor)

Der Shared-Skills-Standard definiert:
`json
{ "action": "...", "success": true, "state": "...", "message": "...", "data": {...}, "error": null }
`

Der Skill nutzt derzeit:
`json
{ "ok": true, "data": {...}, "error": null, "meta": {...} }
`

Umstellung betrifft ca. 11 Quelldateien + Tests. Empfohlenes Vorgehen:
- [ ] `shared.ts`: `ToolResult` von `ok` auf `success` umstellen, `action`/`state`/`message` ergaenzen
- [ ] Alle Tool-Implementierungen in `src/tools/` anpassen
- [ ] Alle RIS-API-Clients in `src/ris-api/` anpassen
- [ ] Tests (`parser-smoke`, `tool-smoke`, `cli-json`) anpassen
- [ ] `docs/tool-contracts.md` Ergebnisformat-Dokumentation aktualisieren
- [ ] `npm run test:smoke` nach Umstellung gruen
