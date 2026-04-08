# Decision Log

## 2026-03-21 — Repository-first Aufbau
**Entscheidung:** Portables Scaffold statt instanzspezifischer Direktintegration.
**Warum:** Wiederverwendbarkeit und saubere Migration in neue OpenClaw-Instanzen.

## 2026-03-21 — RIS-first Quellenpolitik
**Entscheidung:** RIS als Primärquelle, JUSLINE nur sekundär/opt-in.
**Warum:** Verlässlichkeit bei Normwortlaut/Metadaten und klare Konfliktauflösung.

## 2026-03-21 — Vertragsgetriebene Entwicklung
**Entscheidung:** Erst Doku-/Datenvertrag, dann Tool-Typen/Registry, dann Implementierung.
**Warum:** Stabilere Schnittstellen und weniger Umbauten in späteren Phasen.

## 2026-03-21 — Manifest-first Plugin-Skelett
**Entscheidung:** OpenClaw-konformes Plugin mit Manifest + `openclaw.extensions` + Root-Entry.
**Warum:** Discovery/Config-Validierung und Ladepfad früh korrekt aufsetzen.

## 2026-03-21 — Stub-first Tool-Registrierung
**Entscheidung:** Alle Tools früh strukturell registrieren, aber nur mit `NOT_IMPLEMENTED`.
**Warum:** Schnittstellen und Registry-Verhalten testbar machen ohne voreilige Logik.

## 2026-03-21 — Lokale Cache-Helfer vor I/O/Netzwerk
**Entscheidung:** Stable-ID, Pfade, Serialisierung zuerst lokal und deterministisch bauen.
**Warum:** Solide Basis für lokale Artefaktpersistenz ohne externe Abhängigkeiten.

## 2026-04-08 — RIS-Fetch nutzt API-Metadaten, wenn `sourceId` bekannt ist
**Entscheidung:** `ris_fetch_segment` und `ris_fetch_whole_law` versuchen bei bloßer `sourceId` zuerst einen offiziellen RIS-API-Lookup und bevorzugen daraus `content_url` bzw. `whole_law_url`.
**Warum:** Belastbarere Ziel-URLs, weniger Raterei über generische `Dokument.wxe`-Links und bessere Anschlussfähigkeit an die API-first-Discovery.

## 2026-04-08 — Landesrecht bleibt trotz API-first defensiv
**Entscheidung:** State-spezifische Titelvarianten bleiben aktiv, und bekannte API-Missgriffe werden offen als Limit dokumentiert statt schöngeredet.
**Warum:** Die Live-Prüfung über alle Bundesländer war weitgehend brauchbar, aber nicht makellos; konkret liefert Niederösterreich für `Bauordnung` derzeit bevorzugt eine authentische Interpretation statt der Stammnorm.
