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

    /*
     * Alle Türme, die in der Startaufstellung auf einer Grundreihe stehen.
     * Aus der Aufstellung gelesen, damit eine neue Spielart nichts weiter
     * angeben muss als ihr Brett.
     */
    _turmStartfelder(variante) {
        if (!variante.rochade) {
            return [];
        }

        const felder = [];
        const letzte = variante.hoehe - 1;

        for (let spalte = 0; spalte < variante.breite; spalte++) {
            const oben = spalte;
            const unten = letzte * variante.breite + spalte;

            if (variante.aufstellung[oben] === "t") {
                felder.push(oben);
            }
            if (variante.aufstellung[unten] === "T") {
                felder.push(unten);
            }
        }

        return felder;
    },

    /* Alle Könige, die in der Startaufstellung auf einer Grundreihe stehen. */
    _koenigStartfelder(variante) {
        if (!variante.rochade) {
            return [];
        }

        const felder = [];
        const letzte = variante.hoehe - 1;

        for (let spalte = 0; spalte < variante.breite; spalte++) {
            const oben = spalte;
            const unten = letzte * variante.breite + spalte;

            if (variante.aufstellung[oben] === "k") {
                felder.push(oben);
            }
            if (variante.aufstellung[unten] === "K") {
                felder.push(unten);
            }
        }

        return felder;
    },

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

            /*
             * Die Turmfelder, die ihr Rochaderecht noch haben. Seit v2.1 die
             * Wahrheit — `rochade` (KDkd) bleibt als Altbestand daneben stehen
             * und wird daraus abgeleitet, damit der Vertrag additiv bleibt.
             * Nötig, weil die Rochade jetzt auf jedem Brett gilt: Auf dem
             * Doppelbrett gibt es vier Türme je Seite, für die vier Buchstaben
             * nicht reichen.
             */
            rochadeFelder: SCHACH._turmStartfelder(variante),

            /* Die Könige, die ihr Rochaderecht noch haben. Getrennt von den
               Türmen, weil ein König, der einmal gezogen hat, ALLE seine
               Rechte verliert — auch die zu einem Turm, dem er dabei näher
               gekommen ist. */
            rochadeKoenige: SCHACH._koenigStartfelder(variante),
            enPassant: "",
            halbzuege: 0,

            /*
             * Der Takt (seit v3.3): zählt JEDEN Halbzug und wird nie
             * zurückgesetzt.
             *
             * Warum nicht `halbzuege`: Das ist der Zähler der
             * Fünfzig-Züge-Regel — er springt bei jedem Bauernzug und jedem
             * Schlagen auf 0 zurück. Als Uhr für „diese Mauer steht noch sechs
             * Halbzüge" ist er damit unbrauchbar: Ein einziger Bauernzug würde
             * die Mauer verewigen. Der Takt ist die ehrliche Uhr.
             */
            takt: 0,

            zugNummer: 1,
            extraZug: "",
            sprungAktiv: "",

            /* Wirkung der Fähigkeiten, siehe schach-varianten.js.
               `zusatzMuster` löst `sprungAktiv` ab: Es kann jetzt auch etwas
               anderes als ein Springerzug sein. `sprungAktiv` bleibt im
               Vertrag stehen und wird mitgeführt — Felder werden nie
               gelöscht, nur ergänzt. */
            zusatzFarbe: "",
            zusatzMuster: "",

            /*
             * NUR NOCH DIESES MUSTER (seit v0.48).
             *
             * Sprung und Teleport sind seitdem der Zug selbst: Wer sie
             * einsetzt, bleibt am Zug, darf aber ausschliesslich nach dem
             * Muster ziehen. Ohne diesen Schalter wäre die Fähigkeit ein
             * geschenkter Zusatzzug — man könnte auch einfach normal ziehen
             * und den Sprung liegen lassen. Er gilt zusammen mit
             * `zusatzMuster` und verfällt mit ihm.
             */
            zusatzNurDieses: false,

            /*
             * Zwei Könige sind zwei Leben (seit v0.51 auch als Haken auf jeder
             * Spielart, siehe `SCHACH.koenigSchlagbarFuer`). Der Schalter steht
             * im STAND, weil `schach.js` die Regeln der Partie nicht kennt —
             * `SCHACH_RUNDE` setzt ihn beim Anlegen.
             */
            koenigeAlsLeben: false,

            schildFeld: -1,
            schildFarbe: "",
            fesselFeld: -1,
            fesselFarbe: "",

            /* Frost: wie die Fessel, aber die Figur ist zusätzlich unantastbar
               — eingefroren zieht sie nicht und wird nicht geschlagen. */
            frostFeld: -1,
            frostFarbe: "",

            /*
             * Volles Glas: WER die gegnerischen Figuren falsch sieht, und bis zu
             * welchem Zugzähler. Das ist der einzige Eintrag im Stand, der die
             * Regeln überhaupt nicht berührt — er ändert nur, was EIN Team auf
             * dem Bildschirm sieht. Er steht trotzdem hier und nicht im
             * Bildschirm-Code, weil er zum Spielstand gehört: Er überlebt das
             * Neuladen und gilt auf jedem Gerät dieses Teams.
             */
            glasFarbe: "",
            glasBis: 0,

            /*
             * Mauern auf dem Brett (seit v3.3): [{ felder: [a, b, c], bis }].
             *
             * `bis` ist ein Wert von `halbzuege` — die Mauer gilt, solange
             * `halbzuege < bis`. Sie ist der erste Eintrag, der ein Feld sperrt,
             * ohne dass dort eine Figur steht: Niemand betritt sie, niemand
             * gleitet hindurch, aber ein Springer setzt darüber hinweg.
             */
            mauern: [],

            /*
             * Geliehene Figuren (seit v3.3, Fähigkeit „Friedhof"):
             * [{ feld, bis }]. Sie stehen in der Farbe dessen auf dem Brett,
             * der sie geholt hat, und ziehen wie seine eigenen — aber nur bis
             * `bis` (ein Wert von `halbzuege`), dann zerfallen sie.
             *
             * Verfolgt wird das FELD, nicht die Figur: Zieht eine geliehene
             * Figur, wandert ihr Eintrag mit (siehe `_geliehenNachfuehren`).
             */
            geliehen: []
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

        /*
         * Die Maße kommen aus der Spielart — es sei denn, der Stand trägt
         * eigene und das Brett passt dazu. Das braucht die Unglückskiste
         * „Ausdehnung“, die das Feld während der Partie wachsen lässt: Danach
         * stimmen Brett und Variante nicht mehr überein, und der Stand selbst
         * ist die Wahrheit.
         */
        if (Number.isInteger(roh.breite) && Number.isInteger(roh.hoehe)
            && roh.breite >= 2 && roh.breite <= SCHACH.SPALTEN.length
            && roh.hoehe >= 2 && roh.hoehe <= 9
            && typeof roh.brett === "string"
            && roh.brett.length === roh.breite * roh.hoehe) {
            stand.breite = roh.breite;
            stand.hoehe = roh.hoehe;
        }

        const felder = stand.breite * stand.hoehe;
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

        /*
         * Rochaderechte. Steht die Feldliste im Stand, gilt sie. Fehlt sie,
         * stammt der Stand aus der Zeit vor v2.1: Dann werden die vier
         * Buchstaben in Felder übersetzt, damit angefangene Partien ihre
         * Rechte behalten.
         */
        if (Array.isArray(roh.rochadeFelder)) {
            stand.rochadeFelder = roh.rochadeFelder
                .filter((feld) => Number.isInteger(feld) && feld >= 0 && feld < felder)
                .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle);
        } else if (variante.rochade && stand.rochade === "KDkd") {
            /* Unangetastete Rechte: alle Türme der Startaufstellung. Die vier
               Buchstaben können nur vier Türme beschreiben — auf dem
               Doppelbrett sind es acht. */
            stand.rochadeFelder = SCHACH._turmStartfelder(variante);
        } else if (variante.rochade) {
            const unten = (variante.hoehe - 1) * variante.breite;
            const alt = [];

            if (stand.rochade.indexOf("D") !== -1) { alt.push(unten); }
            if (stand.rochade.indexOf("K") !== -1) { alt.push(unten + variante.breite - 1); }
            if (stand.rochade.indexOf("d") !== -1) { alt.push(0); }
            if (stand.rochade.indexOf("k") !== -1) { alt.push(variante.breite - 1); }

            stand.rochadeFelder = alt;
        } else {
            stand.rochadeFelder = [];
        }

        /* Dasselbe für die Könige. */
        if (Array.isArray(roh.rochadeKoenige)) {
            stand.rochadeKoenige = roh.rochadeKoenige
                .filter((feld) => Number.isInteger(feld) && feld >= 0 && feld < felder)
                .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle);
        } else if (variante.rochade) {
            /* Ohne Angabe: Ein König hat sein Recht, solange auf seiner Seite
               noch irgendein Turmrecht steht. Genauer geht es aus den vier
               alten Buchstaben nicht — sie kannten keine Königsfelder. */
            const unten = (variante.hoehe - 1) * variante.breite;

            stand.rochadeKoenige = SCHACH._koenigStartfelder(variante).filter((feld) => {
                const istWeiss = (feld >= unten);
                return stand.rochadeFelder.some((turm) => (turm >= unten) === istWeiss);
            });
        } else {
            stand.rochadeKoenige = [];
        }
        if (typeof roh.enPassant === "string"
            && SCHACH.feldNummer(roh.enPassant, variante.breite, variante.hoehe) !== -1) {
            stand.enPassant = roh.enPassant;
        }
        if (typeof roh.takt === "number" && isFinite(roh.takt) && roh.takt >= 0) {
            stand.takt = Math.floor(roh.takt);
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

        /*
         * Zusätzliches Zugmuster (Sprung, Ausweichen, Teleport).
         *
         * DIE LISTE MUSS JEDEN NAMEN AUS `_musterzuege` ENTHALTEN. Fehlte
         * einer, würde er hier stillschweigend weggeworfen: Die Fähigkeit wäre
         * aus dem Vorrat verbraucht, das Muster aber schon beim nächsten
         * Zeichnen wieder weg. Genau das ist „ausweichen" von v3.6 bis v0.40
         * passiert (siehe `docs\entscheidungen\erkenntnisse.md`). „koenig" ist
         * der alte Name desselben Musters und bleibt gültig.
         */
        const farben = [SCHACH.WEISS, SCHACH.SCHWARZ];

        if (farben.indexOf(roh.zusatzFarbe) !== -1 && typeof roh.zusatzMuster === "string"
            && ["springer", "ausweichen", "koenig", "umkreis2"].indexOf(roh.zusatzMuster) !== -1) {
            stand.zusatzFarbe = roh.zusatzFarbe;
            stand.zusatzMuster = roh.zusatzMuster;
        } else if (farben.indexOf(roh.sprungAktiv) !== -1) {
            /* Stände aus der Zeit, als es nur den Sprung gab. */
            stand.zusatzFarbe = roh.sprungAktiv;
            stand.zusatzMuster = "springer";
        }

        /* Der Schalter gilt nur zusammen mit einem Muster — ohne Muster gibt es
           nichts, worauf er einschränken könnte. */
        stand.zusatzNurDieses = !!roh.zusatzNurDieses && !!stand.zusatzMuster;

        /* Zwei Leben: aus dem Stand gelesen, ergänzt um die alte Spielart. */
        stand.koenigeAlsLeben = !!roh.koenigeAlsLeben || !!variante.koenigeAlsLeben;

        /* Das alte Feld wird mitgeführt, damit der Vertrag additiv bleibt. */
        stand.sprungAktiv = (stand.zusatzMuster === "springer") ? stand.zusatzFarbe : "";

        if (Number.isInteger(roh.schildFeld) && roh.schildFeld >= 0
            && roh.schildFeld < felder && farben.indexOf(roh.schildFarbe) !== -1) {
            stand.schildFeld = roh.schildFeld;
            stand.schildFarbe = roh.schildFarbe;
        }
        if (Number.isInteger(roh.fesselFeld) && roh.fesselFeld >= 0
            && roh.fesselFeld < felder && farben.indexOf(roh.fesselFarbe) !== -1) {
            stand.fesselFeld = roh.fesselFeld;
            stand.fesselFarbe = roh.fesselFarbe;
        }
        if (Number.isInteger(roh.frostFeld) && roh.frostFeld >= 0
            && roh.frostFeld < felder && farben.indexOf(roh.frostFarbe) !== -1) {
            stand.frostFeld = roh.frostFeld;
            stand.frostFarbe = roh.frostFarbe;
        }
        if (farben.indexOf(roh.glasFarbe) !== -1 && Number.isInteger(roh.glasBis)
            && roh.glasBis > 0) {
            stand.glasFarbe = roh.glasFarbe;
            stand.glasBis = roh.glasBis;
        }

        if (Array.isArray(roh.mauern)) {
            stand.mauern = roh.mauern
                .filter((eintrag) => eintrag && Array.isArray(eintrag.felder)
                    && Number.isInteger(eintrag.bis) && eintrag.bis > 0)
                .map((eintrag) => ({
                    felder: eintrag.felder
                        .filter((feld) => Number.isInteger(feld) && feld >= 0 && feld < felder),
                    bis: eintrag.bis
                }))
                .filter((eintrag) => eintrag.felder.length > 0);
        }

        if (Array.isArray(roh.geliehen)) {
            stand.geliehen = roh.geliehen
                .filter((eintrag) => eintrag
                    && Number.isInteger(eintrag.feld) && eintrag.feld >= 0
                    && eintrag.feld < felder
                    && Number.isInteger(eintrag.bis) && eintrag.bis > 0)
                .map((eintrag) => ({ feld: eintrag.feld, bis: eintrag.bis }));
        }

        return stand;
    },

    /* ---------------------------------------------------------------- *
     * Mauern (seit v3.3)
     *
     * Eine Mauer sperrt Felder, ohne dass dort eine Figur steht. Sie gehört
     * keiner Seite: Sie behindert beide gleichermassen — auch den, der sie
     * gelegt hat. Das ist Absicht, sonst wäre sie eine Waffe statt eines
     * Hindernisses.
     * ---------------------------------------------------------------- */

    /* Wie lange eine Mauer steht, gerechnet in Halbzügen. */
    MAUER_HALBZUEGE: 6,

    /* Wie viele Felder eine Mauer breit ist. */
    MAUER_LAENGE: 3,

    /* Die Mauern, die JETZT noch stehen. Abgelaufene zählen nicht mehr mit. */
    mauern(stand) {
        if (!Array.isArray(stand.mauern)) {
            return [];
        }
        return stand.mauern.filter((eintrag) => eintrag.bis > stand.takt);
    },

    /* Liegt auf diesem Feld eine Mauer? */
    mauerAuf(stand, feld) {
        return SCHACH.mauern(stand)
            .some((eintrag) => eintrag.felder.indexOf(feld) !== -1);
    },

    /*
     * Eine Mauer legen: Das angetippte Feld ist ihr LINKES Ende, sie läuft von
     * dort nach rechts über `MAUER_LAENGE` Felder derselben Reihe.
     *
     * Warum das linke Ende und nicht die Mitte: Am Rand gäbe es für die Mitte
     * keine gültige Lage, und eine Fähigkeit, die je nach Feld etwas anderes
     * tut, ist nicht vorhersagbar. So zeigen die angebotenen Zielfelder genau
     * die möglichen Startpunkte — was man antippt, bekommt man auch.
     */
    mauerLegen(stand, feld) {
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);

        if (feld < 0 || feld >= SCHACH.felderVon(stand)) {
            return null;
        }

        /*
         * DAS ANGETIPPTE FELD IST DIE MITTE (seit v0.46).
         *
         * Bis v0.45 war es das LINKE ENDE, und die Mauer wuchs von dort nach
         * rechts. Am Bildschirm sah das aus wie ein Fehler: Man tippt ein Feld
         * an, und die Sperre erscheint daneben. Wer eine Mauer legt, meint das
         * Feld, das er anfasst — links und rechts davon ist Zugabe.
         */
        const links = spalte - Math.floor((SCHACH.MAUER_LAENGE - 1) / 2);

        if (links < 0 || links + SCHACH.MAUER_LAENGE > breite) {
            return null;
        }

        const felder = [];
        for (let schritt = 0; schritt < SCHACH.MAUER_LAENGE; schritt++) {
            const ziel = SCHACH._feld(stand, reihe, links + schritt);

            /* Frei heisst: keine Figur UND keine andere Mauer. */
            if (SCHACH.figurAuf(stand, ziel) !== "." || SCHACH.mauerAuf(stand, ziel)) {
                return null;
            }
            felder.push(ziel);
        }

        /* Nur die noch stehenden übernehmen — so räumt sich die Liste beim
           Legen von selbst auf. */
        const mauern = SCHACH.mauern(stand).concat([{
            felder: felder,
            bis: stand.takt + SCHACH.MAUER_HALBZUEGE
        }]);

        return {
            stand: Object.assign({}, stand, { mauern: mauern }),
            felder: felder,
            text: "Mauer auf " + SCHACH.feldName(felder[0], breite, SCHACH.hoeheVon(stand))
                + " bis " + SCHACH.feldName(felder[felder.length - 1], breite,
                    SCHACH.hoeheVon(stand))
        };
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

    /* ---------------------------------------------------------------- *
     * Wege über das Brett (seit v3.6)
     *
     * Zwei Fragen, die sich ähneln und trotzdem verschieden beantwortet
     * werden müssen:
     *
     *   wegFelder        Welche Felder ZEICHNET man, um diese Bewegung zu
     *                    zeigen? Beim Springer das L — auch wenn er die
     *                    Felder dazwischen nie betreten hat.
     *   betreteneFelder  Welche Felder hat die Figur WIRKLICH betreten?
     *                    Beim Springer nur das Zielfeld. Daran hängt, was
     *                    unterwegs eingesammelt wird.
     *
     * Beides steht hier und nicht im Bildschirm-Code: Das Einsammeln ist eine
     * Regel, und die Anzeige soll dieselbe Rechnung benutzen wie die Regel —
     * sonst zeigt sie einen Weg, auf dem etwas anderes passiert.
     * ---------------------------------------------------------------- */

    /*
     * Verläuft der Weg gerade — waagerecht, senkrecht oder diagonal? Nur dann
     * gibt es überhaupt Felder dazwischen, die betreten werden.
     */
    istGeradeStrecke(stand, von, nach) {
        const breite = SCHACH.breiteVon(stand);
        const dReihe = SCHACH.reiheVon(nach, breite) - SCHACH.reiheVon(von, breite);
        const dSpalte = SCHACH.spalteVon(nach, breite) - SCHACH.spalteVon(von, breite);

        if (dReihe === 0 && dSpalte === 0) {
            return false;
        }
        return (dReihe === 0) || (dSpalte === 0)
            || (Math.abs(dReihe) === Math.abs(dSpalte));
    },

    /* Ist das ein Springersprung (ein Feld in der einen, zwei in der anderen
       Richtung)? Gemessen wird die BEWEGUNG, nicht die Figur — damit gilt es
       auch für die Fähigkeit „Sprung“. */
    istSprungWeg(stand, von, nach) {
        const breite = SCHACH.breiteVon(stand);
        const dReihe = Math.abs(SCHACH.reiheVon(nach, breite) - SCHACH.reiheVon(von, breite));
        const dSpalte = Math.abs(SCHACH.spalteVon(nach, breite) - SCHACH.spalteVon(von, breite));

        return (dReihe === 1 && dSpalte === 2) || (dReihe === 2 && dSpalte === 1);
    },

    /*
     * Die Felder, über die diese Bewegung führt — Start und Ziel eingeschlossen.
     *
     *   Springersprung  das L: erst die lange Achse, dann die kurze.
     *   Gerade Strecke  jedes Feld dazwischen.
     *   Alles andere    nur die beiden Enden (Teleport, Wiedergeburt,
     *                   Friedhof, Handel — dazwischen liegt kein Weg).
     */
    wegFelder(stand, von, nach) {
        if (von === nach) {
            return [von];
        }

        const breite = SCHACH.breiteVon(stand);
        const vonReihe = SCHACH.reiheVon(von, breite);
        const vonSpalte = SCHACH.spalteVon(von, breite);
        const dReihe = SCHACH.reiheVon(nach, breite) - vonReihe;
        const dSpalte = SCHACH.spalteVon(nach, breite) - vonSpalte;

        if (SCHACH.istSprungWeg(stand, von, nach)) {
            /* Der Knick liegt am Ende der langen Achse. Beide Teilstücke sind
               danach gerade, die Rekursion endet also sofort. */
            const knick = (Math.abs(dSpalte) > Math.abs(dReihe))
                ? SCHACH._feld(stand, vonReihe, vonSpalte + dSpalte)
                : SCHACH._feld(stand, vonReihe + dReihe, vonSpalte);

            return SCHACH.wegFelder(stand, von, knick)
                .concat(SCHACH.wegFelder(stand, knick, nach).slice(1));
        }

        if (!SCHACH.istGeradeStrecke(stand, von, nach)) {
            return [von, nach];
        }

        const schritte = Math.max(Math.abs(dReihe), Math.abs(dSpalte));
        const schrittReihe = Math.sign(dReihe);
        const schrittSpalte = Math.sign(dSpalte);
        const felder = [];

        for (let nummer = 0; nummer <= schritte; nummer++) {
            felder.push(SCHACH._feld(stand,
                vonReihe + schrittReihe * nummer,
                vonSpalte + schrittSpalte * nummer));
        }

        return felder;
    },

    /*
     * Die Felder, die die Figur auf diesem Weg WIRKLICH betritt — ohne das
     * Startfeld, auf dem sie schon stand.
     *
     * Wer springt, betritt nur sein Zielfeld: der Springer, die Fähigkeit
     * „Sprung“ (dieselbe Bewegung) und der Teleport (der über alles hinweg
     * geht). Alle anderen laufen über jedes Feld dazwischen — und sammeln
     * dabei ein, was dort liegt.
     */
    betreteneFelder(stand, von, nach) {
        if (von === nach) {
            return [];
        }
        if (!SCHACH.istGeradeStrecke(stand, von, nach)) {
            return [nach];
        }
        return SCHACH.wegFelder(stand, von, nach).slice(1);
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

        /* Fessel und Frost: Diese Figur darf gerade nicht ziehen. */
        if (stand.fesselFeld === von && stand.fesselFarbe === farbe) {
            return [];
        }
        if (stand.frostFeld === von && stand.frostFarbe === farbe) {
            return [];
        }

        let roh = SCHACH._rohzuege(stand, von);

        /*
         * Auf eine Mauer zieht niemand — auch kein Springer.
         *
         * Dass ein Springer trotzdem DARÜBER hinwegkommt, ergibt sich von
         * selbst: Er fragt nie nach den Feldern dazwischen. Umgekehrt bleiben
         * Turm, Läufer und Dame schon im `_strahlzuege` davor stehen. Hier ist
         * deshalb nur noch das Zielfeld zu sperren — eine einzige Regel für
         * alle Figuren statt einer Sonderbehandlung je Gangart.
         */
        roh = roh.filter((zug) => !SCHACH.mauerAuf(stand, zug.nach));

        /* Fähigkeit Schutzschild: Die geschützte Figur lässt sich nicht
           schlagen — der Gegner kann es gar nicht erst versuchen. */
        if (stand.schildFeld >= 0 && stand.schildFarbe !== farbe) {
            roh = roh.filter((zug) => zug.nach !== stand.schildFeld);
        }

        /* Eingefroren heißt auch: unantastbar. Sonst wäre Frost nur eine
           teurere Fessel — und eine Figur, die sich nicht wehren kann, einfach
           nur ein Geschenk an den Gegner. */
        if (stand.frostFeld >= 0 && stand.frostFarbe !== farbe) {
            roh = roh.filter((zug) => zug.nach !== stand.frostFeld);
        }

        /*
         * Der König wird NIE geschlagen — auch nicht durch eine Fähigkeit.
         *
         * Im normalen Schach kann das gar nicht vorkommen, weil der Gegner
         * immer zuerst aus dem Schach ziehen muss. Mit dem Doppelzug schon:
         * Man setzt Schach und ist sofort wieder am Zug, ohne dass der Gegner
         * reagieren durfte. Ohne diese Sperre endete die Partie damit, dass
         * ein König vom Brett verschwindet, statt durch Schachmatt.
         *
         * GEFRAGT WIRD NACH DEM BESITZER (seit v0.49): Wer noch zwei Könige
         * hat, hat zwei Leben — sein König ist dann eine Figur wie jede andere
         * und darf geschlagen werden. Der letzte ist wieder unantastbar.
         */
        if (!SCHACH.koenigSchlagbarFuer(stand, SCHACH.gegner(farbe))) {
            roh = roh.filter((zug) => SCHACH.artVon(SCHACH.figurAuf(stand, zug.nach)) !== "K");
        }

        /* Und wer selbst kein Schach kennt, muss auch keines auflösen. */
        if (SCHACH.koenigSchlagbarFuer(stand, farbe)) {
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

        /*
         * Fähigkeiten mit zusätzlichem Zugmuster (Sprung, Ausweichen,
         * Teleport): Solange sie wirken, darf jede eigene Figur zusätzlich so
         * ziehen. Doppelte Ziele werden nicht zweimal angeboten.
         *
         * Auch hier gilt die Umwandlung: Ein Bauer, der so auf die letzte
         * Reihe kommt, wird zur Dame (oder was man wählt) — siehe
         * `_mitUmwandlung`.
         */
        if (stand.zusatzFarbe === farbe && stand.zusatzMuster) {
            /*
             * `zusatzNurDieses` (Sprung, Teleport seit v0.48): Die Fähigkeit
             * IST der Zug — die gewohnte Gangart der Figur zählt in diesem
             * einen Zug nicht. Deshalb wird die bisherige Liste verworfen,
             * statt das Muster nur dazuzulegen.
             */
            if (stand.zusatzNurDieses) {
                liste = [];
            }

            for (const zug of SCHACH._musterzuege(stand, von, farbe, stand.zusatzMuster)) {
                if (!liste.some((vorhanden) => vorhanden.nach === zug.nach)) {
                    for (const einzeln of SCHACH._mitUmwandlung(stand, zug, farbe)) {
                        liste.push(einzeln);
                    }
                }
            }
        }

        return liste;
    },

    /*
     * Die Zusatzmuster der Fähigkeiten.
     *
     * „koenig“ ist der alte Name des Ausweich-Musters (Stände vor v3.6). Er
     * wird weiter verstanden, damit eine laufende Partie mit gesetztem
     * Zusatzmuster nicht plötzlich gar nichts mehr kann — additiver Vertrag.
     */
    _musterzuege(stand, von, farbe, muster) {
        if (muster === "springer") {
            return SCHACH._springerzuege(stand, von, farbe);
        }
        if (muster === "ausweichen" || muster === "koenig") {
            return SCHACH._nachbarzuege(stand, von, farbe);
        }
        if (muster === "umkreis2") {
            return SCHACH._umkreiszuege(stand, von, farbe, 2);
        }
        return [];
    },

    /*
     * Ausweichen: ein Feld in jede Richtung, aber NUR auf ein freies.
     *
     * Bis v3.5 durfte man damit auch schlagen — dann war Ausweichen keine
     * Notbremse mehr, sondern ein zusätzlicher Angriff mit jeder Figur. Und
     * am Bildschirm sah man rote Schlagfelder, auf die der Tipp dann doch
     * nichts tat. Ausweichen heisst jetzt, was es sagt: sich in Sicherheit
     * bringen.
     */
    _nachbarzuege(stand, von, farbe) {
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
                if (SCHACH.figurAuf(stand, ziel) === ".") {
                    liste.push(SCHACH._zug(stand, von, ziel));
                }
            }
        }

        return liste;
    },

    /*
     * Teleport: auf ein FREIES Feld im Umkreis springen, über alles hinweg.
     * Bewusst ohne Schlagen — sonst wäre die Fähigkeit auf engem Raum eine
     * Allzweckwaffe gegen jede Figur in Reichweite.
     */
    _umkreiszuege(stand, von, farbe, weite) {
        const liste = [];
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(von, breite);
        const spalte = SCHACH.spalteVon(von, breite);

        for (let dr = -weite; dr <= weite; dr++) {
            for (let ds = -weite; ds <= weite; ds++) {
                if (dr === 0 && ds === 0) {
                    continue;
                }
                const r = reihe + dr;
                const s = spalte + ds;
                if (!SCHACH._imBrett(stand, r, s)) {
                    continue;
                }
                const ziel = SCHACH._feld(stand, r, s);
                if (SCHACH.figurAuf(stand, ziel) === ".") {
                    liste.push(SCHACH._zug(stand, von, ziel));
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

                /* Eine Mauer stoppt den Strahl wie eine Figur — nur lässt sie
                   sich nicht schlagen, der Zug endet also davor. */
                if (SCHACH.mauerAuf(stand, ziel)) {
                    break;
                }

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

    /* ---------------------------------------------------------------- *
     * Rochade, für jede Spielart
     *
     * Bis v2.0 hing sie an den Standardplätzen des 8-mal-8-Bretts (König auf
     * e, Türme auf a und h) und war deshalb nur dort erlaubt. Seit v2.1 wird
     * sie aus der Stellung gelesen: König auf seinem Startfeld, ein Turm mit
     * Recht auf derselben Grundreihe, dazwischen frei. Damit funktioniert sie
     * auch auf dem 6er-Brett (König auf d), dem 10er (König auf f) und dem
     * Doppelbrett, wo jede Seite ZWEI Könige mit je zwei Türmen hat.
     * ---------------------------------------------------------------- */

    /*
     * Die Türme, mit denen DIESER König rochieren könnte: je Richtung der
     * nächstgelegene mit Recht.
     *
     * „Der nächstgelegene" ist die entscheidende Einschränkung. Auf dem
     * Doppelbrett stehen vier Türme je Seite; ohne sie gehörte der mittlere
     * Turm beiden Königen, und beim Zug des einen verlöre der andere sein
     * Recht.
     */
    _rochadeTuerme(stand, koenigFeld, farbe) {
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(koenigFeld, breite);
        const spalte = SCHACH.spalteVon(koenigFeld, breite);
        const turm = (farbe === SCHACH.WEISS) ? "T" : "t";

        const gefunden = {};

        for (const feld of stand.rochadeFelder) {
            if (SCHACH.reiheVon(feld, breite) !== reihe
                || SCHACH.figurAuf(stand, feld) !== turm) {
                continue;
            }

            const turmSpalte = SCHACH.spalteVon(feld, breite);
            if (turmSpalte === spalte) {
                continue;
            }

            const richtung = (turmSpalte > spalte) ? "rechts" : "links";
            const abstand = Math.abs(turmSpalte - spalte);

            if (!gefunden[richtung] || abstand < gefunden[richtung].abstand) {
                gefunden[richtung] = { feld: feld, abstand: abstand };
            }
        }

        return Object.keys(gefunden).map((richtung) => gefunden[richtung].feld);
    },

    /*
     * Alle Rochaden, die dieser König machen könnte — mit Angabe, ob sie
     * erlaubt sind und warum nicht. EINE Stelle für Zugerzeugung und
     * Begründung; sonst liefen beide auseinander.
     */
    _rochadeWege(stand, koenigFeld, farbe) {
        const wege = [];
        const variante = SCHACH.varianteVon(stand);
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(koenigFeld, breite);
        const spalte = SCHACH.spalteVon(koenigFeld, breite);
        const koenig = (farbe === SCHACH.WEISS) ? "K" : "k";

        /* Hat dieser König sein Recht schon verspielt, gibt es nichts zu prüfen. */
        if (stand.rochadeKoenige.indexOf(koenigFeld) === -1) {
            return [{
                seite: "kurz",
                turmFeld: -1,
                zielFeld: -1,
                turmZiel: -1,
                moeglich: false,
                grund: "Das Recht ist verfallen: König oder Turm haben sich schon bewegt."
            }];
        }

        for (const turmFeld of SCHACH._rochadeTuerme(stand, koenigFeld, farbe)) {
            const turmSpalte = SCHACH.spalteVon(turmFeld, breite);
            const richtung = (turmSpalte > spalte) ? 1 : -1;
            const zielSpalte = spalte + 2 * richtung;

            const weg = {
                seite: (richtung === 1) ? "kurz" : "lang",
                turmFeld: turmFeld,
                zielFeld: SCHACH._feld(stand, reihe, zielSpalte),
                turmZiel: SCHACH._feld(stand, reihe, zielSpalte - richtung),
                moeglich: false,
                grund: ""
            };

            if (!SCHACH._imBrett(stand, reihe, zielSpalte)) {
                weg.grund = "Der König hätte keine zwei Felder Platz.";
                wege.push(weg);
                continue;
            }
            if (SCHACH.figurAuf(stand, koenigFeld) !== koenig) {
                weg.grund = "Der König steht nicht mehr auf seinem Startfeld.";
                wege.push(weg);
                continue;
            }

            /* Alles zwischen König und Turm muss frei sein. */
            let frei = true;
            for (let lauf = spalte + richtung; lauf !== turmSpalte; lauf += richtung) {
                if (SCHACH.figurAuf(stand, SCHACH._feld(stand, reihe, lauf)) !== ".") {
                    frei = false;
                    break;
                }
            }
            if (!frei) {
                weg.grund = "Zwischen König und Turm steht noch eine Figur.";
                wege.push(weg);
                continue;
            }

            /*
             * Eine Mauer im Weg zählt wie eine Figur — auch hier gilt: Nur der
             * Springer setzt darüber hinweg, und der rochiert nicht. Geprüft
             * werden die Felder ZWISCHEN beiden und die beiden Zielfelder.
             */
            let mauerImWeg = false;
            for (let lauf = spalte + richtung; lauf !== turmSpalte; lauf += richtung) {
                if (SCHACH.mauerAuf(stand, SCHACH._feld(stand, reihe, lauf))) {
                    mauerImWeg = true;
                    break;
                }
            }
            if (mauerImWeg || SCHACH.mauerAuf(stand, weg.zielFeld)
                || SCHACH.mauerAuf(stand, weg.turmZiel)) {
                weg.grund = "Eine Mauer steht im Weg.";
                wege.push(weg);
                continue;
            }

            /* Auf Brettern ohne Schach entfällt die Bedrohungsprüfung. */
            if (!variante.koenigSchlagbar) {
                if (SCHACH.imSchach(stand, farbe)) {
                    weg.grund = "Der König steht im Schach.";
                    wege.push(weg);
                    continue;
                }
                const gegner = SCHACH.gegner(farbe);
                const ueber = SCHACH._feld(stand, reihe, spalte + richtung);

                if (SCHACH._feldBedroht(stand, ueber, gegner)) {
                    weg.grund = "Der König müsste über ein bedrohtes Feld ziehen.";
                    wege.push(weg);
                    continue;
                }
                if (SCHACH._feldBedroht(stand, weg.zielFeld, gegner)) {
                    weg.grund = "Der König stünde danach im Schach.";
                    wege.push(weg);
                    continue;
                }
            }

            weg.moeglich = true;
            wege.push(weg);
        }

        return wege;
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

        /* Rochade — in jeder Spielart, aus der Stellung gelesen. */
        for (const weg of SCHACH._rochadeWege(stand, von, farbe)) {
            if (weg.moeglich) {
                liste.push(SCHACH._zug(stand, von, weg.zielFeld, {
                    rochade: weg.seite,
                    turmVon: weg.turmFeld,
                    turmNach: weg.turmZiel
                }));
            }
        }

        return liste;
    },

    /*
     * Die letzte Reihe für diese Farbe — dort wandelt ein Bauer um.
     */
    letzteReiheVon(stand, farbe) {
        return (farbe === SCHACH.WEISS) ? 0 : SCHACH.hoeheVon(stand) - 1;
    },

    /*
     * Aus EINEM Zug werden vier, wenn ein Bauer damit die letzte Reihe
     * erreicht — je einer für Dame, Turm, Läufer und Springer. Sonst bleibt es
     * der eine Zug.
     *
     * WARUM DAS EINE EIGENE FUNKTION IST (seit v0.41): Die Umwandlung hing bis
     * dahin allein an `_bauernzuege`. Ein Bauer, der über ein Zusatzmuster
     * (Sprung, Ausweichen, Teleport) auf die letzte Reihe kam, blieb deshalb
     * ein Bauer und stand dort für immer fest — gemeldet als „Sprung muss zur
     * Dame werden". Die Regel gehört an den ZUG, nicht an die Gangart.
     */
    _mitUmwandlung(stand, zug, farbe) {
        if (SCHACH.artVon(SCHACH.figurAuf(stand, zug.von)) !== "B") {
            return [zug];
        }
        if (SCHACH.reiheVon(zug.nach, SCHACH.breiteVon(stand))
            !== SCHACH.letzteReiheVon(stand, farbe)) {
            return [zug];
        }

        return ["D", "T", "L", "S"].map(
            (art) => Object.assign({}, zug, { umwandlung: art }));
    },

    _bauernzuege(stand, von, farbe) {
        const liste = [];
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const richtung = (farbe === SCHACH.WEISS) ? -1 : 1;
        const reihe = SCHACH.reiheVon(von, breite);
        const spalte = SCHACH.spalteVon(von, breite);
        /*
         * VON WO DARF EIN BAUER ZWEI FELDER? (seit v0.52)
         *
         * Bis v0.51 war es genau EINE Reihe — `hoehe - 2` für Weiss. Das
         * stimmte, solange Bauern nur dort starten können. Mit der Zufallsarmee
         * stehen sie irgendwo auf den beiden Grundreihen, auch ganz hinten, und
         * hatten dort keinen Doppelschritt: ihr erster Zug war ein einzelner.
         *
         * Erlaubt sind jetzt BEIDE Grundreihen. Für jede andere Spielart ändert
         * das nichts — hinter der eigenen Bauernreihe steht die Grundreihe voll,
         * und ein weisser Bauer kann sie nie erreichen (er zieht ja nach vorn).
         * Die Regel bleibt für den Spieler also überall dieselbe: Beim ersten
         * Zug zwei Felder, danach eines.
         */
        const grundreihen = (farbe === SCHACH.WEISS)
            ? [hoehe - 1, hoehe - 2] : [0, 1];
        const darfDoppelt = grundreihen.indexOf(reihe) !== -1;

        const anhaengen = (zug) => {
            for (const einzeln of SCHACH._mitUmwandlung(stand, zug, farbe)) {
                liste.push(einzeln);
            }
        };

        /*
         * Ein Feld vor.
         *
         * Die Mauer muss hier ausdrücklich geprüft werden: Der Filter in
         * `zuege()` sperrt nur das ZIELFELD, und beim Doppelschritt liegt das
         * dahinter. Ohne diese Prüfung setzte ein Bauer über eine Mauer hinweg
         * — das darf nur der Springer.
         */
        if (SCHACH._imBrett(stand, reihe + richtung, spalte)) {
            const einsVor = SCHACH._feld(stand, reihe + richtung, spalte);

            if (SCHACH.figurAuf(stand, einsVor) === "." && !SCHACH.mauerAuf(stand, einsVor)) {
                anhaengen(SCHACH._zug(stand, von, einsVor));

                /* Zwei Felder aus der Grundstellung. */
                if (darfDoppelt && SCHACH._imBrett(stand, reihe + 2 * richtung, spalte)) {
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
                /*
                 * En passant: schlägt den Bauern, der gerade zwei Felder zog.
                 * `enPassantFeld` ist das Feld, auf dem er WIRKLICH steht — es
                 * ist nicht das Zielfeld. Wer sich merken will, wo eine Figur
                 * fiel (Fähigkeit „Wiederbelebung"), braucht genau dieses.
                 */
                liste.push(SCHACH._zug(stand, von, ziel, {
                    enPassant: true,
                    schlaegt: true,
                    enPassantFeld: SCHACH._feld(stand, reihe, s)
                }));
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
        const sprungFuerAlle = (stand.zusatzFarbe === farbe && stand.zusatzMuster === "springer");
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

        /*
         * König (Nachbarfelder).
         *
         * AUSWEICHEN ZÄHLT HIER NICHT MIT, und das ist Absicht: Seit v3.5 zieht
         * es nur noch auf FREIE Felder (`_nachbarzuege`). Wer nicht schlagen
         * kann, bedroht auch nichts — eine Figur mit Ausweichen daneben ist
         * kein Schach. Bis v0.40 stand hier eine Prüfung auf den alten
         * Musternamen „koenig"; sie stammte aus der Zeit, als Ausweichen noch
         * schlagen durfte, und hätte ein falsches Schachmatt erzeugen können.
         * Der Sprung bleibt dagegen drin: Er schlägt sehr wohl.
         */
        for (let dr = -1; dr <= 1; dr++) {
            for (let ds = -1; ds <= 1; ds++) {
                if (dr === 0 && ds === 0) {
                    continue;
                }
                const r = reihe + dr;
                const s = spalte + ds;
                if (SCHACH._imBrett(stand, r, s)) {
                    const dort = SCHACH.figurAuf(stand, SCHACH._feld(stand, r, s));
                    if (SCHACH.farbeVon(dort) === farbe && SCHACH.artVon(dort) === "K") {
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

    /* ---------------------------------------------------------------- *
     * Rochade: warum sie geht oder nicht geht
     * ---------------------------------------------------------------- */

    /*
     * Liefert für beide Seiten, ob die Rochade möglich ist — und wenn nicht,
     * warum nicht:
     *
     *     [ { seite: "kurz", turmFeld: 63, zielFeld: 62,
     *         moeglich: false, grund: "Zwischen König und Turm steht noch eine Figur." } ]
     *
     * Warum das ins Regelwerk gehört und nicht in den Bildschirm: Die Frage
     * „warum darf ich gerade nicht rochieren" ist eine REGELFRAGE. Würde der
     * Bildschirm sie selbst beantworten, gäbe es die Bedingungen zweimal — und
     * die zweite Fassung liefe irgendwann der ersten hinterher. Der Bildschirm
     * zeigt nur an, was hier steht.
     */
    rochadeLage(stand, farbe) {
        const variante = SCHACH.varianteVon(stand);

        if (!variante.rochade) {
            return [
                { seite: "kurz", turmFeld: -1, zielFeld: -1, moeglich: false,
                    grund: "In dieser Spielart gibt es keine Rochade." },
                { seite: "lang", turmFeld: -1, zielFeld: -1, moeglich: false,
                    grund: "In dieser Spielart gibt es keine Rochade." }
            ];
        }

        /* Auf dem Doppelbrett hat jede Seite zwei Könige — jeder bekommt seine
           eigenen Einträge. */
        const antworten = [];

        for (const koenigFeld of SCHACH.koenigFelder(stand, farbe)) {
            for (const weg of SCHACH._rochadeWege(stand, koenigFeld, farbe)) {
                antworten.push({
                    seite: weg.seite,
                    koenigFeld: koenigFeld,
                    turmFeld: weg.turmFeld,
                    zielFeld: weg.zielFeld,
                    moeglich: weg.moeglich,
                    grund: weg.grund
                });
            }
        }

        /* Damit der Bildschirm sich auf zwei Einträge verlassen kann, gibt es
           auch dann je einen für kurz und lang, wenn gar kein Turm mehr steht. */
        for (const seite of ["kurz", "lang"]) {
            if (!antworten.some((eintrag) => eintrag.seite === seite)) {
                antworten.push({
                    seite: seite,
                    koenigFeld: -1,
                    turmFeld: -1,
                    zielFeld: -1,
                    moeglich: false,
                    grund: "Das Recht ist verfallen: König oder Turm haben sich schon bewegt."
                });
            }
        }

        antworten.sort((einer, anderer) => (einer.seite === "kurz") ? -1 : 1);
        return antworten;
    },

    /*
     * ZÄHLT DER KÖNIG DIESER FARBE GERADE ALS GEWÖHNLICHE FIGUR? (seit v0.49)
     *
     * Zwei Wege führen dorthin, und sie sind verschieden:
     *
     *   `koenigSchlagbar`   Eigenschaft der SPIELART: Auf diesem Brett gibt es
     *                       nie Schach und nie Matt (Doppelbrett). Die Antwort
     *                       hängt nicht von der Stellung ab.
     *
     *   `koenigeAlsLeben`   Eigenschaft der STELLUNG: Solange eine Seite mehr
     *                       als einen König hat, sind ihre Könige gewöhnliche
     *                       Figuren — man schlägt sie einfach. Beim LETZTEN
     *                       kippt es: Er ist ein richtiger König, mit Schach und
     *                       Matt. Das sind die zwei Leben der Spielart
     *                       „Zufallsarmee".
     *
     * Die Frage wird JE FARBE gestellt, nicht für das Brett. Weiss kann zwei
     * Könige haben und Schwarz einen — dann kann Weiss nicht ins Schach kommen,
     * Schwarz schon, und beides gilt gleichzeitig.
     */
    koenigSchlagbarFuer(stand, farbe) {
        const variante = SCHACH.varianteVon(stand);

        if (variante.koenigSchlagbar) {
            return true;
        }

        /*
         * `koenigeAlsLeben` kommt aus zwei Quellen (seit v0.51): aus der
         * SPIELART (die alte Spielart „Zufallsarmee", jetzt versteckt) oder aus
         * dem STAND. Der Stand ist der neue Weg: Seit die Zufallsarmee ein
         * Haken ist, kann sie auf jeder Spielart liegen — und `schach.js` sieht
         * nur den Stand, nie die Regeln der Partie. Also schreibt
         * `SCHACH_RUNDE` sie beim Anlegen in den Stand hinein.
         */
        if (!variante.koenigeAlsLeben && !stand.koenigeAlsLeben) {
            return false;
        }
        return SCHACH.koenigFelder(stand, farbe).length > 1;
    },

    /*
     * Steht der König dieser Farbe im Schach?
     * Wo der König als gewöhnliche Figur zählt, gibt es kein Schach.
     */
    imSchach(stand, farbe) {
        if (SCHACH.koenigSchlagbarFuer(stand, farbe)) {
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
            rochadeFelder: stand.rochadeFelder.slice(),
            rochadeKoenige: stand.rochadeKoenige.slice(),
            enPassant: "",
            halbzuege: stand.halbzuege + 1,
            takt: stand.takt + 1,
            zugNummer: stand.zugNummer + ((stand.amZug === SCHACH.SCHWARZ && !nochmal) ? 1 : 0),
            extraZug: nochmal ? "" : stand.extraZug,

            /* Ein zusätzliches Zugmuster gilt für genau einen Zug. */
            zusatzFarbe: (stand.zusatzFarbe === stand.amZug) ? "" : stand.zusatzFarbe,
            zusatzMuster: (stand.zusatzFarbe === stand.amZug) ? "" : stand.zusatzMuster,
            zusatzNurDieses: (stand.zusatzFarbe === stand.amZug)
                ? false : stand.zusatzNurDieses,

            /* Gilt für die ganze Partie und wandert deshalb unverändert mit. */
            koenigeAlsLeben: stand.koenigeAlsLeben,

            sprungAktiv: "",

            /*
             * Das Schild hält den nächsten gegnerischen Zug aus; danach ist es
             * verbraucht. Zieht die geschützte Figur selbst, wandert es nicht
             * mit — sie ist dann ja woanders.
             */
            schildFeld: -1,
            schildFarbe: "",

            /* Fessel und Frost gelten für den nächsten Zug der betroffenen Seite. */
            fesselFeld: (stand.fesselFarbe === stand.amZug) ? -1 : stand.fesselFeld,
            fesselFarbe: (stand.fesselFarbe === stand.amZug) ? "" : stand.fesselFarbe,
            frostFeld: (stand.frostFarbe === stand.amZug) ? -1 : stand.frostFeld,
            frostFarbe: (stand.frostFarbe === stand.amZug) ? "" : stand.frostFarbe,

            /* Das volle Glas läuft nach Zugzähler ab, nicht nach Farbe. */
            glasFarbe: stand.glasFarbe,
            glasBis: stand.glasBis,

            /* Abgelaufene Mauern verschwinden hier — sonst wüchse die Liste
               über die ganze Partie, obwohl längst nichts mehr steht. */
            mauern: SCHACH.mauern(stand),

            /* Geliehene Figuren wandern mit ihrem Zug mit; eine geschlagene
               verliert ihren Eintrag. */
            geliehen: SCHACH._geliehenNachfuehren(stand, zug.von, zug.nach)
        };

        if (stand.schildFeld >= 0 && stand.schildFarbe === stand.amZug
            && stand.schildFeld !== zug.von) {
            /* Die eigene Seite zieht mit einer ANDEREN Figur: Das Schild bleibt. */
            neu.schildFeld = stand.schildFeld;
            neu.schildFarbe = stand.schildFarbe;
        }

        neu.sprungAktiv = (neu.zusatzMuster === "springer") ? neu.zusatzFarbe : "";

        const figur = SCHACH.figurAuf(stand, zug.von);
        const farbe = SCHACH.farbeVon(figur);
        const art = SCHACH.artVon(figur);

        let brett = neu.brett;

        /* Grundbewegung. */
        brett = SCHACH._brettMit(brett, zug.von, ".");

        /*
         * Bei der Rochade wird der Turm ZUERST vom Brett genommen. Auf schmalen
         * Brettern (6 Spalten) landet der König auf dem Feld, auf dem der Turm
         * steht — würde der Turm später geräumt, verschwände dabei der König.
         */
        if (zug.rochade && Number.isInteger(zug.turmVon)) {
            brett = SCHACH._brettMit(brett, zug.turmVon, ".");
        }
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

        /* Rochade: der Turm zieht mit. Wohin, steht im Zug selbst — auf einem
           16 Felder breiten Brett gibt es keine festen Plätze. */
        if (zug.rochade && Number.isInteger(zug.turmNach)) {
            brett = SCHACH._brettMit(brett, zug.turmNach, (farbe === SCHACH.WEISS) ? "T" : "t");
        }

        neu.brett = brett;

        /*
         * Rochaderechte verfallen, sobald König oder Turm bewegt wurden — oder
         * ein Turm geschlagen wird. Beim König verfallen alle Rechte seiner
         * Grundreihe; auf dem Doppelbrett behält der zweite König seine.
         */
        if (neu.rochadeFelder.length > 0) {
            let felderRecht = neu.rochadeFelder
                .filter((feld) => feld !== zug.von && feld !== zug.nach);

            if (art === "K") {
                /* Genau die Türme, mit denen dieser König hätte rochieren
                   können — dieselbe Auswahl wie bei der Zugerzeugung. Auf dem
                   Doppelbrett behält der zweite König dadurch seine Rechte. */
                const seine = SCHACH._rochadeTuerme(stand, zug.von, farbe);
                felderRecht = felderRecht.filter((feld) => seine.indexOf(feld) === -1);

                /* Und der König selbst ist für immer raus. */
                neu.rochadeKoenige = neu.rochadeKoenige.filter((feld) => feld !== zug.von);
            }

            neu.rochadeFelder = felderRecht;
        }

        /* Die alten vier Buchstaben mitführen, damit der Vertrag additiv
           bleibt und ältere Stände lesbar sind. */
        if (neu.rochade) {
            const unten = (SCHACH.hoeheVon(stand) - 1) * breite;
            let rechte = "";

            if (neu.rochadeFelder.indexOf(unten + breite - 1) !== -1) { rechte += "K"; }
            if (neu.rochadeFelder.indexOf(unten) !== -1) { rechte += "D"; }
            if (neu.rochadeFelder.indexOf(breite - 1) !== -1) { rechte += "k"; }
            if (neu.rochadeFelder.indexOf(0) !== -1) { rechte += "d"; }
            neu.rochade = rechte;
        }

        /* Doppelschritt eines Bauern eröffnet en passant. */
        if (art === "B"
            && Math.abs(SCHACH.reiheVon(zug.nach, breite) - SCHACH.reiheVon(zug.von, breite)) === 2) {
            const zwischen = (SCHACH.reiheVon(zug.von, breite) + SCHACH.reiheVon(zug.nach, breite))
                / 2 * breite + SCHACH.spalteVon(zug.von, breite);
            neu.enPassant = SCHACH.feldName(zwischen, breite, SCHACH.hoeheVon(stand));
        }

        /*
         * Zähler für die Fünfzig-Züge-Regel. ACHTUNG: Er springt hier auf 0
         * zurück und taugt deshalb NICHT als Uhr für ablaufende Wirkungen —
         * dafür gibt es `takt`.
         */
        if (art === "B" || zug.schlaegt) {
            neu.halbzuege = 0;
        }

        /* Zerfallene Leihgaben verschwinden vom Brett (Fähigkeit „Friedhof"). */
        const zerfall = SCHACH._zerfallAnwenden(neu);
        neu.brett = zerfall.brett;
        neu.geliehen = SCHACH.geliehene(neu);

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
     * Wirkung der Fähigkeiten auf das Brett
     *
     * Diese vier ändern das Brett SOFORT, statt einen Zug zu erlauben. Sie
     * liegen hier und nicht in schach-runde.js, weil sie reine Brettarbeit
     * sind — wer sie einsetzen darf, entscheidet die Runde.
     *
     * Jede liefert { stand, felder, text } oder null, wenn sie nicht wirken
     * kann. `felder` sind die betroffenen Felder; der Bildschirm zeigt daran
     * die Animation.
     * ---------------------------------------------------------------- */

    /* Alle eigenen Bauern ein Feld vor, soweit frei. Geschlagen wird nicht. */
    bauernschub(stand, farbe) {
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const richtung = (farbe === SCHACH.WEISS) ? -1 : 1;
        const letzteReihe = (farbe === SCHACH.WEISS) ? 0 : hoehe - 1;
        const bauer = (farbe === SCHACH.WEISS) ? "B" : "b";
        const dame = (farbe === SCHACH.WEISS) ? "D" : "d";

        let brett = stand.brett;
        const felder = [];
        const wege = [];

        /*
         * Von vorn nach hinten durchgehen (in Zugrichtung), damit ein Bauer
         * das Feld freimacht, bevor der dahinter nachrückt. Sonst blockierten
         * sich zwei Bauern in derselben Spalte gegenseitig.
         */
        const reihen = [];
        for (let reihe = 0; reihe < hoehe; reihe++) {
            reihen.push(reihe);
        }
        if (richtung === 1) {
            reihen.reverse();
        }

        for (const reihe of reihen) {
            for (let spalte = 0; spalte < breite; spalte++) {
                const feld = reihe * breite + spalte;
                if (brett[feld] !== bauer) {
                    continue;
                }
                if (!SCHACH._imBrett(stand, reihe + richtung, spalte)) {
                    continue;
                }
                const ziel = SCHACH._feld(stand, reihe + richtung, spalte);
                if (brett[ziel] !== ".") {
                    continue;
                }

                brett = SCHACH._brettMit(brett, feld, ".");
                brett = SCHACH._brettMit(brett, ziel,
                    (SCHACH.reiheVon(ziel, breite) === letzteReihe) ? dame : bauer);
                felder.push(feld, ziel);
                wege.push({ von: feld, nach: ziel });
            }
        }

        if (felder.length === 0) {
            return null;
        }

        const neu = Object.assign({}, stand, { brett: brett, enPassant: "" });
        return { stand: neu, felder: felder, wege: wege, text: "Bauernschub" };
    },

    /* Ein eigener Bauer wird zum Springer. */
    verstaerkung(stand, farbe, feld) {
        const bauer = (farbe === SCHACH.WEISS) ? "B" : "b";
        if (SCHACH.figurAuf(stand, feld) !== bauer) {
            return null;
        }

        const springer = (farbe === SCHACH.WEISS) ? "S" : "s";
        const neu = Object.assign({}, stand, {
            brett: SCHACH._brettMit(stand.brett, feld, springer)
        });

        return {
            stand: neu,
            felder: [feld],
            text: "Verstärkung auf " + SCHACH.feldName(feld, SCHACH.breiteVon(stand),
                SCHACH.hoeheVon(stand))
        };
    },

    /*
     * Erdbeben: Alle Figuren rund um das gewählte Feld werden ein Feld nach
     * aussen geschoben, soweit dort Platz ist. Könige bleiben stehen — sonst
     * liesse sich ein König aus einem Matt herausschieben oder umgekehrt
     * hineinschieben, und die Partie endete durch eine Fähigkeit statt durch
     * einen Zug.
     */
    /* Wie viele Reihen ein Erdbeben erfasst. */
    ERDBEBEN_REIHEN: 3,

    /*
     * Erdbeben (seit v3.3 umgebaut): Es schiebt DREI ganze Reihen um ein Feld
     * zur Seite.
     *
     * Das angetippte Feld sagt beides:
     *   - seine Reihe ist die MITTLERE der drei (am Rand entsprechend weniger),
     *   - seine Spalte sagt die RICHTUNG: linke Bretthälfte nach links, rechte
     *     nach rechts. Dasselbe Muster wie beim Nudelholz, wo oben und unten
     *     die Richtung bestimmen — ein Tipp beantwortet beide Fragen.
     *
     * DIE REIHENFOLGE IST DIE GANZE ARBEIT.
     * Verschiebt man nach rechts, muss die Figur GANZ RECHTS zuerst gehen: Erst
     * dann wird das Feld frei, in das ihr Nachbar nachrückt. Läuft man
     * andersherum, überschreibt die erste Figur ihren Nachbarn — dieselbe
     * Falle wie bei der Rochade auf dem 6er-Brett (siehe DECISIONS).
     *
     * Wer nicht kann, bleibt stehen: die Figur am Rand, und jede, hinter der
     * sich ein voller Block bis zum Rand staut. Die anderen rücken auf wie eine
     * Schlange, eine nach der anderen.
     *
     * Könige bleiben stehen — sonst liesse sich ein König aus dem Schach oder
     * in ein Schach hinein schieben, ohne dass jemand einen Zug macht.
     */
    erdbeben(stand, feld) {
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);

        /* Linke Hälfte schiebt nach links, rechte nach rechts. */
        const richtung = (spalte < breite / 2) ? -1 : 1;

        /* Die mittlere Reihe ist die angetippte; oben und unten je eine dazu,
           soweit das Brett reicht. */
        const halb = Math.floor(SCHACH.ERDBEBEN_REIHEN / 2);
        let brett = stand.brett;
        const felder = [];
        const wege = [];

        for (let r = reihe - halb; r <= reihe + halb; r++) {
            if (r < 0 || r >= hoehe) {
                continue;
            }

            /*
             * Gegen die Schubrichtung durchlaufen: nach rechts geschoben
             * beginnt es bei der rechten Spalte.
             */
            const start = (richtung === 1) ? breite - 1 : 0;
            const ende = (richtung === 1) ? -1 : breite;

            for (let s = start; s !== ende; s -= richtung) {
                const von = SCHACH._feld(stand, r, s);
                const figur = brett[von];

                if (figur === "." || SCHACH.artVon(figur) === "K") {
                    continue;
                }

                const zielS = s + richtung;
                if (zielS < 0 || zielS >= breite) {
                    continue;
                }

                const ziel = SCHACH._feld(stand, r, zielS);

                /* Besetzt oder vermauert: Diese Figur bleibt, wo sie ist. */
                if (brett[ziel] !== "." || SCHACH.mauerAuf(stand, ziel)) {
                    continue;
                }

                brett = SCHACH._brettMit(brett, von, ".");
                brett = SCHACH._brettMit(brett, ziel, figur);
                felder.push(von, ziel);
                wege.push({ von: von, nach: ziel });
            }
        }

        if (felder.length === 0) {
            return null;
        }

        const neu = Object.assign({}, stand, { brett: brett, enPassant: "" });
        return {
            stand: neu,
            felder: felder,
            wege: wege,
            text: "Erdbeben nach " + ((richtung === 1) ? "rechts" : "links")
        };
    },

    /*
     * Nudelholz: Zwei benachbarte Spalten werden um ein Feld verschoben.
     * `richtung` ist -1 (nach oben) oder +1 (nach unten). Könige bleiben
     * stehen, und wo kein Platz ist, bleibt die Figur ebenfalls.
     */
    nudelholz(stand, spalte, richtung) {
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const spalten = [spalte, spalte + 1].filter((wert) => wert >= 0 && wert < breite);

        let brett = stand.brett;
        const felder = [];
        const wege = [];

        /* In Laufrichtung von vorn abarbeiten, damit eine Figur Platz macht,
           bevor die nächste nachrückt. */
        const reihen = [];
        for (let reihe = 0; reihe < hoehe; reihe++) {
            reihen.push(reihe);
        }
        if (richtung === 1) {
            reihen.reverse();
        }

        for (const reihe of reihen) {
            for (const lauf of spalten) {
                const von = SCHACH._feld(stand, reihe, lauf);
                const figur = brett[von];

                if (figur === "." || SCHACH.artVon(figur) === "K") {
                    continue;
                }
                if (!SCHACH._imBrett(stand, reihe + richtung, lauf)) {
                    continue;
                }

                const ziel = SCHACH._feld(stand, reihe + richtung, lauf);
                if (brett[ziel] !== ".") {
                    continue;
                }

                brett = SCHACH._brettMit(brett, von, ".");
                brett = SCHACH._brettMit(brett, ziel, figur);
                felder.push(von, ziel);
                wege.push({ von: von, nach: ziel });
            }
        }

        if (felder.length === 0) {
            return null;
        }

        const neu = Object.assign({}, stand, { brett: brett, enPassant: "" });
        return {
            stand: neu,
            felder: felder,
            wege: wege,
            text: "Spalten " + SCHACH.SPALTEN[spalten[0]]
                + (spalten.length > 1 ? " und " + SCHACH.SPALTEN[spalten[1]] : "")
                + ((richtung === -1) ? " nach oben" : " nach unten")
        };
    },

    /* Spiegel: Eine Figur wird auf ein freies Nachbarfeld verdoppelt. */
    spiegel(stand, farbe, feld) {
        const figur = SCHACH.figurAuf(stand, feld);

        if (SCHACH.farbeVon(figur) !== farbe || SCHACH.artVon(figur) === "K") {
            return null;
        }

        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);

        /* Das erste freie Nachbarfeld — feste Reihenfolge, damit alle Geräte
           dasselbe Ergebnis bekommen. */
        for (const richtung of [[0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const r = reihe + richtung[0];
            const s = spalte + richtung[1];

            if (!SCHACH._imBrett(stand, r, s)) {
                continue;
            }
            const ziel = SCHACH._feld(stand, r, s);
            if (SCHACH.figurAuf(stand, ziel) !== ".") {
                continue;
            }

            const neu = Object.assign({}, stand, {
                brett: SCHACH._brettMit(stand.brett, ziel, figur)
            });

            return {
                stand: neu,
                felder: [feld, ziel],
                wege: [],
                text: SCHACH.artName(SCHACH.artVon(figur)) + " verdoppelt"
            };
        }

        return null;
    },

    /*
     * Den Zug abgeben, ohne zu ziehen (seit v3.3).
     *
     * Gebraucht für Fähigkeiten mit `beendetZug`: Sie wirken aufs Brett und
     * beenden damit den Zug, es bewegt sich aber keine Figur. Was hier alles
     * passiert, muss zu `_ausfuehren` passen — deshalb steht es HIER in den
     * Regeln und nicht in schach-runde.js:
     *
     *   - die andere Seite kommt an den Zug,
     *   - die Zugnummer wächst, wenn Schwarz fertig ist,
     *   - `enPassant` verfällt (das Recht gilt nur unmittelbar danach),
     *   - ein zusätzliches Zugmuster verfällt, weil der Zug vorbei ist, ohne
     *     dass es benutzt wurde.
     *
     * NICHT angefasst werden Schild, Fessel und Frost: Sie laufen nach dem Zug
     * der BETROFFENEN Seite ab, und die war hier nicht dran.
     */
    zugAbgeben(stand) {
        const nachher = SCHACH.gegner(stand.amZug);

        /*
         * DAS ZUSATZMUSTER BLEIBT (seit v0.47).
         *
         * Es gilt „für deinen nächsten ZUG" — und den hat man noch vor sich,
         * wenn man den Zug abgibt, statt zu ziehen. Bis v0.46 wurde es hier
         * gelöscht; damit war ein Muster, das man vor dem Abgeben gesetzt hat,
         * verbraucht, aber nie zu gebrauchen. Denselben Fehler gab es schon
         * einmal (v0.41, siehe `docs\entscheidungen\erkenntnisse.md`).
         *
         * Betroffen ist seit v0.48 nur noch das Ausweichen (Sprung und Teleport
         * geben den Zug nicht mehr ab, sie SIND er) — die Regel bleibt
         * trotzdem, denn sie gilt für jedes Muster.
         *
         * Verbraucht wird das Muster weiterhin durch den eigenen Zug —
         * `_ausfuehren` löscht es, sobald die Farbe zieht, der es gehört.
         */
        const weiter = Object.assign({}, stand, {
            amZug: nachher,
            enPassant: "",
            halbzuege: stand.halbzuege + 1,
            takt: stand.takt + 1,
            zugNummer: stand.zugNummer
                + ((stand.amZug === SCHACH.SCHWARZ) ? 1 : 0),
            sprungAktiv: (stand.zusatzMuster === "springer") ? stand.zusatzFarbe : "",
            mauern: SCHACH.mauern(stand),
            geliehen: SCHACH.geliehene(stand)
        });

        /* Erst zählen, dann zerfallen lassen — sonst bliebe eine Leihgabe
           einen Halbzug länger, als versprochen. */
        const zerfall = SCHACH._zerfallAnwenden(weiter);
        weiter.brett = zerfall.brett;
        weiter.geliehen = SCHACH.geliehene(weiter);

        return weiter;
    },

    /* ---------------------------------------------------------------- *
     * Friedhof (seit v3.3)
     *
     * Gefallene GEGNER stehen auf einem 2×2-Feld wieder auf — in DEINER Farbe,
     * für ein paar Züge. Danach zerfallen sie.
     *
     * Die eigentliche Schwierigkeit ist nicht das Aufstellen, sondern das
     * Mitführen: Eine geliehene Figur zieht wie jede andere, also muss ihr
     * Eintrag ihr über das Brett folgen. Deshalb steht hier `_geliehenNachfuehren`
     * und wird von JEDER Stelle gerufen, die eine Figur bewegt.
     * ---------------------------------------------------------------- */

    /* Wie lange geliehene Figuren bleiben, in Halbzügen. */
    FRIEDHOF_HALBZUEGE: 8,

    /* Kantenlänge des Feldes, auf dem sie erscheinen. */
    FRIEDHOF_KANTE: 2,

    /* Die geliehenen Figuren, die JETZT noch stehen. */
    geliehene(stand) {
        if (!Array.isArray(stand.geliehen)) {
            return [];
        }
        return stand.geliehen.filter((eintrag) => eintrag.bis > stand.takt);
    },

    /* Ist die Figur auf diesem Feld geliehen? */
    istGeliehen(stand, feld) {
        return SCHACH.geliehene(stand).some((eintrag) => eintrag.feld === feld);
    },

    /*
     * Führt die Einträge über einen Zug hinweg nach:
     *   - zieht eine geliehene Figur, wandert ihr Eintrag mit,
     *   - wird eine geliehene Figur geschlagen, verfällt ihr Eintrag,
     *   - abgelaufene verschwinden.
     *
     * `nach` darf -1 sein — dann wurde nur geräumt (Handel, Zerfall).
     */
    _geliehenNachfuehren(stand, von, nach) {
        return SCHACH.geliehene(stand)
            /* Was auf dem Zielfeld stand, ist geschlagen worden. */
            .filter((eintrag) => eintrag.feld !== nach || eintrag.feld === von)
            .map((eintrag) => (eintrag.feld === von && nach >= 0)
                ? { feld: nach, bis: eintrag.bis }
                : eintrag);
    },

    /*
     * Nimmt zerfallene Leihgaben vom Brett. Liefert { brett, felder } —
     * `felder` sind die Stellen, an denen etwas verschwunden ist.
     *
     * Gerufen wird das NACH dem Hochzählen von `halbzuege`, damit eine Figur
     * genau so viele Züge bleibt, wie versprochen.
     */
    _zerfallAnwenden(stand) {
        const felder = [];
        let brett = stand.brett;

        for (const eintrag of (stand.geliehen || [])) {
            if (eintrag.bis <= stand.takt && SCHACH.figurAuf(stand, eintrag.feld) !== ".") {
                brett = SCHACH._brettMit(brett, eintrag.feld, ".");
                felder.push(eintrag.feld);
            }
        }

        return { brett: brett, felder: felder };
    },

    /*
     * Den Friedhof öffnen: `arten` sind die Figuren, die aufstehen sollen,
     * `feld` ist die obere linke Ecke des 2×2-Blocks.
     *
     * Alle vier Felder müssen frei sein — auch wenn weniger Figuren aufstehen.
     * Das ist Absicht: So sieht man am angebotenen Zielfeld sofort, wo Platz
     * ist, ohne die Zahl der Gefallenen im Kopf zu haben.
     */
    friedhof(stand, farbe, feld, arten) {
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);
        const kante = SCHACH.FRIEDHOF_KANTE;

        if (!arten || arten.length === 0) {
            return null;
        }
        if (reihe + kante > hoehe || spalte + kante > breite) {
            return null;
        }

        const plaetze = [];
        for (let dr = 0; dr < kante; dr++) {
            for (let ds = 0; ds < kante; ds++) {
                const ziel = SCHACH._feld(stand, reihe + dr, spalte + ds);

                if (SCHACH.figurAuf(stand, ziel) !== "." || SCHACH.mauerAuf(stand, ziel)) {
                    return null;
                }
                plaetze.push(ziel);
            }
        }

        let brett = stand.brett;
        const geliehen = SCHACH.geliehene(stand).slice();
        const felder = [];
        const bis = stand.takt + SCHACH.FRIEDHOF_HALBZUEGE;

        for (let nummer = 0; nummer < arten.length && nummer < plaetze.length; nummer++) {
            const art = arten[nummer];

            /* Könige stehen nie auf — sonst gäbe es zwei auf einer Seite, und
               „Schachmatt" wäre nicht mehr eindeutig. */
            if (art === "K" || SCHACH.artName(art) === "") {
                continue;
            }

            const figur = (farbe === SCHACH.WEISS) ? art : art.toLowerCase();
            brett = SCHACH._brettMit(brett, plaetze[nummer], figur);
            geliehen.push({ feld: plaetze[nummer], bis: bis });
            felder.push(plaetze[nummer]);
        }

        if (felder.length === 0) {
            return null;
        }

        return {
            stand: Object.assign({}, stand, { brett: brett, geliehen: geliehen }),
            felder: felder,
            text: felder.length + ((felder.length === 1)
                ? " Figur steht auf" : " Figuren stehen auf")
        };
    },

    /* Eine verlorene Figur kehrt auf ein freies Feld zurück. */
    wiedergeburt(stand, farbe, feld, figurArt) {
        if (SCHACH.figurAuf(stand, feld) !== ".") {
            return null;
        }
        if (!figurArt || SCHACH.artName(figurArt) === "") {
            return null;
        }

        const figur = (farbe === SCHACH.WEISS) ? figurArt : figurArt.toLowerCase();
        const neu = Object.assign({}, stand, {
            brett: SCHACH._brettMit(stand.brett, feld, figur)
        });

        return {
            stand: neu,
            felder: [feld],
            text: SCHACH.artName(figurArt) + " kehrt zurück"
        };
    },

    /* ---------------------------------------------------------------- *
     * Wirkung der Unglückswürfel
     *
     * Sie treffen die Seite, die den Würfel eingesammelt hat. Alle vier
     * liefern dasselbe wie die Fähigkeiten: { stand, felder, wege, text } oder
     * null, wenn nichts passieren kann.
     * ---------------------------------------------------------------- */

    /* Stolperstein: Die Figur auf `feld` wird ein Feld zurückgeworfen. */
    stolperstein(stand, farbe, feld) {
        const breite = SCHACH.breiteVon(stand);
        const figur = SCHACH.figurAuf(stand, feld);

        if (SCHACH.farbeVon(figur) !== farbe) {
            return null;
        }

        /* Zurück heißt: in Richtung der eigenen Grundreihe. */
        const zurueck = (farbe === SCHACH.WEISS) ? 1 : -1;
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);

        if (!SCHACH._imBrett(stand, reihe + zurueck, spalte)) {
            return null;
        }

        const ziel = SCHACH._feld(stand, reihe + zurueck, spalte);
        if (SCHACH.figurAuf(stand, ziel) !== ".") {
            return null;
        }

        let brett = SCHACH._brettMit(stand.brett, feld, ".");
        brett = SCHACH._brettMit(brett, ziel, figur);

        return {
            stand: Object.assign({}, stand, { brett: brett, enPassant: "" }),
            felder: [feld, ziel],
            wege: [{ von: feld, nach: ziel }],
            text: SCHACH.artName(SCHACH.artVon(figur)) + " stolpert zurück"
        };
    },

    /*
     * Ausdehnung: Das Brett wächst an einer Seite um eine Reihe oder Spalte.
     * `seite` ist "oben", "unten", "links" oder "rechts".
     *
     * Die neuen Felder sind leer. Alle Feldnummern verschieben sich dabei —
     * deshalb werden auch die gemerkten Felder (Rochade, Schild, Fessel, Frost)
     * mit umgerechnet. Wer das vergisst, hat ein Schild auf dem falschen Feld.
     */
    ausdehnung(stand, seite) {
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);

        if ((seite === "links" || seite === "rechts") && breite >= SCHACH.SPALTEN.length) {
            return null;
        }
        if ((seite === "oben" || seite === "unten") && hoehe >= 9) {
            return null;
        }

        const neuBreite = (seite === "links" || seite === "rechts") ? breite + 1 : breite;
        const neuHoehe = (seite === "oben" || seite === "unten") ? hoehe + 1 : hoehe;

        /* Wohin rutscht das alte Brett? */
        const dSpalte = (seite === "links") ? 1 : 0;
        const dReihe = (seite === "oben") ? 1 : 0;

        const felder = new Array(neuBreite * neuHoehe).fill(".");
        const umrechnen = (feld) => {
            if (!Number.isInteger(feld) || feld < 0) {
                return -1;
            }
            const reihe = Math.floor(feld / breite) + dReihe;
            const spalte = (feld % breite) + dSpalte;
            return reihe * neuBreite + spalte;
        };

        for (let feld = 0; feld < breite * hoehe; feld++) {
            felder[umrechnen(feld)] = stand.brett[feld];
        }

        const neu = Object.assign({}, stand, {
            breite: neuBreite,
            hoehe: neuHoehe,
            brett: felder.join(""),
            enPassant: "",
            rochadeFelder: stand.rochadeFelder.map(umrechnen),
            rochadeKoenige: stand.rochadeKoenige.map(umrechnen),
            schildFeld: (stand.schildFeld >= 0) ? umrechnen(stand.schildFeld) : -1,
            fesselFeld: (stand.fesselFeld >= 0) ? umrechnen(stand.fesselFeld) : -1,
            frostFeld: (stand.frostFeld >= 0) ? umrechnen(stand.frostFeld) : -1
        });

        const namen = { oben: "oben", unten: "unten", links: "links", rechts: "rechts" };

        return {
            stand: neu,
            felder: [],
            wege: [],
            text: "Das Feld wächst " + (namen[seite] || seite)
        };
    },

    /* Meuterei: Eine eigene Figur wechselt die Seite. */
    meuterei(stand, farbe, wahl) {
        const eigene = [];

        for (let feld = 0; feld < SCHACH.felderVon(stand); feld++) {
            const figur = SCHACH.figurAuf(stand, feld);
            if (SCHACH.farbeVon(figur) === farbe && SCHACH.artVon(figur) !== "K") {
                eigene.push(feld);
            }
        }

        if (eigene.length === 0) {
            return null;
        }

        const feld = eigene[Math.floor(wahl * eigene.length) % eigene.length];
        const figur = SCHACH.figurAuf(stand, feld);
        const gewendet = (farbe === SCHACH.WEISS)
            ? figur.toLowerCase()
            : figur.toUpperCase();

        return {
            stand: Object.assign({}, stand, {
                brett: SCHACH._brettMit(stand.brett, feld, gewendet)
            }),
            felder: [feld],
            wege: [],
            text: SCHACH.artName(SCHACH.artVon(figur)) + " läuft über"
        };
    },

    /* Erdrutsch: Alle eigenen Figuren ein Feld zurück. */
    erdrutsch(stand, farbe) {
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const zurueck = (farbe === SCHACH.WEISS) ? 1 : -1;

        let brett = stand.brett;
        const felder = [];
        const wege = [];

        /* In Rutschrichtung von vorn abarbeiten, damit vorn Platz entsteht. */
        const reihen = [];
        for (let reihe = 0; reihe < hoehe; reihe++) {
            reihen.push(reihe);
        }
        if (zurueck === 1) {
            reihen.reverse();
        }

        for (const reihe of reihen) {
            for (let spalte = 0; spalte < breite; spalte++) {
                const von = reihe * breite + spalte;
                const figur = brett[von];

                if (SCHACH.farbeVon(figur) !== farbe || SCHACH.artVon(figur) === "K") {
                    continue;
                }
                if (!SCHACH._imBrett(stand, reihe + zurueck, spalte)) {
                    continue;
                }

                const ziel = SCHACH._feld(stand, reihe + zurueck, spalte);
                if (brett[ziel] !== ".") {
                    continue;
                }

                brett = SCHACH._brettMit(brett, von, ".");
                brett = SCHACH._brettMit(brett, ziel, figur);
                felder.push(von, ziel);
                wege.push({ von: von, nach: ziel });
            }
        }

        if (felder.length === 0) {
            return null;
        }

        return {
            stand: Object.assign({}, stand, { brett: brett, enPassant: "" }),
            felder: felder,
            wege: wege,
            text: "Alles rutscht zurück"
        };
    },

    /*
     * WIE LANGE GILT AUF DIESEM FELD NOCH ETWAS? (seit v0.53)
     *
     * Liefert die Zahl der Halbzüge, die eine zeitlich begrenzte Wirkung hier
     * noch hat — 0, wenn nichts abläuft. Der Bildschirm zeichnet daraus die
     * kleine Zahl an der Ecke des Feldes.
     *
     * Warum im REGELWERK und nicht im Bildschirm: Die Fristen stehen hier
     * (`bis` gegen `takt`, Schild und Fessel gegen den nächsten Zug). Wer sie
     * im Bildschirm nachrechnet, hat sie zweimal — und beim nächsten Umbau
     * stimmt eine von beiden nicht mehr.
     *
     * Liegt mehreres auf einem Feld, zählt das, was ZUERST abläuft: Danach
     * ändert sich dort etwas, und genau darauf will man sich einstellen.
     */
    restzeitAuf(stand, feld) {
        const reste = [];

        for (const leihe of SCHACH.geliehene(stand)) {
            if (leihe.feld === feld) {
                reste.push(leihe.bis - stand.takt);
            }
        }

        for (const mauer of SCHACH.mauern(stand)) {
            if (mauer.felder.indexOf(feld) !== -1) {
                reste.push(mauer.bis - stand.takt);
            }
        }

        /*
         * Schild, Fessel und Frost hängen an keiner Uhr, sondern am nächsten
         * Zug der betroffenen Seite. Das ist genau ein Halbzug — ist die Seite
         * gerade am Zug, läuft er JETZT ab, sonst nach dem Zug des Gegners.
         */
        if (stand.schildFeld === feld && stand.schildFarbe) {
            reste.push((stand.amZug === stand.schildFarbe) ? 2 : 1);
        }
        if (stand.fesselFeld === feld && stand.fesselFarbe) {
            reste.push((stand.amZug === stand.fesselFarbe) ? 1 : 2);
        }
        if (stand.frostFeld === feld && stand.frostFarbe) {
            reste.push((stand.amZug === stand.frostFarbe) ? 1 : 2);
        }

        const gueltig = reste.filter((rest) => rest > 0);
        if (gueltig.length === 0) {
            return 0;
        }

        return Math.min.apply(null, gueltig);
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

        const variante = SCHACH.varianteVon(stand);

        /*
         * Wo Könige überhaupt geschlagen werden können, zählt zuerst: Wer
         * keinen mehr hat, hat verloren. Das gilt für beide Wege dorthin — für
         * das Doppelbrett (`koenigSchlagbar`, nie Schach) und für die zwei
         * Leben der Zufallsarmee (`koenigeAlsLeben`). Bei letzterer greift
         * dieser Fall aber erst, wenn AUCH der letzte König weg ist, und der
         * ist unantastbar: Die Partie endet dort durch Matt, nicht hier.
         */
        if (variante.koenigSchlagbar || variante.koenigeAlsLeben) {
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
        }

        /* Bretter ohne Schach-Begriff sind damit fertig. */
        if (variante.koenigSchlagbar) {
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
