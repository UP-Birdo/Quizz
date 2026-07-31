/*
 * wuerfel-quizz.js — der Tab "Würfel Quizz": das Spiel auf dem Bildschirm.
 *
 * Ablauf einer Runde:
 *
 *   1. Anmelden — beim ersten Besuch fragt die Seite nach dem Namen und legt
 *      dafür einen Spieler an. Der Name bleibt auf dem Gerät gespeichert.
 *   2. Festlegen — jeder trägt seine fünf gewürfelten Werte ein. Sie bleiben
 *      auf dem eigenen Gerät; veröffentlicht wird nur ein Siegel
 *      (siehe versiegelung.js).
 *   3. Raten — für jeden Mitspieler eine Vermutung eintragen. Die Vermutungen
 *      sieht niemand außer dem Rater selbst.
 *   4. Aufdecken — JEDER für sich, wann er will. Der eigene Knopf gibt nur die
 *      eigenen Würfel frei; die App prüft sie gegen das Siegel. Ab dem Moment
 *      kann niemand mehr auf diese Person tippen (die Sperre steckt in
 *      modell.js), und die Treffer stehen fest.
 *
 * Es gibt bewusst KEINE gemeinsame Auflösung mehr: Wer fertig ist, deckt auf,
 * die anderen raten weiter.
 *
 * Diese Datei kennt nur den Bildschirm. Was gültig ist und wie gezählt wird,
 * steht ausschließlich in modell.js.
 */

const WUERFEL_QUIZZ = {

    id: "wuerfel-quizz",
    titel: "Würfel Quizz",

    /* Wird von app.js gesetzt. */
    abgleich: null,

    /* Kennung des eigenen Spielers (erst nach dem Anmelden gesetzt). */
    ichId: null,

    /* Wurzel des Tab-Inhalts; wird bei jeder Änderung neu gefüllt. */
    wurzelEl: null,

    /*
     * Sind die eigenen Würfelzahlen zu sehen?
     *
     * Standard ist NEIN: Wer die Seite öffnet, während jemand über die Schulter
     * schaut, verrät nichts. Sichtbar wird sie nur, solange man das Auge
     * antippt — beim nächsten Laden ist wieder alles verdeckt. Der Zustand wird
     * deshalb absichtlich nirgends gespeichert.
     */
    wuerfelSichtbar: false,

    verbinden(abgleich) {
        WUERFEL_QUIZZ.abgleich = abgleich;
    },

    aufbauen(behaelter) {
        WUERFEL_QUIZZ.wurzelEl = document.createElement("div");
        WUERFEL_QUIZZ.wurzelEl.className = "spiel";
        behaelter.appendChild(WUERFEL_QUIZZ.wurzelEl);
    },

    /* ---------------------------------------------------------------- *
     * Anmelden
     * ---------------------------------------------------------------- */

    /*
     * Sorgt dafür, dass es zu diesem Gerät einen Spieler gibt. Wird von app.js
     * einmal nach dem ersten Laden aufgerufen.
     */
    async anmelden() {
        const abgleich = WUERFEL_QUIZZ.abgleich;
        const person = ICH.person();

        /* Bekanntes Gerät und der Spieler existiert noch: fertig. */
        if (person) {
            const bekannt = MODELL.spielerFinden(abgleich.daten, person.id);
            if (bekannt) {
                WUERFEL_QUIZZ.ichId = bekannt.id;
                if (bekannt.name !== person.name) {
                    ICH.personSetzen(bekannt.id, bekannt.name);
                }
                WUERFEL_QUIZZ.zeichnen(abgleich.daten);
                return;
            }
        }

        let name = "";
        while (!name) {
            name = await DIALOG.eingabe(
                "Wer bist du?",
                "Trag deinen Namen ein. Die anderen sehen ihn in der Runde, "
                    + "und dein Gerät merkt ihn sich.",
                person ? person.name : "",
                "Los geht es",
                false
            );
        }

        let spielerId = null;

        /* Gibt es den Namen schon, ist das meistens dieselbe Person auf einem
           anderen Gerät — nachfragen, statt jemanden zu übernehmen. */
        const vorhanden = MODELL.spielerNachName(abgleich.daten, name);
        if (vorhanden) {
            const binIch = await DIALOG.frage(
                "Name ist schon dabei",
                name + " spielt bereits mit. Bist du das, zum Beispiel von einem "
                    + "anderen Gerät aus? Wenn nicht, nimm bitte einen anderen Namen.",
                "Ja, das bin ich"
            );
            if (binIch) {
                spielerId = vorhanden.id;
            } else {
                /* Anderer Name: Frage von vorn. */
                ICH.personVergessen();
                await WUERFEL_QUIZZ.anmelden();
                return;
            }
        }

        if (!spielerId) {
            spielerId = MODELL.idErzeugen();
            abgleich.aendern(
                MODELL.spielerHinzufuegen(abgleich.daten, name, spielerId),
                true
            );
        }

        WUERFEL_QUIZZ.ichId = spielerId;
        ICH.personSetzen(spielerId, name);
        WUERFEL_QUIZZ.zeichnen(abgleich.daten);
    },

    /* ---------------------------------------------------------------- *
     * Zeichnen
     * ---------------------------------------------------------------- */

    zeichnen(daten) {
        const wurzel = WUERFEL_QUIZZ.wurzelEl;
        if (!wurzel) {
            return;
        }

        /* Solange der Name nicht feststeht, bleibt der Bereich leer — der
           Anmelde-Dialog liegt darüber. */
        if (!WUERFEL_QUIZZ.ichId) {
            wurzel.innerHTML = "";
            return;
        }

        const merker = WUERFEL_QUIZZ._fokusMerken();
        wurzel.innerHTML = "";

        const ich = MODELL.spielerFinden(daten, WUERFEL_QUIZZ.ichId);
        if (!ich) {
            /* Der eigene Spieler wurde entfernt (z. B. weil jemand die Runde
               neu gestartet hat). Neu anmelden. */
            WUERFEL_QUIZZ.ichId = null;
            ICH.personVergessen();
            WUERFEL_QUIZZ.anmelden();
            return;
        }

        wurzel.appendChild(WUERFEL_QUIZZ._standLeisteBauen(daten));
        wurzel.appendChild(WUERFEL_QUIZZ._ichKarteBauen(daten, ich));
        wurzel.appendChild(WUERFEL_QUIZZ._mitspielerBauen(daten, ich));

        if (daten.spieler.some((spieler) => spieler.aufgedeckt)) {
            wurzel.appendChild(WUERFEL_QUIZZ._bestenlisteBauen(daten));
        }

        wurzel.appendChild(WUERFEL_QUIZZ._fussleisteBauen(ich));

        WUERFEL_QUIZZ._fokusWiederherstellen(merker);
    },

    /* ---------------------------------------------------------------- *
     * Kopfbereich: wie weit ist die Runde
     * ---------------------------------------------------------------- */

    _standLeisteBauen(daten) {
        const leiste = WUERFEL_QUIZZ._element("div", "phasen-leiste");

        const festgelegt = daten.spieler.filter((spieler) => spieler.pruefwert !== "").length;
        const aufgedeckt = daten.spieler.filter((spieler) => spieler.aufgedeckt).length;

        leiste.appendChild(WUERFEL_QUIZZ._element("span", "chip chip-laeuft",
            daten.spieler.length + " in der Runde"));
        leiste.appendChild(WUERFEL_QUIZZ._element("span", "phasen-text",
            festgelegt + " festgelegt, " + aufgedeckt + " aufgedeckt"));

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Eigene Karte
     * ---------------------------------------------------------------- */

    _ichKarteBauen(daten, ich) {
        const karte = WUERFEL_QUIZZ._element("section", "karte karte-ich");

        /* Kopf: Name, Auge, Umbenennen. */
        const kopf = WUERFEL_QUIZZ._element("div", "karte-kopf");
        kopf.appendChild(WUERFEL_QUIZZ._element("h2", "", "Du spielst als " + ich.name));

        if (!ich.aufgedeckt) {
            kopf.appendChild(WUERFEL_QUIZZ._augeKnopfBauen());
        }
        kopf.appendChild(WUERFEL_QUIZZ._knopf("Name ändern", "knopf-still knopf-klein",
            () => WUERFEL_QUIZZ.namenAendern(ich)));

        karte.appendChild(kopf);

        if (ich.aufgedeckt) {
            return WUERFEL_QUIZZ._ichKarteAufgedeckt(karte, ich);
        }

        const wurf = ICH.wurf(ich.id);
        const festgelegt = ich.pruefwert !== "" && wurf !== null;

        return festgelegt
            ? WUERFEL_QUIZZ._ichKarteFestgelegt(karte, ich, wurf)
            : WUERFEL_QUIZZ._ichKarteEingabe(karte, ich, wurf);
    },

    /* Zustand 1: noch nicht festgelegt — Würfel eintragen. */
    _ichKarteEingabe(karte, ich, wurf) {
        karte.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung",
            "Trag hier ein, was du gewürfelt hast. Deine Würfel bleiben auf "
            + "diesem Gerät — die anderen sehen nur, DASS du festgelegt hast."));

        /* Festgelegt, aber der Wurf liegt woanders: Gerätewechsel. */
        if (ich.pruefwert !== "" && !wurf) {
            karte.appendChild(WUERFEL_QUIZZ._element("p", "meldung meldung-warnung",
                "Du hast schon festgelegt, aber dieser Wurf liegt auf einem anderen "
                + "Gerät. Öffne die Seite dort — oder trag hier neu ein; das wird "
                + "dann für alle als erneute Festlegung sichtbar."));
        }

        const werte = wurf ? wurf.wuerfel : MODELL.leereWuerfel();

        if (!WUERFEL_QUIZZ.wuerfelSichtbar) {
            karte.appendChild(WUERFEL_QUIZZ._verdecktBauen(
                "Zum Eintragen das Auge oben antippen."));
        } else {
            karte.appendChild(WUERFEL_QUIZZ._wuerfelZeileBauen(
                werte,
                "meinwurf",
                (spalte, wert) => WUERFEL_QUIZZ.meinenWuerfelSetzen(ich, spalte, wert)
            ));
        }

        const knopf = WUERFEL_QUIZZ._knopf("Würfel festlegen", "knopf-haupt",
            () => WUERFEL_QUIZZ.festlegen(ich));
        knopf.disabled = !MODELL.wuerfelVollstaendig(werte);
        if (knopf.disabled) {
            knopf.title = "Erst alle fünf Würfel eintragen";
        }

        const leiste = WUERFEL_QUIZZ._element("div", "karte-fuss");
        leiste.appendChild(knopf);
        karte.appendChild(leiste);

        return karte;
    },

    /* Zustand 2: festgelegt, noch nicht aufgedeckt. */
    _ichKarteFestgelegt(karte, ich, wurf) {
        if (WUERFEL_QUIZZ.wuerfelSichtbar) {
            karte.appendChild(WUERFEL_QUIZZ._wuerfelAnzeigeBauen(wurf.wuerfel, "wuerfel-eigen"));
        } else {
            karte.appendChild(WUERFEL_QUIZZ._verdecktBauen(
                "Deine Würfel sind verdeckt. Auge antippen, um sie zu sehen."));
        }

        karte.appendChild(WUERFEL_QUIZZ._element("p", "meldung meldung-gut",
            "Festgelegt um " + WUERFEL_QUIZZ._uhrzeit(ich.festgelegtAm)
            + (ich.festlegungen > 1 ? " (bereits " + ich.festlegungen + " Mal geändert)" : "")
            + ". Nur du siehst diese Würfel."));

        if (!ich.pruefwert) {
            karte.appendChild(WUERFEL_QUIZZ._element("p", "meldung meldung-warnung",
                "Ohne Siegel festgelegt — dieser Browser stellt die dafür nötige "
                + "Funktion nicht bereit."));
        }

        const leiste = WUERFEL_QUIZZ._element("div", "karte-fuss");
        leiste.appendChild(WUERFEL_QUIZZ._knopf("Würfel ändern", "knopf-still knopf-klein",
            () => WUERFEL_QUIZZ.festlegungLoesen(ich)));
        leiste.appendChild(WUERFEL_QUIZZ._knopf("Meine Würfel aufdecken", "knopf-haupt",
            () => WUERFEL_QUIZZ.selbstAufdecken(ich)));
        karte.appendChild(leiste);

        return karte;
    },

    /* Zustand 3: aufgedeckt — jetzt sehen alle den Wurf. */
    _ichKarteAufgedeckt(karte, ich) {
        karte.appendChild(WUERFEL_QUIZZ._wuerfelAnzeigeBauen(ich.wuerfel, "wuerfel-echt"));
        karte.appendChild(WUERFEL_QUIZZ._siegelMeldungBauen(ich));
        karte.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung",
            "Aufgedeckt. Auf dich kann jetzt niemand mehr tippen; wie gut die "
            + "anderen dich eingeschätzt haben, steht unten."));
        return karte;
    },

    /* Der Augen-Knopf. Kein Emoji, sondern eine gezeichnete Form. */
    _augeKnopfBauen() {
        const sichtbar = WUERFEL_QUIZZ.wuerfelSichtbar;

        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "auge-knopf" + (sichtbar ? " auge-knopf-offen" : "");
        knopf.setAttribute("aria-pressed", sichtbar ? "false" : "true");
        knopf.setAttribute("aria-label", sichtbar
            ? "Eigene Würfel verstecken"
            : "Eigene Würfel anzeigen");
        knopf.title = sichtbar ? "Würfel verstecken" : "Würfel anzeigen";
        knopf.appendChild(WUERFEL_QUIZZ._augeSymbolBauen(sichtbar));
        knopf.addEventListener("click", () => {
            WUERFEL_QUIZZ.wuerfelSichtbar = !WUERFEL_QUIZZ.wuerfelSichtbar;
            WUERFEL_QUIZZ.zeichnen(WUERFEL_QUIZZ.abgleich.daten);
        });

        return knopf;
    },

    _augeSymbolBauen(offen) {
        const NS = "http://www.w3.org/2000/svg";

        const bild = document.createElementNS(NS, "svg");
        bild.setAttribute("viewBox", "0 0 24 24");
        bild.setAttribute("width", "22");
        bild.setAttribute("height", "22");
        bild.setAttribute("fill", "none");
        bild.setAttribute("stroke", "currentColor");
        bild.setAttribute("stroke-width", "1.7");
        bild.setAttribute("stroke-linecap", "round");
        bild.setAttribute("stroke-linejoin", "round");
        bild.setAttribute("aria-hidden", "true");

        /* Die Lidform — bei geschlossenem Auge flacher gezeichnet. */
        const lid = document.createElementNS(NS, "path");
        lid.setAttribute("d", offen
            ? "M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12Z"
            : "M2 12.5s3.8-5 10-5 10 5 10 5");
        bild.appendChild(lid);

        if (offen) {
            const pupille = document.createElementNS(NS, "circle");
            pupille.setAttribute("cx", "12");
            pupille.setAttribute("cy", "12");
            pupille.setAttribute("r", "3");
            bild.appendChild(pupille);
        } else {
            /* Wimpern statt Pupille: das Auge ist zu. */
            for (const strich of [["4.5", "15", "3", "17"], ["12", "17.5", "12", "20"],
                ["19.5", "15", "21", "17"]]) {
                const linie = document.createElementNS(NS, "line");
                linie.setAttribute("x1", strich[0]);
                linie.setAttribute("y1", strich[1]);
                linie.setAttribute("x2", strich[2]);
                linie.setAttribute("y2", strich[3]);
                bild.appendChild(linie);
            }
        }

        return bild;
    },

    /* Fünf Platzhalter statt der echten Zahlen. */
    _verdecktBauen(hinweis) {
        const bereich = WUERFEL_QUIZZ._element("div", "verdeckt");

        const reihe = WUERFEL_QUIZZ._element("div", "wuerfel-anzeige");
        for (let i = 0; i < MODELL.WUERFEL_ANZAHL; i++) {
            reihe.appendChild(WUERFEL_QUIZZ._element("span", "wuerfel-marke wuerfel-marke-verdeckt", "?"));
        }
        bereich.appendChild(reihe);

        bereich.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung verdeckt-hinweis", hinweis));

        return bereich;
    },

    _siegelMeldungBauen(spieler) {
        if (spieler.bestaetigt) {
            return WUERFEL_QUIZZ._element("p", "meldung meldung-gut",
                "Siegel geprüft: Diese Würfel sind genau die, die vorher "
                + "festgelegt wurden.");
        }
        if (spieler.pruefwert) {
            return WUERFEL_QUIZZ._element("p", "meldung meldung-fehler",
                "Siegel passt nicht: Diese Würfel sind nicht die, die vorher "
                + "festgelegt wurden.");
        }
        return WUERFEL_QUIZZ._element("p", "meldung meldung-warnung",
            "Ohne Siegel aufgedeckt — nicht überprüfbar.");
    },

    /* ---------------------------------------------------------------- *
     * Die anderen: raten oder Ergebnis
     * ---------------------------------------------------------------- */

    _mitspielerBauen(daten, ich) {
        const bereich = WUERFEL_QUIZZ._element("section", "bereich");
        bereich.appendChild(WUERFEL_QUIZZ._element("h2", "bereich-titel", "Die anderen"));

        const andere = daten.spieler.filter((spieler) => spieler.id !== ich.id);

        if (andere.length === 0) {
            bereich.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung",
                "Noch niemand sonst in der Runde. Gib die Adresse dieser Seite weiter — "
                + "wer sie öffnet, trägt seinen Namen ein und ist dabei."));
            return bereich;
        }

        bereich.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung",
            "Was hat die Person gewürfelt? Die Reihenfolge ist egal. Deine "
            + "Vermutung sieht niemand außer dir — bis die Person aufdeckt."));

        for (const ziel of andere) {
            bereich.appendChild(ziel.aufgedeckt
                ? WUERFEL_QUIZZ._ergebnisKarteBauen(daten, ich, ziel)
                : WUERFEL_QUIZZ._tippKarteBauen(daten, ich, ziel));
        }

        return bereich;
    },

    /* Noch verdeckt: hier wird getippt. */
    _tippKarteBauen(daten, ich, ziel) {
        const karte = WUERFEL_QUIZZ._element("section", "karte");

        const kopf = WUERFEL_QUIZZ._element("div", "karte-kopf");
        kopf.appendChild(WUERFEL_QUIZZ._element("h3", "", ziel.name));

        const festgelegt = ziel.pruefwert !== "";
        kopf.appendChild(WUERFEL_QUIZZ._element(
            "span",
            "chip " + (festgelegt ? "chip-fertig" : "chip-offen"),
            festgelegt ? "hat festgelegt" : "wartet noch"
        ));
        karte.appendChild(kopf);

        if (festgelegt && ziel.festlegungen > 1) {
            karte.appendChild(WUERFEL_QUIZZ._element("p", "meldung meldung-warnung",
                "Wurf wurde " + ziel.festlegungen + " Mal festgelegt, zuletzt um "
                + WUERFEL_QUIZZ._uhrzeit(ziel.festgelegtAm) + "."));
        }

        const tipp = MODELL.tippLesen(daten, ich.id, ziel.id);
        karte.appendChild(WUERFEL_QUIZZ._wuerfelZeileBauen(
            tipp,
            "tipp-" + ziel.id,
            (spalte, wert) => WUERFEL_QUIZZ.tippSetzen(ziel.id, spalte, wert)
        ));

        return karte;
    },

    /* Aufgedeckt: echte Würfel, alle Tipps, Treffer. */
    _ergebnisKarteBauen(daten, ich, ziel) {
        const karte = WUERFEL_QUIZZ._element("section", "karte karte-aufgedeckt");

        const kopf = WUERFEL_QUIZZ._element("div", "karte-kopf");
        kopf.appendChild(WUERFEL_QUIZZ._element("h3", "", ziel.name));

        if (ziel.bestaetigt) {
            kopf.appendChild(WUERFEL_QUIZZ._element("span", "chip chip-fertig", "Siegel geprüft"));
        } else if (ziel.pruefwert) {
            kopf.appendChild(WUERFEL_QUIZZ._element("span", "chip chip-fehler", "Siegel passt nicht"));
        } else {
            kopf.appendChild(WUERFEL_QUIZZ._element("span", "chip chip-offen", "ohne Siegel"));
        }
        karte.appendChild(kopf);

        karte.appendChild(WUERFEL_QUIZZ._wuerfelAnzeigeBauen(ziel.wuerfel, "wuerfel-echt"));

        if (!ziel.bestaetigt && ziel.pruefwert) {
            karte.appendChild(WUERFEL_QUIZZ._element("p", "meldung meldung-fehler",
                "Diese Würfel passen nicht zu dem, was vorher festgelegt wurde."));
        }

        /* Wer hat was auf diese Person getippt? */
        const rater = daten.spieler.filter((spieler) => spieler.id !== ziel.id);
        if (rater.length > 0) {
            const liste = WUERFEL_QUIZZ._element("div", "tipp-liste");

            for (const person of rater) {
                const zeile = WUERFEL_QUIZZ._element("div", "tipp-zeile");
                zeile.appendChild(WUERFEL_QUIZZ._element(
                    "span", "tipp-name",
                    (person.id === ich.id ? "Du" : person.name) + " tippte"
                ));

                const tipp = MODELL.wuerfelNormalisieren(person.tipps[ziel.id]);
                zeile.appendChild(WUERFEL_QUIZZ._wuerfelAnzeigeBauen(tipp, "wuerfel-tipp"));

                const treffer = MODELL.treffer(ziel.wuerfel, tipp);
                zeile.appendChild(WUERFEL_QUIZZ._element(
                    "span",
                    "treffer " + (treffer > 0 ? "treffer-gut" : ""),
                    treffer + " von " + MODELL.WUERFEL_ANZAHL
                ));

                liste.appendChild(zeile);
            }

            karte.appendChild(liste);
        }

        return karte;
    },

    /* ---------------------------------------------------------------- *
     * Bestenliste
     * ---------------------------------------------------------------- */

    _bestenlisteBauen(daten) {
        const bereich = WUERFEL_QUIZZ._element("section", "karte karte-ergebnis");
        bereich.appendChild(WUERFEL_QUIZZ._element("h3", "", "Wer hat am besten geraten?"));

        const ergebnis = MODELL.ergebnis(daten);

        const tabelle = document.createElement("table");
        tabelle.className = "ergebnis-tabelle";

        const kopf = document.createElement("thead");
        const kopfzeile = document.createElement("tr");
        for (const titel of ["Platz", "Name", "Treffer"]) {
            const zelle = document.createElement("th");
            zelle.textContent = titel;
            kopfzeile.appendChild(zelle);
        }
        kopf.appendChild(kopfzeile);
        tabelle.appendChild(kopf);

        const koerper = document.createElement("tbody");
        let platz = 0;
        let letztePunkte = null;
        let gezaehlt = 0;

        for (const eintrag of ergebnis) {
            gezaehlt++;
            if (eintrag.punkte !== letztePunkte) {
                platz = gezaehlt;
                letztePunkte = eintrag.punkte;
            }

            const zeile = document.createElement("tr");
            if (eintrag.id === WUERFEL_QUIZZ.ichId) {
                zeile.className = "zeile-ich";
            }

            const platzZelle = document.createElement("td");
            platzZelle.textContent = platz + ".";
            zeile.appendChild(platzZelle);

            const nameZelle = document.createElement("td");
            nameZelle.textContent = eintrag.name;
            zeile.appendChild(nameZelle);

            const punkteZelle = document.createElement("td");
            punkteZelle.textContent = eintrag.punkte + " von " + eintrag.moeglich;
            zeile.appendChild(punkteZelle);

            koerper.appendChild(zeile);
        }
        tabelle.appendChild(koerper);

        bereich.appendChild(tabelle);
        bereich.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung",
            "Gezählt wird jeder Würfelwert, den du richtig geraten hast — die "
            + "Reihenfolge spielt keine Rolle. Mitgezählt wird nur, wer schon "
            + "aufgedeckt hat; die Liste wächst also mit."));

        return bereich;
    },

    /* ---------------------------------------------------------------- *
     * Fußleiste
     * ---------------------------------------------------------------- */

    _fussleisteBauen(ich) {
        const leiste = WUERFEL_QUIZZ._element("div", "fussleiste");

        /* Die Hauptaktion wandert mit dem Spielstand: Solange man noch nicht
           aufgedeckt hat, liegt sie in der eigenen Karte. Danach ist die neue
           Runde das Naheliegendste. */
        leiste.appendChild(WUERFEL_QUIZZ._knopf(
            "Neue Runde",
            ich.aufgedeckt ? "knopf-haupt" : "knopf-still",
            () => WUERFEL_QUIZZ.neueRunde()
        ));

        leiste.appendChild(WUERFEL_QUIZZ._knopf("Ich bin raus", "knopf-still knopf-klein",
            () => WUERFEL_QUIZZ.austreten()));

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Aktionen
     * ---------------------------------------------------------------- */

    /* Ein einzelner eigener Würfel — bleibt auf dem Gerät. */
    meinenWuerfelSetzen(ich, spalte, wert) {
        const wurf = ICH.wurf(ich.id);
        const wuerfel = wurf ? wurf.wuerfel : MODELL.leereWuerfel();
        wuerfel[spalte] = wert;
        ICH.wurfSetzen(ich.id, wuerfel, wurf ? wurf.salz : "");

        /* Neu zeichnen nur, wenn sich dadurch der Knopf-Zustand ändert. */
        if (MODELL.wuerfelVollstaendig(wuerfel)) {
            WUERFEL_QUIZZ.zeichnen(WUERFEL_QUIZZ.abgleich.daten);
        }
    },

    async festlegen(ich) {
        const wurf = ICH.wurf(ich.id);
        if (!wurf || !MODELL.wuerfelVollstaendig(wurf.wuerfel)) {
            await DIALOG.hinweis("Noch nicht vollständig",
                "Trag erst alle fünf Würfel ein.");
            return;
        }

        const salz = VERSIEGELUNG.verfuegbar() ? VERSIEGELUNG.salzErzeugen() : "";
        const pruefwert = await VERSIEGELUNG.pruefwertBilden(wurf.wuerfel, salz);

        ICH.wurfSetzen(ich.id, wurf.wuerfel, salz);
        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.pruefwertSetzen(WUERFEL_QUIZZ.abgleich.daten, ich.id, pruefwert),
            true
        );
    },

    async festlegungLoesen(ich) {
        const ja = await DIALOG.frage(
            "Würfel ändern?",
            "Für alle wird sichtbar, dass du deinen Wurf nachträglich geändert "
                + "hast — mit Uhrzeit. Das ist Absicht, damit niemand heimlich "
                + "nachbessert.",
            "Trotzdem ändern"
        );
        if (!ja) {
            return;
        }

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.pruefwertSetzen(WUERFEL_QUIZZ.abgleich.daten, ich.id, ""),
            true
        );
    },

    tippSetzen(zielId, spalte, wert) {
        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.tippSetzen(WUERFEL_QUIZZ.abgleich.daten, WUERFEL_QUIZZ.ichId, zielId, spalte, wert),
            false
        );
    },

    /*
     * Der eigene Aufdeck-Knopf: gibt NUR die eigenen Würfel frei. Die anderen
     * raten weiter, bis sie selbst aufdecken.
     */
    async selbstAufdecken(ich) {
        const wurf = ICH.wurf(ich.id);
        if (!wurf || !MODELL.wuerfelVollstaendig(wurf.wuerfel)) {
            await DIALOG.hinweis("Kein Wurf auf diesem Gerät",
                "Deine Würfel liegen nicht auf diesem Gerät. Öffne die Seite dort, "
                    + "wo du sie eingetragen hast.");
            return;
        }

        const ja = await DIALOG.frage(
            "Deine Würfel aufdecken?",
            "Danach sehen alle deinen Wurf, und niemand kann mehr auf dich tippen. "
                + "Das gilt nur für dich — die anderen decken selbst auf, wann sie wollen.",
            "Aufdecken"
        );
        if (!ja) {
            return;
        }

        const bestaetigt = await VERSIEGELUNG.pruefen(wurf.wuerfel, wurf.salz, ich.pruefwert);

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.aufdecken(WUERFEL_QUIZZ.abgleich.daten, ich.id, wurf.wuerfel, bestaetigt),
            true
        );
    },

    async neueRunde() {
        const ja = await DIALOG.frage(
            "Neue Runde starten?",
            "Alle Würfel und Vermutungen werden gelöscht, die Mitspieler bleiben. "
                + "Das gilt für alle.",
            "Neue Runde",
            true
        );
        if (!ja) {
            return;
        }

        /* Auch den eigenen Wurf auf diesem Gerät verwerfen. */
        ICH.wurfVergessen(WUERFEL_QUIZZ.ichId);
        WUERFEL_QUIZZ.wuerfelSichtbar = false;

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.neueRunde(WUERFEL_QUIZZ.abgleich.daten),
            true
        );
    },

    async namenAendern(ich) {
        const name = await DIALOG.eingabe(
            "Name ändern",
            "Unter welchem Namen sollen dich die anderen sehen?",
            ich.name,
            "Übernehmen",
            true
        );
        if (!name) {
            return;
        }

        ICH.personSetzen(ich.id, name);
        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.nameSetzen(WUERFEL_QUIZZ.abgleich.daten, ich.id, name),
            true
        );
    },

    async austreten() {
        const ja = await DIALOG.frage(
            "Aus der Runde austreten?",
            "Du wirst aus der Liste entfernt, mit deinen Würfeln und Vermutungen. "
                + "Du kannst dich jederzeit neu anmelden.",
            "Austreten",
            true
        );
        if (!ja) {
            return;
        }

        const id = WUERFEL_QUIZZ.ichId;
        ICH.wurfVergessen(id);
        ICH.personVergessen();
        WUERFEL_QUIZZ.ichId = null;
        WUERFEL_QUIZZ.wuerfelSichtbar = false;

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.spielerEntfernen(WUERFEL_QUIZZ.abgleich.daten, id),
            true
        );
        WUERFEL_QUIZZ.anmelden();
    },

    /* ---------------------------------------------------------------- *
     * Bausteine
     * ---------------------------------------------------------------- */

    /* Eine Reihe aus fünf Auswahlfeldern. `beiAenderung(spalte, wert)`. */
    _wuerfelZeileBauen(werte, schluessel, beiAenderung) {
        const reihe = WUERFEL_QUIZZ._element("div", "wuerfel-reihe");

        for (let spalte = 0; spalte < MODELL.WUERFEL_ANZAHL; spalte++) {
            const feld = WUERFEL_QUIZZ._element("label", "wuerfel-feld-halter");
            feld.appendChild(WUERFEL_QUIZZ._element("span", "wuerfel-nummer", "Würfel " + (spalte + 1)));

            const auswahl = document.createElement("select");
            auswahl.className = "wuerfel-feld";
            auswahl.dataset.schluessel = schluessel + "-" + spalte;

            const leer = document.createElement("option");
            leer.value = MODELL.WERT_LEER;
            leer.textContent = MODELL.wertBeschriftung(MODELL.WERT_LEER);
            auswahl.appendChild(leer);

            for (const wert of MODELL.WERTE) {
                const eintrag = document.createElement("option");
                eintrag.value = wert;
                eintrag.textContent = MODELL.wertBeschriftung(wert);
                auswahl.appendChild(eintrag);
            }

            auswahl.value = werte[spalte] || MODELL.WERT_LEER;
            auswahl.addEventListener("change", () => beiAenderung(spalte, auswahl.value));

            feld.appendChild(auswahl);
            reihe.appendChild(feld);
        }

        return reihe;
    },

    /* Fünf Würfelwerte als Marken, sortiert. */
    _wuerfelAnzeigeBauen(werte, zusatzKlasse) {
        const reihe = WUERFEL_QUIZZ._element("div", "wuerfel-anzeige " + (zusatzKlasse || ""));

        for (const wert of MODELL.wuerfelSortiert(werte)) {
            const marke = WUERFEL_QUIZZ._element(
                "span",
                "wuerfel-marke" + (wert === "STERN" ? " wuerfel-marke-stern" : "")
                    + (wert === MODELL.WERT_LEER ? " wuerfel-marke-leer" : ""),
                MODELL.wertBeschriftung(wert)
            );
            reihe.appendChild(marke);
        }

        return reihe;
    },

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
    },

    _uhrzeit(millisekunden) {
        if (!millisekunden) {
            return "unbekannt";
        }
        const zeitpunkt = new Date(millisekunden);
        const zweistellig = (zahl) => String(zahl).padStart(2, "0");
        return zweistellig(zeitpunkt.getHours()) + ":" + zweistellig(zeitpunkt.getMinutes());
    },

    /* ---------------------------------------------------------------- *
     * Fokus über das Neuzeichnen retten
     * ---------------------------------------------------------------- */

    _fokusMerken() {
        const aktiv = document.activeElement;
        if (!aktiv || !aktiv.dataset || !aktiv.dataset.schluessel) {
            return null;
        }
        return { schluessel: aktiv.dataset.schluessel };
    },

    _fokusWiederherstellen(merker) {
        if (!merker) {
            return;
        }
        const ziel = WUERFEL_QUIZZ.wurzelEl.querySelector(
            "[data-schluessel=\"" + merker.schluessel + "\"]"
        );
        if (ziel) {
            ziel.focus();
        }
    }
};
