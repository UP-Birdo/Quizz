# Änderungen

Neueste Version oben. Die Version steht in `js/konfig.js` (`APP_VERSION`) und
wird im Kopf der Seite angezeigt.

## v0.119.0 — 2026-08-22

**Neuer Tab „Einstellungen" — mit dem Schalter für den 3D-Look.** (Dein
Wunsch vom 22.08.)

- **Der Tab:** Rechts neben der Rangliste gibt es jetzt „Einstellungen" mit
  dem Bereich „Darstellung". Alles darin gilt nur für DEIN Gerät — es wird
  nichts in die gemeinsame Datenbank geschrieben.

- **Der Schalter „3D-Look (Vorschau)":** eingeschaltet wird das Schachbrett
  zu Pastell-Kacheln mit Tiefe — abgerundete Klötze in Lila und Lavendel
  mit sichtbarer Kante, wie in dem 3D-Spiel, das wir uns angesehen haben.
  Auch die Beispielbretter der Anleitungen ziehen mit. Das ist die ERSTE
  Ausbaustufe; Spielzeug-Figuren und die leichte Schräg-Ansicht folgen als
  eigene Runden und erscheinen dann automatisch hinter demselben Schalter.
  Ausgeschaltet bleibt alles exakt wie bisher.

## v0.118.0 — 2026-08-22

**Bessere Anleitungen: Lootboxen bei Enttarnen und Verstecken, die Hand auf
jedem Tipp-Ziel — und ohne den Strich über der Kuppe.** (Deine Zurufe vom
22.08.)

- **Enttarnen und Verstecken zeigen jetzt Lootboxen im Bild:** Drei Boxen
  (grün, blau, lila) liegen auf dem Beispielbrett. Beim Enttarnen sind sie
  vorher grau und tragen nachher ihre Farbe; beim Verstecken zeigt das
  Nachher-Bild die Sicht des Gegners — nur noch graue Boxen. Vorher standen
  beide Anleitungen ohne eine einzige Box da, obwohl sich alles um sie
  dreht.

- **Die tippende Hand liegt jetzt in JEDEM Bild, in dem man tippt** — auch
  auf dem Zielfeld der Beispiel-Züge und auf der gegnerischen Figur beim
  Schlagen. Vorher zeigten diese Bilder nur den Pfeil.

- **Der Strich über der Fingerkuppe ist weg** — die Hand tippt ja sichtbar,
  das reicht.

## v0.117.1 — 2026-08-22

**Nachbesserung: Das Hüpfen beim Nudelholz-Schub ist weg.** Die geschobenen
Figuren blitzten für ein Einzelbild an ihrer Endposition auf und sprangen
zurück, bevor die Walze sie erreichte. Jetzt wartet jede Figur ruhig auf
ihrem alten Feld, bis die Walze sie berührt, und gleitet dann in einem Zug
weiter.

## v0.117.0 — 2026-08-22

**Das Nudelholz ist umgebaut: EINE Bahn, vier wählbare Richtungen — und die
Figuren rücken erst, wenn die Walze sie berührt.** (Deine Ansage vom 22.08.;
damit ist auch der Eingangskorb-Punkt „Nudelholz nur noch eine Spalte mit
Richtungswahl" gebaut.)

- **Nur noch eine Spalte oder Reihe:** Das Nudelholz rollt über genau EINE
  Bahn statt über zwei Spalten.

- **Der Rand ist wählbar:** Ein Knopf am Brett („Rollt von unten") zählt
  reihum durch die vier Ränder — von unten, links, oben oder rechts. Die
  markierten Randfelder wandern sofort mit, dort setzt das Holz an.
  Ohne Drehen gilt wie bisher: Es rollt von deiner Seite weg.

- **Die Walze rollt aus der gewählten Richtung** — standardmäßig von unten
  nach oben —, und **jede Figur in der Bahn rückt erst in dem Moment
  weiter, in dem die Walze sie erreicht.** Auch in der Anleitung.

- Geblieben ist alles Übrige: Es schiebt nur (schlägt nie), Könige rollen
  mit, niemand wird auf Mauern oder in Risse geschoben, und den eigenen
  König darf man nicht ins Schach rollen.

## v0.116.0 — 2026-08-22

**Die Schauspiele spielen jetzt auch in den Anleitungen, eine tippende Hand
ersetzt den Fingerabdruck — und zum Sieg regnet Konfetti.** (Dein Wunsch vom
22.08.)

- **Anleitungen zeigen die echten Schauspiele:** Im Wirkungs-Bild jeder
  Fähigkeits-Anleitung spielt dieselbe Animation wie am echten Brett — das
  Nudelholz rollt also auch in seiner Anleitung, das Schild glänzt, die
  Fessel schnappt zu, der Frost wächst. Kommende Schauspiele erscheinen
  automatisch auch dort.

- **Eine tippende Hand statt des Fingerabdrucks:** Wo die Anleitung bisher
  einen Fingerabdruck zeigte, liegt jetzt eine gezeichnete Hand mit
  ausgestrecktem Zeigefinger über dem Feld — und sie tippt sichtbar im
  Takt. So sieht man nicht nur WO, sondern auch WAS zu tun ist: tippen.

- **Konfetti zum Sieg:** Steht „Gewonnen" auf dem Schirm, regnen einmal
  bunte Konfetti-Stücke über die Fläche — nur beim ersten Mal je Partie,
  nicht bei jedem Neuzeichnen.

Alles weiter mit Bordmitteln, und bei „weniger Bewegung" entfällt alles
Bewegte wie immer.

## v0.115.0 — 2026-08-22

**Die Fähigkeiten spielen jetzt ihr eigenes kleines Schauspiel auf dem
Brett** (Bündel Y, Runde 1 — dein Wunsch vom 22.08.).

- **Das Nudelholz rollt wirklich:** Eine Holzwalze mit Griffen erscheint
  über den betroffenen Spalten, rollt einmal sichtbar über sie hinweg und
  verschwindet — die Streifen auf der Walze drehen dabei mit.

- **Das Schutzschild glänzt auf:** Ein blauer Ring wächst um die geschützte
  Figur und leuchtet kurz.

- **Die Fessel schnappt zu** — ein dunkler Ring legt sich um die gefangene
  Figur, und die Figur rüttelt kurz dagegen.

- **Der Frost wächst:** Eis breitet sich aus der Feldmitte über die
  eingefrorenen Felder aus und verweht.

- Alle übrigen Fähigkeiten behalten vorerst das blaue Aufleuchten — die
  weiteren Schauspiele (Mauer, Teleport, Dieb …) stehen als nächste Runden
  im Bündel Y der `ROADMAP.md`.

Jedes Gerät sieht dieselben Schauspiele — sie hängen am Zug-Verlauf, nicht
am Auslöser. Wer „weniger Bewegung" eingestellt hat, bekommt keines. Alles
mit Bordmitteln gebaut: Nach Prüfung der gängigen Animations-Bibliotheken
(anime.js, GSAP, Motion) war keine nötig — Begründung in der `ROADMAP.md`,
Bündel Y.

## v0.114.0 — 2026-08-22

**Vier kleine UI-Verbesserungen aus dem Watermelon-Bündel (Etappen X2 bis
X5).**

- **Kurzmeldung statt Wegklick-Fenster:** Reine „hat geklappt"-Meldungen
  („PIN geändert", „12 Wörter hinzugefügt") erscheinen jetzt als kleine
  Meldung am unteren Rand und verschwinden von selbst. Alles, was man lesen
  muss (Fehler, Erklärungen), bleibt ein Fenster.

- **Punkte zählen sichtbar hoch:** Ändert sich in der Rangliste eine
  Punktzahl, rollt die Anzeige von der alten zur neuen Zahl, statt hart
  umzuspringen.

- **Eingabefelder mit schwebender Beschriftung:** In Eingabe-Fenstern steht
  die Beschriftung im leeren Feld und wandert beim Tippen klein an den
  oberen Rand — sie verschwindet nicht mehr einfach.

- **Weiches Aufklappen überall:** Zug-Verlauf, Fähigkeiten-Bibliothek und
  Regel-Kapitel gleiten beim Öffnen und Schliessen, statt aufzuschnappen
  (auf älteren Browsern klappen sie einfach wie bisher).

Wie immer gilt: Wer am Gerät „weniger Bewegung" eingestellt hat, bekommt
keine der Animationen.

## v0.113.0 — 2026-08-22

**Am Handy sitzen die Tabs jetzt unten — und eine offene Runde ist ein
eigenes Fenster.** (Watermelon-Etappe X7, deine Freigabe vom 22.08.)

- **Dock statt Kopfzeile:** Auf schmalen Geräten klebt die Tab-Leiste am
  unteren Rand, wo der Daumen ist — wie bei den Apps auf dem iPhone. Die
  vier Tabs teilen sich die Breite, die blaue Pille gleitet wie gehabt.
  Der Streifen des iPhone-Wischbalkens bleibt frei. Am grossen Bildschirm
  bleibt alles oben.

- **Eine offene Runde ist ein Fenster:** Sobald du eine Schach-Partie oder
  einen Imposter-Raum öffnest, verschwinden Tab-Leiste und (am Handy) die
  Kopfzeile — der ganze Schirm gehört dem laufenden Spiel. Zurück geht es
  wie bisher über den Zurück-Knopf der Runde; danach ist die Leiste wieder
  da. Übersicht, Bibliothek und Anleitungen zeigen die Leiste weiterhin.

## v0.112.0 — 2026-08-22

**Löschen fragt jetzt direkt im Knopf nach — „Wirklich?" statt Popup.**
(Watermelon-Etappe X6, deine Freigabe vom 22.08.)

- **Fünf kleine, zerstörende Aktionen** stellen ihre Rückfrage nicht mehr als
  eigenes Fenster, sondern im Knopf selbst: Der erste Druck färbt ihn rot und
  er zeigt „Wirklich?" — erst der zweite Druck führt aus. Wer nicht erneut
  drückt, bekommt den Knopf nach vier Sekunden unverändert zurück. Die
  Stellen: **Partie löschen** und **Raum löschen** (beide verlangen davor
  weiterhin das Verwaltungs-Passwort), **Spieler entfernen** (Verwaltung),
  **Ich bin raus** und **Aufgeben**.

- **Alle erklärenden Rückfragen bleiben Fenster** — Würfel ändern, Aufdecken,
  Neue Runde, Fähigkeit einsetzen, Händler und Dieb sagen ja etwas, das man
  vor dem Bestätigen lesen soll. Ein Knopf kann das nicht.

## v0.111.0 — 2026-08-22

**Die Spiele-Tabs oben tragen jetzt dieselbe gleitende Pille wie die
Segment-Schalter beim Anlegen.**

- **Pille statt Strich:** Der aktive Tab (Team Schach, Imposter, Würfel
  Quizz, Rangliste) wird nicht mehr durch einen Strich darunter markiert,
  sondern durch eine blaue Pille hinter der Beschriftung — sie gleitet beim
  Wechsel zum neuen Tab. Damit sieht die oberste Leiste genauso aus wie die
  Segment-Reihen im Anlege-Bildschirm: EIN Muster für die ganze App.
  (Vorbild: die Tab-Bausteine moderner Komponenten-Galerien, gebaut wie
  immer mit Bordmitteln — kein fremder Code.)

- **Der Status-Punkt im Kopf atmet,** solange die App lädt oder schreibt —
  man sieht jetzt auf einen Blick, dass gerade etwas unterwegs ist. Steht
  alles, steht auch der Punkt. Wie alle Bewegung der App entfällt das
  automatisch, wenn das Gerät „weniger Bewegung" eingestellt hat.

Hintergrund dieser Runde: Die Komponenten-Bibliothek ui.watermelon.sh wurde
komplett gesichtet (319 Bausteine) und mit der App abgeglichen. Was sich
davon noch lohnt, steht geordnet als Bündel X in der `ROADMAP.md` — diese
Runde ist Etappe 1.

## v0.110.0 — 2026-08-22

**Der Anlege-Bildschirm im Stil moderner App-Einstellungen — und nur noch EIN
Zurück-Knopf.**

- **Alle Einrück-Striche sind weg.** Was zu einem Kipp-Schalter gehört
  (Seltenheit, Unglücks-Anzeige, Lootbox-Menge, Item-Vorrat unter „Lootboxen";
  „Unterschiedliche Armeen" unter „Zufallsarmee"), liegt jetzt in einem leise
  hinterlegten Gruppen-Kasten direkt unter seinem Schalter — wie in den
  Einstellungen des Handys.

- **Die vier Knopfreihen sind echte Segment-Schalter:** ein Kasten, die Stufen
  als gleich breite Felder darin, und die blaue Markierung gleitet beim
  Umschalten von Feld zu Feld. Vorher waren es lose Einzel-Knöpfe mit Rahmen.

- **Ein Zurück-Knopf für die ganze App** (dein Punkt aus dem Eingangskorb):
  Bibliothek und „Schach lernen" hatten ZWEI — einen oben, einen schwebend am
  unteren Rand. Der schwebende ist raus. Damit die langen Ansichten trotzdem
  keine Sackgasse werden, bleibt die Kopfzeile mit dem Zurück-Knopf beim
  Rollen oben am Bildschirm kleben. Ergebnis: Zurück ist überall an derselben
  Stelle — oben links.

Tests: 1531 Prüfungen, 0 Fehler.


## v0.109.0 — 2026-08-22

**Zwei Nachbesserungen an der neuen Optik (deine Meldungen von heute).**

- **Der Strich links neben „Wie viele Figuren je Seite?" ist weg.** Er war der
  Einrück-Strich für Unterpunkte, die zu einem Haken gehören — diese Reihe
  gehört aber zu keinem und steht allein ganz oben. Jetzt ist sie eine eigene
  Karte mit Überschrift, wie „Einstellungen" und „Welche Brettform?" darunter.

- **Das Umstellen zwischen wenig / normal / viel sieht jetzt richtig aus.**
  Bisher wanderte beim Umschalten der ganze Knopf mitsamt Beschriftung — der
  Text verschmierte sichtbar von „wenig" nach „normal". Jetzt wandert nur noch
  die blaue Fläche unter dem Text zum gedrückten Knopf; die Beschriftungen
  bleiben stehen. Ausserdem blendet nicht mehr der ganze Bildschirm bei jedem
  Knopfdruck über — alles Übrige wechselt sofort, nur die Markierung gleitet.
  Beides gilt für alle vier Knopfreihen (Figurenzahl, Lootbox-Menge, Items,
  Brettform).

Tests: 1531 Prüfungen, 0 Fehler.


## v0.108.0 — 2026-08-22

**Aufgeräumte Bedienelemente — zweiter Teil der UI-Runde.**

Wieder nach den Mustern moderner Komponenten-Galerien, wieder komplett mit
Bordmitteln:

- **Die Haken der Einstellungen sind jetzt Kipp-Schalter** — eine Pille mit
  gleitendem Knubbel, wie in den Einstellungen jedes Handys. An ist auf einen
  Blick von Aus zu unterscheiden; technisch ist es dasselbe Häkchen wie vorher,
  Tastatur und Vorlesen funktionieren unverändert.

- **In Popups scrollen scrollt nicht mehr die Seite dahinter** (dein gemeldeter
  Fehler). Solange ein Dialog offen ist, steht die Seite hinter ihm fest; wer
  im Dialog ans Ende rollt, rollt nirgendwo weiter. Am Rechner bleibt dabei der
  Platz des Rollbalkens reserviert, damit die Seite nicht zur Seite ruckt.

- **Der Fokus-Ring erscheint nur noch bei Tastatur-Bedienung.** Beim Tippen auf
  dem Handy blieb bisher nach jedem Druck ein blauer Ring am Knopf stehen —
  der ist weg. Wer mit der Tastatur navigiert, sieht ihn unverändert.

- **Aufklapper in Bibliothek und Anleitung öffnen weich** — der Inhalt tritt
  kurz ein, statt hart dazustehen.

Wie in v0.107 gilt: Wer in den Systemeinstellungen weniger Bewegung wünscht,
bekommt alles ohne Animation.

Tests: 1530 Prüfungen, 0 Fehler.


## v0.107.0 — 2026-08-22

**Die App bewegt sich jetzt flüssig — überall, mit Bordmitteln.**

Vorbild waren die Bewegungsmuster moderner Komponenten-Galerien; eingebaut ist
alles ohne fremde Bibliothek, nur mit CSS-Übergängen und einer eingebauten
Browser-Schnittstelle (View Transitions).

- **Der Strich unter den Tabs gleitet** zum angetippten Tab, statt hart
  umzuspringen — und der Inhalt des neuen Tabs blendet kurz ein.

- **Die Markierung der Knopfreihen wandert.** Wer beim Anlegen eine andere
  Figurenzahl, Lootbox-Menge, Item-Auswahl oder Brettform antippt, sieht die
  farbige Markierung zum gedrückten Knopf gleiten; die Vorschau-Kacheln
  blenden weich auf den neuen Stand über.

- **Dialoge und Popups öffnen sanft** (der Kasten steigt kurz auf, der
  Schleier blendet ein) und schliessen mit einem kurzen Ausblenden. Die
  Einträge einer Auswahl-Liste treten kurz nacheinander ein.

- **Knöpfe reagieren spürbar:** weicher Farbwechsel, ein kurzes Eindrücken
  beim Tippen, die Spielart-Kacheln heben sich unter dem Zeiger leicht an.

**Wer in den Systemeinstellungen weniger Bewegung wünscht, merkt nichts davon:**
Alles Neue hängt an dieser Einstellung und bleibt dann aus — die App verhält
sich exakt wie vorher. Auch ältere Browser ohne die Schnittstelle bekommen
einfach das bisherige Verhalten.

Tests: 1530 Prüfungen, 0 Fehler.


## v0.106.0 — 2026-08-21

**Zweiter Durchgang: Jetzt sind ALLE Texte der App kürzer.**

In v0.105 waren die Einstellungen dran, diesmal alles Übrige — die
Fähigkeiten-Bibliothek, „Schach lernen", die Bildanleitungen, die
Punkte-Erklärungen aller drei Spiele und die Meldungen im Spiel. Gemessen sind
es **6.600 Zeichen weniger** (von rund 39.000 auf 32.600), ohne dass eine Regel
verlorengegangen ist.

Wo am meisten wegfiel:

- **Die 29 Beschreibungen der Fähigkeiten und Unglücks-Lootboxen** sind von
  zusammen 6.250 auf 4.450 Zeichen geschrumpft. Der Satz „Danach ist der Gegner
  am Zug" steht nirgends mehr: Das sagt schon das fehlende Pluszeichen an der
  Marke, und die Legende darunter erklärt es.

- **Die Punkte-Erklärungen** hinter dem i sind in allen drei Spielen etwa halb
  so lang (Rangliste 1.155 → 530 Zeichen, Würfel Quizz 926 → 550, Imposter
  852 → 530). Die Zahlen stehen jetzt als Aufzählung statt in ausformulierten
  Sätzen.

- **„Schach lernen" und die Bildanleitungen** sind gestrafft — jedes Bild
  behält seine Aussage, aber die Nebensätze sind weg.

- **Die Spielart-Kacheln** nennen die Brettmasse nicht mehr im Text; die Zahl
  steht ohnehin darüber.

Damit es so bleibt: Ein Test lässt für eine Fähigkeit jetzt höchstens 250
Zeichen zu (vorher 400). Wer eine neue schreibt, merkt beim Testlauf, wenn sie
zu lang gerät.

Tests: 1529 Prüfungen, 0 Fehler.


## v0.105.0 — 2026-08-21

**Der Anlege-Bildschirm ist aufgeräumt: weniger Text, mehr Übersicht.**

- **Die Erklärungen sind nicht weg, sie stehen hinter dem i.** Neben jeder
  Einstellung sitzt ein kleines i — antippen, und der Satz dazu erscheint.
  Beim normalen Anlegen sieht man nur noch die Titel und die Knöpfe, also das,
  was man antippen will. Bei den drei Knopfreihen (Lootboxen, Items, Figuren)
  erklärt ein i gleich ALLE Stufen auf einmal, damit man vergleichen kann.

- **Alle Texte sind gekürzt** — die Erklärsätze der Einstellungen und die
  Beschreibungen auf den Spielart-Kacheln. Die Masse des Bretts standen dort
  doppelt (einmal als Zahl, einmal im Text); jetzt nur noch einmal.

- **„Welche Items kommen vor?" hat die Stufe „10" verloren.** Übrig bleiben
  **wenig / viele / alle**, und die drei stehen jetzt nebeneinander in einer
  Reihe statt umgebrochen.

- **„Selbst wählen" öffnet ein Popup.** Die Ankreuzliste hing bisher mitten im
  Bildschirm, in einem Kasten mit eigenem Rollbalken — im Popup ist Platz für
  alle Items auf einmal, und die Spielart-Kacheln bleiben sichtbar. Der Knopf
  selbst zeigt, wie viele angehakt sind („Selbst gewählt: 12 von 19 — ändern").

**Laufende Partien merken nichts davon.** Wer eine Partie mit der Stufe „10"
angelegt hat, behält genau seine zehn Items — welche es sind, steht seit dem
Anlegen fest.

Nebenbei berichtigt: Die Beschreibung des 12er-Kreuzes versprach an den Flügeln
„Offiziere" — dort stehen seit v0.65 volle Armeen mit Bauern.

Tests: 1529 Prüfungen, 0 Fehler.


## v0.104.0 — 2026-08-21

**Der Regler „Wie viele Figuren je Seite?" hat eine neue Leiter — und zwei
Stufen, die es so noch nicht gab.**

- **Was du bisher als „normal" kanntest, heisst jetzt „wenig"**, und die
  gewohnte volle Aufstellung (bis jetzt „voll") heisst jetzt **„normal"**. Neue
  Partien starten unverändert mit dieser gewohnten Aufstellung — an der Vorgabe
  ändert sich nichts, nur ihr Knopf hat den Platz gewechselt.

- **„viel" stellt eine Reihe mehr auf.** Die Bauern rücken einen Schritt vor,
  und dazwischen kommt eine neue Reihe mit Springern, Läufern und Türmen — sie
  sieht aus wie die Grundreihe, nur ohne König und Dame. Auf dem klassischen
  Brett sind das 24 Figuren je Seite statt 16.

- **„voll" füllt das Brett bis auf die Mitte.** Frei bleibt nur noch ein
  2-mal-2-Feld in der Brettmitte, alles andere steht voller Truppen: 30 Figuren
  je Seite auf dem klassischen Brett, 62 auf dem Doppelbrett. Ein enges,
  zähes Brett — gedacht zum Ausprobieren.

- **Auf jedem Brett**, auch auf den Kreuzen: Dort füllt jeder Arm nach innen,
  und wo zwei Fronten aufeinandertreffen, gehört ein Feld dem, der näher dran
  ist. Beim Kreuz-Duell bleiben die beiden leeren Flügel leer wie bisher.

- **Laufende Partien merken nichts davon.** Ihr Brett steht fest und wird nie
  neu gerechnet. Wer eine laufende Partie ausdrücklich NEU AUFSTELLT, bekommt
  die neue Bedeutung ihrer Stufe.

**Dazu eine Änderung an der Zufallsarmee, die beim Bauen nötig wurde:** Ab drei
Reihen stehen ihre Bauern jetzt vorn und die Offiziere hinten — gewürfelt wird
weiterhin, WELCHE Figuren eine Seite bekommt. Ohne diese Ordnung sperrte sich
ein tiefer Block selbst ein: Nachgemessen stand bei „voll" je nach Brett jede
fünfte bis dritte Seite ohne einen einzigen gültigen Zug da. Bei „wenig" und
„normal" bleibt die Aufstellung bunt gemischt wie bisher.

Tests: 1527 Prüfungen, 0 Fehler.


## v0.103.0 — 2026-08-20

**Die Unglücks-Lootbox heisst jetzt „Spalt".**

- Sie hiess ursprünglich „Erdbeben" und seit v0.92 „Riss". Damit trugen aber
  zwei Dinge denselben Namen: die Lootbox und das gesperrte Feld, das sie
  hinterlässt. Jetzt sind es zwei Wörter für zwei Dinge — **der Spalt** ist die
  Lootbox, **die Risse** sind die Löcher, die sie aufreisst.

- Am Spiel selbst ändert sich nichts: dieselbe Stufe, dieselbe Wirkung. Auch
  laufende Partien merken nichts davon, die Kennung im Hintergrund bleibt
  unverändert.

**Dazu eine Aufräum-Runde an Doku und Werkzeugen.** An der App ändert sich dabei
kein Byte — nach der Haus-Regel bekommt so eine Runde keine eigene Nummer und
geht hier mit:

- Die eisernen Regeln des Team Schach stehen jetzt in `docs\regeln\` mit einem
  Wegweiser, und die `STATUS.md` ist wieder ein Stand statt eines Archivs. Eine
  neue Sitzung liest damit 27 statt 72 KB, bevor die erste Frage beantwortet
  wird — bei unverändertem Inhalt.
- `tools\Test-Quizz.ps1` hat einen Schalter `-NurFazit`: eine Zeile statt der
  vollen Ausgabe, im Fehlerfall jede fehlgeschlagene Prüfung mit ihrer
  Testdatei.

## v0.102.0 — 2026-08-20

**Schild und Fessel hängen jetzt an der Figur, nicht am Feld.**

- **Wer geschoben wird, nimmt seinen Status mit.** Bisher blieben Schutzschild
  und Fessel auf dem Feld liegen: Wurde die Figur mit Nudelholz, Bauernschub,
  Erdbeben oder Erdrutsch verschoben, stand ihr Schild danach auf einem leeren
  Feld — und eine gefesselte Figur wurde durch einen Schub einfach frei,
  während die Fessel an dem hängen blieb, was danach dort stand. Jetzt zieht
  beides mit.

- **Ein eigener Zug zählt weiter nicht als Schub.** Zieht die geschützte Figur
  selbst, verfällt ihr Schild wie bisher — sonst wäre daraus ein dauerhafter
  Schutz geworden. Es ist dieselbe Grenze wie beim Doppelschritt der Bauern:
  Geschoben zu werden ist kein Zug.

- **Und wo keine Figur mehr steht, fällt die Marke weg.** Nimmt ein Erdbeben
  die geschützte Figur vom Brett, verschwindet ihr Schild mit ihr, statt als
  Ring auf einem leeren Feld liegen zu bleiben.

## v0.101.0 — 2026-08-20

**Der Platztausch geht jetzt in alle vier Richtungen — und auch mit dem Gegner.**

- **Vier Richtungen statt einer.** Bisher tauschte eine eigene Figur nur mit der
  Figur direkt vor ihr. Jetzt wählst du die Richtung: vor, zurück, links oder
  rechts. Ein Knopf unter dem Brett schaltet sie weiter, und die markierten
  Felder zeigen sofort, was in dieser Richtung überhaupt geht.

  Die Richtungen zählen von deiner eigenen Armee aus — „vor" ist immer die
  Richtung, in die deine Bauern marschieren. Damit heisst „vor" auf dem
  gedrehten Kreuz-Brett dasselbe wie auf dem geraden.

- **Auch gegnerische Figuren sind Tauschpartner.** Damit lässt sich eine
  fremde Figur aus einer Sichtlinie ziehen oder in eine hineinsetzen. Könige
  tauschen weiterhin nicht — in keiner der beiden Rollen.

- **Dafür kostet er jetzt den Zug.** Kein Pluszeichen mehr: Wer in die
  gegnerische Stellung eingreift, gibt den Zug ab. Das ist dieselbe Regel, die
  schon den Bauernschub und das Nudelholz getroffen hat — zu stark heisst
  Pluszeichen weg, nicht Stufe verschieben.

## v0.100.0 — 2026-08-20

**Die Figurenzahl gilt jetzt immer, die Items lassen sich selbst zusammenstellen
— und vier Texte sind kürzer geworden.**

- **Der Regler „Wie viele Figuren je Seite?" wirkt in jeder Partie.** Bisher tat
  er nur etwas, wenn der Haken „Zufallsarmee" gesetzt war. Jetzt entscheidet der
  Haken nur noch, WELCHE Figuren stehen (gewürfelt oder die gewohnte
  Aufstellung) — WIE VIELE sagt allein der Regler. Ohne Haken bleibt die
  Aufstellung der Spielart stehen, nur eben schmaler; Könige bleiben immer.

  **Die Vorgabe ist „voll"**, eine neue Partie sieht also aus wie bisher.
  Laufende Partien ändern sich nicht.

- **Neu: „selbst wählen" beim Item-Vorrat.** Neben wenig / 10 / viele / alle gibt
  es jetzt eine Liste zum Anhaken. Beim ersten Umschalten ist alles angehakt —
  du streichst weg, was nicht vorkommen soll. Mindestens ein Item bleibt stehen.
  Die Chancen verteilen sich auf das, was übrig ist: Eine Seltenheitsstufe ohne
  angehaktes Item wird gar nicht mehr gezogen.

- **Ein Fenster vor dem Anpfiff zeigt, welche Items drin sind.** Es kommt einmal
  je Partie, bevor sie startet, und listet den Vorrat auf. Jeder Eintrag ist
  antippbar und zeigt die Fähigkeit mit ihrer Bildanleitung; danach steht die
  Liste wieder da. Bei „alle" bleibt das Fenster weg — dann gibt es nichts
  Besonderes zu sagen.

- **Die geschätzte Dauer lernt jetzt von Anfang an.** Bisher zählte die Messung
  erst ab der fünften gespielten Partie und sprang dann. Jetzt mischen sich
  Vorgabe und Messung, und die Messung bekommt mit jeder Partie mehr Gewicht.
  Ausserdem wird unter einer halben Stunde auf die MINUTE gerundet statt auf
  fünf — damit bewegt sich die Zahl auch bei kleinen Änderungen an den
  Einstellungen oben.

- **Vier Beschreibungen sind kürzer.** Die Mauer war der Anlass (zum zweiten
  Mal), dazu Nudelholz, Frost und Verstärkung. Ein Test hält ab jetzt JEDE
  Beschreibung kurz — sonst wächst die nächste unbemerkt nach.

  **Beim Kürzen ist ein Fehler aufgefallen:** Der Frost-Text versprach seit
  v0.95 noch immer, man könne mit ihm mattsetzen. Das Recht ist damals
  zurückgenommen worden; nur der Text wusste es nicht.

## v0.99.0 — 2026-08-20

**Zwei Meldungen vom selben Tag: der Dieb und die Figurenzahl.**

- **Der Dieb lässt sich wieder jederzeit einsetzen.** Seit v0.94 wurde seine
  Marke grau, sobald der Gegner nichts im Vorrat hatte — gedacht als Ersparnis,
  erlebt als „das Item funktioniert nicht wie ein Item". Jetzt liegt er im
  Vorrat wie jede andere Fähigkeit und wird benutzt, wann du willst. Ist beim
  Gegner gerade nichts zu holen, sagt das Fenster es dir, und du behältst ihn.

- **Die Knöpfe „viel" und „voll" tun endlich etwas.** Bisher stellten sie
  dieselbe Armee auf wie „normal" — auf jedem Brett. Der Grund: Die Zahl der
  Startfelder war fest, alles darüber wurde einfach abgeschnitten. Jetzt wächst
  der Block mit:

  | Klassisches Brett | wenig | normal | viel | voll |
  |---|---|---|---|---|
  | Figuren je Seite | 4 | 8 | 12 | 16 |

  „voll" heisst damit wörtlich, was es sagt: die beiden Grundreihen ganz
  ausgefüllt. „wenig" und „normal" stellen unverändert dasselbe auf wie vorher.

- Und weil beides zusammenhängt: Die Zahl unter der Spielart-Kachel stimmt
  jetzt in jedem Fall mit dem überein, was die Partie hinterher wirklich
  aufstellt. Ein Test hält beide Rechnungen zusammen.

## v0.98.0 — 2026-08-20

**Neue Fähigkeit „Verstecken" — und vier Meldungen aus dem Wunsch-Knopf.**

- **Neu: „Verstecken", das Gegenstück zum Enttarnen.** In einer Partie, die die
  Seltenheit der Lootboxen zeigt, sieht dein Gegner nach dem Einsetzen 6
  Halbzüge lang nur noch graue Boxen und muss raten, welche sich lohnt. Du
  selbst siehst die Farben weiter, und du bleibst am Zug.

  Es gibt sie nur, wo sie etwas bewirkt: Verbirgt eine Partie die Seltenheit
  ohnehin, kommt stattdessen das Enttarnen vor. Die beiden schliessen einander
  aus — in jeder Partie gibt es genau eine von ihnen. Damit ist das
  Wunsch-Bündel R vollständig gebaut.

- **[#36] Enttarnen hielt keinen einzigen Halbzug.** Die Fähigkeit versprach
  sechs — tatsächlich war ihre Wirkung nach dem nächsten Zug weg. Der Stand
  wird beim Ziehen neu gebaut, und die zwei Angaben zum Enttarnen standen dort
  nicht mit drin. Behoben, und mit einer Prüfung abgesichert, die jedes künftig
  vergessene Feld von selbst findet.

  **Dabei ist ein zweiter Fehler derselben Art aufgefallen:** Auch die
  Startseiten der Farben gingen bei jedem Zug verloren. Auf dem Kreuz-Brett
  konnte sich die Ansicht dadurch mitten in der Partie drehen, sobald die
  letzten Bauern einer Seite gefallen waren. Ebenfalls behoben.

- **[#37] und [#38] Der Doppelschritt gehört jetzt dem Bauern, nicht der
  Reihe.** Bisher durfte zwei Felder ziehen, wer auf einer Startreihe stand.
  Neu zählt allein: Hat dieser Bauer schon selbst gezogen?

  - Wer mit Nudelholz oder Bauernschub geschoben wurde, hat sich nicht selbst
    bewegt und behält seinen Doppelschritt (#38).
  - Wer schon gezogen ist, bekommt ihn nicht zurück — auch dann nicht, wenn
    ihn etwas auf seine Startreihe zurückschiebt (#37).

  Laufende Partien rechnen im Moment des Umstiegs genau wie vorher weiter.

- **[#35] Der Teleport zieht keine Linie mehr.** Markiert werden nur noch
  Startpunkt und Zielfeld. Dahinter steckte mehr als eine Anzeige: Ein Teleport
  zwei Felder geradeaus galt als gewöhnlicher Zug — die Figur sammelte dabei
  sogar eine Lootbox auf dem Feld dazwischen ein, über das sie in Wahrheit
  hinweggesetzt ist. Beides ist weg.

- **Und noch eine Lücke gleicher Art:** Bauern, die von einer Unglücks-Lootbox
  geschoben wurden (Erdbeben, Erdrutsch, Meuterei), nahmen ihre Startseite
  nicht mit — auf dem Kreuz liefen sie danach in die falsche Richtung.

## v0.97.0 — 2026-08-20

**„Schach lernen" steht jetzt auf dem normalen Brett — und ohne Lootboxen.**

- **Acht mal acht statt sechs mal sechs.** Wer Schach lernt, soll es auf dem
  Brett lernen, das er nachher vor sich hat. Damit stimmen auch die Felder:
  Die Rochade zeigt König e1 nach g1 und Turm h1 nach f1, also genau den Zug,
  den man später macht.

- **Die vier Lootboxen sind weg.** Auf jedem Bild der Anleitung lagen welche
  herum, obwohl es dort um Schachregeln geht und nicht um Fähigkeiten. Sie
  kamen aus der Spielart, mit der die Bilder gerechnet wurden.

- Die Bretter sind ausserdem etwas grösser gezeichnet, damit ein Feld bei acht
  Spalten nicht kleiner wird als vorher bei sechs.

## v0.96.0 — 2026-08-20

**Neu: „Schach lernen" — die Grundregeln zum Nachschlagen, direkt in der App.**

Der Knopf steht oben in der Partie-Übersicht, also dort, wo man ist, bevor man
einem Team beitritt. Vier Abschnitte, jeder Punkt einzeln aufklappbar:

- **Die Figuren und wie sie ziehen.** Für jede Figur ein Brett, auf dem
  markiert ist, wohin sie von dort aus könnte. Beim Bauern sieht man in einem
  Bild, worüber am Anfang jeder stolpert: Er zieht gerade, schlägt aber schräg
  — das Feld direkt vor ihm ist besetzt und deshalb KEIN Zug, das schräge
  daneben schon.

- **Was ist wie viel wert.** Die Figuren nach Wert geordnet, mit denselben
  Zahlen, mit denen die App am Ende der Partie eure Bilanz rechnet. Damit
  weisst du, ob sich ein Tausch lohnt.

- **Schach, Matt und Patt** — der Unterschied, der am häufigsten missverstanden
  wird. Beim Schach siehst du die Züge, die noch retten; beim Matt, dass keiner
  mehr da ist; beim Patt, dass der König NICHT angegriffen ist und trotzdem
  nicht mehr ziehen kann. Dazu der Satz, der dich einen Sieg kosten kann: Wenn
  dem Gegner fast nichts mehr bleibt, lass ihm ein Feld.

- **Drei Züge, die anders sind:** Umwandlung, Rochade und das Schlagen im
  Vorbeigehen — jeweils mit Vorher- und Nachher-Bild.

**Jedes Bild ist gerechnet, nicht gemalt.** Wo dort steht „so zieht der
Springer", hat dieselbe Regel die Felder geliefert, nach der auch euer echtes
Brett arbeitet; wo „das ist Patt" steht, hat die Regel es gesagt. Die Anleitung
kann deshalb nie etwas anderes zeigen als das Spiel.

## v0.95.0 — 2026-08-20

**Items führen nie mehr direkt zu Schach oder Matt.**

- **Eine Fähigkeit darf den gegnerischen König nicht mehr angreifen.** Wenn die
  Wirkung Schach geben, mattsetzen oder patt stellen würde, lässt sie sich
  nicht einsetzen — sie bleibt dir erhalten, und das Brett bietet solche Felder
  gar nicht erst an. Der Gedanke dahinter: Das Item bereitet die Stellung vor,
  **den Angriff führst du mit einem ZUG**. Damit ist auch das Recht des
  Frostes, mattzusetzen (aus v0.80), wieder zurückgenommen.

- **Cleveres Platzieren wird dadurch nicht schwächer.** Die Mauer gibt nie
  Schach — sie sperrt Felder, und das darf sie weiter in voller Härte. Wer dem
  gegnerischen König mit ihr die Fluchtwege nimmt, gewinnt genauso; nur eben
  einen Halbzug später und aus eigener Hand.

- **Das gilt auch für dich selbst:** Eine Fähigkeit, mit der du dir deine
  letzte Zugmöglichkeit nehmen würdest (etwa eine Mauer vor dem eigenen König),
  wird ebenfalls abgewiesen.

- **Unglücks-Lootboxen bleiben, wie sie sind.** Sie dürfen weiterhin eine
  Partie beenden — auch dann, wenn eine Fähigkeit eine solche Box beim
  Einsetzen mit aufsammelt. Ein Unglück wählt man ja nicht, es trifft einen.

In vollen Stellungen merkt man davon wenig. Im Endspiel mit wenigen Figuren
sind Verstärkung, Nekromant, Wiederbelebung, Nachschub und Spiegel jetzt öfter
grau — dort steht der gegnerische König frei, und fast jede neue starke Figur
würde ihn angreifen.

## v0.94.0 — 2026-08-20

> **Diese Nummer ist nie einzeln rausgegangen** — sie steckt vollständig in
> v0.95.0. Der erste Punkt unten („beendet die Partie jetzt auch") gilt in
> dieser Form nicht mehr: Seit v0.95.0 kommt es gar nicht mehr so weit, weil
> eine Fähigkeit den Gegner nicht mehr mattsetzen darf. Alles andere gilt
> unverändert.

**Aus einem Spieltest über 111.000 Halbzüge: ein Fehler, der Partien anhalten
liess, und sieben Stellen, an denen die Anzeige etwas anderes sagte als das
Spiel.**

- **Eine Fähigkeit, die den Gegner mattsetzt, beendet die Partie jetzt auch.**
  Bisher wurde Schachmatt nur nach einem ZUG geprüft. Wer also mit dem Spiegel
  eine zweite Dame bekam und damit mattsetzte, gab den Zug ab — und dann stand
  alles still: Der Gegner war am Zug, konnte keinen einzigen Zug machen, und
  oben stand weiter „am Zug". Heraus kam man nur über Aufgeben oder Neu
  aufstellen, und der Sieger bekam weder den Abschluss noch seine Punkte. Das
  gilt genauso für Patt und für Fähigkeiten, bei denen der Zug bei dir bleibt.

- **Das Brett markiert keine Felder mehr, die es danach ablehnt.** Bei
  Fähigkeiten mit Zielfeld waren Felder markiert, die anschliessend „Geht
  gerade nicht" ergaben — immer aus demselben Grund: Dein König hätte danach im
  Schach gestanden. Solche Felder leuchten jetzt gar nicht mehr auf.

- **Und wenn wirklich einmal nichts geht, steht der Grund da.** Der Hinweis
  zählte bisher drei mögliche Gründe auf; jetzt nennt er den, der zutrifft.

- **Dieb und Händler sagen vorher ab.** Hat der Gegner keine einzige Fähigkeit
  oder fehlen dir die Figuren für den Tausch, ist die Marke grau — mit einem
  Satz, warum. Vorher konntest du sie antippen und erfuhrst es erst im Fenster
  danach.

- **Im Fenster einer Fähigkeit stehen die Bilder jetzt oben.** Darüber ein
  Satz, was sie tut; die ganze Beschreibung klappt darunter auf. Bei der Mauer
  waren das vorher zwanzig Zeilen Text, bevor das erste Bild kam. **Und wenn es
  gar kein gültiges Feld gibt, wird gleich abgesagt** statt erst nach dem
  Bestätigen.

- **Der Kurzhinweis der Maus ist wieder kurz.** Wer mit dem Zeiger über eine
  Fähigkeit fuhr, bekam die vollständige Beschreibung als riesigen Kasten
  angezeigt — bei der Mauer knapp 700 Zeichen. Jetzt steht dort ein Satz.

- **Im Fenster liegt nichts mehr über den Knöpfen.** Beim Einsetzen einer
  Fähigkeit schob sich eine Schachfigur des Anleitungsbretts quer über
  „Abbrechen". Dieselbe Ursache lag an zwei weiteren Stellen: Die Restzeit-Zahl
  eines Feldes legte sich beim Scrollen über die Leiste „am Zug", und der
  schwebende Zurück-Knopf der Fähigkeiten-Bibliothek lag über einem offenen
  Fenster und liess sich anklicken.

- **„etwa 1 Stunden" heisst jetzt „etwa 1 Stunde".** Die Dauer-Zeile unter den
  Spielart-Kacheln (aus v0.93) traf den Fall bei jeder gut gefüllten Partie.

- **Wenn die Seite am Zug keinen einzigen Zug hat, sagt die Leiste das** —
  „Kein Zug möglich" statt „am Zug". Das ist die Absicherung für den Fall, dass
  so eine Stellung auf einem noch unbekannten Weg doch einmal entsteht.

- **Kleinigkeiten:** Der Anlege-Bildschirm heisst „Neue Partie" statt „Welche
  Spielart?" — die Spielart ist dort der letzte Schritt, nicht der erste. Und
  derselbe Knopf heisst nicht mehr einmal „Neu aufstellen" und einmal „Partie
  zurücksetzen".

An den Spielregeln selbst ändert sich nichts. Laufende Partien laufen weiter;
eine, die durch eine Fähigkeit längst matt war, wird beim nächsten Zug
ordentlich beendet.

## v0.93.0 — 2026-08-20

**Unter jeder Spielart steht jetzt, wie lange eine Runde ungefähr dauert.**

- Beim Anlegen zeigt jede Kachel neben der Figurenzahl eine Zeile
  **„Dauer: etwa 25 Minuten"**. Sie geht mit, sobald du an den Einstellungen
  drehst — mehr Figuren, ein grösseres Brett oder mehr Lootboxen heissen mehr
  Zeit.

- **Die Schätzung lernt mit.** Sie rechnet nicht nur mit einer Faustformel,
  sondern zieht heran, wie lange in euren bisherigen Partien tatsächlich
  gespielt wurde. Je mehr ihr spielt, desto besser trifft sie.

- Es bleibt ausdrücklich ein **Anhaltspunkt**, keine Zusage — deshalb steht
  „etwa" davor und wird auf fünf Minuten gerundet.

## v0.92.0 — 2026-08-20

**Vier Änderungen an den Fähigkeiten.**

- **„Friedhof" heisst jetzt „Nekromant".**
- **Der Unglückswürfel „Erdbeben" heisst jetzt „Riss"** — passend dazu, was er
  tut und wie die Felder danach heissen.
- **Der „Spiegel" ist jetzt lila** statt gelb: Er kommt damit etwas häufiger
  vor.
- **Die „Wiedergeburt" ist ausgeblendet.** Sie erscheint nicht mehr in
  Lootboxen und steht nicht mehr in der Bibliothek. **Wer sie noch im Vorrat
  hat, darf sie aufbrauchen** — sie wird niemandem weggenommen.

Bei allen vieren ändert sich nur, was du siehst: In laufenden Partien bleiben
Vorrat und Zugverlauf vollständig erhalten.

## v0.91.0 — 2026-08-20

**Zwei Einstellungen haben nichts getan — jetzt tun sie es.**

- **„Wie viele Figuren je Seite?" (aus v0.86) und „Welche Items kommen vor?"
  (aus v0.87) wurden beim Anlegen der Partie verworfen.** Man konnte sie
  einstellen, die Vorschau zeigte sogar das Richtige — die Partie startete
  aber immer mit „normal" beziehungsweise „alle". Beide Einstellungen wirken
  ab sofort wirklich.

  Wenn du dich gewundert hast, dass eine Partie trotz „wenig" voll besetzt
  war oder trotz begrenztem Vorrat jedes Item vorkam: Das war dieser Fehler,
  nicht dein Gedächtnis. Bereits angelegte Partien behalten ihre
  Einstellungen — die Spielart steht mit dem Anlegen fest.

## v0.90.0 — 2026-08-20

**Die App heisst wieder „Quizz" — die Umbenennung ist zurückgenommen.**

- Nach Rücksprache in der Runde bleibt es beim eingeführten Namen: Titel,
  Kopfzeile, Name auf dem Startbildschirm, der Tab „Würfel Quizz" und die
  Ranglisten-Spalte stehen wieder so da wie vorher. Damit heisst die App
  überall gleich — sichtbar wie im Hintergrund.

- Für dich ändert sich nichts weiter: PIN, Verwaltungs-Passwort, laufende
  Runden, Partien und die Rangliste waren nie betroffen.

## v0.89.0 — 2026-08-20

**Die App heisst jetzt richtig: „Quiz" mit einem z.**

- Seitentitel, Kopfzeile, der Name auf dem Startbildschirm, die
  Tab-Beschriftung „Würfel Quiz" und die Ranglisten-Spalte sind korrigiert.
  Wer die App schon auf dem Startbildschirm hat, sieht den neuen Namen nach
  dem nächsten Laden.

- **Für dich ändert sich sonst nichts:** Deine PIN, das Verwaltungs-Passwort,
  laufende Runden, Partien und die Rangliste bleiben unverändert. Im
  Hintergrund behält die App bewusst ihre bisherigen Kennungen — sie stecken
  in den Prüfsummen der PINs und Siegel und in der Adresse aller
  gespeicherten Daten.

## v0.88.0 — 2026-08-20

**Die schwarzen Streifen sind weg, und es gibt eine neue Fähigkeit.**

- **Behoben: schwarze Streifen beim Drehen des Displays** (gemeldet als #34).
  Die Feldgröße wurde nur beim Zeichnen gemessen — nach dem Drehen rechnete
  die Seite mit der neuen Breite weiter, die gemessene Zahl blieb aber stehen.
  Dadurch passte das Raster nicht mehr, und die Fugen wurden als dunkle
  Streifen sichtbar. Jetzt wird beim Drehen neu gemessen.

- **Neu: „Enttarnen".** Sie gibt es **nur in Partien, die die Seltenheit der
  Lootboxen verbergen** — dort siehst du 6 Halbzüge lang, wie selten die
  liegenden Lootboxen sind. **Was drin steckt, verrät sie weiterhin nicht**,
  und der Gegner merkt nichts davon. Du bleibst am Zug. Ist die Seltenheit in
  einer Partie ohnehin sichtbar, kommt die Fähigkeit dort gar nicht vor.

## v0.87.0 — 2026-08-20

**Du bestimmst, welche Items es in einer Partie überhaupt gibt.**

- **Neue Knopfreihe „Welche Items kommen vor?"** — direkt unter der Frage, wie
  viele Lootboxen es geben soll. Vier Stufen: wenig (5), 10, viele (15), alle (derzeit 19).
  „Alle" ist die Vorgabe und ändert nichts am bisherigen Spiel.

- **Der Vorrat wird beim Anlegen einmal ausgelost** und gilt für beide Seiten
  gleich — mit denselben Chancen wie im Spiel, seltene Items bleiben also
  selten. Aus einer Lootbox kommt danach nur noch, was in diesem Vorrat steht.

- **Oben in der Partie steht, welche Items drin sind.** Ein Tippen auf
  „Diese Items gibt es" zeigt die ganze Liste — auch im dreissigsten Zug noch,
  man muss sie sich nicht merken. Bei „alle" erscheint die Anzeige nicht.

- Bleibt eine Seltenheitsstufe dabei ganz leer, wird sie nicht mehr gezogen:
  Es erscheint also keine Lootbox, aus der nichts herauskommt.

- Angefangene Partien ändern sich nicht — ohne gespeicherte Angabe gilt „alle".

## v0.86.0 — 2026-08-20

**Du bestimmst, wie viele Figuren auf dem Brett stehen.**

- **Ganz oben beim Anlegen steht jetzt eine Knopfreihe „Wie viele Figuren je
  Seite?"** mit vier Stufen: wenig, normal, viel, voll. Sie ist immer da und
  wird wie die Knöpfe für die Lootbox-Menge bedient.

- **Die Zahl unter jeder Spielart-Kachel geht sofort mit.** Was dort steht, ist
  die Zahl, mit der die Partie wirklich anfängt — Kachel und Partie rechnen
  dieselbe Aufstellung.

- Die Stufe wirkt auf die **Zufallsarmee**. Ohne diesen Haken bringt jede
  Spielart ihre eigene Aufstellung mit; die Knopfreihe sagt das dann auch.
  **Ein König ist immer dabei**, auch auf der kleinsten Stufe.

- Angefangene Partien ändern sich nicht: Wer keine Stufe gespeichert hat,
  spielt mit „normal" weiter — genau der Zahl, die vorher galt.

## v0.85.0 — 2026-08-20

**Eine neue Fähigkeit und eine stapelbare Mauer.**

- **Neu: der Dieb.** Er nimmt dem Gegner bis zu zwei Fähigkeiten weg und legt
  sie in deinen Vorrat. Vorher siehst du in einem Fenster, was du bekommst,
  und darfst ablehnen — dann behältst du den Dieb, und nach dem nächsten Zug
  greift er woanders zu. Hat der Gegner gerade nichts, geht es nicht. Der
  Bestohlene sieht im Verlauf, was ihm genommen wurde. Der Dieb ist selten
  (lila) und kostet den Zug.

- **Die Mauer lässt sich jetzt auf eine bestehende Mauer legen** — auch auf
  die des Gegners. Wo sich beide überdecken, zählt die Restzeit der alten
  Mauer dazu; die übrigen Felder halten die üblichen 6 Halbzüge. Legst du
  also eine Mauer so, dass nur zwei Felder auf der alten liegen, stehen genau
  diese zwei länger — das dritte ganz normal. Auf einen Riss kommt sie
  weiterhin nicht.

## v0.84.0 — 2026-08-19

**Ausdehnung und Einsturz sind vorerst aus dem Spiel.**

- **Das Brett wächst und schrumpft nicht mehr.** Die beiden Unglücks-Lootboxen
  „Ausdehnung" und „Einsturz" kommen nicht mehr vor — sie haben zu viele
  Fehler verursacht und werden erst überarbeitet, bevor sie zurückkehren.
  **Auch in laufenden Partien:** Liegt so eine Box noch auf dem Brett,
  verschwindet sie beim nächsten Laden, damit sie niemanden mehr trifft.
  In der Bibliothek werden beide nicht mehr aufgeführt; im Zugverlauf einer
  alten Partie bleiben sie lesbar.

- Damit ist die blaue Stufe der Unglücks-Lootboxen derzeit leer. Ihre Chance
  verteilt sich auf die übrigen Stufen — es kommt also genauso oft ein
  Unglück wie vorher, nur eben keins der beiden ausgebauten.

## v0.83.1 — 2026-08-19

**Zwei Fehler behoben — ein Item mit Pluszeichen ist jetzt wirklich gratis.**

- **Ein Item mit Pluszeichen (etwa die Mauer) zählt nicht mehr heimlich als
  Teilzug.** Vorher verschob das Einsetzen den Lootbox-Fahrplan um einen
  Halbzug — der eigene nächste Zug konnte dadurch Lootboxen bringen, die ohne
  das Item nicht gekommen wären, und auf der Stufe „wenig" kamen sie zum
  falschen Zeitpunkt. Jetzt richtet sich der Fahrplan nur noch nach echten
  Zügen; das Einsetzen eines Items ändert daran nichts mehr.

- **Das umgedrehte Fragezeichen der Unglücks-Lootbox sitzt wieder in der
  Box.** Es war beim Spiegeln nach unten gerutscht und hing aus der
  Würfelfläche heraus.

## v0.83.0 — 2026-08-18

**Die Spielart-Kacheln sagen jetzt mehr.**

- **Unter jeder Kachel steht, wie viele Figuren je Seite antreten.** Gezählt
  wird aus dem Bild, das die Kachel wirklich zeigt — nicht aus einer zweiten
  Liste, die irgendwann davon abweicht. Sind die Seiten unterschiedlich stark,
  stehen beide Zahlen da („4 gegen 3 Figuren").

- **Mit dem Haken „Zufallsarmee" zeigt jede Kachel ein echtes Beispiel.** Vorher
  sah man die volle Aufstellung, obwohl gleich etwas ganz anderes auf dem Brett
  stehen würde. Das Beispiel wird mit derselben Funktion gerechnet, die auch die
  echte Partie aufstellt — und es steht still: Beim Neuzeichnen kommt dasselbe
  Bild, es flackert nicht. Der Haken „Unterschiedliche Armeen" wirkt mit.

## v0.82.0 — 2026-08-18

**Zwei Fehler beim Erdrutsch und ein etwas ruhigerer Regen.**

- **Der Erdrutsch schob Figuren auf Mauern und in Risse.** Er war die einzige
  dieser Fähigkeiten, die nur gefragt hat „steht da eine Figur" — nicht, ob das
  Feld überhaupt begehbar ist. Eine zurückgerutschte Figur stand danach auf
  einem Feld, das es für die Regeln nicht mehr gibt. Das betraf **jedes Brett**,
  nicht nur das Kreuz.

- **Auf dem Kreuz rutschte die falsche Armee in die falsche Richtung.** Die
  Richtung hing an der Farbe und ging immer senkrecht. Auf dem Kreuz hat eine
  Farbe aber zwei Startseiten: Die obere Armee rutschte nach unten, also nach
  VORN — aus der Strafe wurde ein Geschenk —, und die untere bewegte sich gar
  nicht. Jetzt rutscht jede Figur zu der eigenen Startseite, die ihr am
  nächsten liegt.

- **Der Lootbox-Regen ist etwas ruhiger geworden.** Am Ende bleibt alles wie
  gehabt: Stehen nur noch die beiden Könige, bekommt weiterhin jedes freie Feld
  eine Lootbox. Davor kommt spürbar weniger — bei 32 freien Feldern jetzt 3
  statt 5 Stück, bei 40 dann 7 statt 11, bei 48 dann 18 statt 23.

**Und eine Frage ist beantwortet:** Wie der Regen rechnet, steht jetzt
nachvollziehbar in der Roadmap (Bündel S1) — mit den Formeln, den Exponenten
und einer gemessenen Tabelle.

## v0.81.0 — 2026-08-18

**Die Mauer lässt sich drehen.** Beim Platzieren steht jetzt ein Knopf
„Senkrecht legen" im Vorschau-Kasten — damit legst du die drei Felder
übereinander statt nebeneinander. Ein zweiter Tipp dreht sie zurück.

Nach dem Drehen wird die Auswahl neu gerechnet: Wo drei Felder nebeneinander
frei sind, müssen nicht auch drei übereinander frei sein. Du siehst also sofort,
wohin die gedrehte Mauer überhaupt noch passt, und der bisherige Vorschau-Platz
wird geleert statt stillschweigend ungültig zu werden.

Der Rand gilt jetzt für beide Achsen: Waagerecht ging sie am linken und rechten
Rand nicht, senkrecht geht sie in der obersten und untersten Reihe nicht — es
fehlt jeweils der Nachbar, den sie auf einer Seite braucht.

**Auch wenn dein Team sich einig sein muss**, stimmt ihr jetzt über die richtige
Mauer ab: Die Lage steht mit im Vorschlag. Vorher hätte das Team über eine
waagerechte abgestimmt und eine senkrechte bekommen.

**Nebenbei behoben:** Auf einem gedrehten Brett (Kreuz-Spielarten) sassen die
runden Enden der Mauer an den falschen Seiten — die Zeichnung rechnete mit der
Lage im Spielstand statt mit der Lage vor deinen Augen.

## v0.80.0 — 2026-08-18

**Zwei Punkte aus dem Eingangskorb: Der Frost sperrt jetzt auch Könige ein, und
das Nudelholz kostet einen Zug.**

- **Der Frost ist eine Mauer um den Block geworden, kein Anker.** Wer darin
  steht, darf sich **innerhalb** des 2-mal-2-Feldes weiter bewegen — nur heraus
  kommt er nicht. Bisher stand eine eingefrorene Figur einfach still.

- **Und er gilt jetzt auch für Könige.** Wer einen König so einsperrt, dass ihm
  im Block kein Feld mehr bleibt, **setzt ihn matt**. Bisher war der König vom
  Frost ganz ausgenommen. Damit ist der Frost die erste Fähigkeit im Spiel, mit
  der man gewinnen kann — bis jetzt konnte das nur eine Unglücks-Lootbox
  (seit v0.73). Ein Block, in dem nur ein König steht, lässt sich deshalb ab
  sofort überhaupt erst anwählen; vorher wurde er abgewiesen.

  Was **nicht** dazugehört: Eingefroren heisst weiterhin auch unantastbar. Im
  Block wird nicht geschlagen, weder rein noch untereinander.

- **Das Nudelholz hat sein Pluszeichen verloren** — es IST jetzt dein Zug,
  danach ist der Gegner dran. Es rollt eine ganze Doppelspalte, und mit dem Zug
  obendrauf waren das zwei Züge für eine Fähigkeit. Überfällig war es
  ausserdem, weil es in v0.78 stärker geworden ist (es rollt seither auch
  Könige), ohne dass der Preis mitzog. Dieselbe Anpassung hat der Bauernschub
  in v0.56 bekommen, aus demselben Grund.

**Was aus dem Eingangskorb noch NICHT gebaut ist:** der Dreh-Knopf für die
Mauer, die zwei Fähigkeiten Enttarnen und Verstecken und der Modus mit
begrenztem Item-Vorrat samt Anzeige am Matchbeginn. Sie stehen eingeordnet und
priorisiert in der Roadmap.

## v0.79.0 — 2026-08-18

**Zwei neue gewöhnliche Fähigkeiten, und die Halluzination ist halb so lang.**

Nachdem Ausweichen raus ist, standen in der gewöhnlichen Stufe nur noch Sprung
und Teleport. Beide **sind** dein Zug, beide machen dasselbe — eine Figur
bewegt sich anders als sonst. Bei 52 Prozent Stufenchance war jede zweite
Lootbox ein Münzwurf zwischen zwei sehr ähnlichen Dingen, und Grün hatte kein
Pluszeichen mehr: nie etwas, das zum Zug **dazu** kommt.

- **Schubs** (gewöhnlich, Pluszeichen). Tippe eine gegnerische Figur an, die
  neben einer deiner Figuren steht — sie weicht ein Feld zurück. Nur auf ein
  freies Feld, geschlagen wird nichts, und Könige bleiben stehen. Stehen
  mehrere deiner Figuren daneben, zeigt der Vorschau-Kasten vorher, wohin es
  geht. **Dein Zug bleibt dir.** Der kleine Bruder des Nudelholzes: eine Figur,
  ein Feld, statt zweier ganzer Spalten.

- **Platztausch** (gewöhnlich, Pluszeichen). Tippe eine eigene Figur an: Sie
  tauscht den Platz mit deiner eigenen Figur direkt davor. So kommt der Läufer
  hinter dem Bauern hervor, ohne dass es einen Zug kostet. Nur zwischen zwei
  eigenen Figuren, und der König tauscht nicht.

- **Die Halluzination dauert nur noch 4 statt 8 Halbzüge** — zwei eigene Züge
  blind statt vier. Sie war für das häufigste Unglück auf der harmlosesten
  Stufe deutlich zu lang.

**Was sich an den Zahlen ändert:** Gewöhnlich hat jetzt vier Fähigkeiten zu je
13 Prozent statt zweier zu je 26. Zwei davon **sind** dein Zug (Sprung,
Teleport), zwei kommen **obendrauf** (Schubs, Platztausch). Die Leiter über die
Stufen bleibt und ist sogar deutlicher geworden: 13 Prozent je gewöhnliche,
6,6 je ungewöhnliche, 2,4 je epische, 0,8 je legendäre.

**Verschoben wurde nichts.** Alle vier Stufen sind dabei durchgesehen worden:
Grün wirkt auf ein Feld, Blau auf drei Felder oder zwei Spalten, Lila sperrt
den Gegner über mehrere Züge, Gelb schenkt Material. Das passt so.

## v0.78.0 — 2026-08-18

**Ausweichen ist raus.** Es erscheint in keiner neuen Lootbox mehr und steht
auch nicht mehr in der Fähigkeiten-Bibliothek.

Vorher nachgemessen: Die Fähigkeit war **nicht kaputt** — einsetzen ging nur,
während der Gegner am Zug war, das Muster überlebte seinen Zug, die Figur hatte
danach wirklich alle freien Nachbarfelder zur Wahl. Unbrauchbar machte sie
genau diese Regel: Solange du selbst am Zug bist, ist sie gesperrt — also in
dem Moment, in dem man normalerweise auf seine Fähigkeiten schaut.

**Wer sie noch im Vorrat hat, kann sie weiter einsetzen.** Sie ist versteckt,
nicht gelöscht: Eine Fähigkeit, die ganz aus dem Spiel verschwindet, würde
laufenden Partien beim nächsten Laden aus dem Vorrat fallen.

**Was sich dadurch nebenbei ändert:** In der gewöhnlichen Stufe stehen jetzt
zwei Fähigkeiten statt dreien (Sprung und Teleport). Jede von ihnen kommt
entsprechend häufiger — die Prozentzahlen hinter dem i-Knopf rechnen das von
selbst mit.

## v0.77.1 — 2026-08-18

**Das Kreuz-Brett zerfranste im Laufe einer Partie.** Gemeldet mit
Bildschirmfoto: Auf einem Kreuz waren die vier toten Ecken unsymmetrisch —
links unten war alles bespielbar, rechts unten und links oben fehlten Felder,
und Lootboxen lagen dort, wo eigentlich ein Loch sein müsste.

Die Ursache war das Zusammenspiel zweier Unglücks-Lootboxen: Die **Schrumpfung**
wirft eine Reihe oder Spalte samt ihren Löchern weg — das ist richtig so. Die
**Ausdehnung** baute die neue Reihe oder Spalte aber immer vollständig
bespielbar an, auch am Kreuz. Damit bekam die Ecke ein Loch nach aussen, und
jedes Paar aus Schrumpfen und Wachsen kostete das Brett ein Stück Form, ohne
dass jemand etwas dafür konnte.

**Jetzt wachsen die toten Ecken mit:** Die Ausdehnung schaut sich die Rand-Reihe
bzw. -Spalte an, an die sie anbaut, und setzt deren Ecken fort. Kopiert werden
dabei nur die Löcher, nie die Figuren — und nur die Löcher an den ENDEN der
Linie, denn genau das sind die Ecken. Ein einzelnes Loch mitten am Rand stammt
von einem Erdbeben; es gehört dem Spielverlauf und wächst nicht mit, sonst
würde es sich mit jeder Ausdehnung verbreitern. Auf dem klassischen Brett ohne
Löcher ändert sich nichts.

**Hinweis zur laufenden Partie:** Die Behebung wirkt ab der nächsten Ausdehnung.
Ein Brett, das sich schon zerfranst hat, behält seine Form — die Löcher
nachträglich zu setzen würde bedeuten, mitten im Spiel Felder unter Figuren und
Lootboxen zu schliessen.

## v0.77.0 — 2026-08-18

**Sieben Punkte aus derselben Spielrunde — zwei Wünsche, zwei Regeländerungen,
zwei Nachmessungen und ein Versionsstempel.**

- **Die Mauer lässt sich jetzt überall hinlegen, wo Platz ist — und frisst die
  Lootbox darunter.** Bisher waren Felder mit einer Lootbox als Ziel gesperrt,
  weil die Box unter der Mauer unsichtbar und unerreichbar gewesen wäre. Man
  sah aber nicht, warum ein Feld nicht ging. Jetzt geht es: Die Mauer darf
  überall hin, wo drei freie Felder nebeneinander liegen, und eine Lootbox
  darunter ist danach wirklich weg. Der Zugverlauf sagt es dazu („frisst 1
  Lootbox"). Damit du beim Platzieren siehst, worauf du baust, **werden die
  Lootboxen dabei ausgeblendet** — genau wie beim Friedhof.

- **Das Nudelholz rollt jetzt auch Könige.** Es bewegte schon immer alle
  Figuren beider Farben in den zwei Spalten — nur Könige nicht. Und ein König
  hielt damit auch alles auf, was hinter ihm stand: Standen zwei Figuren hinter
  ihm, bewegte sich gar nichts. Jetzt rollt wirklich alles. Deinen **eigenen**
  König kannst du dir damit trotzdem nicht ins Schach schieben — das war schon
  vorher verboten und gilt weiter.

- **Unglücks-Lootboxen kommen jetzt häufiger, je leerer das Brett wird.** Bisher
  war es eine feste Zahl (jede achte Box), egal wie weit die Partie war. Jetzt
  hängt es am Füllstand — dieselbe Rechnung, die auch die MENGE der Lootboxen
  steuert: Auf der Stufe **wenig** bleibt alles wie bisher, auf **normal**,
  **viele** und **Regen** steigt der Anteil mit dem leerer werdenden Brett an,
  bis auf höchstens gut jede dritte Box. Je höher die Stufe, desto früher.
  **Welche** Unglücke kommen, ändert sich nicht: grün am häufigsten, dann blau,
  dann lila, dann gelb.

- **Vier kleine Animationen auf dem Brett** — ohne Farbe und sehr zurückhaltend:
  Eine **erscheinende Lootbox** wächst auf, eine **verschwundene** (eingesammelt,
  von einer Mauer gefressen oder in einen Riss gefallen) hinterlässt einen
  kurzen Ring, eine **neu erschienene Figur** (Nachschub, Spiegel, Wiedergeburt,
  Wiederbelebung, Friedhof) wächst auf, und wo **geschlagen** wurde, geht
  derselbe Ring auf. Eine Figur, die nur gezogen ist, bekommt keine — sie
  gleitet wie bisher. Wer im Betriebssystem „weniger Bewegung" eingestellt hat,
  sieht sie nicht.

- **Jede neue Partie merkt sich, mit welcher Version sie angelegt wurde.** In
  der Übersicht steht es an der Partie, aber nur dann, wenn es eine andere
  Version ist als die, mit der die Seite gerade läuft. Damit ist bei einer
  Meldung sofort klar, auf welchen Stand sie sich bezieht. Antwort auf die
  Frage, ob laufende Partien in ihrer Startversion bleiben können: **Regeln
  ändern sich in einer laufenden Partie ohnehin nie** — jede neue Regel wird
  beim Anlegen mitgeschrieben, und eine Partie ohne sie rechnet weiter wie
  vorher. Fehlerbehebungen wirken dagegen sofort, und das ist so gewollt.

**Zwei Meldungen waren keine Fehler:**

- **Das Nudelholz schlägt nicht — es kann es gar nicht.** Nachgemessen: Es
  schiebt ausschliesslich auf leere Felder, und die Zahl der Figuren auf dem
  Brett ist vorher und nachher gleich. Was du gesehen hast, sieht nur genauso
  aus: Steht eine gegnerische Figur direkt vor deiner, wird **zuerst sie** ein
  Feld vorgeschoben, und deine rückt auf deren altes Feld nach. Deine Figur
  steht danach dort, wo eben noch die gegnerische stand — die ist aber nicht
  weg, sondern ein Feld weiter.
- **Ausweichen funktioniert.** Nachgemessen an der ganzen Kette: Einsetzen geht
  nur, während der Gegner am Zug ist, die Fähigkeit überlebt seinen Zug, die
  Figur hat danach wirklich alle freien Nachbarfelder zur Wahl, und danach ist
  sie verbraucht. Dass sie sich selten anbietet, liegt an genau dieser Regel —
  sie ist gesperrt, solange du am Zug bist, also in dem Moment, in dem man
  normalerweise auf seine Fähigkeiten schaut. Ob sie versteckt wird, ist noch
  offen.

## v0.76.0 — 2026-08-18

**Zehn Punkte aus dem Eingangskorb — sechs Fehler und vier Regeländerungen.**

- **Die Zugspur bleibt grün, auch wenn dabei eine Unglücks-Lootbox eingesammelt
  wird.** Bisher wurde die ganze Spur gelb — und sie hörte dort auf, wo die
  Lootbox lag, obwohl die Figur ganz woanders stand. Jetzt sind es zwei Spuren
  nebeneinander: **grün der eigene Zug** (woher, wohin), **gelb nur, was das
  Unglück wirklich bewegt hat**. Auch die gleitende Bewegung nimmt wieder die
  Figur des Zuges statt des Lootbox-Feldes.
- **Die Bildlaufleisten sind jetzt eingefärbt wie der Rest der Seite.** In
  dunkler Darstellung stand eine weisse Leiste am Rand jedes Fensters, das
  scrollt — am deutlichsten in den Anleitungen. Sie gehört dem Browser, nicht
  der Seite, und folgt nur, wenn man es ihm sagt: Die Seite nennt jetzt ihre
  Darstellung (`color-scheme`) und färbt die Leisten zusätzlich selbst. Gilt
  überall, wo etwas scrollt — Dialoge, Zugverlauf, Punkte-Aufschlüsselung.
- **Beim Anlegen ist „Team muss sich einig sein" jetzt die Vorgabe.** Der Haken
  steht andersherum da und heisst **„Wer zuerst zieht, hat gezogen"** — wer den
  schnellen Weg will, hakt ihn an. Laufende Partien ändern sich nicht; im
  gespeicherten Stand steht dieselbe Einstellung wie bisher.

- **Der Doppelzug nimmt den zweiten Zug nicht mehr zurück.** Gemeldet als „der
  zweite Zug wird nur angezeigt". Am Doppelzug lag es nicht: Die regelmässige
  Abfrage prüfte VOR dem Netzaufruf, ob gerade ein eigener Zug unterwegs ist —
  und übernahm die Antwort auch dann, wenn in den ein bis zwei Sekunden
  Wartezeit genau das passiert war. Danach rechnete der Bildschirm mit einem
  veralteten Zählerstand, und der nächste Zug wurde als „jemand war schneller"
  abgewiesen. Auffallen konnte das nur beim Doppelzug: Sonst ist zwischen zwei
  eigenen Zügen immer der Gegner dran. Überholte Antworten werden jetzt
  weggeworfen.
- **Auf Kreuz-Brettern erscheinen keine Lootboxen mehr im Nichts.** Die vier
  toten Ecken sind Risse — leer, aber unerreichbar. Eine Box dort lag für immer
  im Schwarzen. Nebenbei zählen die Ecken jetzt auch nicht mehr als Brett: Auf
  dem Kreuz regnete es dadurch spürbar weniger als auf einem gleich grossen
  Quadrat.
- **Der Figurenzähler unter dem Brett zählt jetzt die Figuren, die DA SIND** —
  so wie in den bekannten Schach-Apps. Vorher rechnete er Beute minus eigene
  Verluste; jede Umwandlung, jede Wiedergeburt und jede Verstärkung fehlte
  darin. Und das Plus steht nur noch bei dem, der vorn liegt: Ein „-8" auf der
  anderen Seite war dieselbe Auskunft ein zweites Mal. **Der Satz „beim Material
  lagt ihr vorn/hinten" in der Rückschau rechnet jetzt ebenfalls aus der
  Schlussstellung**; darüber stehen zwei neue Zeilen, was am Ende noch auf dem
  Brett stand.
- **Die Rückschau zeigt das Kreuz-Brett als Kreuz.** Im kleinen Schlussbild
  fehlten die Risse — es sah aus wie ein gewöhnliches Quadrat, in dessen Ecken
  zufällig nichts stand. Das galt auch für jede Anleitung, in der ein Erdbeben
  Löcher reisst.
- **Sprung und Teleport lassen sich abbrechen** (neu). Wer sie einsetzt, ist
  sofort dabei, eine Figur auszuwählen — und die Fähigkeit war weg. Jetzt steht
  unter dem Brett eine Leiste mit **Abbrechen**: Die Stellung bleibt, wie sie
  war, und die Fähigkeit kommt zurück in den Vorrat. Fähigkeiten mit Zielfeld
  haben das seit v0.57.
- **Die Zufallsarmee auf dem Kreuz steht auf BEIDEN eigenen Seiten** (neu). Bis
  jetzt kannte sie nur oben und unten: Auf dem Kreuz standen beide Armeen quer
  über der Mitte, die Flügel blieben leer — und die Ansicht drehte sich auf eine
  Startseite, auf der gar nichts stand. Jetzt bekommt jede Startseite ihre
  eigene Armee, und wie viele Figuren das sind, richtet sich nach der MITTE des
  Kreuzes statt nach der Brettbreite: **kleines Kreuz 4 je Seite (also 8 je
  Team), Kreuz 8, grosses Kreuz 12.** Beim **Kreuz-Duell** bleibt es bei einer
  Armee je Team, gegenüber — beim kleinen also 4 gegen 4.
- Beim Doppelzug darf man weiterhin **je Zug auch ein Item einsetzen statt sich
  zu bewegen**; das war schon so und ist jetzt durch einen Test festgehalten.

## v0.75.0 — 2026-08-14

**Die Bildanleitungen aus Bündel I — zehn Szenen neu gestellt.**

- **Der Händler zeigt endlich sein Fenster.** Bisher stand sein Angebot nur als
  Satz unter dem Bild; jetzt ist das Fenster zu sehen, in dem man annimmt oder
  ablehnt — mit demselben Wortlaut wie im Spiel.
- **Friedhof und Wiederbelebung zeigen die Gefallenen blass**, so wie am echten
  Brett. Vorher erzählten beide Anleitungen von etwas, das man nicht sah.
- **Die Fessel zeigt den Schlag.** Ein Bild mehr: Der Gegner zieht — nur die
  gefesselte Figur nicht —, und dann fällt sie wirklich.
- **Der Stolperstein bricht einen Angriff ab.** Am Ende der Spalte steht jetzt
  ein Läufer, den der Turm schlagen wollte: Der Stein wirft ihn zurück, und
  geschlagen wird nichts.
- **Die Halluzination geht bis zum Schlag durch**, und es stehen genug Gegner
  da, um die Verwandlung überhaupt zu sehen.
- **Beim Einsturz gelingt der Angriff:** Der Turm erreicht sein Ziel und
  schlägt — nur das Spielfeld wird nebenbei kleiner.
- **Das Erdbeben spielt nicht mehr auf einem vollgestellten Brett.** Fünf
  Figuren statt dreissig; dass die Risse trotzdem verlässlich vor dem Turm
  aufreissen, macht eine eigene Kennung dieser Szene.
- **Bei der Ausdehnung steht der Gegner nicht mehr im Weg** — vorher stand ein
  schwarzer Bauer so, dass jeder ihn geschlagen hätte, statt auf die Lootbox zu
  ziehen.
- **Beim Frost ist der Turm erklärt:** Er steht von Anfang an in der Spalte
  seines Ziels, statt aus der Ecke aufzutauchen.
- **Bei der Meuterei läuft ein Turm über**, kein Bauer.
- **Beim Doppelzug ist der Läufer zu sehen** — er stand in der äussersten
  Spalte und ging dort im Rahmen unter.
- **Beim Schutzschild sagt das letzte Bild jetzt, wozu das gut ist:** woanders
  angreifen, ohne Angst um die Dame.

## v0.74.0 — 2026-08-14

- **Die Anleitung zum Ausweichen führt nicht mehr ins Verderben.** Im alten
  Bild floh der Turm auf ein Feld, das ein schwarzer Bauer sofort schlagen
  konnte — die Notbremse endete also im Verlust. Die Stellung ist neu gestellt:
  Der Turm ist von den eigenen Leuten zugestellt, ein Springer droht, und es
  bleibt genau **ein** freies Feld, an das der Springer nicht herankommt. Dass
  das Fluchtfeld wirklich sicher ist, rechnet jetzt ein Test nach — mit
  denselben Regeln, die im Spiel über Schach entscheiden.

## v0.73.0 — 2026-08-14

**Achtung, eine Regel ändert sich grundlegend:** Eine Unglücks-Lootbox kann ab
jetzt eine Partie beenden. Wer vom Stolperstein so zurückgeworfen wird, dass
sein König danach im Schach steht, hat verloren. Für Fähigkeiten gilt weiter,
dass sie den eigenen König nie im Schach zurücklassen dürfen — eine Fähigkeit
wählt man, ein Unglück trifft einen.

- **Der Stolperstein wirft dorthin zurück, wo du herkamst.** Bisher ging es
  immer ein Feld Richtung eigener Grundreihe. Jetzt fliegt ein diagonal
  ziehender Läufer diagonal zurück, und gezählt wird **ab dem Feld der
  Lootbox**, nicht ab dem Zielfeld: Man stolpert dort, wo der Stein liegt. Der
  **Springer** kehrt an seinen Ausgangsort zurück — zwischen Absprung und
  Landung gibt es keine Richtung.
- **Ein abgebrochener Angriff schlägt nichts.** Wer sein Ziel nicht mehr
  erreicht, weil er unterwegs gestolpert ist, schlägt dort auch nicht: Die
  gegnerische Figur kommt zurück aufs Brett. (Dieselbe Regel gilt seit v0.58
  schon für den Zug, der an einem Riss endet.)
- **Der Frost lässt sich überall setzen, wo eine Figur steht** — auch dort, wo
  nur eigene stehen. Eingefroren heisst auch unantastbar, und genau das kann
  der Zweck sein. Nur ein ganz leerer Block bleibt draussen.
- **Aus „Volles Glas" wird „Halluzination".** Nur der Name; laufende Partien
  merken nichts davon.
- **Risse sehen jetzt wirklich wie Löcher aus** — das Feld ist durchsichtig,
  statt eine eigene Farbe zu tragen.
- **Der Fingerabdruck am Vorrat-Knopf ist nicht mehr abgeschnitten.**
- **Ein Satz erklärt, warum die Anleitung nicht abgespielt wird.** Wer im
  Betriebssystem „weniger Bewegung" eingestellt hat, bekommt absichtlich alle
  Bilder nebeneinander — bisher sah das aus wie ein Fehler.
- **Die Mauer sagt jetzt, warum sie am äussersten Rand nicht geht:** Dort fehlt
  der Nachbar, den sie auf einer Seite braucht.

## v0.72.0 — 2026-08-14

- **Das Brett dreht sich so, dass deine Armee unten steht.** Bisher gab es zwei
  Ansichten: Weiss sah das Brett, wie es steht, Schwarz um 180 Grad gedreht.
  Auf dem Kreuz stehen Armeen aber auch links und rechts — wer dort spielte,
  sah seine eigene Armee quer von der Seite. Jetzt gibt es vier Lagen, und
  jeder bekommt die, in der eine seiner Armeen unten steht. Die
  Randbeschriftung dreht sich mit; bei einer Vierteldrehung stehen unten die
  Zahlen und links die Buchstaben.
  - **Gedreht wird EINMAL zu Beginn**, nicht im Laufe der Partie. Die Lage
    hängt an der Startseite deiner Armee und gehört deinem Gerät — im
    gemeinsamen Stand ändert sich dadurch nichts.
- **Drei neue Spielarten: die Kreuz-Duelle.** Dieselben drei Kreuz-Grössen,
  aber mit nur **einer Armee je Team** statt vier. Auf welcher der vier Seiten
  ihr startet, wird ausgelost; ihr steht euch immer gegenüber, und die beiden
  übrigen Streifen bleiben leer — sie sind der Umweg, über den man den Gegner
  umgehen kann. Ein König je Team heisst: Schach und Matt gelten von Anfang an
  (beim Kreuz mit vier Armeen hat man weiterhin zwei Leben).

## v0.71.0 — 2026-08-14

- **Vier Stufen statt Haken und Schieberegler: wie viele Lootboxen?** Direkt
  unter dem Haken „Lootboxen" stehen jetzt vier Kästchen nebeneinander —
  **wenig, normal, viele, Regen**. Sie ersetzen den Haken „Lootbox-Regen" und
  den Schieberegler „Wie früh es regnet"; beide beantworteten dieselbe Frage,
  und man musste sie zusammendenken.
  - **wenig** wirft nach jedem VOLLEN Zug etwas aus, meist eine Lootbox,
    selten zwei oder drei — unabhängig davon, wie voll das Brett ist.
  - **normal** und **viele** kommen nach jedem Halbzug und werden umso
    reichlicher, je leerer das Brett wird.
  - **Regen** ist das, was der Haken bisher konnte: Stehen am Ende nur noch
    die beiden Könige, bekommt jedes freie Feld eine Lootbox.
  - Jede Stufe liefert bei jedem Spielstand mindestens so viel wie die
    darunter — auch früh in der Partie.
  - **Für laufende Partien ändert sich nichts:** Sie tragen ihre Stufe noch
    nicht und bekommen sie aus ihren bisherigen Einstellungen ausgerechnet.
    Neu angelegte Partien mit „wenig" bekommen etwa halb so oft Nachschub wie
    bisher ohne Regen-Haken — wer die gewohnte Menge will, nimmt „normal".
- **Ein Haken zeigt seine Unterpunkte sofort.** „Lootboxen" angehakt, und die
  Unterpunkte darunter erschienen erst, wenn man zwischendurch auf eine andere
  Brettform und zurück tippte. Betroffen war zuletzt der Schieberegler; die
  Ursache lag seit v0.60 im Bildschirm-Code.

## v0.70.0 — 2026-08-13

- **Verborgene Lootboxen schillern.** Wer die Seltenheit nicht anzeigen lässt,
  bekam bisher ein unauffälliges Grau — jetzt läuft ein Regenbogen über die
  Box. Es ist bei **jeder** verborgenen Lootbox derselbe Verlauf: Eine Farbe je
  Stufe würde ja genau das verraten, was der Haken verbergen soll.
- **Ein großes quadratisches Brett.** Unter „Quadratisch" gab es nur zwei
  Größen; das „Große Brett" ist 10 mal 8 und liegt deshalb bei den
  rechteckigen. Neu ist **10 mal 10** — dieselbe Aufstellung wie das große,
  dazu vier Reihen Anlauf.

## v0.69.0 — 2026-08-13

- **Züge werden wieder gezeigt — auch mit dem Springer.** Die Spur des letzten
  Zuges und die gleitende Bewegung lasen beide den letzten Eintrag im
  Zugverlauf. Erscheint nach dem Zug eine neue Lootbox, steht die dort ganz
  hinten — und die hat kein Von und kein Nach. Damit fiel beides aus: Der Zug
  war passiert, aber nichts zeigte ihn. Beim **Springer** fiel es am meisten
  auf, weil sein L ohne Spur kaum nachzuvollziehen ist. Jetzt wird der letzte
  Eintrag gesucht, der wirklich eine Bewegung beschreibt.
- **Beim Öffnen kommt nur noch die zuletzt beendete Partie.** Vorher zeigte die
  App der Reihe nach jedes Ergebnis, das dieses Gerät noch nicht abgehakt
  hatte — wer ein paar Tage nicht hineingesehen hatte, klickte sich durch seine
  ganze Historie. Ältere Partien lassen sich weiterhin über „Ergebnis ansehen"
  öffnen.
- **Das Volle Glas sagt, wie lange es noch trübt.** Die Restzeit steht oben in
  der Leiste — und nur bei dem, den es trifft. Der Gegner soll nicht wissen,
  dass jemand falsch sieht.
- **Beim Schutzschild steht jetzt dabei, dass die Figur stehen bleiben muss.**
  Wer mit ihr zieht, verliert das Schild; das ergab sich bisher erst aus dem
  Spielverlauf.

## v0.68.0 — 2026-08-13

- **Aus „Würfel" wird „Lootbox".** Die Boxen, die im Team Schach auf freien
  Feldern erscheinen, heissen jetzt überall so: der Haken beim Anlegen
  („Lootboxen" statt „Zufalls-Würfel"), der Regen („Lootbox-Regen"), die
  schlechten („Unglücks-Lootbox") und jeder Satz in der Bibliothek, in den
  Anleitungen und im Zugverlauf.

  **Die echten Würfel im Würfel Quizz bleiben Würfel** — das sind welche.

- Nebenbei berichtigt: Der Hinweis „Melde dich zuerst im Tab Würfel Quizz an"
  nannte einen Tab, den es seit v0.61 nicht mehr gibt.

## v0.67.0 — 2026-08-13

- **Der Knopf zum Wegklicken ist immer da.** Tippt man im Spiel eine Fähigkeit
  an, kommt ein Fenster mit ihrer Erklärung und der abgespielten Anleitung —
  und das war auf dem Handy höher als der Bildschirm. „Verstanden",
  „Abbrechen" und „Einsetzen" lagen damit unter dem Rand, man musste erst im
  Fenster nach unten wischen. Jetzt bleibt das Fenster auf Bildschirmhöhe, sein
  Inhalt scrollt, und die Knopfleiste klebt unten fest. Gilt für jedes Fenster
  der App, nicht nur für die Fähigkeiten.

## v0.66.0 — 2026-08-13

Vier Fehler, die beim Spielen aufgefallen sind.

- **Ausweichen tut jetzt etwas.** Es liess sich einsetzen, und dann passierte
  nichts — die Fähigkeit war wieder da, das Brett unverändert. Ursache: Eine
  Fähigkeit mit Blitz wird eingesetzt, WÄHREND der Gegner am Zug ist. Die
  Sicherung gegen zwei gleichzeitige Züge aus einem Team hat sie deshalb fast
  immer als „jemand war schneller" abgewiesen. Jetzt wird nicht mehr abgewiesen,
  sondern **zusammengeführt**: Der Stand wird frisch geholt, die Fähigkeit
  darauf angewandt, fertig. Der gegnerische Zug bleibt dabei erhalten.
- **Eine Fähigkeit, die nicht gewirkt hat, ist nicht verbraucht.** Geht es
  wirklich nicht mehr (das Brett hat sich zu sehr geändert), bleibt sie im
  Vorrat, und es steht dabei, warum.
- **Die Meldung „Fenster blockiert" beim Wunsch-Knopf ist weg.** Sie kam jedes
  Mal, auch wenn der Wunsch sauber auf GitHub landete. Der Browser liefert beim
  Öffnen mit Schutzschalter grundsätzlich keine Rückmeldung — das war kein
  Fehlschlag, sondern normal. Der Schutz bleibt, die falsche Meldung nicht.
- **Die Mauer verschluckt keine Würfel mehr.** Ein Feld, unter dessen Riegel ein
  Würfel läge, steht nicht mehr zur Wahl: Solange die Mauer steht, käme dort
  niemand hin, und der Würfel wäre unsichtbar. (Bei einem **Riss** geht das
  nicht anders — der entsteht durch ein Unglück und fragt niemanden; dort fällt
  der Würfel wirklich hinein.)

## v0.65.0 — 2026-08-13

**Vier volle Armeen auf dem Kreuz.** Jede der vier Seiten hat jetzt eine
komplette Armee — Grundreihe plus eine Reihe Bauern. Beim mittleren Kreuz sind
das je **16 Einheiten**, beim kleinen 12, beim grossen 20.

- **Die Teams stehen sich gegenüber:** Ein Team bekommt oben und unten, das
  andere links und rechts. Welches welches, entscheidet sich beim Anlegen.
- **Zwei Armeen heissen zwei Könige — und damit zwei Leben.** Den ersten
  schlägt der Gegner wie jede andere Figur, beim letzten gelten wieder Schach
  und Matt. Dieselbe Regel wie bei der Zufallsarmee und beim Doppelbrett.
- **Ein Bauer schaut jetzt auf seine Startseite**, nicht mehr auf seine Farbe.
  Von dort läuft er geradewegs auf die gegenüberliegende Seite zu — das ist
  sein Ziel, dort wandelt er um. Geschlagen wird schräg nach vorn: Läuft er von
  rechts nach links, schlägt er vor sich oben und unten. Der Doppelschritt gilt
  aus den beiden Reihen an seiner Startseite, und en passant funktioniert in
  beiden Achsen.

  **Für jedes andere Brett ändert sich dadurch nichts.** Wo keine Startseite
  eingetragen ist — also auf jedem gewohnten Brett und in jeder laufenden
  Partie —, gilt weiterhin die alte Regel: Weiss startet unten, Schwarz oben.

  Auch geschobene Bauern nehmen ihre Richtung mit: Wer mit dem Nudelholz oder
  dem Bauernschub verschoben wird, läuft danach weiter dorthin, wo er hinwollte.

## v0.64.0 — 2026-08-13

- **Die Rückschau zeigt jetzt die Schlussstellung.** Links steht das Brett, so
  wie es ganz zum Schluss aussah — mit allem darauf: Figuren, liegen gebliebene
  Würfel, Mauern, Risse. Rechts daneben der Text: wie es endete, was es
  gekostet hat, was den Ausschlag gab. Auf schmalen Geräten stehen die beiden
  untereinander, das Brett zuerst.

## v0.63.0 — 2026-08-13

Der letzte offene Wunsch — und der grösste.

- **Drei neue Bretter in Kreuzform.** Ein Feld in der Mitte, an jeder der vier
  Seiten ein Streifen mit einer Armee; die vier Ecken gehören nicht zum Brett
  und sind gesperrt. Es gibt sie in drei Grössen: **Kleines Kreuz** (10 mal 10,
  6er-Mitte), **Kreuz** (12 mal 12, gewohnte 8er-Mitte) und **Großes Kreuz**
  (14 mal 14, 10er-Mitte — das grösste Brett im Spiel).

  Gespielt wird weiter **zwei gegen zwei Armeen**: Oben und unten steht die
  Front mit Bauern, links und rechts je ein Flügel aus Offizieren. **Wer
  welchen Flügel bekommt, entscheidet sich beim Anlegen** — gerechnet aus der
  Partie-Kennung, also auf jedem Gerät gleich.

  **Warum die Flügel keine Bauern haben:** Ein Bauer zieht in Richtung seiner
  Farbe, Weiss nach oben und Schwarz nach unten. Ein weisser Bauer am linken
  Rand marschierte deshalb nicht zur Mitte, sondern den Streifen hinauf und
  stünde nach wenigen Zügen als Dame in der Ecke. Offiziere haben das Problem
  nicht. Aus demselben Grund steht Weiss weiterhin immer unten.

- **Die Brettform wird jetzt zuerst gewählt.** Über den Kacheln stehen drei
  Knöpfe — **Quadratisch**, **Rechteckig**, **Kreuz** —, und darunter erscheinen
  nur die Grössen dieser Form. Vorher lagen alle Spielarten als eine Reihe
  nebeneinander; mit den drei neuen wären es sieben ohne erkennbare Ordnung
  gewesen.

**Nachtrag zu einem gemeldeten Fehler:** „Durch die Mauer soll man nicht ziehen
können — auch wenn dahinter ein Turm steht, soll mein König auf die Linie
ziehen dürfen." Das ist mit **v0.60.0** behoben und war derselbe Fehler, der
Türme durch Löcher hindurch Schach geben liess. Ein Test hält den Fall jetzt in
genau dieser Formulierung fest.

## v0.62.0 — 2026-08-13

- **Eine Rückschau vor dem Ergebnis.** Wenn eine Partie endet, kommt jetzt
  zuerst ein Bildschirm „Wie es dazu kam", und erst danach „Gewonnen" oder
  „Verloren". Er sagt drei Dinge: **wie** es endete (Schachmatt, Patt oder
  aufgegeben — abgelesen an der Schlussstellung, nicht behauptet), **was es
  gekostet hat** (der Figurenwert, den jede Seite gelassen hat, samt Vorsprung
  oder Rückstand) und **was den Ausschlag gab** (die eingesetzten Fähigkeiten
  und die Unglückswürfel, in der Reihenfolge, in der sie passiert sind;
  Unglückswürfel stehen rot).

  Gewöhnliche Züge stehen bewusst nicht darin — die sind der Verlauf, nicht die
  Wendung. Wer eine beendete Partie später noch einmal öffnet („Ergebnis
  ansehen"), bekommt die Rückschau ebenfalls zuerst.

## v0.61.0 — 2026-08-13

- **Neue Fähigkeit: Nachschub** (blau, also ungewöhnlich). Ein neuer Bauer
  tritt an — du setzt ihn selbst auf ein freies Feld deiner eigenen
  Grundreihe. Danach ist der Gegner am Zug. Steht dort nichts mehr frei, lässt
  sie sich nicht einsetzen.
- **Das Würfel Quizz hat keinen Tab mehr.** Die Leiste zeigt jetzt Team
  Schach, Imposter und Rangliste. Alles andere bleibt: Die **Anmeldung läuft
  weiter darüber** (sie gilt für die ganze Seite), und in der Rangliste stehen
  die Würfel-Punkte unverändert — niemand verliert rückwirkend etwas.
- **Eine zurückkehrende Figur landet nicht mehr in einem Loch.** Wiedergeburt
  und Wiederbelebung haben bisher nur geprüft, ob das Feld leer ist, nicht ob
  es gesperrt ist. (Der Friedhof hat es immer richtig gemacht.)

## v0.60.0 — 2026-08-13

Die zweite Hälfte der GitHub-Wünsche: sechs Änderungen an den Regeln des Team
Schachs. **Laufende Partien laufen weiter** — aber zwei Regeln gelten ab sofort
auch dort (siehe Doppelbrett und Nudelholz).

- **Das Doppelbrett hat jetzt zwei Leben statt gar keinem Schach.** Bisher gab
  es dort weder Schach noch Matt: Beide Könige wurden geschlagen wie jede
  andere Figur, auch der letzte. Jetzt gilt dieselbe Regel wie bei der
  Zufallsarmee — der erste König fällt normal, beim letzten kommen Schach und
  Matt zurück. Das gilt für jede Seite getrennt: Wer schon einen König verloren
  hat, kann ins Schach kommen, während der Gegner mit zweien noch keines kennt.
- **Das Nudelholz sammelt unterwegs ein — auch für den Gegner.** Wird eine
  gegnerische Figur über einen Würfel geschoben, bekommt ihn **ihre** Seite.
  Bisher blieb er einfach liegen und war für den Rest der Partie unerreichbar.
  Das Nudelholz hat damit einen Preis: Wer damit fremde Figuren schiebt, kann
  dem Gegner etwas schenken.
- **Das Nudelholz schiebt niemanden mehr in eine Mauer oder in ein Loch.** Es
  hat bisher nur gefragt, ob das Zielfeld leer ist — Figuren landeten dadurch
  auf Feldern, die es für die Regeln gar nicht mehr gibt. (Beim Erdbeben war
  das seit v0.54 richtig.)
- **Ein Würfel, der in ein Loch fällt, ist weg.** Reisst ein Erdbeben genau
  dort auf, wo ein Würfel lag, verschwindet er mit — vorher lag er für immer
  unerreichbar im Loch, weil niemand mehr auf ein gesperrtes Feld ziehen kann.
  Unter einer **Mauer** bleibt er dagegen liegen: Die läuft ab.
- **Friedhof, Wiederbelebung und Wiedergeburt lassen sich nicht mehr einsetzen,
  wenn niemand mehr da ist**, den sie zurückholen könnten. Wer sie trotzdem
  antippt, bekommt den Grund gesagt.
- **Ein Schieberegler beim Anlegen sagt, wie früh es Würfel regnet** (1 bis 5,
  nur mit dem Haken „Glücksboxen-Regen"). 5 ist der gewohnte Verlauf und bleibt
  die Vorgabe; bei 1 passiert lange fast nichts und dann umso mehr. Das **Ende
  ist bei jeder Stufe dasselbe**: Stehen nur noch die Könige, bekommt jedes
  freie Feld einen Würfel.
- **Die Anleitung zum Nudelholz zeigt jetzt die ganze Spalte.** In der alten
  Szene stand der Springer neben den gerollten Spalten — daher die Frage, warum
  er sich nicht bewegt. Jetzt steht in beiden Spalten etwas, oben wie unten,
  und alles rückt sichtbar vor.

- **Ein Turm oder Läufer hinter einem Loch gibt kein Schach mehr — und hinter
  einer Mauer auch nicht.** Das war ein alter Fehler, der erst beim Nachmessen
  zu diesem Wunsch herauskam: Ziehen konnte die Figur schon seit v3.3 nicht
  durch eine Sperre hindurch, **drohen** aber sehr wohl. Man stand also im
  Schach vor einem Angreifer, der gar nicht herankam — und im schlimmsten Fall
  endete die Partie durch ein Schachmatt, das keines war.

## v0.59.0 — 2026-08-13

Die erste Hälfte der siebzehn Wünsche, die seit Anfang August auf GitHub lagen:
alles, was man SIEHT — an den Regeln ändert sich in dieser Fassung nichts.

- **Der Zurück-Knopf im Fähigkeiten-Fenster schwebt jetzt mit.** Er hängt unten
  links am Bildschirmrand und ist damit auch dann noch da, wenn man sich durch
  alle fünf Stufen nach unten gelesen hat. Der Knopf oben bleibt, wo er war.
- **Das Wunsch-Feld wächst mit.** Bisher lief ein längerer Wunsch in eine
  einzige, endlose Zeile, von der man immer nur das Ende sah. Jetzt ist es ein
  Feld, das mit dem Text nach unten wächst — die Eingabetaste macht dort einen
  Zeilenumbruch, bestätigt wird über den Knopf.
- **Die Unterpunkte beim Anlegen sind eingerückt.** „Seltenheit anzeigen",
  „Unglückswürfel anzeigen" und „Glücksboxen-Regen" gehören zum Haken
  „Zufalls-Würfel" darüber; am Notebook stand das bisher alles auf einer Höhe.
  Eine feine Linie zeigt jetzt, was zu was gehört — auf jedem Gerät.
- **Die Liste der beendeten Partien zeigt nur noch deine eigenen.** Wo du nicht
  mitgespielt hast, gibt es für dich auch nichts mehr nachzusehen. Die Partien
  selbst bleiben unverändert stehen, und die Rangliste zählt weiter alles.
- **Und sie sagt, wer gewonnen hat.** Oben steht „Gewonnen", „Verloren" oder
  „Unentschieden", und bei den Namen steht, welche Seite Sieger und welche
  Verlierer war.
- **Ein eingesammelter Unglückswürfel wird angesagt.** Über dem Brett erscheint
  ein roter Streifen mit dem, was passiert ist — bisher musste man sich das aus
  dem Zugverlauf weit unter dem Brett zusammensuchen. Er verschwindet von
  selbst, sobald der nächste Zug kommt.

**Zwei gemeldete Punkte gab es nicht zu bauen** (nachgemessen am 13.08.):
Der **Springer** sammelt schon seit v3.6 nur auf seinem Zielfeld ein — er
springt über die Felder dazwischen hinweg, und ein Test hält das jetzt fest.
Und das **Nudelholz** läuft längst über die ganze Höhe des Bretts; dass sich in
der Anleitung „das Pferd nicht bewegt", liegt daran, dass es gar nicht in den
gerollten Spalten steht. Die Szene wird in der nächsten Fassung geändert.

## v0.58.0 — 2026-08-08

Die Bildanleitungen aus drei offenen Bündeln (F, G und H) auf einmal, dazu die
zwei Regeln, die noch dazugehörten.

**An den Anleitungen**

- **Die Marke im Vorrat steht jetzt in jedem Bild.** Vorher kam sie mit einem
  Bild und verschwand wieder — die Anleitung sprang dadurch im Sekundentakt in
  der Höhe. Der Fingerabdruck liegt weiterhin nur auf dem Bild, in dem wirklich
  gedrückt wird.
- **Die Könige sind aus allen Beispielen verschwunden.** Sie standen nur herum:
  Ein Beispielbrett braucht sie nicht, das ist am 08.08. nachgemessen worden.
- **Die Restzeit steht auch in der Anleitung** an jedem Feld, auf dem etwas
  abläuft — bei Mauer, Schild, Fessel, Frost und den geliehenen Figuren.
- **Wo eine Fähigkeit dir den Zug lässt, zieht das Beispiel danach wirklich
  noch.** Mauer, Nudelholz, Schutzschild, Fessel und Frost zeigen im letzten
  Bild, was das Pluszeichen wert ist: Der Springer setzt über die eigene Mauer,
  der geschobene Bauer schlägt zu, der Turm holt sich woanders eine Figur.
- **Neue Szenen für Teleport, Stolperstein, Volles Glas, Bauernschub,
  Erdbeben, Erdrutsch, Ausdehnung, Einsturz und Doppelzug.** Sie zeigen jetzt
  alle, worum es geht: Der Teleport befreit einen eingemauerten Turm und greift
  von dort an; der Stolperstein wirft ihn kurz vor dem Ziel zurück; Ausdehnung
  und Einsturz kosten **dich** etwas statt den Gegner; der Doppelzug schlägt
  zweimal hintereinander.
- **Die Wiedergeburt zeigt zuerst den Tod.** Die Anleitung beginnt jetzt eine
  Stellung früher: Die Dame steht noch, der Turm schlägt sie, dann holt die
  Fähigkeit sie zurück.
- **Der Händler zeigt sein Angebot.** Bisher sah man den Griff an den Vorrat
  und dann das Ergebnis, aber nie den Tausch dazwischen.

**An den Regeln**

- **Ein Erdbeben kann deinen Zug mittendrin beenden.** Die Risse reissen jetzt
  auf, **sobald** der Würfel eingesammelt wird — und eingesammelt wird er auch
  im Vorbeiziehen. Wer mit dem Turm über ihn hinweggleitet, öffnet die Löcher
  also im eigenen Weg: Liegt eines davon noch vor dir, bleibst du davor stehen.
  Was du am Zielfeld schlagen wolltest, bleibt dann natürlich stehen — wer
  nicht ankommt, schlägt auch nichts.

- **Ausweichen geht nur noch, während der Gegner am Zug ist.** Es ist die
  Notbremse; im eigenen Zug war es ein geschenktes Extra-Feld für jede Figur.
  Das Pluszeichen fällt damit weg, der Blitz bleibt.
- **Ein neues, seltenes Händler-Angebot: Dame und Bauer gegen einen König** —
  also gegen ein zweites Leben. Dafür kann eine Seite eines Angebots jetzt
  mehrere Figurenarten tragen.

**Behoben**

- **Der Stolperstein verpuffte, wenn man über ihn hinwegzog.** Seit v0.53
  sammelt man Würfel auch im Vorbeiziehen ein — der Stolperstein suchte die
  Figur aber weiter auf dem Feld des Würfels, wo längst niemand mehr stand.
  Jetzt trifft er die Figur dort, wo sie wirklich steht. Gefunden beim Stellen
  der neuen Anleitung.

## v0.57.0 — 2026-08-08

Bedienung und zwei Regeln am Team Schach. Die Beispielbilder aus den drei
offenen Bündeln kommen gesammelt in der nächsten Fassung.

- **Platzieren mit Vorschau statt Blind-Tipp.** Wartet eine Fähigkeit auf ihr
  Ziel, setzt ein Tipp jetzt erst einen **grünen Rahmen** — genau um die
  Felder, die die Wirkung wirklich trifft: drei bei der Mauer, ein 2-mal-2-Feld
  bei Frost und Friedhof. Ein anderes helles Feld antippen verschiebt ihn,
  unter dem Brett stehen **Einsetzen** und **Abbrechen**. Wer wie gewohnt
  zweimal auf dasselbe Feld tippt, setzt direkt ein. Bis v0.56 wirkte der erste
  Tipp sofort, und man sah vorher nie, wo die Wirkung landet.

- **Friedhof und Wiederbelebung zeigen jetzt beide, wo jemand gefallen ist.**
  Solange sie auf ihr Ziel warten, liegen alle infrage kommenden Gefallenen
  blass auf dem Brett — beim Friedhof die des Gegners, bei der Wiederbelebung
  die eigenen. Vorher tat das nur der Friedhof, und bei der Wiederbelebung
  tippte man ins Blaue. Die Würfel sind so lange ausgeblendet: Beides
  übereinander war nicht mehr lesbar.

- **Geliehene Figuren bleiben unterschiedlich lang.** Je stärker die Figur,
  desto kürzer: Ein geliehener Bauer hält lange durch, eine geliehene **Dame
  zieht genau einmal**, dann zerfällt sie. Die Restzeit steht wie bisher als
  kleine Zahl an ihrem Feld. Vorher blieben alle gleich lang — der Friedhof war
  damit ausgerechnet dort am stärksten, wo ohnehin viel Schweres gefallen war.

- **Ein Riss sieht endlich aus wie ein Loch.** Er trägt jetzt genau die Farbe
  der Fläche hinter dem Brett, mit einem zarten Schatten an der Oberkante — und
  bekommt keine Markierungen mehr darüber. Vorher war er ein dunkles Feld.

- Nachgemessen und für gut befunden: Liegen auf einem Feld mehrere Gefallene,
  lässt sich nur der **zuletzt** gefallene holen (gilt seit v0.54), und eine
  Figur, die auf einem Würfel erscheint, sammelt ihn ein (seit v0.53). Tests
  halten beides jetzt fest.

## v0.56.0 — 2026-08-08

Fünf Regeländerungen am Team Schach, alle aus dem Eingangskorb vom 08.08. Die
Beispielbilder dazu kommen in der nächsten Fassung — sie werden gerechnet und
ziehen deshalb von selbst mit, brauchen aber neue Szenen.

- **Der Bauernschub kostet jetzt den Zug.** Bis v0.55 rückten alle Bauern vor
  UND du durftest danach noch ziehen — also erst die ganze Reihe vorschieben
  und dann mit einem der geschobenen Bauern schlagen. Das waren zwei Züge für
  eine Fähigkeit. Das Pluszeichen ist weg; nach dem Schub ist der Gegner dran.

- **Dafür wandeln geschobene Bauern jetzt richtig um.** Erreichen durch den
  Schub ein oder mehrere Bauern die letzte Reihe, fragt die App **einmal**, in
  welche Figur sie werden sollen — die Wahl gilt für alle. Vorher wurden sie
  stillschweigend zu Damen.

- **Der Frost friert ein 2-mal-2-Feld ein statt einer einzelnen Figur.**
  Angetippt wird die linke obere Ecke, wie beim Friedhof. Was im Block steht,
  zieht nicht und lässt sich nicht schlagen — **auch deine eigenen Figuren**,
  also gut zielen. Könige bleiben verschont. Am Brett liegt jetzt eine blaue
  Linie um den ganzen Block, im selben Blau wie die Mauer, statt eines Kreises
  um jede Figur. Ein leeres Feld im Block sperrt nichts: Der Frost hält
  Figuren fest, er riegelt keine Fläche ab.

- **Die Fessel hält mehrere Züge.** Vier Halbzüge, also zwei Züge des Gegners;
  die Restzeit steht als kleine Zahl am Feld. Die gefesselte Figur bleibt dabei
  ganz normal schlagbar — genau darin liegt der Unterschied zum Frost, der
  unantastbar macht. Bis v0.55 taten beide fast dasselbe.

- **Die Verstärkung ist eine Aufwertungskette geworden.** Statt „Bauer wird
  Springer" steigt jede eigene Figur eine Stufe: Bauer → Springer, Springer →
  Läufer oder Turm (je zur Hälfte), Läufer und Turm → Dame, Dame → König.
  **Ein zweiter König sind zwei Leben:** Solange du zwei hast, gibt es für dich
  kein Schach und kein Matt, und deine Könige sind schlagbar wie jede andere
  Figur; beim letzten kippt es zurück. Der Weg geht auch zurück — wer zwei
  Könige hat, tippt einen an und bekommt zwei Damen (die zweite auf dem
  nächsten freien Nachbarfeld). Der letzte König lässt sich nie eintauschen.

- Nachgemessen und für gut befunden: Das **Nudelholz** liess sich schon immer
  ganz am Rand antippen — dort rollt eben nur die eine Spalte, die noch auf dem
  Brett liegt. Ein Test hält das jetzt fest.

## v0.55.0 — 2026-08-08

- **Das i beim Würfel-Haken führt in die ganze Fähigkeiten-Bibliothek.** Vorher
  zeigte es einen Absatz Text. Gemeint war das ganze Menü — alle Fähigkeiten mit
  Stufen, Zeichen und abgespielten Anleitungen. Wer beim Anlegen überlegt, ob er
  Würfel will, sieht jetzt sofort, worum es geht, statt erst eine Partie anlegen
  zu müssen. Zurück landet man wieder in der Spielart-Auswahl.

## v0.54.0 — 2026-08-08

Die letzten drei Punkte aus dem Eingangskorb — alle drei Eingriffe ins
Regelwerk.

- **Der Friedhof weckt, wer GENAU DORT gefallen ist.** Bis v0.53 nahm er die
  vier zuletzt gefallenen Gegner und stellte sie auf ein beliebiges freies
  2×2-Feld. Jetzt zeigt das Brett beim Einsetzen **blass**, wo die Gefallenen
  liegen; du wählst ein 2×2-Feld, und genau die, die dort fielen, stehen dort
  wieder auf — jeder auf seinem eigenen Feld. Damit ist die Fähigkeit
  ortsgebunden: stark, wo viel gestorben ist, und nutzlos auf einem leeren
  Flügel. Blöcke ohne Gefallene stehen gar nicht erst zur Wahl.

- **Das Erdbeben ist ein Unglückswürfel und reisst Risse.** Es verschiebt keine
  Reihen mehr: Drei freie Felder brechen weg und sind **ab sofort gesperrt** —
  niemand zieht hindurch, nur Springer setzen darüber hinweg. Anders als eine
  Mauer bleiben die Risse die **ganze Partie**; eine Gegen-Fähigkeit, die sie
  schliesst, ist vorgesehen, gibt es aber noch nicht. Aufgerissen wird nur, wo
  nichts steht. Wer „Erdbeben" noch im Vorrat hatte, verliert es beim nächsten
  Laden — eine Fähigkeit, die sich nicht mehr einsetzen lässt, wäre schlimmer.

- **Neuer Unglückswürfel „Einsturz": Das Brett wird kleiner.** Das Gegenstück
  zur Ausdehnung. Eine zufällige Seite bricht weg, aber **nie eine, auf der ein
  König steht** — steht ein König unten rechts, sind „unten" und „rechts"
  gesperrt und nur die anderen beiden möglich. Was auf der Linie steht, stürzt
  mit: Figuren wie Würfel.

  Beim Bauen kam ein **Altfehler** heraus: Die Ausdehnung rechnete nur vier von
  sieben gemerkten Feldangaben um. Mauern, geliehene Figuren und die liegenden
  Würfel behielten ihre alten Nummern und lagen danach woanders. Beides läuft
  jetzt über eine Stelle, die alle sieben bedient — und die Würfel wandern mit.

## v0.53.0 — 2026-08-08

Vier Punkte aus dem Eingangskorb — Restzeit, Regen, Einsammeln und die Punkte.

- **Eine Restzeit an jeder Figur.** Wo etwas abläuft, steht jetzt eine kleine
  Zahl rechts oben am Feld: geliehene Figuren (Friedhof), Mauern, Schutzschild,
  Fessel und Frost. Sie zählt nach jedem Halbzug herunter, sodass man abschätzen
  kann, wann welche Wirkung endet. Vorher stand die Zahl nur im Titel-Text beim
  Darüberfahren — und auf dem Handy gibt es kein Darüberfahren.

- **Der Glücksboxen-Regen steigert sich exponentiell.** Bis v0.52 wuchs er
  gerade mit dem Anteil freier Felder. Jetzt bleibt er lange verhalten und wird
  gegen Ende heftig; im Grenzfall — nur noch die beiden Könige auf dem Brett —
  bekommt **jedes** freie Feld einen Würfel. Gemessen wird gegen die Felder, die
  überhaupt frei werden können; nur so erreicht der Anteil wirklich 1.

- **Berühren heißt Einsammeln.** Bewegt eine Fähigkeit eine Figur auf einen
  Würfel — Nudelholz, Bauernschub, Erdbeben — oder lässt sie dort erscheinen
  (Spiegel, Wiedergeburt, Friedhof), wird er jetzt eingesammelt. Vorher zählte
  nur der eigene ZUG: Der Würfel blieb unter der Figur liegen und war für immer
  unerreichbar, weil man ihn nur durch Betreten bekommt. Auf Feldern, auf denen
  danach eine gegnerische Figur oder nichts steht, wird nichts eingesammelt.

- **Der Abschluss-Bildschirm schlüsselt die Punkte auf.** Oben gross die Summe,
  darunter Zeile für Zeile, wofür es sie gab — links die Sache, rechts der Wert:
  Mitgespielt, Sieg, jede geschlagene Figurenart mit ihrem Wert (Dame 9, Turm 5
  …) und die Beute. Die grosse Zahl kommt jetzt aus derselben Rechnung wie die
  Rangliste; vorher stand dort eine eigene Summe, in der die **Beute fehlte**.

- **Ein grüner Pfeil im Punktestand.** Über beiden Seiten steht, wie viele
  Punkte aus dieser Partie dazugekommen sind — vorher sah man nur den
  Gesamtstand und musste raten.

## v0.52.0 — 2026-08-08

Fünf Punkte aus dem Eingangskorb, darunter ein gemeldeter Fehler.

- **Beim Anlegen landet man wirklich in der Partie.** Gemeldet: „Ich bleibe in
  dem Menü, wo man auf die Größe tippt, und erkenne nicht, dass eine Partie
  schon begonnen hat." Die Ursache ist nicht der Bildschirm, sondern ein Rennen
  mit der regelmässigen Abfrage: Sie lief weiter, während der Namensdialog offen
  stand und gespeichert wurde — und ersetzte den Stand durch den vom SERVER, der
  die eben angelegte Partie noch nicht kannte. Anlegen und Löschen melden sich
  jetzt mit `eigenerVorgangBeginnt` an, wie Züge seit v3.8 und der Imposter.
  (Derselbe Fehlertyp wie v0.44, aber eine andere Ursache — die von damals ist
  weiterhin behoben.)

- **Jeder Bauer bekommt bei seinem ersten Zug den Doppelschritt**, egal wo er
  steht. In der Zufallsarmee kann er ganz hinten stehen und hatte dort bisher
  nur einen einzelnen Zug. Für alle anderen Spielarten ändert sich nichts:
  Hinter der eigenen Bauernreihe steht die Grundreihe voll, und ein Bauer kann
  sie nie erreichen.

- **Der freie Rand bleibt zwei Spalten — auf JEDER Karte.** Damit fällt die
  Menge anders aus als in v0.51: nicht die halbe Armee, sondern zwei Grundreihen
  mal die freien Spalten in der Mitte.

  | Spielart | Zufallsarmee |
  |---|---|
  | Klassisch | 8 (unverändert) |
  | Kleines Brett | 4 — genau ein 2×2-Feld in der Mitte |
  | Großes Brett | 12 |
  | Doppelbrett | 24 |

  v0.51 hatte es andersherum gerechnet und dem kleinen Brett nur eine Spalte
  Rand gelassen. Die 2×2-Ecke ist aber das, was die Aufstellung erkennbar macht
  — also ist SIE fest, und die Menge folgt ihr.

- **Der Unter-Haken heißt „Unterschiedliche Armeen"** statt „Beide Seiten
  getrennt würfeln".

- **Weniger Text im Anlege-Bildschirm.** Der Erklärsatz unter „Welche Spielart?"
  steht jetzt hinter einem i daneben, und „Zufalls-Würfel" hat ein eigenes i
  mit der ganzen Erklärung, was die Würfel überhaupt sind. Die Kacheln rutschen
  dadurch nach oben — auf dem Handy waren sie vorher halb unter dem Rand.

- **Würfel erscheinen auch nach einem Halbzug, den eine Fähigkeit verbraucht.**
  Sie kamen schon immer nach jedem Halbzug, aber `_bonusNachziehen` lief nur
  beim Ziehen: Wer seinen Zug für Friedhof, Wiedergeburt oder den Händler
  hergab, bekam keinen neuen Würfel aufs Brett.

## v0.51.0 — 2026-08-08

Die Zufallsarmee ist keine Spielart mehr, sondern ein **Haken** — und passt sich
jedem Brett an.

- **Haken „Zufallsarmee" beim Anlegen, für JEDE Spielart.** Vorher war sie eine
  eigene Spielart und damit ans 8×8-Brett gefesselt. Jetzt lässt sie sich auf
  Klassisch, Kleines Brett, Großes Brett und Doppelbrett setzen — auch zusammen
  mit den Würfeln.

- **Die Menge skaliert mit dem Brett.** Gerechnet wird die **Hälfte der
  gewohnten Armee**, abgerundet, aus der Aufstellung der Spielart. Für das
  klassische Brett ergibt das genau die 8 Figuren von vorher; die Zahl steht
  also nicht mehr im Code, sie fällt aus dem Brett:

  | Spielart | gewohnt | Zufallsarmee |
  |---|---|---|
  | Klassisch | 16 | 8 |
  | Kleines Brett | 12 | 6 |
  | Großes Brett | 20 | 10 |
  | Doppelbrett | 32 | 16 |

  Aufgestellt wird weiter mittig auf den beiden Grundreihen, mit freiem Rand
  links und rechts — beim klassischen Brett je zwei Spalten, beim Doppelbrett
  je vier. Die Breite folgt der Anzahl, deshalb geht es immer genau auf.

- **Unter-Haken „Beide Seiten getrennt würfeln".** Neu ist die **Vorgabe**: Ohne
  diesen Haken wird **einmal** gewürfelt, und beide Mannschaften bekommen
  **dieselben Einheiten**, spiegelbildlich aufgestellt — gewürfelt, aber
  gerecht. Angehakt zieht jede Seite für sich, wie in v0.49 und v0.50; dann kann
  eine Seite eine Dame und zwei Türme haben und die andere fast nur Bauern.

- **Die zwei Leben stehen jetzt im Spielstand.** Sie hingen bisher an der
  Spielart, aber `schach.js` kennt die Regeln einer Partie nicht — nur den
  Stand. `SCHACH_RUNDE` schreibt `koenigeAlsLeben` beim Aufstellen hinein,
  `SCHACH.koenigSchlagbarFuer` liest beide Quellen. Am Verhalten ändert das
  nichts: erster König schlagbar, letzter mattzusetzen.

- **Die alte Spielart „Zufallsarmee" ist versteckt, nicht gelöscht** — dieselbe
  Behandlung wie „Fähigkeiten sammeln" in v2.9. Laufende Partien tragen ihre
  Kennung im Stand und verhalten sich unverändert (weiterhin 8 Figuren, zwei
  Leben); zur Auswahl steht sie nicht mehr.

## v0.50.0 — 2026-08-08

Die Bildanleitungen (D6) und zwei weitere Punkte aus dem Eingangskorb.

- **Jede Anleitung zeigt jetzt zuerst, was man DRÜCKT.** Ein neues Bild 2 zeigt
  die Fähigkeit im Vorrat, mit dem Fingerabdruck darauf. Vorher fing die
  Anleitung beim Brett an — bei **Bauernschub** und **Händler** zeigte sie
  überhaupt keinen Handgriff, und bei Sprung, Ausweichen und Teleport sprang
  sie von der Ausgangsstellung direkt zu den neuen Zugpunkten. Unglückswürfel
  bekommen das Bild nicht: Sie werden nie gedrückt, sondern eingesammelt.

- **Jede Stellung erzählt jetzt, warum man die Fähigkeit nehmen würde.** Bis
  v0.49 standen auf fast jedem Beispielbrett nur zwei Könige und die eine
  Figur, um die es ging — der Gegner fehlte, und damit der Grund. Bei
  **Ausweichen** behauptete der Satz sogar „angegriffen und eingeklemmt",
  während weit und breit nichts angriff. Jetzt steht in jedem Bild, was die
  Fähigkeit löst:
  - *Sprung*: eine schwarze Dame auf einem Feld, das der Turm gerade nie
    erreicht — und das letzte Bild zeigt, wie er sie schlägt.
  - *Ausweichen*: der Turm ist von den eigenen Leuten zugestellt, kein Zug
    bleibt ihm.
  - *Teleport*: drei gegnerische Springer riegeln die Reihe ab.
  - *Frost*: der Springer greift die Dame an. *Fessel*: der Turm nimmt den
    Läufer ins Visier. *Mauer*: der Turm zielt die Spalte hinunter.
  - *Verstärkung*: der Bauer wird zum Springer und bedroht sofort zwei Türme.
  - Und jeder **Unglückswürfel** zeigt jetzt einen Schaden: einen Angriff, der
    zusammenfällt, eine Beute, die plötzlich unerreichbar wird.

  Die beiden Könige bleiben stehen — die Bilder werden mit den echten Regeln
  gerechnet, und ein Brett ohne König ist keine Stellung, die das Regelwerk je
  zu sehen bekommt. Sie stehen jetzt aber aus der Sache heraus.

- **Die Ausdehnung verpufft nicht mehr.** Sie wächst weiterhin an einer von vier
  Seiten, jede mit einem Viertel — kann die gezogene Seite nicht mehr (Brett am
  Anschlag), kommt jetzt die nächste dran. Vorher stand im Verlauf „ohne
  Wirkung", obwohl drei andere Seiten noch Platz hatten. Die Chance von einem
  Viertel je Seite steht jetzt auch in der Beschreibung.

- **Neuer Haken: Glücksboxen-Regen.** Je leerer das Brett, desto mehr Würfel
  erscheinen — gegen Ende einer Partie regnet es. Chance und Anzahl hängen am
  ANTEIL der freien Felder, nicht an ihrer Zahl: Sonst regnete es auf dem
  Doppelbrett von Beginn an und auf dem kleinen Brett nie. Höchstens fünf auf
  einmal.

## v0.49.1 — 2026-08-08

Beim Nachmessen der Königs-Chance aufgefallen: Der gerechnete Zufall streute an
drei Stellen gar nicht. **Eine Ursache, drei Auswirkungen.**

`SCHACH_RUNDE._zufallsWert` ist FNV-1a — jedes Zeichen wird verodert und dann
mit einer Primzahl multipliziert. Ein Unterschied im **letzten** Zeichen der
Saat erlebt danach nur noch eine einzige Multiplikation und verschiebt das
Ergebnis um rund 0,4 Prozent. Wer über etwas zählt und die Zahl hinten anhängt,
bekommt für alle Durchgänge praktisch denselben Wert. Die Funktion ist in
Ordnung; die Saat war es nicht.

- **Die Zufallsarmee war keine.** Die sieben Ziehungen einer Seite hiessen
  `…|figur|1` bis `…|figur|7` und lagen alle innerhalb von zwei Prozent. Jede
  Seite bekam deshalb siebenmal fast dieselbe Figur — `..ksss..` über
  `..ssss..`, oder sieben Türme. Nachgemessen über 20 000 Partien: Die Dame kam
  auf 2 Prozent statt 12, der Turm auf 28 statt 18. Jetzt streut es wie
  eingestellt (Dame 0,58 je Seite, Turm 1,48).
- **Unter dem vollen Glas trugen ganze Feldblöcke dasselbe Trugbild.** Die
  Felder 0 bis 9 sahen alle wie ein Springer aus, 10 bis 15 wie ein Turm —
  Läufer und Dame kamen als Trugbild überhaupt nie vor. Statt einer Täuschung
  war es ein Muster. (Fehler von v0.41, jetzt erst gefunden.)
- **Zwei Würfel im selben Zug ergaben fast immer dieselbe Fähigkeit.** Ihre
  Werte lagen um 0,004 auseinander. Fiel weniger auf, weil man selten zwei auf
  einmal einsammelt — dieselbe Ursache.

Die Chance auf zwei Könige war davon **nicht** betroffen (eine einzelne
Ziehung ohne Zähler) und liegt gemessen bei 12,29 Prozent je Seite. Zwei neue
Tests halten die Streuung fest; der Merksatz steht jetzt über `_zufallsWert`.

## v0.49.0 — 2026-08-08

Zwei Bündel aus dem Eingangskorb: der Haken für die Unglückswürfel (D7) und
eine neue Spielart mit zwei Leben (D8).

- **Neuer Haken beim Anlegen: „Unglückswürfel anzeigen".** Angehakt trägt ein
  schlechter Würfel sein Fragezeichen auf dem Kopf, man erkennt ihn von weitem.
  Grau gelassen sieht er aus wie jeder andere — gleiche Farbe, Fragezeichen
  richtig herum —, und man merkt es erst beim Einsammeln. Der Haken ist
  standardmässig AUS, wie alle Haken.

  Das hebt eine eiserne Regel auf („Dass es ein Unglückswürfel ist, wird immer
  gezeigt"). Sie ist jetzt die Einstellung, nicht mehr das Gesetz. Nebenbei sind
  Farbe und Warnung entkoppelt: Bis v0.48 hing beides an „Seltenheit anzeigen",
  „Farbe ja, Warnung nein" liess sich gar nicht einstellen. Auch laufende
  Partien zeigen das Unglück ab jetzt nicht mehr — es ist reine Anzeige und
  rührt an keine Regel.

- **Neue Spielart „Zufallsarmee".** Gewohntes 8×8-Brett, aber jede Seite bekommt
  nur **8 Figuren**, und welche, wird gewürfelt: König plus sieben, gezogen
  nach festen Chancen (Bauer 34 %, Springer/Läufer/Turm je 18 %, Dame 12 %,
  höchstens eine Dame je Seite). Aufgestellt wird auf den beiden Grundreihen;
  links und rechts bleiben je zwei Spalten frei — deshalb sind es genau acht
  Felder für genau acht Figuren.

- **Zwei Könige sind zwei Leben.** Mit 12 % Chance startet eine Seite mit zwei
  Königen. Solange sie beide hat, ist ihr König eine Figur wie jede andere: Er
  wird geschlagen, es gibt kein Schach für sie und kein Matt. Sobald nur noch
  einer steht — egal welcher zuerst fiel —, gelten wieder alle Regeln, und
  gewonnen wird durch Schachmatt.

  Die Frage „zählt der König als Figur?" wird seit jetzt **je Farbe** gestellt
  (`SCHACH.koenigSchlagbarFuer`) statt je Brett. Weiss kann zwei Könige haben
  und Schwarz einen; dann kann Weiss nicht ins Schach kommen, Schwarz schon —
  beides gleichzeitig. Das Doppelbrett bleibt davon unberührt.

- **Testläufer finden VS Code in jedem Benutzerprofil.** Der Rechner wird als
  Domänen- und als lokaler Benutzer benutzt; die Läufer suchten Code.exe nur
  über `%LOCALAPPDATA%` und brachen unter der jeweils anderen Anmeldung ab.
  Gilt für alle Projekte im Ordner, nicht nur fürs Quizz.

## v0.48.0 — 2026-08-08

Vier Punkte aus dem Eingangskorb, alle an den Fähigkeiten.

- **Sprung und Teleport sind jetzt der Zug selbst.** Einsetzen — sofort
  springen beziehungsweise das Zielfeld antippen — fertig, der Gegner ist dran.
  In v0.47 gaben beide den Zug ab und wirkten erst eine Runde später; gemeint
  war es anders. Solange die Fähigkeit läuft, zählt **nur** ihr Muster: Ein
  normaler Zug wäre ein geschenkter. Bleibt dabei kein einziger Zug übrig (alle
  Felder besetzt, oder der König im Schach), wird das Einsetzen abgewiesen und
  die Fähigkeit bleibt im Vorrat — sonst stünde die Partie.
- **Pluszeichen und Blitz stehen jetzt immer und überall.** Sie sagen, was eine
  Fähigkeit IST, nicht was gerade geht: auch bei den Fähigkeiten des Gegners,
  auch während der Gegner am Zug ist. Zwischen v0.41 und v0.47 hing das
  Pluszeichen am Spielstand und flackerte deshalb — als Merkmal, an dem man eine
  Fähigkeit wiedererkennt, war es damit unbrauchbar. Was gerade wirklich geht,
  sagt weiterhin der Dialog beim Einsetzen, in Worten.
- **Jede Fähigkeit lässt sich antippen.** Auch eine, die man nicht einsetzen
  darf: Sie zeigt dann Beschreibung, Kosten und die abgespielte Anleitung.
  Vorher war eine fremde Fähigkeit ein totes Schildchen, und wer wissen wollte,
  was der Gegner da hat, musste die Bibliothek durchsuchen.
- **Wiedergeburt ist episch statt legendär.** Sie setzt auf die eigene
  Grundreihe, also weit weg vom Geschehen — neben Wiederbelebung (an den Ort des
  Falls) und Friedhof (gleich vier Figuren) war sie die Enttäuschung unter den
  legendären.
- **„Ein paar Züge" steht nicht mehr da.** Wo eine Wirkung abläuft, steht jetzt
  die Zahl: Mauer 6 Halbzüge, Friedhof 8, Volles Glas 8. Die Werte waren schon
  so eingestellt, sie standen nur nirgends.

## v0.47.0 — 2026-08-07

**Was eine Fähigkeit kostet, folgt jetzt einer Regel** — und die steht überall
dabei.

- **Die Zeichen stehen auch in der Bibliothek.** Hinter dem i trägt jede
  Fähigkeit dieselben Zeichen wie im Vorrat (Pluszeichen, Blitz), und beim
  Aufklappen steht in Worten daneben, was sie bedeuten: „Pluszeichen (+): Nach
  dem Einsetzen darfst du noch ganz normal ziehen" beziehungsweise „Kein
  Pluszeichen: Das Einsetzen kostet deinen Zug".
- **Die Regel dahinter: Wer Material oder einen Angriff geschenkt bekommt, gibt
  den Zug ab.** Danach ist neu eingeordnet worden — ohne eine einzige Fähigkeit
  auf eine andere Stufe zu schieben:
  - **Sprung** und **Teleport** kosten jetzt den Zug. Mit dem Sprung darf man
    schlagen, mit dem Teleport über alles hinwegsetzen; beide sind gewöhnlich,
    kommen also ständig. Ein geschenkter Zug obendrauf war zu viel.
  - **Verstärkung**, **Spiegel** und **Wiedergeburt** kosten ihn ebenfalls. Sie
    bringen Material — genau wie Wiederbelebung, Friedhof und Händler, die den
    Zug schon immer gekostet haben. Dass die drei ihn behielten, war eine Lücke.
  - **Ausweichen** behält sein Pluszeichen: Es schlägt nicht, zieht nur auf
    freie Felder und ist die Notbremse. Ebenso alles, was nur die Stellung
    verändert (Bauernschub, Erdbeben, Nudelholz, Mauer, Schutzschild, Fessel,
    Frost) und der Doppelzug, dessen Pluszeichen seine Wirkung ist.
- **Ein Zusatzmuster überlebt jetzt den Gegenzug.** Das musste sein: Wer den Zug
  abgibt, springt erst danach. Bis v0.46 löschte das Abgeben des Zuges das
  eigene Muster — Sprung und Teleport wären verbraucht, aber wirkungslos
  gewesen. (Derselbe Fehlertyp wie in v0.41; ein Test hält ihn jetzt fest.)

## v0.46.0 — 2026-08-07

Zwei Regeln zeigten in der Anleitung etwas anderes, als sie tun — beide sind
jetzt so, wie man sie erwartet.

- **Die Mauer legt sich UM das angetippte Feld** (eines links, eines rechts).
  Vorher war das angetippte Feld ihr linkes Ende, und die Sperre erschien
  daneben — man tippte auf ein Feld und bekam die Mauer woanders.
- **Das Nudelholz schiebt immer von dir weg**, aus deiner Sicht also nach oben.
  Angetippt wird ein Feld deiner eigenen Grundreihe, unten am Brett. Vorher
  bestimmte der Rand die Richtung: oben antippen hiess nach oben, unten
  antippen nach unten — für Schwarz stand damit beides auf dem Kopf, denn das
  Brett wird für ihn gedreht.
- **Sprung, Ausweichen und Teleport zeigen den Zug jetzt auch.** Nach den
  Punkten kommt ein drittes Bild, auf dem die Figur wirklich springt, mit
  Pfeil. Vorher endete die Anleitung bei „hier kämst du hin".
- **Jede Animation ist gegen die Regel geprüft.** Neue Tests rechnen für JEDE
  Fähigkeit und jeden Unglückswürfel nach, dass der Fingerabdruck auf einem
  Feld liegt, das die Regel wirklich annimmt, und dass genau die möglichen
  Felder markiert sind — keines zu viel und keines zu wenig.

## v0.45.0 — 2026-08-07

- **Der Fingerabdruck in der Bildanleitung sieht aus wie einer.** Statt dreier
  Bögen um einen Punkt jetzt fünf ineinanderliegende Papillarlinien mit Kern
  und zwei abgebrochenen Linien an den Seiten — nach der Vorlage des Nutzers.
  Weiterhin gezeichnet und nicht als Bilddatei eingefügt: So folgt das Zeichen
  den Farben der App und bleibt in jeder Größe scharf (dieselbe Entscheidung
  wie beim Würfel).

## v0.44.0 — 2026-08-07

Sieben Punkte aus dem Eingangskorb: fünf an der Bildanleitung, zwei am Spiel.

**Die Bildanleitung**

- **Ein Fingerabdruck zeigt, wo man hintippt.** Zwischen Ausgangsstellung und
  Wirkung steht jetzt der Handgriff als eigenes Bild — bei einem Zug sogar
  zweimal, denn ein Zug sind zwei Tipper: erst die Figur, dann ihr Ziel.
- **Pfeile zeigen, wie sich die Figuren bewegen.** Sie entstehen aus denselben
  Wegen, aus denen das echte Brett die Spur des letzten Zuges färbt. (Das ist
  nicht der alte Zugpfeil von v1.9: Der sollte jede Gangart darstellen und
  konnte es nicht. Im Beispiel steht fest, wer wohin geht.)
- **Wohin man ziehen darf, steht als Zugpunkt da** — dieselbe Marke wie im
  Spiel, statt einer eigenen Kontur nur für die Anleitung.
- **Der Text hüpft nicht mehr.** Alle Sätze stehen gleichzeitig untereinander,
  je einer mit „Bild 1", „Bild 2" …; der laufende ist hervorgehoben. Vorher
  wechselte ein einzelner Satz mit dem Bild, und weil die Sätze verschieden
  lang sind, sprang alles darunter im Sekundentakt.
- **Es ist immer nur eine Fähigkeit aufgeklappt.** Wer die nächste ansieht,
  schliesst die vorige — und deren Anleitung hört auf zu laufen.

**Das Spiel**

- **Nach dem Anlegen landet man in der Partie.** Wer eine neue Partie anlegte,
  den Namen eingab und bestätigte, stand wieder vor den Spielart-Kacheln: Die
  Partie war längst angelegt und geöffnet, aber die Auswahl blieb offen und lag
  davor. Man musste erst zurück und die eigene Partie in der Übersicht suchen.
- **Die Rochade geht wie jeder andere Zug: König antippen, Zugpunkt antippen.**
  Der zweite Weg über das Turmfeld ist ausgebaut — er war eine Sonderregel für
  genau einen Zug, mit einer eigenen Kontur, die aussah wie eine Warnung. Dazu
  gilt der rote Schlagring jetzt nur noch für GEGNERISCHE Figuren: Bei der
  Rochade steht auf dem Zielfeld die eigene, auf sechs Feldern Breite landet
  der König sogar genau auf dem Turm — das sah aus, als schlüge man ihn.

## v0.43.0 — 2026-08-06

- **Die Fähigkeiten-Übersicht ist jetzt eine Liste von Überschriften.**
  Zugeklappt steht je Fähigkeit nur noch ihr Name da; wer darauf tippt, bekommt
  Beschreibung UND abgespielte Anleitung. Vorher stand die Beschreibung
  daneben — bei 23 Einträgen scrollte man auf dem Handy, bevor man wusste,
  welche Fähigkeiten es überhaupt gibt.

## v0.42.0 — 2026-08-06

Die Bildanleitung aus v0.41 wird zum Ablauf — und die Bibliothek zum Blättern.

- **Der Eintrag selbst klappt auf.** In der Fähigkeiten-Übersicht (hinter dem i)
  tippt man auf die Fähigkeit und sieht ihre Anleitung. Vorher stand darunter
  noch eine zweite Zeile zum Aufklappen; das war zweimal zielen für eine Sache.
  Gebaut wird die Anleitung erst beim Aufklappen — alle 23 Einträge auf einmal
  wären über zweitausend Elemente.
- **Die Vorschau läuft ab, statt nebeneinanderzustehen.** Ein Brett zeigt
  nacheinander: Ausgangsstellung, der Handgriff, die Wirkung — und dann wieder
  von vorn, mit einem Punkt je Schritt. Eine Bewegung sieht man; zwei Bilder
  nebeneinander muss man vergleichen. Wer im Betriebssystem weniger Bewegung
  eingestellt hat, bekommt weiterhin alle Schritte nebeneinander.
- **Der Handgriff ist ein eigener Schritt.** Bei jeder Fähigkeit mit Zielfeld
  zeigt das mittlere Bild, welches Feld angetippt wird — und hell umrandet die
  anderen, die auch gingen. Welche das sind, wird nicht aufgezählt, sondern
  gefragt (`SCHACH_RUNDE.zielFelder`).
- **Die Bibliothek wird nicht mehr alle drei Sekunden neu gezeichnet.** Sie
  hängt an keinem Spielstand. Ohne diese Änderung klappte jeder aufgeklappte
  Eintrag bei der nächsten Abfrage wieder zu.

## v0.41.0 — 2026-08-06

Acht Punkte aus dem Eingangskorb, alle am Team Schach — darunter der erste
bestätigte Wunsch aus dem Melde-Knopf der App.

- **Eine Bildanleitung zu jeder Fähigkeit.** Wer eine Fähigkeit einsetzt, sieht
  vorher zwei kleine Bretter: wie es aussieht, bevor sie wirkt, und wie danach.
  Dieselben Bilder stehen in der Fähigkeiten-Bibliothek hinter dem i — dort zu
  jedem Eintrag, auch zu jedem Unglückswürfel, zum Aufklappen. **Die
  Nachher-Bilder sind nicht gezeichnet, sondern gerechnet:** Sie entstehen,
  indem die Fähigkeit im Beispiel wirklich eingesetzt wird, mit denselben
  Regeln wie im Spiel. Eine Anleitung, die von der Regel abweicht, kann es
  damit nicht geben.
- **Sprung wandelt Bauern um** (Wunsch #4 aus GitHub). Wer mit einer Fähigkeit
  (Sprung, Ausweichen, Teleport) als Bauer auf die letzte Reihe kam, blieb ein
  Bauer und stand dort fest. Die Umwandlung hing an der Gangart statt am Zug.
- **Das Pluszeichen sagt jetzt die Wahrheit.** Es verspricht „danach bleibt dir
  dein Zug" — und stand auch dann da, wenn der Gegner am Zug war und es gar
  keinen eigenen Zug zu behalten gab. Umgekehrt fehlte es, wenn ein offener
  Doppelzug den Zug trotz einer teuren Fähigkeit rettet. Beides fragt der
  Bildschirm jetzt beim Modell nach.
- **Die schlimmsten Unglückswürfel sind die seltensten.** Meuterei (der Gegner
  bekommt eine Figur geschenkt) und Erdrutsch (kostet nur Stellung) haben die
  Stufen getauscht: Meuterei ist legendär, der Erdrutsch episch.
- **In der Bibliothek fehlte ein Unglückswürfel.** Je Stufe wurde nur der erste
  gezeigt — „Volles Glas" tauchte deshalb nirgends auf.

- **Ausweichen wirkt endlich.** Es liess sich einsetzen, war danach aus dem
  Vorrat verschwunden — und passierte nichts. Ursache: Beim Speichern und
  Laden eines Standes wurde das Zugmuster „ausweichen" weggeworfen, weil es in
  der Prüfliste fehlte; es stand dort noch unter seinem alten Namen. Damit war
  auch der Einsatz während des gegnerischen Zuges wirkungslos, obwohl er
  erlaubt war. Ein Test prüft jetzt JEDES Zugmuster auf diesem Weg.
- **Kein falsches Schach mehr durch Ausweichen.** Seit v3.5 zieht Ausweichen
  nur noch auf freie Felder — schlagen kann es nicht. Die Bedrohungsprüfung
  zählte es trotzdem mit; daraus hätte ein Schachmatt entstehen können, das
  keines ist.
- **Die Mauer ist ein Riegel, kein Stapel Steine.** Der helle Rand lief um
  jedes ihrer drei Felder herum, also auch zwischen ihnen. Jetzt liegt er nur
  aussen, und die Stücke stossen ohne Haarriss aneinander.
- **Nicht mehr fast nur grüne Würfel.** Die Dämpfung von v3.6 wirkte nur
  INNERHALB einer Stufe (welche Fähigkeit) — wie oft eine Stufe überhaupt
  kommt, blieb bei 52 Prozent für Grün. Grün hat jetzt zusätzlich eine
  Abklingzeit: Direkt nach einem grünen Würfel zählt Grün nur noch mit
  20 Prozent seines Gewichts und braucht acht Halbzüge, bis es wieder voll
  zählt. Die anderen Stufen behalten ihre feste Chance und sind in dieser Zeit
  häufiger dran; es erscheinen weiter gleich viele Würfel. Zwei getrennte
  Rechnungen, wie gewünscht — die eine für die Stufe, die andere für die
  Fähigkeit darin.
- **Rot heisst gegen dich, Blau für dich.** Was ein Unglückswürfel angerichtet
  hat, leuchtet jetzt rot; ein Fähigkeits-Einsatz blau. Die betroffene FIGUR
  glüht dabei mit, nicht nur ihr Feld — bei einem Erdrutsch mit sechs
  verschobenen Figuren war das bisher die offene Frage. Statt eines einzelnen
  Aufblitzens pulst es zweimal, damit man es auch am Handy bemerkt.

## v0.40.0 — 2026-08-05

- **Umstellung auf Semantic Versioning** (0.MINOR.PATCH): aus v4.0 wurde
  v0.40.0. Die 0 vorne heißt „noch in Entwicklung" — eine 1.0.0 gibt es erst,
  wenn die Fertig-Kriterien in der `ROADMAP.md` erfüllt sind. Alte Nummern
  bleiben lesbar: v3.7 entspricht 0.37. Am Spiel selbst ändert sich nichts.

## v4.0 — 2026-08-03

Der dritte Fehler aus derselben Meldung — und der, den man auf dem Bildschirmfoto
sieht.

- **Eine Auswahl überlebt den nächsten Zug nicht mehr.** Wer eine Figur antippt,
  sieht ihre Zielpunkte und die roten Schlagringe. Zog danach jemand, blieben
  diese Marken auf dem Brett stehen — sie leben im Bildschirm und nicht im
  Spielstand. Übrig blieb ein Brett voller Punkte und Ringe, die zu Figuren
  gehörten, die dort längst nicht mehr standen. Darunter stand dabei „Warte, bis
  dein Team wieder am Zug ist": Man konnte auf keine einzige dieser Markierungen
  tippen.
  Verworfen wird die Auswahl jetzt, sobald sich der Zugzähler geändert hat oder
  man nicht (mehr) ziehen darf. Dasselbe gilt für eine Fähigkeit, die auf ihr
  Zielfeld wartet.

## v3.9 — 2026-08-03

Ein gemeldeter Fehler, zwei Ursachen — beide behoben.

Gemeldet war: „Beim Gegner zeigt es den Zug oft nicht direkt an; wenn er öfter
drückt, wird es rot oder er zeigt dauerhaft die Punkte an, und alles hängt, bis
ich meinen Zug gemacht habe."

- **Die Datenbank-Aufrufe haben jetzt ein Zeitlimit** (Laden 8, Speichern 12
  Sekunden). **Das war die harte Ursache:** `fetch` gibt von sich aus NIE auf.
  Steht das Handy im Funkloch, bleibt der Aufruf offen, bis der Browser
  irgendwann selbst abbricht — das kann über eine Minute dauern. In dieser Zeit
  nahm das Brett keinen einzigen Tipp mehr an (`ziehtGerade`), und die
  regelmässige Abfrage ruhte ebenfalls. Von aussen sah das aus, als sei die
  Seite eingefroren — bis der Zug des Gegners eintraf und alles auf einen Schlag
  nachholte. **Genau das erklärt das „bis ich meinen Zug gemacht habe".**
  Jetzt wird daraus eine normale Fehlermeldung: Der Zug wird zurückgenommen, und
  man kann es sofort noch einmal versuchen. Das Rot im Kopf war übrigens der
  Statuspunkt — er zeigte richtig an, dass die Verbindung stand.
- **Solange ein Zug unterwegs ist, sagt es die Leiste über dem Brett**
  („Wird gesendet …"). Vorher tippte man ins Leere: Das Brett nahm nichts mehr
  an, sagte es aber niemandem.
- **Ein alter Abschluss-Bildschirm verdrängt keine laufende Partie mehr.** Lag
  irgendeine beendete Partie herum, deren Abschluss man nie weggeklickt hatte,
  kam sie bei JEDEM Zeichnen wieder — also alle drei Sekunden — und man kam
  nicht mehr ans Brett. Stattdessen stand dauerhaft der Punktestand da. **Das
  erklärt das „er zeigt dauerhaft die Punkte an".** Der Abschluss wartet jetzt,
  bis man die laufende Partie verlässt; geht die offene Partie selbst zu Ende,
  kommt er sofort wie bisher.

## v3.8 — 2026-08-03

Der letzte Punkt aus dem Eingangskorb — und der einzige, der die Bedienung
grundsätzlich ändert.

- **Dein Zug erscheint sofort, auch bei schlechter Verbindung.** Bis v3.7 wurde
  erst gezeichnet, wenn die Datenbank den Zug bestätigt hatte. Über mobile Daten
  sind das schnell ein bis zwei Sekunden, in denen sich nichts rührt — man tippt
  noch einmal, und die Seite wirkt hängengeblieben. Jetzt steht der Zug sofort
  auf dem Brett; gesendet wird dahinter. Dasselbe gilt für Fähigkeiten.
- **Und er springt nicht mehr zurück.** Solange ein eigener Zug unterwegs ist,
  übernimmt die regelmässige Abfrage keinen fremden Stand. Genau das war die
  zweite Hälfte des Problems: Die Abfrage antwortete mit dem Stand von VOR dem
  Zug und setzte das Brett zurück, während man noch wartete.

**Was sich NICHT geändert hat — und das ist der Punkt:** Die Zugzähler-Prüfung
bleibt, wo sie war. Wer aus dem eigenen Team schneller war, gewinnt weiterhin;
der eigene Zug wird dann zurückgenommen und man erfährt es. Geht das Speichern
schief, wird der Stand von vorher wiederhergestellt — auf einem Brett
weiterzuspielen, das sonst niemand sieht, wäre schlimmer als ein Rücksprung.
Angezeigt wird dabei nie ein Wunschbild: Der Zug ist zu diesem Zeitpunkt bereits
vollständig durchgerechnet, nur eben noch nicht verschickt.

## v3.7 — 2026-08-03

Vier Punkte aus dem Eingangskorb: drei am Imposter, einer an der Rangliste. Der
grösste: **Thema und Wortart sind zwei verschiedene Fragen.**

- **Verb, Nomen und Adjektiv sind jetzt ein FILTER, kein Thema.** Bis v3.6 stand
  „Nur Verben" als Kachel neben „Alltag", als wäre es dasselbe. Ist es nicht:
  Jedes Wort hat ein Thema UND eine Wortart. Beim Anlegen eines Raums wählt man
  jetzt beides getrennt — „nur Verben quer durch alle Themen" ist die Auswahl
  „Alle Themen" plus „Verb". Jede Kachel zeigt dabei, wie viele Wörter unter dem
  gewählten Filter überhaupt übrig bleiben, und ein Thema ohne passende Wörter
  lässt sich gar nicht erst antippen.
  Die Wörter der drei alten Gruppen sind nicht verloren: Sie stehen jetzt unter
  dem Thema **„Querbeet"**, jedes mit seiner Wortart. **Laufende Räume laufen
  unverändert weiter** — sie tragen ihre alte Kennung, und die alten Gruppen
  bleiben als versteckte Einträge im Katalog stehen. Ein eigener Test prüft
  Zeichen für Zeichen, dass die Wortliste dieselbe bleibt.
- **Vor jeder Runde darfst du ein Wort beisteuern.** Beim „Bereit" wird gefragt:
  ein Wort, seine Wortart, sein Thema. Beim Thema darf auch ein **neues**
  entstehen (Gemüse, Haushalt, was ihr wollt) — es steht danach allen zur
  Verfügung, auch in Räumen, die es noch gar nicht gibt. Wer nichts beisteuern
  will, lässt das Feld leer und geht weiter.
  Gefragt wird beim Bereitmachen und nicht beim Beitreten: In einem Raum, in dem
  man den ganzen Abend sitzt, wäre eine einmalige Frage am Anfang wertlos.
- **Ein Wort, das gerade dran war, kommt so schnell nicht wieder.** Es wird nicht
  gesperrt, sondern nur unwahrscheinlich: In der Runde direkt danach zählt es ein
  Zehntel so viel wie jedes andere, und mit jeder weiteren Runde erholt es sich,
  bis es nach zehn Runden wieder normal mitspielt. Eine harte Sperre hätte bei
  kleinen Themen die Auswahl leergeräumt.
- **Der Knopf zur Wortbibliothek erscheint nur mit Verwaltungs-Zugang.** Vorher
  stand er für alle da und fragte beim Drücken nach dem Passwort — das war zwar
  dicht, verriet aber jedem, dass es hier etwas zu holen gibt. Wer die Wortliste
  sieht, hat als Imposter einen Vorteil. Den Zugang bekommt man wie bisher im Tab
  Würfel Quizz.
  Beim Einfügen wählt man jetzt die Wortart mit; in der Bibliothek steht sie
  hinter jedem ergänzten Wort.
- **In der Rangliste steht unter dem Namen kein Untertitel mehr.** Die Zeile
  „Würfel 5, Schach 30, Imposter 8 (2 Siege aus 3)" machte aus der Tabelle bei
  zehn Mitspielern eine Textwand. Dieselben Zahlen stehen im Profil, einen
  Fingertipp entfernt — samt der Schach-Bilanz.

## v3.6 — 2026-08-03

Dreizehn Punkte aus dem Eingangskorb, alle am Schach. Der grösste: **Die
Zugpfeile sind weg.**

- **Statt eines Pfeils wird der WEG eingefärbt** — so, wie es andere
  Schachprogramme machen. Beim Springer leuchtet das L, beim Läufer die
  Diagonale, beim Turm die ganze Linie; Start und Ziel etwas kräftiger als die
  Felder dazwischen. Wo es keinen Weg gibt (Teleport, Wiedergeburt, Friedhof,
  Händler), sind nur Anfang und Ende markiert.
  **Damit erledigen sich drei gemeldete Fehler auf einmal**: der fehlende Pfeil
  beim Bauern, der fehlende Pfeil beim Springer und der fehlende Pfeil beim
  schrägen Schlagen. Sie hatten dieselbe Ursache — eine Strecke von einem Feld
  war kürzer als Pfeilrand plus Spitze, also wurde gar nichts gezeichnet. Ein
  Feld kann nicht zu kurz sein.
- **Figuren ändern ihre Grösse nicht mehr.** Die Schriftgrösse kommt jetzt aus
  der gemessenen Feldbreite statt aus einer Schätzung (`88vw`). Die Schätzung
  lag daneben, sobald das Brett schmaler ausfiel als angenommen — am Rechner
  etwa, wenn durch den wachsenden Zugverlauf ein Scrollbalken erscheint. Genau
  das passierte mitten im Spiel.
- **Jede Fähigkeit sagt, was sie kostet.** Am Vorrat steht neben dem Namen ein
  **Pluszeichen**, wenn dir danach noch dein normaler Zug bleibt, und ein
  **Blitz**, wenn du sie auch einsetzen darfst, während der Gegner am Zug ist.
  Was die Zeichen bedeuten, steht hinter dem i.
- **Ausweichen geht jetzt im gegnerischen Zug** und kostet keinen. Wer zuerst
  drückt, war zuerst — abgesichert über denselben Zähler, mit dem sich auch
  zwei Züge aus einem Team nicht überholen können.
- **Ausweichen schlägt nicht mehr.** Es bietet nur noch freie Felder an. Vorher
  standen rote Schlagfelder da, auf die der Tipp dann doch nichts tat.
- **Ein Tipp neben die Zielfelder bricht ab**, statt stumm nichts zu tun. Bis
  v3.5 nahm das Brett keine Tipps mehr an, und der einzige Ausweg war ein
  Abbrechen-Knopf unter dem Brett — von aussen sah das aus, als hinge die Seite.
- **Im Schach geht keine Fähigkeit mehr, die den König im Schach zurücklässt.**
  Zwei Fälle sind gesperrt: sich selbst ins Schach stellen (etwa durch einen
  Bauernschub, der den König freilegt) und im Schach stehen und den Zug abgeben.
  Was den Zug NICHT beendet, bleibt erlaubt — man muss danach ohnehin aus dem
  Schach ziehen.
- **Würfel werden auch beim Durchlaufen eingesammelt.** Wer mit dem Turm über
  einen Würfel hinwegzieht, nimmt ihn mit. Nur der Springer nicht: Er setzt über
  die Felder dazwischen hinweg und berührt sie nie. Dasselbe gilt für die
  Fähigkeiten „Sprung" und „Teleport".
- **Was du schon hast, kommt seltener nach.** Jedes Exemplar im Vorrat drückt
  die Chance auf ein weiteres — bei Gewöhnlich hart (auf 15 Prozent je Stück),
  bei Legendär kaum (75 Prozent). Der Grund für die Staffelung: In der
  gewöhnlichen Stufe stehen drei Fähigkeiten zur Auswahl, bei den legendären
  fünf, und eine harte Dämpfung hiesse dort „du bekommst die anderen garantiert
  zuerst".
  Dafür entscheidet sich jetzt erst BEIM EINSAMMELN, was in einem Würfel steckt;
  beim Erscheinen steht nur seine Stufe fest. Anders ginge es nicht — vorher
  weiss noch niemand, wer ihn bekommt.
- **Das Fähigkeiten-Fenster ist schlanker.** Der Erklärabsatz über den
  Fähigkeiten ist ins i-Menü gewandert, der i-Knopf nach oben in die
  Überschrift. Auf dem Handy schob der Text bisher das Einzige, was man hier
  anfassen kann, aus dem Bild.
- **„Sprung" ist richtig beschrieben.** Es ist kein zusätzlicher Zug, sondern
  eine zusätzliche Gangart für den nächsten. Dasselbe gilt für Teleport.

Unter der Haube: `SCHACH.wegFelder` und `SCHACH.betreteneFelder` beantworten
zwei verschiedene Fragen — welche Felder man ZEICHNET (beim Springer das L) und
welche die Figur wirklich BETRITT (beim Springer nur das Ziel). Beide stehen im
Regelwerk, damit Anzeige und Einsammeln nicht auseinanderlaufen können.

## v3.5 — 2026-08-03

Sechs Punkte aus dem Eingangskorb — einer für die Bedienung, drei neue
Fähigkeiten, ein Umbau und eine Kleinigkeit, die es in sich hatte.

- **Wer am Zug ist, bleibt auf dem Handy sichtbar.** Die Leiste über dem Brett
  klebt jetzt oben fest. Vorher hatte man beim Spielen nur noch das Brett vor
  sich und musste hochscrollen, um zu sehen, wer dran ist.
- **Neue Fähigkeit „Wiederbelebung" (legendär).** Eine eigene geschlagene Figur
  steht genau dort wieder auf, wo sie fiel — wenn das Feld frei ist. Sie kostet
  den ganzen Zug: Danach ist der Gegner dran. Dafür merkt sich der Spielstand ab
  jetzt, WO jede Figur gefallen ist.
- **Neue Fähigkeit „Mauer" (ungewöhnlich).** Ein blauer Riegel über drei freie
  Felder derselben Reihe; das angetippte Feld ist sein linkes Ende. Niemand
  zieht hindurch — Türme, Läufer und Damen bleiben davor stehen, Bauern kommen
  weder ein noch zwei Felder vorbei, und die Rochade fällt aus. Nur Springer
  setzen darüber hinweg. Nach ein paar Zügen zerfällt sie. Sie gehört keiner
  Seite: Sie behindert auch den, der sie gelegt hat.
- **Neue Fähigkeit „Friedhof" (legendär).** Bis zu vier gefallene GEGNER stehen
  auf einem freien 2×2-Feld wieder auf — in deiner Farbe, und du ziehst mit
  ihnen wie mit eigenen. Nach acht Halbzügen zerfallen sie. Am Brett sind sie
  gestrichelt umrandet, damit man nicht auf sie baut.
- **Neue Fähigkeit „Händler" (episch).** Ein Angebot zum Tauschen — etwa fünf
  Bauern gegen einen Turm, oder umgekehrt. Elf Angebote, keines bringt mehr als
  einen Punkt Vorsprung; welches kommt, hängt am Spielstand und ist auf jedem
  Gerät dasselbe. **Ablehnen kostet nichts**: Die Fähigkeit bleibt dir, und nach
  dem nächsten Zug bietet er etwas anderes an. Der Dialog sagt vorher genau,
  welche Figuren weggehen und wo die neuen erscheinen.
- **Erdbeben wurde umgebaut.** Es schiebt nicht mehr die Nachbarfelder nach
  aussen, sondern **drei ganze Reihen um ein Feld zur Seite** — die angetippte
  und je eine darüber und darunter. Tippst du links aufs Brett, geht es nach
  links, tippst du rechts, nach rechts. Wer am Rand steht oder ansteht, bleibt;
  alle anderen rücken nacheinander auf wie eine Schlange.
- **Der Zugpfeil zeigt beim Springer das L** statt einer Diagonale über Felder,
  die er nie berührt hat. Gilt auch für die Fähigkeit „Sprung".

**Unter der Haube, aber wichtig:** Der Spielstand hat einen neuen Zähler
`takt`, der jeden Halbzug mitzählt. Der vorhandene `halbzuege` ist der Zähler
der Fünfzig-Züge-Regel und springt bei jedem Bauernzug auf null zurück — als Uhr
für Mauern und geliehene Figuren hätte er dazu geführt, dass ein einziger
Bauernzug sie verewigt.

## v3.4 — 2026-08-03

- **Die Fähigkeiten-Karte fehlte, wenn man die Würfel zuschaltete.** Wer eine
  klassische Partie (oder klein, groß, Doppelbrett) mit dem Haken
  „Zufalls-Würfel" anlegte, sah die Würfel zwar auf dem Brett und sammelte sie
  auch ein — die Karte unter dem Brett, in der die eingesammelten Fähigkeiten
  stehen und eingesetzt werden, kam aber nie. Nur in der Spielart „Fähigkeiten
  sammeln" war sie da. Grund: Die Karte fragte die Spielart statt die Partie;
  den Schalter gibt es seit v2.5. Jetzt entscheidet, wie überall sonst,
  `SCHACH_RUNDE.faehigkeitenAn`.

## v3.3 — 2026-08-03

Die drei Wünsche, die über den Wunsch-Knopf hereinkamen — plus eine Kleinigkeit
am Zugpfeil.

- **Auf einen Namen in der Rangliste tippen öffnet sein Profil.** Dort steht,
  woher die Punkte kamen: jede beendete Partie und jede aufgelöste
  Imposter-Runde einzeln, das Jüngste zuerst — mit Tag und Uhrzeit, Spieldauer,
  Zugzahl, Gegnern und Mitspielern.

  *Zwei Einschränkungen, die im Profil auch dastehen:* Der Würfel-Quizz taucht
  nicht einzeln auf, weil er nur die laufende Runde kennt. Und Partien von vor
  dieser Fassung haben keine Startzeit — dort fehlt die Dauer, statt geschätzt
  zu werden. **Ab jetzt läuft beides mit.**
- **Löschen geht nur noch mit dem Verwaltungs-Passwort** — Räume im Imposter
  wie Partien im Schach. Beim Imposter ist das der wichtigere Fall: Ein
  gelöschter Raum nimmt allen Mitspielern die Punkte, die sie darin geholt
  haben.
- **Die Würfel hören nicht mehr auf zu erscheinen.** Bisher lagen höchstens drei
  gleichzeitig; wer nicht einsammelte, bekam ab dem dritten gar nichts mehr —
  mitten in der Partie war Schluss. Jetzt kommt durchgehend nach Chance
  Nachschub, solange überhaupt ein Feld frei ist.
- **Der Pfeil zeigt beim Springer jetzt das L.** Vorher lief er als gerade
  Diagonale über Felder, die der Springer nie berührt hat. Gilt auch für die
  Fähigkeit „Sprung" — erkannt wird die Bewegung, nicht die Figur.

## v3.2 — 2026-08-03

- **Der Imposter hat jetzt Räume — wie das Schach seine Partien.** Bisher gab es
  genau EINE Runde, und jeder konnte Thema und Anzahl der Imposter umstellen;
  in der Praxis verstellten sie sich gegenseitig. Jetzt legt **eine** Person
  einen Raum an und entscheidet dabei:
  1. wie viele Imposter es höchstens geben soll,
  2. aus welchem Thema das Wort kommt (eine Kachel je Wortgruppe),
  3. wie der Raum heißen soll.

  Danach stehen die Regeln fest, und die anderen treten einfach bei. Wer anlegt,
  ist sofort dabei. **Mehrere Räume laufen nebeneinander** — für andere Regeln
  legt man einen zweiten an, statt den ersten umzustellen. Die Rangliste zählt
  die Punkte aus allen aufgelösten Räumen zusammen.

  *Eine laufende Runde bricht dabei nicht:* Der bisherige Stand wird beim ersten
  Laden zum Raum **„Erster Raum"** und läuft mit demselben Wort, denselben
  Rollen und denselben Mitspielern weiter.
- **Die Wortbibliothek gilt jetzt für alle Räume gemeinsam.** Sie liegt eine
  Ebene höher als die Räume; ein ergänztes Wort steht damit sofort in jedem.
- **`team-schach.js` liegt in vier Dateien statt in einer.** Die Datei war auf
  2476 Zeilen gewachsen. Jetzt: Kern (Zustand, Zeichnen, Teams, Bedienung),
  Übersicht, Brett und Auswertung. **Am Verhalten ändert das nichts** — die
  drei neuen Dateien ergänzen dasselbe Objekt, jeder Aufruf heißt weiter
  `TEAM_SCHACH.…`. Nachgewiesen: alle 67 Funktionen sind unverändert vorhanden,
  keine doppelt, keine verloren.

## v3.1 — 2026-08-03

- **Wunsch-Knopf im Kopf.** Ein Satz hineinschreiben, und die App öffnet ein
  vorbefülltes GitHub-Formular — mit Tab und Version schon eingetragen. Die
  Wünsche holt `tools\Wuensche-Abholen.ps1` in die Aufgabenliste unter
  **Anfragen**; erst mit dem Wort *bestätigt* werden sie eingeordnet.
- **Wortbibliothek für die Verwaltung.** Hinter dem Verwaltungs-Passwort stehen
  alle Wörter des Imposter-Spiels, mit einem **Import-Knopf**: Blocktext
  einfügen, ein Wort je Zeile, Doppelte werden übersprungen. Ergänzte Wörter
  gelten für alle Mitspieler; einzeln entfernen geht per Antippen.
  *Warum hinter dem Passwort:* Wer die Wortliste kennt, hat als Imposter einen
  Vorteil.
- **Teilpunkte im Schach.** Geschlagene Figuren zählen jetzt: 0,8 Punkte je
  Figurenwert (Bauer 1 … Dame 9), höchstens 12 je Partie. Auch eine verlorene
  Partie bringt etwas, wenn man dem Gegner die Dame abgenommen hat — ein Sieg
  bleibt trotzdem mehr wert.
- **Im Imposter tippen jetzt alle etwas ein.** Die Ehrlichen bekommen ein
  Notizfeld ohne Wirkung auf die Punkte — sonst sah man am Tisch sofort, wer
  tippt und damit wer der Imposter ist.
- **Fehler behoben: Der Abschluss-Bildschirm kam nach jedem Neuladen erneut.**
  „Schon gesehen" lag nur im Arbeitsspeicher und liegt jetzt im Gerätespeicher.
- **Die Pfeile sind wieder ganz zu sehen.** Nur Figuren ZWISCHEN Start und Ziel
  unterbrechen sie noch; an den Enden bleibt der Pfeil vollständig, und Spitze
  wie Anfang sind kürzer.
- **Wer eine Partie anlegt, ist sofort dabei** — im weissen Team und direkt in
  der Partie, statt erst über die Übersicht beizutreten.
- **Zufalls-Knopf bei der Team-Auswahl:** Er setzt bevorzugt in ein leeres Team,
  sonst in das kleinere; erst bei Gleichstand entscheidet der Zufall.
- **Neue Tab-Reihenfolge:** Team Schach, Imposter, Würfel Quizz, Rangliste.

## v3.0 — 2026-08-03

Ein drittes Spiel: **Imposter**.

- **So läuft es:** Alle treten der Runde bei, stellen Thema und Anzahl der
  Imposter ein und drücken „bereit". Dann bekommt jeder groß dasselbe Wort
  gezeigt — bis auf die Imposter, bei denen dort **Imposter** steht. Die Uhr
  läuft, am Tisch stellt man sich Fragen, und nebenbei tippt jeder die anderen
  als *Verdächtig* oder *Unverdächtig* ein. Der Imposter rät derweil das Wort.
  Sind alle fertig, kommt die Auflösung.
- **Acht Wortgruppen** mit über 200 Wörtern: fünf Themen (Alltag, Essen, Natur,
  Technik, Freizeit) und drei Wortarten (nur Nomen, nur Verben, nur Adjektive).
  Alle handverlesen — es sind nur Wörter dabei, die man beschreiben kann, ohne
  sie zu nennen.
- **Die Anzahl der Imposter ist ein Höchstwert, kein Versprechen:** Es können
  weniger werden, in seltenen Fällen gar keiner. **Einer weiß das Wort immer** —
  sonst könnte niemand die Fragen beantworten.
- **Beim geratenen Wort wird ein Fehler verziehen:** Groß- und Kleinschreibung
  ist egal, und ein Buchstabe zu viel, zu wenig, falsch oder mit dem Nachbarn
  vertauscht zählt noch als richtig.
- **Punkte:** 8 für jeden richtig eingeschätzten Mitspieler, 20 für einen
  Imposter, den die Mehrheit nicht enttarnt hat, 15 fürs Erraten des Wortes,
  2 fürs Mitspielen — und 10 Zuschlag für alle, wenn die Runde unter fünf
  Minuten gedauert hat. Sie zählen in der **Rangliste** mit.
- **Wort und Rollen stehen nirgends in der Datenbank.** Gespeichert wird nur
  ein Salz; alles Weitere rechnet jedes Gerät daraus selbst aus. Was die
  Datenbank verrät, ist damit eine Zeichenkette und sonst nichts. Die Grenze
  dieser Lösung steht ehrlich in `docs/DECISIONS.md`.

> **Vor dem ersten Spielen:** Der neue Pfad `imposter` braucht eine eigene
> Firebase-Regel — siehe `docs/DEPLOYMENT.md`, Abschnitt 2. Ohne sie kann das
> Spiel nichts speichern.

## v2.9 — 2026-08-03

- **Die Spielart „Fähigkeiten sammeln" steht nicht mehr zur Auswahl.** Seit v2.5
  lassen sich Würfel in jeder Spielart zuschalten — damit war sie dasselbe wie
  „Klassisch" mit gesetztem Haken und stand nur doppelt in der Liste.
  **Laufende Partien in dieser Spielart laufen unverändert weiter**; die Kennung
  bleibt gültig, sie taucht nur beim Anlegen nicht mehr auf.
- **Alle Haken sind neu erst einmal aus.** Eine neue Partie ist ein normales
  Schachspiel; was dazukommen soll, hakt man ausdrücklich an.
- **„Seltenheit anzeigen" erscheint erst, wenn die Würfel an sind** — als
  eingerückter Unterpunkt. Vorher stand dort eine Einstellung für etwas, das es
  gar nicht gab.
- **Ohne „Seltenheit anzeigen" sehen jetzt ALLE Würfel gleich aus** — auch die
  Unglückswürfel. Vorher verrieten sie sich durch das umgedrehte Fragezeichen;
  jetzt ist jeder Würfel ein Risiko, und genau das ist der Sinn der Einstellung.
- **Handy durchgesehen:** Jeder Knopf hat jetzt eine Tippfläche von mindestens
  40 Pixeln, die i-Knöpfe und die Haken sind größer, die Spielart-Kacheln stehen
  einzeln untereinander (großes Vorschaubild), Bilanz und Fähigkeiten brechen um
  statt zu quetschen, und der Abschluss-Bildschirm füllt den Schirm.

## v2.8 — 2026-08-03

- **Würfel erscheinen ohne festen Takt.** Bisher kam alle sechs Halbzüge einer —
  man konnte mitzählen. Jetzt wird nach **jedem** Halbzug neu gewürfelt (18
  Prozent, im Schnitt also weiterhin jeder sechste). Liegen gelassene Würfel
  bleiben liegen und halten den Nachschub nicht auf.
- **Neuer Unglückswürfel „Volles Glas" (gewöhnlich):** Wer ihn einsammelt, sieht
  die gegnerischen Figuren acht Halbzüge lang falsch — sie ziehen wie immer,
  sehen aber aus wie etwas anderes. **Nur die eigene Ansicht ist betroffen**, der
  Gegner merkt nichts. Die Regeln bleiben unangetastet.
- **Auch Fähigkeiten werden abgestimmt**, wenn die Partie mit „Team muss sich
  einig sein" angelegt wurde — vorher galt das nur für Züge.
- **Eine Abstimmung hat jetzt eine Frist:** zehn Sekunden, danach gilt der
  Vorschlag auch ohne alle Stimmen. Wer **zweimal** nicht abstimmt, verkürzt sie
  auf fünf, danach auf drei Sekunden. Sobald er wieder mitstimmt, gilt wieder die
  volle Zeit. Damit steht ein Team nicht still, nur weil einer aufgehört hat.
- **Fehler behoben: Ein neu erschienener Würfel bekam einen farbigen Kreis** —
  er sah aus, als wäre gerade etwas mit ihm passiert. Ringe gibt es jetzt nur
  noch für Wirkungen, nicht fürs Erscheinen.
- **Der Pfeil endet am Rand der Figuren**, statt unter ihnen anzufangen und
  aufzuhören — einheitlich für Züge, Rochaden und jede Fähigkeit.
- **Vorzüge sind wieder ausgebaut.** Sie liefen nicht rund: Der Zug sprang los,
  während man noch aufs Brett schaute, und die Vormerkung war nach jedem
  Neuladen weg. Die Begründung steht in `docs/DECISIONS.md`, falls es jemand
  später erneut versucht.

## v2.7 — 2026-08-03

- **Unglückswürfel.** Manche Würfel tragen ein **umgedrehtes Fragezeichen** und
  bringen nichts Gutes: Sie kommen nicht in den Vorrat, sondern wirken sofort —
  gegen den, der sie eingesammelt hat. Je Seltenheitsstufe gibt es einen, und je
  höher die Stufe, desto schlimmer:
  - *Gewöhnlich:* **Stolperstein** — die einsammelnde Figur wird ein Feld
    zurückgeworfen.
  - *Ungewöhnlich:* **Ausdehnung** — das Spielfeld wächst an einer zufälligen
    Seite um eine Reihe oder Spalte. Alle Wege werden länger.
  - *Episch:* **Meuterei** — eine eigene Figur läuft zum Gegner über.
  - *Legendär:* **Erdrutsch** — alle eigenen Figuren rutschen ein Feld zurück.
  Jeder achte Würfel ist ein Unglückswürfel; Könige bleiben von allem verschont.
- Was ein Unglückswürfel bewegt, wird **gelb** gezeichnet — Pfeile wie
  aufleuchtende Felder — und steht mit Namen im Zugverlauf.
- **Der Verlauf verrät nichts mehr:** Beim Erscheinen steht nur noch, WO ein
  Würfel liegt, nicht was darin ist. Ob es ein Unglückswürfel ist, sieht man
  dagegen immer — das ist die Entscheidung, ob man hinzieht.
- **Neue Übersicht hinter dem i:** eine Karte je Seltenheitsstufe in ihrer Farbe,
  darin jede Fähigkeit mit Beschreibung und der Unglückswürfel dieser Stufe.
  Die Zahlen (Chancen, Abstand, Höchstzahl) liegen hinter einem zweiten i an der
  Überschrift — wer nur wissen will, was etwas tut, liest keine Prozentwerte.

## v2.6 — 2026-08-03

- **Fehler behoben: Der Gewinner-Bildschirm blieb aus.** Er kam nur, wenn die
  Partie gerade offen war. Wer beim letzten Zug in der Übersicht stand oder erst
  später wiederkam, sah ihn nie — beendete Partien liegen seit v2.4 zugeklappt,
  und dort sucht niemand nach einem Sieg. Jetzt erscheint er von selbst, sobald
  eine Partie mit eigener Beteiligung zu Ende ist. Über **Ergebnis ansehen** an
  der beendeten Partie lässt er sich jederzeit wieder aufrufen.
- **Wirkende Fähigkeiten stehen am Brett:** Eine geschützte Figur bekommt einen
  blauen Ring, eine gefesselte einen violett gestrichelten, eine eingefrorene
  einen hellblauen Kreis. Vorher musste man sich merken, was gerade wirkt.
- **Der Pfeil verschwindet jetzt wirklich unter den Figuren** — nicht mehr nur
  halbdurchsichtig. Eine Maske im SVG stanzt an jedem besetzten Feld ein Loch;
  dafür darf der Pfeil kräftiger sein als zuvor.
- **Koordinaten am Brett:** a bis h unten, 8 bis 1 links — und sie wachsen mit
  der Spielart mit (a bis f auf dem kleinen, a bis p auf dem Doppelbrett).
  Beim gedrehten Brett zählen sie andersherum.
- **Der Hover verrät nichts mehr.** Ein Würfel zeigt höchstens seine Stufe, nie
  die Fähigkeit darin — sonst wäre es kein Überraschungswürfel.
- **Drei neue Fähigkeiten:**
  - **Nudelholz** (ungewöhnlich) — rollt über zwei Spalten und schiebt alle
    Figuren darin ein Feld vor oder zurück. Angetippt wird der Rand: oben rollt
    nach oben, unten nach unten.
  - **Frost** (episch) — friert eine gegnerische Figur einen Zug lang ein. Sie
    zieht nicht und lässt sich in dieser Zeit auch nicht schlagen.
  - **Spiegel** (legendär) — verdoppelt eine eigene Figur auf ein freies
    Nachbarfeld. Könige nicht.
- **Seltene Fähigkeiten sind wieder selten:** Gewöhnlich 52 Prozent (vorher 45),
  Ungewöhnlich 33 (30), Episch 12 (18), Legendär 3 (7). Episch und Legendär
  kamen deutlich zu häufig.

## v2.5 — 2026-08-02

- **Drei Einstellungen beim Anlegen einer Partie**, gültig für jede Spielart:
  - **Zufalls-Würfel** — Fähigkeiten erscheinen jetzt auch auf dem kleinen, dem
    großen und dem Doppelbrett, wenn man will.
  - **Seltenheit anzeigen** — aus heißt: Alle Würfel sehen gleich aus, und man
    erfährt erst beim Einsammeln, was drin war.
  - **Team muss sich einig sein** — ein Zug wird erst vorgeschlagen und
    ausgeführt, wenn alle aus dem Team zugestimmt haben. Damit lässt sich die
    Hausregel „wer zuerst zieht, hat gezogen" für einzelne Partien abschalten.
    Wer allein im Team ist, zieht weiterhin sofort.
- **Vorzüge:** Während der Gegner dran ist, lässt sich der eigene Zug schon
  vormerken — Figur antippen, Ziel antippen. Er läuft von selbst, sobald das
  eigene Team am Zug ist, ohne dass man etwas drücken muss. Ist er dann nicht
  mehr möglich, wird er verworfen und gemeldet; ersatzweise wird nie etwas
  anderes gezogen.
  **Der Vorzug bleibt auf dem eigenen Gerät** und steht nie im gemeinsamen
  Stand — sonst könnte der Gegner ihn in der offenen Datenbank mitlesen.

## v2.4 — 2026-08-02

Das Ende einer Partie hat jetzt einen Abschluss — und die Rangliste kann nichts
mehr verlieren.

- **Sieger- und Verlierer-Bildschirm**, jeder über den ganzen Bereich: grün mit
  „Gewonnen", rot mit „Verloren", dazu die Punkte, die diese Partie gebracht
  hat. Danach ein Schritt weiter zum **Punktestand** mit der eigenen Zeile
  hervorgehoben, dann zurück in die Übersicht. Er erscheint einmal je Gerät und
  nur für die, die mitgespielt haben.
- **Beendete Partien stehen nicht mehr zwischen den offenen.** Sie liegen
  zugeklappt unter „Beendet (N)" — die Auswahl zeigt nur noch, was wirklich
  läuft.
- **Die Punkte sind endgültig.** Sobald ein Ergebnis feststeht, wird es
  festgeschrieben. Wer eine beendete Partie löscht, nimmt niemandem mehr seine
  Punkte weg — bis v2.3 tat er genau das. Ergebnisse aus älteren Partien wandern
  beim ersten Laden von selbst in die Chronik.
- **Jede Fähigkeit hinterlässt eine Spur auf dem Brett:** Was sich bewegt, bekommt
  einen Pfeil; was wirkt, ohne zu bewegen (Schutzschild, Fessel, Verstärkung,
  Wiedergeburt) und jeder neu erschienene Würfel bekommt einen Ring. Beides
  bleibt stehen, bis der nächste Zug kommt.

## v2.3 — 2026-08-02

- **Jede Bewegung bekommt ihren Pfeil** — auch die durch Fähigkeiten. Beim
  Bauernschub sind es acht Pfeile, beim Erdbeben bis zu acht, bei der Rochade
  zwei (König und Turm). Vorher zeigte der Pfeil nur den letzten normalen Zug.
- Die Pfeile treten **hinter die Figuren zurück**: schmaler und halbdurchsichtig,
  damit sie die Figuren nicht mehr überdecken.
- **Bilanz unter dem Brett:** Wer hat was geschlagen, wer was verloren, und wer
  liegt nach Figurenwert vorn (+3, -1 …). Die geschlagenen Figuren stehen als
  kleine Zeichen daneben — das liest sich schneller als eine Zahl.

## v2.2 — 2026-08-02

- **Die Stufe Grau ist weg.** Es beginnt bei Grün, und die zehn Fähigkeiten
  wurden nach ihrer tatsächlichen Spielstärke neu eingestuft:
  - *Gewöhnlich (45 %):* Sprung, Ausweichen, Teleport — mehr Beweglichkeit für
    einen Zug, gewinnen aber für sich genommen nichts.
  - *Ungewöhnlich (30 %):* Bauernschub, Schutzschild, Erdbeben — verändern die
    Stellung spürbar, kosten den Gegner aber kein Material.
  - *Episch (18 %):* Verstärkung, Fessel — verschieben das Kräfteverhältnis.
  - *Legendär (7 %):* Doppelzug, Wiedergeburt — zwei Züge hintereinander
    gewinnen fast immer Material, und eine zurückgeholte Dame ersetzt eine ganze
    Schlacht.
- **Manchmal erscheinen mehrere Würfel auf einmal:** einer mit 80 Prozent, zwei
  mit 17, drei mit 3 Prozent. Mehr als drei liegen nie gleichzeitig.

## v2.1 — 2026-08-02

Drei Regelkorrekturen.

- **Der König kann nicht mehr geschlagen werden.** Mit dem Doppelzug ging das
  bisher: Man setzte Schach und war sofort wieder am Zug, ohne dass der Gegner
  reagieren durfte — dann verschwand sein König vom Brett, statt dass die Partie
  durch Schachmatt endete. Solche Züge werden jetzt abgewiesen.
- **Die Rochade gibt es in jeder Spielart**, auch auf dem kleinen Brett (König
  auf d), dem großen (König auf f) und dem Doppelbrett. Sie hängt nicht mehr an
  den Standardplätzen des 8-mal-8-Bretts, sondern wird aus der Stellung gelesen.
  Auf dem Doppelbrett rochiert **jeder der beiden Könige für sich**; zieht einer,
  behält der andere seine Rechte.
- **Wer einem Team beigetreten ist, kann nicht mehr wechseln.** Bei einer Partie
  über mehrere Tage hätte man sonst erst für die eine, dann für die andere Seite
  ziehen können. Wer wirklich raus will, verlässt das Team ausdrücklich und tritt
  danach neu bei.

## v2.0 — 2026-08-02

Die Spielart **Fähigkeiten sammeln** ist jetzt ein eigenes Spiel: Würfel
erscheinen über die Partie verteilt, in fünf Seltenheitsstufen, mit zehn
Fähigkeiten.

- **Würfel statt Punkt.** Wo eine Fähigkeit liegt, steht jetzt ein gezeichneter
  Würfel mit Fragezeichen — in der **Farbe seiner Seltenheit**. Man sieht schon
  von weitem, ob sich der Umweg lohnt. Gezeichnet, kein Bild: Er bleibt auf
  jeder Feldgröße scharf, vom 6-mal-6-Brett bis zum Doppelbrett auf dem Handy.
- **Fähigkeiten erscheinen über die Zeit**, alle sechs Halbzüge eine auf einem
  freien Feld, höchstens drei gleichzeitig. Eine Partie startet also leer.
- **Fünf Stufen mit festen Chancen:** Einfach 40 Prozent, Gewöhnlich 28,
  Ungewöhnlich 18, Episch 10, Legendär 4. Innerhalb einer Stufe sind alle gleich
  wahrscheinlich; die vollständige Liste steht hinter dem i-Knopf.
- **Zehn Fähigkeiten**, zwei je Stufe:
  - *Einfach:* **Sprung** (eine Figur zieht wie ein Springer), **Ausweichen**
    (eine Figur zieht ein Feld in jede Richtung);
  - *Gewöhnlich:* **Teleport** (auf ein freies Feld im Umkreis von zwei),
    **Bauernschub** (alle eigenen Bauern rücken ein Feld vor);
  - *Ungewöhnlich:* **Doppelzug** (sofort noch einmal am Zug), **Verstärkung**
    (ein eigener Bauer wird zum Springer);
  - *Episch:* **Schutzschild** (eine Figur lässt sich nicht schlagen),
    **Fessel** (eine gegnerische Figur darf einen Zug lang nicht ziehen);
  - *Legendär:* **Erdbeben** (alle Figuren rund um ein Feld werden nach außen
    geschoben), **Wiedergeburt** (die zuletzt verlorene Figur kehrt zurück).
- **Fähigkeiten, die ein Feld brauchen, fragen danach:** Nach dem Einsetzen sind
  die möglichen Felder hervorgehoben, man tippt eines an. Welche Felder das sind,
  entscheidet das Regelwerk — nicht der Bildschirm.
- **Alle sehen die Wirkung.** Die betroffenen Felder leuchten auf jedem Gerät
  kurz auf, nicht nur bei dem, der die Fähigkeit eingesetzt hat.
- **Nicht gewürfelt, sondern gerechnet.** Feld und Fähigkeit ergeben sich aus
  Partie-Kennung und Zugzähler. Alle Geräte sehen dadurch dieselben Würfel,
  ohne sich abzustimmen.
- **Angefangene Partien laufen weiter:** Wer schon in einer Fähigkeiten-Partie
  spielt, behält seine vier festen Felder und die eingesammelten Fähigkeiten.
- Auf König und Matt wurde geachtet: Das Schild wirkt nicht auf den König, der
  König wird nicht gefesselt, und das Erdbeben lässt Könige stehen. Sonst wäre
  „Schachmatt" nicht mehr eindeutig.

## v1.9 — 2026-08-02

- **Ein Pfeil zeigt den letzten Zug.** Er bleibt auf dem Brett stehen, bis der
  nächste Zug kommt — man sieht also auch nach Stunden noch, was zuletzt
  passiert ist, ohne den Zugverlauf aufzuklappen. Gezeichnet wird er in
  Feldkoordinaten und passt damit auf jede Brettgröße.

## v1.8 — 2026-08-02

- **Rochade auch über den Turm.** Bisher ging sie nur, indem man den König zwei
  Felder zur Seite zog. Jetzt reicht es, mit gewähltem König den **eigenen Turm**
  anzutippen — so, wie man es am echten Brett macht. Der Turm bekommt dabei
  denselben Rahmen wie ein Zielfeld.
- **Die App sagt jetzt, warum die Rochade nicht geht.** Wer den König antippt
  und kein Feld angeboten bekommt, liest darunter den Grund: Figuren im Weg,
  Recht verfallen, König im Schach oder ein bedrohtes Feld auf dem Weg. Die
  Gründe kommen aus dem Regelwerk, nicht aus dem Bildschirm-Code.
- An den Regeln selbst hat sich **nichts** geändert — sie waren richtig. Eine
  Stellung aus einer echten Partie ist jetzt als Test hinterlegt.

## v1.7 — 2026-08-02

- **Die Spielart wird ausgewählt, nicht mehr aus einer Liste gepickt.** Beim
  Anlegen einer Partie erscheint eine eigene Seite mit einer Kachel je Spielart:
  Name, Brettmaße, ein Satz zur Besonderheit — und ein **Vorschaubild**.
- Das Vorschaubild ist ein Miniaturbrett aus **derselben Aufstellung**, aus der
  auch das echte Brett entsteht. Es kann deshalb nicht veralten, und man sieht
  einer Spielart ihre Form sofort an: das kleine Brett quadratisch, das
  Doppelbrett breit, die Fähigkeiten als Punkte auf dem Feld.

## v1.6 — 2026-08-02

- **Die Zugvorhersage ist deutlich zu sehen.** Bis v1.5 war der Punkt auf einem
  möglichen Zielfeld blau — auf den blauen Feldern des Brettes also fast
  unsichtbar. Jetzt bekommt jedes mögliche Feld einen Rahmen und einen kräftigen
  Punkt, beides zweifarbig (außen hell, innen dunkel), damit es auf hellen wie
  auf dunklen Feldern steht. Schlagfelder ebenso in Rot.
- Auch die **angetippte Figur** ist besser zu erkennen: gelbes Feld mit dunklem
  Rahmen statt nur gelbem Feld.

## v1.5 — 2026-08-01

Fähigkeiten zum Aufsammeln und eine Rangliste über beide Spiele.

- **Neue Spielart „Fähigkeiten sammeln".** Auf dem klassischen Brett liegen
  vier Fähigkeiten (auf c5, f5, c4 und f4, für beide Seiten gleich weit weg).
  Wer mit einer Figur daraufzieht, sammelt sie für sein Team ein.
- **Zwei Fähigkeiten:** **Sprung** — beim nächsten Zug darf eine beliebige
  eigene Figur zusätzlich wie ein Springer ziehen. **Doppelzug** — nach dem
  nächsten Zug ist das eigene Team sofort noch einmal am Zug. Beide sind nach
  einem Einsatz verbraucht und für alle sichtbar, solange sie wirken.
- **Neuer Tab „Rangliste".** Ein Punktestand über beide Spiele: die Punkte aus
  dem Würfel Quizz plus die Punkte aus beendeten Schachpartien (Sieg 30,
  Unentschieden 10, Dabeigewesen 2). Hinter dem i-Knopf steht die Rechnung im
  Wortlaut — erzeugt aus denselben Zahlen, mit denen gerechnet wird.
- Der neue Tab hat **keinen eigenen Stand** in der Datenbank: Er liest die
  beiden vorhandenen nur und zeigt sie zusammen.

## v1.4 — 2026-08-01

Mehrere Schachpartien nebeneinander, mit Spielarten zur Auswahl.

- **Übersicht statt einem einzigen Brett.** Der Tab Team Schach zeigt jetzt
  zuerst eine Liste aller Partien mit ihrem Stand, den Teams und der Spielart.
  Von dort wird eine Partie geöffnet; ein Zurück-Knopf führt wieder heraus.
- **Beliebig viele Partien gleichzeitig.** Jede hat einen eigenen Namen, eigene
  Teams und einen eigenen Verlauf. Anlegen, umbenennen und löschen geht aus der
  Übersicht heraus.
- **Spielart beim Anlegen wählen** — und danach fest:
  - **Klassisch** (8 mal 8) wie bisher, mit allen Regeln;
  - **Kleines Brett** (6 mal 6), ohne Läufer und ohne Rochade;
  - **Großes Brett** (10 mal 8) mit je zwei Läuferpaaren;
  - **Doppelbrett** (16 mal 8) mit zwei Armeen je Seite. Die Figuren ziehen
    über beide Hälften. Dort gibt es kein Schach und kein Matt: Wer zuerst
    beide Könige verliert, verliert die Partie.
- **Angefangene Partien laufen weiter.** Der bisherige Stand wird beim ersten
  Laden zur Partie **Erste Partie** — Brett, Teams, Bereitschaft, Verlauf und
  Zugzähler bleiben unverändert. Es geht nichts verloren und es ist nichts zu
  tun.
- Geschrieben wird immer nur die eine geänderte Partie in den Stand vom Server.
  So kann niemand mehr fremde Partien überschreiben, während er selbst zieht.

## v1.3 — 2026-08-01

Das Schachbrett sieht besser aus und lässt sich auf dem Handy bedienen.

- **Blau-weißes Brett** statt braun, in derselben Blaufamilie wie der Rest der
  Seite. Die Figuren haben einen vollen Umriss bekommen — sonst verschwände
  eine weiße Figur auf einem weißen Feld.
- **Züge gleiten.** Eine gezogene Figur wandert von ihrem alten Feld zum neuen,
  statt zu springen. **Das sehen alle**, nicht nur derjenige, der gezogen hat:
  Der Weg steht im Zugverlauf, und jedes Gerät zeichnet ihn nach. Wer in seinem
  Betriebssystem weniger Bewegung eingestellt hat, bekommt keine.
- **Handy-Ansicht der Partie.** Das Brett zieht sich über die volle Breite, die
  beiden Teamkarten stehen nebeneinander statt untereinander, der Zugverlauf ist
  eingeklappt (mit Anzahl in der Überschrift) und die Knöpfe sind größer.

## v1.2 — 2026-07-31

- **Fehler behoben: Der Tab Team Schach blieb leer.** Ein Tab wird erst beim
  ersten Anklicken aufgebaut; sein Stand war da aber längst geladen, und der
  Zeichen-Auftrag von damals lief ins Leere. Neu gezeichnet wurde danach nur
  bei Änderungen — und es änderte sich nichts. Jetzt zeichnet jeder Tab beim
  Öffnen seinen aktuellen Stand.
- Das gilt für beide Tabs: Auch das Würfel Quizz zeigt beim Zurückwechseln
  sofort den neuesten Stand.

## v1.1 — 2026-07-31

- **Eigenes Zeichen für die App**: eine Würfelfläche mit vier Augen und dem
  Stern in der Mitte — beide Werte des Würfel Quizz in einem Bild. Gezeichnet,
  kein Emoji.
- Es erscheint als Lesezeichen im Browser und, dank Manifest, beim Ablegen auf
  dem Startbildschirm von Handy oder Tablet. Dort öffnet sich die Seite dann
  ohne Browserleiste wie eine App.
- Quelle ist `icon.svg`; die PNG-Fassungen erzeugt `tools\Icons-Erzeugen.ps1`
  aus denselben Koordinaten.
- `tools\Deploy-Quizz.ps1` kann jetzt auch Bilder ausliefern — die müssen als
  eigener Datenklumpen hochgeladen werden, sonst kämen sie beschädigt an.

## v1.0 — 2026-07-31

Zweites Spiel: **Team Schach** als eigener Tab.

- **Zwei Teams, beliebig viele Leute je Seite.** Man tritt Weiss oder Schwarz
  bei — auch mitten im Spiel. Sobald auf beiden Seiten jemand steht und beide
  Seiten **bereit** gedrückt haben, beginnt die Partie.
- **Innerhalb des Teams gibt es keine Reihenfolge.** Wer aus dem Team am Zug
  zuerst zieht, hat gezogen. Zieht jemand gleichzeitig, gilt der erste Zug, und
  der zweite bekommt eine Meldung statt den ersten zu überschreiben.
- **Vollständige Schachregeln**: Rochade, en passant, Bauernumwandlung mit
  Auswahl, Schach, Schachmatt, Patt und die Fünfzig-Züge-Regel. Gefesselte
  Figuren bleiben stehen, der König darf nicht ins Schach ziehen.
- **Bedienung wie gewohnt**: Figur antippen, mögliche Felder erscheinen als
  Punkte (Schlagfelder als Ring), Zielfeld antippen. Wer für Schwarz spielt,
  sieht das Brett gedreht.
- Der Stand liegt in der Datenbank und wird jederzeit fortgesetzt. Dazu ein
  Zugverlauf mit Namen, Aufgeben und Neue Partie.
- **Wichtig beim Umstieg:** In den Firebase-Regeln muss der neue Pfad
  `team-schach` freigegeben werden, sonst kann das Schach nichts speichern —
  siehe `docs/DEPLOYMENT.md`, Abschnitt 2.

## v0.9 — 2026-07-31

- **Neue Runde nur mit dem Verwaltungs-Passwort.** Der Knopf steht weiter bei
  jedem, fragt aber nach dem Passwort — eine neue Runde löscht schließlich bei
  allen Mitspielern Würfel und Vermutungen. Wer die Verwaltung ohnehin offen
  hat, wird nicht noch einmal gefragt.
- **Jeder hat eine PIN.** Wer sich als Spieler ohne PIN anmeldet (aus der Zeit
  vor v0.6), muss jetzt direkt danach eine vergeben. Damit ist die letzte Lücke
  zu, durch die man ohne Ausweis in ein fremdes Konto kam.
- Das PIN-Feld lässt sich nach wie vor nicht leer bestätigen: Der Knopf bleibt
  gesperrt, bis vier Ziffern dastehen.

## v0.8 — 2026-07-31

Punktestand mit Teilpunkten, und ein behobener Fehler, der Mitspieler
hinauswarf.

- **Punkte statt bloßer Trefferzahl.** Ein genau geratener Würfel bringt 10
  Punkte, einer der um 1 danebenlag 4 Punkte, um 2 danebenliegend 2 Punkte.
  Wer auf eine Person am besten getippt hat, bekommt 5 Punkte Bonus; bei
  Gleichstand alle. Der Stern zählt nur genau getroffen.
- **Der i-Knopf** neben dem Punktestand erklärt die Rechnung im Wortlaut,
  mit Beispiel. Die Erklärung stammt aus derselben Datei wie die Rechnung und
  kann deshalb nicht veralten.
- Der Punktestand zeigt je Person, woraus die Punkte entstanden sind:
  wie viele genau, wie viele knapp daneben, wie viel Bonus.
- **Fehler behoben: Mitspieler verschwanden wieder aus der Runde.** Wer sich
  anmeldete, während ein anderes Gerät noch den alten Stand im Speicher hatte,
  wurde von dessen nächstem Schreibvorgang gelöscht — die App meldete ihn dann
  ab und fragte erneut nach dem Namen, was wie ein mehrfaches Neuladen der
  Seite aussah. Jetzt wird der eigene Eintrag in den Stand vom Server
  eingefügt, statt alles zu überschreiben.
- **Ausliefern per Skript:** `tools\Deploy-Quizz.ps1` lädt alle geänderten
  Dateien in einem einzigen Commit hoch, ohne git und ohne Weboberfläche.

## v0.7 — 2026-07-31

- **Profil-Knopf** im Kopf der eigenen Karte. Dahinter liegen beide Änderungen
  am eigenen Zugang: **Name ändern** und **PIN ändern**. Der frühere Knopf
  „Name ändern" ist darin aufgegangen.
- **PIN ändern** verlangt zuerst die bisherige PIN — sonst könnte jemand an
  einem kurz unbeaufsichtigten Handy den Zugang übernehmen. Die neue PIN wird
  zweimal eingegeben und bekommt ein neues Salz.
- **Namen sind eindeutig.** Ein bereits vergebener Name wird jetzt auch beim
  Umbenennen abgewiesen, nicht nur beim Anmelden — sonst wäre die Liste beim
  Anmelden nicht mehr eindeutig.

## v0.6 — 2026-07-31

Anmelden von jedem Gerät, und ein Zugang für die Verwaltung.

- **PIN beim Anmelden.** Wer sich neu anmeldet, vergibt zum Namen vier Ziffern
  (zur Sicherheit zweimal einzugeben). Gespeichert wird nie die PIN selbst,
  sondern nur eine Prüfsumme mit Zufallssalz — wie beim Würfel-Siegel.
- **Beim ersten Besuch fragt die Seite zuerst: Bist du schon dabei?** Es
  erscheint die Liste der Mitspieler. Wer sich dort auswählt und seine PIN
  eingibt, ist wieder er selbst — **von jedem Gerät aus**, auch vom Handy eines
  anderen. Drei Fehlversuche, dann bricht der Vorgang ab.
- Wer neu ist, wählt unten **Ich bin neu hier**. Ein bereits vergebener Name
  wird abgewiesen.
- **Verwaltungs-Zugang.** Unten in der Fußleiste der Knopf **Verwaltung**, mit
  Passwort. Danach steht oben die Marke *Verwaltung aktiv*, und bei jedem
  Mitspieler erscheint **Spieler entfernen** — hilfreich bei doppelten
  Anmeldungen oder vergessenen PINs. **Verwaltung beenden** schaltet zurück.
  Das Passwort steht nirgends in den Dateien, nur seine Prüfsumme.
- Die Verwaltung sieht **keine** fremden Würfel. Die liegen weiterhin
  ausschließlich auf den Geräten ihrer Besitzer.

## v0.5 — 2026-07-31

Klarstellung an der Oberfläche: Die Reihenfolge der Würfel spielt keine Rolle.

- Die Eingabefelder heißen nicht mehr **Würfel 1** bis **Würfel 5**. Diese
  Nummern legten nahe, man müsse Platz für Platz richtig raten — gezählt wird
  aber, welche Werte vorkommen, nicht wo sie stehen.
- Über jeder Eingabereihe steht jetzt: *Reihenfolge egal — es zählt nur, welche
  Werte vorkommen.*
- An der Zählung selbst ändert sich nichts; sie war von Anfang an so. Wer
  1,2,3,4,5 hat und 3,4,2,5,1 tippt, hatte immer schon 5 von 5 Treffern.

## v0.4 — 2026-07-31

Sparsam mit mobilen Daten.

- **Im Hintergrund wird nicht mehr abgefragt.** Liegt die Seite in einem
  anderen Tab oder steckt das Handy in der Tasche, ruht die Abfrage
  vollständig. Sobald die Seite wieder sichtbar wird, holt sie den Stand
  sofort nach — ohne auf den nächsten Zeitabstand zu warten.
- Der Zeitabstand lässt sich in `js/konfig.js` vergrößern
  (`abfrageIntervallMs`), wenn es noch sparsamer sein soll.

## v0.3 — 2026-07-31

Jeder deckt für sich auf, und die eigenen Zahlen sind standardmäßig verdeckt.

- **Aufdecken je Person statt gemeinsamer Auflösung.** Der Knopf
  **Meine Würfel aufdecken** gibt nur den eigenen Wurf frei. Wer fertig ist,
  deckt auf; die anderen raten in Ruhe weiter. Den gemeinsamen
  Auflösen-Knopf gibt es nicht mehr.
- **Sperre nach dem Aufdecken:** Sobald jemand aufgedeckt hat, kann niemand
  mehr auf ihn tippen. Ohne diese Regel könnte man nach der Auflösung noch
  schnell die richtigen Werte eintragen.
- **Augen-Knopf.** Ein Auge in der eigenen Karte blendet die eigenen
  Würfelzahlen aus — **standardmäßig sind sie verdeckt**. Antippen zeigt sie,
  erneutes Antippen versteckt sie wieder; beim nächsten Laden ist wieder alles
  zu. So verrät ein Blick über die Schulter nichts.
- Die Karten der anderen zeigen jetzt automatisch das Ergebnis, sobald die
  Person aufgedeckt hat: echte Würfel, alle Tipps, Trefferzahlen. Die
  Bestenliste erscheint, sobald die erste Person aufgedeckt hat, und wächst mit.
- Die Hauptaktion wandert mit dem Spielstand: erst **Würfel festlegen**, dann
  **Meine Würfel aufdecken**, danach **Neue Runde**.

## v0.2 — 2026-07-31

Aus der Tabelle wird das eigentliche Spiel: Jeder würfelt fünf Würfel, hält sie
geheim, rät über den Tag, was die anderen haben, und am Ende wird aufgelöst.

- **Anmelden statt Zeilen anlegen.** Beim ersten Besuch fragt die Seite nach dem
  Namen und legt dafür einen Spieler an. Der Name bleibt auf dem Gerät.
- **Eigene Würfel festlegen.** Die fünf gewürfelten Werte bleiben auf dem
  eigenen Gerät. Veröffentlicht wird nur ein Siegel (Prüfsumme) — niemand kann
  sie vorher nachschlagen, auch nicht in der Datenbank.
- **Vermutungen eintragen.** Für jeden Mitspieler fünf Felder. Bis zur Auflösung
  sieht die Vermutungen niemand außer dem Rater.
- **Auflösen.** Ein Knopf löst für alle auf; danach deckt jedes Gerät seine
  eigenen Würfel auf, und die App prüft sie gegen das Siegel. Wer nachträglich
  einen anderen Wurf behauptet, fällt auf.
- **Auswertung.** Je Person die echten Würfel, wer was getippt hat und wie viele
  Werte stimmten. Die Reihenfolge zählt nicht; ein doppelt geratener Wert zählt
  nur so oft, wie er wirklich vorkommt. Dazu eine Bestenliste.
- **Neue Runde** setzt Würfel und Vermutungen zurück, die Mitspieler bleiben.
  **Ich bin raus** meldet einen selbst wieder ab.
- Transparenz: Wer seinen Wurf nachträglich neu festlegt, wird mit Anzahl und
  Uhrzeit angezeigt.
- Tests: 35 Prüfungen der Spiellogik, 9 des Siegels, dazu die Syntaxprüfung.

## v0.1 — 2026-07-31

Erste Fassung.

- Tab **Würfel Quizz** mit der Tabelle: erste Spalte Name als Freitext, danach
  fünf feste Würfel-Spalten mit den Werten 1 bis 5 und Stern.
- Zeilen lassen sich hinzufügen und nach Rückfrage einzeln löschen.
- Speichert von selbst, kurz nach der letzten Eingabe; der Kopf zeigt den
  Stand an (geladen, wird gespeichert, Fehler).
- Zwei Speicher-Wege: gemeinsam für alle Besucher (Firebase Realtime Database)
  oder nur auf dem eigenen Gerät. Umgestellt wird das in `js/konfig.js`.
  Ohne eingetragene Datenbank-Adresse läuft die App auf dem eigenen Gerät und
  sagt es in einem Hinweisbalken.
- Bedienbar auf Rechner, Tablet und Handy; dunkle Darstellung folgt der
  Systemeinstellung.
- Regressionstests der Datenlogik (20 Prüfungen) und ein lokaler Test-Server.
