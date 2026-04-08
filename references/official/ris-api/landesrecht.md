# OGD-RIS API V2.6 — Landesrecht

## Relevanter Endpunkt
- `GET https://data.bka.gv.at/ris/api/v2.6/Landesrecht`

## Relevante Applikationen laut Handbuch
- `LrKons` — Landesrecht konsolidiert
- `LgblAuth` — LGBl authentisch
- `Lgbl` — LGBl nicht-authentisch
- `LgblNO` — LGBl Niederösterreich (Sonderfall)
- `Vbl` — Verordnungsblätter

## Bundesländer-Filter laut Handbuch
- `SucheInBurgenland=true`
- `SucheInKaernten=true`
- `SucheInNiederoesterreich=true`
- `SucheInOberoesterreich=true`
- `SucheInSalzburg=true`
- `SucheInSteiermark=true`
- `SucheInTirol=true`
- `SucheInVorarlberg=true`
- `SucheInWien=true`

## Für das Projekt relevant
- Landesrecht braucht expliziten Bundesland-Kontext
- freie Heuristiken sind riskant; harte Bundesländer-Liste ist sinnvoll
- Discovery über die offizielle API ist deutlich attraktiver als HTML-Suche mit `Bundesland`-Feldern auf `Ergebnis.wxe`

## Bezug zum aktuellen Code
- Im aktuellen Plugin gibt es bereits `scope: land`
- Bundesländer sind bereits explizit im Code festgelegt
- HTML-basierte Landesrecht-Suche ist aber nur ein Zwischenschritt

## Migrationsidee
1. `scope=land` + Bundesland -> API-Request an `Landesrecht`
2. API-Parameter an offizielle Bundesland-Flags anbinden
3. direkte Dokument-/Content-URLs aus JSON-Metadaten ableiten
