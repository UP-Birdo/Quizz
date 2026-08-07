/*
 * team-schach-auswertung.js - was nach dem Zug und nach der Partie zu sehen ist.
 *
 * Teil des Bildschirms TEAM_SCHACH; der Einstieg steht in team-schach.js.
 * Diese Datei ERGAENZT dasselbe Objekt (siehe dort) und wird NACH ihm geladen.
 *
 * Hier drin: der Abschluss-Bildschirm mit dem Punktestand, die Uebersicht aller
 * Faehigkeiten und die Bilanz samt Zugverlauf unter dem Brett.
 */

Object.assign(TEAM_SCHACH, {
    /* ---------------------------------------------------------------- *
     * Abschluss: Sieg, Niederlage, Punktestand
     *
     * Zwei Schritte, die den ganzen Bereich einnehmen. Der erste sagt, wie es
     * ausgegangen ist, der zweite zeigt den Punktestand — danach geht es zurück
     * in die Übersicht, und die Partie gilt für dieses Gerät als abgeschlossen.
     *
     * Warum das keine Dialog-Box ist: Das Ende einer Partie, an der man tagelang
     * gespielt hat, ist der Moment, auf den alles zulief. Eine Meldung mit
     * OK-Knopf würde ihn wegwischen.
     * ---------------------------------------------------------------- */

    _abschlussZeichnen(wurzel, partie, person) {
        if (TEAM_SCHACH.abschluss.schritt === 2) {
            TEAM_SCHACH._punktestandZeichnen(wurzel, partie, person);
            return;
        }

        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);
        const gewonnen = (partie.ergebnis === meinTeam);
        const remis = (partie.ergebnis === "remis");

        const art = remis ? "remis" : (gewonnen ? "sieg" : "niederlage");
        const flaeche = TEAM_SCHACH._element("div", "abschluss abschluss-" + art);

        flaeche.appendChild(TEAM_SCHACH._element("p", "abschluss-marke", partie.titel));
        flaeche.appendChild(TEAM_SCHACH._element("h2", "abschluss-titel",
            remis ? "Unentschieden" : (gewonnen ? "Gewonnen" : "Verloren")));

        const lage = SCHACH.lage(partie.stand);
        flaeche.appendChild(TEAM_SCHACH._element("p", "abschluss-text",
            remis
                ? "Keine Seite konnte die Partie für sich entscheiden."
                : (gewonnen
                    ? "Euer Team hat die Partie gewonnen."
                    : ((partie.ergebnis === "weiss") ? "Weiss" : "Schwarz")
                        + " hat die Partie gewonnen.")));

        if (lage.text && lage.art !== "laeuft") {
            flaeche.appendChild(TEAM_SCHACH._element("p", "abschluss-grund", lage.text));
        }

        /* Was diese Partie an Punkten gebracht hat — dieselben Zahlen wie in
           der Rangliste, aus derselben Datei. */
        const punkte = RANGLISTE.PUNKTE_TEILNAHME
            + (gewonnen ? RANGLISTE.PUNKTE_SIEG : (remis ? RANGLISTE.PUNKTE_REMIS : 0));

        const kasten = TEAM_SCHACH._element("div", "abschluss-punkte");
        kasten.appendChild(TEAM_SCHACH._element("span", "abschluss-zahl", "+" + punkte));
        kasten.appendChild(TEAM_SCHACH._element("span", "abschluss-punkte-text",
            "Punkte für die Rangliste"
            + (gewonnen ? " (" + RANGLISTE.PUNKTE_SIEG + " für den Sieg, " : " (")
            + RANGLISTE.PUNKTE_TEILNAHME + " fürs Mitspielen"
            + (remis ? ", " + RANGLISTE.PUNKTE_REMIS + " fürs Unentschieden" : "")
            + ")"));
        flaeche.appendChild(kasten);

        const leiste = TEAM_SCHACH._element("div", "abschluss-leiste");
        leiste.appendChild(TEAM_SCHACH._knopf("Punktestand ansehen", "knopf-haupt",
            () => {
                TEAM_SCHACH.abschluss.schritt = 2;
                TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
            }));
        flaeche.appendChild(leiste);

        wurzel.appendChild(flaeche);
    },

    _punktestandZeichnen(wurzel, partie, person) {
        const flaeche = TEAM_SCHACH._element("div", "abschluss abschluss-stand");

        flaeche.appendChild(TEAM_SCHACH._element("h2", "abschluss-titel", "Punktestand"));

        /* Die Rangliste rechnet — hier wird nur gezeigt. */
        const quizzDaten = (WUERFEL_QUIZZ.abgleich && WUERFEL_QUIZZ.abgleich.daten)
            ? WUERFEL_QUIZZ.abgleich.daten
            : null;
        const imposterRunde = (IMPOSTER.abgleich && IMPOSTER.abgleich.daten)
            ? IMPOSTER.abgleich.daten
            : null;
        const liste = RANGLISTE.gesamt(quizzDaten, TEAM_SCHACH.abgleich.daten, imposterRunde);

        if (liste.length === 0) {
            flaeche.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Noch keine Punkte."));
        } else {
            const tabelle = TEAM_SCHACH._element("div", "abschluss-tabelle");

            for (let platz = 0; platz < liste.length; platz++) {
                const eintrag = liste[platz];
                const zeile = TEAM_SCHACH._element("div",
                    "abschluss-zeile" + ((eintrag.id === person.id) ? " abschluss-ich" : ""));

                zeile.appendChild(TEAM_SCHACH._element("span", "abschluss-platz",
                    (platz + 1) + "."));
                zeile.appendChild(TEAM_SCHACH._element("span", "abschluss-name", eintrag.name));
                zeile.appendChild(TEAM_SCHACH._element("span", "abschluss-gesamt",
                    String(eintrag.gesamt)));

                tabelle.appendChild(zeile);
            }

            flaeche.appendChild(tabelle);
        }

        flaeche.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            "Die Punkte dieser Partie sind festgeschrieben. Sie bleiben erhalten, "
            + "auch wenn die Partie später aus der Liste verschwindet."));

        const leiste = TEAM_SCHACH._element("div", "abschluss-leiste");
        leiste.appendChild(TEAM_SCHACH._knopf("Zurück zur Übersicht", "knopf-haupt",
            () => TEAM_SCHACH.abschlussSchliessen(partie.id)));
        flaeche.appendChild(leiste);

        wurzel.appendChild(flaeche);
    },

    /* Den Abschluss einer beendeten Partie noch einmal ansehen. */
    abschlussZeigen(id) {
        TEAM_SCHACH.abschluss = { id: id, schritt: 1 };
        TEAM_SCHACH.offeneId = "";
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    /* Abschluss weglegen: Die Partie gilt auf diesem Gerät als erledigt —
       dauerhaft, also auch nach dem Neuladen der Seite. */
    abschlussSchliessen(id) {
        ICH.abschlussMerken(id);
        TEAM_SCHACH.abschluss = null;
        TEAM_SCHACH.offeneId = "";
        TEAM_SCHACH._auswahlAufheben();
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },


    /* ---------------------------------------------------------------- *
     * Fähigkeiten
     * ---------------------------------------------------------------- */

    /*
     * Gefragt wird die PARTIE, nicht die Spielart.
     *
     * Seit v2.5 lassen sich die Würfel zu jeder Spielart zuschalten
     * (`regeln.faehigkeiten`); nur `SCHACH_RUNDE.faehigkeitenAn` kennt beide
     * Fälle — Schalter der Partie zuerst, sonst die Vorgabe der Spielart. Diese
     * Karte fragte weiter die Spielart und blieb deshalb bei „klassisch mit
     * Würfeln" weg: Die Würfel lagen auf dem Brett, aber die eingesammelten
     * Fähigkeiten liessen sich nirgends einsetzen.
     */
    _faehigkeitenBauen(partie, person) {
        if (!SCHACH_RUNDE.faehigkeitenAn(partie)) {
            return null;
        }

        const karte = TEAM_SCHACH._element("section", "karte");

        /*
         * Überschrift und i-Knopf in einer Zeile.
         *
         * Bis v3.5 stand unter der Überschrift ein Absatz, der die Würfel
         * erklärte, und der i-Knopf ganz unten. Auf dem Handy schob das die
         * Fähigkeiten — das Einzige, was man hier anfassen kann — unter den
         * sichtbaren Bereich. Der Erklärtext steht jetzt im i-Menü, wo er
         * hingehört: Wer ihn braucht, sucht ihn dort; wer spielt, sieht seine
         * Fähigkeiten.
         */
        const kopf = TEAM_SCHACH._element("div", "karte-kopf");
        kopf.appendChild(TEAM_SCHACH._element("h3", "", "Fähigkeiten"));
        kopf.appendChild(TEAM_SCHACH._infoKnopfBauen());
        karte.appendChild(kopf);

        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);

        /* Wartet gerade eine Fähigkeit auf ihr Ziel? Dann zählt nur das. */
        if (TEAM_SCHACH.zielFaehigkeit) {
            const hinweis = TEAM_SCHACH._element("p", "erklaerung erklaerung-rochade",
                SCHACH_VARIANTEN.faehigkeitTitel(TEAM_SCHACH.zielFaehigkeit)
                + ": Tippe eines der hervorgehobenen Felder an.");
            karte.appendChild(hinweis);

            const leiste = TEAM_SCHACH._element("div", "faehigkeit-zeile");
            leiste.appendChild(TEAM_SCHACH._knopf("Abbrechen", "knopf-still knopf-klein",
                () => {
                    TEAM_SCHACH._auswahlAufheben();
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                }));
            karte.appendChild(leiste);
            return karte;
        }

        for (const farbe of ["weiss", "schwarz"]) {
            const koennen = partie.faehigkeiten[farbe];
            const zeile = TEAM_SCHACH._element("div", "faehigkeit-zeile");

            zeile.appendChild(TEAM_SCHACH._element("span", "zug-farbe",
                (farbe === "weiss") ? "Weiss" : "Schwarz"));

            if (koennen.length === 0) {
                zeile.appendChild(TEAM_SCHACH._element("span", "erklaerung", "keine"));
            }

            for (let stelle = 0; stelle < koennen.length; stelle++) {
                zeile.appendChild(TEAM_SCHACH._faehigkeitMarkeBauen(
                    partie, person, farbe, koennen[stelle], meinTeam === farbe));
            }

            karte.appendChild(zeile);
        }

        return karte;
    },

    /*
     * Eine Fähigkeit im Vorrat: Knopf, wenn man sie einsetzen darf, sonst nur
     * eine Marke. Dazu die beiden Zeichen, die sagen, was sie KOSTET:
     *
     *     +        Danach bleibt dir dein normaler Zug.
     *     Blitz    Geht auch, während der Gegner am Zug ist.
     *
     * Beides stand bis v3.5 nirgends. Man musste die Fähigkeit einsetzen, um
     * zu erfahren, ob damit der Zug weg ist — bei einer legendären eine teure
     * Art, es herauszufinden.
     *
     * SEIT v0.41 IST DAS PLUSZEICHEN EINE FRAGE AN DEN SPIELSTAND, keine
     * Eigenschaft der Fähigkeit: `SCHACH_RUNDE.behaeltZug` weiss, ob DIESE
     * Seite JETZT danach noch ziehen kann. Im Gegnerzug versprach das feste
     * Zeichen sonst einen Zug, den es gar nicht gibt.
     */
    _faehigkeitMarkeBauen(partie, person, farbe, art, meineFarbe) {
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art] || {};
        const stufe = SCHACH_VARIANTEN.stufeVon(art);
        const darf = meineFarbe && SCHACH_RUNDE.darfEinsetzen(partie, person.id, art);

        const marke = darf
            ? TEAM_SCHACH._knopf(SCHACH_VARIANTEN.faehigkeitTitel(art),
                "knopf-still knopf-klein faehigkeit-knopf",
                () => TEAM_SCHACH.faehigkeitEinsetzen(partie, art))
            : TEAM_SCHACH._element("span", "chip faehigkeit-marke",
                SCHACH_VARIANTEN.faehigkeitTitel(art));

        if (SCHACH_RUNDE.behaeltZug(partie, farbe, art)) {
            const plus = TEAM_SCHACH._element("span", "faehigkeit-zeichen", "+");
            plus.title = "Danach bleibt dir dein normaler Zug — du kannst noch "
                + "ziehen und schlagen.";
            marke.appendChild(plus);
        }
        if (beschreibung.imGegenzug) {
            marke.appendChild(TEAM_SCHACH._blitzBauen());
        }

        /* Die Farbe der Stufe trägt die Marke — so sieht man sofort, wie
           selten die Fähigkeit war. */
        marke.style.setProperty("--stufe-farbe", stufe.farbe);
        marke.title = stufe.titel + " — " + SCHACH_VARIANTEN.faehigkeitBeschreibung(art);

        return marke;
    },

    /*
     * Der Blitz: geht auch beim gegnerischen Zug.
     *
     * Gezeichnet als SVG und nicht als Zeichen aus der Schrift — das Haus
     * verbietet Emojis, und das einzige passende Schriftzeichen (U+26A1) wird
     * auf den meisten Geräten genau als solches gezeichnet.
     */
    _blitzBauen() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "faehigkeit-blitz");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");

        const strich = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        strich.setAttribute("points", "13,2 4,14 10,14 9,22 19,9 13,9");
        svg.appendChild(strich);

        const titel = document.createElementNS("http://www.w3.org/2000/svg", "title");
        titel.textContent = "Geht auch, während der Gegner am Zug ist.";
        svg.appendChild(titel);

        return svg;
    },

    /* Der i-Knopf öffnet die Übersicht aller Fähigkeiten. */
    _infoKnopfBauen() {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "info-knopf";
        knopf.textContent = "i";
        knopf.setAttribute("aria-label", "Welche Fähigkeiten gibt es?");
        knopf.title = "Welche Fähigkeiten gibt es?";
        knopf.addEventListener("click", () => TEAM_SCHACH.faehigkeitenOeffnen());
        return knopf;
    },

    /*
     * Die Übersicht der Fähigkeiten: nach Seltenheit geordnet, jede Stufe in
     * ihrer Farbe. Die Zahlen (Chance je Stufe, Abstand, Höchstzahl) stecken
     * hinter einem eigenen i an der Überschrift — wer nur wissen will, was eine
     * Fähigkeit tut, soll nicht durch Prozentwerte lesen müssen.
     */
    faehigkeitenOeffnen() {
        TEAM_SCHACH.infoOffen = true;
        TEAM_SCHACH.infoOffenerEintrag = null;
        /* Einmal neu bauen — danach lässt die regelmässige Abfrage sie in
           Ruhe (siehe `infoGezeichnet`). */
        TEAM_SCHACH.infoGezeichnet = false;
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    infoSchliessen() {
        TEAM_SCHACH.infoOffen = false;
        TEAM_SCHACH.infoGezeichnet = false;
        TEAM_SCHACH.infoOffenerEintrag = null;
        TEAM_SCHACH.infoStufe = "";
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    _infoZeichnen(wurzel) {
        const kopf = TEAM_SCHACH._element("div", "partie-kopf");
        kopf.appendChild(TEAM_SCHACH._knopf("Zurück", "knopf-still knopf-klein",
            () => TEAM_SCHACH.infoSchliessen()));
        kopf.appendChild(TEAM_SCHACH._element("h2", "partie-titel", "Fähigkeiten"));
        wurzel.appendChild(kopf);

        wurzel.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            "Auf freien Feldern erscheinen Würfel. Wer mit einer Figur darüber oder "
            + "darauf zieht, sammelt ein, was darin steckt — welche Fähigkeit es ist, "
            + "sieht man vorher nie. Nur der Springer sammelt unterwegs nichts ein: "
            + "Er setzt über die Felder dazwischen hinweg. Ein Würfel mit umgedrehtem "
            + "Fragezeichen bringt nichts Gutes und wirkt sofort."));

        wurzel.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            "Nach jedem Halbzug kann ein neuer dazukommen — solange ein Feld frei "
            + "ist, hört das nicht auf. Liegen gelassene bleiben liegen, bis sie "
            + "jemand einsammelt. Was du schon im Vorrat hast, kommt seltener nach; "
            + "bei den seltenen Stufen weniger stark, weil es dort weniger zur "
            + "Auswahl gibt."));

        /* Die beiden Zeichen aus dem Vorrat erklären — dort ist kein Platz
           für Text, hier schon. */
        const legende = TEAM_SCHACH._element("section", "karte");
        legende.appendChild(TEAM_SCHACH._element("h3", "", "Die Zeichen am Vorrat"));

        const plusZeile = TEAM_SCHACH._element("div", "stufen-eintrag");
        plusZeile.appendChild(TEAM_SCHACH._element("span", "stufen-name", "Pluszeichen"));
        plusZeile.appendChild(TEAM_SCHACH._element("span", "stufen-text",
            "Nach dem Einsetzen bleibt dir dein normaler Zug. Fehlt es, ist danach "
            + "der Gegner dran."));
        legende.appendChild(plusZeile);

        const blitzZeile = TEAM_SCHACH._element("div", "stufen-eintrag");
        blitzZeile.appendChild(TEAM_SCHACH._element("span", "stufen-name", "Blitz"));
        blitzZeile.appendChild(TEAM_SCHACH._element("span", "stufen-text",
            "Du darfst sie auch einsetzen, während der Gegner am Zug ist. Wer zuerst "
            + "drückt, war zuerst."));
        legende.appendChild(blitzZeile);

        wurzel.appendChild(legende);

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            wurzel.appendChild(TEAM_SCHACH._stufenKarteBauen(stufe));
        }
    },

    _stufenKarteBauen(stufe) {
        const karte = TEAM_SCHACH._element("section", "karte stufen-karte");
        karte.style.setProperty("--stufe-farbe", stufe.farbe);

        const kopf = TEAM_SCHACH._element("div", "karte-kopf");
        kopf.appendChild(TEAM_SCHACH._element("h3", "stufen-titel", stufe.titel));

        /* Das zweite i: die Zahlen zu dieser Stufe. */
        const zahlen = document.createElement("button");
        zahlen.type = "button";
        zahlen.className = "info-knopf";
        zahlen.textContent = "i";
        zahlen.setAttribute("aria-label", "Wie oft kommt " + stufe.titel + "?");
        zahlen.title = "Wie oft kommt " + stufe.titel + "?";
        zahlen.addEventListener("click", () => {
            DIALOG.hinweis(stufe.titel, SCHACH_VARIANTEN.stufenErklaerung(stufe.id));
        });
        kopf.appendChild(zahlen);
        karte.appendChild(kopf);

        for (const art of SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id)) {
            karte.appendChild(TEAM_SCHACH._bibliothekEintragBauen(art,
                SCHACH_VARIANTEN.faehigkeitTitel(art),
                SCHACH_VARIANTEN.faehigkeitBeschreibung(art), false));
        }

        /*
         * Die Unglückswürfel dieser Stufe — ALLE. Bis v0.40 stand hier ein
         * `find`, das nur den ersten fand; in der gewöhnlichen Stufe liegen
         * aber zwei (Stolperstein und Volles Glas), und der zweite tauchte in
         * der Bibliothek nie auf.
         */
        for (const pechArt of SCHACH_VARIANTEN.pechDerStufe(stufe.id)) {
            karte.appendChild(TEAM_SCHACH._bibliothekEintragBauen(pechArt,
                SCHACH_VARIANTEN.pechTitel(pechArt) + " (Unglück)",
                SCHACH_VARIANTEN.pechBeschreibung(pechArt), true));
        }

        return karte;
    },

    /*
     * Ein Eintrag der Bibliothek: DER EINTRAG SELBST KLAPPT AUF (seit v0.41).
     *
     * Zugeklappt steht dort NUR DIE ÜBERSCHRIFT (seit v0.42). Vorher stand die
     * Beschreibung daneben — bei 23 Einträgen war die Liste damit so lang, dass
     * man auf dem Handy scrollte, bevor man wusste, welche Fähigkeiten es
     * überhaupt gibt. Wer auf die Überschrift tippt, bekommt beides:
     * Beschreibung und abgespielte Anleitung.
     *
     * Gebaut wird der Inhalt ERST BEIM AUFKLAPPEN. Alle 23 Anleitungen auf
     * einmal wären über zweitausend Elemente, von denen man eines braucht —
     * und je ein Takt, der sie abspielt.
     */
    _bibliothekEintragBauen(art, titel, beschreibung, istPech) {
        const beschreibungsSatz = SCHACH_VARIANTEN.FAEHIGKEITEN[art] || {};

        const eintrag = document.createElement("details");
        eintrag.className = "stufen-eintrag" + (istPech ? " stufen-pech" : "");

        const kopf = document.createElement("summary");
        kopf.className = "stufen-kopf";
        kopf.appendChild(TEAM_SCHACH._element("span", "stufen-name", titel));

        /*
         * DIESELBEN ZEICHEN WIE AM VORRAT (seit v0.47), damit man sie hier
         * kennenlernt und dort wiedererkennt. Am Vorrat hängt das Pluszeichen
         * am Spielstand (`behaeltZug`) — hier steht die EIGENSCHAFT der
         * Fähigkeit, denn eine Bibliothek kennt keinen Spielstand.
         */
        if (!istPech && !beschreibungsSatz.beendetZug) {
            const plus = TEAM_SCHACH._element("span", "faehigkeit-zeichen", "+");
            plus.title = "Danach bleibt dir dein normaler Zug.";
            kopf.appendChild(plus);
        }
        if (beschreibungsSatz.imGegenzug) {
            kopf.appendChild(TEAM_SCHACH._blitzBauen());
        }

        eintrag.appendChild(kopf);

        eintrag.addEventListener("toggle", () => {
            if (!eintrag.open) {
                return;
            }

            /*
             * NUR EINER ZUR ZEIT (seit v0.44). Wer eine zweite Fähigkeit
             * ansieht, hat die erste hinter sich gelassen: Sie klappt zu, und
             * ihr Inhalt wird weggeräumt — damit ihr Takt aufhört, statt
             * unsichtbar weiterzulaufen. Nebenbei bleibt die Liste kurz genug,
             * dass man den nächsten Eintrag ohne Scrollen findet.
             */
            TEAM_SCHACH._bibliothekSchliessen(eintrag);
            TEAM_SCHACH.infoOffenerEintrag = eintrag;

            if (eintrag.querySelector(".stufen-inhalt")) {
                return;
            }

            const inhalt = TEAM_SCHACH._element("div", "stufen-inhalt");
            inhalt.appendChild(TEAM_SCHACH._element("p", "stufen-text", beschreibung));

            /* Was die Zeichen bedeuten — bei JEDEM Eintrag, nicht nur einmal
               ganz oben. Wer hier nachschlägt, sucht diese eine Fähigkeit. */
            if (!istPech) {
                inhalt.appendChild(TEAM_SCHACH._element("p", "stufen-kosten",
                    beschreibungsSatz.beendetZug
                        ? "Kein Pluszeichen: Das Einsetzen kostet deinen Zug — danach "
                            + "ist der Gegner dran."
                        : "Pluszeichen (+): Nach dem Einsetzen darfst du noch ganz "
                            + "normal ziehen."));

                if (beschreibungsSatz.imGegenzug) {
                    inhalt.appendChild(TEAM_SCHACH._element("p", "stufen-kosten",
                        "Blitz: Du darfst sie auch einsetzen, während der Gegner am "
                            + "Zug ist. Wer zuerst drückt, war zuerst."));
                }
            }

            const anleitung = TEAM_SCHACH._anleitungBauen(art);
            if (anleitung) {
                inhalt.appendChild(anleitung);
            }

            eintrag.appendChild(inhalt);
        });

        return eintrag;
    },

    /* Klappt den zuletzt geöffneten Eintrag zu — ausser er ist der neue. */
    _bibliothekSchliessen(ausser) {
        const offen = TEAM_SCHACH.infoOffenerEintrag;

        if (!offen || offen === ausser) {
            return;
        }

        offen.open = false;

        /* Den Inhalt wegnehmen: Der Takt der Anleitung merkt daran, dass sein
           Bild nicht mehr im Bildschirm steht, und hört auf. */
        const inhalt = offen.querySelector(".stufen-inhalt");
        if (inhalt && offen.removeChild) {
            offen.removeChild(inhalt);
        }

        TEAM_SCHACH.infoOffenerEintrag = null;
    },

    /* ---------------------------------------------------------------- *
     * Die Bildanleitung zu einer Fähigkeit (seit v0.41)
     *
     * Zwei kleine Bretter nebeneinander: vorher und nachher. WAS auf dem
     * Nachher-Bild steht, rechnet `SCHACH_VORSCHAU` mit den echten Regeln aus
     * — hier wird nur gezeichnet. Deshalb kann die Anleitung nicht veralten.
     * ---------------------------------------------------------------- */

    /*
     * Die ganze Anleitung zu einer Fähigkeit oder einem Unglückswürfel: EIN
     * Brett, das die Schritte nacheinander abspielt — Ausgangsstellung, der
     * Handgriff, die Wirkung — und immer wieder von vorn.
     *
     * WARUM ABGESPIELT UND NICHT NEBENEINANDER: Zwei Bretter nebeneinander
     * muss man vergleichen; eine Bewegung sieht man. Auf dem Handy ist ein
     * grosses Bild ausserdem lesbarer als zwei kleine. Wer im Betriebssystem
     * weniger Bewegung eingestellt hat, bekommt stattdessen alle Schritte
     * nebeneinander — dann ist der Vergleich der einzige Weg.
     *
     * Liefert null, wenn es kein Beispiel gibt (ein Test hält fest, dass das
     * für keine Fähigkeit vorkommt).
     */
    _anleitungBauen(art) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        if (!schritte || schritte.length === 0) {
            return null;
        }

        if (TEAM_SCHACH._wenigerBewegung()) {
            return TEAM_SCHACH._anleitungRuhigBauen(schritte);
        }

        const halter = TEAM_SCHACH._element("div", "anleitung anleitung-film");
        const bild = TEAM_SCHACH._element("div", "anleitung-bild");

        let stelle = 0;
        let brett = TEAM_SCHACH._beispielBrettBauen(schritte[0]);
        bild.appendChild(brett);
        halter.appendChild(bild);

        /*
         * DIE TEXTE STEHEN ALLE GLEICHZEITIG DA (seit v0.44), einer je Bild,
         * und der laufende ist hervorgehoben. Vorher wechselte EIN Satz mit
         * dem Bild — und weil die Sätze verschieden lang sind, hüpfte alles
         * darunter im Sekundentakt.
         */
        const liste = TEAM_SCHACH._element("ol", "anleitung-schritte");
        const zeilen = schritte.map((schritt, nummer) => {
            const zeile = TEAM_SCHACH._element("li",
                "anleitung-schritt" + (nummer === 0 ? " anleitung-schritt-jetzt" : ""));

            zeile.appendChild(TEAM_SCHACH._element("span", "anleitung-nummer",
                "Bild " + (nummer + 1)));
            zeile.appendChild(TEAM_SCHACH._element("span", "anleitung-satz", schritt.text));

            liste.appendChild(zeile);
            return zeile;
        });
        halter.appendChild(liste);

        const weiter = () => {
            /*
             * Ist das Bild nicht mehr im Bildschirm (Dialog geschlossen, neu
             * gezeichnet), hört der Takt von selbst auf. Sonst tickte er
             * weiter und schriebe in Elemente, die niemand mehr sieht.
             */
            if (halter.isConnected === false) {
                window.clearInterval(takt);
                return;
            }

            stelle = (stelle + 1) % schritte.length;

            const neues = TEAM_SCHACH._beispielBrettBauen(schritte[stelle]);
            bild.replaceChild(neues, brett);
            brett = neues;

            for (let nummer = 0; nummer < zeilen.length; nummer++) {
                zeilen[nummer].className = "anleitung-schritt"
                    + (nummer === stelle ? " anleitung-schritt-jetzt" : "");
            }
        };

        const takt = window.setInterval(weiter, TEAM_SCHACH.ANLEITUNG_MS);
        TEAM_SCHACH.anleitungTakte.push(takt);

        return halter;
    },

    /* Alle Schritte nebeneinander — für alle, die keine Bewegung wollen. */
    _anleitungRuhigBauen(schritte) {
        const halter = TEAM_SCHACH._element("div", "anleitung");

        for (let nummer = 0; nummer < schritte.length; nummer++) {
            const kasten = TEAM_SCHACH._element("div", "anleitung-bild");

            kasten.appendChild(TEAM_SCHACH._element("span", "anleitung-marke",
                "Bild " + (nummer + 1)));
            kasten.appendChild(TEAM_SCHACH._beispielBrettBauen(schritte[nummer]));
            kasten.appendChild(TEAM_SCHACH._element("p", "anleitung-text",
                schritte[nummer].text));

            halter.appendChild(kasten);
        }

        return halter;
    },

    /* Hat der Nutzer im Betriebssystem weniger Bewegung eingestellt? */
    _wenigerBewegung() {
        return !!(window.matchMedia
            && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    },

    /* Beendet alle laufenden Anleitungen — vor jedem Neuzeichnen. */
    _anleitungTakteBeenden() {
        for (const takt of TEAM_SCHACH.anleitungTakte) {
            window.clearInterval(takt);
        }
        TEAM_SCHACH.anleitungTakte = [];
    },

    /*
     * Ein Beispielbrett. Es zeigt dasselbe wie das echte Brett — Figuren,
     * Würfel, Mauern, Schild, Fessel, Frost und geliehene Figuren —, nur klein
     * und ohne Bedienung. Dazu die markierten Felder: worauf es in diesem Bild
     * ankommt.
     */
    _beispielBrettBauen(schritt) {
        const runde = schritt.runde;
        const marken = schritt.marken;
        const wahl = schritt.wahl;
        const stand = runde.stand;
        const breite = SCHACH.breiteVon(stand);
        const felder = SCHACH.felderVon(stand);

        const brett = TEAM_SCHACH._element("div", "vorschau anleitung-brett");
        brett.style.setProperty("--vorschau-spalten", String(breite));

        /* Das volle Glas trübt nur EINE Sicht — im Beispiel die des
           Betrachters, der ja die Seite spielt, die den Würfel erwischt hat. */
        const glas = TEAM_SCHACH._glasWirkt(runde, SCHACH_VORSCHAU.FARBE);

        for (let feld = 0; feld < felder; feld++) {
            const reihe = Math.floor(feld / breite);
            const spalte = feld % breite;

            const zelle = TEAM_SCHACH._element("div",
                "vorschau-feld " + (((reihe + spalte) % 2 === 0) ? "feld-hell" : "feld-dunkel"));

            const figur = SCHACH.figurAuf(stand, feld);
            if (figur !== ".") {
                const getruebt = glas && SCHACH.farbeVon(figur) !== SCHACH_VORSCHAU.FARBE;
                const gezeigt = getruebt
                    ? TEAM_SCHACH._glasZeichen(runde, feld, figur)
                    : figur;

                zelle.appendChild(TEAM_SCHACH._element("span",
                    "figur " + (SCHACH.farbeVon(figur) === "weiss" ? "figur-weiss" : "figur-schwarz"),
                    TEAM_SCHACH._figurZeichen(gezeigt)));
            }

            const wuerfel = runde.bonus.find((eintrag) => eintrag.feld === feld);
            if (wuerfel) {
                zelle.classList.add("feld-bonus");
                zelle.appendChild(TEAM_SCHACH._wuerfelBauen(
                    SCHACH_RUNDE.bonusStufe(wuerfel), wuerfel.pech));
            }

            /* Ränder wie am echten Brett: nur aussen, damit die drei Felder
               EIN Riegel sind und nicht drei Steine. */
            if (SCHACH.mauerAuf(stand, feld)) {
                zelle.classList.add("feld-mauer");

                if (spalte === 0
                    || !SCHACH.mauerAuf(stand, SCHACH._feld(stand, reihe, spalte - 1))) {
                    zelle.classList.add("mauer-anfang");
                }
                if (spalte + 1 >= breite
                    || !SCHACH.mauerAuf(stand, SCHACH._feld(stand, reihe, spalte + 1))) {
                    zelle.classList.add("mauer-ende");
                }
            }
            if (stand.schildFeld === feld) {
                zelle.classList.add("feld-schild");
            }
            if (stand.fesselFeld === feld) {
                zelle.classList.add("feld-fessel");
            }
            if (stand.frostFeld === feld) {
                zelle.classList.add("feld-frost");
            }
            if (SCHACH.istGeliehen(stand, feld)) {
                zelle.classList.add("feld-geliehen");
            }
            /* Die übrigen möglichen Felder — dieselbe Marke wie am echten
               Brett, wenn eine Fähigkeit auf ihr Ziel wartet. */
            if (wahl && wahl.indexOf(feld) !== -1) {
                zelle.classList.add("feld-wahl");
            }

            /* Wohin man ziehen könnte: der Zugpunkt aus dem echten Spiel. */
            if (schritt.ziele.indexOf(feld) !== -1) {
                zelle.classList.add(figur === "." ? "feld-ziel" : "feld-schlag");
            }

            if (marken.indexOf(feld) !== -1) {
                zelle.classList.add("vorschau-marke");
            }

            /* Der Fingerabdruck: HIER wird getippt. */
            if (schritt.tipp === feld) {
                zelle.appendChild(TEAM_SCHACH._fingerBauen());
            }

            brett.appendChild(zelle);
        }

        /* Die Pfeile liegen über dem ganzen Brett, nicht in einem Feld. */
        const pfeile = TEAM_SCHACH._pfeileBauen(stand, schritt.wege);
        if (pfeile) {
            brett.appendChild(pfeile);
        }

        return brett;
    },

    /*
     * Der Fingerabdruck — er sagt: Hier tippst du hin.
     *
     * GEZEICHNET, NICHT EINGEFÜGT. Dieselbe Entscheidung wie beim Würfel
     * (siehe `docs\entscheidungen\entschieden.md`, „Warum der Würfel gezeichnet
     * und nicht eingefügt ist"): Eine Bilddatei wäre ein weiterer Bestandteil,
     * der beim Ausliefern mitmuss, in jeder Grösse neu gebraucht wird und die
     * Farbe nicht mitdreht. Als Pfade folgt das Zeichen den Farbvariablen und
     * bleibt auf jedem Bildschirm scharf.
     *
     * Die Form ist die des vom Nutzer gewünschten Zeichens (v0.45): sechs
     * ineinanderliegende Papillarlinien um einen Kern, unten offen, dazu zwei
     * abgebrochene Linien an den Seiten — daran erkennt man einen
     * Fingerabdruck auch bei zwanzig Pixeln Kantenlänge.
     */
    /*
     * Alle Linien laufen um denselben Mittelpunkt (12 | 14). Der Radius nimmt
     * nach innen ab, und die Enden rutschen nach unten — dadurch werden die
     * inneren Linien schmaler und länger, wie beim echten Abdruck. Wer eine
     * Linie ändert, rechnet ihre Enden aus Mittelpunkt und Radius aus, sonst
     * verrutscht der Bogen.
     */
    FINGER_LINIEN: [
        /* Aussen: weite Bögen, oben geschlossen, unten offen. */
        "M 2.55 12.5 A 9.5 9.5 0 0 1 21.45 12.5",
        "M 4.86 15 A 7.3 7.3 0 1 1 19.14 15",
        "M 7.88 17.5 A 5.1 5.1 0 1 1 16.12 17.5",
        /* Der Kern: eine enge Schleife, die unten weit herunterläuft. */
        "M 10.45 18.5 A 2.9 2.9 0 1 1 13.55 18.5",
        /* Zwei abgebrochene Linien, wie sie auf jedem Abdruck vorkommen. */
        "M 21 16.4 A 9.5 9.5 0 0 1 19.4 19.4",
        "M 3 16.4 A 9.5 9.5 0 0 0 4.6 19.4"
    ],

    _fingerBauen() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "anleitung-finger");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");

        for (const linie of TEAM_SCHACH.FINGER_LINIEN) {
            const pfad = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pfad.setAttribute("d", linie);
            pfad.setAttribute("class", "anleitung-finger-bogen");
            svg.appendChild(pfad);
        }

        return svg;
    },

    /*
     * Die Bewegungspfeile über dem Beispielbrett (seit v0.44).
     *
     * NICHT ZU VERWECHSELN MIT DEM ALTEN ZUGPFEIL, der in v3.6 aus dem Spiel
     * geflogen ist: Der sollte JEDE Gangart darstellen und konnte es nicht
     * (siehe `docs\entscheidungen\entschieden.md`). Hier ist die Aufgabe eine
     * andere und viel kleinere — im Beispiel steht fest, welche Figur wohin
     * geht, und genau das zeigt eine gerade Linie richtig.
     *
     * Ein Pfeil je Weg, zweifarbig wie jede Markierung auf dem Brett: heller
     * Rand aussen, dunkler Kern darüber.
     */
    _pfeileBauen(stand, wege) {
        if (!wege || wege.length === 0) {
            return null;
        }

        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "anleitung-pfeile");
        svg.setAttribute("viewBox", "0 0 " + breite + " " + hoehe);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");

        for (const weg of wege) {
            for (const teil of TEAM_SCHACH._pfeilTeile(weg, breite)) {
                svg.appendChild(teil);
            }
        }

        return svg;
    },

    /* Ein Pfeil: zwei Linien und zwei Spitzen (aussen hell, innen dunkel). */
    _pfeilTeile(weg, breite) {
        const mitte = (feld) => ({
            x: (feld % breite) + 0.5,
            y: Math.floor(feld / breite) + 0.5
        });

        const von = mitte(weg.von);
        const nach = mitte(weg.nach);
        const dx = nach.x - von.x;
        const dy = nach.y - von.y;
        const laenge = Math.sqrt(dx * dx + dy * dy) || 1;

        /* Der Pfeil hört kurz vor der Feldmitte auf — sonst steckt seine
           Spitze in der Figur, die dort steht. */
        const ex = dx / laenge;
        const ey = dy / laenge;
        const spitzeX = nach.x - ex * 0.26;
        const spitzeY = nach.y - ey * 0.26;
        const endeX = spitzeX - ex * 0.2;
        const endeY = spitzeY - ey * 0.2;

        const teile = [];

        for (const lage of ["rand", "kern"]) {
            const linie = document.createElementNS("http://www.w3.org/2000/svg", "line");
            linie.setAttribute("x1", String(von.x + ex * 0.26));
            linie.setAttribute("y1", String(von.y + ey * 0.26));
            linie.setAttribute("x2", String(endeX));
            linie.setAttribute("y2", String(endeY));
            linie.setAttribute("class", "anleitung-pfeil-" + lage);
            teile.push(linie);

            /* Die Spitze: ein Dreieck quer zur Richtung. */
            const quer = 0.16;
            const punkte = [
                spitzeX + " " + spitzeY,
                (endeX - ey * quer) + " " + (endeY + ex * quer),
                (endeX + ey * quer) + " " + (endeY - ex * quer)
            ].join(", ");

            const dreieck = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            dreieck.setAttribute("points", punkte);
            dreieck.setAttribute("class", "anleitung-spitze-" + lage);
            teile.push(dreieck);
        }

        return teile;
    },

    /* ---------------------------------------------------------------- *
     * Verlauf
     * ---------------------------------------------------------------- */

    /*
     * Die Bilanz unter dem Brett: geschlagene und verlorene Figuren je Seite,
     * dazu der Vorsprung nach Figurenwert. Beantwortet auf einen Blick die
     * Frage, die man sonst durch Abzählen beantworten müsste — wer steht besser?
     */
    _bilanzBauen(partie) {
        const zeile = TEAM_SCHACH._element("div", "bilanz-reihe");

        for (const farbe of ["weiss", "schwarz"]) {
            const bilanz = SCHACH_RUNDE.bilanz(partie, farbe);
            const spalte = TEAM_SCHACH._element("div", "bilanz-seite");

            spalte.appendChild(TEAM_SCHACH._element("span", "zug-farbe",
                (farbe === "weiss") ? "Weiss" : "Schwarz"));

            /* Die geschlagenen Figuren als kleine Zeichen — das liest sich
               schneller als eine Zahl. */
            const beute = TEAM_SCHACH._element("span", "bilanz-beute");
            const sortiert = bilanz.geschlagen.slice().sort((einer, anderer) =>
                (SCHACH_RUNDE.FIGUR_WERT[anderer] || 0) - (SCHACH_RUNDE.FIGUR_WERT[einer] || 0));

            for (const art of sortiert) {
                /* Geschlagen wurden Figuren der Gegenfarbe. */
                const figur = (farbe === "weiss") ? art.toLowerCase() : art;
                beute.appendChild(TEAM_SCHACH._element("span",
                    "figur bilanz-figur " + ((farbe === "weiss") ? "figur-schwarz" : "figur-weiss"),
                    TEAM_SCHACH._figurZeichen(figur)));
            }

            if (sortiert.length === 0) {
                beute.appendChild(TEAM_SCHACH._element("span", "erklaerung", "nichts"));
            }
            spalte.appendChild(beute);

            const vorsprung = (bilanz.punkte > 0) ? ("+" + bilanz.punkte) : String(bilanz.punkte);
            spalte.appendChild(TEAM_SCHACH._element("span",
                "bilanz-punkte" + (bilanz.punkte > 0 ? " bilanz-vorn" : ""), vorsprung));

            zeile.appendChild(spalte);
        }

        return zeile;
    },

    _verlaufBauen(partie) {
        const karte = TEAM_SCHACH._element("section", "karte");
        karte.appendChild(TEAM_SCHACH._bilanzBauen(partie));

        /* Auf dem Handy soll der Verlauf nicht die halbe Seite füllen —
           deshalb eingeklappt, mit der Anzahl in der Überschrift. */
        const kasten = document.createElement("details");
        kasten.className = "verlauf-kasten";

        const titel = document.createElement("summary");
        titel.className = "verlauf-titel";
        titel.textContent = "Züge (" + partie.verlauf.length + ")";
        kasten.appendChild(titel);

        if (partie.verlauf.length === 0) {
            kasten.appendChild(TEAM_SCHACH._element("p", "erklaerung", "Noch kein Zug."));
            karte.appendChild(kasten);
            return karte;
        }

        const liste = TEAM_SCHACH._element("div", "zug-liste");

        /* Neueste zuerst — auf dem Handy sieht man so das Wichtigste. */
        for (let i = partie.verlauf.length - 1; i >= 0; i--) {
            const eintrag = partie.verlauf[i];
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

        kasten.appendChild(liste);
        karte.appendChild(kasten);
        return karte;
    },
});
