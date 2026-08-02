/*
 * schach-runde.js — EINE Partie mit ihren beiden Teams.
 *
 * schach.js kennt nur die Regeln; hier kommt dazu, WER ziehen darf und wie der
 * gemeinsame Stand aussieht. Auch diese Datei ist ohne Browser testbar.
 *
 * Seit v1.4 laufen mehrere Partien nebeneinander. Die Sammlung aller Partien
 * liegt in schach-tafel.js — diese Datei kennt immer nur eine einzelne.
 *
 * Die wichtigste Hausregel dieser Partie:
 * **Innerhalb eines Teams gibt es keine Reihenfolge.** Jeder aus dem Team, das
 * am Zug ist, darf ziehen — wer zuerst drückt, hat gezogen. Der Wechsel
 * zwischen Weiss und Schwarz bleibt normales Schach.
 *
 * Datenvertrag (additiv — Felder nur ERGÄNZEN):
 *
 *     {
 *         "datenVersion": 1,
 *         "id": "p-1",                 // Kennung innerhalb der Tafel
 *         "titel": "Partie 1",         // frei wählbarer Name
 *         "variante": "standard",      // Spielart, siehe schach-varianten.js
 *         "erstelltAm": 1750000000000,
 *         "geaendertAm": 1750000000000,
 *         "stand": { … },              // Brett und Zugrecht, siehe schach.js
 *         "zugZaehler": 0,             // steigt mit jedem Zug; die Sperre
 *                                      // gegen zwei gleichzeitige Züge
 *         "laeuft": false,
 *         "ergebnis": "",              // "", "weiss", "schwarz", "remis"
 *         "teams":  { "weiss": ["id"], "schwarz": ["id"] },
 *         "bereit": { "weiss": false, "schwarz": false },
 *         "faehigkeiten": { "weiss": ["sprung"], "schwarz": [] },
 *         "bonusGesammelt": [26],      // schon eingesammelte Bonusfelder
 *         "verlauf": [ { "text": "Bauer e2 nach e4", "wer": "Anna",
 *                        "farbe": "weiss", "von": 52, "nach": 36 } ]
 *     }
 *
 * Warum die EINGESAMMELTEN Bonusfelder gespeichert werden und nicht die
 * verbliebenen: Firebase wirft leere Listen weg. Eine leere Liste
 * „verbliebene Felder" käme als „nicht vorhanden" zurück und würde beim
 * Normalisieren wieder mit allen Feldern gefüllt — die Fähigkeiten lägen
 * plötzlich wieder auf dem Brett. Bei den eingesammelten stimmt „nicht
 * vorhanden" mit „noch keins eingesammelt" überein.
 */

const SCHACH_RUNDE = {

    DATEN_VERSION: 1,

    /* So viele Züge bleiben im Verlauf stehen. */
    VERLAUF_LAENGE: 40,

    leereRunde(zeitpunkt, varianteId, id, titel) {
        const variante = SCHACH_VARIANTEN.holen(varianteId);
        const wann = (zeitpunkt === undefined) ? 0 : zeitpunkt;

        return {
            datenVersion: SCHACH_RUNDE.DATEN_VERSION,
            id: id || "",
            titel: titel || "",
            variante: variante.id,
            erstelltAm: wann,
            geaendertAm: wann,
            stand: SCHACH.neuerStand(variante.id),
            zugZaehler: 0,
            laeuft: false,
            ergebnis: "",
            teams: { weiss: [], schwarz: [] },
            bereit: { weiss: false, schwarz: false },
            faehigkeiten: { weiss: [], schwarz: [] },
            bonusGesammelt: [],
            verlauf: []
        };
    },

    normalisieren(roh) {
        /* Die Spielart steht an der Partie; ältere Stände tragen sie höchstens
           im Brett-Stand. Ohne Angabe gilt das klassische Brett. */
        let varianteId = SCHACH_VARIANTEN.STANDARD;
        if (roh && typeof roh.variante === "string" && SCHACH_VARIANTEN.gibtEs(roh.variante)) {
            varianteId = roh.variante;
        } else if (roh && roh.stand && typeof roh.stand.variante === "string"
            && SCHACH_VARIANTEN.gibtEs(roh.stand.variante)) {
            varianteId = roh.stand.variante;
        }

        const runde = SCHACH_RUNDE.leereRunde(undefined, varianteId);

        if (!roh || typeof roh !== "object") {
            return runde;
        }

        if (typeof roh.id === "string") {
            runde.id = roh.id;
        }
        if (typeof roh.titel === "string") {
            runde.titel = roh.titel;
        }
        if (typeof roh.erstelltAm === "number" && isFinite(roh.erstelltAm)) {
            runde.erstelltAm = roh.erstelltAm;
        }
        if (typeof roh.geaendertAm === "number" && isFinite(roh.geaendertAm)) {
            runde.geaendertAm = roh.geaendertAm;
        }

        /* Der Brett-Stand bekommt die Spielart der Partie mit, damit die Maße
           auch dann stimmen, wenn nur die Partie sie kennt. */
        runde.stand = SCHACH.standNormalisieren(
            Object.assign({}, roh.stand, { variante: varianteId })
        );
        runde.laeuft = (roh.laeuft === true);

        if (["weiss", "schwarz", "remis"].indexOf(roh.ergebnis) !== -1) {
            runde.ergebnis = roh.ergebnis;
        }
        if (typeof roh.zugZaehler === "number" && isFinite(roh.zugZaehler) && roh.zugZaehler >= 0) {
            runde.zugZaehler = Math.floor(roh.zugZaehler);
        }

        for (const farbe of ["weiss", "schwarz"]) {
            const liste = (roh.teams && Array.isArray(roh.teams[farbe])) ? roh.teams[farbe] : [];
            runde.teams[farbe] = liste
                .filter((id) => typeof id === "string" && id !== "")
                .filter((id, stelle, alle) => alle.indexOf(id) === stelle);

            runde.bereit[farbe] = !!(roh.bereit && roh.bereit[farbe] === true);

            const koennen = (roh.faehigkeiten && Array.isArray(roh.faehigkeiten[farbe]))
                ? roh.faehigkeiten[farbe]
                : [];
            runde.faehigkeiten[farbe] = koennen
                .filter((art) => typeof art === "string" && SCHACH_VARIANTEN.FAEHIGKEITEN[art]);
        }

        if (Array.isArray(roh.bonusGesammelt)) {
            runde.bonusGesammelt = roh.bonusGesammelt
                .filter((feld) => Number.isInteger(feld) && feld >= 0)
                .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle);
        }

        if (Array.isArray(roh.verlauf)) {
            for (const eintrag of roh.verlauf) {
                if (eintrag && typeof eintrag.text === "string") {
                    runde.verlauf.push({
                        text: eintrag.text,
                        wer: (typeof eintrag.wer === "string") ? eintrag.wer : "",
                        farbe: (eintrag.farbe === "schwarz") ? "schwarz" : "weiss",
                        von: Number.isInteger(eintrag.von) ? eintrag.von : -1,
                        nach: Number.isInteger(eintrag.nach) ? eintrag.nach : -1
                    });
                }
            }
        }

        return runde;
    },

    kopieren(runde) {
        return SCHACH_RUNDE.normalisieren(runde);
    },

    /* Die Spielart dieser Partie. */
    varianteVon(runde) {
        return SCHACH_VARIANTEN.holen(runde ? runde.variante : "");
    },

    /* ---------------------------------------------------------------- *
     * Bonusfelder und Fähigkeiten
     * ---------------------------------------------------------------- */

    /* Welche Bonusfelder liegen noch auf dem Brett? */
    offeneBonusFelder(runde) {
        const variante = SCHACH_RUNDE.varianteVon(runde);
        const gesammelt = Array.isArray(runde.bonusGesammelt) ? runde.bonusGesammelt : [];

        return variante.bonusFelder.filter((eintrag) => gesammelt.indexOf(eintrag.feld) === -1);
    },

    /*
     * Setzt eine Fähigkeit ein. Wirkt auf den Brett-Stand und verbraucht sie.
     * Der Zugzähler steigt mit, damit zwei Geräte sich nicht gegenseitig
     * überschreiben — genau wie bei einem Zug.
     */
    faehigkeitEinsetzen(runde, spielerId, art, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const stelle = alt.faehigkeiten[farbe].indexOf(art);
        if (stelle === -1) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        neu.faehigkeiten[farbe].splice(stelle, 1);

        if (art === "sprung") {
            neu.stand.sprungAktiv = farbe;
        } else if (art === "doppelzug") {
            neu.stand.extraZug = farbe;
        } else {
            return null;
        }

        neu.zugZaehler = alt.zugZaehler + 1;
        neu.verlauf.push({
            text: "Fähigkeit " + SCHACH_VARIANTEN.faehigkeitTitel(art) + " eingesetzt",
            wer: wer || "",
            farbe: farbe,
            von: -1,
            nach: -1
        });
        SCHACH_RUNDE._verlaufKuerzen(neu);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    _verlaufKuerzen(runde) {
        while (runde.verlauf.length > SCHACH_RUNDE.VERLAUF_LAENGE) {
            runde.verlauf.shift();
        }
    },

    /* ---------------------------------------------------------------- *
     * Teams
     * ---------------------------------------------------------------- */

    /* In welchem Team ist der Spieler? "" wenn in keinem. */
    teamVon(runde, spielerId) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        if (stand.teams.weiss.indexOf(spielerId) !== -1) {
            return "weiss";
        }
        if (stand.teams.schwarz.indexOf(spielerId) !== -1) {
            return "schwarz";
        }
        return "";
    },

    /*
     * Tritt einem Team bei — auch mitten im Spiel, das ist ausdrücklich
     * gewollt. Ein Wechsel entfernt aus dem anderen Team.
     */
    teamBeitreten(runde, spielerId, farbe, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        if (!spielerId || (farbe !== "weiss" && farbe !== "schwarz")) {
            return neu;
        }

        neu.teams.weiss = neu.teams.weiss.filter((id) => id !== spielerId);
        neu.teams.schwarz = neu.teams.schwarz.filter((id) => id !== spielerId);
        neu.teams[farbe].push(spielerId);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    teamVerlassen(runde, spielerId, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);
        neu.teams.weiss = neu.teams.weiss.filter((id) => id !== spielerId);
        neu.teams.schwarz = neu.teams.schwarz.filter((id) => id !== spielerId);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    bereitSetzen(runde, farbe, bereit, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        if (farbe !== "weiss" && farbe !== "schwarz") {
            return neu;
        }
        neu.bereit[farbe] = (bereit === true);

        /* Sobald beide Seiten bereit sind und in jedem Team jemand steht,
           beginnt die Partie von selbst. */
        if (SCHACH_RUNDE.kannStarten(neu)) {
            neu.laeuft = true;
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    kannStarten(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        return stand.teams.weiss.length > 0
            && stand.teams.schwarz.length > 0
            && stand.bereit.weiss
            && stand.bereit.schwarz;
    },

    /* Darf dieser Spieler gerade ziehen? */
    darfZiehen(runde, spielerId) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (!stand.laeuft || stand.ergebnis) {
            return false;
        }
        const team = SCHACH_RUNDE.teamVon(stand, spielerId);
        if (!team) {
            return false;
        }
        return team === stand.stand.amZug;
    },

    /* ---------------------------------------------------------------- *
     * Ziehen
     * ---------------------------------------------------------------- */

    /*
     * Führt einen Zug aus. Liefert die neue Runde oder null, wenn der Zug
     * nicht erlaubt ist (falsches Team, Partie nicht am Laufen, Regelverstoss).
     *
     * `wer` ist der Anzeigename für den Verlauf — nur Beiwerk, die Regeln
     * hängen nicht daran.
     */
    ziehen(runde, spielerId, von, nach, umwandlung, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        const ergebnis = SCHACH.ziehen(alt.stand, von, nach, umwandlung);
        if (!ergebnis) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        const farbe = alt.stand.amZug;

        neu.stand = ergebnis.stand;
        neu.zugZaehler = alt.zugZaehler + 1;

        neu.verlauf.push({
            text: ergebnis.text,
            wer: wer || "",
            farbe: farbe,
            von: von,
            nach: nach
        });
        SCHACH_RUNDE._verlaufKuerzen(neu);

        /* Liegt auf dem Zielfeld eine Fähigkeit, sammelt das Team sie ein. */
        const bonus = SCHACH_RUNDE.offeneBonusFelder(neu)
            .find((eintrag) => eintrag.feld === nach);

        if (bonus) {
            neu.bonusGesammelt.push(bonus.feld);
            neu.faehigkeiten[farbe].push(bonus.art);
            /* Derselbe Weg wie beim Zug davor: Dieser Eintrag beschreibt
               denselben Zug. So findet der Bildschirm die Bewegung auch dann am
               Ende des Verlaufs, wenn dabei eine Fähigkeit eingesammelt wurde. */
            neu.verlauf.push({
                text: "Fähigkeit " + SCHACH_VARIANTEN.faehigkeitTitel(bonus.art) + " eingesammelt",
                wer: wer || "",
                farbe: farbe,
                von: von,
                nach: nach
            });
            SCHACH_RUNDE._verlaufKuerzen(neu);
        }

        /* Ist die Partie damit vorbei? */
        const lage = SCHACH.lage(neu.stand);
        if (lage.art === "matt") {
            neu.ergebnis = lage.sieger;
            neu.laeuft = false;
        } else if (lage.art === "patt" || lage.art === "remis") {
            neu.ergebnis = "remis";
            neu.laeuft = false;
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Neue Partie: Brett zurück, Teams bleiben, Bereitschaft muss neu kommen. */
    neuePartie(runde, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        neu.stand = SCHACH.neuerStand(neu.variante);
        neu.zugZaehler = 0;
        neu.laeuft = false;
        neu.ergebnis = "";
        neu.bereit = { weiss: false, schwarz: false };
        neu.faehigkeiten = { weiss: [], schwarz: [] };
        neu.bonusGesammelt = [];
        neu.verlauf = [];

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Aufgeben — die andere Seite gewinnt. */
    aufgeben(runde, farbe, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        if (farbe !== "weiss" && farbe !== "schwarz") {
            return neu;
        }
        if (!neu.laeuft) {
            return neu;
        }

        neu.ergebnis = (farbe === "weiss") ? "schwarz" : "weiss";
        neu.laeuft = false;
        neu.verlauf.push({
            text: ((farbe === "weiss") ? "Weiss" : "Schwarz") + " gibt auf",
            wer: "",
            farbe: farbe,
            von: -1,
            nach: -1
        });

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Umbenennen — nur Beiwerk, ändert nichts am Spiel. */
    umbenennen(runde, titel, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);
        neu.titel = String(titel || "").trim().substring(0, 40);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Kurzer Satz über den Stand der Partie, für die Übersicht. */
    kurzfassung(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (stand.ergebnis === "remis") {
            return "Unentschieden";
        }
        if (stand.ergebnis) {
            return (stand.ergebnis === "weiss") ? "Weiss hat gewonnen" : "Schwarz hat gewonnen";
        }
        if (stand.laeuft) {
            return ((stand.stand.amZug === "weiss") ? "Weiss" : "Schwarz")
                + " ist am Zug (Zug " + stand.stand.zugNummer + ")";
        }
        if (stand.teams.weiss.length === 0 && stand.teams.schwarz.length === 0) {
            return "Wartet auf Mitspieler";
        }
        return "Noch nicht gestartet";
    },

    /* ---------------------------------------------------------------- *
     * Vergleich (steuert das Neuzeichnen)
     * ---------------------------------------------------------------- */

    inhaltGleich(a, b) {
        const einsA = SCHACH_RUNDE.normalisieren(a);
        const einsB = SCHACH_RUNDE.normalisieren(b);

        return einsA.id === einsB.id
            && einsA.titel === einsB.titel
            && einsA.stand.brett === einsB.stand.brett
            && einsA.stand.amZug === einsB.stand.amZug
            && einsA.stand.sprungAktiv === einsB.stand.sprungAktiv
            && einsA.stand.extraZug === einsB.stand.extraZug
            && einsA.zugZaehler === einsB.zugZaehler
            && einsA.laeuft === einsB.laeuft
            && einsA.ergebnis === einsB.ergebnis
            && einsA.bereit.weiss === einsB.bereit.weiss
            && einsA.bereit.schwarz === einsB.bereit.schwarz
            && einsA.teams.weiss.join(",") === einsB.teams.weiss.join(",")
            && einsA.teams.schwarz.join(",") === einsB.teams.schwarz.join(",")
            && einsA.faehigkeiten.weiss.join(",") === einsB.faehigkeiten.weiss.join(",")
            && einsA.faehigkeiten.schwarz.join(",") === einsB.faehigkeiten.schwarz.join(",");
    }
};

/* Für die Tests ausserhalb des Browsers. SCHACH und SCHACH_VARIANTEN müssen
   dort vorher als globale Größen bereitstehen — genau wie im Browser. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_RUNDE;
}
