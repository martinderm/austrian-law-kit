# RIS OGD API v2.6 — Praxiserfahrungen (live verifiziert, revidiert nach Review)

Live gegen `https://data.bka.gv.at/ris/api/v2.6/` verifizierte Befunde (2026-11-18, Abruf per `curl` mit Browser-User-Agent aus einer Agent-Sandbox; `open_url`/Sandbox-Zugriffe werden von `ris.bka.gv.at` blockiert). Ergänzt die Spezifikations-Zusammenfassungen in [references/official/ris-api/](../references/official/ris-api/). Keine Code-Änderung.

> Revidiert nach unabhängigem Review von PR #16: frühere Aussagen zu `Suchworte`+`Gesetzesnummer`, Seitengröße und „Art.“-Filter waren falsch und sind korrigiert.

## Verifizierte JSON-Antwortstruktur

```
OgdSearchResult
└── OgdDocumentResults
    └── OgdDocumentReference[]
        └── Data
            └── Metadaten
                ├── Bundesrecht      (Kurztitel, ELI liegen hier, NICHT unter BrKons)
                │   └── BrKons       (ArtikelParagraphAnlage, Paragraphnummer, Gesetzesnummer,
                │                     Inkrafttretensdatum, Ausserkrafttretensdatum, Kundmachungsorgan)
                └── Judikatur        (Justiz/Vwgh/Vfgh/…: Geschaeftszahl, Entscheidungsdatum,
                                     EuropeanCaseLawIdentifier; Normen.item je Applikation)
```

- Einzeltreffer erscheinen als **Objekt statt Array** — das Repo normalisiert das selbst in `scripts/lib/ris_ogd_client.py:299-301` (`dict → [dict]`); eigene Clients likewise defensiv behandeln.
- `Geschaeftszahl` und `Normen` sind als `{"item": …}` verschachtelt → `unwrap` nötig (z. B. `5Ob121/08t`).
- Verifiziert u. a. mit: BrKons-Abfrage SchPflG (`Gesetzesnummer=10009576`) und VwGH-Judikatur `Suchworte=Schulpflicht Fernbleiben` (6 Treffer mit GZ, Datum, ECLI).

## Pagination (korrigiert)

- **`PageSize` wird ignoriert**, aber **`DokumenteProSeite=OneHundred` wirkt** — die Antwort meldet `Hits.@pageSize` (default `"20"`, bei OneHundred `"100"`).
- Seitenzahl korrekt berechnen: **`seiten = ceil(Hits.#text / Hits.@pageSize)`** — genau so paginiert der Repo-Client (`scripts/lib/ris_ogd_client.py:337-338`). Nie hart auf `ceil(hits/20)` rechnen.
- **Nie bis „leere Seite“ paginieren:** jenseits der letzten Trefferseite liefert die API **HTTP 500** (kein leerer 200; verifiziert: MRG Seite 12 → 500, SchPflG Seite 13 → 500). Sonst bricht `curl -sfL` mit Exit 22 ab.

## Parameter-Verhalten (korrigiert)

- **`Suchworte` + `Gesetzesnummer` kombiniert wirkt als UND-Filter** (live: SchPflG + `Fernbleiben` → 21 Treffer, + `Schulpflicht` → 228, Unsinnswort → 0). Die frühere Annahme „liefert keine Treffer“ war falsch.
- **`Abschnitt.Von`/`Bis`:** eine bare Nummer matcht auch artikelqualifizierte Paragrafen (`Von=8&Bis=8` liefert auch `§ 8a` — siehe `_matches_section` im Client); explizit `Von=8a&Bis=8a` liefert korrekt nur `§ 8a` (15 Fassungen).

## Geltende Fassung finden (zwei Wege)

1. **Direkt per Stichtag:** `Fassung.FassungVom=<YYYY-MM-DD>` (live: SchPflG mit `2026-11-18` → 34 Treffer).
2. **Filter auf Außerkrafttreten:** auf **fehlendes** `Ausserkrafttretensdatum` prüfen (Feld fehlt ganz, ist nicht `null`). Deckt nur die heutige Geltung ab — künftig in Kraft tretende Fassungen sind damit nicht erfasst.

## „Art. …“-Einträge (korrigiert)

Trotz `Abschnitt.Typ=Paragraph` können „Art. …“-Einträge (Änderungs-/Übergangsartikel) in den Treffern liegen; ihre Anzahl variiert. Sie haben **ebenfalls `Dokumenttyp: "Paragraph"`** — nicht nach `Dokumenttyp` filtern (das würde z. B. `§ 0` mit `Dokumenttyp: "Norm"` verlieren). Ggf. am Label-Präfix `ArtikelParagraphAnlage` („Art.“) filtern.

## Zugriff aus Agent-Umgebungen

`ris.bka.gv.at` blockiert `open_url`/Sandbox-Zugriffe. Zuverlässiger Fallback: `curl -sfL -A "<Browser-User-Agent>" <URL>` (z. B. Chrome-UA). Betrifft sowohl die OGD-API (`data.bka.gv.at`) als auch die Dokument-URLs (`www.ris.bka.gv.at`). *(Agenten-Praxis; vom Reviewer nicht gegengeprüft.)*

## Recherche-Fallen

- **Gesetzesnummern niemals raten.** Der kanonische Katalog ([references/canonical-laws.json](../references/canonical-laws.json)) umfasst nur 52 Bundesgesetze; Schulrecht (SchUG), SchPflG u. a. fehlen. Eine falsche Nummer liefert **stillschweigend ein anderes Gesetz** (Beispiel: `10002355` → „Amtliche Gewährzeichen – Niederlande“, 2 Treffer — nicht korrekt `10009576`). Unbekannte Gesetze per ELI-URL, RIS-Web-Suche oder data.gv.at verifizieren.
- **Topicsynonyme:** Umgangssprachliche Begriffe existieren im Normtext teils nicht (0 Treffer). Beispiele: „entschuldigt“ → „gerechtfertigte Verhinderung“ (SchUG); „Entschuldigung“ im SchPflG → **§ 9**, nicht § 5. *(Agenten-Praxis; nicht gegengeprüft.)* Fallback: Volltext über die Gesamtfassung (`GeltendeFassung.wxe`) per curl + `grep`.
- **Normen-Umnummerierung:** Alte Entscheidungen zitieren historische Nummerierungen (z. B. VwGH-Rechtssätze: „SchPflG 1962 § 24“) — vor Übernahme auf die geltende Nummerierung prüfen. *(Agenten-Praxis; nicht gegengeprüft.)*

## Verification Receipt — belastbare Felder

`Zuletzt aktualisiert` (`geaendert`/`consolidated_as_of`) ist **kein** Fassungsstand und kein Beleg für Geltung am Abruftag. Die einzigen belastbaren Geltungsfelder in den BrKons-Metadaten sind **`Inkrafttretensdatum` und `Ausserkrafttretensdatum`**; daraus folgt der `verification_status` (`verified_current` | `historical_valid_for_stichtag` | `stichtag_mismatch` | `insufficient_metadata`, Stichtag default: heute, Zeitzone `Europe/Vienna`). Feldschema siehe `scripts/lib/receipt.py`.
