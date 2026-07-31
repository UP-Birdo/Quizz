/*
 * app.js — der Startpunkt: verdrahtet Speicher, Abgleich, Tabs und Dialoge.
 *
 * Reihenfolge beim Start (die Abhängigkeiten sind bewusst so und nicht anders):
 *   1. Dialoge bereitstellen,
 *   2. Speicher-Rückwand aus konfig.js wählen,
 *   3. Abgleich erzeugen und dem Tab bekannt machen,
 *   4. Tab-Leiste zeichnen (baut das Gerüst auf),
 *   5. Daten laden,
 *   6. anmelden — erst jetzt ist bekannt, wer schon mitspielt, und der Name
 *      dieses Geräts kann zugeordnet oder erfragt werden.
 */

const APP = {

    statusEl: null,
    statusTextEl: null,

    starten() {
        DIALOG.aufbauen(document.getElementById("dialog"));

        document.getElementById("app-version").textContent = "v" + KONFIG.APP_VERSION;

        APP.statusEl = document.getElementById("status");
        APP.statusTextEl = document.getElementById("status-text");

        const auswahl = speicherErzeugen(KONFIG);

        if (auswahl.hinweis) {
            APP.hinweisZeigen(auswahl.hinweis);
        }

        const abgleich = new Abgleich(auswahl.speicher, KONFIG.speicher, {
            beiDaten: (daten) => WUERFEL_QUIZZ.zeichnen(daten),
            beiStatus: (status, text) => APP.statusZeigen(status, text)
        });

        WUERFEL_QUIZZ.verbinden(abgleich);
        TABS.registrieren(WUERFEL_QUIZZ);
        TABS.starten(
            document.getElementById("tab-leiste"),
            document.getElementById("tab-inhalt")
        );

        abgleich.starten().then(() => WUERFEL_QUIZZ.anmelden());
    },

    /* status ist einer von: laedt, bereit, schreibt, fehler */
    statusZeigen(status, text) {
        if (!APP.statusEl) {
            return;
        }
        APP.statusEl.dataset.status = status;
        APP.statusTextEl.textContent = text;
    },

    hinweisZeigen(text) {
        const balken = document.getElementById("hinweis");
        balken.textContent = text;
        balken.hidden = false;
    }
};

document.addEventListener("DOMContentLoaded", APP.starten);
