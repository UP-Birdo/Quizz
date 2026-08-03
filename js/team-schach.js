/*
 * team-schach.js — der Tab "Team Schach": Übersicht, Brett und Teams.
 *
 * Zwei Ansichten in einem Tab:
 *
 *   ÜBERSICHT  Alle Partien untereinander mit ihrem Stand. Von hier aus wird
 *              eine Partie geöffnet oder eine neue angelegt (mit Auswahl der
 *              Spielart).
 *   PARTIE     Genau eine Partie mit Brett, Teams, Fähigkeiten und Verlauf.
 *              Dieser Bildschirm ist für das Handy gebaut: eine Spalte, das
 *              Brett so breit wie möglich, alles Weitere darunter.
 *
 * Umgeschaltet wird über `offeneId` — mehr Zustand braucht es nicht, weil
 * jede Ansicht bei jeder Änderung vollständig neu entsteht.
 *
 * So läuft eine Partie:
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
 * Teams und der Ablauf einer Partie in schach-runde.js, die Sammlung aller
 * Partien in schach-tafel.js.
 *
 * DER BILDSCHIRM LIEGT IN VIER DATEIEN
 * TEAM_SCHACH war eine einzige Datei mit rund 2500 Zeilen — zu lang, um sie
 * beim Suchen noch am Stück zu überblicken. Seit v3.2 ist sie aufgeteilt:
 *
 *     team-schach.js              dieser Kern: Zustand, Zeichnen, Partie-Kopf,
 *                                 Teams, Bedienung, Senden, Bausteine
 *     team-schach-uebersicht.js   Liste aller Partien, Auswahl der Spielart
 *     team-schach-brett.js        Brett, Pfeil, Würfel, Abstimmung, Bewegung
 *     team-schach-auswertung.js   Abschluss, Fähigkeiten-Übersicht, Bilanz
 *
 * Die drei anderen ERGÄNZEN dieses eine Objekt (`Object.assign(TEAM_SCHACH, …)`)
 * und werden in index.html NACH dieser Datei geladen. Gewählt wurde dieser Weg,
 * weil er nichts am Verhalten ändert: Jeder Aufruf heißt weiter
 * `TEAM_SCHACH._brettBauen(…)`, egal in welcher Datei die Funktion steht. Vier
 * Objekte mit vier Namen hätten dieselbe Aufteilung erkauft, dafür aber jede
 * Aufrufstelle im Projekt angefasst — bei laufenden Partien das grössere Risiko.
 */

const TEAM_SCHACH = {

    id: "team-schach",
    titel: "Team Schach",

    /* Wird von app.js gesetzt. */
    abgleich: null,

    wurzelEl: null,

    /* Kennung der geöffneten Partie; "" heißt Übersicht. */
    offeneId: "",

    /* Ist die Auswahl der Spielart offen? Sie liegt VOR der Übersicht. */
    auswahlOffen: false,

    /* Ist die Fähigkeiten-Übersicht offen (hinter dem i)? */
    infoOffen: false,

    /* Zeitgeber für den Countdown einer laufenden Abstimmung. */
    fristZeitgeber: null,

    /*
     * Die Einstellungen für die NÄCHSTE Partie. Sie leben nur, solange die
     * Auswahl offen ist; mit dem Anlegen wandern sie in die Partie und stehen
     * dort fest.
     */
    neueRegeln: {
        faehigkeiten: false,
        seltenheitZeigen: false,
        einigkeit: false
    },

    /* Gerade angetipptes Feld (Feldnummer) oder -1. */
    gewaehltesFeld: -1,

    /* Zielfelder zum gewählten Feld, als Feldnummern. */
    moeglicheZiele: [],

    /*
     * Rochade über den Turm: Turmfeld -> Zielfeld des Königs.
     *
     * Am echten Brett fasst man beide Figuren an, deshalb tippen viele den Turm
     * an, wenn sie rochieren wollen. Der König zwei Felder zur Seite bleibt
     * möglich; das hier ist der zweite Weg zum selben Zug.
     */
    rochadeZiele: {},

    /*
     * Fähigkeit, die gerade auf ein Zielfeld wartet ("" = keine), und die
     * Felder, die dafür in Frage kommen. Beides nur auf diesem Gerät — der
     * gemeinsame Stand erfährt erst vom Einsatz, wenn er feststeht.
     */
    zielFaehigkeit: "",
    zielFelder: [],

    /* Bis zu welchem Zugzähler die Wirkung einer Fähigkeit gezeigt wurde. */
    wirkungBis: {},

    /*
     * Der Abschluss einer Partie: { id, schritt }.
     * schritt 1 = Sieg oder Niederlage, schritt 2 = Punktestand.
     * Nur auf diesem Gerät — der gemeinsame Stand weiß davon nichts.
     */
    abschluss: null,

    /* Welche Abschlüsse dieses Gerät schon gesehen hat, steht im
       Gerätespeicher (ICH.abschlussGesehen) — sonst käme der Sieger-Bildschirm
       nach jedem Neuladen erneut. */

    /*
     * VORZÜGE GIBT ES NICHT MEHR (ausgebaut in v2.8).
     *
     * Sie waren in v2.5 gebaut: ein Zug, den man einträgt, während der Gegner
     * dran ist, ausgeführt sobald das eigene Team am Zug ist. In der Praxis lief
     * das nicht rund — der Zug sprang los, während man noch aufs Brett schaute,
     * und die Vormerkung war nach jedem Neuladen weg.
     *
     * Wer es später erneut versucht, findet die Begründung in
     * docs\DECISIONS.md. Wichtig bleibt dort die eine Festlegung: Ein Vorzug
     * darf NIE in den gemeinsamen Stand — sonst liest der Gegner ihn in der
     * offenen Datenbank mit.
     */

    /* Verhindert zwei Züge gleichzeitig vom selben Gerät. */
    ziehtGerade: false,

    /*
     * Bis zu welchem Zugzähler eine Partie schon animiert wurde, je Kennung.
     * Ohne diesen Merker liefe die Bewegung bei jedem Neuzeichnen erneut —
     * und die Abfrage zeichnet oft.
     */
    animiertBis: {},

    /* Dauer der Zugbewegung in Millisekunden; muss zur Stildatei passen. */
    ANIMATION_MS: 260,

    /* Dauer des Aufleuchtens bei einer Fähigkeit; ebenfalls in der Stildatei. */
    WIRKUNG_MS: 900,

    /*
     * Halbmesser einer Figur in Feldbreiten — so groß ist das Loch, das eine
     * Figur ZWISCHEN Start und Ziel in die Pfeilmaske stanzt.
     */
    FIGUR_RADIUS: 0.42,

    /*
     * Wie weit der Pfeil vor der Feldmitte anfängt und aufhört. Kleiner als
     * der Figurenradius: Der Pfeil rückt näher an die Figuren heran und bleibt
     * dabei an beiden Enden vollständig sichtbar.
     */
    PFEIL_ABSTAND: 0.3,

    verbinden(abgleich) {
        TEAM_SCHACH.abgleich = abgleich;
    },

    aufbauen(behaelter) {
        TEAM_SCHACH.wurzelEl = document.createElement("div");
        TEAM_SCHACH.wurzelEl.className = "schach";
        behaelter.appendChild(TEAM_SCHACH.wurzelEl);
    },

    /*
     * Wird bei jedem Wechsel auf diesen Tab gerufen. Nötig, weil der Stand
     * längst geladen sein kann, bevor es diesen Bereich überhaupt gibt — dann
     * bliebe der Tab sonst leer (siehe tabs.js).
     */
    beimOeffnen() {
        if (TEAM_SCHACH.abgleich) {
            TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
        }
    },

    /* Wer sitzt an diesem Gerät? Die Anmeldung läuft über den Würfel-Quizz. */
    _ich() {
        return ICH.person();
    },

    /* ---------------------------------------------------------------- *
     * Zeichnen
     * ---------------------------------------------------------------- */

    zeichnen(tafel) {
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

        if (TEAM_SCHACH.infoOffen) {
            TEAM_SCHACH._infoZeichnen(wurzel);
            return;
        }

        if (TEAM_SCHACH.auswahlOffen) {
            TEAM_SCHACH._auswahlZeichnen(wurzel);
            return;
        }

        /*
         * Ist eine Partie zu Ende gegangen, in der dieses Gerät mitgespielt
         * hat, kommt der Abschluss von selbst — egal, ob die Partie gerade
         * offen ist oder man in der Übersicht steht.
         *
         * Bis v2.5 hing er an der geöffneten Partie. Wer beim letzten Zug
         * gerade in der Übersicht war (oder erst Stunden später wiederkam),
         * bekam ihn nie zu sehen: Beendete Partien liegen seither zugeklappt
         * unter „Beendet", und niemand sucht dort nach einem Sieg.
         */
        if (!TEAM_SCHACH.abschluss) {
            const fertig = SCHACH_TAFEL.liste(tafel).find((partie) =>
                partie.ergebnis
                && !ICH.abschlussGesehen(partie.id)
                && SCHACH_RUNDE.teamVon(partie, person.id));

            if (fertig) {
                TEAM_SCHACH.abschluss = { id: fertig.id, schritt: 1 };
            }
        }

        if (TEAM_SCHACH.abschluss) {
            const partie = SCHACH_TAFEL.partie(tafel, TEAM_SCHACH.abschluss.id);

            if (partie && partie.ergebnis) {
                TEAM_SCHACH._abschlussZeichnen(wurzel, partie, person);
                return;
            }
            TEAM_SCHACH.abschluss = null;
        }

        const offene = TEAM_SCHACH.offeneId
            ? SCHACH_TAFEL.partie(tafel, TEAM_SCHACH.offeneId)
            : null;

        if (offene) {
            TEAM_SCHACH._partieZeichnen(wurzel, offene, person);
        } else {
            /* Die Partie kann inzwischen gelöscht worden sein. */
            TEAM_SCHACH.offeneId = "";
            TEAM_SCHACH._uebersichtZeichnen(wurzel, tafel, person);
        }
    },

    /* ---------------------------------------------------------------- *
     * Eine Partie
     * ---------------------------------------------------------------- */

    _partieZeichnen(wurzel, partie, person) {
        wurzel.appendChild(TEAM_SCHACH._partieKopfBauen(partie));
        wurzel.appendChild(TEAM_SCHACH._standLeisteBauen(partie, person));
        wurzel.appendChild(TEAM_SCHACH._teamsBauen(partie, person));

        const halter = TEAM_SCHACH._brettBauen(partie, person);
        wurzel.appendChild(halter);

        const koennen = TEAM_SCHACH._faehigkeitenBauen(partie, person);
        if (koennen) {
            wurzel.appendChild(koennen);
        }

        wurzel.appendChild(TEAM_SCHACH._verlaufBauen(partie));
        wurzel.appendChild(TEAM_SCHACH._fussleisteBauen(partie, person));

        /* Erst wenn das Brett im Bildschirm steht, lässt sich die Feldgröße
           messen — deshalb steht die Bewegung ganz am Ende. */
        TEAM_SCHACH._zugAnimieren(halter, partie, person);
        TEAM_SCHACH._wirkungAnimieren(halter, partie);

    },

    /*
     * Lässt die Felder aufleuchten, auf die eine Fähigkeit gewirkt hat.
     *
     * Wie bei der Zugbewegung stehen die betroffenen Felder im Verlauf —
     * deshalb sieht JEDES Gerät die Wirkung, nicht nur das auslösende. Eine
     * Fähigkeit, die nur der Auslöser sieht, wäre die falsche Lösung: Der
     * Gegner müsste sonst raten, warum plötzlich eine Figur woanders steht.
     */
    _wirkungAnimieren(halter, partie) {
        const letzter = partie.verlauf[partie.verlauf.length - 1];

        if (!letzter || !letzter.wirkung || letzter.felder.length === 0) {
            TEAM_SCHACH.wirkungBis[partie.id] = partie.zugZaehler;
            return;
        }
        if (TEAM_SCHACH.wirkungBis[partie.id] === partie.zugZaehler) {
            return;
        }
        TEAM_SCHACH.wirkungBis[partie.id] = partie.zugZaehler;

        const klasse = (letzter.wirkung === "pech") ? "feld-wirkung-pech" : "feld-wirkung";

        for (const feld of letzter.felder) {
            const zelle = halter.querySelector("[data-feld=\"" + feld + "\"]");
            if (!zelle) {
                continue;
            }
            zelle.classList.add(klasse);
            window.setTimeout(() => zelle.classList.remove(klasse),
                TEAM_SCHACH.WIRKUNG_MS + 60);
        }
    },

    _partieKopfBauen(partie) {
        const kopf = TEAM_SCHACH._element("div", "partie-kopf");

        kopf.appendChild(TEAM_SCHACH._knopf("Zurück", "knopf-still knopf-klein",
            () => TEAM_SCHACH.uebersichtOeffnen()));
        kopf.appendChild(TEAM_SCHACH._element("h2", "partie-titel", partie.titel));
        kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-offen",
            SCHACH_RUNDE.varianteVon(partie).titel));

        return kopf;
    },

    /*
     * Die Leiste über dem Brett: wer am Zug ist, ob Schach steht, welche
     * Fähigkeiten wirken. Sie trägt `stand-leiste` und klebt damit beim
     * Scrollen oben fest — auf dem Handy sieht man sonst nur noch das Brett und
     * weiß nicht mehr, wer dran ist.
     */
    _standLeisteBauen(partie, person) {
        const leiste = TEAM_SCHACH._element("div", "phasen-leiste stand-leiste");
        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);

        if (partie.ergebnis) {
            const text = (partie.ergebnis === "remis")
                ? "Unentschieden"
                : ((partie.ergebnis === "weiss") ? "Weiss gewinnt" : "Schwarz gewinnt");
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-fertig", text));
        } else if (partie.laeuft) {
            const amZug = (partie.stand.amZug === "weiss") ? "Weiss" : "Schwarz";
            const dran = (meinTeam === partie.stand.amZug);
            leiste.appendChild(TEAM_SCHACH._element(
                "span",
                "chip " + (dran ? "chip-fertig" : "chip-laeuft"),
                dran ? "Dein Team ist am Zug" : amZug + " ist am Zug"
            ));
        } else {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-offen",
                "Noch nicht gestartet"));
        }

        if (partie.laeuft && SCHACH.imSchach(partie.stand, partie.stand.amZug)) {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-fehler", "Schach"));
        }

        /* Aktive Fähigkeiten sichtbar machen — sonst wundert sich der Gegner
           über einen Zug, den es sonst nicht gibt. */
        if (partie.stand.sprungAktiv) {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-laeuft",
                "Sprung aktiv: " + ((partie.stand.sprungAktiv === "weiss") ? "Weiss" : "Schwarz")));
        }
        if (partie.stand.extraZug) {
            leiste.appendChild(TEAM_SCHACH._element("span", "chip chip-laeuft",
                "Doppelzug: " + ((partie.stand.extraZug === "weiss") ? "Weiss" : "Schwarz")));
        }

        leiste.appendChild(TEAM_SCHACH._element("span", "phasen-text",
            "Zug " + partie.stand.zugNummer));

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Teams
     * ---------------------------------------------------------------- */

    _teamsBauen(partie, person) {
        const bereich = TEAM_SCHACH._element("div", "team-reihe");
        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);

        for (const farbe of ["weiss", "schwarz"]) {
            const karte = TEAM_SCHACH._element("section",
                "karte team-karte" + (meinTeam === farbe ? " team-karte-meine" : ""));

            const kopf = TEAM_SCHACH._element("div", "karte-kopf");
            kopf.appendChild(TEAM_SCHACH._element("h3", "",
                (farbe === "weiss") ? "Weiss" : "Schwarz"));

            if (partie.bereit[farbe]) {
                kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-fertig", "bereit"));
            }
            karte.appendChild(kopf);

            /* Namen der Mitspieler — aufgelöst über die Runde des Würfel-Quizz,
               weil dort die Namen stehen. */
            const namen = partie.teams[farbe].map((id) => TEAM_SCHACH._nameVon(id));
            karte.appendChild(TEAM_SCHACH._element("p", "team-namen",
                namen.length > 0 ? namen.join(", ") : "noch niemand"));

            const leiste = TEAM_SCHACH._element("div", "karte-fuss");

            if (meinTeam === farbe) {
                leiste.appendChild(TEAM_SCHACH._knopf("Team verlassen", "knopf-still knopf-klein",
                    () => TEAM_SCHACH.teamVerlassen(partie)));

                if (!partie.laeuft && !partie.ergebnis) {
                    leiste.appendChild(TEAM_SCHACH._knopf(
                        partie.bereit[farbe] ? "Doch nicht bereit" : "Bereit",
                        partie.bereit[farbe] ? "knopf-still knopf-klein" : "knopf-haupt",
                        () => TEAM_SCHACH.bereitUmschalten(partie, farbe, !partie.bereit[farbe])
                    ));
                }
            } else {
                leiste.appendChild(TEAM_SCHACH._knopf("Mitspielen", "knopf-still knopf-klein",
                    () => TEAM_SCHACH.teamBeitreten(partie, farbe)));
            }

            karte.appendChild(leiste);
            bereich.appendChild(karte);
        }

        /* Wer noch in keinem Team ist, kann sich auch würfeln lassen. */
        if (!meinTeam && !partie.ergebnis) {
            const zufall = TEAM_SCHACH._element("div", "fussleiste");
            zufall.appendChild(TEAM_SCHACH._knopf("Zufällig zuteilen",
                "knopf-still knopf-klein",
                () => TEAM_SCHACH.zufaelligBeitreten(partie)));
            bereich.appendChild(zufall);
        }

        return bereich;
    },

    /*
     * Zufällig einem Team beitreten — aber nur dann zufällig, wenn beide
     * gleich besetzt sind. Steht ein Team leer, geht es dorthin: Eine Partie
     * mit vier gegen null fängt nie an.
     */
    zufaelligBeitreten(partie) {
        const leer = ["weiss", "schwarz"].filter(
            (farbe) => partie.teams[farbe].length === 0);

        let farbe;
        if (leer.length === 1) {
            farbe = leer[0];
        } else if (partie.teams.weiss.length !== partie.teams.schwarz.length) {
            /* Sonst in das kleinere Team — das hält die Seiten im Gleichgewicht. */
            farbe = (partie.teams.weiss.length < partie.teams.schwarz.length)
                ? "weiss" : "schwarz";
        } else {
            farbe = (Math.random() < 0.5) ? "weiss" : "schwarz";
        }

        TEAM_SCHACH.teamBeitreten(partie, farbe);
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
     * Fussleiste der Partie
     * ---------------------------------------------------------------- */

    _fussleisteBauen(partie, person) {
        const leiste = TEAM_SCHACH._element("div", "fussleiste");
        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);

        if (partie.ergebnis) {
            leiste.appendChild(TEAM_SCHACH._knopf("Neu aufstellen", "knopf-haupt",
                () => TEAM_SCHACH.neuAufstellen(partie)));
        } else if (partie.laeuft && meinTeam) {
            leiste.appendChild(TEAM_SCHACH._knopf("Aufgeben", "knopf-gefahr knopf-klein",
                () => TEAM_SCHACH.aufgeben(partie, meinTeam)));
        }

        leiste.appendChild(TEAM_SCHACH._knopf("Umbenennen", "knopf-still knopf-klein",
            () => TEAM_SCHACH.umbenennen(partie)));

        if (!partie.ergebnis) {
            leiste.appendChild(TEAM_SCHACH._knopf("Partie zurücksetzen", "knopf-still knopf-klein",
                () => TEAM_SCHACH.neuAufstellen(partie)));
        }

        leiste.appendChild(TEAM_SCHACH._knopf("Zur Übersicht", "knopf-still knopf-klein",
            () => TEAM_SCHACH.uebersichtOeffnen()));

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Bedienung
     * ---------------------------------------------------------------- */

    partieOeffnen(id) {
        TEAM_SCHACH.offeneId = id;
        TEAM_SCHACH._auswahlAufheben();

        /* Beim Öffnen wird nicht animiert: Der letzte Zug liegt womöglich
           Stunden zurück. */
        const partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, id);
        if (partie) {
            TEAM_SCHACH.animiertBis[id] = partie.zugZaehler;
            TEAM_SCHACH.wirkungBis[id] = partie.zugZaehler;
        }

        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    uebersichtOeffnen() {
        TEAM_SCHACH.offeneId = "";
        TEAM_SCHACH._auswahlAufheben();
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    feldAngetippt(partie, person, feld) {
        if (!SCHACH_RUNDE.darfZiehen(partie, person.id)) {
            return;
        }

        /* Wartet eine Fähigkeit auf ihr Ziel, gilt jeder Tipp ihr. */
        if (TEAM_SCHACH.zielFaehigkeit) {
            if (TEAM_SCHACH.zielFelder.indexOf(feld) === -1) {
                return;
            }
            TEAM_SCHACH.faehigkeitAusfuehren(partie, TEAM_SCHACH.zielFaehigkeit, feld);
            return;
        }

        /* Zweiter Tipp auf ein mögliches Ziel: ziehen. */
        if (TEAM_SCHACH.gewaehltesFeld !== -1
            && TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
            TEAM_SCHACH.zugAusfuehren(partie, TEAM_SCHACH.gewaehltesFeld, feld);
            return;
        }

        /* Tipp auf den eigenen Turm, während der König gewählt ist: rochieren. */
        if (TEAM_SCHACH.gewaehltesFeld !== -1
            && TEAM_SCHACH.rochadeZiele[feld] !== undefined) {
            TEAM_SCHACH.zugAusfuehren(partie, TEAM_SCHACH.gewaehltesFeld,
                TEAM_SCHACH.rochadeZiele[feld]);
            return;
        }

        const figur = SCHACH.figurAuf(partie.stand, feld);

        /* Eigene Figur antippen: auswählen (oder Auswahl aufheben). */
        if (SCHACH.farbeVon(figur) === partie.stand.amZug) {
            if (TEAM_SCHACH.gewaehltesFeld === feld) {
                TEAM_SCHACH._auswahlAufheben();
            } else {
                TEAM_SCHACH._auswaehlen(partie, feld);
            }
        } else {
            TEAM_SCHACH._auswahlAufheben();
        }

        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },


    /* Merkt sich die angetippte Figur samt ihren Zielen. */
    _auswaehlen(partie, feld) {
        const zuege = SCHACH.zuege(partie.stand, feld);

        TEAM_SCHACH.gewaehltesFeld = feld;
        TEAM_SCHACH.moeglicheZiele = zuege
            .map((zug) => zug.nach)
            .filter((ziel, stelle, alle) => alle.indexOf(ziel) === stelle);

        /* Zu jedem möglichen Rochadezug auch das Turmfeld anklickbar machen. */
        TEAM_SCHACH.rochadeZiele = {};

        if (SCHACH.artVon(SCHACH.figurAuf(partie.stand, feld)) === "K") {
            const lage = SCHACH.rochadeLage(partie.stand, partie.stand.amZug);

            for (const eintrag of lage) {
                if (eintrag.moeglich) {
                    TEAM_SCHACH.rochadeZiele[eintrag.turmFeld] = eintrag.zielFeld;
                }
            }
        }
    },

    _auswahlAufheben() {
        TEAM_SCHACH.gewaehltesFeld = -1;
        TEAM_SCHACH.moeglicheZiele = [];
        TEAM_SCHACH.rochadeZiele = {};
        TEAM_SCHACH.zielFaehigkeit = "";
        TEAM_SCHACH.zielFelder = [];
    },

    /*
     * Führt den Zug aus und schreibt ihn sofort.
     *
     * Vor dem Schreiben wird der Stand vom Server geholt und der Zugzähler
     * verglichen: Hat in der Zwischenzeit jemand aus dem eigenen Team gezogen,
     * gilt dessen Zug — wer zuerst drückt, hat gezogen. Der eigene Zug wird
     * dann verworfen, statt den fremden zu überschreiben.
     */
    async zugAusfuehren(partie, von, nach) {
        if (TEAM_SCHACH.ziehtGerade) {
            return;
        }
        TEAM_SCHACH.ziehtGerade = true;

        try {
            const person = TEAM_SCHACH._ich();
            const stand = partie.stand;

            /* Umwandlung: nur bei einem Bauern auf die letzte Reihe fragen. */
            let umwandlung = "D";
            const figur = SCHACH.figurAuf(stand, von);
            const breite = SCHACH.breiteVon(stand);
            const letzteReihe = (stand.amZug === "weiss") ? 0 : SCHACH.hoeheVon(stand) - 1;

            if (SCHACH.artVon(figur) === "B" && SCHACH.reiheVon(nach, breite) === letzteReihe) {
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
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                    return;
                }
                umwandlung = wahl;
            }

            /* Braucht die Partie Einigkeit, wird der Zug erst vorgeschlagen.
               Ist man allein im Team, zieht `zugVorschlagen` sofort. */
            const neu = SCHACH_RUNDE.brauchtEinigkeit(partie)
                ? SCHACH_RUNDE.zugVorschlagen(
                    partie, person.id, von, nach, umwandlung, person.name)
                : SCHACH_RUNDE.ziehen(
                    partie, person.id, von, nach, umwandlung, person.name);

            if (!neu) {
                TEAM_SCHACH._auswahlAufheben();
                TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                return;
            }

            TEAM_SCHACH._auswahlAufheben();
            await TEAM_SCHACH._sendenMitPruefung(neu, partie.zugZaehler);
        } finally {
            TEAM_SCHACH.ziehtGerade = false;
        }
    },

    /*
     * Schreibt EINE Partie in die Tafel, aber nur wenn ihr Zugzähler auf dem
     * Server noch der erwartete ist. So gewinnt bei zwei gleichzeitigen Zügen
     * der erste.
     *
     * Geschrieben wird immer der Stand vom Server mit der eigenen Partie
     * darin — nie die eigene Tafel als Ganzes. Sonst verschwänden Partien, die
     * inzwischen woanders angelegt wurden (dieselbe Lehre wie beim
     * Würfel-Quizz, siehe docs\DECISIONS.md).
     */
    async _sendenMitPruefung(neuePartie, erwarteterZaehler) {
        const abgleich = TEAM_SCHACH.abgleich;

        try {
            let tafel = abgleich.daten;

            if (abgleich.speicher.art === "gemeinsam") {
                const fremd = SCHACH_TAFEL.normalisieren(await abgleich.speicher.laden());
                const fremdePartie = fremd.partien[neuePartie.id];

                if (fremdePartie && fremdePartie.zugZaehler !== erwarteterZaehler) {
                    abgleich.daten = fremd;
                    TEAM_SCHACH.zeichnen(fremd);
                    await DIALOG.hinweis(
                        "Jemand war schneller",
                        "Aus deinem Team hat gerade schon jemand gezogen. Dein Zug "
                            + "wurde deshalb nicht ausgeführt."
                    );
                    return false;
                }
                tafel = fremd;
            }

            const neueTafel = SCHACH_TAFEL.partieEinsetzen(tafel, neuePartie);
            await abgleich.speicher.speichern(neueTafel);
            abgleich.daten = neueTafel;
            TEAM_SCHACH.zeichnen(neueTafel);
            return true;
        } catch (fehler) {
            await DIALOG.hinweis("Nicht gespeichert",
                "Die Änderung konnte nicht gesendet werden: " + fehler.message);
            return false;
        }
    },

    /* ---------------------------------------------------------------- *
     * Aktionen rund um die Partie
     * ---------------------------------------------------------------- */

    /* Der Knopf "Neue Partie" führt in die Auswahl der Spielart. */
    partieAnlegen() {
        if (!TEAM_SCHACH._ich()) {
            return;
        }
        TEAM_SCHACH.auswahlOffen = true;
        TEAM_SCHACH.offeneId = "";

        /* Jede neue Partie fängt mit den Vorgaben an. */
        TEAM_SCHACH.neueRegeln = {
            faehigkeiten: false,
            seltenheitZeigen: false,
            einigkeit: false
        };

        TEAM_SCHACH._auswahlAufheben();
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    auswahlSchliessen() {
        TEAM_SCHACH.auswahlOffen = false;
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
    },

    /* Eine Kachel wurde angetippt: Namen erfragen und die Partie anlegen. */
    async spielartGewaehlt(varianteId) {
        const person = TEAM_SCHACH._ich();
        if (!person || !SCHACH_VARIANTEN.gibtEs(varianteId)) {
            return;
        }

        const titel = await DIALOG.eingabe(
            "Name der Partie",
            "Damit ihr sie in der Übersicht wiederfindet.",
            SCHACH_VARIANTEN.holen(varianteId).titel,
            "Anlegen",
            true
        );
        if (titel === null) {
            return;
        }

        /* Angelegt wird auf dem Stand vom Server, damit keine fremde Partie
           verloren geht. */
        const abgleich = TEAM_SCHACH.abgleich;
        let tafel = abgleich.daten;

        try {
            if (abgleich.speicher.art === "gemeinsam") {
                tafel = SCHACH_TAFEL.normalisieren(await abgleich.speicher.laden());
            }
        } catch (fehler) {
            await DIALOG.hinweis("Nicht angelegt",
                "Der aktuelle Stand konnte nicht geladen werden: " + fehler.message);
            return;
        }

        /* Die Spielart „Fähigkeiten sammeln“ hat sie ohnehin an; für alle
           anderen entscheidet der Schalter. */
        const regeln = {
            faehigkeiten: TEAM_SCHACH.neueRegeln.faehigkeiten
                || !!SCHACH_VARIANTEN.holen(varianteId).faehigkeiten,
            seltenheitZeigen: TEAM_SCHACH.neueRegeln.seltenheitZeigen,
            einigkeit: TEAM_SCHACH.neueRegeln.einigkeit
        };

        const ergebnis = SCHACH_TAFEL.partieAnlegen(
            tafel, varianteId, titel, undefined, regeln);

        /*
         * Wer anlegt, spielt mit: Er kommt gleich ins weisse Team und landet
         * direkt in der Partie. Vorher musste man erst zurück in die Übersicht,
         * die eigene Partie suchen und dort beitreten.
         */
        ergebnis.tafel = SCHACH_TAFEL.partieEinsetzen(
            ergebnis.tafel,
            SCHACH_RUNDE.teamBeitreten(ergebnis.partie, person.id, "weiss"));

        try {
            await abgleich.speicher.speichern(ergebnis.tafel);
            abgleich.daten = ergebnis.tafel;
            TEAM_SCHACH.partieOeffnen(ergebnis.partie.id);
        } catch (fehler) {
            await DIALOG.hinweis("Nicht angelegt",
                "Die Partie konnte nicht gespeichert werden: " + fehler.message);
        }
    },

    /*
     * Löschen ist der Verwaltung vorbehalten (seit v3.3).
     *
     * Die Punkte einer beendeten Partie sind zwar in der Chronik festgeschrieben
     * und überleben das Löschen — eine LAUFENDE Partie ist aber unwiederbringlich
     * weg, mitsamt der Arbeit aller Beteiligten. Bis v3.2 reichte dafür ein
     * Fehlgriff auf einem fremden Handy.
     */
    async partieLoeschen(partie) {
        const darf = await VERWALTUNG.verlangen(
            "Partie löschen",
            "Eine laufende Partie ist danach für alle weg — auch für die, die "
                + "gerade mitspielen. Das darf nur, wer das Passwort kennt."
        );
        if (!darf) {
            return;
        }

        const ja = await DIALOG.frage(
            "Partie löschen?",
            "Die Partie " + partie.titel + " wird für alle entfernt. Das lässt sich "
                + "nicht rückgängig machen.",
            "Löschen",
            true
        );
        if (!ja) {
            return;
        }

        const abgleich = TEAM_SCHACH.abgleich;
        let tafel = abgleich.daten;

        try {
            if (abgleich.speicher.art === "gemeinsam") {
                tafel = SCHACH_TAFEL.normalisieren(await abgleich.speicher.laden());
            }
            const neueTafel = SCHACH_TAFEL.partieEntfernen(tafel, partie.id);
            await abgleich.speicher.speichern(neueTafel);
            abgleich.daten = neueTafel;

            if (TEAM_SCHACH.offeneId === partie.id) {
                TEAM_SCHACH.offeneId = "";
            }
            TEAM_SCHACH.zeichnen(neueTafel);
        } catch (fehler) {
            await DIALOG.hinweis("Nicht gelöscht",
                "Die Partie konnte nicht entfernt werden: " + fehler.message);
        }
    },

    async umbenennen(partie) {
        const titel = await DIALOG.eingabe(
            "Partie umbenennen",
            "Wie soll die Partie in der Übersicht heißen?",
            partie.titel,
            "Übernehmen",
            true
        );
        if (titel === null || titel.trim() === "") {
            return;
        }
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.umbenennen(partie, titel),
            partie.zugZaehler
        );
    },

    async teamBeitreten(partie, farbe) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }
        TEAM_SCHACH._auswahlAufheben();
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.teamBeitreten(partie, person.id, farbe),
            partie.zugZaehler
        );
    },

    async teamVerlassen(partie) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }
        TEAM_SCHACH._auswahlAufheben();
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.teamVerlassen(partie, person.id),
            partie.zugZaehler
        );
    },

    async bereitUmschalten(partie, farbe, bereit) {
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.bereitSetzen(partie, farbe, bereit),
            partie.zugZaehler
        );
    },

    /*
     * Der Knopf an einer Fähigkeit. Braucht sie ein Ziel, wird hier nur der
     * Auswahl-Zustand gesetzt — der Einsatz folgt beim Antippen des Feldes.
     */
    async faehigkeitEinsetzen(partie, art) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }

        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        if (!beschreibung) {
            return;
        }

        /*
         * Der Händler fragt anders: Er zeigt sein Angebot, statt nur zu
         * erklären, was die Fähigkeit tut. Wer ablehnt, behält sie — das
         * Angebot ändert sich mit dem nächsten Zug von selbst.
         */
        if (beschreibung.art === "handel") {
            await TEAM_SCHACH.handelAnbieten(partie, person, art);
            return;
        }

        const ja = await DIALOG.frage(
            SCHACH_VARIANTEN.faehigkeitTitel(art) + " einsetzen?",
            SCHACH_VARIANTEN.faehigkeitBeschreibung(art)
                + "\n\nSie ist danach verbraucht."
                + (beschreibung.beendetZug
                    ? " Und sie kostet den ganzen Zug: Danach ist der Gegner dran."
                    : ""),
            "Einsetzen",
            false
        );
        if (!ja) {
            return;
        }

        if (beschreibung.art === "ziel") {
            const felder = SCHACH_RUNDE.zielFelder(partie, person.id, art);

            if (felder.length === 0) {
                await DIALOG.hinweis("Kein Ziel möglich",
                    "Für " + SCHACH_VARIANTEN.faehigkeitTitel(art)
                        + " gibt es auf diesem Brett gerade kein gültiges Feld. "
                        + "Die Fähigkeit bleibt dir erhalten.");
                return;
            }

            TEAM_SCHACH.gewaehltesFeld = -1;
            TEAM_SCHACH.moeglicheZiele = [];
            TEAM_SCHACH.rochadeZiele = {};
            TEAM_SCHACH.zielFaehigkeit = art;
            TEAM_SCHACH.zielFelder = felder;
            TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
            return;
        }

        await TEAM_SCHACH.faehigkeitAusfuehren(partie, art, -1);
    },

    /*
     * Das Angebot des Händlers zeigen und annehmen lassen.
     *
     * Es steht ausdrücklich da, WAS weggeht und WO das Neue erscheint — sonst
     * verschwinden fünf Bauern, und niemand weiss, welche. Abgelehnt kostet es
     * nichts: Die Fähigkeit bleibt im Vorrat.
     */
    async handelAnbieten(partie, person, art) {
        const farbe = SCHACH_RUNDE.teamVon(partie, person.id);
        const angebot = SCHACH_RUNDE.handelsAngebot(partie, farbe);

        if (!angebot) {
            await DIALOG.hinweis("Der Händler hat nichts für dich",
                "Für sein heutiges Angebot fehlen dir die passenden Figuren — oder "
                + "es ist kein Platz für das, was du bekämst. Nach dem nächsten Zug "
                + "bietet er etwas anderes an. Die Fähigkeit bleibt dir erhalten.");
            return;
        }

        const breite = SCHACH.breiteVon(partie.stand);
        const hoehe = SCHACH.hoeheVon(partie.stand);
        const namen = (felder) => felder
            .map((feld) => SCHACH.feldName(feld, breite, hoehe))
            .join(", ");

        const ja = await DIALOG.frage(
            "Der Händler bietet",
            angebot.text + "\n\n"
                + "Du gibst ab: " + namen(angebot.gibtFelder) + "\n"
                + "Du bekommst auf: " + namen(angebot.bekommtFelder) + "\n\n"
                + "Nimmst du an, ist danach der Gegner am Zug. Lehnst du ab, "
                + "behältst du die Fähigkeit — und nach dem nächsten Zug hat der "
                + "Händler ein anderes Angebot.",
            "Annehmen",
            false
        );

        if (!ja) {
            return;
        }

        await TEAM_SCHACH.faehigkeitAusfuehren(partie, art, -1);
    },

    /* Setzt die Fähigkeit wirklich ein — mit Ziel, wenn sie eines braucht. */
    async faehigkeitAusfuehren(partie, art, zielFeld) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }

        /* Braucht die Partie Einigkeit, wird auch die Fähigkeit erst
           vorgeschlagen — genau wie ein Zug. */
        const neu = SCHACH_RUNDE.brauchtEinigkeit(partie)
            ? SCHACH_RUNDE.faehigkeitVorschlagen(
                partie, person.id, art, zielFeld, person.name)
            : SCHACH_RUNDE.faehigkeitEinsetzen(
                partie, person.id, art, zielFeld, person.name);

        TEAM_SCHACH._auswahlAufheben();

        if (!neu) {
            await DIALOG.hinweis("Geht gerade nicht",
                "Die Fähigkeit lässt sich nur einsetzen, solange dein Team am Zug "
                    + "ist — und nur auf ein gültiges Feld.");
            TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
            return;
        }

        await TEAM_SCHACH._sendenMitPruefung(neu, partie.zugZaehler);
    },

    async aufgeben(partie, farbe) {
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
            SCHACH_RUNDE.aufgeben(partie, farbe),
            partie.zugZaehler
        );
    },

    async neuAufstellen(partie) {
        const ja = await DIALOG.frage(
            "Neu aufstellen?",
            "Das Brett wird zurückgesetzt. Die Teams bleiben, beide Seiten müssen "
                + "erneut bereit drücken.",
            "Neu aufstellen",
            true
        );
        if (!ja) {
            return;
        }
        TEAM_SCHACH._auswahlAufheben();
        await TEAM_SCHACH._sendenMitPruefung(
            SCHACH_RUNDE.neuePartie(partie),
            partie.zugZaehler
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
