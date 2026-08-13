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

        /*
         * DER ERKLÄRSATZ STEHT HINTER DEM i (seit v0.52). Er sagt etwas, das man
         * EINMAL wissen muss und danach nie wieder — als Absatz blähte er den
         * Bildschirm auf und schob die Kacheln nach unten, also genau das, was
         * man hier eigentlich antippen will. Dasselbe Muster wie beim
         * Fähigkeiten-Fenster in v3.5.
         */
        kopf.appendChild(TEAM_SCHACH._infoZeichenBauen(
            "Was gilt beim Anlegen?",
            "Spielart und Einstellungen stehen mit dem Anlegen fest und lassen "
            + "sich später nicht mehr ändern. Das Bild auf der Kachel zeigt die "
            + "Startaufstellung."));

        wurzel.appendChild(kopf);
        wurzel.appendChild(TEAM_SCHACH._regelSchalterBauen());
        wurzel.appendChild(TEAM_SCHACH._formLeisteBauen());

        const feld = TEAM_SCHACH._element("div", "spielart-feld");

        for (const variante of SCHACH_VARIANTEN.zurAuswahlNachForm(TEAM_SCHACH.gewaehlteForm)) {
            feld.appendChild(TEAM_SCHACH._spielartKachelBauen(variante));
        }

        wurzel.appendChild(feld);
    },

    /*
     * DIE BRETTFORM STEHT VOR DER SPIELART (seit v0.63, Wunsch #22).
     *
     * Bis v0.62 lagen alle Spielarten als eine flache Reihe Kacheln da und
     * mischten zwei Fragen: welche FORM und welche GRÖSSE. Mit den drei
     * Kreuz-Brettern wären das sieben Kacheln ohne erkennbare Ordnung gewesen.
     *
     * Jetzt wählt man erst die Form — Quadratisch, Rechteckig, Kreuz — und
     * sieht darunter nur deren Grössen. Die Form ist reine Anzeige: Sie steht
     * nicht in der Partie, sondern nur in diesem Bildschirm. Was gespeichert
     * wird, ist wie immer die eine gewählte Spielart.
     */
    _formLeisteBauen() {
        const karte = TEAM_SCHACH._element("section", "karte");
        karte.appendChild(TEAM_SCHACH._element("h3", "", "Welche Brettform?"));

        const leiste = TEAM_SCHACH._element("div", "form-leiste");

        for (const form of SCHACH_VARIANTEN.FORMEN) {
            const aktiv = (form.id === TEAM_SCHACH.gewaehlteForm);

            const knopf = TEAM_SCHACH._knopf(form.titel,
                "knopf-klein form-knopf" + (aktiv ? " form-knopf-aktiv" : " knopf-still"),
                () => {
                    TEAM_SCHACH.gewaehlteForm = form.id;
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                });

            knopf.setAttribute("aria-pressed", aktiv ? "true" : "false");
            leiste.appendChild(knopf);
        }

        karte.appendChild(leiste);

        const gewaehlt = SCHACH_VARIANTEN.FORMEN.find(
            (form) => form.id === TEAM_SCHACH.gewaehlteForm);

        if (gewaehlt) {
            karte.appendChild(TEAM_SCHACH._element("p", "erklaerung", gewaehlt.beschreibung));
        }

        return karte;
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
                titel: "Lootboxen",
                hinweis: "Auf freien Feldern erscheinen Lootboxen mit Fähigkeiten — "
                    + "gute wie schlechte.",

                /*
                 * DAS i FÜHRT IN DIE GANZE BIBLIOTHEK (seit v0.55).
                 *
                 * In v0.52 zeigte es nur einen Absatz Text. Gemeint war aber
                 * das ganze Menü: alle Fähigkeiten mit ihren Stufen, Zeichen und
                 * abgespielten Anleitungen. Wer sich beim Anlegen fragt, ob er
                 * Würfel will, will genau das sehen — und nicht erst eine Partie
                 * anlegen müssen, um es zu erfahren.
                 *
                 * Möglich ist das ohne Umbau: `zeichnen` fragt `infoOffen` VOR
                 * `auswahlOffen` ab, und `infoSchliessen` bringt einen deshalb
                 * genau hierher zurück.
                 */
                bibliothek: true
            },
            {
                schluessel: "seltenheitZeigen",
                titel: "Seltenheit anzeigen",
                hinweis: "Die Lootbox trägt schon auf dem Brett die Farbe ihrer Stufe. "
                    + "Aus heißt: Alle Lootboxen sehen gleich aus, und man weiß erst "
                    + "beim Einsammeln, wie selten es war.",
                nurMitWuerfeln: true
            },
            {
                schluessel: "pechZeigen",
                titel: "Unglücks-Lootboxen anzeigen",
                hinweis: "Eine schlechte Lootbox trägt ihr Fragezeichen auf dem Kopf, "
                    + "man erkennt sie also von weitem. Aus heißt: Sie sieht aus wie "
                    + "jede andere — gleiche Farbe, Fragezeichen richtig herum. "
                    + "Dann ist jede Lootbox ein Wagnis.",
                nurMitWuerfeln: true
            },
            {
                schluessel: "regen",
                titel: "Lootbox-Regen",
                hinweis: "Je leerer das Brett, desto mehr Lootboxen erscheinen — gegen "
                    + "Ende einer Partie regnet es. Aus heißt: Es kommt wie immer "
                    + "meist einer nach, unabhängig davon, wie viel Platz ist.",
                nurMitWuerfeln: true
            },
            {
                schluessel: "zufallsArmee",
                titel: "Zufallsarmee",
                hinweis: "Jede Seite bekommt gewürfelt die halbe Armee statt der "
                    + "gewohnten Aufstellung — beim klassischen Brett 8 Figuren, "
                    + "König inbegriffen. Selten sind es ZWEI Könige: Dann hast du "
                    + "zwei Leben. Der erste wird geschlagen wie jede Figur, den "
                    + "letzten muss der Gegner schachmatt setzen."
            },
            {
                schluessel: "armeeUnterschiedlich",
                titel: "Unterschiedliche Armeen",
                hinweis: "Jede Mannschaft würfelt für sich — dann kann eine Seite zwei "
                    + "Türme und eine Dame haben und die andere fast nur Bauern. Aus "
                    + "heißt: Es wird einmal gewürfelt, und beide bekommen dieselben "
                    + "Einheiten, spiegelbildlich aufgestellt.",
                nurMitArmee: true
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

        /*
         * Zwei Haken haben Unterpunkte: der Würfel-Haken und (seit v0.51) die
         * Zufallsarmee. Ein Unterpunkt erscheint erst, wenn sein Oberpunkt
         * gesetzt ist — sonst stünde dort eine Einstellung zu einer Sache, die
         * es in dieser Partie gar nicht gibt.
         */
        const obenDrueber = { nurMitWuerfeln: "faehigkeiten", nurMitArmee: "zufallsArmee" };

        for (const eintrag of schalter) {
            const oben = eintrag.nurMitWuerfeln
                ? obenDrueber.nurMitWuerfeln
                : (eintrag.nurMitArmee ? obenDrueber.nurMitArmee : "");

            if (oben && !TEAM_SCHACH.neueRegeln[oben]) {
                continue;
            }

            const zeile = TEAM_SCHACH._element("label",
                "schalter-zeile" + (oben ? " schalter-unterpunkt" : ""));

            const kasten = document.createElement("input");
            kasten.type = "checkbox";
            kasten.className = "schalter-kasten";
            kasten.checked = !!TEAM_SCHACH.neueRegeln[eintrag.schluessel];
            kasten.addEventListener("change", () => {
                TEAM_SCHACH.neueRegeln[eintrag.schluessel] = !!kasten.checked;

                /* Ein Oberpunkt blendet seine Unterpunkte ein oder aus. */
                if (eintrag.schluessel === "faehigkeiten"
                    || eintrag.schluessel === "zufallsArmee") {
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                }
            });
            zeile.appendChild(kasten);

            const text = TEAM_SCHACH._element("span", "schalter-text");
            text.appendChild(TEAM_SCHACH._element("span", "schalter-titel", eintrag.titel));
            text.appendChild(TEAM_SCHACH._element("span", "schalter-hinweis", eintrag.hinweis));
            zeile.appendChild(text);

            /*
             * Das i steht NEBEN der Zeile, nicht darin: Die ganze Zeile ist ein
             * `label` und schaltet den Haken um — ein Knopf mittendrin würde
             * beides gleichzeitig auslösen.
             */
            const halter = TEAM_SCHACH._element("div", "schalter-halter");
            halter.appendChild(zeile);

            if (eintrag.bibliothek) {
                halter.appendChild(TEAM_SCHACH._infoKnopfBauen());
            } else if (eintrag.mehr) {
                halter.appendChild(TEAM_SCHACH._infoZeichenBauen(eintrag.titel, eintrag.mehr));
            }

            karte.appendChild(halter);

            /* Der Regen hat als einziger Haken noch eine Zahl dahinter. */
            if (eintrag.schluessel === "regen" && TEAM_SCHACH.neueRegeln.regen) {
                karte.appendChild(TEAM_SCHACH._regenReglerBauen());
            }
        }

        return karte;
    },

    /*
     * DER SCHIEBEREGLER FÜR DEN REGEN (seit v0.59, Wunsch #11).
     *
     * Er sagt, WIE SPÄT der Regen einsetzt — nicht, wie stark er am Ende ist:
     * Bei jeder Stufe bekommt am Schluss jedes freie Feld einen Würfel (die
     * Rechnung dahinter steht in `SCHACH_VARIANTEN.REGEN.STUFEN`). 5 ist der
     * Verlauf, den es seit v0.53 gibt, und bleibt die Vorgabe.
     *
     * Er erscheint nur, solange der Haken darüber gesetzt ist — wie jeder
     * andere Unterpunkt auch. Ein Regler zu einem Regen, den es in dieser
     * Partie nicht gibt, wäre eine Einstellung ohne Gegenstück.
     */
    _regenReglerBauen() {
        const zeile = TEAM_SCHACH._element("div", "schalter-unterpunkt regler-zeile");

        const beschriftung = TEAM_SCHACH._element("span", "schalter-titel", "Wie früh es regnet");
        zeile.appendChild(beschriftung);

        const regler = document.createElement("input");
        regler.type = "range";
        regler.className = "regler";
        regler.min = "1";
        regler.max = "5";
        regler.step = "1";
        regler.value = String(TEAM_SCHACH.neueRegeln.regenStufe);
        regler.setAttribute("aria-label", "Wie früh es regnet, 1 bis 5");

        const wert = TEAM_SCHACH._element("span", "regler-wert", "");

        const beschriften = () => {
            const stufe = TEAM_SCHACH.neueRegeln.regenStufe;
            wert.textContent = stufe + " von 5 — " + ((stufe === 5)
                ? "wie gewohnt"
                : ((stufe === 1) ? "sehr spät, dafür heftig" : "später als gewohnt"));
        };

        regler.addEventListener("input", () => {
            const gewaehlt = parseInt(regler.value, 10);
            TEAM_SCHACH.neueRegeln.regenStufe = (gewaehlt >= 1 && gewaehlt <= 5)
                ? gewaehlt
                : SCHACH_VARIANTEN.REGEN.STUFE_VORGABE;
            beschriften();
        });

        beschriften();
        zeile.appendChild(regler);
        zeile.appendChild(wert);

        return zeile;
    },

    /*
     * Ein kleines i, das einen Text in einem Hinweis zeigt (seit v0.52).
     *
     * Es gibt schon `_infoKnopfBauen` — der führt aber fest in die
     * Fähigkeiten-Bibliothek. Dieses hier trägt seinen Text bei sich und ist
     * überall einsetzbar, wo ein Absatz den Bildschirm aufbläht.
     */
    _infoZeichenBauen(titel, text) {
        const knopf = document.createElement("button");

        knopf.type = "button";
        knopf.className = "info-knopf";
        knopf.textContent = "i";
        knopf.setAttribute("aria-label", titel);
        knopf.title = titel;
        knopf.addEventListener("click", (ereignis) => {
            /* Sonst schaltet der Klick zusätzlich den Haken der Zeile um. */
            if (ereignis && ereignis.preventDefault) {
                ereignis.preventDefault();
            }
            DIALOG.hinweis(titel, text);
        });

        return knopf;
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

        /* Die toten Ecken eines Kreuz-Bretts gehören ins Vorschaubild — sonst
           sähe die Kachel aus wie ein gewöhnliches Quadrat (seit v0.63). */
        const ecken = variante.kreuz ? SCHACH_VARIANTEN.kreuzEcken(variante) : [];

        for (let feld = 0; feld < felder; feld++) {
            const reihe = Math.floor(feld / variante.breite);
            const spalte = feld % variante.breite;

            const zelle = TEAM_SCHACH._element("div",
                "vorschau-feld " + (((reihe + spalte) % 2 === 0) ? "feld-hell" : "feld-dunkel"));

            if (ecken.indexOf(feld) !== -1) {
                zelle.classList.add("feld-riss");
            }

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
                zelle.appendChild(TEAM_SCHACH._wuerfelBauen(
                    SCHACH_VARIANTEN.stufeVon(beispiel.art)));
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

        /*
         * NUR DIE EIGENE HISTORIE (seit v0.59, Wunsch #8).
         *
         * Offene Partien sieht weiterhin jeder — man muss ja beitreten können.
         * Beendete sind dagegen abgeschlossen: Wer nicht mitgespielt hat, kann
         * dort nichts mehr tun, und die Liste wuchs mit jeder fremden Partie.
         * Gefiltert wird über `SCHACH_RUNDE.teamVon` — dieselbe Frage, die auch
         * über den Knopf „Ergebnis ansehen" entscheidet.
         *
         * Die Partien selbst bleiben unangetastet: Sie stehen weiter im
         * gemeinsamen Stand, und ihre Punkte stehen in der Chronik. Hier wird
         * nur ANGEZEIGT — die Rangliste zählt unverändert alles.
         */
        const beendete = alle.filter((partie) => partie.ergebnis
            && SCHACH_RUNDE.teamVon(partie, person.id));

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
            titel.textContent = "Deine beendeten Partien (" + beendete.length + ")";
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
        /*
         * WER HAT GEWONNEN, WER VERLOREN (seit v0.59, Wunsch #18).
         *
         * Bis dahin stand hier nur „beendet", und wer gewonnen hatte, ging
         * allein aus dem Satz darunter hervor („Weiss hat gewonnen") — die
         * NAMEN dazu standen wieder zwei Zeilen tiefer, unsortiert. Jetzt sagt
         * der Kopf das Ergebnis, und die Namenszeile sagt, wer auf welcher
         * Seite stand.
         *
         * Das eigene Ergebnis steht dabei vorn: Wer mitgespielt hat, will
         * zuerst wissen, ob ER gewonnen hat.
         */
        if (partie.ergebnis) {
            if (meinTeam) {
                const gewonnen = (partie.ergebnis === meinTeam);
                const remis = (partie.ergebnis === "remis");

                kopf.appendChild(TEAM_SCHACH._element("span",
                    "chip " + (remis ? "chip-offen" : (gewonnen ? "chip-fertig" : "chip-fehler")),
                    remis ? "Unentschieden" : (gewonnen ? "Gewonnen" : "Verloren")));
            } else {
                kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-offen",
                    (partie.ergebnis === "remis")
                        ? "Unentschieden"
                        : ((partie.ergebnis === "weiss") ? "Weiss gewinnt" : "Schwarz gewinnt")));
            }
        } else if (partie.laeuft) {
            kopf.appendChild(TEAM_SCHACH._element("span", "chip chip-laeuft", "läuft"));
        }
        karte.appendChild(kopf);

        const variante = SCHACH_RUNDE.varianteVon(partie);
        karte.appendChild(TEAM_SCHACH._element("p", "partie-zeile",
            variante.titel + " — " + SCHACH_RUNDE.kurzfassung(partie)));

        const weiss = partie.teams.weiss.map((id) => TEAM_SCHACH._nameVon(id));
        const schwarz = partie.teams.schwarz.map((id) => TEAM_SCHACH._nameVon(id));

        /* Bei einer beendeten Partie trägt jede Seite dazu, wie sie
           ausgegangen ist — sonst muss man das Ergebnis oben mit den Namen
           hier unten selbst zusammenrechnen. */
        const seite = (farbe, namen) => {
            const kopfText = (farbe === "weiss") ? "Weiss" : "Schwarz";
            const wer = namen.length ? namen.join(", ") : "niemand";

            if (!partie.ergebnis) {
                return kopfText + ": " + wer;
            }
            if (partie.ergebnis === "remis") {
                return kopfText + " (unentschieden): " + wer;
            }
            return kopfText + ((partie.ergebnis === farbe) ? " (Sieger): " : " (Verlierer): ") + wer;
        };

        karte.appendChild(TEAM_SCHACH._element("p", "team-namen",
            seite("weiss", weiss) + "   |   " + seite("schwarz", schwarz)));

        const leiste = TEAM_SCHACH._element("div", "karte-fuss");
        leiste.appendChild(TEAM_SCHACH._knopf("Öffnen", "knopf-still knopf-klein",
            () => TEAM_SCHACH.partieOeffnen(partie.id)));
        leiste.appendChild(TEAM_SCHACH._knopf("Löschen", "knopf-gefahr knopf-klein",
            () => TEAM_SCHACH.partieLoeschen(partie)));
        karte.appendChild(leiste);

        return karte;
    },

});
