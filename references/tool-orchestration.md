# Tool-Orchestrierung (MVP)

Detaillierte Anweisungen fuer die Tool-Nutzung im austrian-law-kit.
Wird vom SKILL.md referenziert und nur bei Bedarf geladen.

## RIS (Primaerquelle)

Primaer diese MVP-Tools nutzen:
- `ris_sync_laws` (Synchronisation/Download mehrerer Gesetze in einem einzigen Schritt)
- `ris_fetch_whole_law` (Gesetzesvolltext; unterstuetzt direkte `wholeLawUrl` oder `query` fuer Auto-Resolve)
- `ris_fetch_segment` (Einzelner Paragraf)
- `ris_search` (Discovery-Hilfe fuer Gesetze, Paragrafen & Judikatur)

### Typischer Ablauf

1. Wenn eine belastbare `sourceId` oder direkte RIS-URL bereits bekannt ist, **direkt** `ris_fetch_segment` oder `ris_fetch_whole_law` verwenden.
2. `ris_search` nur dann einsetzen, wenn die RIS-Referenz **noch nicht bekannt** ist und erst aus einer Suchanfrage aufgeloest werden muss.
3. `ris_search` nutzt inzwischen einen Resolver fuer direkte `NOR...`-/`LOO...`-/Gemeinderecht-IDs, typische Normreferenzen sowie API-first-Pfade ueber die offizielle OGD-RIS-API; diese Discovery-Hilfe ist nuetzlich, ersetzt aber keinen belastbaren Fallback-Pfad.
4. `ris_search` unterstuetzt derzeit drei Discovery-Scope-Pfade: Bundesrecht (`bund`), Landesrecht (`land`) und Gemeinderecht (`municipal`). Gemeinderecht laeuft ueber `/Gemeinden` mit `Gr` oder `GrA` und kann zusaetzlich nach Bundesland, Gemeinde und Bezirk eingegrenzt werden.
5. `ris_search` nicht als alleinigen Einstiegspunkt oder zwingende Vorstufe modellieren; bekannte operative Grenzen sind 0 Treffer trotz plausibler Query, gelegentliche Upstream-Fehler und derzeit unzuverlaessige Landesrecht-State-Filter in der offiziellen API.
6. Fuer `ris_fetch_segment` und `ris_fetch_whole_law` bevorzugt eine saubere `sourceId` bzw. eine RIS-URL mit aufloesbarer `Dokumentnummer` verwenden. `ris_fetch_whole_law` unterstuetzt zusaetzlich direkte `GeltendeFassung.wxe?...&Gesetzesnummer=...`-URLs als Whole-Law-Einstieg.
7. Wenn `ris_search` bereits `content_url`, `xml_content_url` oder `whole_law_url` liefert, diese URLs bevorzugt direkt in die Fetch-Tools weiterreichen.
8. RIS-Fetch-Tools nicht mit frei geratenen ELI-/Paragraf-URLs fuettern, wenn daraus keine belastbare RIS-ID oder Whole-Law-URL ableitbar ist.
9. Wenn alte Cache-Artefakte einen Re-Test verfaelschen koennten, `refresh: true` verwenden, um den Inhalt frisch zu laden.
10. `ris_fetch_segment` bevorzugt fuer RIS-Segmente jetzt XML (`ContentUrl` mit `DataType=Xml`), wenn verfuegbar; HTML bleibt Fallback fuer einfachere oder aeltere Faelle.
11. Fuer History/Aenderungsstaende derzeit keinen oeffentlichen Suchfluss modellieren; der aktuelle History-Client ist bewusst ein interner, typed Baustein fuer spaetere Sync-/Update-Logik.
12. Erst danach zusammenfassen oder vorsichtig einordnen.

## JUSLINE (Sekundaerquelle)

JUSLINE nur ergaenzend nutzen und intern sauber trennen:
- `jusline_fetch_discussions` -> Diskussionen/Kommentare
- `jusline_list_decisions` -> Entscheidungslisten

### Regeln

- Diskussionen/Kommentare und Entscheidungen niemals vermischen.
- JUSLINE-Inhalte nicht als Primaerbeleg fuer Normwortlaut darstellen.
- Wenn JUSLINE verwendet wird, das in der Quellenlage klar kenntlich machen.
- `refresh: true` als gezielten Force-Reload verwenden, wenn ein Re-Test nicht durch aeltere Artefakte oder Query-Index-Reuse verfaelscht werden soll.
- Bei JUSLINE beruecksichtigt der Cache zusaetzlich einen Query-Index ueber `query + kind + limit` mit 24h TTL; ohne `refresh` kann daher bewusst Wiederverwendung auftreten.
- JUSLINE-Treffer liefern je nach Tool und Seitentyp ueber die Basistreffer hinaus nur optional angereicherte Metadaten; fehlende Felder nicht erraten.

### Typische JUSLINE-Nutzung

1. Zuerst RIS-Wortlaut bzw. RIS-Fundstelle klaeren.
2. Nur bei ausdruecklichem Bedarf oder erkennbarem Zusatznutzen ergaenzend JUSLINE laden.
3. Fuer Kommentare `jusline_fetch_discussions`, fuer Entscheidungslisten `jusline_list_decisions` verwenden.
4. Bei Re-Checks oder Parser-Tests `refresh: true` setzen.
5. In der Antwort klar trennen: RIS fuer Normwortlaut, JUSLINE nur fuer Zusatzkontext.

Fuer konkrete JUSLINE-Felder, Detail-Previews, Grenzen und Antwortdisziplin siehe `jusline.md`.

## Bei unklarer Lage

- Zuerst Quellenstatus klaeren, dann interpretieren.
- Bei `VALIDATION_ERROR` der RIS-Fetch-Tools zuerst pruefen, ob eine belastbare `sourceId` oder RIS-URL ermittelbar ist; `ris_search` ist dafuer nur eine optionale Hilfe, nicht die einzige zulaessige Aufloesungsstufe.
- Nicht vorschnell auf `web_fetch` oder allgemeine Websuche ausweichen, wenn das Ziel eigentlich eine RIS-Primaerquelle ist.
- `web_fetch` fuer RIS-Normtexte nur als Notbehelf verwenden und dann die geringere Verlaesslichkeit ausdruecklich markieren.
- Lieber enger und sauberer antworten als zu weit extrapolieren.

## Caching & Konfiguration

Zielstruktur fuer Instanzen:
- `memory/references/austrian-law/ris/...`
- `memory/references/austrian-law/jusline/...`

Einstellungen koennen ueber eine `settings.json` im Workspace-Root unter dem Namensraum `"austrian-law-kit"` geladen werden. Pfade koennen relativ oder absolut sein; CLI-Optionen ueberschreiben `settings.json`.

Dateien mit stabilen Identifikatoren benennen und YAML-Frontmatter verwenden.
Fuer RIS-Gesamtdokumente `doc_type=norm_document` beibehalten und die Darstellungsform zusaetzlich ueber `representation=whole_law` kennzeichnen; der kanonische `title` soll dabei der eigentliche Langtitel der Norm sein, nicht die ausschweifende RIS-Seitenueberschrift.

Fuer CLI-Nutzung, JSON-Input-Formate und CLI-Optionen siehe `README.md`.
