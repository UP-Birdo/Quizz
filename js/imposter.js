/*
 * imposter.js — der Tab "Imposter": das Spiel auf dem Bildschirm.
 *
 * So läuft es:
 *   1. Beitreten. Thema und Anzahl der Imposter einstellen (vor dem Start).
 *   2. Alle drücken "bereit" — dann beginnt die Runde.
 *   3. Jeder sieht GROSS das Wort; die Imposter sehen stattdessen "Imposter".
 *   4. Die Uhr läuft. Am Tisch stellt man sich Fragen; nebenbei tippt jeder
 *      die anderen als Neutral, Verdächtig oder Unverdächtig ein, und der
 *      Imposter rät das Wort.
 *   5. Sind alle fertig, kommt die Auflösung mit Punkten.
 *
 * Diese Datei kennt nur den Bildschirm. Die Regeln stehen in
 * imposter-runde.js, die Wörter in imposter-woerter.js.
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

    /* Zeitgeber für die laufende Uhr. */
    uhrZeitgeber: null,

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

    zeichnen(runde) {
        const wurzel = IMPOSTER.wurzelEl;
        if (!wurzel) {
            return;
        }

        wurzel.innerHTML = "";

        const person = IMPOSTER._ich();
        if (!person) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Melde dich zuerst im Tab Würfel Quizz an — dann bist du auch hier "
                + "mit deinem Namen dabei."));
            return;
        }

        if (runde.phase === "aufloesung") {
            IMPOSTER._aufloesungZeichnen(wurzel, runde, person);
        } else if (runde.phase === "laeuft") {
            IMPOSTER._rundeZeichnen(wurzel, runde, person);
        } else {
            IMPOSTER._wartenZeichnen(wurzel, runde, person);
        }
    },

    /* ---------------------------------------------------------------- *
     * Vor dem Start
     * ---------------------------------------------------------------- */

    _wartenZeichnen(wurzel, runde, person) {
        const dabei = !!IMPOSTER_RUNDE.spielerFinden(runde, person.id);

        const leiste = IMPOSTER._element("div", "phasen-leiste");
        leiste.appendChild(IMPOSTER._element("span", "chip chip-offen", "Noch nicht gestartet"));
        leiste.appendChild(IMPOSTER._element("span", "phasen-text",
            runde.spieler.length + " dabei"));
        leiste.appendChild(IMPOSTER._infoKnopfBauen());
        wurzel.appendChild(leiste);

        wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
            "Alle bekommen dasselbe Wort — bis auf die Imposter, die nur wissen, "
            + "dass sie es nicht wissen. Stellt euch am Tisch Fragen dazu und "
            + "findet heraus, wer nichts weiß."));

        wurzel.appendChild(IMPOSTER._einstellungenBauen(runde, dabei));
        wurzel.appendChild(IMPOSTER._mitspielerBauen(runde, person));

        const fuss = IMPOSTER._element("div", "fussleiste");

        if (!dabei) {
            fuss.appendChild(IMPOSTER._knopf("Mitspielen", "knopf-haupt",
                () => IMPOSTER.beitreten()));
        } else {
            const eigener = IMPOSTER_RUNDE.spielerFinden(runde, person.id);

            fuss.appendChild(IMPOSTER._knopf(
                eigener.bereit ? "Doch nicht bereit" : "Bereit",
                eigener.bereit ? "knopf-still knopf-klein" : "knopf-haupt",
                () => IMPOSTER.bereitUmschalten(!eigener.bereit)
            ));
            fuss.appendChild(IMPOSTER._knopf("Ich bin raus", "knopf-still knopf-klein",
                () => IMPOSTER.verlassen()));
        }

        wurzel.appendChild(fuss);

        if (IMPOSTER_RUNDE.kannStarten(runde)) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Alle sind bereit — die Runde startet gleich von selbst."));
            IMPOSTER._startPruefen(runde, person);
        } else if (runde.spieler.length < 2) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Es fehlt noch mindestens ein Mitspieler."));
        }
    },

    _einstellungenBauen(runde, dabei) {
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Einstellungen"));

        /* Thema oder Wortart. */
        const themaZeile = IMPOSTER._element("div", "imposter-wahl");
        themaZeile.appendChild(IMPOSTER._element("span", "imposter-wahl-titel",
            "Woher kommt das Wort?"));

        const knoepfe = IMPOSTER._element("div", "imposter-knopfreihe");

        for (const gruppe of IMPOSTER_WOERTER.gruppen) {
            const gewaehlt = (gruppe.id === runde.gruppe);
            const knopf = IMPOSTER._knopf(gruppe.titel,
                gewaehlt ? "knopf-haupt knopf-klein" : "knopf-still knopf-klein",
                () => IMPOSTER.einstellen(gruppe.id, runde.impostermenge));

            knopf.disabled = !dabei;
            knoepfe.appendChild(knopf);
        }

        themaZeile.appendChild(knoepfe);
        karte.appendChild(themaZeile);

        /* Anzahl der Imposter. */
        const anzahlZeile = IMPOSTER._element("div", "imposter-wahl");
        anzahlZeile.appendChild(IMPOSTER._element("span", "imposter-wahl-titel",
            "Wie viele Imposter höchstens?"));

        const zahlen = IMPOSTER._element("div", "imposter-knopfreihe");

        for (let nummer = 1; nummer <= IMPOSTER_RUNDE.IMPOSTER_HOECHSTENS; nummer++) {
            const gewaehlt = (nummer === runde.impostermenge);
            const knopf = IMPOSTER._knopf(String(nummer),
                gewaehlt ? "knopf-haupt knopf-klein" : "knopf-still knopf-klein",
                () => IMPOSTER.einstellen(runde.gruppe, nummer));

            knopf.disabled = !dabei;
            zahlen.appendChild(knopf);
        }

        anzahlZeile.appendChild(zahlen);
        karte.appendChild(anzahlZeile);

        karte.appendChild(IMPOSTER._element("p", "erklaerung",
            "Es können auch weniger werden — und ganz selten gar keiner. "
            + "Einer weiß das Wort immer."));

        return karte;
    },

    _mitspielerBauen(runde, person) {
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Wer ist dabei?"));

        if (runde.spieler.length === 0) {
            karte.appendChild(IMPOSTER._element("p", "erklaerung", "Noch niemand."));
            return karte;
        }

        for (const spieler of runde.spieler) {
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

    _rundeZeichnen(wurzel, runde, person) {
        const dabei = IMPOSTER_RUNDE.spielerFinden(runde, person.id);

        if (!dabei) {
            wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
                "Die Runde läuft gerade. Warte, bis sie vorbei ist — dann kannst "
                + "du bei der nächsten mitspielen."));
            return;
        }

        const istImposter = IMPOSTER_RUNDE.istImposter(runde, person.id);

        /* Das Wort — oder die Nachricht, dass man es nicht bekommt. */
        const kasten = IMPOSTER._element("div",
            "imposter-wort" + (istImposter ? " imposter-wort-rolle" : ""));

        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-marke",
            istImposter ? "Deine Rolle" : "Das Wort"));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-text",
            istImposter ? "Imposter" : IMPOSTER_RUNDE.wortVon(runde)));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-hinweis",
            istImposter
                ? "Du kennst das Wort nicht. Tu so, als wüsstest du es — und rate es."
                : "Beschreibe es, ohne es zu sagen. Wer nichts weiß, fällt auf."));
        wurzel.appendChild(kasten);

        /* Die Uhr. */
        const leiste = IMPOSTER._element("div", "phasen-leiste");
        leiste.appendChild(IMPOSTER._element("span", "chip chip-laeuft", "läuft"));
        leiste.appendChild(IMPOSTER._element("span", "imposter-uhr",
            IMPOSTER._uhrText(runde)));
        leiste.appendChild(IMPOSTER._element("span", "phasen-text",
            runde.spieler.filter((eintrag) => eintrag.fertig).length
            + " von " + runde.spieler.length + " fertig"));
        wurzel.appendChild(leiste);

        if (istImposter) {
            wurzel.appendChild(IMPOSTER._wortTippBauen(runde, dabei));
        }

        wurzel.appendChild(IMPOSTER._tippsBauen(runde, person, dabei));

        const fuss = IMPOSTER._element("div", "fussleiste");
        fuss.appendChild(IMPOSTER._knopf(
            dabei.fertig ? "Doch noch nicht fertig" : "Fertig",
            dabei.fertig ? "knopf-still knopf-klein" : "knopf-haupt",
            () => IMPOSTER.fertigUmschalten(!dabei.fertig)
        ));
        wurzel.appendChild(fuss);

        wurzel.appendChild(IMPOSTER._element("p", "erklaerung",
            "Sobald alle auf Fertig gedrückt haben, wird aufgelöst."));

        IMPOSTER._uhrVerfolgen(runde);
    },

    _wortTippBauen(runde, eigener) {
        const karte = IMPOSTER._element("section", "karte karte-ich");
        karte.appendChild(IMPOSTER._element("h3", "", "Dein Tipp auf das Wort"));

        const feld = document.createElement("input");
        feld.type = "text";
        feld.className = "dialog-feld";
        feld.value = eigener.wortTipp;
        feld.maxLength = 40;
        feld.placeholder = "Wort eintippen";
        feld.addEventListener("change", () => IMPOSTER.wortTippSetzen(feld.value));
        karte.appendChild(feld);

        karte.appendChild(IMPOSTER._element("p", "erklaerung",
            "Groß- und Kleinschreibung ist egal, und ein Tippfehler wird verziehen."));

        return karte;
    },

    _tippsBauen(runde, person, eigener) {
        const karte = IMPOSTER._element("section", "karte");
        karte.appendChild(IMPOSTER._element("h3", "", "Wer ist der Imposter?"));

        const andere = runde.spieler.filter((eintrag) => eintrag.id !== person.id);

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

    _aufloesungZeichnen(wurzel, runde, person) {
        const ergebnis = IMPOSTER_RUNDE.ergebnis(runde);
        const meiner = ergebnis.find((eintrag) => eintrag.id === person.id);
        const imposter = IMPOSTER_RUNDE.imposterListe(runde);

        const kasten = IMPOSTER._element("div", "imposter-wort");
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-marke", "Das Wort war"));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-text",
            IMPOSTER_RUNDE.wortVon(runde)));
        kasten.appendChild(IMPOSTER._element("span", "imposter-wort-hinweis",
            (imposter.length === 0)
                ? "Diesmal gab es gar keinen Imposter."
                : ((imposter.length === 1) ? "Ein Imposter war dabei."
                    : imposter.length + " Imposter waren dabei.")));
        wurzel.appendChild(kasten);

        const dauer = Math.max(0, Math.round((runde.endeAm - runde.startAm) / 1000));
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

    _uhrText(runde) {
        if (!runde.startAm) {
            return "";
        }
        return IMPOSTER._zeitText(Math.max(0, Math.round((Date.now() - runde.startAm) / 1000)));
    },

    _zeitText(sekunden) {
        const minuten = Math.floor(sekunden / 60);
        const rest = sekunden % 60;
        return minuten + ":" + (rest < 10 ? "0" : "") + rest;
    },

    /* Hält die Uhr am Laufen, solange die Runde läuft. */
    _uhrVerfolgen(runde) {
        if (IMPOSTER.uhrZeitgeber !== null) {
            window.clearTimeout(IMPOSTER.uhrZeitgeber);
            IMPOSTER.uhrZeitgeber = null;
        }
        if (runde.phase !== "laeuft") {
            return;
        }

        IMPOSTER.uhrZeitgeber = window.setTimeout(() => {
            IMPOSTER.uhrZeitgeber = null;
            IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
        }, 1000);
    },

    /* ---------------------------------------------------------------- *
     * Bedienung
     * ---------------------------------------------------------------- */

    beitreten() {
        const person = IMPOSTER._ich();
        if (!person) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.beitreten(IMPOSTER.abgleich.daten, person.id));
    },

    verlassen() {
        const person = IMPOSTER._ich();
        if (!person) {
            return;
        }
        IMPOSTER._aendern(IMPOSTER_RUNDE.verlassen(IMPOSTER.abgleich.daten, person.id), true);
    },

    einstellen(gruppe, anzahl) {
        IMPOSTER._aendern(
            IMPOSTER_RUNDE.einstellen(IMPOSTER.abgleich.daten, gruppe, anzahl), true);
    },

    bereitUmschalten(bereit) {
        const person = IMPOSTER._ich();
        if (!person) {
            return;
        }
        IMPOSTER._aendern(
            IMPOSTER_RUNDE.bereitSetzen(IMPOSTER.abgleich.daten, person.id, bereit));
    },

    tippSetzen(zielId, wert) {
        const person = IMPOSTER._ich();
        if (!person) {
            return;
        }
        IMPOSTER._aendern(
            IMPOSTER_RUNDE.tippSetzen(IMPOSTER.abgleich.daten, person.id, zielId, wert));
    },

    wortTippSetzen(wort) {
        const person = IMPOSTER._ich();
        if (!person) {
            return;
        }
        IMPOSTER._aendern(
            IMPOSTER_RUNDE.wortTippSetzen(IMPOSTER.abgleich.daten, person.id, wort), false);
    },

    fertigUmschalten(fertig) {
        const person = IMPOSTER._ich();
        if (!person) {
            return;
        }
        IMPOSTER._aendern(
            IMPOSTER_RUNDE.fertigSetzen(IMPOSTER.abgleich.daten, person.id, fertig));
    },

    async neueRunde() {
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
        IMPOSTER._aendern(IMPOSTER_RUNDE.neueRunde(IMPOSTER.abgleich.daten), true);
    },

    /*
     * Startet die Runde, sobald alle bereit sind.
     *
     * Das Salz erzeugt das Gerät, das zuerst dazu kommt — daraus folgen Wort
     * und Rollen für alle. Damit nicht zwei Geräte gleichzeitig starten, wird
     * vorher der Stand vom Server geholt und nur geschrieben, wenn dort noch
     * nichts steht.
     */
    async _startPruefen(runde, person) {
        if (IMPOSTER.schreibtGerade || runde.phase !== "warten") {
            return;
        }
        IMPOSTER.schreibtGerade = true;

        try {
            const abgleich = IMPOSTER.abgleich;
            let aktuell = runde;

            if (abgleich.speicher.art === "gemeinsam") {
                aktuell = IMPOSTER_RUNDE.normalisieren(await abgleich.speicher.laden());
            }

            /* Inzwischen gestartet oder nicht mehr startbereit? */
            if (aktuell.phase !== "warten" || !IMPOSTER_RUNDE.kannStarten(aktuell)) {
                abgleich.daten = aktuell;
                IMPOSTER.zeichnen(aktuell);
                return;
            }

            const salz = IMPOSTER._salzErzeugen();
            const gestartet = IMPOSTER_RUNDE.starten(aktuell, salz);

            if (!gestartet) {
                return;
            }

            await abgleich.speicher.speichern(gestartet);
            abgleich.daten = gestartet;
            IMPOSTER.zeichnen(gestartet);
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

    /*
     * Eine Änderung übernehmen. `global` heißt: Sie betrifft absichtlich die
     * ganze Runde (Start, neue Runde, Einstellungen) und wird nicht mit dem
     * Stand vom Server zusammengeführt.
     */
    _aendern(neueRunde, global) {
        IMPOSTER.abgleich.aendern(neueRunde, true, global === true);
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
