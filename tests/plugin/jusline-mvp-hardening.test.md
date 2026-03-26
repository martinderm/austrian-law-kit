# jusline_mvp_hardening (Testplan MVP)

Ziel: kleine Robustheits- und Fixture-Härtungen für die bestehenden JUSLINE-MVP-Tools absichern, ohne Vertrags- oder Scope-Änderung.

## Fixtures

- Diskussionen Standard: `fixtures/jusline/stgb-paragraf-111.html`
- Diskussionen Variante (belastbar für Verifikation): `fixtures/jusline/stgb-paragraf-111-discussions-variant.html`
- Entscheidungen Standard: `fixtures/jusline/stgb-paragraf-111-decisions.html`
- Entscheidungen Variante (belastbar für Verifikation): `fixtures/jusline/stgb-paragraf-111-decisions-variant.html`
- Entscheidungen Negativ: `fixtures/jusline/stgb-paragraf-111-no-decisions.html`
- Kommentare Negativ: `fixtures/jusline/stvo-paragraf-4.html`

## Testfälle

### 1) Diskussionen/Kommentare bleiben von Entscheidungen getrennt

**Given**
- Standard- oder Variant-Fixture für Diskussionen
- dieselbe Seite enthält zusätzlich einen Entscheidungs-Header oder Entscheidungslink

**Then**
- `jusline_fetch_discussions` extrahiert nur Kommentar-/Diskussionslinks
- Entscheidungslinks werden ignoriert

---

### 2) Entscheidungen bleiben von Diskussionen getrennt

**Given**
- Standard- oder Variant-Fixture für Entscheidungen
- dieselbe Seite enthält zusätzlich Kommentarlink(s)

**Then**
- `jusline_list_decisions` extrahiert nur Entscheidungslinks
- Kommentar-/Diskussionslinks werden ignoriert

---

### 3) Kleine HTML-Variationen brechen Parsing nicht sofort

**Given**
- die beiden belastbaren Variant-Fixtures mit abweichender Groß-/Kleinschreibung, Attributreihenfolge, Zeilenumbrüchen und etwas lockerem Link-/Snippet-Markup

**Then**
- robuste Trefferextraktion bleibt erhalten
- Titel und optionale Snippets bleiben nutzbar
- die Verifikation stützt sich für diesen Schritt primär auf diese beiden UTF-8-sauberen Variant-Fixtures

---

### 4) Negativfälle bleiben konsistent

**Given**
- Diskussionen-Negativfixture mit explizitem „keine Kommentare“-Hinweis
- Entscheidungen-Negativfixture mit vorhandenem Panel, aber ohne verwertbare Einzel-Links

**Then**
- beide Tools liefern `NOT_FOUND`
- die Negativfälle sind parserseitig sauber und getrennt abgestützt

---

### 5) Keine RIS-Auswirkungen

**Then**
- bestehende RIS-MVP-Tools bleiben unverändert nutzbar
- dieser Schritt ändert keine RIS-Logik, keine RIS-Verträge und keine RIS-Fixtures
