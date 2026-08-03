/*
 * team-schach-uebersicht.js - die Uebersicht aller Partien und das Anlegen.
 *
 * Teil des Bildschirms TEAM_SCHACH; der Einstieg steht in team-schach.js.
 * Diese Datei ERGAENZT dasselbe Objekt (siehe dort) und wird NACH ihm geladen.
 *
 * Hier drin: die Auswahl der Spielart mit ihren Vorschaubildern, die
 * Einstellungen fuer eine neue Partie und die Liste aller Partien.
 */

Object.assign(TEAM_SCHACH, {
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
            "Spielart und Einstellungen stehen mit dem Anlegen fest und lassen "
            + "sich später nicht mehr ändern. Das Bild zeigt die Startaufstellung."));

        wurzel.appendChild(TEAM_SCHACH._regelSchalterBauen());

        const feld = TEAM_SCHACH._element("div", "spielart-feld");

        for (const variante of SCHACH_VARIANTEN.zurAuswahl()) {
            feld.appendChild(TEAM_SCHACH._spielartKachelBauen(variante));
        }

        wurzel.appendChild(feld);
    },

    /*
     * Die drei Einstellungen über den Kacheln. Sie stehen VOR der Spielart,
     * weil sie für jede gelten — die Kachel ist der letzte Klick, der die
     * Partie anlegt.
     */
    _regelSchalterBauen() {
        const karte = TEAM_SCHACH._element("section", "karte");
        karte.appendChild(TEAM_SCHACH._element("h3", "", "Einstellungen"));

        /*
         * Alle Haken sind zu Beginn AUS: Eine neue Partie ist erst einmal ein
         * normales Schachspiel. Was dazukommen soll, hakt man ausdrücklich an.
         *
         * „Seltenheit anzeigen" hängt am Würfel-Haken und erscheint erst, wenn
         * der gesetzt ist — ohne Würfel gäbe es nichts anzuzeigen.
         */
        const schalter = [
            {
                schluessel: "faehigkeiten",
                titel: "Zufalls-Würfel",
                hinweis: "Auf freien Feldern erscheinen Würfel mit Fähigkeiten — "
                    + "gute wie schlechte. Alles, was dazugehört (Einsammeln, "
                    + "Einsetzen, Unglückswürfel), gilt dann in dieser Spielart."
            },
            {
                schluessel: "seltenheitZeigen",
                titel: "Seltenheit anzeigen",
                hinweis: "Der Würfel trägt schon auf dem Brett die Farbe seiner Stufe. "
                    + "Aus heißt: Alle Würfel sehen gleich aus — auch die schlechten, "
                    + "und man weiß erst beim Einsammeln, was drin war.",
                nurMitWuerfeln: true
            },
            {
                schluessel: "einigkeit",
                titel: "Team muss sich einig sein",
                hinweis: "Ein Zug oder eine Fähigkeit wird erst vorgeschlagen und "
                    + "ausgeführt, wenn alle aus dem Team zugestimmt haben — oder die "
                    + "Frist abläuft. Achtung: Der Vorschlag steht im gemeinsamen "
                    + "Stand, der Gegner kann ihn mitlesen."
            }
        ];

        for (const eintrag of schalter) {
            if (eintrag.nurMitWuerfeln && !TEAM_SCHACH.neueRegeln.faehigkeiten) {
                continue;
            }

            const zeile = TEAM_SCHACH._element("label",
                "schalter-zeile" + (eintrag.nurMitWuerfeln ? " schalter-unterpunkt" : ""));

            const kasten = document.createElement("input");
            kasten.type = "checkbox";
            kasten.className = "schalter-kasten";
            kasten.checked = !!TEAM_SCHACH.neueRegeln[eintrag.schluessel];
            kasten.addEventListener("change", () => {
                TEAM_SCHACH.neueRegeln[eintrag.schluessel] = !!kasten.checked;

                /* Der Würfel-Haken blendet den Unterpunkt ein oder aus. */
                if (eintrag.schluessel === "faehigkeiten") {
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                }
            });
            zeile.appendChild(kasten);

            const text = TEAM_SCHACH._element("span", "schalter-text");
            text.appendChild(TEAM_SCHACH._element("span", "schalter-titel", eintrag.titel));
            text.appendChild(TEAM_SCHACH._element("span", "schalter-hinweis", eintrag.hinweis));
            zeile.appendChild(text);

            karte.appendChild(zeile);
        }

        return karte;
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
        const alle = SCHACH_TAFEL.liste(tafel);

        /*
         * Beendete Partien stehen nicht mehr zwischen den offenen: Sie sind
         * gespielt, ihre Punkte sind festgeschrieben. Weggeworfen werden sie
         * trotzdem nicht — sie liegen zugeklappt darunter, falls jemand noch
         * einmal nachsehen will.
         */
        const offene = alle.filter((partie) => !partie.ergebnis);
        const beendete = alle.filter((partie) => partie.ergebnis);

        const kopf = TEAM_SCHACH._element("div", "phasen-leiste");
        kopf.appendChild(TEAM_SCHACH._element("span", "phasen-text",
            "Offene Partien: " + offene.length));
        wurzel.appendChild(kopf);

        if (offene.length === 0) {
            wurzel.appendChild(TEAM_SCHACH._element("p", "erklaerung",
                "Es läuft keine Partie. Leg eine an, wähle deine Spielart "
                + "und tritt einem Team bei."));
        }

        for (const partie of offene) {
            wurzel.appendChild(TEAM_SCHACH._partieKarteBauen(partie, person));
        }

        if (beendete.length > 0) {
            const kasten = document.createElement("details");
            kasten.className = "verlauf-kasten";

            const titel = document.createElement("summary");
            titel.className = "verlauf-titel";
            titel.textContent = "Beendet (" + beendete.length + ")";
            kasten.appendChild(titel);

            for (const partie of beendete) {
                const karte = TEAM_SCHACH._partieKarteBauen(partie, person);

                /* Wer mitgespielt hat, kann sein Ergebnis jederzeit wieder
                   ansehen — auch nachdem er den Abschluss weggeklickt hat. */
                if (SCHACH_RUNDE.teamVon(partie, person.id)) {
                    const leiste = TEAM_SCHACH._element("div", "karte-fuss");
                    leiste.appendChild(TEAM_SCHACH._knopf("Ergebnis ansehen",
                        "knopf-still knopf-klein",
                        () => TEAM_SCHACH.abschlussZeigen(partie.id)));
                    karte.appendChild(leiste);
                }

                kasten.appendChild(karte);
            }

            wurzel.appendChild(kasten);
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

});
