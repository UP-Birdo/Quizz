# Änderungen

Neueste Version oben. Die Version steht in `js/konfig.js` (`APP_VERSION`) und
wird im Kopf der Seite angezeigt.

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
