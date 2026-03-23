# RIS Search Plan (MVP)

## Scope von `ris_search`

Dieser Schritt implementiert **nur** die erste produktive RIS-Funktion `ris_search`.

In Scope:
- RIS-Such-URL technisch aufbauen
- RIS-Trefferliste abrufen
- Trefferliste minimal parsen
- Treffer in den bestehenden `RisSearchOutput`-Vertrag mappen
- saubere Fehlercodes liefern

Out of Scope:
- `ris_fetch_segment`
- `ris_fetch_whole_law`
- JUSLINE-Logik
- Segment-/Volltext-Extraktion einzelner Normteile
- allgemeine HTML/XML-Parser-Ausweitung über Listen-Mapping hinaus

## Erste unterstützte RIS-Suchform

Start mit einer einfachen RIS-Normsuche über die Ergebnis-Seite (`Ergebnis.wxe`) gegen die Bundesnormen-Suche.

- Primär: textbasierte Suche über `Suchworte`
- optionaler Input `docType` wird in MVP auf `norm` beschränkt
- `decision`/`material` liefern vorerst explizit `NOT_IMPLEMENTED`

## Übernommene Felder aus der Trefferliste

Pro Treffer werden gemappt:
- `title` (aus Linktext)
- `source_url` (absolute RIS-Dokument-URL)
- `source_id` (wenn aus URL-Query belastbar ableitbar)
- `stable_id` nur wenn `source_id` robust normalisiert werden kann
- `snippet` optional (nur wenn aus Ergebnisliste sinnvoll ableitbar)

## Bewusst noch nicht unterstützt

- Tiefere Trefferstruktur (z. B. Segment-Referenzen)
- inhaltliche Rechtsnorm-Extraktion
- vollständige RIS-Parametrisierung aller Suchmasken
- robuste Mehrquellen-Normalisierung
