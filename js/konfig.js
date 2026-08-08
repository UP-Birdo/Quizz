/*
 * konfig.js — die einzige Datei, die von Hand angepasst wird.
 *
 * Hier stehen Version und Speicher-Einstellungen. Wer die App auf GitHub Pages
 * stellt, trägt unten die Adresse der Firebase-Datenbank ein — mehr ist nicht
 * nötig. Ohne Adresse läuft die App vollständig, speichert dann aber nur lokal
 * im Browser des jeweiligen Besuchers.
 *
 * Hinweis zu Bezeichnern: Namen im Code bleiben ohne Umlaute (wuerfel, aendern),
 * Kommentare und alle sichtbaren Texte werden korrekt deutsch geschrieben.
 * Siehe docs\ARCHITECTURE.md, Abschnitt Code-Konventionen.
 */

const KONFIG = {

    /* Version der App (SemVer: 0.MINOR.PATCH — die 0 vorne heisst "noch in
       Entwicklung", 1.0.0 erst bei erfuellten Fertig-Kriterien der ROADMAP).
       Wird im Kopf angezeigt und muss zu CHANGELOG.md passen.
       Umstellung 08/2026: aus v4.0 wurde v0.40.0 (alte v3.7 = 0.37). */
    APP_VERSION: "0.51.0",

    speicher: {

        /* "lokal"     — jeder Besucher hat seine eigene Tabelle (Browser-Speicher).
           "gemeinsam" — alle Besucher sehen dieselbe Tabelle (Firebase).
           Steht hier "gemeinsam", ist aber keine Basis-Adresse hinterlegt,
           fällt die App automatisch auf "lokal" zurück und sagt es im Kopf. */
        modus: "gemeinsam",

        /* Basis-Adresse der Firebase Realtime Database, OHNE Schrägstrich am
           Ende. Beispiel:
           "https://quizz-12345-default-rtdb.europe-west1.firebasedatabase.app"
           Anleitung zum Anlegen: docs\DEPLOYMENT.md */
        firebaseBasis: "https://quizz-215bd-default-rtdb.europe-west1.firebasedatabase.app",

        /* Ablage-Pfade innerhalb der Datenbank. Jeder Tab hat seinen eigenen,
           damit sich die Spiele nicht ins Gehege kommen.
           ACHTUNG: Für jeden Pfad braucht es in den Firebase-Regeln einen
           eigenen Eintrag — siehe docs\DEPLOYMENT.md, Abschnitt 2. */
        pfad: "wuerfel-quizz",
        schachPfad: "team-schach",
        imposterPfad: "imposter",

        /* Wie oft (in Millisekunden) nach fremden Änderungen gefragt wird.
           Gefragt wird nur, solange die Seite im Vordergrund ist — im
           Hintergrund ruht die Abfrage, damit sie unterwegs kein Datenvolumen
           verbraucht. Wer die Runde träger, aber noch sparsamer will, setzt
           hier einen größeren Wert (z. B. 10000 für zehn Sekunden). */
        abfrageIntervallMs: 3000,

        /* Wie lange (in Millisekunden) nach der letzten Eingabe gewartet wird,
           bevor gespeichert wird. Verhindert einen Schreibvorgang je Tastendruck. */
        schreibVerzoegerungMs: 500,

        /* Schlüssel im Browser-Speicher für den lokalen Modus, je Tab einer. */
        lokalerSchluessel: "quizz.wuerfel-quizz",
        lokalerSchluesselSchach: "quizz.team-schach",
        lokalerSchluesselImposter: "quizz.imposter"
    },

    verwaltung: {

        /*
         * Prüfsumme des Verwaltungs-Passworts (SHA-256 über
         * "quizz-admin|<passwort>"). Das Passwort selbst steht bewusst NIRGENDWO
         * in den Dateien — diese Seite ist öffentlich, jeder könnte es sonst
         * abschreiben.
         *
         * Passwort ändern: In PowerShell die neue Prüfsumme rechnen und den
         * Wert unten ersetzen. Der Text vor dem Passwort gehört dazu.
         *
         *     $text  = "quizz-admin|<neues Passwort>"
         *     $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
         *     $summe = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
         *     ($summe | ForEach-Object { $_.ToString("x2") }) -join ""
         *
         * Was die Verwaltung darf, steht in docs\ARCHITECTURE.md; was sie NICHT
         * leistet (eine sechsstellige Zahl ist durchprobierbar), in
         * docs\DECISIONS.md.
         */
        pruefwert: "6341494aa67a35049595256753abb8a68fd073311907f75a6cdb9b2d4804cc7e",

        /* Wie viele Ziffern das Verwaltungs-Passwort hat. Muss zur Prüfsumme
           oben passen, sonst lässt sich der Dialog nicht bestätigen. */
        passwortStellen: 6,

        /* Wie viele Ziffern eine Spieler-PIN hat. */
        pinStellen: 4
    }
};
