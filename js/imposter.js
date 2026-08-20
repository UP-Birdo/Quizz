/*
 * imposter.js — der Tab "Imposter": das Spiel auf dem Bildschirm.
 *
 * So läuft es:
 *   1. Einer legt einen RAUM an: Thema, wie viele Imposter, Name. Damit stehen
 *      die Regeln fest — er tritt gleich selbst bei.
 *   2. Die anderen sehen den Raum in der Übersicht und treten bei.
 *   3. Alle drücken "bereit" — dann beginnt die Runde.
 *   4. Jeder sieht GROSS das Wort; die Imposter sehen stattdessen "Imposter".
 *   5. Die Uhr läuft. Am Tisch stellt man sich Fragen; nebenbei tippt jeder
 *      die anderen als Neutral, Verdächtig oder Unverdächtig ein, und der
 *      Imposter rät das Wort.
 *   6. Sind alle fertig, kommt die Auflösung mit Punkten.
 *
 * SEIT v3.2: RÄUME STATT EINER RUNDE
 * Vorher gab es genau eine Runde, und jeder konnte Thema und Anzahl umstellen —
 * mit dem Ergebnis, dass sie sich gegenseitig verstellt wurden. Jetzt gilt
 * dasselbe Prinzip wie beim Team Schach: Wer anlegt, entscheidet; danach sind
 * die Einstellungen fest, und mehrere Räume laufen nebeneinander.
 *
 * Diese Datei kennt nur den Bildschirm. Die Regeln stehen in
 * imposter-runde.js, die Räume in imposter-tafel.js, die Wörter in
 * imposter-woerter.js.
 *
 * DAS WORT WIRD NUR GEZEIGT, NIE GESPEICHERT: Es wird bei jedem Zeichnen neu
 * aus dem Salz gerechnet (IMPOSTER_RUNDE.wortVon). Was in der Datenbank steht,
 * verrät es nicht.
 */

const IMPOSTER = {

    id: "imposter",
    titel: "Imposter",

    /* Wird von app.js gesetzt. */
    abgleich: null,

    wurzelEl: null,

    /* Welcher Raum ist offen? Leer heißt: die Übersicht. */
    offeneId: "",

    /* Ist die Ansicht zum Anlegen offen? */
    auswahlOffen: false,

    /* Die Einstellungen für den Raum, der gerade angelegt wird. */
    neueEinstellungen: {
        impostermenge: 1,
        /* Der Wortart-Filter (seit v3.7); "alle" heisst: keiner. */
        wortart: "alle"
    },

    /* Zeitgeber für die laufende Uhr. */
    uhrZeitgeber: null,

    /* Ist die Wortbibliothek offen? Nur mit Verwaltungs-Zugang. */
    bibliothekOffen: false,

    /* Verhindert zwei Schreibvorgänge gleichzeitig. */
    schreibtGerade: false,

    verbinden(abgleich) {
        IMPOSTER.abgleich = abgleich;
    },

    aufbauen(behaelter) {
        IMPOSTER.wurzelEl = document.createElement("div");
        IMPOSTER.wurzelEl.className = "imposter";
        behaelter.appendChild(IMPOSTER.wurzelEl);
    },

    beimOeffnen() {
        if (IMPOSTER.abgleich) {
            IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
        }
    },

    /* Wer sitzt an diesem Gerät? Die Anmeldung läuft über den Würfel-Quizz. */
    _ich() {
        return ICH.person();
    },

    /* Name eines Mitspielers aus dem Würfel-Quizz. */
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
     * Zeichnen
     * ---------------------------------------------------------------- */

    zeichnen(tafel) {
        const wurzel = IMPOSTER.wurzelEl;
        if (!wurzel) {
            return;
        }

        wurzel.innerHTML = "";

        const person = IMPOSTER._ich();
        if (!person) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Melde dich zuerst im Tab Würfel Quiz an — dann bist du auch hier "
                + "mit deinem Namen dabei."));
            return;
        }

        /* Die Bibliothek liegt vor allem anderen — sie ist ein eigener Raum. */
        if (IMPOSTER.bibliothekOffen && ICH.verwaltungAktiv()) {
            IMPOSTER._bibliothekZeichnen(wurzel, tafel);
            return;
        }

        if (IMPOSTER.auswahlOffen) {
            IMPOSTER._auswahlZeichnen(wurzel);
            return;
        }

        const raum = IMPOSTER.offeneId
            ? IMPOSTER_TAFEL.raum(tafel, IMPOSTER.offeneId)
            : null;

        if (!raum) {
            IMPOSTER.offeneId = "";
            IMPOSTER._uebersichtZeichnen(wurzel, tafel, person);
            return;
        }

        wurzel.appendChild(IMPOSTER._raumKopfBauen(raum));

        if (raum.phase === "aufloesung") {
            IMPOSTER._aufloesungZeichnen(wurzel, raum, person);
        } else if (raum.phase === "laeuft") {
            IMPOSTER._rundeZeichnen(wurzel, raum, person);
        } else {
            IMPOSTER._wartenZeichnen(wurzel, raum, person);
        }
    },

    _raumKopfBauen(raum) {
        const kopf = IMPOSTER._element("div", "partie-kopf");
        kopf.appendChild(IMPOSTER._knopf("Zurück", "knopf-still knopf-klein",
            () => IMPOSTER.uebersichtOeffnen()));
        kopf.appendChild(IMPOSTER._element("h2", "partie-titel", raum.titel));
        kopf.appendChild(IMPOSTER._knopf("Umbenennen", "knopf-still knopf-klein",
            () => IMPOSTER.umbenennen(raum)));
        return kopf;
    },

    /* ---------------------------------------------------------------- *
     * Übersicht: alle Räume
     * ---------------------------------------------------------------- */

    _uebersichtZeichnen(wurzel, tafel, person) {
        const alle = IMPOSTER_TAFEL.liste(tafel);
        const offene = alle.filter((raum) => raum.phase !== "aufloesung");
        const fertige = alle.filter((raum) => raum.phase === "aufloesung");

        const leiste = IMPOSTER._element("div", "phasen-leiste");
        leiste.appendChild(IMPOSTER._element("span", "phasen-text",
            "Offene Räume: " + offene.length));
        leiste.appendChild(IMPOSTER._infoKnopfBauen());
        wurzel.appendChild(leiste);

        wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
            "Alle bekommen dasselbe Wort — bis auf die Imposter, die nur wissen, "
            + "dass sie es nicht wissen. Stellt euch am Tisch Fragen dazu und "
            + "findet heraus, wer nichts weiß."));

        if (offene.length === 0) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Es ist kein Raum offen. Leg einen an, wähle das Thema — und die "
                + "anderen treten bei."));
        }

        for (const raum of offene) {
            wurzel.appendChild(IMPOSTER._raumKarteBauen(raum, person));
        }

        /*
         * Aufgelöste Räume stehen nicht mehr zwischen den offenen: Sie sind
         * gespielt, ihre Punkte sind festgeschrieben. Weggeworfen werden sie
         * trotzdem nicht — man kann die Auflösung noch einmal nachlesen.
         */
        if (fertige.length > 0) {
            const kasten = document.createElement("details");
            kasten.className = "verlauf-kasten";

            const titel = document.createElement("summary");
            titel.className = "verlauf-titel";
            titel.textContent = "Aufgelöst (" + fertige.length + ")";
            kasten.appendChild(titel);

            for (const raum of fertige) {
                kasten.appendChild(IMPOSTER._raumKarteBauen(raum, person));
            }

            wurzel.appendChild(kasten);
        }

        const fuss = IMPOSTER._element("div", "fussleiste");

        /*
         * DER KNOPF ERSCHEINT NUR MIT VERWALTUNGS-ZUGANG (seit v3.7).
         *
         * Bis v3.6 stand er für alle da und fragte beim Drücken nach dem
         * Passwort. Das war zwar dicht, aber es lud dazu ein, es zu
         * probieren — und es verriet jedem, dass es hier etwas zu holen gibt.
         * Wer die Wortliste sieht, hat als Imposter einen Vorteil; also soll
         * der Weg dorthin gar nicht erst sichtbar sein.
         *
         * Den Verwaltungs-Zugang bekommt man im Tab Würfel Quiz. Das steht
         * auch hinter dem i, damit niemand suchen muss.
         */
        if (ICH.verwaltungAktiv()) {
            fuss.appendChild(IMPOSTER._knopf("Wortbibliothek", "knopf-still knopf-klein",
                () => IMPOSTER.bibliothekOeffnen()));
        }

        fuss.appendChild(IMPOSTER._knopf("Neuer Raum", "knopf-haupt",
            () => IMPOSTER.raumAnlegen()));
        wurzel.appendChild(fuss);
    },

    _raumKarteBauen(raum, person) {
        const karte = IMPOSTER._element("section", "karte partie-karte");
        const dabei = !!IMPOSTER_RUNDE.spielerFinden(raum, person.id);

        const kopf = IMPOSTER._element("div", "karte-kopf");
        kopf.appendChild(IMPOSTER._element("h3", "", raum.titel));

        if (dabei) {
            kopf.appendChild(IMPOSTER._element("span", "chip chip-fertig", "Du bist dabei"));
        }
        if (raum.phase === "laeuft") {
            kopf.appendChild(IMPOSTER._element("span", "chip chip-laeuft", "läuft"));
        } else if (raum.phase === "aufloesung") {
            kopf.appendChild(IMPOSTER._element("span", "chip chip-offen", "aufgelöst"));
        }
        karte.appendChild(kopf);

        /*
         * Das THEMA steht hier — die Wörter nicht. Zu wissen, dass es um Essen
         * geht, gehört zum Spiel; die Liste zu kennen, wäre ein Vorteil für den
         * Imposter (deshalb liegt sie hinter dem Verwaltungs-Passwort).
         */
        karte.appendChild(IMPOSTER._element("p", "partie-zeile",
            IMPOSTER_WOERTER.gruppe(raum.gruppe).titel
            + " — höchstens " + raum.impostermenge + " Imposter"));

        const namen = raum.spieler.map((eintrag) => IMPOSTER._nameVon(eintrag.id));
        karte.appendChild(IMPOSTER._element("p", "team-namen",
            "Dabei: " + (namen.length ? namen.join(", ") : "noch niemand")));

        const leiste = IMPOSTER._element("div", "karte-fuss");
        leiste.appendChild(IMPOSTER._knopf("Öffnen", "knopf-still knopf-klein",
            () => IMPOSTER.raumOeffnen(raum.id)));
        leiste.appendChild(IMPOSTER._knopf("Löschen", "knopf-gefahr knopf-klein",
            () => IMPOSTER.raumLoeschen(raum)));
        karte.appendChild(leiste);

        return karte;
    },

    /* ---------------------------------------------------------------- *
     * Einen Raum anlegen
     *
     * Eine eigene Ansicht statt eines Dialogs — genau wie beim Schach: Erst die
     * Einstellungen, dann als letzter Klick das Thema, dann der Name. Auf dem
     * Handy ist eine volle Seite mit Kacheln besser zu treffen als ein Dialog.
     * ---------------------------------------------------------------- */

    _auswahlZeichnen(wurzel) {
        const kopf = IMPOSTER._element("div", "partie-kopf");
        kopf.appendChild(IMPOSTER._knopf("Zurück", "knopf-still knopf-klein",
            () => IMPOSTER.auswahlSchliessen()));
        kopf.appendChild(IMPOSTER._element("h2", "partie-titel", "Neuer Raum"));
        wurzel.appendChild(kopf);

        wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
            "Die Einstellungen stehen mit dem Anlegen fest und lassen sich später "
            + "nicht mehr ändern. Zuletzt gibst du dem Raum einen Namen."));

        /* Erst die Anzahl … */
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Wie viele Imposter höchstens?"));

        const zahlen = IMPOSTER._element("div", "imposter-knopfreihe");

        for (let nummer = 1; nummer <= IMPOSTER_RUNDE.IMPOSTER_HOECHSTENS; nummer++) {
            const gewaehlt = (nummer === IMPOSTER.neueEinstellungen.impostermenge);
            zahlen.appendChild(IMPOSTER._knopf(String(nummer),
                (gewaehlt ? "knopf-haupt" : "knopf-still") + " knopf-klein",
                () => IMPOSTER.anzahlWaehlen(nummer)));
        }

        karte.appendChild(zahlen);
        karte.appendChild(IMPOSTER._element("p", "erklaerung",
            "Es können auch weniger werden — und ganz selten gar keiner. "
            + "Einer weiß das Wort immer."));
        wurzel.appendChild(karte);

        /*
         * … dann die Wortart als Filter (seit v3.7).
         *
         * Bis v3.6 stand „Nur Verben" als Kachel neben „Alltag", als wäre es
         * dasselbe. Ist es nicht: Jedes Wort hat ein Thema UND eine Wortart.
         * Beides wird jetzt getrennt gewählt — „nur Verben quer durch alle
         * Themen" ist die Auswahl „Alle Themen" plus „Verb".
         */
        const filter = IMPOSTER._element("section", "karte");
        filter.appendChild(IMPOSTER._element("h3", "", "Welche Sorte Wort?"));

        const arten = IMPOSTER._element("div", "imposter-knopfreihe");
        const alle = [{ id: IMPOSTER_WOERTER.ALLE, titel: "Alle" }]
            .concat(IMPOSTER_WOERTER.WORTARTEN);

        for (const wortart of alle) {
            const gewaehlt = (wortart.id === IMPOSTER.neueEinstellungen.wortart);
            arten.appendChild(IMPOSTER._knopf(wortart.titel,
                (gewaehlt ? "knopf-haupt" : "knopf-still") + " knopf-klein",
                () => IMPOSTER.wortartWaehlen(wortart.id)));
        }

        filter.appendChild(arten);
        filter.appendChild(IMPOSTER._element("p", "erklaerung",
            "Nomen sind Dinge, Verben sind Tätigkeiten, Adjektive beschreiben. "
            + "„Alle“ mischt sie."));
        wurzel.appendChild(filter);

        /* … und zuletzt das Thema als letzter Klick. */
        wurzel.appendChild(IMPOSTER._element("h3", "imposter-wahl-titel",
            "Woher kommt das Wort?"));

        const feld = IMPOSTER._element("div", "spielart-feld");

        /* „Alle Themen" zuerst — mit dem Wortart-Filter darüber ist das jetzt
           eine sinnvolle Auswahl und nicht nur eine Verlegenheit. */
        feld.appendChild(IMPOSTER._gruppenKachelBauen({
            id: IMPOSTER_WOERTER.ALLE,
            titel: "Alle Themen",
            beschreibung: "Quer durch alles, was im Katalog steht."
        }));

        for (const gruppe of IMPOSTER_WOERTER.zurAuswahl()) {
            feld.appendChild(IMPOSTER._gruppenKachelBauen(gruppe));
        }

        wurzel.appendChild(feld);
    },

    wortartWaehlen(id) {
        IMPOSTER.neueEinstellungen.wortart = id;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    _gruppenKachelBauen(gruppe) {
        const kachel = document.createElement("button");
        kachel.type = "button";
        kachel.className = "spielart-kachel";
        kachel.addEventListener("click", () => IMPOSTER.gruppeGewaehlt(gruppe.id));

        /* Wie viele Wörter es unter dem gewählten Filter wirklich sind — sonst
           tippt man auf „Alltag" und bekommt mit dem Filter „Verb" eine leere
           Auswahl, ohne es vorher zu ahnen. */
        const anzahl = IMPOSTER_WOERTER.woerter(
            gruppe.id, IMPOSTER.neueEinstellungen.wortart).length;

        const kopf = IMPOSTER._element("div", "spielart-kopf");
        kopf.appendChild(IMPOSTER._element("span", "spielart-titel", gruppe.titel));
        kopf.appendChild(IMPOSTER._element("span", "spielart-masse",
            anzahl + " Wörter"));
        kachel.appendChild(kopf);

        kachel.appendChild(IMPOSTER._element("span", "spielart-text",
            gruppe.beschreibung || "Alles rund um dieses Thema."));

        if (anzahl === 0) {
            kachel.disabled = true;
            kachel.appendChild(IMPOSTER._element("span", "erklaerung",
                "Zu dieser Sorte gibt es hier kein Wort."));
        }

        return kachel;
    },

    /* ---------------------------------------------------------------- *
     * Die Wortbibliothek — nur mit Verwaltungs-Zugang
     *
     * Warum hinter dem Passwort: Wer die Wortliste sieht, hat als Imposter
     * einen Vorteil — er weiß, worauf er raten muss. Der feste Katalog steht
     * zwar im Quelltext und ist damit nicht geheim, aber es macht einen
     * Unterschied, ob man ihn in der Entwicklerkonsole sucht oder ihn auf
     * Knopfdruck bekommt.
     *
     * Sie gilt für ALLE Räume gemeinsam und liegt deshalb auf der Tafel.
     * ---------------------------------------------------------------- */

    async bibliothekOeffnen() {
        const darf = await VERWALTUNG.verlangen(
            "Wortbibliothek",
            "Sie ist der Verwaltung vorbehalten: Wer die Wörter sieht, hat als "
                + "Imposter einen Vorteil."
        );
        if (!darf) {
            return;
        }

        IMPOSTER.bibliothekOffen = true;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    bibliothekSchliessen() {
        IMPOSTER.bibliothekOffen = false;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    _bibliothekZeichnen(wurzel, tafel) {
        const kopf = IMPOSTER._element("div", "partie-kopf");
        kopf.appendChild(IMPOSTER._knopf("Zurück", "knopf-still knopf-klein",
            () => IMPOSTER.bibliothekSchliessen()));
        kopf.appendChild(IMPOSTER._element("h2", "partie-titel", "Wortbibliothek"));
        wurzel.appendChild(kopf);

        wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
            "Hier stehen alle Wörter. Ergänzte Wörter gelten für alle Räume — "
            + "sie liegen im gemeinsamen Stand, damit jedes Gerät aus derselben "
            + "Liste zieht. Der feste Katalog lässt sich hier nicht ändern; er "
            + "steht in js/imposter-woerter.js."));

        /* Die festen Themen, dann die selbst angelegten — sonst könnte man die
           Wörter, die jemand beigesteuert hat, nirgends mehr ansehen. */
        for (const gruppe of IMPOSTER_RUNDE.gruppenZurAuswahl(tafel)) {
            wurzel.appendChild(IMPOSTER._bibliothekGruppeBauen(tafel, gruppe));
        }
    },

    _bibliothekGruppeBauen(tafel, gruppe) {
        const karte = IMPOSTER._element("section", "karte");
        const eigene = tafel.eigeneWoerter[gruppe.id] || [];
        const feste = IMPOSTER_WOERTER.gibtEs(gruppe.id)
            ? IMPOSTER_WOERTER.woerter(gruppe.id)
            : [];

        const kopf = IMPOSTER._element("div", "karte-kopf");
        kopf.appendChild(IMPOSTER._element("h3", "", gruppe.titel));
        kopf.appendChild(IMPOSTER._element("span", "chip chip-offen",
            (feste.length + eigene.length) + " Wörter"));
        karte.appendChild(kopf);

        /* Der feste Teil, zugeklappt — er ist lang und ändert sich nie.
           Je Wortart eine Zeile, damit man sieht, was der Filter findet.
           Ein selbst angelegtes Thema hat keinen; dort entfällt der Kasten. */
        if (feste.length > 0) {
            const kasten = document.createElement("details");
            kasten.className = "verlauf-kasten";

            const titel = document.createElement("summary");
            titel.className = "verlauf-titel";
            titel.textContent = "Fest im Katalog (" + feste.length + ")";
            kasten.appendChild(titel);

            for (const wortart of IMPOSTER_WOERTER.WORTARTEN) {
                const liste = IMPOSTER_WOERTER.woerter(gruppe.id, wortart.id);
                if (liste.length === 0) {
                    continue;
                }
                kasten.appendChild(IMPOSTER._element("p", "erklaerung",
                    wortart.titel + " (" + liste.length + "): " + liste.join(", ")));
            }

            karte.appendChild(kasten);
        } else {
            karte.appendChild(IMPOSTER._element("p", "erklaerung",
                "Ein selbst angelegtes Thema — hier steht nur, was die Mitspieler "
                + "beigesteuert haben."));
        }

        /* Die ergänzten, einzeln entfernbar. */
        if (eigene.length > 0) {
            const liste = IMPOSTER._element("div", "imposter-knopfreihe");

            for (const wort of eigene) {
                /* Die Wortart dahinter, damit man sieht, wo das Wort landet —
                   sie steht in der Bibliothek und nicht am Wort selbst. */
                const art = IMPOSTER_WOERTER.wortartTitel(
                    IMPOSTER_RUNDE.wortartVon(tafel, wort));

                liste.appendChild(IMPOSTER._knopf(wort + " (" + art + ") ×",
                    "knopf-still knopf-klein",
                    () => IMPOSTER.wortEntfernen(gruppe.id, wort)));
            }

            karte.appendChild(IMPOSTER._element("p", "erklaerung",
                "Ergänzt (antippen zum Entfernen):"));
            karte.appendChild(liste);
        }

        const leiste = IMPOSTER._element("div", "karte-fuss");

        for (const wortart of IMPOSTER_WOERTER.WORTARTEN) {
            leiste.appendChild(IMPOSTER._knopf(wortart.titel + " einfügen",
                "knopf-still knopf-klein",
                () => IMPOSTER.woerterImportieren(gruppe.id, wortart.id)));
        }

        karte.appendChild(leiste);
        return karte;
    },

    async woerterImportieren(gruppeId, wortart) {
        const text = await DIALOG.eingabe(
            IMPOSTER_WOERTER.wortartTitel(wortart) + " einfügen",
            "Ein Wort je Zeile. Was schon dasteht, wird übersprungen. Alle Wörter "
                + "aus diesem Kasten werden als " + IMPOSTER_WOERTER.wortartTitel(wortart)
                + " eingetragen.",
            "",
            "Einfügen",
            true
        );
        if (text === null) {
            return;
        }

        let bericht = null;

        const geschrieben = await IMPOSTER._sendenMitLaden((tafel) => {
            const ergebnis = IMPOSTER_TAFEL.woerterErgaenzen(
                tafel, gruppeId, text, undefined, wortart);
            bericht = ergebnis;
            return ergebnis.tafel;
        });

        if (geschrieben && bericht) {
            await DIALOG.hinweis("Eingefügt",
                bericht.hinzugefuegt + " Wörter hinzugefügt"
                + (bericht.uebersprungen > 0
                    ? ", " + bericht.uebersprungen + " übersprungen (schon vorhanden)."
                    : "."));
        }
    },

    async wortEntfernen(gruppeId, wort) {
        await IMPOSTER._sendenMitLaden(
            (tafel) => IMPOSTER_TAFEL.wortEntfernen(tafel, gruppeId, wort));
    },

    /* ---------------------------------------------------------------- *
     * Vor dem Start
     * ---------------------------------------------------------------- */

    _wartenZeichnen(wurzel, raum, person) {
        const dabei = !!IMPOSTER_RUNDE.spielerFinden(raum, person.id);

        const leiste = IMPOSTER._element("div", "phasen-leiste");
        leiste.appendChild(IMPOSTER._element("span", "chip chip-offen", "Noch nicht gestartet"));
        leiste.appendChild(IMPOSTER._element("span", "phasen-text",
            raum.spieler.length + " dabei"));
        leiste.appendChild(IMPOSTER._infoKnopfBauen());
        wurzel.appendChild(leiste);

        wurzel.appendChild(IMPOSTER._einstellungenBauen(raum));
        wurzel.appendChild(IMPOSTER._mitspielerBauen(raum, person));

        const fuss = IMPOSTER._element("div", "fussleiste");

        if (!dabei) {
            fuss.appendChild(IMPOSTER._knopf("Mitspielen", "knopf-haupt",
                () => IMPOSTER.beitreten()));
        } else {
            const eigener = IMPOSTER_RUNDE.spielerFinden(raum, person.id);

            fuss.appendChild(IMPOSTER._knopf(
                eigener.bereit ? "Doch nicht bereit" : "Bereit",
                eigener.bereit ? "knopf-still knopf-klein" : "knopf-haupt",
                () => IMPOSTER.bereitUmschalten(!eigener.bereit)
            ));
            fuss.appendChild(IMPOSTER._knopf("Ich bin raus", "knopf-still knopf-klein",
                () => IMPOSTER.verlassen()));
        }

        wurzel.appendChild(fuss);

        if (IMPOSTER_RUNDE.kannStarten(raum)) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Alle sind bereit — die Runde startet gleich von selbst."));
            IMPOSTER._startPruefen(raum, person);
        } else if (raum.spieler.length < 2) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Es fehlt noch mindestens ein Mitspieler."));
        }
    },

    /*
     * Die Einstellungen des Raums — nur zum Nachlesen. Geändert werden sie
     * beim Anlegen; danach würde ein Umstellen mitten im Warten allen anderen
     * unter den Händen die Regeln verändern.
     */
    _einstellungenBauen(raum) {
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Einstellungen dieses Raums"));

        const zeile = IMPOSTER._element("div", "imposter-zeile");
        zeile.appendChild(IMPOSTER._element("span", "imposter-name", "Thema"));
        zeile.appendChild(IMPOSTER._element("span", "chip chip-offen",
            (raum.gruppe === IMPOSTER_WOERTER.ALLE)
                ? "Alle Themen"
                : IMPOSTER_WOERTER.gruppe(raum.gruppe).titel));
        karte.appendChild(zeile);

        const sorte = IMPOSTER._element("div", "imposter-zeile");
        sorte.appendChild(IMPOSTER._element("span", "imposter-name", "Sorte Wort"));
        sorte.appendChild(IMPOSTER._element("span", "chip chip-offen",
            IMPOSTER_WOERTER.gibtEsWortart(raum.wortart)
                ? IMPOSTER_WOERTER.wortartTitel(raum.wortart)
                : "Alle"));
        karte.appendChild(sorte);

        const anzahl = IMPOSTER._element("div", "imposter-zeile");
        anzahl.appendChild(IMPOSTER._element("span", "imposter-name", "Imposter höchstens"));
        anzahl.appendChild(IMPOSTER._element("span", "chip chip-offen",
            String(raum.impostermenge)));
        karte.appendChild(anzahl);

        karte.appendChild(IMPOSTER._element("p", "erklaerung",
            "Sie stehen seit dem Anlegen fest. Für andere Regeln legt einfach "
            + "einen neuen Raum an — es können mehrere nebeneinander laufen."));

        return karte;
    },

    _mitspielerBauen(raum, person) {
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Wer ist dabei?"));

        if (raum.spieler.length === 0) {
            karte.appendChild(IMPOSTER._element("p", "erklaerung", "Noch niemand."));
            return karte;
        }

        for (const spieler of raum.spieler) {
            const zeile = IMPOSTER._element("div", "imposter-zeile");

            zeile.appendChild(IMPOSTER._element("span",
                "imposter-name" + ((spieler.id === person.id) ? " imposter-ich" : ""),
                IMPOSTER._nameVon(spieler.id)));

            zeile.appendChild(IMPOSTER._element("span",
                "chip " + (spieler.bereit ? "chip-fertig" : "chip-offen"),
                spieler.bereit ? "bereit" : "wartet"));

            karte.appendChild(zeile);
        }

        return karte;
    },

    /* ---------------------------------------------------------------- *
     * Während der Runde
     * ---------------------------------------------------------------- */

    _rundeZeichnen(wurzel, raum, person) {
        const dabei = IMPOSTER_RUNDE.spielerFinden(raum, person.id);

        if (!dabei) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Die Runde läuft gerade. Warte, bis sie vorbei ist — dann kannst "
                + "du bei der nächsten mitspielen."));
            return;
        }

        const istImposter = IMPOSTER_RUNDE.istImposter(raum, person.id);

        /* Das Wort — oder die Nachricht, dass man es nicht bekommt. */
        const kasten = IMPOSTER._element("div",
            "imposter-wort" + (istImposter ? " imposter-wort-rolle" : ""));

        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-marke",
            istImposter ? "Deine Rolle" : "Das Wort"));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-text",
            istImposter ? "Imposter" : IMPOSTER_RUNDE.wortVon(raum)));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-hinweis",
            istImposter
                ? "Du kennst das Wort nicht. Tu so, als wüsstest du es — und rate es."
                : "Beschreibe es, ohne es zu sagen. Wer nichts weiß, fällt auf."));
        wurzel.appendChild(kasten);

        /* Die Uhr. */
        const leiste = IMPOSTER._element("div", "phasen-leiste");
        leiste.appendChild(IMPOSTER._element("span", "chip chip-laeuft", "läuft"));
        leiste.appendChild(IMPOSTER._element("span", "imposter-uhr",
            IMPOSTER._uhrText(raum)));
        leiste.appendChild(IMPOSTER._element("span", "phasen-text",
            raum.spieler.filter((eintrag) => eintrag.fertig).length
            + " von " + raum.spieler.length + " fertig"));
        wurzel.appendChild(leiste);

        /*
         * ALLE bekommen ein Eingabefeld — sonst sieht man am Tisch sofort, wer
         * tippt, und damit wer der Imposter ist. Für die Ehrlichen ist es ein
         * Notizfeld ohne Wirkung auf die Punkte; gewertet wird nur der Tipp
         * eines Imposters.
         */
        wurzel.appendChild(IMPOSTER._wortTippBauen(dabei, istImposter));

        wurzel.appendChild(IMPOSTER._tippsBauen(raum, person, dabei));

        const fuss = IMPOSTER._element("div", "fussleiste");
        fuss.appendChild(IMPOSTER._knopf(
            dabei.fertig ? "Doch noch nicht fertig" : "Fertig",
            dabei.fertig ? "knopf-still knopf-klein" : "knopf-haupt",
            () => IMPOSTER.fertigUmschalten(!dabei.fertig)
        ));
        wurzel.appendChild(fuss);

        wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
            "Sobald alle auf Fertig gedrückt haben, wird aufgelöst."));

        IMPOSTER._uhrVerfolgen(raum);
    },

    _wortTippBauen(eigener, istImposter) {
        const karte = IMPOSTER._element("section", "karte karte-ich");

        /* Dieselbe Überschrift für alle wäre eine Lüge, verschiedene verraten
           nichts: Jeder sieht nur seine eigene. */
        karte.appendChild(IMPOSTER._element("h3", "",
            istImposter ? "Dein Tipp auf das Wort" : "Deine Notiz"));

        const feld = document.createElement("input");
        feld.type = "text";
        feld.className = "dialog-feld";
        feld.value = eigener.wortTipp;
        feld.maxLength = 40;
        feld.placeholder = istImposter ? "Wort eintippen" : "Notiz eintippen";
        feld.addEventListener("change", () => IMPOSTER.wortTippSetzen(feld.value));
        karte.appendChild(feld);

        karte.appendChild(IMPOSTER._element("p", "erklaerung",
            istImposter
                ? "Groß- und Kleinschreibung ist egal, und ein Tippfehler wird verziehen."
                : "Schreib auf, wen du verdächtigst und warum — das zählt für die "
                    + "Punkte nicht. Alle haben dieses Feld, damit am Tisch nicht "
                    + "auffällt, wer gerade tippt."));

        return karte;
    },

    _tippsBauen(raum, person, eigener) {
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Wer ist der Imposter?"));

        const andere = raum.spieler.filter((eintrag) => eintrag.id !== person.id);

        if (andere.length === 0) {
            karte.appendChild(IMPOSTER._element("p", "erklaerung", "Niemand sonst da."));
            return karte;
        }

        for (const spieler of andere) {
            const zeile = IMPOSTER._element("div", "imposter-zeile");

            zeile.appendChild(IMPOSTER._element("span", "imposter-name",
                IMPOSTER._nameVon(spieler.id)));

            if (spieler.fertig) {
                zeile.appendChild(IMPOSTER._element("span", "chip chip-fertig", "fertig"));
            }

            const wahl = IMPOSTER._element("div", "imposter-knopfreihe");
            const jetzt = eigener.tipps[spieler.id] || "neutral";

            const stufen = [
                { wert: "neutral", titel: "Neutral" },
                { wert: "imposter", titel: "Verdächtig" },
                { wert: "save", titel: "Unverdächtig" }
            ];

            for (const stufe of stufen) {
                const gewaehlt = (jetzt === stufe.wert);
                wahl.appendChild(IMPOSTER._knopf(stufe.titel,
                    (gewaehlt ? "knopf-haupt" : "knopf-still") + " knopf-klein"
                        + " imposter-stufe-" + stufe.wert,
                    () => IMPOSTER.tippSetzen(spieler.id, stufe.wert)));
            }

            zeile.appendChild(wahl);
            karte.appendChild(zeile);
        }

        return karte;
    },

    /* ---------------------------------------------------------------- *
     * Auflösung
     * ---------------------------------------------------------------- */

    _aufloesungZeichnen(wurzel, raum, person) {
        const ergebnis = IMPOSTER_RUNDE.ergebnis(raum);
        const meiner = ergebnis.find((eintrag) => eintrag.id === person.id);
        const imposter = IMPOSTER_RUNDE.imposterListe(raum);

        const kasten = IMPOSTER._element("div", "imposter-wort");
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-marke", "Das Wort war"));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-text",
            IMPOSTER_RUNDE.wortVon(raum)));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-hinweis",
            (imposter.length === 0)
                ? "Diesmal gab es gar keinen Imposter."
                : ((imposter.length === 1) ? "Ein Imposter war dabei."
                    : imposter.length + " Imposter waren dabei.")));
        wurzel.appendChild(kasten);

        const dauer = Math.max(0, Math.round((raum.endeAm - raum.startAm) / 1000));
        const leiste = IMPOSTER._element("div", "phasen-leiste");
        leiste.appendChild(IMPOSTER._element("span", "chip chip-fertig", "Aufgelöst"));
        leiste.appendChild(IMPOSTER._element("span", "phasen-text",
            "Gebraucht: " + IMPOSTER._zeitText(dauer)));
        leiste.appendChild(IMPOSTER._infoKnopfBauen());
        wurzel.appendChild(leiste);

        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Auflösung"));

        for (const eintrag of ergebnis.slice().sort((a, b) => b.punkte - a.punkte)) {
            const zeile = IMPOSTER._element("div",
                "imposter-zeile" + ((eintrag.id === person.id) ? " imposter-zeile-ich" : ""));

            zeile.appendChild(IMPOSTER._element("span", "imposter-name",
                IMPOSTER._nameVon(eintrag.id)));

            if (eintrag.imposter) {
                zeile.appendChild(IMPOSTER._element("span", "chip chip-fehler", "Imposter"));
            }
            if (eintrag.wortRichtig) {
                zeile.appendChild(IMPOSTER._element("span", "chip chip-fertig",
                    "Wort erraten"));
            }

            zeile.appendChild(IMPOSTER._element("span", "imposter-treffer",
                eintrag.richtig + " richtig, " + eintrag.falsch + " daneben"));
            zeile.appendChild(IMPOSTER._element("span", "imposter-punkte",
                "+" + eintrag.punkte));

            karte.appendChild(zeile);
        }

        wurzel.appendChild(karte);

        if (meiner) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Deine Punkte zählen im Tab Rangliste mit."));
        }

        const fuss = IMPOSTER._element("div", "fussleiste");
        fuss.appendChild(IMPOSTER._knopf("Neue Runde", "knopf-haupt",
            () => IMPOSTER.neueRunde()));
        wurzel.appendChild(fuss);
    },

    /* ---------------------------------------------------------------- *
     * Uhr
     * ---------------------------------------------------------------- */

    _uhrText(raum) {
        if (!raum.startAm) {
            return "";
        }
        return IMPOSTER._zeitText(Math.max(0, Math.round((Date.now() - raum.startAm) / 1000)));
    },

    _zeitText(sekunden) {
        const minuten = Math.floor(sekunden / 60);
        const rest = sekunden % 60;
        return minuten + ":" + (rest < 10 ? "0" : "") + rest;
    },

    /* Hält die Uhr am Laufen, solange die Runde läuft. */
    _uhrVerfolgen(raum) {
        if (IMPOSTER.uhrZeitgeber !== null) {
            window.clearTimeout(IMPOSTER.uhrZeitgeber);
            IMPOSTER.uhrZeitgeber = null;
        }
        if (raum.phase !== "laeuft") {
            return;
        }

        IMPOSTER.uhrZeitgeber = window.setTimeout(() => {
            IMPOSTER.uhrZeitgeber = null;
            IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
        }, 1000);
    },

    /* ---------------------------------------------------------------- *
     * Bedienung: Räume
     * ---------------------------------------------------------------- */

    raumOeffnen(id) {
        IMPOSTER.offeneId = id;
        IMPOSTER.auswahlOffen = false;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    uebersichtOeffnen() {
        IMPOSTER.offeneId = "";
        IMPOSTER.auswahlOffen = false;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    /* Der Knopf "Neuer Raum" führt in die Anlege-Ansicht. */
    raumAnlegen() {
        if (!IMPOSTER._ich()) {
            return;
        }
        IMPOSTER.auswahlOffen = true;
        IMPOSTER.offeneId = "";
        IMPOSTER.neueEinstellungen = {
            impostermenge: 1,
            wortart: IMPOSTER_WOERTER.ALLE
        };
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    auswahlSchliessen() {
        IMPOSTER.auswahlOffen = false;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    anzahlWaehlen(nummer) {
        IMPOSTER.neueEinstellungen.impostermenge = nummer;
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
    },

    /* Eine Kachel wurde angetippt: Namen erfragen und den Raum anlegen. */
    async gruppeGewaehlt(gruppeId) {
        const person = IMPOSTER._ich();
        const alleThemen = (gruppeId === IMPOSTER_WOERTER.ALLE);

        if (!person || (!alleThemen && !IMPOSTER_WOERTER.gibtEs(gruppeId))) {
            return;
        }

        const wortart = IMPOSTER.neueEinstellungen.wortart;
        const themaTitel = alleThemen
            ? "Alle Themen"
            : IMPOSTER_WOERTER.gruppe(gruppeId).titel;

        /* Ein Vorschlag, der beides nennt — sonst heissen mit dem Filter
           angelegte Räume alle gleich. */
        const vorschlag = IMPOSTER_WOERTER.gibtEsWortart(wortart)
            ? (themaTitel + ", " + IMPOSTER_WOERTER.wortartTitel(wortart))
            : themaTitel;

        const titel = await DIALOG.eingabe(
            "Name des Raums",
            "Damit ihr ihn in der Übersicht wiederfindet.",
            vorschlag,
            "Anlegen",
            true
        );
        if (titel === null) {
            return;
        }

        let neuerRaum = null;

        /*
         * Wer anlegt, spielt mit: Er kommt gleich in den Raum und landet direkt
         * darin. Sonst müsste er erst zurück in die Übersicht und dort
         * beitreten.
         */
        const geschrieben = await IMPOSTER._sendenMitLaden((tafel) => {
            const ergebnis = IMPOSTER_TAFEL.raumAnlegen(tafel, titel, {
                gruppe: gruppeId,
                wortart: wortart,
                impostermenge: IMPOSTER.neueEinstellungen.impostermenge
            });

            neuerRaum = ergebnis.raum;

            return IMPOSTER_TAFEL.raumEinsetzen(ergebnis.tafel,
                IMPOSTER_RUNDE.beitreten(ergebnis.raum, person.id));
        });

        if (geschrieben && neuerRaum) {
            IMPOSTER.auswahlOffen = false;
            IMPOSTER.raumOeffnen(neuerRaum.id);
        }
    },

    /*
     * Löschen ist der Verwaltung vorbehalten (seit v3.3).
     *
     * Der Grund ist beim Imposter zwingender als beim Schach: Ein aufgelöster
     * Raum trägt seine Punkte in der Rangliste, und er ist der EINZIGE Ort, an
     * dem sie stehen — eine Chronik wie beim Schach gibt es hier nicht. Wer den
     * Raum wegwirft, nimmt allen Mitspielern ihre Punkte weg.
     */
    async raumLoeschen(raum) {
        const darf = await VERWALTUNG.verlangen(
            "Raum löschen",
            "Ein gelöschter Raum nimmt allen Mitspielern die Punkte, die sie "
                + "darin geholt haben. Das darf nur, wer das Passwort kennt."
        );
        if (!darf) {
            return;
        }

        const ja = await DIALOG.frage(
            "Raum löschen?",
            "Der Raum " + raum.titel + " wird für alle entfernt. Das lässt sich "
                + "nicht rückgängig machen. Punkte aus schon aufgelösten Runden "
                + "gehen damit auch aus der Rangliste.",
            "Löschen",
            true
        );
        if (!ja) {
            return;
        }

        const geschrieben = await IMPOSTER._sendenMitLaden(
            (tafel) => IMPOSTER_TAFEL.raumEntfernen(tafel, raum.id));

        if (geschrieben && IMPOSTER.offeneId === raum.id) {
            IMPOSTER.uebersichtOeffnen();
        }
    },

    async umbenennen(raum) {
        const titel = await DIALOG.eingabe(
            "Raum umbenennen",
            "Wie soll der Raum in der Übersicht heißen?",
            raum.titel,
            "Übernehmen",
            true
        );
        if (titel === null || titel.trim() === "") {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.umbenennen(raum, titel), true);
    },

    /* ---------------------------------------------------------------- *
     * Bedienung: im Raum
     * ---------------------------------------------------------------- */

    /* Holt den offenen Raum aus dem aktuellen Stand. */
    _offenerRaum() {
        return IMPOSTER_TAFEL.raum(IMPOSTER.abgleich.daten, IMPOSTER.offeneId);
    },

    beitreten() {
        const person = IMPOSTER._ich();
        const raum = IMPOSTER._offenerRaum();
        if (!person || !raum) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.beitreten(raum, person.id));
    },

    verlassen() {
        const person = IMPOSTER._ich();
        const raum = IMPOSTER._offenerRaum();
        if (!person || !raum) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.verlassen(raum, person.id), true);
    },

    async bereitUmschalten(bereit) {
        const person = IMPOSTER._ich();
        const raum = IMPOSTER._offenerRaum();
        if (!person || !raum) {
            return;
        }

        /*
         * VOR JEDER RUNDE EIN EIGENES WORT (seit v3.7).
         *
         * Gefragt wird beim „Bereit", nicht beim Beitreten: In einem Raum, in
         * dem man den ganzen Abend sitzt, wäre eine einmalige Frage am Anfang
         * wertlos — die Wörter sollen ja mit jeder Runde wachsen. Wer nichts
         * beisteuern will, überspringt; niemand wird dadurch aufgehalten.
         */
        if (bereit) {
            await IMPOSTER.wortBeisteuern();
        }

        /* Der Stand kann sich durch das Beisteuern geändert haben — deshalb
           den Raum neu holen statt den alten weiterzureichen. */
        const jetzt = IMPOSTER._offenerRaum() || raum;
        IMPOSTER._aendern(IMPOSTER_RUNDE.bereitSetzen(jetzt, person.id, bereit));
    },

    /*
     * Fragt ein Wort ab und legt es in die gemeinsame Bibliothek.
     *
     * Drei Schritte, alle abbrechbar: das Wort, seine Wortart, sein Thema.
     * Beim Thema darf auch ein neues entstehen — es steht danach allen zur
     * Verfügung, auch in Räumen, die es noch nicht gibt (deshalb liegt es auf
     * der Tafel und nicht im Raum).
     */
    async wortBeisteuern() {
        const wort = await DIALOG.eingabe(
            "Dein Wort für später",
            "Ein Wort, das man beschreiben kann, ohne es zu nennen. Es kommt in "
                + "den gemeinsamen Vorrat — vielleicht schon in dieser Runde. "
                + "Leer lassen und weiter, wenn dir keines einfällt.",
            "",
            "Weiter",
            true
        );

        if (wort === null || wort.trim() === "") {
            return;
        }

        const wortart = await DIALOG.liste(
            "Was für ein Wort ist das?",
            "Danach lässt es sich später filtern.",
            IMPOSTER_WOERTER.WORTARTEN.map((eintrag) => ({
                beschriftung: eintrag.titel,
                hinweis: eintrag.frage,
                wert: eintrag.id
            })),
            "Abbrechen"
        );
        if (!wortart) {
            return;
        }

        const raum = IMPOSTER._offenerRaum();
        const themen = IMPOSTER_RUNDE.gruppenZurAuswahl(raum || {});

        const thema = await DIALOG.liste(
            "Wohin gehört es?",
            "Wähle ein Thema — oder leg ein neues an, das dann alle sehen.",
            themen.map((eintrag) => ({
                beschriftung: eintrag.titel,
                hinweis: eintrag.eigen ? "selbst angelegt" : "",
                wert: eintrag.titel
            })).concat([{
                beschriftung: "Neues Thema …",
                hinweis: "zum Beispiel Gemüse oder Haushalt",
                wert: "*neu*"
            }]),
            "Abbrechen"
        );
        if (!thema) {
            return;
        }

        let titel = thema;

        if (thema === "*neu*") {
            titel = await DIALOG.eingabe(
                "Neues Thema",
                "Wie soll es heißen? Alle sehen es beim nächsten Mal und können "
                    + "ihre Wörter hineinlegen.",
                "",
                "Anlegen",
                true
            );
            if (titel === null || titel.trim() === "") {
                return;
            }
        }

        let bericht = null;

        await IMPOSTER._sendenMitLaden((tafel) => {
            const ergebnis = IMPOSTER_TAFEL.wortBeisteuern(tafel, titel, wort, wortart);
            bericht = ergebnis;
            return ergebnis.tafel;
        });

        if (bericht && bericht.hinzugefuegt === 0 && bericht.uebersprungen > 0) {
            await DIALOG.hinweis("Kennen wir schon",
                "„" + wort.trim() + "“ steht bereits im Vorrat. Es bleibt dabei — "
                    + "doppelte Wörter kämen doppelt so oft dran.");
        }
    },

    tippSetzen(zielId, wert) {
        const person = IMPOSTER._ich();
        const raum = IMPOSTER._offenerRaum();
        if (!person || !raum) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.tippSetzen(raum, person.id, zielId, wert));
    },

    wortTippSetzen(wort) {
        const person = IMPOSTER._ich();
        const raum = IMPOSTER._offenerRaum();
        if (!person || !raum) {
            return;
        }
        IMPOSTER._aendern(
            IMPOSTER_RUNDE.wortTippSetzen(raum, person.id, wort), false, false);
    },

    fertigUmschalten(fertig) {
        const person = IMPOSTER._ich();
        const raum = IMPOSTER._offenerRaum();
        if (!person || !raum) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.fertigSetzen(raum, person.id, fertig));
    },

    async neueRunde() {
        const raum = IMPOSTER._offenerRaum();
        if (!raum) {
            return;
        }

        const ja = await DIALOG.frage(
            "Neue Runde?",
            "Alle Mitspieler bleiben dabei, aber Wort und Rollen werden neu "
                + "verteilt. Die Punkte dieser Runde bleiben in der Rangliste.",
            "Neue Runde",
            false
        );
        if (!ja) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.neueRunde(raum), true);
    },

    /*
     * Startet die Runde, sobald alle bereit sind.
     *
     * Das Salz erzeugt das Gerät, das zuerst dazu kommt — daraus folgen Wort
     * und Rollen für alle. Damit nicht zwei Geräte gleichzeitig starten, wird
     * vorher der Stand vom Server geholt und nur geschrieben, wenn der Raum
     * dort noch wartet.
     */
    async _startPruefen(raum, person) {
        if (IMPOSTER.schreibtGerade || raum.phase !== "warten") {
            return;
        }
        IMPOSTER.schreibtGerade = true;

        try {
            const abgleich = IMPOSTER.abgleich;
            let tafel = abgleich.daten;

            if (abgleich.speicher.art === "gemeinsam") {
                tafel = IMPOSTER_TAFEL.normalisieren(await abgleich.speicher.laden());
            }

            const aktuell = IMPOSTER_TAFEL.raum(tafel, raum.id);

            /* Inzwischen gestartet, gelöscht oder nicht mehr startbereit? */
            if (!aktuell || aktuell.phase !== "warten"
                || !IMPOSTER_RUNDE.kannStarten(aktuell)) {
                abgleich.daten = tafel;
                IMPOSTER.zeichnen(tafel);
                return;
            }

            const gestartet = IMPOSTER_RUNDE.starten(aktuell, IMPOSTER._salzErzeugen());
            if (!gestartet) {
                return;
            }

            const neueTafel = IMPOSTER_TAFEL.raumEinsetzen(tafel, gestartet);
            await abgleich.speicher.speichern(neueTafel);
            abgleich.daten = neueTafel;
            IMPOSTER.zeichnen(neueTafel);
        } catch (fehler) {
            console.warn("Start nicht möglich:", fehler);
        } finally {
            IMPOSTER.schreibtGerade = false;
        }
    },

    /*
     * Ein Salz aus dem Zufallsgenerator des Browsers. Es ist die einzige
     * Zufallsquelle des Spiels — alles Weitere wird daraus gerechnet.
     */
    _salzErzeugen() {
        const zeichen = "abcdefghijklmnopqrstuvwxyz0123456789";
        let salz = "";

        if (window.crypto && window.crypto.getRandomValues) {
            const werte = new Uint8Array(16);
            window.crypto.getRandomValues(werte);

            for (const wert of werte) {
                salz += zeichen[wert % zeichen.length];
            }
            return salz;
        }

        /* Rückfall für Browser ohne Krypto-Teil. */
        for (let stelle = 0; stelle < 16; stelle++) {
            salz += zeichen[Math.floor(Math.random() * zeichen.length)];
        }
        return salz;
    },

    /* ---------------------------------------------------------------- *
     * Schreiben
     * ---------------------------------------------------------------- */

    /*
     * Eine Änderung an EINEM Raum übernehmen. Der Rest der Tafel bleibt, wie er
     * ist — nie die ganze Tafel überschreiben (dieselbe Lehre wie beim Schach
     * und beim Würfel-Quizz, siehe docs\DECISIONS.md).
     *
     * `global` heißt: Die Änderung betrifft absichtlich die ganze Runde (Start,
     * neue Runde, jemanden entfernen) und wird nicht mit dem Stand vom Server
     * zusammengeführt.
     */
    _aendern(neuerRaum, global, neuZeichnen) {
        const tafel = IMPOSTER_TAFEL.raumEinsetzen(IMPOSTER.abgleich.daten, neuerRaum);
        IMPOSTER.abgleich.aendern(tafel, neuZeichnen !== false, global === true);
    },

    /*
     * Für Änderungen an der TAFEL selbst (Raum anlegen, löschen, Bibliothek):
     * erst den Stand vom Server holen, dann darauf umbauen, dann schreiben.
     *
     * Ohne das Laden ginge ein Raum verloren, den in der Zwischenzeit jemand
     * anders angelegt hat — der Abgleich könnte das nicht auffangen, weil er
     * nur den eigenen Spieler-Eintrag zusammenführt.
     *
     * Liefert true, wenn geschrieben wurde.
     */
    async _sendenMitLaden(umbauen) {
        const abgleich = IMPOSTER.abgleich;

        /*
         * Solange geschrieben wird, übernimmt der Abgleich keinen fremden
         * Stand (seit v3.8) — sonst setzte seine regelmässige Abfrage den
         * Bildschirm auf den Stand von vorher zurück, während man noch auf die
         * Bestätigung wartet. Dieselbe Sperre wie beim Schach.
         */
        abgleich.eigenerVorgangBeginnt();

        try {
            let tafel = abgleich.daten;

            if (abgleich.speicher.art === "gemeinsam") {
                tafel = IMPOSTER_TAFEL.normalisieren(await abgleich.speicher.laden());
            }

            const neueTafel = umbauen(tafel);

            await abgleich.speicher.speichern(neueTafel);
            abgleich.daten = neueTafel;
            IMPOSTER.zeichnen(neueTafel);
            return true;
        } catch (fehler) {
            await DIALOG.hinweis("Nicht gespeichert",
                "Die Änderung konnte nicht gesendet werden: " + fehler.message);
            return false;
        } finally {
            abgleich.eigenerVorgangEndet();
        }
    },

    /* ---------------------------------------------------------------- *
     * Bausteine
     * ---------------------------------------------------------------- */

    _infoKnopfBauen() {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "info-knopf";
        knopf.textContent = "i";
        knopf.setAttribute("aria-label", "Wie werden die Punkte gerechnet?");
        knopf.title = "Wie werden die Punkte gerechnet?";
        knopf.addEventListener("click", () => {
            DIALOG.hinweis("Punkte im Imposter", IMPOSTER_RUNDE.punkteErklaerung());
        });
        return knopf;
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
    }
};
