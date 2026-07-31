/*
 * team-schach.js — der Tab "Team Schach": Brett und Teams auf dem Bildschirm.
 *
 * So läuft es:
 *   1. Man tritt einem Team bei (Weiss oder Schwarz) — auch mitten im Spiel.
 *   2. Sobald auf beiden Seiten jemand steht und je einer "bereit" gedrückt
 *      hat, beginnt die Partie.
 *   3. Wer im Team ist, das am Zug ist, darf ziehen. **Innerhalb des Teams
 *      gibt es keine Reihenfolge: Wer zuerst zieht, hat gezogen.**
 *   4. Bedienung wie üblich: Figur antippen, mögliche Felder erscheinen als
 *      Punkte, Zielfeld antippen.
 *
 * Der Stand liegt in der Datenbank unter einem eigenen Pfad (siehe konfig.js)
 * und wird jederzeit fortgesetzt.
 *
 * Diese Datei kennt nur den Bildschirm. Die Regeln stehen in schach.js, die
 * Teams und der Rundenablauf in schach-runde.js.
 */

const TEAM_SCHACH = {

    id: "team-schach",
    titel: "Team Schach",

    /* Wird von app.js gesetzt. */
    abgleich: null,

    wurzelEl: null,

    /* Gerade angetipptes Feld (Feldnummer) oder -1. */
    gewaehltesFeld: -1,

    /* Zielfelder zum gewählten Feld, als Feldnummern. */
    moeglicheZiele: [],

    /* Verhindert zwei Züge gleichzeitig vom selben Gerät. */
    ziehtGerade: false,

    verbinden(abgleich) {
        TEAM_SCHACH.abgleich = abgleich;
    },

    aufbauen(behaelter) {
        TEAM_SCHACH.wurzelEl = document.createElement("div");
        TEAM_SCHACH.wurzelEl.className = "schach";
        behaelter.appendChild(TEAM_SCHACH.wurzelEl);
    },

    /* Wer sitzt an diesem Gerät? Die Anmeldung läuft über den Würfel-Quizz. */
    _ich() {
        return ICH.person();
    },

    /* ---------------------------------------------------------------- *
     * Zeichnen
     * ---------------------------------------------------------------- */

    zeichnen(runde) {
        const wurzel = TEAM_SCHACH.wurzelEl;
        if (!wurzel) {
            return;
        }

        wurzel.innerHTML = "";

        const person = TEAM_SCHACH._ich();
        if (!person) {
            wurzel.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Melde dich zuerst im Tab Würfel Quizz an — dann bist du auch hier "
                + "mit deinem Namen dabei."));
            return;
        }

        wurzel.appendChild(TEAM_SCHACH._standLeisteBauen(runde, person));
        wurzel.appendChild(TEAM_SCHACH._teamsBauen(runde, person));
        wurzel.appendChild(TEAM_SCHACH._brettBauen(runde, person));
        wurzel.appendChild(TEAM_SCHACH._verlaufBauen(runde));
        wurzel.appendChild(TEAM_SCHACH._fussleisteBauen(runde, person));
    },

    _standLeisteBauen(runde, person) {
        const leiste = TEAM_SCHACH._element("div", "phasen-leiste");
        const meinTeam = SCHACH_RUNDE.teamVon(runde, person.id);

        if (runde.ergebnis) {
            const text = (runde.ergebnis === "remis")
                ? "Unentschieden"
                : ((runde.ergebnis === "weiss") ? "Weiss gewinnt" : "Schwarz gewinnt");
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-fertig", text));
        } else if (runde.laeuft) {
            const amZug = (runde.stand.amZug === "weiss") ? "Weiss" : "Schwarz";
            const dran = (meinTeam === runde.stand.amZug);
            leiste.appendChild(TEAM_SCHACH._element(
                "span",
                "chip " + (dran ? "chip-fertig" : "chip-laeuft"),
                dran ? "Dein Team ist am Zug" : amZug + " ist am Zug"
            ));
        } else {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-offen",
                "Noch nicht gestartet"));
        }

        const lage = SCHACH.lage(runde.stand);
        if (runde.laeuft && lage.art === "laeuft" && SCHACH.imSchach(runde.stand, runde.stand.amZug)) {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-fehler", "Schach"));
        }

        leiste.appendChild(TEAM_SCHACH._element("span", "phasen-text",
            "Zug " + runde.stand.zugNummer));

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Teams
     * ---------------------------------------------------------------- */

    _teamsBauen(runde, person) {
        const bereich = TEAM_SCHACH._element("div", "team-reihe");
        const meinTeam = SCHACH_RUNDE.teamVon(runde, person.id);

        for (const farbe of ["weiss", "schwarz"]) {
            const karte = TEAM_SCHACH._element("section",
                "karte team-karte" + (meinTeam === farbe ? " team-karte-meine" : ""));

            const kopf = TEAM_SCHACH._element("div", "karte-kopf");
            kopf.appendChild(TEAM_SCHACH._element("h3", "",
                (farbe === "weiss") ? "Weiss" : "Schwarz"));

            if (runde.bereit[farbe]) {
                kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-fertig", "bereit"));
            }
            karte.appendChild(kopf);

            /* Namen der Mitspieler — aufgelöst über die Runde des Würfel-Quizz,
               weil dort die Namen stehen. */
            const namen = runde.teams[farbe].map((id) => TEAM_SCHACH._nameVon(id));
            karte.appendChild(TEAM_SCHACH._element("p", "team-namen",
                namen.length > 0 ? namen.join(", ") : "noch niemand"));

            const leiste = TEAM_SCHACH._element("div", "karte-fuss");

            if (meinTeam === farbe) {
                leiste.appendChild(TEAM_SCHACH._knopf("Team verlassen", "knopf-still knopf-klein",
                    () => TEAM_SCHACH.teamVerlassen()));

                if (!runde.laeuft && !runde.ergebnis) {
                    leiste.appendChild(TEAM_SCHACH._knopf(
                        runde.bereit[farbe] ? "Doch nicht bereit" : "Bereit",
                        runde.bereit[farbe] ? "knopf-still knopf-klein" : "knopf-haupt",
                        () => TEAM_SCHACH.bereitUmschalten(farbe, !runde.bereit[farbe])
                    ));
                }
            } else {
                leiste.appendChild(TEAM_SCHACH._knopf("Mitspielen", "knopf-still knopf-klein",
                    () => TEAM_SCHACH.teamBeitreten(farbe)));
            }

            karte.appendChild(leiste);
            bereich.appendChild(karte);
        }

        return bereich;
    },

    /* Name eines Spielers aus dem Würfel-Quizz; Kennung als Rückfall. */
    _nameVon(spielerId) {
        const quizzDaten = (WUERFEL_QUIZZ.abgleich && WUERFEL_QUIZZ.abgleich.daten)
            ? WUERFEL_QUIZZ.abgleich.daten
            : null;

        if (quizzDaten) {
            const spieler = MODELL.spielerFinden(quizzDaten, spielerId);
            if (spieler) {
                return spieler.name;
            }
        }
        return "Unbekannt";
    },

    /* ---------------------------------------------------------------- *
     * Brett
     * ---------------------------------------------------------------- */

    _brettBauen(runde, person) {
        const halter = TEAM_SCHACH._element("div", "brett-halter");

        const meinTeam = SCHACH_RUNDE.teamVon(runde, person.id);
        /* Schwarze Teams sehen das Brett gedreht — jeder blickt von seiner
           Seite darauf, wie am echten Tisch. */
        const gedreht = (meinTeam === "schwarz");

        const brett = TEAM_SCHACH._element("div", "brett" + (gedreht ? " brett-gedreht" : ""));
        const darfZiehen = SCHACH_RUNDE.darfZiehen(runde, person.id);

        for (let anzeige = 0; anzeige < 64; anzeige++) {
            const feld = gedreht ? (63 - anzeige) : anzeige;

            const zelle = document.createElement("button");
            zelle.type = "button";
            zelle.className = "feld " + (((SCHACH.reiheVon(feld) + SCHACH.spalteVon(feld)) % 2 === 0)
                ? "feld-hell" : "feld-dunkel");
            zelle.dataset.feld = String(feld);
            zelle.setAttribute("aria-label", SCHACH.feldName(feld));

            const figur = SCHACH.figurAuf(runde.stand, feld);
            if (figur !== ".") {
                const zeichen = TEAM_SCHACH._element("span",
                    "figur " + (SCHACH.farbeVon(figur) === "weiss" ? "figur-weiss" : "figur-schwarz"),
                    TEAM_SCHACH._figurZeichen(figur));
                zelle.appendChild(zeichen);
            }

            if (feld === TEAM_SCHACH.gewaehltesFeld) {
                zelle.classList.add("feld-gewaehlt");
            }
            if (TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
                zelle.classList.add(figur === "." ? "feld-ziel" : "feld-schlag");
            }

            /* Königsfeld hervorheben, wenn es im Schach steht. */
            if (runde.laeuft && SCHACH.artVon(figur) === "K"
                && SCHACH.farbeVon(figur) === runde.stand.amZug
                && SCHACH.imSchach(runde.stand, runde.stand.amZug)) {
                zelle.classList.add("feld-schach");
            }

            zelle.disabled = !darfZiehen;
            zelle.addEventListener("click", () => TEAM_SCHACH.feldAngetippt(runde, person, feld));

            brett.appendChild(zelle);
        }

        halter.appendChild(brett);

        if (!runde.laeuft && !runde.ergebnis) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Die Partie beginnt, sobald in beiden Teams jemand steht und beide "
                + "Seiten bereit gedrückt haben."));
        } else if (runde.laeuft && !darfZiehen) {
            const meinTeam = SCHACH_RUNDE.teamVon(runde, person.id);
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                meinTeam
                    ? "Warte, bis dein Team wieder am Zug ist."
                    : "Tritt einem Team bei, um mitzuspielen."));
        } else if (darfZiehen) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Figur antippen, dann ein Feld mit Punkt. Wer aus deinem Team "
                + "zuerst zieht, hat gezogen."));
        }

        return halter;
    },

    /*
     * Die Figuren sind Schriftzeichen aus dem Unicode-Schachblock, keine
     * Emojis. Das angehängte Zeichen erzwingt die Text-Darstellung, damit kein
     * Gerät sie doch bunt als Emoji zeichnet.
     */
    _figurZeichen(figur) {
        const zeichen = {
            "K": "♔", "D": "♕", "T": "♖",
            "L": "♗", "S": "♘", "B": "♙",
            "k": "♚", "d": "♛", "t": "♜",
            "l": "♝", "s": "♞", "b": "♟"
        };
        return (zeichen[figur] || "") + "︎";
    },

    /* ---------------------------------------------------------------- *
     * Verlauf
     * ---------------------------------------------------------------- */

    _verlaufBauen(runde) {
        const karte = TEAM_SCHACH._element("section", "karte");
        karte.appendChild(TEAM_SCHACH._element("h3", "", "Züge"));

        if (runde.verlauf.length === 0) {
            karte.appendChild(TEAM_SCHACH._element("p", "erklaerung", "Noch kein Zug."));
            return karte;
        }

        const liste = TEAM_SCHACH._element("div", "zug-liste");

        /* Neueste zuerst — auf dem Handy sieht man so das Wichtigste. */
        for (let i = runde.verlauf.length - 1; i >= 0; i--) {
            const eintrag = runde.verlauf[i];
            const zeile = TEAM_SCHACH._element("div", "zug-zeile");

            zeile.appendChild(TEAM_SCHACH._element(
                "span",
                "zug-farbe " + (eintrag.farbe === "weiss" ? "zug-weiss" : "zug-schwarz"),
                (eintrag.farbe === "weiss") ? "Weiss" : "Schwarz"
            ));
            zeile.appendChild(TEAM_SCHACH._element("span", "zug-text", eintrag.text));
            if (eintrag.wer) {
                zeile.appendChild(TEAM_SCHACH._element("span", "zug-wer", eintrag.wer));
            }

            liste.appendChild(zeile);
        }

        karte.appendChild(liste);
        return karte;
    },

    _fussleisteBauen(runde, person) {
        const leiste = TEAM_SCHACH._element("div", "fussleiste");
        const meinTeam = SCHACH_RUNDE.teamVon(runde, person.id);

        if (runde.ergebnis) {
            leiste.appendChild(TEAM_SCHACH._knopf("Neue Partie", "knopf-haupt",
                () => TEAM_SCHACH.neuePartie()));
        } else if (runde.laeuft && meinTeam) {
            leiste.appendChild(TEAM_SCHACH._knopf("Aufgeben", "knopf-gefahr knopf-klein",
                () => TEAM_SCHACH.aufgeben(meinTeam)));
        }

        if (!runde.ergebnis) {
            leiste.appendChild(TEAM_SCHACH._knopf("Partie zurücksetzen", "knopf-still knopf-klein",
                () => TEAM_SCHACH.neuePartie()));
        }

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Bedienung
     * ---------------------------------------------------------------- */

    feldAngetippt(runde, person, feld) {
        if (!SCHACH_RUNDE.darfZiehen(runde, person.id)) {
            return;
        }

        /* Zweiter Tipp auf ein mögliches Ziel: ziehen. */
        if (TEAM_SCHACH.gewaehltesFeld !== -1
            && TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
            TEAM_SCHACH.zugAusfuehren(TEAM_SCHACH.gewaehltesFeld, feld);
            return;
        }

        const figur = SCHACH.figurAuf(runde.stand, feld);

        /* Eigene Figur antippen: auswählen (oder Auswahl aufheben). */
        if (SCHACH.farbeVon(figur) === runde.stand.amZug) {
            if (TEAM_SCHACH.gewaehltesFeld === feld) {
                TEAM_SCHACH._auswahlAufheben();
            } else {
                TEAM_SCHACH.gewaehltesFeld = feld;
                TEAM_SCHACH.moeglicheZiele = SCHACH.zuege(runde.stand, feld)
                    .map((zug) => zug.nach)
                    .filter((ziel, stelle, alle) => alle.indexOf(ziel) === stelle);
            }
        } else {
            TEAM_SCHACH._auswahlAufheben();
        }

        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    _auswahlAufheben() {
        TEAM_SCHACH.gewaehltesFeld = -1;
        TEAM_SCHACH.moeglicheZiele = [];
    },

    /*
     * Führt den Zug aus und schreibt ihn sofort.
     *
     * Vor dem Schreiben wird der Stand vom Server geholt und der Zugzähler
     * verglichen: Hat in der Zwischenzeit jemand aus dem eigenen Team gezogen,
     * gilt dessen Zug — wer zuerst drückt, hat gezogen. Der eigene Zug wird
     * dann verworfen, statt den fremden zu überschreiben.
     */
    async zugAusfuehren(von, nach) {
        if (TEAM_SCHACH.ziehtGerade) {
            return;
        }
        TEAM_SCHACH.ziehtGerade = true;

        try {
            const person = TEAM_SCHACH._ich();
            const runde = TEAM_SCHACH.abgleich.daten;

            /* Umwandlung: nur bei einem Bauern auf die letzte Reihe fragen. */
            let umwandlung = "D";
            const figur = SCHACH.figurAuf(runde.stand, von);
            const letzteReihe = (runde.stand.amZug === "weiss") ? 0 : 7;

            if (SCHACH.artVon(figur) === "B" && SCHACH.reiheVon(nach) === letzteReihe) {
                const wahl = await DIALOG.liste(
                    "Bauer wandelt um",
                    "In welche Figur soll der Bauer umgewandelt werden?",
                    [
                        { beschriftung: "Dame", hinweis: "die übliche Wahl", wert: "D" },
                        { beschriftung: "Turm", hinweis: "", wert: "T" },
                        { beschriftung: "Läufer", hinweis: "", wert: "L" },
                        { beschriftung: "Springer", hinweis: "manchmal stärker", wert: "S" }
                    ],
                    "Abbrechen"
                );
                if (!wahl) {
                    TEAM_SCHACH._auswahlAufheben();
                    TEAM_SCHACH.zeichnen(runde);
                    return;
                }
                umwandlung = wahl;
            }

            const neu = SCHACH_RUNDE.ziehen(
                runde, person.id, von, nach, umwandlung, person.name
            );

            if (!neu) {
                TEAM_SCHACH._auswahlAufheben();
                TEAM_SCHACH.zeichnen(runde);
                return;
            }

            TEAM_SCHACH._auswahlAufheben();
            await TEAM_SCHACH._sendenMitPruefung(neu, runde.zugZaehler);
        } finally {
            TEAM_SCHACH.ziehtGerade = false;
        }
    },

    /*
     * Schreibt die Runde, aber nur wenn der Zugzähler auf dem Server noch der
     * erwartete ist. So gewinnt bei zwei gleichzeitigen Zügen der erste.
     */
    async _sendenMitPruefung(neueRunde, erwarteterZaehler) {
        const abgleich = TEAM_SCHACH.abgleich;

        try {
            if (abgleich.speicher.art === "gemeinsam") {
                const fremd = SCHACH_RUNDE.normalisieren(await abgleich.speicher.laden());

                if (fremd.zugZaehler !== erwarteterZaehler) {
                    abgleich.daten = fremd;
                    TEAM_SCHACH.zeichnen(fremd);
                    await DIALOG.hinweis(
                        "Jemand war schneller",
                        "Aus deinem Team hat gerade schon jemand gezogen. Dein Zug "
                            + "wurde deshalb nicht ausgeführt."
                    );
                    return;
                }
            }

            await abgleich.speicher.speichern(neueRunde);
            abgleich.daten = neueRunde;
            TEAM_SCHACH.zeichnen(neueRunde);
        } catch (fehler) {
            await DIALOG.hinweis("Zug nicht gespeichert",
                "Der Zug konnte nicht gesendet werden: " + fehler.message);
        }
    },

    /* ---------------------------------------------------------------- *
     * Aktionen rund um die Partie
     * ---------------------------------------------------------------- */

    async teamBeitreten(farbe) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }
        TEAM_SCHACH._auswahlAufheben();
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.teamBeitreten(TEAM_SCHACH.abgleich.daten, person.id, farbe),
            TEAM_SCHACH.abgleich.daten.zugZaehler
        );
    },

    async teamVerlassen() {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }
        TEAM_SCHACH._auswahlAufheben();
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.teamVerlassen(TEAM_SCHACH.abgleich.daten, person.id),
            TEAM_SCHACH.abgleich.daten.zugZaehler
        );
    },

    async bereitUmschalten(farbe, bereit) {
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.bereitSetzen(TEAM_SCHACH.abgleich.daten, farbe, bereit),
            TEAM_SCHACH.abgleich.daten.zugZaehler
        );
    },

    async aufgeben(farbe) {
        const ja = await DIALOG.frage(
            "Aufgeben?",
            "Die Partie ist damit vorbei und die andere Seite gewinnt.",
            "Aufgeben",
            true
        );
        if (!ja) {
            return;
        }
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.aufgeben(TEAM_SCHACH.abgleich.daten, farbe),
            TEAM_SCHACH.abgleich.daten.zugZaehler
        );
    },

    async neuePartie() {
        const ja = await DIALOG.frage(
            "Neue Partie?",
            "Das Brett wird zurückgesetzt. Die Teams bleiben, beide Seiten müssen "
                + "erneut bereit drücken.",
            "Neue Partie",
            true
        );
        if (!ja) {
            return;
        }
        TEAM_SCHACH._auswahlAufheben();
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.neuePartie(TEAM_SCHACH.abgleich.daten),
            TEAM_SCHACH.abgleich.daten.zugZaehler
        );
    },

    /* ---------------------------------------------------------------- *
     * Bausteine
     * ---------------------------------------------------------------- */

    _element(tag, klasse, text) {
        const element = document.createElement(tag);
        if (klasse) {
            element.className = klasse;
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    },

    _knopf(beschriftung, klasse, beiKlick) {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "knopf " + klasse;
        knopf.textContent = beschriftung;
        knopf.addEventListener("click", beiKlick);
        return knopf;
    }
};
