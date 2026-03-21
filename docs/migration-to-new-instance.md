# Migration in neue OpenClaw-Instanzen

## Ziel

Portables Übertragen des Scaffold-Setups in eine frische oder bestehende Instanz.

## Migrations-Checkliste

1. Repository in der neuen Instanz bereitstellen.
2. Skill `skills/austrian-law/` einbinden.
3. Beispiel-Config aus `example-config/` als Vorlage nutzen (nicht blind übernehmen).
4. Memory-Zielstruktur nach `docs/memory-layout.md` anlegen.
5. Tests/Fixtures lokal ergänzen, bevor produktive Logik aktiviert wird.

## Portabilitätsregeln

- Keine hardcodierten absoluten Pfade im Repo verwenden.
- Instanzspezifische Werte nur in lokaler Konfiguration setzen.
- Quellenpolitik unverändert übernehmen (RIS-first, JUSLINE opt-in).
