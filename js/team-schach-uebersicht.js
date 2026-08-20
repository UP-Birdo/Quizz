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
        /*
         * „NEUE PARTIE" STATT „WELCHE SPIELART?" (seit v0.94).
         *
         * Die Überschrift stammte aus v0.44, als hier wirklich nur Kacheln
         * standen. Inzwischen kommen davor die Figurenzahl, sechs
         * Einstellungen, die Lootbox-Menge, der Item-Vorrat und die Brettform
         * — die Spielart ist der LETZTE Schritt, nicht der erste. Eine
         * Überschrift, die nach etwas fragt, das erst nach zwei Bildschirmen
         * kommt, führt in die Irre. Die Reihenfolge selbst bleibt, wie sie
         * ist: Die Kachel legt die Partie sofort an, also müssen die
         * Einstellungen davor stehen.
         */
        kopf.appendChild(TEAM_SCHACH._element("h2", "partie-titel", "Neue Partie"));

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

        /*
         * DIE FIGURENZAHL STEHT GANZ OBEN (seit v0.86, Wunsch V1: „die Anzahl
         * der Figuren auch eine Knopf-Funktion, immer bei der Auswahl ganz
         * oben"). Vor Brettform und Kacheln — wer die Stärke ändert, sieht die
         * Zahl unter JEDER Kachel sofort mitgehen, weil die Kachel dasselbe
         * `armeeAufstellen` rechnet wie die echte Partie.
         */
        wurzel.appendChild(TEAM_SCHACH._armeeStaerkeLeisteBauen());

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
            /*
             * EINIGKEIT IST SEIT v0.76 DIE VORGABE — der Haken fragt das
             * GEGENTEIL ab (Eingangskorb vom 18.08.: „Team muss einig sein soll
             * andersrum da stehen, also dass einig sein Standard sein soll und
             * das andere nur mit Knopfdruck auswählbar ist").
             *
             * Gespeichert wird weiter `regeln.einigkeit` mit derselben
             * Bedeutung (additiver Datenvertrag — jede laufende Partie trägt
             * das Feld). Umgedreht ist nur, was am Bildschirm steht: Der Haken
             * heisst jetzt nach dem SCHNELLEN Weg und ist aus.
             */
            {
                schluessel: "einigkeit",
                umgekehrt: true,
                titel: "Wer zuerst zieht, hat gezogen",
                hinweis: "Aus heisst: Ein Zug oder eine Fähigkeit wird erst "
                    + "vorgeschlagen und ausgeführt, wenn alle aus dem Team "
                    + "zugestimmt haben — oder die Frist abläuft. Das ist die "
                    + "Vorgabe. Angehakt zieht jeder sofort für sein ganzes Team, "
                    + "ohne zu fragen. Zur Abstimmung: Der Vorschlag steht im "
                    + "gemeinsamen Stand, der Gegner kann ihn mitlesen."
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
            /* `umgekehrt` (seit v0.76): Der Haken fragt das GEGENTEIL des
               gespeicherten Feldes ab — siehe „Wer zuerst zieht, hat gezogen".
               Im Stand ändert sich dadurch nichts. */
            kasten.checked = eintrag.umgekehrt
                ? !TEAM_SCHACH.neueRegeln[eintrag.schluessel]
                : !!TEAM_SCHACH.neueRegeln[eintrag.schluessel];

            kasten.addEventListener("change", () => {
                TEAM_SCHACH.neueRegeln[eintrag.schluessel] = eintrag.umgekehrt
                    ? !kasten.checked
                    : !!kasten.checked;

                /*
                 * JEDER HAKEN ZEICHNET NEU (seit v0.71).
                 *
                 * Bis v0.70 stand hier eine Liste mit zwei Schlüsseln: Nur
                 * „Lootboxen" und „Zufallsarmee" zeichneten neu, weil nur sie
                 * Unterpunkte hatten. Als der Regen-Haken v0.60 seinen
                 * Schieberegler bekam, wurde er zum dritten — und niemand
                 * ergänzte die Liste. Der Regler erschien deshalb erst, wenn
                 * irgendetwas anderes ein Neuzeichnen auslöste, etwa ein Tipp
                 * auf eine andere Brettform und zurück. Genau so wurde es
                 * gemeldet.
                 *
                 * Eine Liste, die man beim Einbauen des nächsten Unterpunkts
                 * mitpflegen muss, ist eine Falle. Neuzeichnen kostet hier
                 * nichts: `neueRegeln` ist reiner Bildschirm-Zustand, die
                 * Ansicht baut sich aus ihm auf.
                 */
                TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
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

            /* Wie viele Lootboxen es sein sollen, steht direkt unter ihrem
               Haken — es ist die erste Frage, die man danach hat. */
            if (eintrag.schluessel === "faehigkeiten"
                && TEAM_SCHACH.neueRegeln.faehigkeiten) {
                karte.appendChild(TEAM_SCHACH._mengenLeisteBauen());

                /* Und darunter, WELCHE Items vorkommen (seit v0.87, V3:
                   „nicht nur die Anzahl, sondern auch welche Items"). */
                karte.appendChild(TEAM_SCHACH._vorratLeisteBauen());
            }
        }

        return karte;
    },

    /*
     * DIE VIER STUFEN FÜR DIE LOOTBOX-MENGE (seit v0.71).
     *
     * Sie lösen zwei Einstellungen auf einmal ab: den Haken „Lootbox-Regen"
     * (v0.50) und den Schieberegler „Wie früh es regnet" (v0.60). Beide
     * beantworteten dieselbe Frage — wie viel kommt —, und man musste sie
     * zusammendenken. Vier Kästchen nebeneinander sagen es in einem Blick.
     *
     * Was jede Stufe bedeutet, steht im Modell
     * (`SCHACH_VARIANTEN.LOOTBOX_MENGEN`), samt dem Satz darunter: Der
     * Bildschirm zeigt hier nur an, was das Modell sagt.
     */
    _mengenLeisteBauen() {
        const zeile = TEAM_SCHACH._element("div", "schalter-unterpunkt mengen-zeile");

        zeile.appendChild(TEAM_SCHACH._element("span", "schalter-titel",
            "Wie viele Lootboxen?"));

        const leiste = TEAM_SCHACH._element("div", "mengen-leiste");
        const satz = TEAM_SCHACH._element("span", "schalter-hinweis", "");

        const beschriften = () => {
            satz.textContent = SCHACH_VARIANTEN
                .mengeVon(TEAM_SCHACH.neueRegeln.lootboxMenge).hinweis;
        };

        for (const menge of SCHACH_VARIANTEN.LOOTBOX_MENGEN) {
            const aktiv = (menge.id === TEAM_SCHACH.neueRegeln.lootboxMenge);

            const knopf = TEAM_SCHACH._knopf(menge.titel,
                "knopf-klein mengen-knopf" + (aktiv ? " mengen-knopf-aktiv" : " knopf-still"),
                () => {
                    TEAM_SCHACH.neueRegeln.lootboxMenge = menge.id;
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                });

            knopf.setAttribute("aria-pressed", aktiv ? "true" : "false");
            leiste.appendChild(knopf);
        }

        beschriften();
        zeile.appendChild(leiste);
        zeile.appendChild(satz);

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

    /*
     * DIE KNOPFREIHE FÜR DIE FIGURENZAHL (seit v0.86, Wunsch V1).
     *
     * Gebaut wie die Lootbox-Mengen — dieselbe Reihe, dieselben Klassen; wer
     * die eine bedienen kann, kann auch die andere. Sie steht IMMER da, auch
     * ohne den Haken „Zufallsarmee": Die Ansage war „immer bei der Auswahl
     * ganz oben". Ohne den Haken sagt der Hinweis, dass die Spielart ihre
     * eigene Aufstellung mitbringt — die Reihe verschwindet nicht, sonst
     * springt der Bildschirm beim Haken-Setzen.
     */
    /*
     * WELCHE ITEMS ES IN DER PARTIE GIBT (seit v0.87, Wunsch R5/V3).
     *
     * Wieder dieselbe Knopfreihe. Eigene Klassen (`vorrat-*`) aus demselben
     * Grund wie bei der Armee-Stärke: Drei gleich aussehende Reihen auf einem
     * Bildschirm müssen im Test und im CSS unterscheidbar bleiben.
     *
     * Welche Items ausgelost werden, entscheidet sich erst beim ANLEGEN und
     * hängt an der Partie-Kennung — hier steht deshalb nur, WIE VIELE es sein
     * sollen. Die Liste selbst zeigt die Partie danach oben an.
     */
    _vorratLeisteBauen() {
        const zeile = TEAM_SCHACH._element("div", "schalter-unterpunkt vorrat-zeile");

        zeile.appendChild(TEAM_SCHACH._element("span", "schalter-titel",
            "Welche Items kommen vor?"));

        const leiste = TEAM_SCHACH._element("div", "vorrat-leiste");

        for (const groesse of SCHACH_VARIANTEN.ITEM_VORRAETE) {
            const aktiv = (groesse.id === TEAM_SCHACH.neueRegeln.itemVorrat);

            const knopf = TEAM_SCHACH._knopf(groesse.titel,
                "knopf-klein vorrat-knopf" + (aktiv ? " vorrat-knopf-aktiv" : " knopf-still"),
                () => {
                    TEAM_SCHACH.neueRegeln.itemVorrat = groesse.id;
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                });

            knopf.setAttribute("aria-pressed", aktiv ? "true" : "false");
            leiste.appendChild(knopf);
        }

        zeile.appendChild(leiste);
        zeile.appendChild(TEAM_SCHACH._element("span", "schalter-hinweis",
            SCHACH_VARIANTEN.itemVorratVon(TEAM_SCHACH.neueRegeln.itemVorrat).hinweis));

        return zeile;
    },

    _armeeStaerkeLeisteBauen() {
        /*
         * EIGENE KLASSEN (`armee-zeile`/`armee-leiste`), nicht die der
         * Lootbox-Mengen: Diese Reihe steht IMMER da, die Mengen-Reihe nur
         * unter dem Haken „Lootboxen". Mit denselben Klassen hielte ein Test
         * die eine für die andere — und im CSS wäre nicht mehr trennbar, was
         * wovon gilt. Das Aussehen erben sie gemeinsam (`stil.css`).
         */
        const zeile = TEAM_SCHACH._element("div", "schalter-unterpunkt armee-zeile");

        zeile.appendChild(TEAM_SCHACH._element("span", "schalter-titel",
            "Wie viele Figuren je Seite?"));

        const leiste = TEAM_SCHACH._element("div", "armee-leiste");
        const satz = TEAM_SCHACH._element("span", "schalter-hinweis", "");

        for (const staerke of SCHACH_VARIANTEN.ARMEE_STAERKEN) {
            const aktiv = (staerke.id === TEAM_SCHACH.neueRegeln.armeeStaerke);

            const knopf = TEAM_SCHACH._knopf(staerke.titel,
                "knopf-klein armee-knopf" + (aktiv ? " armee-knopf-aktiv" : " knopf-still"),
                () => {
                    TEAM_SCHACH.neueRegeln.armeeStaerke = staerke.id;
                    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
                });

            knopf.setAttribute("aria-pressed", aktiv ? "true" : "false");
            leiste.appendChild(knopf);
        }

        satz.textContent = TEAM_SCHACH.neueRegeln.zufallsArmee
            ? SCHACH_VARIANTEN.armeeStaerkeVon(TEAM_SCHACH.neueRegeln.armeeStaerke).hinweis
            : "Gilt für die Zufallsarmee. Ohne den Haken bringt jede Spielart "
                + "ihre eigene Aufstellung mit — die Zahl unter der Kachel gilt.";

        zeile.appendChild(leiste);
        zeile.appendChild(satz);

        return zeile;
    },

    _spielartKachelBauen(variante) {
        const kachel = document.createElement("button");
        kachel.type = "button";
        kachel.className = "spielart-kachel";
        kachel.addEventListener("click", () => TEAM_SCHACH.spielartGewaehlt(variante.id));

        /*
         * MIT ZUFALLSARMEE ZEIGT DIE KACHEL EIN BEISPIEL (seit v0.83,
         * Nutzer-Wunsch 18.08.: „bei Zufall auch gleich ein Beispiel zeigen,
         * wie es sein kann").
         *
         * Gerechnet mit derselben Funktion, die auch die echte Partie
         * aufstellt — ein gemaltes Beispiel wäre die zweite Wahrheit, die
         * beim ersten Umbau abweicht. Die Saat hängt an der Spielart, das
         * Bild bleibt deshalb beim Neuzeichnen stehen und flackert nicht.
         */
        const brett = TEAM_SCHACH._vorschauBrett(variante);

        kachel.appendChild(TEAM_SCHACH._vorschauBauen(variante, brett));

        const kopf = TEAM_SCHACH._element("div", "spielart-kopf");
        kopf.appendChild(TEAM_SCHACH._element("span", "spielart-titel", variante.titel));
        kopf.appendChild(TEAM_SCHACH._element("span", "spielart-masse",
            variante.breite + " mal " + variante.hoehe));
        kachel.appendChild(kopf);

        /*
         * WIE VIELE FIGUREN JE SEITE (seit v0.83, „die Vorschau soll schon die
         * Anzahl anzeigen"). Gezählt wird aus dem Brett, das die Kachel WIRKLICH
         * zeigt — mit Zufallsarmee steht dort also die gewürfelte Zahl, nicht
         * die der vollen Aufstellung.
         *
         * Sind beide Seiten gleich stark, steht eine Zahl da; das ist der
         * Normalfall. Nur wenn sie sich unterscheiden (Haken „unterschiedliche
         * Armeen"), werden beide genannt — sonst wäre die eine Zahl gelogen.
         */
        kachel.appendChild(TEAM_SCHACH._element("span", "spielart-anzahl",
            TEAM_SCHACH._figurenText(brett)));

        /*
         * WIE LANGE DAUERT DAS? (seit v0.93, Wunsch W10.)
         *
         * Der einzige sichtbare Teil der stillen Zeitmessung — und ihr ganzer
         * Zweck. Gerechnet wird im Modell (`SCHACH_RUNDE.dauerText`) aus den
         * gewählten Einstellungen und dem, was in bisherigen Partien wirklich
         * gemessen wurde; der Bildschirm rechnet nichts selbst.
         *
         * Die Zahl steht bewusst unter der Figurenzahl: Beides beantwortet
         * dieselbe Frage — worauf lasse ich mich hier ein?
         */
        kachel.appendChild(TEAM_SCHACH._element("span", "spielart-dauer",
            "Dauer: " + SCHACH_RUNDE.dauerText(
                TEAM_SCHACH._figurenJeSeite(brett),
                variante.breite * variante.hoehe,
                TEAM_SCHACH.neueRegeln,
                TEAM_SCHACH._gespieltePartien())));

        kachel.appendChild(TEAM_SCHACH._element("span", "spielart-text", variante.beschreibung));

        return kachel;
    },

    /*
     * Das Brett, das die Kachel zeigt: die feste Aufstellung — oder ein
     * gewürfeltes Beispiel, wenn der Haken „Zufallsarmee" gesetzt ist.
     *
     * Gebaut wird das Beispiel über `SCHACH_RUNDE.armeeAufstellen`, also über
     * den öffentlichen Weg, den auch die echte Partie geht. Damit stimmt es
     * auch auf dem Kreuz (dort stellt `_armeeStandKreuz` seit v0.76 je
     * Startseite auf) und beim Haken „unterschiedliche Armeen".
     */
    _vorschauBrett(variante) {
        if (TEAM_SCHACH.neueRegeln.zufallsArmee !== true) {
            return variante.aufstellung;
        }

        let runde = SCHACH_RUNDE.leereRunde(0, variante.id,
            "vorschau-" + variante.id, "");

        runde.regeln.zufallsArmee = true;
        runde.regeln.armeeUnterschiedlich =
            (TEAM_SCHACH.neueRegeln.armeeUnterschiedlich === true);

        /* Dieselbe Stärke wie beim Anlegen (seit v0.86) — sonst zeigt die
           Kachel eine andere Zahl, als die Partie hinterher aufstellt. */
        runde.regeln.armeeStaerke = TEAM_SCHACH.neueRegeln.armeeStaerke;

        runde = SCHACH_RUNDE.armeeAufstellen(runde, "");
        return runde.stand.brett;
    },

    /*
     * Die Figurenzahl EINER Seite — die Grundlage der Dauer-Schätzung. Genommen
     * wird Weiss; unterscheiden sich die Seiten (Haken „unterschiedliche
     * Armeen"), ist das nah genug für einen groben Anhaltspunkt.
     */
    _figurenJeSeite(brett) {
        let anzahl = 0;

        for (const zeichen of brett) {
            if (zeichen !== "." && zeichen === zeichen.toUpperCase()) {
                anzahl++;
            }
        }

        return anzahl;
    },

    /*
     * Die Partien, aus denen die Zeitmessung lernt: alles, was auf der Tafel
     * liegt. Beendete wie laufende — beide tragen echte Sekunden und echte
     * Züge bei, und `sekundenJeHalbzug` verwirft von selbst, was zu kurz ist.
     */
    _gespieltePartien() {
        const daten = TEAM_SCHACH.abgleich && TEAM_SCHACH.abgleich.daten;
        const partien = (daten && Array.isArray(daten.partien)) ? daten.partien : [];

        return partien;
    },

    /* „12 Figuren je Seite" — oder beide Zahlen, wenn sie sich unterscheiden. */
    _figurenText(brett) {
        let weiss = 0;
        let schwarz = 0;

        for (const zeichen of brett) {
            if (zeichen === ".") {
                continue;
            }
            if (zeichen === zeichen.toUpperCase()) {
                weiss++;
            } else {
                schwarz++;
            }
        }

        if (weiss === schwarz) {
            return weiss + " Figuren je Seite";
        }
        return weiss + " gegen " + schwarz + " Figuren";
    },

    /*
     * Das Vorschaubild: ein Miniaturbrett aus DERSELBEN Aufstellung, aus der
     * auch das echte Brett entsteht. Deshalb kann es nicht veralten — wer eine
     * Spielart ändert, ändert ihr Bild automatisch mit. Eine gezeichnete Datei
     * je Spielart wäre die zweite Wahrheit, die irgendwann von der ersten
     * abweicht.
     */
    _vorschauBauen(variante, brett) {
        /* `brett` ist wahlfrei — ohne Angabe die feste Aufstellung der
           Spielart (seit v0.83; davor gab es nur diese eine Quelle). */
        const stellung = brett || variante.aufstellung;

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

            const figur = stellung[feld];
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

        /*
         * DER WEG ZU DEN SCHACHREGELN (seit v0.96).
         *
         * Er steht in der ÜBERSICHT und nicht erst in einer laufenden Partie:
         * Wer Schach nicht kann, soll nachlesen können, BEVOR er einem Team
         * beitritt. Die Fähigkeiten-Bibliothek erreicht man weiterhin über das
         * i beim Anlegen und über den Vorrat — sie beantwortet die zweite
         * Frage, nicht die erste.
         */
        kopf.appendChild(TEAM_SCHACH._grundlagenKnopfBauen());
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

        /*
         * MIT WELCHER VERSION SIE ANGELEGT WURDE (seit v0.77) — aber NUR, wenn
         * es eine andere als die laufende ist.
         *
         * Sonst stünde an jeder Karte dieselbe Nummer, und eine Angabe, die
         * immer gleich ist, liest nach zwei Tagen niemand mehr. Interessant ist
         * sie genau dann, wenn die Partie älter ist als die Seite: Dann
         * beantwortet sie beim Melden eines Fehlers die erste Rückfrage
         * („welcher Stand war das?"), ohne dass jemand sie stellen muss.
         *
         * Eine Partie von vor v0.77 trägt den Stempel nicht; dann bleibt die
         * Zeile weg, statt „unbekannt" zu behaupten.
         */
        const jetzt = SCHACH_RUNDE._appVersion();
        if (partie.angelegtMit && jetzt && partie.angelegtMit !== jetzt) {
            karte.appendChild(TEAM_SCHACH._element("p", "partie-zeile partie-herkunft",
                "Angelegt mit v" + partie.angelegtMit + " — die Seite läuft mit v"
                + jetzt + "."));
        }

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
