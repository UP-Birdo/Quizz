# Quiz

Zwei Spiele auf einer Seite: **Würfel Quiz** (Ratespiel um verdeckte Würfel)
und **Team Schach** (Schach für zwei Mannschaften, in mehreren Spielarten und
beliebig vielen Partien gleichzeitig). Man meldet sich einmal an und ist in
beiden dabei. Ein dritter Tab, die **Rangliste**, zählt beides zusammen.

## Würfel Quiz

Ein Ratespiel unter Freunden. Jeder würfelt fünf
Würfel und hält sie geheim. Über den Tag stellt man sich gegenseitig Fragen und
trägt hier ein, was die anderen wohl gewürfelt haben. Am Abend wird aufgelöst
und gezählt, wer am besten geraten hat.

Aufrufen, Namen eintragen, loslegen — keine Anmeldung, keine Installation.

## So läuft eine Runde

1. **Anmelden.** Beim ersten Besuch fragt die Seite: *Bist du schon dabei?* —
   und zeigt die Mitspieler. Bist du neu, wählst du unten **Ich bin neu hier**,
   gibst deinen Namen ein und denkst dir eine **vierstellige PIN** aus. Spielst
   du schon mit, wählst du deinen Namen und gibst die PIN ein — so kommst du von
   **jedem Gerät** wieder als du selbst hinein.
2. **Würfel festlegen.** Trag ein, was du gewürfelt hast, und drücke
   **Würfel festlegen**. Die anderen sehen nur, DASS du festgelegt hast — nicht,
   was.
3. **Raten.** Für jeden Mitspieler gibt es fünf Felder für deine Vermutung. Die
   Reihenfolge ist egal, es zählt nur, welche Werte du tippst. Ändern kannst du
   sie jederzeit; niemand sonst sieht sie.
4. **Aufdecken — jeder für sich.** Wenn du magst, drückst du
   **Meine Würfel aufdecken**. Das gibt nur deinen eigenen Wurf frei; die
   anderen raten weiter, bis sie selbst aufdecken. Ab dem Moment kann niemand
   mehr auf dich tippen.
5. **Ergebnis.** Bei jedem, der aufgedeckt hat, stehen die echten Würfel, die
   Tipps aller anderen und die erreichten Punkte. Der Punktestand unten wächst
   mit jedem, der aufdeckt.

**Neue Runde** löscht Würfel und Vermutungen, die Mitspieler bleiben. Weil das
bei allen gleichzeitig passiert, ist dafür das Verwaltungs-Passwort nötig.

## Das Auge: eigene Zahlen verstecken

In deiner Karte sitzt ein Augen-Symbol. **Standardmäßig sind deine eigenen
Würfelzahlen verdeckt** — du siehst fünf Fragezeichen. Antippen zeigt sie,
noch einmal antippen versteckt sie wieder. Beim nächsten Öffnen der Seite ist
alles wieder zu.

Damit kannst du dein Handy weiterreichen oder daneben liegen lassen, ohne dass
jemand deinen Wurf mitliest. Zum Eintragen der Würfel machst du das Auge kurz
auf.

## Wie die Punkte vergeben werden

| Was | Punkte |
|---|---|
| Würfel genau richtig geraten | **10** |
| Würfel um 1 danebengelegen | **4** |
| Würfel um 2 danebengelegen | **2** |
| Weiter daneben | 0 |
| Bester Tipp auf eine Person (Bonus) | **5** |

Die Reihenfolge zählt nie. Zuerst werden die genau richtigen Werte verrechnet,
der Rest wird der Größe nach gepaart — immer so, wie es für dich am besten
ausgeht. Ein Wert zählt nur so oft, wie er wirklich vorkommt. Der Stern ist
keine Zahl und hat zu keiner Zahl einen Abstand: für ihn gibt es Punkte nur bei
einem genauen Treffer.

**Beispiel:** Der Wurf ist 1, 2, 3, 4, 5 und du tippst 1, 2, 3, 4, 4. Vier
Würfel sitzen genau (40 Punkte), die 4 liegt um 1 neben der 5 (4 Punkte) — macht
44 Punkte. Lag niemand näher dran, kommen 5 Bonuspunkte dazu.

Dieselbe Erklärung steht in der App hinter dem **i** neben dem Punktestand.

## Warum niemand spicken kann

Deine echten Würfel verlassen dein Gerät nicht. Beim Festlegen rechnet die Seite
aus deinen Würfeln und einer Zufallszahl eine Prüfsumme aus und veröffentlicht
nur diese. Daraus lässt sich der Wurf nicht zurückrechnen.

Erst beim Aufdecken gibt dein Gerät die Würfel frei — und alle können nachrechnen,
dass genau die vorher veröffentlichte Prüfsumme dazu passt. Wer nachträglich
einen anderen Wurf behauptet, fällt sofort auf: bei ihm steht dann
**Siegel passt nicht**.

Wer seinen Wurf vor dem Aufdecken noch einmal neu festlegt, darf das — es wird
aber mit Uhrzeit für alle sichtbar.

## Von überall spielbar

Die Seite liegt im Internet, nicht in einem Heimnetz. Jeder öffnet einfach die
Adresse — ob im WLAN, unterwegs auf mobilen Daten oder im Zug, spielt keine
Rolle. Nichts zu installieren, kein Konto.

Sparsam ist sie dabei auch: Nach neuen Einträgen wird nur gefragt, solange die
Seite im Vordergrund liegt. Wer den Tab wegschiebt oder das Handy einsteckt,
verbraucht kein Datenvolumen mehr; beim nächsten Hinschauen ist alles sofort
aktuell.

## Technik

Reines HTML, CSS und JavaScript — keine Bibliothek, kein Bauschritt, keine
Installation. Die Seite läuft auf GitHub Pages und ist auf Rechner, Tablet und
Handy bedienbar. Dunkle Darstellung folgt der Systemeinstellung.

## Datenschutz — bitte lesen

Die Runde ist **öffentlich**: Wer die Adresse der Seite kennt, kann mitspielen
und sieht die Namen, die Vermutungen nach der Auflösung und die Ergebnisse. Es
gibt bewusst keine Anmeldung.

**Deshalb: nur Vor- oder Spitznamen eintragen — keine vollständigen Namen,
keine Kontaktdaten, nichts Vertrauliches.**

Geschützt sind allein die eigenen Würfel vor der Auflösung (siehe oben). Es
werden keine Zugriffe protokolliert, keine Cookies gesetzt und keine Daten für
andere Zwecke ausgewertet.

## Dein Profil

Im Kopf deiner Karte sitzt der Knopf **Profil**. Dahinter kannst du

- **deinen Namen ändern** — die anderen sehen sofort den neuen (schon vergebene
  Namen werden abgewiesen);
- **deine PIN ändern** — dafür gibst du zuerst die bisherige ein, dann zweimal
  die neue.

## Deine PIN

Die vier Ziffern sind dein Ausweis: Damit meldest du dich auf jedem Gerät wieder
als du selbst an. Auch sie wird nicht im Klartext gespeichert, sondern nur als
Prüfsumme — nachschlagen kann sie niemand.

Ehrlich dazu gesagt: Vier Ziffern sind zehntausend Möglichkeiten. Wer sich
hinsetzt und alle durchprobiert, kommt durch. Das ist ein Türschloss unter
Freunden, kein Tresor. Deine Würfel schützt ohnehin etwas anderes — die liegen
gar nicht erst im Netz.

Vergessen? Dann muss dich jemand mit dem Verwaltungs-Zugang aus der Runde
entfernen; danach meldest du dich einfach neu an.

## Verwaltung

Unten steht der Knopf **Verwaltung**. Wer das Passwort kennt, kann

- Spieler aus der Runde entfernen — praktisch bei doppelten Anmeldungen oder
  vergessenen PINs,
- eine **neue Runde** starten (danach wird auch ohne offene Verwaltung nicht
  erneut gefragt, solange sie aktiv ist).

Mehr kann die Verwaltung nicht: Fremde Würfel sieht auch sie nicht.

## Ein Gerät je Person, solange die Runde läuft

Deine Würfel liegen auf dem Gerät, auf dem du sie eingetragen hast — anders wäre
das Geheimhalten nicht möglich. Spiel eine Runde also auf demselben Gerät zu
Ende. Meldest du dich unterwegs mit deiner PIN auf einem anderen Gerät an,
kannst du dort alles außer deinem bereits festgelegten Wurf; den müsstest du neu
eintragen, was für alle als erneutes Festlegen sichtbar wird.

## Der zweite Tab: Team Schach

Ein Schachspiel für zwei Mannschaften. Der Tab zeigt zuerst eine **Übersicht
aller Partien** — offene, laufende und beendete. Von dort öffnet man eine
Partie oder legt eine neue an.

1. **Partie öffnen oder anlegen.** Beim Anlegen wählt man die Spielart (siehe
   unten) und gibt der Partie einen Namen. Es dürfen beliebig viele Partien
   gleichzeitig laufen.
2. **Team wählen.** Bei Weiss oder Schwarz auf **Mitspielen** — beliebig viele
   Leute je Seite, und man darf auch mitten im Spiel dazukommen.
3. **Bereit drücken.** Sobald auf beiden Seiten jemand steht und beide Seiten
   bereit sind, geht es los.
4. **Ziehen.** Figur antippen, die möglichen Felder erscheinen als Punkte
   (Schlagfelder als Ring), dann das Zielfeld antippen. Wer für Schwarz spielt,
   sieht das Brett gedreht. Der Zug gleitet über das Brett — bei allen, nicht
   nur bei demjenigen, der gezogen hat.

**Innerhalb eines Teams gibt es keine Reihenfolge:** Jeder aus dem Team, das am
Zug ist, darf ziehen — wer zuerst drückt, hat gezogen. Sind zwei gleichzeitig
dran, zählt der erste Zug; der zweite bekommt eine Meldung und wird nicht
ausgeführt. Zwischen Weiss und Schwarz gilt normales Schach.

Es sind alle Regeln umgesetzt: Rochade, en passant, Bauernumwandlung (mit
Auswahl der Figur), Schach, Schachmatt, Patt. Der Stand liegt in der Datenbank
— ihr könnt die Partie jederzeit liegen lassen und später weiterspielen.

**Rochade:** wie jeder andere Zug — König antippen, dann den Punkt antippen, auf
dem er landen soll. Ist sie gerade nicht erlaubt, steht unter dem Brett, warum.

### Die Spielarten

Die Spielart wird beim Anlegen gewählt und bleibt für diese Partie fest.

| Spielart | Brett | Besonderheit |
|---|---|---|
| **Klassisch** | 8 mal 8 | Das gewohnte Schach mit allen Regeln. |
| **Kleines Brett** | 6 mal 6 | Ohne Läufer — kurze Partien. Der König landet bei der Rochade auf dem Turmfeld. |
| **Großes Brett** | 10 mal 8 | Je zwei Läuferpaare, mehr Platz. |
| **Doppelbrett** | 16 mal 8 | Zwei Bretter nebeneinander, zwei Armeen je Seite. Die Figuren ziehen über beide Hälften. **Kein Schach und kein Matt:** Wer zuerst beide Könige verliert, verliert. |

### Die Fähigkeiten

Würfel lassen sich zu **jeder** Spielart zuschalten (Haken beim Anlegen). Nach
jedem Halbzug erscheint mit 18 Prozent einer auf einem freien Feld — meist
einer, selten zwei, sehr selten drei. Eine Höchstzahl gibt es nicht; die einzige
Grenze ist das Brett. Die Farbe des Würfels zeigt, wie selten sein Inhalt ist.
Wer mit einer Figur darauf zieht — auch im Vorbeiziehen —, sammelt ihn für sein
Team ein; eingesetzt wird die Fähigkeit später über den Knopf unter dem Brett.

| Stufe | Chance | Fähigkeiten |
|---|---|---|
| **Gewöhnlich** (grün) | 52 %, mit Abklingzeit | **Sprung**, **Teleport** (kosten den Zug), **Ausweichen** — mehr Beweglichkeit für eine Figur deiner Wahl. |
| **Ungewöhnlich** (blau) | 33 % | **Bauernschub**, **Schutzschild**, **Erdbeben**, **Nudelholz**, **Mauer**. |
| **Episch** (lila) | 12 % | **Frost**, **Verstärkung**, **Fessel**, **Händler**. |
| **Legendär** (gelb) | 3 % | **Doppelzug**, **Wiedergeburt**, **Spiegel**, **Wiederbelebung**, **Friedhof**. |

**Abklingzeit** heißt: Direkt nach einem grünen Würfel kommt Grün eine Weile
seltener (acht Halbzüge lang, gleitend). Sonst wäre über die Hälfte aller Würfel
grün — die anderen Stufen behalten ihre Chance und sind so lange häufiger dran.

Innerhalb einer Stufe sind alle gleich wahrscheinlich, mit einer Ausnahme: Was
man schon im Vorrat hat, kommt seltener nach. Die vollständige Übersicht mit
allen Zahlen steht in der App hinter dem **i** bei den Fähigkeiten.

Jeder achte Würfel ist ein **Unglückswürfel** (umgedrehtes Fragezeichen): Er
kommt nicht in den Vorrat, sondern wirkt sofort gegen den, der ihn eingesammelt
hat. „Sofort" heisst wirklich sofort: Sammelst du unterwegs ein **Erdbeben**
ein, reissen die Löcher mitten in deinem Weg auf — liegt eines davon noch vor
dir, endet dein Zug davor. Und was du am Zielfeld schlagen wolltest, bleibt
dann stehen; wer nicht ankommt, schlägt auch nichts.

### Was eine Fähigkeit kostet

Zwei Zeichen stehen an jeder Fähigkeit — im Vorrat unter dem Brett und in der
Übersicht hinter dem **i**:

| Zeichen | Bedeutung |
|---|---|
| **+** | Nach dem Einsetzen darfst du noch ganz normal ziehen. |
| *(kein +)* | Das Einsetzen kostet deinen Zug — danach ist der Gegner dran. |
| **Blitz** | Du darfst sie auch einsetzen, während der Gegner am Zug ist. |

**Ausweichen** ist die Ausnahme: Es geht **nur**, während der Gegner am Zug
ist — im eigenen Zug lässt es sich gar nicht drücken. Es ist die Notbremse,
kein zusätzlicher Zug.

Dahinter steckt eine einfache Regel: **Wer Material oder einen Angriff
geschenkt bekommt, gibt den Zug ab.** Wiedergeburt, Wiederbelebung, Spiegel,
Verstärkung, Friedhof und Händler bringen Figuren; Sprung und Teleport bringen
eine zusätzliche Gangart zum Schlagen oder Springen — sie alle kosten den Zug.
Alles, was nur die Stellung verändert (Nudelholz, Mauer, Schutzschild, Fessel,
Frost), behält das Pluszeichen. Ausweichen ebenfalls: Es schlägt nie und ist
die Notbremse.

Eine Ausnahme gibt es: Der **Bauernschub** ändert auch nur die Stellung, kostet
seit v0.56 aber trotzdem den Zug. Er schiebt bis zu acht Figuren auf einmal,
und mit dem Zug obendrauf konnte man erst vorrücken und dann mit einem der
geschobenen Bauern schlagen — das war zu stark. Dafür wandeln Bauern, die durch
den Schub die letzte Reihe erreichen, jetzt alle um, und du wählst die Figur.

Zwei Fähigkeiten sehen sich ähnlich und sind es nicht: Der **Frost** friert ein
2-mal-2-Feld für einen Zug ein und macht alles darin unantastbar — auch deine
eigenen Figuren, also gut zielen. Die **Fessel** hält eine einzelne gegnerische
Figur mehrere Züge fest, und die bleibt dabei ganz normal schlagbar.

Die **Verstärkung** wertet eine eigene Figur eine Stufe auf: Bauer wird
Springer, Springer wird Läufer oder Turm, Läufer und Turm werden Dame, Dame
wird König. **Ein zweiter König sind zwei Leben** — solange du zwei hast, gibt
es für dich kein Schach und kein Matt, deine Könige sind dann aber schlagbar
wie jede andere Figur. Umgekehrt geht es auch: Wer zwei Könige hat, tippt einen
an und bekommt zwei Damen. Dein letzter König bleibt immer stehen.

**Bevor du eine Fähigkeit einsetzt, siehst du, wie sie wirkt:** ein kleines
Brett spielt den Ablauf ab — Ausgangsstellung, wo du hintippst (ein
Fingerabdruck zeigt es), und was danach passiert. Pfeile zeigen, welche Figur
sich wohin bewegt; die Sätze zu allen Bildern stehen darunter. Dasselbe steht hinter dem **i**: Dort stehen alle Fähigkeiten und
Unglückswürfel als Liste von Überschriften — tippe eine an, und sie klappt mit
Beschreibung und Anleitung auf.

Manche Fähigkeiten brauchen ein Feld (etwa Schutzschild oder Mauer). Nach dem
Einsetzen sind die möglichen Felder hell umrandet. Tippst du eines an, erscheint
ein **grüner Rahmen** um genau das, was passieren wird — bei der Mauer drei
Felder, bei Frost und Friedhof ein 2-mal-2-Feld. Passt es nicht, tippst du ein
anderes Feld an; passt es, drückst du unter dem Brett auf **Einsetzen**. Mit
**Abbrechen** behältst du die Fähigkeit.

Beim **Friedhof** und bei der **Wiederbelebung** siehst du dabei blass, wo
Figuren gefallen sind — beim Friedhof die des Gegners, bei der Wiederbelebung
deine eigenen. So legst du den Rahmen dorthin, wo etwas zu holen ist. Liegt auf
einem Feld mehr als einer, kommt der zuletzt Gefallene zurück.

Eine eingesetzte Fähigkeit ist verbraucht. Solange sie wirkt, steht sie oben in
der Leiste, und alle betroffenen Felder leuchten auf — **bei allen
Mitspielern**, nicht nur bei dem, der sie eingesetzt hat. **Blau heißt: für
dich. Rot heißt: gegen dich** (Unglückswürfel); die betroffene Figur glüht
dabei mit.

**Auf König und Matt wird geachtet:** Das Schild wirkt nicht auf den König, der
König wird nicht gefesselt, und das Erdbeben lässt Könige stehen. Sonst wäre
nicht mehr eindeutig, wann eine Partie durch Schachmatt endet.

## Der dritte Tab: Rangliste

Ein Punktestand über **beide Spiele**. Gezählt werden die Punkte aus dem Würfel
Quiz plus die Punkte aus beendeten Schachpartien:

| Was | Punkte |
|---|---|
| Schachpartie gewonnen | **30** |
| Schachpartie unentschieden | **10** |
| Bei einer beendeten Partie dabeigewesen | **2** |

Alle aus dem Siegerteam bekommen dieselben Punkte — im Team gibt es schließlich
keine Reihenfolge. Laufende Partien zählen nicht mit. Die Rechnung steht in der
App hinter dem **i** neben der Gesamtwertung.

## Auf den Startbildschirm legen

Die Seite lässt sich wie eine App ablegen: im Browser das Teilen- oder
Menü-Zeichen antippen und **Zum Startbildschirm hinzufügen** wählen. Danach gibt
es ein eigenes Zeichen, und die Seite öffnet sich ohne Browserleiste.

## Selbst betreiben

Die Einrichtung — eigenes Repository, GitHub Pages und die gemeinsame Datenbank —
ist Schritt für Schritt in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) beschrieben.
Zum Ausprobieren auf dem eigenen Rechner genügt
`tools\Quizz lokal starten.cmd`.
