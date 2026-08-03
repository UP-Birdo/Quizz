# Architektur

Wie das Quizz-Projekt gebaut ist. Wer eine Datei ändert, liest vorher den
passenden Abschnitt hier.

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
| `js/team-schach.js` | Der Tab **Team Schach**: Übersicht der Partien, Brett zeichnen, Felder antippen, Teams, Zugbewegung, Zugversand mit Zugzähler-Prüfung. |
| `js/rangliste.js` | Der Tab **Rangliste**: Punkte aus beiden Spielen zusammengezählt. Rechnender Teil ohne Browser testbar. |
| `js/app.js` | Startpunkt (`DOMContentLoaded`), Statusanzeige, Hinweisbalken; erzeugt **beide** Speicher und Abgleiche. |
| `tests/` | Regressionstests (`test-modell.js` Spiellogik, `test-versiegelung.js` Siegel, `test-schach.js` Regeln, `test-schach-runde.js` Partie, `test-schach-tafel.js` Sammlung und Umstieg, `test-rangliste.js` Gesamtwertung, `test-bildschirm.js` Bildschirm gegen ein nachgebautes DOM, `test-syntax.js` Übersetzbarkeit) plus Startskript. |
| `tools/Lokal-Starten.ps1` | Kleiner Test-Server (HttpListener) für `http://localhost:8080/`; `Quizz lokal starten.cmd` startet ihn per Doppelklick. |
| `icon.svg` | Das Zeichen der App als Vektor: Würfelfläche, vier Augen, Stern in der Mitte. **Quelle** für alle Bildgrössen. |
| `icons/` | Die PNG-Fassungen (512, 192, 180, 32) — erzeugt von `tools/Icons-Erzeugen.ps1`, nicht von Hand bearbeiten. |
| `manifest.webmanifest` | Macht die Seite auf dem Startbildschirm zur App (Name, Farben, Zeichen). |
| `tools/Icons-Erzeugen.ps1` | Zeichnet die PNG-Fassungen. Enthält dieselben Koordinaten wie `icon.svg` — beide zusammen ändern und das Ergebnis in 32 Pixeln prüfen. |
| `tools/Deploy-Quizz.ps1` | Auslieferung nach GitHub ohne git: vergleicht die Dateien mit dem Stand im Repository und sendet nur die geänderten — in einem einzigen Commit. Token per DPAPI (`-SetToken`), liegt als `tools/github-token.dat` und wird nie mitgeliefert. |
| `docs/` | Diese Dokumentation. |

## Datenmodell

Ein einziger Datenstand hält die ganze Runde:

    {
        "datenVersion": 2,
        "geaendertAm": 1750000000000,
        "phase": "raten",
        "spieler": [
            {
                "id": "3f2c…",
                "name": "Anna",
                "pruefwert": "9ab3…",
                "festgelegtAm": 1750000000000,
                "festlegungen": 1,
                "wuerfel": [],
                "aufgedeckt": false,
                "bestaetigt": false,
                "tipps": { "<id des Ziels>": ["1", "", "STERN", "", ""] }
            }
        ]
    }

| Feld | Bedeutung |
|---|---|
| `datenVersion` | Fassung des Datenvertrags; steuert die Nachrüstung. |
| `geaendertAm` | Zeitpunkt der letzten Änderung. Nur informativ — der Vergleich zweier Stände ignoriert ihn bewusst. |
| `phase` | **Ohne Wirkung seit v0.3.** Stammt aus der gemeinsamen Auflösung; seither deckt jeder für sich auf. Das Feld bleibt im Vertrag und wird durchgereicht, ausgewertet wird es nirgends. |
| `spieler[].id` | Unveränderliche Kennung. Sie verbindet Gerät, Tipps und Bildschirm. |
| `spieler[].name` | Frei gewählter Anzeigename. |
| `spieler[].pinPruefwert` | Prüfsumme der PIN, `""` wenn keine hinterlegt ist. Die PIN selbst steht nirgends. |
| `spieler[].pinSalz` | Zufallssalz zur PIN. Steht offen — jedes fremde Gerät muss die PIN prüfen können. |
| `spieler[].pruefwert` | Das Siegel des eigenen Wurfs, `""` solange nicht festgelegt. |
| `spieler[].festgelegtAm`, `festlegungen` | Wann und wie oft festgelegt wurde — Transparenz gegen heimliches Nachbessern. |
| `spieler[].wuerfel` | **Leer, bis aufgedeckt wird.** Danach genau fünf Werte. |
| `spieler[].aufgedeckt` | Hat das Gerät dieses Spielers seinen Wurf freigegeben? |
| `spieler[].bestaetigt` | Passte der freigegebene Wurf zum Siegel? |
| `spieler[].tipps` | Eigene Vermutungen, je Ziel-Kennung fünf Werte. |

Erlaubte Würfelwerte: `"1"` bis `"5"`, `"STERN"` und `""` (nichts gewählt).

### Der wichtigste Satz zum Datenmodell

**Vor dem Aufdecken stehen die echten Würfel nirgendwo im gemeinsamen Stand.**
`normalisieren()` verwirft Würfel bei Spielern, die nicht aufgedeckt haben —
selbst wenn jemand sie von Hand in die Datenbank schriebe, würde die App sie
nicht anzeigen.

### Aufdecken je Person, und was daraus folgt

Seit v0.3 gibt es keine gemeinsame Auflösung: Jeder gibt seinen eigenen Wurf
frei, wann er will (`MODELL.aufdecken`, ausgelöst nur vom eigenen Gerät). Daraus
folgt zwingend eine zweite Regel, ohne die das Spiel kaputt wäre:

**Sobald ein Spieler aufgedeckt hat, weist `MODELL.tippSetzen` jede weitere
Vermutung auf ihn ab.** Sonst könnte man nach dem Aufdecken in Ruhe die
richtigen Werte eintragen. Die Sperre sitzt im Modell, nicht im Bildschirm-Code —
die Oberfläche zeigt für aufgedeckte Spieler schlicht keine Eingabefelder mehr.

Die Bestenliste ist damit immer ein Zwischenstand: `MODELL.ergebnis()` zählt nur
gegen Spieler, die bereits aufgedeckt haben.

### Additiver Datenvertrag — die Nachrüst-Regel

1. Felder werden **nur ergänzt**, nie umbenannt und nie gelöscht.
2. Jeder geladene Stand läuft durch `MODELL.normalisieren()`: fehlende Felder
   werden ergänzt, Würfellisten auf fünf gültige Werte gebracht, ungültige Werte
   verworfen, fehlende Kennungen vergeben.
3. Fassung 1 kannte statt `spieler` noch `zeilen` mit offen sichtbaren Würfeln.
   Solche Stände werden übernommen: Namen bleiben, die Würfel gelten als nicht
   festgelegt.
4. Jede Erweiterung bekommt dort ihren Fall **und** einen Test in
   `tests\test-modell.js`.

## Siegel — warum niemand spicken kann

Die gemeinsame Ablage ist öffentlich lesbar. Stünden die echten Würfel darin,
könnte jeder Mitspieler sie nachschlagen. Deshalb:

1. **Festlegen:** Das Gerät erzeugt ein Zufallssalz (16 Byte) und berechnet
   `SHA-256("wuerfel-quizz|" + sortierte Würfel + "|" + Salz)`. Veröffentlicht
   wird nur diese Prüfsumme.
2. **Geheim bleibt:** Würfel und Salz liegen allein im Browser-Speicher des
   Besitzers (`ich.js`).
3. **Aufdecken:** Das Gerät des Besitzers veröffentlicht Würfel und Ergebnis der
   eigenen Prüfung; `bestaetigt` sagt, ob beides zusammenpasst.

Sortiert wird vor dem Rechnen, weil die Reihenfolge im Spiel bedeutungslos ist.
Ohne Salz könnte man alle 252 möglichen Würfe durchprobieren — mit Salz nicht.

Grenzen, bewusst so:

- Nur das Gerät des Besitzers kann aufdecken. Wer das Gerät wechselt, trägt
  seinen Wurf dort neu ein; das zählt als erneutes Festlegen und ist für alle
  sichtbar.
- Ein neues Festlegen ist erlaubt, wird aber mit Anzahl und Uhrzeit angezeigt.
- Die Krypto-Funktion des Browsers gibt es nur in sicherem Zusammenhang (HTTPS
  oder localhost). Fehlt sie, läuft die Runde ohne Siegel weiter, und die App
  sagt das.

## Das Auge — eigene Zahlen verstecken

Ein Schalter in der eigenen Karte (`WUERFEL_QUIZZ.wuerfelSichtbar`) blendet die
eigenen Würfel aus und ersetzt sie durch fünf Platzhalter. Drei Festlegungen
dazu:

- **Standard ist verdeckt.** Wer die Seite öffnet, während jemand daneben sitzt,
  verrät nichts.
- **Der Zustand wird absichtlich nirgends gespeichert** — weder im Gerät noch im
  gemeinsamen Stand. Nach jedem Laden ist wieder alles zu; das ist die sichere
  Voreinstellung und spart eine Einstellung, die niemand pflegen muss.
- **Er wirkt auch auf die Eingabe.** Solange zu, erscheinen statt der
  Auswahlfelder Platzhalter mit dem Hinweis, das Auge anzutippen. Ein
  `select`-Feld lässt sich nicht sinnvoll maskieren, also wird es weggelassen.

Das Symbol ist ein gezeichnetes SVG (offenes Auge mit Pupille, geschlossenes Lid
mit Wimpern) — kein Emoji, wie es die Haus-Regel verlangt.

## Speicher-Schicht

Beide Rückwände bieten dieselbe Schnittstelle:

| Feld/Methode | Bedeutung |
|---|---|
| `art` | `"lokal"` oder `"gemeinsam"` |
| `beschreibung` | Satz für die Statusanzeige im Kopf |
| `laden()` | Versprechen auf einen bereits normalisierten Stand |
| `speichern(daten)` | Versprechen; wirft bei Fehler |

**`SpeicherLokal`** legt den Stand im Browser-Speicher ab — sinnvoll nur zum
Ausprobieren, weil dann niemand mitspielt.

**`SpeicherGemeinsam`** spricht eine Firebase Realtime Database über deren
REST-Schnittstelle an: `GET …/<pfad>.json` zum Laden, `PUT` zum Schreiben. Kein
SDK, keine fremde Bibliothek, kein Bauschritt.

`speicherErzeugen(KONFIG)` wählt die Rückwand. Ist der gemeinsame Modus
eingestellt, aber keine Adresse hinterlegt, fällt die App auf `SpeicherLokal`
zurück und zeigt oben einen Hinweisbalken.

## Abgleich und gleichzeitiges Arbeiten

- Eingaben werden **verzögert** geschrieben (`schreibVerzoegerungMs`, 500 ms).
- Im gemeinsamen Modus fragt die App alle `abfrageIntervallMs` (3 s) nach dem
  aktuellen Stand — **aber nur, solange die Seite sichtbar ist**. Im Hintergrund
  ruht die Abfrage (`document.hidden`), beim Zurückkommen holt der Anschluss auf
  `visibilitychange` den Stand sofort nach. Gespielt wird über mobile Daten;
  eine Dauerabfrage über einen ganzen Tag wäre pure Verschwendung.
- **Solange eine eigene Änderung aussteht, wird kein fremder Stand übernommen.**
- Ein geholter Stand wird nur gezeichnet, wenn `MODELL.inhaltGleich()` einen
  echten Unterschied meldet.
- **Vor jedem Schreiben wird zusammengeführt.** `abgleich.js` holt den Stand vom
  Server und setzt mit `MODELL.zusammenfuehren()` nur den eigenen Eintrag
  hinein. Regel: **Jeder ist Herr über seinen eigenen Eintrag, alles andere
  kommt vom Server.** Ohne das löschte ein Gerät mit veraltetem Stand die
  Mitspieler weg, die sich inzwischen angemeldet hatten — der Fehler aus v0.8,
  nachzulesen in [DECISIONS.md](DECISIONS.md).
- Ausgenommen sind Aktionen, die absichtlich fremde Einträge ändern (neue Runde,
  Spieler entfernen). Sie rufen `aendern(daten, neuZeichnen, true)` und
  schreiben den Stand unverändert.
- Schlägt das Schreiben fehl, bleibt die Änderung offen und wird erneut
  versucht; der Kopf zeigt den Fehler an.

## Punkte

Die Regeln stehen ausschließlich in `modell.js` — als Konstanten
(`PUNKTE_EXAKT`, `PUNKTE_NAH`, `PUNKTE_BONUS`), als Rechnung (`punkte()`,
`ergebnis()`) und als Text (`punkteErklaerung()`, angezeigt hinter dem i-Knopf).
Wer eine Zahl ändert, ändert Rechnung und Erklärung in einem Zug.

`punkte(echteWuerfel, tipp)` arbeitet in drei Schritten:

1. Exakte Übereinstimmungen als Multimenge herausrechnen — die Reihenfolge
   spielt nie eine Rolle.
2. Die Reste beider Seiten sortieren und Stelle für Stelle paaren. Bei
   sortierten Listen ist das die Paarung mit dem kleinsten Gesamtabstand, also
   die für den Rater beste.
3. Jedes Paar nach seinem Abstand bewerten. Der Stern ist keine Zahl und hat zu
   nichts einen Abstand; er zählt nur exakt.

`ergebnis(daten)` summiert das über alle **aufgedeckten** Personen und vergibt
je Person den Bonus an den besten Tipp (bei Gleichstand an alle, bei null
Punkten an niemanden). Solange nicht alle aufgedeckt haben, ist der Stand ein
Zwischenstand — `moeglich` wächst mit jeder aufgedeckten Person um
`punkteMaximum()`.

## Bildschirm-Regeln

- Der Tab-Inhalt wird bei jeder Änderung **vollständig** neu gezeichnet. Damit
  dabei keine Eingabe verloren geht, merkt `_fokusMerken()` das gerade
  bearbeitete Feld über `data-schluessel` und setzt den Fokus danach zurück.
- Beim Umstellen eines Auswahlfeldes wird **nicht** neu gezeichnet
  (`abgleich.aendern(daten, false)`) — das Feld zeigt den Wert ja bereits selbst.
  Ausnahme: der eigene Wurf, sobald er vollständig ist (dann wird der Knopf
  **Würfel festlegen** freigegeben).
- Die eigene Karte hat drei Zustände, je eine Bau-Funktion: `_ichKarteEingabe`
  (noch nicht festgelegt), `_ichKarteFestgelegt` (Siegel steht, Aufdecken
  möglich), `_ichKarteAufgedeckt` (fertig).
- Die Karten der anderen ebenso: `_tippKarteBauen` solange verdeckt,
  `_ergebnisKarteBauen` sobald aufgedeckt.
- **Eine Hauptaktion je Bildschirm, und sie wandert mit dem Spielstand:** erst
  **Würfel festlegen**, dann **Meine Würfel aufdecken** (beide in der eigenen
  Karte), danach **Neue Runde** in der Fußleiste. Nie zwei blaue Knöpfe
  gleichzeitig.

## Anmeldung mit PIN, ohne Konto

Es gibt keine Anmeldung im üblichen Sinn — kein Server, keine Sitzung, kein
Passwortspeicher. Stattdessen drei Wege in `WUERFEL_QUIZZ.anmelden()`:

1. **Bekanntes Gerät.** Im Gerätespeicher steht eine Spieler-Kennung
   (`ICH.person()`); gibt es den Spieler noch, ist man sofort drin.
2. **Aus der Liste wählen** (`_alsBestehenderAnmelden`). Die App zeigt alle
   Mitspieler; nach der Wahl wird die PIN abgefragt und gegen
   `pinPruefwert`/`pinSalz` geprüft. Drei Versuche, dann zurück zur Frage.
   **Das ist der Weg, der Gerätewechsel überhaupt möglich macht.**
3. **Neu anmelden** (`_neuAnmelden`). Name (darf nicht vergeben sein) und PIN,
   letztere zweimal eingegeben, damit ein Vertipper nicht dauerhaft aussperrt.

Die PIN wird wie das Würfel-Siegel behandelt: `VERSIEGELUNG.pinPruefwertBilden`
rechnet `SHA-256("quizz-pin|" + PIN + "|" + Salz)`, gespeichert werden nur
Prüfsumme und Salz. Das Salz muss offen in der Datenbank stehen — sonst könnte
ein fremdes Gerät die PIN gar nicht prüfen. Es sorgt dafür, dass zwei Spieler
mit derselben PIN unterschiedliche Prüfwerte haben.

Was die PIN NICHT leistet, steht in [DECISIONS.md](DECISIONS.md).

### Profil

Der Knopf **Profil** im Kopf der eigenen Karte (`profilOeffnen`) bündelt beide
Änderungen am eigenen Zugang — Name und PIN. Er nutzt dieselbe Auswahlliste wie
die Anmeldung (`DIALOG.liste`), damit es nur eine Bauform für „wähle eines von
mehreren" gibt.

- `namenAendern` weist einen bereits vergebenen Namen ab. Der Name ist die
  Wiedererkennung beim Anmelden; doppelte Namen würden die Liste unbrauchbar
  machen.
- `pinAendern` verlangt zuerst die bisherige PIN, sofern eine hinterlegt ist.
  Ohne diese Rückfrage könnte jemand an einem kurz unbeaufsichtigten Gerät die
  PIN austauschen und damit den Zugang übernehmen. Die neue PIN bekommt ein
  **neues Salz** — sonst bliebe der alte Prüfwert weiter vergleichbar.

## Verwaltung

Ein Zugang für denjenigen, der die Runde betreut. Zwei Befugnisse:

- **Spieler aus der Runde entfernen** — bei doppelter Anmeldung oder
  vergessener PIN.
- **Neue Runde starten** (seit v0.9). Der Knopf steht bei jedem, verlangt aber
  das Passwort, solange die Verwaltung nicht offen ist. Grund: Eine neue Runde
  löscht bei ALLEN Würfel und Vermutungen und ist nicht rückgängig zu machen.

Fremde Würfel sieht auch die Verwaltung nicht; die liegen auf fremden Geräten
und nicht in der Datenbank.

- Passwort-Prüfung: `VERSIEGELUNG.verwaltungPruefen` gegen
  `KONFIG.verwaltung.pruefwert` (`SHA-256("quizz-admin|" + Passwort)`). Das
  Passwort selbst steht in keiner Datei — die Seite ist öffentlich.
- Der Zustand liegt im Gerätespeicher (`ICH.verwaltungAktiv()`), nicht im
  gemeinsamen Stand: Verwaltung ist eine Eigenschaft des Geräts, nicht der Runde.
- Sichtbar wird sie durch die Marke *Verwaltung aktiv* im Kopf und die roten
  Knöpfe an den Spielerkarten.
- Passwort ändern: neue Prüfsumme rechnen (Anleitung steht in `js/konfig.js`)
  und dort eintragen. `tests\test-versiegelung.js` prüft, dass Prüfsumme und
  vereinbartes Passwort zusammenpassen — beim Ändern also auch den Test
  anpassen.

## Team Schach

Das zweite Spiel liegt in fünf Schichten, streng getrennt. Jede weiß nur, was
sie wissen muss:

| Datei | Aufgabe | Weiß nichts über |
|---|---|---|
| `schach-varianten.js` — Spielarten | Maße und Sonderregeln als reine Tabelle | alles Übrige |
| `schach.js` — Regeln | Brett, Züge, Schach, Matt | Teams, Spieler, Speicher, Bildschirm |
| `schach-runde.js` — eine Partie | Teams, Zugrecht, Verlauf, Fähigkeiten | Sammlung, Speicher, Bildschirm |
| `schach-tafel.js` — alle Partien | anlegen, einsetzen, entfernen, sortieren | Regeln, Bildschirm |
| `team-schach.js` — Bildschirm | Übersicht, Brett, Bedienung | Regeln (fragt immer `SCHACH`) |

**Eigener Pfad in der Datenbank** (`KONFIG.speicher.schachPfad`), eigener
Abgleich, eigener Stand. Die beiden Spiele wissen nichts voneinander;
gemeinsam ist ihnen nur `ich.js` — wer an diesem Gerät sitzt. Angemeldet wird
im Würfel-Quizz, weil dort Namen und PINs liegen; das Schach liest den Namen
über `WUERFEL_QUIZZ.abgleich.daten` nur zur Anzeige.

### Mehrere Partien nebeneinander (seit v1.4)

Unter dem Schach-Pfad liegt nicht mehr eine Partie, sondern eine **Tafel**:

    {
        "datenVersion": 2,
        "geaendertAm": 1750000000000,
        "partien": {
            "start":  { … eine Partie … },
            "p-l3k9": { … }
        }
    }

Die Partien sind ein **Objekt mit Kennungen als Schlüssel**, keine Liste:
Firebase macht aus einer Liste mit Lücken ohnehin ein Objekt, und das Einsetzen
einer einzelnen Partie ist so eine einzige Zuweisung.

**Der Umstieg ist die wichtigste Eigenschaft dieser Schicht.** Ein Stand von
früher sieht aus wie eine Partie (er hat `stand` und `teams` an der Wurzel, aber
kein `partien`). `SCHACH_TAFEL.normalisieren()` erkennt das und macht daraus die
Partie mit der Kennung `start` und dem Titel *Erste Partie*. Eine angefangene
Partie läuft damit ohne Bruch weiter. `tests\test-schach-tafel.js` prüft das
Feld für Feld — wer daran etwas ändert, bricht laufende Partien.

### Die Hausregel: keine Reihenfolge im Team

Jeder aus dem Team, das am Zug ist, darf ziehen (`SCHACH_RUNDE.darfZiehen`).
Damit bei zwei gleichzeitigen Zügen keiner verloren geht, trägt jede Partie
einen **Zugzähler**:

1. `TEAM_SCHACH._sendenMitPruefung` lädt vor dem Schreiben den Stand vom Server.
2. Stimmt der `zugZaehler` **dieser Partie** nicht mehr mit dem erwarteten
   überein, hat jemand anders gezogen. Der eigene Zug wird **verworfen**, der
   fremde übernommen, und der Spieler bekommt eine Meldung.
3. Sonst wird die eigene Partie in den Stand vom Server eingesetzt
   (`SCHACH_TAFEL.partieEinsetzen`) und geschrieben.

Schritt 3 ist die zweite Hälfte derselben Regel: **Geschrieben wird nie die
eigene Tafel als Ganzes.** Sonst verschwänden Partien, die inzwischen woanders
angelegt oder gezogen wurden — genau der Fehler, der im Würfel-Quizz einmal
Mitspieler gelöscht hat (siehe DECISIONS.md).

Deshalb bekommt der Schach-Abgleich **kein** `zusammenfuehren`: Er schreibt gar
nicht. Alles Schreiben läuft über `TEAM_SCHACH._sendenMitPruefung`.

### Brett und Felder

Das Brett ist eine Zeichenkette aus `breite * hoehe` Zeichen, Feld 0 ist die
linke obere Ecke. Grossbuchstabe = weiss, Kleinbuchstabe = schwarz, Punkt =
leer; die Buchstaben sind die deutschen Anfangsbuchstaben (B, T, S, L, D, K).
Eine Zeichenkette statt einer Liste, weil Firebase sie unverändert speichert und
der Vergleich zweier Stände damit ein einziger Zeichenkettenvergleich ist.

**Die Maße stehen im Stand** (`breite`, `hoehe`), abgeleitet aus der Spielart.
Fehlen sie, gilt 8 mal 8 — deshalb rechnen alte Stände unverändert weiter. Die
Umrechnungen `feldNummer`, `feldName`, `spalteVon` und `reiheVon` nehmen die
Maße als **wahlfreie** Parameter mit Vorgabe 8; jeder Aufruf aus der Zeit vor
den Spielarten bleibt damit gültig.

Die Zugerzeugung ist zweistufig: `_rohzuege` liefert, was die Gangart erlaubt,
`zuege` filtert davon alles weg, wonach der eigene König im Schach stünde. Damit
sind Fesselungen automatisch abgedeckt, ohne Sonderfall.

`_feldBedroht` denkt bewusst rückwärts (von einem Feld aus suchen, wer es
angreift) statt alle gegnerischen Züge zu erzeugen — sonst entstünde über die
Rochade-Prüfung eine Endlosschleife.

### Warum die Rochade sich erklären kann

`SCHACH.rochadeLage(stand, farbe)` liefert für beide Seiten, ob rochiert werden
darf — und wenn nicht, **warum nicht** (Recht verfallen, Figuren im Weg, König
im Schach, bedrohtes Feld auf dem Weg). Der Bildschirm zeigt diesen Satz an,
wenn der König angetippt ist.

Warum das ins Regelwerk gehört: Die Frage „warum darf ich gerade nicht
rochieren" ist eine **Regelfrage**. Beantwortete der Bildschirm sie selbst,
stünden die Bedingungen zweimal im Programm, und die zweite Fassung liefe der
ersten früher oder später hinterher. Ein Test prüft deshalb ausdrücklich, dass
`rochadeLage` und `zuege` dasselbe sagen.

Anlass war eine Meldung aus der Praxis, die Rochade sei kaputt. Sie war es
nicht: In der gemeldeten Stellung hatte Weiß längst rochiert, und bei Schwarz
standen noch Figuren im Weg. Eine korrekt gesperrte Rochade, die niemand
erklärt, sieht aber genauso aus wie ein Fehler — deshalb erklärt sie sich jetzt.
Die Stellung liegt als Test in `tests\test-schach.js`.

### Spielarten

Eine Spielart ist ein Eintrag in `SCHACH_VARIANTEN.liste` mit vier Schaltern,
die die Regeln lesen:

| Feld | Wirkung in `schach.js` |
|---|---|
| `breite`, `hoehe` | Maße des Bretts; alle Umrechnungen hängen daran. |
| `aufstellung` | Startbrett. |
| `rochade` | `false` schaltet die Rochade ganz ab (sie hängt an den festen Plätzen von König und Turm). |
| `koenigSchlagbar` | `true` heißt: kein Schach, kein Matt, kein Zugfilter. Der König ist eine Figur wie jede andere, und wer keinen mehr hat, verliert. Nötig für Bretter mit **zwei Königen je Seite** (Doppelbrett). |
| `bonusFelder` | Felder, auf denen Fähigkeiten liegen. |

Die Spielart steht in der Partie **und** im Brett-Stand. Die Partie ist die
Wahrheit; `SCHACH_RUNDE.normalisieren()` schreibt sie in den Stand, damit die
Regeln allein aus dem Stand arbeiten können.

### Fähigkeiten

Nur in der Spielart `faehigkeiten` (Schalter `faehigkeiten: true`). Seit v2.0
gibt es fünf Seltenheitsstufen und zehn Fähigkeiten.

**Vier Arten tragen alle zehn.** Jede Fähigkeit in `SCHACH_VARIANTEN` nennt ihre
`art`; daran hängt alles Weitere, und deshalb kostet eine elfte Fähigkeit weder
im Bildschirm noch im Ablauf eine Zeile:

| Art | Was passiert | Beispiele |
|---|---|---|
| `zugmuster` | Der nächste eigene Zug darf zusätzlich nach diesem Muster gehen. Keine Auswahl nötig. | Sprung, Ausweichen, Teleport |
| `ablauf` | Greift in die Zugfolge ein. | Doppelzug |
| `sofort` | Wirkt beim Einsetzen sofort aufs Brett. | Bauernschub |
| `ziel` | Verlangt EIN angetipptes Feld; `zielArt` sagt, welches. | Verstärkung, Schutzschild, Fessel, Erdbeben, Wiedergeburt |

Die Wirkung liegt in Feldern des Standes und ist damit gespeichert und für alle
sichtbar:

| Feld | Wirkung |
|---|---|
| `zusatzFarbe` / `zusatzMuster` | Zusätzliches Zugmuster für einen Zug. Löst `sprungAktiv` ab, das als Altbestand mitgeführt wird. `_feldBedroht` rechnet Sprung und Ausweichen mit — sonst könnte der König in ein bedrohtes Feld ziehen. |
| `extraZug` | `_ausfuehren` lässt `amZug` stehen, statt zu wechseln. |
| `schildFeld` / `schildFarbe` | `zuege()` filtert alle gegnerischen Züge auf dieses Feld weg. Verfällt nach dem nächsten gegnerischen Zug oder wenn die geschützte Figur selbst zieht. |
| `fesselFeld` / `fesselFarbe` | `zuege()` liefert für dieses Feld nichts. Verfällt nach dem nächsten Zug der gefesselten Seite. |

**Warum König und Matt geschützt sind:** Das Schild wirkt nicht auf den König,
der König wird nicht gefesselt, und das Erdbeben lässt Könige stehen. Andernfalls
wäre „Schachmatt" nicht mehr eindeutig — dieselbe Überlegung, die beim
Doppelbrett zum schlagbaren König geführt hat. Diese drei Ausnahmen sind keine
Bequemlichkeit, sondern die Bedingung dafür, dass die Spielart noch Schach ist.

### Der gerechnete Zufall

Würfel erscheinen alle `BONUS_ABSTAND` Halbzüge auf einem freien Feld, höchstens
`BONUS_HOECHSTENS` gleichzeitig. **Gewürfelt wird dabei nicht:**
`SCHACH_RUNDE._zufallsWert()` streut Partie-Kennung und Zugzähler (FNV-1a) zu
einer Zahl zwischen 0 und 1; daraus folgen Feld und Fähigkeit.

Das ist die wichtigste Festlegung der ganzen Spielart. Mit `Math.random()` sähe
jedes Gerät ein anderes Brett, und der erste Schreibvorgang gewönne — dieselbe
Falle wie beim gegenseitigen Überschreiben in v0.8. So rechnet jeder dasselbe
aus, ohne sich abzustimmen, und die Tests bleiben aussagekräftig, weil das
Ergebnis vorhersagbar ist. **`Math.random()` hat im Modell nichts zu suchen.**

Die Ziehung läuft zweistufig: erst die Stufe nach ihrer Chance, dann innerhalb
der Stufe gleichverteilt. Beides aus EINEM Zufallswert, indem der Rest
weiterverwendet wird — damit bleibt die Ziehung nachrechenbar.

### Gespeichert wird, was liegt

`partie.bonus` ist die Liste der Würfel auf dem Brett (`[{ feld, art }]`), dazu
`bonusFassung: 2`. Eine Partie **ohne** diese Angabe stammt aus der Zeit der vier
festen Felder; für sie wird die Liste einmalig aus `variante.bonusFelder` minus
`bonusGesammelt` gebaut. Angefangene Partien laufen dadurch unverändert weiter.

`verloren` sammelt geschlagene Figuren je Farbe — die Wiedergeburt holt daraus
die zuletzt verlorene zurück.

### Welche Felder ein Ziel sein können

`SCHACH_RUNDE.zielFelder()` probiert für jedes Feld die Wirkung auf einer Kopie
durch und meldet die, bei denen etwas herauskommt. Damit kann die Anzeige nicht
von der Regel abweichen: Es gibt keine zweite Liste von Bedingungen, die
veralten könnte. Der Preis sind ein paar Dutzend Probeläufe je Klick — das
fällt nicht auf.

### Die Zugbewegung

Jeder Verlaufseintrag trägt seit v1.3 zusätzlich `von` und `nach` (Feldnummern).
Daraus lässt `TEAM_SCHACH._zugAnimieren` die zuletzt gezogene Figur von ihrem
alten Feld herüberwandern — **auf jedem Gerät**, nicht nur bei dem, der gezogen
hat. Zwei Dinge sind dabei wichtig:

- Der Merker `animiertBis` (je Partie der zuletzt animierte Zugzähler)
  verhindert, dass dieselbe Bewegung bei jedem Neuzeichnen erneut läuft.
  Gezeichnet wird oft (alle drei Sekunden), gezogen selten.
- Die Verschiebung wird gesetzt, und erst **zwei Bilder später** wird der
  Übergang eingeschaltet und die Verschiebung zurückgenommen. Ohne diese Pause
  fasst der Browser beides zu einem Sprung zusammen.

Wer im Betriebssystem weniger Bewegung eingestellt hat
(`prefers-reduced-motion`), bekommt keine.

Aus denselben Angaben entsteht seit v1.9 der **Pfeil des letzten Zuges**
(`_pfeilBauen`). Unterschied zur Bewegung: Die Bewegung läuft einmal, der Pfeil
bleibt stehen, bis der nächste Zug kommt. Er ist ein SVG über dem Brett und
zeichnet in **Feldkoordinaten** (das Koordinatenfeld ist so breit, wie das Brett
Spalten hat). Deshalb stimmt er auf jeder Brettgröße und jeder Bildschirmbreite,
ohne dass irgendwo Pixel gerechnet werden.

### Zwei Farben für jede Markierung

Das Brett hat helle **und** dunkle Felder. Jede einfarbige Markierung
verschwindet deshalb zwangsläufig auf einer der beiden — genau das ist in v1.5
passiert: Der Punkt auf einem möglichen Zielfeld war blau und lag damit
unsichtbar auf den blauen Feldern.

Seither gilt für alles, was auf dem Brett liegt, dieselbe Regel wie schon für
die Figuren: **heller Rand, dunkler Kern.** Zielfelder, Schlagfelder, der
Rochade-Turm und der Pfeil sind so gebaut. Wer eine neue Markierung ergänzt,
hält sich daran — eine einzelne Farbe reicht auf diesem Brett nie.

### Einstellungen je Partie

`partie.regeln` hält, was beim Anlegen gewählt wurde: `faehigkeiten` (Würfel an
oder aus, `null` = die Spielart entscheidet), `seltenheitZeigen` und
`einigkeit`. Die Vorgaben entsprechen dem Verhalten von vor v2.5 — eine Partie
ohne dieses Feld verhält sich also unverändert.

`SCHACH_RUNDE.faehigkeitenAn()` ist die einzige Stelle, die die Frage
beantwortet, ob Würfel erscheinen. Der Schalter der Partie geht der Spielart vor.

### Abstimmung im Team

Mit `regeln.einigkeit` wird ein Zug erst **vorgeschlagen**
(`SCHACH_RUNDE.zugVorschlagen`) und ausgeführt, sobald alle aus dem Team am Zug
zugestimmt haben (`zugMittragen`). Wer allein im Team ist, zieht sofort —
Einigkeit mit sich selbst ist keine Abstimmung wert.

Der Vorschlag steht **im gemeinsamen Stand**: Das eigene Team muss ihn sehen.
Dass der Gegner mitlesen kann, ist der Preis dieser Einstellung und steht als
Hinweis daneben. Ein Vorschlag verfällt, sobald der Zugzähler nicht mehr passt.

### Vorzüge — und warum sie NICHT im gemeinsamen Stand stehen

Ein Vorzug (`TEAM_SCHACH.vorzug`) ist ein Zug, den man einträgt, während der
Gegner am Zug ist. Er liegt **nur auf dem Gerät** und wird ausgeführt, sobald
das eigene Team dran ist — geprüft nach jedem Zeichnen, denn der Stand kommt von
aussen.

Der Unterschied zum Vorschlag ist der Zweck: Ein Vorschlag ist eine Nachricht
ans eigene Team, ein Vorzug ist eine Absicht, die niemand kennen soll. Stünde er
in der Datenbank, wüsste der Gegner den nächsten Zug, bevor er passiert —
dieselbe Überlegung, die beim Würfel-Siegel dazu geführt hat, den echten Wurf
gar nicht erst zu veröffentlichen. Der Preis: Beim Neuladen ist er weg. Das ist
die richtige Seite des Irrtums.

Ist der Vorzug nicht mehr regelkonform (die Figur wurde geschlagen, das Feld ist
besetzt), wird er verworfen und gemeldet. **Ersatzweise wird nie etwas anderes
gezogen** — ein ungewollter Zug wäre schlimmer als gar keiner.

### Die Chronik — warum die Rangliste nichts verlieren kann

`tafel.chronik` hält je beendeter Partie EINEN Eintrag fest: Kennung, Titel,
Spielart, Ergebnis und die Teams, wie sie am Ende waren. Geschrieben wird er in
`SCHACH_TAFEL.partieEinsetzen` — der einzigen Stelle, durch die jede Änderung an
einer Partie läuft — und danach nie wieder angefasst.

Bis v2.3 rechnete `RANGLISTE.schachPunkte` aus den Partien selbst. Wer eine
beendete Partie löschte, nahm damit allen Beteiligten ihre Punkte wieder weg.
Seit v2.4 rechnet die Rangliste aus der Chronik; `partieEntfernen` lässt sie
bewusst stehen.

Partien, die schon beendet waren, bevor es die Chronik gab, tragen sich beim
ersten `normalisieren()` selbst ein. Auch das Doppelschreiben derselben Partie
(zwei Geräte senden denselben Stand) erzeugt nur einen Eintrag — geprüft wird
über die Kennung.

### Der Abschluss einer Partie

Zwei Schritte, die den ganzen Tab einnehmen (`TEAM_SCHACH.abschluss`):
Sieg/Niederlage, dann Punktestand, dann zurück in die Übersicht.

Er erscheint von selbst, wenn die geöffnete Partie ein Ergebnis hat und dieses
Gerät ihn noch nicht gesehen hat (`gesehen`, nur im Arbeitsspeicher) — und nur
für Leute, die in einem der Teams standen. Zuschauer bekommen ihn nicht.

Beendete Partien verschwinden aus der aktiven Liste in einen zugeklappten
Kasten. Gelöscht wird nichts: Die Punkte stehen ohnehin in der Chronik, und wer
nachsehen will, klappt auf.

### Die Auswahl der Spielart

Beim Anlegen einer Partie erscheint eine **eigene Ansicht** im Tab (nicht
`DIALOG.liste`), mit einer Kachel je Spielart. Jede Kachel trägt ein
**Vorschaubild**: ein Miniaturbrett, gezeichnet aus derselben `aufstellung`, aus
der auch das echte Brett entsteht — inklusive der Bonusfelder.

Das ist der Grund für diese Bauweise: Ein gezeichnetes Bild je Spielart wäre
eine zweite Wahrheit, die irgendwann von der ersten abweicht. So ändert sich das
Bild automatisch mit, wenn jemand eine Aufstellung anpasst, und eine neue
Spielart bringt ihr Bild von selbst mit.

Umgeschaltet wird über `TEAM_SCHACH.auswahlOffen`; die Ansicht liegt vor der
Übersicht. Mehr Zustand braucht es nicht, weil jede Ansicht bei jeder Änderung
vollständig neu entsteht.

## Rangliste

Der dritte Tab hat **keinen eigenen Stand**: Er liest die beiden vorhandenen und
zeigt sie zusammen. Das ist die einzige Stelle, an der sich die Spiele berühren,
und sie ist bewusst einseitig — die Rangliste schreibt nichts. Nähme man den Tab
weg, änderte sich an keinem Spiel etwas.

Die Punkte des Würfel-Quizz kommen unverändert aus `MODELL.ergebnis()`. Die
Schachpunkte rechnet `RANGLISTE.schachPunkte()` aus den **beendeten** Partien;
Zahlen, Rechnung und Erklärungstext stehen wie überall im Haus in derselben
Datei, damit die angezeigte Regel nicht von der gerechneten abweichen kann.

Grundlage der Namen ist der Würfel-Quizz — dort steht, wer mitspielt. Wer dort
entfernt wurde, verschwindet auch aus der Rangliste; sonst stünden Kennungen
ohne Namen darin.

## Tab-Register

Ein Tab ist ein Objekt mit `id`, `titel` und `aufbauen(behaelter)`. `app.js`
registriert ihn, `TABS.starten(...)` zeichnet die Leiste und baut den Inhalt
beim ersten Öffnen einmalig auf. Ein weiterer Tab kostet eine neue Datei und eine
Zeile in `app.js`. Heute sind es drei: Würfel Quizz, Team Schach, Rangliste.

## Code-Konventionen

- **Deutsch**, durchgehend: Bezeichner, Kommentare, sichtbare Texte.
- **Bezeichner ohne Umlaute** (`wuerfel`, `aendern`, `geaendertAm`),
  **Kommentare und Oberflächentexte mit** korrekten Umlauten.
- Interne Hilfsfunktionen beginnen mit `_` (`_ichKarteBauen`, `_fokusMerken`).
- Einzug 4 Leerzeichen, doppelte Anführungszeichen in JavaScript.
- **Keine typografischen Anführungszeichen in JavaScript-Zeichenketten** — sie
  sind eine bekannte Fehlerquelle (siehe [DECISIONS.md](DECISIONS.md)).
- Keine Emojis, nirgends.

## Sicherheit und Datenschutz

Die Runde liegt in einer öffentlich erreichbaren Datenbank, und jeder Besucher
der Seite darf schreiben. Das ist die Folge des Wunsches, dass alle ohne
Anmeldung mitspielen können. Daraus folgt:

- **Nur Vor- oder Spitznamen eintragen**, nichts Vertrauliches.
- Geschützt sind allein die eigenen Würfel vor der Auflösung — durch das Siegel,
  nicht durch Zugriffsrechte.
- Vermutungen liegen im Klartext in der Datenbank. Die App zeigt sie erst bei
  der Auflösung; wer die Datenbank-Adresse aus dem JavaScript liest, könnte sie
  vorher sehen. Für das Spiel ist das unschädlich — Spicken bei den echten
  Würfeln wäre es nicht, und genau das verhindert das Siegel.
