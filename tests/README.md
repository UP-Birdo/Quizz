# Tests

Regressionstests der Spiellogik. Sie laden die **echten** Dateien `js\modell.js`
und `js\versiegelung.js` und enthalten keine Kopien von Funktionen — Kopien
driften und testen dann etwas, das es so nicht mehr gibt.

## Aufruf

Alle Testdateien auf einmal:

    powershell -ExecutionPolicy Bypass -File "tests\Tests-Ausfuehren.ps1"

Das Skript findet seine Pfade relativ zu sich selbst und darf mit dem Projekt
verschoben werden.

**Erwartung:** je Testdatei eine Zeile `N ok, 0 Fehler`, am Ende
`Alle Testdateien in Ordnung.` und Exit-Code 0.

## Warum kein Node?

Auf diesem Rechner ist Node.js nicht installiert. Visual Studio Code bringt
aber eine Node-Laufzeit mit: `Code.exe` verhält sich wie Node, sobald die
Umgebungsvariable `ELECTRON_RUN_AS_NODE` gesetzt ist. Genau das macht
`Tests-Ausfuehren.ps1`. Es sucht `Code.exe` an den üblichen Orten
(`%LOCALAPPDATA%\Programs\Microsoft VS Code`, `C:\Program Files\…`).

Einzeln geht es auch von Hand:

    $env:ELECTRON_RUN_AS_NODE = "1"
    & "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe" "tests\test-modell.js"

## Was wird geprüft (`test-syntax.js`)

Die Bildschirm- und Speicherdateien laufen nur im Browser, lassen sich hier
aber **übersetzen**, ohne sie zu starten. Das fängt Tippfehler, vergessene
Klammern und typografische Anführungszeichen sofort ab.

| Bereich | Inhalt |
|---|---|
| Übersetzbarkeit | jede Datei in `js\` wird kompiliert |
| Einbindung | jede Datei aus `js\` und `css\stil.css` ist in `index.html` verlinkt |
| Aufrufe | jedes `MODELL.xyz` und `VERSIEGELUNG.xyz` im gesamten Programm gibt es wirklich — fängt umbenannte Funktionen, die anderswo unter dem alten Namen weiterleben |
| Version | `APP_VERSION` aus `js\konfig.js` kommt in `CHANGELOG.md` vor |

## Was wird geprüft (`test-modell.js`)

| Bereich | Inhalt |
|---|---|
| Werte | fünf Würfel, Auswahl 1 bis 5 und Stern, gültig/ungültig, Sortierung, Vollständigkeit |
| Grundstrukturen | leere Runde, neuer Spieler, eindeutige Kennungen |
| `normalisieren()` | Unsinn-Eingaben, Übernahme eines Standes der Fassung 1, **Würfel erscheinen nur bei aufgedeckten Spielern**, Tipps bereinigen, fehlende Kennung |
| Spieler | hinzufügen, suchen (Kennung und Name), austreten samt Tipps auf ihn, umbenennen |
| PIN | wird nur als Prüfsumme mit Salz hinterlegt, nie als Ziffern; unvollständige Angaben gelten als keine PIN; eine neue Runde löscht sie NICHT |
| Festlegen | Siegel wird veröffentlicht, Würfel nicht; erneutes Festlegen wird gezählt und macht ein früheres Aufdecken ungültig |
| Tipps | landen beim Rater, nicht beim Ziel; ungültige Werte, Spalten, Selbst-Tipps und Tipps auf Unbekannte werden abgewiesen; **wer aufgedeckt hat, kann nicht mehr betippt werden** |
| Aufdecken | schreibt Würfel und Siegel-Ergebnis; neue Runde behält die Spieler |
| Auswertung | Trefferzählung als Multimenge, Reihenfolge egal, doppelte Werte, leere Felder, Ergebnis nur gegen Aufgedeckte, Sortierung |
| Punkte | genau/knapp/zu weit daneben, beste Paarung der Restwerte, Stern nur exakt, doppelte Werte, Bonus für den besten Tipp (auch bei Gleichstand, nicht bei null Punkten), Erklärungstext nennt die geltenden Zahlen |
| Zusammenführen | fremde Spieler bleiben erhalten, der eigene Eintrag gewinnt, ein frisch angelegter eigener Eintrag wird angehängt, fremde Änderungen werden übernommen — der Schutz gegen den v0.8-Fehler |
| Vergleich | `inhaltGleich()` ignoriert den Zeitstempel, erkennt jede echte Änderung |

## Was wird geprüft (`test-versiegelung.js`)

Das Siegel ist der Kern des Spiels — ohne es könnte jeder Mitspieler die Würfel
der anderen in der Datenbank nachschlagen.

| Bereich | Inhalt |
|---|---|
| Salz | lang genug, jedes Mal anders |
| Prüfwert | gleiche Eingabe ergibt gleichen Wert, Reihenfolge der Würfel egal, anderer Wurf oder anderes Salz ergibt anderen Wert |
| Prüfung | erkennt den richtigen Wurf (auch umsortiert), weist geänderten Wurf, falsches Salz und fehlendes Siegel ab |
| Geheimhaltung | der veröffentlichte Wert enthält keinen Klartext |
| Spieler-PIN | richtige PIN wird erkannt, falsche nicht; gleiche PIN bei zwei Spielern ergibt dank Salz verschiedene Prüfwerte; der Prüfwert enthält die Ziffern nicht |
| Verwaltung | die Prüfsumme in `js\konfig.js` passt zum vereinbarten Passwort — schlägt der Test fehl, käme niemand mehr in die Verwaltung |

## Eine neue Testdatei anlegen

Datei `tests\test-<thema>.js` — sie wird automatisch mitgelaufen (Muster
`test-*.js`). Aufbau wie `test-modell.js`: `pruefe(...)`-Aufrufe, am Ende
`console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler")` und
`process.exit(anzahlFehler === 0 ? 0 : 1)`.

## Was die Tests NICHT prüfen

Ob der Bildschirm-Code sich richtig VERHÄLT — Zeichnen, Fokus, Dialoge, das
Zusammenspiel mit der Datenbank. Das braucht einen Browser und wird von Hand
geprüft; die Prüfliste steht in [../docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md),
Abschnitt 1.
