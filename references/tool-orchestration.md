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

## Maschinenlesbarer Verification Receipt & Stichtag-Prüfung

Jeder erfolgreiche Abruf erzeugt im Metadaten-Objekt und in der Antwort einen `VerificationReceipt`:
- `source_id`: Kanonische ID
- `gesetzesnummer`: RIS-Gesetzesnummer
- `dokumentnummer`: RIS-Dokumentnummer
- `eli`: Offizielle ELI-URI (falls vorhanden)
- `paragraf`: Paragrafen- oder Abschnittsbezeichnung
- `consolidated_as_of`: Fassungsstand (`FassungVom`)
- `retrieved_at`: ISO-8601 Zeitstempel des Abrufs
- `effective_from`: Inkrafttretedatum (YYYY-MM-DD)
- `effective_to`: Außerkrafttretedatum (YYYY-MM-DD)
- `kundmachungsorgan`: z. B. `BGBl. Nr. 520/1981 zuletzt geändert durch BGBl. I Nr. 114/2025`
- `content_sha256`: SHA-256 Hash des extrahierten Normtextes
- `retrieval_method`: `direct_source_id` | `eli_url` | `norm_document_url` | `web_search_fallback` | `cache_hit`
- `verification_status`: `verified_current` | `historical_valid_for_stichtag` | `stichtag_mismatch` | `unverified_fallback`
- `fallback_reason`: Begründung bei Stufe-3-Nutzung

> [!WARNING]
> **Stichtagsprüfung**: Wird kein expliziter `stichtag` übergeben, gilt das heutige Tagesdatum. Liegt das `effective_from` in der Zukunft oder das `effective_to` in der Vergangenheit, wird `verification_status: "stichtag_mismatch"` gesetzt. Historische Fassungen dürfen niemals stillschweigend als tagesaktuell ausgegeben werden.

## Batch-Synchronisation & Deduplizierung (`ris_sync_laws`)

`ris_sync_laws` synchronisiert Listen von Rechtsvorschriften in einem Durchlauf:
- Einzelne Paragrafen mehrerer Gesetze (`laws: [{ query: "MieWeG § 1" }, { query: "ABGB § 1096" }]`)
- Ganze Gesetze (`laws: [{ query: "HeizKG" }]`)
- Identische Dokumentnummern / `sourceId`s innerhalb eines Batches werden automatisch dedupliziert (`deduplicated` Zähler).

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

