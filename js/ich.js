/*
 * ich.js — was nur auf DIESEM Gerät liegt.
 *
 * Zwei Dinge verlassen den eigenen Browser nicht:
 *
 *   1. Wer ich bin (Kennung und Name) — damit die Seite beim nächsten Aufruf
 *      weiß, wessen Karte oben steht. Kein Konto, kein Passwort.
 *   2. Mein Wurf (die fünf Würfel und das Salz) — bis zur Auflösung. In der
 *      gemeinsamen Datenbank steht davon nur die Prüfsumme, siehe
 *      versiegelung.js.
 *
 * Alles hier ist bewusst ausfallsicher: Ist der Browser-Speicher gesperrt oder
 * kaputt, liefert jede Funktion einen leeren Wert und die App läuft weiter.
 */

const ICH = {

    SCHLUESSEL_PERSON: "quizz.ich",
    SCHLUESSEL_WURF: "quizz.wurf.",
    SCHLUESSEL_VERWALTUNG: "quizz.verwaltung",
    SCHLUESSEL_ABSCHLUSS: "quizz.abschluss-gesehen",

    /* ---------------------------------------------------------------- *
     * Wer bin ich
     * ---------------------------------------------------------------- */

    /* Liefert { id, name } oder null, wenn sich hier noch niemand gemeldet hat. */
    person() {
        const roh = ICH._lesen(ICH.SCHLUESSEL_PERSON);
        if (!roh || typeof roh.id !== "string" || roh.id === "") {
            return null;
        }
        return {
            id: roh.id,
            name: (typeof roh.name === "string") ? roh.name : ""
        };
    },

    personSetzen(id, name) {
        ICH._schreiben(ICH.SCHLUESSEL_PERSON, { id: id, name: name });
    },

    personVergessen() {
        ICH._loeschen(ICH.SCHLUESSEL_PERSON);
    },

    /* ---------------------------------------------------------------- *
     * Mein Wurf (geheim bis zur Auflösung)
     * ---------------------------------------------------------------- */

    /* Liefert { wuerfel, salz } oder null. */
    wurf(spielerId) {
        const roh = ICH._lesen(ICH.SCHLUESSEL_WURF + spielerId);
        if (!roh || !Array.isArray(roh.wuerfel)) {
            return null;
        }
        return {
            wuerfel: MODELL.wuerfelNormalisieren(roh.wuerfel),
            salz: (typeof roh.salz === "string") ? roh.salz : ""
        };
    },

    wurfSetzen(spielerId, wuerfel, salz) {
        ICH._schreiben(ICH.SCHLUESSEL_WURF + spielerId, {
            wuerfel: MODELL.wuerfelNormalisieren(wuerfel),
            salz: String(salz || "")
        });
    },

    wurfVergessen(spielerId) {
        ICH._loeschen(ICH.SCHLUESSEL_WURF + spielerId);
    },

    /* ---------------------------------------------------------------- *
     * Verwaltung
     *
     * Merkt sich auf DIESEM Gerät, dass das Verwaltungs-Passwort einmal richtig
     * eingegeben wurde. Es steht bewusst nur ein Schalter hier und nirgends das
     * Passwort — wer den Gerätespeicher liest, gewinnt nichts, was er nicht
     * ohnehin schon hätte.
     * ---------------------------------------------------------------- */

    verwaltungAktiv() {
        return ICH._lesen(ICH.SCHLUESSEL_VERWALTUNG) === true;
    },

    verwaltungSetzen(aktiv) {
        if (aktiv) {
            ICH._schreiben(ICH.SCHLUESSEL_VERWALTUNG, true);
        } else {
            ICH._loeschen(ICH.SCHLUESSEL_VERWALTUNG);
        }
    },

    /* ---------------------------------------------------------------- *
     * Gesehene Abschlüsse
     *
     * Welche beendeten Partien dieses Gerät schon abgeschlossen gesehen hat.
     * Das gehört hierher und nicht in den Arbeitsspeicher: Sonst käme der
     * Sieger-Bildschirm nach jedem Neuladen erneut — und in den gemeinsamen
     * Stand gehört es erst recht nicht, denn es ist eine Eigenschaft des
     * Geräts, nicht der Partie.
     * ---------------------------------------------------------------- */

    abschlussGesehen(partieId) {
        const liste = ICH._lesen(ICH.SCHLUESSEL_ABSCHLUSS);
        return Array.isArray(liste) && liste.indexOf(partieId) !== -1;
    },

    abschlussMerken(partieId) {
        if (!partieId) {
            return;
        }

        const liste = ICH._lesen(ICH.SCHLUESSEL_ABSCHLUSS);
        const neu = Array.isArray(liste) ? liste.slice() : [];

        if (neu.indexOf(partieId) !== -1) {
            return;
        }
        neu.push(partieId);

        /* Nicht endlos wachsen lassen — die ältesten fallen hinten weg. */
        while (neu.length > 100) {
            neu.shift();
        }

        ICH._schreiben(ICH.SCHLUESSEL_ABSCHLUSS, neu);
    },

    /* ---------------------------------------------------------------- *
     * Innereien
     * ---------------------------------------------------------------- */

    _lesen(schluessel) {
        try {
            const text = window.localStorage.getItem(schluessel);
            return text ? JSON.parse(text) : null;
        } catch (fehler) {
            console.warn("Gerätespeicher nicht lesbar:", fehler);
            return null;
        }
    },

    _schreiben(schluessel, wert) {
        try {
            window.localStorage.setItem(schluessel, JSON.stringify(wert));
        } catch (fehler) {
            console.warn("Gerätespeicher nicht beschreibbar:", fehler);
        }
    },

    _loeschen(schluessel) {
        try {
            window.localStorage.removeItem(schluessel);
        } catch (fehler) {
            console.warn("Gerätespeicher nicht änderbar:", fehler);
        }
    }
};
