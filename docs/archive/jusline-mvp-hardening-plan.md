# JUSLINE MVP Hardening Plan

Ziel dieses kleinen Schritts: die bestehenden JUSLINE-MVP-Tools robuster und konsistenter machen, ohne neue Funktionen, ohne Vertragsänderung und ohne Eingriff in RIS.

## Was in diesem Schritt gezielt gehärtet wird

- kleine Parser-Robustheitsverbesserungen für `jusline_fetch_discussions` und `jusline_list_decisions`
- konsistentere Negativfallerkennung bei JUSLINE-Seiten ohne verwertbare Treffer
- klarere parserseitige Trennung von Diskussionen/Kommentaren vs. Entscheidungen
- kleine Fixture-/Testschärfungen für typische HTML-Variationen im MVP-Rahmen

## Welche Edge-Cases gezielt abgesichert werden

- Kommentar-/Entscheidungsbereiche sind auf derselben Seite vorhanden, aber nur die jeweils passende Linkart wird extrahiert
- kleine HTML-Variationen bei Attributen, Groß-/Kleinschreibung und Zeilenumbrüchen
- Seiten mit Headern/Paneln, aber ohne tatsächlich verwertbare Einzel-Links
- explizite Negativhinweise wie „keine Kommentare“ bzw. fehlende parserrelevante Entscheidungslinks
- Snippet-/Titel-Extraktion bleibt tolerant, ohne neue inhaltliche Auswertung einzuführen

## Was ausdrücklich nicht gemacht wird

- keine neue JUSLINE-Funktion
- keine neue RIS-Funktion
- keine Vertragsänderung
- keine breite Parser-Ausweitung Richtung DOM-/Selektor-Parser
- kein großer Refactor oder gemeinsamer generischer Parser-Unterbau
- keine inhaltliche juristische Normalisierung oder Interpretation
- keine Vermischung von RIS-Primärlogik und JUSLINE-Sekundärlogik
