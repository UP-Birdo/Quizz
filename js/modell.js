/*
 * modell.js — die reine Datenlogik des Würfel-Quizz.
 *
 * Das Spiel: Jeder würfelt fünf Würfel und hält sie geheim. Über den Tag stellt
 * man sich gegenseitig Fragen und trägt hier seine Vermutung ein, was die
 * anderen gewürfelt haben. Am Ende wird aufgelöst und gezählt, wer am besten
 * geraten hat.
 *
 * Hier steht KEIN Bildschirm-Code und KEIN Speicher-Code: nur die Regeln, wie
 * die Daten aussehen und wie sie sich verändern. Genau deshalb ist diese Datei
 * die einzige, die von den Regressionstests direkt geladen wird (tests\).
 *
 * Datenvertrag (additiv — Felder werden nur ERGÄNZT, nie umbenannt oder
 * gelöscht; siehe docs\ARCHITECTURE.md):
 *
 *     {
 *         "datenVersion": 2,
 *         "geaendertAm": 1750000000000,      // Millisekunden seit 1970
 *         "phase": "raten",                  // "raten" | "aufgeloest"
 *         "spieler": [
 *             {
 *                 "id": "3f2c…",             // eindeutig, unveränderlich
 *                 "name": "Anna",
 *                 "pinPruefwert": "7c1f…",   // Prüfsumme der PIN, "" = keine
 *                 "pinSalz": "a91b…",        // offen; jedes Gerät muss prüfen können
 *                 "pruefwert": "9ab3…",      // Siegel der eigenen Würfel, "" = offen
 *                 "festgelegtAm": 1750…,     // wann zuletzt festgelegt
 *                 "festlegungen": 1,         // wie oft festgelegt (Transparenz)
 *                 "wuerfel": [],             // erst NACH dem Aufdecken gefüllt
 *                 "aufgedeckt": false,
 *                 "bestaetigt": false,       // Würfel passten zum Siegel
 *                 "tipps": {                 // eigene Vermutungen
 *                     "<id des Ziels>": ["1", "", "STERN", "", ""]
 *                 }
 *             }
 *         ]
 *     }
 *
 * WICHTIG: Vor dem Aufdecken stehen die echten Würfel NIRGENDWO in diesen
 * Daten — nur ihr Prüfwert. Sie liegen bis dahin allein auf dem Gerät ihres
 * Besitzers (siehe js\ich.js und js\versiegelung.js).
 */

const MODELL = {

    /* Feste Anzahl Würfel je Spieler. */
    WUERFEL_ANZAHL: 5,

    /* Aktuelle Fassung des Datenvertrags. */
    DATEN_VERSION: 2,

    /* Der leere Wert eines Würfel-Feldes (noch nichts gewählt). */
    WERT_LEER: "",

    /* Alle wählbaren Würfel-Werte, in der Reihenfolge der Auswahlliste. */
    WERTE: ["1", "2", "3", "4", "5", "STERN"],

    /*
     * Das Feld "phase" stammt aus v0.2, als eine Runde für alle gemeinsam
     * aufgelöst wurde. Seit v0.3 deckt jeder für sich auf, es gibt keinen
     * gemeinsamen Zustand mehr. Das Feld bleibt im Datenvertrag erhalten
     * (nichts wird gelöscht) und wird unverändert durchgereicht — ausgewertet
     * wird es nirgends mehr.
     */
    PHASE_RATEN: "raten",
    PHASE_AUFGELOEST: "aufgeloest",

    /* ---------------------------------------------------------------- *
     * Werte
     * ---------------------------------------------------------------- */

    /* Beschriftung eines Wertes für die Oberfläche. */
    wertBeschriftung(wert) {
        if (wert === MODELL.WERT_LEER || wert === null || wert === undefined) {
            return "—";
        }
        if (wert === "STERN") {
            return "Stern";
        }
        return String(wert);
    },

    /* Ist der Wert ein erlaubter Würfel-Wert (leer zählt als erlaubt)? */
    wertGueltig(wert) {
        if (wert === MODELL.WERT_LEER || wert === null || wert === undefined) {
            return true;
        }
        return MODELL.WERTE.indexOf(String(wert)) !== -1;
    },

    /* Ein Satz leerer Würfel-Werte. */
    leereWuerfel() {
        const werte = [];
        for (let i = 0; i < MODELL.WUERFEL_ANZAHL; i++) {
            werte.push(MODELL.WERT_LEER);
        }
        return werte;
    },

    /* Bereinigt eine beliebige Liste zu genau fünf gültigen Werten. */
    wuerfelNormalisieren(rohliste) {
        const liste = Array.isArray(rohliste) ? rohliste : [];
        const werte = MODELL.leereWuerfel();
        for (let i = 0; i < MODELL.WUERFEL_ANZAHL; i++) {
            const wert = liste[i];
            werte[i] = (MODELL.wertGueltig(wert) && wert) ? String(wert) : MODELL.WERT_LEER;
        }
        return werte;
    },

    /* Sind alle fünf Würfel gesetzt? Nur dann darf festgelegt werden. */
    wuerfelVollstaendig(liste) {
        const werte = MODELL.wuerfelNormalisieren(liste);
        return werte.every((wert) => wert !== MODELL.WERT_LEER);
    },

    /*
     * Sortiert Würfel für die Anzeige (1 bis 5, dann Stern, Leeres ans Ende).
     * Die Reihenfolge der Würfel ist im Spiel bedeutungslos — sortiert liest
     * sich ein Wurf deutlich schneller.
     */
    wuerfelSortiert(liste) {
        const rang = (wert) => {
            const stelle = MODELL.WERTE.indexOf(wert);
            return (stelle === -1) ? MODELL.WERTE.length : stelle;
        };
        return MODELL.wuerfelNormalisieren(liste).slice().sort((a, b) => rang(a) - rang(b));
    },

    /* ---------------------------------------------------------------- *
     * Grundstrukturen
     * ---------------------------------------------------------------- */

    /* Erzeugt eine neue, möglichst eindeutige Kennung.
       Die Tests übergeben stattdessen eine feste Kennung. */
    idErzeugen() {
        const krypto = (typeof globalThis !== "undefined") ? globalThis.crypto : null;
        if (krypto && typeof krypto.randomUUID === "function") {
            return krypto.randomUUID();
        }
        MODELL._zaehler = (MODELL._zaehler || 0) + 1;
        return "spieler-" + Date.now() + "-" + MODELL._zaehler;
    },

    /* Ein neuer Spieler ohne Würfel und ohne Tipps. */
    neuerSpieler(name, id) {
        return {
            id: id || MODELL.idErzeugen(),
            name: (name === undefined || name === null) ? "" : String(name),
            pinPruefwert: "",
            pinSalz: "",
            pruefwert: "",
            festgelegtAm: 0,
            festlegungen: 0,
            wuerfel: [],
            aufgedeckt: false,
            bestaetigt: false,
            tipps: {}
        };
    },

    /* Ein leerer, gültiger Datenstand. */
    leereDaten(zeitpunkt) {
        return {
            datenVersion: MODELL.DATEN_VERSION,
            geaendertAm: (zeitpunkt === undefined) ? 0 : zeitpunkt,
            phase: MODELL.PHASE_RATEN,
            spieler: []
        };
    },

    /*
     * Bringt einen beliebigen (auch alten, halben oder kaputten) Datenstand auf
     * die aktuelle Fassung. Das ist die Nachrüst-Stelle des additiven
     * Datenvertrags: fehlende Felder werden ERGÄNZT, vorhandene nie verworfen.
     * Liefert immer einen gültigen Stand — notfalls einen leeren.
     *
     * Fassung 1 kannte statt "spieler" noch "zeilen" mit offen sichtbaren
     * Würfeln. Solche Stände werden übernommen: der Name bleibt, die Würfel
     * gelten als noch nicht festgelegt.
     */
    normalisieren(rohdaten) {
        const daten = MODELL.leereDaten();

        if (!rohdaten || typeof rohdaten !== "object") {
            return daten;
        }

        if (typeof rohdaten.geaendertAm === "number" && isFinite(rohdaten.geaendertAm)) {
            daten.geaendertAm = rohdaten.geaendertAm;
        }

        if (rohdaten.phase === MODELL.PHASE_AUFGELOEST) {
            daten.phase = MODELL.PHASE_AUFGELOEST;
        }

        /* Fassung 2 heißt "spieler", Fassung 1 hieß "zeilen". */
        const rohliste = Array.isArray(rohdaten.spieler) ? rohdaten.spieler
            : (Array.isArray(rohdaten.zeilen) ? rohdaten.zeilen : []);

        for (const roh of rohliste) {
            if (!roh || typeof roh !== "object") {
                continue;
            }

            const spieler = MODELL.neuerSpieler(
                (typeof roh.name === "string") ? roh.name : "",
                (typeof roh.id === "string" && roh.id !== "") ? roh.id : undefined
            );

            if (typeof roh.pinPruefwert === "string") {
                spieler.pinPruefwert = roh.pinPruefwert;
            }
            if (typeof roh.pinSalz === "string") {
                spieler.pinSalz = roh.pinSalz;
            }
            if (typeof roh.pruefwert === "string") {
                spieler.pruefwert = roh.pruefwert;
            }
            if (typeof roh.festgelegtAm === "number" && isFinite(roh.festgelegtAm)) {
                spieler.festgelegtAm = roh.festgelegtAm;
            }
            if (typeof roh.festlegungen === "number" && isFinite(roh.festlegungen)) {
                spieler.festlegungen = Math.max(0, Math.floor(roh.festlegungen));
            }

            spieler.aufgedeckt = (roh.aufgedeckt === true);
            spieler.bestaetigt = (roh.bestaetigt === true);

            /* Würfel stehen nur nach dem Aufdecken im gemeinsamen Stand. */
            if (spieler.aufgedeckt) {
                spieler.wuerfel = MODELL.wuerfelNormalisieren(roh.wuerfel);
            }

            /* Tipps: Zuordnung Ziel-Kennung -> fünf Werte. */
            if (roh.tipps && typeof roh.tipps === "object") {
                for (const zielId of Object.keys(roh.tipps)) {
                    spieler.tipps[zielId] = MODELL.wuerfelNormalisieren(roh.tipps[zielId]);
                }
            }

            daten.spieler.push(spieler);
        }

        return daten;
    },

    /* Tiefe Kopie eines Datenstandes — damit nie versehentlich der Ausgangsstand
       verändert wird. */
    kopieren(daten) {
        return MODELL.normalisieren(daten);
    },

    /* ---------------------------------------------------------------- *
     * Suchen
     * ---------------------------------------------------------------- */

    spielerFinden(daten, id) {
        const stand = MODELL.normalisieren(daten);
        return stand.spieler.find((spieler) => spieler.id === id) || null;
    },

    /* Sucht ohne Rücksicht auf Groß- und Kleinschreibung — damit dieselbe
       Person nach einem Gerätewechsel ihren Platz wiederfindet. */
    spielerNachName(daten, name) {
        const gesucht = String(name || "").trim().toLowerCase();
        if (gesucht === "") {
            return null;
        }
        const stand = MODELL.normalisieren(daten);
        return stand.spieler.find((spieler) => spieler.name.trim().toLowerCase() === gesucht) || null;
    },

    /* ---------------------------------------------------------------- *
     * Änderungen — jede liefert einen NEUEN Stand
     * ---------------------------------------------------------------- */

    spielerHinzufuegen(daten, name, id, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        neu.spieler.push(MODELL.neuerSpieler(name, id));
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Entfernt einen Spieler und alle Tipps, die auf ihn zeigen. */
    spielerEntfernen(daten, id, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        neu.spieler = neu.spieler.filter((spieler) => spieler.id !== id);
        for (const spieler of neu.spieler) {
            delete spieler.tipps[id];
        }
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Hinterlegt die PIN eines Spielers — gespeichert wird nur die Prüfsumme
     * und das zugehörige Salz, nie die Ziffern selbst (siehe versiegelung.js).
     * Damit kann sich dieselbe Person später von einem anderen Gerät aus wieder
     * als sie selbst anmelden.
     */
    pinSetzen(daten, id, pinPruefwert, pinSalz, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        for (const spieler of neu.spieler) {
            if (spieler.id === id) {
                spieler.pinPruefwert = String(pinPruefwert || "");
                spieler.pinSalz = String(pinSalz || "");
            }
        }
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Hat der Spieler eine PIN hinterlegt? Nur dann ist er von einem fremden
       Gerät aus erreichbar. */
    hatPin(spieler) {
        return !!(spieler && spieler.pinPruefwert && spieler.pinSalz);
    },

    nameSetzen(daten, id, name, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        for (const spieler of neu.spieler) {
            if (spieler.id === id) {
                spieler.name = (name === undefined || name === null) ? "" : String(name);
            }
        }
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Legt die eigenen Würfel fest: veröffentlicht wird NUR der Prüfwert.
     * Jede erneute Festlegung wird mitgezählt und mit Zeitpunkt festgehalten —
     * so ist für alle sichtbar, wenn jemand seinen Wurf nachträglich ändert.
     */
    pruefwertSetzen(daten, id, pruefwert, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;

        for (const spieler of neu.spieler) {
            if (spieler.id === id) {
                spieler.pruefwert = String(pruefwert || "");
                spieler.festgelegtAm = wann;
                spieler.festlegungen = spieler.festlegungen + 1;
                /* Eine neue Festlegung macht ein früheres Aufdecken ungültig. */
                spieler.aufgedeckt = false;
                spieler.bestaetigt = false;
                spieler.wuerfel = [];
            }
        }
        neu.geaendertAm = wann;
        return neu;
    },

    /*
     * Setzt einen einzelnen Würfel einer Vermutung.
     *
     * Abgewiesen wird der Versuch, wenn das Ziel bereits aufgedeckt hat: Sonst
     * könnte man nach der Auflösung noch schnell den richtigen Wert eintragen.
     * Diese Sperre ist die Gegenleistung dafür, dass jeder für sich allein
     * aufdeckt, wann er will.
     */
    tippSetzen(daten, raterId, zielId, spalte, wert, zeitpunkt) {
        const neu = MODELL.kopieren(daten);

        if (!Number.isInteger(spalte) || spalte < 0 || spalte >= MODELL.WUERFEL_ANZAHL) {
            return neu;
        }
        if (!MODELL.wertGueltig(wert)) {
            return neu;
        }
        if (raterId === zielId) {
            /* Auf sich selbst wird nicht getippt. */
            return neu;
        }

        const ziel = neu.spieler.find((spieler) => spieler.id === zielId);
        if (!ziel || ziel.aufgedeckt) {
            return neu;
        }

        for (const spieler of neu.spieler) {
            if (spieler.id === raterId) {
                if (!spieler.tipps[zielId]) {
                    spieler.tipps[zielId] = MODELL.leereWuerfel();
                }
                spieler.tipps[zielId][spalte] = wert ? String(wert) : MODELL.WERT_LEER;
            }
        }
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Liefert die Vermutung eines Spielers über einen anderen (immer fünf Werte). */
    tippLesen(daten, raterId, zielId) {
        const rater = MODELL.spielerFinden(daten, raterId);
        if (!rater) {
            return MODELL.leereWuerfel();
        }
        return MODELL.wuerfelNormalisieren(rater.tipps[zielId]);
    },

    /*
     * Deckt die Würfel eines Spielers auf. Das macht immer nur sein eigenes
     * Gerät, und zwar wann er will — es gibt keine gemeinsame Auflösung.
     * `bestaetigt` sagt, ob die Würfel zum veröffentlichten Prüfwert gepasst
     * haben; geprüft wird das in versiegelung.js, nicht hier.
     */
    aufdecken(daten, id, wuerfel, bestaetigt, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        for (const spieler of neu.spieler) {
            if (spieler.id === id) {
                spieler.wuerfel = MODELL.wuerfelNormalisieren(wuerfel);
                spieler.aufgedeckt = true;
                spieler.bestaetigt = (bestaetigt === true);
            }
        }
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Neue Runde: Die Spieler bleiben, alles Rundenbezogene wird geleert.
     * Wer einmal mitspielt, muss sich nicht neu anmelden.
     */
    neueRunde(daten, zeitpunkt) {
        const neu = MODELL.kopieren(daten);
        neu.phase = MODELL.PHASE_RATEN;
        for (const spieler of neu.spieler) {
            spieler.pruefwert = "";
            spieler.festgelegtAm = 0;
            spieler.festlegungen = 0;
            spieler.wuerfel = [];
            spieler.aufgedeckt = false;
            spieler.bestaetigt = false;
            spieler.tipps = {};
        }
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* ---------------------------------------------------------------- *
     * Auswertung
     * ---------------------------------------------------------------- */

    /*
     * Wie viele Würfel einer Vermutung stimmen?
     *
     * Die Reihenfolge ist bedeutungslos, die Anzahl gleicher Werte zählt:
     * echt [1,1,3,5,Stern] gegen Tipp [1,3,3,5,5] ergibt 3 Treffer
     * (eine 1, eine 3, eine 5). Ein doppelt geratener Wert zählt also nur so
     * oft, wie er wirklich vorkommt. Leere Felder zählen nie.
     */
    treffer(echteWuerfel, tipp) {
        const vorrat = {};
        for (const wert of MODELL.wuerfelNormalisieren(echteWuerfel)) {
            if (wert !== MODELL.WERT_LEER) {
                vorrat[wert] = (vorrat[wert] || 0) + 1;
            }
        }

        let anzahl = 0;
        for (const wert of MODELL.wuerfelNormalisieren(tipp)) {
            if (wert !== MODELL.WERT_LEER && vorrat[wert] > 0) {
                vorrat[wert] = vorrat[wert] - 1;
                anzahl++;
            }
        }
        return anzahl;
    },

    /* ---------------------------------------------------------------- *
     * Punkte
     *
     * Die Regeln stehen an genau dieser Stelle im Code und werden in der App
     * unter dem i-Knopf im selben Wortlaut angezeigt (siehe PUNKTE_ERKLAERUNG).
     * Wer hier etwas ändert, ändert dort mit.
     * ---------------------------------------------------------------- */

    /* Punkte für einen exakt geratenen Würfelwert. */
    PUNKTE_EXAKT: 10,

    /*
     * Punkte für einen knapp danebenliegenden Wert, nach Abstand.
     * Stelle 0 ist der Abstand 1, Stelle 1 der Abstand 2 und so weiter.
     */
    PUNKTE_NAH: [4, 2],

    /* Bonus für den besten Tipp auf eine aufgedeckte Person. */
    PUNKTE_BONUS: 5,

    /* Höchstpunktzahl für eine einzelne Person (fünf exakte Würfel + Bonus). */
    punkteMaximum() {
        return MODELL.WUERFEL_ANZAHL * MODELL.PUNKTE_EXAKT + MODELL.PUNKTE_BONUS;
    },

    /*
     * Bewertet eine einzelne Vermutung gegen den echten Wurf.
     * Liefert { exakt, nah, punkte } — ohne den Bonus, der erst im Vergleich
     * mit den anderen Ratern entsteht.
     *
     * Vorgehen:
     *   1. Exakte Übereinstimmungen als Multimenge herausrechnen (Reihenfolge
     *      spielt nie eine Rolle).
     *   2. Was übrig bleibt, wird der Größe nach gepaart: kleinster Restwert
     *      zum kleinsten, zweitkleinster zum zweitkleinsten. Bei sortierten
     *      Listen ist diese Paarung nachweislich die mit dem kleinsten
     *      Gesamtabstand — sie bewertet den Rater also so gut wie möglich.
     *   3. Jedes Paar bringt Punkte nach seinem Abstand.
     *
     * Der Stern ist keine Zahl und hat deshalb zu nichts einen Abstand: Er
     * zählt nur, wenn er exakt getroffen wurde.
     */
    punkte(echteWuerfel, tipp) {
        const echt = MODELL.wuerfelNormalisieren(echteWuerfel);
        const geraten = MODELL.wuerfelNormalisieren(tipp);

        /* Schritt 1: exakte Paare herausnehmen. */
        const vorrat = {};
        for (const wert of echt) {
            if (wert !== MODELL.WERT_LEER) {
                vorrat[wert] = (vorrat[wert] || 0) + 1;
            }
        }

        let exakt = 0;
        const restTipp = [];
        for (const wert of geraten) {
            if (wert !== MODELL.WERT_LEER && vorrat[wert] > 0) {
                vorrat[wert] = vorrat[wert] - 1;
                exakt++;
            } else if (wert !== MODELL.WERT_LEER && wert !== "STERN") {
                restTipp.push(Number(wert));
            }
        }

        /* Was vom echten Wurf übrig blieb — Sterne zählen nicht mit. */
        const restEcht = [];
        for (const wert of Object.keys(vorrat)) {
            for (let i = 0; i < vorrat[wert]; i++) {
                if (wert !== "STERN") {
                    restEcht.push(Number(wert));
                }
            }
        }

        /* Schritt 2 und 3: der Größe nach paaren und nach Abstand bewerten. */
        restEcht.sort((a, b) => a - b);
        restTipp.sort((a, b) => a - b);

        let nah = 0;
        let nahPunkte = 0;
        const paare = Math.min(restEcht.length, restTipp.length);

        for (let i = 0; i < paare; i++) {
            const abstand = Math.abs(restEcht[i] - restTipp[i]);
            const punkte = MODELL.PUNKTE_NAH[abstand - 1] || 0;
            if (punkte > 0) {
                nah++;
                nahPunkte += punkte;
            }
        }

        return {
            exakt: exakt,
            nah: nah,
            punkte: exakt * MODELL.PUNKTE_EXAKT + nahPunkte
        };
    },

    /*
     * Ergebnis der Runde, nach Punkten absteigend sortiert (bei Gleichstand
     * alphabetisch). Gezählt wird nur gegen Spieler, die bereits aufgedeckt
     * haben — solange nicht alle aufgedeckt sind, ist es ein Zwischenstand.
     *
     * Der Bonus geht an den besten Tipp auf eine Person; liegen mehrere gleich
     * vorn, bekommen ihn alle. Wer null Punkte hat, bekommt keinen Bonus —
     * sonst würde in einer Runde ohne jeden Treffer der Bonus verlost.
     */
    ergebnis(daten) {
        const stand = MODELL.normalisieren(daten);
        const aufgedeckte = stand.spieler.filter((spieler) => spieler.aufgedeckt);

        /* Erst je aufgedeckter Person alle Vermutungen bewerten. */
        const bewertung = {};
        for (const rater of stand.spieler) {
            bewertung[rater.id] = { punkte: 0, exakt: 0, nah: 0, bonus: 0, moeglich: 0 };
        }

        for (const ziel of aufgedeckte) {
            let bestpunkte = 0;

            for (const rater of stand.spieler) {
                if (rater.id === ziel.id) {
                    continue;
                }
                const einzeln = MODELL.punkte(ziel.wuerfel, rater.tipps[ziel.id]);
                const eintrag = bewertung[rater.id];

                eintrag.punkte += einzeln.punkte;
                eintrag.exakt += einzeln.exakt;
                eintrag.nah += einzeln.nah;
                eintrag.moeglich += MODELL.punkteMaximum();

                if (einzeln.punkte > bestpunkte) {
                    bestpunkte = einzeln.punkte;
                }
            }

            /* Bonus an alle, die auf diese Person am besten lagen. */
            if (bestpunkte > 0) {
                for (const rater of stand.spieler) {
                    if (rater.id === ziel.id) {
                        continue;
                    }
                    if (MODELL.punkte(ziel.wuerfel, rater.tipps[ziel.id]).punkte === bestpunkte) {
                        bewertung[rater.id].bonus += MODELL.PUNKTE_BONUS;
                        bewertung[rater.id].punkte += MODELL.PUNKTE_BONUS;
                    }
                }
            }
        }

        const liste = stand.spieler.map((rater) => ({
            id: rater.id,
            name: rater.name,
            punkte: bewertung[rater.id].punkte,
            exakt: bewertung[rater.id].exakt,
            nah: bewertung[rater.id].nah,
            bonus: bewertung[rater.id].bonus,
            moeglich: bewertung[rater.id].moeglich
        }));

        liste.sort((a, b) => {
            if (b.punkte !== a.punkte) {
                return b.punkte - a.punkte;
            }
            return a.name.localeCompare(b.name, "de");
        });

        return liste;
    },

    /*
     * Die Punkteregeln im Wortlaut, für den i-Knopf im Punktestand.
     * Steht hier, damit Anzeige und Rechnung nicht auseinanderlaufen können.
     */
    punkteErklaerung() {
        const nah = MODELL.PUNKTE_NAH;
        return "So werden die Punkte vergeben:\n\n"
            + "Für jeden Würfel, den du genau richtig geraten hast: "
                + MODELL.PUNKTE_EXAKT + " Punkte.\n"
            + "Für jeden Würfel, der um 1 danebenlag: " + nah[0] + " Punkte.\n"
            + "Für jeden Würfel, der um 2 danebenlag: " + nah[1] + " Punkte.\n"
            + "Weiter daneben: keine Punkte.\n\n"
            + "Wer auf eine Person am besten getippt hat, bekommt zusätzlich "
                + MODELL.PUNKTE_BONUS + " Punkte. Liegen mehrere gleichauf, "
                + "bekommen sie den Bonus alle.\n\n"
            + "Die Reihenfolge der Würfel zählt nie. Zuerst werden die genau "
            + "richtigen Werte verrechnet, der Rest wird der Größe nach gepaart — "
            + "immer so, wie es für dich am besten ist.\n\n"
            + "Der Stern ist keine Zahl und hat zu keiner Zahl einen Abstand: "
            + "Für ihn gibt es Punkte nur, wenn du ihn genau getroffen hast.\n\n"
            + "Beispiel: Der Wurf ist 1, 2, 3, 4, 5 und du tippst 1, 2, 3, 4, 4. "
            + "Vier Würfel sitzen genau (" + (4 * MODELL.PUNKTE_EXAKT) + " Punkte), "
            + "die 4 liegt um 1 neben der 5 (" + nah[0] + " Punkte) — macht "
            + (4 * MODELL.PUNKTE_EXAKT + nah[0]) + " Punkte.\n\n"
            + "Gezählt wird nur gegen Mitspieler, die schon aufgedeckt haben. "
            + "Der Punktestand wächst also mit jeder Person, die aufdeckt.";
    },

    /* ---------------------------------------------------------------- *
     * Zusammenführen — der Schutz gegen gegenseitiges Überschreiben
     * ---------------------------------------------------------------- */

    /*
     * Fügt den eigenen Stand in den fremden ein, statt ihn zu überschreiben.
     *
     * Warum das nötig ist: Geschrieben wird immer der GANZE Stand. Ohne
     * Zusammenführung verschwindet jeder, der sich anmeldet, während ein
     * anderes Gerät noch den alten Stand im Speicher hat — dessen nächster
     * Schreibvorgang löscht ihn wieder. Auf dem betroffenen Gerät merkt die App
     * dann, dass es sich selbst nicht mehr gibt, meldet ab und fragt erneut nach
     * dem Namen. Das war der Fehler, der wie ein mehrfaches Neuladen der Seite
     * aussah (siehe docs\DECISIONS.md).
     *
     * Die Regel dagegen ist einfach und passt genau zum Spiel:
     * **Jeder ist Herr über seinen eigenen Eintrag, alles andere kommt vom
     * Server.** Jeder ändert ohnehin nur sich selbst — auch die eigenen
     * Vermutungen stehen im eigenen Eintrag.
     *
     * Ausnahmen sind Aktionen, die absichtlich fremde Einträge ändern (neue
     * Runde, Spieler entfernen). Die schreiben ohne Zusammenführung; siehe
     * abgleich.js.
     */
    zusammenfuehren(fremd, eigen, eigeneId) {
        const fremdStand = MODELL.normalisieren(fremd);
        const eigenStand = MODELL.normalisieren(eigen);

        const meiner = eigenStand.spieler.find((spieler) => spieler.id === eigeneId) || null;

        const ergebnis = MODELL.leereDaten(eigenStand.geaendertAm);
        ergebnis.phase = eigenStand.phase;

        let selbstGefunden = false;

        for (const spieler of fremdStand.spieler) {
            if (meiner && spieler.id === eigeneId) {
                ergebnis.spieler.push(meiner);
                selbstGefunden = true;
            } else {
                ergebnis.spieler.push(spieler);
            }
        }

        /* Gerade erst angemeldet: den eigenen Eintrag anhängen. */
        if (meiner && !selbstGefunden) {
            ergebnis.spieler.push(meiner);
        }

        return ergebnis;
    },

    /* ---------------------------------------------------------------- *
     * Vergleich (steuert das Neuzeichnen beim gemeinsamen Speicher)
     * ---------------------------------------------------------------- */

    /*
     * Vergleicht zwei Stände INHALTLICH (ohne Zeitstempel). Damit erkennt die
     * App, ob ein geholter Stand überhaupt neu gezeichnet werden muss — sonst
     * würde einem Tippenden das Feld unter den Fingern neu aufgebaut.
     */
    inhaltGleich(a, b) {
        const einsA = MODELL.normalisieren(a);
        const einsB = MODELL.normalisieren(b);

        if (einsA.phase !== einsB.phase) {
            return false;
        }
        if (einsA.spieler.length !== einsB.spieler.length) {
            return false;
        }

        for (let i = 0; i < einsA.spieler.length; i++) {
            const spielerA = einsA.spieler[i];
            const spielerB = einsB.spieler[i];

            if (spielerA.id !== spielerB.id
                || spielerA.name !== spielerB.name
                || spielerA.pinPruefwert !== spielerB.pinPruefwert
                || spielerA.pruefwert !== spielerB.pruefwert
                || spielerA.festlegungen !== spielerB.festlegungen
                || spielerA.aufgedeckt !== spielerB.aufgedeckt
                || spielerA.bestaetigt !== spielerB.bestaetigt
                || spielerA.wuerfel.join("|") !== spielerB.wuerfel.join("|")) {
                return false;
            }

            const zieleA = Object.keys(spielerA.tipps).sort();
            const zieleB = Object.keys(spielerB.tipps).sort();
            if (zieleA.join("|") !== zieleB.join("|")) {
                return false;
            }
            for (const zielId of zieleA) {
                if (spielerA.tipps[zielId].join("|") !== spielerB.tipps[zielId].join("|")) {
                    return false;
                }
            }
        }

        return true;
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = MODELL;
}
