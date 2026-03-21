# Example Config

Dieses Verzeichnis enthält **rein illustrative Pseudo-Vorlagen** für die Einbindung des Repositories in OpenClaw-Instanzen.

## Wichtig

Diese Dateien sind **keine garantierte produktive OpenClaw-Konfiguration** und auch **kein verbindlich gültiges OpenClaw-Config-Format**. Sie zeigen nur Struktur und Intention.

## Enthalten

- `openclaw.skill-wiring.example.json`
  - zeigt exemplarisch, wie der Skill `skills/austrian-law/` in einer Instanz referenziert werden kann.

## Ziel

- Skill-Wiring transparent machen
- später Plugin-Wiring ergänzen
- instanzspezifische Werte getrennt halten

## Hinweise

- Vorlagen niemals 1:1 in Produktivinstanzen übernehmen.
- Pfade, Agent-IDs und Tool-Policies instanzspezifisch anpassen.
- Quellenpolitik aus `docs/source-policy.md` bleibt unverändert.
