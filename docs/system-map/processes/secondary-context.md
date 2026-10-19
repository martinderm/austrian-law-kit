---
type: process
universe: leftover
status: stale
entity: plugin/openclaw-austrian-law/src/tools/jusline_list_decisions.ts
verified_at: 2026-10-19
revision: 2af21a4
consumes: [../objects/policy.md, ../objects/tools.md, ../objects/jusline.md]
produces: [../objects/jusline.md, ../objects/cache.md]
---

# secondary-context (entfernt)

Historischer Prozess der TypeScript-Laufzeit: JUSLINE-Sekundärkontext — Entscheidungslisten (`jusline_list_decisions`) und Diskussionslisten (`jusline_fetch_discussions`) von jusline.at mit Query-Index und Preview-Cache. Das JUSLINE-Web-Scraping wurde mit dem Python-Refactoring vollständig entfernt (`cc2103c`, ALK-03: Urheberrecht, Bot-Protection, kein stabiler API-Vertrag).

**Heutiger Ersatzweg:** Amtliche Judikatur (OGH/VfGH/VwGH) über die RIS-Justiz-OGD-Schnittstelle — `search_decisions` bzw. `fetch_norm --include-decisions` (`fetch-and-verify`).

## If you change this
Kein aktiver Code — Karte dient nur der Historie.

## Surfaces
Keine aktive Oberfläche; JUSLINE-Fixtures unter `fixtures/jusline/` wurden mit demselben Changeset entfernt.

## See
[fetch-and-verify](fetch-and-verify.md), [jusline](../objects/jusline.md), [tools](../objects/tools.md).
