/*
 * imposter-runde.js — die Regeln des Spiels Imposter.
 *
 * Alle wissen dasselbe Wort — bis auf einen oder mehrere Imposter, die nur
 * wissen, dass sie es nicht wissen. Über den Tisch hinweg stellt man sich
 * Fragen; am Ende tippt jeder, wer der Imposter war, und der Imposter tippt
 * das Wort.
 *
 * Diese Datei kennt weder Bildschirm noch Speicher und ist ohne Browser
 * testbar (tests\test-imposter.js).
 *
 * DER WICHTIGSTE SATZ ZUM DATENMODELL
 * **Das Wort steht nirgends im gespeicherten Stand, und die Rollen auch nicht.**
 * Gespeichert wird nur ein Salz (eine Zufallszeichenkette). Wort und Rollen
 * werden daraus GERECHNET — auf jedem Gerät gleich, ohne dass sie je über die
 * Leitung gehen. Wie beim Würfel-Siegel und beim Schach-Zufall.
 *
 * WAS DAS LEISTET UND WAS NICHT
 * Es verhindert das versehentliche Mitlesen: Wer die Datenbank öffnet, sieht
 * eine Zeichenkette und sonst nichts. Es verhindert NICHT das absichtliche
 * Nachrechnen — der Quelltext liegt offen auf GitHub, wer die Konsole öffnet,
 * kann Wort und Rollen selbst ausrechnen. Für ein Spiel unter Freunden ist das
 * die richtige Stelle zum Aufhören; alles andere bräuchte einen Server, der
 * die Rollen für sich behält. Dieselbe Abwägung wie bei der Spieler-PIN, siehe
 * docs\DECISIONS.md.
 *
 * Datenvertrag (additiv — Felder nur ERGÄNZEN):
 *
 *     {
 *         "datenVersion": 1,
 *         "geaendertAm": 1750000000000,
 *         "phase": "warten",        // warten | laeuft | aufloesung
 *         "gruppe": "alltag",       // Kennung aus imposter-woerter.js
 *         "impostermenge": 1,       // Wunsch: wie viele Imposter höchstens
 *         "salz": "",               // daraus folgen Wort und Rollen
 *         "startAm": 0,             // Zeitpunkt des Starts (für die Uhr)
 *         "endeAm": 0,
 *         "spieler": [
 *             { "id": "…", "bereit": false, "fertig": false,
 *               "tipps": { "<id>": "neutral|imposter|save" },
 *               "wortTipp": "" }
 *         ]
 *     }
 */

const IMPOSTER_RUNDE = {

    DATEN_VERSION: 1,

    /* Wie viele Imposter man höchstens einstellen kann. */
    IMPOSTER_HOECHSTENS: 10,

    /*
     * Mit dieser Chance (in Prozent) wird ein vorgesehener Imposter am Ende
     * doch keiner. Deshalb kann es weniger geben als eingestellt — und in
     * seltenen Fällen gar keinen.
     */
    AUSFALL_CHANCE: 15,

    /* Punkte für die Rangliste. */
    PUNKTE_RICHTIG_GETIPPT: 8,
    PUNKTE_IMPOSTER_UNENTDECKT: 20,
    PUNKTE_WORT_ERRATEN: 15,
    PUNKTE_TEILNAHME: 2,

    /* Bis zu dieser Zeit (in Sekunden) gibt es einen Zuschlag fürs Tempo. */
    TEMPO_SEKUNDEN: 300,
    PUNKTE_TEMPO: 10,

    leereRunde(zeitpunkt) {
        return {
            datenVersion: IMPOSTER_RUNDE.DATEN_VERSION,
            geaendertAm: (zeitpunkt === undefined) ? 0 : zeitpunkt,
            phase: "warten",
            gruppe: IMPOSTER_WOERTER.gruppen[0].id,
            impostermenge: 1,
            salz: "",
            startAm: 0,
            endeAm: 0,
            spieler: []
        };
    },

    normalisieren(roh) {
        const runde = IMPOSTER_RUNDE.leereRunde();

        if (!roh || typeof roh !== "object") {
            return runde;
        }

        if (typeof roh.geaendertAm === "number" && isFinite(roh.geaendertAm)) {
            runde.geaendertAm = roh.geaendertAm;
        }
        if (["warten", "laeuft", "aufloesung"].indexOf(roh.phase) !== -1) {
            runde.phase = roh.phase;
        }
        if (IMPOSTER_WOERTER.gibtEs(roh.gruppe)) {
            runde.gruppe = roh.gruppe;
        }
        if (Number.isInteger(roh.impostermenge) && roh.impostermenge >= 1
            && roh.impostermenge <= IMPOSTER_RUNDE.IMPOSTER_HOECHSTENS) {
            runde.impostermenge = roh.impostermenge;
        }
        if (typeof roh.salz === "string" && /^[a-z0-9]{0,32}$/.test(roh.salz)) {
            runde.salz = roh.salz;
        }
        if (typeof roh.startAm === "number" && isFinite(roh.startAm) && roh.startAm >= 0) {
            runde.startAm = roh.startAm;
        }
        if (typeof roh.endeAm === "number" && isFinite(roh.endeAm) && roh.endeAm >= 0) {
            runde.endeAm = roh.endeAm;
        }

        if (Array.isArray(roh.spieler)) {
            for (const eintrag of roh.spieler) {
                if (!eintrag || typeof eintrag.id !== "string" || eintrag.id === "") {
                    continue;
                }
                if (runde.spieler.some((vorhanden) => vorhanden.id === eintrag.id)) {
                    continue;
                }

                const tipps = {};
                if (eintrag.tipps && typeof eintrag.tipps === "object") {
                    for (const ziel of Object.keys(eintrag.tipps)) {
                        if (["neutral", "imposter", "save"].indexOf(eintrag.tipps[ziel]) !== -1) {
                            tipps[ziel] = eintrag.tipps[ziel];
                        }
                    }
                }

                runde.spieler.push({
                    id: eintrag.id,
                    bereit: (eintrag.bereit === true),
                    fertig: (eintrag.fertig === true),
                    tipps: tipps,
                    wortTipp: (typeof eintrag.wortTipp === "string")
                        ? eintrag.wortTipp.substring(0, 40) : ""
                });
            }
        }

        return runde;
    },

    kopieren(runde) {
        return IMPOSTER_RUNDE.normalisieren(runde);
    },

    spielerFinden(runde, id) {
        return IMPOSTER_RUNDE.normalisieren(runde).spieler
            .find((eintrag) => eintrag.id === id) || null;
    },

    /* ---------------------------------------------------------------- *
     * Der gerechnete Zufall
     *
     * Dieselbe Streufunktion wie beim Schach (FNV-1a): Aus dem Salz folgen
     * Wort und Rollen, auf jedem Gerät gleich und ohne Absprache.
     * ---------------------------------------------------------------- */

    _zufallsWert(text) {
        let wert = 2166136261;

        for (let stelle = 0; stelle < text.length; stelle++) {
            wert ^= text.charCodeAt(stelle);
            wert = Math.imul(wert, 16777619);
        }

        /*
         * Nachmischen — und zwar zwingend.
         *
         * Ohne diesen Schritt bleiben zwei Werte verwandt, wenn sich ihre
         * Eingaben erst spät unterscheiden ("…|rolle|id-1" gegen
         * "…|ausfall|id-1"). Genau das ist aufgefallen: Wer beim Auslosen vorn
         * lag, fiel auch überdurchschnittlich oft wieder heraus — statt in
         * zwei von hundert Runden gab es in fast jeder fünften gar keinen
         * Imposter. Die drei Zeilen unten (Streuung nach Murmur) trennen die
         * Werte voneinander.
         */
        wert ^= wert >>> 16;
        wert = Math.imul(wert, 2246822507);
        wert ^= wert >>> 13;
        wert = Math.imul(wert, 3266489909);
        wert ^= wert >>> 16;

        return (wert >>> 0) / 4294967296;
    },

    /* Das Wort dieser Runde — leer, solange nicht gestartet wurde. */
    wortVon(runde) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        if (!stand.salz) {
            return "";
        }

        const gruppe = IMPOSTER_WOERTER.gruppe(stand.gruppe);
        const wert = IMPOSTER_RUNDE._zufallsWert(stand.salz + "|wort");

        return gruppe.woerter[Math.floor(wert * gruppe.woerter.length) % gruppe.woerter.length];
    },

    /*
     * Ist dieser Spieler Imposter?
     *
     * Das Verfahren in drei Schritten, damit die Zusagen alle stimmen:
     *   1. Alle Mitspieler werden nach ihrem Zufallswert sortiert.
     *   2. Die vordersten `impostermenge` sind vorgesehen — aber höchstens so
     *      viele, dass mindestens EINER kein Imposter ist.
     *   3. Jeder Vorgesehene fällt mit AUSFALL_CHANCE doch wieder heraus.
     *      Deshalb können es weniger sein, in seltenen Fällen keiner.
     */
    imposterListe(runde) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        if (!stand.salz || stand.spieler.length === 0) {
            return [];
        }

        const sortiert = stand.spieler
            .map((eintrag) => ({
                id: eintrag.id,
                wert: IMPOSTER_RUNDE._zufallsWert(stand.salz + "|rolle|" + eintrag.id)
            }))
            .sort((einer, anderer) => (einer.wert - anderer.wert)
                || (einer.id < anderer.id ? -1 : 1));

        /* Mindestens einer bleibt immer ehrlich. */
        const hoechstens = Math.min(stand.impostermenge, stand.spieler.length - 1);
        const liste = [];

        for (let stelle = 0; stelle < hoechstens; stelle++) {
            const eintrag = sortiert[stelle];
            const ausfall = IMPOSTER_RUNDE._zufallsWert(
                stand.salz + "|ausfall|" + eintrag.id) * 100;

            if (ausfall >= IMPOSTER_RUNDE.AUSFALL_CHANCE) {
                liste.push(eintrag.id);
            }
        }

        return liste;
    },

    istImposter(runde, spielerId) {
        return IMPOSTER_RUNDE.imposterListe(runde).indexOf(spielerId) !== -1;
    },

    /* ---------------------------------------------------------------- *
     * Beitreten und Einstellen
     * ---------------------------------------------------------------- */

    beitreten(runde, spielerId, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);

        if (!spielerId || neu.phase !== "warten") {
            return neu;
        }
        if (!neu.spieler.some((eintrag) => eintrag.id === spielerId)) {
            neu.spieler.push({
                id: spielerId,
                bereit: false,
                fertig: false,
                tipps: {},
                wortTipp: ""
            });
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    verlassen(runde, spielerId, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        neu.spieler = neu.spieler.filter((eintrag) => eintrag.id !== spielerId);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Thema und Anzahl lassen sich nur vor dem Start ändern. */
    einstellen(runde, gruppe, impostermenge, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);

        if (neu.phase !== "warten") {
            return neu;
        }
        if (IMPOSTER_WOERTER.gibtEs(gruppe)) {
            neu.gruppe = gruppe;
        }
        if (Number.isInteger(impostermenge) && impostermenge >= 1
            && impostermenge <= IMPOSTER_RUNDE.IMPOSTER_HOECHSTENS) {
            neu.impostermenge = impostermenge;
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    bereitSetzen(runde, spielerId, bereit, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const spieler = neu.spieler.find((eintrag) => eintrag.id === spielerId);

        if (!spieler || neu.phase !== "warten") {
            return neu;
        }
        spieler.bereit = (bereit === true);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Zwei Mitspieler und alle bereit: dann kann es losgehen. */
    kannStarten(runde) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);

        return stand.phase === "warten"
            && stand.spieler.length >= 2
            && stand.spieler.every((eintrag) => eintrag.bereit);
    },

    /*
     * Startet die Runde. `salz` kommt von aussen, damit diese Datei ohne
     * Zufallsquelle auskommt und die Tests vorhersagbar bleiben.
     */
    starten(runde, salz, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);

        if (!IMPOSTER_RUNDE.kannStarten(neu)) {
            return null;
        }

        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;

        neu.phase = "laeuft";
        neu.salz = String(salz || "").toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 32);
        neu.startAm = wann;
        neu.endeAm = 0;

        /* Die Vorbelegung: Jeder tippt zunächst auf „neutral". */
        for (const spieler of neu.spieler) {
            spieler.fertig = false;
            spieler.tipps = {};
            spieler.wortTipp = "";
        }

        neu.geaendertAm = wann;
        return neu;
    },

    /* ---------------------------------------------------------------- *
     * Während der Runde
     * ---------------------------------------------------------------- */

    tippSetzen(runde, spielerId, zielId, wert, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const spieler = neu.spieler.find((eintrag) => eintrag.id === spielerId);

        if (!spieler || neu.phase !== "laeuft" || spielerId === zielId) {
            return neu;
        }
        if (!neu.spieler.some((eintrag) => eintrag.id === zielId)) {
            return neu;
        }
        if (["neutral", "imposter", "save"].indexOf(wert) === -1) {
            return neu;
        }

        if (wert === "neutral") {
            delete spieler.tipps[zielId];
        } else {
            spieler.tipps[zielId] = wert;
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    wortTippSetzen(runde, spielerId, wort, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const spieler = neu.spieler.find((eintrag) => eintrag.id === spielerId);

        if (!spieler || neu.phase !== "laeuft") {
            return neu;
        }
        spieler.wortTipp = String(wort || "").substring(0, 40);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    fertigSetzen(runde, spielerId, fertig, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const spieler = neu.spieler.find((eintrag) => eintrag.id === spielerId);

        if (!spieler || neu.phase !== "laeuft") {
            return neu;
        }
        spieler.fertig = (fertig === true);

        /* Sind alle fertig, endet die Runde von selbst. */
        if (neu.spieler.every((eintrag) => eintrag.fertig)) {
            neu.phase = "aufloesung";
            neu.endeAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Neue Runde: Mitspieler bleiben, alles andere beginnt von vorn. */
    neueRunde(runde, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);

        neu.phase = "warten";
        neu.salz = "";
        neu.startAm = 0;
        neu.endeAm = 0;

        for (const spieler of neu.spieler) {
            spieler.bereit = false;
            spieler.fertig = false;
            spieler.tipps = {};
            spieler.wortTipp = "";
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* ---------------------------------------------------------------- *
     * Auswertung
     * ---------------------------------------------------------------- */

    /*
     * Passt der geratene Begriff zum Wort?
     *
     * Grosse und kleine Buchstaben sind egal, und EIN Fehler wird verziehen —
     * ein Buchstabe zu viel, zu wenig, falsch oder mit dem Nachbarn vertauscht.
     *
     * Der Dreher gehört ausdrücklich dazu: „Regenschrim" ist der häufigste
     * Tippfehler überhaupt. Die einfache Editier-Entfernung zählt ihn als ZWEI
     * Fehler (löschen und einfügen); deshalb wird hier die Fassung mit
     * Vertauschung gerechnet (Damerau).
     */
    wortPasst(wort, tipp) {
        const einer = String(wort || "").toLowerCase().trim();
        const anderer = String(tipp || "").toLowerCase().trim();

        if (!einer || !anderer) {
            return false;
        }
        return IMPOSTER_RUNDE._abstand(einer, anderer) <= 1;
    },

    /*
     * Editier-Entfernung mit Vertauschung (Damerau-Levenshtein).
     *
     * Gerechnet wird über die ganze Tabelle statt zeilenweise: Für den Dreher
     * braucht es die vorletzte Zeile, und mit zwei gemerkten Zeilen wäre der
     * Code schwerer zu lesen als die paar Zellen wert sind — die Wörter hier
     * sind höchstens vierzig Zeichen lang.
     */
    _abstand(einer, anderer) {
        const tabelle = [];

        for (let zeile = 0; zeile <= einer.length; zeile++) {
            tabelle[zeile] = [zeile];
        }
        for (let spalte = 0; spalte <= anderer.length; spalte++) {
            tabelle[0][spalte] = spalte;
        }

        for (let zeile = 1; zeile <= einer.length; zeile++) {
            for (let spalte = 1; spalte <= anderer.length; spalte++) {
                const kosten = (einer[zeile - 1] === anderer[spalte - 1]) ? 0 : 1;

                let wert = Math.min(
                    tabelle[zeile - 1][spalte] + 1,
                    tabelle[zeile][spalte - 1] + 1,
                    tabelle[zeile - 1][spalte - 1] + kosten
                );

                /* Zwei benachbarte Buchstaben vertauscht: EIN Fehler. */
                if (zeile > 1 && spalte > 1
                    && einer[zeile - 1] === anderer[spalte - 2]
                    && einer[zeile - 2] === anderer[spalte - 1]) {
                    wert = Math.min(wert, tabelle[zeile - 2][spalte - 2] + 1);
                }

                tabelle[zeile][spalte] = wert;
            }
        }

        return tabelle[einer.length][anderer.length];
    },

    /*
     * Das Ergebnis der Runde, je Spieler:
     *   { id, imposter, punkte, richtig, falsch, wortRichtig }
     *
     * Gewertet wird:
     *   - für jeden richtig als Imposter erkannten Mitspieler Punkte,
     *   - für den Imposter Punkte, wenn ihn die Mehrheit NICHT erkannt hat,
     *   - für den Imposter Punkte, wenn er das Wort erraten hat,
     *   - Teilnahme, und ein Zuschlag, wenn die Runde schnell vorbei war.
     */
    ergebnis(runde) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        const imposter = IMPOSTER_RUNDE.imposterListe(stand);
        const wort = IMPOSTER_RUNDE.wortVon(stand);

        /* Der Tempo-Zuschlag gilt für alle gleich. */
        const dauer = (stand.endeAm > stand.startAm)
            ? Math.round((stand.endeAm - stand.startAm) / 1000)
            : 0;
        const tempo = (stand.phase === "aufloesung" && dauer > 0
            && dauer <= IMPOSTER_RUNDE.TEMPO_SEKUNDEN)
            ? IMPOSTER_RUNDE.PUNKTE_TEMPO
            : 0;

        return stand.spieler.map((spieler) => {
            const istImposter = (imposter.indexOf(spieler.id) !== -1);
            const eintrag = {
                id: spieler.id,
                imposter: istImposter,
                punkte: IMPOSTER_RUNDE.PUNKTE_TEILNAHME + tempo,
                richtig: 0,
                falsch: 0,
                wortRichtig: false
            };

            /* Wer hat wen richtig getippt? */
            for (const ziel of Object.keys(spieler.tipps)) {
                const alsImposter = (spieler.tipps[ziel] === "imposter");
                const zielIstImposter = (imposter.indexOf(ziel) !== -1);

                if (alsImposter === zielIstImposter) {
                    eintrag.richtig++;
                    eintrag.punkte += IMPOSTER_RUNDE.PUNKTE_RICHTIG_GETIPPT;
                } else {
                    eintrag.falsch++;
                }
            }

            if (istImposter) {
                /* Unentdeckt: Weniger als die Hälfte der anderen hat ihn
                   als Imposter getippt. */
                const andere = stand.spieler.filter((wer) => wer.id !== spieler.id);
                const entdeckt = andere
                    .filter((wer) => wer.tipps[spieler.id] === "imposter").length;

                if (andere.length > 0 && entdeckt * 2 < andere.length) {
                    eintrag.punkte += IMPOSTER_RUNDE.PUNKTE_IMPOSTER_UNENTDECKT;
                }

                if (IMPOSTER_RUNDE.wortPasst(wort, spieler.wortTipp)) {
                    eintrag.wortRichtig = true;
                    eintrag.punkte += IMPOSTER_RUNDE.PUNKTE_WORT_ERRATEN;
                }
            }

            return eintrag;
        });
    },

    /* Die Punkteregeln im Wortlaut — für den i-Knopf. */
    punkteErklaerung() {
        return "Jede Runde bringt " + IMPOSTER_RUNDE.PUNKTE_TEILNAHME
            + " Punkte fürs Mitspielen.\n\n"
            + "Für jeden Mitspieler, den du richtig einschätzt — Imposter oder "
            + "nicht —, gibt es " + IMPOSTER_RUNDE.PUNKTE_RICHTIG_GETIPPT + " Punkte.\n\n"
            + "Ein Imposter bekommt " + IMPOSTER_RUNDE.PUNKTE_IMPOSTER_UNENTDECKT
            + " Punkte, wenn ihn weniger als die Hälfte der anderen enttarnt hat, "
            + "und " + IMPOSTER_RUNDE.PUNKTE_WORT_ERRATEN + " Punkte, wenn er das "
            + "Wort errät. Ein Tippfehler wird dabei verziehen.\n\n"
            + "War die Runde in unter " + Math.round(IMPOSTER_RUNDE.TEMPO_SEKUNDEN / 60)
            + " Minuten vorbei, bekommen alle " + IMPOSTER_RUNDE.PUNKTE_TEMPO
            + " Punkte Zuschlag.\n\n"
            + "Wie viele Imposter es wirklich werden, entscheidet der Zufall: Es "
            + "können weniger sein als eingestellt, in seltenen Fällen keiner. "
            + "Einer ist nie Imposter — sonst wüsste niemand das Wort.";
    },

    /* ---------------------------------------------------------------- *
     * Vergleich (steuert das Neuzeichnen)
     * ---------------------------------------------------------------- */

    inhaltGleich(a, b) {
        const einsA = IMPOSTER_RUNDE.normalisieren(a);
        const einsB = IMPOSTER_RUNDE.normalisieren(b);

        return einsA.phase === einsB.phase
            && einsA.gruppe === einsB.gruppe
            && einsA.impostermenge === einsB.impostermenge
            && einsA.salz === einsB.salz
            && einsA.endeAm === einsB.endeAm
            && IMPOSTER_RUNDE._spielerText(einsA) === IMPOSTER_RUNDE._spielerText(einsB);
    },

    _spielerText(runde) {
        return runde.spieler.map((eintrag) => eintrag.id
            + ":" + (eintrag.bereit ? "b" : "-")
            + (eintrag.fertig ? "f" : "-")
            + ":" + Object.keys(eintrag.tipps).sort()
                .map((ziel) => ziel + "=" + eintrag.tipps[ziel]).join(",")
            + ":" + eintrag.wortTipp).join("|");
    },

    /*
     * Der eigene Eintrag wird in den Stand vom Server gesetzt — dieselbe Regel
     * wie im Würfel-Quizz: Jeder ist Herr über seinen eigenen Eintrag.
     */
    zusammenfuehren(fremd, eigen, eigeneId) {
        const ziel = IMPOSTER_RUNDE.normalisieren(fremd);
        const meine = IMPOSTER_RUNDE.normalisieren(eigen);

        /* Phase, Salz und Einstellungen gehören der Runde, nicht dem Spieler:
           Wer sie ändert, ändert sie für alle (Start, neue Runde). */
        if (meine.phase !== ziel.phase || meine.salz !== ziel.salz) {
            return meine;
        }

        const meinEintrag = meine.spieler.find((eintrag) => eintrag.id === eigeneId);
        if (!meinEintrag) {
            return ziel;
        }

        const stelle = ziel.spieler.findIndex((eintrag) => eintrag.id === eigeneId);
        if (stelle === -1) {
            ziel.spieler.push(meinEintrag);
        } else {
            ziel.spieler[stelle] = meinEintrag;
        }

        /* Die Runde endet, sobald alle fertig sind — das muss auch beim
           Zusammenführen greifen. */
        if (ziel.phase === "laeuft" && ziel.spieler.length > 0
            && ziel.spieler.every((eintrag) => eintrag.fertig)) {
            ziel.phase = "aufloesung";
            ziel.endeAm = Math.max(ziel.endeAm, meine.endeAm, ziel.geaendertAm);
        }

        ziel.geaendertAm = Math.max(ziel.geaendertAm, meine.geaendertAm);
        return ziel;
    }
};

/* Für die Tests ausserhalb des Browsers. IMPOSTER_WOERTER muss dort vorher
   als globale Größe bereitstehen — genau wie im Browser. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = IMPOSTER_RUNDE;
}
