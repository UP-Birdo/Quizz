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

        const text = VERSIEGELUNG._textBilden(wuerfel, salz);
        const daten = new TextEncoder().encode(text);
        const summe = await globalThis.crypto.subtle.digest("SHA-256", daten);
        return VERSIEGELUNG._alsHex(new Uint8Array(summe));
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
     * Innereien
     * ---------------------------------------------------------------- */

    /* Die Zeichenkette, aus der die Prüfsumme entsteht. Würfel sortiert,
       damit die Eingabereihenfolge keine Rolle spielt. */
    _textBilden(wuerfel, salz) {
        const sortiert = MODELL.wuerfelSortiert(wuerfel);
        return "wuerfel-quizz|" + sortiert.join(",") + "|" + String(salz || "");
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
