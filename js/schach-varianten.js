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
     * Innerhalb einer Stufe sind alle Fähigkeiten zunächst gleich
     * wahrscheinlich — die Chance einer einzelnen ist also
     * `chance / Anzahl in der Stufe`.
     *
     * WIEDERHOLUNG (seit v3.6): Was man schon im Vorrat hat, kommt seltener
     * nach. Jedes Exemplar drückt das Gewicht dieser Fähigkeit auf den hier
     * genannten Bruchteil — bei zwei Stück also auf `wiederholung` mal
     * `wiederholung`. Die Zahl steigt mit der Seltenheit, und zwar aus einem
     * praktischen Grund: In der gewöhnlichen Stufe stehen drei Fähigkeiten
     * zur Auswahl, da lässt sich eine leicht meiden. Bei den legendären wäre
     * eine harte Dämpfung dasselbe wie „du bekommst die restlichen vier
     * garantiert zuerst" — und damit wäre der Zufall weg.
     */
    STUFEN: [
        { id: "gruen", titel: "Gewöhnlich", chance: 52, farbe: "#2e9e52",
            wiederholung: 0.15, abklingen: { halbzuege: 8, gewicht: 0.2 } },
        { id: "blau", titel: "Ungewöhnlich", chance: 33, farbe: "#2f7fd0",
            wiederholung: 0.3 },
        { id: "lila", titel: "Episch", chance: 12, farbe: "#8b46c8",
            wiederholung: 0.5 },
        { id: "gelb", titel: "Legendär", chance: 3, farbe: "#e0a800",
            wiederholung: 0.75 }
    ],

    /*
     * ABKLINGZEIT — die ZWEITE Rechnung, und sie betrifft die STUFE (v0.41).
     *
     * Nicht zu verwechseln mit `wiederholung` oben: Die dämpft, WELCHE
     * Fähigkeit man aus einer Stufe zieht, und zwar gegen den eigenen Vorrat.
     * Das ändert nichts daran, wie oft eine Stufe überhaupt an der Reihe ist —
     * und genau das war die Meldung aus der Praxis: „es kommen fast nur grüne".
     * Mit 52 Prozent war das kein Fehler, sondern die eingestellte Zahl.
     *
     * Deshalb hat eine Stufe seit v0.41 wahlweise ein `abklingen`:
     *
     *     halbzuege   So lange braucht sie, um wieder voll zu zählen.
     *     gewicht     So wenig zählt sie unmittelbar danach.
     *
     * Dazwischen steigt das Gewicht gleichmässig an. Nur Grün hat eine
     * Abklingzeit — die anderen Stufen behalten ihre feste Chance, damit Blau
     * und Lila nicht ihrerseits seltener werden. Was Grün verliert, fällt nicht
     * weg, sondern verteilt sich auf die übrigen Stufen: Es erscheint weiter
     * gleich oft ein Würfel, nur eben nicht schon wieder ein grüner.
     */
    stufenGewichte(abstaende) {
        const gewichte = {};

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            const abstand = (abstaende && Number.isInteger(abstaende[stufe.id]))
                ? abstaende[stufe.id] : -1;

            if (!stufe.abklingen || abstand < 0 || abstand >= stufe.abklingen.halbzuege) {
                gewichte[stufe.id] = 1;
                continue;
            }

            const anteil = abstand / stufe.abklingen.halbzuege;
            gewichte[stufe.id] = stufe.abklingen.gewicht
                + (1 - stufe.abklingen.gewicht) * anteil;
        }

        return gewichte;
    },

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
        /*
         * MEUTEREI UND ERDRUTSCH HABEN v0.41 IHRE STUFEN GETAUSCHT.
         *
         * Vorher war die Meuterei episch (lila) und der Erdrutsch legendär
         * (gelb) — dabei ist die Meuterei die schwerere Strafe: Der Gegner
         * bekommt eine Figur GESCHENKT, der Materialunterschied ist doppelt so
         * gross wie der Verlust. Ein Erdrutsch kostet nur Stellung, keine
         * Figur. Die Stufe sagt beim Unglückswürfel, wie schlimm es wird; die
         * schlimmste gehört auf die seltenste Stufe.
         */
        meuterei: {
            titel: "Meuterei",
            stufe: "gelb",
            beschreibung: "Eine eigene Figur läuft zum Gegner über und kämpft ab "
                + "sofort für die andere Seite. Könige meutern nicht."
        },
        erdrutsch: {
            titel: "Erdrutsch",
            stufe: "lila",
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
     * je sechs Halbzüge).
     *
     * SEIT v3.3 GIBT ES KEINE HÖCHSTZAHL MEHR.
     * Vorher durften nur drei gleichzeitig liegen; wer nicht einsammelte, bekam
     * ab dem dritten gar nichts mehr — die Partie hörte mitten im Spiel auf,
     * Würfel auszuwerfen, und das wirkte wie ein Fehler. Jetzt erscheint
     * durchgehend nach Chance einer, solange überhaupt ein Feld frei ist.
     *
     * Die einzige verbliebene Grenze ist das Brett selbst: Ein Würfel braucht
     * ein leeres Feld, und auf ein Feld passt nur einer. Sie steht nicht als
     * Zahl im Code, sondern ergibt sich aus der Stellung — deshalb kann sie
     * auch nicht veralten, wenn ein Unglückswürfel das Feld vergrössert.
     */
    BONUS_CHANCE: 18,

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
     *
     * Dazu zwei Schalter, die für jede Art gelten:
     *
     *   `beendetZug: true`   Nach dem Einsetzen ist der Gegner dran. Ohne den
     *                        Schalter bleibt man am Zug und muss noch ziehen —
     *                        so war es bis v3.3 bei allen Fähigkeiten. Für
     *                        solche, die eine Figur ZURÜCKBRINGEN, wäre das zu
     *                        stark: Man bekäme Material geschenkt und dürfte im
     *                        selben Atemzug damit angreifen.
     *
     *   `imGegenzug: true`   Darf auch eingesetzt werden, während der Gegner am
     *                        Zug ist (seit v3.6). Das ist ein echtes Rennen:
     *                        Wer zuerst drückt, war zuerst — abgesichert über
     *                        denselben Zugzähler wie ein Zug. Nur für
     *                        Fähigkeiten, die nichts kosten und niemandem
     *                        etwas wegnehmen.
     *
     * BEIDE SCHALTER SIND SICHTBAR. Am Vorrat trägt eine Fähigkeit ohne
     * `beendetZug` ein Pluszeichen (danach bleibt der normale Zug) und eine
     * mit `imGegenzug` einen Blitz. Was eine Fähigkeit kostet, muss man sehen
     * können, bevor man sie einsetzt — nicht danach.
     */
    FAEHIGKEITEN: {

        /* ---- Gewöhnlich: mehr Beweglichkeit für genau einen Zug ----
           Sie helfen situativ, gewinnen aber für sich genommen nichts. */

        sprung: {
            titel: "Sprung",
            stufe: "gruen",
            art: "zugmuster",
            muster: "springer",
            beschreibung: "Du ziehst danach ganz normal — eine Figur deiner Wahl "
                + "darf dabei aber auch wie ein Springer gehen. Es ist KEIN "
                + "zusätzlicher Zug, sondern eine zusätzliche Gangart für diesen "
                + "einen."
        },
        ausweichen: {
            titel: "Ausweichen",
            stufe: "gruen",
            art: "zugmuster",
            muster: "ausweichen",
            imGegenzug: true,
            beschreibung: "Eine Figur deiner Wahl darf bei deinem nächsten Zug "
                + "auch ein Feld in jede Richtung gehen — auf ein FREIES Feld, "
                + "geschlagen wird dabei nicht. Du darfst sie auch einsetzen, "
                + "während der Gegner am Zug ist; sie kostet dich keinen Zug. "
                + "Wer zuerst drückt, war zuerst."
        },
        teleport: {
            titel: "Teleport",
            stufe: "gruen",
            art: "zugmuster",
            muster: "umkreis2",
            beschreibung: "Du ziehst danach ganz normal — eine Figur deiner Wahl "
                + "darf dabei aber auch auf ein freies Feld im Umkreis von zwei "
                + "Feldern springen, über alles hinweg."
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
            beschreibung: "Drei Reihen rutschen um ein Feld zur Seite — die "
                + "angetippte und je eine darüber und darunter. Tippst du links "
                + "auf das Brett, geht es nach links, tippst du rechts, nach "
                + "rechts. Wer am Rand steht oder ansteht, bleibt; alle anderen "
                + "rücken nacheinander auf. Könige bleiben stehen. Wirkt auf "
                + "beide Seiten."
        },

        nudelholz: {
            titel: "Nudelholz",
            stufe: "blau",
            art: "ziel",
            zielArt: "spalte",
            beschreibung: "Rollt über zwei Spalten und schiebt alle Figuren darin ein "
                + "Feld nach vorn — von dir weg. Angetippt wird ein Feld deiner eigenen "
                + "Grundreihe, also unten am Brett. Wo kein Platz ist, bleibt die Figur "
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
        },

        /*
         * Wiederbelebung (seit v3.3) — der grosse Bruder der Wiedergeburt.
         *
         * Der Unterschied ist der ORT: Die Wiedergeburt setzt auf die eigene
         * Grundreihe, also weit hinten; die Wiederbelebung holt die Figur genau
         * dorthin zurück, wo sie fiel — oft mitten im Geschehen. Deshalb kostet
         * sie den ganzen Zug, und deshalb ist sie legendär.
         */
        wiederbelebung: {
            titel: "Wiederbelebung",
            stufe: "gelb",
            art: "ziel",
            zielArt: "eigenesGrab",
            beendetZug: true,
            beschreibung: "Eine eigene geschlagene Figur steht genau dort wieder auf, "
                + "wo sie fiel — wenn das Feld frei ist. Danach ist der Gegner am Zug."
        },

        /*
         * Mauer (seit v3.3) — ungewöhnlich, nicht selten.
         *
         * Sie nimmt niemandem Material und gehört keiner Seite: Sie steht
         * einfach im Weg, für beide. Stark ist sie nur, wenn man sie zur
         * rechten Zeit legt — und das macht sie zu einer Fähigkeit der
         * mittleren Stufe, nicht zu einer legendären.
         */
        mauer: {
            titel: "Mauer",
            stufe: "blau",
            art: "ziel",
            zielArt: "mauerplatz",
            beschreibung: "Legt eine Mauer über drei freie Felder derselben Reihe — auf "
                + "das angetippte Feld und je eines links und rechts davon. Niemand zieht "
                + "hindurch, aber Springer setzen darüber hinweg. Nach einigen Zügen "
                + "zerfällt sie."
        },

        /*
         * Händler (seit v3.3) — die erste Fähigkeit mit einer Rückfrage.
         *
         * Sie tauscht Material gegen Material, ungefähr gleichwertig. Genau
         * darin liegt ihr Reiz: Sie macht einen nicht stärker, sondern ANDERS
         * stark — fünf Bauern sind so viel wert wie ein Turm, spielen sich aber
         * völlig verschieden. Wer das Angebot nicht mag, lehnt ab.
         */
        haendler: {
            titel: "Händler",
            stufe: "lila",
            art: "handel",
            beendetZug: true,
            beschreibung: "Ein Angebot: Figuren gegen andere Figuren, ungefähr "
                + "gleich viel wert. Du darfst ablehnen — dann bleibt die Fähigkeit "
                + "dir erhalten. Nimmst du an, ist danach der Gegner am Zug."
        },

        /*
         * Friedhof (seit v3.3) — legendär, und zwar mit Abstand die stärkste.
         *
         * Sie bringt Material, das eigentlich weg war, zurück auf DEINE Seite:
         * bis zu vier gefallene GEGNER auf einmal. Dass sie nach ein paar Zügen
         * zerfallen, ist der Preis — und der Grund, warum sie das Spiel nicht
         * einfach entscheidet: Man muss etwas mit ihnen anfangen, solange sie
         * da sind.
         */
        friedhof: {
            titel: "Friedhof",
            stufe: "gelb",
            art: "ziel",
            zielArt: "friedhofsplatz",
            beendetZug: true,
            beschreibung: "Bis zu vier gefallene GEGNER stehen auf einem freien "
                + "2×2-Feld wieder auf — in deiner Farbe, und du ziehst mit ihnen "
                + "wie mit eigenen. Nach ein paar Zügen zerfallen sie. Danach ist "
                + "der Gegner am Zug."
        }
    },

    /* ---------------------------------------------------------------- *
     * Die Angebote des Händlers
     *
     * Jede Zeile ist ein Tausch: `gibt` verschwindet vom Brett, `bekommt`
     * erscheint dafür. Gezogen wird gerechnet (nicht gewürfelt), damit alle
     * Geräte dasselbe Angebot sehen.
     *
     * ZUM GLEICHGEWICHT: Gerechnet wird mit den üblichen Figurenwerten
     * (Bauer 1, Springer und Läufer 3, Turm 5, Dame 9). Kein Angebot bringt
     * mehr als einen Punkt Vorsprung — sonst wäre der Händler keine Wahl,
     * sondern ein Geschenk, und man würde immer annehmen.
     *
     * Beide Richtungen stehen als eigene Zeilen da, statt eine Zeile zu drehen:
     * So sieht man beim Lesen sofort, was möglich ist, und kann einzelne
     * Richtungen weglassen, die sich nicht gut spielen.
     * ---------------------------------------------------------------- */

    HANDEL: [
        { gibt: { art: "B", anzahl: 3 }, bekommt: { art: "S", anzahl: 1 } },
        { gibt: { art: "B", anzahl: 3 }, bekommt: { art: "L", anzahl: 1 } },
        { gibt: { art: "S", anzahl: 1 }, bekommt: { art: "B", anzahl: 3 } },
        { gibt: { art: "L", anzahl: 1 }, bekommt: { art: "B", anzahl: 3 } },
        { gibt: { art: "B", anzahl: 5 }, bekommt: { art: "T", anzahl: 1 } },
        { gibt: { art: "T", anzahl: 1 }, bekommt: { art: "B", anzahl: 5 } },
        { gibt: { art: "S", anzahl: 1 }, bekommt: { art: "L", anzahl: 1 } },
        { gibt: { art: "L", anzahl: 1 }, bekommt: { art: "S", anzahl: 1 } },
        { gibt: { art: "T", anzahl: 2 }, bekommt: { art: "D", anzahl: 1 } },
        { gibt: { art: "D", anzahl: 1 }, bekommt: { art: "T", anzahl: 2 } }
    ],

    /* Zieht ein Angebot aus der Tabelle. `wert` ist eine Zahl von 0 bis 1. */
    handelZiehen(wert) {
        const sauber = Math.min(Math.max(wert, 0), 0.999999);
        const stelle = Math.floor(sauber * SCHACH_VARIANTEN.HANDEL.length);

        return SCHACH_VARIANTEN.HANDEL[stelle] || SCHACH_VARIANTEN.HANDEL[0];
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
     * Welche STUFE zieht dieser Wert? Der Rest, der nach dem Abzug der
     * durchlaufenen Stufen bleibt, wird als Anteil von 0 bis 1 mitgeliefert —
     * damit genügt EIN Zufallswert für beide Ziehungen, und die Rechnung
     * bleibt nachrechenbar.
     */
    stufeZiehen(wert, gewichte) {
        /*
         * `gewichte` ist wahlfrei (siehe `stufenGewichte`). Ohne Angabe zählt
         * jede Stufe mit ihrer festen Chance — genau wie vor v0.41, damit ein
         * Aufruf von aussen unverändert dasselbe liefert.
         */
        const chancen = SCHACH_VARIANTEN.STUFEN.map((stufe) => {
            const gewicht = (gewichte && typeof gewichte[stufe.id] === "number")
                ? Math.max(gewichte[stufe.id], 0) : 1;
            return stufe.chance * gewicht;
        });

        const summe = chancen.reduce((teil, einzeln) => teil + einzeln, 0);
        if (summe <= 0) {
            return { stufe: SCHACH_VARIANTEN.STUFEN[0], anteil: 0 };
        }

        let rest = Math.min(Math.max(wert, 0), 0.999999) * summe;

        for (let stelle = 0; stelle < SCHACH_VARIANTEN.STUFEN.length; stelle++) {
            if (rest < chancen[stelle]) {
                return {
                    stufe: SCHACH_VARIANTEN.STUFEN[stelle],
                    anteil: rest / chancen[stelle]
                };
            }
            rest -= chancen[stelle];
        }

        /* Kann nur passieren, wenn die Summe durch Rundung knapp verfehlt wird. */
        return { stufe: SCHACH_VARIANTEN.STUFEN[0], anteil: 0 };
    },

    /*
     * Zieht eine Fähigkeit AUS EINER STUFE — und zwar so, dass Wiederholungen
     * seltener werden.
     *
     * `vorrat` ist die Liste der Fähigkeiten, die diese Seite schon hat. Jedes
     * Exemplar drückt das Gewicht seiner Fähigkeit auf `stufe.wiederholung`
     * (siehe STUFEN). Beispiel Gewöhnlich mit drei Fähigkeiten: Wer „Sprung"
     * schon zweimal hat, zieht ihn mit 0,15 mal 0,15 = 0,0225 gegen 1 und 1 —
     * also mit gut einem Prozent statt mit einem Drittel.
     *
     * Ohne Vorrat ist das Ergebnis dasselbe wie vorher: Alle Gewichte sind 1,
     * die Verteilung damit gleichmässig.
     */
    faehigkeitAusStufe(stufeId, wert, vorrat) {
        const arten = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufeId);
        if (arten.length === 0) {
            return "";
        }

        const stufe = SCHACH_VARIANTEN.STUFEN.find((eintrag) => eintrag.id === stufeId);
        const daempfung = (stufe && typeof stufe.wiederholung === "number")
            ? stufe.wiederholung : 1;
        const schon = Array.isArray(vorrat) ? vorrat : [];

        const gewichte = arten.map((art) => Math.pow(daempfung,
            schon.filter((eintrag) => eintrag === art).length));
        const summe = gewichte.reduce((teil, einzeln) => teil + einzeln, 0);

        if (summe <= 0) {
            return arten[0];
        }

        let rest = Math.min(Math.max(wert, 0), 0.999999) * summe;

        for (let stelle = 0; stelle < arten.length; stelle++) {
            if (rest < gewichte[stelle]) {
                return arten[stelle];
            }
            rest -= gewichte[stelle];
        }

        return arten[arten.length - 1];
    },

    /*
     * Zieht eine Fähigkeit aus einem Wert zwischen 0 und 1: erst die Stufe
     * nach ihrer Chance, dann innerhalb der Stufe.
     *
     * Wird seit v3.6 nur noch dort gebraucht, wo kein Vorrat bekannt ist. Beim
     * Einsammeln geht das Spiel den Weg über `stufeZiehen` und
     * `faehigkeitAusStufe`, damit die Dämpfung greifen kann.
     */
    faehigkeitZiehen(wert, vorrat) {
        const gezogen = SCHACH_VARIANTEN.stufeZiehen(wert);
        return SCHACH_VARIANTEN.faehigkeitAusStufe(
            gezogen.stufe.id, gezogen.anteil, vorrat);
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
    /*
     * Der Satz zur Abklingzeit einer Stufe — leer, wenn sie keine hat.
     *
     * Er steht hier und nicht im Bildschirm-Code, weil er dieselben Zahlen
     * nennt, mit denen `stufenGewichte` rechnet. Haus-Regel: Eine Regel steht
     * genau einmal, und der Erklärtext gehört dazu.
     */
    abklingenErklaerung(stufeId) {
        const stufe = SCHACH_VARIANTEN.STUFEN.find((eintrag) => eintrag.id === stufeId);
        if (!stufe || !stufe.abklingen) {
            return "";
        }

        const anteil = Math.round(stufe.abklingen.gewicht * 100);

        return "Diese Stufe hat eine Abklingzeit: Direkt nach einem Würfel "
            + "dieser Stufe zählt sie nur noch mit " + anteil + " Prozent ihres "
            + "Gewichts und braucht " + stufe.abklingen.halbzuege + " Halbzüge, "
            + "bis sie wieder voll zählt. So kommen nicht mehrere gleiche "
            + "hintereinander; die anderen Stufen behalten ihre Chance und sind "
            + "in dieser Zeit häufiger an der Reihe.\n\n";
    },

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
            + SCHACH_VARIANTEN.abklingenErklaerung(stufe.id)
            + "Innerhalb der Stufe sind alle gleich wahrscheinlich — bei "
            + arten.length + " Fähigkeiten also je " + einzeln + " Prozent.\n\n"
            + "Nach jedem Halbzug kann ein neuer Würfel erscheinen — mit "
            + SCHACH_VARIANTEN.BONUS_CHANCE + " Prozent, also im Schnitt etwa jeden "
            + "sechsten. Meist einer, selten zwei, sehr selten drei. Der Nachschub "
            + "hört nie auf, solange ein Feld frei ist; liegen gelassene Würfel "
            + "bleiben liegen, bis sie jemand einsammelt.\n\n"
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
            + "Feld — meist einer, manchmal mehr (" + anzahl + "). Das hört nicht "
            + "auf: Solange ein Feld frei ist, kommt Nachschub, und liegen "
            + "gelassene bleiben liegen. Wer mit einer Figur darauf zieht, sammelt "
            + "die Fähigkeit für sein Team ein.\n\n"
            + "Welche es wird, hängt von der Stufe ab:\n";

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            const arten = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id);
            text += "\n" + stufe.titel.toUpperCase() + " — " + stufe.chance + " Prozent"
                + (stufe.abklingen ? ", mit Abklingzeit" : "") + "\n";

            for (const art of arten) {
                const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
                text += "  " + eintrag.titel + " ("
                    + SCHACH_VARIANTEN.chanceVon(art).toFixed(1).replace(".", ",")
                    + " Prozent): " + eintrag.beschreibung + "\n";
            }
        }

        text += "\nInnerhalb einer Stufe sind alle gleich wahrscheinlich. "
            + "Gewürfelt wird dabei nicht: Feld und Fähigkeit werden aus dem "
            + "Spielstand gerechnet, damit alle Mitspieler dasselbe Brett sehen.\n\n"
            + "Eine Stufe mit Abklingzeit kommt direkt nach einem Würfel dieser "
            + "Stufe eine Weile seltener; die übrigen Stufen behalten ihre "
            + "Chance und sind so lange häufiger an der Reihe.";

        return text;
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_VARIANTEN;
}
