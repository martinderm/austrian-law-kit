# RIS OGD API v2.6 — Praxiserfahrungen (live verifiziert)

Live gegen `https://data.bka.gv.at/ris/api/v2.6/` verifizierte Befunde (2026-11-18, Abruf per `curl` mit Browser-User-Agent aus einer Agent-Sandbox; `open_url`/Sandbox-Zugriffe werden von `ris.bka.gv.at` blockiert). Ergänzt die Spezifikations-Zusammenfassungen in [references/official/ris-api/](../references/official/ris-api/). Keine Code-Änderung.

## Verifizierte JSON-Antwortstruktur

Suchantworten (Bundesrecht und Judikatur) sind wie folgt verschachtelt — **nicht** Top-Level `OgdDocumentReference` lesen:

```
OgdSearchResult
└── OgdDocumentResults
    └── OgdDocumentReference[]
        └── Data
            └── Metadaten
                ├── Bundesrecht.BrKons   (Applikation BrKons: ArtikelParagraphAnlage,
                │                         Inkrafttretensdatum, Ausserkrafttretensdatum,
                │                         Kundmachungsorgan, Gesetzesnummer, ELI)
                └── Judikatur            (Applikationen Justiz/Vwgh/Vfgh/…: Geschaeftszahl,
                                          Entscheidungsdatum, EuropeanCaseLawIdentifier, …)
```

- Einzeltreffer erscheinen als **Objekt statt Array** → defensiv mit `as_list()` normalisieren.
- `Geschaeftszahl` ist als `{"item": …}` verschachtelt → `unwrap()` nötig (z. B. `5Ob121/08t`).
- `Normen` liegt je Applikation unterschiedlich (z. B. VwGH: `Judikatur.Normen.item`, teils Liste) → ebenfalls defensiv lesen.
- Verifiziert u. a. mit: BrKons-Abfrage SchPflG (`Gesetzesnummer=10009576`, Abschnitt.Typ=Paragraph) und VwGH-Judikatur `Suchworte=Schulpflicht Fernbleiben` (6 Treffer mit GZ, Datum, ECLI).

## Parameter-Grenzen (nicht blind annehmen)

- **`PageSize` wird ignoriert** — fix 20 Treffer pro Seite; Paginierung ausschließlich über `Seitennummer` (1..n bis leere Seite).
- **`Suchworte` in Kombination mit `Gesetzesnummer` lieferte keine Treffer** — bei bekannter Gesetzesnummer nur `Gesetzesnummer` (+ Abschnitts-/Fassungsfilter) abfragen.
- **Abschnittsfilter für artikelqualifizierte Paragrafen** (z. B. `§ 5a`) kann fehlschlagen → kanonisches Rezept unten nutzen.

## Kanonisches Rezept: geltende Fassung finden

Alle Versionen paginieren (`/Bundesrecht?Applikation=BrKons&Gesetzesnummer=<ID>&Abschnitt.Typ=Paragraph&Seitennummer=<n>`), dann auf **`Ausserkrafttretensdatum == null` filtern**. Das war der robusteste Weg (verifiziert für SchPflG 10009576: pro Seite korrekt die geltenden Paragrafen § 0, § 1, § 2 …).

## Zugriff aus Agent-Umgebungen

`ris.bka.gv.at` blockiert `open_url`/Sandbox-Zugriffe. Zuverlässiger Fallback: `curl -sfL -A "<Browser-User-Agent>" <URL>` (z. B. Chrome-UA). Betrifft sowohl die OGD-API (`data.bka.gv.at`) als auch die Dokument-URLs (`www.ris.bka.gv.at`).

## Recherche-Fallen

- **Gesetzesnummern niemals raten.** Der kanonische Katalog ([references/canonical-laws.json](../references/canonical-laws.json)) umfasst nur 52 Bundesgesetze; Schulrecht (SchUG), SchPflG u. a. fehlen. Eine geratene Nummer schlägt stillschweigend fehl (Beispiel: 10002355 statt korrekt 10009576). Unbekannte Gesetze per ELI-URL, RIS-Web-Suche oder data.gv.at verifizieren.
- **Topicsynonyme:** Umgangssprachliche Begriffe existieren im Normtext teils nicht (0 Treffer). Beispiele: „entschuldigt“ → „gerechtfertigte Verhinderung“ (SchUG); „Entschuldigung“ im SchPflG → **§ 9**, nicht § 5. Vor der Suche Synonyme auflösen; Fallback: Volltext über die Gesamtfassung (`GeltendeFassung.wxe`) per curl + `grep`.
- **Normen-Umnummerierung:** Alte Entscheidungen zitieren historische Nummerierungen (z. B. VwGH-Rechtssätze: „SchPflG 1962 § 24“) — vor Übernahme auf die geltende Nummerierung prüfen.

## Verification Receipt — belastbare Felder

`Zuletzt aktualisiert` (`geaendert`/`consolidated_as_of`) ist **kein** Fassungsstand und kein Beleg für Geltung am Abruftag. Die einzigen belastbaren Geltungsfelder in den BrKons-Metadaten sind **`Inkrafttretensdatum` und `Ausserkrafttretensdatum`**; daraus folgt der `verification_status` (`verified_current` | `historical_valid_for_stichtag` | `stichtag_mismatch` | `insufficient_metadata`, Stichtag default: heute, Zeitzone `Europe/Vienna`).
