# Changelog

## 0.4.0 - Lokale Cache-Helfer (ohne I/O)
- Stable-ID-Helfer ergänzt (`src/cache/stable-id.ts`)
- Cache-Pfad-Ableitung ergänzt (`src/cache/cache-paths.ts`)
- Artefakt-Serialisierung (Markdown+Frontmatter/Metadata-JSON) ergänzt
- optionale Parse-Gegenfunktion für Scaffold-Format ergänzt
- textuelle Tests für Stable-ID/Pfade/Serialisierung ergänzt

## 0.3.0 - Stub-Tool-Registrierung + Schema-Vorbereitung
- zentrale Tool-Definition/Registry mit Stubs eingeführt
- Plugin-Entry registriert alle Tools stub-basiert via `registerTool(...)`
- Input-Schemaobjekte pro Tool ergänzt
- lokale Registry-Konsistenzprüfung ergänzt
- Ergebnisformat über zentrales `format-result` gekapselt
- Frontmatter-Basistyp eingeführt und in Tool-Contracts verdrahtet

## 0.2.0 - Vertrags- und Plugin-Skelett-Härtung
- Quellenpolitik/Response-Contract geschärft
- Stable-ID- und Frontmatter-Spezifikation ergänzt
- OpenClaw-konformes Plugin-Skelett angelegt (Manifest + `openclaw.extensions` + Root-Entry)
- textuelle Vertrags-/Registry-Tests ergänzt

## 0.1.0 - Scaffold
- Initiales Repository-Scaffold erstellt
- Dokumentationsgerüst angelegt
- Skill-Gerüst unter `skills/austrian-law/` angelegt
- Platzhalter für Plugin/Tests/Fixtures/Configs ergänzt
