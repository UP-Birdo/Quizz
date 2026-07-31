# Entscheidungen

Warum das Projekt so aussieht, wie es aussieht — und was bewusst NICHT gebaut
wird. Die Liste dessen, was noch kommt, steht in [../ROADMAP.md](../ROADMAP.md).

## Teuer erkaufte Erkenntnisse

Noch keine aus diesem Projekt. Jede nicht offensichtliche Bug-Ursache gehört
hierher, bevor die Sitzung endet.

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

## Nutzer-Entscheidungen

### Beim Anlegen (2026-07-31)

| Frage | Entscheidung |
|---|---|
| Wo liegen die Daten? | **Gemeinsam für alle Besucher** — nicht je Gerät getrennt. Die Folgen (Fremddienst, öffentlich schreibbar) wurden ausdrücklich in Kauf genommen. |
| Wohin auf GitHub? | **Eigenes Repository** mit eigener Pages-Adresse. |
| Zeilen | Name als **Freitext**, Zeilen **frei erweiterbar**. |
| Spalten | **Fest**: Name, danach fünf Würfel-Spalten. |

### Der eigentliche Zweck (2026-07-31, kurz nach v0.1)

Die Seite ist kein Formular, sondern ein **Ratespiel**: Alle würfeln fünf
Würfel, halten sie geheim, stellen sich über den Tag Fragen und tragen ihre
Vermutungen über die anderen ein. Am Ende wird aufgelöst. Vorgabe war
ausdrücklich, es **so einfach wie möglich** zu halten und die Ausgestaltung zu
entscheiden. Daraus folgten die Entscheidungen unten.

### Aufdecken und Verstecken (2026-07-31, zu v0.3)

| Wunsch | Umsetzung |
|---|---|
| Auflösen soll jeder nur für sich selbst | Der gemeinsame Auflösen-Knopf entfällt. Jeder hat **Meine Würfel aufdecken** in seiner eigenen Karte; die anderen raten weiter. |
| Augen-Knopf, der die eigenen Zahlen versteckt, standardmäßig an | Auge in der eigenen Karte, Grundzustand verdeckt, Zustand wird nicht gespeichert. |

## Warum das Aufdecken je Person eine Tipp-Sperre erzwingt

Wenn jeder einzeln aufdeckt, sind die echten Würfel einer Person sichtbar,
während andere noch tippen dürfen. Ohne Gegenmaßnahme könnte man abschreiben.
Deshalb weist `MODELL.tippSetzen` jede Vermutung auf einen bereits aufgedeckten
Spieler ab — im Modell, nicht nur in der Oberfläche, damit die Regel auch dann
gilt, wenn zwei Geräte gleichzeitig schreiben.

Nebenwirkung, bewusst angenommen: Wer spät dazukommt, kann auf früh Aufgedeckte
nicht mehr tippen. Das ist richtig so — deren Wurf steht ja schon da.

## Warum das Auge standardmäßig zu ist und nichts speichert

Der Zweck des Knopfes ist, dass ein Blick über die Schulter nichts verrät. Wäre
der Zustand gespeichert, stünde nach dem Öffnen der Seite womöglich der eigene
Wurf offen auf dem Tisch — genau der Fall, den der Knopf verhindern soll. Also:
nach jedem Laden verdeckt, Sichtbarkeit nur für den Moment.

Der Schalter wirkt auch auf die Eingabefelder. Ein `select` lässt sich nicht
maskieren, deshalb werden die Felder bei geschlossenem Auge durch Platzhalter
ersetzt. Zum Eintragen macht man das Auge kurz auf — ein Klick mehr, dafür eine
Regel weniger im Kopf.

## Warum ein gezeichnetes Auge statt eines Emojis

Haus-Regel: keine Emojis. Ein SVG ist eine Zeichnung, kein Emoji — es lässt sich
in der Schriftfarbe darstellen, skaliert sauber und sieht auf jedem Gerät gleich
aus. Zwei Zustände: offenes Auge mit Pupille (Zahlen sichtbar), geschlossenes
Lid mit Wimpern (verdeckt).

## Warum ein Siegel statt einfacher Geheimhaltung

Das Spiel steht und fällt damit, dass niemand die Würfel der anderen vorher
sieht. Die Daten liegen aber in einer öffentlich lesbaren Datenbank, deren
Adresse zwangsläufig im ausgelieferten JavaScript steht. Abgewogen wurden:

| Weg | Bewertung |
|---|---|
| Würfel in der Datenbank, App zeigt sie nur nicht an | Abgelehnt. Wer die Entwicklerkonsole öffnet, sieht alles. Bei einem Spiel, das einen ganzen Tag läuft, ist das keine Frage des Ob, sondern des Wann. |
| Würfel verschlüsseln | Abgelehnt. Der Schlüssel müsste in der öffentlichen Seite stehen — Scheinsicherheit. |
| **Würfel bleiben auf dem Gerät, veröffentlicht wird nur eine Prüfsumme** | **Gewählt.** Kostet rund fünfzig Zeilen, kommt ohne Fremdtechnik aus (Web Crypto ist im Browser eingebaut) und löst zwei Probleme auf einmal: Spicken ist unmöglich, und nachträgliches Ändern fällt auf. |
| Einen Server bauen, der die Würfel unter Verschluss hält | Abgelehnt. Eigener Server, eigene Anmeldung, eigener Betrieb — für ein Freundesspiel unverhältnismäßig, und die Seite soll ohne Haus-Netz erreichbar sein. |

Der Preis der gewählten Lösung: Die Würfel hängen am Gerät. Wer wechselt, muss
bei der Auflösung von Hand nachtragen; das wird als **ohne Siegel** angezeigt.
Das ist ehrlicher als eine Lösung, die Sicherheit nur vortäuscht.

## Warum Namen und Vermutungen NICHT versiegelt sind

Namen müssen sichtbar sein, sonst weiß niemand, auf wen er tippt. Vermutungen
müssen am Ende auswertbar sein und sind vor der Auflösung nur schwach geschützt
(die App zeigt sie nicht, in der Datenbank stehen sie im Klartext). Das ist
vertretbar: Wer die Tipps der anderen spickt, gewinnt dadurch nichts —
entscheidend sind die echten Würfel, und die sind versiegelt.

## Warum das Ändern einer Festlegung erlaubt bleibt

Ein Verbot wäre technisch leicht, in der Praxis aber lästig: Wer sich vertippt,
sitzt sonst den ganzen Abend auf einem falschen Wurf. Stattdessen ist Ändern
erlaubt und wird **sichtbar gemacht** — mit Anzahl und Uhrzeit, für alle. Die
soziale Kontrolle erledigt den Rest, ganz ohne Regelwerk.

## Warum die Reihenfolge der Würfel nicht zählt

Fünf gewürfelte Würfel sind eine Menge, keine Reihenfolge. Deshalb:

- gezählt wird als Multimenge — ein doppelt geratener Wert zählt nur so oft, wie
  er wirklich vorkommt (echt `1,1,3,5,Stern` gegen Tipp `1,3,3,5,5` gibt 3);
- vor dem Bilden der Prüfsumme wird sortiert, sonst wäre derselbe Wurf je nach
  Eingabereihenfolge unterschiedlich versiegelt;
- angezeigt wird immer sortiert, das liest sich schneller.

## Warum Anmeldung über den Namen, ohne Passwort

Ein Passwort wäre eine Hürde für ein Spiel unter Freunden und müsste irgendwo
sicher liegen. Stattdessen merkt sich das Gerät, wer es ist. Gibt jemand einen
schon vorhandenen Namen ein, fragt die App nach, ob es dieselbe Person auf einem
anderen Gerät ist. Das kann man missbrauchen — unter Freunden ist das kein
Bedrohungsmodell, sondern Zusammenarbeit.

## Warum Karten statt einer großen Tabelle

Eine Matrix aus allen Ratern gegen alle Ziele wäre auf dem Handy unbrauchbar.
Stattdessen: je Mitspieler eine Karte mit fünf Feldern. In der Auflösung
dieselbe Karte, ergänzt um die echten Würfel und die Tipps aller anderen. Die
einzige echte Tabelle ist die Bestenliste — sie hat nur drei Spalten.

## Warum Firebase Realtime Database?

Der Wunsch, dass alle dieselbe Runde sehen, verlangt eine Stelle außerhalb der
Besucher-Browser. GitHub Pages liefert nur unveränderliche Dateien aus.

| Weg | Bewertung |
|---|---|
| **Firebase Realtime Database über REST** | **Gewählt.** Konto anlegen, Datenbank erzeugen, Adresse eintragen — fertig. Keine Bibliothek, kein Bauschritt, kein Server im Haus. |
| Supabase | Gleichwertig, aber mehr Begriffe für dieselbe Aufgabe. |
| Eigener PowerShell-Server im Haus (Muster Helpdesk) | Passt zum Haus-Stil, scheitert am Ziel: die Seite soll öffentlich erreichbar sein, nicht nur im Haus-Netz. |
| GitHub als Speicher (Datei per API schreiben) | Verlangt einen Schreib-Token in der öffentlichen Seite. Abgelehnt. |

Die Entscheidung ist umkehrbar: Ein anderer Dienst ist eine weitere Klasse in
`js/speicher.js` mit denselben vier Mitgliedern.

## Warum die Abfrage im Hintergrund ruht

Die Mitspieler sitzen nicht im selben Netz — sie spielen über mobile Daten,
verteilt über einen ganzen Tag. Eine Abfrage alle drei Sekunden bei offenem
Tab in der Hosentasche kostet Datenvolumen und Akku für nichts: Niemand schaut
hin, und beim Zurückkommen wird ohnehin neu geladen.

Deshalb prüft `fremdenStandHolen()` `document.hidden` und überspringt die
Abfrage im Hintergrund. Damit der Stand trotzdem sofort stimmt, hängt an
`visibilitychange` ein Anschluss, der beim Sichtbarwerden einmal holt — das
fühlt sich schneller an als vorher, obwohl weniger übertragen wird.

Nicht gebaut: das Abfrageintervall selbsttätig strecken, wenn lange nichts
passiert. Das wäre eine zweite Zeitsteuerung mit eigenem Verhalten für einen
Gewinn, den die Sichtbarkeits-Regel schon fast vollständig einsammelt. Wer
sparsamer will, erhöht `abfrageIntervallMs` in `js/konfig.js`.

## Warum kein Firebase-SDK?

Das SDK kostet eine fremde Bibliothek, einen weiteren Ladevorgang und mehr
Begriffe. Für einen Stand, der als Ganzes gelesen und geschrieben wird, genügen
zwei REST-Aufrufe. Der Preis: keine echte Ereignis-Verbindung, wir fragen alle
3 Sekunden nach. Bei einer Handvoll Mitspieler ist das unauffällig.

## Warum „letzter gewinnt" beim gleichzeitigen Arbeiten?

Die App schreibt den gesamten Stand, also gewinnt der spätere Schreibvorgang.
Feldweise Zusammenführung wäre für die erwartete Nutzung unverhältnismäßig.
Abgemildert wird es so:

- eine offene eigene Änderung wird nie von einem fremden Stand überschrieben,
- geschrieben wird verzögert, nicht bei jedem Tastendruck,
- der Kopf zeigt jederzeit, ob gespeichert ist.

Praktisch heißt das: Wenn zwei im selben Moment tippen, kann ein Tipp verloren
gehen. Beim Festlegen und Aufdecken ist das unkritisch, weil jeder nur seinen
eigenen Eintrag anfasst.

## Warum der Wert „Stern" als Wort erscheint

Haus-Regel: keine Emojis. Ein Sternzeichen wäre grenzwertig, das Wort **Stern**
ist eindeutig, wird vorgelesen und funktioniert in jeder Schriftart. Intern
heißt der Wert `"STERN"`.

## Warum es von Anfang an Tabs gibt

Ursprünglicher Wunsch: ein Tab **Würfel Quizz** als „derzeit einziger". Das
Register kostet wenige Zeilen und erspart später den Umbau der Seite.

## Bewusst abgelehnt

| Idee | Warum nicht |
|---|---|
| Anmeldung mit Passwort/Konten | Widerspricht dem Zweck: Seite aufrufen, Namen eintragen, dabei sein. |
| Verschlüsselung der ganzen Runde | Der Schlüssel müsste in der öffentlichen Seite stehen — Scheinsicherheit. Für die Würfel löst das Siegel das Problem richtig. |
| Punkte nach Position (richtiger Wert an richtiger Stelle) | Fünf gewürfelte Würfel haben keine Reihenfolge. |
| Gemeinsames Auflösen für alle auf Knopfdruck | Bis v0.2 so gebaut, auf Wunsch ersetzt: Jeder deckt nur sich selbst auf. Das Feld `phase` bleibt als Altbestand im Datenvertrag, ohne Wirkung. |
| Automatisches Auflösen zu einer festen Uhrzeit | Mehr Technik als Nutzen; jeder deckt auf, wann er will. |
| Chat oder Fragenprotokoll in der App | Die Fragen stellt man sich im echten Leben — genau das ist das Spiel. |
| Emojis für die Würfelwerte | Haus-Regel. |

## Braucht eine Nutzer-Entscheidung (nicht ungefragt bauen)

- **Firebase-Konto anlegen und Adresse eintragen** — bis dahin läuft die App im
  lokalen Rückfall (Hinweisbalken oben), und Mitspielen ist nicht möglich.
- **Regeln der Datenbank**: offen für alle (heute nötig) oder später einschränken.
- **Lizenz** für das öffentliche Repository.
- Ob es eine **Runden-Historie** geben soll (heute überschreibt eine neue Runde
  die alte).

## Versions-Historie

### v0.4 — 2026-07-31

Der Nutzer wies darauf hin, dass die Mitspieler nicht im selben Netz sind,
sondern über mobile Daten spielen. An der Erreichbarkeit ändert das nichts
(GitHub Pages und Firebase liegen beide im Internet), wohl aber an der
Sparsamkeit: Die Abfrage ruht jetzt, solange die Seite im Hintergrund liegt.

### v0.3 — 2026-07-31

Zwei Wünsche des Nutzers: jeder deckt nur für sich auf, und die eigenen Zahlen
sollen sich verstecken lassen (Grundzustand verdeckt).

Der erste Wunsch klingt nach einer Vereinfachung, zieht aber eine neue Regel
nach sich: Ohne Sperre könnte man auf jemanden tippen, der schon aufgedeckt hat.
Diese Sperre sitzt jetzt im Modell. Der gemeinsame Zustand `phase` wurde damit
überflüssig — er bleibt als Altbestand im Datenvertrag stehen, wird aber nicht
mehr ausgewertet.

Der zweite Wunsch führte zu einem gezeichneten Augen-Symbol (kein Emoji) und zu
der Festlegung, den Zustand NICHT zu speichern: Nach jedem Laden ist wieder
verdeckt, sonst würde der Knopf seinen Zweck verfehlen.

### v0.2 — 2026-07-31

Aus der Tabelle wird das Spiel. Der Nutzer beschrieb den eigentlichen Zweck:
gemeinsames Raten über die Würfel der anderen mit Auflösung am Ende.

Kern der Fassung ist das Siegel — ohne es wäre das Spiel auf einer öffentlichen
Datenbank nicht spielbar, weil jeder Mitspieler die Würfel der anderen
nachschlagen könnte. Der Datenvertrag wurde auf Fassung 2 gehoben
(`zeilen` → `spieler` mit Tipps, Phase und Siegel); alte Stände werden von
`normalisieren()` übernommen. Die Oberfläche wurde von einer Tabelle auf Karten
umgestellt, weil das Spiel auf dem Handy stattfindet.

### v0.1 — 2026-07-31

Erstes Gerüst nach dem ursprünglichen Wunsch: Tabelle mit Freitext-Namen und
fünf Auswahlfeldern, Zeilen frei erweiterbar, ein Tab **Würfel Quizz**.
Aufgeteilt in Schichten, damit die Datenlogik ohne Browser testbar bleibt und
der Speicher austauschbar ist.
