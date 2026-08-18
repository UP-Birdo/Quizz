# Wortliste — die Begriffe dieses Projekts

Wozu diese Datei: Damit Nutzer und Claude über dieselben Dinge mit denselben
Wörtern reden. Wer einen Wunsch meldet oder einen Fehler beschreibt, trifft mit
diesen Wörtern genau die Stelle im Code.

**Zwei Ebenen, die auseinandergehalten werden:** Was der NUTZER liest, und wie
es im CODE heisst. Die zweite Spalte ist die, nach der man greppt.

## Die Partie und ihre Teile

| Wort | Im Code | Was gemeint ist |
|---|---|---|
| **Stand** | `stand` | Das Brett samt allem, was zur Stellung gehört: Figuren, wer am Zug ist, Mauern, Risse, Fesseln. Kennt keine Spieler. |
| **Runde / Partie** | `SCHACH_RUNDE`, `runde` | Eine Partie mit Teams, Verlauf, Lootboxen und Fähigkeiten. Liegt über dem Stand. |
| **Tafel** | `SCHACH_TAFEL`, `tafel` | Alle Partien nebeneinander, plus die **Chronik**. |
| **Chronik** | `tafel.chronik` | Je beendeter Partie EIN festgeschriebener Eintrag mit dem Ergebnis. Die Rangliste rechnet nur daraus — deshalb kostet das Löschen einer Partie niemandem Punkte. |
| **Spielart / Variante** | `SCHACH_VARIANTEN`, `variante` | Brettgrösse, Aufstellung und Sonderregeln. Steht nach dem Anlegen fest. |
| **Brettform** | `form` | Quadratisch, Rechteckig oder Kreuz — die Auswahl VOR der Spielart (seit v0.63). |
| **Verlauf** | `runde.verlauf` | Die Liste dessen, was passiert ist. Achtung: Der LETZTE Eintrag ist nicht immer der letzte Zug — Erscheinen und Einsammeln hängen sich hinten an. |
| **Zugzähler / Takt** | `zugZaehler`, `stand.takt` | Zählen Halbzüge. Daran hängen alle Fristen und die Sicherung, dass sich zwei Züge aus einem Team nicht überholen. |
| **Halbzug** | — | Ein Zug einer Seite. Zwei Halbzüge sind ein Zug. |

## Die Lootboxen

| Wort | Im Code | Was gemeint ist |
|---|---|---|
| **Lootbox** | `bonus`, `wuerfel` | Die Box, die auf freien Feldern erscheint. Für den Nutzer seit v0.68 überall „Lootbox" — die Bezeichner im Code heissen weiter `wuerfel`/`bonus`, weil sie in jeder laufenden Partie und in den Firebase-Daten stecken. |
| **Fähigkeit** | `FAEHIGKEITEN` | Was Gutes in einer Lootbox stecken kann. |
| **Unglücks-Lootbox** | `PECH`, `pech: true` | Was Schlechtes darin stecken kann. Wirkt sofort beim Einsammeln — und darf seit v0.73 eine Partie beenden. |
| **Halluzination** | `vollesGlas` | Der Unglückswürfel, der die gegnerischen Figuren falsch aussehen lässt. Hiess bis v0.72 „Volles Glas"; die Kennung im Code bleibt. |
| **Stufe / Seltenheit** | `STUFEN` | Gewöhnlich, Ungewöhnlich, Episch, Legendär — sichtbar an der Farbe, wenn der Haken es zulässt. |
| **Versteckte Fähigkeit** | `versteckt: true` | Kommt in keiner neuen Lootbox und in keiner Liste mehr vor, bleibt aber im Vorrat einsetzbar. Gefiltert in `faehigkeitenDerStufe`. Bisher nur **Ausweichen** (seit v0.78). Nicht mit dem Löschen verwechseln — Gelöschtes fliegt beim nächsten Laden aus jedem Vorrat. |
| **Schubs** | `SCHACH.schubs` | Gewöhnliche Fähigkeit seit v0.79: Eine gegnerische Figur neben einer eigenen weicht ein Feld zurück. Die Ein-Feld-Fassung des Nudelholzes; kein Schlag, keine Könige, der Zug bleibt. |
| **Platztausch** | `SCHACH.platztausch` | Gewöhnliche Fähigkeit seit v0.79: Zwei eigene Figuren tauschen die Plätze — die angetippte mit der direkt davor. Kein König, der Zug bleibt. |
| **Vorrat** | `runde.faehigkeiten[farbe]` | Die gesammelten Fähigkeiten eines Teams, die Marken unter dem Brett. |
| **Stufe der Menge** | `regeln.lootboxMenge` | Wie viele Lootboxen erscheinen: **wenig / normal / viele / Regen** (seit v0.71, vier Kästchen unter dem Lootbox-Haken). Tabelle: `SCHACH_VARIANTEN.LOOTBOX_MENGEN`. |
| **Lootbox-Regen** | `regeln.regen`, `regenStufe` | Die zwei Einstellungen von v0.50/v0.60, die die Stufe abgelöst hat. Sie stehen noch in jeder Partie: Fehlt die Stufe, wird sie daraus gerechnet. Sichtbar sind sie nicht mehr. |

## Regeln und Wirkungen

| Wort | Im Code | Was gemeint ist |
|---|---|---|
| **Sperre** | `SCHACH.gesperrt` | Ein Feld, das niemand betreten darf. Zwei Ursachen: **Mauer** (läuft ab) und **Riss / Loch** (bleibt die ganze Partie). |
| **Sichtlinie / Strahl** | `_strahl`, `_feldBedroht` | Die Linie, die Turm, Läufer und Dame entlangziehen. Eine Sperre bricht sie ab — beim Ziehen UND beim Drohen. |
| **Lage der Ansicht** | `TEAM_SCHACH._drehungVon`, `_feldZuAnzeige` | Wie herum dieses Gerät das Brett zeigt: 0 bis 3 Vierteldrehungen, sodass eine eigene Armee unten steht (seit v0.72). Steht in keinem Spielstand. |
| **Startseite eines Teams** | `stand.startSeiten` | Von welcher Seite eine FARBE gestartet ist (beim Kreuz zwei). Daran hängt die Lage der Ansicht. |
| **Kreuz-Duell** | `variante.kreuzEinzeln` | Ein Kreuz mit nur einer Armee je Team, Startseite ausgelost (seit v0.72). |
| **Startseite** | `stand.bauernSeiten` | Von welcher Seite ein Bauer kommt. Er läuft geradewegs zur gegenüberliegenden; dort wandelt er um. Ohne Eintrag gilt die Farbregel (Weiss unten, Schwarz oben). |
| **Gefallen** | `runde.gefallen` | Merkt sich **wo** eine Figur starb (`{art, feld}`). Dafür der Friedhof und die Wiederbelebung. |
| **Verloren** | `runde.verloren` | Merkt sich nur **was** verloren ging. Dafür die Wiedergeburt und die Bilanz. |
| **Zwei Leben** | `koenigeAlsLeben` | Wer mehr als einen König hat, dessen Könige sind gewöhnliche Figuren; beim letzten gelten wieder Schach und Matt. |
| **Saat** | `_zufallsWert(saat)` | Der Text, aus dem der gerechnete Zufall entsteht. Statt `Math.random()` — sonst sähe jedes Gerät ein anderes Brett. Was sich unterscheidet, gehört an den ANFANG der Saat. |

## Am Bildschirm

| Wort | Im Code | Was gemeint ist |
|---|---|---|
| **Spur** | `_letzteSpur` | Die eingefärbten Felder des letzten Zuges. |
| **Anleitung / Vorschau** | `SCHACH_VORSCHAU` | Die abgespielte Bilderfolge zu jeder Fähigkeit. Wird mit den echten Regeln **gerechnet**, nie gezeichnet. |
| **Bibliothek** | `faehigkeitenOeffnen` | Die Übersicht aller Fähigkeiten hinter dem i-Knopf. |
| **Rückschau** | `SCHACH_RUNDE.rueckschau` | „Wie es dazu kam" — der Bildschirm vor Sieg oder Niederlage. |
| **Vorschau-Kasten** | `zielVorschau`, `zielUmriss` | Der grüne Rahmen beim Platzieren einer Fähigkeit mit Zielfeld. |
| **Laufendes Item** | `laufendesZugmuster` | Eine Fähigkeit, die IHR Zug ist (Sprung, Teleport) und auf ihre Figur wartet. Lässt sich seit v0.76 abbrechen — dann kommt sie zurück in den Vorrat. |
| **Figurenzähler** | `materialVorsprung` | Das `+N` unter dem Brett. Gerechnet aus der STELLUNG, nicht aus den Verlusten; nur die führende Seite trägt eine Zahl (seit v0.76). |
| **Wer zuerst zieht, hat gezogen** | `regeln.einigkeit` (umgekehrt) | Der Haken beim Anlegen. **Aus** heisst: Das Team stimmt ab — das ist seit v0.76 die Vorgabe. Im Stand steht weiter `einigkeit`, unverändert in seiner Bedeutung. |
| **Abschluss** | `TEAM_SCHACH.abschluss` | Der Bildschirm am Ende einer Partie, in drei Schritten: Rückschau, Ergebnis, Punktestand. |
