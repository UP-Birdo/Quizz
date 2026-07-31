/*
 * schach.js — die reinen Schachregeln.
 *
 * Kein Bildschirm-Code, kein Speicher-Code, keine Teams: nur Brett, Züge und
 * Regeln. Genau deshalb ist diese Datei ohne Browser testbar
 * (tests\test-schach.js).
 *
 * BRETT
 * Das Brett ist eine Zeichenkette aus 64 Zeichen, Feld 0 ist a8 (oben links
 * aus Sicht von Weiß), Feld 63 ist h1. Damit liest sich die Kette wie das
 * Brett von oben nach unten.
 *
 *     GROSSBUCHSTABE = weiss, kleinbuchstabe = schwarz, Punkt = leeres Feld
 *
 *     B/b  Bauer      T/t  Turm       S/s  Springer
 *     L/l  Läufer     D/d  Dame       K/k  König
 *
 * Die Buchstaben sind die deutschen Anfangsbuchstaben — im ganzen Projekt wird
 * deutsch benannt, auch hier.
 *
 * STAND (das, was gespeichert wird)
 *
 *     {
 *         "brett": "tsldklst...",      // 64 Zeichen
 *         "amZug": "weiss",            // "weiss" | "schwarz"
 *         "rochade": "KDkd",           // welche Rochaden noch erlaubt sind
 *         "enPassant": "",             // Zielfeld wie "e3", sonst ""
 *         "halbzuege": 0,              // seit letztem Schlag oder Bauernzug
 *         "zugNummer": 1
 *     }
 */

const SCHACH = {

    WEISS: "weiss",
    SCHWARZ: "schwarz",

    /* Die Grundstellung, Zeile für Zeile von a8 bis h1. */
    GRUNDSTELLUNG:
        "tsldklst"
        + "bbbbbbbb"
        + "........"
        + "........"
        + "........"
        + "........"
        + "BBBBBBBB"
        + "TSLDKLST",

    /* ---------------------------------------------------------------- *
     * Felder und Figuren
     * ---------------------------------------------------------------- */

    /* "e4" -> Feldnummer. Ungültige Angaben ergeben -1. */
    feldNummer(name) {
        if (typeof name !== "string" || name.length !== 2) {
            return -1;
        }
        const spalte = "abcdefgh".indexOf(name[0]);
        const reihe = "87654321".indexOf(name[1]);
        if (spalte === -1 || reihe === -1) {
            return -1;
        }
        return reihe * 8 + spalte;
    },

    /* Feldnummer -> "e4". */
    feldName(nummer) {
        if (!Number.isInteger(nummer) || nummer < 0 || nummer > 63) {
            return "";
        }
        return "abcdefgh"[nummer % 8] + "87654321"[Math.floor(nummer / 8)];
    },

    spalteVon(feld) {
        return feld % 8;
    },

    reiheVon(feld) {
        return Math.floor(feld / 8);
    },

    /* Farbe der Figur auf einem Feld, oder "" wenn leer. */
    farbeVon(figur) {
        if (!figur || figur === ".") {
            return "";
        }
        return (figur === figur.toUpperCase()) ? SCHACH.WEISS : SCHACH.SCHWARZ;
    },

    /* Figurenart ohne Farbe, immer als Grossbuchstabe. */
    artVon(figur) {
        if (!figur || figur === ".") {
            return "";
        }
        return figur.toUpperCase();
    },

    gegner(farbe) {
        return (farbe === SCHACH.WEISS) ? SCHACH.SCHWARZ : SCHACH.WEISS;
    },

    /* Ausgeschriebener Name einer Figurenart, für Meldungen. */
    artName(art) {
        const namen = {
            "B": "Bauer", "T": "Turm", "S": "Springer",
            "L": "Läufer", "D": "Dame", "K": "König"
        };
        return namen[art] || "";
    },

    /* ---------------------------------------------------------------- *
     * Stand
     * ---------------------------------------------------------------- */

    neuerStand() {
        return {
            brett: SCHACH.GRUNDSTELLUNG,
            amZug: SCHACH.WEISS,
            rochade: "KDkd",
            enPassant: "",
            halbzuege: 0,
            zugNummer: 1
        };
    },

    /* Bringt einen beliebigen Stand auf eine gültige Form. */
    standNormalisieren(roh) {
        const stand = SCHACH.neuerStand();

        if (!roh || typeof roh !== "object") {
            return stand;
        }

        if (typeof roh.brett === "string" && roh.brett.length === 64
            && /^[BTSLDKbtsldk.]{64}$/.test(roh.brett)) {
            stand.brett = roh.brett;
        }
        if (roh.amZug === SCHACH.SCHWARZ) {
            stand.amZug = SCHACH.SCHWARZ;
        }
        if (typeof roh.rochade === "string" && /^[KDkd]*$/.test(roh.rochade)) {
            stand.rochade = roh.rochade;
        }
        if (typeof roh.enPassant === "string" && SCHACH.feldNummer(roh.enPassant) !== -1) {
            stand.enPassant = roh.enPassant;
        }
        if (typeof roh.halbzuege === "number" && isFinite(roh.halbzuege) && roh.halbzuege >= 0) {
            stand.halbzuege = Math.floor(roh.halbzuege);
        }
        if (typeof roh.zugNummer === "number" && isFinite(roh.zugNummer) && roh.zugNummer >= 1) {
            stand.zugNummer = Math.floor(roh.zugNummer);
        }

        return stand;
    },

    figurAuf(stand, feld) {
        if (feld < 0 || feld > 63) {
            return "";
        }
        return stand.brett[feld];
    },

    /* Liefert eine Kopie des Bretts mit einem geänderten Feld. */
    _brettMit(brett, feld, figur) {
        return brett.substring(0, feld) + figur + brett.substring(feld + 1);
    },

    /* Feld des Königs einer Farbe, oder -1. */
    koenigFeld(stand, farbe) {
        const gesucht = (farbe === SCHACH.WEISS) ? "K" : "k";
        return stand.brett.indexOf(gesucht);
    },

    /* ---------------------------------------------------------------- *
     * Zugerzeugung
     *
     * Zweistufig, wie üblich:
     *   _rohzuege  — was die Figur ihrer Gangart nach dürfte
     *   zuege      — davon nur die, nach denen der eigene König nicht im
     *                Schach steht
     * ---------------------------------------------------------------- */

    /*
     * Alle erlaubten Züge einer Figur. Liefert eine Liste aus
     * { von, nach, art, schlaegt, rochade, enPassant, umwandlung }.
     */
    zuege(stand, von) {
        const figur = SCHACH.figurAuf(stand, von);
        const farbe = SCHACH.farbeVon(figur);

        if (!farbe || farbe !== stand.amZug) {
            return [];
        }

        return SCHACH._rohzuege(stand, von).filter((zug) => {
            const danach = SCHACH._ausfuehren(stand, zug);
            return !SCHACH.imSchach(danach, farbe);
        });
    },

    /* Alle erlaubten Züge der Seite, die am Zug ist. */
    alleZuege(stand) {
        const liste = [];
        for (let feld = 0; feld < 64; feld++) {
            if (SCHACH.farbeVon(SCHACH.figurAuf(stand, feld)) === stand.amZug) {
                for (const zug of SCHACH.zuege(stand, feld)) {
                    liste.push(zug);
                }
            }
        }
        return liste;
    },

    _rohzuege(stand, von) {
        const figur = SCHACH.figurAuf(stand, von);
        const farbe = SCHACH.farbeVon(figur);
        const art = SCHACH.artVon(figur);

        if (!farbe) {
            return [];
        }

        switch (art) {
            case "B": return SCHACH._bauernzuege(stand, von, farbe);
            case "S": return SCHACH._springerzuege(stand, von, farbe);
            case "L": return SCHACH._strahlzuege(stand, von, farbe, [[-1, -1], [-1, 1], [1, -1], [1, 1]]);
            case "T": return SCHACH._strahlzuege(stand, von, farbe, [[-1, 0], [1, 0], [0, -1], [0, 1]]);
            case "D": return SCHACH._strahlzuege(stand, von, farbe,
                [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]);
            case "K": return SCHACH._koenigszuege(stand, von, farbe);
            default: return [];
        }
    },

    /* Baut einen Zug-Eintrag. */
    _zug(stand, von, nach, zusatz) {
        const eintrag = {
            von: von,
            nach: nach,
            art: SCHACH.artVon(SCHACH.figurAuf(stand, von)),
            schlaegt: SCHACH.figurAuf(stand, nach) !== ".",
            rochade: "",
            enPassant: false,
            umwandlung: ""
        };
        return Object.assign(eintrag, zusatz || {});
    },

    _imBrett(reihe, spalte) {
        return reihe >= 0 && reihe < 8 && spalte >= 0 && spalte < 8;
    },

    _strahlzuege(stand, von, farbe, richtungen) {
        const liste = [];
        const reihe = SCHACH.reiheVon(von);
        const spalte = SCHACH.spalteVon(von);

        for (const richtung of richtungen) {
            let r = reihe + richtung[0];
            let s = spalte + richtung[1];

            while (SCHACH._imBrett(r, s)) {
                const ziel = r * 8 + s;
                const dort = SCHACH.figurAuf(stand, ziel);

                if (dort === ".") {
                    liste.push(SCHACH._zug(stand, von, ziel));
                } else {
                    if (SCHACH.farbeVon(dort) !== farbe) {
                        liste.push(SCHACH._zug(stand, von, ziel));
                    }
                    break;
                }

                r += richtung[0];
                s += richtung[1];
            }
        }

        return liste;
    },

    _springerzuege(stand, von, farbe) {
        const liste = [];
        const reihe = SCHACH.reiheVon(von);
        const spalte = SCHACH.spalteVon(von);
        const spruenge = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];

        for (const sprung of spruenge) {
            const r = reihe + sprung[0];
            const s = spalte + sprung[1];
            if (!SCHACH._imBrett(r, s)) {
                continue;
            }
            const ziel = r * 8 + s;
            if (SCHACH.farbeVon(SCHACH.figurAuf(stand, ziel)) !== farbe) {
                liste.push(SCHACH._zug(stand, von, ziel));
            }
        }

        return liste;
    },

    _koenigszuege(stand, von, farbe) {
        const liste = [];
        const reihe = SCHACH.reiheVon(von);
        const spalte = SCHACH.spalteVon(von);

        for (let dr = -1; dr <= 1; dr++) {
            for (let ds = -1; ds <= 1; ds++) {
                if (dr === 0 && ds === 0) {
                    continue;
                }
                const r = reihe + dr;
                const s = spalte + ds;
                if (!SCHACH._imBrett(r, s)) {
                    continue;
                }
                const ziel = r * 8 + s;
                if (SCHACH.farbeVon(SCHACH.figurAuf(stand, ziel)) !== farbe) {
                    liste.push(SCHACH._zug(stand, von, ziel));
                }
            }
        }

        /* Rochade: König zwei Felder zur Seite, Turm springt darüber.
           Bedingungen: Recht noch vorhanden, Felder dazwischen frei, König
           steht nicht im Schach und zieht über kein bedrohtes Feld. */
        const grundreihe = (farbe === SCHACH.WEISS) ? 7 : 0;
        const koenigStart = grundreihe * 8 + 4;

        if (von === koenigStart && !SCHACH.imSchach(stand, farbe)) {
            const rechte = (farbe === SCHACH.WEISS) ? ["K", "D"] : ["k", "d"];

            /* Kurze Rochade (Königsflügel). */
            if (stand.rochade.indexOf(rechte[0]) !== -1
                && SCHACH.figurAuf(stand, koenigStart + 1) === "."
                && SCHACH.figurAuf(stand, koenigStart + 2) === "."
                && !SCHACH._feldBedroht(stand, koenigStart + 1, SCHACH.gegner(farbe))) {
                liste.push(SCHACH._zug(stand, von, koenigStart + 2, { rochade: "kurz" }));
            }

            /* Lange Rochade (Damenflügel). */
            if (stand.rochade.indexOf(rechte[1]) !== -1
                && SCHACH.figurAuf(stand, koenigStart - 1) === "."
                && SCHACH.figurAuf(stand, koenigStart - 2) === "."
                && SCHACH.figurAuf(stand, koenigStart - 3) === "."
                && !SCHACH._feldBedroht(stand, koenigStart - 1, SCHACH.gegner(farbe))) {
                liste.push(SCHACH._zug(stand, von, koenigStart - 2, { rochade: "lang" }));
            }
        }

        return liste;
    },

    _bauernzuege(stand, von, farbe) {
        const liste = [];
        const richtung = (farbe === SCHACH.WEISS) ? -1 : 1;
        const reihe = SCHACH.reiheVon(von);
        const spalte = SCHACH.spalteVon(von);
        const startreihe = (farbe === SCHACH.WEISS) ? 6 : 1;
        const letzteReihe = (farbe === SCHACH.WEISS) ? 0 : 7;

        const anhaengen = (zug) => {
            if (SCHACH.reiheVon(zug.nach) === letzteReihe) {
                /* Umwandlung: vier Möglichkeiten, jede ein eigener Zug. */
                for (const art of ["D", "T", "L", "S"]) {
                    liste.push(Object.assign({}, zug, { umwandlung: art }));
                }
            } else {
                liste.push(zug);
            }
        };

        /* Ein Feld vor. */
        const einsVor = (reihe + richtung) * 8 + spalte;
        if (SCHACH._imBrett(reihe + richtung, spalte) && SCHACH.figurAuf(stand, einsVor) === ".") {
            anhaengen(SCHACH._zug(stand, von, einsVor));

            /* Zwei Felder aus der Grundstellung. */
            const zweiVor = (reihe + 2 * richtung) * 8 + spalte;
            if (reihe === startreihe && SCHACH.figurAuf(stand, zweiVor) === ".") {
                liste.push(SCHACH._zug(stand, von, zweiVor));
            }
        }

        /* Schlagen, schräg. */
        for (const ds of [-1, 1]) {
            const r = reihe + richtung;
            const s = spalte + ds;
            if (!SCHACH._imBrett(r, s)) {
                continue;
            }
            const ziel = r * 8 + s;
            const dort = SCHACH.figurAuf(stand, ziel);

            if (dort !== "." && SCHACH.farbeVon(dort) !== farbe) {
                anhaengen(SCHACH._zug(stand, von, ziel));
            } else if (dort === "." && stand.enPassant && SCHACH.feldNummer(stand.enPassant) === ziel) {
                /* En passant: schlägt den Bauern, der gerade zwei Felder zog. */
                liste.push(SCHACH._zug(stand, von, ziel, { enPassant: true, schlaegt: true }));
            }
        }

        return liste;
    },

    /* ---------------------------------------------------------------- *
     * Bedrohung und Schach
     * ---------------------------------------------------------------- */

    /*
     * Wird das Feld von der angegebenen Farbe angegriffen?
     * Bewusst ohne _rohzuege, um keine Endlosschleife über die Rochade zu
     * bauen: Hier wird von jedem Feld aus rückwärts gedacht.
     */
    _feldBedroht(stand, feld, farbe) {
        const reihe = SCHACH.reiheVon(feld);
        const spalte = SCHACH.spalteVon(feld);

        /* Bauern. */
        const bauernRichtung = (farbe === SCHACH.WEISS) ? 1 : -1;
        for (const ds of [-1, 1]) {
            const r = reihe + bauernRichtung;
            const s = spalte + ds;
            if (SCHACH._imBrett(r, s)) {
                const dort = SCHACH.figurAuf(stand, r * 8 + s);
                if (SCHACH.artVon(dort) === "B" && SCHACH.farbeVon(dort) === farbe) {
                    return true;
                }
            }
        }

        /* Springer. */
        for (const sprung of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
            const r = reihe + sprung[0];
            const s = spalte + sprung[1];
            if (SCHACH._imBrett(r, s)) {
                const dort = SCHACH.figurAuf(stand, r * 8 + s);
                if (SCHACH.artVon(dort) === "S" && SCHACH.farbeVon(dort) === farbe) {
                    return true;
                }
            }
        }

        /* König (Nachbarfelder). */
        for (let dr = -1; dr <= 1; dr++) {
            for (let ds = -1; ds <= 1; ds++) {
                if (dr === 0 && ds === 0) {
                    continue;
                }
                const r = reihe + dr;
                const s = spalte + ds;
                if (SCHACH._imBrett(r, s)) {
                    const dort = SCHACH.figurAuf(stand, r * 8 + s);
                    if (SCHACH.artVon(dort) === "K" && SCHACH.farbeVon(dort) === farbe) {
                        return true;
                    }
                }
            }
        }

        /* Turm und Dame gerade, Läufer und Dame schräg. */
        const strahlen = [
            { richtungen: [[-1, 0], [1, 0], [0, -1], [0, 1]], arten: ["T", "D"] },
            { richtungen: [[-1, -1], [-1, 1], [1, -1], [1, 1]], arten: ["L", "D"] }
        ];

        for (const strahl of strahlen) {
            for (const richtung of strahl.richtungen) {
                let r = reihe + richtung[0];
                let s = spalte + richtung[1];

                while (SCHACH._imBrett(r, s)) {
                    const dort = SCHACH.figurAuf(stand, r * 8 + s);
                    if (dort !== ".") {
                        if (SCHACH.farbeVon(dort) === farbe
                            && strahl.arten.indexOf(SCHACH.artVon(dort)) !== -1) {
                            return true;
                        }
                        break;
                    }
                    r += richtung[0];
                    s += richtung[1];
                }
            }
        }

        return false;
    },

    /* Steht der König dieser Farbe im Schach? */
    imSchach(stand, farbe) {
        const koenig = SCHACH.koenigFeld(stand, farbe);
        if (koenig === -1) {
            return false;
        }
        return SCHACH._feldBedroht(stand, koenig, SCHACH.gegner(farbe));
    },

    /* ---------------------------------------------------------------- *
     * Ziehen
     * ---------------------------------------------------------------- */

    /* Führt einen Zug aus, OHNE Prüfung auf Schach — nur intern. */
    _ausfuehren(stand, zug) {
        const neu = {
            brett: stand.brett,
            amZug: SCHACH.gegner(stand.amZug),
            rochade: stand.rochade,
            enPassant: "",
            halbzuege: stand.halbzuege + 1,
            zugNummer: stand.zugNummer + ((stand.amZug === SCHACH.SCHWARZ) ? 1 : 0)
        };

        const figur = SCHACH.figurAuf(stand, zug.von);
        const farbe = SCHACH.farbeVon(figur);
        const art = SCHACH.artVon(figur);

        let brett = neu.brett;

        /* Grundbewegung. */
        brett = SCHACH._brettMit(brett, zug.von, ".");
        const zielFigur = zug.umwandlung
            ? ((farbe === SCHACH.WEISS) ? zug.umwandlung : zug.umwandlung.toLowerCase())
            : figur;
        brett = SCHACH._brettMit(brett, zug.nach, zielFigur);

        /* En passant: der geschlagene Bauer steht nicht auf dem Zielfeld. */
        if (zug.enPassant) {
            const opferReihe = SCHACH.reiheVon(zug.von);
            const opfer = opferReihe * 8 + SCHACH.spalteVon(zug.nach);
            brett = SCHACH._brettMit(brett, opfer, ".");
        }

        /* Rochade: der Turm zieht mit. */
        if (zug.rochade === "kurz") {
            const grund = SCHACH.reiheVon(zug.von) * 8;
            brett = SCHACH._brettMit(brett, grund + 7, ".");
            brett = SCHACH._brettMit(brett, grund + 5, (farbe === SCHACH.WEISS) ? "T" : "t");
        } else if (zug.rochade === "lang") {
            const grund = SCHACH.reiheVon(zug.von) * 8;
            brett = SCHACH._brettMit(brett, grund + 0, ".");
            brett = SCHACH._brettMit(brett, grund + 3, (farbe === SCHACH.WEISS) ? "T" : "t");
        }

        neu.brett = brett;

        /* Rochaderechte verfallen, sobald König oder Turm bewegt wurden —
           oder ein Turm geschlagen wird. */
        let rechte = neu.rochade;
        const streichen = (zeichen) => {
            rechte = rechte.split(zeichen).join("");
        };

        if (art === "K") {
            if (farbe === SCHACH.WEISS) { streichen("K"); streichen("D"); }
            else { streichen("k"); streichen("d"); }
        }
        if (zug.von === 63 || zug.nach === 63) { streichen("K"); }
        if (zug.von === 56 || zug.nach === 56) { streichen("D"); }
        if (zug.von === 7 || zug.nach === 7) { streichen("k"); }
        if (zug.von === 0 || zug.nach === 0) { streichen("d"); }
        neu.rochade = rechte;

        /* Doppelschritt eines Bauern eröffnet en passant. */
        if (art === "B" && Math.abs(SCHACH.reiheVon(zug.nach) - SCHACH.reiheVon(zug.von)) === 2) {
            const zwischen = (SCHACH.reiheVon(zug.von) + SCHACH.reiheVon(zug.nach)) / 2 * 8
                + SCHACH.spalteVon(zug.von);
            neu.enPassant = SCHACH.feldName(zwischen);
        }

        /* Zähler für die Fünfzig-Züge-Regel. */
        if (art === "B" || zug.schlaegt) {
            neu.halbzuege = 0;
        }

        return neu;
    },

    /*
     * Zieht, wenn der Zug erlaubt ist. Liefert { stand, zug, text } oder null.
     * `umwandlung` ist "D", "T", "L" oder "S" und wird nur bei einem
     * Bauernzug auf die letzte Reihe beachtet.
     */
    ziehen(stand, von, nach, umwandlung) {
        const moeglich = SCHACH.zuege(stand, von);

        const passende = moeglich.filter((zug) => zug.nach === nach);
        if (passende.length === 0) {
            return null;
        }

        let zug = passende[0];
        if (passende.length > 1) {
            /* Mehrere Züge auf dasselbe Feld gibt es nur bei der Umwandlung. */
            const gewaehlt = passende.find((eintrag) => eintrag.umwandlung === (umwandlung || "D"));
            zug = gewaehlt || passende[0];
        }

        return {
            stand: SCHACH._ausfuehren(stand, zug),
            zug: zug,
            text: SCHACH.zugText(stand, zug)
        };
    },

    /* Kurzbeschreibung eines Zuges in Worten, für den Verlauf. */
    zugText(stand, zug) {
        if (zug.rochade === "kurz") {
            return "Rochade kurz";
        }
        if (zug.rochade === "lang") {
            return "Rochade lang";
        }

        const art = SCHACH.artName(zug.art);
        const trennung = zug.schlaegt ? " schlägt auf " : " nach ";
        let text = art + " " + SCHACH.feldName(zug.von) + trennung + SCHACH.feldName(zug.nach);

        if (zug.umwandlung) {
            text += ", wird " + SCHACH.artName(zug.umwandlung);
        }
        return text;
    },

    /* ---------------------------------------------------------------- *
     * Spielende
     * ---------------------------------------------------------------- */

    /*
     * Liefert den Zustand der Partie:
     *   { art: "laeuft" | "matt" | "patt" | "remis", sieger, text }
     */
    lage(stand) {
        const hatZuege = SCHACH.alleZuege(stand).length > 0;
        const schach = SCHACH.imSchach(stand, stand.amZug);
        const amZugName = (stand.amZug === SCHACH.WEISS) ? "Weiss" : "Schwarz";

        if (!hatZuege && schach) {
            const sieger = SCHACH.gegner(stand.amZug);
            return {
                art: "matt",
                sieger: sieger,
                text: "Schachmatt — " + ((sieger === SCHACH.WEISS) ? "Weiss" : "Schwarz") + " gewinnt."
            };
        }

        if (!hatZuege) {
            return { art: "patt", sieger: "", text: "Patt — unentschieden." };
        }

        if (stand.halbzuege >= 100) {
            return {
                art: "remis",
                sieger: "",
                text: "Unentschieden nach der Fünfzig-Züge-Regel."
            };
        }

        if (schach) {
            return { art: "laeuft", sieger: "", text: amZugName + " steht im Schach." };
        }

        return { art: "laeuft", sieger: "", text: amZugName + " ist am Zug." };
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH;
}
