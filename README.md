# Quizz

Zwei Spiele auf einer Seite: **Würfel Quizz** (Ratespiel um verdeckte Würfel)
und **Team Schach** (Schach für zwei Mannschaften). Man meldet sich einmal an
und ist in beiden dabei.

## Würfel Quizz

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

Ein Schachspiel für zwei Mannschaften.

1. **Team wählen.** Bei Weiss oder Schwarz auf **Mitspielen** — beliebig viele
   Leute je Seite, und man darf auch mitten im Spiel dazukommen.
2. **Bereit drücken.** Sobald auf beiden Seiten jemand steht und beide Seiten
   bereit sind, geht es los.
3. **Ziehen.** Figur antippen, die möglichen Felder erscheinen als Punkte
   (Schlagfelder als Ring), dann das Zielfeld antippen. Wer für Schwarz spielt,
   sieht das Brett gedreht.

**Innerhalb eines Teams gibt es keine Reihenfolge:** Jeder aus dem Team, das am
Zug ist, darf ziehen — wer zuerst drückt, hat gezogen. Sind zwei gleichzeitig
dran, zählt der erste Zug; der zweite bekommt eine Meldung und wird nicht
ausgeführt. Zwischen Weiss und Schwarz gilt normales Schach.

Es sind alle Regeln umgesetzt: Rochade, en passant, Bauernumwandlung (mit
Auswahl der Figur), Schach, Schachmatt, Patt. Der Stand liegt in der Datenbank
— ihr könnt die Partie jederzeit liegen lassen und später weiterspielen.

## Selbst betreiben

Die Einrichtung — eigenes Repository, GitHub Pages und die gemeinsame Datenbank —
ist Schritt für Schritt in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) beschrieben.
Zum Ausprobieren auf dem eigenen Rechner genügt
`tools\Quizz lokal starten.cmd`.
