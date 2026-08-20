/*
 * versiegelung.js — wie die eigenen Würfel geheim bleiben und trotzdem
 * überprüfbar sind.
 *
 * Das Problem: Die gemeinsame Tabelle liegt in einer öffentlich erreichbaren
 * Datenbank. Stünden die echten Würfel darin, könnte jeder Mitspieler sie
 * nachschlagen — das Ratespiel wäre sinnlos.
 *
 * Die Lösung (ein Siegel, in der Fachsprache eine Festlegung):
 *
 *   1. Beim Festlegen erzeugt das Gerät ein Zufallssalz und berechnet daraus
 *      und den sortierten Würfeln eine Prüfsumme (SHA-256).
 *   2. Veröffentlicht wird NUR diese Prüfsumme. Aus ihr lassen sich die Würfel
 *      nicht zurückrechnen; alle 252 möglichen Würfe durchzuprobieren nützt
 *      nichts, weil das Salz unbekannt ist.
 *   3. Würfel und Salz bleiben allein auf dem Gerät ihres Besitzers (js\ich.js).
 *   4. Beim Auflösen veröffentlicht jedes Gerät Würfel und Salz. Jetzt kann
 *      jeder nachrechnen, dass daraus genau die vorher veröffentlichte
 *      Prüfsumme entsteht. Wer nachträglich einen anderen Wurf behauptet,
 *      fällt sofort auf.
 *
 * Sortiert wird vor dem Rechnen, weil die Reihenfolge der Würfel im Spiel
 * keine Bedeutung hat — sonst wäre dasselbe Ergebnis je nach Eingabereihenfolge
 * unterschiedlich versiegelt.
 */

const VERSIEGELUNG = {

    /* Steht die benötigte Krypto-Funktion zur Verfügung?
       Browser bieten sie nur in sicherem Zusammenhang an (HTTPS oder
       localhost) — auf GitHub Pages und beim lokalen Testen also immer. */
    verfuegbar() {
        const krypto = (typeof globalThis !== "undefined") ? globalThis.crypto : null;
        return !!(krypto && krypto.subtle && typeof krypto.subtle.digest === "function");
    },

    /* Zufälliges Salz als Hex-Zeichenkette (16 Byte). */
    salzErzeugen() {
        const krypto = globalThis.crypto;
        const bytes = new Uint8Array(16);
        krypto.getRandomValues(bytes);
        return VERSIEGELUNG._alsHex(bytes);
    },

    /*
     * Bildet die Prüfsumme aus Würfeln und Salz.
     * Liefert eine Hex-Zeichenkette, oder "" wenn keine Krypto-Funktion da ist
     * (dann läuft die Runde eben ohne Siegel weiter — die App sagt das).
     */
    async pruefwertBilden(wuerfel, salz) {
        if (!VERSIEGELUNG.verfuegbar()) {
            return "";
        }

        return VERSIEGELUNG._summeBilden(VERSIEGELUNG._textBilden(wuerfel, salz));
    },

    /* Passen Würfel und Salz zur veröffentlichten Prüfsumme? */
    async pruefen(wuerfel, salz, pruefwert) {
        if (!pruefwert) {
            return false;
        }
        const gerechnet = await VERSIEGELUNG.pruefwertBilden(wuerfel, salz);
        return gerechnet !== "" && gerechnet === pruefwert;
    },

    /* ---------------------------------------------------------------- *
     * Zahlenwörter (Spieler-PIN und Verwaltungs-Passwort)
     *
     * Dasselbe Verfahren, anderer Zweck: Gespeichert wird nie die Zahl selbst,
     * sondern nur ihre Prüfsumme. Wer die Datenbank oder den Quelltext liest,
     * findet keine Zahl zum Abtippen.
     *
     * Grenze, die man kennen muss: Vier Ziffern sind nur zehntausend
     * Möglichkeiten. Wer Prüfsumme und Salz hat und sich hinsetzt, probiert sie
     * mit einem kleinen Programm in Sekunden durch. Das ist ein Türschloss
     * unter Freunden, kein Tresor — es hält jemanden ab, der mal eben schauen
     * will, mehr nicht. Siehe docs\DECISIONS.md.
     * ---------------------------------------------------------------- */

    /* Prüfsumme einer Spieler-PIN. Das Salz steht offen in der Datenbank,
       damit jedes Gerät die PIN prüfen kann. */
    async pinPruefwertBilden(pin, salz) {
        if (!VERSIEGELUNG.verfuegbar()) {
            return "";
        }
        /*
         * ACHTUNG, DAS „quizz" HIER IST KEIN NAME, SONDERN EINE ZUTAT.
         *
         * Seit v0.89 heisst die App sichtbar „Quiz" mit einem z. Diese drei
         * Zeichenketten dürfen TROTZDEM NIE angepasst werden: Sie gehen in die
         * Prüfsumme ein. Wer hier ein z streicht, macht auf einen Schlag jede
         * gespeicherte Spieler-PIN, das Verwaltungs-Passwort und jedes Siegel
         * ungültig — laufende Runden liessen sich nicht mehr auflösen, und der
         * Fehler fiele erst beim nächsten Anmelden auf.
         *
         * Dasselbe gilt für die Speicherpfade in `konfig.js`. Begründung:
         * `docs\entscheidungen\entschieden-ab-v0-41.md`, „Sichtbarer Name und
         * technische Kennung sind zweierlei (v0.89)".
         */
        return VERSIEGELUNG._summeBilden("quizz-pin|" + String(pin || "") + "|" + String(salz || ""));
    },

    async pinPruefen(pin, salz, pruefwert) {
        if (!pruefwert) {
            return false;
        }
        const gerechnet = await VERSIEGELUNG.pinPruefwertBilden(pin, salz);
        return gerechnet !== "" && gerechnet === pruefwert;
    },

    /* Prüfsumme des Verwaltungs-Passworts. Kein Salz: Der Vergleichswert steht
       fest in js\konfig.js, es gibt nur dieses eine Passwort. */
    async verwaltungPruefwertBilden(passwort) {
        if (!VERSIEGELUNG.verfuegbar()) {
            return "";
        }
        return VERSIEGELUNG._summeBilden("quizz-admin|" + String(passwort || ""));
    },

    async verwaltungPruefen(passwort, erwartet) {
        if (!erwartet) {
            return false;
        }
        const gerechnet = await VERSIEGELUNG.verwaltungPruefwertBilden(passwort);
        return gerechnet !== "" && gerechnet === erwartet;
    },

    /* ---------------------------------------------------------------- *
     * Innereien
     * ---------------------------------------------------------------- */

    /* Die Zeichenkette, aus der die Prüfsumme entsteht. Würfel sortiert,
       damit die Eingabereihenfolge keine Rolle spielt. */
    _textBilden(wuerfel, salz) {
        const sortiert = MODELL.wuerfelSortiert(wuerfel);
        return "wuerfel-quizz|" + sortiert.join(",") + "|" + String(salz || "");
    },

    /* SHA-256 über eine beliebige Zeichenkette, als Hex. */
    async _summeBilden(text) {
        const daten = new TextEncoder().encode(text);
        const summe = await globalThis.crypto.subtle.digest("SHA-256", daten);
        return VERSIEGELUNG._alsHex(new Uint8Array(summe));
    },

    _alsHex(bytes) {
        let text = "";
        for (const byte of bytes) {
            text += byte.toString(16).padStart(2, "0");
        }
        return text;
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = VERSIEGELUNG;
}
