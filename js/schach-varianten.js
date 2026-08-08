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
 *     koenigeAlsLeben  true = zwei Könige sind zwei Leben (seit v0.49). Solange
 *                    eine Seite mehr als einen König hat, ist ihr König eine
 *                    Figur wie jede andere; beim LETZTEN gelten wieder Schach
 *                    und Matt. Der Unterschied zu `koenigSchlagbar`: Der hängt
 *                    am BRETT und gilt immer, dieser hier an der STELLUNG und
 *                    je Farbe getrennt. Beantwortet wird beides an einer Stelle,
 *                    `SCHACH.koenigSchlagbarFuer`.
 *     zufallsArmee   true = die Aufstellung wird je Partie GERECHNET, nicht aus
 *                    `aufstellung` gelesen (seit v0.49, siehe
 *                    `SCHACH_RUNDE._armeeStand`). Das Feld `aufstellung` bleibt
 *                    trotzdem gefüllt: Es ist das BEISPIEL für die Kachel in der
 *                    Auswahl und der Rückfall, falls ein Stand ohne Brett kommt.
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
            beschreibung: "Das Spielfeld wächst um eine Reihe oder Spalte — oben, "
                + "unten, links oder rechts, jede Seite mit derselben Chance von "
                + "einem Viertel. Alle Wege werden länger."
        },

        /*
         * Das Gegenstück zur Ausdehnung (seit v0.54). Eine Seite mit König
         * fällt nie weg — sonst nähme der Würfel einen König vom Brett und
         * beendete die Partie, ohne dass jemand etwas dafür konnte.
         */
        schrumpfung: {
            titel: "Einsturz",
            stufe: "blau",
            beschreibung: "Eine ganze Reihe oder Spalte bricht weg — zufällig eine "
                + "der vier Seiten, aber nie eine, auf der ein König steht. Was "
                + "dort steht, stürzt mit: Figuren wie Würfel."
        },

        /*
         * Das Erdbeben — seit v0.54 hier statt bei den Fähigkeiten, und mit
         * neuer Wirkung. Vorher schob es drei Reihen zur Seite; jetzt bricht
         * der Boden auf.
         */
        erdbeben: {
            titel: "Erdbeben",
            stufe: "lila",
            beschreibung: "Der Boden reisst auf: Drei freie Felder brechen weg und "
                + "sind ab sofort gesperrt — niemand zieht hindurch, nur Springer "
                + "setzen darüber hinweg. Anders als eine Mauer bleiben die Risse "
                + "die ganze Partie. Und sie reissen SOFORT auf: Wer den Würfel im "
                + "Vorbeiziehen mitnimmt und danach vor einem Loch steht, bleibt "
                + "davor stehen — der Zug endet dort."
        },
        vollesGlas: {
            titel: "Volles Glas",
            stufe: "gruen",
            beschreibung: "Wer ihn einsammelt, sieht die gegnerischen Figuren 8 "
                + "Halbzüge lang falsch: Sie ziehen wie immer, sehen aber aus wie "
                + "etwas anderes. Nur die eigene Ansicht ist betroffen — der Gegner "
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

    /* ---------------------------------------------------------------- *
     * Glücksboxen-Regen (seit v0.50)
     *
     * Ein Haken beim Anlegen: Je mehr Felder frei sind, desto mehr Würfel
     * erscheinen. Gedacht für den späten Teil einer Partie, wenn das Brett
     * leergefegt ist und sonst kaum noch etwas passiert.
     *
     * Beide Zahlen hängen am ANTEIL der freien Felder, nicht an ihrer Anzahl —
     * sonst regnete es auf dem Doppelbrett (128 Felder) von Beginn an, und auf
     * dem kleinen Brett (36) nie.
     * ---------------------------------------------------------------- */

    REGEN: {
        /*
         * DER REGEN WÄCHST EXPONENTIELL (seit v0.53).
         *
         * Bis v0.52 stieg er gerade mit dem Anteil freier Felder — zu Beginn
         * also spürbar, gegen Ende kaum stärker. Gewünscht war das Gegenteil:
         * lange wenig, und je leerer das Brett, desto heftiger, bis es im
         * Grenzfall auf JEDEM freien Feld einen Würfel gibt.
         *
         * Beide Zahlen sind Exponenten auf den Füllstand. Höher heisst: später,
         * dafür steiler.
         */
        kurve: 3,
        chanceKurve: 2,

        /*
         * WOGEGEN DER FÜLLSTAND GEMESSEN WIRD.
         *
         * Nicht gegen alle Felder, sondern gegen die, die überhaupt frei werden
         * KÖNNEN — zwei Könige bleiben immer stehen. Nur so erreicht der Anteil
         * wirklich 1, und nur dann greift die Zusage: „Wenn nur noch die beiden
         * Könige da sind, bekommt jedes freie Feld einen Würfel."
         */
        bleibenStehen: 2
    },

    /*
     * Wie voll das Brett ist, als Zahl von 0 (voll) bis 1 (nur noch die beiden
     * Könige). Grundlage für Chance UND Anzahl des Regens.
     */
    regenAnteil(freieFelder, alleFelder) {
        const moeglich = Math.max(1, alleFelder - SCHACH_VARIANTEN.REGEN.bleibenStehen);
        return Math.min(1, Math.max(0, freieFelder / moeglich));
    },

    /* Wie viele Würfel der Regen auswirft. Bei ganz leerem Brett: alle. */
    regenAnzahl(freieFelder, alleFelder) {
        const anteil = SCHACH_VARIANTEN.regenAnteil(freieFelder, alleFelder);
        const gewuenscht = freieFelder * Math.pow(anteil, SCHACH_VARIANTEN.REGEN.kurve);

        return Math.max(1, Math.min(freieFelder, Math.ceil(gewuenscht)));
    },

    /* Mit welcher Chance (Prozent) der Regen bei diesem Füllstand einsetzt. */
    regenChance(freieFelder, alleFelder) {
        const anteil = SCHACH_VARIANTEN.regenAnteil(freieFelder, alleFelder);
        return 100 * Math.pow(anteil, SCHACH_VARIANTEN.REGEN.chanceKurve);
    },

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
     *   `istDerZug: true`    Die Fähigkeit IST der Zug (seit v0.48). Man bleibt
     *                        am Zug und muss ihn sofort machen — aber nur nach
     *                        dem Muster der Fähigkeit, nichts anderes
     *                        (`stand.zusatzNurDieses`). Kein Pluszeichen: Ein
     *                        normaler Zug bleibt eben NICHT.
     *
     *                        Der Unterschied zu `beendetZug`: Dort zieht erst
     *                        der Gegner, und die Wirkung kommt eine Runde
     *                        später. Sprung und Teleport wirken sofort — so
     *                        hatte der Nutzer sie gemeint, und so sind sie seit
     *                        v0.48 gebaut (v0.47 hatte ihnen `beendetZug`
     *                        gegeben).
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
     *
     * ----------------------------------------------------------------------
     * WER MATERIAL ODER EINEN ANGRIFF BEKOMMT, GIBT DEN ZUG AB (seit v0.47).
     *
     * Das ist die Regel, nach der `beendetZug` gesetzt wird — nicht die Stufe.
     * Die Stufe sagt nur, wie SELTEN eine Fähigkeit ist; wie teuer sie ist,
     * sagt dieser Schalter. Drei Gruppen:
     *
     *   1. Material dazu (Wiedergeburt, Wiederbelebung, Spiegel, Verstärkung,
     *      Friedhof, Händler) → `beendetZug`. Sonst bekäme man Figuren
     *      geschenkt und dürfte im selben Atemzug damit angreifen.
     *   2. Eine andere Gangart für genau diesen Zug (Sprung, Teleport) →
     *      `istDerZug`. Sie sind gewöhnlich, kommen also ständig; ein
     *      geschenkter Springerzug obendrauf wäre zu viel. Bezahlt wird er
     *      deshalb mit dem eigenen Zug — nur eben sofort, nicht erst nach dem
     *      Gegner (bis v0.47 hatten sie `beendetZug`).
     *   3. Nur die Stellung verändert (Nudelholz, Mauer, Schutzschild, Fessel,
     *      Frost) oder gar keine Figur berührt (Ausweichen: zieht nur auf
     *      FREIE Felder und schlägt nie) → das Pluszeichen bleibt.
     *
     * DER BAUERNSCHUB STAND BIS v0.55 IN GRUPPE 3 und hat seither trotzdem
     * `beendetZug`. Das ist kein Bruch der Regel, sondern ihr zweiter Teil:
     * Wird eine Fähigkeit zu stark, nimmt man ihr das Pluszeichen. Er
     * verschiebt bis zu acht Figuren, und mit dem Zug obendrauf waren das zwei
     * Züge für eine Fähigkeit. Die Begründung steht bei ihm selbst.
     *
     * Der Doppelzug ist die eine Ausnahme: Sein Pluszeichen IST seine Wirkung,
     * nicht sein Preis.
     *
     * Wird eine Fähigkeit zu stark, wird ihr das Pluszeichen genommen — nicht
     * ihre Stufe geändert. Eine verschobene Stufe ändert nur, wie oft sie
     * kommt; der Schalter ändert, was sie kostet.
     * ----------------------------------------------------------------------
     */
    FAEHIGKEITEN: {

        /* ---- Gewöhnlich: mehr Beweglichkeit für genau einen Zug ----
           Sie helfen situativ, gewinnen aber für sich genommen nichts. */

        sprung: {
            titel: "Sprung",
            stufe: "gruen",
            art: "zugmuster",
            muster: "springer",
            istDerZug: true,
            beschreibung: "Einsetzen, dann sofort springen: Eine Figur deiner Wahl "
                + "geht jetzt wie ein Springer — und darf dabei schlagen. Der Sprung "
                + "IST dein Zug; etwas anderes kannst du in diesem Zug nicht mehr "
                + "machen, und danach ist der Gegner dran."
        },
        /*
         * AUSWEICHEN GEHT SEIT v0.58 NUR NOCH IM GEGENZUG.
         *
         * Es ist die Notbremse: Eine Figur weicht aus, WÄHREND der Gegner
         * zuschlägt. Bis v0.57 durfte man es auch im eigenen Zug einsetzen und
         * behielt dabei seinen Zug — damit war es ein geschenktes Extra-Feld
         * für jede Figur, jederzeit. Als Notbremse gedacht, als Gratis-Zug
         * benutzt (Nutzer-Meldung 08.08.).
         *
         * Das Pluszeichen fällt dadurch von selbst weg: Wer am Zug ist, darf
         * sie gar nicht erst einsetzen — es gibt also keinen Zug zu behalten.
         * Der Blitz bleibt und ist jetzt das EINZIGE Zeichen an ihr.
         */
        ausweichen: {
            titel: "Ausweichen",
            stufe: "gruen",
            art: "zugmuster",
            muster: "ausweichen",
            imGegenzug: true,
            nurImGegenzug: true,
            beschreibung: "Die Notbremse: Du setzt sie ein, WÄHREND der Gegner am "
                + "Zug ist — im eigenen Zug geht sie nicht. Danach darf eine Figur "
                + "deiner Wahl bei deinem nächsten Zug auch ein Feld in jede "
                + "Richtung gehen, auf ein FREIES Feld; geschlagen wird dabei "
                + "nicht. Wer zuerst drückt, war zuerst."
        },
        teleport: {
            titel: "Teleport",
            stufe: "gruen",
            art: "zugmuster",
            muster: "umkreis2",
            istDerZug: true,
            beschreibung: "Einsetzen, dann Figur antippen und Zielfeld wählen: Sie "
                + "setzt auf ein FREIES Feld im Umkreis von zwei, über alles hinweg "
                + "— geschlagen wird dabei nicht. Der Teleport IST dein Zug; normal "
                + "ziehen kannst du danach nicht mehr, es ist der Gegner dran."
        },

        /* ---- Ungewöhnlich: verändert die Stellung ----
           Spürbar, aber zweischneidig: Sie kosten den Gegner kein Material. */

        /*
         * DER BAUERNSCHUB HAT SEIT v0.56 KEIN PLUSZEICHEN MEHR.
         *
         * Er verschiebt zwar nur die Stellung und fiele damit unter Gruppe 3 —
         * aber er verschiebt bis zu acht Figuren auf einmal, und mit dem Zug
         * obendrauf konnte man erst die ganze Reihe vorrücken und dann mit
         * einem der geschobenen Bauern schlagen. Das sind zwei Züge für eine
         * Fähigkeit; gemeldet als „zu stark". Nach der Regel von v0.47 nimmt
         * man einer zu starken Fähigkeit das Pluszeichen, statt ihre Stufe zu
         * verschieben — genau das ist hier passiert.
         *
         * Der Ausgleich steht im zweiten Satz: Erreichen Bauern durch den
         * Schub die letzte Reihe, wandeln sie ALLE um, und man wählt die Figur.
         * Bis v0.55 wurden sie stillschweigend zu Damen.
         */
        bauernschub: {
            titel: "Bauernschub",
            stufe: "blau",
            art: "sofort",
            beendetZug: true,
            beschreibung: "Alle eigenen Bauern rücken sofort ein Feld vor, soweit "
                + "das Feld davor frei ist. Geschlagen wird dabei nicht. Erreichen "
                + "dabei Bauern die letzte Reihe, wandeln sie alle um — du wählst, "
                + "in welche Figur. Danach ist der Gegner am Zug."
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
        /*
         * DAS ERDBEBEN IST SEIT v0.54 KEINE FÄHIGKEIT MEHR.
         *
         * Es steht jetzt bei den Unglückswürfeln (`PECH`) und reisst Risse in
         * den Boden, statt Reihen zu verschieben — auf Nutzer-Ansage. Wer es
         * noch im Vorrat hatte, verliert es beim nächsten Laden:
         * `SCHACH_RUNDE.normalisieren` wirft Fähigkeiten weg, die es nicht mehr
         * gibt. Das ist gewollt — eine Fähigkeit, die sich nicht mehr einsetzen
         * lässt, wäre schlimmer.
         */

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

        /*
         * FROST SPERRT SEIT v0.56 EINE FLÄCHE, KEINE FIGUR.
         *
         * Angetippt wird die linke obere Ecke eines 2×2-Blocks; alles darin
         * friert ein — auch eigene Figuren. Das ist die Entscheidung des
         * Nutzers vom 08.08. und zugleich das, was die Fähigkeit interessant
         * macht: Sie ist stark, aber man muss den Block sauber setzen.
         *
         * Damit trennen sich Frost und Fessel endlich sauber: Frost sperrt
         * eine FLÄCHE für einen Zug und macht unantastbar, die Fessel hält
         * EINE Figur über mehrere Züge fest und lässt sie schlagbar. Vorher
         * taten beide fast dasselbe.
         */
        frost: {
            titel: "Frost",
            stufe: "lila",
            art: "ziel",
            zielArt: "frostblock",
            beschreibung: "Friert ein 2-mal-2-Feld für einen Zug ein: Was darin "
                + "steht, zieht nicht und lässt sich in dieser Zeit auch nicht "
                + "schlagen — eigene Figuren eingeschlossen. Könige bleiben "
                + "verschont. Angetippt wird die linke obere Ecke des Blocks."
        },
        /*
         * VERSTÄRKUNG IST SEIT v0.56 EINE AUFWERTUNGSKETTE.
         *
         * Bis v0.55 machte sie aus einem Bauern einen Springer, sonst nichts.
         * Jetzt steigt JEDE eigene Figur eine Stufe (`SCHACH.AUFWERTUNG`).
         * Deshalb ist `zielArt` von `eigenerBauer` auf `eigeneFigur` gewechselt.
         *
         * Am oberen Ende steht der König, und der ist keine Zierde: Ein
         * zweiter König sind ZWEI LEBEN — dieselbe Regel wie bei der
         * Zufallsarmee, `koenigeAlsLeben` im Stand. Und weil zwei Leben nicht
         * für jeden das Richtige sind, geht der Weg zurück: Wer zwei Könige
         * hat, tippt einen an und bekommt zwei Damen.
         */
        verstaerkung: {
            titel: "Verstärkung",
            stufe: "lila",
            art: "ziel",
            zielArt: "eigeneFigur",
            beendetZug: true,
            beschreibung: "Eine eigene Figur steigt eine Stufe auf: Bauer wird "
                + "Springer, Springer wird Läufer oder Turm, Läufer und Turm werden "
                + "Dame, Dame wird König — und ein zweiter König sind zwei Leben. "
                + "Hast du zwei Könige, wird einer davon zu zwei Damen. Danach ist "
                + "der Gegner am Zug."
        },
        fessel: {
            titel: "Fessel",
            stufe: "lila",
            art: "ziel",
            zielArt: "gegnerFigur",
            beschreibung: "Eine gegnerische Figur bleibt mehrere Züge lang stehen "
                + "— sie darf nicht ziehen, ist dabei aber ganz normal zu schlagen. "
                + "Wie lange, steht als Zahl an ihrem Feld."
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
        /*
         * Wiedergeburt ist seit v0.48 EPISCH, nicht mehr legendär.
         *
         * Sie holt eine Figur auf die eigene GRUNDREIHE zurück — weit weg vom
         * Geschehen, und der Gegner sieht sie kommen. Damit ist sie deutlich
         * schwächer als ihre legendären Nachbarn (Wiederbelebung setzt an den
         * Ort des Geschehens, der Friedhof bringt gleich vier). Auf der
         * legendären Stufe war sie die Enttäuschung unter fünf.
         */
        wiedergeburt: {
            titel: "Wiedergeburt",
            stufe: "lila",
            art: "ziel",
            zielArt: "eigeneGrundreihe",
            beendetZug: true,
            beschreibung: "Die zuletzt verlorene eigene Figur kehrt auf ein freies "
                + "Feld der eigenen Grundreihe zurück. Danach ist der Gegner am Zug."
        },
        spiegel: {
            titel: "Spiegel",
            stufe: "gelb",
            art: "ziel",
            zielArt: "eigeneFigurKopierbar",
            beendetZug: true,
            beschreibung: "Verdoppelt eine eigene Figur: Die Kopie erscheint auf einem "
                + "freien Feld daneben. Könige lassen sich nicht spiegeln. Danach ist "
                + "der Gegner am Zug."
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
                + "hindurch, aber Springer setzen darüber hinweg. Nach 6 Halbzügen — "
                + "also je drei Zügen für dich und den Gegner — zerfällt sie."
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
                + "wie mit eigenen. Wie lange sie bleiben, hängt von der Figur ab: "
                + "je stärker, desto kürzer. Ein Bauer hält 8 Halbzüge durch, eine "
                + "Dame nur 2 — sie zieht also genau einmal. Die Restzeit steht an "
                + "ihrem Feld. Danach ist der Gegner am Zug."
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

    /*
     * EINE SEITE DARF MEHRERE FIGURENARTEN TRAGEN (seit v0.58).
     *
     * Bis v0.57 war `gibt` und `bekommt` je EIN Eintrag — für „drei Bauern
     * gegen einen Springer" reicht das. Für „Dame und Bauer gegen einen
     * König" nicht: Dort stehen links zwei verschiedene Arten. Deshalb darf
     * eine Seite jetzt auch eine LISTE sein.
     *
     * Die alten Zeilen bleiben unverändert stehen — `handelSeite` macht aus
     * beidem eine Liste. Das ist billiger und lesbarer, als zehn Zeilen in
     * Klammern zu setzen, nur damit die elfte hineinpasst.
     *
     * `gewicht` (wahlfrei, Vorgabe 1) sagt, wie oft ein Angebot gezogen wird.
     * Gebraucht wird es genau einmal: Der König ist ein zweites LEBEN und
     * gehört damit nicht in die normale Rotation.
     */
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
        { gibt: { art: "D", anzahl: 1 }, bekommt: { art: "T", anzahl: 2 } },

        /*
         * DAS SELTENE ANGEBOT: ein zweites Leben.
         *
         * Zehn Punkte Material gegen einen zweiten König — nach den üblichen
         * Figurenwerten ein schlechtes Geschäft, nach der Regel „zwei Könige
         * sind zwei Leben" (siehe `SCHACH.koenigSchlagbarFuer`) ein sehr
         * gutes: Solange zwei stehen, kennt diese Seite kein Matt. Deshalb
         * kostet es die Dame UND einen Bauern, und deshalb kommt es mit
         * einem Zehntel des Gewichts der übrigen.
         */
        {
            gibt: [{ art: "D", anzahl: 1 }, { art: "B", anzahl: 1 }],
            bekommt: { art: "K", anzahl: 1 },
            gewicht: 0.1
        }
    ],

    /* Eine Seite eines Angebots als Liste — einzelner Eintrag oder mehrere. */
    handelSeite(seite) {
        return Array.isArray(seite) ? seite : [seite];
    },

    /* Wie viele Figuren eine Seite umfasst. */
    handelAnzahl(seite) {
        return SCHACH_VARIANTEN.handelSeite(seite)
            .reduce((summe, teil) => summe + teil.anzahl, 0);
    },

    /*
     * Zieht ein Angebot aus der Tabelle. `wert` ist eine Zahl von 0 bis 1.
     * Gewichtet, damit ein einzelnes Angebot selten sein kann.
     */
    handelZiehen(wert) {
        const gewichte = SCHACH_VARIANTEN.HANDEL.map(
            (eintrag) => (typeof eintrag.gewicht === "number") ? eintrag.gewicht : 1);
        const summe = gewichte.reduce((teil, einzeln) => teil + einzeln, 0);

        let rest = Math.min(Math.max(wert, 0), 0.999999) * summe;

        for (let stelle = 0; stelle < SCHACH_VARIANTEN.HANDEL.length; stelle++) {
            if (rest < gewichte[stelle]) {
                return SCHACH_VARIANTEN.HANDEL[stelle];
            }
            rest -= gewichte[stelle];
        }

        return SCHACH_VARIANTEN.HANDEL[0];
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
        },

        /*
         * NEUE SPIELARTEN KOMMEN ANS ENDE DER LISTE.
         *
         * Nicht aus Bequemlichkeit: Die Partie-Kennungen der Tests entstehen
         * aus der Reihenfolge dieser Liste, und die gerechneten Würfel hängen
         * an der Kennung. Ein Eintrag in der Mitte verschiebt alles dahinter
         * und lässt Tests scheitern, die mit der neuen Spielart nichts zu tun
         * haben (genau so beim Bau von v0.49 passiert).
         */
        {
            id: "zufallsarmee",
            titel: "Zufallsarmee",
            beschreibung: "Gibt es seit v0.51 nicht mehr zur Auswahl — dasselbe "
                + "erreicht man mit jeder Spielart und dem Haken Zufallsarmee.",

            /*
             * NICHT MEHR ZUR AUSWAHL, aber weiterhin im Katalog — dieselbe
             * Geschichte wie bei „Fähigkeiten sammeln" (v2.9).
             *
             * In v0.49 war die Zufallsarmee eine eigene Spielart und damit an
             * das 8-mal-8-Brett gefesselt. Seit v0.51 ist sie ein HAKEN
             * (`regeln.zufallsArmee`) und gilt für jedes Brett; die Spielart
             * wäre nur noch „Klassisch mit Haken" und stünde doppelt in der
             * Liste. Gelöscht wird sie trotzdem nicht: Laufende Partien tragen
             * diese Kennung im Stand und verlören sonst ihre Spielart.
             */
            versteckt: true,

            breite: 8,
            hoehe: 8,

            /*
             * Die KLASSISCHE Aufstellung, obwohl sie hier nie gespielt wird:
             * Aus ihr zählt `armeeAnzahl` die gewohnte Armee (16 → 8 Figuren) —
             * genau die Zahl, die diese Spielart in v0.49 und v0.50 hatte. Sie
             * ist ausserdem der Rückfall, falls ein Stand ohne Brett kommt. Das
             * echte Brett rechnet `SCHACH_RUNDE._armeeStand`.
             */
            aufstellung:
                "tsldklst"
                + "bbbbbbbb"
                + "........"
                + "........"
                + "........"
                + "........"
                + "BBBBBBBB"
                + "TSLDKLST",

            /*
             * Keine Rochade: Sie wird aus der STELLUNG gelesen (König auf
             * seinem Startfeld, Turm auf derselben Grundreihe) — bei einer
             * gewürfelten Aufstellung ist das Startfeld des Königs nur noch
             * Zufall, und mit zwei Königen wäre nicht einmal klar, wessen Recht
             * gemeint ist.
             */
            rochade: false,
            koenigSchlagbar: false,

            /* Für Partien, die noch mit dieser Spielart laufen. Neue Partien
               bekommen beides über den Haken, siehe `SCHACH_RUNDE.armeeAn`. */
            koenigeAlsLeben: true,
            zufallsArmee: true,

            bonusFelder: []
        }
    ],

    /* ---------------------------------------------------------------- *
     * Die Zufallsarmee (seit v0.49)
     *
     * Nur Zahlen — WIE daraus ein Brett wird, steht in
     * `SCHACH_RUNDE._armeeStand`; hier steht, WAS gezogen wird.
     * ---------------------------------------------------------------- */

    ARMEE: {
        /*
         * WIE VIELE SPALTEN LINKS UND RECHTS FREI BLEIBEN — und damit indirekt,
         * wie viele Figuren eine Seite bekommt (siehe `armeeAnzahl`).
         *
         * Zwei, auf jeder Karte. Auf dem klassischen Brett sind das die
         * 2-mal-2-Ecken aus dem ursprünglichen Wunsch; auf dem kleinen bleibt
         * dadurch genau ein 2-mal-2-Feld in der Mitte, auf dem Doppelbrett ein
         * breiter Streifen. Die Ecke ist das, was die Aufstellung erkennbar
         * macht — deshalb ist SIE fest und die Menge folgt.
         */
        randBreite: 2,

        /*
         * Wie oft eine Seite mit ZWEI Königen startet, in Prozent.
         *
         * Zwei Könige sind zwei Leben und damit der grösste Vorteil, den es
         * hier gibt — dafür fehlt eine Figur, denn die Gesamtzahl bleibt.
         * Selten genug, dass es eine Überraschung ist (etwa jede achte Seite),
         * aber nicht so selten, dass man es nie erlebt.
         */
        zweiKoenige: 12,

        /*
         * Woraus die übrigen Figuren gezogen werden. Summe 100.
         *
         * Die Verteilung folgt dem gewohnten Schach, nur gestaucht: Bauern
         * bleiben das Rückgrat, die Dame ist die Ausnahme. Ohne den hohen
         * Bauernanteil stünden acht Offiziere auf dem Brett, und die Partie
         * wäre nach vier Zügen entschieden.
         */
        figuren: [
            { art: "B", chance: 34 },
            { art: "S", chance: 18 },
            { art: "L", chance: 18 },
            { art: "T", chance: 18 },
            { art: "D", chance: 12 }
        ],

        /*
         * Höchstens so viele Damen je Seite. Ohne diese Grenze zieht eine Seite
         * gelegentlich zwei oder drei — gegen sieben Bauern ist das keine
         * Partie mehr, sondern ein Ergebnis. Was darüber hinaus gezogen wird,
         * wird zum Turm.
         */
        hoechstensDamen: 1
    },

    /*
     * Wie viele Spalten die Armee einnimmt, und wie breit der freie Rand links
     * und rechts ist.
     *
     * DER RAND IST FEST (seit v0.52): immer zwei Spalten je Seite, auf JEDER
     * Karte. Was in der Mitte übrig bleibt, füllt die Armee — auf zwei
     * Grundreihen.
     *
     * v0.51 hatte es andersherum versucht: erst die halbe Armee bestimmen, dann
     * den Rand daraus rechnen. Auf dem kleinen Brett kam damit nur eine Spalte
     * Rand heraus, und die 2-mal-2-Ecken waren weg — genau das, was am
     * klassischen Brett den Reiz ausmacht. Jetzt bleibt die Ecke, und die
     * Menge folgt ihr.
     */
    armeeSpalten(variante) {
        const rand = SCHACH_VARIANTEN.ARMEE.randBreite;

        /* Mindestens eine Spalte, sonst stünde auf einem sehr schmalen Brett
           gar nichts — dann schrumpft eben der Rand. */
        const spalten = Math.max(1, variante.breite - 2 * rand);

        return {
            spalten: spalten,
            rand: Math.floor((variante.breite - spalten) / 2)
        };
    },

    /*
     * Wie viele Figuren eine Seite in dieser Spielart bekommt: zwei Grundreihen
     * mal die freien Spalten in der Mitte. Ein Feld, eine Figur — die Zahl ist
     * also nicht gewählt, sie fällt aus dem Brett:
     *
     *     Klassisch (8)      4 Spalten →  8      Kleines Brett (6)  2 →  4
     *     Großes Brett (10)  6 Spalten → 12      Doppelbrett (16)  12 → 24
     *
     * Mindestens zwei: der König und eine Figur. Ein König allein wäre keine
     * Partie, sondern ein Wettlauf.
     */
    armeeAnzahl(variante) {
        return Math.max(2, SCHACH_VARIANTEN.armeeSpalten(variante).spalten * 2);
    },

    /* Zieht eine Figur der Zufallsarmee. `wert` ist eine Zahl von 0 bis 1. */
    armeeFigurZiehen(wert) {
        let rest = Math.min(Math.max(wert, 0), 0.999999) * 100;

        for (const eintrag of SCHACH_VARIANTEN.ARMEE.figuren) {
            if (rest < eintrag.chance) {
                return eintrag.art;
            }
            rest -= eintrag.chance;
        }

        return "B";
    },

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
     * TRÄGT DIESE FÄHIGKEIT DAS PLUSZEICHEN? (seit v0.58 an einer Stelle)
     *
     * Das Zeichen sagt: „Danach bleibt dir dein normaler Zug." Drei Schalter
     * nehmen es weg, und alle drei aus demselben Grund — es bliebe kein Zug:
     *
     *     beendetZug      danach ist der Gegner dran
     *     istDerZug       die Fähigkeit IST der Zug (Sprung, Teleport)
     *     nurImGegenzug   man ist gar nicht am Zug (Ausweichen, seit v0.58)
     *
     * Gefragt wird die FÄHIGKEIT, nicht der Spielstand (seit v0.48) — das
     * Zeichen soll ein Merkmal sein, an dem man sie wiedererkennt, und nichts,
     * was flackert. Was gerade wirklich geht, sagt `SCHACH_RUNDE.behaeltZug`.
     *
     * Die Frage stand bis v0.57 an zwei Stellen im Bildschirm-Code (Vorrat und
     * Bibliothek) und wäre beim nächsten Schalter an einer davon vergessen
     * worden.
     */
    zeigtPlus(art) {
        const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        return !!eintrag && !eintrag.beendetZug && !eintrag.istDerZug
            && !eintrag.nurImGegenzug;
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
