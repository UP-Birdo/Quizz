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

    /* Wie lange das volle Glas die Sicht trübt (in Halbzügen). */
    GLAS_HALBZUEGE: 8,

    /*
     * Wie lange auf die Zustimmung des Teams gewartet wird (in Sekunden), je
     * nachdem wie oft jemand schon nicht mitgestimmt hat.
     *
     * Der Grund für die Staffelung: Ein Team mit zwei Leuten könnte sonst gar
     * nichts mehr tun, sobald einer aufhört mitzuspielen. Wer zweimal nicht
     * abstimmt, verkürzt die Frist — bis sie bei fünf Sekunden liegt, dann bei
     * drei. Sobald er wieder mitstimmt, fängt sie von vorn an.
     */
    FRIST_SEKUNDEN: [10, 5, 3],

    /* Nach so vielen versäumten Abstimmungen rutscht man eine Stufe tiefer. */
    FRIST_NACH_VERSAEUMNISSEN: 2,

    /*
     * Fassung der Fähigkeiten-Ablage. 1 hieß: vier feste Felder von Beginn an.
     * 2 heißt: Würfel erscheinen über die Partie verteilt. Partien ohne diese
     * Angabe stammen aus Fassung 1 und werden übernommen.
     */
    BONUS_FASSUNG: 2,

    leereRunde(zeitpunkt, varianteId, id, titel) {
        const variante = SCHACH_VARIANTEN.holen(varianteId);
        const wann = (zeitpunkt === undefined) ? 0 : zeitpunkt;

        return {
            datenVersion: SCHACH_RUNDE.DATEN_VERSION,
            id: id || "",
            titel: titel || "",
            variante: variante.id,
            erstelltAm: wann,

            /*
             * Wann die Partie wirklich losging (beide Seiten bereit) — seit
             * v3.3, für die Spieldauer im Spielerprofil. 0 heisst: noch nicht
             * gestartet, oder eine Partie von vorher. Dann tritt `erstelltAm`
             * an die Stelle; die Zahl ist dann grosszügiger, aber nie falsch
             * herum.
             */
            gestartetAm: 0,

            geaendertAm: wann,
            stand: SCHACH.neuerStand(variante.id),
            zugZaehler: 0,
            laeuft: false,
            ergebnis: "",
            teams: { weiss: [], schwarz: [] },
            bereit: { weiss: false, schwarz: false },
            faehigkeiten: { weiss: [], schwarz: [] },
            bonusGesammelt: [],

            /* Die Würfel, die gerade auf dem Brett liegen: [{ feld, art }].
               Seit Fassung 2 erscheinen sie über die Partie verteilt, statt von
               Anfang an fest zu liegen. */
            bonus: [],
            bonusFassung: SCHACH_RUNDE.BONUS_FASSUNG,

            /* Geschlagene Figuren je Farbe, für die Wiedergeburt. */
            verloren: { weiss: [], schwarz: [] },

            /*
             * Dasselbe noch einmal, aber MIT DEM ORT: [{ art, feld }] je Farbe,
             * das Jüngste hinten. Seit v3.3 für die Fähigkeit „Wiederbelebung",
             * die eine Figur genau dorthin zurückholt, wo sie fiel.
             *
             * Warum eine zweite Liste statt `verloren` umzubauen: `verloren`
             * wird an vier Stellen gelesen (Bilanz, Beutewert, Wiedergeburt,
             * Anzeige) und steht in jeder laufenden Partie. Eine Liste, deren
             * Elemente plötzlich Objekte statt Zeichen sind, hätte jede davon
             * angefasst — für einen Gewinn, den eine zusätzliche Liste genauso
             * bringt. Partien von vor v3.3 haben sie nicht; dann findet die
             * Wiederbelebung eben nichts, bis wieder etwas geschlagen wird.
             */
            gefallen: { weiss: [], schwarz: [] },

            /*
             * Was beim Anlegen eingestellt wurde. Die Vorgaben entsprechen dem
             * Verhalten von vorher, damit angefangene Partien sich nicht
             * ändern — sie haben diese Felder nicht und bekommen genau das,
             * was sie schon hatten.
             */
            regeln: {
                /* Erscheinen Würfel mit Fähigkeiten? Ohne Angabe entscheidet
                   die Spielart, wie bisher. */
                faehigkeiten: null,
                /* Zeigt der Würfel seine Seltenheit schon auf dem Brett? */
                seltenheitZeigen: true,
                /* Muss sich das Team über einen Zug einig werden? */
                einigkeit: false
            },

            /*
             * Der Vorschlag, über den gerade abgestimmt wird (nur bei
             * `einigkeit`). Er trägt entweder einen Zug oder eine Fähigkeit:
             *
             *   { art: "zug", von, nach, umwandlung, wer, name, zugZaehler,
             *     stimmen: [ids], frist: <Zeitpunkt in ms> }
             *   { art: "faehigkeit", faehigkeit, zielFeld, … }
             */
            vorschlag: null,

            /*
             * Wie oft jemand eine Abstimmung hat verstreichen lassen. Daraus
             * folgt die Frist beim nächsten Mal — siehe FRIST_SEKUNDEN.
             */
            versaeumt: {},

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
        if (typeof roh.gestartetAm === "number" && isFinite(roh.gestartetAm)
            && roh.gestartetAm >= 0) {
            runde.gestartetAm = roh.gestartetAm;
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

        for (const farbe of ["weiss", "schwarz"]) {
            const liste = (roh.verloren && Array.isArray(roh.verloren[farbe]))
                ? roh.verloren[farbe] : [];
            runde.verloren[farbe] = liste
                .filter((art) => typeof art === "string" && SCHACH.artName(art) !== "");

            const gefallene = (roh.gefallen && Array.isArray(roh.gefallen[farbe]))
                ? roh.gefallen[farbe] : [];
            runde.gefallen[farbe] = gefallene
                .filter((eintrag) => eintrag && typeof eintrag.art === "string"
                    && SCHACH.artName(eintrag.art) !== ""
                    && Number.isInteger(eintrag.feld) && eintrag.feld >= 0)
                .map((eintrag) => ({ art: eintrag.art, feld: eintrag.feld }));
        }

        if (roh.regeln && typeof roh.regeln === "object") {
            if (roh.regeln.faehigkeiten === true || roh.regeln.faehigkeiten === false) {
                runde.regeln.faehigkeiten = roh.regeln.faehigkeiten;
            }
            runde.regeln.seltenheitZeigen = (roh.regeln.seltenheitZeigen !== false);
            runde.regeln.einigkeit = (roh.regeln.einigkeit === true);
        }

        if (roh.vorschlag && typeof roh.vorschlag === "object") {
            const roher = roh.vorschlag;
            const stimmen = Array.isArray(roher.stimmen) ? roher.stimmen : [];
            const istFaehigkeit = (roher.art === "faehigkeit")
                && !!SCHACH_VARIANTEN.FAEHIGKEITEN[roher.faehigkeit];

            if (istFaehigkeit || (Number.isInteger(roher.von) && Number.isInteger(roher.nach))) {
                runde.vorschlag = {
                    art: istFaehigkeit ? "faehigkeit" : "zug",
                    faehigkeit: istFaehigkeit ? roher.faehigkeit : "",
                    zielFeld: Number.isInteger(roher.zielFeld) ? roher.zielFeld : -1,
                    von: Number.isInteger(roher.von) ? roher.von : -1,
                    nach: Number.isInteger(roher.nach) ? roher.nach : -1,
                    umwandlung: (typeof roher.umwandlung === "string") ? roher.umwandlung : "D",
                    wer: (typeof roher.wer === "string") ? roher.wer : "",
                    name: (typeof roher.name === "string") ? roher.name : "",
                    zugZaehler: Number.isInteger(roher.zugZaehler) ? roher.zugZaehler : 0,
                    frist: (typeof roher.frist === "number" && isFinite(roher.frist))
                        ? roher.frist : 0,
                    stimmen: stimmen
                        .filter((id) => typeof id === "string" && id !== "")
                        .filter((id, stelle, alle) => alle.indexOf(id) === stelle)
                };
            }
        }

        if (roh.versaeumt && typeof roh.versaeumt === "object") {
            for (const id of Object.keys(roh.versaeumt)) {
                const wert = roh.versaeumt[id];
                if (Number.isInteger(wert) && wert > 0) {
                    runde.versaeumt[id] = wert;
                }
            }
        }

        /*
         * Die Würfel auf dem Brett. Eine Partie aus Fassung 1 kennt sie nicht:
         * Dort lagen vier feste Felder, von denen die eingesammelten in
         * `bonusGesammelt` stehen. Daraus wird hier einmalig die neue Liste
         * gebaut — angefangene Partien laufen damit unverändert weiter.
         */
        if (roh.bonusFassung === SCHACH_RUNDE.BONUS_FASSUNG) {
            const liste = Array.isArray(roh.bonus) ? roh.bonus : [];
            runde.bonus = liste
                .filter((eintrag) => eintrag && Number.isInteger(eintrag.feld)
                    && eintrag.feld >= 0
                    && (eintrag.pech
                        ? SCHACH_VARIANTEN.PECH[eintrag.art]
                        : SCHACH_VARIANTEN.FAEHIGKEITEN[eintrag.art]))
                .map((eintrag) => (eintrag.pech
                    ? { feld: eintrag.feld, art: eintrag.art, pech: true }
                    : { feld: eintrag.feld, art: eintrag.art }))
                .filter((eintrag, stelle, alle) =>
                    alle.findIndex((anderer) => anderer.feld === eintrag.feld) === stelle);
        } else {
            const variante = SCHACH_VARIANTEN.holen(varianteId);
            runde.bonus = variante.bonusFelder
                .filter((eintrag) => runde.bonusGesammelt.indexOf(eintrag.feld) === -1)
                .map((eintrag) => ({ feld: eintrag.feld, art: eintrag.art }));
        }

        if (Array.isArray(roh.verlauf)) {
            for (const eintrag of roh.verlauf) {
                if (eintrag && typeof eintrag.text === "string") {
                    runde.verlauf.push({
                        text: eintrag.text,
                        wer: (typeof eintrag.wer === "string") ? eintrag.wer : "",
                        farbe: (eintrag.farbe === "schwarz") ? "schwarz" : "weiss",
                        von: Number.isInteger(eintrag.von) ? eintrag.von : -1,
                        nach: Number.isInteger(eintrag.nach) ? eintrag.nach : -1,
                        /* Art der Fähigkeit und die betroffenen Felder — daraus
                           zeichnet der Bildschirm die Animation, und zwar auf
                           JEDEM Gerät. */
                        wirkung: (typeof eintrag.wirkung === "string") ? eintrag.wirkung : "",
                        felder: Array.isArray(eintrag.felder)
                            ? eintrag.felder.filter((feld) => Number.isInteger(feld) && feld >= 0)
                            : [],
                        /* Alle Bewegungen dieses Eintrags — daraus zeichnet der
                           Bildschirm die Pfeile. Ein Zug hat einen Weg, ein
                           Erdbeben mehrere. */
                        wege: Array.isArray(eintrag.wege)
                            ? eintrag.wege
                                .filter((weg) => weg && Number.isInteger(weg.von)
                                    && Number.isInteger(weg.nach) && weg.von >= 0 && weg.nach >= 0)
                                .map((weg) => ({ von: weg.von, nach: weg.nach }))
                            : []
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

    /*
     * Was eine Figurenart wert ist — für die Bilanz unter dem Brett.
     * Die üblichen Schachwerte; der König zählt nicht mit, er kann nicht
     * verloren gehen (ausser auf dem Doppelbrett, wo die Partie dann ohnehin
     * vorbei ist).
     */
    FIGUR_WERT: { B: 1, S: 3, L: 3, T: 5, D: 9, K: 0 },

    /*
     * Bilanz einer Seite: was sie erbeutet hat, was sie verloren hat, und die
     * Differenz nach Figurenwert.
     */
    bilanz(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const gegner = SCHACH.gegner(farbe);

        /* Was der Gegner verloren hat, hat diese Seite geschlagen. */
        const geschlagen = stand.verloren[gegner] || [];
        const verloren = stand.verloren[farbe] || [];

        const wert = (liste) => liste.reduce(
            (summe, art) => summe + (SCHACH_RUNDE.FIGUR_WERT[art] || 0), 0);

        return {
            geschlagen: geschlagen.slice(),
            verloren: verloren.slice(),
            punkte: wert(geschlagen) - wert(verloren)
        };
    },

    /* Der Figurenwert dessen, was eine Seite geschlagen hat. */
    beuteWert(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const geschlagen = stand.verloren[SCHACH.gegner(farbe)] || [];

        return geschlagen.reduce(
            (summe, art) => summe + (SCHACH_RUNDE.FIGUR_WERT[art] || 0), 0);
    },

    /* Welche Würfel liegen gerade auf dem Brett? */
    offeneBonusFelder(runde) {
        return SCHACH_RUNDE.normalisieren(runde).bonus;
    },

    /*
     * Ein Zufallswert zwischen 0 und 1, GERECHNET statt gewürfelt.
     *
     * Das ist die wichtigste Festlegung an den Fähigkeiten: Alle Geräte sehen
     * denselben Stand und müssen deshalb dieselben Würfel sehen. Mit
     * `Math.random()` bekäme jedes Gerät ein anderes Brett, und der erste
     * Schreibvorgang gewönne — dieselbe Falle wie beim gegenseitigen
     * Überschreiben in v0.8. Aus Partie-Kennung und Zugzähler rechnet dagegen
     * jeder dasselbe aus, ohne sich abzustimmen, und die Tests bleiben
     * aussagekräftig, weil das Ergebnis vorhersagbar ist.
     *
     * Verfahren: FNV-1a, eine gängige einfache Streufunktion.
     */
    _zufallsWert(text) {
        let wert = 2166136261;

        for (let stelle = 0; stelle < text.length; stelle++) {
            wert ^= text.charCodeAt(stelle);
            wert = Math.imul(wert, 16777619);
        }

        return (wert >>> 0) / 4294967296;
    },

    /*
     * Lässt bei Bedarf einen neuen Würfel erscheinen. Wird nach jedem Zug
     * gerufen und ändert die übergebene Runde.
     */
    /*
     * Erscheinen in dieser Partie Würfel? Der Schalter der Partie geht vor;
     * ohne Angabe entscheidet die Spielart wie vor v2.5.
     */
    faehigkeitenAn(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (stand.regeln.faehigkeiten === true || stand.regeln.faehigkeiten === false) {
            return stand.regeln.faehigkeiten;
        }
        return !!SCHACH_RUNDE.varianteVon(stand).faehigkeiten;
    },

    _bonusNachziehen(runde) {
        if (!SCHACH_RUNDE.faehigkeitenAn(runde)) {
            return;
        }
        /* Nach jedem Halbzug neu gewürfelt — kein fester Takt mehr, und seit
           v3.3 auch keine Höchstzahl (siehe SCHACH_VARIANTEN.BONUS_CHANCE). */
        const wuerfelt = SCHACH_RUNDE._zufallsWert(
            (runde.id || "partie") + "|" + runde.zugZaehler + "|ob") * 100;

        if (wuerfelt >= SCHACH_VARIANTEN.BONUS_CHANCE) {
            return;
        }

        /* Fähigkeiten erscheinen nur auf leeren Feldern, und nie dort, wo schon
           eine liegt. */
        const belegt = runde.bonus.map((eintrag) => eintrag.feld);
        const freie = [];

        for (let feld = 0; feld < SCHACH.felderVon(runde.stand); feld++) {
            if (SCHACH.figurAuf(runde.stand, feld) === "." && belegt.indexOf(feld) === -1) {
                freie.push(feld);
            }
        }

        if (freie.length === 0) {
            return;
        }

        const basis = (runde.id || "partie") + "|" + runde.zugZaehler;

        /* Meist einer, manchmal zwei, sehr selten drei — und nie mehr, als
           freie Felder da sind. Das ist seit v3.3 die einzige Grenze. */
        const gewuenscht = SCHACH_VARIANTEN.anzahlZiehen(
            SCHACH_RUNDE._zufallsWert(basis + "|anzahl"));
        const moeglich = Math.min(gewuenscht, freie.length);

        const neue = [];

        for (let nummer = 0; nummer < moeglich; nummer++) {
            const marke = basis + "|" + nummer;
            const stelle = Math.floor(SCHACH_RUNDE._zufallsWert(marke + "|feld") * freie.length);
            const feld = freie[stelle];

            /* Ist es ein Unglückswürfel? Deutlich seltener als ein normaler. */
            const istPech = (SCHACH_RUNDE._zufallsWert(marke + "|pech") * 100)
                < SCHACH_VARIANTEN.PECH_CHANCE;

            const art = istPech
                ? SCHACH_VARIANTEN.pechZiehen(SCHACH_RUNDE._zufallsWert(marke + "|pechart"))
                : SCHACH_VARIANTEN.faehigkeitZiehen(SCHACH_RUNDE._zufallsWert(marke + "|art"));

            if (!art) {
                continue;
            }

            freie.splice(stelle, 1);
            const eintrag = { feld: feld, art: art };
            if (istPech) {
                eintrag.pech = true;
            }

            runde.bonus.push(eintrag);
            neue.push(eintrag);
        }

        if (neue.length === 0) {
            return;
        }

        /*
         * Im Verlauf steht NUR, wo etwas liegt — nicht was. Weder die
         * Fähigkeit noch die Tatsache, dass es ein Unglückswürfel ist: Das ist
         * die Überraschung, um die es geht.
         */
        const namen = neue.map((eintrag) => SCHACH.feldName(eintrag.feld,
            SCHACH.breiteVon(runde.stand), SCHACH.hoeheVon(runde.stand)));

        runde.verlauf.push({
            text: (neue.length === 1 ? "Ein Würfel erscheint auf " : "Würfel erscheinen auf ")
                + namen.join(", "),
            wer: "",
            farbe: runde.stand.amZug,
            von: -1,
            nach: -1,
            wirkung: "erscheint",
            felder: neue.map((eintrag) => eintrag.feld)
        });
        SCHACH_RUNDE._verlaufKuerzen(runde);
    },

    /*
     * Setzt eine Fähigkeit ein. Wirkt auf den Brett-Stand und verbraucht sie.
     * Der Zugzähler steigt mit, damit zwei Geräte sich nicht gegenseitig
     * überschreiben — genau wie bei einem Zug.
     *
     * `zielFeld` wird nur von Fähigkeiten der Art "ziel" gebraucht; die
     * übrigen bekommen -1 oder gar nichts.
     */
    faehigkeitEinsetzen(runde, spielerId, art, zielFeld, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const stelle = alt.faehigkeiten[farbe].indexOf(art);
        if (stelle === -1) {
            return null;
        }

        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        if (!beschreibung) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        const ziel = Number.isInteger(zielFeld) ? zielFeld : -1;
        let betroffen = [];
        let wege = [];
        let zusatzText = "";

        if (beschreibung.art === "zugmuster") {
            neu.stand.zusatzFarbe = farbe;
            neu.stand.zusatzMuster = beschreibung.muster;
            neu.stand.sprungAktiv = (beschreibung.muster === "springer") ? farbe : "";

        } else if (beschreibung.art === "ablauf") {
            neu.stand.extraZug = farbe;

        } else if (beschreibung.art === "sofort") {
            const wirkung = SCHACH.bauernschub(neu.stand, farbe);
            if (!wirkung) {
                return null;
            }
            neu.stand = wirkung.stand;
            betroffen = wirkung.felder;
            wege = wirkung.wege || [];

        } else if (beschreibung.art === "ziel") {
            const wirkung = SCHACH_RUNDE._zielWirkung(neu, art, farbe, ziel);
            if (!wirkung) {
                return null;
            }
            neu.stand = wirkung.stand;
            betroffen = wirkung.felder;
            wege = wirkung.wege || [];
            zusatzText = wirkung.text ? (": " + wirkung.text) : "";

        } else if (beschreibung.art === "handel") {
            /*
             * Das Angebot wird HIER neu gerechnet, nicht vom Bildschirm
             * übergeben: Sonst könnte ein Gerät mit veraltetem Stand einen
             * Tausch durchsetzen, den es so gar nicht mehr gibt. Der Bildschirm
             * fragt dasselbe ab, um es zu zeigen — die Wahrheit steht hier.
             */
            const wirkung = SCHACH_RUNDE._handelAusfuehren(neu, farbe);
            if (!wirkung) {
                return null;
            }
            neu.stand = wirkung.stand;
            betroffen = wirkung.felder;
            zusatzText = wirkung.text ? (": " + wirkung.text) : "";

        } else {
            return null;
        }

        neu.faehigkeiten[farbe].splice(stelle, 1);
        neu.zugZaehler = alt.zugZaehler + 1;

        /*
         * Manche Fähigkeiten kosten den ganzen Zug (`beendetZug`): Danach ist
         * der Gegner dran. Der Doppelzug geht vor — wer ihn eingesetzt hat,
         * behält sein Recht auf einen weiteren Zug, sonst wäre die eine
         * Fähigkeit die andere wert.
         */
        if (beschreibung.beendetZug) {
            if (neu.stand.extraZug === farbe) {
                neu.stand.extraZug = "";
            } else {
                neu.stand = SCHACH.zugAbgeben(neu.stand);
            }
        }

        neu.verlauf.push({
            text: "Fähigkeit " + SCHACH_VARIANTEN.faehigkeitTitel(art) + " eingesetzt"
                + zusatzText,
            wer: wer || "",
            farbe: farbe,
            von: -1,
            nach: -1,
            wirkung: art,
            felder: betroffen,
            wege: wege
        });
        SCHACH_RUNDE._verlaufKuerzen(neu);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Lässt einen Unglückswürfel sofort wirken. Ändert die übergebene Runde.
     *
     * `feld` ist das Feld, auf dem er lag (dort steht jetzt die einsammelnde
     * Figur), `farbe` die Seite, die ihn erwischt hat.
     */
    _pechAusloesen(runde, art, farbe, feld, wer, herkunft) {
        const basis = (runde.id || "partie") + "|" + runde.zugZaehler + "|pech";
        let wirkung = null;

        if (art === "stolperstein") {
            wirkung = SCHACH.stolperstein(runde.stand, farbe, feld);

        } else if (art === "ausdehnung") {
            const seiten = ["oben", "unten", "links", "rechts"];
            const wahl = SCHACH_RUNDE._zufallsWert(basis + "|seite");
            wirkung = SCHACH.ausdehnung(runde.stand,
                seiten[Math.floor(wahl * seiten.length) % seiten.length]);

        } else if (art === "meuterei") {
            wirkung = SCHACH.meuterei(runde.stand, farbe,
                SCHACH_RUNDE._zufallsWert(basis + "|figur"));

        } else if (art === "erdrutsch") {
            wirkung = SCHACH.erdrutsch(runde.stand, farbe);

        } else if (art === "vollesGlas") {
            /* Ändert nichts am Brett — nur daran, wie EINE Seite es sieht. */
            wirkung = {
                stand: Object.assign({}, runde.stand, {
                    glasFarbe: farbe,
                    glasBis: runde.zugZaehler + SCHACH_RUNDE.GLAS_HALBZUEGE
                }),
                felder: [],
                wege: [],
                text: "die Sicht verschwimmt für "
                    + ((farbe === "weiss") ? "Weiss" : "Schwarz")
            };
        }

        const stufe = SCHACH_VARIANTEN.pechStufeVon(art);
        let text = "Unglückswürfel: " + SCHACH_VARIANTEN.pechTitel(art)
            + " (" + stufe.titel + ")";

        if (wirkung) {
            runde.stand = wirkung.stand;
            text += " — " + wirkung.text;
        } else {
            /* Auch ein wirkungsloser Unglückswürfel wird festgehalten: Sonst
               stünde im Verlauf ein Einsammeln ohne Folge, und niemand wüsste,
               warum nichts passiert ist. */
            text += " — ohne Wirkung";
        }

        runde.verlauf.push({
            text: text,
            wer: wer || "",
            farbe: farbe,
            von: Number.isInteger(herkunft) ? herkunft : -1,
            nach: feld,
            wirkung: "pech",
            felder: wirkung ? wirkung.felder : [feld],
            wege: wirkung ? (wirkung.wege || []) : []
        });
        SCHACH_RUNDE._verlaufKuerzen(runde);
    },

    /*
     * Welche Felder kommen für eine Fähigkeit als Ziel in Frage?
     *
     * Ermittelt durch Ausprobieren: Ein Feld ist ein gültiges Ziel, wenn die
     * Wirkung dort etwas ergibt. Damit kann die Anzeige nicht von der Regel
     * abweichen — es gibt keine zweite Liste von Bedingungen, die veralten
     * könnte. Geprüft wird auf Kopien, damit nichts hängen bleibt.
     */
    zielFelder(runde, spielerId, art) {
        const alt = SCHACH_RUNDE.normalisieren(runde);
        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        if (!farbe || !beschreibung || beschreibung.art !== "ziel") {
            return [];
        }

        const liste = [];
        for (let feld = 0; feld < SCHACH.felderVon(alt.stand); feld++) {
            if (SCHACH_RUNDE._zielWirkung(SCHACH_RUNDE.kopieren(alt), art, farbe, feld)) {
                liste.push(feld);
            }
        }

        return liste;
    },

    /* Die Fähigkeiten, die ein angetipptes Feld brauchen. */
    _zielWirkung(runde, art, farbe, feld) {
        if (feld < 0 || feld >= SCHACH.felderVon(runde.stand)) {
            return null;
        }

        if (art === "verstaerkung") {
            return SCHACH.verstaerkung(runde.stand, farbe, feld);
        }

        if (art === "erdbeben") {
            return SCHACH.erdbeben(runde.stand, feld);
        }

        if (art === "mauer") {
            return SCHACH.mauerLegen(runde.stand, feld);
        }

        /*
         * Friedhof: Es stehen die zuletzt gefallenen GEGNER auf — die jüngsten
         * zuerst, weil sie am ehesten noch zur Stellung passen. Sie werden aus
         * der Grabliste verbraucht; `verloren` bleibt unangetastet, damit die
         * Bilanz weiter zählt, was wirklich geschlagen wurde.
         */
        if (art === "friedhof") {
            const gegner = SCHACH.gegner(farbe);
            const gefallene = runde.gefallen[gegner] || [];

            if (gefallene.length === 0) {
                return null;
            }

            const arten = gefallene
                .slice(-(SCHACH.FRIEDHOF_KANTE * SCHACH.FRIEDHOF_KANTE))
                .reverse()
                .map((eintrag) => eintrag.art);

            const wirkung = SCHACH.friedhof(runde.stand, farbe, feld, arten);
            if (!wirkung) {
                return null;
            }

            runde.gefallen[gegner] = gefallene.slice(0,
                Math.max(0, gefallene.length - wirkung.felder.length));

            return wirkung;
        }

        if (art === "schutzschild") {
            const figur = SCHACH.figurAuf(runde.stand, feld);
            /* Auf den König wirkt das Schild nicht — sonst wäre "Schachmatt"
               nicht mehr eindeutig. Dieselbe Überlegung wie beim Doppelbrett. */
            if (SCHACH.farbeVon(figur) !== farbe || SCHACH.artVon(figur) === "K") {
                return null;
            }
            const stand = Object.assign({}, runde.stand, {
                schildFeld: feld,
                schildFarbe: farbe
            });
            return { stand: stand, felder: [feld], text: SCHACH.artName(SCHACH.artVon(figur)) };
        }

        if (art === "fessel") {
            const figur = SCHACH.figurAuf(runde.stand, feld);
            const gegner = SCHACH.gegner(farbe);
            /* Der König wird nicht gefesselt: Wer im Schach steht und nicht
               ziehen darf, wäre ohne eigenen Fehler matt. */
            if (SCHACH.farbeVon(figur) !== gegner || SCHACH.artVon(figur) === "K") {
                return null;
            }
            const stand = Object.assign({}, runde.stand, {
                fesselFeld: feld,
                fesselFarbe: gegner
            });
            return { stand: stand, felder: [feld], text: SCHACH.artName(SCHACH.artVon(figur)) };
        }

        if (art === "frost") {
            const figur = SCHACH.figurAuf(runde.stand, feld);
            const gegner = SCHACH.gegner(farbe);

            /* Wie bei der Fessel: nicht auf den König. */
            if (SCHACH.farbeVon(figur) !== gegner || SCHACH.artVon(figur) === "K") {
                return null;
            }
            const stand = Object.assign({}, runde.stand, {
                frostFeld: feld,
                frostFarbe: gegner
            });
            return { stand: stand, felder: [feld], wege: [],
                text: SCHACH.artName(SCHACH.artVon(figur)) };
        }

        if (art === "spiegel") {
            return SCHACH.spiegel(runde.stand, farbe, feld);
        }

        if (art === "nudelholz") {
            /*
             * Das Zielfeld liegt am Rand: Ein Feld der OBERSTEN Reihe rollt
             * nach oben, eines der UNTERSTEN nach unten. So beantwortet ein
             * einziger Tipp beide Fragen — welche Spalten und wohin.
             */
            const breite = SCHACH.breiteVon(runde.stand);
            const reihe = SCHACH.reiheVon(feld, breite);
            const letzte = SCHACH.hoeheVon(runde.stand) - 1;

            if (reihe !== 0 && reihe !== letzte) {
                return null;
            }
            return SCHACH.nudelholz(runde.stand, SCHACH.spalteVon(feld, breite),
                (reihe === 0) ? -1 : 1);
        }

        /*
         * Wiederbelebung: Die Figur kehrt an ihr Grab zurück.
         *
         * Gesucht wird der ZULETZT auf diesem Feld gefallene eigene Stein —
         * fielen dort mehrere nacheinander, kommt der jüngste zuerst wieder.
         * Der Eintrag wird verbraucht, sonst liesse sich dieselbe Figur mit
         * einer zweiten Wiederbelebung noch einmal holen.
         */
        if (art === "wiederbelebung") {
            const gefallene = runde.gefallen[farbe];
            if (!gefallene || gefallene.length === 0) {
                return null;
            }

            let stelle = -1;
            for (let nummer = gefallene.length - 1; nummer >= 0; nummer--) {
                if (gefallene[nummer].feld === feld) {
                    stelle = nummer;
                    break;
                }
            }
            if (stelle === -1) {
                return null;
            }

            const wirkung = SCHACH.wiedergeburt(
                runde.stand, farbe, feld, gefallene[stelle].art);

            if (!wirkung) {
                return null;
            }

            gefallene.splice(stelle, 1);
            return wirkung;
        }

        if (art === "wiedergeburt") {
            const verloren = runde.verloren[farbe];
            if (!verloren || verloren.length === 0) {
                return null;
            }
            const grundreihe = (farbe === "weiss") ? SCHACH.hoeheVon(runde.stand) - 1 : 0;
            if (SCHACH.reiheVon(feld, SCHACH.breiteVon(runde.stand)) !== grundreihe) {
                return null;
            }

            const figurArt = verloren[verloren.length - 1];
            const wirkung = SCHACH.wiedergeburt(runde.stand, farbe, feld, figurArt);
            if (!wirkung) {
                return null;
            }
            verloren.pop();
            return wirkung;
        }

        return null;
    },

    /* ---------------------------------------------------------------- *
     * Der Händler (seit v3.3)
     *
     * Er unterscheidet sich von jeder anderen Fähigkeit darin, dass man ihn
     * ANSEHEN kann, bevor man ihn benutzt: Das Angebot steht fest, sobald die
     * Fähigkeit im Vorrat liegt, und ändert sich erst mit dem nächsten Zug.
     * Deshalb kostet ein Ablehnen nichts — man kann nicht so lange neu würfeln,
     * bis das Angebot passt, denn dazwischen liegt immer ein Zug.
     * ---------------------------------------------------------------- */

    /*
     * Das Angebot für diese Farbe, oder null, wenn gerade keines möglich ist.
     * Liefert:
     *
     *     {
     *         gibt:     { art, anzahl },
     *         bekommt:  { art, anzahl },
     *         gibtFelder:    [Felder, die geräumt werden],
     *         bekommtFelder: [Felder, auf denen Neues erscheint],
     *         text: "3 Bauern gegen 1 Springer"
     *     }
     *
     * Gerechnet, nicht gewürfelt: Alle Geräte sehen dasselbe Angebot.
     */
    handelsAngebot(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (farbe !== "weiss" && farbe !== "schwarz") {
            return null;
        }

        const marke = (stand.id || "partie") + "|handel|" + stand.zugZaehler + "|" + farbe;
        const angebot = SCHACH_VARIANTEN.handelZiehen(SCHACH_RUNDE._zufallsWert(marke));

        /*
         * WELCHE Figuren weggehen, entscheidet nicht der Spieler: Er tippt
         * sonst fünf Felder nacheinander an, und bei jedem Fehlgriff wäre der
         * Handel dahin. Genommen werden die HINTERSTEN — die, die am weitesten
         * von der gegnerischen Grundreihe entfernt stehen. Das ist die Wahl,
         * die man ohnehin fast immer treffen würde, und sie ist vorhersagbar.
         */
        const gibtFelder = SCHACH_RUNDE._hintersteFiguren(
            stand, farbe, angebot.gibt.art, angebot.gibt.anzahl);

        if (gibtFelder.length < angebot.gibt.anzahl) {
            return null;
        }

        /*
         * Die neuen Figuren erscheinen auf den frei werdenden Feldern; reichen
         * die nicht, kommen freie Felder der eigenen Grundreihe dazu. So bleibt
         * der Handel dort, wo die abgegebenen Figuren standen — und nicht
         * plötzlich in der gegnerischen Hälfte.
         */
        const bekommtFelder = SCHACH_RUNDE._handelsPlaetze(
            stand, farbe, gibtFelder, angebot.bekommt.anzahl);

        if (bekommtFelder.length < angebot.bekommt.anzahl) {
            return null;
        }

        return {
            gibt: angebot.gibt,
            bekommt: angebot.bekommt,
            gibtFelder: gibtFelder,
            bekommtFelder: bekommtFelder,
            text: SCHACH_RUNDE._handelsText(angebot.gibt)
                + " gegen " + SCHACH_RUNDE._handelsText(angebot.bekommt)
        };
    },

    /* Die Mehrzahl der Figurennamen — im Deutschen nicht ableitbar. */
    FIGUR_MEHRZAHL: {
        B: "Bauern", S: "Springer", L: "Läufer",
        T: "Türme", D: "Damen", K: "Könige"
    },

    _handelsText(seite) {
        return seite.anzahl + " " + ((seite.anzahl === 1)
            ? SCHACH.artName(seite.art)
            : (SCHACH_RUNDE.FIGUR_MEHRZAHL[seite.art] || SCHACH.artName(seite.art)));
    },

    /*
     * Die `anzahl` eigenen Figuren dieser Art, die am weitesten hinten stehen.
     * „Hinten" heisst: nah an der eigenen Grundreihe.
     */
    _hintersteFiguren(runde, farbe, art, anzahl) {
        const stand = runde.stand;
        const breite = SCHACH.breiteVon(stand);
        const eigene = [];

        for (let feld = 0; feld < SCHACH.felderVon(stand); feld++) {
            const figur = SCHACH.figurAuf(stand, feld);

            if (SCHACH.farbeVon(figur) === farbe && SCHACH.artVon(figur) === art) {
                eigene.push(feld);
            }
        }

        /* Weiss steht unten (grosse Reihennummern), Schwarz oben. */
        eigene.sort((einer, anderer) => {
            const reiheEiner = SCHACH.reiheVon(einer, breite);
            const reiheAnderer = SCHACH.reiheVon(anderer, breite);

            return (farbe === "weiss")
                ? (reiheAnderer - reiheEiner) || (einer - anderer)
                : (reiheEiner - reiheAnderer) || (einer - anderer);
        });

        return eigene.slice(0, anzahl);
    },

    /*
     * Den Handel wirklich durchführen: erst alle abgegebenen Felder räumen,
     * dann die neuen Figuren setzen.
     *
     * Die Reihenfolge ist Absicht — Räumen und Setzen können sich dieselben
     * Felder teilen (die neue Figur erscheint da, wo die alte stand). Würde man
     * abwechselnd räumen und setzen, löschte das Räumen eine gerade gesetzte
     * Figur wieder weg. Dieselbe Falle wie bei der Rochade auf schmalen
     * Brettern (siehe docs\DECISIONS.md).
     */
    _handelAusfuehren(runde, farbe) {
        const angebot = SCHACH_RUNDE.handelsAngebot(runde, farbe);
        if (!angebot) {
            return null;
        }

        let brett = runde.stand.brett;

        for (const feld of angebot.gibtFelder) {
            brett = SCHACH._brettMit(brett, feld, ".");
        }

        const figur = (farbe === "weiss")
            ? angebot.bekommt.art
            : angebot.bekommt.art.toLowerCase();

        for (const feld of angebot.bekommtFelder) {
            brett = SCHACH._brettMit(brett, feld, figur);
        }

        return {
            stand: Object.assign({}, runde.stand, { brett: brett, enPassant: "" }),
            felder: angebot.gibtFelder.concat(angebot.bekommtFelder)
                .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle),
            text: angebot.text
        };
    },

    /* Wohin die eingetauschten Figuren kommen: erst die frei werdenden Felder,
       dann freie Felder der eigenen Grundreihe. */
    _handelsPlaetze(runde, farbe, gibtFelder, anzahl) {
        const stand = runde.stand;
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const plaetze = gibtFelder.slice(0, anzahl);

        if (plaetze.length >= anzahl) {
            return plaetze;
        }

        const grundreihe = (farbe === "weiss") ? hoehe - 1 : 0;

        for (let spalte = 0; spalte < breite && plaetze.length < anzahl; spalte++) {
            const feld = SCHACH._feld(stand, grundreihe, spalte);

            if (SCHACH.figurAuf(stand, feld) === "."
                && !SCHACH.mauerAuf(stand, feld)
                && plaetze.indexOf(feld) === -1) {
                plaetze.push(feld);
            }
        }

        return plaetze;
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

        /*
         * Wer schon in einem Team ist, bleibt darin. Ein Wechsel mitten in der
         * Partie hiesse: erst für die eine Seite ziehen, dann für die andere —
         * bei einer Partie, die über Tage läuft, ist das keine theoretische
         * Möglichkeit. Wer wirklich raus will, verlässt das Team ausdrücklich.
         */
        const bisher = SCHACH_RUNDE.teamVon(neu, spielerId);
        if (bisher && bisher !== farbe) {
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

            /* Nur beim ERSTEN Start setzen: „Neu aufstellen" soll die
               Spieldauer nicht zurückdrehen. */
            if (!neu.gestartetAm) {
                neu.gestartetAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
            }
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

        /* Was auf dem Zielfeld steht, muss VOR dem Zug abgelesen werden. */
        const geschlagen = SCHACH.artVon(SCHACH.figurAuf(alt.stand, nach));

        const ergebnis = SCHACH.ziehen(alt.stand, von, nach, umwandlung);
        if (!ergebnis) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        const farbe = alt.stand.amZug;

        neu.stand = ergebnis.stand;
        neu.zugZaehler = alt.zugZaehler + 1;

        /* Ein Zug beendet jede offene Abstimmung. */
        neu.vorschlag = null;

        /*
         * Verlorene Figuren merken — die Wiedergeburt holt sie zurück.
         *
         * Zweimal, weil zwei Fähigkeiten Verschiedenes brauchen: `verloren` nur
         * die Art (Bilanz, Beute, Grundreihen-Wiedergeburt), `gefallen`
         * zusätzlich das Feld (Wiederbelebung an Ort und Stelle).
         */
        if (geschlagen) {
            neu.verloren[SCHACH.gegner(farbe)].push(geschlagen);
            neu.gefallen[SCHACH.gegner(farbe)].push({ art: geschlagen, feld: nach });
        } else if (ergebnis.zug.enPassant) {
            neu.verloren[SCHACH.gegner(farbe)].push("B");

            /* Beim en passant fällt der Bauer NICHT auf dem Zielfeld, sondern
               auf dem Feld, das er beim Doppelschritt übersprungen hat. */
            const geschlagenesFeld = Number.isInteger(ergebnis.zug.enPassantFeld)
                ? ergebnis.zug.enPassantFeld
                : nach;
            neu.gefallen[SCHACH.gegner(farbe)].push({ art: "B", feld: geschlagenesFeld });
        }

        /* Bei der Rochade bewegen sich zwei Figuren — beide bekommen ihren
           Pfeil. */
        const wege = [{ von: von, nach: nach }];
        if (ergebnis.zug.rochade && Number.isInteger(ergebnis.zug.turmVon)) {
            wege.push({ von: ergebnis.zug.turmVon, nach: ergebnis.zug.turmNach });
        }

        neu.verlauf.push({
            text: ergebnis.text,
            wer: wer || "",
            farbe: farbe,
            von: von,
            nach: nach,
            wege: wege
        });
        SCHACH_RUNDE._verlaufKuerzen(neu);

        /* Liegt auf dem Zielfeld ein Würfel, sammelt das Team ihn ein. */
        const stelle = neu.bonus.findIndex((eintrag) => eintrag.feld === nach);

        if (stelle !== -1) {
            const bonus = neu.bonus[stelle];
            neu.bonus.splice(stelle, 1);
            neu.bonusGesammelt.push(bonus.feld);

            if (bonus.pech) {
                /* Ein Unglückswürfel kommt nicht in den Vorrat — er wirkt
                   sofort, und zwar gegen den, der ihn eingesammelt hat. */
                SCHACH_RUNDE._pechAusloesen(neu, bonus.art, farbe, nach, wer, von);
            } else {
                neu.faehigkeiten[farbe].push(bonus.art);

                /* Derselbe Weg wie beim Zug davor: Dieser Eintrag beschreibt
                   denselben Zug. So findet der Bildschirm die Bewegung auch
                   dann am Ende des Verlaufs, wenn dabei etwas eingesammelt
                   wurde. */
                neu.verlauf.push({
                    text: SCHACH_VARIANTEN.faehigkeitTitel(bonus.art) + " ("
                        + SCHACH_VARIANTEN.stufeVon(bonus.art).titel + ") eingesammelt",
                    wer: wer || "",
                    farbe: farbe,
                    von: von,
                    nach: nach,
                    wirkung: "eingesammelt",
                    felder: [nach]
                });
                SCHACH_RUNDE._verlaufKuerzen(neu);
            }
        }

        /* Und alle paar Züge erscheint ein neuer Würfel. */
        SCHACH_RUNDE._bonusNachziehen(neu);

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

    /* ---------------------------------------------------------------- *
     * Abstimmung im Team (nur wenn `regeln.einigkeit` gesetzt ist)
     *
     * Die Hausregel lautet sonst: Wer zuerst zieht, hat gezogen. Wer diese
     * Partie mit Einigkeit angelegt hat, will genau das nicht — dann wird ein
     * Zug erst vorgeschlagen und ausgeführt, sobald ALLE aus dem Team am Zug
     * zugestimmt haben. Der Vorschlagende stimmt automatisch mit zu.
     *
     * Der Vorschlag steht im gemeinsamen Stand: Anders als ein Vorzug ist er
     * kein Geheimnis — das eigene Team muss ihn ja sehen, und dass der Gegner
     * mitliest, ist der Preis dieser Einstellung. Sie steht deshalb in der
     * Auswahl mit diesem Hinweis.
     * ---------------------------------------------------------------- */

    brauchtEinigkeit(runde) {
        return SCHACH_RUNDE.normalisieren(runde).regeln.einigkeit === true;
    },

    /*
     * Wie lange das Team für diese Abstimmung Zeit hat (in Millisekunden).
     *
     * Maßgeblich ist der Säumigste: Wer wiederholt nicht abstimmt, verkürzt die
     * Frist für alle — sonst könnte ein Team mit zwei Leuten gar nichts mehr
     * tun, sobald einer aufhört mitzuspielen.
     */
    fristFuer(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        let hoechste = 0;

        for (const id of stand.teams[farbe]) {
            hoechste = Math.max(hoechste, stand.versaeumt[id] || 0);
        }

        const stufe = Math.min(
            Math.floor(hoechste / SCHACH_RUNDE.FRIST_NACH_VERSAEUMNISSEN),
            SCHACH_RUNDE.FRIST_SEKUNDEN.length - 1);

        return SCHACH_RUNDE.FRIST_SEKUNDEN[stufe] * 1000;
    },

    /*
     * Schlägt einen Zug vor. Ist man allein im Team, wird er sofort ausgeführt —
     * Einigkeit mit sich selbst ist keine Abstimmung wert.
     * Liefert die neue Runde oder null.
     */
    zugVorschlagen(runde, spielerId, von, nach, umwandlung, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }
        if (!SCHACH_RUNDE.brauchtEinigkeit(alt)) {
            return SCHACH_RUNDE.ziehen(alt, spielerId, von, nach, umwandlung, wer, zeitpunkt);
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        if (alt.teams[farbe].length <= 1) {
            return SCHACH_RUNDE.ziehen(alt, spielerId, von, nach, umwandlung, wer, zeitpunkt);
        }

        /* Der Zug muss regelkonform sein — sonst stimmt das Team über etwas ab,
           das gar nicht geht. */
        if (!SCHACH.ziehen(alt.stand, von, nach, umwandlung)) {
            return null;
        }

        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        const neu = SCHACH_RUNDE.kopieren(alt);

        neu.vorschlag = {
            art: "zug",
            faehigkeit: "",
            zielFeld: -1,
            von: von,
            nach: nach,
            umwandlung: umwandlung || "D",
            wer: spielerId,
            name: wer || "",
            zugZaehler: alt.zugZaehler,
            frist: wann + SCHACH_RUNDE.fristFuer(alt, farbe),
            stimmen: [spielerId]
        };

        neu.geaendertAm = wann;
        return neu;
    },

    /*
     * Schlägt den Einsatz einer Fähigkeit vor. Wie beim Zug: allein im Team
     * wird sofort eingesetzt, sonst wird abgestimmt.
     */
    faehigkeitVorschlagen(runde, spielerId, art, zielFeld, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);

        if (!SCHACH_RUNDE.brauchtEinigkeit(alt) || alt.teams[farbe].length <= 1) {
            return SCHACH_RUNDE.faehigkeitEinsetzen(
                alt, spielerId, art, zielFeld, wer, zeitpunkt);
        }

        /* Erst prüfen, ob sie überhaupt einsetzbar wäre. */
        if (!SCHACH_RUNDE.faehigkeitEinsetzen(alt, spielerId, art, zielFeld, wer, zeitpunkt)) {
            return null;
        }

        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        const neu = SCHACH_RUNDE.kopieren(alt);

        neu.vorschlag = {
            art: "faehigkeit",
            faehigkeit: art,
            zielFeld: Number.isInteger(zielFeld) ? zielFeld : -1,
            von: -1,
            nach: -1,
            umwandlung: "D",
            wer: spielerId,
            name: wer || "",
            zugZaehler: alt.zugZaehler,
            frist: wann + SCHACH_RUNDE.fristFuer(alt, farbe),
            stimmen: [spielerId]
        };

        neu.geaendertAm = wann;
        return neu;
    },

    /*
     * Stimmt dem offenen Vorschlag zu. Sobald ALLE aus dem Team am Zug
     * zugestimmt haben, wird gezogen.
     */
    zugMittragen(runde, spielerId, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!alt.vorschlag || !SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }
        /* Ein Vorschlag von vor dem letzten Zug ist überholt. */
        if (alt.vorschlag.zugZaehler !== alt.zugZaehler) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const neu = SCHACH_RUNDE.kopieren(alt);

        if (neu.vorschlag.stimmen.indexOf(spielerId) === -1) {
            neu.vorschlag.stimmen.push(spielerId);
        }

        /* Wer mitstimmt, ist wieder dabei: Sein Säumnis-Zähler beginnt von
           vorn, und damit auch die volle Frist. */
        delete neu.versaeumt[spielerId];

        const fehlen = neu.teams[farbe]
            .filter((id) => neu.vorschlag.stimmen.indexOf(id) === -1);

        if (fehlen.length > 0) {
            neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
            return neu;
        }

        return SCHACH_RUNDE._vorschlagAusfuehren(neu, zeitpunkt);
    },

    /*
     * Die Frist ist abgelaufen: Der Vorschlag geht durch, auch ohne alle
     * Stimmen. Wer nicht abgestimmt hat, bekommt einen Strich — beim nächsten
     * Mal ist die Frist dadurch kürzer.
     *
     * Ausgelöst wird das vom ERSTEN Gerät, das den Ablauf bemerkt; die Prüfung
     * über den Zugzähler beim Schreiben sorgt dafür, dass es trotzdem nur
     * einmal passiert.
     */
    fristAbgelaufen(runde, jetzt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!alt.vorschlag || alt.vorschlag.zugZaehler !== alt.zugZaehler) {
            return null;
        }
        if (!alt.vorschlag.frist || jetzt < alt.vorschlag.frist) {
            return null;
        }

        const farbe = alt.stand.amZug;
        const neu = SCHACH_RUNDE.kopieren(alt);

        for (const id of neu.teams[farbe]) {
            if (neu.vorschlag.stimmen.indexOf(id) === -1) {
                neu.versaeumt[id] = (neu.versaeumt[id] || 0) + 1;
            }
        }

        return SCHACH_RUNDE._vorschlagAusfuehren(neu, jetzt);
    },

    /* Führt den offenen Vorschlag aus — Zug oder Fähigkeit. */
    _vorschlagAusfuehren(runde, zeitpunkt) {
        const vorschlag = runde.vorschlag;
        runde.vorschlag = null;

        const ergebnis = (vorschlag.art === "faehigkeit")
            ? SCHACH_RUNDE.faehigkeitEinsetzen(runde, vorschlag.wer, vorschlag.faehigkeit,
                vorschlag.zielFeld, vorschlag.name, zeitpunkt)
            : SCHACH_RUNDE.ziehen(runde, vorschlag.wer, vorschlag.von, vorschlag.nach,
                vorschlag.umwandlung, vorschlag.name, zeitpunkt);

        if (!ergebnis) {
            /* Inzwischen nicht mehr möglich — der Vorschlag fällt weg. */
            runde.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
            return runde;
        }

        /* Die Säumnis-Zähler aus der Abstimmung müssen mitgenommen werden:
           `ziehen` und `faehigkeitEinsetzen` arbeiten auf einer Kopie. */
        ergebnis.versaeumt = runde.versaeumt;
        return ergebnis;
    },

    /* Verwirft den offenen Vorschlag. */
    vorschlagVerwerfen(runde, spielerId, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!alt.vorschlag || !SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        neu.vorschlag = null;
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
        neu.bonus = [];
        neu.bonusFassung = SCHACH_RUNDE.BONUS_FASSUNG;
        neu.verloren = { weiss: [], schwarz: [] };
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
            && einsA.faehigkeiten.schwarz.join(",") === einsB.faehigkeiten.schwarz.join(",")
            && SCHACH_RUNDE._vorschlagText(einsA) === SCHACH_RUNDE._vorschlagText(einsB)
            && SCHACH_RUNDE._bonusText(einsA) === SCHACH_RUNDE._bonusText(einsB)
            && einsA.stand.schildFeld === einsB.stand.schildFeld
            && einsA.stand.fesselFeld === einsB.stand.fesselFeld;
    },

    /* Der offene Vorschlag als Zeichenkette — ändert er sich, wird neu gezeichnet. */
    _vorschlagText(runde) {
        if (!runde.vorschlag) {
            return "";
        }
        return runde.vorschlag.von + ">" + runde.vorschlag.nach
            + "@" + runde.vorschlag.zugZaehler
            + ":" + runde.vorschlag.stimmen.slice().sort().join(",");
    },

    _bonusText(runde) {
        return runde.bonus.map((eintrag) => eintrag.feld + ":" + eintrag.art).sort().join(",");
    }
};

/* Für die Tests ausserhalb des Browsers. SCHACH und SCHACH_VARIANTEN müssen
   dort vorher als globale Größen bereitstehen — genau wie im Browser. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_RUNDE;
}
