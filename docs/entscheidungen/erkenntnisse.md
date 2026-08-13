# Quizz - Entscheidungen / Teuer erkaufte Erkenntnisse

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

### Die Zielpunkte blieben nach dem Zug stehen (v4.0)

Belegt durch ein Bildschirmfoto: ein Brett voller Zielpunkte und roter
Schlagringe — und darunter der Satz „Warte, bis dein Team wieder am Zug ist".

**Die Auswahl lebt im Bildschirm, nicht im Spielstand.** `gewaehltesFeld`,
`moeglicheZiele`, `rochadeZiele` und `zielFelder` sind Felder von
`TEAM_SCHACH`. Der Bildschirm wird bei jeder Änderung vollständig neu gebaut —
aus dem neuen Stand, aber mit dem ALTEN Auswahl-Zustand. Zeichnete das Brett
danach die Marken, gehörten sie zu einer Stellung, die es nicht mehr gab.

Aufgehoben wurde die Auswahl nur an den Stellen, an denen der Bildschirm selbst
etwas tat (`zugAusfuehren`, `partieOeffnen`, ein Tipp daneben). Kam die Änderung
dagegen von aussen — der Gegner zieht, jemand aus dem eigenen Team zieht —,
merkte es niemand. Und `feldAngetippt` steigt oben aus, wenn man nicht ziehen
darf: Die Marken waren also nicht nur falsch, sondern auch tot.

Seit v4.0 trägt die Auswahl den Zugzähler, zu dem sie gehört
(`auswahlZaehler`), und `_auswahlPruefen` wirft sie beim Zeichnen weg, sobald
er nicht mehr passt oder man nicht ziehen darf.

**Die allgemeine Lehre:** Jeder Zustand, der im Bildschirm liegt und sich auf
den Spielstand bezieht, braucht eine Angabe, auf WELCHEN Stand er sich bezieht.
Sonst überlebt er dessen Änderung. Dasselbe Muster steckt schon in
`animiertBis` und `wirkungBis` — dort war es von Anfang an richtig gemacht, hier
fehlte es.

### Die Seite fror ein, bis der Gegner zog (v3.9)

Gemeldet als: „Beim Gegner zeigt es den Zug oft nicht direkt an; wenn er öfter
drückt, wird es rot oder er zeigt dauerhaft die Punkte an, und alles hängt, bis
ich meinen Zug gemacht habe."

Vier Beobachtungen, und sie gehörten zu **zwei** verschiedenen Fehlern.

**Ursache 1: `fetch` hat kein Zeitlimit.**

Das ist die eigentliche Falle, und sie steht so in keiner Anleitung: `fetch`
gibt von sich aus niemals auf. Antwortet der Server nicht — Funkloch, Tunnel,
schlechter Empfang —, bleibt das Versprechen offen, bis der Browser selbst
abbricht. Das dauert je nach Gerät weit über eine Minute.

Die Folgen ketteten sich:

| Was hing | Warum |
|---|---|
| Das Brett nahm keine Tipps an | `TEAM_SCHACH.ziehtGerade` bleibt bis zum `finally` gesetzt |
| Die Abfrage holte nichts nach | Sie wartet auf offene eigene Vorgänge (seit v3.8) |
| Die alte Zugauswahl blieb stehen | vor v3.8: gezeichnet wurde erst nach dem Netz |
| Der Statuspunkt wurde rot | richtig — die Verbindung stand wirklich |

Und die Erlösung „bis ich meinen Zug gemacht habe" erklärt sich von selbst:
Irgendwann brach der Aufruf doch ab oder ging durch, und alles holte auf einen
Schlag nach — was zeitlich mit dem Zug des Gegners zusammenfiel.

Seit v3.9 haben alle Aufrufe ein Zeitlimit (`AbortController`, Laden 8,
Speichern 12 Sekunden). Damit wird aus dem Einfrieren ein normaler Fehler: Er
wird gemeldet, der Zug zurückgenommen, und man kann es sofort erneut versuchen.

**Merksatz: Jeder Netzaufruf braucht ein Zeitlimit.** Ein Aufruf ohne Zeitlimit
ist kein „langsamer Aufruf", sondern ein möglicher Totalausfall der Bedienung.

**Ursache 2: Ein alter Abschluss verdrängte die laufende Partie.**

`TEAM_SCHACH.zeichnen` suchte bei JEDEM Durchgang nach einer beendeten Partie,
deren Abschluss dieses Gerät noch nicht weggeklickt hatte — und zeigte sie
statt allem anderen. Lag so eine Partie herum, kam sie alle drei Sekunden
wieder; wer vorher auf „Punktestand ansehen" gedrückt hatte, sah dauerhaft den
Punktestand. **Das war das „er zeigt dauerhaft die Punkte an".**

Gemerkt wird der Abschluss nämlich erst beim Schliessen (`ICH.abschlussMerken`
in `abschlussSchliessen`). Wer ihn anders verlässt — Tab wechseln, Seite neu
laden —, bekommt ihn beim nächsten Zeichnen erneut.

Die Regel lautet seit v3.9: **Der Abschluss drängt sich nicht in eine andere
laufende Partie.** Er wartet, bis man sie verlässt. Geht die OFFENE Partie
selbst zu Ende, kommt er sofort — das ist der Moment, für den er gebaut wurde
(siehe „Der Gewinner-Bildschirm, den niemand fand").

**Was diese Runde lehrt:** Vier Symptome sahen nach einem Fehler aus und waren
zwei. Hätte man nur das Zeitlimit gebaut, wäre der Punktestand-Hänger geblieben
— und umgekehrt.

### Die Fähigkeit war verbraucht, ihre Wirkung nie da (v0.41)

**Was zu sehen war:** „Ausweichen geht verschwindet und man kann es noch nicht
im Gegnerzug einsetzen." Beides stimmte, und beides war derselbe Fehler.

`SCHACH_RUNDE.faehigkeitEinsetzen` arbeitete richtig: Es setzte
`zusatzMuster = "ausweichen"`, nahm die Fähigkeit aus dem Vorrat und gab die
neue Runde zurück. **Weggeworfen wurde die Wirkung erst beim nächsten Lesen.**
`SCHACH.standNormalisieren` prüft das Muster gegen eine Liste erlaubter Namen,
und in der stand `"koenig"` — der Name aus der Zeit vor v3.6 — aber nicht
`"ausweichen"`, der Name, den `SCHACH_VARIANTEN` seitdem vergibt. Da jeder
Zugriff über `normalisieren` läuft (auch `kopieren`), war das Muster schon vor
dem ersten Zeichnen wieder weg.

**Warum die Tests das nicht gefunden haben:** Sie prüften das Ergebnis von
`faehigkeitEinsetzen` unmittelbar — und da stimmte es. Der Fehler lag auf dem
Weg *danach*: speichern, laden, weiterspielen. Seit v0.41 geht der Test genau
diesen Weg (`JSON.parse(JSON.stringify(...))` und zurück durch
`normalisieren`), und zwar für JEDES Muster, das `_musterzuege` kennt.

**Die Lehre — zweimal dieselbe:**

1. **Eine Prüfliste erlaubter Werte ist eine zweite Wahrheit.** Wer einen Wert
   an einer Stelle vergibt und an einer anderen gegen eine Aufzählung prüft,
   muss beide zusammen ändern. Beim additiven Datenvertrag fällt das nicht auf:
   Ein unbekannter Wert wird stillschweigend verworfen, statt zu krachen. Das
   ist gewollt (alte Stände sollen nicht kaputtgehen) — und genau deshalb muss
   ein Test den Weg durch den Speicher gehen.
2. **Was nicht schlagen kann, bedroht nichts.** Beim Nachlesen fiel auf, dass
   `_feldBedroht` das Ausweich-Muster als Bedrohung mitzählte. Seit v3.5 zieht
   Ausweichen nur auf FREIE Felder; die Prüfung stammte aus der Zeit davor und
   hätte ein Schachmatt erzeugen können, das keines ist. Wer einer Fähigkeit
   etwas wegnimmt, sucht danach jede Stelle, die es noch voraussetzt.

### Der gerechnete Zufall streute nicht (v0.49.1)

**Was zu sehen war:** Nichts — bis jemand nachgemessen hat. Der Nutzer fragte
nur, wie hoch die Chance auf einen zweiten König in der Zufallsarmee ist. Die
Antwort stimmte (12 Prozent), aber beim Nachzählen der übrigen Figuren kam
heraus: Die Dame erschien in 2 Prozent der Ziehungen statt in 12, der Turm in 28
statt in 18. Und ein Blick auf die erzeugten Bretter zeigte, warum:

    p-1:  ..ksss.. / ..ssss..
    p-2:  ..tttt.. / ..tdtk..
    p-3:  ..kkll.. / ..llll..

Jede Seite bekam **siebenmal fast dieselbe Figur**. Die Spielart, deren ganzer
Sinn der Zufall ist, hatte keinen.

**Die Ursache lag in der SAAT, nicht in der Streufunktion.**
`SCHACH_RUNDE._zufallsWert` ist FNV-1a: Jedes Zeichen wird verodert und dann
mit 16777619 multipliziert. Unterscheiden sich zwei Saaten nur im **letzten**
Zeichen, ist der Zustand davor identisch, und der Unterschied erlebt genau eine
Multiplikation. Ein Abstand von 1 im letzten Byte ergibt einen Abstand von
16777619 / 2³² — also **0,4 Prozent**. Die sieben Ziehungen hiessen
`…|figur|1` bis `…|figur|7`:

    p-1: 0.7833  0.7794  0.7755  0.8029  0.7989  0.7950  0.7911

Sieben Zahlen, die alle dasselbe sagen. Mit der Zahl VORNE
(`1|figur|p-1|armee|weiss`) laufen alle übrigen Zeichen als Mischschritte
hinterher, und es sieht aus wie Zufall:

    p-1: 0.4380  0.6372  0.8740  0.9583  0.7508  0.1387  0.4440

**Dieselbe Falle steckte schon zweimal im Bestand**, gefunden beim Absuchen
aller Aufrufe:

- **Volles Glas** (`partie.id + "|glas|" + feld`, seit v0.41): Die Felder 0 bis
  9 trugen alle dasselbe Trugbild, 10 bis 15 ebenfalls. Läufer und Dame kamen
  als Trugbild überhaupt nie vor. Statt einer Täuschung war es ein Muster —
  fiel nie auf, weil niemand nachgezählt hat.
- **Würfelinhalt** (`… + "|inhalt|" + zugZaehler + "|" + feld`): Zwei Würfel,
  im selben Zug auf benachbarten Feldern eingesammelt, lagen 0,004 auseinander
  und ergaben damit fast immer dieselbe Fähigkeit. Selten genug, um unbemerkt
  zu bleiben.

**Die Lehren:**

1. **Was sich unterscheidet, gehört an den Anfang der Saat.** Steht es am Ende,
   mischt es nicht mehr mit. Der Merksatz steht jetzt über `_zufallsWert`, wo
   ihn jeder liest, der die Funktion benutzt.
2. **Gerechneter Zufall braucht einen Test auf die STREUUNG, nicht nur auf die
   Wiederholbarkeit.** Die vorhandenen Tests prüften genau das Richtige — dass
   dieselbe Kennung dasselbe Brett ergibt, und dass acht Figuren aufgestellt
   werden. Beides war die ganze Zeit erfüllt. Dass die acht Figuren fast immer
   dieselbe waren, prüfte niemand. Ein Test misst jetzt den Abstand
   aufeinanderfolgender Ziehungen, ein zweiter die Vielfalt der Armeen.
3. **Eine Schwelle für Zufälliges wird gemessen, nicht geschätzt.** Der erste
   Versuch verbot sechs gleiche Figuren auf einer Seite — und schlug fehl,
   obwohl der Code richtig war: Bei sieben unabhängigen Ziehungen kommt das in
   0,4 Prozent der Fälle vor. Geprüft wird deshalb der Schnitt (4,8 Arten je
   Seite statt 1,4 beim Fehler) und dass Ausreisser selten BLEIBEN.

### Die neue Partie war da — und verschwand wieder (v0.52)

**Was zu sehen war:** „Wenn ich einen Raum erstelle, springe ich nicht direkt
rein — ich bleibe in dem Menü, wo man auf die Größe tippt, und erkenne nicht,
dass eine Partie schon begonnen hat."

Wortgleich zur Meldung von v0.44 — und trotzdem eine andere Ursache. Die von
damals (`partieOeffnen` schloss die Spielart-Auswahl nicht) ist weiterhin
behoben; der Test dazu läuft grün. Es gab eine zweite.

**Die Ursache war ein Rennen mit der regelmässigen Abfrage.** `spielartGewaehlt`
wartet zweimal: auf den Namensdialog und auf das Speichern. Der Abgleich fragt
in dieser Zeit weiter alle paar Sekunden den Server. Landet seine Antwort NACH
dem Schreiben, ersetzt sie `abgleich.daten` durch den Stand vom Server — und der
kennt die eben angelegte Partie noch nicht. Das frisch gesetzte `offeneId` zeigt
dann ins Leere, und der Bildschirm fällt zurück.

Genau dagegen gibt es seit v3.8 `eigenerVorgangBeginnt()`, und die eiserne Regel
sagt es auch: **Wer am Abgleich vorbei schreibt, meldet sich an.** Züge halten
sich daran, der Imposter auch — beim Schach fehlte es an **zwei** Stellen:
`spielartGewaehlt` und `partieLoeschen`. Beim Löschen wäre der Effekt umgekehrt
gewesen: Die Abfrage holt die gelöschte Partie zurück.

**Die Lehren:**

1. **Dieselbe Beschreibung heisst nicht dieselbe Ursache.** Der naheliegende
   Schritt wäre gewesen, den v0.44-Fix zu prüfen und ihn für heil zu erklären —
   er IST heil. Wer dort aufhört, schliesst die Meldung als „geht doch".
2. **Eine Regel, die für einen Schreibweg gilt, gilt für alle.** Beim Suchen
   wurde deshalb nicht die eine Stelle geprüft, sondern jeder Aufruf von
   `speicher.speichern` im Projekt. Zwei von vier waren nicht angemeldet.
3. **Ein Rennen lässt sich schwer nachstellen, eine Anmeldung leicht prüfen.**
   Der Test greift deshalb nicht das Timing an, sondern hält fest, dass beide
   Funktionen sich an- und wieder abmelden.

### Die neue Partie war da — man stand nur davor (v0.44)

**Was zu sehen war:** „Wenn man eine Runde erstellt, nach dem Haken setzen und
dem Antippen der Spielart, kommt die Frage nach dem Namen — und danach soll man
automatisch im Raum landen." Man landete nicht dort: Nach dem Bestätigen standen
wieder die Spielart-Kacheln da.

**Die Ursache war eine Ansicht zu viel.** `spielartGewaehlt` legt die Partie an
und ruft `partieOeffnen` — das setzt `offeneId` und zeichnet neu. `zeichnen`
fragt die Ansichten aber der Reihe nach ab, und die **Spielart-Auswahl steht
davor**: Sie stand noch auf offen, also gewann sie. Die Partie war korrekt
angelegt, gespeichert und geöffnet; sie war nur verdeckt.

**Die Lehre:** Wer eine Ansicht öffnet, schliesst die anderen — an EINER Stelle.
`partieOeffnen` räumt jetzt auch `auswahlOffen` weg, genau wie `IMPOSTER.raumOeffnen`
es seit jeher tut. Beim Vergleich der beiden Spiele fällt so etwas sofort auf:
Dasselbe Muster, eine Zeile weniger.

**Zweite Lehre:** Ein Fehler, der „nichts passiert" heisst, muss nicht im
Ablauf stecken, der scheinbar nichts tut. Hier war jeder Schritt richtig — nur
die Anzeige zeigte etwas anderes.

### Die Bildanleitung hat zwei Regeln entlarvt (v0.46)

Die Anleitung zeigt seit v0.41, wo man hintippt und was daraus wird — gerechnet
mit den echten Regeln. Beim Durchsehen fielen dabei zwei Fähigkeiten auf, deren
Bedienung **nicht** zu dem passte, was man erwartet:

- **Die Mauer** erschien neben dem Feld, das man antippte (das Feld war ihr
  linkes Ende). Auf einem Bild nebeneinander sieht man das sofort; im Spiel
  hält man es für einen Fehlgriff.
- **Das Nudelholz** richtete sich nach dem Rand des BRETTS statt nach der
  Seite des SPIELERS. Für Weiss stimmte es, für Schwarz stand es auf dem Kopf
  — das Brett wird für ihn gedreht.

**Die Lehre:** Eine Anleitung, die aus den echten Regeln entsteht, ist auch ein
Prüfstand für die Regeln. Was sich in drei Bildern nicht erklären lässt, ist
meistens nicht schwer zu erklären, sondern falsch herum gebaut.

**Zweite Lehre — Richtungen gehören zur Farbe, nicht zum Brett:** Alles, was
„oben" oder „unten" heisst, muss aus der Farbe gerechnet werden, solange das
Brett für eine Seite gedreht wird. Die Bauern machen es seit jeher richtig
(`richtung` aus der Farbe); das Nudelholz war die Ausnahme.

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

## Der Stolperstein verpuffte im Vorbeiziehen (v0.53, gefunden v0.58)

**Der Fehler:** Wer mit dem Turm über einen Stolperstein hinwegzog, sammelte
ihn ein — und nichts passierte. Landete man dagegen genau auf ihm, wirkte er.
Von aussen sah das nach Zufall aus.

**Die Ursache** ist eine Annahme, die drei Versionen lang stimmte und dann
nicht mehr. `_bonusEinsammelnAufFeldern` rief `_pechAusloesen` immer mit dem
Feld des WÜRFELS auf, und im Kommentar stand die Begründung dazu: „dort steht
jetzt die einsammelnde Figur". Bis v0.52 war das wahr — man sammelte nur ein,
indem man das Zielfeld betrat. Seit **v0.53 gilt „Berühren heisst
Einsammeln"**: Ein Turm nimmt einen Würfel auch im Vorbeiziehen mit und steht
danach zwei Felder weiter. `SCHACH.stolperstein` suchte auf dem Würfelfeld nach
einer Figur, fand nichts und lieferte `null` — die Wirkung wurde als „ohne
Wirkung" verbucht.

**Warum kein Test es fand:** Alle Stolperstein-Tests liessen die Figur auf dem
Würfel LANDEN. Kein einziger zog über einen hinweg. Der eine Fall, den v0.53
neu geschaffen hatte, war genau der ungeprüfte.

**Die Lehre:** Wer eine Regel verallgemeinert („nicht nur das Zielfeld, jedes
betretene Feld"), sucht alle Stellen, die sich auf den alten Spezialfall
verlassen — und besonders die, in deren KOMMENTAR die alte Annahme steht. Ein
Kommentar, der eine Voraussetzung nennt, ist eine Fundstelle. Gefunden wurde es
übrigens nicht im Spiel, sondern beim Stellen einer Beispielszene, die genau
diesen Ablauf zeigen sollte.

## Eine Beispielszene ohne Figuren beendet die Partie (v0.58)

**Der Fehler:** Die neue Anleitung zur Wiedergeburt lieferte gar keine Bilder.

**Die Ursache:** Die Szene beginnt damit, dass der Gegner die eigene Dame
schlägt — und sie war die einzige weisse Figur. `SCHACH_RUNDE.ziehen` rechnet
nach jedem Zug die Lage nach, erkennt Patt und setzt ein Ergebnis. Danach
weist `darfEinsetzen` jede Fähigkeit ab, und `bilder()` liefert `null`.

**Die Lehre:** Beispielstellungen werden mit den echten Regeln gerechnet — also
gelten für sie auch die echten Abbruchbedingungen. Auf jedem Beispielbrett
braucht jede Seite mindestens eine Figur, die ziehen kann. Ein Test in
`tests\test-schach-vorschau.js` hält das jetzt fest.

## Ein Angreifer hinter einer Sperre gab trotzdem Schach (v3.3, gefunden v0.60)

**Der Fehler:** Ein Turm oder Läufer, zwischen dem und dem König eine Mauer
oder ein Loch lag, setzte Schach — obwohl er dort gar nicht hinziehen konnte.
Im schlimmsten Fall endete die Partie durch ein Schachmatt, aus dem der König
in Wahrheit gar nicht hätte fliehen müssen.

**Die Ursache: zwei Strahlen, nur einer kannte die Sperre.** `schach.js` läuft
an zwei Stellen eine Linie entlang:

- `_strahl` erzeugt die ZÜGE. Als die Mauer in v3.3 dazukam, bekam sie dort
  ihr `if (SCHACH.gesperrt(...)) break;`.
- `_feldBedroht` beantwortet, ob ein Feld ANGEGRIFFEN ist. Diese Schleife blieb
  unverändert und brach nur an Figuren ab.

Zugerzeugung und Bedrohungsprüfung sagten damit zwei verschiedene Dinge über
dieselbe Linie. Beim Riss (v0.54) fiel es nicht auf, weil er dieselbe schon
falsche Stelle benutzte.

**Warum kein Test es fand:** Alle Mauer- und Riss-Tests prüften Züge — ob eine
Figur durchkommt. Kein einziger fragte, ob sie durch die Sperre hindurch DROHT.
Gefunden wurde es erst, weil zu Wunsch #20 ein Test geschrieben wurde, der
belegen sollte, dass die Regel längst gilt. Sie galt nicht.

**Die Lehre:** Wo zwei Funktionen dieselbe geometrische Frage beantworten
(„was liegt auf dieser Linie"), muss jede neue Sperre in BEIDE. Der sicherste
Test dafür ist nicht der Zug, sondern die Drohung: Ein Zug, der nicht
stattfindet, fällt auf; eine Drohung, die es nicht gibt, wirkt still.

## Der gewürfelte Seitentausch hob sich selbst auf (v0.63)

**Der Fehler:** Auf dem Kreuz-Brett sollte sich je Partie entscheiden, welches
Team den linken und welches den rechten Flügel bekommt. Über vierzig gerechnete
Partien kam immer dieselbe Verteilung heraus — obwohl der gerechnete Zufallswert
nachweislich sauber zwischen 0 und 1 streute.

**Die Ursache** war keine im Zufall, sondern in der Geometrie. Der Tausch war
als „Platztausch samt Farbwechsel" gebaut: Was links stand, kam nach rechts und
wechselte dabei die Seite. Beide Flügel tragen aber **dieselbe Figurenfolge** —
`kreuzFluegelFigur` kennt nur die Stelle im Streifen, nicht die Seite. Links
stand also ein weisser Turm, rechts ein schwarzer, und beide Schritte zusammen
ergaben wieder genau das: Turm nach Turm, Farbe zurückgedreht. Die Rechnung
lief, das Ergebnis war jedes Mal die Ausgangsstellung.

**Warum kein Test es zuerst fand:** Der erste Test prüfte nur, ob die beiden
Flügel *verschiedenen* Seiten gehören — das stimmte immer. Erst der zweite,
der über viele Partie-Kennungen zählte, wie viele **verschiedene** Verteilungen
vorkommen, machte es sichtbar.

**Die Lehre:** Bei einer symmetrischen Aufstellung ist ein Platztausch keine
Änderung. Was die Frage „wem gehört diese Seite" wirklich beantwortet, ist der
Farbwechsel an Ort und Stelle. Und: Ein Test auf „es gibt einen Unterschied"
muss über VIELE Saaten zählen, nicht eine einzelne Aufstellung prüfen — sonst
bestätigt er eine Streuung, die es nicht gibt (dieselbe Lehre wie in v0.49.1).

## Das Beispiel im Erklärtext verschluckte einen echten Wunsch (v0.63)

**Der Fehler:** Der GitHub-Eintrag **#12** lag drei Tage unbemerkt da.
`Wuensche-Abholen.ps1` meldete brav „nichts Neues", obwohl er offen war — und
zwar bei JEDEM Lauf, auch bei dem, mit dem am 13.08. die ganze Staffel #5 bis
#22 abgeholt wurde. Aufgefallen ist es erst, als nach dem Schliessen aller
siebzehn Wünsche noch genau einer offen blieb.

**Die Ursache:** Die Doppelten-Prüfung suchte die Marke `[#12]` IRGENDWO in der
`TODO.md`:

    if ($todoText.Contains($marke)) { continue }

In der `TODO.md` steht aber seit jeher der erklärende Satz „erkennbar an
`[#12]`" — als Beispiel. Solange es auf GitHub keinen Eintrag mit der Nummer 12
gab, fiel das nicht auf. Der erste echte #12 galt damit als längst eingetragen.

**Die Lehre:** Eine Marke, die als Beispiel im Fliesstext steht, ist irgendwann
auch eine echte. Gesucht wird deshalb nur noch am ANFANG einer Listenzeile —
also genau in der Form, in der das Skript seine Einträge selbst schreibt
(`^\s*-\s*\[#12\]`). Allgemeiner: Wer Vorhandenes an einer Zeichenkette
erkennt, muss die STELLE mitprüfen, an der sie stehen darf. Das ist im Haus
schon die zweite stille Falle in genau diesem Skript — die erste war die
Pipeline, die ein JSON-Array als ein einziges Objekt weiterreichte (siehe den
Kommentar dort).

## Die Sicherung gegen gleichzeitige Züge verschluckte das Ausweichen (v0.66)

**Der Fehler:** „Wenn ich Ausweichen einsetze, passiert nichts." Die Fähigkeit
blieb im Vorrat, das Brett unverändert — mal so, mal nicht.

**Die Ursache:** `_sendenMitPruefung` schreibt nur, wenn der Zugzähler auf dem
Server noch der erwartete ist. Diese Prüfung ist richtig und soll bleiben — sie
verhindert, dass zwei Leute aus demselben Team gleichzeitig ziehen. Für eine
Fähigkeit mit **Blitz** ist sie aber genau verkehrt: Die wird absichtlich
eingesetzt, WÄHREND der Gegner am Zug ist. Zieht er in derselben Sekunde, ist
der Zähler weitergelaufen, und das Einsetzen gilt als „jemand war schneller".
Das Ausweichen ist die einzige Fähigkeit, die man NUR im Gegenzug einsetzen
kann — es traf also fast immer sie.

**Die Lehre:** Wer eine Aktion baut, die absichtlich GLEICHZEITIG mit der des
Gegners läuft, darf sie nicht mit einer Sperre gegen Gleichzeitigkeit
absichern. Der richtige Weg ist derselbe wie im Würfel-Quizz: **zusammenführen
statt abweisen** — frischen Stand holen, die eigene Änderung darauf anwenden,
schreiben. Die Zugzähler-Prüfung bleibt für Züge, wo sie hingehört.

**Zweite Lehre daraus:** Eine Fähigkeit gilt erst als verbraucht, wenn sie
gewirkt hat. Das war vorher nicht getrennt — Einsetzen und Verbrauchen hingen
an derselben Rechnung, und ein abgewiesener Schreibvorgang nahm beides zurück
oder keines.

## „Fenster blockiert", obwohl das Fenster aufging (v0.66)

**Der Fehler:** Der Wunsch-Knopf meldete JEDES MAL „Der Browser hat das
GitHub-Formular nicht geöffnet" — und der Wunsch landete trotzdem sauber auf
GitHub.

**Die Ursache** steht so im Web-Standard: `window.open(adresse, "_blank",
"noopener")` liefert **immer `null`** zurück, auch bei Erfolg. Das ist kein
Fehlerzeichen, sondern der Sinn des Schalters — das neue Fenster soll keinerlei
Verbindung zurück haben, also gibt es auch keine Kennung. Die Prüfung
`if (!fenster)` konnte „geöffnet" und „blockiert" damit gar nicht
unterscheiden.

**Die Lehre:** Ein Rückgabewert `null` heisst nicht automatisch „fehlgeschlagen"
— manchmal heisst er „diese Auskunft gibt es bewusst nicht". Der übliche Weg
liefert beides: ohne den Schalter öffnen und dem Fenster sofort danach die
Rückverbindung nehmen (`fenster.opener = null`).

## Die neue Lootbox verdeckte den Zug, der gerade passiert war (v0.69)

**Der Fehler:** „Manche Züge, gerade mit dem Pferd, wurden nicht gezeigt." Mal
lief die Bewegung und die Spur lag auf dem Brett, mal passierte gar nichts —
ohne erkennbares Muster.

**Die Ursache:** Sowohl `_letzteSpur` als auch `_zugAnimieren` (und
`_wirkungAnimieren`) lasen den **letzten** Eintrag des Verlaufs. Nach einem Zug
ist der aber sehr oft gar nicht der Zug: `_bonusNachziehen` hängt „Eine Lootbox
erscheint auf …" hinten an, sobald eine neue erscheint — und dieser Eintrag
trägt `von: -1, nach: -1`. Damit fiel die Bewegungsanimation sofort heraus und
die Spur blieb leer.

Das Muster war also sehr wohl da, nur nicht am Zug: Es hing daran, ob in
diesem Halbzug eine Lootbox erschienen ist. Beim **Springer** fiel es am
meisten auf, weil sein L ohne Spur am schwersten nachzuvollziehen ist — deshalb
kam die Meldung über ihn.

**Die Lehre:** „Der letzte Eintrag" ist nicht dasselbe wie „das, was gerade
passiert ist". Sobald ein Verlauf NEBENHER entstandene Einträge kennt
(Erscheinen, Einsammeln), muss man den letzten Eintrag suchen, der die
gemeinte ART von Ereignis trägt — hier `_letzterBewegungsEintrag`. Und: Wer
einen neuen Eintragstyp erfindet, prüft, wer alles „den letzten" liest.

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
