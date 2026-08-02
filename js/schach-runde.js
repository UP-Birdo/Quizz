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

        for (const farbe of ["weiss", "schwarz"]) {
            const liste = (roh.verloren && Array.isArray(roh.verloren[farbe]))
                ? roh.verloren[farbe] : [];
            runde.verloren[farbe] = liste
                .filter((art) => typeof art === "string" && SCHACH.artName(art) !== "");
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
                    && SCHACH_VARIANTEN.FAEHIGKEITEN[eintrag.art])
                .map((eintrag) => ({ feld: eintrag.feld, art: eintrag.art }))
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
    _bonusNachziehen(runde) {
        const variante = SCHACH_RUNDE.varianteVon(runde);

        if (!variante.faehigkeiten) {
            return;
        }
        if (runde.zugZaehler % SCHACH_VARIANTEN.BONUS_ABSTAND !== 0) {
            return;
        }
        if (runde.bonus.length >= SCHACH_VARIANTEN.BONUS_HOECHSTENS) {
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
           insgesamt liegen dürfen. */
        const gewuenscht = SCHACH_VARIANTEN.anzahlZiehen(
            SCHACH_RUNDE._zufallsWert(basis + "|anzahl"));
        const moeglich = Math.min(gewuenscht,
            SCHACH_VARIANTEN.BONUS_HOECHSTENS - runde.bonus.length, freie.length);

        const neue = [];

        for (let nummer = 0; nummer < moeglich; nummer++) {
            const marke = basis + "|" + nummer;
            const stelle = Math.floor(SCHACH_RUNDE._zufallsWert(marke + "|feld") * freie.length);
            const feld = freie[stelle];
            const art = SCHACH_VARIANTEN.faehigkeitZiehen(
                SCHACH_RUNDE._zufallsWert(marke + "|art"));

            if (!art) {
                continue;
            }

            freie.splice(stelle, 1);
            runde.bonus.push({ feld: feld, art: art });
            neue.push({ feld: feld, art: art });
        }

        if (neue.length === 0) {
            return;
        }

        const namen = neue.map((eintrag) => SCHACH_VARIANTEN.faehigkeitTitel(eintrag.art)
            + " (" + SCHACH_VARIANTEN.stufeVon(eintrag.art).titel + ") auf "
            + SCHACH.feldName(eintrag.feld, SCHACH.breiteVon(runde.stand),
                SCHACH.hoeheVon(runde.stand)));

        runde.verlauf.push({
            text: (neue.length === 1 ? "Es erscheint: " : "Es erscheinen: ") + namen.join(", "),
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

        } else {
            return null;
        }

        neu.faehigkeiten[farbe].splice(stelle, 1);
        neu.zugZaehler = alt.zugZaehler + 1;

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

        /* Verlorene Figuren merken — die Wiedergeburt holt sie zurück. */
        if (geschlagen) {
            neu.verloren[SCHACH.gegner(farbe)].push(geschlagen);
        } else if (ergebnis.zug.enPassant) {
            neu.verloren[SCHACH.gegner(farbe)].push("B");
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
            neu.faehigkeiten[farbe].push(bonus.art);

            /* Derselbe Weg wie beim Zug davor: Dieser Eintrag beschreibt
               denselben Zug. So findet der Bildschirm die Bewegung auch dann am
               Ende des Verlaufs, wenn dabei eine Fähigkeit eingesammelt wurde. */
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
            && SCHACH_RUNDE._bonusText(einsA) === SCHACH_RUNDE._bonusText(einsB)
            && einsA.stand.schildFeld === einsB.stand.schildFeld
            && einsA.stand.fesselFeld === einsB.stand.fesselFeld;
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
