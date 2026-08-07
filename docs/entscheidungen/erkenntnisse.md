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
