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
    titel: "Würfel Quiz",

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

    /*
     * Läuft gerade eine Anmeldung? Solange ja, darf keine zweite starten —
     * sonst öffnen sich mehrere Dialoge übereinander, von denen nur der letzte
     * sichtbar ist, und es sieht aus, als lade die Seite immer wieder neu.
     */
    anmeldenLaeuft: false,

    verbinden(abgleich) {
        WUERFEL_QUIZZ.abgleich = abgleich;
    },

    /* Setzt an einer Stelle, wer an diesem Gerät sitzt — die Abgleich-Schicht
       braucht das, um beim Schreiben den eigenen Eintrag zu erkennen. */
    _ichIdSetzen(id) {
        WUERFEL_QUIZZ.ichId = id;
        WUERFEL_QUIZZ.abgleich.eigeneIdSetzen(id);
    },

    aufbauen(behaelter) {
        WUERFEL_QUIZZ.wurzelEl = document.createElement("div");
        WUERFEL_QUIZZ.wurzelEl.className = "spiel";
        behaelter.appendChild(WUERFEL_QUIZZ.wurzelEl);
    },

    /* Bei jedem Wechsel auf diesen Tab den aktuellen Stand zeichnen
       (Begründung im Kopf von tabs.js). */
    beimOeffnen() {
        if (WUERFEL_QUIZZ.abgleich) {
            WUERFEL_QUIZZ.zeichnen(WUERFEL_QUIZZ.abgleich.daten);
        }
    },

    /* ---------------------------------------------------------------- *
     * Anmelden
     * ---------------------------------------------------------------- */

    /*
     * Sorgt dafür, dass es zu diesem Gerät einen Spieler gibt. Wird von app.js
     * einmal nach dem ersten Laden aufgerufen.
     *
     * Drei Wege hinein:
     *   1. Das Gerät kennt seinen Spieler schon — nichts zu tun.
     *   2. Man wählt sich aus der Liste der Mitspieler und weist sich mit der
     *      PIN aus. Das geht von jedem Gerät aus.
     *   3. Man meldet sich neu an: Name und PIN festlegen.
     */
    async anmelden() {
        /* Nur eine Anmeldung gleichzeitig. */
        if (WUERFEL_QUIZZ.anmeldenLaeuft) {
            return;
        }
        WUERFEL_QUIZZ.anmeldenLaeuft = true;
        try {
            await WUERFEL_QUIZZ._anmeldenAblauf();
        } finally {
            WUERFEL_QUIZZ.anmeldenLaeuft = false;
        }
    },

    async _anmeldenAblauf() {
        const abgleich = WUERFEL_QUIZZ.abgleich;
        const person = ICH.person();

        /* Weg 1: bekanntes Gerät, Spieler existiert noch. */
        if (person) {
            const bekannt = MODELL.spielerFinden(abgleich.daten, person.id);
            if (bekannt) {
                WUERFEL_QUIZZ._ichIdSetzen(bekannt.id);
                if (bekannt.name !== person.name) {
                    ICH.personSetzen(bekannt.id, bekannt.name);
                }
                WUERFEL_QUIZZ.zeichnen(abgleich.daten);
                return;
            }
        }

        /* Weg 2: aus der Liste der Mitspieler wählen. */
        const spielerliste = abgleich.daten.spieler;
        if (spielerliste.length > 0) {
            const eintraege = spielerliste.map((spieler) => ({
                beschriftung: spieler.name,
                hinweis: MODELL.hatPin(spieler) ? "mit PIN gesichert" : "ohne PIN angelegt",
                wert: spieler.id
            }));

            const gewaehlt = await DIALOG.liste(
                "Bist du schon dabei?",
                "Wähle deinen Namen, wenn du schon mitspielst — mit deiner PIN "
                    + "kommst du von jedem Gerät aus wieder hinein.",
                eintraege,
                "Ich bin neu hier"
            );

            if (gewaehlt) {
                const erfolg = await WUERFEL_QUIZZ._alsBestehenderAnmelden(gewaehlt);
                if (!erfolg) {
                    /* Abgebrochen oder PIN falsch: von vorn fragen. */
                    await WUERFEL_QUIZZ._anmeldenAblauf();
                }
                return;
            }
        }

        /* Weg 3: neu anmelden. */
        await WUERFEL_QUIZZ._neuAnmelden();
    },

    /* Weg 2: bestehenden Spieler übernehmen, ausgewiesen durch die PIN. */
    async _alsBestehenderAnmelden(spielerId) {
        const abgleich = WUERFEL_QUIZZ.abgleich;
        const spieler = MODELL.spielerFinden(abgleich.daten, spielerId);
        if (!spieler) {
            return false;
        }

        /*
         * Wer ohne PIN angelegt wurde, ist nicht geschützt — dann bleibt nur die
         * Nachfrage. Betrifft Spieler aus der Zeit vor v0.6.
         *
         * Damit die Lücke sich nicht fortsetzt, MUSS anschließend eine PIN
         * vergeben werden: Ab v0.9 hat jeder eine, und das Feld lässt sich
         * nicht leer lassen.
         */
        if (!MODELL.hatPin(spieler)) {
            const binIch = await DIALOG.frage(
                "Ohne PIN angelegt",
                spieler.name + " hat keine PIN hinterlegt, deshalb lässt sich das "
                    + "hier nicht prüfen. Bist du das wirklich?",
                "Ja, das bin ich"
            );
            if (!binIch) {
                return false;
            }

            WUERFEL_QUIZZ._uebernehmen(spieler);
            await WUERFEL_QUIZZ._pinVergeben(
                spieler.id,
                "Jetzt fehlt nur noch deine PIN. Damit kommst du künftig von jedem "
                    + "Gerät wieder als du selbst hinein."
            );
            return true;
        }

        const stellen = KONFIG.verwaltung.pinStellen;

        for (let versuch = 1; versuch <= 3; versuch++) {
            const text = (versuch === 1)
                ? "Gib deine " + stellen + "-stellige PIN ein."
                : "Das war nicht richtig. Noch " + (4 - versuch)
                    + (versuch === 3 ? " Versuch." : " Versuche.");

            const pin = await DIALOG.zahlen("PIN von " + spieler.name, text, stellen, "Anmelden");

            if (pin === null) {
                return false;
            }
            if (await VERSIEGELUNG.pinPruefen(pin, spieler.pinSalz, spieler.pinPruefwert)) {
                WUERFEL_QUIZZ._uebernehmen(spieler);
                return true;
            }
        }

        await DIALOG.hinweis(
            "Dreimal falsch",
            "Die PIN stimmt nicht. Wenn du sie vergessen hast, muss dich jemand mit "
                + "dem Verwaltungs-Zugang aus der Runde entfernen — danach kannst du "
                + "dich neu anmelden."
        );
        return false;
    },

    /* Weg 3: neuer Spieler mit Name und PIN. */
    async _neuAnmelden() {
        const abgleich = WUERFEL_QUIZZ.abgleich;

        /* Name — darf noch nicht vergeben sein. */
        let name = "";
        while (!name) {
            name = await DIALOG.eingabe(
                "Wie heißt du?",
                "Diesen Namen sehen die anderen in der Runde.",
                "",
                "Weiter",
                false
            );

            if (name && MODELL.spielerNachName(abgleich.daten, name)) {
                await DIALOG.hinweis(
                    "Name schon vergeben",
                    name + " spielt bereits mit. Bist du das selbst, melde dich über "
                        + "die Liste mit deiner PIN an. Sonst nimm bitte einen anderen "
                        + "Namen."
                );
                name = "";
            }
        }

        const spielerId = MODELL.idErzeugen();

        /* Erst bekannt machen, wer wir sind — die Abgleich-Schicht braucht das
           beim Schreiben, um den eigenen Eintrag zu erkennen. */
        WUERFEL_QUIZZ._ichIdSetzen(spielerId);
        ICH.personSetzen(spielerId, name);

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.spielerHinzufuegen(abgleich.daten, name, spielerId), true
        );

        await WUERFEL_QUIZZ._pinVergeben(
            spielerId,
            "Denk dir " + KONFIG.verwaltung.pinStellen + " Ziffern aus. Damit kommst "
                + "du auch von einem anderen Handy wieder als du selbst hinein."
        );
    },

    /*
     * Vergibt eine PIN und hinterlegt sie. Bewusst OHNE Abbruch-Möglichkeit:
     * Eine PIN ist Pflicht, sonst könnte sich jeder als jeder ausgeben. Das
     * Feld lässt sich auch nicht leer bestätigen — der Knopf bleibt gesperrt,
     * bis die geforderte Anzahl Ziffern dasteht (siehe dialog.js).
     *
     * Zweimal eingeben, damit ein Vertipper nicht später aussperrt.
     */
    async _pinVergeben(spielerId, einleitung) {
        const stellen = KONFIG.verwaltung.pinStellen;
        let pin = null;

        while (pin === null) {
            const eingabe = await DIALOG.zahlen(
                "PIN festlegen", einleitung, stellen, "Weiter", false
            );
            const wiederholung = await DIALOG.zahlen(
                "PIN wiederholen",
                "Noch einmal dieselben " + stellen + " Ziffern.",
                stellen, "Fertig", false
            );

            if (eingabe === wiederholung) {
                pin = eingabe;
            } else {
                await DIALOG.hinweis(
                    "Die beiden stimmen nicht überein",
                    "Damit du dich später nicht aussperrst, muss die PIN zweimal "
                        + "gleich eingegeben werden. Noch einmal."
                );
            }
        }

        const salz = VERSIEGELUNG.verfuegbar() ? VERSIEGELUNG.salzErzeugen() : "";
        const pinPruefwert = await VERSIEGELUNG.pinPruefwertBilden(pin, salz);

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.pinSetzen(WUERFEL_QUIZZ.abgleich.daten, spielerId, pinPruefwert, salz),
            true
        );
    },

    /* Ab jetzt ist dieses Gerät dieser Spieler. */
    _uebernehmen(spieler) {
        WUERFEL_QUIZZ._ichIdSetzen(spieler.id);
        ICH.personSetzen(spieler.id, spieler.name);
        WUERFEL_QUIZZ.wuerfelSichtbar = false;
        WUERFEL_QUIZZ.zeichnen(WUERFEL_QUIZZ.abgleich.daten);
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
            /* Den eigenen Spieler gibt es nicht mehr — er wurde über die
               Verwaltung entfernt. Neu anmelden.
               (Dass er durch ein Überschreiben verschwindet, verhindert seit
               v0.8 MODELL.zusammenfuehren.) */
            if (!WUERFEL_QUIZZ.anmeldenLaeuft) {
                WUERFEL_QUIZZ._ichIdSetzen(null);
                ICH.personVergessen();
                WUERFEL_QUIZZ.anmelden();
            }
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

        if (ICH.verwaltungAktiv()) {
            leiste.appendChild(WUERFEL_QUIZZ._element("span", "chip chip-verwaltung",
                "Verwaltung aktiv"));
        }

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
        kopf.appendChild(WUERFEL_QUIZZ._knopf("Profil", "knopf-still knopf-klein",
            () => WUERFEL_QUIZZ.profilOeffnen(ich)));

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
                (spalte, wert) => WUERFEL_QUIZZ.meinenWuerfelSetzen(ich, spalte, wert),
                "Deine Würfel"
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
            (spalte, wert) => WUERFEL_QUIZZ.tippSetzen(ziel.id, spalte, wert),
            "Vermutung für " + ziel.name
        ));

        if (ICH.verwaltungAktiv()) {
            const leiste = WUERFEL_QUIZZ._element("div", "karte-fuss");
            leiste.appendChild(WUERFEL_QUIZZ._entfernenKnopfBauen(ziel));
            karte.appendChild(leiste);
        }

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

                const wertung = MODELL.punkte(ziel.wuerfel, tipp);
                zeile.appendChild(WUERFEL_QUIZZ._element(
                    "span",
                    "treffer " + (wertung.punkte > 0 ? "treffer-gut" : ""),
                    wertung.punkte + " Punkte"
                        + " (" + wertung.exakt + " genau"
                        + (wertung.nah > 0 ? ", " + wertung.nah + " knapp" : "") + ")"
                ));

                liste.appendChild(zeile);
            }

            karte.appendChild(liste);
        }

        if (ICH.verwaltungAktiv()) {
            const leiste = WUERFEL_QUIZZ._element("div", "karte-fuss");
            leiste.appendChild(WUERFEL_QUIZZ._entfernenKnopfBauen(ziel));
            karte.appendChild(leiste);
        }

        return karte;
    },

    /* ---------------------------------------------------------------- *
     * Bestenliste
     * ---------------------------------------------------------------- */

    _bestenlisteBauen(daten) {
        const bereich = WUERFEL_QUIZZ._element("section", "karte karte-ergebnis");

        /* Überschrift mit dem i-Knopf, der die Punkteregeln erklärt. */
        const kopf = WUERFEL_QUIZZ._element("div", "karte-kopf");
        kopf.appendChild(WUERFEL_QUIZZ._element("h3", "", "Punktestand"));
        kopf.appendChild(WUERFEL_QUIZZ._infoKnopfBauen());
        bereich.appendChild(kopf);

        const ergebnis = MODELL.ergebnis(daten);

        const tabelle = document.createElement("table");
        tabelle.className = "ergebnis-tabelle";

        const tabellenkopf = document.createElement("thead");
        const kopfzeile = document.createElement("tr");
        for (const titel of ["Platz", "Name", "Punkte"]) {
            const zelle = document.createElement("th");
            zelle.textContent = titel;
            kopfzeile.appendChild(zelle);
        }
        tabellenkopf.appendChild(kopfzeile);
        tabelle.appendChild(tabellenkopf);

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
            nameZelle.appendChild(WUERFEL_QUIZZ._element("span", "", eintrag.name));
            nameZelle.appendChild(WUERFEL_QUIZZ._element(
                "span", "ergebnis-detail",
                eintrag.exakt + " genau, " + eintrag.nah + " knapp daneben"
                    + (eintrag.bonus > 0 ? ", " + eintrag.bonus + " Bonus" : "")
            ));
            zeile.appendChild(nameZelle);

            const punkteZelle = document.createElement("td");
            punkteZelle.className = "ergebnis-punkte";
            punkteZelle.appendChild(WUERFEL_QUIZZ._element("span", "punkte-zahl",
                String(eintrag.punkte)));
            punkteZelle.appendChild(WUERFEL_QUIZZ._element("span", "punkte-von",
                "von " + eintrag.moeglich));
            zeile.appendChild(punkteZelle);

            koerper.appendChild(zeile);
        }
        tabelle.appendChild(koerper);

        bereich.appendChild(tabelle);
        bereich.appendChild(WUERFEL_QUIZZ._element("p", "erklaerung",
            "Mitgezählt wird nur, wer schon aufgedeckt hat — der Stand wächst "
            + "also mit. Wie die Punkte zustande kommen, steht hinter dem i."));

        return bereich;
    },

    /* Der i-Knopf: erklärt die Punkteregeln im Wortlaut aus modell.js. */
    _infoKnopfBauen() {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "info-knopf";
        knopf.textContent = "i";
        knopf.setAttribute("aria-label", "Wie werden die Punkte vergeben?");
        knopf.title = "Wie werden die Punkte vergeben?";
        knopf.addEventListener("click", () => {
            DIALOG.hinweis("Punkte", MODELL.punkteErklaerung());
        });
        return knopf;
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

        leiste.appendChild(WUERFEL_QUIZZ._knopf(
            ICH.verwaltungAktiv() ? "Verwaltung beenden" : "Verwaltung",
            "knopf-still knopf-klein",
            () => WUERFEL_QUIZZ.verwaltungUmschalten()
        ));

        return leiste;
    },

    /* ---------------------------------------------------------------- *
     * Verwaltung
     *
     * Ein Zugang für denjenigen, der die Runde betreut: Er darf Spieler aus
     * der Runde entfernen — etwa jemanden, der sich doppelt angemeldet oder
     * seine PIN vergessen hat. Mehr kann die Verwaltung nicht; insbesondere
     * sieht auch sie keine fremden Würfel, denn die liegen auf fremden Geräten.
     * ---------------------------------------------------------------- */

    async verwaltungUmschalten() {
        if (ICH.verwaltungAktiv()) {
            ICH.verwaltungSetzen(false);
            WUERFEL_QUIZZ.zeichnen(WUERFEL_QUIZZ.abgleich.daten);
            return;
        }

        const darf = await VERWALTUNG.verlangen(
            "Verwaltung",
            "Passwort eingeben. Damit lassen sich Spieler aus der Runde entfernen, "
                + "Partien und Räume löschen und die Wortbibliothek ändern."
        );
        if (!darf) {
            return;
        }

        WUERFEL_QUIZZ.zeichnen(WUERFEL_QUIZZ.abgleich.daten);
    },

    /* Knopf zum Entfernen eines Spielers; nur in der Verwaltung sichtbar. */
    _entfernenKnopfBauen(ziel) {
        return WUERFEL_QUIZZ._knopf(
            "Spieler entfernen",
            "knopf-gefahr knopf-klein",
            () => WUERFEL_QUIZZ.spielerEntfernen(ziel)
        );
    },

    async spielerEntfernen(ziel) {
        const ja = await DIALOG.frage(
            "Spieler entfernen?",
            ziel.name + " wird aus der Runde entfernt, mit Würfeln und Vermutungen. "
                + "Die Person kann sich danach neu anmelden — auch mit neuer PIN.",
            "Entfernen",
            true
        );
        if (!ja) {
            return;
        }

        /* Betrifft absichtlich einen fremden Eintrag: ohne Zusammenführung. */
        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.spielerEntfernen(WUERFEL_QUIZZ.abgleich.daten, ziel.id),
            true,
            true
        );
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

    /*
     * Neue Runde — nur mit dem Verwaltungs-Passwort.
     *
     * Der Knopf steht bei jedem, aber er löscht bei ALLEN die Würfel und
     * Vermutungen. Ein Fehlgriff mitten im Spiel wäre nicht rückgängig zu
     * machen, deshalb muss man sich vorher ausweisen. Wer die Verwaltung ohnehin
     * offen hat, wird nicht noch einmal gefragt.
     */
    async neueRunde() {
        const darf = await VERWALTUNG.verlangen(
            "Neue Runde",
            "Eine neue Runde löscht Würfel und Vermutungen bei allen Mitspielern. "
                + "Das darf nur, wer das Passwort kennt."
        );
        if (!darf) {
            return;
        }

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

        /* Betrifft absichtlich alle Einträge: ohne Zusammenführung schreiben. */
        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.neueRunde(WUERFEL_QUIZZ.abgleich.daten),
            true,
            true
        );
    },

    /* ---------------------------------------------------------------- *
     * Profil — Name und PIN ändern
     * ---------------------------------------------------------------- */

    async profilOeffnen(ich) {
        const stellen = KONFIG.verwaltung.pinStellen;

        const wahl = await DIALOG.liste(
            "Dein Profil",
            "Was möchtest du ändern?",
            [
                {
                    beschriftung: "Name ändern",
                    hinweis: "Zurzeit: " + ich.name,
                    wert: "name"
                },
                {
                    beschriftung: "PIN ändern",
                    hinweis: MODELL.hatPin(ich)
                        ? stellen + " Ziffern für die Anmeldung auf anderen Geräten"
                        : "Noch keine PIN hinterlegt",
                    wert: "pin"
                }
            ],
            "Schließen"
        );

        if (wahl === "name") {
            await WUERFEL_QUIZZ.namenAendern(ich);
        } else if (wahl === "pin") {
            await WUERFEL_QUIZZ.pinAendern(ich);
        }
    },

    async namenAendern(ich) {
        const name = await DIALOG.eingabe(
            "Name ändern",
            "Unter welchem Namen sollen dich die anderen sehen?",
            ich.name,
            "Übernehmen",
            true
        );
        if (!name || name === ich.name) {
            return;
        }

        /* Der Name ist zugleich das, woran man sich beim Anmelden wiedererkennt —
           doppelte Namen würden die Liste unbrauchbar machen. */
        const vorhanden = MODELL.spielerNachName(WUERFEL_QUIZZ.abgleich.daten, name);
        if (vorhanden && vorhanden.id !== ich.id) {
            await DIALOG.hinweis(
                "Name schon vergeben",
                name + " spielt bereits mit. Nimm bitte einen anderen Namen."
            );
            return;
        }

        ICH.personSetzen(ich.id, name);
        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.nameSetzen(WUERFEL_QUIZZ.abgleich.daten, ich.id, name),
            true
        );
    },

    /*
     * PIN ändern. Wer schon eine hat, muss sie zuerst eingeben — sonst könnte
     * jemand an einem kurz unbeaufsichtigten Handy die PIN austauschen und den
     * Zugang übernehmen.
     */
    async pinAendern(ich) {
        const stellen = KONFIG.verwaltung.pinStellen;

        if (MODELL.hatPin(ich)) {
            const alte = await DIALOG.zahlen(
                "Bisherige PIN",
                "Zur Sicherheit zuerst deine bisherige PIN.",
                stellen, "Weiter"
            );
            if (alte === null) {
                return;
            }
            if (!await VERSIEGELUNG.pinPruefen(alte, ich.pinSalz, ich.pinPruefwert)) {
                await DIALOG.hinweis(
                    "PIN stimmt nicht",
                    "Die bisherige PIN war falsch. Es wurde nichts geändert."
                );
                return;
            }
        }

        let neue = null;
        while (neue === null) {
            const eingabe = await DIALOG.zahlen(
                "Neue PIN",
                "Denk dir " + stellen + " Ziffern aus.",
                stellen, "Weiter"
            );
            if (eingabe === null) {
                return;
            }

            const wiederholung = await DIALOG.zahlen(
                "Neue PIN wiederholen",
                "Noch einmal dieselben " + stellen + " Ziffern.",
                stellen, "Speichern"
            );
            if (wiederholung === null) {
                return;
            }

            if (eingabe === wiederholung) {
                neue = eingabe;
            } else {
                await DIALOG.hinweis(
                    "Die beiden stimmen nicht überein",
                    "Damit du dich nicht aussperrst, muss die neue PIN zweimal "
                        + "gleich eingegeben werden. Noch einmal."
                );
            }
        }

        /* Neues Salz zur neuen PIN — sonst bliebe der alte Prüfwert vergleichbar. */
        const salz = VERSIEGELUNG.verfuegbar() ? VERSIEGELUNG.salzErzeugen() : "";
        const pinPruefwert = await VERSIEGELUNG.pinPruefwertBilden(neue, salz);

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.pinSetzen(WUERFEL_QUIZZ.abgleich.daten, ich.id, pinPruefwert, salz),
            true
        );

        await DIALOG.hinweis(
            "PIN geändert",
            "Ab sofort meldest du dich auf anderen Geräten mit der neuen PIN an."
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
        WUERFEL_QUIZZ._ichIdSetzen(null);
        WUERFEL_QUIZZ.wuerfelSichtbar = false;

        WUERFEL_QUIZZ.abgleich.aendern(
            MODELL.spielerEntfernen(WUERFEL_QUIZZ.abgleich.daten, id),
            true,
            true
        );
        WUERFEL_QUIZZ.anmelden();
    },

    /* ---------------------------------------------------------------- *
     * Bausteine
     * ---------------------------------------------------------------- */

    /*
     * Eine Reihe aus fünf Auswahlfeldern. `beiAenderung(spalte, wert)`.
     *
     * Die Felder tragen ABSICHTLICH keine sichtbare Nummer. Eine Beschriftung
     * wie "Würfel 1" legt nahe, man müsse Platz für Platz richtig raten — das
     * Gegenteil ist der Fall: Gezählt wird, welche Werte vorkommen, nicht wo
     * sie stehen (siehe MODELL.treffer). Für Vorleseprogramme steht die Nummer
     * weiterhin im aria-label.
     */
    _wuerfelZeileBauen(werte, schluessel, beiAenderung, titel) {
        const halter = WUERFEL_QUIZZ._element("div", "wuerfel-block");
        halter.appendChild(WUERFEL_QUIZZ._element("p", "reihenfolge-hinweis",
            "Reihenfolge egal — es zählt nur, welche Werte vorkommen."));

        const reihe = WUERFEL_QUIZZ._element("div", "wuerfel-reihe");

        for (let spalte = 0; spalte < MODELL.WUERFEL_ANZAHL; spalte++) {
            const feld = WUERFEL_QUIZZ._element("label", "wuerfel-feld-halter");

            const auswahl = document.createElement("select");
            auswahl.className = "wuerfel-feld";
            auswahl.dataset.schluessel = schluessel + "-" + spalte;
            auswahl.setAttribute("aria-label", (titel || "Würfel") + ", Feld "
                + (spalte + 1) + " von " + MODELL.WUERFEL_ANZAHL);

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

        halter.appendChild(reihe);
        return halter;
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
