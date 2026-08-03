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
        const glas = TEAM_SCHACH._glasWirkt(partie, meinTeam);

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

            /* Liegt hier ein Würfel mit einer Fähigkeit? */
            const bonusHier = bonus.find((eintrag) => eintrag.feld === feld);
            if (bonusHier) {
                /*
                 * Ist „Seltenheit anzeigen“ aus, sehen alle Würfel gleich aus.
                 *
                 * WELCHE Fähigkeit drin ist, verrät die Oberfläche NIE — auch
                 * nicht beim Darüberfahren. Ein Würfel, dessen Inhalt man
                 * vorher lesen kann, ist kein Überraschungswürfel mehr.
                 */
                /*
                 * Ist „Seltenheit anzeigen" aus, sehen ALLE Würfel gleich aus —
                 * auch die schlechten. Dann ist jeder Würfel ein Risiko, und
                 * genau das ist der Sinn dieser Einstellung. Ist sie an, trägt
                 * er seine Stufenfarbe und das umgedrehte Fragezeichen.
                 */
                const zeigen = (partie.regeln.seltenheitZeigen !== false);
                const stufe = bonusHier.pech
                    ? SCHACH_VARIANTEN.pechStufeVon(bonusHier.art)
                    : SCHACH_VARIANTEN.stufeVon(bonusHier.art);

                zelle.classList.add("feld-bonus");
                zelle.title = zeigen
                    ? ("Würfel — " + stufe.titel + (bonusHier.pech ? ", Unglück" : ""))
                    : "Würfel";
                zelle.setAttribute("aria-label",
                    SCHACH.feldName(feld, breite, hoehe) + ", " + zelle.title);

                zelle.appendChild(TEAM_SCHACH._wuerfelBauen(
                    zeigen ? bonusHier.art : "",
                    zeigen && bonusHier.pech));
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
                zelle.title = "Gefesselt: darf einen Zug lang nicht ziehen";
            }
            if (partie.stand.frostFeld === feld) {
                zelle.classList.add("feld-frost");
                zelle.title = "Eingefroren: zieht nicht und ist unantastbar";
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
        } else if (darfZiehen) {
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

        const abstimmung = TEAM_SCHACH._abstimmungBauen(partie, person);
        if (abstimmung) {
            halter.appendChild(abstimmung);
        }

        return halter;
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

        /*
         * Fähigkeiten, die nichts bewegen (Schutzschild, Fessel, Verstärkung,
         * Wiedergeburt) und neu erschienene Würfel haben betroffene Felder ohne
         * Weg. Sie bekommen statt eines Pfeils einen Ring — sonst wäre die
         * einzige Spur ein kurzes Aufleuchten, das verpasst, wer gerade nicht
         * hinsieht.
         */
        const inWegen = {};
        for (const weg of wege) {
            inWegen[weg.von] = true;
            inWegen[weg.nach] = true;
        }

        /*
         * Ringe nur für WIRKUNGEN ohne Bewegung — nicht für neu erschienene
         * Würfel. Sonst bekommt eine frisch erschienene Kiste einen farbigen
         * Kreis und sieht aus, als wäre gerade etwas mit ihr passiert.
         */
        const ringe = (letzter.wirkung === "erscheint")
            ? []
            : (letzter.felder || []).filter((feld) => !inWegen[feld]);

        if (wege.length === 0 && ringe.length === 0) {
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
        /* Ein Unglückswürfel färbt die Pfeile gelb — man soll auf einen Blick
           sehen, dass das keine gewollte Bewegung war. */
        svg.setAttribute("class",
            "zug-pfeil" + ((letzter.wirkung === "pech") ? " zug-pfeil-pech" : ""));
        svg.setAttribute("viewBox", "0 0 " + breite + " " + hoehe);
        svg.setAttribute("preserveAspectRatio", "none");
        svg.setAttribute("aria-hidden", "true");

        /*
         * Der Pfeil verschwindet unter den Figuren — richtig, nicht nur
         * durchscheinend.
         *
         * Möglich macht das eine Maske: Sie ist überall weiß (der Pfeil ist zu
         * sehen) und trägt über jedem besetzten Feld einen schwarzen Kreis (dort
         * ist er weg). Damit läuft der Strich HINTER den Figuren durch, obwohl
         * das SVG technisch darüber liegt — die Figuren stecken in den
         * Feld-Knöpfen und lassen sich nicht überlagern.
         */
        const maskenId = "pfeil-maske-" + partie.id;
        const maske = document.createElementNS("http://www.w3.org/2000/svg", "mask");
        maske.setAttribute("id", maskenId);

        const grund = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        grund.setAttribute("x", "0");
        grund.setAttribute("y", "0");
        grund.setAttribute("width", String(breite));
        grund.setAttribute("height", String(hoehe));
        grund.setAttribute("fill", "white");
        maske.appendChild(grund);

        /*
         * Nur Figuren ZWISCHEN Start und Ziel stanzen ein Loch. An den Enden
         * bleibt der Pfeil ganz — sonst verschwänden Spitze und Anfang unter
         * genau den beiden Figuren, um die es geht.
         */
        const enden = {};
        for (const weg of wege) {
            enden[weg.von] = true;
            enden[weg.nach] = true;
        }

        for (let feld = 0; feld < felder; feld++) {
            if (SCHACH.figurAuf(partie.stand, feld) === "." || enden[feld]) {
                continue;
            }
            const punkt = mitte(feld);
            const loch = document.createElementNS("http://www.w3.org/2000/svg", "circle");

            loch.setAttribute("cx", String(punkt.x));
            loch.setAttribute("cy", String(punkt.y));
            loch.setAttribute("r", String(TEAM_SCHACH.FIGUR_RADIUS));
            loch.setAttribute("fill", "black");
            maske.appendChild(loch);
        }

        svg.appendChild(maske);

        const gruppe = document.createElementNS("http://www.w3.org/2000/svg", "g");
        gruppe.setAttribute("mask", "url(#" + maskenId + ")");
        svg.appendChild(gruppe);

        let gezeichnet = 0;

        /* Erst alle hellen Unterlagen, dann alle farbigen Lagen darüber — sonst
           läge bei sich kreuzenden Pfeilen die Unterlage des einen über der
           Farbe des anderen. */
        for (const lage of ["zug-pfeil-unten", "zug-pfeil-oben"]) {
            for (const feld of ringe) {
                const punkt = mitte(feld);
                const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");

                ring.setAttribute("class", lage + " zug-pfeil-ring");
                ring.setAttribute("cx", String(punkt.x));
                ring.setAttribute("cy", String(punkt.y));
                ring.setAttribute("r", "0.36");
                gruppe.appendChild(ring);
                gezeichnet++;
            }

            for (const weg of wege) {
                const punkte = TEAM_SCHACH._pfeilPunkte(mitte(weg.von), mitte(weg.nach));
                if (!punkte) {
                    continue;
                }

                /*
                 * Der Linienzug bis kurz vor die Spitze.
                 *
                 * `zug-pfeil-linie` ist Pflicht: Ein <polyline> würde sonst die
                 * Fläche zwischen seinen Punkten ausfüllen — beim geknickten
                 * Springerpfeil ein gefülltes Dreieck. Ein `fill="none"` am
                 * Element genügt dafür NICHT, weil eine CSS-Regel jedes
                 * Präsentationsattribut überstimmt.
                 */
                const strich = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                strich.setAttribute("class", lage + " zug-pfeil-linie");
                strich.setAttribute("points", punkte.linie
                    .map((punkt) => punkt.x + "," + punkt.y).join(" "));
                gruppe.appendChild(strich);

                /* … und die Spitze am Ende des LETZTEN Abschnitts. */
                const spitze = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                spitze.setAttribute("class", lage);
                spitze.setAttribute("points", punkte.spitze
                    .map((punkt) => punkt.x + "," + punkt.y).join(" "));
                gruppe.appendChild(spitze);

                gezeichnet++;
            }
        }

        return (gezeichnet > 0) ? svg : null;
    },

    /*
     * Aus Start- und Zielmitte die Punkte des Pfeils rechnen. Liefert
     * { linie: [Punkte], spitze: [drei Punkte] } — oder null, wenn der Weg zu
     * kurz zum Zeichnen ist.
     *
     * DER KNICK BEIM SPRINGER
     * Bis v3.2 war jeder Pfeil eine gerade Linie. Beim Springer zeigte sie
     * schräg über Felder hinweg, die er nie berührt hat — man sah eine
     * Diagonale, wo ein L gezogen wurde. Jetzt bekommt eine 1-zu-2-Bewegung
     * einen Knick: erst die lange Achse (zwei Felder), dann die kurze. Das ist
     * die Bewegung, die man auch mit der Hand macht.
     *
     * Erkannt wird sie an der GEOMETRIE, nicht an der Figur. Damit gilt sie
     * auch für die Fähigkeit „Sprung", die eine Figur wie einen Springer
     * versetzt — und das ist genau richtig, denn der Weg ist derselbe.
     */
    _pfeilPunkte(start, ende) {
        const dx = ende.x - start.x;
        const dy = ende.y - start.y;

        /* Der Abstand zur Feldmitte an beiden Enden, damit die Figuren
           vollständig sichtbar bleiben. */
        const rand = TEAM_SCHACH.PFEIL_ABSTAND;
        const spitzeLaenge = 0.26;
        const spitzeBreite = 0.17;

        /* Ecken des Linienzugs: beim Springer drei, sonst zwei. */
        const ecken = [start];

        if (TEAM_SCHACH._istSprung(dx, dy)) {
            /* Zuerst die lange Achse — dort liegt der Knick. */
            ecken.push((Math.abs(dx) > Math.abs(dy))
                ? { x: ende.x, y: start.y }
                : { x: start.x, y: ende.y });
        }
        ecken.push(ende);

        /* Beide Enden einrücken: das erste Stück am Anfang, das letzte am
           Ende — bei einem Knick bleibt die Mitte unangetastet. */
        const ersteRichtung = TEAM_SCHACH._richtung(ecken[0], ecken[1]);
        const letzteRichtung = TEAM_SCHACH._richtung(
            ecken[ecken.length - 2], ecken[ecken.length - 1]);

        if (!ersteRichtung || !letzteRichtung) {
            return null;
        }

        const anfang = {
            x: ecken[0].x + ersteRichtung.x * rand,
            y: ecken[0].y + ersteRichtung.y * rand
        };
        const spitzeX = ende.x - letzteRichtung.x * rand;
        const spitzeY = ende.y - letzteRichtung.y * rand;
        const strichEndeX = spitzeX - letzteRichtung.x * spitzeLaenge;
        const strichEndeY = spitzeY - letzteRichtung.y * spitzeLaenge;

        /*
         * Zu kurz für Rand, Strich und Spitze? Dann gar nicht zeichnen —
         * gemessen am LETZTEN Abschnitt, denn dort sitzt die Spitze. Beim
         * Springer ist das gerade das kurze Stück von einem Feld.
         */
        const letzteLaenge = Math.hypot(
            ecken[ecken.length - 1].x - ecken[ecken.length - 2].x,
            ecken[ecken.length - 1].y - ecken[ecken.length - 2].y);

        if (ecken.length === 2 && letzteLaenge <= 2 * rand + spitzeLaenge * 0.5) {
            return null;
        }
        if (ecken.length > 2 && letzteLaenge <= rand + spitzeLaenge * 0.5) {
            return null;
        }

        const linie = [anfang]
            .concat(ecken.slice(1, -1))
            .concat([{ x: strichEndeX, y: strichEndeY }]);

        return {
            linie: linie,
            spitze: [
                { x: spitzeX, y: spitzeY },
                {
                    x: strichEndeX - letzteRichtung.y * spitzeBreite,
                    y: strichEndeY + letzteRichtung.x * spitzeBreite
                },
                {
                    x: strichEndeX + letzteRichtung.y * spitzeBreite,
                    y: strichEndeY - letzteRichtung.x * spitzeBreite
                }
            ]
        };
    },

    /* Ist das ein Springersprung (ein Feld in der einen, zwei in der anderen
       Richtung)? Gemessen in Feldern, nicht in Pixeln. */
    _istSprung(dx, dy) {
        const einer = Math.abs(Math.round(dx));
        const anderer = Math.abs(Math.round(dy));

        return (einer === 1 && anderer === 2) || (einer === 2 && anderer === 1);
    },

    /* Einheitsvektor von einem Punkt zum anderen; null bei Länge 0. */
    _richtung(von, nach) {
        const dx = nach.x - von.x;
        const dy = nach.y - von.y;
        const laenge = Math.hypot(dx, dy);

        return (laenge === 0) ? null : { x: dx / laenge, y: dy / laenge };
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
    _wuerfelBauen(art, pech) {
        const stufe = pech
            ? SCHACH_VARIANTEN.pechStufeVon(art)
            : SCHACH_VARIANTEN.stufeVon(art);

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
    _glasZeichen(partie, feld, figur) {
        const arten = ["B", "S", "L", "T", "D"];
        const wert = SCHACH_RUNDE._zufallsWert(partie.id + "|glas|" + feld);
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

});
