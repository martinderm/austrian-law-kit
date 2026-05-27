---
name: austrian-law-kit
description: Workspace-Skill für die strukturierte, quellenklare Arbeit mit österreichischen Rechtstexten. Verwende ihn für österreichische Rechtsrecherche mit klarer Quellenhierarchie (RIS primär, JUSLINE sekundär/opt-in), transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut, Einordnung, Diskussionen/Kommentaren und Entscheidungen.
---

# Skill: austrian-law-kit


## Zweck

Dieser Skill steuert die fachliche Orchestrierung für österreichische Rechtstexte mit klarer Quellenhierarchie, transparenter Unsicherheitskommunikation und sauberer Trennung von Wortlaut vs. Einordnung.

## Verbindliche Quellenpolitik

1. **RIS ist Primärquelle** für Normtext, Struktur und Metadaten.
2. **JUSLINE ist Sekundärquelle** für optionalen Zusatzkontext.
3. JUSLINE nur ergänzend nutzen, nicht als Ersatz für RIS.
4. Inhalte aus JUSLINE standardmäßig nur bei **ausdrücklicher Nachfrage** oder klar erkennbarem Zusatznutzen laden.
5. Standardmäßig mit der **konsolidierten RIS-Fassung** arbeiten.
6. **Arbeitsfassung** und **verbindliche Fassung** immer explizit unterscheiden.
7. Bei Konflikten zwischen RIS und JUSLINE gilt **RIS**.

## Antwortstruktur (standardmäßig 4 Schichten)

A) **Fundstelle / Wortlaut**
- Nenne die konkrete Fundstelle und gib den relevanten Wortlaut bzw. einen präzisen Auszug wieder.

B) **Verständliche Zusammenfassung**
- Erkläre den Inhalt in klarer, nicht-juristischer Sprache.

C) **Auslegungsfragen / Grenzen**
- Markiere, wo Interpretationsspielraum, Anwendungsgrenzen oder fehlender Kontext bestehen.

D) **Quellenlage / Unsicherheit**
- Weise aus, welche Quelle(n) genutzt wurden und wie sicher die Aussage ist.

Bei sehr kleinen, rein mechanischen Nachfragen darf die Antwort knapper sein, die Trennung von Quelle, Einordnung und Unsicherheit bleibt aber bestehen.

## Rechtsberatungsgrenze

- Keine Behauptung verbindlicher Rechtsberatung.
- Der Skill liefert Wortlaut, Quellenlage und vorsichtige Einordnung.
- Keine künstliche Sicherheit bei unklarer Quellenlage oder fehlendem Sachverhaltskontext.

## Datenintegrität

- Fehlende Informationen dürfen nicht erfunden oder glatt ergänzt werden.
- Lücken müssen ausdrücklich benannt werden.
- Wortlaut, Paraphrase und ergänzende Interpretation sauber auseinanderhalten.

## Tool-Orchestrierung (MVP)

### RIS (Primärquelle)
Primär diese MVP-Tools nutzen:
- `ris_search` (nur als optionale Discovery-Hilfe)
- `ris_fetch_segment`
- `ris_fetch_whole_law`

Typischer Ablauf:
1. Wenn eine belastbare `sourceId` oder direkte RIS-URL bereits bekannt ist, **direkt** `ris_fetch_segment` oder `ris_fetch_whole_law` verwenden.
2. `ris_search` nur dann einsetzen, wenn die RIS-Referenz **noch nicht bekannt** ist und erst aus einer Suchanfrage aufgelöst werden muss.
3. `ris_search` nutzt inzwischen einen Resolver für direkte `NOR...`-/`LOO...`-/Gemeinderecht-IDs, typische Normreferenzen sowie API-first-Pfade über die offizielle OGD-RIS-API; diese Discovery-Hilfe ist nützlich, ersetzt aber keinen belastbaren Fallback-Pfad.
4. `ris_search` unterstützt derzeit drei Discovery-Scope-Pfade: Bundesrecht (`bund`), Landesrecht (`land`) und Gemeinderecht (`municipal`). Gemeinderecht läuft über `/Gemeinden` mit `Gr` oder `GrA` und kann zusätzlich nach Bundesland, Gemeinde und Bezirk eingegrenzt werden.
5. `ris_search` nicht als alleinigen Einstiegspunkt oder zwingende Vorstufe modellieren; bekannte operative Grenzen sind 0 Treffer trotz plausibler Query, gelegentliche Upstream-Fehler und derzeit unzuverlässige Landesrecht-State-Filter in der offiziellen API. Der aktuelle Landesrecht-Pfad versucht das mit clientseitigem State-Filter und state-spezifischen Titelvarianten abzufedern, garantiert aber noch keine beliebige Freitext-Suche. Der bekannte Niederösterreich-Sonderfall (`Bauordnung` -> authentische Interpretation statt Stammnorm) ist bewusst dokumentiert und bis auf Weiteres geparkt.
6. Für `ris_fetch_segment` und `ris_fetch_whole_law` bevorzugt eine saubere `sourceId` bzw. eine RIS-URL mit auflösbarer `Dokumentnummer` verwenden. `ris_fetch_whole_law` unterstützt zusätzlich direkte `GeltendeFassung.wxe?...&Gesetzesnummer=...`-URLs als Whole-Law-Einstieg.
7. Wenn `ris_search` bereits `content_url`, `xml_content_url` oder `whole_law_url` liefert, diese URLs bevorzugt direkt in die Fetch-Tools weiterreichen.
8. RIS-Fetch-Tools nicht mit frei geratenen ELI-/Paragraf-URLs füttern, wenn daraus keine belastbare RIS-ID oder Whole-Law-URL ableitbar ist.
9. Wenn alte Cache-Artefakte einen Re-Test verfälschen könnten, `refresh: true` verwenden, um den Inhalt frisch zu laden.
10. `ris_fetch_segment` bevorzugt für RIS-Segmente jetzt XML (`ContentUrl` mit `DataType=Xml`), wenn verfügbar; HTML bleibt Fallback für einfachere oder ältere Fälle.
11. Erst danach gezielt Segment oder Gesamtdokument laden.
11. Für History/Änderungsstände derzeit keinen öffentlichen Suchfluss modellieren; der aktuelle History-Client ist bewusst ein interner, typed Baustein für spätere Sync-/Update-Logik.
12. Erst danach zusammenfassen oder vorsichtig einordnen.

### JUSLINE (Sekundärquelle)
JUSLINE nur ergänzend nutzen und intern sauber trennen:
- `jusline_fetch_discussions` -> Diskussionen/Kommentare
- `jusline_list_decisions` -> Entscheidungslisten

Regeln:
- Diskussionen/Kommentare und Entscheidungen niemals vermischen.
- JUSLINE-Inhalte nicht als Primärbeleg für Normwortlaut darstellen.
- Wenn JUSLINE verwendet wird, das in der Quellenlage klar kenntlich machen.
- `refresh: true` als gezielten Force-Reload verwenden, wenn ein Re-Test nicht durch ältere Artefakte oder Query-Index-Reuse verfälscht werden soll.
- Bei JUSLINE berücksichtigt der Cache zusätzlich einen Query-Index über `query + kind + limit` mit 24h TTL; ohne `refresh` kann daher bewusst Wiederverwendung auftreten.
- JUSLINE-Treffer liefern je nach Tool und Seitentyp über die Basistreffer hinaus nur optional angereicherte Metadaten; fehlende Felder nicht erraten.

Typische JUSLINE-Nutzung:
1. Zuerst RIS-Wortlaut bzw. RIS-Fundstelle klären.
2. Nur bei ausdrücklichem Bedarf oder erkennbarem Zusatznutzen ergänzend JUSLINE laden.
3. Für Kommentare `jusline_fetch_discussions`, für Entscheidungslisten `jusline_list_decisions` verwenden.
4. Bei Re-Checks oder Parser-Tests `refresh: true` setzen.
5. In der Antwort klar trennen: RIS für Normwortlaut, JUSLINE nur für Zusatzkontext.

Für konkrete JUSLINE-Felder, Detail-Previews, Grenzen und Antwortdisziplin siehe `references/jusline.md`.

### Bei unklarer Lage
- Zuerst Quellenstatus klären, dann interpretieren.
- Bei `VALIDATION_ERROR` der RIS-Fetch-Tools zuerst prüfen, ob eine belastbare `sourceId` oder RIS-URL ermittelbar ist; `ris_search` ist dafür nur eine optionale Hilfe, nicht die einzige zulässige Auflösungsstufe.
- Nicht vorschnell auf `web_fetch` oder allgemeine Websuche ausweichen, wenn das Ziel eigentlich eine RIS-Primärquelle ist.
- `web_fetch` für RIS-Normtexte nur als Notbehelf verwenden und dann die geringere Verlässlichkeit ausdrücklich markieren.
- Lieber enger und sauberer antworten als zu weit extrapolieren.

## Caching-/Memory-Hinweis & Konfiguration (settings.json)

Zielstruktur für Instanzen:
- `memory/references/austrian-law/ris/...`
- `memory/references/austrian-law/jusline/...`

Einstellungen und Pfade können vollautomatisch über eine `settings.json`-Datei geladen werden, die im Workspace-Root (`settings.json`) gesucht wird. Um Konflikte mit anderen Workspace-Einstellungen zu vermeiden, sind die Konfigurationen unter dem Namensraum `"austrian-law-kit"` zu schachteln.

Beispiel für `settings.json`:
```json
{
  "austrian-law-kit": {
    "cacheRoot": "memory/references/austrian-law",
    "dataRoot": "data/austrian-law",
    "risBaseUrl": "https://www.ris.bka.gv.at",
    "risApiBaseUrl": "https://data.bka.gv.at/ris/api/v2.6/",
    "juslineBaseUrl": "https://www.jusline.at"
  }
}
```

Pfade in `settings.json` können relativ zum Workspace-Root (Verzeichnis der Einstellungsdatei) oder absolut angegeben werden. Explizite CLI-Optionen oder Umgebungsvariablen überschreiben die Werte in `settings.json`.


Dateien mit stabilen Identifikatoren benennen und YAML-Frontmatter verwenden.
Für RIS-Gesamtdokumente `doc_type=norm_document` beibehalten und die Darstellungsform zusätzlich über `representation=whole_law` kennzeichnen; der kanonische `title` soll dabei der eigentliche Langtitel der Norm sein, nicht die ausschweifende RIS-Seitenüberschrift.


## Harness-Agnostische Tool-Ausführung (CLI)

Da dieser Skill harness-agnostisch konzipiert ist, können die RIS- und JUSLINE-Werkzeuge direkt über die CLI ausgeführt werden. Verwende dafür das TypeScript-CLI unter `plugin/openclaw-austrian-law/bin/cli.ts` mittels `npx tsx`:

```powershell
# Syntax:
npx tsx <pfad-zu-diesem-skill>/plugin/openclaw-austrian-law/bin/cli.ts [Optionen] <tool_name> '[json_arguments]'

# Beispiele:
# 1. Freitextsuche im Bundesrecht:
npx tsx D:/users/dagobert/agents/skills/austrian-law-kit/plugin/openclaw-austrian-law/bin/cli.ts --workspace "C:/absolute/path/to/your/workspace" ris_search '{"query": "ABGB § 1293", "limit": 1}'

# 2. Gesetzessegment abrufen:
npx tsx D:/users/dagobert/agents/skills/austrian-law-kit/plugin/openclaw-austrian-law/bin/cli.ts --workspace "C:/absolute/path/to/your/workspace" ris_fetch_segment '{"sourceId": "NOR12019035"}'
```

### Optionen
- `--workspace <dir>`: Leitet den Dokumenten-Cache (`memory/references/austrian-law/`) und den Metadaten-Cache (`data/austrian-law/`) relativ zu diesem Agenten-Workspace ab (Empfohlen!).
- `--cache-root <dir>`: Setzt einen absoluten Pfad für den Dokumenten-Cache fest (der Metadaten-Cache wird dabei automatisch im selben Elternverzeichnis unter `data/` abgeleitet).
- `--ris-base-url <url>`: Überschreibt die RIS-Web-URL.
- `--ris-api-base-url <url>`: Überschreibt die RIS-API-URL.
- `--jusline-base-url <url>`: Überschreibt die JUSLINE-URL.

