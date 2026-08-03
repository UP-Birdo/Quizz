# Änderungen

Neueste Version oben. Die Version steht in `js/konfig.js` (`APP_VERSION`) und
wird im Kopf der Seite angezeigt.

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
