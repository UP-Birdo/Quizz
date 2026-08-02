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

        if (TEAM_SCHACH.auswahlOffen) {
            TEAM_SCHACH._auswahlZeichnen(wurzel);
            return;
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
     * Auswahl der Spielart
     *
     * Eine eigene Ansicht statt eines Dialogs: Zu jeder Spielart gehört ein
     * Vorschaubild, und dafür ist eine Auswahlliste der falsche Ort. Auf dem
     * Handy ist eine volle Seite mit Kacheln ohnehin besser zu treffen als ein
     * Dialog mit fünf Zeilen.
     * ---------------------------------------------------------------- */

    _auswahlZeichnen(wurzel) {
        const kopf = TEAM_SCHACH._element("div", "partie-kopf");
        kopf.appendChild(TEAM_SCHACH._knopf("Zurück", "knopf-still knopf-klein",
            () => TEAM_SCHACH.auswahlSchliessen()));
        kopf.appendChild(TEAM_SCHACH._element("h2", "partie-titel", "Welche Spielart?"));
        wurzel.appendChild(kopf);

        wurzel.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            "Die Spielart steht mit dem Anlegen fest und lässt sich später nicht "
            + "mehr wechseln. Das Bild zeigt die Startaufstellung."));

        const feld = TEAM_SCHACH._element("div", "spielart-feld");

        for (const variante of SCHACH_VARIANTEN.liste) {
            feld.appendChild(TEAM_SCHACH._spielartKachelBauen(variante));
        }

        wurzel.appendChild(feld);
    },

    _spielartKachelBauen(variante) {
        const kachel = document.createElement("button");
        kachel.type = "button";
        kachel.className = "spielart-kachel";
        kachel.addEventListener("click", () => TEAM_SCHACH.spielartGewaehlt(variante.id));

        kachel.appendChild(TEAM_SCHACH._vorschauBauen(variante));

        const kopf = TEAM_SCHACH._element("div", "spielart-kopf");
        kopf.appendChild(TEAM_SCHACH._element("span", "spielart-titel", variante.titel));
        kopf.appendChild(TEAM_SCHACH._element("span", "spielart-masse",
            variante.breite + " mal " + variante.hoehe));
        kachel.appendChild(kopf);

        kachel.appendChild(TEAM_SCHACH._element("span", "spielart-text", variante.beschreibung));

        return kachel;
    },

    /*
     * Das Vorschaubild: ein Miniaturbrett aus DERSELBEN Aufstellung, aus der
     * auch das echte Brett entsteht. Deshalb kann es nicht veralten — wer eine
     * Spielart ändert, ändert ihr Bild automatisch mit. Eine gezeichnete Datei
     * je Spielart wäre die zweite Wahrheit, die irgendwann von der ersten
     * abweicht.
     */
    _vorschauBauen(variante) {
        const vorschau = TEAM_SCHACH._element("div", "vorschau");
        vorschau.style.setProperty("--vorschau-spalten", String(variante.breite));

        const felder = variante.breite * variante.hoehe;

        for (let feld = 0; feld < felder; feld++) {
            const reihe = Math.floor(feld / variante.breite);
            const spalte = feld % variante.breite;

            const zelle = TEAM_SCHACH._element("div",
                "vorschau-feld " + (((reihe + spalte) % 2 === 0) ? "feld-hell" : "feld-dunkel"));

            const figur = variante.aufstellung[feld];
            if (figur !== ".") {
                zelle.appendChild(TEAM_SCHACH._element("span",
                    "figur " + (SCHACH.farbeVon(figur) === "weiss" ? "figur-weiss" : "figur-schwarz"),
                    TEAM_SCHACH._figurZeichen(figur)));
            }

            /* Angedeutete Würfel: Sie zeigen, dass in dieser Spielart welche
               erscheinen — wo genau, entscheidet später die Ziehung. */
            const beispiel = variante.bonusFelder.find((eintrag) => eintrag.feld === feld);
            if (beispiel) {
                zelle.classList.add("feld-bonus");
                zelle.appendChild(TEAM_SCHACH._wuerfelBauen(beispiel.art));
            }

            vorschau.appendChild(zelle);
        }

        return vorschau;
    },

    /* ---------------------------------------------------------------- *
     * Übersicht: alle Partien
     * ---------------------------------------------------------------- */

    _uebersichtZeichnen(wurzel, tafel, person) {
        const kopf = TEAM_SCHACH._element("div", "phasen-leiste");
        kopf.appendChild(TEAM_SCHACH._element("span", "phasen-text",
            "Offene Partien: " + SCHACH_TAFEL.anzahl(tafel)));
        wurzel.appendChild(kopf);

        const liste = SCHACH_TAFEL.liste(tafel);

        if (liste.length === 0) {
            wurzel.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Es läuft noch keine Partie. Leg eine an, wähle deine Spielart "
                + "und tritt einem Team bei."));
        }

        for (const partie of liste) {
            wurzel.appendChild(TEAM_SCHACH._partieKarteBauen(partie, person));
        }

        const fuss = TEAM_SCHACH._element("div", "fussleiste");
        fuss.appendChild(TEAM_SCHACH._knopf("Neue Partie", "knopf-haupt",
            () => TEAM_SCHACH.partieAnlegen()));
        wurzel.appendChild(fuss);
    },

    _partieKarteBauen(partie, person) {
        const karte = TEAM_SCHACH._element("section", "karte partie-karte");
        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);

        const kopf = TEAM_SCHACH._element("div", "karte-kopf");
        kopf.appendChild(TEAM_SCHACH._element("h3", "", partie.titel));

        if (meinTeam) {
            kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-fertig",
                (meinTeam === "weiss") ? "Du: Weiss" : "Du: Schwarz"));
        }
        if (partie.ergebnis) {
            kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-offen", "beendet"));
        } else if (partie.laeuft) {
            kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-laeuft", "läuft"));
        }
        karte.appendChild(kopf);

        const variante = SCHACH_RUNDE.varianteVon(partie);
        karte.appendChild(TEAM_SCHACH._element("p", "partie-zeile",
            variante.titel + " — " + SCHACH_RUNDE.kurzfassung(partie)));

        const weiss = partie.teams.weiss.map((id) => TEAM_SCHACH._nameVon(id));
        const schwarz = partie.teams.schwarz.map((id) => TEAM_SCHACH._nameVon(id));
        karte.appendChild(TEAM_SCHACH._element("p", "team-namen",
            "Weiss: " + (weiss.length ? weiss.join(", ") : "niemand")
            + "   |   Schwarz: " + (schwarz.length ? schwarz.join(", ") : "niemand")));

        const leiste = TEAM_SCHACH._element("div", "karte-fuss");
        leiste.appendChild(TEAM_SCHACH._knopf("Öffnen", "knopf-still knopf-klein",
            () => TEAM_SCHACH.partieOeffnen(partie.id)));
        leiste.appendChild(TEAM_SCHACH._knopf("Löschen", "knopf-gefahr knopf-klein",
            () => TEAM_SCHACH.partieLoeschen(partie)));
        karte.appendChild(leiste);

        return karte;
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

        for (const feld of letzter.felder) {
            const zelle = halter.querySelector("[data-feld=\"" + feld + "\"]");
            if (!zelle) {
                continue;
            }
            zelle.classList.add("feld-wirkung");
            window.setTimeout(() => zelle.classList.remove("feld-wirkung"),
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

    _standLeisteBauen(partie, person) {
        const leiste = TEAM_SCHACH._element("div", "phasen-leiste");
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

        const darfZiehen = SCHACH_RUNDE.darfZiehen(partie, person.id);
        const bonus = SCHACH_RUNDE.offeneBonusFelder(partie);

        for (let anzeige = 0; anzeige < felder; anzeige++) {
            const feld = gedreht ? (felder - 1 - anzeige) : anzeige;

            const zelle = document.createElement("button");
            zelle.type = "button";
            zelle.className = "feld " + (((SCHACH.reiheVon(feld, breite)
                + SCHACH.spalteVon(feld, breite)) % 2 === 0) ? "feld-hell" : "feld-dunkel");
            zelle.dataset.feld = String(feld);
            zelle.setAttribute("aria-label", SCHACH.feldName(feld, breite, hoehe));

            const figur = SCHACH.figurAuf(stand, feld);
            if (figur !== ".") {
                const zeichen = TEAM_SCHACH._element("span",
                    "figur " + (SCHACH.farbeVon(figur) === "weiss" ? "figur-weiss" : "figur-schwarz"),
                    TEAM_SCHACH._figurZeichen(figur));
                zelle.appendChild(zeichen);
            }

            /* Liegt hier ein Würfel mit einer Fähigkeit? */
            const bonusHier = bonus.find((eintrag) => eintrag.feld === feld);
            if (bonusHier) {
                const stufe = SCHACH_VARIANTEN.stufeVon(bonusHier.art);
                zelle.classList.add("feld-bonus");
                zelle.title = SCHACH_VARIANTEN.faehigkeitTitel(bonusHier.art)
                    + " (" + stufe.titel + ")";
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe) + ", " + zelle.title);
                zelle.appendChild(TEAM_SCHACH._wuerfelBauen(bonusHier.art));
            }

            /* Wartet die Fähigkeit auf ein Ziel? Dann sind die möglichen
               Felder markiert. */
            if (TEAM_SCHACH.zielFelder.indexOf(feld) !== -1) {
                zelle.classList.add("feld-wahl");
            }

            if (feld === TEAM_SCHACH.gewaehltesFeld) {
                zelle.classList.add("feld-gewaehlt");
            }
            if (TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
                zelle.classList.add(figur === "." ? "feld-ziel" : "feld-schlag");
            }
            /* Der eigene Turm als zweiter Weg zur Rochade — kein Schlagfeld,
               deshalb eine eigene Marke. */
            if (TEAM_SCHACH.rochadeZiele[feld] !== undefined) {
                zelle.classList.add("feld-rochade");
                zelle.title = "Rochade: hier tippen";
            }

            /* Königsfeld hervorheben, wenn es im Schach steht. */
            if (partie.laeuft && SCHACH.artVon(figur) === "K"
                && SCHACH.farbeVon(figur) === stand.amZug
                && SCHACH.imSchach(stand, stand.amZug)) {
                zelle.classList.add("feld-schach");
            }

            zelle.disabled = !darfZiehen;
            zelle.addEventListener("click", () => TEAM_SCHACH.feldAngetippt(partie, person, feld));

            brett.appendChild(zelle);
        }

        /* Pfeil über dem Brett: zeigt den zuletzt gezogenen Weg. */
        const pfeil = TEAM_SCHACH._pfeilBauen(partie, gedreht);
        if (pfeil) {
            brett.appendChild(pfeil);
        }

        halter.appendChild(brett);

        if (!partie.laeuft && !partie.ergebnis) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Die Partie beginnt, sobald in beiden Teams jemand steht und beide "
                + "Seiten bereit gedrückt haben."));
        } else if (partie.laeuft && !darfZiehen) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                meinTeam
                    ? "Warte, bis dein Team wieder am Zug ist."
                    : "Tritt einem Team bei, um mitzuspielen."));
        } else if (darfZiehen) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Figur antippen, dann ein Feld mit Punkt. Wer aus deinem Team "
                + "zuerst zieht, hat gezogen."));
        }

        const rochade = TEAM_SCHACH._rochadeHinweis(partie);
        if (rochade) {
            halter.appendChild(TEAM_SCHACH._element("p", "erklaerung erklaerung-rochade", rochade));
        }

        return halter;
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
     * Der Pfeil des letzten Zuges, als Zeichnung über dem Brett.
     *
     * Er beantwortet die Frage „was hat der andere gerade gemacht", ohne dass
     * man den Verlauf aufklappen muss — und er bleibt stehen, während die
     * Bewegung nur einmal läuft. Gezeichnet wird in Feldkoordinaten (das
     * Koordinatenfeld ist so breit wie das Brett Spalten hat), deshalb passt er
     * ohne Umrechnung auf jede Brettgröße und jede Bildschirmbreite.
     *
     * Zwei Lagen: ein breiter heller Strich darunter, ein schmaler farbiger
     * darüber. Dieselbe Doppel-Kontur wie bei Figuren und Zielfeldern — sonst
     * verschwände der Pfeil auf einer der beiden Feldfarben.
     */
    _pfeilBauen(partie, gedreht) {
        const letzter = partie.verlauf[partie.verlauf.length - 1];
        if (!letzter) {
            return null;
        }

        /*
         * Alle Bewegungen des letzten Eintrags. Ein Zug hat einen Weg, ein
         * Erdbeben oder ein Bauernschub mehrere — jede Figur, die sich bewegt
         * hat, bekommt ihren Pfeil. Ältere Einträge kennen nur `von`/`nach`.
         */
        let wege = (letzter.wege && letzter.wege.length > 0) ? letzter.wege : [];

        if (wege.length === 0 && Number.isInteger(letzter.von) && letzter.von >= 0
            && Number.isInteger(letzter.nach) && letzter.nach >= 0) {
            wege = [{ von: letzter.von, nach: letzter.nach }];
        }

        wege = wege.filter((weg) => weg.von !== weg.nach);
        if (wege.length === 0) {
            return null;
        }

        const breite = SCHACH.breiteVon(partie.stand);
        const hoehe = SCHACH.hoeheVon(partie.stand);
        const felder = breite * hoehe;

        /* Mittelpunkt eines Feldes in der ANZEIGE (gedrehtes Brett beachten). */
        const mitte = (feld) => {
            const anzeige = gedreht ? (felder - 1 - feld) : feld;
            return {
                x: (anzeige % breite) + 0.5,
                y: Math.floor(anzeige / breite) + 0.5
            };
        };

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "zug-pfeil");
        svg.setAttribute("viewBox", "0 0 " + breite + " " + hoehe);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");

        let gezeichnet = 0;

        /* Erst alle hellen Unterlagen, dann alle farbigen Lagen darüber — sonst
           läge bei sich kreuzenden Pfeilen die Unterlage des einen über der
           Farbe des anderen. */
        for (const lage of ["zug-pfeil-unten", "zug-pfeil-oben"]) {
            for (const weg of wege) {
                const start = mitte(weg.von);
                const ende = mitte(weg.nach);

                const dx = ende.x - start.x;
                const dy = ende.y - start.y;
                const laenge = Math.sqrt(dx * dx + dy * dy);
                if (laenge === 0) {
                    continue;
                }

                const ex = dx / laenge;
                const ey = dy / laenge;

                /* Die Spitze sitzt am Zielfeld, der Strich endet davor. */
                const spitzeLaenge = 0.38;
                const spitzeBreite = 0.22;
                const strichEndeX = ende.x - ex * spitzeLaenge;
                const strichEndeY = ende.y - ey * spitzeLaenge;

                const strich = document.createElementNS("http://www.w3.org/2000/svg", "line");
                strich.setAttribute("class", lage);
                strich.setAttribute("x1", String(start.x));
                strich.setAttribute("y1", String(start.y));
                strich.setAttribute("x2", String(strichEndeX));
                strich.setAttribute("y2", String(strichEndeY));
                svg.appendChild(strich);

                const spitze = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                spitze.setAttribute("class", lage);
                spitze.setAttribute("points", [
                    ende.x + "," + ende.y,
                    (strichEndeX - ey * spitzeBreite) + "," + (strichEndeY + ex * spitzeBreite),
                    (strichEndeX + ey * spitzeBreite) + "," + (strichEndeY - ex * spitzeBreite)
                ].join(" "));
                svg.appendChild(spitze);

                gezeichnet++;
            }
        }

        return (gezeichnet > 0) ? svg : null;
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
    _wuerfelBauen(art) {
        const stufe = SCHACH_VARIANTEN.stufeVon(art);

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

        /* Das Fragezeichen auf der rechten Seitenfläche. */
        const zeichen = document.createElementNS("http://www.w3.org/2000/svg", "text");
        zeichen.setAttribute("x", "70");
        zeichen.setAttribute("y", "80");
        zeichen.setAttribute("text-anchor", "middle");
        zeichen.setAttribute("class", "wuerfel-zeichen");
        zeichen.textContent = "?";
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
     * Lässt die zuletzt gezogene Figur von ihrem alten Feld herüberwandern.
     *
     * Der Weg steht im Verlauf (von/nach), deshalb sehen ALLE die Bewegung —
     * nicht nur derjenige, der gezogen hat. Der Merker `animiertBis`
     * verhindert, dass dieselbe Bewegung bei jedem Neuzeichnen erneut läuft;
     * gezeichnet wird oft, gezogen selten.
     */
    _zugAnimieren(halter, partie, person) {
        const letzter = partie.verlauf[partie.verlauf.length - 1];

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

    /* ---------------------------------------------------------------- *
     * Fähigkeiten
     * ---------------------------------------------------------------- */

    _faehigkeitenBauen(partie, person) {
        const variante = SCHACH_RUNDE.varianteVon(partie);
        if (!variante.faehigkeiten) {
            return null;
        }

        const karte = TEAM_SCHACH._element("section", "karte");
        karte.appendChild(TEAM_SCHACH._element("h3", "", "Fähigkeiten"));

        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);
        const offen = SCHACH_RUNDE.offeneBonusFelder(partie);

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

        const bisNaechster = SCHACH_VARIANTEN.BONUS_ABSTAND
            - (partie.zugZaehler % SCHACH_VARIANTEN.BONUS_ABSTAND);

        karte.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            "Auf dem Brett liegen " + offen.length + " von höchstens "
            + SCHACH_VARIANTEN.BONUS_HOECHSTENS + " Würfeln. "
            + (offen.length >= SCHACH_VARIANTEN.BONUS_HOECHSTENS
                ? "Es erscheint erst wieder einer, wenn einer eingesammelt wurde."
                : "Der nächste erscheint in " + bisNaechster + " Halbzügen.")
            + " Wer mit einer Figur darauf zieht, sammelt ihn ein."));

        for (const farbe of ["weiss", "schwarz"]) {
            const koennen = partie.faehigkeiten[farbe];
            const zeile = TEAM_SCHACH._element("div", "faehigkeit-zeile");

            zeile.appendChild(TEAM_SCHACH._element("span", "zug-farbe",
                (farbe === "weiss") ? "Weiss" : "Schwarz"));

            if (koennen.length === 0) {
                zeile.appendChild(TEAM_SCHACH._element("span", "erklaerung", "keine"));
            }

            for (let stelle = 0; stelle < koennen.length; stelle++) {
                const art = koennen[stelle];
                const stufe = SCHACH_VARIANTEN.stufeVon(art);
                const darf = (meinTeam === farbe)
                    && SCHACH_RUNDE.darfZiehen(partie, person.id);

                const marke = darf
                    ? TEAM_SCHACH._knopf(SCHACH_VARIANTEN.faehigkeitTitel(art),
                        "knopf-still knopf-klein faehigkeit-knopf",
                        () => TEAM_SCHACH.faehigkeitEinsetzen(partie, art))
                    : TEAM_SCHACH._element("span", "chip faehigkeit-marke",
                        SCHACH_VARIANTEN.faehigkeitTitel(art));

                /* Die Farbe der Stufe trägt die Marke — so sieht man sofort,
                   wie selten die Fähigkeit war. */
                marke.style.setProperty("--stufe-farbe", stufe.farbe);
                marke.title = stufe.titel + " — " + SCHACH_VARIANTEN.faehigkeitBeschreibung(art);
                zeile.appendChild(marke);
            }

            karte.appendChild(zeile);
        }

        karte.appendChild(TEAM_SCHACH._infoKnopfBauen());
        return karte;
    },

    /* Der i-Knopf: erklärt Stufen und Chancen im Wortlaut. */
    _infoKnopfBauen() {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "info-knopf";
        knopf.textContent = "i";
        knopf.setAttribute("aria-label", "Welche Fähigkeiten gibt es?");
        knopf.title = "Welche Fähigkeiten gibt es?";
        knopf.addEventListener("click", () => {
            DIALOG.hinweis("Fähigkeiten", SCHACH_VARIANTEN.faehigkeitenErklaerung());
        });
        return knopf;
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

            const neu = SCHACH_RUNDE.ziehen(
                partie, person.id, von, nach, umwandlung, person.name
            );

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

        const ergebnis = SCHACH_TAFEL.partieAnlegen(tafel, varianteId, titel);

        try {
            await abgleich.speicher.speichern(ergebnis.tafel);
            abgleich.daten = ergebnis.tafel;
            TEAM_SCHACH.partieOeffnen(ergebnis.partie.id);
        } catch (fehler) {
            await DIALOG.hinweis("Nicht angelegt",
                "Die Partie konnte nicht gespeichert werden: " + fehler.message);
        }
    },

    async partieLoeschen(partie) {
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

        const ja = await DIALOG.frage(
            SCHACH_VARIANTEN.faehigkeitTitel(art) + " einsetzen?",
            SCHACH_VARIANTEN.faehigkeitBeschreibung(art)
                + "\n\nSie ist danach verbraucht.",
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

    /* Setzt die Fähigkeit wirklich ein — mit Ziel, wenn sie eines braucht. */
    async faehigkeitAusfuehren(partie, art, zielFeld) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }

        const neu = SCHACH_RUNDE.faehigkeitEinsetzen(
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
