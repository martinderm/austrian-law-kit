# Tool Registration Plan (Stub-Phase)

Dieses Dokument beschreibt die zentrale Registrierungsstruktur vor der Implementierungsphase.

## Zusammenhang: Toolname → Vertrag → Stub → Implementierung

1. **Toolname**
   - zentral über `ToolName` und `definitions.ts` geführt.
2. **Vertrag**
   - Input/Output + Fehlerstruktur in `src/types/tool-contracts.ts` und `src/types/shared.ts`.
3. **Stub**
   - je Tool eine Stub-Funktion in `src/tools/<tool>.ts` mit `NOT_IMPLEMENTED`.
4. **Implementierung (später)**
   - Stub-Funktionen werden schrittweise durch echte Logik ersetzt, ohne Tool-ID oder Vertragsform zu brechen.

## Was jetzt schon im Plugin liegt

- zentrale Toolnamen
- gemeinsame Ergebnis-/Fehlerstruktur
- Stub-Dateien pro Tool
- zentrale Definitionsschicht (`definitions.ts`)
- zentrale Registry (`registry.ts`)
- Input-Schemaobjekte pro Tool (`schemas.ts`)
- lokale Registry-Konsistenzprüfung (`validate-registry.ts`)
- Plugin-Entry mit echter stub-basierter `registerTool(...)`-Struktur

## Aktueller Laufzeitfluss (stub-basiert)

1. `index.ts` ruft `validateToolRegistry()` auf.
2. `index.ts` iteriert über `TOOL_REGISTRY`.
3. Je Registry-Entry wird `api.registerTool(...)` mit Name, Beschreibung, Input-Schema und Stub-`execute` registriert.
4. `execute` delegiert an den Stub und gibt nur strukturierte `NOT_IMPLEMENTED`-Ergebnisse zurück.

## Was erst in der Implementierungsphase folgt

- echte fachliche Tool-Logik (RIS/JUSLINE/Cache)
- Netzwerkzugriff, Parsing, Normalisierung
- persistenter Cache-Zugriff
- feinere Laufzeitvalidierung und Output-Schemata

## Leitplanke

In dieser Phase bleibt jede Tool-Ausführung ein Stub. Keine externe I/O-Logik.
