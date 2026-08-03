# Entscheidungen

Warum das Projekt so aussieht, wie es aussieht — und was bewusst NICHT gebaut
wird. Die Liste dessen, was noch kommt, steht in [../ROADMAP.md](../ROADMAP.md).

## Teuer erkaufte Erkenntnisse

### Mitspieler verschwanden wieder aus der Runde (v0.8)

**Was zu sehen war:** Beim Betreten der Seite kam der Anmelde-Dialog mehrfach
hintereinander — es sah aus, als lade die Seite zwei- bis dreimal neu. In der
Datenbank tauchte derselbe Name mit wechselnden Kennungen auf.

**Die Ursache lag woanders als das Symptom.** Geschrieben wird immer der GANZE
Stand, und der zuletzt geschriebene gewinnt. Meldete sich jemand an, während ein
zweites Gerät noch den alten Stand im Speicher hatte, löschte dessen nächster
Schreibvorgang den neuen Spieler wieder. Auf dem betroffenen Gerät fand
`zeichnen()` den eigenen Spieler nicht mehr, meldete ab und startete die
Anmeldung neu — bei mehreren Geräten reihum, also mehrfach.

**Die Lehre:** „Letzter gewinnt" ist für ein Feld harmlos, für eine Liste von
Teilnehmern nicht. Sobald mehrere Geräte denselben Datensatz schreiben, braucht
es eine Regel, wem welcher Teil gehört. Hier: **Jeder ist Herr über seinen
eigenen Eintrag, alles andere kommt vom Server** (`MODELL.zusammenfuehren`,
angewandt in `abgleich.js` unmittelbar vor dem Schreiben). Das passt, weil jeder
ohnehin nur sich selbst ändert — auch die eigenen Vermutungen stehen im eigenen
Eintrag. Ausgenommen sind Aktionen, die absichtlich fremde Einträge ändern
(neue Runde, Spieler entfernen); die schreiben mit `global = true`.

**Zweite Lehre aus demselben Fehler:** Ein Symptom wie „lädt dreimal neu" muss
man erst in eine überprüfbare Beobachtung übersetzen (hier: dieselbe Person mit
wechselnden Kennungen in der Datenbank), bevor man am Code sucht. Der Blick in
die Datenbank hat die Ursache gezeigt, nicht das Lesen des Startcodes.

### Der Tab Team Schach blieb leer (v1.2)

**Was zu sehen war:** Der neue Tab zeigte gar nichts — kein Brett, keine Teams,
keine Meldung. Die Datenbank war korrekt freigegeben, die Dateien wurden
ausgeliefert, die Tests grün.

**Die Ursache liegt im Zusammenspiel zweier für sich richtiger Regeln:**

1. `tabs.js` baut das Gerüst eines Tabs erst auf, wenn er zum ersten Mal
   geöffnet wird (spart Arbeit für nie geöffnete Tabs).
2. `abgleich.js` zeichnet nur, wenn sich Daten ändern (spart Neuaufbauten).

Beim Start lädt der Schach-Abgleich seinen Stand und ruft `zeichnen` — zu einem
Zeitpunkt, an dem `wurzelEl` noch `null` ist, weil der Tab nie geöffnet wurde.
Der Aufruf verpufft folgenlos. Klickt man den Tab später an, entsteht zwar das
Gerüst, aber niemand zeichnet mehr hinein: Es ändert sich ja nichts.

**Die Lehre:** Wo ein Bereich verzögert entsteht, braucht er einen eigenen
Anlass zum Zeichnen — es reicht nicht, sich auf Datenänderungen zu verlassen.
Dafür gibt es jetzt `beimOeffnen()`; `tabs.js` ruft es bei **jedem** Wechsel,
nicht nur beim ersten. Beim Würfel-Quizz fiel das nie auf, weil er der erste Tab
ist und deshalb schon aufgebaut war, bevor die Daten kamen.

**Zweite Lehre:** Automatische Tests hätten das nicht gefunden — sie decken
Regeln und Daten ab, nicht die Reihenfolge, in der Bildschirmteile entstehen.
Genau dafür gibt es die Prüfliste in `docs\DEPLOYMENT.md`; ein neuer Tab gehört
dort mit einem eigenen Punkt hinein.

### Die Fähigkeiten-Karte fehlte bei zugeschalteten Würfeln (v3.3, gefunden v3.4)

**Was zu sehen war:** In einer klassischen Partie mit gesetztem Haken
„Zufalls-Würfel" erschienen die Würfel auf dem Brett, das Einsammeln
funktionierte — aber die Karte unter dem Brett, in der die eingesammelten
Fähigkeiten stehen und eingesetzt werden, kam nie. In der Spielart „Fähigkeiten
sammeln" war alles da.

**Die Ursache:** `TEAM_SCHACH._faehigkeitenBauen` fragte
`SCHACH_RUNDE.varianteVon(partie).faehigkeiten` — also die **Spielart**. Seit
v2.5 entscheidet aber der Schalter der **Partie** (`regeln.faehigkeiten`), und
die einzige Stelle, die beide Fälle kennt, ist `SCHACH_RUNDE.faehigkeitenAn`.
Das Modell benutzte sie überall (`_bonusNachziehen`, Einsammeln, Einsetzen),
nur der eine Bildschirm-Zweig war beim Einbau des Schalters nicht mitgezogen
worden. Deshalb war das Bild so widersprüchlich: Alles Gerechnete lief richtig,
nur das Anzeigen fiel weg.

**Die Lehre:** Wird eine Eigenschaft der Spielart durch einen Schalter der
Partie überschreibbar gemacht, ist jeder direkte Zugriff auf die Spielart ein
Fehler — auch im Bildschirm-Code. Die Frage gehört an genau eine Stelle
(`faehigkeitenAn`), und beim Einbau eines solchen Schalters wird nach allen
alten Zugriffen gesucht, nicht nur nach denen im Modell.

**Zweite Lehre:** Die Bildschirm-Tests legten ihre Partien alle über
`SCHACH_TAFEL.partieAnlegen` ohne `regeln` an — damit gab es die Kombination
„klassisch mit Würfeln" im Test gar nicht. Ein Schalter braucht einen Test in
**beiden** Stellungen; `tests\test-bildschirm.js` prüft jetzt genau das.

### Der hinterlegte Zugriffsschlüssel ließ sich nicht mehr lesen (v0.8)

Beim ersten scharfen Lauf von `Deploy-Quizz.ps1` kam
`The input string ' ' was not in a correct format`. Der Schlüssel war korrekt
abgelegt (812 Hex-Zeichen), aber `Set-Content` hängt beim Schreiben einen
Zeilenumbruch an — und `ConvertTo-SecureString` kann damit beim Lesen nichts
anfangen.

**Lehre:** Für Werte, die zeichengenau zurückgelesen werden müssen, nie
`Set-Content` verwenden, sondern `[System.IO.File]::WriteAllText(...)`. Beim
Lesen zusätzlich `.Trim()`, damit ältere oder von Hand erzeugte Ablagen weiter
funktionieren. Dieselbe Falle ist im Haus schon einmal beim Schreiben von
LF-Dateien aufgetreten.

Jede weitere nicht offensichtliche Bug-Ursache gehört hierher, bevor die
Sitzung endet.

Diese Fallen aus anderen Projekten des Hauses gelten hier von Anfang an:

- **Typografische Anführungszeichen in JavaScript-Zeichenketten sind eine
  Fehlerquelle.** Ein falsch gewähltes schließendes Zeichen beendet die
  Zeichenkette nicht wie gedacht und zerlegt die Datei. Deshalb: in
  JavaScript-Texten keine typografischen Anführungszeichen — Sätze werden
  umformuliert. `tests\test-syntax.js` fängt den Fall inzwischen ab.
- **PowerShell-Skripte nur mit ASCII-Anführungszeichen.** Nach jeder Änderung
  parse-checken: `[System.Management.Automation.Language.Parser]::ParseFile()`
  muss null Fehler liefern.
- **OneDrive synchronisiert im Hintergrund.** Größere Dateien vor dem Editieren
  sichern und den geänderten Bereich danach erneut lesen.

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

## Warum die Abstimmung eine Frist braucht

Mit „Team muss sich einig sein" konnte ein Team komplett stillstehen: Zwei
Leute, einer hört auf mitzuspielen — und der andere kann nie wieder ziehen. Das
ist kein theoretischer Fall, sondern der Normalfall bei einer Partie über
mehrere Tage.

Deshalb läuft die Abstimmung jetzt gegen die Uhr: zehn Sekunden, dann gilt der
Vorschlag. Wer **zweimal** nicht abstimmt, verkürzt sie auf fünf, dann auf drei
Sekunden — und sobald er wieder mitstimmt, gilt wieder die volle Zeit. Die
Staffelung bestraft also nicht das einmalige Verpassen, sondern nur das
dauerhafte Fernbleiben.

Die Frist steht **im gemeinsamen Stand**, nicht in jedem Browser: Sonst liefe
sie auf jedem Gerät anders, und wer eine langsame Verbindung hat, wäre immer der
Säumige. Ausgelöst wird sie vom ersten Gerät, das den Ablauf bemerkt; die
Zugzähler-Prüfung sorgt dafür, dass sie trotzdem nur einmal greift.

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

## Warum es von Anfang an Tabs gibt

Ursprünglicher Wunsch: ein Tab **Würfel Quizz** als „derzeit einziger". Das
Register kostet wenige Zeilen und erspart später den Umbau der Seite.

## Bewusst abgelehnt

| Idee | Warum nicht |
|---|---|
| Anmeldung mit Passwort/Konten | Widerspricht dem Zweck: Seite aufrufen, Namen eintragen, dabei sein. |
| Verschlüsselung der ganzen Runde | Der Schlüssel müsste in der öffentlichen Seite stehen — Scheinsicherheit. Für die Würfel löst das Siegel das Problem richtig. |
| Punkte nach Position (richtiger Wert an richtiger Stelle) | Fünf gewürfelte Würfel haben keine Reihenfolge. |
| Gemeinsames Auflösen für alle auf Knopfdruck | Bis v0.2 so gebaut, auf Wunsch ersetzt: Jeder deckt nur sich selbst auf. Das Feld `phase` bleibt als Altbestand im Datenvertrag, ohne Wirkung. |
| Automatisches Auflösen zu einer festen Uhrzeit | Mehr Technik als Nutzen; jeder deckt auf, wann er will. |
| Chat oder Fragenprotokoll in der App | Die Fragen stellt man sich im echten Leben — genau das ist das Spiel. |
| Emojis für die Würfelwerte | Haus-Regel. |

## Braucht eine Nutzer-Entscheidung (nicht ungefragt bauen)

- **Firebase-Konto anlegen und Adresse eintragen** — bis dahin läuft die App im
  lokalen Rückfall (Hinweisbalken oben), und Mitspielen ist nicht möglich.
- **Regeln der Datenbank**: offen für alle (heute nötig) oder später einschränken.
- **Lizenz** für das öffentliche Repository.
- Ob es eine **Runden-Historie** geben soll (heute überschreibt eine neue Runde
  die alte).
- **Wie weit „weniger Tokens" gehen soll.** Die Aufteilung grosser Dateien ist
  gemacht (v3.2). Weiter sparen ginge nur an den Kommentaren und damit an den
  Begründungen. Drei Wege stehen in `ROADMAP.md`, Punkt 2; bis zur Entscheidung
  wird nichts gekürzt.

## Warum das Ändern der PIN die alte verlangt

Ohne diese Rückfrage wäre die PIN wertlos: Wer ein kurz unbeaufsichtigtes Handy
in die Hand bekommt, ist dort ohnehin schon angemeldet — er könnte einfach eine
neue PIN setzen und den Zugang dauerhaft übernehmen. Mit der Rückfrage bleibt
der ursprüngliche Besitzer der Einzige, der sie ändern kann.

Wer seine PIN wirklich vergessen hat, wird von der Verwaltung entfernt und
meldet sich neu an. Das ist der bewusst einzige Weg — ein Zurücksetzen durch die
Verwaltung wäre bequemer, würde aber bedeuten, dass ein Passwort im Umlauf jeden
Zugang öffnet.

## Versions-Historie

### v2.0 — 2026-08-02

Die Fähigkeiten-Spielart, ausgebaut von zwei festen auf zehn erscheinende
Fähigkeiten in fünf Stufen. Der größte Eingriff ins Regelwerk seit v1.4.

Getragen hat ihn die Aufteilung in vier Arten: Zehn Fähigkeiten, aber nur vier
Mechaniken, und der Bildschirm kennt nur die vier. Die Regelarbeit steckte
weniger im Bauen als im Ausschließen — jede der drei Ausnahmen für den König
ist eine Antwort auf die Frage „was passiert damit mit Schachmatt".

Meilenstein: Voll-Backup unter `Backup\Quizz\v2.0\`.

### v1.6 bis v1.9 — 2026-08-02

Vier kleine Bauten an der Bedienung des Brettes, alle aus der Praxis gemeldet:
sichtbare Zugvorhersage (v1.6), Vorschaubilder der Spielarten (v1.7), Rochade
über den Turm samt Begründung (v1.8), Pfeil für den letzten Zug (v1.9).

Bemerkenswert daran ist, wie wenig neuer Code nötig war: Die Vorschaubilder
entstehen aus der vorhandenen Aufstellung, der Pfeil aus den vorhandenen
Verlaufsangaben. Beides sind Sachen, die es nur deshalb fast umsonst gab, weil
die Daten schon an der richtigen Stelle lagen — die Spielarten als Tabelle,
der Zugweg im Verlauf.

Einziger echter Regeleingriff: `SCHACH.rochadeLage`. Und der war nötig, weil
eine korrekte Regel als Fehler gemeldet wurde.

### v1.5 — 2026-08-01

Fähigkeiten und die Rangliste. Die Fähigkeiten waren der Teil mit den meisten
Fallen: Sie greifen mitten in die Zugerzeugung ein, und der Sprung musste auch
in `_feldBedroht` nachgetragen werden — sonst hätte der König in ein Feld ziehen
dürfen, das eine gesprungene Figur bedroht. Genau dafür gibt es dort einen Test.

Die Rangliste war dagegen klein, weil beide Spiele ihre Punkte schon selbst
rechnen konnten. Sie musste nur addieren und sortieren.

**Neu ist eine Art Test, die es hier vorher nicht gab:** `test-bildschirm.js`
baut ein winziges DOM nach und zeichnet jeden Bildschirm einmal. Anlass war der
Umfang — fünf Spielarten, zwei Ansichten, eine neue Tabelle —, den von Hand
durchzuklicken bei jeder Änderung zu viel ist. Er hat sich beim Bauen sofort
bezahlt gemacht.

Seine Grenze steht ausdrücklich in seinem Kopf: Er sagt nichts über das
Aussehen. Ein Test, dessen Grenzen nicht dabeistehen, verleitet dazu, sich mehr
auf ihn zu verlassen, als er trägt.

Meilenstein: Voll-Backup unter `Backup\Quizz\v1.5\`.

### v1.4 — 2026-08-01

Mehrere Partien nebeneinander und die Spielarten — der größte Umbau seit v1.0.

Zwei Dinge haben ihn getragen: Erstens die Trennung der Schichten aus v1.0. Die
Regeln mussten nur lernen, mit anderen Maßen zu rechnen; von Partien, Teams und
Tafel wissen sie weiterhin nichts. Zweitens die Vorgabe, dass laufende Partien
weiterlaufen — sie hat den Entwurf auf den einzig richtigen Weg gezwungen:
denselben Pfad behalten und den alten Stand erkennen, statt daneben etwas Neues
aufzumachen.

Die Umrechnungen `feldNummer`, `feldName`, `spalteVon`, `reiheVon` haben die
Maße als wahlfreie Parameter mit Vorgabe 8 bekommen. Dadurch blieb jeder
bestehende Aufruf gültig, und die 25 Regeltests aus v1.0 liefen unverändert
weiter — sie sind der Beweis, dass das klassische Schach unangetastet blieb.

### v1.3 — 2026-08-01

Aussehen und Bedienung: blaues Brett, gleitende Züge, Handy-Ansicht. Klein im
Umfang, aber mit einer Erkenntnis, die bleibt: Eine Bewegung, die nur der
Auslöser sieht, ist keine halbe Lösung, sondern eine falsche. Erst weil der Weg
im gespeicherten Verlauf steht, sehen alle dasselbe.

### v1.0 — 2026-07-31

Team Schach als zweiter Tab. Der Umbau, den es dafür brauchte, war kleiner als
erwartet: Speicher- und Abgleich-Schicht mussten nur ihre Datenfunktionen von
aussen bekommen (`leereDaten`, `inhaltGleich`, optional `zusammenfuehren`),
statt fest auf `MODELL` zu zeigen. Danach war das zweite Spiel ein Zusatz und
kein Eingriff.

Die Schachregeln liegen bewusst in einer eigenen Datei ohne jede Kenntnis von
Teams, Speicher oder Bildschirm — 25 Tests decken sie ab, die Partie mit ihren
Teams weitere 17.

Beim Aufbau ist eine Falle im eigenen Werkzeug aufgefallen: Die Aufruf-Prüfung
in `test-syntax.js` fand `SCHACH.` auch mitten in `TEAM_SCHACH.` und meldete
fünfzehn Fehler, die keine waren. Behoben mit einem Rückblick im Suchmuster.
Lehre: Ein Prüfmuster auf Bezeichner braucht immer eine Wortgrenze.

### v0.9 — 2026-07-31

Zwei Absicherungen: Die neue Runde verlangt das Verwaltungs-Passwort, und jeder
Spieler muss eine PIN haben. Beides schließt Wege, auf denen jemand ohne
Berechtigung etwas Unumkehrbares auslösen konnte.

### v0.8 — 2026-07-31

Drei Dinge auf einmal: Punktesystem mit Teilpunkten samt Erklärung unter dem
i-Knopf, die Behebung des Überschreib-Fehlers (siehe „Teuer erkaufte
Erkenntnisse") und ein Auslieferungs-Skript.

Das Punktesystem und der Fehler hängen enger zusammen, als es scheint: Beide
drehen sich darum, dass mehrere Leute gleichzeitig an einem Datensatz arbeiten.
Beim Punktestand ist das gewollt (jeder sieht denselben Stand), beim Schreiben
war es der Fehler.

Das Deploy-Skript folgt dem Haus-Muster (PowerShell, GitHub-Schnittstelle,
Token per DPAPI) und schreibt bewusst **einen einzigen Commit** für alle
Dateien: GitHub Pages baut nach jedem Commit neu und erlaubt nur wenige
Bauvorgänge je Stunde.

### v0.7 — 2026-07-31

Profil-Knopf für Name und PIN. Klein, aber er schließt eine Lücke aus v0.6: Wer
sich vertippt hatte oder anders heißen wollte, musste bis dahin von der
Verwaltung entfernt werden.

Wiederverwendet wurde `DIALOG.liste` aus der Anmeldung — dieselbe Bauform für
„wähle eines von mehreren", statt eines zweiten Menü-Musters.

### v0.6 — 2026-07-31

Beide TODO-Punkte des Nutzers umgesetzt: PIN je Spieler mit Anmeldung über eine
Mitspieler-Liste, dazu ein Verwaltungs-Zugang, der Spieler entfernen darf.

Technisch war der Kniff, dass sich das Verfahren des Würfel-Siegels
wiederverwenden ließ — dieselbe Prüfsummen-Idee, anderer Zweck. Neu ist nur,
dass das Salz hier offen liegen MUSS: Beim Siegel bleibt es geheim, weil nur der
Besitzer prüft; bei der PIN muss jedes fremde Gerät prüfen können.

Die Grenzen sind oben unter „Was die PIN leistet" ehrlich festgehalten, damit
sich niemand — auch kein späterer Claude — darauf verlässt, was sie nicht kann.

### v0.5 — 2026-07-31

Keine Regeländerung, sondern eine Korrektur der Beschriftung: Die Nummern an den
Eingabefeldern widersprachen der Zählregel. Merksatz für später — wenn der
Nutzer nachfragt, ob eine Regel wirklich so gilt, liegt der Fehler meist nicht
in der Regel, sondern in ihrer Darstellung.

Meilenstein: Voll-Backup unter `Backup\Quizz\v0.5\`.

### v0.4 — 2026-07-31

Der Nutzer wies darauf hin, dass die Mitspieler nicht im selben Netz sind,
sondern über mobile Daten spielen. An der Erreichbarkeit ändert das nichts
(GitHub Pages und Firebase liegen beide im Internet), wohl aber an der
Sparsamkeit: Die Abfrage ruht jetzt, solange die Seite im Hintergrund liegt.

### v0.3 — 2026-07-31

Zwei Wünsche des Nutzers: jeder deckt nur für sich auf, und die eigenen Zahlen
sollen sich verstecken lassen (Grundzustand verdeckt).

Der erste Wunsch klingt nach einer Vereinfachung, zieht aber eine neue Regel
nach sich: Ohne Sperre könnte man auf jemanden tippen, der schon aufgedeckt hat.
Diese Sperre sitzt jetzt im Modell. Der gemeinsame Zustand `phase` wurde damit
überflüssig — er bleibt als Altbestand im Datenvertrag stehen, wird aber nicht
mehr ausgewertet.

Der zweite Wunsch führte zu einem gezeichneten Augen-Symbol (kein Emoji) und zu
der Festlegung, den Zustand NICHT zu speichern: Nach jedem Laden ist wieder
verdeckt, sonst würde der Knopf seinen Zweck verfehlen.

### v0.2 — 2026-07-31

Aus der Tabelle wird das Spiel. Der Nutzer beschrieb den eigentlichen Zweck:
gemeinsames Raten über die Würfel der anderen mit Auflösung am Ende.

Kern der Fassung ist das Siegel — ohne es wäre das Spiel auf einer öffentlichen
Datenbank nicht spielbar, weil jeder Mitspieler die Würfel der anderen
nachschlagen könnte. Der Datenvertrag wurde auf Fassung 2 gehoben
(`zeilen` → `spieler` mit Tipps, Phase und Siegel); alte Stände werden von
`normalisieren()` übernommen. Die Oberfläche wurde von einer Tabelle auf Karten
umgestellt, weil das Spiel auf dem Handy stattfindet.

### v0.1 — 2026-07-31

Erstes Gerüst nach dem ursprünglichen Wunsch: Tabelle mit Freitext-Namen und
fünf Auswahlfeldern, Zeilen frei erweiterbar, ein Tab **Würfel Quizz**.
Aufgeteilt in Schichten, damit die Datenlogik ohne Browser testbar bleibt und
der Speicher austauschbar ist.
