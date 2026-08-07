# Quizz — Architektur / Team Schach: Regeln, Spielarten, Faehigkeiten, Bildschirm

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

0. **Der Zug wird sofort angezeigt** (seit v3.8) — vor allem Netzverkehr. Er ist
   zu diesem Zeitpunkt bereits fertig gerechnet (`SCHACH_RUNDE.ziehen`), also
   kein Wunschbild. Gleichzeitig meldet sich der Bildschirm beim Abgleich an
   (`eigenerVorgangBeginnt`), damit dessen Abfrage nicht mit dem Stand von VOR
   dem Zug dazwischenfunkt.
1. `TEAM_SCHACH._sendenMitPruefung` lädt vor dem Schreiben den Stand vom Server.
2. Stimmt der `zugZaehler` **dieser Partie** nicht mehr mit dem erwarteten
   überein, hat jemand anders gezogen. Der eigene Zug wird **verworfen**, der
   fremde übernommen, und der Spieler bekommt eine Meldung.
3. Sonst wird die eigene Partie in den Stand vom Server eingesetzt
   (`SCHACH_TAFEL.partieEinsetzen`) und geschrieben.
4. Scheitert das Schreiben, wird der Stand von vorher wiederhergestellt und
   gesagt, warum. Auf einem Brett weiterzuspielen, das sonst niemand sieht,
   wäre schlimmer als ein Rücksprung.

Schritt 3 ist die zweite Hälfte derselben Regel: **Geschrieben wird nie die
eigene Tafel als Ganzes.** Sonst verschwänden Partien, die inzwischen woanders
angelegt oder gezogen wurden — genau der Fehler, der im Würfel-Quizz einmal
Mitspieler gelöscht hat (siehe DECISIONS.md).

Deshalb bekommt der Schach-Abgleich **kein** `zusammenfuehren`: Er schreibt gar
nicht. Alles Schreiben läuft über `TEAM_SCHACH._sendenMitPruefung`.

**Schritt 0 ändert an den Schritten 1 bis 3 nichts.** Wer zuerst drückt, hat
weiterhin gezogen — nur wird das Ergebnis früher gezeigt. Die Begründung steht
in `DECISIONS.md`, „Erst anzeigen, dann senden".

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

### Ein eigenes Zielfeld ist kein Schlagfeld (seit v0.44)

Der rote Schlagring gilt nur für Zielfelder mit einer **gegnerischen** Figur.
Vorher hing er an „da steht irgendetwas" — und bei der Rochade steht dort die
eigene: Auf einem sechs Felder breiten Brett landet der König genau auf dem
Turm. Das Feld sah aus, als schlüge man ihn.

**Den zweiten Weg über das Turmfeld gibt es nicht mehr** (v1.8 bis v0.43,
ausgebaut auf Nutzer-Entscheidung). Die Bedienung ist damit überall dieselbe:
**König antippen, Zugpunkt antippen.** Der Rochadezug steht als ganz normaler
Königszug in `SCHACH.zuege`; auf einem sechs Felder breiten Brett liegt sein
Zugpunkt genau auf dem Turm. Der Bildschirm hat dafür keinen Sonderfall mehr —
`rochadeZiele` ist weg.

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
| `ziel` | Verlangt EIN angetipptes Feld; `zielArt` sagt, welches. | Verstärkung, Schutzschild, Fessel, Erdbeben, Wiedergeburt, Mauer, Wiederbelebung, Friedhof |
| `handel` | Zeigt ein Angebot und wirkt erst nach Zustimmung (seit v3.5). | Händler |

Dazu zwei Schalter, die für jede Art gelten:

| Schalter | Bedeutung | Zeichen am Vorrat |
|---|---|---|
| `beendetZug: true` | Nach dem Einsetzen ist der Gegner dran. | kein `+` |
| `imGegenzug: true` | Geht auch, während der Gegner am Zug ist (seit v3.6). | Blitz |

**Das Pluszeichen ist seit v0.41 eine Frage an den Spielstand, keine
Eigenschaft der Fähigkeit:** `SCHACH_RUNDE.behaeltZug(runde, farbe, art)` sagt,
ob DIESE Seite JETZT danach noch ziehen kann. Es hängt an zwei Dingen, die
`beendetZug` allein nicht kennt — ob man überhaupt am Zug ist (im Gegenzug
nicht) und ob ein offener Doppelzug den Zug rettet. Der Bildschirm fragt nur
noch; die Rechnung steht neben der, die beim Einsetzen wirklich läuft.

Ohne `beendetZug` bleibt man am Zug und muss noch ziehen — so war es bis v3.3
bei allen Fähigkeiten.

**Seit v0.47 gibt es eine Regel dafür, und sie hängt nicht an der Stufe:**

> Wer Material oder einen Angriff geschenkt bekommt, gibt den Zug ab.
> Wer nur die Stellung verändert, behält ihn.

| Gruppe | Fähigkeiten | `beendetZug` |
|---|---|---|
| Material dazu | Wiedergeburt, Wiederbelebung, Spiegel, Verstärkung, Friedhof, Händler | ja |
| Zusätzliche Gangart zum Schlagen oder Springen | Sprung, Teleport | ja |
| Nur die Stellung | Bauernschub, Erdbeben, Nudelholz, Mauer, Schutzschild, Fessel, Frost | nein |
| Schlägt gar nicht | Ausweichen | nein |
| Ausnahme: das Plus IST die Wirkung | Doppelzug | nein |

Die Stufe sagt, wie SELTEN eine Fähigkeit ist; `beendetZug` sagt, was sie
KOSTET. Wird eine zu stark, nimmt man ihr das Pluszeichen — man verschiebt sie
nicht auf eine andere Stufe. Ein Test (`test-schach-runde.js`) hält die
Einteilung fest, damit eine neue Fähigkeit nicht ohne Einordnung durchrutscht.

**Ein Zusatzmuster überlebt das Abgeben des Zuges** (seit v0.47, nötig durch
Sprung und Teleport): Es gilt bis zum eigenen ZUG, nicht bis zum Ende des
Zugrechts. Verbraucht wird es in `_ausfuehren`, sobald die Farbe zieht, der es
gehört.

`imGegenzug` hat bisher genau eine Fähigkeit (Ausweichen). Was dabei zu beachten
war — das Rennen um den Zugzähler und die entfallende Abstimmung — steht in
`DECISIONS.md`. Geprüft wird beides in `SCHACH_RUNDE.darfEinsetzen`; wer eine
Fähigkeit einsetzt, fragt nie mehr `darfZiehen`.

**Der eigene König darf dabei nie im Schach bleiben** (seit v3.6). Verboten sind
zwei Fälle: sich selbst ins Schach stellen, und im Schach stehen und mit einer
`beendetZug`-Fähigkeit den Zug abgeben. Was den Zug nicht beendet, bleibt
erlaubt. Die Prüfung steht am Ende von `faehigkeitEinsetzen` und entfällt auf
Brettern mit `koenigSchlagbar`.

Die Wirkung liegt in Feldern des Standes und ist damit gespeichert und für alle
sichtbar:

| Feld | Wirkung |
|---|---|
| `zusatzFarbe` / `zusatzMuster` | Zusätzliches Zugmuster für einen Zug. Löst `sprungAktiv` ab, das als Altbestand mitgeführt wird. `_feldBedroht` rechnet den **Sprung** mit — sonst könnte der König in ein bedrohtes Feld ziehen. Ausweichen dagegen nicht: Es zieht seit v3.5 nur auf freie Felder und kann deshalb nichts bedrohen (bis v0.40 stand hier eine Prüfung auf den alten Namen `koenig` — sie hätte ein falsches Schachmatt erzeugen können). |

**Die Liste erlaubter Muster in `SCHACH.standNormalisieren` muss jeden Namen
enthalten, den `_musterzuege` kennt.** Fehlt einer, wird er beim Speichern
stillschweigend weggeworfen: Die Fähigkeit ist verbraucht, die Wirkung nie da.
Genau das ist „ausweichen" von v3.6 bis v0.40 passiert — die Ursache steht in
`docs\entscheidungen\erkenntnisse.md`, und ein Test geht diesen Weg jetzt für
jedes Muster.
| `extraZug` | `_ausfuehren` lässt `amZug` stehen, statt zu wechseln. |
| `schildFeld` / `schildFarbe` | `zuege()` filtert alle gegnerischen Züge auf dieses Feld weg. Verfällt nach dem nächsten gegnerischen Zug oder wenn die geschützte Figur selbst zieht. |
| `fesselFeld` / `fesselFarbe` | `zuege()` liefert für dieses Feld nichts. Verfällt nach dem nächsten Zug der gefesselten Seite. |

**Warum König und Matt geschützt sind:** Das Schild wirkt nicht auf den König,
der König wird nicht gefesselt, das Erdbeben lässt Könige stehen, und der
Friedhof lässt keinen König aufstehen. Andernfalls wäre „Schachmatt" nicht mehr
eindeutig — dieselbe Überlegung, die beim Doppelbrett zum schlagbaren König
geführt hat. Diese Ausnahmen sind keine Bequemlichkeit, sondern die Bedingung
dafür, dass die Spielart noch Schach ist.

### Die Bildanleitung (seit v0.41)

`schach-vorschau.js` liefert zu **jeder** Fähigkeit und jedem Unglückswürfel
zwei Bilder: vorher und nachher, auf einem 6-mal-6-Beispielbrett.

**Das Nachher-Bild wird gerechnet, nicht gezeichnet.** Die Datei beschreibt nur
die Ausgangsstellung und den einen Handgriff (welches Feld angetippt wird,
welcher Zug folgt); was daraus wird, rechnet `SCHACH_RUNDE.faehigkeitEinsetzen`
beziehungsweise `SCHACH_RUNDE.ziehen` — dieselben Funktionen wie im Spiel. Beim
Unglückswürfel wird er im Beispiel wirklich eingesammelt. Damit kann die
Anleitung nicht von der Regel abweichen; es ist dieselbe Überlegung wie bei den
Vorschaubildern der Spielarten.

| Art der Fähigkeit | Was das Nachher-Bild markiert |
|---|---|
| `zugmuster` | die Felder, die NEU erreichbar sind (das Brett ändert sich ja nicht) |
| `ablauf` (Doppelzug) | nach dem Beispielzug: wohin dieselbe Figur gleich noch einmal darf |
| alle übrigen | die Felder aus dem Verlaufseintrag — genau die, die auch am echten Brett aufleuchten |

**Gezeigt wird ein ABLAUF** (`SCHACH_VORSCHAU.schritte`, seit v0.42): zwei bis
vier Schritte, die der Bildschirm nacheinander abspielt und dann von vorn
beginnt. Jeder Schritt beantwortet eine Frage:

| Schritt | Frage | Wann |
|---|---|---|
| Ausgangsstellung | Worum geht es? | immer |
| Handgriff | WO tippst du hin? (Fingerabdruck) | Fähigkeit mit Zielfeld |
| Figur, dann Ziel | Welche Figur, und wohin? (zwei Fingerabdrücke) | wo gezogen wird (Doppelzug, Unglückswürfel) |
| Wirkung | Was ist daraus geworden? | immer |

Ein Schritt trägt `marken` (worum es geht), `wahl` (die übrigen möglichen
Felder), `ziele` (Zugpunkte wie im Spiel), `tipp` (Fingerabdruck) und `wege`
(Bewegungspfeile). Nichts davon wird aufgezählt: Die Auswahlfelder kommen aus
`SCHACH_RUNDE.zielFelder`, die Zugpunkte aus `SCHACH.zuege`, die Wege aus dem
Verlaufseintrag — dieselben Angaben, aus denen das echte Brett seine Spur färbt.

**Die Pfeile sind nicht der alte Zugpfeil** (v1.9 bis v3.5, siehe
`entscheidungen\entschieden.md`, „Warum der Zugpfeil verschwunden ist"): Der
sollte JEDE Gangart darstellen und konnte es nicht. Im Beispiel steht dagegen
fest, welche Figur wohin geht — und das zeigt eine gerade Linie richtig.

Ein Test (`tests\test-schach-vorschau.js`) prüft für JEDE Fähigkeit, dass es
ein Beispiel gibt und dass sich Vorher und Nachher sichtbar unterscheiden. Wer
eine Fähigkeit hinzufügt oder ändert und das Beispiel vergisst, merkt es dort.

Gezeichnet wird in `team-schach-auswertung.js` (`_anleitungBauen`,
`_beispielBrettBauen`) — im Einsetzen-Dialog und in der Bibliothek hinter dem i.
**Dort ist der Eintrag selbst der Knopf:** Jede Fähigkeit ist ein `details`.
Zugeklappt steht nur ihre Überschrift da (seit v0.43); Beschreibung und
Anleitung entstehen erst beim Aufklappen — 23 Einträge auf einmal wären über
zweitausend Elemente und ebenso viele Takte.

Drei Dinge hängen daran und dürfen nicht wegfallen:

- **Die Takte werden vor jedem Neuzeichnen beendet** (`_anleitungTakteBeenden`),
  und ein Takt beendet sich selbst, sobald sein Bild nicht mehr im Bildschirm
  steht (`isConnected === false`, für den geschlossenen Dialog).
- **Es ist höchstens ein Eintrag aufgeklappt** (`infoOffenerEintrag`, seit
  v0.44). Wer den nächsten öffnet, schliesst den vorigen — und dessen Inhalt
  wird weggenommen, damit sein Takt aufhört, statt unsichtbar weiterzulaufen.
- **Die Bibliothek wird nur einmal gebaut** (`TEAM_SCHACH.infoGezeichnet`). Sie
  hängt an keinem Spielstand; würde die regelmässige Abfrage sie alle drei
  Sekunden neu zeichnen, klappte jeder Eintrag wieder zu und jede Anleitung
  finge von vorn an.

### Der Takt — die Uhr für ablaufende Wirkungen (seit v3.5)

`stand.takt` zählt JEDEN Halbzug und wird nie zurückgesetzt. Er ist die
Grundlage für alles, was nach einer Weile von selbst verschwindet: Mauern und
geliehene Figuren.

**Warum nicht `halbzuege`:** Das ist der Zähler der Fünfzig-Züge-Regel — er
springt bei jedem Bauernzug und jedem Schlagen auf 0 zurück. Eine Mauer mit
`bis = halbzuege + 6` wäre nach einem einzigen Bauernzug unsterblich gewesen.
Wer eine neue Wirkung mit Ablaufzeit baut, nimmt `takt`; ein Test hält den
Unterschied fest.

### Mauern (seit v3.5)

`stand.mauern` ist eine Liste `[{ felder, bis }]`. Eine Mauer sperrt Felder,
ohne dass dort eine Figur steht, und sie gehört **keiner Seite** — sie behindert
beide gleichermassen, auch den, der sie gelegt hat.

Die Regel steckt an drei Stellen, und alle drei sind nötig:

1. **`_strahlzuege`** bricht vor einer Mauer ab — Turm, Läufer und Dame kommen
   nicht hindurch.
2. **`zuege()`** filtert jedes Zielfeld weg, auf dem eine Mauer liegt. Das ist
   die eine Regel für ALLE Figuren; dass ein Springer trotzdem darüber
   hinwegkommt, ergibt sich von selbst, weil er nie nach den Feldern dazwischen
   fragt.
3. **`_bauernzuege` und `_rochadeWege`** prüfen zusätzlich die Felder, über die
   hinweg gezogen wird. Ohne sie übersprang ein Bauer beim Doppelschritt die
   Mauer, und die Rochade zog hindurch — beide Lücken sind beim Bauen
   aufgefallen und durch Tests festgenagelt.

**Das angetippte Feld ist die MITTE** (seit v0.46): Die Mauer legt sich um es
herum, je ein Feld links und rechts. Bis v0.45 war es das linke Ende — man
tippte ein Feld an und bekam die Sperre daneben. Am Rand geht es deshalb nicht
mehr: Ohne Platz für beide Nachbarn liefert `mauerLegen` null, und `zielFelder`
bietet das Feld gar nicht erst an.

Am Bildschirm ist die Mauer **ein** Riegel über drei Felder, kein Stapel
Steine: Der helle Rand liegt nur aussen (oben und unten überall, links und
rechts nur an den Enden `mauer-anfang`/`mauer-ende`), und jedes Stück reicht ein
Pixel in seinen Nachbarn hinein. Bis v0.40 zog der Rand um jedes Feld herum —
gemeldet als „die Mauer ist nicht in sich geschlossen".

### Geliehene Figuren (Friedhof, seit v3.5)

`stand.geliehen` ist eine Liste `[{ feld, bis }]`. Die Figuren stehen in der
Farbe dessen auf dem Brett, der sie geholt hat, und ziehen wie seine eigenen.

**Verfolgt wird das FELD, nicht die Figur.** Deshalb muss jede Stelle, die etwas
bewegt, den Eintrag nachführen (`_geliehenNachfuehren`): Zieht eine geliehene
Figur, wandert ihr Eintrag mit; wird sie geschlagen, verfällt er. Der Zerfall
(`_zerfallAnwenden`) läuft NACH dem Hochzählen des Takts, sonst bliebe eine
Figur einen Halbzug länger als versprochen.

### Unglückswürfel

Ein Bonus-Eintrag mit `pech: true` trägt statt einer Fähigkeit einen Eintrag aus
`SCHACH_VARIANTEN.PECH` — je Stufe genau einen. Er kommt **nicht in den
Vorrat**, sondern wirkt beim Einsammeln sofort (`SCHACH_RUNDE._pechAusloesen`),
und zwar gegen die Seite, die ihn eingesammelt hat.

Die vier Wirkungen liegen wie die Fähigkeiten in `schach.js` und liefern
dieselbe Form (`{ stand, felder, wege, text }`). Auch hier gilt: **Könige bleiben
verschont** — sie stolpern nicht, meutern nicht und rutschen nicht.

**Beim Unglückswürfel sagt die Stufe, wie schlimm es wird** — die schlimmste
Wirkung liegt deshalb auf der seltensten Stufe. Seit v0.41 ist die Meuterei
legendär und der Erdrutsch episch: Eine übergelaufene Figur verschiebt das
Material doppelt, ein Erdrutsch kostet nur Stellung.

**Die Ausdehnung ist der einzige Eingriff, der die Brettgröße ändert.** Damit
das geht, sind `breite`/`hoehe` seit v2.7 eigenständige Angaben im Stand: Die
Spielart gibt sie vor, aber ein gespeicherter Stand mit passender Brettlänge
gewinnt. Beim Wachsen verschieben sich **alle Feldnummern**; deshalb rechnet
`SCHACH.ausdehnung` auch die gemerkten Felder um (Rochaderechte, Schild, Fessel,
Frost). Wer das vergisst, hat ein Schild auf dem falschen Feld — ein Test hält
es fest.

### Was der Verlauf verrät

Beim Erscheinen steht im Verlauf nur, **wo** ein Würfel liegt, nie was darin
ist — sonst könnte man den Inhalt vorher lesen, und die Überraschung wäre weg.
Dass ein Würfel ein Unglückswürfel ist, sieht man dagegen immer (umgedrehtes
Fragezeichen): Das ist keine Überraschung, sondern die Entscheidung, ob man
hinzieht.

### Der gerechnete Zufall

Nach JEDEM Halbzug erscheint mit `BONUS_CHANCE` Prozent ein Würfel auf einem
freien Feld (meist einer, selten zwei, sehr selten drei — `BONUS_ANZAHL`). Eine
Höchstzahl gibt es seit v3.3 nicht mehr; die einzige Grenze ist das Brett
selbst. **Gewürfelt wird dabei nicht:** `SCHACH_RUNDE._zufallsWert()` streut
Partie-Kennung und Zugzähler (FNV-1a) zu einer Zahl zwischen 0 und 1.

Das ist die wichtigste Festlegung der ganzen Spielart. Mit `Math.random()` sähe
jedes Gerät ein anderes Brett, und der erste Schreibvorgang gewönne — dieselbe
Falle wie beim gegenseitigen Überschreiben in v0.8. So rechnet jeder dasselbe
aus, ohne sich abzustimmen, und die Tests bleiben aussagekräftig, weil das
Ergebnis vorhersagbar ist. **`Math.random()` hat im Modell nichts zu suchen.**

### Zwei Zeitpunkte: Stufe beim Erscheinen, Fähigkeit beim Einsammeln

Seit v3.6 fällt die Entscheidung in zwei Schritten — und an jedem Schritt hängt
seine **eigene** Rechnung. Sie dürfen nicht verwechselt werden:

1. **Beim Erscheinen** wird nur die **Stufe** gezogen (`stufeZiehen`). Mehr darf
   die Oberfläche ohnehin nie verraten. Seit v0.41 zählt dabei die
   **Abklingzeit** mit (`SCHACH_VARIANTEN.stufenGewichte`): Eine Stufe mit
   `abklingen` zählt direkt nach einem Würfel dieser Stufe nur noch mit
   `gewicht` und steigt über `halbzuege` gleichmässig wieder auf 1. Nur Grün hat
   eine — die anderen Stufen behalten ihre feste Chance und sind in dieser Zeit
   häufiger dran. Gemessen wird im **Takt**; gemerkt wird er je Stufe in
   `partie.stufeZuletzt`.
2. **Beim Einsammeln** wird die Fähigkeit gezogen (`faehigkeitAusStufe`), und
   zwar **gegen den Vorrat dessen, der sie einsammelt**: Jedes Exemplar, das er
   schon hat, drückt ihr Gewicht auf `stufe.wiederholung` (0,15 bei Gewöhnlich
   bis 0,75 bei Legendär).

Warum nicht beides beim Erscheinen: Da weiss noch niemand, wer den Würfel
bekommt. Die Begründung samt Staffelung steht in `entscheidungen\entschieden.md`
(„Warum sich der Würfel-Inhalt erst beim Einsammeln entscheidet", „Warum Grün
eine Abklingzeit bekommen hat").

### Gespeichert wird, was liegt

`partie.bonus` ist die Liste der Würfel auf dem Brett, dazu `bonusFassung: 2`.
Ein Eintrag trägt **entweder** `stufe` (seit v3.6, Inhalt noch offen) **oder**
`art` (Würfel von vorher und alle Unglückswürfel). `SCHACH_RUNDE.bonusStufe()`
beantwortet die Farbfrage für beide Fälle an einer Stelle — der Bildschirm
unterscheidet nicht selbst.

Eine Partie **ohne** `bonusFassung` stammt aus der Zeit der vier festen Felder;
für sie wird die Liste einmalig aus `variante.bonusFelder` minus
`bonusGesammelt` gebaut. Angefangene Partien laufen dadurch unverändert weiter.

`verloren` sammelt geschlagene Figuren je Farbe — die Wiedergeburt holt daraus
die zuletzt verlorene zurück.

### Was „vorn" heisst — das Nudelholz (seit v0.46)

Das Brett wird für Schwarz **gedreht** gezeichnet. Eine Fähigkeit, deren
Richtung sich nach oben oder unten am Brett richtet, bedeutet damit für beide
Seiten etwas anderes — und genau das war beim Nudelholz der Fehler: Bis v0.45
bestimmte der angetippte Rand die Richtung, für Schwarz stand alles auf dem
Kopf.

Seither gilt: **Angetippt wird die EIGENE Grundreihe** (auf dem Bildschirm
immer unten), und geschoben wird von dort weg — für Weiss also aufwärts, für
Schwarz abwärts, für beide „nach vorn". Wer eine Fähigkeit mit Richtung baut,
rechnet sie aus der FARBE, nie aus der Reihe am Brett.

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

Aus denselben Angaben entsteht die **Spur des letzten Zuges** (`_letzteSpur`).
Unterschied zur Bewegung: Die Bewegung läuft einmal, die Spur bleibt stehen, bis
der nächste Zug kommt. Gefärbt wird der Weg — beim Springer das L, beim Läufer
die Diagonale, beim Turm die Linie; Start und Ziel etwas kräftiger
(`feld-spur-ende`). Wirkungen ohne Bewegung bekommen einen Ring
(`feld-spur-wirkung`), neu erschienene Würfel bewusst nichts.

Von v1.9 bis v3.5 war das ein gezeichneter **Pfeil**. Warum er weg ist, steht in
`DECISIONS.md` („Warum der Zugpfeil verschwunden ist"): Er konnte eine Bewegung
um ein einziges Feld gar nicht darstellen, und das waren drei der gemeldeten
Fehler.

### Zwei Fragen an einen Weg

`schach.js` beantwortet sie getrennt, und das ist wichtig:

| Funktion | Frage | Beim Springer |
|---|---|---|
| `SCHACH.wegFelder` | Welche Felder ZEICHNET man? | das ganze L |
| `SCHACH.betreteneFelder` | Welche betritt die Figur WIRKLICH? | nur das Ziel |

**Die Umwandlung hängt am ZUG, nicht an der Gangart** (seit v0.41):
`SCHACH._mitUmwandlung` macht aus einem Zug vier, sobald ein Bauer damit die
letzte Reihe erreicht — egal, ob er dorthin gelaufen ist oder über ein
Zusatzmuster gesprungen. Vorher steckte die Regel allein in `_bauernzuege`, und
ein gesprungener Bauer blieb ein Bauer (gemeldet als Wunsch #4).

An der zweiten hängt eine Regel: Seit v3.6 wird ein Würfel auch dann
eingesammelt, wenn man nur über sein Feld hinwegzieht. Wer springt (Springer,
Fähigkeit „Sprung", Teleport), sammelt unterwegs deshalb nichts ein. Beide
Funktionen stehen im Regelwerk, damit Anzeige und Regel nicht auseinanderlaufen
können.

### Die Größe der Figuren wird gemessen

`--figur-groesse` setzt `TEAM_SCHACH._figurGroesseSetzen` aus der gemessenen
Feldbreite, nachdem das Brett im Bildschirm steht. Die Rechnung in der Stildatei
ist nur der Rückfall. Warum das nötig war, steht in `DECISIONS.md` („Warum die
Figurengröße gemessen und nicht gerechnet wird"): `88vw` ist die Breite des
Fensters, nicht die des Bretts.

### Zwei Farben für jede Markierung

Das Brett hat helle **und** dunkle Felder. Jede einfarbige Markierung
verschwindet deshalb zwangsläufig auf einer der beiden — genau das ist in v1.5
passiert: Der Punkt auf einem möglichen Zielfeld war blau und lag damit
unsichtbar auf den blauen Feldern.

Seither gilt für alles, was auf dem Brett liegt, dieselbe Regel wie schon für
die Figuren: **heller Rand, dunkler Kern.** Zielfelder, Schlagfelder und die
Pfeile der Bildanleitung sind so gebaut. Wer eine neue Markierung ergänzt,
hält sich daran — eine einzelne Farbe reicht auf diesem Brett nie.

### Rot heisst gegen dich, Blau für dich (seit v0.41)

`TEAM_SCHACH._wirkungAnimieren` lässt die betroffenen Felder des letzten
Verlaufseintrags aufleuchten — rot bei `wirkung === "pech"`, sonst blau
(`.feld-wirkung-pech` / `.feld-wirkung`). Die **Figur** auf dem Feld glüht mit
(`.figur`, per `drop-shadow`): Bei Erdrutsch oder Erdbeben leuchten mehrere
Felder gleichzeitig, und die Frage ist, welche Figur es erwischt hat.

Es pulst zweimal; die Dauer steht an **zwei** Stellen, die zusammenpassen
müssen: `--wirkung-dauer` in der Stildatei und `TEAM_SCHACH.WIRKUNG_MS` im
Bildschirm-Code, der die Klasse danach wieder entfernt.

### Versteckte Spielarten

Eine Variante mit `versteckt: true` steht nicht mehr zur Auswahl
(`SCHACH_VARIANTEN.zurAuswahl()`), bleibt aber im Katalog. Das ist der Weg,
eine Spielart aus dem Angebot zu nehmen, **ohne laufende Partien zu beschädigen**:
Sie tragen die Kennung im Stand, und `holen()` findet sie weiterhin.

So ist „Fähigkeiten sammeln" in v2.9 verschwunden — sie war seit v2.5 dasselbe
wie „Klassisch" mit gesetztem Würfel-Haken. **Gelöscht wird eine Spielart nie.**

### Einstellungen je Partie

`partie.regeln` hält, was beim Anlegen gewählt wurde: `faehigkeiten` (Würfel an
oder aus, `null` = die Spielart entscheidet), `seltenheitZeigen` und
`einigkeit`. Die Vorgaben entsprechen dem Verhalten von vor v2.5 — eine Partie
ohne dieses Feld verhält sich also unverändert.

`SCHACH_RUNDE.faehigkeitenAn()` ist die einzige Stelle, die die Frage
beantwortet, ob Würfel erscheinen. Der Schalter der Partie geht der Spielart vor.
**Auch der Bildschirm fragt sie** — wer stattdessen die Spielart abfragt, baut
den Fehler aus v3.3 nach (Fähigkeiten-Karte fehlte bei zugeschalteten Würfeln,
siehe `docs\DECISIONS.md`).

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
