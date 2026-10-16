---
name: austrian-law-kit
description: Workspace-Skill für die strukturierte, quellenklare Arbeit mit österreichischen Rechtstexten (Bundesgesetze, Landesgesetze via RIS OGD) und amtlicher Rechtsprechung (insb. OGH via RIS-Judikatur API). Liefert authentischen Normwortlaut mit maschinenlesbaren Verification Receipts, Stichtagsvalidierung und 5-Schichten-Ausgabe.
triggers: [austrian law, österreichisches recht, statute, regulation, RIS, Gesetz, Paragraf, ABGB, MRG, WEG, EStG, UGB, StGB, OGH, Rechtsprechung]
category: legal
blast_radius: workspace_scoped
language: python
---

# Skill: austrian-law-kit

## Zweck

Dieser Skill steuert die fachliche Orchestrierung für österreichische Rechtstexte mit robuster, reproduzierbarer RIS-Primärrechtsprüfung, amtlicher Judikatur (OGH/VfGH/VwGH via RIS-Justiz), maschinenlesbarem Verification Receipt und klarer 5-Schichten-Ausgabe.

## Verbindliche Quellenpolitik

1. **Ausschließlich das RIS (Rechtsinformationssystem des Bundes) ist Primärquelle** für Normtext, Struktur, Fassungsstand und Metadaten.
2. **RIS-Judikatur (OGH, VfGH, VwGH) ist amtliche Sekundärquelle** für Leitsätze, Rechtssatznummern und Gerichtsentscheidungen.
3. **Kein Belegersatz**: Sekundärquellen (Judikatur, Web-Treffer) dürfen einen fehlenden amtlichen Primärnormbeleg unter keinen Umständen ersetzen.
4. Standardmäßig mit der **konsolidierten RIS-Fassung** arbeiten.
5. **Arbeitsfassung** und **verbindliche Fassung** immer explizit unterscheiden.
6. Bei Abweichungen zwischen Zusammenfassungen und amtlichem Normtext gilt ausnahmslos der **authentische RIS-Normtext**.

## Capability-Check vor der Recherche

Vor der Durchführung von Rechtsrecherchen in einer Sitzung muss sichergestellt sein, dass die Python 3 CLI einsatzbereit ist:

*Integritätsprüfung im Terminal / Harness:*
```bash
python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --json
```

## Verfügbare CLI-Werkzeuge (`scripts/austrian_law_cli.py`)

Alle Werkzeuge sind in **Python 3 Standardbibliothek (zero pip dependencies)** implementiert und unterstützen `--json` für den standardisierten Structured CLI Envelope:

### 1. Einzelnorm abrufen und verifizieren (`fetch_norm`)
Holt den authentischen Text einer Einzelnorm, generiert das Verification Receipt und formatiert die 5 Schichten:
```bash
python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --json
```
Mit optionaler OGH-Rechtsprechungsabfrage:
```bash
python scripts/austrian_law_cli.py fetch_norm --law mrg --paragraph "§ 29" --include-decisions --json
```
Mit historischem Prüfstichtag:
```bash
python scripts/austrian_law_cli.py fetch_norm --law abgb --paragraph "§ 1293" --stichtag 2020-01-01 --json
```

### 2. Gesamtes Gesetz im Cache vorhalten (`fetch_whole_law`)
Lädt die amtliche Gesamtfassung eines Gesetzes in den lokalen Cache:
```bash
python scripts/austrian_law_cli.py fetch_whole_law --law weg --json
```

### 3. Normsuche über die offizielle OGD-API (`search_law`)
Sucht nach Normen über Bundes- oder Landesrecht:
```bash
python scripts/austrian_law_cli.py search_law --query "Mietrechtsgesetz" --limit 5 --json
```

### 4. Amtliche OGH-Rechtsprechung & Leitsätze recherchieren (`search_decisions`)
Fragt amtliche Entscheidungen über die RIS-Judikatur REST API ab:
```bash
python scripts/austrian_law_cli.py search_decisions --norm MRG --paragraph "§ 29" --limit 3 --json
```

### 5. Kanonischen Gesetzeskatalog einsehen (`list_canonical`)
Listet alle über 50 vorindizierten österreichischen Bundesgesetze auf:
```bash
python scripts/austrian_law_cli.py list_canonical --json
```

### 6. Migrationsanleitung für Altsysteme (`migration_guide`)
Zeigt die vollständige Anleitung zur Migration historischer Workspaces und Befehle an:
```bash
python scripts/austrian_law_cli.py migration_guide
```
*Detaillierte Dokumentation:* Siehe [docs/migration-guide.md](docs/migration-guide.md).

## Kanonische RIS-Gesetzesnummern-Tabelle (`references/canonical-laws.json`)

Für über 50 Kern-Bundesgesetze existiert ein vorindizierter $O(1)$-Katalog:
- **Zivil- & Wohnrecht:** ABGB, MRG, WEG, WGG, HeizKG, MieWeG, EheG
- **Verbraucherrecht:** KSchG, FAGG, VRUG, VKrG, HIKrG
- **Unternehmensrecht:** UGB, GmbHG, AktG, GewO, UWG, KartG, UrhG, PatG, MSchG, BVergG
- **Steuer- & Abgabenrecht:** EStG, UStG, BAO, GebG, GrEStG
- **Öffentliches Recht:** B-VG, AVG, VStG, VVG, VwGVG, VwGG, VfGG, SPG, DSG
- **Straf- & Verkehrsrecht:** StGB, StPO, StVO, KFG
- **Verfahrens- & Insolvenzrecht:** ZPO, JN, EO, IO, ASGG
- **Arbeits- & Sozialrecht:** ASVG, AngG, ArbVG, AZG, ARG, UrlG, DHG

## Stichtags-Validierung & Verification Receipt (v2)

Jede Rechtsprüfung erzeugt einen maschinenlesbaren **Verification Receipt** nach Zeitzone `Europe/Vienna`:
- `source_id`, `gesetzesnummer`, `dokumentnummer`, `eli`, `paragraf`
- `consolidated_as_of`, `retrieved_at`, `effective_from`, `effective_to`, `kundmachungsorgan`
- `raw_content_sha256` (SHA-256 des unveränderten XML-Streams vom RIS)
- `normalized_content_sha256` (SHA-256 des bereinigten Normtexts)
- `cached` (`true`, wenn aus dem lokalen Cache bedient)
- `retrieval_method` (`ris_xml_direct`, `cached_disk`, etc.)
- `verification_status` (`verified_current`, `historical_valid_for_stichtag`, `stichtag_mismatch`, `insufficient_metadata`)
- `raw_source_path` (POSIX-Pfad zur archivierten Rohquelle unter `data/ris/raw/<sha256>.xml`, relativ zum aufrufenden Workspace bei Standardkonfiguration, auch bei Cache-Hits)

Cache/Raw werden standardmäßig im aufrufenden Arbeitsverzeichnis statt im Skill-Verzeichnis
gespeichert. Bei `--cache-dir` liegt die Datenwurzel direkt über dem Cache und der
Receipt-Pfad ist relativ zu deren Elternverzeichnis. Alte Caches werden nicht migriert.
PowerShell: bevorzugt `--paragraph 7` ohne `§`; Unicode-Aufrufe mit `python -X utf8`.
Gesetzesabfragen prüfen XML-Identität, nichtleeren Text und Geltung und überspringen
ungeeignete Treffer; direkte NOR-/LOO-Abfragen behalten den Stichtags-Guard.
`consolidated_as_of` übernimmt `geaendert` (ersatzweise `fassung_vom`) aus dem XML,
nicht den Abfragestichtag; die Geltung folgt separat aus `ikra`/`akra`.

> [!IMPORTANT]
> **Stichtags-Disziplin**: Treffer mit abgelaufenem `Außerkrafttretensdatum` oder vor `Inkrafttretensdatum` werden bei aktuellem Stichtag als `stichtag_mismatch` ausgewiesen und dürfen niemals stillschweigend als tagesaktuell ausgegeben werden.

## Antwortstruktur (5 Schichten)

A) **Normwortlaut**
- Konkrete Fundstelle und unveränderter, authentischer Gesetzestext (bzw. präziser Auszug).

B) **Metadaten & Verification Receipt**
- Maschinenlesbare Nachweise: Dokumentnummer, Gesetzesnummer, Stichtag, Kundmachungsorgan, Content SHA-256 und Verifikationsstatus.

C) **Verständliche Zusammenfassung (Paraphrase)**
- Erläuterung des Inhalts in klarer, verständlicher Sprache.

D) **Judikatur & Leitsätze (amtlich aus RIS-Justiz)**
- Relevante Leitentscheidungen des OGH / VfGH / VwGH sauber getrennt vom Normtext.

E) **Schlussfolgerung & Rechtsunsicherheit**
- Anwendungsgrenzen, Auslegungsfragen und transparente Unsicherheitskommunikation.

## Rechtsberatungsgrenze & Datenintegrität

- Keine verbindliche Rechtsberatung; Bereitstellung von authentischem Normtext und strukturierter Einordnung.
- Fehlende Informationen oder unvollständige Belege werden nicht erraten, sondern als Lücke deklariert.
