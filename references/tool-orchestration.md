# Tool-Orchestrierung & RIS-Primärrechtsprüfung

Detaillierte Anweisungen für die Tool-Nutzung und Qualitätssicherung im `austrian-law-kit` (Python-3-Laufzeit, stdlib-only).

## Capability-Check zu Sitzungsbeginn

Vor der Durchführung von Recherche-Aufgaben ist die Einsatzbereitschaft der CLI sicherzustellen:

```bash
python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --json
```

Verfügbare Befehle (`scripts/austrian_law_cli.py`): `fetch_norm` (Einzelnorm), `fetch_whole_law` (Gesamtfassung), `search_law` (Normsuche), `search_decisions` (amtliche Judikatur), `list_canonical` (Gesetzeskatalog), `migration_guide` (Migrationsanleitung). Alle Befehle unterstützen `--json` für den standardisierten Structured CLI Envelope.

## Gestufter RIS-Fallback

Die Rechtsprüfung folgt strikt dem 3-Stufen-Prinzip:

1. **Stufe 1 — Direkte Quell-Identifikatoren (bevorzugt)**:
   - Liegt eine Dokumentnummer (z. B. `NOR40273695`, `LOO11000699`) oder ein bekanntes Gesetzeskürzel vor, **direkt** `fetch_norm` (`--law`, `--paragraph`) bzw. `fetch_whole_law` (`--law`) aufrufen; beide akzeptieren Kürzel, Slug, Gesetzes- und Dokumentnummer.
   - Retrieval-Method: `ris_xml_direct`.

2. **Stufe 2 — Kanonische Gesetzesauflösung**:
   - Unbekannte Freitextabfragen werden über die vorindizierte Registry [`references/canonical-laws.json`](../references/canonical-laws.json) auf die offizielle RIS-Gesetzesnummer aufgelöst (z. B. `ABGB` → `10001622`) und über die amtliche RIS-OGD-API mit Abschnittsfilter abgefragt.

3. **Stufe 3 — Normsuche als gekennzeichneter Notbehelf**:
   - `search_law --query "..."` wird eingesetzt, wenn weder Dokumentnummer noch Gesetzeskürzel bekannt sind. Treffer aus der Such-Discovery werden vor der Übernahme als Normbeleg einzeln via `fetch_norm` verifiziert; Suchergebnisse allein sind kein Beleg.

## Kanonische Gesetzesnummern-Tabelle

Für über 50 österreichische Kern-Bundesgesetze existiert ein vorindizierter Katalog (`references/canonical-laws.json`):
- **Suchbeschleunigung**: Zitate und Freitexte werden automatisch mit der `Gesetzesnummer` angereichert und in der OGD-Suche prioritär abgefragt, wodurch Treffer unmittelbar auf Seite 1 gefunden werden.
- **Fast-Path**: `fetch_whole_law` löst bekannte Gesetzeskürzel (z. B. `--law mrg`) direkt auf die offizielle RIS-Gesamtfassung auf.
- Katalog einsehen: `python scripts/austrian_law_cli.py list_canonical --json`.

## Maschinenlesbarer Verification Receipt & Stichtag-Prüfung

Jeder erfolgreiche Abruf erzeugt im Metadaten-Objekt und in der Antwort einen `VerificationReceipt` v2 (Zeitzone `Europe/Vienna`):
- `source_id`: Kanonische ID
- `gesetzesnummer`: RIS-Gesetzesnummer
- `dokumentnummer`: RIS-Dokumentnummer
- `eli`: Offizielle ELI-URI (falls vorhanden)
- `paragraf`: Paragrafen- oder Abschnittsbezeichnung
- `consolidated_as_of`: Fassungsstand (`FassungVom` — ausschließlich aus echten Metadaten, sonst `null`)
- `retrieved_at`: ISO-8601 Zeitstempel des Abrufs in `Europe/Vienna`
- `effective_from`: Inkrafttretedatum (YYYY-MM-DD)
- `effective_to`: Außerkrafttretedatum (YYYY-MM-DD)
- `kundmachungsorgan`: z. B. `BGBl. Nr. 520/1981 zuletzt geändert durch BGBl. I Nr. 114/2025`
- `raw_content_sha256`: SHA-256 Hash der Original-Upstream-Antwort
- `normalized_content_sha256`: SHA-256 Hash einer darstellungsneutral normalisierten Textform; die Markdown-Auszeichnung einer führenden Überschrift, Zeilenumbrüche und Listenmarker beeinflussen ihn nicht, inhaltliche Zwischenüberschriften bleiben erhalten
- `cached`: `true`, wenn aus dem lokalen Cache bedient (ursprüngliche `retrieval_method` bleibt erhalten)
- `retrieval_method`: `ris_xml_direct` | `cached_disk` | weitere laut [`SKILL.md`](../SKILL.md)
- `verification_status`: `verified_current` | `historical_valid_for_stichtag` | `stichtag_mismatch` | `insufficient_metadata`
- `raw_source_path`: POSIX-Pfad zur archivierten Rohquelle unter `data/ris/raw/<sha256>.xml` (auch bei Cache-Hits)

> [!WARNING]
> **Stichtagsprüfung**: Wird kein expliziter `--stichtag` übergeben, gilt das heutige Tagesdatum in `Europe/Vienna`. Liegt das `effective_from` in der Zukunft oder das `effective_to` in der Vergangenheit, wird `verification_status: "stichtag_mismatch"` gesetzt. Historische Fassungen dürfen niemals stillschweigend als tagesaktuell ausgegeben werden.

## Batch-Synchronisation

Eine separate Batch-Synchronisation (`ris_sync_laws`) aus der TypeScript-Ära wurde nicht übernommen. Für mehrere Normen werden einzelne `fetch_norm`-Aufrufe je Paragraf ausgeführt; Deduplizierung und Rohquellen-Archivierung übernimmt der [Disk-Cache](runtime-layout.md) über den Prüfsummen-Schlüssel.

## Amtliche Judikatur (Sekundärquelle)

Amtliche Entscheidungen von OGH, VfGH und VwGH kommen ausschließlich über die RIS-Justiz-OGD-Schnittstelle:
- `python scripts/austrian_law_cli.py search_decisions --norm MRG --paragraph "§ 29" --json`
- oder beigefügt via `fetch_norm ... --include-decisions`.
- **Niemals als Ersatz für fehlende RIS-Primärnormbelege verwenden.**
- Immer getrennt unter *Judikatur / Sekundärkontext* ausweisen.

## 5-Schichten-Antwortformat

A) **Normwortlaut**: Fundstelle und unveränderter Originaltext.
B) **Metadaten & Verification Receipt**: Nachweise, SHA-256, Fassungsstand und Status.
C) **Verständliche Zusammenfassung**: Klartext-Erläuterung.
D) **Judikatur & Leitsätze**: Relevante Entscheidungen (separat).
E) **Schlussfolgerung & Rechtsunsicherheit**: Auslegungsspielraum und Grenzen.
