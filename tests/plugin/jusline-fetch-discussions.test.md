# jusline_fetch_discussions (Testplan MVP)

Ziel: erste JUSLINE-MVP-Funktion für Diskussionen/Kommentare absichern.

## Fixtures (reale Seiten als reduzierte Snapshot-Extrakte)

- Positiv: `fixtures/jusline/stgb-paragraf-111.html`
- Negativ: `fixtures/jusline/stvo-paragraf-4.html`
- Dokumentation: `fixtures/jusline/README.md`

Hinweis: Die Fixtures basieren auf realen JUSLINE-Seiten, enthalten aber nur die
parserrelevanten Sektionen (Kommentare/Kommentarlinks/"keine Kommentare" + Entscheidungs-Header als Gegenprobe).
Volatiles Seiten-Drumherum (Navigation, Tracking, Layout-Overhead) ist bewusst entfernt.

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

### 3) Positivbeispiel: Diskussions-/Kommentar-Treffer vorhanden

**Given**
- Fixture `stgb-paragraf-111.html`

**When**
- Parser läuft

**Then**
- mindestens ein Hit
- Hits enthalten `title`, `source_url`, `source_id`
- `stable_id` ist gesetzt und nicht leer
- optionale `snippet`-Felder werden sauber gekürzt

---

### 4) Negativbeispiel: keine Kommentare

**Given**
- Fixture `stvo-paragraf-4.html`

**When**
- Parser läuft

**Then**
- keine Diskussions-/Kommentar-Treffer
- Tool liefert `NOT_FOUND`

---

### 5) Fehlerfälle

**Then**
- ungültiger Input -> `VALIDATION_ERROR`
- HTTP/Fetch/Body-Probleme -> `UPSTREAM_UNAVAILABLE`
- 404 -> `NOT_FOUND`

---

### 6) Keine Entscheidungslogik

**Then**
- Entscheidungen auf derselben Seite werden in diesem Schritt ignoriert
- keine `jusline_list_decisions`-Logik eingeschlichen

---

### 7) Keine RIS-Auswirkungen

**Then**
- bestehende RIS-MVP-Tools bleiben unverändert nutzbar
