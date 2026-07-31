# Quizz

Eine kleine Web-Seite für ein Ratespiel unter Freunden. Jeder würfelt fünf
Würfel und hält sie geheim. Über den Tag stellt man sich gegenseitig Fragen und
trägt hier ein, was die anderen wohl gewürfelt haben. Am Abend wird aufgelöst
und gezählt, wer am besten geraten hat.

Aufrufen, Namen eintragen, loslegen — keine Anmeldung, keine Installation.

## So läuft eine Runde

1. **Anmelden.** Beim ersten Besuch fragt die Seite nach deinem Namen. Damit
   bist du in der Runde; dein Gerät merkt sich, wer du bist.
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
   Tipps aller anderen und die Trefferzahlen. Die Bestenliste unten wächst mit
   jedem, der aufdeckt.

**Neue Runde** löscht Würfel und Vermutungen, die Mitspieler bleiben.

## Das Auge: eigene Zahlen verstecken

In deiner Karte sitzt ein Augen-Symbol. **Standardmäßig sind deine eigenen
Würfelzahlen verdeckt** — du siehst fünf Fragezeichen. Antippen zeigt sie,
noch einmal antippen versteckt sie wieder. Beim nächsten Öffnen der Seite ist
alles wieder zu.

Damit kannst du dein Handy weiterreichen oder daneben liegen lassen, ohne dass
jemand deinen Wurf mitliest. Zum Eintragen der Würfel machst du das Auge kurz
auf.

## Wie gezählt wird

Ein Treffer ist jeder Würfelwert, den du richtig geraten hast. Die Reihenfolge
spielt keine Rolle, und ein Wert zählt nur so oft, wie er wirklich vorkommt:

| | Würfel |
|---|---|
| Echt | 1, 1, 3, 5, Stern |
| Dein Tipp | 1, 3, 3, 5, 5 |
| Treffer | **3** (eine 1, eine 3, eine 5) |

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

## Ein Gerät je Person

Deine Würfel liegen auf dem Gerät, auf dem du sie eingetragen hast. Spiel eine
Runde also auf demselben Gerät zu Ende. Öffnest du die Seite doch auf einem
anderen Gerät, sagt sie dir das und du kannst den Wurf dort neu eintragen — das
zählt dann als erneutes Festlegen und wird für alle sichtbar.

## Selbst betreiben

Die Einrichtung — eigenes Repository, GitHub Pages und die gemeinsame Datenbank —
ist Schritt für Schritt in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) beschrieben.
Zum Ausprobieren auf dem eigenen Rechner genügt
`tools\Quizz lokal starten.cmd`.
