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
- Plugin-Entry mit Registry-Referenz (nur Struktur/Logging)

## Was erst in der Implementierungsphase folgt

- echte Tool-Registrierung über Plugin-API
- Input-/Output-Schemaobjekte pro Tool (laufzeitnah)
- fachliche Logik (RIS/JUSLINE/Cache)
- Netzwerkzugriff, Parsing, Normalisierung
- persistenter Cache-Zugriff

## Leitplanke

In dieser Phase bleibt jede Tool-Ausführung ein Stub. Keine externe I/O-Logik.
