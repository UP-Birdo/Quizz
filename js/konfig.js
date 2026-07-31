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

    /* Version der App. Wird im Kopf angezeigt und muss zu CHANGELOG.md passen. */
    APP_VERSION: "0.4",

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

        /* Ablage-Pfad innerhalb der Datenbank. Jeder Tab bekommt seinen eigenen
           Pfad, damit spätere Quizze sich nicht ins Gehege kommen. */
        pfad: "wuerfel-quizz",

        /* Wie oft (in Millisekunden) nach fremden Änderungen gefragt wird.
           Gefragt wird nur, solange die Seite im Vordergrund ist — im
           Hintergrund ruht die Abfrage, damit sie unterwegs kein Datenvolumen
           verbraucht. Wer die Runde träger, aber noch sparsamer will, setzt
           hier einen größeren Wert (z. B. 10000 für zehn Sekunden). */
        abfrageIntervallMs: 3000,

        /* Wie lange (in Millisekunden) nach der letzten Eingabe gewartet wird,
           bevor gespeichert wird. Verhindert einen Schreibvorgang je Tastendruck. */
        schreibVerzoegerungMs: 500,

        /* Schlüssel im Browser-Speicher für den lokalen Modus. */
        lokalerSchluessel: "quizz.wuerfel-quizz"
    }
};
