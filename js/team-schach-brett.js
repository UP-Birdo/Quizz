/*
 * team-schach-brett.js - das Brett und alles darauf.
 *
 * Teil des Bildschirms TEAM_SCHACH; der Einstieg steht in team-schach.js.
 * Diese Datei ERGAENZT dasselbe Objekt, statt ein zweites daneben zu stellen -
 * so bleiben alle Aufrufe (TEAM_SCHACH._brettBauen und so weiter) unveraendert,
 * und die Aufteilung ist eine reine Frage der Lesbarkeit.
 *
 * WICHTIG: Diese Datei wird NACH team-schach.js geladen (index.html).
 *
 * Hier drin: das Brett selbst, die Randbeschriftung, der Zugpfeil, die Wuerfel,
 * die Abstimmung ueber einen Vorschlag und die Bewegungen.
 */

Object.assign(TEAM_SCHACH, {

    /*
     * DER FROST-RAHMEN (seit v0.56) — gebraucht an ZWEI Stellen.
     *
     * Der Frost sperrt seit v0.56 einen 2×2-Block, und ein Block soll auch
     * wie einer aussehen: Die Linie läuft nur aussen herum, innen bleibt sie
     * weg. Dafür fragt jedes Feld seine vier Nachbarn — liegt der Nachbar
     * auch im Block, fällt die Kante zu ihm hin weg. Dieselbe Bauweise wie
     * bei der Mauer (`mauer-anfang` / `mauer-ende`), nur in beide Richtungen.
     *
     * Die Funktion steht hier und nicht zweimal, weil das echte Brett und das
     * Beispielbrett der Anleitung (`_beispielBrettBauen`) beide zeichnen
     * müssen. Zwei Fassungen liefen früher oder später auseinander.
     *
     * Liefert true, wenn dieses Feld eingefroren ist.
     */
    _frostKanten(stand, feld, zelle) {
        if (SCHACH.frostFelder(stand).indexOf(feld) === -1) {
            return false;
        }

        zelle.classList.add("feld-frost");
        TEAM_SCHACH._umrissKanten(stand, feld, SCHACH.frostFelder(stand), zelle);
        return true;
    },

    /*
     * DIE AUSSENKANTEN EINER FELDERGRUPPE (seit v0.57 eigenständig).
     *
     * Setzt `kante-oben` bis `kante-rechts` auf die Seiten, an denen die
     * Gruppe aufhört. Die Stildatei macht daraus einen durchgehenden Rahmen;
     * WELCHE Farbe er hat, entscheidet die Klasse daneben (`feld-frost`
     * blau, `feld-vorschau` grün).
     *
     * Zwei Nutzer teilen sich das: der eingefrorene Block und der
     * Vorschau-Kasten beim Platzieren. Zwei Fassungen liefen früher oder
     * später auseinander — und der Vorschau-Kasten muss genau so aussehen wie
     * das, was danach dasteht.
     */
    _umrissKanten(stand, feld, gruppe, zelle) {
        const breite = SCHACH.breiteVon(stand);
        const reihe = SCHACH.reiheVon(feld, breite);
        const spalte = SCHACH.spalteVon(feld, breite);

        const dabei = (r, s) => SCHACH._imBrett(stand, r, s)
            && gruppe.indexOf(SCHACH._feld(stand, r, s)) !== -1;

        if (!dabei(reihe - 1, spalte)) { zelle.classList.add("kante-oben"); }
        if (!dabei(reihe + 1, spalte)) { zelle.classList.add("kante-unten"); }
        if (!dabei(reihe, spalte - 1)) { zelle.classList.add("kante-links"); }
        if (!dabei(reihe, spalte + 1)) { zelle.classList.add("kante-rechts"); }
    },

    _brettBauen(partie, person) {
        const halter = TEAM_SCHACH._element("div", "brett-halter");

        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);
        /* Schwarze Teams sehen das Brett gedreht — jeder blickt von seiner
           Seite darauf, wie am echten Tisch. */
        const gedreht = (meinTeam === "schwarz");

        const stand = partie.stand;
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const felder = breite * hoehe;

        const brett = TEAM_SCHACH._element("div", "brett");

        /*
         * Spaltenzahl und Höchstbreite gehen als Stil-Variablen an die
         * Stildatei — dort rechnet sie daraus auch die Schriftgröße der
         * Figuren. So bleibt alles Aussehen in der Stildatei, und ein breites
         * Brett schrumpft auf dem Handy von selbst mit.
         */
        brett.style.setProperty("--brett-spalten", String(breite));
        brett.style.setProperty("--brett-max", Math.min(64 * breite, 900) + "px");

        /* Gemerkt für _figurGroesseSetzen: Die Schriftgröße der Figuren lässt
           sich erst messen, wenn das Brett im Bildschirm steht. */
        TEAM_SCHACH.brettEl = brett;

        const darfZiehen = SCHACH_RUNDE.darfZiehen(partie, person.id);
        const bonus = SCHACH_RUNDE.offeneBonusFelder(partie);
        const glas = TEAM_SCHACH._glasWirkt(partie, meinTeam);

        /*
         * WANN DIE GRÄBER BLASS ZU SEHEN SIND (seit v0.57 für BEIDE
         * Fähigkeiten, vorher nur beim Friedhof).
         *
         * Friedhof und Wiederbelebung holen etwas von einem bestimmten FELD —
         * ohne zu sehen, wo etwas liegt, tippt man ins Blaue. Der Unterschied
         * steckt nur darin, WESSEN Gefallene gemeint sind, und das beantwortet
         * `_grabAuf`.
         */
        const graeberZeigen = (TEAM_SCHACH.zielFaehigkeit === "friedhof"
            || TEAM_SCHACH.zielFaehigkeit === "wiederbelebung");

        /* Die Felder, über die zuletzt gezogen wurde — siehe _letzteSpur. */
        const spur = TEAM_SCHACH._letzteSpur(partie);

        for (let anzeige = 0; anzeige < felder; anzeige++) {
            const feld = gedreht ? (felder - 1 - anzeige) : anzeige;

            const zelle = document.createElement("button");
            zelle.type = "button";
            zelle.className = "feld " + (((SCHACH.reiheVon(feld, breite)
                + SCHACH.spalteVon(feld, breite)) % 2 === 0) ? "feld-hell" : "feld-dunkel");
            zelle.dataset.feld = String(feld);
            zelle.setAttribute("aria-label", SCHACH.feldName(feld, breite, hoehe));

            /*
             * Die Spur des letzten Zuges. Sie liegt VOR allem anderen, damit
             * eine Zielmarkierung oder ein Schild sie überschreiben kann —
             * was gerade möglich ist, ist wichtiger als das, was war.
             */
            if (spur.weg[feld]) {
                zelle.classList.add(spur.pech ? "feld-spur-pech" : "feld-spur");
                if (spur.enden[feld]) {
                    zelle.classList.add("feld-spur-ende");
                }
            }
            if (spur.wirkung[feld]) {
                zelle.classList.add("feld-spur-wirkung");
            }

            const figur = SCHACH.figurAuf(stand, feld);
            if (figur !== ".") {
                /* Unter dem vollen Glas sehen die GEGNERISCHEN Figuren anders
                   aus, als sie sind — nur für diese Seite. */
                const getruebt = glas && SCHACH.farbeVon(figur) !== meinTeam;
                const gezeigt = getruebt
                    ? TEAM_SCHACH._glasZeichen(partie, feld, figur)
                    : figur;

                const zeichen = TEAM_SCHACH._element("span",
                    "figur " + (SCHACH.farbeVon(figur) === "weiss" ? "figur-weiss" : "figur-schwarz")
                    + (getruebt ? " figur-getruebt" : ""),
                    TEAM_SCHACH._figurZeichen(gezeigt));
                zelle.appendChild(zeichen);
            }

            /*
             * Liegt hier ein Würfel mit einer Fähigkeit?
             *
             * WÄHREND DIE GEFALLENEN BLASS LIEGEN, BLEIBEN DIE WÜRFEL AUS
             * (seit v0.57). Friedhof und Wiederbelebung zeigen ihre Gräber auf
             * genau den Feldern, die auch Würfel tragen können — beides
             * übereinander ist nicht mehr lesbar, und in diesem Moment sucht
             * man Gräber, keine Würfel. Sie sind nur verborgen, nicht weg:
             * Wer abbricht, sieht sie sofort wieder.
             */
            const bonusHier = graeberZeigen
                ? null
                : bonus.find((eintrag) => eintrag.feld === feld);

            if (bonusHier) {
                /*
                 * WELCHE Fähigkeit drin ist, verrät die Oberfläche NIE — auch
                 * nicht beim Darüberfahren. Ein Würfel, dessen Inhalt man
                 * vorher lesen kann, ist kein Überraschungswürfel mehr.
                 *
                 * ZWEI GETRENNTE FRAGEN (seit v0.49):
                 *
                 *   `seltenheitZeigen`  Die FARBE — wie selten ist er?
                 *   `pechZeigen`        Das ZEICHEN — ist er schlecht?
                 *                       (umgedrehtes Fragezeichen)
                 *
                 * Bis v0.48 hing beides am ersten Haken, und das Unglück war
                 * ausserdem eine eiserne Regel. Getrennt lässt sich einstellen,
                 * was gemeint war: Farbe ja, Warnung nein — dann ist jeder
                 * Würfel ein Wagnis, sieht aber weiter nach seiner Stufe aus.
                 */
                const zeigen = (partie.regeln.seltenheitZeigen !== false);
                const pechZeigen = (partie.regeln.pechZeigen === true)
                    && !!bonusHier.pech;
                const stufe = SCHACH_RUNDE.bonusStufe(bonusHier);

                zelle.classList.add("feld-bonus");
                zelle.title = "Lootbox"
                    + (zeigen ? " — " + stufe.titel : "")
                    + (pechZeigen ? (zeigen ? ", Unglück" : " — Unglück") : "");
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe) + ", " + zelle.title);

                zelle.appendChild(TEAM_SCHACH._wuerfelBauen(
                    zeigen ? stufe : SCHACH_VARIANTEN.STUFE_UNBEKANNT,
                    pechZeigen));
            }

            /*
             * Eine geliehene Figur (Fähigkeit „Friedhof"). Sie sieht aus wie
             * eine eigene und zieht auch so — aber sie zerfällt. Ohne
             * Kennzeichnung baut man eine Stellung darauf auf und wundert sich,
             * wenn plötzlich die halbe Armee fehlt.
             */
            if (SCHACH.istGeliehen(stand, feld)) {
                const rest = SCHACH.geliehene(stand)
                    .find((eintrag) => eintrag.feld === feld);

                zelle.classList.add("feld-geliehen");
                zelle.title = "Geliehen: zerfällt in "
                    + (rest.bis - stand.takt) + " Halbzügen";
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe) + ", geliehene Figur");
            }

            /*
             * Eine Mauer auf diesem Feld. Sie trägt keine Figur und keinen
             * Würfel — sie IST das Feld, solange sie steht. Die Ränder werden
             * gesetzt, damit drei nebeneinander liegende Felder als EIN Block
             * erscheinen und nicht als drei Kästchen.
             */
            if (SCHACH.mauerAuf(stand, feld)) {
                const spalte = SCHACH.spalteVon(feld, breite);
                const reihe = SCHACH.reiheVon(feld, breite);

                zelle.classList.add("feld-mauer");

                if (spalte === 0
                    || !SCHACH.mauerAuf(stand, SCHACH._feld(stand, reihe, spalte - 1))) {
                    zelle.classList.add("mauer-anfang");
                }
                if (spalte + 1 >= breite
                    || !SCHACH.mauerAuf(stand, SCHACH._feld(stand, reihe, spalte + 1))) {
                    zelle.classList.add("mauer-ende");
                }

                zelle.title = "Mauer: hier zieht niemand hindurch";
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe) + ", Mauer");
            }

            /* Ein Riss im Boden (seit v0.54): gesperrt wie eine Mauer, aber
               dauerhaft — und deshalb anders gezeichnet. */
            if (SCHACH.rissAuf(stand, feld)) {
                zelle.classList.add("feld-riss");

                /* Auf dem Kreuz-Brett sind die vier Ecken von Anfang an
                   gesperrt (seit v0.63) — sie sind kein Unglück, sondern die
                   Form des Bretts. Gezeichnet gleich, benannt anders. */
                const kreuzEcke = !!SCHACH_VARIANTEN.holen(stand.variante).kreuz;

                zelle.title = kreuzEcke
                    ? "Gehört nicht zum Brett"
                    : "Riss im Boden: dauerhaft gesperrt, nur Springer setzen darüber";
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe)
                        + (kreuzEcke ? ", ausserhalb des Bretts" : ", Riss"));
            }

            /*
             * Wirkende Fähigkeiten am Brett zeigen: Ohne sie muss man sich
             * merken, welche Figur geschützt ist und welche festhängt — und
             * genau das vergisst man in einer Partie, die über Tage läuft.
             */
            if (partie.stand.schildFeld === feld) {
                zelle.classList.add("feld-schild");
                zelle.title = "Geschützt: lässt sich nicht schlagen";
            }
            if (partie.stand.fesselFeld === feld) {
                zelle.classList.add("feld-fessel");
                zelle.title = "Gefesselt: darf mehrere Züge lang nicht ziehen, "
                    + "ist dabei aber schlagbar";
            }

            if (TEAM_SCHACH._frostKanten(stand, feld, zelle)) {
                zelle.title = "Eingefroren: zieht nicht und ist unantastbar";
            }

            /*
             * DIE RESTZEIT ALS KLEINE ZAHL (seit v0.53).
             *
             * Überall, wo etwas abläuft — geliehene Figur, Mauer, Schild,
             * Fessel, Frost —, steht rechts oben am Feld, wie viele Halbzüge es
             * noch gilt. Vorher stand die Zahl nur im Titel-Text beim
             * Darüberfahren; auf dem Handy gibt es kein Darüberfahren, und
             * damit musste man mitzählen.
             *
             * Gefragt wird das Regelwerk (`SCHACH.restzeitAuf`) — die Fristen
             * stehen dort, und hier wird nur gezeichnet.
             */
            const restzeit = SCHACH.restzeitAuf(stand, feld);
            if (restzeit > 0) {
                zelle.appendChild(TEAM_SCHACH._element("span", "feld-restzeit",
                    String(restzeit)));
            }

            /*
             * DIE GEFALLENEN BLASS ZEIGEN, SOLANGE DER FRIEDHOF WARTET
             * (seit v0.54).
             *
             * Seit die Fähigkeit weckt, wer GENAU DORT gefallen ist, muss man
             * sehen, wo das war — sonst tippt man ins Blaue. Gezeigt wird nur,
             * was auch aufstehen könnte: gefallene GEGNER auf einem Feld, das
             * jetzt frei ist. Liegen auf einem Feld mehrere, steht der zuletzt
             * gefallene oben — genau der, den die Regel weckt.
             */
            if (graeberZeigen && figur === ".") {
                const grab = TEAM_SCHACH._grabAuf(partie, meinTeam, feld);

                if (grab) {
                    const schemen = TEAM_SCHACH._element("span",
                        "figur figur-schemen "
                        + ((meinTeam === "weiss") ? "figur-weiss" : "figur-schwarz"),
                        TEAM_SCHACH._figurZeichen(
                            (meinTeam === "weiss") ? grab : grab.toLowerCase()));
                    zelle.appendChild(schemen);

                    zelle.title = "Hier fiel " + SCHACH.artName(grab);
                    zelle.setAttribute("aria-label",
                        SCHACH.feldName(feld, breite, hoehe) + ", Grab: "
                        + SCHACH.artName(grab));
                }
            }

            /* Wartet die Fähigkeit auf ein Ziel? Dann sind die möglichen
               Felder markiert. */
            if (TEAM_SCHACH.zielFelder.indexOf(feld) !== -1) {
                zelle.classList.add("feld-wahl");
            }

            /*
             * DER VORSCHAU-KASTEN (seit v0.57): der Umriss dessen, was
             * passieren WÜRDE — drei Felder bei der Mauer, ein 2×2 beim Frost
             * und beim Friedhof. Er liegt über der Auswahlmarke, denn er ist
             * die genauere Auskunft.
             */
            if (TEAM_SCHACH.zielUmriss.indexOf(feld) !== -1) {
                zelle.classList.add("feld-vorschau");
                TEAM_SCHACH._umrissKanten(stand, feld, TEAM_SCHACH.zielUmriss, zelle);
            }

            if (feld === TEAM_SCHACH.gewaehltesFeld) {
                zelle.classList.add("feld-gewaehlt");
            }
            /*
             * Mögliche Ziele. Der rote Schlagring gilt nur für GEGNERISCHE
             * Figuren (seit v0.44).
             *
             * Vorher hing er an „da steht irgendetwas" — und bei der Rochade
             * steht dort die eigene Figur: Auf einem sechs Felder breiten
             * Brett landet der König genau auf dem Turm. Das Feld sah damit
             * aus, als schlüge man den eigenen Turm.
             */
            if (TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
                const gegnerisch = (figur !== "." && SCHACH.farbeVon(figur) !== stand.amZug);
                zelle.classList.add(gegnerisch ? "feld-schlag" : "feld-ziel");
            }
            /* Den zweiten Weg zur Rochade über das Turmfeld gibt es seit v0.44
               nicht mehr — der Rochadezug ist ein normaler Königszug und steht
               als Zugpunkt schon oben in `moeglicheZiele`. */


            /* Königsfeld hervorheben, wenn es im Schach steht. */
            if (partie.laeuft && SCHACH.artVon(figur) === "K"
                && SCHACH.farbeVon(figur) === stand.amZug
                && SCHACH.imSchach(stand, stand.amZug)) {
                zelle.classList.add("feld-schach");
            }

            zelle.disabled = !darfZiehen;
            zelle.addEventListener("click", () => TEAM_SCHACH.feldAngetippt(partie, person, feld));

            /* Irgendein Feld genügt, um später die Feldbreite zu messen —
               alle sind gleich gross (`aspect-ratio: 1 / 1`). */
            if (anzeige === 0) {
                TEAM_SCHACH.feldEl = zelle;
            }

            brett.appendChild(zelle);
        }

        /*
         * Die Beschriftung am Rand (a, b, c … und 8, 7, 6 …). Sie entsteht aus
         * denselben Maßen wie das Brett — auf dem 6er-Brett steht a bis f, auf
         * dem Doppelbrett a bis p, und die Zahlen zählen bis zur Höhe. Damit
         * wächst sie mit jeder Spielart mit, ohne Sonderfall.
         */
        const rahmen = TEAM_SCHACH._element("div", "brett-rahmen");
        rahmen.style.setProperty("--brett-spalten", String(breite));
        rahmen.style.setProperty("--brett-reihen", String(hoehe));
        rahmen.style.setProperty("--brett-max", Math.min(64 * breite, 900) + "px");

        rahmen.appendChild(TEAM_SCHACH._randBauen(partie, gedreht, "reihen"));
        rahmen.appendChild(brett);
        rahmen.appendChild(TEAM_SCHACH._randBauen(partie, gedreht, "spalten"));

        halter.appendChild(rahmen);

        if (!partie.laeuft && !partie.ergebnis) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Die Partie beginnt, sobald in beiden Teams jemand steht und beide "
                + "Seiten bereit gedrückt haben."));
        } else if (partie.laeuft && !darfZiehen) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                meinTeam
                    ? "Warte, bis dein Team wieder am Zug ist."
                    : "Tritt einem Team bei, um mitzuspielen."));
        } else if (darfZiehen && !TEAM_SCHACH.zielFaehigkeit) {
            /* Wartet eine Fähigkeit auf ihr Ziel, erklärt die Platzier-Leiste
               weiter unten, was zu tun ist — zwei Anleitungen gleichzeitig
               widersprächen sich. */
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Figur antippen, dann ein Feld mit Punkt. Wer aus deinem Team "
                + "zuerst zieht, hat gezogen."));
        }

        if (glas) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung erklaerung-rochade",
                "Volles Glas: Du siehst die gegnerischen Figuren gerade falsch. "
                + "Sie ziehen wie immer — verlass dich lieber auf die "
                + "hervorgehobenen Felder. Noch "
                + (partie.stand.glasBis - partie.zugZaehler) + " Halbzüge."));
        }

        const rochade = TEAM_SCHACH._rochadeHinweis(partie);
        if (rochade) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung erklaerung-rochade", rochade));
        }

        const platzieren = TEAM_SCHACH._platzierenBauen(partie, person);
        if (platzieren) {
            halter.appendChild(platzieren);
        }

        const abstimmung = TEAM_SCHACH._abstimmungBauen(partie, person);
        if (abstimmung) {
            halter.appendChild(abstimmung);
        }

        return halter;
    },

    /*
     * DIE LEISTE ZUM PLATZIEREN (seit v0.57).
     *
     * Sie erscheint, sobald eine Fähigkeit auf ihr Ziel wartet, und führt
     * durch zwei Schritte: erst ein Feld antippen, dann „Einsetzen". Bis v0.56
     * wirkte der erste Tipp sofort — bei Mauer, Frost und Friedhof sah man
     * dabei nie, WO die Wirkung landet.
     *
     * Der Abbrechen-Knopf ist dabei mehr als Höflichkeit: Er ist der einzige
     * sichtbare Ausweg, wenn man sich vertippt hat. (Ein Tipp neben die
     * gültigen Felder bricht weiterhin ebenfalls ab — das bleibt, weil es der
     * schnellere Weg ist.)
     */
    _platzierenBauen(partie, person) {
        if (!TEAM_SCHACH.zielFaehigkeit) {
            return null;
        }
        if (!SCHACH_RUNDE.darfEinsetzen(partie, person.id, TEAM_SCHACH.zielFaehigkeit)) {
            return null;
        }

        const breite = SCHACH.breiteVon(partie.stand);
        const hoehe = SCHACH.hoeheVon(partie.stand);
        const titel = SCHACH_VARIANTEN.faehigkeitTitel(TEAM_SCHACH.zielFaehigkeit);
        const gesetzt = (TEAM_SCHACH.zielVorschau >= 0);

        const karte = TEAM_SCHACH._element("section", "karte platzieren");
        karte.appendChild(TEAM_SCHACH._element("h3", "", titel + " platzieren"));

        karte.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            gesetzt
                ? ("Der grüne Rahmen zeigt, was passiert — auf "
                    + SCHACH.feldName(TEAM_SCHACH.zielVorschau, breite, hoehe)
                    + ". Ein anderes helles Feld antippen verschiebt ihn.")
                : "Tippe eines der hell umrandeten Felder an. Der grüne Rahmen "
                    + "zeigt dann, wohin die Wirkung wirklich geht."));

        const leiste = TEAM_SCHACH._element("div", "knopf-zeile");

        if (gesetzt) {
            leiste.appendChild(TEAM_SCHACH._knopf("Einsetzen", "knopf-haupt",
                () => TEAM_SCHACH.zielBestaetigen(partie)));
        }
        leiste.appendChild(TEAM_SCHACH._knopf("Abbrechen", "knopf-still",
            () => TEAM_SCHACH.zielVerwerfen()));

        karte.appendChild(leiste);
        return karte;
    },

    /*
     * Der offene Zugvorschlag, über den das Team abstimmt. Nur in Partien, die
     * mit „Team muss sich einig sein“ angelegt wurden.
     */
    _abstimmungBauen(partie, person) {
        if (!partie.vorschlag || partie.vorschlag.zugZaehler !== partie.zugZaehler) {
            return null;
        }

        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);
        if (meinTeam !== partie.stand.amZug) {
            return null;
        }

        const breite = SCHACH.breiteVon(partie.stand);
        const hoehe = SCHACH.hoeheVon(partie.stand);
        const vorschlag = partie.vorschlag;

        const karte = TEAM_SCHACH._element("section", "karte abstimmung");
        karte.appendChild(TEAM_SCHACH._element("h3", "",
            (vorschlag.art === "faehigkeit") ? "Fähigkeit vorgeschlagen" : "Zug vorgeschlagen"));

        const was = (vorschlag.art === "faehigkeit")
            ? SCHACH_VARIANTEN.faehigkeitTitel(vorschlag.faehigkeit)
                + ((vorschlag.zielFeld >= 0)
                    ? " auf " + SCHACH.feldName(vorschlag.zielFeld, breite, hoehe)
                    : "")
            : SCHACH.feldName(vorschlag.von, breite, hoehe) + " nach "
                + SCHACH.feldName(vorschlag.nach, breite, hoehe);

        karte.appendChild(TEAM_SCHACH._element("p", "abstimmung-zug",
            (vorschlag.name || "Jemand") + " schlägt vor: " + was));

        /* Der Countdown — er läuft für alle gleich, weil die Frist im
           gemeinsamen Stand steht. */
        if (vorschlag.frist) {
            const bleiben = Math.max(0, Math.ceil((vorschlag.frist - Date.now()) / 1000));
            karte.appendChild(TEAM_SCHACH._element("p", "abstimmung-frist",
                (bleiben > 0)
                    ? "Noch " + bleiben + " Sekunden — danach gilt der Vorschlag."
                    : "Die Zeit ist um."));
        }

        const fehlende = partie.teams[meinTeam]
            .filter((id) => vorschlag.stimmen.indexOf(id) === -1);

        /*
         * Solange eine Abstimmung läuft, wird jede Sekunde neu gezeichnet —
         * anders ließe sich kein Countdown zeigen. Und wenn die Frist abläuft,
         * schiebt ihn das erste Gerät an, das es bemerkt.
         */
        TEAM_SCHACH._fristVerfolgen(partie);

        karte.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            fehlende.length === 0
                ? "Alle sind einverstanden."
                : "Es fehlt noch: " + fehlende.map((id) => TEAM_SCHACH._nameVon(id)).join(", ")));

        const leiste = TEAM_SCHACH._element("div", "karte-fuss");

        if (partie.vorschlag.stimmen.indexOf(person.id) === -1) {
            leiste.appendChild(TEAM_SCHACH._knopf("Einverstanden", "knopf-haupt",
                () => TEAM_SCHACH.zugMittragen(partie)));
        } else {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-fertig",
                "Du bist einverstanden"));
        }

        leiste.appendChild(TEAM_SCHACH._knopf("Verwerfen", "knopf-still knopf-klein",
            () => TEAM_SCHACH.vorschlagVerwerfen(partie)));

        karte.appendChild(leiste);
        return karte;
    },

    /*
     * Hält den Countdown am Laufen und löst den Vorschlag aus, wenn die Frist
     * abgelaufen ist.
     *
     * Der Zeitgeber wird bei jedem Zeichnen neu gesetzt (und der alte gelöscht),
     * damit nie zwei nebeneinander laufen. Ausgelöst wird über denselben Weg wie
     * ein Zug — die Zugzähler-Prüfung sorgt dafür, dass es auch dann nur einmal
     * passiert, wenn drei Geräte gleichzeitig aufwachen.
     */
    _fristVerfolgen(partie) {
        if (TEAM_SCHACH.fristZeitgeber !== null) {
            window.clearTimeout(TEAM_SCHACH.fristZeitgeber);
            TEAM_SCHACH.fristZeitgeber = null;
        }

        const vorschlag = partie.vorschlag;
        if (!vorschlag || !vorschlag.frist) {
            return;
        }

        const bleiben = vorschlag.frist - Date.now();

        TEAM_SCHACH.fristZeitgeber = window.setTimeout(() => {
            TEAM_SCHACH.fristZeitgeber = null;

            const jetzt = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, partie.id);
            if (!jetzt || !jetzt.vorschlag) {
                TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                return;
            }

            if (Date.now() >= jetzt.vorschlag.frist) {
                TEAM_SCHACH.fristAusloesen(jetzt);
            } else {
                TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
            }
        }, Math.max(250, Math.min(bleiben, 1000)));
    },

    async fristAusloesen(partie) {
        const neu = SCHACH_RUNDE.fristAbgelaufen(partie, Date.now());
        if (!neu) {
            return;
        }
        await TEAM_SCHACH._sendenMitPruefung(neu, partie.zugZaehler);
    },

    async zugMittragen(partie) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }

        const neu = SCHACH_RUNDE.zugMittragen(partie, person.id);
        if (!neu) {
            return;
        }
        await TEAM_SCHACH._sendenMitPruefung(neu, partie.zugZaehler);
    },

    async vorschlagVerwerfen(partie) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }

        const neu = SCHACH_RUNDE.vorschlagVerwerfen(partie, person.id);
        if (!neu) {
            return;
        }
        await TEAM_SCHACH._sendenMitPruefung(neu, partie.zugZaehler);
    },

    /*
     * Erklärt beim gewählten König, was mit der Rochade ist.
     *
     * Ohne diesen Satz sieht es aus, als wäre die Rochade kaputt: Man tippt den
     * König an, es erscheint kein Feld, und niemand sagt warum. Die Gründe
     * kommen aus dem Regelwerk (SCHACH.rochadeLage) — der Bildschirm rechnet
     * nichts selbst nach.
     */
    _rochadeHinweis(partie) {
        if (TEAM_SCHACH.gewaehltesFeld === -1) {
            return "";
        }
        const figur = SCHACH.figurAuf(partie.stand, TEAM_SCHACH.gewaehltesFeld);
        if (SCHACH.artVon(figur) !== "K") {
            return "";
        }

        const lage = SCHACH.rochadeLage(partie.stand, partie.stand.amZug);
        const moegliche = lage.filter((eintrag) => eintrag.moeglich);

        if (moegliche.length > 0) {
            return "Rochade möglich: den Turm antippen, oder den König zwei Felder "
                + "zur Seite.";
        }

        /* Ist es überhaupt eine Spielart mit Rochade? Dann keine Belehrung. */
        if (lage.every((eintrag) => eintrag.grund.indexOf("Spielart") !== -1)) {
            return "";
        }

        return "Rochade gerade nicht möglich. Kurz: " + lage[0].grund
            + " Lang: " + lage[1].grund;
    },

    /*
     * Eine Randbeschriftung: die Spaltenbuchstaben unter dem Brett oder die
     * Reihenzahlen links daneben. Beide kommen aus den Maßen der Spielart und
     * beachten das gedrehte Brett.
     */
    _randBauen(partie, gedreht, art) {
        const breite = SCHACH.breiteVon(partie.stand);
        const hoehe = SCHACH.hoeheVon(partie.stand);
        const rand = TEAM_SCHACH._element("div", "brett-rand brett-rand-" + art);

        if (art === "spalten") {
            for (let spalte = 0; spalte < breite; spalte++) {
                const stelle = gedreht ? (breite - 1 - spalte) : spalte;
                rand.appendChild(TEAM_SCHACH._element("span", "brett-marke",
                    SCHACH.SPALTEN[stelle]));
            }
        } else {
            for (let reihe = 0; reihe < hoehe; reihe++) {
                const stelle = gedreht ? (hoehe - 1 - reihe) : reihe;
                rand.appendChild(TEAM_SCHACH._element("span", "brett-marke",
                    String(hoehe - stelle)));
            }
        }

        return rand;
    },

    /* ---------------------------------------------------------------- *
     * Die Spur des letzten Zuges (seit v3.6)
     *
     * BIS v3.5 WAR HIER EIN PFEIL. Er wurde als SVG über das Brett gelegt,
     * mit Maske, damit er unter den Figuren verschwindet. Drei gemeldete
     * Fehler hatten dieselbe Ursache — ein Pfeil ist eine gerade Linie:
     *
     *   - Beim schlagenden Bauern fehlte er. Die Strecke von einem Feld war
     *     kürzer als Rand plus Spitze, deshalb wurde gar nichts gezeichnet.
     *   - Beim Springer fehlte er aus demselben Grund, sobald der kurze
     *     Schenkel des L die Spitze tragen musste.
     *   - Und wo er kam, zeigte er über Felder hinweg, die die Figur nie
     *     berührt hat.
     *
     * Jetzt wird der WEG eingefärbt, so wie es Schachprogramme seit jeher
     * machen. Der kann nie zu kurz sein: Start und Ziel gehören immer dazu.
     * Damit ist die ganze Maskerei mit Maske, Lagen und Doppelkontur weg —
     * knapp 300 Zeilen Zeichenarbeit gegen zwei CSS-Klassen.
     * ---------------------------------------------------------------- */

    /*
     * Welche Felder hat der letzte Eintrag im Verlauf berührt? Liefert
     *
     *     {
     *         weg:     { <Feld>: true },  alle durchlaufenen Felder
     *         enden:   { <Feld>: true },  nur Start und Ziel (kräftiger)
     *         wirkung: { <Feld>: true },  Wirkung ohne Bewegung
     *         pech:    true|false         war es ein Unglückswürfel?
     *     }
     *
     * Ein Zug hat einen Weg, ein Erdbeben oder ein Bauernschub mehrere — jede
     * Figur, die sich bewegt hat, hinterlässt ihre Spur. Ältere Einträge im
     * Verlauf kennen nur `von`/`nach`; die tragen genauso.
     */
    /*
     * DER LETZTE EINTRAG, DER EINE BEWEGUNG BESCHREIBT (seit v0.69, Wunsch #30).
     *
     * DER FEHLER: „Manche Züge, gerade mit dem Pferd, wurden nicht gezeigt."
     * Spur und Bewegung lasen beide den LETZTEN Verlaufseintrag — und der ist
     * nach einem Zug sehr oft gar nicht der Zug. Erscheint danach eine neue
     * Lootbox (was in einer Partie mit Lootboxen ständig passiert), hängt
     * `_bonusNachziehen` einen Eintrag „Eine Lootbox erscheint auf …" hinten
     * an, und der trägt `von: -1, nach: -1`. Damit fiel die Bewegungsanimation
     * sofort heraus und die Spur blieb leer: Der Zug war passiert, aber nichts
     * zeigte ihn.
     *
     * Beim SPRINGER fällt es am meisten auf — sein L lässt sich ohne Spur am
     * schwersten nachvollziehen. Deshalb kam die Meldung über ihn.
     *
     * Gesucht wird jetzt rückwärts der erste Eintrag, der wirklich eine
     * Bewegung trägt: entweder `wege` oder ein gültiges Feldpaar. Ohne einen
     * solchen bleibt es beim letzten Eintrag — dann gibt es eben keine Spur.
     */
    _letzterBewegungsEintrag(partie) {
        for (let stelle = partie.verlauf.length - 1; stelle >= 0; stelle--) {
            const eintrag = partie.verlauf[stelle];

            if (eintrag.wege && eintrag.wege.length > 0) {
                return eintrag;
            }
            if (Number.isInteger(eintrag.von) && eintrag.von >= 0
                && Number.isInteger(eintrag.nach) && eintrag.nach >= 0) {
                return eintrag;
            }

            /*
             * Nur über Einträge hinweg, die NEBENHER entstanden sind. Ein
             * Eintrag mit Wirkung, der nichts bewegt hat (Schutzschild,
             * Fessel), ist das Letzte, was passiert ist — dahinter wird nicht
             * weitergesucht, sonst zeigte die Spur einen Zug von vorgestern.
             */
            if (eintrag.wirkung !== "erscheint") {
                return eintrag;
            }
        }
        return null;
    },

    _letzteSpur(partie) {
        const spur = { weg: {}, enden: {}, wirkung: {}, pech: false };
        const letzter = TEAM_SCHACH._letzterBewegungsEintrag(partie);

        if (!letzter) {
            return spur;
        }
        spur.pech = (letzter.wirkung === "pech");

        let wege = (letzter.wege && letzter.wege.length > 0) ? letzter.wege : [];

        if (wege.length === 0 && Number.isInteger(letzter.von) && letzter.von >= 0
            && Number.isInteger(letzter.nach) && letzter.nach >= 0) {
            wege = [{ von: letzter.von, nach: letzter.nach }];
        }

        for (const weg of wege) {
            if (weg.von === weg.nach) {
                continue;
            }
            spur.enden[weg.von] = true;
            spur.enden[weg.nach] = true;

            for (const feld of SCHACH.wegFelder(partie.stand, weg.von, weg.nach)) {
                spur.weg[feld] = true;
            }
        }

        /*
         * Fähigkeiten, die nichts bewegen (Schutzschild, Fessel, Verstärkung),
         * bekommen eine eigene Marke — sonst wäre die einzige Spur ein kurzes
         * Aufleuchten, das verpasst, wer gerade nicht hinsieht.
         *
         * Neu erschienene Würfel bekommen KEINE: Sie sind schon als Würfel zu
         * sehen, und eine zweite Marke sähe aus, als wäre gerade etwas mit
         * ihnen passiert.
         */
        if (letzter.wirkung && letzter.wirkung !== "erscheint") {
            for (const feld of (letzter.felder || [])) {
                if (!spur.weg[feld]) {
                    spur.wirkung[feld] = true;
                }
            }
        }

        return spur;
    },

    /*
     * Der Würfel, der eine Fähigkeit auf dem Brett anzeigt.
     *
     * Gezeichnet als SVG statt als Bilddatei: Er hat damit von Haus aus keinen
     * Hintergrund, bleibt auf jeder Feldgröße scharf (von 6 mal 6 bis zum
     * Doppelbrett auf dem Handy) — und er kann seine FARBE aus der
     * Seltenheitsstufe nehmen. Man sieht einem Würfel also schon von weitem an,
     * was er wert ist. Eine Bilddatei je Stufe wäre fünfmal dasselbe Bild in
     * fünf Farben, das jemand pflegen müsste.
     *
     * Die drei Seitenflächen entstehen aus einer Grundfarbe in drei
     * Helligkeiten — deckend, damit auf hellen Feldern nichts durchscheint.
     */
    _wuerfelBauen(stufe, pech) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "wuerfel");
        svg.setAttribute("viewBox", "0 0 100 100");
        svg.setAttribute("aria-hidden", "true");

        const flaechen = [
            /* Oberseite, hell. */
            { punkte: "50,6 92,30 50,54 8,30", ton: 1.35 },
            /* Linke Seite, dunkel. */
            { punkte: "8,30 50,54 50,96 8,72", ton: 0.7 },
            /* Rechte Seite, mittel. */
            { punkte: "92,30 50,54 50,96 92,72", ton: 1 }
        ];

        for (const flaeche of flaechen) {
            const teil = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
            teil.setAttribute("points", flaeche.punkte);
            teil.setAttribute("fill", TEAM_SCHACH._tonAendern(stufe.farbe, flaeche.ton));
            teil.setAttribute("stroke", TEAM_SCHACH._tonAendern(stufe.farbe, 0.45));
            teil.setAttribute("stroke-width", "3");
            teil.setAttribute("stroke-linejoin", "round");
            svg.appendChild(teil);
        }

        /*
         * Das Fragezeichen auf der rechten Seitenfläche — beim Unglückswürfel
         * steht es auf dem Kopf. Ein eigenes Zeichen statt einer anderen Farbe:
         * Die Farbe trägt schon die Seltenheit, und ein umgedrehtes
         * Fragezeichen erkennt man auch auf einem winzigen Feld.
         */
        const zeichen = document.createElementNS("http://www.w3.org/2000/svg", "text");
        zeichen.setAttribute("x", "70");
        zeichen.setAttribute("y", "80");
        zeichen.setAttribute("text-anchor", "middle");
        zeichen.setAttribute("class", "wuerfel-zeichen");
        zeichen.textContent = "?";

        if (pech) {
            zeichen.setAttribute("transform", "rotate(180 70 72)");
        }
        svg.appendChild(zeichen);

        return svg;
    },

    /*
     * Hellt eine Farbe auf oder dunkelt sie ab (Faktor über oder unter 1).
     * Gerechnet statt fünfmal drei Farbwerte von Hand zu pflegen — eine neue
     * Stufe braucht so nur eine einzige Farbe.
     */
    _tonAendern(farbe, faktor) {
        const zahl = parseInt(String(farbe).replace("#", ""), 16);

        const teile = [
            (zahl >> 16) & 255,
            (zahl >> 8) & 255,
            zahl & 255
        ].map((wert) => Math.max(0, Math.min(255, Math.round(wert * faktor))));

        return "rgb(" + teile.join(",") + ")";
    },

    /*
     * Wirkt das volle Glas für diese Seite gerade?
     *
     * Es trübt NUR die Ansicht: Die gegnerischen Figuren sehen aus wie etwas
     * anderes, ziehen aber wie immer. Deshalb steht das hier im Bildschirm-Code
     * und nirgends in den Regeln — `SCHACH.zuege` weiß nichts davon.
     */
    _glasWirkt(partie, meinTeam) {
        return !!meinTeam
            && partie.stand.glasFarbe === meinTeam
            && partie.zugZaehler < partie.stand.glasBis;
    },

    /*
     * Das Zeichen, das eine gegnerische Figur unter dem vollen Glas bekommt.
     * Gerechnet aus Partie, Feld und Figur — also auf jedem Gerät desselben
     * Teams gleich, und über die Partie hinweg stabil: Dieselbe Figur sieht
     * immer gleich falsch aus, sonst wäre es Flackern statt Täuschung.
     */
    /*
     * Welche gefallene Figur liegt auf diesem Feld? (seit v0.54)
     *
     * Liefert die Figurenart oder "". Gefragt wird die Grabliste der Runde —
     * dieselbe, aus der `_zielWirkung` beide Fähigkeiten bedient, damit das
     * blasse Bild und die Regel nicht auseinanderlaufen. Der ZULETZT Gefallene
     * gewinnt: Genau den weckt die Fähigkeit.
     *
     * WESSEN GRÄBER, hängt an der Fähigkeit (seit v0.57): Der Friedhof holt
     * gefallene GEGNER und leiht sie sich; die Wiederbelebung holt die EIGENE
     * Figur endgültig zurück. Zwei Fähigkeiten, dieselbe Frage ans Feld.
     */
    _grabAuf(partie, meinTeam, feld) {
        if (!meinTeam) {
            return "";
        }

        const wessen = (TEAM_SCHACH.zielFaehigkeit === "wiederbelebung")
            ? meinTeam
            : SCHACH.gegner(meinTeam);

        const gefallene = partie.gefallen[wessen] || [];

        for (let stelle = gefallene.length - 1; stelle >= 0; stelle--) {
            if (gefallene[stelle].feld === feld) {
                return gefallene[stelle].art;
            }
        }

        return "";
    },

    _glasZeichen(partie, feld, figur) {
        const arten = ["B", "S", "L", "T", "D"];

        /*
         * DIE FELDNUMMER STEHT VORNE (seit v0.49.1) — und das ist kein Zierat.
         *
         * `_zufallsWert` ist FNV-1a: Ein Unterschied im LETZTEN Zeichen der
         * Saat erlebt nur noch eine Multiplikation und verschiebt das Ergebnis
         * um Bruchteile. Mit `… + "|glas|" + feld` lagen benachbarte Felder
         * praktisch auf demselben Wert: Die Felder 0 bis 9 sahen alle wie ein
         * Springer aus, 10 bis 15 wie ein Turm, und Läufer und Dame kamen als
         * Trugbild überhaupt nie vor. Statt einer Täuschung war es ein Muster.
         *
         * Vorne durchläuft die Zahl alle übrigen Mischschritte. Die Zusage von
         * oben bleibt: dieselbe Partie, dasselbe Feld, dasselbe Trugbild.
         */
        const wert = SCHACH_RUNDE._zufallsWert(feld + "|glas|" + partie.id);
        const art = arten[Math.floor(wert * arten.length) % arten.length];

        return (SCHACH.farbeVon(figur) === "weiss") ? art : art.toLowerCase();
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

    /*
     * Die Schriftgröße der Figuren aus der GEMESSENEN Feldbreite setzen.
     *
     * Die Stildatei rechnet sie sonst aus `88vw` — einer Schätzung der
     * Bildschirmbreite. Die stimmt nicht, sobald das Brett schmaler ausfällt
     * als geschätzt: am Rechner etwa, sobald ein Scrollbalken erscheint. Und
     * genau das passiert MITTEN IM SPIEL, weil der Verlauf mit jedem Zug
     * wächst und die Seite irgendwann über den Bildschirm hinausgeht — die
     * Figuren ändern dann ihre Größe, ohne dass jemand etwas getan hätte.
     *
     * Gemessen kann das nicht passieren: Die Zahl kommt aus dem Feld selbst.
     * Der Rückfall in der Stildatei bleibt für den Augenblick vor der ersten
     * Messung stehen.
     */
    _figurGroesseSetzen() {
        const brett = TEAM_SCHACH.brettEl;
        const zelle = TEAM_SCHACH.feldEl;
        const breite = (zelle && zelle.offsetWidth) ? zelle.offsetWidth : 0;

        if (brett && breite > 0) {
            brett.style.setProperty("--figur-groesse",
                Math.round(breite * TEAM_SCHACH.FIGUR_ANTEIL) + "px");
        }
    },

    /*
     * Lässt die zuletzt gezogene Figur von ihrem alten Feld herüberwandern.
     *
     * Der Weg steht im Verlauf (von/nach), deshalb sehen ALLE die Bewegung —
     * nicht nur derjenige, der gezogen hat. Der Merker `animiertBis`
     * verhindert, dass dieselbe Bewegung bei jedem Neuzeichnen erneut läuft;
     * gezeichnet wird oft, gezogen selten.
     */
    _zugAnimieren(halter, partie, person) {
        /* Derselbe Eintrag wie bei der Spur (seit v0.69) — sonst zeigt die eine
           den Zug und die andere nicht. */
        const letzter = TEAM_SCHACH._letzterBewegungsEintrag(partie);

        if (!letzter || !Number.isInteger(letzter.von) || letzter.von < 0
            || letzter.nach < 0) {
            TEAM_SCHACH.animiertBis[partie.id] = partie.zugZaehler;
            return;
        }
        if (TEAM_SCHACH.animiertBis[partie.id] === partie.zugZaehler) {
            return;
        }
        TEAM_SCHACH.animiertBis[partie.id] = partie.zugZaehler;

        const zelle = halter.querySelector("[data-feld=\"" + letzter.nach + "\"]");
        const figurEl = zelle ? zelle.querySelector(".figur") : null;
        if (!figurEl) {
            return;
        }

        const groesse = zelle.offsetWidth;
        if (!groesse) {
            /* Der Tab liegt im Hintergrund — dann gibt es nichts zu sehen. */
            return;
        }

        const breite = SCHACH.breiteVon(partie.stand);
        const gedreht = (SCHACH_RUNDE.teamVon(partie, person.id) === "schwarz");
        const richtung = gedreht ? -1 : 1;

        const dSpalte = (SCHACH.spalteVon(letzter.von, breite)
            - SCHACH.spalteVon(letzter.nach, breite)) * richtung;
        const dReihe = (SCHACH.reiheVon(letzter.von, breite)
            - SCHACH.reiheVon(letzter.nach, breite)) * richtung;

        figurEl.style.transform = "translate(" + (dSpalte * groesse) + "px, "
            + (dReihe * groesse) + "px)";
        /* Die wandernde Figur liegt über ihren Nachbarfeldern. */
        zelle.classList.add("feld-zieht");

        /* Zwei Bilder warten: Das erste setzt den Startpunkt, erst danach darf
           der Übergang eingeschaltet werden — sonst springt die Figur. */
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                figurEl.classList.add("figur-zieht");
                figurEl.style.transform = "";
            });
        });

        window.setTimeout(() => zelle.classList.remove("feld-zieht"),
            TEAM_SCHACH.ANIMATION_MS + 60);
    },

});
