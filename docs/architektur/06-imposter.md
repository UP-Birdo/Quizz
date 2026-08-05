# Quizz — Architektur / Imposter: Raeume, Salz, Wortkatalog

## Imposter

Das dritte Spiel, seit v3.0. Eigener Pfad in der Datenbank
(`KONFIG.speicher.imposterPfad`, **eigene Firebase-Regel nötig**), eigener
Abgleich, eigene Dateien:

| Datei | Weiß nichts über |
|---|---|
| `imposter-woerter.js` — der Wortkatalog | alles andere (reine Datentabelle) |
| `imposter-runde.js` — Regeln und Auswertung EINES Raums | Speicher, Bildschirm, die anderen Räume |
| `imposter-tafel.js` — alle Räume und die Wortbibliothek | Speicher, Bildschirm |
| `imposter.js` — Bildschirm | die Wortauswahl (fragt immer den Raum) |

### Räume statt einer einzigen Runde (seit v3.2)

Bis v3.1 lag unter dem Imposter-Pfad genau EINE Runde, und jeder konnte Thema
und Anzahl der Imposter umstellen. In der Praxis verstellten sie sich
gegenseitig. Seit v3.2 gilt dasselbe Muster wie beim Schach (`schach-tafel.js`):

- **Ein Objekt statt einer Liste** (`tafel.raeume`), weil Firebase Listen mit
  Lücken unzuverlässig speichert.
- **Beim Schreiben wird nur der eigene Raum eingesetzt** (`raumEinsetzen`), nie
  die ganze Sammlung überschrieben — sonst löscht ein Gerät mit veraltetem Stand
  die Räume weg, die inzwischen woanders entstanden sind.
- **Die Einstellungen gehören dem Raum**, nicht dem Gerät: Wer anlegt,
  entscheidet Thema und Anzahl; danach werden sie nicht mehr angefasst. Für
  andere Regeln legt man einen neuen Raum an.
- **Der Umstieg:** Ein Stand ohne `raeume`, aber mit `spieler`/`salz`/`phase`
  ist eine Runde von früher. Sie wird zum Raum `start` mit demselben Salz —
  Wort, Rollen und Mitspieler bleiben, eine laufende Runde bricht nicht. Ein
  Test hält das fest (`test-imposter.js`).

**Die Wortbibliothek liegt auf der Tafel, nicht im Raum.** Ergänzte Wörter
gelten für alle Räume und stehen deshalb einmal an der Wurzel;
`normalisieren()` verteilt eine Abschrift in jeden Raum, damit `IMPOSTER_RUNDE`
weiterhin allein aus der Runde rechnen kann. Das Verteilen geschieht
**bedingungslos** — stünde dort „nur wenn nicht leer", käme ein entferntes Wort
aus einem alten Raum wieder zurück.

Beim Zusammenführen werden die Wortlisten **vereinigt**, damit zwei gleichzeitig
ergänzende Geräte beide Ergänzungen behalten. Entfernen läuft deshalb nicht über
den Abgleich, sondern über `IMPOSTER._sendenMitLaden` — erst den Stand vom
Server holen, darauf umbauen, dann schreiben. Denselben Weg nehmen Anlegen und
Löschen eines Raums.

### Thema und Wortart (seit v3.7)

**Jedes Wort hat ein Thema UND eine Wortart.** Beides wird getrennt eingestellt:

| Feld am Raum | Werte |
|---|---|
| `gruppe` | eine Themen-Kennung, ein selbst angelegtes Thema, oder `"alle"` |
| `wortart` | `"nomen"`, `"verb"`, `"adjektiv"` oder `"alle"` |

`IMPOSTER_WOERTER.woerter(gruppeId, wortart)` liefert daraus die Wortliste; die
Reihenfolge ist fest (erst die Wortarten in der Reihenfolge von `WORTARTEN`,
bei „alle Themen" diese in der Reihenfolge der Tabelle). **Sie darf sich nie
ändern** — die Ziehung greift auf eine Stelle in der Liste zu.

Bis v3.6 waren „Nur Verben" und „Alltag" Gruppen derselben Liste. Die drei alten
Wortart-Gruppen bleiben als `versteckt: true` im Katalog (laufende Räume tragen
ihre Kennung); ihre Wörter stehen inhaltsgleich unter dem neuen Thema
„Querbeet". Die Begründung und die drei Fallen stehen in `DECISIONS.md`.

**Ein Wort darf nicht in zwei sichtbaren Themen stehen** — bei „Alle Themen"
käme es doppelt vor und damit doppelt so oft. Ein Test hält das fest.

### Selbst angelegte Themen und die Wiederholungssperre (seit v3.7)

Vor jeder Runde darf jeder ein Wort beisteuern (`IMPOSTER.wortBeisteuern`,
gefragt beim „Bereit"). Dabei kann ein neues Thema entstehen:

- `tafel.eigeneGruppen` — Kennung (`e-gemuese`) auf Beschriftung („Gemüse").
  Sie liegen auf der TAFEL, nicht im Raum: Ein Thema soll allen zur Verfügung
  stehen, auch in Räumen, die es noch nicht gibt.
- `tafel.wortarten` — die Wortart je ergänztem Wort, klein geschriebener
  Schlüssel. Eine eigene Karte, weil `eigeneWoerter` eine Liste von
  Zeichenketten ist und der Datenvertrag additiv bleibt.
- `raum.letzteWoerter` — was zuletzt dran war, das jüngste zuletzt. Daraus
  folgt das Gewicht bei der Ziehung: eine Runde danach ein Zehntel, nach
  `WIEDERHOLUNG_RUNDEN` wieder ganz. **Gesperrt wird nie.**

**Das gefallene Wort wird in `neueRunde()` gemerkt, nicht in `starten()`.** Der
Grund ist ein Zirkelschluss — `wortVon` rechnet aus Salz UND Gedächtnis. Die
ganze Begründung steht in `DECISIONS.md`.

### Warum Wort und Rollen nicht gespeichert werden

**Im Stand steht nur ein Salz** — eine Zufallszeichenkette, die beim Start
erzeugt wird. Daraus rechnet jedes Gerät selbst aus, welches Wort gilt
(`wortVon`) und wer Imposter ist (`imposterListe`). Beides geht damit nie über
die Leitung, und wer die Datenbank öffnet, sieht eine Zeichenkette.

Dieselbe Idee wie beim Würfel-Siegel und beim Schach-Zufall — und dieselbe
Grenze: Der Quelltext liegt offen, wer die Entwicklerkonsole öffnet, kann alles
nachrechnen. Was das leistet und was nicht, steht in `DECISIONS.md`.

**Die Streufunktion braucht ihren Nachmischer.** Ohne den letzten Schritt in
`_zufallsWert` bleiben Werte verwandt, deren Eingaben sich erst spät
unterscheiden — beim Bauen führte das dazu, dass in fast jeder fünften Runde
gar kein Imposter herauskam statt in jeder fünfzigsten.

### Die drei Zusagen an die Rollenverteilung

1. **Einer weiß das Wort immer.** `imposterListe` nimmt höchstens
   `spieler.length - 1` — sonst könnte niemand die Fragen beantworten.
2. **Es können weniger sein als eingestellt.** Jeder Vorgesehene fällt mit
   `AUSFALL_CHANCE` wieder heraus; deshalb ist die eingestellte Zahl ein
   Höchstwert und kein Versprechen.
3. **Ganz selten ist niemand Imposter.** Das folgt aus 2 und ist gewollt: Es
   hält die Runde ehrlich, weil auch „niemand war es" möglich bleibt.

### Ein Fehler wird verziehen

`wortPasst` misst die Editier-Entfernung **mit Vertauschung**
(Damerau-Levenshtein) und erlaubt eine Abweichung. Der Dreher gehört
ausdrücklich dazu: „Regenschrim" ist der häufigste Tippfehler überhaupt, und
die einfache Editier-Entfernung zählt ihn als zwei Fehler.
