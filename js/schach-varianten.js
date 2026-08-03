/*
 * schach-varianten.js — die Spielarten des Team-Schachs.
 *
 * Eine reine Datentabelle, keine Logik: Jede Variante beschreibt nur, WIE das
 * Brett aussieht und welche Sonderregeln gelten. Wer eine neue Spielart
 * hinzufügen will, ergänzt hier einen Eintrag und muss sonst nichts anfassen —
 * schach.js liest die Maße und Schalter, schach-runde.js den Rest.
 *
 * Warum die Tabelle VOR schach.js steht: Die Regeln brauchen die Maße des
 * Bretts, sobald ein Stand entsteht. Die Abhängigkeit geht also nur in eine
 * Richtung (schach.js liest hier, hier wird nichts über Regeln gewusst).
 *
 * Felder einer Variante:
 *
 *     id             Kennung im gespeicherten Stand — NIE ändern, sonst
 *                    verlieren laufende Partien ihre Spielart.
 *     titel          Beschriftung auf dem Bildschirm.
 *     beschreibung   Ein Satz für die Auswahl beim Anlegen einer Partie.
 *     breite, hoehe  Anzahl der Spalten und Reihen.
 *     aufstellung    Startbrett, Zeile für Zeile von oben (Reihe der schwarzen
 *                    Figuren) nach unten. Länge = breite * hoehe.
 *     rochade        Ist die Rochade erlaubt? Seit v2.1 in JEDER Spielart, weil
 *                    sie aus der Stellung gelesen wird (König auf seinem
 *                    Startfeld, Turm mit Recht auf derselben Grundreihe) statt
 *                    an festen Plätzen zu hängen.
 *     koenigSchlagbar  true = es gibt kein Schach und kein Matt; Könige werden
 *                    geschlagen wie jede andere Figur, und wer keinen König
 *                    mehr hat, verliert. Nötig für Bretter mit mehreren
 *                    Königen je Seite (Doppelbrett).
 *     bonusFelder    Fähigkeiten, die auf dem Brett liegen:
 *                    [ { feld: <Nummer>, art: "sprung" } ]. Leer = keine.
 */

const SCHACH_VARIANTEN = {

    /* Kennung der Spielart, die gilt, wenn nichts anderes gespeichert ist.
       Alle Partien aus der Zeit vor den Spielarten sind klassisch. */
    STANDARD: "standard",

    /*
     * Die Seltenheitsstufen. Die Summe der Chancen ergibt 100.
     *
     * Innerhalb einer Stufe sind alle Fähigkeiten gleich wahrscheinlich — die
     * Chance einer einzelnen ist also `chance / Anzahl in der Stufe`. Das hält
     * die Rechnung erklärbar: Man muss nur zwei Zahlen kennen.
     */
    STUFEN: [
        { id: "gruen", titel: "Gewöhnlich", chance: 52, farbe: "#2e9e52" },
        { id: "blau", titel: "Ungewöhnlich", chance: 33, farbe: "#2f7fd0" },
        { id: "lila", titel: "Episch", chance: 12, farbe: "#8b46c8" },
        { id: "gelb", titel: "Legendär", chance: 3, farbe: "#e0a800" }
    ],

    /*
     * Unglückswürfel: Wie oft ein erscheinender Würfel ein schlechter ist.
     * Deutlich seltener als ein normaler — sonst wäre jeder Würfel eine
     * Zitterpartie statt einer Belohnung.
     */
    PECH_CHANCE: 12,

    /*
     * Die Unglückswürfel, je Stufe einer. Sie kommen NICHT in den Vorrat,
     * sondern wirken sofort beim Einsammeln — und zwar gegen den, der sie
     * eingesammelt hat. Je höher die Stufe, desto schlimmer.
     */
    PECH: {
        stolperstein: {
            titel: "Stolperstein",
            stufe: "gruen",
            beschreibung: "Die Figur, die den Würfel eingesammelt hat, wird ein Feld "
                + "zurückgeworfen — zurück in Richtung der eigenen Grundreihe."
        },
        ausdehnung: {
            titel: "Ausdehnung",
            stufe: "blau",
            beschreibung: "Das Spielfeld wächst an einer zufälligen Seite um eine "
                + "Reihe oder Spalte. Alle Wege werden länger."
        },
        vollesGlas: {
            titel: "Volles Glas",
            stufe: "gruen",
            beschreibung: "Wer ihn einsammelt, sieht die gegnerischen Figuren eine "
                + "Weile falsch: Sie ziehen wie immer, sehen aber aus wie etwas "
                + "anderes. Nur die eigene Ansicht ist betroffen — der Gegner "
                + "merkt nichts."
        },
        meuterei: {
            titel: "Meuterei",
            stufe: "lila",
            beschreibung: "Eine eigene Figur läuft zum Gegner über und kämpft ab "
                + "sofort für die andere Seite. Könige meutern nicht."
        },
        erdrutsch: {
            titel: "Erdrutsch",
            stufe: "gelb",
            beschreibung: "Alle eigenen Figuren rutschen ein Feld zurück in Richtung "
                + "der eigenen Grundreihe, soweit dort Platz ist. Der ganze Angriff "
                + "fällt in sich zusammen."
        }
    },

    /* Titel und Stufe eines Unglückswürfels. */
    pechTitel(art) {
        const eintrag = SCHACH_VARIANTEN.PECH[art];
        return eintrag ? eintrag.titel : "";
    },

    pechBeschreibung(art) {
        const eintrag = SCHACH_VARIANTEN.PECH[art];
        return eintrag ? eintrag.beschreibung : "";
    },

    pechStufeVon(art) {
        const eintrag = SCHACH_VARIANTEN.PECH[art];
        if (!eintrag) {
            return SCHACH_VARIANTEN.STUFE_UNBEKANNT;
        }
        return SCHACH_VARIANTEN.STUFEN.find((stufe) => stufe.id === eintrag.stufe)
            || SCHACH_VARIANTEN.STUFEN[0];
    },

    /* Alle Unglückswürfel einer Stufe, in fester Reihenfolge. */
    pechDerStufe(stufeId) {
        return Object.keys(SCHACH_VARIANTEN.PECH)
            .filter((art) => SCHACH_VARIANTEN.PECH[art].stufe === stufeId)
            .sort();
    },

    /*
     * Zieht einen Unglückswürfel — dieselbe Rechnung wie bei den Fähigkeiten:
     * erst die Stufe nach ihrer Chance, dann innerhalb der Stufe gleichverteilt.
     */
    pechZiehen(wert) {
        let rest = Math.min(Math.max(wert, 0), 0.999999) * 100;

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            if (rest < stufe.chance) {
                const arten = SCHACH_VARIANTEN.pechDerStufe(stufe.id);
                if (arten.length === 0) {
                    return "";
                }
                const anteil = rest / stufe.chance;
                return arten[Math.min(Math.floor(anteil * arten.length), arten.length - 1)];
            }
            rest -= stufe.chance;
        }

        return "stolperstein";
    },

    /*
     * Mit welcher Chance (in Prozent) nach JEDEM Halbzug ein neuer Würfel
     * erscheint.
     *
     * Bis v2.7 kam alle sechs Halbzüge einer — feste Takte, die man mitzählen
     * konnte. Jetzt wird jede Runde neu gewürfelt (im Schnitt weiterhin einer
     * je sechs Halbzüge), und wer die liegenden nicht einsammelt, hält den
     * Nachschub nicht auf: Es kommt einfach nichts, solange kein Platz frei ist
     * oder die Höchstzahl erreicht ist.
     */
    BONUS_CHANCE: 18,

    /* So viele dürfen höchstens gleichzeitig liegen. */
    BONUS_HOECHSTENS: 3,

    /*
     * Wie viele Würfel auf einmal erscheinen. Meist einer; zwei sind selten,
     * drei sehr selten. Dieselbe Rechnung wie bei den Stufen: Der Zufallswert
     * wandert von oben durch die Liste.
     */
    BONUS_ANZAHL: [
        { anzahl: 1, chance: 80 },
        { anzahl: 2, chance: 17 },
        { anzahl: 3, chance: 3 }
    ],

    /* Wie viele Würfel erscheinen bei diesem Zufallswert? */
    anzahlZiehen(wert) {
        let rest = Math.min(Math.max(wert, 0), 0.999999) * 100;

        for (const eintrag of SCHACH_VARIANTEN.BONUS_ANZAHL) {
            if (rest < eintrag.chance) {
                return eintrag.anzahl;
            }
            rest -= eintrag.chance;
        }

        return 1;
    },

    /*
     * Die Fähigkeiten. Jede hat eine Stufe und eine ART, die sagt, WIE sie
     * wirkt — davon gibt es nur vier, und alle zehn Fähigkeiten kommen damit
     * aus:
     *
     *   "zugmuster"  Der nächste eigene Zug darf zusätzlich nach diesem Muster
     *                gehen. Keine Auswahl nötig; man zieht einfach.
     *   "ablauf"     Greift in die Zugfolge ein (Doppelzug).
     *   "sofort"     Wirkt beim Einsetzen sofort aufs Brett, ohne Auswahl.
     *   "ziel"       Verlangt EIN angetipptes Feld; `zielArt` sagt, welches.
     *
     * Wirkung: siehe schach.js. Wer eine Fähigkeit ergänzt, wählt eine dieser
     * vier Arten — dann muss am Bildschirm nichts angepasst werden.
     */
    FAEHIGKEITEN: {

        /* ---- Gewöhnlich: mehr Beweglichkeit für genau einen Zug ----
           Sie helfen situativ, gewinnen aber für sich genommen nichts. */

        sprung: {
            titel: "Sprung",
            stufe: "gruen",
            art: "zugmuster",
            muster: "springer",
            beschreibung: "Beim nächsten Zug darf eine beliebige eigene Figur "
                + "zusätzlich wie ein Springer ziehen."
        },
        ausweichen: {
            titel: "Ausweichen",
            stufe: "gruen",
            art: "zugmuster",
            muster: "koenig",
            beschreibung: "Beim nächsten Zug darf eine beliebige eigene Figur "
                + "zusätzlich ein Feld in jede Richtung ziehen."
        },
        teleport: {
            titel: "Teleport",
            stufe: "gruen",
            art: "zugmuster",
            muster: "umkreis2",
            beschreibung: "Beim nächsten Zug darf eine beliebige eigene Figur auf "
                + "ein freies Feld im Umkreis von zwei Feldern springen — über "
                + "alles hinweg."
        },

        /* ---- Ungewöhnlich: verändert die Stellung ----
           Spürbar, aber zweischneidig: Sie kosten den Gegner kein Material. */

        bauernschub: {
            titel: "Bauernschub",
            stufe: "blau",
            art: "sofort",
            beschreibung: "Alle eigenen Bauern rücken sofort ein Feld vor, soweit "
                + "das Feld davor frei ist. Geschlagen wird dabei nicht."
        },
        schutzschild: {
            titel: "Schutzschild",
            stufe: "blau",
            art: "ziel",
            zielArt: "eigeneFigur",
            beschreibung: "Eine eigene Figur überlebt den nächsten Angriff: Der "
                + "Schlag verpufft, der Angreifer bleibt stehen. Auf den König "
                + "wirkt das Schild nicht."
        },
        erdbeben: {
            titel: "Erdbeben",
            stufe: "blau",
            art: "ziel",
            zielArt: "beliebig",
            beschreibung: "Alle Figuren rund um das gewählte Feld werden ein Feld "
                + "nach außen geschoben, soweit dort Platz ist. Könige bleiben "
                + "stehen. Wirkt auf beide Seiten."
        },

        nudelholz: {
            titel: "Nudelholz",
            stufe: "blau",
            art: "ziel",
            zielArt: "spalte",
            beschreibung: "Rollt über zwei Spalten: Alle Figuren darin rücken ein Feld "
                + "vor oder zurück. Angetippt wird der Buchstabe am oberen oder unteren "
                + "Rand — er bestimmt die Richtung. Wo kein Platz ist, bleibt die Figur "
                + "stehen; Könige bleiben immer stehen."
        },

        /* ---- Episch: kostet den Gegner wirklich etwas ----
           Sie verschieben das Kräfteverhältnis, ohne die Partie zu entscheiden. */

        frost: {
            titel: "Frost",
            stufe: "lila",
            art: "ziel",
            zielArt: "gegnerFigur",
            beschreibung: "Friert eine gegnerische Figur für einen Zug ein — sie darf "
                + "nicht ziehen und kann in dieser Zeit auch nicht geschlagen werden."
        },
        verstaerkung: {
            titel: "Verstärkung",
            stufe: "lila",
            art: "ziel",
            zielArt: "eigenerBauer",
            beschreibung: "Ein eigener Bauer wird sofort zum Springer — ein "
                + "Materialgewinn aus dem Nichts."
        },
        fessel: {
            titel: "Fessel",
            stufe: "lila",
            art: "ziel",
            zielArt: "gegnerFigur",
            beschreibung: "Eine gegnerische Figur darf beim nächsten Zug des "
                + "Gegners nicht ziehen."
        },

        /* ---- Legendär: entscheidet Partien ----
           Zwei Züge hintereinander gewinnen fast immer Material, und eine
           zurückgeholte Dame ersetzt eine ganze Schlacht. Deshalb selten. */

        doppelzug: {
            titel: "Doppelzug",
            stufe: "gelb",
            art: "ablauf",
            beschreibung: "Nach dem nächsten Zug ist dein Team sofort noch "
                + "einmal am Zug. Der König des Gegners bleibt dabei unantastbar."
        },
        wiedergeburt: {
            titel: "Wiedergeburt",
            stufe: "gelb",
            art: "ziel",
            zielArt: "eigeneGrundreihe",
            beschreibung: "Die zuletzt verlorene eigene Figur kehrt auf ein freies "
                + "Feld der eigenen Grundreihe zurück."
        },
        spiegel: {
            titel: "Spiegel",
            stufe: "gelb",
            art: "ziel",
            zielArt: "eigeneFigurKopierbar",
            beschreibung: "Verdoppelt eine eigene Figur: Die Kopie erscheint auf einem "
                + "freien Feld daneben. Könige lassen sich nicht spiegeln."
        }
    },

    liste: [
        {
            id: "standard",
            titel: "Klassisch",
            beschreibung: "Das gewohnte Brett mit 8 mal 8 Feldern und allen Regeln.",
            breite: 8,
            hoehe: 8,
            aufstellung:
                "tsldklst"
                + "bbbbbbbb"
                + "........"
                + "........"
                + "........"
                + "........"
                + "BBBBBBBB"
                + "TSLDKLST",
            rochade: true,
            koenigSchlagbar: false,
            bonusFelder: []
        },
        {
            id: "klein",
            titel: "Kleines Brett",
            beschreibung: "6 mal 6 Felder, ohne Läufer — kurze, scharfe Partien.",
            breite: 6,
            hoehe: 6,
            aufstellung:
                "tsdkst"
                + "bbbbbb"
                + "......"
                + "......"
                + "BBBBBB"
                + "TSDKST",
            rochade: true,
            koenigSchlagbar: false,
            bonusFelder: []
        },
        {
            id: "gross",
            titel: "Großes Brett",
            beschreibung: "10 mal 8 Felder mit je zwei Läuferpaaren — mehr Platz, "
                + "längere Partien, lange Diagonalen.",
            breite: 10,
            hoehe: 8,
            aufstellung:
                "tslldkllst"
                + "bbbbbbbbbb"
                + ".........."
                + ".........."
                + ".........."
                + ".........."
                + "BBBBBBBBBB"
                + "TSLLDKLLST",
            rochade: true,
            koenigSchlagbar: false,
            bonusFelder: []
        },
        {
            id: "doppelbrett",
            titel: "Doppelbrett",
            beschreibung: "Zwei Bretter nebeneinander (16 mal 8), zwei Armeen je Seite. "
                + "Die Figuren dürfen überall hinziehen. Kein Schach und kein Matt: "
                + "Wer zuerst beide Könige verliert, verliert die Partie.",
            breite: 16,
            hoehe: 8,
            aufstellung:
                "tsldklsttsldklst"
                + "bbbbbbbbbbbbbbbb"
                + "................"
                + "................"
                + "................"
                + "................"
                + "BBBBBBBBBBBBBBBB"
                + "TSLDKLSTTSLDKLST",
            rochade: true,
            koenigSchlagbar: true,
            bonusFelder: []
        },
        {
            id: "faehigkeiten",
            titel: "Fähigkeiten sammeln",
            beschreibung: "Klassisches Brett mit Würfeln. Gibt es seit v2.9 nicht "
                + "mehr zur Auswahl — dasselbe erreicht man mit „Klassisch“ und "
                + "eingeschaltetem Würfel-Haken.",

            /*
             * NICHT MEHR ZUR AUSWAHL, aber weiterhin im Katalog.
             *
             * Seit v2.5 lassen sich Würfel in JEDER Spielart zuschalten; damit
             * war diese hier dasselbe wie „Klassisch mit Haken" und stand nur
             * doppelt in der Liste. Gelöscht wird sie trotzdem nicht: Partien,
             * die noch laufen, tragen diese Kennung im Stand und würden sonst
             * ihre Spielart verlieren.
             */
            versteckt: true,

            /* Diese Spielart lässt Fähigkeiten über die Partie hinweg
               erscheinen. Ohne diesen Schalter passiert nichts. */
            faehigkeiten: true,
            breite: 8,
            hoehe: 8,
            aufstellung:
                "tsldklst"
                + "bbbbbbbb"
                + "........"
                + "........"
                + "........"
                + "........"
                + "BBBBBBBB"
                + "TSLDKLST",
            rochade: true,
            koenigSchlagbar: false,
            /*
             * Zwei Aufgaben, deshalb bleibt die Liste stehen:
             *  1. Vorschaubild — sie deutet an, wo Würfel auftauchen.
             *  2. Umstieg — Partien, die vor dem Erscheinen-über-die-Zeit
             *     angefangen wurden, hatten genau diese vier Felder von Beginn
             *     an liegen (siehe SCHACH_RUNDE.BONUS_FASSUNG).
             * Für NEUE Partien werden sie nicht mehr gelegt.
             */
            bonusFelder: [
                { feld: 26, art: "sprung" },
                { feld: 29, art: "doppelzug" },
                { feld: 34, art: "doppelzug" },
                { feld: 37, art: "sprung" }
            ]
        }
    ],

    /* Die Variante zu einer Kennung; unbekannte Kennungen ergeben die klassische. */
    holen(id) {
        const gefunden = SCHACH_VARIANTEN.liste.find((eintrag) => eintrag.id === id);
        return gefunden || SCHACH_VARIANTEN.liste[0];
    },

    /*
     * Die Spielarten, die beim Anlegen zur Auswahl stehen. Versteckte sind
     * weiterhin gültig (laufende Partien!), tauchen hier aber nicht auf.
     */
    zurAuswahl() {
        return SCHACH_VARIANTEN.liste.filter((eintrag) => !eintrag.versteckt);
    },

    /* Gibt es diese Kennung? */
    gibtEs(id) {
        return SCHACH_VARIANTEN.liste.some((eintrag) => eintrag.id === id);
    },

    /* Titel einer Fähigkeit, für den Bildschirm. */
    faehigkeitTitel(art) {
        const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        return eintrag ? eintrag.titel : "";
    },

    faehigkeitBeschreibung(art) {
        const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        return eintrag ? eintrag.beschreibung : "";
    },

    /*
     * Die Stufe einer Fähigkeit, oder eine neutrale als Rückfall.
     *
     * Der Rückfall trägt auch die Partien, in denen die Seltenheit verborgen
     * bleibt: Dort wird ohne Kennung gefragt, und der Würfel bekommt ein
     * unauffälliges Grau, das zu keiner Stufe gehört.
     */
    STUFE_UNBEKANNT: { id: "unbekannt", titel: "Unbekannt", chance: 0, farbe: "#8a919b" },

    stufeVon(art) {
        const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        if (!eintrag) {
            return SCHACH_VARIANTEN.STUFE_UNBEKANNT;
        }
        return SCHACH_VARIANTEN.STUFEN.find((stufe) => stufe.id === eintrag.stufe)
            || SCHACH_VARIANTEN.STUFEN[0];
    },

    /* Alle Fähigkeiten einer Stufe, in fester Reihenfolge. */
    faehigkeitenDerStufe(stufeId) {
        return Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)
            .filter((art) => SCHACH_VARIANTEN.FAEHIGKEITEN[art].stufe === stufeId)
            .sort();
    },

    /*
     * Zieht eine Fähigkeit aus einem Wert zwischen 0 und 1.
     *
     * Erst die Stufe nach ihrer Chance, dann innerhalb der Stufe gleichverteilt.
     * Der Rest des Wertes wird für die zweite Ziehung weiterverwendet, damit
     * EIN Zufallswert genügt — das hält die Ziehung nachrechenbar.
     */
    faehigkeitZiehen(wert) {
        let rest = Math.min(Math.max(wert, 0), 0.999999) * 100;

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            if (rest < stufe.chance) {
                const arten = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id);
                if (arten.length === 0) {
                    return "";
                }
                const anteil = rest / stufe.chance;
                return arten[Math.min(Math.floor(anteil * arten.length), arten.length - 1)];
            }
            rest -= stufe.chance;
        }

        /* Kann nur passieren, wenn die Chancen nicht 100 ergeben. */
        return SCHACH_VARIANTEN.faehigkeitenDerStufe(SCHACH_VARIANTEN.STUFEN[0].id)[0] || "";
    },

    /* Die Chance einer einzelnen Fähigkeit in Prozent. */
    chanceVon(art) {
        const stufe = SCHACH_VARIANTEN.stufeVon(art);
        const anzahl = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id).length;
        return anzahl > 0 ? (stufe.chance / anzahl) : 0;
    },

    /*
     * Alle Fähigkeiten im Wortlaut, für den i-Knopf.
     *
     * Erzeugt aus denselben Angaben, mit denen gerechnet wird — die angezeigte
     * Chance kann deshalb nicht von der gezogenen abweichen. Dieselbe Regel wie
     * bei den Punkten im Würfel-Quizz.
     */
    /* Die Zahlen zu einer Stufe — hinter dem i an ihrer Überschrift. */
    stufenErklaerung(stufeId) {
        const stufe = SCHACH_VARIANTEN.STUFEN.find((eintrag) => eintrag.id === stufeId);
        if (!stufe) {
            return "";
        }

        const arten = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id);
        const einzeln = SCHACH_VARIANTEN.chanceVon(arten[0] || "").toFixed(1).replace(".", ",");

        return "Von allen Würfeln, die erscheinen, tragen " + stufe.chance
            + " Prozent eine Fähigkeit dieser Stufe.\n\n"
            + "Innerhalb der Stufe sind alle gleich wahrscheinlich — bei "
            + arten.length + " Fähigkeiten also je " + einzeln + " Prozent.\n\n"
            + "Nach jedem Halbzug kann ein neuer Würfel erscheinen — mit "
            + SCHACH_VARIANTEN.BONUS_CHANCE + " Prozent, also im Schnitt etwa jeden "
            + "sechsten. Meist einer, selten zwei, sehr selten drei; es liegen nie "
            + "mehr als " + SCHACH_VARIANTEN.BONUS_HOECHSTENS + " gleichzeitig. Liegen "
            + "gelassene Würfel bleiben liegen, bis sie jemand einsammelt.\n\n"
            + "Jeder achte Würfel ist ein Unglückswürfel (" + SCHACH_VARIANTEN.PECH_CHANCE
            + " Prozent) — er wirkt sofort gegen den, der ihn einsammelt.\n\n"
            + "Gewürfelt wird dabei nicht: Feld und Inhalt werden aus dem Spielstand "
            + "gerechnet, damit alle Mitspieler dasselbe Brett sehen.";
    },

    faehigkeitenErklaerung() {
        const anzahl = SCHACH_VARIANTEN.BONUS_ANZAHL
            .map((eintrag) => eintrag.anzahl + " mit " + eintrag.chance + " Prozent")
            .join(", ");

        let text = "Nach jedem Halbzug erscheint mit "
            + SCHACH_VARIANTEN.BONUS_CHANCE + " Prozent ein Würfel auf einem freien "
            + "Feld — meist einer, manchmal mehr (" + anzahl + "). Es liegen nie mehr "
            + "als " + SCHACH_VARIANTEN.BONUS_HOECHSTENS + " gleichzeitig, und liegen "
            + "gelassene bleiben liegen. Wer mit einer Figur darauf zieht, sammelt "
            + "die Fähigkeit für sein Team ein.\n\n"
            + "Welche es wird, hängt von der Stufe ab:\n";

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            const arten = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id);
            text += "\n" + stufe.titel.toUpperCase() + " — " + stufe.chance + " Prozent\n";

            for (const art of arten) {
                const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
                text += "  " + eintrag.titel + " ("
                    + SCHACH_VARIANTEN.chanceVon(art).toFixed(1).replace(".", ",")
                    + " Prozent): " + eintrag.beschreibung + "\n";
            }
        }

        text += "\nInnerhalb einer Stufe sind alle gleich wahrscheinlich. "
            + "Gewürfelt wird dabei nicht: Feld und Fähigkeit werden aus dem "
            + "Spielstand gerechnet, damit alle Mitspieler dasselbe Brett sehen.";

        return text;
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_VARIANTEN;
}
