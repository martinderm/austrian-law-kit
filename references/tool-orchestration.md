# Tool-Orchestrierung & RIS-Primärrechtsprüfung

Detaillierte Anweisungen für die Tool-Nutzung und Qualitätssicherung im `austrian-law-kit`.

## Capability-Check zu Sitzungsbeginn

Vor der Durchführung von Recherche-Aufgaben ist die Einsatzbereitschaft der 4 RIS-Kern-Tools sicherzustellen:
- `ris_fetch_segment` (Einzelner Paragraf)
- `ris_fetch_whole_law` (Gesetzesvolltext)
- `ris_sync_laws` (Batch-Synchronisation mit Deduplizierung)
- `ris_search` (Discovery-Hilfe / Notbehelf)

```bash
node dist/bin/cli.js ris_sync_laws '{"laws": [{"sourceId": "NOR40273695", "paragraph": "§ 29"}]}'
```

## Gestufter RIS-Fallback

Die Rechtsprüfung folgt strikt dem 3-Stufen-Prinzip:

1. **Stufe 1 — Direkte Quell-Identifikatoren (bevorzugt)**:
   - Liegt eine Dokumentnummer (z. B. `NOR40273695`, `LOO11000699`) vor, **direkt** `ris_fetch_segment` oder `ris_fetch_whole_law` mit `sourceId` aufrufen.
   - Retrieval-Method: `direct_source_id`.

2. **Stufe 2 — Offizielle ELI- oder NormDokument-URLs**:
   - Liegt eine ELI-URL (`https://www.ris.bka.gv.at/eli/bgbl/...`) oder direkte RIS-Dokument-URL vor, diese als `sourceUrl` / `contentUrl` / `wholeLawUrl` übergeben.
   - Alle URLs werden gegen vertrauenswürdige RIS-Domains validiert (`www.ris.bka.gv.at`, `ogd.ris.bka.gv.at`, `data.bka.gv.at`). Fremde/unsichere URLs werden abgewiesen (`VALIDATION_ERROR`).
   - Retrieval-Method: `eli_url` bzw. `norm_document_url`.

3. **Stufe 3 — RIS-Websuche als gekennzeichneter Notbehelf**:
   - `ris_search` wird ausschließlich eingesetzt, wenn weder Dokumentnummer noch ELI-URL bekannt sind.
   - Resultate aus Such-Fallback tragen `retrieval_method: "web_search_fallback"` und `verification_status: "unverified_fallback"` mit Angabe von `fallback_reason`.

## Kanonische Gesetzesnummern-Tabelle & API-Suchbeschleunigung

Für über 50 österreichische Kern-Bundesgesetze existiert eine vorindizierte $O(1)$-Registry (`src/ris/canonical-laws.ts`):
- **Suchbeschleunigung**: Zitate und Freitexte werden automatisch mit der `Gesetzesnummer` angereichert und in `searchBundesrechtApi` prioritär abgefragt (`law_id+paragraph_field`), wodurch Treffer unmittelbar auf Seite 1 gefunden werden.
- **Fast-Path**: `ris_fetch_whole_law` löst bekannte Gesetzeskürzel (z. B. `query: "MRG"`, `sourceId: "HeizKG"`) direkt auf die offizielle RIS-Gesamtfassungs-URL auf.

## Maschinenlesbarer Verification Receipt & Stichtag-Prüfung

Jeder erfolgreiche Abruf erzeugt im Metadaten-Objekt und in der Antwort einen `VerificationReceipt` (Zeitzone `Europe/Vienna`):
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
- `retrieval_method`: `direct_source_id` | `eli_url` | `norm_document_url` | `ris_api_discovery` | `ris_html_search` | `web_search_fallback`
- `verification_status`: `verified_current` | `historical_valid_for_stichtag` | `stichtag_mismatch` | `insufficient_metadata` | `unverified_fallback`
- `fallback_reason`: Begründung bei Stufe-3-Nutzung

> [!WARNING]
> **Stichtagsprüfung**: Wird kein expliziter `stichtag` übergeben, gilt das heutige Tagesdatum in `Europe/Vienna`. Liegt das `effective_from` in der Zukunft oder das `effective_to` in der Vergangenheit, wird `verification_status: "stichtag_mismatch"` gesetzt. Historische Fassungen dürfen niemals stillschweigend als tagesaktuell ausgegeben werden. Ungültige Stichtage werden fail-closed mit `VALIDATION_ERROR` abgewiesen.

## Batch-Synchronisation & Deduplizierung (`ris_sync_laws`)

`ris_sync_laws` synchronisiert Listen von Rechtsvorschriften in einem Durchlauf:
- Einzelne Paragrafen mehrerer Gesetze (`laws: [{ query: "MieWeG § 1" }, { query: "ABGB § 1096" }]`)
- Ganze Gesetze (`laws: [{ query: "HeizKG" }]`)
- Dedupliziert über den mehrdimensionalen Schlüssel `${representation}::${sourceIdOrUrl}::${paragraph}::${stichtag}`, wodurch gleiche Paragrafen mit verschiedenen Stichtagen eigenständig validiert werden.
- Query-basierte Segmentauflösungen reichen die von der OGD-RIS-API gelieferte XML-Inhalts-URL an den Abruf weiter; HTML bleibt Fallback. Der `raw_content_sha256` bewahrt die konkrete Upstream-Repräsentation, der normalisierte Hash ermöglicht den repräsentationsneutralen Vergleich.
- Wenn alle angefragten Fassungen ausschließlich am Stichtag scheitern, lautet der nicht retry-fähige Fehlercode `NO_VALID_VERSION_FOR_STICHTAG`; Transport- und Upstream-Ausfälle bleiben `UPSTREAM_UNAVAILABLE`.

## JUSLINE (Sekundärquelle)

JUSLINE liefert ausschließlich Zusatzkontext (Entscheidungslisten via `jusline_list_decisions`, Diskussionen via `jusline_fetch_discussions`).
- **Niemals als Ersatz für fehlende RIS-Belege verwenden.**
- Immer getrennt unter *Judikatur / Sekundärkontext* ausweisen.

## 5-Schichten-Antwortformat

A) **Normwortlaut**: Fundstelle und unveränderter Originaltext.
B) **Metadaten & Verification Receipt**: Nachweise, SHA-256, Fassungsstand und Status.
C) **Verständliche Zusammenfassung**: Klartext-Erläuterung.
D) **Judikatur & Leitsätze**: Relevante Entscheidungen (separat).
E) **Schlussfolgerung & Rechtsunsicherheit**: Auslegungsspielraum und Grenzen.

