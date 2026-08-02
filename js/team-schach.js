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

    /* Gerade angetipptes Feld (Feldnummer) oder -1. */
    gewaehltesFeld: -1,

    /* Zielfelder zum gewählten Feld, als Feldnummern. */
    moeglicheZiele: [],

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

            /* Liegt hier eine Fähigkeit? */
            const bonusHier = bonus.find((eintrag) => eintrag.feld === feld);
            if (bonusHier) {
                zelle.classList.add("feld-bonus");
                zelle.title = "Fähigkeit: " + SCHACH_VARIANTEN.faehigkeitTitel(bonusHier.art);
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe) + ", " + zelle.title);
            }

            if (feld === TEAM_SCHACH.gewaehltesFeld) {
                zelle.classList.add("feld-gewaehlt");
            }
            if (TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
                zelle.classList.add(figur === "." ? "feld-ziel" : "feld-schlag");
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
        if (variante.bonusFelder.length === 0) {
            return null;
        }

        const karte = TEAM_SCHACH._element("section", "karte");
        karte.appendChild(TEAM_SCHACH._element("h3", "", "Fähigkeiten"));

        const meinTeam = SCHACH_RUNDE.teamVon(partie, person.id);
        const offen = SCHACH_RUNDE.offeneBonusFelder(partie);

        karte.appendChild(TEAM_SCHACH._element("p", "erklaerung",
            "Auf dem Brett liegen noch " + offen.length + " von "
            + variante.bonusFelder.length + " Fähigkeiten. Wer mit einer Figur "
            + "darauf zieht, sammelt sie ein."));

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
                const darf = (meinTeam === farbe)
                    && SCHACH_RUNDE.darfZiehen(partie, person.id);

                if (darf) {
                    zeile.appendChild(TEAM_SCHACH._knopf(
                        SCHACH_VARIANTEN.faehigkeitTitel(art) + " einsetzen",
                        "knopf-still knopf-klein",
                        () => TEAM_SCHACH.faehigkeitEinsetzen(partie, art)
                    ));
                } else {
                    zeile.appendChild(TEAM_SCHACH._element("span", "chip chip-offen",
                        SCHACH_VARIANTEN.faehigkeitTitel(art)));
                }
            }

            karte.appendChild(zeile);
        }

        return karte;
    },

    /* ---------------------------------------------------------------- *
     * Verlauf
     * ---------------------------------------------------------------- */

    _verlaufBauen(partie) {
        const karte = TEAM_SCHACH._element("section", "karte");

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

        /* Zweiter Tipp auf ein mögliches Ziel: ziehen. */
        if (TEAM_SCHACH.gewaehltesFeld !== -1
            && TEAM_SCHACH.moeglicheZiele.indexOf(feld) !== -1) {
            TEAM_SCHACH.zugAusfuehren(partie, TEAM_SCHACH.gewaehltesFeld, feld);
            return;
        }

        const figur = SCHACH.figurAuf(partie.stand, feld);

        /* Eigene Figur antippen: auswählen (oder Auswahl aufheben). */
        if (SCHACH.farbeVon(figur) === partie.stand.amZug) {
            if (TEAM_SCHACH.gewaehltesFeld === feld) {
                TEAM_SCHACH._auswahlAufheben();
            } else {
                TEAM_SCHACH.gewaehltesFeld = feld;
                TEAM_SCHACH.moeglicheZiele = SCHACH.zuege(partie.stand, feld)
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

    async partieAnlegen() {
        const person = TEAM_SCHACH._ich();
        if (!person) {
            return;
        }

        const eintraege = SCHACH_VARIANTEN.liste.map((variante) => ({
            beschriftung: variante.titel,
            hinweis: variante.beschreibung,
            wert: variante.id
        }));

        const varianteId = await DIALOG.liste(
            "Welche Spielart?",
            "Die Spielart einer Partie steht mit dem Anlegen fest und lässt sich "
                + "später nicht mehr wechseln.",
            eintraege,
            "Abbrechen"
        );
        if (!varianteId) {
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

    async faehigkeitEinsetzen(partie, art) {
        const person = TEAM_SCHACH._ich();
        if (!person) {
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

        const neu = SCHACH_RUNDE.faehigkeitEinsetzen(partie, person.id, art, person.name);
        if (!neu) {
            await DIALOG.hinweis("Geht gerade nicht",
                "Die Fähigkeit lässt sich nur einsetzen, solange dein Team am Zug ist.");
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
