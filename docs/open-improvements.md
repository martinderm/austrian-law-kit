# Offene Handlungsfelder (Architecture Review 2026-08-23)

Quelle: Architecture-Review gegen gent-architecture/skill-engineering-and-modularity.md,
icm-workspace-architecture.md und harness-agnostic-workspace-design.md.

---

## Hohe Prioritaet

### 1. TypeScript-Nutzung als bewusste Ausnahme dokumentieren
- [ ] Eintrag im decision-log.md ergaenzen: TypeScript wurde gewaehlt wegen OpenClaw-Oekosystem-Kompatibilitaet
- [ ] Optional: SKILL.md-Frontmatter um language: typescript oder aehnliches Feld ergaenzen
- Status: Die agent-architecture-Standards erlauben alternative Sprachen nun explizit bei dokumentierter Begruendung

### 2. SKILL.md entschlacken und schichten
- [ ] SKILL.md auf Policy + Routing reduzieren (~80-100 Zeilen)
- [ ] Tool-Orchestrierungsdetails (Zeilen 51-102) nach eferences/tool-orchestration.md auslagern
- [ ] CLI-Dokumentation aus SKILL.md entfernen (lebt bereits in README.md)
- [ ] Cache-Konfigurationsbeispiele nach eferences/cache-config.md oder bestehende Doku verweisen
- Ziel: Agent laedt bei reiner Rechtsrecherche nur ~800 Tokens statt ~3.200

### 3. SKILL.md Frontmatter vervollstaendigen
- [ ] 	riggers ergaenzen (aus skills-catalog.yaml: austrian law, oesterreichisches recht, statute, regulation)
- [ ] last_radius ergaenzen
- [ ] category ergaenzen (legal)

---

## Mittlere Prioritaet

### 4. CLI Envelope an Standard anpassen
- [ ] ok -> success (Feld umbenennen)
- [ ] ction-Feld ergaenzen (Tool-Name)
- [ ] state-Feld ergaenzen
- [ ] message-Feld ergaenzen (Human-readable summary)
- Achtung: Breaking Change fuer bestehende Konsumenten - ggf. Uebergangszeit mit Doppelfeldern

### 5. blast_radius korrigieren
- [ ] In skills-catalog.yaml von ead_only auf workspace_scoped aendern (Skill schreibt Cache-Dateien)
- [ ] In SKILL.md-Frontmatter konsistent nachziehen

### 6. Veraltete Pfadreferenzen fixen
- [ ] current-status.md: skills/austrian-law/SKILL.md -> Root-Level SKILL.md
- [ ] rchitecture.md Zeile 14: skills/austrian-law/ -> Root
- [ ] Weitere Binnendoku auf konsistente Pfade pruefen

### 7. architecture.md aktualisieren
- [ ] Nicht-Ziele-Sektion entfernen oder als erledigt markieren (Plugin, Parser, Netzwerk sind laengst umgesetzt)
- [ ] Aktuellen Architekturstand reflektieren (3-Schichten-Modell mit CLI + Plugin + Cache)

---

## Niedrige Prioritaet

### 8. ris_sync_laws durchregistrieren
- [ ] Tool-Vertrag in 	ool-contracts.md dokumentieren
- [ ] In src/index.ts TOOL_NAMES-Konstante aufnehmen
- [ ] Oder: aus SKILL.md entfernen, falls nicht als oeffentliches Tool gedacht

### 9. SKILL.md doppelte Nummerierung bereinigen
- [ ] Zeilen 71-73: zwei identische Punkt-11-Nummern korrigieren
- [ ] Sinngemäss doppelten Eintrag konsolidieren

### 10. src/index.ts Skeleton-Status aktualisieren
- [ ] status: "skeleton" und implemented: false entfernen oder aktualisieren
- [ ] Interface reflektiert den tatsaechlichen produktiven Stand nicht

### 11. references/sources.md anlegen
- [ ] Zentralen Source-Katalog erstellen mit Abrufzeitpunkt und Verlaesslichkeitseinschaetzung
- [ ] Konsultierte APIs und Dokumentationen systematisch erfassen (Learning Forward)

### 12. next-session.md ueberarbeiten
- [ ] Verweise auf archivierte Plandateien aktualisieren
- [ ] Kontext an aktuellen Projektstand anpassen
