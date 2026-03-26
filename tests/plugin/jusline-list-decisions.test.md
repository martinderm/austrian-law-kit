# jusline_list_decisions (Testplan MVP)

Ziel: optionale JUSLINE-MVP-Funktion für Entscheidungslisten absichern, strikt getrennt von Diskussionen/Kommentaren.

## Fixtures (reale Seiten als reduzierte Snapshot-Extrakte)

- Positiv: `fixtures/jusline/stgb-paragraf-111-decisions.html`
- Negativ: `fixtures/jusline/stvo-paragraf-4.html`
- Dokumentation: `fixtures/jusline/README.md`

Hinweis: Die Fixtures basieren auf realen JUSLINE-Seiten, enthalten aber nur die
parserrelevanten Entscheidungssektionen (Gerichtsgruppen, Entscheidungslinks, Metadaten-Badges).
Kommentar-/Diskussionsblöcke bleiben bewusst außen vor oder werden ignoriert.

## Testfälle

### 1) URL-Bau aus voller URL

**Given**
- `query = "https://www.jusline.at/gesetz/stgb/paragraf/111"`

**Then**
- URL wird akzeptiert und direkt verwendet

---

### 2) URL-Bau aus Pfadform

**Given**
- `query = "stgb/paragraf/111"`

**Then**
- URL wird robust auf JUSLINE-Basis aufgebaut

---

### 3) Positivbeispiel: Entscheidungen vorhanden

**Given**
- Fixture `stgb-paragraf-111-decisions.html`

**When**
- Parser läuft

**Then**
- mindestens ein Hit
- Hits enthalten `title`, `source_url`, `source_id`
- `stable_id` ist gesetzt und folgt dem Präfix `jusline:dec:`
- optionale `snippet`-Felder enthalten nur knappe Metadaten, keine Kommentartexte

---

### 4) Negativbeispiel: keine Entscheidungslinks erkannt

**Given**
- Fixture `stvo-paragraf-4.html`

**When**
- Parser läuft

**Then**
- keine Decision-Hits
- Tool liefert `NOT_FOUND`

---

### 5) Fehlerfälle

**Then**
- ungültiger Input -> `VALIDATION_ERROR`
- HTTP/Fetch/Body-Probleme -> `UPSTREAM_UNAVAILABLE`
- 404 -> `NOT_FOUND`

---

### 6) Keine Diskussionslogik

**Then**
- Kommentare/Diskussionen werden in diesem Schritt nicht als Treffer ausgegeben
- keine Vermischung mit `jusline_fetch_discussions`

---

### 7) Keine RIS-Auswirkungen

**Then**
- bestehende RIS-MVP-Tools bleiben unverändert nutzbar
