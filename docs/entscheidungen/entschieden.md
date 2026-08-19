# Quizz - Entscheidungen / Entschieden - und warum

## Nutzer-Entscheidungen

### Beim Anlegen (2026-07-31)

| Frage | Entscheidung |
|---|---|
| Wo liegen die Daten? | **Gemeinsam für alle Besucher** — nicht je Gerät getrennt. Die Folgen (Fremddienst, öffentlich schreibbar) wurden ausdrücklich in Kauf genommen. |
| Wohin auf GitHub? | **Eigenes Repository** mit eigener Pages-Adresse. |
| Zeilen | Name als **Freitext**, Zeilen **frei erweiterbar**. |
| Spalten | **Fest**: Name, danach fünf Würfel-Spalten. |

### Der eigentliche Zweck (2026-07-31, kurz nach v0.1)

Die Seite ist kein Formular, sondern ein **Ratespiel**: Alle würfeln fünf
Würfel, halten sie geheim, stellen sich über den Tag Fragen und tragen ihre
Vermutungen über die anderen ein. Am Ende wird aufgelöst. Vorgabe war
ausdrücklich, es **so einfach wie möglich** zu halten und die Ausgestaltung zu
entscheiden. Daraus folgten die Entscheidungen unten.

### Aufdecken und Verstecken (2026-07-31, zu v0.3)

| Wunsch | Umsetzung |
|---|---|
| Auflösen soll jeder nur für sich selbst | Der gemeinsame Auflösen-Knopf entfällt. Jeder hat **Meine Würfel aufdecken** in seiner eigenen Karte; die anderen raten weiter. |
| Augen-Knopf, der die eigenen Zahlen versteckt, standardmäßig an | Auge in der eigenen Karte, Grundzustand verdeckt, Zustand wird nicht gespeichert. |


## Wo die Begründungen liegen

Diese Datei war bis 19.08.2026 eine einzige Sammlung mit 126 KB — jedes
„liest vorher entschieden.md" kostete damit ein Drittel eines Chat-Kontexts.
Seitdem stehen hier nur noch die Nutzer-Entscheidungen (oben); alle
Begründungs-Abschnitte liegen **unverändert** in drei Themendateien:

| Datei | Inhalt |
|---|---|
| [entschieden-grundlagen.md](entschieden-grundlagen.md) | Würfel Quizz, PIN/Siegel, Firebase/Technik, Tabs |
| [entschieden-bis-v3.md](entschieden-bis-v3.md) | Team Schach und Imposter bis v3.8 (08/2026) |
| [entschieden-ab-v0-41.md](entschieden-ab-v0-41.md) | Team Schach seit v0.41 (SemVer-Zeit) |

**Das Abschnitts-Verzeichnis mit Anmerkungen führt allein der
[00-INDEX.md](00-INDEX.md)** — dort nachschlagen, dann in der Themendatei den
Abschnitt über seine Überschrift ansteuern, nie eine ganze Datei lesen.
Neue Abschnitte: in die passende Themendatei schreiben UND im Index eintragen.
