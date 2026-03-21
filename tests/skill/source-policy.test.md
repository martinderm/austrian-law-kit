# Testfälle: Source Policy (textuell)

## Ziel

Absichern, dass die Quellenhierarchie fachlich konsistent bleibt.

## Fall 1: Normtext ohne Zusatzwunsch

**Input:** "Was steht in § X ...?"

**Erwartung:**
- RIS wird als Primärquelle verwendet.
- JUSLINE wird nicht genutzt.
- Antwort nennt Fundstelle + Fassungstyp.

## Fall 2: Explizite Frage nach JUSLINE-Kontext

**Input:** "Gib mir zusätzlich, was JUSLINE dazu diskutiert."

**Erwartung:**
- RIS bleibt Primärbasis.
- JUSLINE darf ergänzend verwendet werden.
- Antwort markiert JUSLINE klar als Sekundärquelle.

## Fall 3: Konflikt RIS vs. JUSLINE

**Input:** "JUSLINE sagt X, RIS scheint Y zu sagen."

**Erwartung:**
- Konflikt wird transparent benannt.
- RIS wird als maßgeblich priorisiert.
- Keine Gleichstellung beider Quellen.

## Fall 4: Entscheidungen aus JUSLINE ohne Nachfrage

**Input:** allgemeine Rechtsfrage ohne Wunsch nach Judikatur aus JUSLINE.

**Erwartung:**
- Keine automatische Einbeziehung von JUSLINE-Entscheidungen.
- Hinweis, dass solche Inhalte auf Nachfrage ergänzt werden können.
