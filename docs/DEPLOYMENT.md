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
2. Beim ersten Aufruf fragt ein eigener Dialog nach dem Namen (kein
   Browser-Fenster). Ohne Eingabe lässt er sich nicht bestätigen.
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
`pruefwert`. Steht dort ein Wurf, ist das Spiel kaputt und die Auslieferung
muss warten.

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
               }
           }
       }

   Damit ist ausschließlich der Pfad `wuerfel-quizz` offen, der Rest der
   Datenbank bleibt gesperrt. **Nicht** den Testmodus verwenden: der macht die
   ganze Datenbank auf und schließt sie nach 30 Tagen wieder — die App würde
   dann ohne Vorwarnung aufhören zu speichern.
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

## 6. Neue Version ausliefern

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
