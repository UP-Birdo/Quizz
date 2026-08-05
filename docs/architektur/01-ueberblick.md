# Quizz — Architektur / Spiel-Absatz, Leitgedanke, Dateien

## Das Spiel in einem Absatz

Jeder Mitspieler würfelt fünf Würfel und hält sie geheim. Über den Tag rät jeder
für jeden anderen, was der gewürfelt hat. Aufgedeckt wird **einzeln**: Wer mag,
gibt seinen eigenen Wurf frei, die anderen raten weiter. Für jede Vermutung auf
eine aufgedeckte Person wird gezählt, wie viele Werte stimmten. Der Kniff liegt
in der Geheimhaltung — dazu unten der Abschnitt **Siegel**.

## Leitgedanke

Schichten mit je einer Aufgabe. Keine Schicht greift an einer anderen vorbei:

    konfig.js        Einstellungen (die einzige Datei, die von Hand angepasst wird)
        |
    modell.js        Spiel- und Datenlogik: was gültig ist, wie sich Daten ändern,
        |            wie Treffer gezählt werden (kennt weder Bildschirm noch Speicher)
        |
    versiegelung.js  Siegel bilden und prüfen (SHA-256)
    ich.js           was nur auf DIESEM Gerät liegt: Name und eigener Wurf
        |
    speicher.js      gemeinsame Ablage: lokal oder Firebase
    abgleich.js      Vermittlung: laden, verzögert schreiben, fremde Änderungen holen
        |
    wuerfel-quizz.js Bildschirm: der Spiel-Tab
    team-schach.js   Bildschirm: Übersicht und Brett des zweiten Spiels
    rangliste.js     Bildschirm: Punkte aus beiden Spielen (liest nur)
    tabs.js          Bildschirm: Tab-Leiste
    dialog.js        Bildschirm: eigene Rückfragen und Eingaben
        |
    app.js           Startpunkt: verdrahtet alles in fester Reihenfolge

Das Schach hängt als eigener Turm daneben, nach demselben Muster:

    schach-varianten.js  Spielarten als reine Tabelle (Maße, Sonderregeln)
        |
    schach.js            Regeln: Brett beliebiger Größe, Züge, Matt
        |
    schach-runde.js      eine Partie: Teams, Zugrecht, Verlauf, Fähigkeiten
        |
    schach-tafel.js      alle Partien nebeneinander

Der Gewinn: Spiellogik und Siegel sind ohne Browser testbar, und ein anderer
Speicher-Dienst kostet genau eine neue Klasse in `speicher.js`.

## Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Gerüst: Kopf mit Version und Status, Tab-Leiste, Inhaltsbereich, Dialog-Ebene. Lädt die Skripte in fester Reihenfolge. |
| `css/stil.css` | Gesamtes Aussehen. Farben nur als Variablen im `:root`, dunkle Darstellung folgt der Systemeinstellung. |
| `js/konfig.js` | `APP_VERSION` und alle Speicher-Einstellungen (Modus, Firebase-Adresse, Pfad, Zeitabstände). |
| `js/modell.js` | Reine Spiel- und Datenlogik: erlaubte Werte, Spieler, Tipps, Phasen, `normalisieren()`, `treffer()`, `ergebnis()`. Einzige Datei, die die Modell-Tests laden. |
| `js/versiegelung.js` | Siegel: Salz erzeugen, Prüfsumme bilden, Wurf gegen das Siegel prüfen. |
| `js/ich.js` | Der Gerätespeicher: wer ich bin (Kennung, Name) und mein Wurf samt Salz. Verlässt das Gerät nie. |
| `js/speicher.js` | Zwei Rückwände (`SpeicherLokal`, `SpeicherGemeinsam`) mit gleicher Schnittstelle plus `speicherErzeugen()`. |
| `js/abgleich.js` | Klasse `Abgleich`: erstes Laden, verzögertes Schreiben, regelmäßiges Nachfragen im gemeinsamen Modus. |
| `js/dialog.js` | `DIALOG.frage()`, `DIALOG.hinweis()`, `DIALOG.eingabe()` — Ersatz für `confirm()`/`alert()`/`prompt()`. |
| `js/tabs.js` | Offenes Tab-Register; ein Tab meldet sich mit `id`, `titel` und `aufbauen(behaelter)` an. |
| `js/wuerfel-quizz.js` | Der Tab **Würfel Quizz**: Anmelden, eigene Karte, Vermutungen, Auflösung, Bestenliste. |
| `js/schach-varianten.js` | Datentabelle der Spielarten: Brettmaße, Startaufstellung, Rochade ja/nein, schlagbarer König, Bonusfelder. Keine Logik. |
| `js/schach.js` | Reine Schachregeln: Brett **beliebiger Größe**, Zugerzeugung, Bedrohung, Rochade, en passant, Umwandlung, Matt und Patt, Wirkung der Fähigkeiten. Ohne Browser testbar. |
| `js/schach-runde.js` | EINE Partie mit ihren Teams: beitreten, bereit, Zugrecht, Verlauf, Fähigkeiten einsammeln und einsetzen, Ergebnis. Ebenfalls ohne Browser testbar. |
| `js/schach-tafel.js` | Die Sammlung aller Partien: anlegen, einsetzen, entfernen, sortieren — und der Umstieg von der früheren Einzelpartie. Ohne Browser testbar. |
| `js/team-schach.js` | Der Tab **Team Schach**, Kern: Zustand, Zeichnen, Partie-Kopf, Teams, Bedienung, Zugversand mit Zugzähler-Prüfung, Bausteine. |
| `js/team-schach-uebersicht.js` | Ergänzt `TEAM_SCHACH`: Liste aller Partien, Auswahl der Spielart mit Vorschaubildern, Einstellungen einer neuen Partie. |
| `js/team-schach-brett.js` | Ergänzt `TEAM_SCHACH`: Brett, Randbeschriftung, Spur des letzten Zuges, Würfel, Abstimmung über einen Vorschlag, Bewegungen. |
| `js/team-schach-auswertung.js` | Ergänzt `TEAM_SCHACH`: Abschluss-Bildschirm mit Punktestand, Übersicht aller Fähigkeiten, Bilanz und Zugverlauf. |
| `js/imposter-woerter.js` | Der Wortkatalog als reine Datentabelle: Themen, darin die Wörter je Wortart. Keine Logik. |
| `js/imposter-runde.js` | EIN Raum: beitreten, bereit, starten, Tipps, Auflösung, Punkte. Wort und Rollen werden aus dem Salz gerechnet. Ohne Browser testbar. |
| `js/imposter-tafel.js` | Die Sammlung aller Räume samt gemeinsamer Wortbibliothek — und der Umstieg von der früheren einzelnen Runde. Ohne Browser testbar. |
| `js/imposter.js` | Der Tab **Imposter**: Übersicht der Räume, Anlegen, der Raum selbst (Warten, Runde, Auflösung), Wortbibliothek. |
| `js/rangliste.js` | Der Tab **Rangliste**: Punkte aus allen drei Spielen zusammengezählt, dazu das **Spielerprofil** (`verlauf()` — welche Partie welche Punkte brachte). Rechnender Teil ohne Browser testbar. |
| `js/verwaltung.js` | Die eine Stelle für „darf der das?": `VERWALTUNG.verlangen(titel, grund)` fragt das Passwort ab, wenn die Verwaltung nicht ohnehin offen ist. |
| `js/app.js` | Startpunkt (`DOMContentLoaded`), Statusanzeige, Hinweisbalken; erzeugt **beide** Speicher und Abgleiche. |
| `tests/` | Regressionstests (`test-modell.js` Spiellogik, `test-versiegelung.js` Siegel, `test-schach.js` Regeln, `test-schach-runde.js` Partie, `test-schach-tafel.js` Sammlung und Umstieg, `test-imposter.js` Rollen, Wortziehung, Räume und Umstieg, `test-rangliste.js` Gesamtwertung, `test-bildschirm.js` Bildschirm gegen ein nachgebautes DOM, `test-syntax.js` Übersetzbarkeit) plus Startskript. |
| `tools/Lokal-Starten.ps1` | Kleiner Test-Server (HttpListener) für `http://localhost:8080/`; `Quizz lokal starten.cmd` startet ihn per Doppelklick. |
| `icon.svg` | Das Zeichen der App als Vektor: Würfelfläche, vier Augen, Stern in der Mitte. **Quelle** für alle Bildgrössen. |
| `icons/` | Die PNG-Fassungen (512, 192, 180, 32) — erzeugt von `tools/Icons-Erzeugen.ps1`, nicht von Hand bearbeiten. |
| `manifest.webmanifest` | Macht die Seite auf dem Startbildschirm zur App (Name, Farben, Zeichen). |
| `tools/Icons-Erzeugen.ps1` | Zeichnet die PNG-Fassungen. Enthält dieselben Koordinaten wie `icon.svg` — beide zusammen ändern und das Ergebnis in 32 Pixeln prüfen. |
| `tools/Deploy-Quizz.ps1` | Auslieferung nach GitHub ohne git: vergleicht die Dateien mit dem Stand im Repository und sendet nur die geänderten — in einem einzigen Commit. Token per DPAPI (`-SetToken`), liegt als `tools/github-token.dat` und wird nie mitgeliefert. |
| `docs/` | Diese Dokumentation. |
