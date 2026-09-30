# System-Map — Lesevertrag

## Inputs
Reference: [Katalog](CLAUDE.md), [_meta/schema.md](_meta/schema.md), die in der ausgewählten Karte verlinkten Quellmodule. Working: konkreter Änderungsauftrag oder GitHub Issue.

## Do NOT load
Nicht das gesamte Repository oder alle Karten laden. docs/archive/ enthält Historie, keine aktuellen Aufträge. Keine Runtime-Caches, lokalen Settings oder Credentials zur Kartierung laden.

## Process
1. Katalog nach Objekt oder Prozess wählen; für Änderungen effects/CONTEXT.md lesen.
2. Quellzitate und Grenzen der ausgewählten Karte prüfen. Code hat bei Istzustandsfragen Vorrang; SKILL.md trägt die fachliche Policy.
3. Live = aktiv verdrahtet; leftover = historisch/ersetzt; ghost = benannt, aber nicht implementiert. Aspirative Indizes sind ghosts, archivierte Pläne leftovers.
4. Bei Drift Karte mit Quelle, Datum und Revision synchron aktualisieren. Neue Karten aus _templates/ kopieren. CLAUDE.md ändern und AGENTS.md/routing.md daraus bytegleich generieren.

## Outputs
Begründeter Änderungsscope und synchron aktualisierte Objekt-/Prozesskarten. Offene Arbeit als GitHub Issue, keine lokale Backlog-Datei.

## Human Check
Eine fremde Person kann vom Repository-Einstieg eine Karte finden, deren Quellbelege öffnen und direkte Änderungsauswirkungen erklären. Kartierungsstand ist keine Behauptung eines aktuellen erfolgreichen Testlaufs.
