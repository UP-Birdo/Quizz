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

## Warum das Aufdecken je Person eine Tipp-Sperre erzwingt

Wenn jeder einzeln aufdeckt, sind die echten Würfel einer Person sichtbar,
während andere noch tippen dürfen. Ohne Gegenmaßnahme könnte man abschreiben.
Deshalb weist `MODELL.tippSetzen` jede Vermutung auf einen bereits aufgedeckten
Spieler ab — im Modell, nicht nur in der Oberfläche, damit die Regel auch dann
gilt, wenn zwei Geräte gleichzeitig schreiben.

Nebenwirkung, bewusst angenommen: Wer spät dazukommt, kann auf früh Aufgedeckte
nicht mehr tippen. Das ist richtig so — deren Wurf steht ja schon da.

## Warum das Auge standardmäßig zu ist und nichts speichert

Der Zweck des Knopfes ist, dass ein Blick über die Schulter nichts verrät. Wäre
der Zustand gespeichert, stünde nach dem Öffnen der Seite womöglich der eigene
Wurf offen auf dem Tisch — genau der Fall, den der Knopf verhindern soll. Also:
nach jedem Laden verdeckt, Sichtbarkeit nur für den Moment.

Der Schalter wirkt auch auf die Eingabefelder. Ein `select` lässt sich nicht
maskieren, deshalb werden die Felder bei geschlossenem Auge durch Platzhalter
ersetzt. Zum Eintragen macht man das Auge kurz auf — ein Klick mehr, dafür eine
Regel weniger im Kopf.

## Warum ein gezeichnetes Auge statt eines Emojis

Haus-Regel: keine Emojis. Ein SVG ist eine Zeichnung, kein Emoji — es lässt sich
in der Schriftfarbe darstellen, skaliert sauber und sieht auf jedem Gerät gleich
aus. Zwei Zustände: offenes Auge mit Pupille (Zahlen sichtbar), geschlossenes
Lid mit Wimpern (verdeckt).

### Anmeldung und Verwaltung (2026-07-31, zu v0.6)

| Wunsch | Umsetzung |
|---|---|
| Verwaltungs-Zugang mit Passwort 660932, der Spieler löschen darf | Knopf **Verwaltung** in der Fußleiste; im Quelltext steht nur die Prüfsumme des Passworts. |
| Beim Namen eine vierstellige PIN vergeben | Bei der Neuanmeldung, zweimal einzugeben. |
| Beim ersten Besuch zuerst fragen: Bist du einer dieser Spieler? Liste zeigen, PIN prüfen, dann hinein — von jedem Gerät | Genau so gebaut (`anmelden()` Weg 2). |

## Was die PIN leistet — und was nicht

Das muss man wissen, bevor man sich darauf verlässt:

**Sie leistet:** Anmelden als man selbst von einem beliebigen Gerät, ohne Konto
und ohne Server. Sie hält einen Mitspieler davon ab, sich mal eben als jemand
anders auszugeben.

**Sie leistet nicht:** Schutz gegen jemanden, der es darauf anlegt. Vier Ziffern
sind zehntausend Möglichkeiten; Prüfsumme und Salz stehen öffentlich in der
Datenbank, ein kleines Programm probiert sie in Sekunden durch. Dasselbe gilt
für das sechsstellige Verwaltungs-Passwort — eine Million Möglichkeiten sind für
einen Rechner nichts.

Warum das trotzdem so gebaut ist: Ein echter Schutz bräuchte einen Server, der
Anmeldeversuche zählt und bremst — also genau das, was dieses Projekt bewusst
nicht hat. Für ein Spiel unter Freunden ist ein Türschloss richtig, ein Tresor
wäre falsch investierte Mühe.

**Wichtig ist, was NICHT an der PIN hängt:** Die echten Würfel. Die liegen im
Gerätespeicher ihres Besitzers und stehen zu keinem Zeitpunkt in der Datenbank.
Wer eine PIN knackt, kann sich als jemand ausgeben und dessen Tipps ändern — er
sieht dadurch keinen einzigen fremden Würfel. Das Spiel selbst bleibt heil.

## Warum die PIN im Klartext nirgends steht

Dieselbe Überlegung wie beim Würfel-Siegel: Alles, was in der Datenbank steht,
ist öffentlich lesbar. Gespeichert werden deshalb nur `pinPruefwert` und
`pinSalz`. Das Salz muss offen liegen — sonst könnte ein fremdes Gerät die PIN
nicht prüfen, und genau das ist ja der Zweck. Zwei Spieler mit derselben PIN
bekommen dadurch verschiedene Prüfwerte; ohne Salz sähe man in der Datenbank
sofort, wer dieselbe Zahl benutzt.

Das Verwaltungs-Passwort steht aus demselben Grund nicht in `js/konfig.js` —
nur seine Prüfsumme. Die Datei liegt öffentlich auf GitHub.

## Warum die neue Runde ans Passwort gebunden ist

Der Knopf löscht bei jedem Mitspieler Würfel und Vermutungen — mitten im Spiel
ein Fehlgriff, den nichts zurückholt. Bis v0.8 durfte ihn jeder drücken; das war
eine Einladung zum Versehen, besonders weil er nach dem Aufdecken die blaue
Hauptaktion ist.

Die Alternative wäre gewesen, den Knopf ganz zu verstecken, solange die
Verwaltung nicht offen ist. Dagegen sprach: Dann sucht jemand die Funktion und
findet sie nicht. Jetzt sieht man sie, und die Passwortabfrage erklärt beim
Antippen, warum sie geschützt ist.

## Warum jeder eine PIN haben muss

Bis v0.8 gab es einen Weg ohne Ausweis: Spieler aus der Zeit vor der PIN
(v0.6) ließen sich mit einer bloßen Rückfrage übernehmen. Wer diesen Weg ging,
blieb ohne PIN — die Lücke blieb also offen und wanderte mit. Seit v0.9 wird
unmittelbar nach der Übernahme eine PIN verlangt, ohne Abbruch-Möglichkeit.

Damit gilt ausnahmslos: **Jeder Spieler hat eine PIN.** Das Eingabefeld lässt
sich nicht leer bestätigen, der Knopf bleibt bis zur vollständigen Ziffernfolge
gesperrt (`dialog.js`).

## Warum die Verwaltung nur löschen darf

Naheliegend wären auch: PIN zurücksetzen, Namen ändern, Wurf ansehen. Gebaut ist
nur das Entfernen, weil es alle vorkommenden Fälle löst (doppelte Anmeldung,
vergessene PIN, jemand ist raus) und weil jede weitere Befugnis erklärt und
geprüft werden müsste. Den Wurf ansehen ginge ohnehin nicht — er liegt nicht in
der Datenbank.

Der Zustand steckt im Gerätespeicher, nicht im gemeinsamen Stand: Verwaltung ist
eine Eigenschaft des Geräts, an dem jemand sitzt, nicht der Runde. So sehen die
anderen auch nicht, dass gerade jemand als Verwalter unterwegs ist.

## Warum ein Siegel statt einfacher Geheimhaltung

Das Spiel steht und fällt damit, dass niemand die Würfel der anderen vorher
sieht. Die Daten liegen aber in einer öffentlich lesbaren Datenbank, deren
Adresse zwangsläufig im ausgelieferten JavaScript steht. Abgewogen wurden:

| Weg | Bewertung |
|---|---|
| Würfel in der Datenbank, App zeigt sie nur nicht an | Abgelehnt. Wer die Entwicklerkonsole öffnet, sieht alles. Bei einem Spiel, das einen ganzen Tag läuft, ist das keine Frage des Ob, sondern des Wann. |
| Würfel verschlüsseln | Abgelehnt. Der Schlüssel müsste in der öffentlichen Seite stehen — Scheinsicherheit. |
| **Würfel bleiben auf dem Gerät, veröffentlicht wird nur eine Prüfsumme** | **Gewählt.** Kostet rund fünfzig Zeilen, kommt ohne Fremdtechnik aus (Web Crypto ist im Browser eingebaut) und löst zwei Probleme auf einmal: Spicken ist unmöglich, und nachträgliches Ändern fällt auf. |
| Einen Server bauen, der die Würfel unter Verschluss hält | Abgelehnt. Eigener Server, eigene Anmeldung, eigener Betrieb — für ein Freundesspiel unverhältnismäßig, und die Seite soll ohne Haus-Netz erreichbar sein. |

Der Preis der gewählten Lösung: Die Würfel hängen am Gerät. Wer wechselt, muss
bei der Auflösung von Hand nachtragen; das wird als **ohne Siegel** angezeigt.
Das ist ehrlicher als eine Lösung, die Sicherheit nur vortäuscht.

## Warum Namen und Vermutungen NICHT versiegelt sind

Namen müssen sichtbar sein, sonst weiß niemand, auf wen er tippt. Vermutungen
müssen am Ende auswertbar sein und sind vor der Auflösung nur schwach geschützt
(die App zeigt sie nicht, in der Datenbank stehen sie im Klartext). Das ist
vertretbar: Wer die Tipps der anderen spickt, gewinnt dadurch nichts —
entscheidend sind die echten Würfel, und die sind versiegelt.

## Warum das Ändern einer Festlegung erlaubt bleibt

Ein Verbot wäre technisch leicht, in der Praxis aber lästig: Wer sich vertippt,
sitzt sonst den ganzen Abend auf einem falschen Wurf. Stattdessen ist Ändern
erlaubt und wird **sichtbar gemacht** — mit Anzahl und Uhrzeit, für alle. Die
soziale Kontrolle erledigt den Rest, ganz ohne Regelwerk.

## Warum die Eingabefelder keine Nummern tragen

Bis v0.4 stand über jedem Auswahlfeld **Würfel 1** bis **Würfel 5**. Der Nutzer
fragte daraufhin nach, ob ein umsortierter Tipp überhaupt zählt — die Zählung
war schon immer richtig, aber die Beschriftung erzählte etwas anderes. Eine
Oberfläche, die man erklären muss, ist falsch beschriftet.

Seit v0.5 tragen die Felder keine sichtbare Nummer mehr; darüber steht der Satz
*Reihenfolge egal — es zählt nur, welche Werte vorkommen.* Für Vorleseprogramme
bleibt die Nummer im `aria-label`, sonst wäre nicht unterscheidbar, in welchem
Feld man steht.

## Warum die Punkte so verteilt werden

Gewünscht war ein Punktestand mit Teilpunkten für knappe Tipps. Die Zahlen
stehen in `modell.js` (`PUNKTE_EXAKT`, `PUNKTE_NAH`, `PUNKTE_BONUS`) und
ergeben sich aus drei Überlegungen:

- **Genau richtig muss deutlich mehr wert sein als knapp daneben**, sonst lohnt
  sich das Nachdenken nicht. Verhältnis 10 zu 4: Zweieinhalb knappe Tipps wiegen
  einen genauen auf.
- **Abstand 3 bringt nichts.** Bei Werten von 1 bis 5 wäre sonst fast jeder
  Tipp irgendwie „nah" — dann wäre die Skala wertlos.
- **Der Bonus belohnt den Vergleich mit den Mitspielern**, nicht nur die eigene
  Leistung. Genau das war der Wunsch: Punkte auch dafür, näher dran gewesen zu
  sein als die anderen. Bei null Punkten gibt es keinen Bonus, sonst würde er in
  einer Runde ohne jeden Treffer verlost.

Die Restwerte werden **der Größe nach gepaart** (beide Listen sortiert, dann
Stelle für Stelle). Bei sortierten Listen ist das nachweislich die Paarung mit
dem kleinsten Gesamtabstand — der Rater wird also immer so gut bewertet, wie es
überhaupt möglich ist. Eine schlechtere Paarung wäre schwer zu erklären und
würde als Willkür wahrgenommen.

Die Erklärung im i-Knopf wird aus denselben Konstanten erzeugt
(`MODELL.punkteErklaerung()`). Damit kann die angezeigte Regel nicht von der
gerechneten abweichen — der übliche Weg, wie Spielregeln und Code auseinander
laufen, ist hier baulich versperrt.

## Warum die Reihenfolge der Würfel nicht zählt

Fünf gewürfelte Würfel sind eine Menge, keine Reihenfolge. Deshalb:

- gezählt wird als Multimenge — ein doppelt geratener Wert zählt nur so oft, wie
  er wirklich vorkommt (echt `1,1,3,5,Stern` gegen Tipp `1,3,3,5,5` gibt 3);
- vor dem Bilden der Prüfsumme wird sortiert, sonst wäre derselbe Wurf je nach
  Eingabereihenfolge unterschiedlich versiegelt;
- angezeigt wird immer sortiert, das liest sich schneller.

## Warum Anmeldung über den Namen, ohne Passwort

Ein Passwort wäre eine Hürde für ein Spiel unter Freunden und müsste irgendwo
sicher liegen. Stattdessen merkt sich das Gerät, wer es ist. Gibt jemand einen
schon vorhandenen Namen ein, fragt die App nach, ob es dieselbe Person auf einem
anderen Gerät ist. Das kann man missbrauchen — unter Freunden ist das kein
Bedrohungsmodell, sondern Zusammenarbeit.

## Warum Karten statt einer großen Tabelle

Eine Matrix aus allen Ratern gegen alle Ziele wäre auf dem Handy unbrauchbar.
Stattdessen: je Mitspieler eine Karte mit fünf Feldern. In der Auflösung
dieselbe Karte, ergänzt um die echten Würfel und die Tipps aller anderen. Die
einzige echte Tabelle ist die Bestenliste — sie hat nur drei Spalten.

## Warum Firebase Realtime Database?

Der Wunsch, dass alle dieselbe Runde sehen, verlangt eine Stelle außerhalb der
Besucher-Browser. GitHub Pages liefert nur unveränderliche Dateien aus.

| Weg | Bewertung |
|---|---|
| **Firebase Realtime Database über REST** | **Gewählt.** Konto anlegen, Datenbank erzeugen, Adresse eintragen — fertig. Keine Bibliothek, kein Bauschritt, kein Server im Haus. |
| Supabase | Gleichwertig, aber mehr Begriffe für dieselbe Aufgabe. |
| Eigener PowerShell-Server im Haus (Muster Helpdesk) | Passt zum Haus-Stil, scheitert am Ziel: die Seite soll öffentlich erreichbar sein, nicht nur im Haus-Netz. |
| GitHub als Speicher (Datei per API schreiben) | Verlangt einen Schreib-Token in der öffentlichen Seite. Abgelehnt. |

Die Entscheidung ist umkehrbar: Ein anderer Dienst ist eine weitere Klasse in
`js/speicher.js` mit denselben vier Mitgliedern.

## Warum die Abfrage im Hintergrund ruht

Die Mitspieler sitzen nicht im selben Netz — sie spielen über mobile Daten,
verteilt über einen ganzen Tag. Eine Abfrage alle drei Sekunden bei offenem
Tab in der Hosentasche kostet Datenvolumen und Akku für nichts: Niemand schaut
hin, und beim Zurückkommen wird ohnehin neu geladen.

Deshalb prüft `fremdenStandHolen()` `document.hidden` und überspringt die
Abfrage im Hintergrund. Damit der Stand trotzdem sofort stimmt, hängt an
`visibilitychange` ein Anschluss, der beim Sichtbarwerden einmal holt — das
fühlt sich schneller an als vorher, obwohl weniger übertragen wird.

Nicht gebaut: das Abfrageintervall selbsttätig strecken, wenn lange nichts
passiert. Das wäre eine zweite Zeitsteuerung mit eigenem Verhalten für einen
Gewinn, den die Sichtbarkeits-Regel schon fast vollständig einsammelt. Wer
sparsamer will, erhöht `abfrageIntervallMs` in `js/konfig.js`.

## Warum kein Firebase-SDK?

Das SDK kostet eine fremde Bibliothek, einen weiteren Ladevorgang und mehr
Begriffe. Für einen Stand, der als Ganzes gelesen und geschrieben wird, genügen
zwei REST-Aufrufe. Der Preis: keine echte Ereignis-Verbindung, wir fragen alle
3 Sekunden nach. Bei einer Handvoll Mitspieler ist das unauffällig.

## Warum „letzter gewinnt" beim gleichzeitigen Arbeiten?

Die App schreibt den gesamten Stand, also gewinnt der spätere Schreibvorgang.
Feldweise Zusammenführung wäre für die erwartete Nutzung unverhältnismäßig.
Abgemildert wird es so:

- eine offene eigene Änderung wird nie von einem fremden Stand überschrieben,
- geschrieben wird verzögert, nicht bei jedem Tastendruck,
- der Kopf zeigt jederzeit, ob gespeichert ist.

Praktisch heißt das: Wenn zwei im selben Moment tippen, kann ein Tipp verloren
gehen. Beim Festlegen und Aufdecken ist das unkritisch, weil jeder nur seinen
eigenen Eintrag anfasst.

## Warum das App-Zeichen so aussieht

Vier Augen und ein Stern in der Mitte: Das sind genau die Werte des Würfel
Quizz (1 bis 5 und Stern) in einem Bild, und es funktioniert auch als kleines
Lesezeichen noch. Gezeichnet, kein Emoji — Haus-Regel.

Der erste Entwurf war zu gedrängt: Bei 32 Pixeln verschmolzen Stern und Augen zu
einem Fleck. Deshalb sitzen die Augen weiter aussen und der Stern ist kleiner.
**Wer das Zeichen ändert, prüft es in 32 Pixeln nach** — in 512 sieht fast alles
gut aus.

Zwei Quellen (`icon.svg` und die Koordinaten in `tools\Icons-Erzeugen.ps1`) sind
eine bewusste Doppelung: PowerShell kann ohne Zusatzprogramm kein SVG zeichnen,
und eine Fremdbibliothek nur fürs Icon wäre unverhältnismässig. Beide Dateien
tragen einen Hinweis aufeinander.

## Warum der Wert „Stern" als Wort erscheint

Haus-Regel: keine Emojis. Ein Sternzeichen wäre grenzwertig, das Wort **Stern**
ist eindeutig, wird vorgelesen und funktioniert in jeder Schriftart. Intern
heißt der Wert `"STERN"`.

## Team Schach — die Entscheidungen (v1.0)

**Zweiter Tab statt eigenes Projekt.** Ausdrücklicher Wunsch. Es trägt, weil
sich beide Spiele nur zwei Dinge teilen: die Speicher-Schicht und die Frage,
wer am Gerät sitzt. Sonst berühren sie sich nicht — eigener Pfad in der
Datenbank, eigener Abgleich, eigene Dateien. Wird das Schach später deutlich
größer, lässt es sich mit den drei Dateien `schach*.js` herauslösen, ohne das
Würfel-Quizz anzufassen.

**Keine Reihenfolge im Team, wer zuerst zieht, hat gezogen.** Ebenfalls
ausdrücklicher Wunsch, und die einfachste denkbare Regel: Es gibt nichts zu
verwalten, keine Warteschlange, keine Absprache im Programm. Der Preis ist, dass
zwei aus einem Team gleichzeitig ziehen können — deshalb der Zugzähler, der den
zweiten Zug verwirft statt den ersten zu überschreiben. Ein verworfener Zug ist
ärgerlich, ein verschluckter wäre schlimmer.

**Vollständige Regeln statt Vereinfachung.** „Der Rest normales Schach" heißt
Rochade, en passant und Umwandlung. Gerade diese drei sind die Stellen, an denen
selbstgebaute Schachprogramme falsch liegen — deshalb hat jede davon einen
eigenen Test, inklusive der Fälle, in denen sie NICHT erlaubt sind.

**Figuren als Schriftzeichen, nicht als Bild.** Die Unicode-Schachzeichen sind
Symbole, keine Emojis; sie skalieren mit der Schriftgröße und färben sich mit.
Angehängt wird der Textmarkierer, damit kein Gerät sie doch bunt als Emoji
zeichnet. Zwölf einzelne SVG-Figuren wären mehr Aufwand für kein besseres
Ergebnis.

**Brett gedreht für Schwarz.** Jeder blickt von seiner Seite auf das Brett, wie
am echten Tisch. Kostet eine Zeile beim Zeichnen und erspart dauerndes
Umdenken.

**Kein Zug-Zurück.** Wäre bei mehreren Leuten je Team eine Quelle für Streit
(wer darf zurücknehmen?) und müsste den ganzen Verlauf mit Ständen speichern.
Wer sich vertan hat, gibt auf oder setzt die Partie zurück.

## Team Schach — der Ausbau (2026-08-01, v1.3 bis v1.5)

Der Auftrag war eine Liste von Wünschen auf einmal, mit einer Bedingung:
**„und die derzeitigen Spiele, die noch laufen, gehen weiterhin."** Diese
Bedingung hat die Reihenfolge und mehrere Entwürfe bestimmt.

| Wunsch | Umsetzung |
|---|---|
| Erst eine Liste offener Partien | Der Tab zeigt die Übersicht; eine Partie wird daraus geöffnet (`TEAM_SCHACH.offeneId`). |
| Brett blau-weiß statt braun | Farbvariablen in `stil.css`, dazu ein voller Umriss an den Figuren. |
| Bessere Zug-Animation, die alle sehen | `von`/`nach` im Verlauf, Bewegung beim Zeichnen — dadurch auf jedem Gerät. |
| Handy-Ansicht der Partie | Eine Spalte, Brett über die volle Breite, Teams nebeneinander, Verlauf eingeklappt. |
| Verschiedene Spielarten, größeres/kleineres Brett | `schach-varianten.js`; die Regeln rechnen mit `breite`/`hoehe` statt mit 8. |
| Mehrere Spieler auf zwei Brettern nebeneinander | Als Spielart **Doppelbrett** (16 mal 8) gebaut, siehe unten. |
| Fähigkeiten zum Aufsammeln | Spielart **Fähigkeiten sammeln** mit vier Feldern auf dem Brett. |
| Spielmodus beim Anlegen wählen | Auswahlliste beim Anlegen; danach fest. |
| Übergreifendes Scoreboard mit Platzierung | Dritter Tab **Rangliste**. |

### Warum die laufende Partie nicht umzieht, sondern bleibt

Der einfachste Weg zu mehreren Partien wäre gewesen, den Pfad in der Datenbank
zu wechseln und neu anzufangen. Das hätte die Bedingung des Auftrags gebrochen:
Eine angefangene Partie wäre verschwunden.

Stattdessen bleibt der Pfad `team-schach` derselbe, und der alte Stand wird beim
ersten Laden erkannt und zur Partie `start` gemacht
(`SCHACH_TAFEL._istEinzelnePartie`). Zwei angenehme Nebenwirkungen: Es ist keine
neue Firebase-Regel nötig, und niemand muss etwas tun — beim nächsten Öffnen der
Seite steht die Partie einfach in der Übersicht.

Erkannt wird der alte Stand an seinem Inhalt (`stand`, `teams`, `verlauf`,
`zugZaehler`), nicht an `datenVersion`. Eine Versionsnummer allein hätte sich
auch in einer leeren Ablage finden lassen; der Inhalt lügt nicht.

**Die Kehrseite, ehrlich benannt:** Derselbe Pfad heißt auch, dass ein Gerät mit
der ALTEN Seite weiter hineinschreiben kann. Zieht dort jemand, steht wieder
eine einzelne Partie im Pfad. Die laufende Partie überlebt das (sie wird beim
nächsten Laden erneut zur *Erste Partie*), zusätzlich angelegte Partien wären
aber verloren. Verhindern ließe sich das nur mit einem neuen Pfad — und der
hätte genau das gekostet, was die Bedingung des Auftrags war. Der Preis ist
also bewusst gewählt und dafür klein: Beim Umstieg lädt jeder die Seite einmal
neu, danach ist das Thema für immer erledigt. Der Hinweis steht als Kasten in
`DEPLOYMENT.md`, Abschnitt 1.

### Warum das Doppelbrett keine zwei Bretter ist

Gewünscht waren „zwei Bretter nebeneinander, wo die Figuren überall hinziehen".
Zwei getrennte Bretter mit Übergängen wären ein zweites Regelwerk gewesen:
eigene Nachbarschaft, eigene Bedrohungsrechnung, eigene Zugerzeugung.

Gebaut ist deshalb **ein** Brett mit 16 mal 8 Feldern und zwei Armeen je Seite.
Das erfüllt den Wunsch wörtlich (die Figuren ziehen über beide Hälften), kostet
keine einzige Sonderregel — und war ohnehin nötig, weil auch „größeres Brett"
gewünscht war.

Was es doch erzwungen hat: **zwei Könige je Seite.** Schach und Matt sind auf
genau einen König gebaut; bei zweien ist „im Schach" nicht mehr eindeutig.
Deshalb gilt dort der Schalter `koenigSchlagbar`: kein Schach, kein Matt, der
König wird geschlagen wie jede andere Figur, und wer keinen mehr hat, verliert.
Das ist eine ehrliche eigene Regel statt einer halben Schachregel, die in
Sonderfällen falsch läge.

### Warum die Spielart fest zur Partie gehört

Ein Wechsel mitten in der Partie müsste das Brett umrechnen — bei anderer Größe
schlicht unmöglich. Die Spielart wird deshalb beim Anlegen gewählt und steht
danach fest. Wer anders spielen will, legt eine neue Partie an; das kostet zwei
Tipper und lässt die alte in Ruhe.

### Warum es nur zwei Fähigkeiten gibt

Gewünscht waren „Fähigkeiten, die das Schachspielen verändern". Gebaut sind
**Sprung** und **Doppelzug** — beide verändern das Spiel spürbar, beide lassen
sich in je einem Feld des Standes ausdrücken, und beide sind vollständig
testbar. Verworfen wurden Fähigkeiten, die zusätzliche Zustände über mehrere
Züge bräuchten (Schutzschild, gesperrte Felder, Figuren tauschen): Jede davon
hätte eigene Regeln für Schach, Matt und Rochade nach sich gezogen.

Zwei sind genug, um die Spielart interessant zu machen. Eine dritte kostet
heute einen Eintrag in `SCHACH_VARIANTEN.FAEHIGKEITEN`, eine Wirkung in
`schach.js` und einen Test — der Weg ist also offen.

> **Nachtrag vom 2026-08-02: Diese Ablehnung ist aufgehoben.** Der Nutzer will
> ausdrücklich genau die Fähigkeiten, die oben verworfen wurden — Schutzschild,
> Teleport, Erdbeben — dazu fünf Seltenheitsstufen und ein zufälliges Erscheinen
> über die Partie hinweg. Die Begründung von oben bleibt trotzdem richtig; sie
> ist jetzt kein Gegenargument mehr, sondern die **Arbeitsliste**: Für jede
> dieser Fähigkeiten muss geklärt werden, was sie mit Schach, Matt und Rochade
> macht. Die Vorschläge dazu stehen in `../ROADMAP.md`, Punkt 2b. Wer das baut,
> liest sie zuerst.
>
> Zwei Festlegungen sind dabei schon gefallen, weil sie sonst jeder neu
> erfinden würde:
>
> - **Der Zufall wird gerechnet, nicht gewürfelt.** Feld und Seltenheit ergeben
>   sich aus Partie-Kennung und Zugzähler. `Math.random()` im Modell hieße: jedes
>   Gerät sieht ein anderes Brett, und die Tests wären wertlos. Dieselbe
>   Überlegung wie beim Auge und beim Siegel — was alle sehen sollen, muss aus
>   dem gemeinsamen Stand folgen.
> - **Eine Fähigkeit ist erst fertig, wenn alle sie sehen.** Die Animation
>   gehört zu jeder einzelnen Fähigkeit, nicht in einen Sammelschritt am Ende.
>   Das ist die Lehre aus v1.3, wo dasselbe für die Zugbewegung galt.

### Warum die Bewegung im Verlauf steht und nicht im Bildschirm

Der Wunsch war ausdrücklich, dass **andere den Zug auch sehen**. Eine Animation,
die nur der Ziehende sieht, wäre der halbe Weg gewesen. Da der Verlauf ohnehin
zu jedem Zug gespeichert wird, tragen seine Einträge jetzt `von` und `nach`.
Jedes Gerät, das den neuen Stand holt, kann die Bewegung damit nachzeichnen —
ohne eine einzige zusätzliche Übertragung.

Der Preis ist ein Merker im Bildschirm (`animiertBis`): Gezeichnet wird alle
drei Sekunden, gezogen viel seltener. Ohne ihn liefe dieselbe Bewegung
endlos in Schleife.

### Warum die Rangliste die Spiele nicht vermischt

Hausregel ist: kein Zustand zwischen den Spielen. Ein Punktestand über beides
scheint dagegen zu verstoßen. Er tut es nicht, weil die Richtung stimmt: Die
Rangliste **liest** beide Stände und schreibt nie. Sie hat keinen eigenen Pfad,
keine eigenen Daten und kein Recht, irgendetwas zu ändern. Entfernt man den Tab,
ändert sich an keinem Spiel etwas.

Die Punkte fürs Schach (Sieg 30, Unentschieden 10, Dabeigewesen 2) sind so
gewählt, dass eine gewonnene Partie ungefähr drei genau geratene Würfel wert ist
— spürbar, aber nicht erdrückend. Alle aus dem Siegerteam bekommen dasselbe:
Wer wie viele Züge gemacht hat, wird bewusst nicht gezählt, denn im Team gibt es
keine Reihenfolge. Alles andere wäre eine Einladung, dem Mitspieler den Zug
wegzuschnappen.

### Abgelehnt beim Ausbau

| Idee | Warum nicht |
|---|---|
| Partien in einer Liste statt in einem Objekt speichern | Firebase macht aus Listen mit Lücken ohnehin Objekte, und das Einsetzen einer einzelnen Partie wäre eine Suche statt einer Zuweisung. |
| Die verbliebenen Bonusfelder speichern | Firebase wirft leere Listen weg — „alle eingesammelt" käme als „noch keins eingesammelt" zurück. Gespeichert werden deshalb die eingesammelten. |
| Löschen einer Partie ans Verwaltungs-Passwort binden | Eine Partie betrifft nur die, die darin spielen, und die Rückfrage nennt ihren Namen. Die neue Runde im Würfel-Quizz löscht dagegen bei ALLEN etwas — deshalb ist nur sie geschützt. |
| Beim Doppelbrett zwei getrennte Bretter mit Übergangsfeldern | Zweites Regelwerk für denselben Nutzen; ein breites Brett erfüllt den Wunsch wörtlich. |

## Bedienung des Brettes (2026-08-02, v1.6 bis v1.9)

| Wunsch | Umsetzung |
|---|---|
| Die Zugvorhersage hebt sich zu schlecht vom Hintergrund ab | Jede Markierung ist jetzt zweifarbig (heller Rand, dunkler Kern) und markiert zusätzlich das ganze Feld, nicht nur einen Punkt. |
| Vorschaubild je Spielart | Miniaturbrett aus derselben Aufstellung wie das echte Brett, in einer eigenen Auswahl-Ansicht. |
| Die Regel mit König und Turm muss richtig funktionieren | Die Regel war richtig. Neu ist die Bedienung (Turm antippen) und eine Begründung, wenn die Rochade gesperrt ist. |
| Ein Pfeil soll die letzte Bewegung anzeigen | SVG über dem Brett, aus `von`/`nach` des Verlaufs. |

### Der blaue Punkt auf dem blauen Brett — ein selbstgemachter Fehler

Als das Brett in v1.3 von Braun auf Blau umgestellt wurde, blieb die
Zielmarkierung, wie sie war: ein blauer Punkt. Auf den blauen Feldern war sie
damit praktisch unsichtbar. Aufgefallen ist es nicht beim Bauen, sondern erst
beim Spielen.

**Die Lehre:** Wer eine Grundfarbe ändert, muss ALLES prüfen, was auf dieser
Farbe liegt. Ein Test hätte das nicht gefunden — Farbkontrast ist genau das, was
`test-bildschirm.js` ausdrücklich nicht kann.

Daraus ist eine Regel geworden, die für jede künftige Markierung auf dem Brett
gilt: **heller Rand, dunkler Kern.** Dieselbe Doppel-Kontur trug schon die
Figuren, aus demselben Grund. Eine einzelne Farbe reicht auf einem Brett mit
hellen und dunklen Feldern nie.

### Warum die Rochade jetzt auch über den Turm geht

Gemeldet war: „die Regel mit dem König und dem Turm tauschen muss richtig
funktionieren". Geprüft wurde zuerst die Regel — an der Stellung, die zu diesem
Zeitpunkt wirklich in der Datenbank stand. Ergebnis: Die Regel war korrekt.
Weiß hatte bereits rochiert (König g1, Turm f1), und bei Schwarz standen Läufer
und Dame noch zwischen König und Turm.

Der Fehler lag also nicht in der Regel, sondern darin, dass die App dazu
schwieg. Zwei Änderungen folgen daraus:

1. **Ein zweiter Weg zur Rochade.** Am echten Brett fasst man beide Figuren an;
   deshalb tippen viele den Turm an. Das geht jetzt — der König zwei Felder zur
   Seite bleibt zusätzlich möglich.
   **→ In v0.44 auf Nutzer-Entscheidung wieder ausgebaut** („nur die König-
   Variante"). Es blieb der eine Weg, den auch jeder andere Zug geht: König
   antippen, Zugpunkt antippen. Ein zweiter Weg mit eigener Kontur war eine
   Sonderregel für genau einen Zug — und die Kontur sah aus wie eine Warnung.
   Die Regel selbst ist davon unberührt: Der Rochadezug steht seit jeher als
   normaler Königszug in `SCHACH.zuege`, und auf sechs Feldern Breite landet
   der König ohnehin auf dem Turmfeld.
2. **Eine Begründung, wenn es nicht geht.** `SCHACH.rochadeLage` nennt den
   Grund, der Bildschirm zeigt ihn. Die Begründung steht im Regelwerk, nicht im
   Bildschirm-Code — sonst gäbe es die Bedingungen zweimal, und ein Test prüft
   deshalb, dass beide Auskünfte übereinstimmen.

**Die allgemeine Lehre:** Wenn eine Regel korrekt ist und trotzdem als Fehler
gemeldet wird, liegt der Fehler in der Darstellung. Das ist im Projekt bereits
zum zweiten Mal so — beim ersten Mal waren es die Nummern an den
Würfel-Eingabefeldern (v0.5). Damals wie heute war die Antwort nicht, die Regel
zu ändern, sondern sie zu erklären.

### Warum der Pfeil und die Bewegung beide bleiben

Beide zeigen denselben Zug, und beide kommen aus derselben Quelle (`von` und
`nach` im Verlauf, seit v1.3). Sie beantworten aber zwei verschiedene Fragen:
Die Bewegung zeigt, **dass** gerade etwas passiert ist, und ist nach einer
Viertelsekunde vorbei. Der Pfeil zeigt, **was** zuletzt passiert ist, und bleibt
stehen — auch für den, der die Seite Stunden später wieder öffnet. Bei einem
Spiel, das über den ganzen Tag läuft, ist die zweite Frage die häufigere.

Gezeichnet wird in Feldkoordinaten statt in Pixeln. Damit stimmt der Pfeil auf
dem 6er-Brett genauso wie auf dem Doppelbrett, ohne einen einzigen Sonderfall.

## Die Fähigkeiten-Spielart (2026-08-02, v2.0)

Gewünscht waren fünf Seltenheitsstufen, zufälliges Erscheinen, neue Fähigkeiten
je Stufe, ein Würfel-Bild auf den Feldern und Animationen für alle.

### Warum der Würfel gezeichnet und nicht eingefügt ist

Der Nutzer hat ein Bild geschickt (bunter Würfel mit Fragezeichen) mit der
Bitte, den Hintergrund wegzuschneiden und es auf die Felder zu legen. Gebaut ist
stattdessen ein **gezeichneter Würfel als SVG**. Drei Gründe, in dieser
Reihenfolge:

1. **Er trägt die Seltenheit.** Ein SVG bekommt seine Farbe aus der Stufe — ein
   grauer Würfel ist etwas anderes als ein goldener. Mit einer Bilddatei
   bräuchte es fünf Dateien, die jemand pflegen müsste.
2. **Er bleibt scharf.** Auf dem Doppelbrett ist ein Feld auf dem Handy rund 20
   Pixel breit, auf dem 6er-Brett am Rechner das Zehnfache. Ein Bild müsste für
   beides taugen.
3. **Haus-Regel.** Im Projekt ist alles gezeichnet (Auge, App-Zeichen,
   Figuren) — schon weil ein fremdes Bild auf einer öffentlichen Seite eine
   Rechtefrage aufwirft, die niemand geprüft hat.

Der Preis: Er sieht nicht exakt aus wie die Vorlage. Das ist vertretbar, weil
die Vorlage die Idee transportierte („bunter Würfel mit Fragezeichen"), nicht
ein bestimmtes Bild.

### Warum vier Arten statt zehn Sonderfälle

Zehn Fähigkeiten könnten zehn Sonderfälle im Bildschirm bedeuten. Stattdessen
gibt es vier **Arten** (`zugmuster`, `ablauf`, `sofort`, `ziel`), und jede
Fähigkeit nennt ihre. Der Bildschirm kennt nur diese vier; eine elfte Fähigkeit
kostet dort keine Zeile.

Besonders trägt das bei den Zugmustern: Sprung, Ausweichen und Teleport sind
dieselbe Mechanik mit drei Formen. Und Fähigkeiten mit Ziel brauchen alle
denselben Ablauf — Knopf, Felder hervorheben, Feld antippen.

### Warum die Zielfelder ausprobiert und nicht aufgezählt werden

`zielFelder()` fragt für jedes Feld die Wirkung selbst („kommt dabei etwas
heraus?") statt die Bedingungen ein zweites Mal aufzuschreiben. Eine zweite
Liste wäre schneller, würde aber irgendwann von der ersten abweichen — und dann
zeigte die App Felder an, auf denen die Regel nichts zulässt. Das ist dieselbe
Überlegung wie bei `rochadeLage`: Regelfragen beantwortet das Regelwerk.

### Warum König und Matt ausgenommen sind

Drei Ausnahmen sind keine Bequemlichkeit, sondern Bedingung: Das Schild wirkt
nicht auf den König, der König wird nicht gefesselt, und das Erdbeben lässt
Könige stehen.

Ohne sie wäre „Schachmatt" nicht mehr eindeutig: Ein geschützter König kann
nicht geschlagen werden, ein gefesselter König wäre ohne eigenen Fehler matt,
und ein verschobener König könnte aus dem Matt heraus- oder hineinrutschen — die
Partie endete dann durch eine Fähigkeit statt durch einen Zug. Dieselbe
Überlegung hat beim Doppelbrett zum schlagbaren König geführt: Lieber eine
klare eigene Regel als eine halbe Schachregel, die in Sonderfällen falsch liegt.

### Warum eine Partie leer startet

Bis v1.9 lagen vier Fähigkeiten von Beginn an fest auf dem Brett. Das hatte den
Reiz eines Wettrennens, aber nach dem Einsammeln war die Spielart vorbei. Jetzt
erscheinen sie über die ganze Partie — das hält sie bis zum Ende interessant und
war der Kern des Wunsches („alle paar Runden").

Höchstens drei gleichzeitig, damit das Brett lesbar bleibt. Wer alles einsammelt,
bekommt Nachschub; wer sie liegen lässt, blockiert sich selbst.

## Regeln und Bedienung (2026-08-02, v2.1 bis v2.3)

### Der König, den der Doppelzug verschluckte

Gemeldet als „durch Fähigkeiten, also auch einen Doppelzug, darf der König nicht
geschlagen werden". Das war kein Wunsch, sondern ein Fehlerbericht — und er
stimmte.

Im normalen Schach kann ein König gar nicht geschlagen werden: Wer im Schach
steht, muss zuerst heraus. Der Doppelzug hebelt genau das aus. Man setzt Schach
und ist sofort wieder am Zug; der Gegner kam nie dazu, zu reagieren. Der zweite
Zug schlug dann den König, und die Partie endete damit, dass eine Figur vom
Brett verschwand — nicht durch Schachmatt.

Behoben mit einer Zeile in `zuege()`: Züge auf ein Feld mit einem König werden
verworfen (ausser in Spielarten mit ausdrücklich schlagbarem König). **Die
Lehre:** Eine Fähigkeit, die in die Zugfolge eingreift, muss gegen jede Regel
geprüft werden, die stillschweigend auf dem Wechsel beruht. Schach, Matt und
Patt tun das alle.

### Warum die Rochade jetzt aus der Stellung gelesen wird

Bis v2.0 hing sie an den Standardplätzen: König auf e, Türme auf a und h. Damit
war sie auf dem kleinen Brett (König auf d) und dem großen (König auf f)
unmöglich — und auf dem Doppelbrett erst recht, wo jede Seite zwei Könige und
vier Türme hat.

Jetzt gilt: König auf seinem Startfeld, ein Turm mit Recht auf derselben
Grundreihe, dazwischen frei. Zwei Einzelheiten mussten dabei entschieden werden:

- **Wem gehört welcher Turm?** Je Richtung der nächstgelegene. Ohne diese Regel
  gehörte der mittlere Turm des Doppelbretts beiden Königen — zieht der eine,
  verlöre der andere sein Recht.
- **Das Recht hängt am König, nicht nur am Turm.** Sonst dürfte ein König, der
  schon rochiert hat, ein zweites Mal rochieren — mit einem Turm, dem er dabei
  näher gekommen ist. Deshalb gibt es `rochadeKoenige` neben `rochadeFelder`.

Auf schmalen Brettern landet der König genau dort, wo der Turm stand. Deshalb
wird der Turm beim Ausführen ZUERST vom Brett genommen; sonst löschte er beim
Räumen den König, der inzwischen auf seinem Feld steht. Ein Test hält das fest.

### Warum ein Teamwechsel nicht mehr geht

Bis v2.0 durfte man mitten in der Partie die Seite wechseln. Bei einem Spiel,
das über Tage läuft und in dem jeder aus dem Team ziehen darf, ist das keine
theoretische Möglichkeit: Man zieht für Weiß, wechselt, zieht für Schwarz. Das
Beitreten bleibt jederzeit erlaubt — nur das Wechseln nicht. Wer wirklich raus
will, verlässt das Team ausdrücklich; dieser Weg war schon da.

### Warum die Pfeile nur halbdurchsichtig sind

Gewünscht waren Pfeile **hinter** den Figuren. Technisch geht das nicht direkt:
Die Figuren stecken in den Feld-Knöpfen, und ein Element, das über den Feldern
liegt, lässt sich nicht zwischen Feld und Figur schieben — dafür müssten die
Figuren in eine eigene Ebene über dem Pfeil wandern, mit allem, was daran hängt
(Animation, Bedienung, Tests).

Gewählt wurde deshalb der Weg über die Deckkraft: halb durchsichtig und schmaler
Strich. Das Ergebnis ist dasselbe — die Figur bleibt vollständig lesbar —, zu
einem Bruchteil des Aufwands. Sollte es später doch stören, ist die Figurenebene
der saubere Weg.

### Warum die Stufe Grau verschwunden ist

Mit fünf Stufen und zehn Fähigkeiten lagen zwei je Stufe — die unterste bekam
40 Prozent und war damit fast die Hälfte aller Funde. Vier Stufen verteilen
dieselben zehn Fähigkeiten gleichmäßiger (3/3/2/2) und lassen der Spitze mehr
Luft: Legendär ist von 4 auf 7 Prozent gestiegen, kommt aber jetzt mit zwei
wirklich starken Fähigkeiten statt mit einer starken und einer mittleren.

Die Neubewertung war der eigentliche Grund. **Doppelzug** und **Wiedergeburt**
waren zu billig: Zwei Züge hintereinander gewinnen fast immer Material, und eine
zurückgeholte Dame ist mehr wert als jede andere Wirkung im Spiel. Beide sind
jetzt legendär. **Schutzschild** und **Erdbeben** waren umgekehrt zu teuer
eingestuft — das eine rettet eine Figur, das andere wirkt auf beide Seiten.

## Der Gewinner-Bildschirm, der niemand fand (v2.6)

Gemeldet als Frage: „Wo ist der Gewinner-Screen?" Gebaut war er in v2.4, und er
funktionierte — nur sah ihn niemand.

Zwei für sich richtige Entscheidungen hatten sich gegenseitig ausgehebelt:

1. Der Abschluss erschien, wenn die **geöffnete** Partie ein Ergebnis hatte.
2. Beendete Partien wanderten in einen **zugeklappten** Kasten (ebenfalls v2.4).

Wer beim entscheidenden Zug gerade in der Übersicht stand — oder erst Stunden
später wiederkam, was bei einer Partie über mehrere Tage der Normalfall ist —
hatte die Partie nicht offen. Und danach lag sie zugeklappt unter „Beendet", wo
niemand nach einem Sieg sucht.

Jetzt sucht die App selbst: Gibt es eine beendete Partie mit eigener
Beteiligung, deren Abschluss dieses Gerät noch nicht gesehen hat, erscheint er —
unabhängig davon, wo man gerade ist.

**Die Lehre ist dieselbe wie beim leeren Schach-Tab in v1.2:** Zwei Regeln, die
einzeln stimmen, können zusammen ein Loch ergeben. Beide Male ging es darum, dass
etwas *nur bei einer Gelegenheit* passiert, die im echten Ablauf nicht eintritt.
Beide Male hätte kein Test es gefunden — er hätte die Gelegenheit ja
hergestellt.

## Warum der Pfeil jetzt eine Maske hat

In v2.3 lag der Pfeil halbdurchsichtig über den Figuren, mit der Begründung,
„hinter den Figuren" ginge nicht: Sie stecken in den Feld-Knöpfen, und ein
Element darüber lässt sich nicht dazwischenschieben.

Das stimmte für die Anordnung im Dokument — nicht für das Ergebnis. Eine
**Maske** im SVG stanzt an jedem besetzten Feld ein Loch: Der Pfeil ist dort
schlicht nicht gezeichnet. Optisch läuft er damit hinter den Figuren durch,
obwohl er technisch darüber liegt, und darf endlich kräftig sein.

**Die Lehre:** „Geht nicht" hieß hier „geht nicht auf dem Weg, den ich zuerst
gedacht habe". Der Nutzer hat zu Recht nachgehakt.

## Wie die Fähigkeiten eingestuft werden (Stand v2.6)

Die Chancen sind zum zweiten Mal nachjustiert worden, diesmal auf die Meldung,
Episch und Legendär kämen zu oft: 52 / 33 / 12 / 3 statt 45 / 30 / 18 / 7.

Das ist kein Feinschliff, sondern ein Faktor: Legendär erscheint jetzt in etwa
jeder achten Ziehung statt jeder vierzehnten — Verzeihung, umgekehrt: in jeder
33. statt jeder 14. Bei rund 13 Würfeln je Partie heißt das etwa alle drei
Partien einer statt einem pro Partie. Genau das war gemeint mit „zu hoch".

Die drei neuen Fähigkeiten sind danach eingeordnet, was sie kosten:

| Fähigkeit | Stufe | Warum |
|---|---|---|
| **Nudelholz** | Ungewöhnlich | Verschiebt viel, gewinnt aber nichts — es trifft beide Seiten und lässt sich schwer zielgenau nutzen. |
| **Frost** | Episch | Wie die Fessel, aber die Figur ist zusätzlich unantastbar. Ohne diesen Zusatz wäre sie nur eine teurere Fessel. |
| **Spiegel** | Legendär | Eine Figur aus dem Nichts — dieselbe Größenordnung wie die Wiedergeburt, nur ohne die Bedingung, vorher etwas verloren zu haben. |

## Warum der Hover nichts mehr verrät

Ein Würfel, dessen Inhalt man mit der Maus auslesen kann, ist kein
Überraschungswürfel. Bis v2.5 stand die Fähigkeit im Titel-Text — gedacht als
Hilfe, tatsächlich ein Blick unter die Karten. Jetzt steht dort höchstens die
Stufe, und auch die nur, wenn die Partie „Seltenheit anzeigen" eingeschaltet hat.

## Warum die Vorzüge wieder ausgebaut sind (v2.8)

Gebaut in v2.5, ausgebaut in v2.8 — auf ausdrückliche Ansage: „läuft nicht rund
und sieht nicht gut aus".

Woran es lag, ist im Nachhinein klar: Ein Vorzug wird ausgeführt, sobald der
Stand vom Server kommt. Für den, der ihn eingetragen hat, passiert das
unangekündigt — man schaut aufs Brett, und plötzlich hat die eigene Figur
gezogen. Dazu kam, dass die Vormerkung nur im Arbeitsspeicher lag und jedes
Neuladen sie verschluckte.

**Die Lehre:** Etwas, das ohne Zutun losläuft, braucht eine Ankündigung — einen
Countdown, eine Rückfrage, irgendetwas. Wer es erneut versucht, fängt bei dieser
Frage an und nicht beim Datenmodell.

**Was bleibt:** Die eine Festlegung von damals gilt weiter — ein Vorzug darf NIE
in den gemeinsamen Stand, sonst liest der Gegner ihn in der offenen Datenbank
mit. Ein Team-*Vorschlag* (Einigkeit) steht dagegen absichtlich drin.

## Warum das volle Glas keine Regel anfasst

„Volles Glas" ändert nur, was EINE Seite sieht — die Figuren ziehen unverändert.
Der Eintrag steht trotzdem im Spielstand und nicht im Bildschirm-Code, aus zwei
Gründen: Er soll das Neuladen überleben, und er soll auf jedem Gerät desselben
Teams gelten (im Team-Schach spielen mehrere Leute dieselbe Farbe).

Welches falsche Zeichen eine Figur bekommt, wird aus Partie-Kennung und Feld
gerechnet. Damit sieht dieselbe Figur immer gleich falsch aus — sonst wäre es
Flackern statt Täuschung, und man könnte die Wahrheit durch mehrmaliges
Hinsehen herausfinden.

## Warum die Würfel keinen festen Takt mehr haben

Bis v2.7 erschien alle sechs Halbzüge einer. Das war vorhersagbar: Wer zählen
konnte, wusste, wann sich ein Umweg lohnt. Jetzt wird nach jedem Halbzug neu
gewürfelt — im Schnitt derselbe Nachschub, aber nicht mehr planbar.

Nebenwirkung, die ausdrücklich gewünscht war: Liegen gelassene Würfel halten
nichts mehr auf. Vorher lief der Takt weiter, während das Brett voll war;
jetzt kommt einfach nichts, bis wieder Platz ist.

## Imposter — die Entscheidungen (v3.0)

### Was die Geheimhaltung leistet und was nicht

Das Wort steht nirgends im gespeicherten Stand, die Rollen auch nicht.
Gespeichert wird ein Salz; alles Weitere rechnet jedes Gerät daraus aus.

**Das leistet es:** Wer die Datenbank öffnet — und sie ist öffentlich lesbar —,
sieht eine Zeichenkette und sonst nichts. Kein versehentliches Mitlesen, kein
neugieriger Blick, der die Runde verdirbt.

**Das leistet es nicht:** Schutz gegen jemanden, der es darauf anlegt. Der
Quelltext liegt offen auf GitHub; wer die Entwicklerkonsole öffnet, kann Wort
und Rollen in zwei Zeilen nachrechnen.

Warum es trotzdem so gebaut ist: Echte Geheimhaltung bräuchte einen Server, der
die Rollen für sich behält und jedem nur seine schickt — also genau das, was
dieses Projekt bewusst nicht hat. Für ein Spiel unter Freunden am selben Tisch
ist das die richtige Stelle zum Aufhören. **Dieselbe Abwägung wie bei der
Spieler-PIN**, und aus demselben Grund hier ehrlich aufgeschrieben statt
verschwiegen.

### Warum die Wortliste handgemacht ist

Gewünscht war, eine große Wortsammlung herunterzuladen. Das geht nicht: Eine
fremde Liste auf einer öffentlichen Seite ist eine Rechtefrage, die niemand
geprüft hat — und die meisten Sammlungen sind für dieses Spiel unbrauchbar. Ein
Wort muss sich **beschreiben lassen, ohne genannt zu werden**; „Konjunktiv" oder
„Umstand" scheitern daran, ein „Regenschirm" nicht.

Deshalb liegen gut zweihundert handverlesene Wörter in `imposter-woerter.js`,
nach Themen und Wortarten sortiert. Wer ergänzen will, schreibt sie dort hinein
— mehr ist nicht zu tun.

### Warum die Zahl der Imposter nur ein Höchstwert ist

Drei Zusagen, die sich gegenseitig bedingen: Einer weiß das Wort **immer**
(sonst könnte niemand die Fragen beantworten), es können **weniger** sein als
eingestellt, und **ganz selten ist niemand** Imposter.

Der dritte Punkt ist der wichtigste für das Spiel: Solange „niemand war es"
möglich bleibt, kann sich niemand darauf verlassen, dass die Suche überhaupt ein
Ziel hat. Das hält die Fragerei ehrlich.

### Ein Fehler beim geratenen Wort wird verziehen

Gewünscht war, dass „ein Buchstabe falsch" noch zählt. Gebaut ist die
Editier-Entfernung **mit Vertauschung** — der Dreher („Regenschrim") ist der
häufigste Tippfehler überhaupt, und die einfache Rechnung zählt ihn als zwei
Fehler. Ein Test hält beides fest.

### Warum die Imposter-Punkte nicht festgeschrieben werden

Beim Schach bekommt jedes Ergebnis einen dauerhaften Chronik-Eintrag; hier
nicht. Der Grund ist der Aufbau: Es läuft immer nur EINE Imposter-Runde, und mit
der nächsten sind die alten Punkte weg.

Das ist eine bewusste Vereinfachung für den ersten Bau, keine
Grundsatzentscheidung. Soll es anders werden, ist der Weg schon gebahnt — die
Chronik des Schachs ist das Vorbild.

## Warum der Imposter Räume bekommen hat (v3.2)

Der Wunsch kam aus der Praxis: „das Prinzip mit Räumen und diese benennen und
die Einstellungen für die Räume jetzt bitte auch bei Imposter."

Bis v3.1 gab es genau EINE Runde. Thema und Anzahl der Imposter standen im
gemeinsamen Stand und konnten von **jedem** verstellt werden — mit dem Ergebnis,
dass zwei Leute abwechselnd hin- und herstellten und niemand wusste, was gleich
gilt. Der Fehler lag nicht in der Bedienung, sondern im Modell: Eine Einstellung,
die allen gehört, gehört niemandem.

Die Lösung ist dieselbe wie beim Schach: **Wer anlegt, entscheidet.** Danach sind
die Einstellungen fest, und wer andere Regeln will, legt einen zweiten Raum an.
Das kostet nichts, weil beliebig viele Räume nebeneinander liegen können.

Bewusst NICHT gebaut:

- **Einstellungen im Raum nachträglich ändern.** Wäre technisch leicht
  (`IMPOSTER_RUNDE.einstellen` gibt es weiterhin), bringt aber genau das Problem
  zurück, das der Umbau löst. Die Funktion bleibt nur stehen, weil der
  Datenvertrag additiv ist.
- **Ein Besitzer je Raum, der als Einziger löschen darf.** Löschen darf weiter
  jeder nach einer Rückfrage — dieselbe Regel wie beim Schach. Eine Sperre wäre
  eine Vorsichtsmaßnahme gegen ein Problem, das es noch nicht gibt.

Die Fragefolge beim Anlegen folgt bewusst der des Schachs: erst die
Einstellungen (wie viele Imposter), dann als **letzter Klick** die Kachel mit
dem Thema, dann der Name. So ist die Kachel immer die Handlung, die etwas
auslöst — man kann oben in Ruhe einstellen, ohne versehentlich anzulegen.

## Warum team-schach.js in vier Dateien liegt (v3.2)

Die Datei war auf 2476 Zeilen gewachsen. Das ist keine Frage des Geschmacks
mehr: Wer am Brett arbeitet, musste die Übersicht und den Abschluss mitlesen.

Zwei Wege standen zur Wahl:

1. **Vier eigene Objekte** (`SCHACH_BRETT`, `SCHACH_UEBERSICHT`, …). Sauberer im
   Sinne der Schichten — aber jede der 67 Funktionen wäre umzubenennen gewesen,
   und jede Aufrufstelle mit. Bei laufenden Partien das grössere Risiko.
2. **Ein Objekt, vier Dateien** (`Object.assign(TEAM_SCHACH, …)`). Das Verhalten
   ändert sich nachweislich nicht: Jeder Aufruf heisst weiter `TEAM_SCHACH.…`.

Gewählt wurde 2. Die Prüfung dazu war einfach und gehört zum Verfahren: Die
Liste der Funktionsnamen vor und nach der Aufteilung muss identisch sein — 67
vorher, 67 nachher, keine doppelt.

**Die Reihenfolge in `index.html` ist Pflicht**: Die drei ergänzenden Dateien
müssen nach `team-schach.js` stehen, sonst gibt es das Objekt noch nicht.
`tests/test-bildschirm.js` baut dieselbe Reihenfolge nach und würde es merken.

Was dabei ausdrücklich NICHT gemacht wurde: Kommentare kürzen. Der Wunsch
„weniger Tokens" zielt auch darauf, aber das widerspricht der Haus-Regel
„Lesbarkeit vor Effizienz" — und die Begründungen im Code sind genau das, was
denselben Fehler beim nächsten Mal verhindert. Der Zielkonflikt steht als offene
Nutzer-Entscheidung in `ROADMAP.md`.

## Die drei Wünsche vom Wunsch-Knopf (v3.3)

Die ersten Punkte, die über den Knopf in der App hereinkamen. Zwei Erkenntnisse
aus der Umsetzung, die über den Einzelfall hinausgehen:

**Ein Abhol-Skript, das nie etwas findet, sieht aus wie ein leeres Postfach.**
Die drei Wünsche lagen acht Stunden unbemerkt auf GitHub, weil
`Wuensche-Abholen.ps1` sie wegfilterte und seelenruhig „Keine offenen Wuensche"
meldete. Die Ursache steht als Kommentar im Skript (`Invoke-RestMethod` gibt
eine JSON-Liste als EIN Objekt aus; direkt in eine Pipeline geschickt kommt das
ganze Array als ein Wert an, und `$_.pull_request` wird zur Member-Enumeration).
Die Lehre gilt allgemein: **Eine Erfolgsmeldung über eine leere Menge ist kein
Beweis, dass die Menge leer ist.**

**Rückwirkend geht Statistik nicht.** Das Profil sollte Tag, Uhrzeit, Gegner und
Spieldauer zeigen. Drei davon standen schon in der Chronik — die Dauer nicht,
denn niemand hatte je festgehalten, wann eine Partie begann. Die Versuchung war,
`erstelltAm` als Beginn auszugeben. Dagegen entschieden: Das wäre die Zeit seit
dem ANLEGEN, bei einer Partie, die zwei Tage auf Mitspieler wartete, also
schlicht falsch. Stattdessen läuft `gestartetAm` ab jetzt mit, und für alles
Ältere bleibt die Angabe leer. **Eine fehlende Zahl ist besser als eine
erfundene.**

## Warum das Löschen ans Passwort gebunden ist (v3.3)

In `ROADMAP.md` stand der Punkt lange unter „Später", mit der Begründung: eine
Vorsichtsmaßnahme gegen ein Problem, das es noch nicht gibt. Mit dem Wunsch
[#2] gab es das Problem.

Gebunden wurden BEIDE Spiele, obwohl der Wunsch nur von „Räumen" sprach. Der
Grund ist nicht Symmetrie, sondern Schadenshöhe: Beim Schach überlebt zwar jedes
Ergebnis in der Chronik, eine LAUFENDE Partie ist aber unwiederbringlich weg —
mitsamt der Arbeit aller Beteiligten. Beim Imposter kostet ein gelöschter Raum
sogar echte Ranglisten-Punkte, weil er der einzige Ort ist, an dem sie stehen.

Was bewusst NICHT gebaut wurde: ein Besitzer je Partie, der als Einziger löschen
darf. Das wäre feiner, aber es bräuchte eine Rolle im Datenmodell, die es sonst
nirgends gibt — für einen Freundeskreis, der ohnehin ein gemeinsames Passwort
teilt, ist das Verhältnis nicht gewahrt.

## Warum die Würfel keine Höchstzahl mehr haben (v3.3)

Bis v3.2 lagen höchstens drei gleichzeitig. Der Gedanke dahinter war, das Brett
übersichtlich zu halten. In der Praxis las sich die Grenze als Fehler: Wer nicht
einsammelte, bekam ab dem dritten Würfel gar nichts mehr, und die Partie hörte
mitten im Spiel auf, welche auszuwerfen — ohne dass irgendetwas das erklärte.

Jetzt ist die einzige Grenze das Brett selbst: Ein Würfel braucht ein freies
Feld. Sie steht nicht als Zahl im Code, sondern ergibt sich aus der Stellung und
kann deshalb nicht veralten, wenn ein Unglückswürfel das Feld vergrössert.

Der Test dazu wurde umgedreht: Er prüft nicht mehr, dass die Grenze eingehalten
wird, sondern dass es über viele Züge WEITERGEHT — und dass kein Würfel auf
einem besetzten Feld landet.

## Warum der Springerpfeil einen Knick hat (v3.3)

Der Pfeil war seit v1.9 eine gerade Linie von Start nach Ziel. Beim Springer
zeigte er damit eine Diagonale über Felder, die die Figur nie berührt hat.

Erkannt wird der Sprung an der GEOMETRIE (ein Feld in der einen, zwei in der
anderen Richtung), nicht an der Figur. Das ist Absicht: Die Fähigkeit „Sprung"
versetzt eine beliebige Figur wie einen Springer, und der Weg ist derselbe — sie
bekommt damit automatisch denselben Pfeil, ohne dass irgendwo eine zweite
Fallunterscheidung nötig wäre.

**Eine Falle steckt in der Umsetzung:** Der Strich ist jetzt ein `<polyline>`
statt einer `<line>`, und ein Polygonzug wird von SVG standardmässig GEFÜLLT —
das L wäre ein ausgemaltes Dreieck. Ein `fill="none"` am Element genügt nicht,
weil jede CSS-Regel ein Präsentationsattribut überstimmt. Deshalb die Klasse
`.zug-pfeil-linie`, und sie muss in `stil.css` NACH `.zug-pfeil-unten` und
`.zug-pfeil-oben` stehen: gleiche Spezifität, und bei Gleichstand gewinnt die
spätere Regel.

## Die drei neuen Fähigkeiten und der Erdbeben-Umbau (v3.5)

**Warum es einen Schalter `beendetZug` braucht.** Bis v3.3 liess jede Fähigkeit
einen am Zug: Man setzte sie ein UND zog danach. Für Sprung oder Schutzschild ist
das richtig — sie verändern den Zug, den man ohnehin macht. Für die drei neuen
wäre es masslos: Wer eine geschlagene Dame zurückholt und im selben Atemzug mit
ihr angreift, hat nicht eine Fähigkeit benutzt, sondern zwei Züge gemacht. Der
Schalter steht deshalb an der Fähigkeit und nicht als Sonderfall im Ablauf.

**Warum der Händler seine Figuren selbst aussucht.** Der Wunsch klang nach „du
wählst fünf Bauern aus". Gebaut ist es anders: Der Händler nimmt die HINTERSTEN
Figuren der geforderten Art. Der Grund ist die Bedienung — fünf Felder
nacheinander antippen heisst fünf Gelegenheiten, sich zu vertippen, und beim
letzten Fehlgriff ist der Handel dahin. Genommen wird ohnehin fast immer das,
was am weitesten hinten steht. Der Dialog sagt vorher genau, welche Felder es
sind; wer nicht einverstanden ist, lehnt ab.

**Warum Ablehnen nichts kostet.** Das Angebot hängt am Zugzähler, nicht am
Zufall des Moments: Es ist auf jedem Gerät dasselbe und ändert sich erst mit dem
nächsten Zug. Damit kann niemand so lange neu würfeln, bis das Angebot passt —
und deshalb darf Ablehnen die Fähigkeit unangetastet lassen.

**Warum das Erdbeben umgebaut und nicht ergänzt wurde.** Es schob bisher die
acht Nachbarfelder nach aussen. Der Wunsch war etwas anderes: drei ganze Reihen
zur Seite. Zwei Fähigkeiten mit demselben Namen wären verwirrend gewesen, und
eine zusätzliche hätte die Tabelle aufgebläht, ohne dass jemand die alte noch
gewollt hätte. Fähigkeiten haben keinen gespeicherten Zustand — ein Umbau
bricht also keine laufende Partie.

**Die eigentliche Arbeit am Erdbeben ist die Reihenfolge.** Wer nach rechts
schiebt, muss die Figur GANZ RECHTS zuerst bewegen: Erst dann wird das Feld
frei, in das ihr Nachbar nachrückt. Läuft man andersherum, überschreibt die
erste Figur ihren Nachbarn, und aus drei Figuren wird eine. Dieselbe Falle wie
bei der Rochade auf dem 6er-Brett und beim Handel — überall dort, wo mehrere
Figuren gleichzeitig ihre Felder tauschen. Ein Test stellt genau das nach.

## Warum `halbzuege` keine Uhr ist (v3.5)

Die teuerste Erkenntnis dieser Runde, und sie wäre fast unbemerkt geblieben.

Mauern und geliehene Figuren sollten nach ein paar Zügen verschwinden. Der
naheliegende Weg war `bis = stand.halbzuege + 6`. `halbzuege` ist aber der
Zähler der **Fünfzig-Züge-Regel** — er springt bei jedem Bauernzug und jedem
Schlagen auf 0 zurück. Eine Mauer wäre damit nach dem ersten Bauernzug
unsterblich gewesen, und zwar auf eine Art, die im Spiel wie ein Zufall
ausgesehen hätte: mal verschwindet sie, mal nicht.

Aufgefallen ist es beim Schreiben des Zerfalls-Tests, nicht beim Lesen des
Codes. Seitdem gibt es `stand.takt`, der wirklich jeden Halbzug zählt, und einen
Test, der beide Zähler gegeneinander hält. **Wer eine neue Wirkung mit
Ablaufzeit baut, nimmt `takt`.**

## Warum der Zugpfeil verschwunden ist (v3.6)

Der Pfeil war seit v1.9 dabei und wurde dreimal nachgebessert: halbdurchsichtig
(v2.3), mit Maske (v2.6), mit Knick beim Springer (v3.3). Trotzdem kamen bis
v3.5 immer neue Meldungen: „bei Bauern fehlt oft der Pfeil", „Pfeil beim Pferd
nicht vorhanden", „wenn ein Bauer schlägt, soll auch ein Pfeil kommen".

**Es waren nicht drei Fehler, sondern einer.** Ein Pfeil braucht Platz für
Rand, Strich und Spitze. Ist die Strecke kürzer als das, wird gar nichts
gezeichnet — und genau das ist eine Bewegung um ein einziges Feld, also jeder
Bauernzug, jeder Königszug und der kurze Schenkel jedes Springer-L. Die
Nachbesserungen zielten alle auf das Aussehen, nie auf diese Grenze.

Die Lösung war, den Pfeil wegzuwerfen. Eingefärbte Felder können nicht zu kurz
sein: Start und Ziel gehören immer dazu. Nebenbei fielen knapp 300 Zeilen
Zeichenarbeit weg (SVG-Maske, zwei Lagen, Doppelkontur, Geometrie-Rechnung) und
mit ihnen die Regel, dass `.zug-pfeil-linie` nach `.zug-pfeil-oben` stehen muss.

**Die Lehre ist allgemeiner:** Wenn dieselbe Stelle dreimal nachgebessert wird
und trotzdem Meldungen kommen, ist meist der Ansatz falsch und nicht die
Ausführung.

An die Stelle traten zwei Funktionen im Regelwerk, die bewusst getrennt sind:

| Funktion | Frage | Beim Springer |
|---|---|---|
| `SCHACH.wegFelder` | Welche Felder ZEICHNET man? | das ganze L |
| `SCHACH.betreteneFelder` | Welche betritt die Figur WIRKLICH? | nur das Ziel |

Beide stehen in `schach.js` und nicht im Bildschirm, weil an der zweiten eine
Regel hängt (was man unterwegs einsammelt). Zwei Antworten auf dieselbe Frage an
zwei Orten wären genau die Art Widerspruch, die man erst im Spiel bemerkt.

## Warum die Figurengröße gemessen und nicht gerechnet wird (v3.6)

Gemeldet war: „Figuren sind nach dem Bewegen kleiner geworden."

Die Schriftgröße im Feld stand in der Stildatei und rechnete mit `88vw` — einer
Schätzung der Bildschirmbreite. Das Brett selbst ist aber `min(--brett-max,
100%)` breit, also so breit wie sein Container. Solange beides zusammenpasst,
fällt nichts auf. Es passt nicht mehr zusammen, sobald ein Scrollbalken
erscheint: `vw` zählt ihn mit, `100%` nicht. **Und der Scrollbalken erscheint
mitten im Spiel**, weil der Zugverlauf mit jedem Zug wächst und die Seite
irgendwann über den Bildschirm hinausgeht.

Die Figuren ändern sich also, ohne dass jemand etwas getan hätte — genau der
gemeldete Eindruck. Die Feldbreite lag ohnehin schon vor (`_zugAnimieren` misst
sie, um die Bewegung zu rechnen); jetzt setzt der Bildschirm daraus
`--figur-groesse`. Die alte Rechnung steht als Rückfall in der Stildatei, für
den Augenblick vor der ersten Messung.

**Merksatz:** Eine Größe, die von der echten Breite eines Elements abhängt,
gehört gemessen. `vw` ist die Breite des Fensters, nicht die des Elements.

## Warum sich der Würfel-Inhalt erst beim Einsammeln entscheidet (v3.6)

Gewünscht war: Was man schon hat, soll seltener nachkommen — und zwar
gestaffelt nach Seltenheit.

Das ging nicht in `_bonusNachziehen`, wo bis dahin Feld UND Inhalt gezogen
wurden. **Beim Erscheinen weiss noch niemand, wer den Würfel einsammelt**, und
gegen welchen Vorrat sollte man dann dämpfen? Gegen beide zusammen wäre eine
Näherung gewesen, die genau dann daneben liegt, wenn eine Seite viel gesammelt
hat und die andere nichts.

Seit v3.6 trägt ein Würfel beim Erscheinen nur seine **Stufe** — das ist
ohnehin das Einzige, was die Oberfläche je verraten darf. Die Fähigkeit wird
beim Einsammeln gezogen, gegen den Vorrat des Sammlers. Gerechnet bleibt es:
Die Marke enthält Partie, Zugzähler und Feld, also sehen alle Geräte dasselbe.

Der Datenvertrag bleibt additiv: Ein Eintrag trägt entweder `stufe` (neu) oder
`art` (Würfel, die vor v3.6 auf dem Brett lagen, und alle Unglückswürfel).
`SCHACH_RUNDE.bonusStufe` beantwortet die Farbfrage für beide Fälle an einer
Stelle.

**Die Staffelung ist Absicht** und steht in `SCHACH_VARIANTEN.STUFEN`
(`wiederholung`): 0,15 bei Gewöhnlich bis 0,75 bei Legendär. In der
gewöhnlichen Stufe stehen drei Fähigkeiten zur Auswahl, da lässt sich eine
leicht meiden. Bei den legendären wäre dieselbe harte Dämpfung dasselbe wie „du
bekommst die anderen vier garantiert zuerst" — und damit wäre der Zufall weg.

## Warum Ausweichen im gegnerischen Zug geht (v3.6)

Es ist die erste Fähigkeit mit `imGegenzug`. Der Grund, warum das überhaupt
vertretbar ist: Sie nimmt niemandem etwas weg, verschiebt nichts und kostet
keinen Zug — sie erlaubt einer eigenen Figur nur, sich später auf ein FREIES
Feld zu retten.

Zwei Dinge waren dabei zu klären:

- **Das Rennen.** Wer im gegnerischen Zug etwas schreibt, konkurriert mit dem
  Gegner um denselben Zugzähler. Das ist kein Fehler, sondern die Regel: Wer
  zuerst drückt, war zuerst — dieselbe Hausregel wie innerhalb eines Teams.
  Abgesichert ist es durch dieselbe Prüfung (`_sendenMitPruefung`).
- **Die Abstimmung entfällt.** In Partien mit „Team muss sich einig sein" wird
  über eine Gegenzug-Fähigkeit NICHT abgestimmt. Sie lebt davon, schnell zu
  sein; bis das Team sich einig ist, hat der Gegner längst gezogen. Ausserdem
  macht sein Zug jeden offenen Vorschlag ohnehin ungültig (Zugzähler).

Dazu wurde Ausweichen das Schlagen genommen. Vorher war es keine Notbremse,
sondern ein zusätzlicher Angriff mit jeder beliebigen Figur — und am Bildschirm
sah man rote Schlagfelder, auf die der Tipp dann doch nichts tat.

## Warum eine Fähigkeit den König nicht im Schach lassen darf (v3.6)

Für Züge galt das seit jeher: `SCHACH.zuege` wirft jeden Zug weg, nach dem der
eigene König im Schach steht. **Für Fähigkeiten galt es nicht** — dabei
verschieben mehrere von ihnen ganze Reihen (Erdbeben, Nudelholz, Bauernschub)
oder tauschen Figuren aus (Händler).

Zwei Fälle sind seit v3.6 gesperrt:

1. **Sich selbst ins Schach stellen.** Ein Bauernschub, der die Linie vor dem
   eigenen König freilegt, ist nichts anderes als ein illegaler Zug.
2. **Im Schach stehen und den Zug abgeben.** Fähigkeiten mit `beendetZug` sind
   danach beim Gegner — und der schlüge einen König, der noch im Schach steht.
   Die Partie endete damit, ohne dass je Schachmatt gesagt wurde. Genau dieser
   Fehler war schon einmal da, beim Doppelzug in v2.1 (siehe „Der König, den
   der Doppelzug verschluckte").

Was den Zug NICHT beendet, bleibt im Schach erlaubt: Man muss danach ohnehin
noch ziehen, und dabei kann eine Fähigkeit gerade helfen.

Auf Brettern ohne Schachbegriff (Doppelbrett, `koenigSchlagbar`) entfällt die
ganze Prüfung.

## Thema und Wortart sind zwei Fragen (v3.7)

Bis v3.6 standen im Imposter acht Gruppen nebeneinander: fünf Themen („Alltag",
„Essen und Trinken" …) und drei Wortarten („Nur Nomen", „Nur Verben", „Nur
Adjektive"). Sie lagen in derselben Liste und hatten sogar ein Feld `art`, das
sagte, welche Sorte Gruppe es war — ein sicheres Zeichen dafür, dass zwei Dinge
in einen Topf geworfen wurden.

**Jedes Wort hat ein Thema UND eine Wortart.** Seit v3.7 wird beides getrennt
gewählt: ein Thema (oder alle) und eine Wortart (oder alle). „Nur Verben" ist
damit keine Gruppe mehr, sondern die Auswahl „Alle Themen" plus „Verb" — und
gleichzeitig sind Kombinationen möglich, die es vorher nicht gab („nur die
Verben aus Sport und Freizeit").

Drei Dinge waren dabei heikel:

- **Die Reihenfolge der Wortliste darf sich nie ändern.** Die Ziehung rechnet
  `woerter[floor(wert * länge)]`; wer ein Wort dazwischenschiebt, ändert das
  Wort JEDER laufenden Runde. Die Themengruppen bestehen ausschliesslich aus
  Nomen, ihre Listen blieben deshalb Zeichen für Zeichen unverändert.
- **Die drei alten Gruppen bleiben im Katalog**, versteckt (`versteckt: true`).
  Ein Raum von vor v3.7 trägt `verben` im Stand und verlöre sonst sein Thema
  mitten im Spiel — dieselbe Regel wie bei den Spielarten des Schachs: löschen
  nie, verstecken ja. Ihre Wörter stehen inhaltsgleich unter dem neuen Thema
  „Querbeet". Ein eigener Test prüft für alle acht Kennungen, dass die Liste
  dieselbe bleibt.
- **Ein Wort darf nicht in zwei sichtbaren Themen stehen.** Bei der Auswahl
  „Alle Themen" käme es sonst doppelt vor und damit doppelt so oft. Der Test
  fand genau einen Fall: „Leiter" stand in „Technik und Arbeit" und in
  „Querbeet". Dort steht jetzt „Trichter".

Die Wortart eines ERGÄNZTEN Wortes steht in einer eigenen Karte
(`wortarten: { "kaminfeuer": "verb" }`) und nicht am Wort selbst — der
Datenvertrag ist additiv, und `eigeneWoerter` war eine Liste von Zeichenketten.
Wer dort nicht steht, gilt als Nomen: die harmloseste Annahme, denn die
allermeisten sind welche.

## Warum ein gefallenes Wort gedämpft und nicht gesperrt wird (v3.7)

Gewünscht war: „Die Chance, dass ein Wort, das in derselben Runde erst genannt
wurde, wiederkommt, soll sehr gering sein, sich aber mit der Rundenzahl immer
mehr erhöhen."

Eine harte Sperre („die letzten zehn Wörter kommen nicht dran") wäre einfacher
gewesen und hätte bei kleinen Themen die Auswahl leergeräumt — ein selbst
angelegtes Thema mit fünf Wörtern hätte nach fünf Runden gar nichts mehr
gehabt. Stattdessen bekommt jedes Wort ein Gewicht: eine Runde danach ein
Zehntel, zwei Runden danach zwei Zehntel, nach `WIEDERHOLUNG_RUNDEN` wieder
ganz. Jedes Wort bleibt jederzeit möglich, nur eben unwahrscheinlich.

**Die teure Erkenntnis steckt im Zeitpunkt.** Das gefallene Wort wird in
`neueRunde()` ins Gedächtnis geschrieben, NICHT in `starten()`. Der Grund ist
ein Zirkelschluss: `wortVon` rechnet das Wort aus dem Salz **und** dem
Gedächtnis. Würde das frisch gezogene Wort sofort eingetragen, änderte sich
damit sein eigenes Gewicht — und die zweite Abfrage lieferte ein anderes Wort
als die erste. Beim Zurücksetzen ist das Salz dagegen ohnehin gleich weg.

Und wie überall: **Ohne Gedächtnis muss die Rechnung dasselbe liefern wie
vorher.** Sind alle Gewichte 1, ergibt die gewichtete Ziehung genau
`woerter[floor(wert * länge)]`. Ein Test prüft das für hundert Werte — sonst
wechselte jede laufende Runde beim Laden ihr Wort.

## Warum selbst angelegte Themen auf der Tafel liegen (v3.7)

Sie könnten auch im Raum stehen, in dem sie entstanden sind. Sie liegen aber wie
die Wortbibliothek auf der TAFEL, und zwar aus demselben Grund: Wer vor einer
Runde ein Thema „Gemüse" anlegt, soll es allen zur Verfügung stellen — auch in
Räumen, die es noch gar nicht gibt. Ein Thema, das nur in einem Raum existiert,
wäre mit diesem Raum verschwunden.

`_bibliothekVerteilen` legt jedem Raum eine Abschrift hinein. Das ist nicht
kosmetisch: `IMPOSTER_RUNDE.normalisieren` prüft, ob es das Thema eines Raums
gibt, und liesse ein unbekanntes auf „Alltag" zurückfallen — mitsamt einem
anderen Wort. Deshalb bekommen die Räume beim Normalisieren der Tafel die
eigenen Themen mit, BEVOR sie selbst geprüft werden.

Die Kennung entsteht aus dem Titel mit dem Vorzeichen `e-` (aus „Gemüse" wird
`e-gemuese`). Das Vorzeichen hält sie von den Kennungen des festen Katalogs
fern — die dürfen nie überdeckt werden, sonst verlöre ein Raum sein Thema.

## Warum der Bibliotheks-Knopf verschwindet statt zu fragen (v3.7)

Er stand bis v3.6 für alle sichtbar in der Fussleiste und fragte beim Drücken
nach dem Verwaltungs-Passwort. Dicht war das, aber es lud zum Probieren ein und
verriet jedem, dass es hier etwas zu holen gibt. Wer die Wortliste sieht, hat
als Imposter einen Vorteil — also soll der Weg dorthin gar nicht erst sichtbar
sein.

Den Verwaltungs-Zugang bekommt man weiterhin im Tab Würfel Quizz; einmal
angemeldet, gilt er für die Sitzung. Das ist bewusst der einzige Weg: Ein
zweites Passwortfeld an anderer Stelle wäre eine zweite Stelle zum Pflegen.

## Erst anzeigen, dann senden (v3.8)

Gemeldet war: „Es hängt noch manchmal, gerade bei schlechter Netzverbindung, was
oft zu Irritation führt."

Es waren zwei Probleme in einem, und beide mussten weg:

1. **Gezeichnet wurde erst nach der Bestätigung.** `_sendenMitPruefung` lud den
   Stand vom Server, schrieb, und erst danach kam `zeichnen()`. Über mobile
   Daten liegen dazwischen leicht ein bis zwei Sekunden ohne jede Rückmeldung —
   also tippt man noch einmal.
2. **Die Abfrage funkte dazwischen.** Der Abgleich holt alle drei Sekunden den
   Stand vom Server. Traf ihre Antwort ein, während der eigene Zug noch
   unterwegs war, enthielt sie den Stand von VOR dem Zug — und setzte das Brett
   zurück. Das ist das „Zurückhüpfen", von dem der Wunsch spricht.

Der Abgleich hatte für seinen EIGENEN Schreibweg längst eine Sperre
(`schreibtGerade`). Schach und Imposter schreiben aber selbst, an ihm vorbei
(`TEAM_SCHACH._sendenMitPruefung`, `IMPOSTER._sendenMitLaden`) — sie fielen
durch diese Sperre hindurch. Seit v3.8 melden sie sich an:
`eigenerVorgangBeginnt()` / `eigenerVorgangEndet()`. Ein Zähler und kein
Schalter, weil mehrere Vorgänge gleichzeitig offen sein können.

**Was ausdrücklich NICHT verändert wurde:** die Zugzähler-Prüfung. Sie
entscheidet weiter, wer bei zwei gleichzeitigen Zügen aus einem Team gewinnt —
wer zuerst drückt, hat gezogen. Der vorgezogene Zug ist keine Vorhersage,
sondern das fertig gerechnete Ergebnis von `SCHACH_RUNDE.ziehen`; er wird nur
früher gezeigt. Verliert er das Rennen oder scheitert das Schreiben, wird der
Stand von vorher wiederhergestellt und gesagt, warum.

**Warum bei einem Fehler zurückgerollt wird**, obwohl der Wunsch „nicht
zurückhüpfen" lautete: Ein Zug, der nirgends ankommt, existiert für die anderen
nicht. Wer darauf weiterspielt, baut eine Stellung auf, die niemand sonst sieht
— und der nächste erfolgreiche Zug würde sie ohnehin wegwischen. Ein Rücksprung
mit Erklärung ist die kleinere Überraschung.

## Warum Grün eine Abklingzeit bekommen hat (v0.41)

Gemeldet war: „Die Item-Spawnrate ist komisch, es kommen fast nur grüne."

**Das war kein Fehler, sondern ein Missverständnis über die Dämpfung von
v3.6.** Die wirkt INNERHALB einer Stufe: Sie entscheidet, WELCHE Fähigkeit man
aus einer Stufe zieht, gemessen am eigenen Vorrat. Wie oft eine Stufe überhaupt
an der Reihe ist, hat sie nie berührt — und Grün stand bei 52 Prozent. Wer also
schon drei verschiedene grüne Fähigkeiten hatte, bekam weiter grüne Würfel, nur
eben abwechselnde.

Seit v0.41 gibt es deshalb **zwei getrennte Rechnungen**, und das ist genau der
Wunsch:

| Rechnung | Frage | Wo |
|---|---|---|
| `abklingen` (neu) | Welche STUFE erscheint? | beim Erscheinen des Würfels |
| `wiederholung` (v3.6) | Welche FÄHIGKEIT aus der Stufe? | beim Einsammeln |

**Nur Grün hat eine Abklingzeit** (`{ halbzuege: 8, gewicht: 0.2 }`): Direkt
nach einem grünen Würfel zählt Grün nur noch mit einem Fünftel und steigt über
acht Halbzüge gleichmässig wieder auf sein volles Gewicht. Blau, Lila und Gelb
behalten ihre feste Chance — sonst würde man das Problem nur verschieben.

**Was Grün verliert, fällt nicht weg, sondern geht an die anderen Stufen.** Die
Alternative wäre gewesen, in diesem Fall gar keinen Würfel erscheinen zu lassen;
dann bliebe die Chance der anderen Stufen absolut unverändert. Dagegen sprach,
dass damit rund ein Viertel aller Würfel verschwunden wäre — die Dichte auf dem
Brett ist eine eigene Einstellung (`BONUS_CHANCE`) und soll sich nicht als
Nebenwirkung einer Farbfrage ändern. Der Wunsch war „nicht immer Grün", nicht
„weniger Würfel".

Gemessen wird im **Takt**, nicht in `halbzuege` — aus demselben Grund wie bei
den Mauern (siehe „Warum `halbzuege` keine Uhr ist"). Gemerkt wird er je Stufe
in `partie.stufeZuletzt`; eine Partie ohne dieses Feld zieht wie vorher.

## Warum Rot und Blau und nicht Grün und Gelb (v0.41)

Bis v0.40 leuchtete ein Feld grün auf, wenn eine Fähigkeit gewirkt hatte, und
gelb, wenn ein Unglückswürfel zugeschlagen hatte. Beide Farben liegen in
derselben Richtung: Sie sagen „hier ist etwas passiert", aber nicht, ob es für
oder gegen einen war. Rot und Blau sind im Haus-Stil ohnehin die beiden
Richtungen (Gefahr und Hauptsache) — und auf einem blau-weissen Brett hebt sich
Rot am deutlichsten ab.

Dazu glüht die betroffene **Figur** mit, nicht nur ihr Feld. Der Anlass steht
im Wunsch selbst: Bei Erdrutsch oder Erdbeben verschieben sich ein halbes
Dutzend Figuren, und die Frage ist immer „welche hat es erwischt". Ein Feldrand
allein beantwortet sie nicht, wenn sechs Felder gleichzeitig leuchten.

**Und es pulst zweimal statt einmal aufzublitzen.** 900 Millisekunden sind auf
dem Handy vorbei, bevor man hinsieht — zumal die Wirkung auf den anderen
Geräten erst mit der nächsten Abfrage ankommt.

## Warum die Bildanleitung gerechnet und nicht gezeichnet wird (v0.41)

Gewünscht waren zwei Vorschaubilder je Fähigkeit — beim Einsetzen und in der
Bibliothek. Der naheliegende Weg wäre gewesen, sie zu malen: zwei Bilder je
Fähigkeit, 18 Fähigkeiten plus fünf Unglückswürfel, also 46 Bilder.

**Genau das wäre die zweite Wahrheit.** Ändert jemand eine Fähigkeit, zeigt das
Bild weiter das alte Verhalten — und niemand merkt es, weil ein Bild nicht
mitkompiliert wird. Dieselbe Überlegung hat schon bei den Spielarten dazu
geführt, das Vorschaubrett aus der echten Aufstellung zu zeichnen.

Deshalb beschreibt `schach-vorschau.js` nur die AUSGANGSSTELLUNG und den EINEN
Handgriff (welches Feld angetippt wird, welcher Zug folgt). Das Nachher-Bild
entsteht, indem die Fähigkeit im Beispiel wirklich eingesetzt wird — durch
`SCHACH_RUNDE.faehigkeitEinsetzen`, dieselbe Funktion wie im Spiel. Ein
Unglückswürfel wird im Beispiel sogar wirklich eingesammelt.

Der Preis ist ein Test, der bei jeder Änderung mitreden will: Er prüft für jede
Fähigkeit, dass das Beispiel noch aufgeht (Zielfeld gültig, Zug erlaubt,
Wirkung sichtbar). Das ist beabsichtigt — er ist die Stelle, an der ein
vergessenes Beispiel auffällt, bevor es jemand am Handy sieht.

**Warum in der Bibliothek eingeklappt:** 23 Einträge mal drei Bretter wären
eine sehr lange Seite. Wer wissen will, wie eine Fähigkeit wirkt, klappt sie
auf; wer die Liste überfliegt, wird nicht aufgehalten. Seit v0.42 ist der
Eintrag selbst der Knopf — eine zweite Zeile „Wie das aussieht" darunter hiess
auf dem Handy zweimal zielen für eine Sache.

**Seit v0.43 steht zugeklappt nur die Überschrift.** Auch die Beschreibungen
sind zusammen lang genug, dass man scrollen musste, bevor man wusste, welche
Fähigkeiten es überhaupt gibt — und genau das ist die erste Frage, die die
Bibliothek beantworten soll. Die Beschreibung gehört zur Antwort auf die
zweite Frage („was macht diese hier?") und steht deshalb zusammen mit der
Anleitung im aufgeklappten Teil.

**Warum die Bilder abgespielt werden (v0.42):** Zwei Bretter nebeneinander muss
man vergleichen — man sucht selbst, was sich geändert hat. Eine Bewegung sieht
man. Auf dem Handy kommt dazu, dass ein grosses Bild lesbarer ist als zwei
kleine nebeneinander. Der Wunsch lautete „ein GIF oder mehrere Beispielbilder";
gebaut ist es als Folge gerechneter Bretter, die der Bildschirm durchläuft —
eine echte Bilddatei wäre wieder die zweite Wahrheit, und ausserdem müsste
jemand sie bei jeder Regeländerung neu aufnehmen.

Wer im Betriebssystem weniger Bewegung eingestellt hat
(`prefers-reduced-motion`), bekommt alle Schritte nebeneinander. Das ist keine
Notlösung, sondern dieselbe Information ohne Bewegung.

**Warum die Pfeile zurückkommen dürfen (v0.44):** In v3.6 ist der Zugpfeil aus
dem Spiel geflogen, und die Begründung gilt weiter — er sollte JEDE Gangart
darstellen, und dafür ist eine gerade Linie das falsche Werkzeug (Bauernschlag,
Springer, Bewegung um ein Feld). In der Anleitung ist die Aufgabe eine andere:
Dort steht fest, welche Figur wohin geht, es ist genau ein Beispiel, und die
Linie muss nichts verallgemeinern. Deshalb sind Pfeile hier richtig und dort
falsch — dieselbe Form, zwei verschiedene Fragen.

**Warum nur ein Eintrag gleichzeitig offen ist:** Zwei laufende Anleitungen
untereinander sind zwei Dinge, die sich bewegen — man sieht keine davon zu
Ende. Dazu kommt ein handfester Grund: Jede Anleitung hat ihren eigenen Takt,
und ein zugeklappter Eintrag, der weiterläuft, arbeitet für niemanden.

## Wie eine Fähigkeit eingepreist wird (v0.47)

Bis v0.46 stand `beendetZug` da, wo es beim Bauen gerade nötig schien. Beim
Durchsehen aller siebzehn Fähigkeiten fiel auf, dass drei von ihnen
(Verstärkung, Spiegel, Wiedergeburt) Material einbringen und den Zug trotzdem
behielten — während Wiederbelebung, Friedhof und Händler für dasselbe seit v3.3
den Zug kosten. Das war keine Entscheidung, das war eine Lücke.

**Die Regel lautet seither: Wer Material oder einen Angriff geschenkt bekommt,
gibt den Zug ab.** Nur wer die Stellung verändert, behält ihn.

Zwei Dinge waren dabei zu entscheiden:

- **Sprung und Teleport kosten jetzt auch den Zug.** Sie sind gewöhnlich, also
  die häufigsten Würfel überhaupt. Mit dem Sprung darf man SCHLAGEN, mit dem
  Teleport über alles hinwegsetzen — beides zusätzlich zum normalen Zug war zu
  viel für etwas, das jede Partie mehrfach kommt. Ausweichen bleibt gratis: Es
  zieht nur auf FREIE Felder, schlägt nie und ist als Notbremse gedacht.
- **Die Stufe bleibt, wo sie ist.** Sie beantwortet eine andere Frage — wie oft
  kommt eine Fähigkeit —, und wer sie verschiebt, ändert das Spielgefühl an
  einer Stelle, an der niemand ein Problem gemeldet hat. Der Preis gehört an
  den Schalter, nicht an die Häufigkeit.

**Warum die Zeichen jetzt auch in der Bibliothek stehen:** Am Vorrat sagt das
Pluszeichen, was JETZT gilt (`behaeltZug`, seit v0.41). Wer es dort zum ersten
Mal sieht, weiss aber nicht, was es heisst. In der Bibliothek steht deshalb
dasselbe Zeichen samt Erklärung an jedem Eintrag — nicht nur einmal in einer
Legende ganz oben, denn wer dort nachschlägt, sucht genau diese eine Fähigkeit.
Der Unterschied bleibt erhalten: Die Bibliothek zeigt die EIGENSCHAFT, der
Vorrat die LAGE.

**Nachtrag v0.48: Dieser letzte Absatz ist zurückgenommen.** Der Unterschied
zwischen Bibliothek und Vorrat war der Fehler, nicht die Lösung — siehe unten.

## Die Zeichen gehören der Fähigkeit, nicht der Lage (v0.48)

Vom Nutzer, wörtlich: *„Das Plus und der Blitz sollen für jeden Spieler immer
und überall ein Indikator sein … man soll in seinem Fähigkeiten-Inventar immer
das Zeichen sehen, auch bei gegnerischen Items."*

Das kehrt die Entscheidung von v0.41 um, das Pluszeichen an `behaeltZug` zu
hängen. Sie war für sich genommen richtig — im Gegnerzug versprach ein festes
Zeichen einen Zug, den es nicht gab. Nur war der Preis höher als der Gewinn:

- Bei den Fähigkeiten des Gegners stand nie ein Zeichen. Wer wissen wollte, was
  auf ihn zukommt, sah nichts.
- Am eigenen Vorrat kam und ging es im Takt der Züge. Ein Merkmal, an dem man
  eine Fähigkeit wiedererkennt, darf nicht flackern.

**Ein Zeichen sagt jetzt, was die Fähigkeit IST. Was gerade geht, sagt der
Satz** — im Einsetzen-Dialog, wo Platz für „du bist gerade nicht dran" ist.
`SCHACH_RUNDE.behaeltZug` bleibt dafür bestehen und wird weiter geprüft; es hat
nur seinen Platz gewechselt, vom Zeichen zum Text.

Daraus folgt der zweite Teil: **Jede Marke ist ein Knopf.** Eine Fähigkeit, die
man nicht einsetzen darf, zeigt beim Antippen Beschreibung, Kosten und die
abgespielte Anleitung — dieselbe wie beim Einsetzen. Vorher war sie ein totes
Schildchen, und die einzige Auskunft stand in der Bibliothek.

## Sprung und Teleport SIND der Zug (v0.48)

Vom Nutzer: *„Einsetzen bedeutet, dass man Einsetzen drückt, dann den besonderen
Move macht, und dann soll der Zug vorbei sein — bei der Fähigkeit soll kein Plus
stehen."*

Damit ist auch der zweite Teil von v0.47 korrigiert. Der Preis war richtig
angesetzt (ein Springerzug obendrauf ist zu viel), der Weg dorthin nicht:
`beendetZug` gibt den Zug ab, die Wirkung kommt erst eine Runde später. Aus
„Sprung" wurde dadurch „Sprung, aber erst nachdem der Gegner gezogen hat" — und
der Gegner sah es kommen.

Gebaut ist es als dritter Schalter `istDerZug` neben `beendetZug` und
`imGegenzug`. Er tut zwei Dinge auf einmal:

1. **Man bleibt am Zug** und macht ihn sofort.
2. **Nur das Muster zählt** (`stand.zusatzNurDieses`). Ohne diesen zweiten Teil
   wäre die Fähigkeit ein Geschenk: Man könnte sie einsetzen und trotzdem ganz
   normal ziehen.

Der Preis ist also derselbe wie mit `beendetZug` — der eigene Zug —, er wird nur
sofort bezahlt statt auf Kredit.

**Was dabei herauskam:** Eine Fähigkeit, die den Zug an sich zieht, kann
scheitern. Wer nur noch springen darf und kein Sprungfeld frei hat, wäre am Zug,
ohne einen zu haben — `SCHACH.alleZuege` läse das als Schachmatt. Das Einsetzen
wird deshalb abgewiesen, die Fähigkeit bleibt im Vorrat. Dieselbe Falle wie
schon zweimal zuvor (v0.41 und v0.47): Eine Fähigkeit, die sich verbraucht,
ohne zu wirken.

## Warum die Wiedergeburt nur noch episch ist (v0.48)

Auf Ansage des Nutzers, und sie fügt sich in die Regel von v0.47: Die Stufe sagt,
wie oft etwas kommt. Legendär waren fünf Fähigkeiten, und die Wiedergeburt war
unter ihnen die schwächste — sie setzt eine Figur auf die eigene GRUNDREIHE,
also weit weg vom Geschehen, während die Wiederbelebung sie dorthin
zurückbringt, wo sie fiel, und der Friedhof gleich vier auf einmal holt. Eine
legendäre Ziehung, die sich wie eine epische anfühlt, entwertet die Stufe.

## Wie lange eine Wirkung hält, steht jetzt dabei (v0.48)

Vom Nutzer: *„Überall, wo ein paar Runden steht, sollst du dir überlegen, was am
fairsten ist … und lege eine Zahl fest und schreibe sie mit dazu."*

Nachgerechnet wurde jede zeitlich begrenzte Wirkung; **verändert wurde keine**.
Die eingestellten Werte sind ausgewogen — sie standen nur nirgends:

| Wirkung | Dauer | Warum sie passt |
|---|---|---|
| Mauer | 6 Halbzüge | Je drei eigene Züge für beide Seiten. Lang genug, um einen Angriff zu stoppen, kurz genug, dass man nicht einfach dahinter wartet. |
| Friedhof | 8 Halbzüge | Vier eigene Züge, um vier geliehene Figuren zu nutzen — einer je Figur. Weniger wäre geschenkt, mehr wäre die Partie. |
| Volles Glas | 8 Halbzüge | Reine Sicht, keine Regel. Vier eigene Züge sind lästig, aber nicht ruinös. |

## Der Unglückswürfel ist kein Gesetz mehr, sondern ein Haken (v0.49)

Bis v0.48 stand in `CLAUDE.md`: *„Dass es ein UNGLÜCKSwürfel ist, wird dagegen
immer gezeigt (umgedrehtes Fragezeichen)."* Vom Nutzer, auf Rückfrage: *„Es soll
keine eiserne Regel sein, das ist nur noch so, wenn man den Haken drückt; wenn
man ihn grau lässt, werden die Unglücksboxen nicht unterscheidbar."*

Damit ist die Regel zur Vorgabe geworden: Der Haken heisst **Unglückswürfel
anzeigen** und ist wie alle Haken standardmässig aus. Auch Partien von vor v0.49
zeigen das Unglück ab jetzt nicht mehr (`pechZeigen` liest `=== true`, nicht
`!== false`) — es ist reine Anzeige und rührt an keine Regel.

**Was beim Bauen herauskam: Es waren nie zwei Fragen, sondern eine.** Die
Sichtbarkeit des Unglücks hing am Haken „Seltenheit anzeigen" mit dran:

    zeigen ? stufe : STUFE_UNBEKANNT      // die Farbe
    zeigen && bonusHier.pech              // das umgedrehte Fragezeichen

Wer die Farben sehen, aber nicht vorgewarnt werden wollte, hatte keine
Einstellung dafür. Jetzt sind es zwei: `seltenheitZeigen` beantwortet „welche
FARBE", `pechZeigen` „steht das Fragezeichen auf dem KOPF". Alle vier
Kombinationen ergeben Sinn.

Unangetastet bleibt die eiserne Regel darüber: **WELCHE Fähigkeit in einem
Würfel steckt, verrät die Oberfläche nie** — auch nicht im Titel beim
Darüberfahren.

## Zwei Könige sind zwei Leben (v0.49, Spielart „Zufallsarmee")

Vom Nutzer: *„Baue es so um, dass egal welcher König zuerst geschlagen wird, der
zweite ins Schachmatt gestellt werden muss — also so wie zwei Leben."*

Das war die offene Frage aus der Triage. Zwei Könige je Seite gab es bisher nur
im Doppelbrett, und dort über `koenigSchlagbar`: **kein Schach und kein Matt,
für das ganze Brett, die ganze Partie.** Wer keinen König mehr hat, verliert. Das
ist eine andere Regel als „zwei Leben" — sie kennt das Schachmatt gar nicht.

Gebaut ist es deshalb als **Frage an die Stellung, je Farbe**:

    SCHACH.koenigSchlagbarFuer(stand, farbe)

Sie hat zwei Quellen. `koenigSchlagbar` ist eine Eigenschaft des BRETTS und
antwortet immer gleich. `koenigeAlsLeben` ist eine Eigenschaft der STELLUNG:
Solange die Farbe mehr als einen König hat, ist ihr König eine Figur wie jede
andere — er wird geschlagen, sie kann nicht ins Schach kommen und nicht mattgesetzt
werden. Beim letzten kippt es zurück, und zwar mitten in der Partie.

**Warum je Farbe und nicht je Brett:** Weiss kann zwei Könige haben und Schwarz
einen. Dann muss beides gleichzeitig gelten — Weiss kennt kein Schach, Schwarz
schon. Eine Antwort fürs ganze Brett könnte das nicht abbilden. Betroffen sind
genau drei Stellen (`imSchach`, der Schlagfilter in `zuege`, der Selbstschach-Filter
in `zuege`), und alle drei fragen jetzt nach der jeweils gemeinten Farbe.

**Warum acht Figuren:** Das ist keine gewählte Zahl. Der Nutzer wollte „König +
7 weitere" und „links und rechts jeweils 2×2 Felder frei". Auf dem 8er-Brett
bleiben bei zwei freien Spalten je Seite genau vier Spalten mal zwei Grundreihen
— acht Felder. Ein Feld, eine Figur; die Vorgaben passen exakt zusammen.

**Warum höchstens eine Dame:** Beide Seiten ziehen unabhängig. Ohne Grenze zieht
eine Seite gelegentlich zwei oder drei Damen, und gegen sieben Bauern ist das
keine Partie mehr, sondern ein Ergebnis. Was darüber hinaus gezogen wird, wird
zum Turm. Die Schwankung an sich bleibt — sie ist der Sinn der Spielart.

**Warum keine Rochade:** Sie wird aus der Stellung gelesen (König auf seinem
Startfeld, Turm auf derselben Grundreihe). Bei einer gewürfelten Aufstellung ist
„das Startfeld des Königs" nur noch Zufall, und mit zwei Königen wäre nicht
einmal klar, wessen Recht gemeint ist.

## Frost und Fessel mussten sich unterscheiden (v0.56)

Bis v0.55 taten beide fast dasselbe: Eine Figur steht einen Zug lang still. Der
ganze Unterschied war „unantastbar ja/nein" — zu wenig, um zwei Plätze auf der
epischen Stufe zu rechtfertigen. Wer beide im Vorrat hatte, hatte faktisch
zweimal dieselbe Karte.

Seither trennen sie sich in **beiden** Achsen, und zwar über Kreuz:

| | Fläche | Dauer | Opfer schlagbar? |
|---|---|---|---|
| Frost | 2×2-Block | ein Zug | nein |
| Fessel | ein Feld | vier Halbzüge | ja |

Damit beantworten sie zwei verschiedene Fragen. Der Frost ist die **Notbremse**:
Er hält kurz eine ganze Ecke des Bretts an, kostet dafür aber auch die eigenen
Figuren darin. Die Fessel ist die **Vorbereitung**: Sie nagelt eine Figur fest,
lange genug, um sie in Ruhe anzugreifen.

**Warum der Frost auch die eigenen Figuren trifft** (Nutzer-Entscheidung
08.08.): Vier Felder sind viel. Ohne diesen Preis wäre er auf einem vollen
Brett fast immer der beste Zug — man legt ihn über die dichteste Stelle und
nimmt mit, was darin steht. Dass die eigenen mit einfrieren, macht aus der
Fähigkeit eine Zielübung.

**Warum ein leeres Feld im Block trotzdem nichts sperrt.** Beim Bauen war es
zuerst andersherum, weil die Prüfung nur „liegt das Feld im Block?" fragte. Das
Ergebnis war eine Mauer, die man zusätzlich über den Gegner legen kann — eine
zweite Fähigkeit im Bauch der ersten. Der Frost hält FIGUREN fest; Flächen
sperrt die Mauer, und die gehört bewusst keiner Seite.

**Warum die Fessel eine Uhr braucht und der Frost nicht.** „Ein Zug" lässt sich
an der Farbe ablesen (`frostFarbe` zieht, also ist es vorbei). „Mehrere Züge"
geht nur mit einem Zähler, und der einzige brauchbare ist `takt` — `halbzuege`
springt bei jedem Bauernzug auf 0 zurück und hätte die Fessel unsterblich
gemacht. Dieselbe Falle wie bei den Mauern in v3.5.

## Warum aus der Verstärkung eine Kette wurde (v0.56)

Die alte Verstärkung machte aus einem Bauern einen Springer: plus zwei Punkte
Material, immer derselbe Handgriff, und in der Endphase ohne Bauern wertlos.
Für eine epische Fähigkeit war das wenig, und interessant war sie nie.

Als Kette (Bauer → Springer → Läufer oder Turm → Dame → König) hat sie eine
Eigenschaft, die keine andere hat: **Sie ist überall einsetzbar, aber der
Gewinn hängt davon ab, worauf man sie legt.** Auf einen Bauern gibt sie zwei
Punkte, auf einen Turm vier. Das ist eine Entscheidung, kein Handgriff.

**Warum der König das obere Ende ist und was das kostet.** Ein zweiter König
wäre normalerweise ein unschlagbarer Klotz, und „Schachmatt" wäre nicht mehr
eindeutig. Deshalb setzt die Aufwertung `koenigeAlsLeben` im Stand — die
Maschinerie aus v0.49, die für die Zufallsarmee gebaut wurde: Solange eine
Seite mehr als einen König hat, kennt SIE kein Schach und kein Matt, und ihre
Könige sind gewöhnliche Figuren. Es war keine neue Regel nötig, nur ein
Schalter an der richtigen Stelle.

**Warum es zurück geht.** Zwei Leben sind nicht immer das Richtige — wer
angreifen muss, braucht Material, keinen zweiten König. Deshalb tauscht man
einen von zweien gegen zwei Damen ein. Der Rücktausch ist zugleich die Sperre,
die den letzten König schützt: Er verlangt, dass **zwei** dastehen.

**Was zu beobachten ist:** Die Kette ist ein deutlicher Machtzuwachs. Wenn sie
zu stark wird, gilt die Regel von v0.47 — man kürzt die Kette oder nimmt der
Fähigkeit etwas weg, aber man verschiebt nicht ihre Stufe.

## Warum der Bauernschub sein Pluszeichen verloren hat (v0.56)

Gemeldet vom Nutzer: „zu stark". Der Grund ist die Kombination, nicht die
Fähigkeit selbst — erst alle acht Bauern vorschieben, dann mit einem davon
schlagen. Das sind zwei Züge für eine Fähigkeit, und keine andere kann das.

Nach Gruppe 3 der Einpreisungs-Regel (v0.47) hätte er das Plus behalten
müssen: Er ändert ja nur die Stellung. Der zweite Satz derselben Regel gewinnt
aber: **Wird eine Fähigkeit zu stark, nimmt man ihr das Pluszeichen — nicht
ihre Stufe.** Er ist damit der erste dokumentierte Anwendungsfall dieses
Satzes, und deshalb steht er in der Tabelle als eigene Zeile statt in Gruppe 1.

**Der Ausgleich ist die Umwandlung.** Bis v0.55 wurden geschobene Bauern auf
der letzten Reihe stillschweigend zu Damen — ein verstecktes Geschenk, das
niemand angefordert hatte. Jetzt fragt die App einmal für alle, welche Figur
es sein soll. Einmal, nicht je Bauer: Fünf Rückfragen hintereinander wären
Bedienlast ohne Entscheidungswert, denn man wählt ohnehin fast immer dasselbe.

## Warum der Vorschau-Kasten angetippt und nicht gezogen wird (v0.57)

Der Wunsch lautete wörtlich: ein grüner Kasten, den man auf die Fläche ZIEHT,
dann bestätigen. Gebaut ist er zum Antippen. Der Grund liegt am Gerät, auf dem
gespielt wird:

- **Ziehen kämpft mit dem Scrollen.** Ein Fingerzug über das Brett ist für den
  Browser erst einmal eine Wischgeste. Um daraus ein Verschieben zu machen,
  muss man das Scrollen während der Berührung abschalten — und wer dann
  daneben greift, hat eine Seite, die sich nicht mehr bewegt.
- **Der Finger verdeckt das Ziel.** Genau das Feld, das man treffen will, liegt
  unter der Fingerkuppe. Beim Loslassen sitzt der Kasten oft ein Feld daneben,
  und man merkt es erst danach.

Antippen löst dasselbe Problem — man sieht vor dem Bestätigen, wohin die
Wirkung geht — und ist auf jedem Gerät gleich zuverlässig. Der ursprüngliche
Zweck bleibt also erfüllt; nur der Weg dorthin ist ein anderer.

Der gewohnte Doppeltipp geht weiterhin durch: Zweimal auf dasselbe Feld setzt
sofort ein. Wer die Fähigkeit kennt, wird dadurch nicht ausgebremst.

## Warum eine Leihgabe erst zählt, wenn man wieder am Zug ist (v0.57)

Beim Bau der Staffel „je stärker, desto kürzer" (Dame 2 Halbzüge) kam beim
Nachmessen heraus, dass die Dame **nie zum Zug kam**: Der Friedhof gibt den Zug
ab, danach zieht der Gegner — und beim Hochzählen des Takts war sie schon
zerfallen. Sie hätte ein Feld blockiert, mehr nicht.

Die Tabelle war richtig, der Nullpunkt nicht. Deshalb steht neben
`SCHACH.LEIHDAUER` jetzt `LEIHGABE_VORLAUF: 2` — die zwei Halbzüge, die
zwischen dem Aufstehen und dem ersten eigenen Zug immer liegen. Die Zahlen in
der Tabelle bedeuten damit das, was sie versprechen: *so viele Halbzüge,
nachdem du wieder dran bist.*

Wer eine weitere Fähigkeit mit Leihgabe baut, prüft zuerst, ob sie den Zug
abgibt. Tut sie es nicht, ist der Vorlauf falsch.

## Warum ein Zug unterwegs enden kann (v0.58)

Beim Stellen der Erdbeben-Anleitung stand hier zuerst das Gegenteil: Die Regeln
brechen einen Zug nicht ab, der Würfel wirkt danach — die Szene wurde
entsprechend umgeschrieben. Der Nutzer hat widersprochen, und zu Recht:

> Ein Zug soll durch so einen Einsatz abgebrochen werden. Der Würfel erschafft
> das Loch, sobald er eingesammelt wird, und wenn auf dem weiteren Weg dieses
> Loch ihm den Weg versperrt, soll der Zug davor abgebrochen werden.

Das ist die konsequente Fortschreibung von **„Berühren heisst Einsammeln"**
(v0.53): Wenn ein Würfel schon im Vorbeiziehen wirkt, dann wirkt er eben
mitten im Zug — und ein Loch, das dabei vor der Figur aufgeht, ist ein Loch,
kein Schönheitsfehler. Ein Turm, der ungerührt darüber hinweggleitet, weil die
Engine den Zug lieber am Stück abrechnet, ist die schlechtere Regel.

**Was dabei NICHT angefasst wurde: `SCHACH.zuege`.** Als der Zug gewählt wurde,
war der Weg frei; die Sperre entsteht erst währenddessen. Eine Zugerzeugung,
die das vorhersagen müsste, müsste den Inhalt jedes Würfels kennen — und der
entscheidet sich absichtlich erst beim Einsammeln (siehe „Warum sich der
Würfel-Inhalt erst beim Einsammeln entscheidet"). Der Abbruch ist deshalb eine
Nachwirkung des Zuges, kein Filter davor.

**Drei Festlegungen halten die Regel zusammen:**

- **Ein Riss zählt erst ab dem Feld des Würfels.** Was hinter der Figur
  aufgeht, hat sie längst passiert. Ohne diese Einschränkung blieb der Turm im
  ersten Bauversuch auf seinem Startfeld stehen — das Erdbeben hatte zufällig
  auch ein Feld hinter ihm erwischt.
- **Der Schlag fällt mit aus.** Sonst wäre der Abbruch ein Angriff aus der
  Ferne: Die Figur bliebe unterwegs stehen, und der Gegner hätte trotzdem eine
  Figur verloren.
- **Die Figur endet nie AUF einem Riss.** Gesucht wird rückwärts das letzte
  freie Feld; findet sich keines, bleibt der Zug lieber, wie er war. Eine Figur
  ohne Feld wäre schlimmer als ein Zug zu viel.

## Warum die Ansicht sich nur EINMAL dreht (v0.72)

Mit vier Armeen auf dem Kreuz brauchte die Ansicht vier Lagen statt zwei. Die
naheliegende Umsetzung wäre gewesen, sie laufend nachzuführen — immer so, dass
die Armee unten steht, die gerade wichtig ist. Der Nutzer hat es am 13.08.
anders entschieden: **einmal zu Beginn, dann nie wieder.** Es reicht, dass EINE
der eigenen Armeen unten steht; wo die zweite landet, ergibt sich daraus (bei
vier Armeen gegenüber).

Der Grund ist Orientierung: Ein Brett, das sich während der Partie dreht, macht
jede gemerkte Stellung wertlos. „Meine Dame steht links unten" muss den ganzen
Abend gelten.

**Damit gehört die Lage dem GERÄT, nicht der Partie.** Sie hängt allein an der
Farbe, in der man spielt, und wird nirgends gespeichert — zwei Spieler
desselben Teams sehen dasselbe, ein Zuschauer sieht das Brett wie Weiss.

**Warum die Startseite trotzdem im Stand steht.** Die Lage liesse sich aus den
Bauern ablesen (`bauernSeiten`, seit v0.65). Nur: Wer keine Bauern mehr hat,
fiele auf die Farbregel zurück — die Ansicht drehte sich mitten in der Partie,
sobald der letzte Bauer fällt. Deshalb schreibt `kreuzAufstellen` die Seiten je
Farbe einmalig in den Stand (`startSeiten`). Für Partien, die davor angelegt
wurden, bleibt der Rückfall über die Bauern.

## Warum das Kreuz-Duell die Startseite auslost (v0.72)

Beim Kreuz mit vier Armeen wird gezogen, welches Team das senkrechte Paar
bekommt. Mit nur einer Armee je Team (K3) wäre die naheliegende Wahl gewesen,
Weiss wie gewohnt unten zu lassen. Dagegen sprach der Zweck dieser Bretter: Die
beiden leeren Streifen sind der Umweg, der sie von einem gewöhnlichen Brett
unterscheidet — und der ist nur interessant, wenn nicht jede Partie gleich
aussieht.

Ausgelost wird deshalb die eine Startseite von Weiss; **Schwarz bekommt immer
die gegenüberliegende.** Zwei Armeen über Eck (etwa oben und links) wären kein
Schach mehr: Die Bauern liefen aneinander vorbei, und die Umwandlungsreihe der
einen Seite wäre die Startreihe der anderen.

Ein König je Team heisst dabei: **kein `koenigeAlsLeben`.** Schach und Matt
gelten von der ersten Sekunde an — anders als beim Kreuz mit vier Armeen, wo
zwei Könige zwei Leben sind.

## Warum aus zwei Schaltern vier Stufen wurden (v0.71)

Bis v0.70 beantworteten zwei Einstellungen dieselbe Frage: der Haken
**Lootbox-Regen** (v0.50) und der Schieberegler **Wie früh es regnet** 1 bis 5
(v0.60). Wer wissen wollte, wie viele Lootboxen kommen, musste beide
zusammendenken — und ohne den Haken tat der Regler ohnehin nichts. Der Wunsch
vom 13.08. macht daraus eine Frage mit vier Antworten: **wenig / normal /
viele / Regen**.

**Drei Dinge waren dabei zu entscheiden:**

- **Was „wenig" heisst.** Der Wunsch beschreibt es als „so viel wie heute ohne
  Regen-Haken (höchstens drei je vollem Zug)". Das war eine Beschreibung des
  IST-Zustands — nur stimmte sie nicht: Seit v0.52 kommt Nachschub nach jedem
  HALBZUG. Gebaut ist die Stufe so, wie der Nutzer sie beschrieben hat (nach
  jedem vollen Zug), nicht so, wie der Code sie hatte. Sonst wäre der
  Unterschied zur nächsten Stufe („auch nach Halbzügen") gar keiner gewesen —
  und die Leiter hätte unten keine Sprosse. Der Preis steht im `CHANGELOG.md`:
  Eine neue Partie mit „wenig" bekommt etwa halb so oft Nachschub wie bisher
  ohne Regen-Haken; wer die gewohnte Menge will, nimmt „normal".
- **Dass keine Stufe die darunter unterbietet.** Die drei oberen Stufen hängen
  am Füllstand, und auf vollem Brett steht ihre Kurve fast bei null — früh in
  der Partie hätte „normal" also WENIGER geliefert als „wenig". Deshalb nehmen
  `mengenChance` und `mengenAnzahl` immer das Grössere von Grundrauschen und
  Kurve. Nebeneffekt: Die offene Frage aus v0.60 („ist die flachste Stufe
  überhaupt spürbar?") ist damit beantwortet.
- **Dass die alten Felder stehen bleiben.** `regen` und `regenStufe` stecken in
  jeder laufenden Partie. Sie werden weiter geschrieben (aus der Stufe
  abgeleitet) und beim Lesen umgekehrt zur Stufe verrechnet, wenn eine Partie
  sie noch nicht kennt. So spielt jede laufende Partie unverändert weiter, und
  ein Gerät, das noch eine ältere Fassung im Zwischenspeicher hat, spielt nicht
  nach ganz anderen Zahlen.

## Warum es von Anfang an Tabs gibt

Ursprünglicher Wunsch: ein Tab **Würfel Quizz** als „derzeit einziger". Das
Register kostet wenige Zeilen und erspart später den Umbau der Seite.

## Warum das Ändern der PIN die alte verlangt

Ohne diese Rückfrage wäre die PIN wertlos: Wer ein kurz unbeaufsichtigtes Handy
in die Hand bekommt, ist dort ohnehin schon angemeldet — er könnte einfach eine
neue PIN setzen und den Zugang dauerhaft übernehmen. Mit der Rückfrage bleibt
der ursprüngliche Besitzer der Einzige, der sie ändern kann.

Wer seine PIN wirklich vergessen hat, wird von der Verwaltung entfernt und
meldet sich neu an. Das ist der bewusst einzige Weg — ein Zurücksetzen durch die
Verwaltung wäre bequemer, würde aber bedeuten, dass ein Passwort im Umlauf jeden
Zugang öffnet.
