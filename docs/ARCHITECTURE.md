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
    tabs.js          Bildschirm: Tab-Leiste
    dialog.js        Bildschirm: eigene Rückfragen und Eingaben
        |
    app.js           Startpunkt: verdrahtet alles in fester Reihenfolge

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
| `js/app.js` | Startpunkt (`DOMContentLoaded`), Statusanzeige, Hinweisbalken. |
| `tests/` | Regressionstests (`test-modell.js` Spiellogik, `test-versiegelung.js` Siegel, `test-syntax.js` Übersetzbarkeit) plus Startskript. |
| `tools/Lokal-Starten.ps1` | Kleiner Test-Server (HttpListener) für `http://localhost:8080/`; `Quizz lokal starten.cmd` startet ihn per Doppelklick. |
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
- Konflikt-Regel: **der zuletzt geschriebene Stand gewinnt.** Siehe
  [DECISIONS.md](DECISIONS.md).
- Schlägt das Schreiben fehl, bleibt die Änderung offen und wird erneut
  versucht; der Kopf zeigt den Fehler an.

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

## Anmeldung ohne Konto

Es gibt keine Anmeldung im üblichen Sinn. Beim ersten Besuch fragt die App nach
dem Namen, legt einen Spieler an und merkt sich dessen Kennung im
Gerätespeicher (`ICH.personSetzen`). Beim nächsten Besuch findet sie den Spieler
darüber wieder.

Existiert der eingegebene Name schon, fragt die App nach, ob es dieselbe Person
auf einem anderen Gerät ist — und übernimmt dann den vorhandenen Spieler, statt
einen zweiten anzulegen. Der eigene Wurf ist dort allerdings nicht verfügbar
(siehe Grenzen des Siegels).

## Tab-Register

Ein Tab ist ein Objekt mit `id`, `titel` und `aufbauen(behaelter)`. `app.js`
registriert ihn, `TABS.starten(...)` zeichnet die Leiste und baut den Inhalt
beim ersten Öffnen einmalig auf. Ein zweiter Tab kostet eine neue Datei und eine
Zeile in `app.js`.

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
