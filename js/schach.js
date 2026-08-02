/*
 * schach.js — die reinen Schachregeln.
 *
 * Kein Bildschirm-Code, kein Speicher-Code, keine Teams: nur Brett, Züge und
 * Regeln. Genau deshalb ist diese Datei ohne Browser testbar
 * (tests\test-schach.js).
 *
 * BRETT
 * Das Brett ist eine Zeichenkette aus breite * hoehe Zeichen, Feld 0 ist die
 * linke obere Ecke (a8 auf dem klassischen Brett), das letzte Zeichen die
 * rechte untere. Damit liest sich die Kette wie das Brett von oben nach unten.
 *
 *     GROSSBUCHSTABE = weiss, kleinbuchstabe = schwarz, Punkt = leeres Feld
 *
 *     B/b  Bauer      T/t  Turm       S/s  Springer
 *     L/l  Läufer     D/d  Dame       K/k  König
 *
 * Die Buchstaben sind die deutschen Anfangsbuchstaben — im ganzen Projekt wird
 * deutsch benannt, auch hier.
 *
 * SPIELARTEN
 * Wie groß das Brett ist und welche Sonderregeln gelten, steht NICHT hier,
 * sondern in schach-varianten.js. Jeder Stand trägt seine Spielart mit sich
 * (`variante`), damit die Regeln aus dem Stand allein arbeiten können. Ohne
 * Angabe gilt das klassische Brett — so laufen alle Partien aus der Zeit vor
 * den Spielarten unverändert weiter.
 *
 * STAND (das, was gespeichert wird)
 *
 *     {
 *         "variante": "standard",      // Kennung aus schach-varianten.js
 *         "breite": 8,                 // aus der Variante abgeleitet
 *         "hoehe": 8,
 *         "brett": "tsldklst...",      // breite * hoehe Zeichen
 *         "amZug": "weiss",            // "weiss" | "schwarz"
 *         "rochade": "KDkd",           // welche Rochaden noch erlaubt sind
 *         "enPassant": "",             // Zielfeld wie "e3", sonst ""
 *         "halbzuege": 0,              // seit letztem Schlag oder Bauernzug
 *         "zugNummer": 1,
 *         "extraZug": "",              // Fähigkeit: diese Farbe zieht gleich
 *                                      // noch einmal
 *         "sprungAktiv": ""            // Fähigkeit: diese Farbe darf mit einer
 *                                      // Figur zusätzlich wie ein Springer
 *     }
 */

const SCHACH = {

    WEISS: "weiss",
    SCHWARZ: "schwarz",

    /* Spaltenbuchstaben — reicht bis zu einem Brett mit 16 Spalten. */
    SPALTEN: "abcdefghijklmnop",

    /* Die klassische Grundstellung, Zeile für Zeile von a8 bis h1. */
    GRUNDSTELLUNG:
        "tsldklst"
        + "bbbbbbbb"
        + "........"
        + "........"
        + "........"
        + "........"
        + "BBBBBBBB"
        + "TSLDKLST",

    /* Springer-Sprünge, an mehreren Stellen gebraucht. */
    SPRUENGE: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],

    /* ---------------------------------------------------------------- *
     * Maße eines Standes
     *
     * Die Maße stehen im Stand; fehlen sie (alter Stand), gilt 8 mal 8.
     * ---------------------------------------------------------------- */

    breiteVon(stand) {
        return (stand && stand.breite) ? stand.breite : 8;
    },

    hoeheVon(stand) {
        return (stand && stand.hoehe) ? stand.hoehe : 8;
    },

    /* Anzahl der Felder eines Standes. */
    felderVon(stand) {
        return SCHACH.breiteVon(stand) * SCHACH.hoeheVon(stand);
    },

    /* Die Spielart eines Standes, immer eine gültige. */
    varianteVon(stand) {
        return SCHACH_VARIANTEN.holen(stand ? stand.variante : "");
    },

    /* ---------------------------------------------------------------- *
     * Felder und Figuren
     *
     * `breite` und `hoehe` sind wahlfrei; ohne Angabe gilt das klassische
     * Brett. So bleiben alle Aufrufe aus der Zeit vor den Spielarten gültig.
     * ---------------------------------------------------------------- */

    /* "e4" -> Feldnummer. Ungültige Angaben ergeben -1. */
    feldNummer(name, breite, hoehe) {
        const b = breite || 8;
        const h = hoehe || 8;

        if (typeof name !== "string" || name.length !== 2) {
            return -1;
        }
        const spalte = SCHACH.SPALTEN.indexOf(name[0]);
        const ziffer = "123456789".indexOf(name[1]) + 1;

        if (spalte === -1 || spalte >= b || ziffer < 1 || ziffer > h) {
            return -1;
        }
        /* Ziffer 1 ist die unterste Reihe, Reihe 0 ist die oberste. */
        return (h - ziffer) * b + spalte;
    },

    /* Feldnummer -> "e4". */
    feldName(nummer, breite, hoehe) {
        const b = breite || 8;
        const h = hoehe || 8;

        if (!Number.isInteger(nummer) || nummer < 0 || nummer >= b * h) {
            return "";
        }
        return SCHACH.SPALTEN[nummer % b] + String(h - Math.floor(nummer / b));
    },

    spalteVon(feld, breite) {
        return feld % (breite || 8);
    },

    reiheVon(feld, breite) {
        return Math.floor(feld / (breite || 8));
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

    /* Neuer Stand in der gewünschten Spielart (ohne Angabe: klassisch). */
    neuerStand(varianteId) {
        const variante = SCHACH_VARIANTEN.holen(varianteId);

        return {
            variante: variante.id,
            breite: variante.breite,
            hoehe: variante.hoehe,
            brett: variante.aufstellung,
            amZug: SCHACH.WEISS,
            rochade: variante.rochade ? "KDkd" : "",
            enPassant: "",
            halbzuege: 0,
            zugNummer: 1,
            extraZug: "",
            sprungAktiv: ""
        };
    },

    /* Bringt einen beliebigen Stand auf eine gültige Form. */
    standNormalisieren(roh) {
        const varianteId = (roh && typeof roh.variante === "string")
            ? roh.variante
            : SCHACH_VARIANTEN.STANDARD;
        const variante = SCHACH_VARIANTEN.holen(varianteId);
        const stand = SCHACH.neuerStand(variante.id);

        if (!roh || typeof roh !== "object") {
            return stand;
        }

        const felder = variante.breite * variante.hoehe;
        const muster = new RegExp("^[BTSLDKbtsldk.]{" + felder + "}$");

        if (typeof roh.brett === "string" && roh.brett.length === felder
            && muster.test(roh.brett)) {
            stand.brett = roh.brett;
        }
        if (roh.amZug === SCHACH.SCHWARZ) {
            stand.amZug = SCHACH.SCHWARZ;
        }
        if (typeof roh.rochade === "string" && /^[KDkd]*$/.test(roh.rochade)) {
            stand.rochade = variante.rochade ? roh.rochade : "";
        }
        if (typeof roh.enPassant === "string"
            && SCHACH.feldNummer(roh.enPassant, variante.breite, variante.hoehe) !== -1) {
            stand.enPassant = roh.enPassant;
        }
        if (typeof roh.halbzuege === "number" && isFinite(roh.halbzuege) && roh.halbzuege >= 0) {
            stand.halbzuege = Math.floor(roh.halbzuege);
        }
        if (typeof roh.zugNummer === "number" && isFinite(roh.zugNummer) && roh.zugNummer >= 1) {
            stand.zugNummer = Math.floor(roh.zugNummer);
        }
        if (roh.extraZug === SCHACH.WEISS || roh.extraZug === SCHACH.SCHWARZ) {
            stand.extraZug = roh.extraZug;
        }
        if (roh.sprungAktiv === SCHACH.WEISS || roh.sprungAktiv === SCHACH.SCHWARZ) {
            stand.sprungAktiv = roh.sprungAktiv;
        }

        return stand;
    },

    figurAuf(stand, feld) {
        if (feld < 0 || feld >= SCHACH.felderVon(stand)) {
            return "";
        }
        return stand.brett[feld];
    },

    /* Liefert eine Kopie des Bretts mit einem geänderten Feld. */
    _brettMit(brett, feld, figur) {
        return brett.substring(0, feld) + figur + brett.substring(feld + 1);
    },

    /* Feld des Königs einer Farbe, oder -1. Bei mehreren Königen das erste. */
    koenigFeld(stand, farbe) {
        const gesucht = (farbe === SCHACH.WEISS) ? "K" : "k";
        return stand.brett.indexOf(gesucht);
    },

    /* Alle Königsfelder einer Farbe — auf dem Doppelbrett sind es zwei. */
    koenigFelder(stand, farbe) {
        const gesucht = (farbe === SCHACH.WEISS) ? "K" : "k";
        const liste = [];

        for (let feld = 0; feld < SCHACH.felderVon(stand); feld++) {
            if (stand.brett[feld] === gesucht) {
                liste.push(feld);
            }
        }
        return liste;
    },

    /* ---------------------------------------------------------------- *
     * Zugerzeugung
     *
     * Zweistufig, wie üblich:
     *   _rohzuege  — was die Figur ihrer Gangart nach dürfte
     *   zuege      — davon nur die, nach denen der eigene König nicht im
     *                Schach steht
     *
     * Auf Brettern ohne Schach-Begriff (koenigSchlagbar, siehe
     * schach-varianten.js) entfällt der zweite Schritt: Dort ist der König
     * eine Figur wie jede andere.
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

        const roh = SCHACH._rohzuege(stand, von);

        if (SCHACH.varianteVon(stand).koenigSchlagbar) {
            return roh;
        }

        return roh.filter((zug) => {
            const danach = SCHACH._ausfuehren(stand, zug);
            return !SCHACH.imSchach(danach, farbe);
        });
    },

    /* Alle erlaubten Züge der Seite, die am Zug ist. */
    alleZuege(stand) {
        const liste = [];
        for (let feld = 0; feld < SCHACH.felderVon(stand); feld++) {
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

        let liste;
        switch (art) {
            case "B": liste = SCHACH._bauernzuege(stand, von, farbe); break;
            case "S": liste = SCHACH._springerzuege(stand, von, farbe); break;
            case "L": liste = SCHACH._strahlzuege(stand, von, farbe,
                [[-1, -1], [-1, 1], [1, -1], [1, 1]]); break;
            case "T": liste = SCHACH._strahlzuege(stand, von, farbe,
                [[-1, 0], [1, 0], [0, -1], [0, 1]]); break;
            case "D": liste = SCHACH._strahlzuege(stand, von, farbe,
                [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]); break;
            case "K": liste = SCHACH._koenigszuege(stand, von, farbe); break;
            default: return [];
        }

        /* Fähigkeit Sprung: Solange sie aktiv ist, darf jede eigene Figur
           zusätzlich wie ein Springer ziehen. Springer selbst können es
           ohnehin — dort ändert sich nichts. */
        if (stand.sprungAktiv === farbe && art !== "S") {
            for (const zug of SCHACH._springerzuege(stand, von, farbe)) {
                if (!liste.some((vorhanden) => vorhanden.nach === zug.nach)) {
                    liste.push(zug);
                }
            }
        }

        return liste;
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

    _imBrett(stand, reihe, spalte) {
        return reihe >= 0 && reihe < SCHACH.hoeheVon(stand)
            && spalte >= 0 && spalte < SCHACH.breiteVon(stand);
    },

    /* Reihe und Spalte zu einer Feldnummer im Brett dieses Standes. */
    _feld(stand, reihe, spalte) {
        return reihe * SCHACH.breiteVon(stand) + spalte;
    },

    _strahlzuege(stand, von, farbe, richtungen) {
        const liste = [];
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(von, breite);
        const spalte = SCHACH.spalteVon(von, breite);

        for (const richtung of richtungen) {
            let r = reihe + richtung[0];
            let s = spalte + richtung[1];

            while (SCHACH._imBrett(stand, r, s)) {
                const ziel = SCHACH._feld(stand, r, s);
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
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(von, breite);
        const spalte = SCHACH.spalteVon(von, breite);

        for (const sprung of SCHACH.SPRUENGE) {
            const r = reihe + sprung[0];
            const s = spalte + sprung[1];
            if (!SCHACH._imBrett(stand, r, s)) {
                continue;
            }
            const ziel = SCHACH._feld(stand, r, s);
            if (SCHACH.farbeVon(SCHACH.figurAuf(stand, ziel)) !== farbe) {
                liste.push(SCHACH._zug(stand, von, ziel));
            }
        }

        return liste;
    },

    _koenigszuege(stand, von, farbe) {
        const liste = [];
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(von, breite);
        const spalte = SCHACH.spalteVon(von, breite);

        for (let dr = -1; dr <= 1; dr++) {
            for (let ds = -1; ds <= 1; ds++) {
                if (dr === 0 && ds === 0) {
                    continue;
                }
                const r = reihe + dr;
                const s = spalte + ds;
                if (!SCHACH._imBrett(stand, r, s)) {
                    continue;
                }
                const ziel = SCHACH._feld(stand, r, s);
                if (SCHACH.farbeVon(SCHACH.figurAuf(stand, ziel)) !== farbe) {
                    liste.push(SCHACH._zug(stand, von, ziel));
                }
            }
        }

        /* Rochade gibt es nur auf dem klassischen Brett: Sie hängt an den
           festen Plätzen von König und Turm. */
        if (!SCHACH.varianteVon(stand).rochade) {
            return liste;
        }

        /* König zwei Felder zur Seite, Turm springt darüber.
           Bedingungen: Recht noch vorhanden, Felder dazwischen frei, König
           steht nicht im Schach und zieht über kein bedrohtes Feld. */
        const grundreihe = (farbe === SCHACH.WEISS) ? SCHACH.hoeheVon(stand) - 1 : 0;
        const koenigStart = SCHACH._feld(stand, grundreihe, 4);

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
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const richtung = (farbe === SCHACH.WEISS) ? -1 : 1;
        const reihe = SCHACH.reiheVon(von, breite);
        const spalte = SCHACH.spalteVon(von, breite);
        const startreihe = (farbe === SCHACH.WEISS) ? hoehe - 2 : 1;
        const letzteReihe = (farbe === SCHACH.WEISS) ? 0 : hoehe - 1;

        const anhaengen = (zug) => {
            if (SCHACH.reiheVon(zug.nach, breite) === letzteReihe) {
                /* Umwandlung: vier Möglichkeiten, jede ein eigener Zug. */
                for (const art of ["D", "T", "L", "S"]) {
                    liste.push(Object.assign({}, zug, { umwandlung: art }));
                }
            } else {
                liste.push(zug);
            }
        };

        /* Ein Feld vor. */
        if (SCHACH._imBrett(stand, reihe + richtung, spalte)) {
            const einsVor = SCHACH._feld(stand, reihe + richtung, spalte);

            if (SCHACH.figurAuf(stand, einsVor) === ".") {
                anhaengen(SCHACH._zug(stand, von, einsVor));

                /* Zwei Felder aus der Grundstellung. */
                if (reihe === startreihe && SCHACH._imBrett(stand, reihe + 2 * richtung, spalte)) {
                    const zweiVor = SCHACH._feld(stand, reihe + 2 * richtung, spalte);
                    if (SCHACH.figurAuf(stand, zweiVor) === ".") {
                        liste.push(SCHACH._zug(stand, von, zweiVor));
                    }
                }
            }
        }

        /* Schlagen, schräg. */
        for (const ds of [-1, 1]) {
            const r = reihe + richtung;
            const s = spalte + ds;
            if (!SCHACH._imBrett(stand, r, s)) {
                continue;
            }
            const ziel = SCHACH._feld(stand, r, s);
            const dort = SCHACH.figurAuf(stand, ziel);

            if (dort !== "." && SCHACH.farbeVon(dort) !== farbe) {
                anhaengen(SCHACH._zug(stand, von, ziel));
            } else if (dort === "." && stand.enPassant
                && SCHACH.feldNummer(stand.enPassant, breite, hoehe) === ziel) {
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
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);

        /* Bauern. */
        const bauernRichtung = (farbe === SCHACH.WEISS) ? 1 : -1;
        for (const ds of [-1, 1]) {
            const r = reihe + bauernRichtung;
            const s = spalte + ds;
            if (SCHACH._imBrett(stand, r, s)) {
                const dort = SCHACH.figurAuf(stand, SCHACH._feld(stand, r, s));
                if (SCHACH.artVon(dort) === "B" && SCHACH.farbeVon(dort) === farbe) {
                    return true;
                }
            }
        }

        /* Springer — und jede andere Figur, solange die Fähigkeit Sprung der
           angreifenden Seite aktiv ist. */
        const sprungFuerAlle = (stand.sprungAktiv === farbe);
        for (const sprung of SCHACH.SPRUENGE) {
            const r = reihe + sprung[0];
            const s = spalte + sprung[1];
            if (SCHACH._imBrett(stand, r, s)) {
                const dort = SCHACH.figurAuf(stand, SCHACH._feld(stand, r, s));
                if (SCHACH.farbeVon(dort) === farbe
                    && (SCHACH.artVon(dort) === "S" || sprungFuerAlle)) {
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
                if (SCHACH._imBrett(stand, r, s)) {
                    const dort = SCHACH.figurAuf(stand, SCHACH._feld(stand, r, s));
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

                while (SCHACH._imBrett(stand, r, s)) {
                    const dort = SCHACH.figurAuf(stand, SCHACH._feld(stand, r, s));
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

    /*
     * Steht der König dieser Farbe im Schach?
     * Auf Brettern mit schlagbarem König gibt es kein Schach — dort ist der
     * König eine Figur wie jede andere.
     */
    imSchach(stand, farbe) {
        if (SCHACH.varianteVon(stand).koenigSchlagbar) {
            return false;
        }
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
        const breite = SCHACH.breiteVon(stand);

        /* Fähigkeit Doppelzug: Die Farbe bleibt am Zug, die Fähigkeit ist
           damit verbraucht. */
        const nochmal = (stand.extraZug === stand.amZug);

        const neu = {
            variante: stand.variante,
            breite: stand.breite,
            hoehe: stand.hoehe,
            brett: stand.brett,
            amZug: nochmal ? stand.amZug : SCHACH.gegner(stand.amZug),
            rochade: stand.rochade,
            enPassant: "",
            halbzuege: stand.halbzuege + 1,
            zugNummer: stand.zugNummer + ((stand.amZug === SCHACH.SCHWARZ && !nochmal) ? 1 : 0),
            extraZug: nochmal ? "" : stand.extraZug,
            /* Der Sprung gilt für genau einen Zug. */
            sprungAktiv: (stand.sprungAktiv === stand.amZug) ? "" : stand.sprungAktiv
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
            const opferReihe = SCHACH.reiheVon(zug.von, breite);
            const opfer = opferReihe * breite + SCHACH.spalteVon(zug.nach, breite);
            brett = SCHACH._brettMit(brett, opfer, ".");
        }

        /* Rochade: der Turm zieht mit. */
        if (zug.rochade === "kurz") {
            const grund = SCHACH.reiheVon(zug.von, breite) * breite;
            brett = SCHACH._brettMit(brett, grund + 7, ".");
            brett = SCHACH._brettMit(brett, grund + 5, (farbe === SCHACH.WEISS) ? "T" : "t");
        } else if (zug.rochade === "lang") {
            const grund = SCHACH.reiheVon(zug.von, breite) * breite;
            brett = SCHACH._brettMit(brett, grund + 0, ".");
            brett = SCHACH._brettMit(brett, grund + 3, (farbe === SCHACH.WEISS) ? "T" : "t");
        }

        neu.brett = brett;

        /* Rochaderechte verfallen, sobald König oder Turm bewegt wurden —
           oder ein Turm geschlagen wird. */
        if (neu.rochade) {
            let rechte = neu.rochade;
            const streichen = (zeichen) => {
                rechte = rechte.split(zeichen).join("");
            };
            const unten = (SCHACH.hoeheVon(stand) - 1) * breite;

            if (art === "K") {
                if (farbe === SCHACH.WEISS) { streichen("K"); streichen("D"); }
                else { streichen("k"); streichen("d"); }
            }
            if (zug.von === unten + 7 || zug.nach === unten + 7) { streichen("K"); }
            if (zug.von === unten || zug.nach === unten) { streichen("D"); }
            if (zug.von === 7 || zug.nach === 7) { streichen("k"); }
            if (zug.von === 0 || zug.nach === 0) { streichen("d"); }
            neu.rochade = rechte;
        }

        /* Doppelschritt eines Bauern eröffnet en passant. */
        if (art === "B"
            && Math.abs(SCHACH.reiheVon(zug.nach, breite) - SCHACH.reiheVon(zug.von, breite)) === 2) {
            const zwischen = (SCHACH.reiheVon(zug.von, breite) + SCHACH.reiheVon(zug.nach, breite))
                / 2 * breite + SCHACH.spalteVon(zug.von, breite);
            neu.enPassant = SCHACH.feldName(zwischen, breite, SCHACH.hoeheVon(stand));
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

        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const art = SCHACH.artName(zug.art);
        const trennung = zug.schlaegt ? " schlägt auf " : " nach ";
        let text = art + " " + SCHACH.feldName(zug.von, breite, hoehe)
            + trennung + SCHACH.feldName(zug.nach, breite, hoehe);

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
        const amZugName = (stand.amZug === SCHACH.WEISS) ? "Weiss" : "Schwarz";

        /* Bretter ohne Schach-Begriff: Es zählt, wer noch einen König hat. */
        if (SCHACH.varianteVon(stand).koenigSchlagbar) {
            for (const farbe of [SCHACH.WEISS, SCHACH.SCHWARZ]) {
                if (SCHACH.koenigFelder(stand, farbe).length === 0) {
                    const sieger = SCHACH.gegner(farbe);
                    return {
                        art: "matt",
                        sieger: sieger,
                        text: "Kein König mehr — "
                            + ((sieger === SCHACH.WEISS) ? "Weiss" : "Schwarz") + " gewinnt."
                    };
                }
            }
            if (SCHACH.alleZuege(stand).length === 0) {
                return { art: "patt", sieger: "", text: "Patt — unentschieden." };
            }
            return { art: "laeuft", sieger: "", text: amZugName + " ist am Zug." };
        }

        const hatZuege = SCHACH.alleZuege(stand).length > 0;
        const schach = SCHACH.imSchach(stand, stand.amZug);

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

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können.
   SCHACH_VARIANTEN muss dort vorher als globale Größe bereitstehen — genau wie
   im Browser, wo die Datei davor eingebunden ist. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH;
}
