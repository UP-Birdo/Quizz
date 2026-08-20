# Team Schach — die eisernen Regeln

**Pflichtlektüre vor JEDER Arbeit am Team Schach** (Regeln, Fähigkeiten,
Brett, Bildschirm). Bis 19.08.2026 standen diese Regeln in der `CLAUDE.md`
und wurden damit in jeder Sitzung geladen — auch dort, wo gar nicht am Schach
gearbeitet wurde. Inhaltlich sind sie unverändert hierher umgezogen.

Die spielübergreifenden Regeln (Stand/Abgleich, Geheimnisse, Datenvertrag,
Stil) stehen weiter in der [CLAUDE.md](../CLAUDE.md) — sie gelten zusätzlich.

## Brett, Stand und Spielarten

- **Laufende Partien müssen laufen bleiben.** `SCHACH_TAFEL.normalisieren()`
  erkennt einen Stand aus der Zeit der einzelnen Partie und macht daraus die
  Partie `start`. Wer daran etwas ändert, bricht angefangene Partien;
  `tests\test-schach-tafel.js` prüft es Feld für Feld.
- **Kein `8` mehr in den Regeln.** `schach.js` rechnet mit `stand.breite` und
  `stand.hoehe`; die öffentlichen Umrechnungen (`feldNummer`, `feldName`,
  `spalteVon`, `reiheVon`) nehmen die Maße als **wahlfreie** Parameter mit
  Vorgabe 8. Diese Vorgabe ist der Grund, warum alle Aufrufe von früher gültig
  blieben — nicht wegnehmen.
- **Die Spielart gehört zur Partie und steht nach dem Anlegen fest.** Sie
  wechseln hieße das Brett umrechnen; bei anderer Größe ist das unmöglich.
- **Die Oberfläche verrät nie, was in einem Würfel steckt** — weder im
  Titel-Text beim Darüberfahren noch im Zugverlauf. Gezeigt wird höchstens, wie
  er AUSSIEHT, und darüber entscheiden zwei getrennte Haken der Partie:
  `regeln.seltenheitZeigen` die Farbe (wie selten?) und `regeln.pechZeigen` das
  umgedrehte Fragezeichen (ist er schlecht?). Bis v0.48 war „Unglück wird immer
  gezeigt" eine eiserne Regel; seit v0.49 ist es eine Einstellung, und sie ist
  **standardmässig aus** — dann sieht ein Unglückswürfel aus wie jeder andere.
- **Die BRETTFORM ist ein Merkmal der Spielart, keine Sortierung** (`form`,
  seit v0.63): `klassisch`, `rechteckig` oder `kreuz`. Der Anlege-Bildschirm
  fragt sie VOR der Spielart und zeigt darunter nur deren Grössen. Wer eine
  Spielart ergänzt, gibt ihr eine Form — sonst taucht sie in keiner Liste auf
  (ein Test in `test-bildschirm.js` fängt das ab).
- **Ein Bauer zieht von seiner STARTSEITE zur gegenüberliegenden** (seit
  v0.65). Die Seite steht je Bauer im Stand (`bauernSeiten`), gefragt wird sie
  über `SCHACH.bauernSeite`; Laufrichtung, Schlagfelder, Doppelschritt und
  Umwandlungsziel fallen daraus (`bauernRichtung`, `bauernSchlagfelder`,
  `bauernDarfDoppelt`, `bauernAmZiel`). **Wer keinen Eintrag hat, folgt der
  alten Farbregel** — Weiss unten, Schwarz oben; deshalb rechnet jedes Brett
  von früher und jede laufende Partie unverändert weiter. Wer einen Bauern
  bewegt, ohne dass ein Zug stattfindet (Nudelholz, Bauernschub, Erdbeben),
  führt die Einträge mit `SCHACH.bauernSeitenVerschieben` nach — sonst läuft
  der geschobene Bauer danach in die falsche Richtung. **Seit v0.98 gilt das
  auch für die Unglücks-Lootboxen:** `_pechAusloesen` reicht sein `wege`
  dorthin weiter; bis dahin tat es das nicht, und ein vom Erdbeben geschobener
  Bauer lief auf dem Kreuz danach falsch herum.
- **DER DOPPELSCHRITT GEHÖRT DEM BAUERN, NICHT DER REIHE** (seit v0.98,
  Wünsche #37 und #38). Gefragt wird nicht mehr „steht er auf einer
  Startreihe", sondern **„hat dieser Bauer schon selbst gezogen"**. Wer
  geschoben wurde, hat sich nicht selbst bewegt und behält seinen
  Doppelschritt; wer gezogen ist, bekommt ihn auch dann nicht zurück, wenn ihn
  etwas auf seine Startreihe zurückschiebt. Die Antwort steht als
  `stand.bauernZog` (Feldnummern) im Stand und wird überall dort nachgeführt,
  wo auch `bauernSeiten` nachgeführt wird — Zug, Schub, Brettgrösse.
  **`bauernZugFassung` ist der Umstieg** (Muster von `bonusFassung`): Fehlt
  sie, baut `standNormalisieren` die Liste EINMAL aus der alten Reihen-Regel
  (`SCHACH._darfDoppeltNachReihe`, die es weiterhin gibt) — eine laufende
  Partie rechnet im Moment des Umstiegs deshalb genau wie vorher.
- **Ein Zug, der über alles hinweg setzt, hat KEINEN WEG** (seit v0.98, Wunsch
  #35). Der Teleport trägt dafür `ohneWeg` am Zug-Eintrag, und `wegFelder` wie
  `betreteneFelder` nehmen die Angabe als wahlfreien letzten Parameter. Vorher
  wurde er an der krummen Strecke ERKANNT — ein Teleport zwei Felder geradeaus
  fiel deshalb durch: Das Brett zeichnete eine Linie durch das Feld dazwischen,
  und die Figur sammelte dort eine Lootbox ein. **Wer eine weitere Bewegung
  ohne Weg baut, setzt die Angabe, statt sie aus der Geometrie zu raten.**
- **Ein Kreuz-Brett hat vier tote Ecken, und die stehen im STAND**
  (`kreuz: true` an der Spielart, gesetzt von `SCHACH_RUNDE.kreuzAufstellen`).
  Sie sind gewöhnliche **Risse** — damit muss keine einzige Regel etwas von
  „Kreuz" wissen, `SCHACH.gesperrt` beantwortet es wie immer. **Alle vier
  Seiten tragen eine volle Armee** (seit v0.65); die Teams stehen sich
  gegenüber (oben+unten gegen links+rechts), und welches Paar welche Farbe
  bekommt, wird aus der Partie-Kennung gerechnet. Zwei Armeen je Team heissen
  **zwei Könige und damit zwei Leben** (`koenigeAlsLeben`).
- **Mit `kreuzEinzeln` hat ein Kreuz nur EINE Armee je Team** (seit v0.72,
  K3 — die drei Spielarten „…-Duell"). Dann wird nicht das Paar gezogen,
  sondern die eine Startseite von Weiss; Schwarz bekommt die gegenüberliegende,
  die zwei übrigen Streifen bleiben leer. Ein König je Team heisst: **kein**
  `koenigeAlsLeben` — Schach und Matt gelten von Anfang an.
- **Die ANSICHT dreht sich in vier Lagen, der STAND nie** (seit v0.72, K4).
  `TEAM_SCHACH._drehungVon` liefert 0 bis 3 (Vierteldrehungen im
  Uhrzeigersinn) aus der Startseite der eigenen Armee; `_feldZuAnzeige` ist die
  EINZIGE Stelle, die daraus eine Feldnummer macht — Brett, Randbeschriftung
  und die gleitende Bewegung (`_wegZuAnzeige`) fragen sie. Gedreht wird einmal
  zu Beginn, nichts davon wird gespeichert: Jeder sieht sein eigenes Brett.
  **Woher die Startseite kommt, steht im STAND** (`startSeiten`, gesetzt beim
  Aufstellen) — nicht aus den Bauern abgelesen, sonst drehte sich die Ansicht,
  sobald der letzte Bauer fällt. Gefragt wird `SCHACH.startSeitenVon`.
- **Eine Spielart wird nie gelöscht, nur versteckt** (`versteckt: true`).
  Laufende Partien tragen ihre Kennung im Stand und verlören sonst ihre
  Spielart. `zurAuswahl()` filtert fürs Anlegen, `holen()` findet weiterhin
  alles.
  **Für FÄHIGKEITEN gilt seit v0.78 dasselbe** (erster Fall: Ausweichen).
  `versteckt: true` am Eintrag, gefiltert wird an EINER Stelle —
  `faehigkeitenDerStufe`. Damit fällt sie zugleich aus der Ziehung, aus
  `chanceVon`, aus den Erklärtexten und aus der Bibliothek; alle vier fragen
  dasselbe („was kann man bekommen"). `FAEHIGKEITEN` bleibt daneben
  vollständig, und das ist der Punkt: `normalisieren` wirft jede Fähigkeit aus
  dem Vorrat, die es dort NICHT mehr gibt — wer eine versteckte hat, darf sie
  aufbrauchen. Wer eine löschen will, muss diesen Verlust ausdrücklich wollen
  (so beim Erdbeben v0.54). **Eine neue kommt ans ENDE von `SCHACH_VARIANTEN.liste`** — die
  Partie-Kennungen der Tests entstehen aus der Reihenfolge, und die gerechneten
  Würfel hängen an der Kennung. Ein Eintrag in der Mitte lässt Tests scheitern,
  die mit der neuen Spielart nichts zu tun haben.
- **„Zählt der König als gewöhnliche Figur?" ist eine Frage JE FARBE**
  (`SCHACH.koenigSchlagbarFuer`, seit v0.49). Zwei Wege führen dorthin:
  `koenigSchlagbar` ist eine Eigenschaft des BRETTS und gilt immer;
  `koenigeAlsLeben` eine der STELLUNG — solange eine Seite mehr als einen
  König hat, sind ihre Könige schlagbar, beim letzten kippt es zurück
  („zwei Leben"). Wer irgendwo `variante.koenigSchlagbar` direkt abfragt,
  übersieht den zweiten Fall. **Seit v0.60 benutzt KEINE Spielart mehr
  `koenigSchlagbar`** — auch das Doppelbrett rechnet mit `koenigeAlsLeben`
  (Wunsch #17: der erste König fällt normal, beim letzten gelten wieder Schach
  und Matt). Der Schalter bleibt trotzdem: Er ist die einzige Möglichkeit, ein
  Brett ganz ohne Schachbegriff zu bauen.
- **DIE STÄRKE DER ZUFALLSARMEE VERBREITERT DEN STARTFELD-BLOCK, sie
  multipliziert keine Zahl** (seit v0.99). `SCHACH_VARIANTEN.armeeSpalten`
  nimmt die Stärke entgegen und liefert daraus Spalten UND Rand;
  `armeeAnzahl`, `_armeeFelder` und `_armeeFelderKreuz` rechnen alle daraus.
  **Bis v0.98 taten sie das nicht:** `armeeAnzahl` multiplizierte den Anteil,
  die Feldzahl blieb fest — alles über „normal" wurde beim Aufstellen
  abgeschnitten, und „viel" wie „voll" stellten auf JEDEM Brett dieselbe Armee
  auf wie „normal". Zwei von vier Knöpfen taten nichts.
  **Die Regel dahinter:** Wer eine Einstellung baut, die eine ZAHL verspricht,
  prüft, ob das Brett sie halten kann — und rechnet beide aus derselben
  Funktion. Zwei Rechnungen für dieselbe Sache laufen auseinander; hier taten
  sie es ab dem ersten Knopfdruck. Zwei Tests halten es fest: Jede Stufe stellt
  mehr auf als die darunter, und die angekündigte Zahl gleicht der Zahl der
  Startfelder.
- **Die Zufallsarmee ist ein HAKEN der Partie** (`regeln.zufallsArmee`, seit
  v0.51 — vorher eine eigene Spielart). Das echte Brett baut
  `SCHACH_RUNDE._armeeStand` aus der Partie-Kennung — gerechnet, nicht
  gewürfelt, und danach steht es als gewöhnliches Brett im Stand; nachgerechnet
  wird es nie wieder. Wie viele Figuren, leitet `SCHACH_VARIANTEN.armeeAnzahl`
  aus der `aufstellung` ab (die Hälfte) — **keine Spielart nennt eine Zahl**.
  Aufgerufen wird immer `armeeAufstellen`, und die Funktion darf **nicht**
  `armeeAn` fragen: Das normalisiert, und `normalisieren` baut sich eine leere
  Runde — Endlosschleife.
- **Auf dem Kreuz steht die Zufallsarmee JE STARTSEITE** (seit v0.76,
  `_armeeStandKreuz`). `_armeeStand` kannte bis dahin nur oben und unten und
  liess die Flügel leer. Drei Dinge gehören zwingend dazu: die Startseiten
  kommen aus dem Stand (`SCHACH.startSeitenVon`, nie aus den Figuren
  abgelesen), die Risse der toten Ecken bleiben unangetastet, und
  **`bauernSeiten` wird NEU gebaut** — die Einträge der Vorlage zeigen nach dem
  Würfeln auf Felder, auf denen kein Bauer mehr steht. Die Menge rechnet
  `armeeSpalten` aus der **Mitte** des Kreuzes, nicht aus der Brettbreite:
  `armeeAnzahl` ist damit die Zahl je Startseite (kleines Kreuz 4), ein Team
  mit zwei Streifen bekommt doppelt so viele.
- **Nichts erscheint auf einem gesperrten Feld** (seit v0.76). Lootboxen fragen
  in `_bonusNachziehen` `SCHACH.gesperrt` mit — auf einem Riss wäre die Box für
  immer unerreichbar, unter einer Mauer unsichtbar. **Und Risse zählen auch
  nicht als Brett:** Der Massstab „wie leer ist es gerade" lässt sie aus, sonst
  regnete es auf dem Kreuz weniger als auf einem gleich grossen Quadrat.
- **`SCHACH._ausfuehren` baut den neuen Stand als LITERAL, nicht als Kopie**
  (Merkposten seit v0.98). Jedes Feld, das dort nicht ausdrücklich steht, ist
  nach dem Zug weg — und kein Normalisieren holt es zurück. Genau so verlor das
  Enttarnen seine Wirkung (Meldung #36) und `startSeiten` seine Zusage, für die
  ganze Partie zu gelten. Wer ein Feld im Stand ergänzt, trägt es DORT ein; ein
  Test in `tests\test-schach.js` vergleicht die Schlüssel vorher und nachher
  und fängt das Vergessen ab, ohne je gepflegt werden zu müssen
  (`erkenntnisse.md`, „Ein Stand, der als Literal gebaut wird").
- **Was `schach.js` wissen muss, steht im STAND, nicht in `regeln`.** Die
  Regeln der Partie gehören `SCHACH_RUNDE`; das Regelwerk sieht nur den Stand.
  Deshalb wandert `koenigeAlsLeben` beim Aufstellen in den Stand (v0.51). Wer
  einen Haken erfindet, den eine Regel braucht, macht es genauso.
- **Die Brettgröße kann sich mitten in der Partie ändern** — größer
  („Ausdehnung") wie kleiner („Einsturz", seit v0.54).
  **SEIT v0.84 SIND BEIDE AUS DEM SPIEL GENOMMEN** (`versteckt: true`,
  Nutzer-Ansage „führt zu riesigen Bugs, erst überarbeiten") — die Regeln
  darunter bleiben trotzdem gültig und sind beim Zurückholen zu erfüllen; was
  die Überarbeitung angehen muss, steht in `entscheidungen\entschieden-ab-v0-41.md`.
  Wer Feldnummern
  speichert, rechnet sie mit um, und zwar **alle**:
  `SCHACH._feldnummernUmrechnen` bedient Rochade, Schild, Fessel, Frost,
  Mauern, geliehene Figuren und Risse an EINER Stelle. Die Würfel liegen in der
  RUNDE, nicht im Stand — `_pechAusloesen` rechnet sie über `wirkung.umrechnen`
  nach. Bis v0.53 fehlten Mauern, Leihgaben und Würfel; sie lagen nach einer
  Ausdehnung woanders.
  **Die Grösse zurückzugeben reicht nicht — die FORM muss mit** (seit v0.77.1).
  Ausdehnung und Schrumpfung sind ein Paar, und Hin-und-Zurück muss wieder
  dasselbe Brett ergeben. Bis v0.77.0 tat es das nur für die Masse: Die
  Schrumpfung warf die Risse der wegfallenden Linie weg (richtig), die
  Ausdehnung baute die neue Linie vollständig frei an (auf einem Kreuz falsch)
  — und so frass sich die Kreuzform über eine lange Partie von den Rändern her
  auf. `SCHACH._eckenFortsetzen` setzt jetzt die Ecken der angrenzenden
  Randlinie fort: nur Löcher, nie Figuren, und nur die zusammenhängenden Läufe
  von den ENDEN her (ein Loch mittendrin ist ein Erdbeben und gehört dem
  Spielverlauf). **Wer einen weiteren Eingriff auf die Brettgrösse baut, prüft
  ihn gegen sein Gegenstück, nicht allein.**
- **Ein gesperrtes Feld hat zwei Ursachen** (seit v0.54): eine **Mauer**
  (läuft ab) oder ein **Riss** (bleibt die ganze Partie, Unglückswürfel
  „Erdbeben"). Die Regeln fragen immer `SCHACH.gesperrt`, nie `mauerAuf` —
  letzteres beantwortet nur, wie der Bildschirm es zeichnen soll. **Wer eine
  Figur bewegt, fragt `gesperrt` mit** (seit v0.60): Das Nudelholz tat es bis
  v0.59 nicht und schob Figuren in Mauern und Löcher hinein.
  **Der ERDRUTSCH tat es bis v0.81 auch nicht** — beim Aufräumen 2026 wurden
  Bauernschub, Nudelholz, Erdbeben und Schubs erfasst, er nicht, weil er als
  Unglückswürfel an anderer Stelle steht. Es sind **fünf** Funktionen, die
  schieben oder setzen; wer eine sechste baut, trägt sie hier ein
  (`erkenntnisse.md`, „Die eine Funktion, die man beim Aufräumen vergisst"). Und **ein Würfel
  auf einem RISS fällt hinein** (`_pechAusloesen` räumt ihn weg) — unter einer
  Mauer bleibt er liegen, die läuft ja ab.
- **Ein Zug kann unterwegs enden** (seit v0.58, `_zugAmRissAbbrechen`). Wer
  einen Erdbeben-Würfel im Vorbeiziehen mitnimmt, reisst die Löcher in seinen
  eigenen Weg; liegt eines davon noch VOR ihm, endet der Zug auf dem letzten
  freien Feld davor. Drei Dinge gehören zwingend dazu:
  **(1)** Eine Sperre zählt erst AB dem Feld des Würfels — was hinter der
  Figur aufreisst, hat sie schon passiert. **(2)** Der Schlag fällt mit aus:
  Wer sein Ziel nicht erreicht, schlägt dort nichts, also kommt die
  geschlagene Figur zurück und aus `verloren`/`gefallen` heraus. **(3)** Der
  Verlaufseintrag des Zuges wird nachgeführt (`nach`, `wege`), sonst wandert
  die Figur am Bildschirm auf ein Feld, auf dem sie nicht steht. Und:
  `SCHACH.zuege` bleibt unangetastet — als der Zug gewählt wurde, war der Weg
  frei.
- **Frost und Fessel sind seit v0.56 zwei verschiedene Dinge.** Frost sperrt
  eine FLÄCHE (2×2) für EINEN Zug und macht unantastbar; er trifft **jeden** im
  Block, auch die eigenen Figuren. Die Fessel hält EINE gegnerische Figur über
  MEHRERE Züge fest (`fesselBis` am Takt) und lässt sie schlagbar. Gefragt wird
  `SCHACH.eingefroren` und `SCHACH.gefesselt`, nie das Feld direkt. Und: **ein
  leeres Feld im Frost-Block sperrt nichts** — dafür gibt es die Mauer.
  **Seit v0.80 ist der Frost eine MAUER UM DEN BLOCK, kein Anker** (und er gilt
  auch für Könige, siehe die eiserne Regel weiter unten): Wer drinsteht, zieht
  weiter — aber nur auf Felder INNERHALB des Blocks. Die Fessel bleibt das
  Gegenstück: Sie nagelt wirklich fest und lässt Könige aus.
- **Ein zweiter König ist immer „zwei Leben", nie ein zweiter Klotz.** Wer
  einen König entstehen lässt (seit v0.56 die Verstärkung), setzt
  `koenigeAlsLeben` im Stand — sonst wäre Schachmatt nicht mehr eindeutig.
  Dazu zwei Sperren, die bleiben müssen: Der LETZTE König lässt sich nicht
  eintauschen, und ohne freies Nachbarfeld für die zweite Dame wird das
  Einsetzen abgewiesen.
- **Vorzüge gibt es nicht mehr** (v2.5 gebaut, v2.8 ausgebaut — Begründung in
  `entscheidungen/entschieden.md`). Sollte jemand sie erneut bauen: Ein
  Vorzug darf NIE in den
  gemeinsamen Stand, sonst liest der Gegner ihn mit. Ein Team-*Vorschlag*
  (`regeln.einigkeit`) steht dagegen absichtlich drin.
- **Ein Ergebnis wird festgeschrieben, nicht nachgerechnet.** `tafel.chronik`
  bekommt beim Beenden einen Eintrag; die Rangliste rechnet nur daraus. Deshalb
  darf `partieEntfernen` die Chronik NIE anfassen — sonst verlieren alle
  Beteiligten rückwirkend ihre Punkte.
- **Bonusfelder werden als EINGESAMMELTE gespeichert** (`bonusGesammelt`), nie
  als verbliebene: Firebase wirft leere Listen weg, und „alle eingesammelt" käme
  sonst als „noch keins" zurück. Seit v2.0 steht daneben `bonus` (was gerade
  liegt) mit `bonusFassung`; fehlt die Fassung, stammt die Partie aus der Zeit
  der vier festen Felder und wird daraus aufgebaut.

## Fähigkeiten, Lootboxen und Beispiele

- **Was sich unterscheidet, gehört an den ANFANG der Saat** (seit v0.49.1).
  `_zufallsWert` ist FNV-1a: Ein Unterschied im LETZTEN Zeichen erlebt nur noch
  eine Multiplikation und verschiebt das Ergebnis um rund 0,4 Prozent. Wer über
  etwas zählt, schreibt die Zahl nach vorne — `feld + "|glas|" + id`, nicht
  `id + "|glas|" + feld`. Zweimal ist genau das schiefgegangen: Ganze
  Feldblöcke trugen unter dem vollen Glas dasselbe Trugbild, und die
  Zufallsarmee stellte siebenmal fast dieselbe Figur auf. Die Funktion ist in
  Ordnung; die Saat war es nicht.
- **König und Matt bleiben unangetastet — von FÄHIGKEITEN.** Schild wirkt nicht
  auf den König, der König wird nicht gefesselt, Erdbeben lässt Könige stehen,
  und **kein Zug darf einen König schlagen** (`zuege()` filtert das) — sonst
  verschwände er beim Doppelzug vom Brett, statt dass die Partie durch Matt
  endet. Wer eine neue Fähigkeit baut, beantwortet zuerst: Was macht sie mit
  Schachmatt?
  **Für UNGLÜCKS-Lootboxen gilt das seit v0.73 nicht mehr** (Meldung I9,
  Nutzer-Entscheidung 09.08.: „weil es eine Unglücksbox ist — diese können zum
  Schachmatt führen"). Wer vom Stolperstein so zurückgeworfen wird, dass der
  eigene König danach im Schach steht, hat die Partie verloren; geprüft wird in
  `SCHACH_RUNDE.ziehen` NACH dem Rückwurf, nicht über `lage()` — die kennt nur
  Matt und Patt. Der Unterschied ist der Kern: Eine Fähigkeit wählt man, ein
  Unglück trifft einen.
  **ZWISCHEN v0.80 UND v0.94 DURFTE DER FROST MATTSETZEN** (Nutzer-Ansage
  18.08.). **Seit v0.95 nicht mehr** — und keine andere Fähigkeit auch:

  > **KEIN ITEM FÜHRT DIREKT ZU SCHACH, MATT ODER PATT** (Nutzer-Entscheidung
  > 20.08.2026: „items sollen nie direkt zu schach oder matt führen … da mauer
  > und so soll durch cleveres platzieren schon große bis massive auswirkungen
  > haben, also soll denken belohnt werden").

  Gemeint ist DIREKT gegen INDIREKT: Ein Item bereitet die Stellung vor, den
  Angriff führt der ZUG. Wer mit der Mauer clever sperrt, gewinnt weiterhin —
  nur einen Halbzug später und aus eigener Hand. Geprüft wird in
  **`SCHACH_RUNDE._wirkungVerboten`**, und `zielFelder` fragt dieselbe
  Funktion: Was zu Schach, Matt oder Patt führen würde, wird am Brett gar nicht
  erst markiert und beim Einsetzen abgewiesen; die Fähigkeit bleibt im Vorrat.
  Verboten sind drei Fälle — eigener König im Schach (seit v3.6), gegnerischer
  König im Schach (neu), und die Seite, die als Nächste zieht, hat keinen Zug
  (neu, das deckt Matt und Patt ab und trifft beide Seiten).
  **Die Ausnahme bleibt das Unglück:** Sammelt eine Fähigkeit dabei eine
  Lootbox ein und darin steckt ein Unglück, darf DAS weiterhin die Partie
  beenden (Entscheidung 09.08.). Deshalb steht die Abweisung in
  `faehigkeitEinsetzen` VOR dem Einsammeln und die Ende-Prüfung dahinter.
  **Sprung, Teleport und Doppelzug brauchen keine Ausnahme:** Sie rühren das
  Brett nicht an, sondern setzen nur ein Muster oder ein Zugrecht — was danach
  passiert, ist ein Zug und darf alles. **Erkannt wird das an der
  Brett-Zeichenkette, nicht am Namen:** Wer keine Figur versetzt, kann kein
  Schach geben. Das ist wichtiger, als es aussieht — `imSchach` rechnet ein
  aktives Zusatzmuster MIT, ein laufender Sprung sähe sonst wie ein frisches
  Schach aus und wäre in jeder zweiten Stellung verboten
  (`erkenntnisse.md`, „Ein aktives Zugmuster sieht aus wie ein frisches Schach").
  **Eine Feinheit aus der Frost-Zeit gilt weiter:** `imSchach` rechnet über
  `_feldBedroht` rein geometrisch und fragt den Frost nicht. Sonst wäre ein
  eingefrorener König durch „eingefroren heisst unantastbar" unangreifbar. Wer
  an einer der beiden Stellen etwas ändert, prüft die andere mit.
- **Die Rochade wird aus der Stellung gelesen**, nicht aus festen Plätzen:
  `rochadeFelder` (Türme) und `rochadeKoenige` (Könige) tragen die Rechte,
  `rochade` (KDkd) läuft als Altbestand mit. Je Richtung zählt der
  nächstgelegene Turm — sonst gehört der mittlere Turm des Doppelbretts beiden
  Königen.
- **Eine neue Fähigkeit nennt eine der vier Arten** (`zugmuster`, `ablauf`,
  `sofort`, `ziel`) — dann ist am Bildschirm nichts anzupassen. Dazu drei
  Schalter: `beendetZug` (danach ist der Gegner dran), `istDerZug` (man bleibt
  am Zug, darf aber NUR noch nach dem Muster ziehen — die Fähigkeit ist der
  Zug) und `imGegenzug` (geht auch während des gegnerischen Zuges).
- **Was eine Fähigkeit KOSTET, folgt einer Regel** (seit v0.47): Wer Material
  oder einen Angriff geschenkt bekommt, gibt den Zug ab (`beendetZug`); wer nur
  die Stellung verändert, behält ihn. Wird eine Fähigkeit zu stark, nimmt man
  ihr das Pluszeichen — **die Stufe bleibt, wo sie ist** (sie sagt nur, wie oft
  etwas kommt). Ein Test in `test-schach-runde.js` hält die Einteilung fest.
  Der **Bauernschub** ist seit v0.56 der Beleg für den zweiten Satz: Er ändert
  nur die Stellung, verschiebt dabei aber acht Figuren — er hat das Plus
  verloren, nicht die Stufe gewechselt.
- **Die Zeichen am Vorrat gehören der FÄHIGKEIT, nicht dem Spielstand** (seit
  v0.48). Pluszeichen (`!beendetZug && !istDerZug`) und Blitz (`imGegenzug`)
  stehen immer und überall — auch bei den Fähigkeiten des Gegners, auch während
  der Gegner am Zug ist. Von v0.41 bis v0.47 fragte das Pluszeichen
  `SCHACH_RUNDE.behaeltZug` und flackerte deshalb; als Merkmal, an dem man eine
  Fähigkeit wiedererkennt, war es damit unbrauchbar. `behaeltZug` gibt es
  weiterhin, aber nur noch für den SATZ im Einsetzen-Dialog („dein normaler Zug
  bleibt dir"). Und: **jede Marke ist ein Knopf** — wer nicht einsetzen darf,
  bekommt beim Antippen Beschreibung und Anleitung.
- **Eine Fähigkeit, die den Zug an sich zieht, kann scheitern.** `istDerZug`
  nimmt der Seite ihre gewohnte Gangart; bleibt dabei kein einziger Zug übrig,
  stünde die Partie (und `alleZuege` läse es als Matt). `faehigkeitEinsetzen`
  weist das Einsetzen deshalb ab, statt den Fall entstehen zu lassen.
- **Eine Fähigkeit mit Zielfeld wird erst platziert, dann eingesetzt** (seit
  v0.57). Der Tipp setzt den Vorschau-Kasten (`TEAM_SCHACH.zielVorschau`,
  `zielUmriss`), ausgeführt wird über „Einsetzen". Den Umriss liefert
  `SCHACH_RUNDE.zielUmriss` aus `_zielWirkung` — nie eine zweite Liste, sonst
  zeigt der Kasten etwas anderes als das, was passiert.
- **Jedes aktive Item lässt sich abbrechen, und dann kommt es zurück** (seit
  v0.76). Bei `ziel`-Fähigkeiten ist noch gar nichts eingesetzt — dort räumt
  `zielVerwerfen` nur den Bildschirm auf. Bei `istDerZug` (Sprung, Teleport)
  ist die Fähigkeit schon verbraucht und ihr Muster steht im gemeinsamen Stand;
  zurückgenommen wird deshalb im Modell (`SCHACH_RUNDE.zugmusterZuruecknehmen`)
  und über denselben Schreibweg wie ein Zug. Welche Fähigkeit gerade läuft,
  beantwortet `laufendesZugmuster` aus der Tabelle — der Bildschirm liest nie
  selbst ein Muster. Kein Halbzug wird dabei verbraucht, also erscheint auch
  keine Lootbox.
- **Eine Leihgabe zählt ab dem Zeitpunkt, zu dem man wieder am Zug ist.**
  `SCHACH.LEIHDAUER` nennt die Halbzüge je Figurenart, `LEIHGABE_VORLAUF`
  addiert die zwei, die der abgegebene Zug und die Antwort des Gegners kosten.
  Ohne den Vorlauf zerfällt eine geliehene Dame, bevor sie ein einziges Mal
  ziehen kann. Wer eine Leihgabe baut, die den Zug NICHT abgibt, braucht dort
  keinen Vorlauf.
- **Jede Fähigkeit braucht ein Beispiel in `schach-vorschau.js`** — daraus
  entsteht der abgespielte Ablauf (Ausgangsstellung, Griff an den Vorrat,
  Handgriff am Brett, Wirkung) im Einsetzen-Dialog und in der Bibliothek. Die
  Bilder werden mit den echten Regeln GERECHNET, nie gezeichnet;
  `tests\test-schach-vorschau.js` prüft für jede Fähigkeit, dass ihr Beispiel
  aufgeht.
- **Eine Ausgangsstellung erklärt, WOZU die Fähigkeit gut ist** (seit v0.50):
  ein Angreifer, eine Sperre, eine Lücke. Ein Brett mit nur zwei Königen und
  der einen Figur zeigt das Was, aber nicht das Warum. Und: Ein Test darf kein
  Feld der Stellung als feste Zahl kennen, sonst blockiert er jede neue Szene;
  er fragt das Beispiel.
- **Ein Beispielbrett braucht KEINE Könige** (seit v0.58 steht auch keiner mehr
  darin). In v0.50 stand hier das Gegenteil, mit der Begründung, `SCHACH.zuege`
  prüfe für jeden Zug den eigenen König. Am 08.08. nachgemessen: Eine Stellung
  ganz ohne Könige läuft durch alle Bilder, Züge und Marken — `imSchach`
  liefert ohne König schlicht `false`. Könige gehören nur dort ins Bild, wo
  Schach zur Sache gehört.
- **Auf jedem Beispielbrett braucht JEDE Seite eine ziehfähige Figur.** Die
  Bilder werden mit den echten Regeln gerechnet, also gelten auch die echten
  Abbruchbedingungen: Wer die letzte Figur einer Seite schlagen lässt, beendet
  die Partie durch Patt, und danach liefert `bilder()` gar nichts mehr. Ein
  Test in `tests\test-schach-vorschau.js` hält es fest.
- **Die Zahl der Schritte einer Anleitung steht NICHT fest** (seit v0.58).
  Vorne kann ein Bild dazukommen (`todeszug`), hinten auch (`nachspiel`). Wer
  einen bestimmten Schritt braucht, sucht ihn (etwa über `tipp >= 0`), statt
  über einen festen Index zuzugreifen.
- **Was eine Szene gestreut bekommt, hängt an der Partie-Kennung.** Eine
  Beispielstellung, die eine bestimmte Wirkung zeigen soll (Ausdehnung nach
  oben, Risse in der richtigen Spalte), setzt dafür `saat` — ihre eigene
  Kennung. Nie die Regel anfassen, damit ein Bild passt.
- **Die Fähigkeiten-Bibliothek wird nur EINMAL gezeichnet**
  (`TEAM_SCHACH.infoGezeichnet`) — sie hängt an keinem Spielstand. Sonst
  klappte bei jeder Abfrage jeder Eintrag wieder zu. Wer dort etwas ändert,
  denkt an die laufenden Takte der Anleitungen (`_anleitungTakteBeenden`).
- **Alle Bedingungen fürs Einsetzen stehen in `SCHACH_RUNDE._wirkungVerboten`**
  (seit v0.95; der Kern davon, der eigene König, seit v3.6 als
  `_koenigVerbietet`) — **und `zielFelder` fragt dieselbe Funktion**. Bis v0.93
  kannte nur `faehigkeitEinsetzen` sie; das Brett markierte deshalb Felder, die
  es hinterher ablehnte (`erkenntnisse.md`, „Zwei Wege zum Partieende"). Wer
  eine Bedingung ergänzt, ergänzt sie in dieser einen Funktion — nie am Ende
  von `faehigkeitEinsetzen`, sonst weiss die Anzeige nichts davon.
- **Die Partie kann während einer Fähigkeit trotzdem enden** — aber nur durch
  ein Unglück, das sie dabei einsammelt. `faehigkeitEinsetzen` fragt am Ende
  dieselbe `SCHACH.lage` wie `ziehen` und setzt Ergebnis und `laeuft`. Bis
  v0.93 fehlte diese Zeile ganz, und eine mattsetzende Wirkung hielt die Partie
  an, statt sie zu beenden.
- **Was am Brett nicht zu sehen ist, prüft `darfEinsetzen` vorher — aber nicht
  um jeden Preis.** Drei Fähigkeiten hängen an gefallenen Figuren
  (`_gefalleneVorhanden`, seit v0.59), eine am eigenen Material
  (`_etwasZuHolen`: der Händler). Ist dort nichts, bleibt die Marke grau und
  nennt beim Antippen den Grund.
  **DER DIEB GEHÖRT SEIT v0.99 NICHT MEHR DAZU** (Nutzer-Entscheidung 20.08.:
  „Dieb und die neuen Items sollen so wie alle anderen auch eingesammelt werden
  und dann, wann man will, genutzt werden"). Von v0.94 bis v0.98 wurde seine
  Marke grau, sobald der Gegner nichts im Vorrat hatte — im Spieltest sparte
  das 861 Griffe ins Leere, am Tisch fühlte es sich an wie ein kaputtes Item.
  **Die Lehre gilt allgemein:** Eine Sperre, die einen Griff ins Leere spart,
  kostet den Eindruck, das Item gehöre einem. Wo die Fähigkeit dabei nicht
  verbraucht wird — und beim Dieb wird sie es nicht, `diebstahlAnbieten` sagt
  ab und lässt sie liegen —, ist die Auskunft im Fenster die bessere Antwort
  als die graue Marke.
- **Zwei Fragen an einen Weg, zwei Funktionen.** `SCHACH.wegFelder` sagt, welche
  Felder man ZEICHNET (beim Springer das L), `SCHACH.betreteneFelder`, welche
  die Figur wirklich BETRITT (beim Springer nur das Ziel). An der zweiten hängt,
  was unterwegs eingesammelt wird. Beide stehen im Regelwerk, damit Anzeige und
  Regel nicht auseinanderlaufen.
- **Was in einem Würfel steckt, entscheidet sich beim EINSAMMELN**, nicht beim
  Erscheinen — nur so kann der Vorrat des Sammlers Wiederholungen dämpfen. Beim
  Erscheinen steht nur die Stufe fest.

## Anzeige und Bedienung

- **Der Figurenzähler kommt aus der STELLUNG, nicht aus den Verlustlisten**
  (`SCHACH_RUNDE.materialWert` / `materialVorsprung`, seit v0.76). Hier
  entsteht und verschwindet Material, ohne dass jemand schlägt (Umwandlung,
  Wiedergeburt, Verstärkung, Nachschub, Einsturz) — Beute minus Verluste ist
  deshalb die falsche Rechnung. `bilanz.punkte` bleibt daneben bestehen: Daran
  hängt die Beute-Wertung der Rangliste, und die ist festgeschrieben.
- **Der Abschluss-Bildschirm drängt sich nie in eine laufende Partie.** Sonst
  verdrängt eine alte, nie weggeklickte Partie alle drei Sekunden das Brett.
- **Ein Verlaufseintrag trägt `von`/`nach` nur, wenn er WIRKLICH eine Bewegung
  beschreibt** (seit v0.76) — sonst `-1`. Daran hängen Zugspur und die
  gleitende Bewegung: Der Unglücks-Eintrag trug bis v0.75 das Feld der Lootbox
  als Ziel, und beide zeichneten einen Weg, den nie jemand gegangen ist. Was
  eine Wirkung bewegt hat, steht ausschliesslich in `wege`. **Und ein Halbzug
  besteht aus MEHREREN Einträgen** (Zug, Einsammeln, Unglück, neue Lootboxen);
  wo zwei davon sehenswert sind, werden auch beide gezeichnet — `_letzteSpur`
  zeigt den Zug grün und das Unglück gelb, je Feld statt als ein Schalter für
  alles (`erkenntnisse.md`, „Ein Eintrag, der sich als Bewegung ausgab").
- **Zustand im Bildschirm, der sich auf den Spielstand bezieht, trägt den
  Zugzähler dazu** (`auswahlZaehler`, `animiertBis`, `wirkungBis`). Ohne ihn
  überlebt er die nächste Änderung: Die Zielpunkte blieben so nach einem Zug auf
  dem Brett stehen, obwohl man gar nicht mehr am Zug war.
- **Ebenen kommen aus der Stildatei, nie aus dem Bauteil** (seit v0.94). Die
  vier Stufen stehen als Variablen ganz oben in `css\stil.css`:
  `--ebene-feldmarke` (1 bis 5, alles IM Brettfeld), `--ebene-leiste` (10,
  klebende Leisten), `--ebene-schwebend` (50) und `--ebene-dialog` (100). Wer
  sich eine Zahl selbst ausdenkt, baut den Fehler von v0.94 nach: Eine
  Schachfigur lag über dem Knopf „Abbrechen", weil die klebende Knopfleiste
  keine Nummer hatte. **Ein Hintergrund verdeckt nur, was VOR ihm gezeichnet
  wird** — Elemente mit positiver Nummer kommen danach.
- **Jede Markierung auf dem Brett ist zweifarbig** — heller Rand, dunkler Kern.
  Das Brett hat helle UND dunkle Felder; eine einzelne Farbe verschwindet immer
  auf einer der beiden. Genau so ging in v1.5 die Zugvorhersage verloren (blauer
  Punkt auf blauem Feld). Gilt für Zielfelder, Schlagfelder und die Pfeile der
  Bildanleitung.
- **Ein Zug wird immer gleich bedient:** Figur antippen, Zugpunkt antippen —
  auch die Rochade (König antippen, Zugpunkt antippen). Der zweite Weg über das
  Turmfeld ist in v0.44 auf Nutzer-Entscheidung ausgebaut worden; wer ihn
  wiederhaben will, liest vorher `entscheidungen\entschieden.md`.
- **Warum eine Regel nicht greift, erklärt das Regelwerk** — nicht der
  Bildschirm. `SCHACH.rochadeLage` liefert den Grund, `team-schach.js` zeigt ihn
  nur an. Sonst stünden die Bedingungen zweimal im Programm.
- **Die Box im Team Schach heisst für den Nutzer „Lootbox"** (seit v0.68,
  Wunsch #25) — im Singular weiblich: *die* Lootbox. Wer einen sichtbaren Text
  schreibt, benutzt dieses Wort; die schlechten heissen **Unglücks-Lootbox**,
  der Haken **Lootbox-Regen**. **Die Bezeichner im Code bleiben, wie sie sind**
  (`bonus`, `wuerfel`, `_wuerfelBauen`, `.wuerfel`, `pechZeigen`): Sie stecken
  in jeder laufenden Partie und in den Firebase-Daten, und ein Umbenennen wäre
  ein Bruch des additiven Datenvertrags ohne jeden Gewinn. **Im Würfel Quizz
  bleiben Würfel Würfel** — das sind welche.
