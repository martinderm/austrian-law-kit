# JUSLINE Discussions Plan (MVP)

## Scope von `jusline_fetch_discussions`

Dieser Schritt implementiert **nur** `jusline_fetch_discussions` als erste JUSLINE-MVP-Funktion.

In Scope:
- JUSLINE-Seite für einen Paragrafen abrufen
- Kommentare/Diskussionsbeiträge erkennen
- in `JuslineFetchDiscussionsOutput` mappen
- saubere Fehlerbehandlung

Out of Scope:
- `jusline_list_decisions`
- Entscheidungs-/Judikatur-Extraktion
- tiefe semantische Normalisierung
- JUSLINE-First-Architektur

## Unterstützte Input-Form (MVP)

- `query` als vollständige JUSLINE-URL
- oder `query` als Pfadform `stgb/paragraf/111` (wird auf JUSLINE-URL abgebildet)

## Extrahierte Felder (MVP)

Pro Treffer:
- `title`
- `source_url`
- `source_id` (aus Kommentar-URL)
- optional `snippet` (kurzer Auszug)
- `stable_id` nur bei belastbarer Ableitung (aus Kommentar-ID)

## Sekundärquellen-Rolle

- RIS bleibt Primärquelle.
- JUSLINE wird nur als ergänzende Sekundärquelle für Diskussionen/Kommentare verwendet.
- Kein Überschreiben von RIS-Primärinhalten in diesem Schritt.

## Bewusst noch nicht unterstützt

- Entscheidungen/Judikatur (auch wenn auf derselben Seite sichtbar)
- tiefe Foren-/Thread-Struktur
- Volltext-Interpretation juristischer Inhalte
