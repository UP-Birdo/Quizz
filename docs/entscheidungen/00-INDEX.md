# Quizz - Entscheidungs-Index

Wegweiser in die Themendateien dieses Ordners. Regel: NUR die Dateien lesen,
deren Themen das aktuelle Vorhaben beruehrt - nie alles auf Vorrat.
Neue Erkenntnisse: in die passende Datei schreiben UND hier eintragen.

Warum das Projekt so aussieht, wie es aussieht — und was bewusst NICHT gebaut
wird. Die Liste dessen, was noch kommt, steht in [../ROADMAP.md](../ROADMAP.md).

## erkenntnisse.md - Teuer erkaufte Erkenntnisse

- Teuer erkaufte Erkenntnisse
    - Mitspieler verschwanden wieder aus der Runde (v0.8)
    - Der Tab Team Schach blieb leer (v1.2)
    - Die Fähigkeiten-Karte fehlte bei zugeschalteten Würfeln (v3.3, gefunden v3.4)
    - Die Zielpunkte blieben nach dem Zug stehen (v4.0)
    - Die Seite fror ein, bis der Gegner zog (v3.9)
    - Die Fähigkeit war verbraucht, ihre Wirkung nie da (v0.41)
    - Der gerechnete Zufall streute nicht (v0.49.1)
    - Die neue Partie war da — man stand nur davor (v0.44)
    - Die neue Partie war da — und verschwand wieder (v0.52)
    - Die Bildanleitung hat zwei Regeln entlarvt (v0.46)
    - Der hinterlegte Zugriffsschlüssel ließ sich nicht mehr lesen (v0.8)
    - Der Stolperstein verpuffte im Vorbeiziehen (v0.53, gefunden v0.58)
    - Eine Beispielszene ohne Figuren beendet die Partie (v0.58)
    - Ein Angreifer hinter einer Sperre gab trotzdem Schach (v3.3, gefunden v0.60)
    - Der gewuerfelte Seitentausch hob sich selbst auf (v0.63)
    - Das Beispiel im Erklaertext verschluckte einen echten Wunsch (v0.63)
    - Die Sicherung gegen gleichzeitige Zuege verschluckte das Ausweichen (v0.66)
    - „Fenster blockiert", obwohl das Fenster aufging (v0.66)
    - Die neue Lootbox verdeckte den Zug, der gerade passiert war (v0.69)
    - Eine Liste im Behandler, die niemand mitpflegt (v0.60, gefunden v0.71)
    - Die Gegenseite eines PAARES ist nicht die gespiegelte Seite (v0.72)
    - Der Doppelzug nahm seinen zweiten Zug zurueck (v0.76)
    - Ein Eintrag, der sich als Bewegung ausgab (v0.76)
    - Ein Zaehler, der die Brettbreite meint, aber die Mitte braucht (v0.76)
    - Ein Kettenschub sieht aus wie ein Schlag (v0.77, kein Fehler)
    - Zwei richtige Regeln, die sich gegenseitig auffrassen (v0.77.1)
    - Die eine Funktion, die man beim Aufraeumen vergisst (v0.82) — dritte
      Wiederholung von „Richtung aus der Farbe rechnet auf dem Kreuz falsch"
    - Zwei Uhren, und die eine Funktion nahm die falsche (v0.83, behoben
      v0.83.1) — zugZaehler ist Sperr-Sicherung, stand.takt die Spiel-Uhr
    - Eine gemischte Liste darf man nicht hinten abschneiden (v0.86) — der
      König konnte aus der gemischten Zufallsarmee herausfallen, wenn die
      Liste erst nach dem Mischen gekürzt wurde

## entschieden.md - Entschieden - und warum

Seit 19.08.2026 aufgeteilt: `entschieden.md` selbst enthaelt nur noch die
Nutzer-Entscheidungen und den Wegweiser; die Abschnitte liegen unveraendert in
drei Themendateien (unten je Datei aufgefuehrt). Gezielt lesen: Abschnitt hier
nachschlagen, dann in der Themendatei ueber die Ueberschrift ansteuern.

- Nutzer-Entscheidungen *(stehen weiter in `entschieden.md` selbst)*
    - Beim Anlegen (2026-07-31)
    - Der eigentliche Zweck (2026-07-31, kurz nach v0.1)
    - Aufdecken und Verstecken (2026-07-31, zu v0.3)

### entschieden-grundlagen.md - Wuerfel Quizz, Technik, Grundsaetzliches

- Warum das Aufdecken je Person eine Tipp-Sperre erzwingt
- Warum das Auge standardmäßig zu ist und nichts speichert
- Warum ein gezeichnetes Auge statt eines Emojis
    - Anmeldung und Verwaltung (2026-07-31, zu v0.6)
- Was die PIN leistet — und was nicht
- Warum die PIN im Klartext nirgends steht
- Warum die neue Runde ans Passwort gebunden ist
- Warum jeder eine PIN haben muss
- Warum die Verwaltung nur löschen darf
- Warum ein Siegel statt einfacher Geheimhaltung
- Warum Namen und Vermutungen NICHT versiegelt sind
- Warum das Ändern einer Festlegung erlaubt bleibt
- Warum die Eingabefelder keine Nummern tragen
- Warum die Punkte so verteilt werden
- Warum die Reihenfolge der Würfel nicht zählt
- Warum Anmeldung über den Namen, ohne Passwort
- Warum Karten statt einer großen Tabelle
- Warum Firebase Realtime Database?
- Warum die Abfrage im Hintergrund ruht
- Warum kein Firebase-SDK?
- Warum „letzter gewinnt" beim gleichzeitigen Arbeiten?
- Warum das App-Zeichen so aussieht
- Warum der Wert „Stern" als Wort erscheint
- Warum es von Anfang an Tabs gibt
- Warum das Ändern der PIN die alte verlangt

### entschieden-bis-v3.md - Team Schach und Imposter bis v3.8 (08/2026)

- Team Schach — die Entscheidungen (v1.0)
- Team Schach — der Ausbau (2026-08-01, v1.3 bis v1.5)
    - Warum die laufende Partie nicht umzieht, sondern bleibt
    - Warum das Doppelbrett keine zwei Bretter ist
    - Warum die Spielart fest zur Partie gehört
    - Warum es nur zwei Fähigkeiten gibt
    - Warum die Bewegung im Verlauf steht und nicht im Bildschirm
    - Warum die Rangliste die Spiele nicht vermischt
    - Abgelehnt beim Ausbau
- Bedienung des Brettes (2026-08-02, v1.6 bis v1.9)
    - Der blaue Punkt auf dem blauen Brett — ein selbstgemachter Fehler
    - Warum die Rochade jetzt auch über den Turm geht
    - Warum der Pfeil und die Bewegung beide bleiben
- Die Fähigkeiten-Spielart (2026-08-02, v2.0)
    - Warum der Würfel gezeichnet und nicht eingefügt ist
    - Warum vier Arten statt zehn Sonderfälle
    - Warum die Zielfelder ausprobiert und nicht aufgezählt werden
    - Warum König und Matt ausgenommen sind
    - Warum eine Partie leer startet
- Regeln und Bedienung (2026-08-02, v2.1 bis v2.3)
    - Der König, den der Doppelzug verschluckte
    - Warum die Rochade jetzt aus der Stellung gelesen wird
    - Warum ein Teamwechsel nicht mehr geht
    - Warum die Pfeile nur halbdurchsichtig sind
    - Warum die Stufe Grau verschwunden ist
- Der Gewinner-Bildschirm, der niemand fand (v2.6)
- Warum der Pfeil jetzt eine Maske hat
- Wie die Fähigkeiten eingestuft werden (Stand v2.6)
- Warum der Hover nichts mehr verrät
- Warum die Vorzüge wieder ausgebaut sind (v2.8)
- Warum das volle Glas keine Regel anfasst
- Warum die Würfel keinen festen Takt mehr haben
- Imposter — die Entscheidungen (v3.0)
    - Was die Geheimhaltung leistet und was nicht
    - Warum die Wortliste handgemacht ist
    - Warum die Zahl der Imposter nur ein Höchstwert ist
    - Ein Fehler beim geratenen Wort wird verziehen
    - Warum die Imposter-Punkte nicht festgeschrieben werden
- Warum der Imposter Räume bekommen hat (v3.2)
- Warum team-schach.js in vier Dateien liegt (v3.2)
- Die drei Wünsche vom Wunsch-Knopf (v3.3)
- Warum das Löschen ans Passwort gebunden ist (v3.3)
- Warum die Würfel keine Höchstzahl mehr haben (v3.3)
- Warum der Springerpfeil einen Knick hat (v3.3)
- Die drei neuen Fähigkeiten und der Erdbeben-Umbau (v3.5)
- Warum `halbzuege` keine Uhr ist (v3.5)
- Warum der Zugpfeil verschwunden ist (v3.6)
- Warum die Figurengröße gemessen und nicht gerechnet wird (v3.6)
- Warum sich der Würfel-Inhalt erst beim Einsammeln entscheidet (v3.6)
- Warum Ausweichen im gegnerischen Zug geht (v3.6)
- Warum eine Fähigkeit den König nicht im Schach lassen darf (v3.6)
- Thema und Wortart sind zwei Fragen (v3.7)
- Warum ein gefallenes Wort gedämpft und nicht gesperrt wird (v3.7)
- Warum selbst angelegte Themen auf der Tafel liegen (v3.7)
- Warum der Bibliotheks-Knopf verschwindet statt zu fragen (v3.7)
- Erst anzeigen, dann senden (v3.8)

### entschieden-ab-v0-41.md - Team Schach seit v0.41 (SemVer-Zeit)

- Warum Grün eine Abklingzeit bekommen hat (v0.41)
- Warum Rot und Blau und nicht Grün und Gelb (v0.41)
- Warum die Bildanleitung gerechnet und nicht gezeichnet wird (v0.41)
- Wie eine Fähigkeit eingepreist wird (v0.47)
- Die Zeichen gehören der Fähigkeit, nicht der Lage (v0.48) — **kehrt v0.41 um**
- Sprung und Teleport SIND der Zug (v0.48) — **kehrt einen Teil von v0.47 um**
- Warum die Wiedergeburt nur noch episch ist (v0.48)
- Wie lange eine Wirkung hält, steht jetzt dabei (v0.48)
- Der Unglückswürfel ist kein Gesetz mehr, sondern ein Haken (v0.49) — **hebt
  eine eiserne Regel auf**
- Zwei Könige sind zwei Leben (v0.49, Spielart „Zufallsarmee")
- Frost und Fessel mussten sich unterscheiden (v0.56)
- Warum aus der Verstärkung eine Kette wurde (v0.56) — **zweite Quelle für
  „zwei Könige sind zwei Leben"**
- Warum der Bauernschub sein Pluszeichen verloren hat (v0.56) — **erster
  Anwendungsfall von „zu stark heisst Plus weg, nicht Stufe verschieben"**
- Warum der Vorschau-Kasten angetippt und nicht gezogen wird (v0.57) — **weicht
  bewusst vom Wortlaut des Wunsches ab**
- Warum eine Leihgabe erst zählt, wenn man wieder am Zug ist (v0.57)
- Warum ein Zug unterwegs enden kann (v0.58) — **nimmt eine Aussage aus
  derselben Runde zurück**
- Warum eine Unglücks-Lootbox eine Partie beenden darf (v0.73) — **hebt eine
  eiserne Regel für Unglückswürfel auf**
- Warum der Stolperstein rückwärts wirft und nicht abwärts (v0.73)
- Warum die Ansicht sich nur EINMAL dreht (v0.72)
- Warum das Kreuz-Duell die Startseite auslost (v0.72)
- Warum aus zwei Schaltern vier Stufen wurden (v0.71) — **ersetzt den
  Regen-Haken (v0.50) und den Schieberegler (v0.60)**
- Warum die Mauer die Lootbox jetzt frisst (v0.77) — **kehrt v0.66 um**
- Warum laufende Partien NICHT auf ihrer Startversion eingefroren werden
  (v0.77) — **beantwortet die Architekturfrage vom 18.08.**
- Warum der Unglücks-Anteil am Füllstand hängt (v0.77) — **eine Mechanik
  statt zweier, dieselbe wie bei der Menge seit v0.71**
- Warum das Nudelholz jetzt auch Könige rollt (v0.77)
- Warum Ausweichen versteckt wurde, obwohl es funktioniert (v0.78) —
  **erste versteckte FÄHIGKEIT, nicht nur Spielart**
- Zwei neue gewöhnliche Fähigkeiten — und warum genau diese zwei (v0.79) —
  **Grün hatte nach v0.78 kein Pluszeichen mehr**
- Warum die Halluzination halb so lang dauert (v0.79)
- Der Frost darf matt setzen (v0.80) — **hebt eine eiserne Regel auf; erste
  FÄHIGKEIT, die Schachmatt herbeiführen darf**
- Warum das Nudelholz sein Pluszeichen verloren hat (v0.80)
- Warum die Lage der Mauer nirgends gespeichert wird (v0.81)
- Warum eine leere Seltenheitsstufe nicht neu gewürfelt wird (v0.83, entschieden)
- Ausdehnung und Einsturz aus dem Spiel genommen (v0.84) — **auf Zeit**;
  versteckt statt gelöscht, liegende Boxen fliegen vom Brett, Stufe Blau leer

## offen-und-abgelehnt.md - Offen, Nutzer-Entscheidungen noetig, bewusst abgelehnt

- Warum die Abstimmung eine Frist braucht
- Bewusst abgelehnt
- Braucht eine Nutzer-Entscheidung (nicht ungefragt bauen)

## historie.md - Versions-Historie

15 Versions-Eintraege (Warum je Version). NUR auf ausdrueckliche
Frage zur Vergangenheit lesen, nie zur Orientierung fuer neue Arbeit.
