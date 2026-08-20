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
 *         "id": "r-…",              // Kennung des Raums (seit v3.2)
 *         "titel": "Feierabend",    // Name des Raums (seit v3.2)
 *         "phase": "warten",        // warten | laeuft | aufloesung
 *         "gruppe": "alltag",       // Thema, oder "alle" (seit v3.7)
 *         "wortart": "alle",        // Filter: alle | nomen | verb | adjektiv
 *         "impostermenge": 1,       // Wunsch: wie viele Imposter höchstens
 *         "salz": "",               // daraus folgen Wort und Rollen
 *         "startAm": 0,             // Zeitpunkt des Starts (für die Uhr)
 *         "endeAm": 0,
 *         "eigeneWoerter": {        // ergänzt, je Gruppe
 *             "alltag": ["Kaminfeuer"]
 *         },
 *         "wortarten": {            // Wortart ergänzter Wörter (seit v3.7);
 *             "kaminfeuer": "nomen" // Schlüssel klein geschrieben. Fehlt ein
 *         },                        // Eintrag, gilt "nomen".
 *         "eigeneGruppen": {        // selbst angelegte Themen (seit v3.7)
 *             "e-gemuese": "Gemüse"
 *         },
 *         "letzteWoerter": [        // was zuletzt dran war, jüngstes zuletzt
 *             "Zahnbürste"          // (seit v3.7, gegen Wiederholungen)
 *         ],
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

    /*
     * Wie lange ein gefallenes Wort nachwirkt (in Runden).
     *
     * Ein Wort, das gerade dran war, wäre in der nächsten Runde langweilig —
     * alle wissen ja noch, worum es ging. Es wird deshalb nicht gesperrt,
     * sondern nur unwahrscheinlicher: In der Runde direkt danach zählt es nur
     * ein Zehntel so viel wie jedes andere, und mit jeder weiteren Runde
     * erholt es sich, bis es nach zehn Runden wieder ganz normal mitspielt.
     *
     * Eine harte Sperre wäre einfacher gewesen, hätte aber bei kleinen Themen
     * die Auswahl leergeräumt. So bleibt jedes Wort jederzeit möglich.
     */
    WIEDERHOLUNG_RUNDEN: 10,

    /* So viele gefallene Wörter bleiben im Gedächtnis. Mehr braucht es nicht:
       Was länger her ist als WIEDERHOLUNG_RUNDEN, wirkt ohnehin nicht mehr. */
    GEDAECHTNIS: 20,

    leereRunde(zeitpunkt) {
        return {
            datenVersion: IMPOSTER_RUNDE.DATEN_VERSION,
            geaendertAm: (zeitpunkt === undefined) ? 0 : zeitpunkt,

            /* Kennung und Name des Raums — seit v3.2 liegen mehrere
               nebeneinander (siehe imposter-tafel.js). */
            id: "",
            titel: "",

            phase: "warten",
            gruppe: IMPOSTER_WOERTER.gruppen[0].id,

            /* Der Wortart-Filter (seit v3.7). „alle" heisst: keiner — und das
               ist auch die Vorgabe für Räume, die es noch nicht kennen. */
            wortart: IMPOSTER_WOERTER.ALLE,

            impostermenge: 1,
            salz: "",
            startAm: 0,
            endeAm: 0,

            /*
             * Wörter, die ergänzt wurden, je Gruppe. Sie stehen im gemeinsamen
             * Stand, damit alle Geräte dieselbe Auswahl haben — sonst zöge
             * jedes ein anderes Wort aus einem anderen Vorrat.
             */
            eigeneWoerter: {},

            /* Die Wortart dieser Wörter, klein geschriebener Schlüssel. Wer
               hier nicht steht, gilt als Nomen. */
            wortarten: {},

            /* Themen, die die Mitspieler selbst angelegt haben (seit v3.7):
               Kennung -> Beschriftung. Sie stehen neben dem festen Katalog. */
            eigeneGruppen: {},

            /* Welche Wörter zuletzt dran waren, das jüngste zuletzt. Daraus
               folgt die Dämpfung von Wiederholungen. */
            letzteWoerter: [],

            spieler: []
        };
    },

    /*
     * Alle Wörter, aus denen diese Runde ziehen darf: der feste Katalog plus
     * die ergänzten — beides gefiltert nach dem eingestellten Thema und der
     * eingestellten Wortart.
     *
     * `gruppeId` und `wortart` sind wahlfrei; ohne Angabe gelten die
     * Einstellungen der Runde. Das zweite Argument gab es schon vorher, deshalb
     * bleibt es an seiner Stelle.
     *
     * Ergänzte Wörter kommen HINTEN dran. Die Ziehung rechnet mit der Länge der
     * Liste — dadurch verschieben sich vorhandene Wörter nicht, und eine
     * laufende Runde behält ihr Wort.
     */
    woerterVon(runde, gruppeId, wortart) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        const thema = (gruppeId === undefined) ? stand.gruppe : gruppeId;
        const art = (wortart === undefined) ? stand.wortart : wortart;

        /* Ein selbst angelegtes Thema hat keine festen Wörter — nur die, die
           die Mitspieler hineingeschrieben haben. */
        const feste = (thema === IMPOSTER_WOERTER.ALLE || IMPOSTER_WOERTER.gibtEs(thema))
            ? IMPOSTER_WOERTER.woerter(thema, art)
            : [];

        /*
         * Aus welchen Gruppen kommen die ergänzten Wörter? Bei „alle Themen"
         * aus allen — den festen wie den selbst angelegten. Die Reihenfolge ist
         * dabei so wichtig wie überall sonst: erst der Katalog, dann die
         * eigenen Themen in der Reihenfolge ihrer Kennung.
         */
        const gruppen = (thema === IMPOSTER_WOERTER.ALLE)
            ? IMPOSTER_WOERTER.zurAuswahl().map((gruppe) => gruppe.id)
                .concat(Object.keys(stand.eigeneGruppen).sort())
            : [thema];

        const eigene = [];

        for (const id of gruppen) {
            for (const wort of (stand.eigeneWoerter[id] || [])) {
                if (!IMPOSTER_WOERTER.gibtEsWortart(art)
                    || IMPOSTER_RUNDE.wortartVon(stand, wort) === art) {
                    eigene.push(wort);
                }
            }
        }

        return feste.concat(eigene);
    },

    /*
     * Gibt es dieses Thema — im festen Katalog oder unter den selbst
     * angelegten? Liefert die Kennung, sonst die des ersten Themas.
     */
    gruppeKennung(runde, gruppeId) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);

        if (stand.eigeneGruppen[gruppeId]) {
            return gruppeId;
        }
        return IMPOSTER_WOERTER.gruppe(gruppeId).id;
    },

    /* Die Beschriftung eines Themas — fester Katalog oder selbst angelegt. */
    gruppeTitel(runde, gruppeId) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);

        if (gruppeId === IMPOSTER_WOERTER.ALLE) {
            return "Alle Themen";
        }
        if (stand.eigeneGruppen[gruppeId]) {
            return stand.eigeneGruppen[gruppeId];
        }
        return IMPOSTER_WOERTER.gruppe(gruppeId).titel;
    },

    /* Alle Themen zur Auswahl: der feste Katalog plus die selbst angelegten. */
    gruppenZurAuswahl(runde) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        const liste = IMPOSTER_WOERTER.zurAuswahl()
            .map((gruppe) => ({ id: gruppe.id, titel: gruppe.titel, eigen: false }));

        for (const id of Object.keys(stand.eigeneGruppen).sort()) {
            liste.push({ id: id, titel: stand.eigeneGruppen[id], eigen: true });
        }

        return liste;
    },

    /*
     * Die Wortart eines Wortes: erst der eigene Eintrag, dann der feste
     * Katalog, sonst die Vorgabe. Ein Wort ohne bekannte Wortart als Nomen zu
     * führen ist die harmloseste Annahme — die allermeisten sind welche.
     */
    wortartVon(runde, wort) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        const schluessel = String(wort || "").toLowerCase();

        if (stand.wortarten[schluessel]) {
            return stand.wortarten[schluessel];
        }
        return IMPOSTER_WOERTER.wortartVon(wort) || IMPOSTER_WOERTER.STANDARD_WORTART;
    },

    normalisieren(roh) {
        const runde = IMPOSTER_RUNDE.leereRunde();

        if (!roh || typeof roh !== "object") {
            return runde;
        }

        if (typeof roh.geaendertAm === "number" && isFinite(roh.geaendertAm)) {
            runde.geaendertAm = roh.geaendertAm;
        }
        if (typeof roh.id === "string") {
            runde.id = roh.id;
        }
        if (typeof roh.titel === "string") {
            runde.titel = roh.titel.trim().substring(0, 40);
        }
        if (["warten", "laeuft", "aufloesung"].indexOf(roh.phase) !== -1) {
            runde.phase = roh.phase;
        }
        /*
         * DIE SELBST ANGELEGTEN THEMEN ZUERST: Sie entscheiden mit, ob `gruppe`
         * und die ergänzten Wörter gültig sind. Stünde das weiter unten, fiele
         * ein Raum mit eigenem Thema auf „Alltag" zurück.
         */
        if (roh.eigeneGruppen && typeof roh.eigeneGruppen === "object") {
            for (const id of Object.keys(roh.eigeneGruppen)) {
                const titel = (typeof roh.eigeneGruppen[id] === "string")
                    ? roh.eigeneGruppen[id].trim().substring(0, 30) : "";

                /* Eine eigene Kennung darf keine aus dem Katalog verdrängen. */
                if (titel !== "" && !IMPOSTER_WOERTER.gibtEs(id)
                    && id !== IMPOSTER_WOERTER.ALLE
                    && /^[a-z0-9-]{1,40}$/.test(id)) {
                    runde.eigeneGruppen[id] = titel;
                }
            }
        }

        if (IMPOSTER_WOERTER.gibtEs(roh.gruppe) || roh.gruppe === IMPOSTER_WOERTER.ALLE
            || runde.eigeneGruppen[roh.gruppe]) {
            runde.gruppe = roh.gruppe;
        }
        if (IMPOSTER_WOERTER.gibtEsWortart(roh.wortart)
            || roh.wortart === IMPOSTER_WOERTER.ALLE) {
            runde.wortart = roh.wortart;
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

        if (Array.isArray(roh.letzteWoerter)) {
            runde.letzteWoerter = roh.letzteWoerter
                .filter((wort) => typeof wort === "string" && wort.trim() !== "")
                .map((wort) => wort.trim().substring(0, 40))
                .slice(-IMPOSTER_RUNDE.GEDAECHTNIS);
        }

        if (roh.eigeneWoerter && typeof roh.eigeneWoerter === "object") {
            for (const gruppe of Object.keys(roh.eigeneWoerter)) {
                if (!IMPOSTER_WOERTER.gibtEs(gruppe) && !runde.eigeneGruppen[gruppe]) {
                    continue;
                }
                const liste = Array.isArray(roh.eigeneWoerter[gruppe])
                    ? roh.eigeneWoerter[gruppe] : [];

                const sauber = liste
                    .filter((wort) => typeof wort === "string")
                    .map((wort) => wort.trim().substring(0, 40))
                    .filter((wort) => wort !== "")
                    .filter((wort, stelle, alle) => alle.indexOf(wort) === stelle);

                if (sauber.length > 0) {
                    runde.eigeneWoerter[gruppe] = sauber;
                }
            }
        }

        /* Die Wortarten der ergänzten Wörter (seit v3.7). */
        if (roh.wortarten && typeof roh.wortarten === "object") {
            for (const schluessel of Object.keys(roh.wortarten)) {
                if (IMPOSTER_WOERTER.gibtEsWortart(roh.wortarten[schluessel])) {
                    runde.wortarten[String(schluessel).toLowerCase().substring(0, 40)]
                        = roh.wortarten[schluessel];
                }
            }
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

        const woerter = IMPOSTER_RUNDE.woerterVon(stand);
        if (woerter.length === 0) {
            return "";
        }

        const wert = IMPOSTER_RUNDE._zufallsWert(stand.salz + "|wort");
        return IMPOSTER_RUNDE._wortZiehen(stand, woerter, wert);
    },

    /*
     * Zieht ein Wort — und meidet dabei, was zuletzt schon dran war.
     *
     * Das Gewicht eines Wortes hängt davon ab, wie viele Runden seit seinem
     * letzten Auftritt vergangen sind: eine Runde danach ein Zehntel, zwei
     * Runden danach zwei Zehntel, und nach WIEDERHOLUNG_RUNDEN wieder ganz.
     * Gesperrt wird nie — bei einem kleinen Thema wäre die Auswahl sonst
     * irgendwann leer.
     *
     * OHNE GEDÄCHTNIS ÄNDERT SICH NICHTS: Sind alle Gewichte 1, ergibt die
     * Rechnung genau `woerter[floor(wert * länge)]` — dieselbe Stelle wie
     * vorher. Eine laufende Runde behält damit ihr Wort.
     */
    _wortZiehen(runde, woerter, wert) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        const gewichte = woerter.map(
            (wort) => IMPOSTER_RUNDE._wortGewicht(stand, wort));
        const summe = gewichte.reduce((teil, einzeln) => teil + einzeln, 0);

        if (summe <= 0) {
            return woerter[Math.floor(wert * woerter.length) % woerter.length];
        }

        let rest = Math.min(Math.max(wert, 0), 0.999999) * summe;

        for (let stelle = 0; stelle < woerter.length; stelle++) {
            if (rest < gewichte[stelle]) {
                return woerter[stelle];
            }
            rest -= gewichte[stelle];
        }

        return woerter[woerter.length - 1];
    },

    /* Wie stark zählt dieses Wort bei der Ziehung? 1 = wie jedes andere. */
    _wortGewicht(runde, wort) {
        const stand = IMPOSTER_RUNDE.normalisieren(runde);
        const gesucht = String(wort || "").toLowerCase();

        /* Von hinten suchen: Das jüngste Auftreten zählt. */
        for (let stelle = stand.letzteWoerter.length - 1; stelle >= 0; stelle--) {
            if (stand.letzteWoerter[stelle].toLowerCase() !== gesucht) {
                continue;
            }

            /* `abstand` ist 1, wenn das Wort in der letzten Runde dran war. */
            const abstand = stand.letzteWoerter.length - stelle;
            return Math.min(1, abstand / IMPOSTER_RUNDE.WIEDERHOLUNG_RUNDEN);
        }

        return 1;
    },

    /*
     * Fügt Wörter zu einer Gruppe hinzu — für den Import aus einem Block Text,
     * ein Wort je Zeile. Liefert { runde, hinzugefuegt, uebersprungen }.
     *
     * Übersprungen wird, was schon dasteht (auch im festen Katalog) und was
     * leer ist. Doppelte Wörter wären kein Fehler, aber sie verschöben die
     * Wahrscheinlichkeiten — ein zweimal vorhandenes Wort käme doppelt so oft.
     */
    woerterErgaenzen(runde, gruppeId, text, zeitpunkt, wortart) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);

        if (!IMPOSTER_WOERTER.gibtEs(gruppeId) && !neu.eigeneGruppen[gruppeId]) {
            return { runde: neu, hinzugefuegt: 0, uebersprungen: 0 };
        }

        /*
         * Gegen ALLES geprüft, nicht nur gegen dieses Thema und diese Wortart:
         * Ein Wort, das schon irgendwo steht, würde sonst zweimal auftauchen —
         * und ein doppeltes Wort käme doppelt so oft.
         */
        const vorhanden = IMPOSTER_RUNDE.woerterVon(
            neu, IMPOSTER_WOERTER.ALLE, IMPOSTER_WOERTER.ALLE)
            .map((wort) => wort.toLowerCase());
        const eigene = (neu.eigeneWoerter[gruppeId] || []).slice();

        let hinzugefuegt = 0;
        let uebersprungen = 0;

        for (const zeile of String(text || "").split(/\r?\n/)) {
            const wort = zeile.trim().substring(0, 40);

            if (wort === "") {
                continue;
            }
            if (vorhanden.indexOf(wort.toLowerCase()) !== -1) {
                uebersprungen++;
                continue;
            }

            eigene.push(wort);
            vorhanden.push(wort.toLowerCase());

            /* Die Wortart gehört zum Wort, nicht zur Gruppe — deshalb steht sie
               in einer eigenen Karte (seit v3.7). Ohne Angabe gilt die
               Vorgabe. */
            if (IMPOSTER_WOERTER.gibtEsWortart(wortart)) {
                neu.wortarten[wort.toLowerCase()] = wortart;
            }

            hinzugefuegt++;
        }

        if (hinzugefuegt > 0) {
            neu.eigeneWoerter[gruppeId] = eigene;
            neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        }

        return { runde: neu, hinzugefuegt: hinzugefuegt, uebersprungen: uebersprungen };
    },

    /*
     * Legt ein eigenes Thema an und liefert { runde, id }.
     *
     * Die Kennung wird aus dem Titel gebildet („Gemüse" wird zu `e-gemuese`) und
     * bei einer Kollision hochgezählt. Das Vorzeichen `e-` hält sie von den
     * Kennungen des festen Katalogs fern — die dürfen nie überdeckt werden,
     * sonst verlöre ein Raum sein Thema.
     *
     * Gibt es den Titel schon, wird NICHTS angelegt: Zurückgeliefert wird die
     * vorhandene Kennung. Zwei Themen „Gemüse" nebeneinander wären für alle
     * verwirrend, und die Wörter lägen verteilt.
     */
    gruppeAnlegen(runde, titel, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const name = String(titel || "").trim().substring(0, 30);

        if (name === "") {
            return { runde: neu, id: "" };
        }

        /* Schon da — im festen Katalog oder unter den eigenen? */
        const vorhanden = IMPOSTER_WOERTER.zurAuswahl()
            .find((gruppe) => gruppe.titel.toLowerCase() === name.toLowerCase());
        if (vorhanden) {
            return { runde: neu, id: vorhanden.id };
        }

        for (const id of Object.keys(neu.eigeneGruppen)) {
            if (neu.eigeneGruppen[id].toLowerCase() === name.toLowerCase()) {
                return { runde: neu, id: id };
            }
        }

        const grund = "e-" + name.toLowerCase()
            .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
            .replace(/ß/g, "ss")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .substring(0, 30);

        let id = (grund === "e-") ? "e-thema" : grund;
        let nummer = 1;

        while (neu.eigeneGruppen[id] || IMPOSTER_WOERTER.gibtEs(id)) {
            nummer++;
            id = grund + "-" + nummer;
        }

        neu.eigeneGruppen[id] = name;
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;

        return { runde: neu, id: id };
    },

    /* Entfernt ein ergänztes Wort. Der feste Katalog bleibt unberührt. */
    wortEntfernen(runde, gruppeId, wort, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const eigene = neu.eigeneWoerter[gruppeId];

        if (!eigene) {
            return neu;
        }

        neu.eigeneWoerter[gruppeId] = eigene.filter((eintrag) => eintrag !== wort);
        if (neu.eigeneWoerter[gruppeId].length === 0) {
            delete neu.eigeneWoerter[gruppeId];
        }
        delete neu.wortarten[String(wort || "").toLowerCase()];

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
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

    /* Den Raum umbenennen — geht jederzeit, der Name ändert am Spiel nichts. */
    umbenennen(runde, titel, zeitpunkt) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);
        const name = String(titel || "").trim().substring(0, 40);

        if (name === "") {
            return neu;
        }
        neu.titel = name;

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Thema und Anzahl lassen sich nur vor dem Start ändern.
     *
     * Seit v3.2 werden sie beim Anlegen des Raums festgelegt und danach nicht
     * mehr angefasst — wie die Spielart beim Schach. Die Funktion bleibt, weil
     * die Regeln davon nichts wissen müssen und der Datenvertrag additiv ist.
     */
    einstellen(runde, gruppe, impostermenge, zeitpunkt, wortart) {
        const neu = IMPOSTER_RUNDE.kopieren(runde);

        if (neu.phase !== "warten") {
            return neu;
        }
        if (IMPOSTER_WOERTER.gibtEs(gruppe) || gruppe === IMPOSTER_WOERTER.ALLE) {
            neu.gruppe = gruppe;
        }
        if (IMPOSTER_WOERTER.gibtEsWortart(wortart) || wortart === IMPOSTER_WOERTER.ALLE) {
            neu.wortart = wortart;
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

        /*
         * DAS ALTE WORT WANDERT INS GEDÄCHTNIS — und zwar HIER und nicht beim
         * Starten.
         *
         * Der Grund ist ein Zirkelschluss: `wortVon` rechnet das Wort aus dem
         * Salz UND dem Gedächtnis. Würde das frisch gezogene Wort sofort
         * eingetragen, änderte sich damit sein eigenes Gewicht — und die
         * nächste Abfrage lieferte ein anderes Wort als die erste. Beim
         * Zurücksetzen ist das Salz dagegen ohnehin gleich weg.
         */
        const gefallen = IMPOSTER_RUNDE.wortVon(neu);
        if (gefallen) {
            neu.letzteWoerter.push(gefallen);

            while (neu.letzteWoerter.length > IMPOSTER_RUNDE.GEDAECHTNIS) {
                neu.letzteWoerter.shift();
            }
        }

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
        return "Mitspielen: " + IMPOSTER_RUNDE.PUNKTE_TEILNAHME + " Punkte.\n"
            + "Je richtig eingeschätztem Mitspieler: "
            + IMPOSTER_RUNDE.PUNKTE_RICHTIG_GETIPPT + ".\n"
            + "Als Imposter: " + IMPOSTER_RUNDE.PUNKTE_IMPOSTER_UNENTDECKT
            + ", wenn dich weniger als die Hälfte enttarnt, und "
            + IMPOSTER_RUNDE.PUNKTE_WORT_ERRATEN + " fürs erratene Wort "
            + "(Tippfehler verziehen).\n"
            + "Unter " + Math.round(IMPOSTER_RUNDE.TEMPO_SEKUNDEN / 60)
            + " Minuten: " + IMPOSTER_RUNDE.PUNKTE_TEMPO
            + " Punkte Zuschlag für alle.\n\n"
            + "Wie viele Imposter es werden, entscheidet der Zufall — es können "
            + "weniger sein als eingestellt, selten keiner. Einer ist es nie, "
            + "sonst wüsste niemand das Wort.\n\n"
            + "Dein eigenes Wort kann schon in derselben Runde drankommen. Was "
            + "gerade dran war, wird nach etwa "
            + IMPOSTER_RUNDE.WIEDERHOLUNG_RUNDEN
            + " Runden wieder normal wahrscheinlich — gesperrt ist es nie.";
    },

    /* ---------------------------------------------------------------- *
     * Vergleich (steuert das Neuzeichnen)
     * ---------------------------------------------------------------- */

    inhaltGleich(a, b) {
        const einsA = IMPOSTER_RUNDE.normalisieren(a);
        const einsB = IMPOSTER_RUNDE.normalisieren(b);

        return einsA.phase === einsB.phase
            && einsA.gruppe === einsB.gruppe
            && einsA.wortart === einsB.wortart
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
