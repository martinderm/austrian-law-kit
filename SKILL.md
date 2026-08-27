---
name: austrian-law-kit
description: Workspace-Skill für die strukturierte, quellenklare Arbeit mit österreichischen Rechtstexten. Verwende ihn für österreichische Rechtsrecherche mit klarer Quellenhierarchie (RIS primär, JUSLINE sekundär/opt-in), transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut, Einordnung, Diskussionen/Kommentaren und Entscheidungen.
triggers: [austrian law, österreichisches recht, statute, regulation, RIS, JUSLINE, Gesetz, Paragraf]
category: legal
blast_radius: workspace_scoped
language: typescript
---

# Skill: austrian-law-kit

## Zweck

Dieser Skill steuert die fachliche Orchestrierung für österreichische Rechtstexte mit robuster, reproduzierbarer RIS-Primärrechtsprüfung, maschinenlesbarem Verification Receipt, gestuftem Fallback und klarer 5-Schichten-Ausgabe.

## Verbindliche Quellenpolitik

1. **Ausschließlich RIS ist Primärquelle** für Normtext, Struktur, Fassungsstand und Metadaten.
2. **JUSLINE ist Sekundärquelle** ausschließlich für optionalen Zusatzkontext (Entscheidungslisten, Diskussionshinweise).
3. **Kein Belegersatz**: Sekundärquellen (JUSLINE, Web) dürfen einen fehlenden RIS-Beleg unter keinen Umständen ersetzen.
4. Standardmäßig mit der **konsolidierten RIS-Fassung** arbeiten.
5. **Arbeitsfassung** und **verbindliche Fassung** immer explizit unterscheiden.
6. Bei Konflikten zwischen RIS und Sekundärquellen gilt ausnahmslos **RIS**.

## Capability-Check vor der Recherche

Vor der Durchführung von Rechtsrecherchen in einer Sitzung muss sichergestellt sein, dass die 4 primären RIS-Tools einsatzbereit sind:
- `ris_fetch_segment` (Einzelner Paragraf mit `sourceId`/URL)
- `ris_fetch_whole_law` (Gesamte Rechtsvorschrift)
- `ris_sync_laws` (Batch-Synchronisation mehrerer Paragrafen/Gesetze mit Deduplizierung)
- `ris_search` (Discovery-Hilfe bei unbekannter Fundstelle)

*Integritätsprüfung im Terminal / Harness:*
```bash
node dist/bin/cli.js ris_sync_laws '{"laws": [{"sourceId": "NOR40273695", "paragraph": "§ 29"}]}'
```

## Kanonische RIS-Gesetzesnummern-Tabelle (Bundesnormen)

Für über 50 Kern-Bundesgesetze (ABGB, MRG, WEG, WGG, HeizKG, MieWeG, KSchG, FAGG, VRUG, VKrG, HIKrG, UGB, GmbHG, AktG, GewO, EStG, UStG, BAO, GebG, GrEStG, B-VG, AVG, VStG, VVG, VwGVG, VwGG, VfGG, SPG, DSG, StGB, StPO, StVO, KFG, ZPO, JN, EO, IO, ASVG, AngG, ArbVG, AZG, ARG, UrlG, DHG, UWG, KartG, UrhG, PatG, MSchG, BVergG etc.) existiert ein vorindizierter $O(1)$-Katalog (`src/ris/canonical-laws.ts`).
- **Suchbeschleunigung**: Zitate und Freitexte werden automatisch mit der verifizierten `Gesetzesnummer` angereichert und in der RIS-API priorisiert abgefragt.
- **Fast-Path**: Abrufe ganzer Gesetze über `ris_fetch_whole_law` mit bekannten Gesetzeskürzeln lösen direkt auf die offizielle RIS-Gesamtfassung auf.

## Gestufter RIS-Fallback

1. **Stufe 1 (Direkte Dokumentnummer / Source ID)**: Wenn `sourceId` bekannt ist (z. B. `NOR40273695`), **direkt** `ris_fetch_segment` oder `ris_fetch_whole_law` aufrufen (`retrieval_method: "direct_source_id"`).
2. **Stufe 2 (Offizielle ELI- oder NormDokument-URL)**: Wenn eine ELI-URL (`/eli/bgbl/...`) oder Dokument-URL vorliegt, direkt über URL laden (`retrieval_method: "eli_url"` bzw. `"norm_document_url"`).
3. **Stufe 3 (RIS-Websuche / Auto-Resolve)**: `ris_search` ausschließlich als **gekennzeichneter Notbehelf** einsetzen (`retrieval_method: "web_search_fallback"`, Status: `unverified_fallback`), wenn keine Referenz bekannt ist.

## Stichtags-Validierung & Verification Receipt

Jede Rechtsprüfung erzeugt einen maschinenlesbaren **Verification Receipt** nach Zeitzone `Europe/Vienna`:
- `source_id`, `gesetzesnummer`, `dokumentnummer`, `eli`, `paragraf`
- `consolidated_as_of` (Fassung vom — ausschließlich aus Metadaten, sonst `null`), `retrieved_at`, `effective_from`, `effective_to`, `kundmachungsorgan`
- `raw_content_sha256` (SHA-256 der unveränderten Upstream-Antwort)
- `normalized_content_sha256` (SHA-256 des bereinigten Normtexts)
- `cached` (`true`, wenn aus dem lokalen Cache bedient; ursprüngliche `retrieval_method` bleibt erhalten)
- `retrieval_method` (`direct_source_id`, `eli_url`, `norm_document_url`, `ris_api_discovery`, `ris_html_search`, `web_search_fallback`)
- `verification_status` (`verified_current`, `historical_valid_for_stichtag`, `stichtag_mismatch`, `insufficient_metadata`, `unverified_fallback`)
- `fallback_reason` (Begründung, falls Stufe 3 Notbehelf)

> [!IMPORTANT]
> **Stichtags-Disziplin**: Treffer mit historischem `FassungVom` oder abgelaufenem `Außerkrafttretensdatum` werden bei aktuellem Stichtag als `stichtag_mismatch` ausgewiesen und dürfen niemals stillschweigend als tagesaktuell ausgegeben werden.

## Antwortstruktur (5 Schichten)

A) **Normwortlaut**
- Konkrete Fundstelle und unveränderter, authentischer Gesetzestext (bzw. präziser Auszug).

B) **Metadaten & Verification Receipt**
- Maschinenlesbare Nachweise: Dokumentnummer, ELI, Fassungsstand/Stichtag, Kundmachungsorgan, Content SHA-256, Abrufmethode und Verifikationsstatus.

C) **Verständliche Zusammenfassung (Paraphrase)**
- Erläuterung des Inhalts in klarer, verständlicher Sprache.

D) **Judikatur & Leitsätze (Sekundärkontext)**
- Relevante Leitentscheidungen (OGH, VwGH, VfGH) sauber getrennt vom Normtext.

E) **Schlussfolgerung & Rechtsunsicherheit**
- Anwendungsgrenzen, Auslegungsfragen und transparente Unsicherheitskommunikation.

## Rechtsberatungsgrenze & Datenintegrität

- Keine verbindliche Rechtsberatung; Bereitstellung von authentischem Normtext und strukturierter Einordnung.
- Fehlende Informationen oder unvollständige Belege werden nicht erraten, sondern als Lücke deklariert.

## Referenzen (bei Bedarf laden)

- **Tool-Orchestrierung & Ablaufdetails**: `references/tool-orchestration.md`
- **JUSLINE-Felder, Grenzen, Antwortdisziplin**: `references/jusline.md`
- **Tool-Verträge (Input/Output/Receipts)**: `docs/tool-contracts.md`
- **CLI-Nutzung & JSON-Formate**: `README.md`
- **Frontmatter-Schema**: `docs/frontmatter-schema.md`
- **Stable-ID-Strategie**: `docs/stable-id-strategy.md`
