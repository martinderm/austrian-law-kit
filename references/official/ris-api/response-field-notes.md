# OGD-RIS API V2.6 — Response Field Notes

Quelle:
- `data-gv-at-69942f5890073b38542a02d8.pdf`

## Zweck dieser Datei
Diese Notizen halten fest, welche Arten von Response-Feldern für das Projekt wahrscheinlich wichtig sind, auch wenn noch nicht jede echte Live-Response im Detail gegenverifiziert wurde.

## Laut bisheriger Analyse wichtig

### Such-/Trefferkontext
- Trefferlisten / Dokumentlisten als strukturierte JSON-Antwort
- Metadaten statt bloß HTML-Darstellung
- Pagination-/Sortierkontext

### Fehlerkontext
- strukturiertes Error-Objekt, sinngemäß unter `OgdSearchResult.Error.*`
- technische Fehler zusätzlich auf HTTP-Ebene möglich

### Content-Referenzen
- Verweise auf eigentliche Inhalte über ContentReference-/URL-Strukturen
- Hinweise auf HTML/PDF/RTF/XML-Zugänge
- teils `GesamteRechtsvorschriftUrl` für Gesamtfassungen

## Was für das Projekt später als interne Felder interessant sein könnte
- Applikation / Scope
- Dokumentnummer
- Gesetzesnummer
- Titel / Kurzinformation
- Fassungskontext
- Sortier-/Trefferkontext
- Content-URLs
- eventuell Änderungs-/History-Felder

## Empfehlung
Sobald erste echte API-Responses im Projekt vorliegen, sollte diese Datei konkretisiert werden in:
- bestätigte Felder
- übernommene interne Felder
- bewusst ignorierte Felder
