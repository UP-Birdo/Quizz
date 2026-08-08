# Auslieferung

Wie das Quizz auf GitHub Pages kommt und wie die gemeinsame Tabelle
eingerichtet wird. Reihenfolge: erst lokal prüfen, dann Datenbank, dann
hochladen.

---

## 1. Lokal prüfen

    tools\Quizz lokal starten.cmd

Doppelklick, es öffnet sich `http://localhost:8080/`. Beenden mit Strg+C im
schwarzen Fenster.

Die Seite direkt per Doppelklick auf `index.html` zu öffnen funktioniert
grundsätzlich auch, ist aber kein verlässlicher Test: unter `file://` verhalten
sich Browser-Speicher und Datenbank-Abfragen anders als später auf GitHub Pages.

### Prüfliste von Hand

Die Regressionstests decken Spiellogik und Siegel ab, nicht den Bildschirm.
Vor jeder Auslieferung zusätzlich diese Punkte durchgehen — am besten in zwei
Fenstern, damit zwei Mitspieler entstehen (zweites Fenster im privaten Modus,
sonst teilen sich beide denselben Gerätespeicher):

1. Seite lädt, im Kopf stehen Titel, Versionsnummer und ein Statuspunkt.
2. Beim ersten Aufruf fragt ein eigener Dialog **Bist du schon dabei?** mit der
   Liste der Mitspieler (leer bei leerer Runde). Über **Ich bin neu hier**:
   Name eingeben, dann zweimal die PIN — bei ungleichen Eingaben kommt eine
   Meldung und die Abfrage von vorn. Der Weiter-Knopf bleibt gesperrt, solange
   nicht genau vier Ziffern eingegeben sind.
2a. **Anmeldung von einem fremden Gerät:** Im zweiten Fenster den Namen aus der
   Liste wählen und die PIN eingeben — man ist derselbe Spieler. Mit falscher
   PIN dreimal probieren: es muss abbrechen, ohne hineinzulassen.
2c. **Profil:** Knopf **Profil** im Kopf der eigenen Karte. Name ändern muss
   sofort in beiden Fenstern sichtbar sein; PIN ändern muss zuerst die alte
   verlangen und eine falsche abweisen. Danach mit der NEUEN PIN im zweiten
   Fenster anmelden.
2b. **Verwaltung:** Knopf **Verwaltung** unten, Passwort eingeben. Danach steht
   oben *Verwaltung aktiv* und bei jedem Mitspieler erscheint
   **Spieler entfernen**. **Verwaltung beenden** schaltet zurück; nach dem
   Neuladen der Seite ist sie noch aktiv (sie hängt am Gerät).
3. Nach dem Anmelden steht oben die eigene Karte — die Würfel sind **verdeckt**
   (fünf Fragezeichen), das Auge im Kartenkopf ist geschlossen.
4. Auge antippen: Die fünf Auswahlfelder erscheinen, jedes mit `—`, `1` bis `5`
   und `Stern`. Erneut antippen versteckt sie wieder; nach dem Neuladen der
   Seite ist wieder alles verdeckt.
5. **Würfel festlegen** ist ausgegraut, solange nicht alle fünf gesetzt sind;
   danach wird der Wurf sortiert angezeigt (bei offenem Auge) mit dem Hinweis,
   dass nur man selbst ihn sieht.
6. Im zweiten Fenster erscheint der erste Spieler mit der Marke
   **hat festgelegt** — aber ohne Würfel.
7. Für den Mitspieler eine Vermutung eintragen; nach dem Neuladen steht sie noch
   da, und im anderen Fenster ist sie nicht zu sehen.
8. **Meine Würfel aufdecken** fragt nach. Danach: im eigenen Fenster
   **Siegel geprüft**, im anderen Fenster die echten Würfel, die Tipps mit
   Trefferzahl — und **keine Eingabefelder mehr** für diese Person.
9. Die andere Person bleibt weiter betippbar, solange sie nicht aufgedeckt hat.
10. **Neue Runde** setzt alles zurück, die Mitspieler bleiben.
11. **Tab Team Schach anklicken:** Die **Übersicht der Partien** muss
    **sofort** erscheinen — bei leerer Ablage mit dem Hinweis, dass noch keine
    Partie läuft, sonst mit den vorhandenen. Bleibt der Bereich leer, zeichnet
    der Tab beim Öffnen nicht — das war der Fehler aus v1.2.
11a. **Laufende Partie von früher (nur beim Umstieg auf v1.4):** Lag vorher eine
    Partie in der Datenbank, muss sie hier als **Erste Partie** stehen — mit
    denselben Teams, demselben Brett und demselben Stand wie vorher. Fehlt sie
    oder steht sie auf der Grundstellung, **nicht ausliefern**.

> **Beim Umstieg alle Geräte einmal neu laden lassen.** Ein Gerät, auf dem noch
> die Seite von vor v1.4 offen ist, kennt die Sammlung nicht: Sein nächster Zug
> schreibt wieder eine einzelne Partie an denselben Pfad. Die laufende Partie
> überlebt das (sie wird beim Laden erneut zur *Erste Partie*), aber **alle
> zusätzlich angelegten Partien wären weg**. Deshalb: nach dem Hochladen kurz
> Bescheid geben, dass jeder die Seite einmal neu lädt, und erst danach neue
> Partien anlegen. Wer die Seite auf dem Startbildschirm liegen hat, schließt
> sie einmal ganz und öffnet sie neu.
12. **Neue Partie** anlegen: Es kommt erst die Auswahl der Spielart, dann die
    Frage nach dem Namen. Danach öffnet sich die Partie selbst.
13. In einem Team **Mitspielen**, im zweiten Fenster das andere Team, beide
    **Bereit**: Die Partie startet. Eine Figur antippen zeigt Punkte auf den
    möglichen Feldern.
14. **Ziehen:** Die Figur muss vom alten Feld zum neuen **gleiten**, nicht
    springen — und zwar auch im **zweiten Fenster**, das den Zug nur über die
    Datenbank mitbekommt. Beim bloßen Warten (die Seite fragt alle drei
    Sekunden nach) darf sich die Bewegung nicht wiederholen.
15. **Zurück** führt in die Übersicht; die Partie steht dort mit ihrem neuen
    Stand. Eine zweite Partie anlegen und darin ziehen: Die erste muss
    unverändert bleiben.
16. **Jede Spielart einmal öffnen:** Kleines Brett (6 mal 6), Großes Brett
    (10 mal 8), Doppelbrett (16 mal 8), Fähigkeiten. Jedes Brett muss
    vollständig sichtbar sein, ohne dass die Seite seitlich scrollt.
17. **Fähigkeiten:** In der Spielart *Fähigkeiten sammeln* liegen vier grüne
    Punkte auf dem Brett. Mit einem Bauern auf c4 ziehen — die Fähigkeit
    erscheint unter dem Brett, der grüne Punkt verschwindet und kommt nach dem
    Neuladen der Seite **nicht** zurück. Einsetzen und die Wirkung prüfen.
18. **Löschen** einer Partie fragt nach und entfernt sie in beiden Fenstern.
19. **Tab Rangliste:** Zeigt alle Mitspieler mit Gesamtpunkten; hinter dem
    **i** steht die Rechnung. Nach einer beendeten Schachpartie muss der Sieger
    dort mehr Punkte haben.
20. Zurück auf **Würfel Quizz** und wieder auf **Team Schach**: Beide zeigen
    weiterhin ihren aktuellen Stand.
21. **Auf dem Handy** (oder im schmalen Fenster unter 600 Pixeln): Das Brett
    reicht bis an die Ränder, die beiden Teamkarten stehen nebeneinander, der
    Zugverlauf ist eingeklappt.

Zusätzlich mit einer echten Datenbank: Eine Änderung muss innerhalb weniger
Sekunden im anderen Fenster erscheinen.

> **Der lokale Server ist nur für dich.** `http://localhost:8080/` erreicht
> niemand sonst — weder im Haus-Netz noch über mobile Daten. Zum Testen zu zweit
> genügt ein zweites Browserfenster im privaten Modus (eigener Gerätespeicher,
> also ein eigener Mitspieler). Mit echten Leuten wird erst getestet, wenn die
> Seite auf GitHub Pages liegt; dort erreicht sie jeder über das Internet,
> unabhängig von WLAN oder Mobilfunk.

### Die entscheidende Prüfung

Nach dem Festlegen (Schritt 5), aber **vor** dem Aufdecken die Datenbank direkt
im Browser öffnen:

    https://<deine-datenbank>.europe-west1.firebasedatabase.app/wuerfel-quizz.json

Dort darf bei keinem Spieler ein `wuerfel`-Eintrag mit Werten stehen — nur
`pruefwert`. Ebenso wenig darf dort eine PIN als Zahl auftauchen, sondern nur
`pinPruefwert` und `pinSalz`. Steht dort ein Wurf oder eine lesbare PIN, ist das
Spiel kaputt und die Auslieferung muss warten.

---

## 2. Gemeinsame Tabelle einrichten (Firebase)

Einmalig. Bis das erledigt ist, zeigt die App oben einen Hinweisbalken und
speichert nur auf dem jeweiligen Gerät.

1. `https://console.firebase.google.com` öffnen und mit einem Google-Konto
   anmelden.
2. **Projekt hinzufügen**, Name z. B. `quizz`. Google Analytics wird nicht
   gebraucht — abwählen.
3. Links im Menü **Erstellen (Build) → Realtime Database → Datenbank erstellen**.
4. Als Standort **europe-west1** wählen (Daten bleiben in Europa).
5. Bei den Sicherheitsregeln **im gesperrten Modus starten** und die Regeln
   anschließend im Reiter **Regeln** durch genau das hier ersetzen:

       {
           "rules": {
               "wuerfel-quizz": {
                   ".read": true,
                   ".write": true
               },
               "team-schach": {
                   ".read": true,
                   ".write": true
               },
               "imposter": {
                   ".read": true,
                   ".write": true
               }
           }
       }

   Damit sind ausschließlich diese drei Pfade offen, der Rest der Datenbank
   bleibt gesperrt.

   > **Für v3.0 ist hier etwas zu tun:** Der Pfad `imposter` ist neu. Fehlt er,
   > lädt das Spiel nicht und speichert nichts — die anderen beiden Spiele
   > laufen davon unberührt weiter.

   **Jeder Tab mit eigenem Stand braucht seinen eigenen Eintrag.** Kommt später
   ein Spiel dazu, gehört sein Pfad (aus `js/konfig.js`) hier ergänzt — sonst
   kann es nichts speichern, und die App meldet einen Fehler beim Laden. Genau
   das passiert beim Umstieg auf v1.0, wenn `team-schach` fehlt. **Nicht** den
   Testmodus verwenden: der macht die ganze Datenbank auf und schließt sie nach
   30 Tagen wieder — die App würde dann ohne Vorwarnung aufhören zu speichern.

   > **Für v1.4 und v1.5 ist hier nichts zu tun.** Die mehreren Partien liegen
   > unter demselben Pfad `team-schach` wie bisher, und der Tab **Rangliste**
   > hat gar keinen eigenen Stand — er liest nur die beiden vorhandenen. Diese
   > zwei Einträge genügen also weiterhin.
6. Oben im Reiter **Daten** steht die Adresse der Datenbank, etwa
   `https://quizz-12345-default-rtdb.europe-west1.firebasedatabase.app/`.
7. Diese Adresse **ohne den Schrägstrich am Ende** in [../js/konfig.js](../js/konfig.js)
   eintragen:

       firebaseBasis: "https://quizz-12345-default-rtdb.europe-west1.firebasedatabase.app",

8. Lokal neu laden: Der Hinweisbalken verschwindet, im Kopf steht
   `Gemeinsame Tabelle für alle Besucher` mit grünem Punkt.

**Bewusst in Kauf genommen:** Wer die Seite aufruft, kann die Tabelle lesen und
ändern — ohne Anmeldung, unverschlüsselt. Deshalb gilt: nur Vor- oder
Spitznamen eintragen, nichts Vertrauliches. Siehe [DECISIONS.md](DECISIONS.md).

---

## 3. Repository anlegen (einmalig)

1. Auf `https://github.com` anmelden, oben rechts **New repository**.
2. Name: `Quizz`. Sichtbarkeit **Public** (Pages braucht das im kostenlosen
   Konto). Kein Häkchen bei „Add a README" — das README kommt aus dem Projekt.
3. **Create repository**.

## 4. Dateien hochladen

Über die GitHub-Weboberfläche, nicht über die Kommandozeile:
**Add file → Upload files**, dann die Dateien und Ordner in das Feld ziehen.

Hochladen:

| Hochladen | Warum |
|---|---|
| `index.html` | Einstiegsdatei |
| `css\` | Aussehen |
| `js\` | Programm |
| `README.md` | öffentliche Visitenkarte |
| `CHANGELOG.md` | Versionsliste |
| `docs\` | Dokumentation (unschädlich, hilft beim Mitlesen) |
| `tests\`, `tools\` | Prüf- und Hilfsskripte |

**Nicht hochladen:**

| Datei | Warum |
|---|---|
| `TODO.md` | roher Eingangskorb, bleibt lokal |
| `ROADMAP.md` | interne Planung |
| `CLAUDE.md` | Arbeitsanweisung, keine Nutzer-Information |

Unten **Commit changes** mit einer kurzen deutschen Beschreibung, z. B.
`Quizz v0.1 - erste Fassung`.

## 5. Pages einschalten (einmalig)

1. Im Repository auf **Settings**, links **Pages**.
2. Unter **Build and deployment → Source**: `Deploy from a branch`.
3. **Branch**: `main`, Ordner `/ (root)`, dann **Save**.
4. Nach ein bis zwei Minuten ist die Seite erreichbar unter
   `https://<konto>.github.io/Quizz/`.

Die Adresse steht danach oben auf derselben Seite und kann weitergegeben werden.

### Wie die Mitspieler drankommen

Sie öffnen die Adresse — mehr nicht. Keine Installation, kein Konto, kein
gemeinsames Netz: GitHub Pages und die Datenbank liegen beide im Internet, also
funktioniert es über WLAN und über mobile Daten gleichermaßen, von überall.

Zum Datenverbrauch: Die Seite fragt alle drei Sekunden nach dem Stand, aber nur
solange sie im Vordergrund ist. Wer den Tab wegschiebt, verbraucht nichts mehr.
Eine Runde über einen ganzen Tag bleibt damit im einstelligen
Megabyte-Bereich — und im kostenlosen Firebase-Kontingent (10 GB im Monat) ist
das nicht zu bemerken.

> Schlägt der Pages-Bau mit einer allgemeinen Fehlermeldung fehl, ist das
> erfahrungsgemäß oft vorübergehend: unter **Actions** den Lauf öffnen und
> **Re-run all jobs** drücken.

## 6. Neue Version ausliefern — mit dem Skript

Seit v0.8 gibt es `tools\Deploy-Quizz.ps1`. Es vergleicht die Dateien mit dem
Stand im Repository und sendet **nur die geänderten, in einem einzigen Commit**.
Das ist wichtig: GitHub Pages baut nach jedem Commit neu und erlaubt nur wenige
Bauvorgänge je Stunde.

### Einmalig: Zugriffsschlüssel hinterlegen

1. Auf `https://github.com/settings/personal-access-tokens/new` einen
   **Fine-grained token** anlegen:
   - **Repository access** → *Only select repositories* → `Quizz`
   - **Permissions** → *Repository permissions* → **Contents: Read and write**
   - Laufzeit nach Geschmack.
   - **Issues: Read and write.** Zum SCHLIESSEN erledigter Wünsche
     (`tools\Wuensche-Abholen.ps1 -Schliessen <Nr>`). Seit dem Schlüssel vom
     2026-08-08 ist das Recht gesetzt und erprobt (Wunsch #4 geschlossen).
     Fehlt es, meldet das Skript einen 403 und sagt selbst, was zu tun ist;
     das ABHOLEN der Wünsche funktioniert auch ganz ohne Token.

     **`Wuensche-Abholen.ps1` braucht PowerShell 7** (`#requires -Version 7.0`)
     — also `pwsh` aufrufen, nicht `powershell`. Mit dem alten 5.1 startet es
     gar nicht erst und meldet „erforderliche Version stimmt nicht überein".
     `Deploy-Quizz.ps1` läuft dagegen unter beiden:

         pwsh -ExecutionPolicy Bypass -File "tools\Wuensche-Abholen.ps1"
         pwsh -ExecutionPolicy Bypass -File "tools\Wuensche-Abholen.ps1" -Schliessen 4
2. Token kopieren und im Projektordner ausführen:

       powershell -ExecutionPolicy Bypass -File "tools\Deploy-Quizz.ps1" -SetToken

   Der Schlüssel wird mit Windows-Bordmitteln verschlüsselt in
   `tools\github-token.dat` abgelegt und lässt sich nur von **diesem**
   Windows-Konto auf **diesem** Rechner wieder lesen. Er steht in keiner Datei
   im Klartext und wird nie mit hochgeladen (er steht auf der Sperrliste im
   Skript).

> **ZWEI ANMELDUNGEN = ZWEI SCHLÜSSEL** (festgestellt 2026-08-08). Dieser
> Rechner wird als Domänen- und als lokaler Benutzer benutzt. Die
> Verschlüsselung (DPAPI) ist an das Windows-KONTO gebunden — unter der jeweils
> anderen Anmeldung meldet das Skript:
>
>     Der hinterlegte Schluessel laesst sich nicht lesen:
>     Schlüssel ist im angegebenen Status nicht gültig.
>
> Das ist kein Fehler und kein kaputter Token, sondern der Zweck von DPAPI.
> Anders als beim Suchen nach `Code.exe` lässt es sich **nicht** umgehen: Der
> Schlüssel kann nicht zwischen Konten geteilt werden, ohne die Verschlüsselung
> aufzugeben. Wer aus beiden Anmeldungen ausliefern will, führt `-SetToken`
> einmal je Anmeldung aus — dieselbe Datei wird dabei überschrieben, es gilt
> also immer die zuletzt eingerichtete. Einfacher ist: **immer aus derselben
> Anmeldung ausliefern.**

### Jedes Mal

1. Version in [../js/konfig.js](../js/konfig.js) um 0.1 erhöhen.
2. [../CHANGELOG.md](../CHANGELOG.md) ergänzen.
3. Tests laufen lassen: `powershell -ExecutionPolicy Bypass -File "tests\Tests-Ausfuehren.ps1"`
   — erwartet `N ok, 0 Fehler`.
4. Prüfliste aus Abschnitt 1 durchgehen.
5. Erst ansehen, was gesendet würde:

       powershell -ExecutionPolicy Bypass -File "tools\Deploy-Quizz.ps1" -NurAnzeigen

6. Dann senden:

       powershell -ExecutionPolicy Bypass -File "tools\Deploy-Quizz.ps1"

7. Bei jedem halben Schritt (v0.5, v1.0, v1.5 …) im Dev-Ordner das Voll-Backup
   ziehen: `tools\Backup-Projekt.ps1 -Projekt Quizz`.

Nach ein bis zwei Minuten ist die Seite aktuell. Was hochgeladen wird, steht als
Freigabeliste oben im Skript; `TODO.md`, `ROADMAP.md`, `CLAUDE.md` und der
Schlüssel bleiben immer liegen.

## 6b. Neue Version ausliefern — von Hand

1. Version in [../js/konfig.js](../js/konfig.js) um 0.1 erhöhen.
2. [../CHANGELOG.md](../CHANGELOG.md) ergänzen.
3. Tests laufen lassen: `powershell -ExecutionPolicy Bypass -File "tests\Tests-Ausfuehren.ps1"`
   — erwartet `N ok, 0 Fehler`.
4. Prüfliste aus Abschnitt 1 durchgehen.
5. Geänderte Dateien über **Add file → Upload files** hochladen (gleicher Name
   überschreibt) und committen.
6. Bei jedem halben Schritt (v0.5, v1.0, v1.5 …) im Dev-Ordner das Voll-Backup
   ziehen: `tools\Backup-Projekt.ps1 -Projekt Quizz`.

## Was NICHT ausgeliefert wird

- `TODO.md` und `ROADMAP.md` (interne Planung),
- `CLAUDE.md` (Arbeitsanweisung),
- alles, was nicht im Projektordner liegt.
