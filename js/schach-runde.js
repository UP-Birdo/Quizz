/*
 * schach-runde.js — EINE Partie mit ihren beiden Teams.
 *
 * schach.js kennt nur die Regeln; hier kommt dazu, WER ziehen darf und wie der
 * gemeinsame Stand aussieht. Auch diese Datei ist ohne Browser testbar.
 *
 * Seit v1.4 laufen mehrere Partien nebeneinander. Die Sammlung aller Partien
 * liegt in schach-tafel.js — diese Datei kennt immer nur eine einzelne.
 *
 * Die wichtigste Hausregel dieser Partie:
 * **Innerhalb eines Teams gibt es keine Reihenfolge.** Jeder aus dem Team, das
 * am Zug ist, darf ziehen — wer zuerst drückt, hat gezogen. Der Wechsel
 * zwischen Weiss und Schwarz bleibt normales Schach.
 *
 * Datenvertrag (additiv — Felder nur ERGÄNZEN):
 *
 *     {
 *         "datenVersion": 1,
 *         "id": "p-1",                 // Kennung innerhalb der Tafel
 *         "titel": "Partie 1",         // frei wählbarer Name
 *         "variante": "standard",      // Spielart, siehe schach-varianten.js
 *         "erstelltAm": 1750000000000,
 *         "geaendertAm": 1750000000000,
 *         "stand": { … },              // Brett und Zugrecht, siehe schach.js
 *         "zugZaehler": 0,             // steigt mit jedem Zug; die Sperre
 *                                      // gegen zwei gleichzeitige Züge
 *         "laeuft": false,
 *         "ergebnis": "",              // "", "weiss", "schwarz", "remis"
 *         "teams":  { "weiss": ["id"], "schwarz": ["id"] },
 *         "bereit": { "weiss": false, "schwarz": false },
 *         "faehigkeiten": { "weiss": ["sprung"], "schwarz": [] },
 *         "bonusGesammelt": [26],      // schon eingesammelte Bonusfelder
 *         "verlauf": [ { "text": "Bauer e2 nach e4", "wer": "Anna",
 *                        "farbe": "weiss", "von": 52, "nach": 36 } ]
 *     }
 *
 * Warum die EINGESAMMELTEN Bonusfelder gespeichert werden und nicht die
 * verbliebenen: Firebase wirft leere Listen weg. Eine leere Liste
 * „verbliebene Felder" käme als „nicht vorhanden" zurück und würde beim
 * Normalisieren wieder mit allen Feldern gefüllt — die Fähigkeiten lägen
 * plötzlich wieder auf dem Brett. Bei den eingesammelten stimmt „nicht
 * vorhanden" mit „noch keins eingesammelt" überein.
 */

const SCHACH_RUNDE = {

    DATEN_VERSION: 1,

    /* So viele Züge bleiben im Verlauf stehen. */
    VERLAUF_LAENGE: 40,

    /* Wie lange das volle Glas die Sicht trübt (in Halbzügen). */
    GLAS_HALBZUEGE: 8,

    /*
     * Wie lange auf die Zustimmung des Teams gewartet wird (in Sekunden), je
     * nachdem wie oft jemand schon nicht mitgestimmt hat.
     *
     * Der Grund für die Staffelung: Ein Team mit zwei Leuten könnte sonst gar
     * nichts mehr tun, sobald einer aufhört mitzuspielen. Wer zweimal nicht
     * abstimmt, verkürzt die Frist — bis sie bei fünf Sekunden liegt, dann bei
     * drei. Sobald er wieder mitstimmt, fängt sie von vorn an.
     */
    FRIST_SEKUNDEN: [10, 5, 3],

    /* Nach so vielen versäumten Abstimmungen rutscht man eine Stufe tiefer. */
    FRIST_NACH_VERSAEUMNISSEN: 2,

    /*
     * Fassung der Fähigkeiten-Ablage. 1 hieß: vier feste Felder von Beginn an.
     * 2 heißt: Würfel erscheinen über die Partie verteilt. Partien ohne diese
     * Angabe stammen aus Fassung 1 und werden übernommen.
     */
    BONUS_FASSUNG: 2,

    leereRunde(zeitpunkt, varianteId, id, titel) {
        const variante = SCHACH_VARIANTEN.holen(varianteId);
        const wann = (zeitpunkt === undefined) ? 0 : zeitpunkt;

        const runde = {
            datenVersion: SCHACH_RUNDE.DATEN_VERSION,
            id: id || "",
            titel: titel || "",
            variante: variante.id,
            erstelltAm: wann,

            /*
             * Wann die Partie wirklich losging (beide Seiten bereit) — seit
             * v3.3, für die Spieldauer im Spielerprofil. 0 heisst: noch nicht
             * gestartet, oder eine Partie von vorher. Dann tritt `erstelltAm`
             * an die Stelle; die Zahl ist dann grosszügiger, aber nie falsch
             * herum.
             */
            gestartetAm: 0,

            geaendertAm: wann,
            stand: SCHACH.neuerStand(variante.id),
            zugZaehler: 0,
            laeuft: false,
            ergebnis: "",
            teams: { weiss: [], schwarz: [] },
            bereit: { weiss: false, schwarz: false },
            faehigkeiten: { weiss: [], schwarz: [] },
            bonusGesammelt: [],

            /* Die Würfel, die gerade auf dem Brett liegen: [{ feld, art }].
               Seit Fassung 2 erscheinen sie über die Partie verteilt, statt von
               Anfang an fest zu liegen. */
            bonus: [],
            bonusFassung: SCHACH_RUNDE.BONUS_FASSUNG,

            /*
             * Bei welchem TAKT zuletzt ein Würfel einer Stufe erschienen ist:
             * { gruen: 12, … }. Daraus rechnet `_bonusNachziehen` die
             * Abklingzeit (seit v0.41, siehe SCHACH_VARIANTEN.stufenGewichte).
             * Eine Partie ohne dieses Feld verhält sich wie vorher — dann ist
             * für jede Stufe „lange her".
             */
            stufeZuletzt: {},

            /* Geschlagene Figuren je Farbe, für die Wiedergeburt. */
            verloren: { weiss: [], schwarz: [] },

            /*
             * Dasselbe noch einmal, aber MIT DEM ORT: [{ art, feld }] je Farbe,
             * das Jüngste hinten. Seit v3.3 für die Fähigkeit „Wiederbelebung",
             * die eine Figur genau dorthin zurückholt, wo sie fiel.
             *
             * Warum eine zweite Liste statt `verloren` umzubauen: `verloren`
             * wird an vier Stellen gelesen (Bilanz, Beutewert, Wiedergeburt,
             * Anzeige) und steht in jeder laufenden Partie. Eine Liste, deren
             * Elemente plötzlich Objekte statt Zeichen sind, hätte jede davon
             * angefasst — für einen Gewinn, den eine zusätzliche Liste genauso
             * bringt. Partien von vor v3.3 haben sie nicht; dann findet die
             * Wiederbelebung eben nichts, bis wieder etwas geschlagen wird.
             */
            gefallen: { weiss: [], schwarz: [] },

            /*
             * Was beim Anlegen eingestellt wurde. Die Vorgaben entsprechen dem
             * Verhalten von vorher, damit angefangene Partien sich nicht
             * ändern — sie haben diese Felder nicht und bekommen genau das,
             * was sie schon hatten.
             */
            regeln: {
                /* Erscheinen Würfel mit Fähigkeiten? Ohne Angabe entscheidet
                   die Spielart, wie bisher. */
                faehigkeiten: null,
                /* Zeigt der Würfel seine Seltenheit schon auf dem Brett? */
                seltenheitZeigen: true,

                /*
                 * Sieht man einem Würfel an, dass er ein UNGLÜCKSwürfel ist?
                 * (seit v0.49)
                 *
                 * Bis v0.48 war das eine eiserne Regel: Das umgedrehte
                 * Fragezeichen stand immer da. Seit v0.49 ist es ein Haken beim
                 * Anlegen — und er ist standardmässig AUS, wie alle Haken. Aus
                 * heisst: Der Unglückswürfel sieht aus wie ein guter, gleiche
                 * Farbe, Fragezeichen richtig herum. Man merkt es erst beim
                 * Einsammeln.
                 *
                 * Die Frage ist unabhängig von `seltenheitZeigen`: Die
                 * Seltenheit ist die FARBE, das Unglück ist das ZEICHEN. Wer
                 * beides koppelt (so war es bis v0.48), kann nicht „Farbe ja,
                 * Warnung nein" einstellen — genau das war der Wunsch.
                 */
                pechZeigen: false,

                /*
                 * WIE VIELE LOOTBOXEN ERSCHEINEN (seit v0.71): eine der vier
                 * Stufen wenig / normal / viele / regen. Was jede bedeutet,
                 * steht in `SCHACH_VARIANTEN.LOOTBOX_MENGEN`.
                 *
                 * Sie ersetzt die zwei Schalter darunter. Die bleiben stehen
                 * (additiver Datenvertrag) und werden beim Anlegen weiter
                 * mitgeschrieben — ein Gerät mit einer älteren Fassung im
                 * Zwischenspeicher spielt sonst nach ganz anderen Zahlen.
                 */
                lootboxMenge: "wenig",

                /*
                 * Glücksboxen-Regen (seit v0.50, abgelöst in v0.71): Je leerer
                 * das Brett, desto mehr Würfel erscheinen. Aus diesem Haken und
                 * der Stufe darunter wird `lootboxMenge` abgeleitet, wenn eine
                 * Partie sie noch nicht kennt.
                 */
                regen: false,

                /*
                 * Wie steil der Regen ansteigt: 1 bis 5 (seit v0.59, abgelöst
                 * in v0.71). 5 ist der Verlauf von v0.53 und die Vorgabe, 1
                 * lässt es lange fast gar nicht regnen und dann umso heftiger.
                 * Zahlen und Begründung in `SCHACH_VARIANTEN.REGEN.STUFEN`.
                 */
                regenStufe: 5,

                /*
                 * Zufallsarmee (seit v0.51 ein Haken, vorher eine eigene
                 * Spielart): Beide Seiten bekommen gewürfelt die halbe Armee,
                 * und selten sind zwei Könige darunter — zwei Leben.
                 */
                zufallsArmee: false,

                /*
                 * Nur mit `zufallsArmee`: Ziehen beide Seiten GETRENNT?
                 *
                 * Aus (Vorgabe) heisst: Es wird EINMAL gewürfelt, und beide
                 * Mannschaften bekommen dieselben Einheiten, spiegelbildlich
                 * aufgestellt — gewürfelt, aber gerecht. An heisst: Jede Seite
                 * zieht für sich, wie in v0.49 und v0.50.
                 */
                armeeUnterschiedlich: false,

                /* Muss sich das Team über einen Zug einig werden? */
                einigkeit: false
            },

            /*
             * Der Vorschlag, über den gerade abgestimmt wird (nur bei
             * `einigkeit`). Er trägt entweder einen Zug oder eine Fähigkeit:
             *
             *   { art: "zug", von, nach, umwandlung, wer, name, zugZaehler,
             *     stimmen: [ids], frist: <Zeitpunkt in ms> }
             *   { art: "faehigkeit", faehigkeit, zielFeld, … }
             */
            vorschlag: null,

            /*
             * Wie oft jemand eine Abstimmung hat verstreichen lassen. Daraus
             * folgt die Frist beim nächsten Mal — siehe FRIST_SEKUNDEN.
             */
            versaeumt: {},

            verlauf: []
        };

        /*
         * Die Zufallsarmee hat keine feste Aufstellung — sie wird gerechnet,
         * aus der Partie-Kennung. Hier greift nur die alte SPIELART; der HAKEN
         * steht erst nach `SCHACH_TAFEL.partieAnlegen` fest, das ruft
         * `armeeAufstellen` deshalb noch einmal (seit v0.51).
         */
        return SCHACH_RUNDE.armeeAufstellen(SCHACH_RUNDE.kreuzAufstellen(runde));
    },

    /*
     * Stellt die Zufallsarmee auf, wenn diese Partie sie hat. Sonst bleibt die
     * Runde, wie sie ist. Aufgerufen wird das an drei Stellen — beim Anlegen
     * einer leeren Runde, nach dem Setzen der Regeln und bei einer neuen Partie
     * in derselben Runde.
     *
     * `saatZusatz` unterscheidet die zweite Partie von der ersten; ohne ihn
     * käme dieselbe Aufstellung noch einmal. Zweimal mit demselben Zusatz
     * gerufen ergibt dasselbe Brett — das Rechnen ist absichtlich wiederholbar.
     */
    armeeAufstellen(runde, saatZusatz) {
        /*
         * HIER NICHT `armeeAn` FRAGEN. Die Frage normalisiert, und
         * `normalisieren` baut sich eine leere Runde — die wiederum hier
         * landet. Das wäre eine Endlosschleife. An dieser Stelle liegt die
         * Runde ohnehin schon vollständig vor, also wird direkt gelesen.
         */
        const gehoertDazu = (runde.regeln && runde.regeln.zufallsArmee === true)
            || !!SCHACH_VARIANTEN.holen(runde.variante).zufallsArmee;

        if (!gehoertDazu) {
            return runde;
        }

        runde.stand = SCHACH_RUNDE._armeeStand(
            runde.stand,
            (runde.id || "partie") + (saatZusatz || ""),
            runde.regeln.armeeUnterschiedlich === true);

        return runde;
    },

    /*
     * DAS KREUZ-BRETT HERRICHTEN (seit v0.63, Wunsch #22).
     *
     * Zwei Dinge, die keine Zeichenkette ausdrücken kann:
     *
     *   1. DIE TOTEN ECKEN. Vier 2-mal-2-Blöcke gehören nicht zum Brett. Sie
     *      werden als RISSE in den Stand geschrieben — dieselbe Sperre, die
     *      das Erdbeben seit v0.54 erzeugt. Damit gilt sie überall, ohne dass
     *      irgendeine Regel etwas von „Kreuz" wissen muss: `SCHACH.gesperrt`
     *      beantwortet die Frage seit jeher an einer Stelle.
     *
     *   2. WER WELCHEN FLÜGEL BEKOMMT. Gewürfelt wird es nicht — gerechnet,
     *      aus der Partie-Kennung (eiserne Regel: `Math.random()` hat im
     *      Modell nichts zu suchen). Jedes Gerät kommt damit auf dasselbe
     *      Brett, und ein Test kann es nachrechnen.
     *
     * WARUM NUR DIE FLÜGEL GETAUSCHT WERDEN und nicht auch oben und unten:
     * Ein Bauer zieht in Richtung seiner FARBE. Stünde Weiss oben, marschierten
     * seine Bauern vom Gegner weg. Front und Farbe hängen also zusammen; frei
     * ist allein die Frage, wer links und wer rechts steht. Steht sie im
     * Kommentar der Spielart ebenfalls (`SCHACH_VARIANTEN.KREUZ`).
     *
     * Der Aufruf steht neben `armeeAufstellen` und läuft VOR ihm: Ist der
     * Haken Zufallsarmee gesetzt, würfelt sie die Figuren anschliessend neu —
     * auf denselben Feldern, und die Risse bleiben stehen.
     */
    kreuzAufstellen(runde, saatZusatz) {
        const variante = SCHACH_VARIANTEN.holen(runde.variante);

        if (!variante.kreuz) {
            return runde;
        }

        const kante = variante.breite;
        const rand = SCHACH_VARIANTEN.KREUZ.rand;
        const mitte = kante - 2 * rand;
        const saat = (runde.id || "partie") + (saatZusatz || "") + "|kreuz|seiten";

        /*
         * WER BEKOMMT WELCHES PAAR? Die Teams stehen sich gegenüber: ein Team
         * oben und unten, das andere links und rechts. Gewürfelt wird nicht —
         * gerechnet, aus der Partie-Kennung (eiserne Regel: `Math.random()`
         * hat im Modell nichts zu suchen). Jedes Gerät kommt damit auf
         * dasselbe Brett, und ein Test kann es nachrechnen.
         *
         * Die Kennung steht VORNE in der Saat, siehe die Regel zu
         * `_zufallsWert`.
         */
        const senkrechtIstWeiss = SCHACH_RUNDE._zufallsWert(saat) < 0.5;

        /* Die Teams stehen sich GEGENÜBER: ein PAAR je Team, nicht eine Seite.
           Wer senkrecht steht, bekommt oben und unten; das andere Team die
           beiden Flügel. */
        let weisseSeiten = senkrechtIstWeiss
            ? ["oben", "unten"]
            : ["links", "rechts"];

        let schwarzeSeiten = senkrechtIstWeiss
            ? ["links", "rechts"]
            : ["oben", "unten"];

        /*
         * NUR EINE ARMEE JE TEAM (seit v0.72, Wunsch K3).
         *
         * Dann wird nicht das Paar gezogen, sondern die eine STARTSEITE von
         * Weiss; Schwarz bekommt die gegenüberliegende, damit die Teams sich
         * ansehen. Die beiden übrigen Streifen bleiben leer und sind der
         * Umweg, der diese Bretter von einem gewöhnlichen unterscheidet.
         *
         * Gezogen wird auch hier gerechnet, aus derselben Saat mit anderem
         * Zusatz — die Kennung steht vorne (Regel zu `_zufallsWert`).
         */
        if (variante.kreuzEinzeln) {
            const seiten = SCHACH_VARIANTEN.KREUZ.seiten;
            const stelle = Math.floor(
                SCHACH_RUNDE._zufallsWert(saat + "|einzeln") * seiten.length);

            const startWeiss = seiten[Math.min(stelle, seiten.length - 1)];

            weisseSeiten = [startWeiss];
            schwarzeSeiten = [SCHACH.SEITEN[startWeiss].gegen];
        }

        const zeichen = [];
        for (let feld = 0; feld < kante * kante; feld++) {
            zeichen.push(".");
        }

        /*
         * VIER VOLLE ARMEEN (seit v0.65). Jede der vier Seiten bekommt
         * Grundreihe plus Bauernreihe — beim 12er-Kreuz je 16 Einheiten.
         * Jeder Bauer merkt sich dabei, von WELCHER Seite er kommt; daran
         * hängt, wohin er läuft (`SCHACH.bauernSeite`).
         */
        const bauernSeiten = [];

        for (const eintrag of SCHACH_VARIANTEN.kreuzFelder(mitte)) {
            const istWeiss = (weisseSeiten.indexOf(eintrag.seite) !== -1);
            const istSchwarz = (schwarzeSeiten.indexOf(eintrag.seite) !== -1);

            /* Mit nur einer Armee je Team gehören zwei Seiten niemandem —
               sie bleiben leer. */
            if (!istWeiss && !istSchwarz) {
                continue;
            }

            zeichen[eintrag.feld] = istWeiss
                ? eintrag.figur
                : eintrag.figur.toLowerCase();

            if (eintrag.istBauer) {
                bauernSeiten.push({ feld: eintrag.feld, seite: eintrag.seite });
            }
        }

        /*
         * ZWEI ARMEEN JE TEAM HEISST ZWEI KÖNIGE JE TEAM — und damit zwei
         * Leben, dieselbe Regel wie bei der Zufallsarmee und beim Doppelbrett.
         * Den ersten König schlägt der Gegner wie jede Figur, beim letzten
         * gelten wieder Schach und Matt. Ohne diesen Schalter wäre Schachmatt
         * mit zwei Königen gar nicht eindeutig (eiserne Regel).
         *
         * Mit nur EINER Armee je Team (seit v0.72) gibt es auch nur einen
         * König je Team — dann gelten Schach und Matt von Anfang an, und der
         * Schalter bleibt aus.
         */
        runde.stand = Object.assign({}, runde.stand, {
            brett: zeichen.join(""),
            bauernSeiten: bauernSeiten,
            koenigeAlsLeben: !variante.kreuzEinzeln,
            risse: SCHACH_VARIANTEN.kreuzEcken(variante),

            /*
             * WELCHE SEITEN WEM GEHÖREN, WIRD FESTGEHALTEN (seit v0.72).
             *
             * Der Bildschirm dreht die Ansicht danach (K4). Er könnte es aus
             * den Bauern ablesen — aber nur, solange welche stehen, und die
             * Ansicht darf sich nicht drehen, weil der letzte Bauer gefallen
             * ist. Hier ist der eine Ort, an dem die Antwort entsteht.
             */
            startSeiten: {
                weiss: weisseSeiten.slice(),
                schwarz: schwarzeSeiten.slice()
            }
        });

        return runde;
    },

    /* ---------------------------------------------------------------- *
     * Die Zufallsarmee (seit v0.49)
     *
     * Die Zahlen stehen in `SCHACH_VARIANTEN.ARMEE`; hier steht, wie daraus
     * ein Brett wird. Gerechnet, nicht gewürfelt — dieselbe eiserne Regel wie
     * bei den Würfeln: `Math.random()` hat im Modell nichts zu suchen. Aus der
     * Partie-Kennung rechnet jedes Gerät dasselbe Brett aus, und der Test kann
     * es nachrechnen.
     * ---------------------------------------------------------------- */

    /*
     * Gilt in dieser Partie die Zufallsarmee? (seit v0.51)
     *
     * Zwei Quellen: der HAKEN der Partie (der neue Weg, gilt für jede Spielart)
     * und die alte Spielart „Zufallsarmee", die für laufende Partien im Katalog
     * bleibt. Gefragt wird an dieser einen Stelle, damit nicht an drei Orten
     * dieselbe Oder-Verknüpfung steht.
     */
    armeeAn(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        return stand.regeln.zufallsArmee === true
            || !!SCHACH_RUNDE.varianteVon(stand).zufallsArmee;
    },

    /*
     * Die Felder, auf denen eine Seite aufgestellt wird: ihre beiden
     * Grundreihen, mittig, mit freiem Rand links und rechts. Die hintere Reihe
     * zuerst — dort landen die zuerst gezogenen Figuren.
     *
     * Wie breit die Armee steht, rechnet `SCHACH_VARIANTEN.armeeSpalten` aus
     * der Spielart (seit v0.51) — auf dem klassischen Brett sind das vier
     * Spalten mit je zwei freien daneben, auf dem Doppelbrett acht mit je vier.
     */
    _armeeFelder(variante, farbe) {
        const breite = variante.breite;
        const hoehe = variante.hoehe;
        const platz = SCHACH_VARIANTEN.armeeSpalten(variante);
        const reihen = (farbe === SCHACH.WEISS) ? [hoehe - 1, hoehe - 2] : [0, 1];
        const felder = [];

        for (const reihe of reihen) {
            for (let schritt = 0; schritt < platz.spalten; schritt++) {
                felder.push(reihe * breite + platz.rand + schritt);
            }
        }

        return felder;
    },

    /*
     * Die Figuren einer Seite, als Liste von Arten in Grossbuchstaben.
     *
     * Erst der König (selten zwei), dann wird aufgefüllt, dann gemischt — das
     * Mischen ist wichtig: Ohne es stünde der König immer auf demselben Feld,
     * und die Bauern immer vorne.
     */
    /*
     * DIE ZÄHLENDE STELLE GEHÖRT AN DEN ANFANG DER SAAT (seit v0.49.1).
     *
     * `_zufallsWert` ist FNV-1a: Jedes Zeichen wird verodert und dann mit einer
     * Primzahl multipliziert. Ein Unterschied im LETZTEN Zeichen erlebt danach
     * genau eine Multiplikation — er verschiebt das Ergebnis um rund 0,4
     * Prozent und sonst nichts. Zwei Saaten, die sich nur in der letzten Ziffer
     * unterscheiden, liefern damit praktisch DENSELBEN Wert.
     *
     * Genau das ist beim Bau von v0.49 passiert: Die sieben Ziehungen einer
     * Seite hiessen `…|figur|1` bis `…|figur|7` und lagen alle innerhalb von
     * zwei Prozent. Jede Seite bekam siebenmal fast dieselbe Figur — sieben
     * Springer, sieben Türme —, und der Zufall der Spielart war keiner.
     *
     * Steht die Zahl vorne, laufen alle übrigen Zeichen als Mischschritte
     * hinterher, und die Werte streuen wie erwartet. Wer hier eine weitere
     * gezählte Ziehung ergänzt, hält sich daran.
     */
    _armeeSaat(stelle, was, basis) {
        return stelle + "|" + was + "|" + basis;
    },

    _armeeFiguren(id, farbe, variante, getrennt) {
        const regel = SCHACH_VARIANTEN.ARMEE;
        const anzahl = SCHACH_VARIANTEN.armeeAnzahl(variante);

        /*
         * DIESELBE ARMEE FÜR BEIDE, WENN NICHT ANDERS GEWÜNSCHT (seit v0.51).
         *
         * Steckt die Farbe in der Saat, zieht jede Seite für sich — dann kann
         * eine zwei Damen bekommen und die andere sieben Bauern. Ohne die Farbe
         * fällt für beide dieselbe Ziehung, und weil `_armeeFelder` die Felder
         * spiegelbildlich liefert, steht am Ende eine symmetrische Stellung:
         * gewürfelt, aber gerecht. Das ist die Vorgabe; wer die Schieflage
         * will, hakt „Beide Seiten getrennt würfeln" an.
         */
        const basis = (id || "partie") + "|armee" + (getrennt ? "|" + farbe : "");

        const zweiKoenige = (SCHACH_RUNDE._zufallsWert(basis + "|koenige") * 100)
            < regel.zweiKoenige;

        const arten = zweiKoenige ? ["K", "K"] : ["K"];
        let damen = 0;

        while (arten.length < anzahl) {
            let art = SCHACH_VARIANTEN.armeeFigurZiehen(SCHACH_RUNDE._zufallsWert(
                SCHACH_RUNDE._armeeSaat(arten.length, "figur", basis)));

            /* Über die Höchstzahl hinaus gezogene Damen werden Türme. */
            if (art === "D" && damen >= regel.hoechstensDamen) {
                art = "T";
            }
            if (art === "D") {
                damen++;
            }

            arten.push(art);
        }

        /* Mischen nach Fisher-Yates, mit gerechneten Werten. */
        for (let stelle = arten.length - 1; stelle > 0; stelle--) {
            const ziel = Math.floor(SCHACH_RUNDE._zufallsWert(
                SCHACH_RUNDE._armeeSaat(stelle, "mischen", basis)) * (stelle + 1));
            const merken = arten[stelle];
            arten[stelle] = arten[ziel];
            arten[ziel] = merken;
        }

        return arten;
    },

    /* Ein Brett-Stand mit gewürfelten Armeen auf beiden Seiten. */
    _armeeStand(stand, id, getrennt) {
        const variante = SCHACH.varianteVon(stand);
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);

        const zeichen = [];
        for (let feld = 0; feld < breite * hoehe; feld++) {
            zeichen.push(".");
        }

        for (const farbe of [SCHACH.WEISS, SCHACH.SCHWARZ]) {
            const felder = SCHACH_RUNDE._armeeFelder(variante, farbe);
            const arten = SCHACH_RUNDE._armeeFiguren(id, farbe, variante, getrennt);
            const anzahl = Math.min(felder.length, arten.length);

            for (let stelle = 0; stelle < anzahl; stelle++) {
                zeichen[felder[stelle]] = (farbe === SCHACH.WEISS)
                    ? arten[stelle] : arten[stelle].toLowerCase();
            }
        }

        /* Die zwei Leben gehören zur Zufallsarmee und damit in den Stand —
           `schach.js` kennt die Regeln der Partie nicht. */
        return Object.assign({}, stand, {
            brett: zeichen.join(""),
            koenigeAlsLeben: true
        });
    },

    normalisieren(roh) {
        /* Die Spielart steht an der Partie; ältere Stände tragen sie höchstens
           im Brett-Stand. Ohne Angabe gilt das klassische Brett. */
        let varianteId = SCHACH_VARIANTEN.STANDARD;
        if (roh && typeof roh.variante === "string" && SCHACH_VARIANTEN.gibtEs(roh.variante)) {
            varianteId = roh.variante;
        } else if (roh && roh.stand && typeof roh.stand.variante === "string"
            && SCHACH_VARIANTEN.gibtEs(roh.stand.variante)) {
            varianteId = roh.stand.variante;
        }

        const runde = SCHACH_RUNDE.leereRunde(undefined, varianteId);

        if (!roh || typeof roh !== "object") {
            return runde;
        }

        if (typeof roh.id === "string") {
            runde.id = roh.id;
        }
        if (typeof roh.titel === "string") {
            runde.titel = roh.titel;
        }
        if (typeof roh.erstelltAm === "number" && isFinite(roh.erstelltAm)) {
            runde.erstelltAm = roh.erstelltAm;
        }
        if (typeof roh.gestartetAm === "number" && isFinite(roh.gestartetAm)
            && roh.gestartetAm >= 0) {
            runde.gestartetAm = roh.gestartetAm;
        }
        if (typeof roh.geaendertAm === "number" && isFinite(roh.geaendertAm)) {
            runde.geaendertAm = roh.geaendertAm;
        }

        /* Der Brett-Stand bekommt die Spielart der Partie mit, damit die Maße
           auch dann stimmen, wenn nur die Partie sie kennt. */
        runde.stand = SCHACH.standNormalisieren(
            Object.assign({}, roh.stand, { variante: varianteId })
        );
        runde.laeuft = (roh.laeuft === true);

        if (["weiss", "schwarz", "remis"].indexOf(roh.ergebnis) !== -1) {
            runde.ergebnis = roh.ergebnis;
        }
        if (typeof roh.zugZaehler === "number" && isFinite(roh.zugZaehler) && roh.zugZaehler >= 0) {
            runde.zugZaehler = Math.floor(roh.zugZaehler);
        }

        for (const farbe of ["weiss", "schwarz"]) {
            const liste = (roh.teams && Array.isArray(roh.teams[farbe])) ? roh.teams[farbe] : [];
            runde.teams[farbe] = liste
                .filter((id) => typeof id === "string" && id !== "")
                .filter((id, stelle, alle) => alle.indexOf(id) === stelle);

            runde.bereit[farbe] = !!(roh.bereit && roh.bereit[farbe] === true);

            const koennen = (roh.faehigkeiten && Array.isArray(roh.faehigkeiten[farbe]))
                ? roh.faehigkeiten[farbe]
                : [];
            runde.faehigkeiten[farbe] = koennen
                .filter((art) => typeof art === "string" && SCHACH_VARIANTEN.FAEHIGKEITEN[art]);
        }

        if (Array.isArray(roh.bonusGesammelt)) {
            runde.bonusGesammelt = roh.bonusGesammelt
                .filter((feld) => Number.isInteger(feld) && feld >= 0)
                .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle);
        }

        for (const farbe of ["weiss", "schwarz"]) {
            const liste = (roh.verloren && Array.isArray(roh.verloren[farbe]))
                ? roh.verloren[farbe] : [];
            runde.verloren[farbe] = liste
                .filter((art) => typeof art === "string" && SCHACH.artName(art) !== "");

            const gefallene = (roh.gefallen && Array.isArray(roh.gefallen[farbe]))
                ? roh.gefallen[farbe] : [];
            runde.gefallen[farbe] = gefallene
                .filter((eintrag) => eintrag && typeof eintrag.art === "string"
                    && SCHACH.artName(eintrag.art) !== ""
                    && Number.isInteger(eintrag.feld) && eintrag.feld >= 0)
                .map((eintrag) => ({ art: eintrag.art, feld: eintrag.feld }));
        }

        if (roh.regeln && typeof roh.regeln === "object") {
            if (roh.regeln.faehigkeiten === true || roh.regeln.faehigkeiten === false) {
                runde.regeln.faehigkeiten = roh.regeln.faehigkeiten;
            }
            runde.regeln.seltenheitZeigen = (roh.regeln.seltenheitZeigen !== false);

            /* `=== true` und nicht `!== false`: Ohne Angabe ist der Haken AUS.
               Auch Partien von vor v0.49 zeigen das Unglück damit nicht mehr —
               das ist gewollt, es ist reine Anzeige und ändert keine Regel. */
            runde.regeln.pechZeigen = (roh.regeln.pechZeigen === true);
            runde.regeln.regen = (roh.regeln.regen === true);

            /* Wie steil der Regen ansteigt (seit v0.59). Alles ausserhalb von
               1 bis 5 — und jede Partie von vorher — fällt auf die Vorgabe
               zurück und spielt damit genau wie bisher. */
            runde.regeln.regenStufe =
                (Number.isInteger(roh.regeln.regenStufe)
                    && roh.regeln.regenStufe >= 1 && roh.regeln.regenStufe <= 5)
                    ? roh.regeln.regenStufe
                    : SCHACH_VARIANTEN.REGEN.STUFE_VORGABE;

            /*
             * DIE VIER STUFEN (seit v0.71). Fehlt der Eintrag, stammt die
             * Partie aus der Zeit der zwei Schalter darüber — dann wird er
             * daraus abgeleitet, und die Partie spielt weiter wie bisher.
             * Deshalb steht diese Zeile NACH den beiden alten.
             */
            const bekannteMenge = SCHACH_VARIANTEN.LOOTBOX_MENGEN.some(
                (eintrag) => eintrag.id === roh.regeln.lootboxMenge);

            runde.regeln.lootboxMenge = bekannteMenge
                ? roh.regeln.lootboxMenge
                : SCHACH_VARIANTEN.mengeAusAltem(
                    runde.regeln.regen, runde.regeln.regenStufe);

            runde.regeln.zufallsArmee = (roh.regeln.zufallsArmee === true);
            runde.regeln.armeeUnterschiedlich = (roh.regeln.armeeUnterschiedlich === true);

            runde.regeln.einigkeit = (roh.regeln.einigkeit === true);
        }

        if (roh.vorschlag && typeof roh.vorschlag === "object") {
            const roher = roh.vorschlag;
            const stimmen = Array.isArray(roher.stimmen) ? roher.stimmen : [];
            const istFaehigkeit = (roher.art === "faehigkeit")
                && !!SCHACH_VARIANTEN.FAEHIGKEITEN[roher.faehigkeit];

            if (istFaehigkeit || (Number.isInteger(roher.von) && Number.isInteger(roher.nach))) {
                runde.vorschlag = {
                    art: istFaehigkeit ? "faehigkeit" : "zug",
                    faehigkeit: istFaehigkeit ? roher.faehigkeit : "",
                    zielFeld: Number.isInteger(roher.zielFeld) ? roher.zielFeld : -1,
                    von: Number.isInteger(roher.von) ? roher.von : -1,
                    nach: Number.isInteger(roher.nach) ? roher.nach : -1,
                    umwandlung: (typeof roher.umwandlung === "string") ? roher.umwandlung : "D",
                    wer: (typeof roher.wer === "string") ? roher.wer : "",
                    name: (typeof roher.name === "string") ? roher.name : "",
                    zugZaehler: Number.isInteger(roher.zugZaehler) ? roher.zugZaehler : 0,
                    frist: (typeof roher.frist === "number" && isFinite(roher.frist))
                        ? roher.frist : 0,
                    stimmen: stimmen
                        .filter((id) => typeof id === "string" && id !== "")
                        .filter((id, stelle, alle) => alle.indexOf(id) === stelle)
                };
            }
        }

        /* Wann welche Stufe zuletzt erschienen ist (seit v0.41). Unbekannte
           Stufen und Unsinn fallen weg — der Rest ist ein Takt-Wert. */
        if (roh.stufeZuletzt && typeof roh.stufeZuletzt === "object") {
            for (const stufe of SCHACH_VARIANTEN.STUFEN) {
                const wert = roh.stufeZuletzt[stufe.id];
                if (Number.isInteger(wert) && wert >= 0) {
                    runde.stufeZuletzt[stufe.id] = wert;
                }
            }
        }

        if (roh.versaeumt && typeof roh.versaeumt === "object") {
            for (const id of Object.keys(roh.versaeumt)) {
                const wert = roh.versaeumt[id];
                if (Number.isInteger(wert) && wert > 0) {
                    runde.versaeumt[id] = wert;
                }
            }
        }

        /*
         * Die Würfel auf dem Brett. Eine Partie aus Fassung 1 kennt sie nicht:
         * Dort lagen vier feste Felder, von denen die eingesammelten in
         * `bonusGesammelt` stehen. Daraus wird hier einmalig die neue Liste
         * gebaut — angefangene Partien laufen damit unverändert weiter.
         */
        if (roh.bonusFassung === SCHACH_RUNDE.BONUS_FASSUNG) {
            /*
             * Ein Würfel trägt entweder eine STUFE (seit v3.6: was drin ist,
             * entscheidet sich erst beim Einsammeln — nur so kann der eigene
             * Vorrat die Ziehung dämpfen) oder eine feste ART (Würfel, die
             * schon vor v3.6 auf dem Brett lagen, und alle Unglückswürfel).
             * Beides bleibt gültig; der additive Vertrag verlangt genau das.
             */
            const liste = Array.isArray(roh.bonus) ? roh.bonus : [];
            runde.bonus = liste
                .filter((eintrag) => eintrag && Number.isInteger(eintrag.feld)
                    && eintrag.feld >= 0
                    && (eintrag.pech
                        ? SCHACH_VARIANTEN.PECH[eintrag.art]
                        : (SCHACH_VARIANTEN.FAEHIGKEITEN[eintrag.art]
                            || SCHACH_VARIANTEN.STUFEN.some(
                                (stufe) => stufe.id === eintrag.stufe))))
                .map((eintrag) => {
                    if (eintrag.pech) {
                        return { feld: eintrag.feld, art: eintrag.art, pech: true };
                    }
                    if (SCHACH_VARIANTEN.FAEHIGKEITEN[eintrag.art]) {
                        return { feld: eintrag.feld, art: eintrag.art };
                    }
                    return { feld: eintrag.feld, art: "", stufe: eintrag.stufe };
                })
                .filter((eintrag, stelle, alle) =>
                    alle.findIndex((anderer) => anderer.feld === eintrag.feld) === stelle);
        } else {
            const variante = SCHACH_VARIANTEN.holen(varianteId);
            runde.bonus = variante.bonusFelder
                .filter((eintrag) => runde.bonusGesammelt.indexOf(eintrag.feld) === -1)
                .map((eintrag) => ({ feld: eintrag.feld, art: eintrag.art }));
        }

        if (Array.isArray(roh.verlauf)) {
            for (const eintrag of roh.verlauf) {
                if (eintrag && typeof eintrag.text === "string") {
                    runde.verlauf.push({
                        text: eintrag.text,
                        wer: (typeof eintrag.wer === "string") ? eintrag.wer : "",
                        farbe: (eintrag.farbe === "schwarz") ? "schwarz" : "weiss",
                        von: Number.isInteger(eintrag.von) ? eintrag.von : -1,
                        nach: Number.isInteger(eintrag.nach) ? eintrag.nach : -1,
                        /* Art der Fähigkeit und die betroffenen Felder — daraus
                           zeichnet der Bildschirm die Animation, und zwar auf
                           JEDEM Gerät. */
                        wirkung: (typeof eintrag.wirkung === "string") ? eintrag.wirkung : "",
                        felder: Array.isArray(eintrag.felder)
                            ? eintrag.felder.filter((feld) => Number.isInteger(feld) && feld >= 0)
                            : [],
                        /* Alle Bewegungen dieses Eintrags — daraus zeichnet der
                           Bildschirm die Pfeile. Ein Zug hat einen Weg, ein
                           Erdbeben mehrere. */
                        wege: Array.isArray(eintrag.wege)
                            ? eintrag.wege
                                .filter((weg) => weg && Number.isInteger(weg.von)
                                    && Number.isInteger(weg.nach) && weg.von >= 0 && weg.nach >= 0)
                                .map((weg) => ({ von: weg.von, nach: weg.nach }))
                            : []
                    });
                }
            }
        }

        return runde;
    },

    kopieren(runde) {
        return SCHACH_RUNDE.normalisieren(runde);
    },

    /* Die Spielart dieser Partie. */
    varianteVon(runde) {
        return SCHACH_VARIANTEN.holen(runde ? runde.variante : "");
    },

    /* ---------------------------------------------------------------- *
     * Bonusfelder und Fähigkeiten
     * ---------------------------------------------------------------- */

    /*
     * Was eine Figurenart wert ist — für die Bilanz unter dem Brett.
     * Die üblichen Schachwerte; der König zählt nicht mit, er kann nicht
     * verloren gehen (ausser auf dem Doppelbrett, wo die Partie dann ohnehin
     * vorbei ist).
     */
    FIGUR_WERT: { B: 1, S: 3, L: 3, T: 5, D: 9, K: 0 },

    /*
     * Bilanz einer Seite: was sie erbeutet hat, was sie verloren hat, und die
     * Differenz nach Figurenwert.
     */
    bilanz(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const gegner = SCHACH.gegner(farbe);

        /* Was der Gegner verloren hat, hat diese Seite geschlagen. */
        const geschlagen = stand.verloren[gegner] || [];
        const verloren = stand.verloren[farbe] || [];

        const wert = (liste) => liste.reduce(
            (summe, art) => summe + (SCHACH_RUNDE.FIGUR_WERT[art] || 0), 0);

        return {
            geschlagen: geschlagen.slice(),
            verloren: verloren.slice(),
            punkte: wert(geschlagen) - wert(verloren)
        };
    },

    /* Wie viele Wendepunkte die Rückschau höchstens zeigt (seit v0.61). */
    RUECKSCHAU_HOECHSTENS: 6,

    /*
     * DIE RÜCKSCHAU (seit v0.61, Wunsch #7: „Recap einbauen vor dem Gewinnen
     * oder Verlieren, dass man sieht, warum man verloren hat").
     *
     * Sie beantwortet drei Fragen, und zwar HIER im Modell — der Bildschirm
     * zeigt nur an. Wer entscheidet, was ein Wendepunkt war, entscheidet über
     * die Erzählung der Partie, und das ist eine Regel wie jede andere.
     *
     *   1. WIE ging es aus? Nicht aus einem gemerkten Vermerk, sondern aus der
     *      Schlussstellung: `SCHACH.lage` sagt Matt oder Patt. Sagt sie nichts
     *      davon, obwohl ein Ergebnis feststeht, hat jemand aufgegeben.
     *   2. WAS hat es gekostet? Der Figurenwert dessen, was jede Seite verloren
     *      hat — dieselbe Rechnung wie bei der Beute (`FIGUR_WERT`).
     *   3. WAS gab den Ausschlag? Die Einträge des Verlaufs, die etwas
     *      Aussergewöhnliches waren: eingesetzte Fähigkeiten und
     *      Unglückswürfel. Gewöhnliche Züge stehen nicht darin — sie sind der
     *      Verlauf, nicht die Wendung.
     *
     * Warum nur die LETZTEN paar: Der Verlauf ist ohnehin gekürzt
     * (`VERLAUF_LAENGE`), und was am Ende passierte, hat die Partie
     * entschieden. Ausgegeben wird trotzdem in der Reihenfolge, in der es
     * geschah — eine Rückschau, die rückwärts erzählt, versteht niemand.
     */
    rueckschau(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const lage = SCHACH.lage(stand.stand);

        const ausgang = (!stand.ergebnis)
            ? "offen"
            : ((stand.ergebnis === "remis")
                ? "remis"
                : ((stand.ergebnis === farbe) ? "sieg" : "niederlage"));

        let ende = "Die Partie läuft noch.";
        if (lage.art === "matt") {
            ende = "Schachmatt — der König konnte dem Angriff nicht mehr entkommen.";
        } else if (lage.art === "patt") {
            ende = "Patt — die Seite am Zug hatte keinen einzigen erlaubten Zug mehr.";
        } else if (lage.art === "remis") {
            ende = lage.text || "Unentschieden.";
        } else if (stand.ergebnis) {
            ende = "Aufgegeben — die Partie wurde vorzeitig beendet.";
        }

        const wendepunkte = stand.verlauf
            .filter((eintrag) => eintrag.wirkung && eintrag.wirkung !== "eingesammelt")
            .slice(-SCHACH_RUNDE.RUECKSCHAU_HOECHSTENS)
            .map((eintrag) => ({
                farbe: eintrag.farbe,
                eigen: (eintrag.farbe === farbe),
                unglueck: (eintrag.wirkung === "pech"),
                text: eintrag.text
            }));

        return {
            ausgang: ausgang,
            ende: ende,
            verloren: {
                eigen: (stand.verloren[farbe] || []).slice(),
                gegner: (stand.verloren[SCHACH.gegner(farbe)] || []).slice()
            },
            wert: {
                /* Was die eigene Seite an Material eingebüsst hat — und was
                   der Gegner. `beuteWert` zählt aus der Sicht dessen, der
                   geschlagen HAT, deshalb hier über Kreuz. */
                eigen: SCHACH_RUNDE.beuteWert(stand, SCHACH.gegner(farbe)),
                gegner: SCHACH_RUNDE.beuteWert(stand, farbe)
            },
            wendepunkte: wendepunkte
        };
    },

    /* Der Figurenwert dessen, was eine Seite geschlagen hat. */
    beuteWert(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const geschlagen = stand.verloren[SCHACH.gegner(farbe)] || [];

        return geschlagen.reduce(
            (summe, art) => summe + (SCHACH_RUNDE.FIGUR_WERT[art] || 0), 0);
    },

    /* Welche Würfel liegen gerade auf dem Brett? */
    offeneBonusFelder(runde) {
        return SCHACH_RUNDE.normalisieren(runde).bonus;
    },

    /*
     * Ein Zufallswert zwischen 0 und 1, GERECHNET statt gewürfelt.
     *
     * Das ist die wichtigste Festlegung an den Fähigkeiten: Alle Geräte sehen
     * denselben Stand und müssen deshalb dieselben Würfel sehen. Mit
     * `Math.random()` bekäme jedes Gerät ein anderes Brett, und der erste
     * Schreibvorgang gewönne — dieselbe Falle wie beim gegenseitigen
     * Überschreiben in v0.8. Aus Partie-Kennung und Zugzähler rechnet dagegen
     * jeder dasselbe aus, ohne sich abzustimmen, und die Tests bleiben
     * aussagekräftig, weil das Ergebnis vorhersagbar ist.
     *
     * Verfahren: FNV-1a, eine gängige einfache Streufunktion.
     *
     * ------------------------------------------------------------------
     * WAS SICH UNTERSCHEIDET, GEHÖRT AN DEN ANFANG DER SAAT (seit v0.49.1).
     *
     * FNV-1a verodert jedes Zeichen und multipliziert dann mit einer Primzahl.
     * Ein Unterschied im LETZTEN Zeichen erlebt danach genau eine
     * Multiplikation — er verschiebt das Ergebnis um rund 0,4 Prozent und
     * sonst nichts. Zwei Saaten, die sich nur am Ende unterscheiden, liefern
     * damit praktisch DENSELBEN Wert.
     *
     * Wer also über etwas zählt (Feldnummer, laufende Nummer), schreibt die
     * Zahl nach VORNE: `feld + "|glas|" + id`, nicht `id + "|glas|" + feld`.
     * Dann laufen alle übrigen Zeichen als Mischschritte hinterher.
     *
     * Zweimal ist genau das schiefgegangen, beide gefunden am 2026-08-08:
     * Unter dem vollen Glas trugen die Felder 0 bis 9 dasselbe Trugbild, und
     * die Zufallsarmee stellte siebenmal fast dieselbe Figur auf. Die Funktion
     * hier ist in Ordnung — die Saat war es nicht.
     * ------------------------------------------------------------------
     */
    _zufallsWert(text) {
        let wert = 2166136261;

        for (let stelle = 0; stelle < text.length; stelle++) {
            wert ^= text.charCodeAt(stelle);
            wert = Math.imul(wert, 16777619);
        }

        return (wert >>> 0) / 4294967296;
    },

    /*
     * Lässt bei Bedarf einen neuen Würfel erscheinen. Wird nach jedem Zug
     * gerufen und ändert die übergebene Runde.
     */
    /*
     * Erscheinen in dieser Partie Würfel? Der Schalter der Partie geht vor;
     * ohne Angabe entscheidet die Spielart wie vor v2.5.
     */
    faehigkeitenAn(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (stand.regeln.faehigkeiten === true || stand.regeln.faehigkeiten === false) {
            return stand.regeln.faehigkeiten;
        }
        return !!SCHACH_RUNDE.varianteVon(stand).faehigkeiten;
    },

    /*
     * Regnet es in dieser Partie Glücksboxen? (seit v0.50)
     *
     * Nur mit Würfeln überhaupt — ein Regen ohne Würfel wäre keiner. Deshalb
     * wird hier BEIDES gefragt und nicht nur der eigene Haken; im Bildschirm
     * hängt er sichtbar unter dem Würfel-Haken.
     */
    regenAn(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        return SCHACH_RUNDE.lootboxMenge(stand) !== "wenig"
            && SCHACH_RUNDE.faehigkeitenAn(stand);
    },

    /* Wie steil der Regen in dieser Partie ansteigt (1 bis 5, seit v0.59). */
    regenStufe(runde) {
        return SCHACH_RUNDE.normalisieren(runde).regeln.regenStufe;
    },

    /*
     * WIE VIELE LOOTBOXEN DIESE PARTIE AUSWIRFT (seit v0.71): eine der vier
     * Stufen aus `SCHACH_VARIANTEN.LOOTBOX_MENGEN`. Sie steht in der Partie und
     * wird für Partien von früher aus `regen`/`regenStufe` abgeleitet (siehe
     * `normalisieren`) — hier ist sie deshalb immer eine gültige Stufe.
     */
    lootboxMenge(runde) {
        return SCHACH_RUNDE.normalisieren(runde).regeln.lootboxMenge;
    },

    /*
     * Wie schwer jede Stufe im Moment wiegt — die Abklingzeit in Zahlen.
     *
     * Gemessen wird im TAKT: Er zählt jeden Halbzug und wird nie
     * zurückgesetzt (`halbzuege` springt bei jedem Bauernzug auf 0, siehe
     * `docs\entscheidungen\entschieden.md`, „Warum `halbzuege` keine Uhr ist").
     * Die Regel selbst steht in SCHACH_VARIANTEN — hier wird nur gemessen.
     */
    _stufenGewichte(runde) {
        const abstaende = {};

        for (const stufe of SCHACH_VARIANTEN.STUFEN) {
            const zuletzt = runde.stufeZuletzt[stufe.id];
            if (Number.isInteger(zuletzt)) {
                abstaende[stufe.id] = Math.max(runde.stand.takt - zuletzt, 0);
            }
        }

        return SCHACH_VARIANTEN.stufenGewichte(abstaende);
    },

    _bonusNachziehen(runde) {
        if (!SCHACH_RUNDE.faehigkeitenAn(runde)) {
            return;
        }
        /*
         * Fähigkeiten erscheinen nur auf leeren Feldern, und nie dort, wo schon
         * eine liegt. Gezählt wird ZUERST: Im Glücksboxen-Regen hängen Chance
         * und Anzahl davon ab, wie leer das Brett gerade ist.
         */
        const belegt = runde.bonus.map((eintrag) => eintrag.feld);
        const alleFelder = SCHACH.felderVon(runde.stand);
        const freie = [];

        for (let feld = 0; feld < alleFelder; feld++) {
            if (SCHACH.figurAuf(runde.stand, feld) === "." && belegt.indexOf(feld) === -1) {
                freie.push(feld);
            }
        }

        if (freie.length === 0) {
            return;
        }

        const menge = SCHACH_RUNDE.lootboxMenge(runde);

        /*
         * DIE UNTERSTE STUFE WIRFT NUR NACH EINEM VOLLEN ZUG AUS (seit v0.71).
         *
         * `zugZaehler` zählt Halbzüge und steht hier schon auf dem Wert NACH
         * dem Zug; jeder zweite schliesst also einen vollen Zug ab. Auf den
         * drei anderen Stufen kommt wie bisher nach jedem Halbzug etwas in
         * Frage.
         */
        if (!SCHACH_VARIANTEN.mengeVon(menge).jederHalbzug
            && (runde.zugZaehler % 2) !== 0) {
            return;
        }

        /* Nach jedem Halbzug neu gewürfelt — kein fester Takt mehr, und seit
           v3.3 auch keine Höchstzahl (siehe SCHACH_VARIANTEN.BONUS_CHANCE). */
        const wuerfelt = SCHACH_RUNDE._zufallsWert(
            (runde.id || "partie") + "|" + runde.zugZaehler + "|ob") * 100;

        if (wuerfelt >= SCHACH_VARIANTEN.mengenChance(menge, freie.length, alleFelder)) {
            return;
        }

        const basis = (runde.id || "partie") + "|" + runde.zugZaehler;

        /*
         * Meist einer, manchmal zwei, sehr selten drei — und auf den drei
         * Füllstands-Stufen zusätzlich, was der Füllstand hergibt (das Grössere
         * von beidem, siehe `SCHACH_VARIANTEN.LOOTBOX_MENGEN`). Nie mehr, als
         * freie Felder da sind; das ist seit v3.3 die einzige harte Grenze.
         */
        const gewuenscht = SCHACH_VARIANTEN.mengenAnzahl(menge, freie.length, alleFelder,
            SCHACH_RUNDE._zufallsWert(basis + "|anzahl"));
        const moeglich = Math.min(gewuenscht, freie.length);

        const neue = [];

        for (let nummer = 0; nummer < moeglich; nummer++) {
            const marke = basis + "|" + nummer;
            const stelle = Math.floor(SCHACH_RUNDE._zufallsWert(marke + "|feld") * freie.length);
            const feld = freie[stelle];

            /* Ist es ein Unglückswürfel? Deutlich seltener als ein normaler. */
            const istPech = (SCHACH_RUNDE._zufallsWert(marke + "|pech") * 100)
                < SCHACH_VARIANTEN.PECH_CHANCE;

            /*
             * BEIM ERSCHEINEN STEHT NUR DIE STUFE FEST (seit v3.6).
             *
             * Was in einem Würfel steckt, entscheidet sich erst beim
             * Einsammeln — und zwar gegen den Vorrat DESSEN, der ihn
             * einsammelt. Anders ginge die Dämpfung von Wiederholungen nicht:
             * Beim Erscheinen weiss noch niemand, wer den Würfel bekommt.
             *
             * Der Unglückswürfel behält seine feste Art. Er kommt nicht in den
             * Vorrat und wiederholt sich deshalb auch nicht.
             */
            const eintrag = { feld: feld };

            if (istPech) {
                eintrag.art = SCHACH_VARIANTEN.pechZiehen(
                    SCHACH_RUNDE._zufallsWert(marke + "|pechart"));
                eintrag.pech = true;

                if (!eintrag.art) {
                    continue;
                }
            } else {
                /*
                 * DIE STUFE MIT ABKLINGZEIT (seit v0.41). Die Gewichte werden
                 * für JEDEN Würfel neu geholt: Erscheinen zwei auf einmal,
                 * drückt der erste schon die Stufe des zweiten.
                 */
                eintrag.art = "";
                eintrag.stufe = SCHACH_VARIANTEN.stufeZiehen(
                    SCHACH_RUNDE._zufallsWert(marke + "|art"),
                    SCHACH_RUNDE._stufenGewichte(runde)).stufe.id;

                runde.stufeZuletzt[eintrag.stufe] = runde.stand.takt;
            }

            freie.splice(stelle, 1);
            runde.bonus.push(eintrag);
            neue.push(eintrag);
        }

        if (neue.length === 0) {
            return;
        }

        /*
         * Im Verlauf steht NUR, wo etwas liegt — nicht was. Weder die
         * Fähigkeit noch die Tatsache, dass es ein Unglückswürfel ist: Das ist
         * die Überraschung, um die es geht.
         */
        const namen = neue.map((eintrag) => SCHACH.feldName(eintrag.feld,
            SCHACH.breiteVon(runde.stand), SCHACH.hoeheVon(runde.stand)));

        runde.verlauf.push({
            text: (neue.length === 1 ? "Eine Lootbox erscheint auf " : "Lootboxen erscheinen auf ")
                + namen.join(", "),
            wer: "",
            farbe: runde.stand.amZug,
            von: -1,
            nach: -1,
            wirkung: "erscheint",
            felder: neue.map((eintrag) => eintrag.feld)
        });
        SCHACH_RUNDE._verlaufKuerzen(runde);
    },

    /*
     * Setzt eine Fähigkeit ein. Wirkt auf den Brett-Stand und verbraucht sie.
     * Der Zugzähler steigt mit, damit zwei Geräte sich nicht gegenseitig
     * überschreiben — genau wie bei einem Zug.
     *
     * `zielFeld` wird nur von Fähigkeiten der Art "ziel" gebraucht; die
     * übrigen bekommen -1 oder gar nichts.
     *
     * `umwandlung` (seit v0.56) braucht bisher nur der Bauernschub: Erreichen
     * Bauern durch ihn die letzte Reihe, sagt sie, was aus ihnen wird. Sie
     * steht als LETZTER Parameter und ist wahlfrei — jeder Aufruf von vorher
     * bleibt damit gültig und bekommt wie bisher Damen.
     */
    faehigkeitEinsetzen(runde, spielerId, art, zielFeld, wer, zeitpunkt, umwandlung) {
        const alt = SCHACH_RUNDE.normalisieren(runde);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        if (!beschreibung) {
            return null;
        }
        if (!SCHACH_RUNDE.darfEinsetzen(alt, spielerId, art)) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const stelle = alt.faehigkeiten[farbe].indexOf(art);
        if (stelle === -1) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        const ziel = Number.isInteger(zielFeld) ? zielFeld : -1;
        let betroffen = [];
        let wege = [];
        let zusatzText = "";

        if (beschreibung.art === "zugmuster") {
            neu.stand.zusatzFarbe = farbe;
            neu.stand.zusatzMuster = beschreibung.muster;

            /* `istDerZug` (Sprung, Teleport): Man bleibt am Zug, darf aber nur
               noch nach diesem Muster ziehen — die Fähigkeit ist der Zug. */
            neu.stand.zusatzNurDieses = !!beschreibung.istDerZug;
            neu.stand.sprungAktiv = (beschreibung.muster === "springer") ? farbe : "";

        } else if (beschreibung.art === "ablauf") {
            neu.stand.extraZug = farbe;

        } else if (beschreibung.art === "sofort") {
            const wirkung = SCHACH.bauernschub(neu.stand, farbe, umwandlung);
            if (!wirkung) {
                return null;
            }
            neu.stand = wirkung.stand;
            betroffen = wirkung.felder;
            wege = wirkung.wege || [];

            /* Umgewandelte Bauern gehören in den Verlaufstext: Sie sind das,
               was man an der Stellung am wenigsten erwartet. */
            if (wirkung.umgewandelt && wirkung.umgewandelt.length > 0) {
                zusatzText = ": " + wirkung.umgewandelt.length + " mal umgewandelt";
            }

        } else if (beschreibung.art === "ziel") {
            const wirkung = SCHACH_RUNDE._zielWirkung(neu, art, farbe, ziel);
            if (!wirkung) {
                return null;
            }
            neu.stand = wirkung.stand;
            betroffen = wirkung.felder;
            wege = wirkung.wege || [];
            zusatzText = wirkung.text ? (": " + wirkung.text) : "";

        } else if (beschreibung.art === "handel") {
            /*
             * Das Angebot wird HIER neu gerechnet, nicht vom Bildschirm
             * übergeben: Sonst könnte ein Gerät mit veraltetem Stand einen
             * Tausch durchsetzen, den es so gar nicht mehr gibt. Der Bildschirm
             * fragt dasselbe ab, um es zu zeigen — die Wahrheit steht hier.
             */
            const wirkung = SCHACH_RUNDE._handelAusfuehren(neu, farbe);
            if (!wirkung) {
                return null;
            }
            neu.stand = wirkung.stand;
            betroffen = wirkung.felder;
            zusatzText = wirkung.text ? (": " + wirkung.text) : "";

        } else {
            return null;
        }

        /*
         * GESCHOBENE BAUERN NEHMEN IHRE STARTSEITE MIT (seit v0.65).
         *
         * Mehrere Fähigkeiten bewegen Figuren, ohne dass ein Zug stattfindet:
         * Nudelholz, Bauernschub, Erdbeben, Spiegel. Ihr `wege` sagt, was von
         * wo nach wo ging — genau daran wandern die Einträge entlang. Ohne das
         * bliebe der Eintrag auf dem alten Feld liegen, und der geschobene
         * Bauer fiele auf die Farbregel zurück: Auf dem Kreuz liefe er danach
         * in die falsche Richtung.
         *
         * Für jedes andere Brett ist der Aufruf wirkungslos — dort ist die
         * Liste leer.
         */
        neu.stand = SCHACH.bauernSeitenVerschieben(neu.stand, wege);

        neu.faehigkeiten[farbe].splice(stelle, 1);
        neu.zugZaehler = alt.zugZaehler + 1;

        /*
         * Manche Fähigkeiten kosten den ganzen Zug (`beendetZug`): Danach ist
         * der Gegner dran. Der Doppelzug geht vor — wer ihn eingesetzt hat,
         * behält sein Recht auf einen weiteren Zug, sonst wäre die eine
         * Fähigkeit die andere wert.
         */
        if (beschreibung.beendetZug) {
            if (neu.stand.extraZug === farbe) {
                neu.stand.extraZug = "";
            } else {
                neu.stand = SCHACH.zugAbgeben(neu.stand);
            }
        }

        /*
         * DER EIGENE KÖNIG DARF DABEI NICHT IM SCHACH BLEIBEN (seit v3.6).
         *
         * Für einen Zug gilt das seit jeher (`SCHACH.zuege` filtert es weg),
         * für Fähigkeiten galt es nicht — dabei verschieben mehrere von ihnen
         * ganze Reihen (Erdbeben, Nudelholz, Bauernschub) oder tauschen
         * Figuren aus (Händler). Zwei Fälle sind verboten:
         *
         *   1. Man stellt sich selbst ins Schach. Das darf man mit einem Zug
         *      auch nicht, und eine Fähigkeit ist kein Freibrief.
         *   2. Man steht im Schach und gibt den Zug ab, ohne es aufzulösen.
         *      Dann wäre der König beim nächsten Zug einfach weg — die Partie
         *      endete, ohne dass Schachmatt gesagt wurde.
         *
         * Wer im Schach steht, darf dagegen weiter eine Fähigkeit einsetzen,
         * die den Zug NICHT beendet: Er muss danach ja ohnehin noch aus dem
         * Schach ziehen, und genau dabei kann sie helfen.
         *
         * Auf Brettern ohne Schachbegriff (Doppelbrett) entfällt das alles.
         */
        if (!SCHACH.varianteVon(neu.stand).koenigSchlagbar) {
            const vorher = SCHACH.imSchach(alt.stand, farbe);
            const nachher = SCHACH.imSchach(neu.stand, farbe);

            if (nachher && (beschreibung.beendetZug || !vorher)) {
                return null;
            }
        }

        /*
         * WER NUR NOCH SPRINGEN DARF, MUSS AUCH SPRINGEN KÖNNEN (seit v0.48).
         *
         * `istDerZug` nimmt der Seite für diesen einen Zug ihre gewohnte
         * Gangart. Bleibt dabei kein einziger Zug übrig — alle Sprungfelder
         * besetzt, oder der König steht im Schach und kein Muster löst es auf —
         * dann stünde die Partie: Der Spieler wäre am Zug, könnte aber nichts
         * tun, und `SCHACH.alleZuege` läse das als Matt. Deshalb wird das
         * Einsetzen abgewiesen; die Fähigkeit bleibt im Vorrat.
         */
        if (beschreibung.istDerZug && SCHACH.alleZuege(neu.stand).length === 0) {
            return null;
        }

        /*
         * BERÜHREN HEISST EINSAMMELN (seit v0.53).
         *
         * Bis v0.52 zählte nur der eigene ZUG: Wer mit dem Nudelholz eine Figur
         * über einen Würfel schob, sie mit dem Spiegel neben einen setzte oder
         * sie per Wiedergeburt auf einem erscheinen liess, ging leer aus — der
         * Würfel blieb unter der Figur liegen und war für immer unerreichbar,
         * weil man ihn nur durch Betreten einsammelt.
         *
         * Eingesammelt wird deshalb auf JEDEM Feld, das die Fähigkeit berührt
         * hat und auf dem jetzt eine eigene Figur steht. `betroffen` sind genau
         * diese Felder — dieselbe Liste, die auch das Aufleuchten am Brett
         * steuert.
         */
        const felderVorEinsammeln = SCHACH.felderVon(neu.stand);
        SCHACH_RUNDE._bonusEinsammelnAufFeldern(neu, betroffen, farbe, wer);

        /*
         * AUCH EINE GESCHOBENE GEGNERISCHE FIGUR SAMMELT EIN (seit v0.59,
         * Wunsch #6).
         *
         * Bis v0.58 zählten nur Felder, auf denen danach eine EIGENE Figur
         * stand. Wer mit dem Nudelholz eine gegnerische Figur über einen Würfel
         * schob, liess ihn also für immer unter ihr liegen — genau der Fall,
         * den „Berühren heisst Einsammeln" (v0.53) eigentlich abschaffen
         * sollte.
         *
         * ER GEHT AN DIE SEITE DER GESCHOBENEN FIGUR, nicht an den Einsetzer.
         * Die Figur betritt das Feld, also gehört ihr der Fund — dieselbe
         * Regel wie beim Zug. Damit bekommt das Nudelholz einen Preis: Wer
         * damit gegnerische Figuren schiebt, kann dem Gegner etwas schenken.
         *
         * `wer` bleibt leer: Im Verlauf stünde sonst der Name des Einsetzers
         * neben der Farbe des Gegners, und es sähe aus, als hätte der Gegner
         * gehandelt.
         *
         * HAT DER ERSTE DURCHGANG DAS BRETT VERÄNDERT, entfällt der zweite:
         * Nach einer Ausdehnung oder einem Einsturz zeigen die gemerkten
         * Feldnummern in `betroffen` woanders hin. Lieber ein Würfel, der
         * liegen bleibt, als einer, der auf einem falsch gerechneten Feld
         * wirkt — dieselbe Überlegung wie beim zweiten Unglückswürfel in
         * `_bonusEinsammelnAufFeldern`.
         */
        if (SCHACH.felderVon(neu.stand) === felderVorEinsammeln) {
            SCHACH_RUNDE._bonusEinsammelnAufFeldern(neu, betroffen, SCHACH.gegner(farbe), "");
        }

        /*
         * AUCH EIN ABGEGEBENER ZUG IST EIN HALBZUG (seit v0.52).
         *
         * Würfel erscheinen nach jedem Halbzug — aber `_bonusNachziehen` lief
         * nur in `ziehen`. Wer seinen Zug für eine Fähigkeit hergab (Friedhof,
         * Wiedergeburt, Händler …), bekam deshalb keinen neuen Würfel aufs
         * Brett, und in einer Partie mit vielen Fähigkeiten wurde es dadurch
         * spürbar still. Gemeldet als „Würfel sollen nicht nur in ganzen Zügen
         * spawnen, sondern nach jeder Bewegung".
         *
         * Nur bei `beendetZug`: Wer am Zug bleibt, hat noch keinen Halbzug
         * verbraucht — der Würfel kommt dann nach seinem Zug.
         */
        if (beschreibung.beendetZug) {
            SCHACH_RUNDE._bonusNachziehen(neu);
        }

        neu.verlauf.push({
            text: "Fähigkeit " + SCHACH_VARIANTEN.faehigkeitTitel(art) + " eingesetzt"
                + zusatzText,
            wer: wer || "",
            farbe: farbe,
            von: -1,
            nach: -1,
            wirkung: art,
            felder: betroffen,
            wege: wege
        });
        SCHACH_RUNDE._verlaufKuerzen(neu);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Sammelt alle Würfel ein, über die dieser Zug geführt hat. Ändert die
     * übergebene Runde.
     *
     * BIS v3.5 ZÄHLTE NUR DAS ZIELFELD. Wer mit dem Turm über einen Würfel
     * hinwegzog, liess ihn liegen — was am Brett aussah wie ein Fehler, denn
     * die Figur war ja sichtbar darüber gelaufen. Jetzt zählt jedes betretene
     * Feld. Wer springt (Springer, Fähigkeit „Sprung", Teleport), betritt nur
     * sein Zielfeld und sammelt unterwegs deshalb nichts ein — genau so, wie
     * es `SCHACH.betreteneFelder` festlegt.
     *
     * `altStand` ist der Stand VOR dem Zug: Die Felder gehören zu seiner
     * Nummerierung, und ein Unglückswürfel kann das Brett vergrössern.
     */
    _bonusEinsammeln(runde, altStand, von, nach, farbe, wer) {
        return SCHACH_RUNDE._bonusEinsammelnAufFeldern(runde,
            SCHACH.betreteneFelder(altStand, von, nach), farbe, wer,
            { vonZug: true, von: von, nach: nach, altStand: altStand });
    },

    /*
     * Sammelt die Würfel auf diesen Feldern ein. Ändert die übergebene Runde.
     *
     * Zwei Wege führen hierher (seit v0.53): ein ZUG (dann sind es die
     * betretenen Felder, siehe oben) und eine FÄHIGKEIT, die Figuren bewegt
     * oder erscheinen lässt (dann sind es ihre betroffenen Felder). Vorher
     * konnte nur ein Zug einsammeln — ein Würfel unter einer per Nudelholz
     * geschobenen Figur blieb für immer liegen.
     *
     * `herkunft` trägt, was der Verlauf braucht (`von`, `nach`, `altStand`) und
     * unterscheidet die beiden Wege: Ein ZUG betritt sein Feld auf jeden Fall,
     * eine FÄHIGKEIT berührt auch Felder, auf denen danach gar nichts oder eine
     * gegnerische Figur steht (Erdbeben verschiebt beide Seiten). Dort wird
     * nichts eingesammelt — sonst bekäme man Würfel für Felder, die man nie
     * betreten hat.
     */
    _bonusEinsammelnAufFeldern(runde, felder, farbe, wer, herkunft) {
        const woher = herkunft || {};
        const von = Number.isInteger(woher.von) ? woher.von : -1;
        const nach = Number.isInteger(woher.nach) ? woher.nach : -1;
        const altStand = woher.altStand || runde.stand;

        const betreten = (felder || []).filter((feld) => {
            if (woher.vonZug) {
                return true;
            }
            return SCHACH.farbeVon(SCHACH.figurAuf(runde.stand, feld)) === farbe;
        });

        const eingesammelt = [];

        for (const feld of betreten) {
            const stelle = runde.bonus.findIndex((eintrag) => eintrag.feld === feld);
            if (stelle === -1) {
                continue;
            }
            eingesammelt.push(runde.bonus[stelle]);
            runde.bonus.splice(stelle, 1);
            runde.bonusGesammelt.push(feld);
        }

        /*
         * Erst alle Fähigkeiten gutschreiben, dann die Unglückswürfel wirken
         * lassen. Die Reihenfolge ist Absicht: Ein Unglückswürfel kann das
         * Brett verändern („Ausdehnung" vergrössert es), und danach zeigen die
         * gemerkten Feldnummern woanders hin.
         */
        for (const bonus of eingesammelt) {
            if (bonus.pech) {
                continue;
            }

            /*
             * WAS DRIN IST, ENTSCHEIDET SICH HIER (seit v3.6) — gegen den
             * Vorrat dessen, der ihn einsammelt. Ein Würfel von vor v3.6 trägt
             * seine Art schon; dann bleibt sie stehen.
             */
            /* Die Feldnummer steht VORNE — sonst liefern zwei Würfel, die im
               selben Zug auf benachbarten Feldern eingesammelt werden, fast
               denselben Wert und damit fast immer dieselbe Fähigkeit (siehe
               `_armeeSaat`). */
            const art = bonus.art || SCHACH_VARIANTEN.faehigkeitAusStufe(
                bonus.stufe,
                SCHACH_RUNDE._zufallsWert(bonus.feld + "|inhalt|"
                    + runde.zugZaehler + "|" + (runde.id || "partie")),
                runde.faehigkeiten[farbe]);

            if (!art) {
                continue;
            }
            runde.faehigkeiten[farbe].push(art);

            /* Derselbe Weg wie beim Zug davor: Dieser Eintrag beschreibt
               denselben Zug. So findet der Bildschirm die Bewegung auch dann
               am Ende des Verlaufs, wenn dabei etwas eingesammelt wurde. */
            runde.verlauf.push({
                text: SCHACH_VARIANTEN.faehigkeitTitel(art) + " ("
                    + SCHACH_VARIANTEN.stufeVon(art).titel + ") eingesammelt",
                wer: wer || "",
                farbe: farbe,
                von: von,
                nach: nach,
                wirkung: "eingesammelt",
                felder: [bonus.feld]
            });
            SCHACH_RUNDE._verlaufKuerzen(runde);
        }

        /* Die Felder, auf denen ein UNGLÜCKSwürfel lag — der Aufrufer braucht
           sie, um den Zug am Riss abbrechen zu können (seit v0.58). */
        const pechFelder = [];

        for (const bonus of eingesammelt) {
            if (!bonus.pech) {
                continue;
            }
            pechFelder.push(bonus.feld);

            /*
             * Hat ein früherer Unglückswürfel das Brett schon verändert, sind
             * alle weiteren Felder verschoben. Dann wirkt keiner mehr — er
             * wird nur weggeräumt und im Verlauf vermerkt. Das ist selten
             * (zwei Unglückswürfel auf einem Weg) und allemal besser, als auf
             * ein falsch gerechnetes Feld zu wirken.
             */
            if (SCHACH.felderVon(runde.stand) !== SCHACH.felderVon(altStand)) {
                runde.verlauf.push({
                    text: "Eine zweite Unglücks-Lootbox verpufft — das Brett hat sich "
                        + "gerade verändert",
                    wer: wer || "",
                    farbe: farbe,
                    von: -1,
                    nach: -1,
                    wirkung: "pech",
                    felder: []
                });
                SCHACH_RUNDE._verlaufKuerzen(runde);
                continue;
            }

            /*
             * WO STEHT DIE FIGUR, DIE IHN EINGESAMMELT HAT? (seit v0.58)
             *
             * Bis v0.57 bekam `_pechAusloesen` immer das Feld des WÜRFELS —
             * mit der Begründung „dort steht jetzt die einsammelnde Figur".
             * Das stimmte bis v0.52. Seit „Berühren heisst Einsammeln" (v0.53)
             * sammelt ein Turm auch im Vorbeiziehen ein und steht danach ganz
             * woanders. Der Stolperstein suchte dann auf einem leeren Feld
             * nach einer Figur und verpuffte still — jedes Mal, wenn man über
             * ihn hinwegzog statt auf ihm zu landen.
             *
             * Bei einem Zug ist der Träger das ZIELFELD, sonst weiterhin das
             * Würfelfeld (dort hat eine Fähigkeit die Figur hingestellt).
             */
            const traeger = (woher.vonZug && Number.isInteger(nach) && nach >= 0)
                ? nach
                : bonus.feld;

            SCHACH_RUNDE._pechAusloesen(runde, bonus.art, farbe, bonus.feld, wer,
                von, traeger);
        }

        return pechFelder;
    },

    /*
     * Lässt einen Unglückswürfel sofort wirken. Ändert die übergebene Runde.
     *
     * `feld` ist das Feld, auf dem er LAG, `farbe` die Seite, die ihn erwischt
     * hat. `traeger` ist das Feld, auf dem die einsammelnde Figur jetzt steht
     * (seit v0.58) — beim Vorbeiziehen ist das nicht dasselbe. Fehlt es, gilt
     * wie früher das Würfelfeld.
     */
    _pechAusloesen(runde, art, farbe, feld, wer, herkunft, traeger) {
        const basis = (runde.id || "partie") + "|" + runde.zugZaehler + "|pech";
        const wo = Number.isInteger(traeger) ? traeger : feld;
        let wirkung = null;

        if (art === "stolperstein") {
            wirkung = SCHACH.stolperstein(runde.stand, farbe, wo);

        } else if (art === "ausdehnung") {
            /*
             * ALLE VIER SEITEN, JEDE MIT EINEM VIERTEL — und wenn die gezogene
             * nicht mehr kann, kommt die nächste dran (seit v0.50).
             *
             * `SCHACH.ausdehnung` weist eine Seite ab, sobald das Brett dort an
             * seine Grenze stösst (8 Spalten, 9 Reihen). Bis v0.49 verpuffte der
             * Würfel dann ganz: Wer ihn einsammelte, las „ohne Wirkung" und
             * hatte Glück gehabt — obwohl drei andere Seiten noch Platz hatten.
             * Gezogen wird deshalb weiterhin gleichverteilt, aber die übrigen
             * Seiten werden der Reihe nach durchprobiert.
             */
            const seiten = ["oben", "unten", "links", "rechts"];
            const wahl = SCHACH_RUNDE._zufallsWert(basis + "|seite");
            const erste = Math.floor(wahl * seiten.length) % seiten.length;

            for (let schritt = 0; schritt < seiten.length && !wirkung; schritt++) {
                wirkung = SCHACH.ausdehnung(runde.stand,
                    seiten[(erste + schritt) % seiten.length]);
            }

        } else if (art === "schrumpfung") {
            /* Wie die Ausdehnung: gleichverteilt gezogen, und wenn die
               gezogene Seite nicht kann (König darauf, Brett zu klein), kommt
               die nächste dran. */
            const seiten = ["oben", "unten", "links", "rechts"];
            const wahl = SCHACH_RUNDE._zufallsWert(basis + "|seite");
            const erste = Math.floor(wahl * seiten.length) % seiten.length;

            for (let schritt = 0; schritt < seiten.length && !wirkung; schritt++) {
                wirkung = SCHACH.schrumpfung(runde.stand,
                    seiten[(erste + schritt) % seiten.length]);
            }

        } else if (art === "erdbeben") {
            wirkung = SCHACH.erdbebenRisse(runde.stand,
                SCHACH_RUNDE._zufallsWert(basis + "|risse"));

        } else if (art === "meuterei") {
            wirkung = SCHACH.meuterei(runde.stand, farbe,
                SCHACH_RUNDE._zufallsWert(basis + "|figur"));

        } else if (art === "erdrutsch") {
            wirkung = SCHACH.erdrutsch(runde.stand, farbe);

        } else if (art === "vollesGlas") {
            /* Ändert nichts am Brett — nur daran, wie EINE Seite es sieht. */
            wirkung = {
                stand: Object.assign({}, runde.stand, {
                    glasFarbe: farbe,
                    glasBis: runde.zugZaehler + SCHACH_RUNDE.GLAS_HALBZUEGE
                }),
                felder: [],
                wege: [],
                text: "die Sicht verschwimmt für "
                    + ((farbe === "weiss") ? "Weiss" : "Schwarz")
            };
        }

        const stufe = SCHACH_VARIANTEN.pechStufeVon(art);
        let text = "Unglücks-Lootbox: " + SCHACH_VARIANTEN.pechTitel(art)
            + " (" + stufe.titel + ")";

        if (wirkung) {
            runde.stand = wirkung.stand;
            text += " — " + wirkung.text;

            /*
             * ÄNDERT SICH DIE BRETTGRÖSSE, WANDERN DIE LIEGENDEN WÜRFEL MIT
             * (seit v0.54).
             *
             * Der Stand rechnet seine gemerkten Felder selbst um; die Würfel
             * liegen aber in der RUNDE, davon weiss `schach.js` nichts. Bis
             * v0.53 blieben sie nach einer Ausdehnung auf ihren alten Nummern
             * stehen und lagen damit plötzlich woanders — bei der Schrumpfung
             * wären sie sogar ausserhalb des Bretts gelandet.
             *
             * Was auf einer weggebrochenen Linie lag, fällt mit weg: Genau das
             * ist beim Einsturz gewollt.
             */
            if (typeof wirkung.umrechnen === "function") {
                runde.bonus = runde.bonus
                    .map((eintrag) => Object.assign({}, eintrag, {
                        feld: wirkung.umrechnen(eintrag.feld)
                    }))
                    .filter((eintrag) => eintrag.feld >= 0);
            }

            /*
             * WAS AUF EINEM RISS LAG, FÄLLT HINEIN (seit v0.59, Wunsch #20).
             *
             * Ein Erdbeben reisst Felder auf, ohne zu fragen, ob dort ein
             * Würfel liegt — und auf ein gesperrtes Feld kann danach niemand
             * mehr ziehen. Der Würfel lag damit für den Rest der Partie
             * unerreichbar im Loch. Jetzt fällt er mit hinein.
             *
             * Gefragt wird `rissAuf`, nicht `gesperrt`: Eine MAUER läuft ab,
             * der Würfel darunter wird danach wieder erreichbar und soll
             * liegen bleiben. Ein Riss bleibt die ganze Partie.
             */
            runde.bonus = runde.bonus.filter(
                (eintrag) => !SCHACH.rissAuf(runde.stand, eintrag.feld));
        } else {
            /* Auch ein wirkungsloser Unglückswürfel wird festgehalten: Sonst
               stünde im Verlauf ein Einsammeln ohne Folge, und niemand wüsste,
               warum nichts passiert ist. */
            text += " — ohne Wirkung";
        }

        runde.verlauf.push({
            text: text,
            wer: wer || "",
            farbe: farbe,
            von: Number.isInteger(herkunft) ? herkunft : -1,
            nach: feld,
            wirkung: "pech",
            felder: wirkung ? wirkung.felder : [feld],
            wege: wirkung ? (wirkung.wege || []) : []
        });
        SCHACH_RUNDE._verlaufKuerzen(runde);
    },

    /*
     * Welche Felder kommen für eine Fähigkeit als Ziel in Frage?
     *
     * Ermittelt durch Ausprobieren: Ein Feld ist ein gültiges Ziel, wenn die
     * Wirkung dort etwas ergibt. Damit kann die Anzeige nicht von der Regel
     * abweichen — es gibt keine zweite Liste von Bedingungen, die veralten
     * könnte. Geprüft wird auf Kopien, damit nichts hängen bleibt.
     */
    zielFelder(runde, spielerId, art) {
        const alt = SCHACH_RUNDE.normalisieren(runde);
        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        if (!farbe || !beschreibung || beschreibung.art !== "ziel") {
            return [];
        }

        const liste = [];
        for (let feld = 0; feld < SCHACH.felderVon(alt.stand); feld++) {
            if (SCHACH_RUNDE._zielWirkung(SCHACH_RUNDE.kopieren(alt), art, farbe, feld)) {
                liste.push(feld);
            }
        }

        return liste;
    },

    /*
     * WELCHE FELDER DIE WIRKUNG BERÜHREN WÜRDE (seit v0.57).
     *
     * Das ist die Auskunft für den Vorschau-Kasten: Der Bildschirm zeigt den
     * Umriss der echten Wirkung, BEVOR man sie einsetzt — drei Felder bei der
     * Mauer, ein 2×2 beim Frost und beim Friedhof, eine Spalte beim Nudelholz.
     *
     * Gefragt wird `_zielWirkung`, also genau die Rechnung, die hinterher auch
     * läuft. Eine zweite Liste von „was passiert wo" wäre eine zweite
     * Wahrheit, und sie veraltete beim ersten Umbau einer Fähigkeit — dieselbe
     * Überlegung wie bei `zielFelder`.
     *
     * Liefert eine leere Liste, wenn die Wirkung dort nicht zustande kommt.
     */
    zielUmriss(runde, spielerId, art, feld) {
        const alt = SCHACH_RUNDE.normalisieren(runde);
        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        if (!farbe || !beschreibung || beschreibung.art !== "ziel") {
            return [];
        }

        const wirkung = SCHACH_RUNDE._zielWirkung(
            SCHACH_RUNDE.kopieren(alt), art, farbe, feld);

        return (wirkung && Array.isArray(wirkung.felder)) ? wirkung.felder.slice() : [];
    },

    /*
     * WIE VIELE BAUERN DER SCHUB UMWANDELN WÜRDE (seit v0.56).
     *
     * Der Bildschirm fragt danach, bevor er den Bauernschub einsetzt: Nur wenn
     * die Antwort grösser als 0 ist, lohnt die Rückfrage nach der Figur.
     *
     * Warum das hier steht und nicht im Bildschirm: Welche Bauern vorrücken
     * und welche dabei die letzte Reihe erreichen, ist eine Regelfrage — sie
     * hängt an freien Feldern, an der Zugrichtung und am Brettmass. Gerechnet
     * wird sie deshalb mit derselben Funktion, die es hinterher wirklich tut.
     */
    schubWandeltUm(runde, spielerId) {
        const alt = SCHACH_RUNDE.normalisieren(runde);
        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);

        if (!farbe) {
            return 0;
        }

        const wirkung = SCHACH.bauernschub(alt.stand, farbe);
        return (wirkung && wirkung.umgewandelt) ? wirkung.umgewandelt.length : 0;
    },

    /* Die Fähigkeiten, die ein angetipptes Feld brauchen. */
    _zielWirkung(runde, art, farbe, feld) {
        if (feld < 0 || feld >= SCHACH.felderVon(runde.stand)) {
            return null;
        }

        /*
         * DIE AUFWERTUNG WÜRFELT NICHT, SIE RECHNET (seit v0.56).
         *
         * Beim Springer gibt es zwei Ergebnisse (Läufer oder Turm), und die
         * Entscheidung muss auf jedem Gerät gleich ausfallen — sonst sieht
         * einer einen Läufer und der andere einen Turm, und der erste
         * Schreibvorgang gewinnt. Dieselbe Falle wie in v0.8.
         *
         * Das FELD steht vorn in der Saat: `_zufallsWert` ist FNV-1a, und ein
         * Unterschied im letzten Zeichen verschiebt das Ergebnis nur um
         * Bruchteile. Stünde das Feld hinten, bekämen ganze Feldblöcke
         * dieselbe Figur (siehe die Merksätze in `CLAUDE.md`).
         */
        if (art === "verstaerkung") {
            const saat = feld + "|aufwertung|" + (runde.id || "partie")
                + "|" + runde.zugZaehler;

            return SCHACH.verstaerkung(runde.stand, farbe, feld,
                SCHACH_RUNDE._zufallsWert(saat));
        }

        /* Das Erdbeben ist seit v0.54 ein Unglückswürfel und braucht kein
           Zielfeld mehr — es steht in `_pechAusloesen`. */

        if (art === "mauer") {
            const wirkung = SCHACH.mauerLegen(runde.stand, feld);

            /*
             * KEINE MAUER ÜBER EINEN WÜRFEL (seit v0.66, Wunsch #32).
             *
             * Gemeldet als „die Items unter der Mauer verschwinden und kommen
             * nicht wieder". Sie verschwinden nicht wirklich — sie liegen
             * weiter in `runde.bonus`. Aber das Feld ist gesperrt, solange die
             * Mauer steht, und auf ein gesperrtes Feld zieht niemand: Der
             * Würfel ist unerreichbar und am Brett nicht mehr zu sehen. Von
             * aussen ist das dasselbe wie weg.
             *
             * Statt die Würfel wegzuräumen (dann wären sie wirklich weg) oder
             * sie dem Mauerbauer zu schenken (das wäre eine neue Regel und
             * eine starke dazu), wird das Feld gar nicht erst angeboten:
             * `zielFelder` probiert jedes Feld gegen genau diese Rechnung
             * durch. Wer eine Mauer legen will, sucht sich eine freie Stelle.
             *
             * Beim RISS geht das nicht — der entsteht durch ein Unglück und
             * fragt niemanden. Dort fällt der Würfel deshalb wirklich hinein
             * (v0.60).
             */
            if (wirkung && wirkung.felder.some(
                (gesperrt) => runde.bonus.some((eintrag) => eintrag.feld === gesperrt))) {
                return null;
            }

            return wirkung;
        }

        /*
         * DER FRIEDHOF WECKT, WER GENAU DORT GEFALLEN IST (seit v0.54).
         *
         * Die Geweckten werden aus der Grabliste verbraucht; `verloren` bleibt
         * unangetastet, damit die Bilanz weiter zählt, was wirklich geschlagen
         * wurde.
         *
         * Bis v0.53 nahm er die vier ZULETZT gefallenen Gegner und stellte sie
         * auf ein beliebiges freies 2×2-Feld. Auf Nutzer-Ansage ist daraus eine
         * andere Regel geworden: Man sieht auf dem Brett, WO die Gefallenen
         * liegen, wählt ein 2×2-Feld — und genau die, die dort fielen, stehen
         * dort wieder auf, jeder auf seinem eigenen Feld.
         *
         * Das macht die Fähigkeit ortsgebunden statt beliebig: Sie ist stark,
         * wo viel gestorben ist, und nutzlos auf einem leeren Flügel.
         */
        if (art === "friedhof") {
            const gegner = SCHACH.gegner(farbe);
            const gefallene = runde.gefallen[gegner] || [];

            if (gefallene.length === 0) {
                return null;
            }

            const block = SCHACH.friedhofsFelder(runde.stand, feld);
            if (!block) {
                return null;
            }

            /* Wer liegt in diesem Block? Je Feld höchstens einer — fielen dort
               mehrere, steht der zuletzt gefallene auf. */
            const dort = [];
            const benutzt = [];

            for (let stelle = gefallene.length - 1; stelle >= 0; stelle--) {
                const eintrag = gefallene[stelle];

                if (block.indexOf(eintrag.feld) === -1
                    || benutzt.indexOf(eintrag.feld) !== -1) {
                    continue;
                }
                benutzt.push(eintrag.feld);
                dort.push({ stelle: stelle, art: eintrag.art, feld: eintrag.feld });
            }

            if (dort.length === 0) {
                return null;
            }

            const wirkung = SCHACH.friedhof(runde.stand, farbe, feld,
                dort.map((eintrag) => ({ art: eintrag.art, feld: eintrag.feld })));

            if (!wirkung) {
                return null;
            }

            /* Nur die verbraucht, die wirklich aufgestanden sind. */
            const geweckt = dort
                .filter((eintrag) => wirkung.felder.indexOf(eintrag.feld) !== -1)
                .map((eintrag) => eintrag.stelle);

            runde.gefallen[gegner] = gefallene.filter(
                (eintrag, stelle) => geweckt.indexOf(stelle) === -1);

            return wirkung;
        }

        if (art === "schutzschild") {
            const figur = SCHACH.figurAuf(runde.stand, feld);
            /* Auf den König wirkt das Schild nicht — sonst wäre "Schachmatt"
               nicht mehr eindeutig. Dieselbe Überlegung wie beim Doppelbrett. */
            if (SCHACH.farbeVon(figur) !== farbe || SCHACH.artVon(figur) === "K") {
                return null;
            }
            const stand = Object.assign({}, runde.stand, {
                schildFeld: feld,
                schildFarbe: farbe
            });
            return { stand: stand, felder: [feld], text: SCHACH.artName(SCHACH.artVon(figur)) };
        }

        if (art === "fessel") {
            const figur = SCHACH.figurAuf(runde.stand, feld);
            const gegner = SCHACH.gegner(farbe);
            /* Der König wird nicht gefesselt: Wer im Schach steht und nicht
               ziehen darf, wäre ohne eigenen Fehler matt. */
            if (SCHACH.farbeVon(figur) !== gegner || SCHACH.artVon(figur) === "K") {
                return null;
            }
            const stand = Object.assign({}, runde.stand, {
                fesselFeld: feld,
                fesselFarbe: gegner,

                /* Seit v0.56 hält sie mehrere Züge — gemessen am Takt, der
                   einzigen Uhr, die nicht zurückspringt. */
                fesselBis: runde.stand.takt + SCHACH.FESSEL_HALBZUEGE
            });
            return { stand: stand, felder: [feld], text: SCHACH.artName(SCHACH.artVon(figur)) };
        }

        /*
         * DER FROST SPERRT SEIT v0.56 EINEN 2×2-BLOCK.
         *
         * Angetippt wird die linke obere Ecke — dieselbe Lesart wie beim
         * Friedhof. Angeboten wird ein Block nur, wenn wenigstens eine
         * GEGNERISCHE Figur darin steht, die sich einfrieren lässt: Sonst
         * stünden auf einem leeren Brett hunderte gültiger Ziele, und die
         * Fähigkeit könnte man wirkungslos verbrauchen.
         *
         * Eingefroren wird dann alles im Block, auch eigene Figuren
         * (Nutzer-Entscheidung 08.08.). Könige bleiben verschont — das
         * entscheidet `SCHACH.eingefroren`, nicht die Auswahl hier.
         */
        if (art === "frost") {
            const gegner = SCHACH.gegner(farbe);
            const block = SCHACH.frostBlock(runde.stand, feld);

            if (!block) {
                return null;
            }

            const trifft = block.filter((platz) => {
                const figur = SCHACH.figurAuf(runde.stand, platz);
                return SCHACH.farbeVon(figur) === gegner && SCHACH.artVon(figur) !== "K";
            });

            if (trifft.length === 0) {
                return null;
            }

            const stand = Object.assign({}, runde.stand, {
                frostFeld: block[0],
                frostFelder: block.slice(),
                frostFarbe: gegner
            });

            return { stand: stand, felder: block.slice(), wege: [],
                text: trifft.length + (trifft.length === 1 ? " Figur" : " Figuren") };
        }

        if (art === "spiegel") {
            return SCHACH.spiegel(runde.stand, farbe, feld);
        }

        if (art === "nudelholz") {
            /*
             * ES ROLLT IMMER VON DIR WEG (seit v0.46).
             *
             * Angetippt wird ein Feld der EIGENEN Grundreihe — auf dem
             * Bildschirm also die unterste Reihe, denn das Brett wird für
             * Schwarz gedreht. Von dort schieben sich die Figuren nach vorn,
             * aus der Sicht des Spielers nach oben.
             *
             * Bis v0.45 bestimmte der Rand die Richtung: oben angetippt hiess
             * nach oben, unten angetippt nach unten. Für Schwarz stand damit
             * beides auf dem Kopf — man tippte unten und die Figuren kamen auf
             * einen zu.
             */
            const breite = SCHACH.breiteVon(runde.stand);
            const reihe = SCHACH.reiheVon(feld, breite);
            const eigeneReihe = (farbe === SCHACH.WEISS)
                ? SCHACH.hoeheVon(runde.stand) - 1
                : 0;

            if (reihe !== eigeneReihe) {
                return null;
            }
            return SCHACH.nudelholz(runde.stand, SCHACH.spalteVon(feld, breite),
                (farbe === SCHACH.WEISS) ? -1 : 1);
        }

        /*
         * Wiederbelebung: Die Figur kehrt an ihr Grab zurück.
         *
         * Gesucht wird der ZULETZT auf diesem Feld gefallene eigene Stein —
         * fielen dort mehrere nacheinander, kommt der jüngste zuerst wieder.
         * Der Eintrag wird verbraucht, sonst liesse sich dieselbe Figur mit
         * einer zweiten Wiederbelebung noch einmal holen.
         */
        if (art === "wiederbelebung") {
            const gefallene = runde.gefallen[farbe];
            if (!gefallene || gefallene.length === 0) {
                return null;
            }

            let stelle = -1;
            for (let nummer = gefallene.length - 1; nummer >= 0; nummer--) {
                if (gefallene[nummer].feld === feld) {
                    stelle = nummer;
                    break;
                }
            }
            if (stelle === -1) {
                return null;
            }

            const wirkung = SCHACH.wiedergeburt(
                runde.stand, farbe, feld, gefallene[stelle].art);

            if (!wirkung) {
                return null;
            }

            gefallene.splice(stelle, 1);
            return wirkung;
        }

        /*
         * Nachschub (seit v0.61): ein NEUER Bauer auf der eigenen Grundreihe.
         * Kein Vorrat dahinter — anders als Wiedergeburt und Wiederbelebung
         * verbraucht er nichts, er erschafft. Deshalb steht er auch nicht in
         * `_gefalleneVorhanden`.
         */
        if (art === "nachschub") {
            /* Dieselbe Rechnung wie bei der Wiedergeburt darunter: die eigene
               Grundreihe, unten für Weiss und oben für Schwarz. */
            const grundreihe = (farbe === "weiss") ? SCHACH.hoeheVon(runde.stand) - 1 : 0;
            if (SCHACH.reiheVon(feld, SCHACH.breiteVon(runde.stand)) !== grundreihe) {
                return null;
            }
            return SCHACH.wiedergeburt(runde.stand, farbe, feld, "B");
        }

        if (art === "wiedergeburt") {
            const verloren = runde.verloren[farbe];
            if (!verloren || verloren.length === 0) {
                return null;
            }
            const grundreihe = (farbe === "weiss") ? SCHACH.hoeheVon(runde.stand) - 1 : 0;
            if (SCHACH.reiheVon(feld, SCHACH.breiteVon(runde.stand)) !== grundreihe) {
                return null;
            }

            const figurArt = verloren[verloren.length - 1];
            const wirkung = SCHACH.wiedergeburt(runde.stand, farbe, feld, figurArt);
            if (!wirkung) {
                return null;
            }
            verloren.pop();
            return wirkung;
        }

        return null;
    },

    /* ---------------------------------------------------------------- *
     * Der Händler (seit v3.3)
     *
     * Er unterscheidet sich von jeder anderen Fähigkeit darin, dass man ihn
     * ANSEHEN kann, bevor man ihn benutzt: Das Angebot steht fest, sobald die
     * Fähigkeit im Vorrat liegt, und ändert sich erst mit dem nächsten Zug.
     * Deshalb kostet ein Ablehnen nichts — man kann nicht so lange neu würfeln,
     * bis das Angebot passt, denn dazwischen liegt immer ein Zug.
     * ---------------------------------------------------------------- */

    /*
     * Das Angebot für diese Farbe, oder null, wenn gerade keines möglich ist.
     * Liefert:
     *
     *     {
     *         gibt:     { art, anzahl },
     *         bekommt:  { art, anzahl },
     *         gibtFelder:    [Felder, die geräumt werden],
     *         bekommtFelder: [Felder, auf denen Neues erscheint],
     *         text: "3 Bauern gegen 1 Springer"
     *     }
     *
     * Gerechnet, nicht gewürfelt: Alle Geräte sehen dasselbe Angebot.
     */
    handelsAngebot(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (farbe !== "weiss" && farbe !== "schwarz") {
            return null;
        }

        const marke = (stand.id || "partie") + "|handel|" + stand.zugZaehler + "|" + farbe;
        const angebot = SCHACH_VARIANTEN.handelZiehen(SCHACH_RUNDE._zufallsWert(marke));

        /*
         * WELCHE Figuren weggehen, entscheidet nicht der Spieler: Er tippt
         * sonst fünf Felder nacheinander an, und bei jedem Fehlgriff wäre der
         * Handel dahin. Genommen werden die HINTERSTEN — die, die am weitesten
         * von der gegnerischen Grundreihe entfernt stehen. Das ist die Wahl,
         * die man ohnehin fast immer treffen würde, und sie ist vorhersagbar.
         */
        /*
         * Seit v0.58 kann eine Seite MEHRERE Figurenarten tragen („Dame und
         * Bauer gegen einen König"). Gesammelt wird je Art getrennt; fehlt an
         * einer Stelle etwas, kommt der Handel nicht zustande.
         */
        const gibtTeile = SCHACH_VARIANTEN.handelSeite(angebot.gibt);
        const gibtAnzahl = SCHACH_VARIANTEN.handelAnzahl(angebot.gibt);
        const gibtFelder = [];

        for (const teil of gibtTeile) {
            const felder = SCHACH_RUNDE._hintersteFiguren(
                stand, farbe, teil.art, teil.anzahl);

            if (felder.length < teil.anzahl) {
                return null;
            }
            for (const feld of felder) {
                gibtFelder.push(feld);
            }
        }

        if (gibtFelder.length < gibtAnzahl) {
            return null;
        }

        /*
         * Die neuen Figuren erscheinen auf den frei werdenden Feldern; reichen
         * die nicht, kommen freie Felder der eigenen Grundreihe dazu. So bleibt
         * der Handel dort, wo die abgegebenen Figuren standen — und nicht
         * plötzlich in der gegnerischen Hälfte.
         */
        const bekommtAnzahl = SCHACH_VARIANTEN.handelAnzahl(angebot.bekommt);
        const bekommtFelder = SCHACH_RUNDE._handelsPlaetze(
            stand, farbe, gibtFelder, bekommtAnzahl);

        if (bekommtFelder.length < bekommtAnzahl) {
            return null;
        }

        return {
            gibt: angebot.gibt,
            bekommt: angebot.bekommt,
            gibtFelder: gibtFelder,
            bekommtFelder: bekommtFelder,
            text: SCHACH_RUNDE._handelsText(angebot.gibt)
                + " gegen " + SCHACH_RUNDE._handelsText(angebot.bekommt)
        };
    },

    /* Die Mehrzahl der Figurennamen — im Deutschen nicht ableitbar. */
    FIGUR_MEHRZAHL: {
        B: "Bauern", S: "Springer", L: "Läufer",
        T: "Türme", D: "Damen", K: "Könige"
    },

    /* „3 Bauern" — und seit v0.58 auch „1 Dame und 1 Bauer". */
    _handelsText(seite) {
        return SCHACH_VARIANTEN.handelSeite(seite)
            .map((teil) => teil.anzahl + " " + ((teil.anzahl === 1)
                ? SCHACH.artName(teil.art)
                : (SCHACH_RUNDE.FIGUR_MEHRZAHL[teil.art] || SCHACH.artName(teil.art))))
            .join(" und ");
    },

    /*
     * Die `anzahl` eigenen Figuren dieser Art, die am weitesten hinten stehen.
     * „Hinten" heisst: nah an der eigenen Grundreihe.
     */
    _hintersteFiguren(runde, farbe, art, anzahl) {
        const stand = runde.stand;
        const breite = SCHACH.breiteVon(stand);
        const eigene = [];

        for (let feld = 0; feld < SCHACH.felderVon(stand); feld++) {
            const figur = SCHACH.figurAuf(stand, feld);

            if (SCHACH.farbeVon(figur) === farbe && SCHACH.artVon(figur) === art) {
                eigene.push(feld);
            }
        }

        /* Weiss steht unten (grosse Reihennummern), Schwarz oben. */
        eigene.sort((einer, anderer) => {
            const reiheEiner = SCHACH.reiheVon(einer, breite);
            const reiheAnderer = SCHACH.reiheVon(anderer, breite);

            return (farbe === "weiss")
                ? (reiheAnderer - reiheEiner) || (einer - anderer)
                : (reiheEiner - reiheAnderer) || (einer - anderer);
        });

        return eigene.slice(0, anzahl);
    },

    /*
     * Den Handel wirklich durchführen: erst alle abgegebenen Felder räumen,
     * dann die neuen Figuren setzen.
     *
     * Die Reihenfolge ist Absicht — Räumen und Setzen können sich dieselben
     * Felder teilen (die neue Figur erscheint da, wo die alte stand). Würde man
     * abwechselnd räumen und setzen, löschte das Räumen eine gerade gesetzte
     * Figur wieder weg. Dieselbe Falle wie bei der Rochade auf schmalen
     * Brettern (siehe docs\DECISIONS.md).
     */
    _handelAusfuehren(runde, farbe) {
        const angebot = SCHACH_RUNDE.handelsAngebot(runde, farbe);
        if (!angebot) {
            return null;
        }

        let brett = runde.stand.brett;

        for (const feld of angebot.gibtFelder) {
            brett = SCHACH._brettMit(brett, feld, ".");
        }

        /* Die Plätze werden der Reihe nach vergeben — erst die erste
           Figurenart, dann die nächste (seit v0.58 können es mehrere sein). */
        let stelle = 0;
        let bringtKoenig = false;

        for (const teil of SCHACH_VARIANTEN.handelSeite(angebot.bekommt)) {
            const figur = (farbe === "weiss") ? teil.art : teil.art.toLowerCase();

            if (teil.art === "K") {
                bringtKoenig = true;
            }

            for (let nummer = 0; nummer < teil.anzahl; nummer++) {
                brett = SCHACH._brettMit(brett, angebot.bekommtFelder[stelle], figur);
                stelle++;
            }
        }

        const stand = Object.assign({}, runde.stand, { brett: brett, enPassant: "" });

        /*
         * Ein erhandelter König ist ein zweites LEBEN, kein unschlagbarer
         * Klotz — derselbe Schalter wie bei der Verstärkung (siehe
         * `SCHACH.koenigSchlagbarFuer`). Ohne ihn wäre „Schachmatt" nicht mehr
         * eindeutig.
         */
        if (bringtKoenig) {
            stand.koenigeAlsLeben = true;
        }

        return {
            stand: stand,
            felder: angebot.gibtFelder.concat(angebot.bekommtFelder)
                .filter((feld, stelle2, alle) => alle.indexOf(feld) === stelle2),
            text: angebot.text
        };
    },

    /* Wohin die eingetauschten Figuren kommen: erst die frei werdenden Felder,
       dann freie Felder der eigenen Grundreihe. */
    _handelsPlaetze(runde, farbe, gibtFelder, anzahl) {
        const stand = runde.stand;
        const breite = SCHACH.breiteVon(stand);
        const hoehe = SCHACH.hoeheVon(stand);
        const plaetze = gibtFelder.slice(0, anzahl);

        if (plaetze.length >= anzahl) {
            return plaetze;
        }

        const grundreihe = (farbe === "weiss") ? hoehe - 1 : 0;

        for (let spalte = 0; spalte < breite && plaetze.length < anzahl; spalte++) {
            const feld = SCHACH._feld(stand, grundreihe, spalte);

            if (SCHACH.figurAuf(stand, feld) === "."
                && !SCHACH.mauerAuf(stand, feld)
                && plaetze.indexOf(feld) === -1) {
                plaetze.push(feld);
            }
        }

        return plaetze;
    },

    _verlaufKuerzen(runde) {
        while (runde.verlauf.length > SCHACH_RUNDE.VERLAUF_LAENGE) {
            runde.verlauf.shift();
        }
    },

    /* ---------------------------------------------------------------- *
     * Teams
     * ---------------------------------------------------------------- */

    /* In welchem Team ist der Spieler? "" wenn in keinem. */
    teamVon(runde, spielerId) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        if (stand.teams.weiss.indexOf(spielerId) !== -1) {
            return "weiss";
        }
        if (stand.teams.schwarz.indexOf(spielerId) !== -1) {
            return "schwarz";
        }
        return "";
    },

    /*
     * Tritt einem Team bei — auch mitten im Spiel, das ist ausdrücklich
     * gewollt. Ein Wechsel entfernt aus dem anderen Team.
     */
    teamBeitreten(runde, spielerId, farbe, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        if (!spielerId || (farbe !== "weiss" && farbe !== "schwarz")) {
            return neu;
        }

        /*
         * Wer schon in einem Team ist, bleibt darin. Ein Wechsel mitten in der
         * Partie hiesse: erst für die eine Seite ziehen, dann für die andere —
         * bei einer Partie, die über Tage läuft, ist das keine theoretische
         * Möglichkeit. Wer wirklich raus will, verlässt das Team ausdrücklich.
         */
        const bisher = SCHACH_RUNDE.teamVon(neu, spielerId);
        if (bisher && bisher !== farbe) {
            return neu;
        }

        neu.teams.weiss = neu.teams.weiss.filter((id) => id !== spielerId);
        neu.teams.schwarz = neu.teams.schwarz.filter((id) => id !== spielerId);
        neu.teams[farbe].push(spielerId);

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    teamVerlassen(runde, spielerId, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);
        neu.teams.weiss = neu.teams.weiss.filter((id) => id !== spielerId);
        neu.teams.schwarz = neu.teams.schwarz.filter((id) => id !== spielerId);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    bereitSetzen(runde, farbe, bereit, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        if (farbe !== "weiss" && farbe !== "schwarz") {
            return neu;
        }
        neu.bereit[farbe] = (bereit === true);

        /* Sobald beide Seiten bereit sind und in jedem Team jemand steht,
           beginnt die Partie von selbst. */
        if (SCHACH_RUNDE.kannStarten(neu)) {
            neu.laeuft = true;

            /* Nur beim ERSTEN Start setzen: „Neu aufstellen" soll die
               Spieldauer nicht zurückdrehen. */
            if (!neu.gestartetAm) {
                neu.gestartetAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
            }
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    kannStarten(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        return stand.teams.weiss.length > 0
            && stand.teams.schwarz.length > 0
            && stand.bereit.weiss
            && stand.bereit.schwarz;
    },

    /*
     * Darf dieser Spieler diese Fähigkeit gerade einsetzen? (seit v3.6)
     *
     * Die Regel war bis dahin dieselbe wie fürs Ziehen: nur, wenn das eigene
     * Team am Zug ist. Seit v3.6 gibt es Fähigkeiten mit `imGegenzug` — sie
     * gehen auch, während der Gegner überlegt. Sie kosten keinen Zug und
     * nehmen niemandem etwas weg; was sie erzeugen, ist ein Rennen: Wer
     * zuerst drückt, war zuerst. Abgesichert ist es über denselben Zugzähler,
     * mit dem sich auch zwei Züge aus einem Team nicht überholen können.
     */
    darfEinsetzen(runde, spielerId, art) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        if (!beschreibung) {
            return false;
        }

        /*
         * EIN LEERER FRIEDHOF GIBT NICHTS HER (seit v0.59, Wunsch #19).
         *
         * Drei Fähigkeiten holen Gefallene zurück, und jede verbraucht ihren
         * Eintrag dabei: Friedhof (gegnerische Gefallene), Wiederbelebung
         * (eigene, an ihrem Grab) und Wiedergeburt (eigene, auf der
         * Grundreihe). Ist die Liste leer, kommt nichts mehr — bis v0.58 liess
         * sich die Fähigkeit trotzdem antippen, das Brett zeigte kein einziges
         * Zielfeld, und man stand ohne Erklärung da.
         */
        if (!SCHACH_RUNDE._gefalleneVorhanden(stand, spielerId, art)) {
            return false;
        }

        /*
         * NUR IM GEGENZUG (seit v0.58) — bisher nur das Ausweichen.
         *
         * Es ist die Notbremse: eine Figur weicht aus, während der Gegner
         * zuschlägt. Bis v0.57 durfte man es AUCH im eigenen Zug einsetzen und
         * behielt dabei seinen Zug — damit war es ein geschenktes Extra-Feld
         * für jede Figur, jederzeit. Als Notbremse gedacht, als Gratis-Zug
         * benutzt.
         *
         * Der Schalter steht vor der Zug-Prüfung, denn er DREHT sie um: Wer am
         * Zug ist, darf gerade NICHT.
         */
        if (beschreibung.nurImGegenzug) {
            return stand.laeuft && !stand.ergebnis
                && !!SCHACH_RUNDE.teamVon(stand, spielerId)
                && stand.stand.amZug !== SCHACH_RUNDE.teamVon(stand, spielerId);
        }

        if (SCHACH_RUNDE.darfZiehen(stand, spielerId)) {
            return true;
        }
        if (!beschreibung.imGegenzug) {
            return false;
        }

        /* Im Gegenzug genügt: Die Partie läuft und man ist in einem Team. */
        return stand.laeuft && !stand.ergebnis
            && !!SCHACH_RUNDE.teamVon(stand, spielerId);
    },

    /*
     * Hat diese Fähigkeit überhaupt noch jemanden zum Zurückholen? (seit v0.59)
     *
     * Die Frage steht hier im Modell, weil sie eine Regel ist — der Bildschirm
     * fragt nur. Sie ist bewusst BILLIG gerechnet: eine Listenlänge, keine
     * Feld-für-Feld-Probe wie `zielFelder`. `darfEinsetzen` läuft bei jedem
     * Neuzeichnen für jede Fähigkeit im Vorrat; auf dem Doppelbrett wären das
     * sonst mehrere hundert Probeläufe je Bild.
     *
     * Für alle anderen Fähigkeiten liefert sie `true` — sie hängen an keinem
     * Vorrat.
     */
    _gefalleneVorhanden(runde, spielerId, art) {
        if (art !== "friedhof" && art !== "wiederbelebung" && art !== "wiedergeburt") {
            return true;
        }

        /* Erst hier normalisieren: Für alle anderen Fähigkeiten wäre es
           verschenkte Arbeit, und die Frage kommt bei jedem Neuzeichnen. */
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const farbe = SCHACH_RUNDE.teamVon(stand, spielerId);
        if (!farbe) {
            return true;
        }

        if (art === "friedhof") {
            return (stand.gefallen[SCHACH.gegner(farbe)] || []).length > 0;
        }
        if (art === "wiederbelebung") {
            return (stand.gefallen[farbe] || []).length > 0;
        }
        return (stand.verloren[farbe] || []).length > 0;
    },

    /*
     * Bleibt dieser Seite nach dem Einsetzen ihr normaler Zug? (seit v0.41)
     *
     * Das ist die Frage, die das Pluszeichen am Vorrat beantwortet. Bis v0.40
     * zeigte der Bildschirm es einfach immer, wenn `beendetZug` fehlte — und
     * lag damit in zwei Fällen falsch:
     *
     *   - Wer im GEGNERZUG eine Blitz-Fähigkeit einsetzt (Ausweichen), ist
     *     danach nicht am Zug. Er war es vorher schon nicht. Ein Pluszeichen
     *     versprach dort einen Zug, den es nicht gibt.
     *   - Umgekehrt: Wer den Doppelzug offen hat, BEHÄLT den Zug sogar bei
     *     einer Fähigkeit mit `beendetZug` — `faehigkeitEinsetzen` verbraucht
     *     dann den Doppelzug statt den Zug abzugeben.
     *
     * Die Antwort steht deshalb hier im Modell, mit derselben Rechnung wie
     * beim Einsetzen selbst. Der Bildschirm fragt nur noch.
     */
    behaeltZug(runde, farbe, art) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        if (!beschreibung || !stand.laeuft || stand.ergebnis) {
            return false;
        }
        if (stand.stand.amZug !== farbe) {
            return false;
        }

        /*
         * `istDerZug` (Sprung, Teleport seit v0.48): Man bleibt zwar am Zug,
         * aber der Zug gehört der Fähigkeit — NORMAL ziehen kann man danach
         * nicht mehr. Genau das verspricht das Pluszeichen, also darf es hier
         * nicht stehen.
         */
        if (beschreibung.istDerZug) {
            return false;
        }

        /*
         * `nurImGegenzug` (seit v0.58): Wer am Zug ist, darf sie gar nicht
         * einsetzen — dann gibt es auch nichts zu behalten. Deshalb fällt das
         * Pluszeichen von selbst weg, ohne dass jemand es wegnehmen musste.
         */
        if (beschreibung.nurImGegenzug) {
            return false;
        }
        if (!beschreibung.beendetZug) {
            return true;
        }
        return stand.stand.extraZug === farbe;
    },

    /* Darf dieser Spieler gerade ziehen? */
    darfZiehen(runde, spielerId) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (!stand.laeuft || stand.ergebnis) {
            return false;
        }
        const team = SCHACH_RUNDE.teamVon(stand, spielerId);
        if (!team) {
            return false;
        }
        return team === stand.stand.amZug;
    },

    /* ---------------------------------------------------------------- *
     * Ziehen
     * ---------------------------------------------------------------- */

    /*
     * Führt einen Zug aus. Liefert die neue Runde oder null, wenn der Zug
     * nicht erlaubt ist (falsches Team, Partie nicht am Laufen, Regelverstoss).
     *
     * `wer` ist der Anzeigename für den Verlauf — nur Beiwerk, die Regeln
     * hängen nicht daran.
     */
    ziehen(runde, spielerId, von, nach, umwandlung, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        /* Was auf dem Zielfeld steht, muss VOR dem Zug abgelesen werden. */
        const geschlagen = SCHACH.artVon(SCHACH.figurAuf(alt.stand, nach));

        const ergebnis = SCHACH.ziehen(alt.stand, von, nach, umwandlung);
        if (!ergebnis) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        const farbe = alt.stand.amZug;

        neu.stand = ergebnis.stand;
        neu.zugZaehler = alt.zugZaehler + 1;

        /* Ein Zug beendet jede offene Abstimmung. */
        neu.vorschlag = null;

        /*
         * Verlorene Figuren merken — die Wiedergeburt holt sie zurück.
         *
         * Zweimal, weil zwei Fähigkeiten Verschiedenes brauchen: `verloren` nur
         * die Art (Bilanz, Beute, Grundreihen-Wiedergeburt), `gefallen`
         * zusätzlich das Feld (Wiederbelebung an Ort und Stelle).
         */
        if (geschlagen) {
            neu.verloren[SCHACH.gegner(farbe)].push(geschlagen);
            neu.gefallen[SCHACH.gegner(farbe)].push({ art: geschlagen, feld: nach });
        } else if (ergebnis.zug.enPassant) {
            neu.verloren[SCHACH.gegner(farbe)].push("B");

            /* Beim en passant fällt der Bauer NICHT auf dem Zielfeld, sondern
               auf dem Feld, das er beim Doppelschritt übersprungen hat. */
            const geschlagenesFeld = Number.isInteger(ergebnis.zug.enPassantFeld)
                ? ergebnis.zug.enPassantFeld
                : nach;
            neu.gefallen[SCHACH.gegner(farbe)].push({ art: "B", feld: geschlagenesFeld });
        }

        /* Bei der Rochade bewegen sich zwei Figuren — beide bekommen ihren
           Pfeil. */
        const wege = [{ von: von, nach: nach }];
        if (ergebnis.zug.rochade && Number.isInteger(ergebnis.zug.turmVon)) {
            wege.push({ von: ergebnis.zug.turmVon, nach: ergebnis.zug.turmNach });
        }

        /*
         * Der Eintrag wird als OBJEKT gemerkt, nicht über seine Stelle: Ein
         * Riss kann den Zug gleich noch verkürzen (siehe unten), und dann muss
         * genau dieser Eintrag nachgeführt werden. Die Stelle verschiebt sich
         * beim Kürzen des Verlaufs.
         */
        const zugEintrag = {
            text: ergebnis.text,
            wer: wer || "",
            farbe: farbe,
            von: von,
            nach: nach,
            wege: wege
        };

        neu.verlauf.push(zugEintrag);
        SCHACH_RUNDE._verlaufKuerzen(neu);

        /* Würfel einsammeln — auf dem ganzen Weg, nicht nur auf dem Zielfeld. */
        const pechFelder = SCHACH_RUNDE._bonusEinsammeln(
            neu, alt.stand, von, nach, farbe, wer);

        /*
         * Hat der eingesammelte Würfel den weiteren Weg gesperrt, endet der Zug
         * vor dem Hindernis (seit v0.58).
         */
        SCHACH_RUNDE._zugAmRissAbbrechen(neu, alt.stand, von, nach, farbe,
            geschlagen, ergebnis.zug, zugEintrag, pechFelder);

        /* Und alle paar Züge erscheint ein neuer Würfel. */
        SCHACH_RUNDE._bonusNachziehen(neu);

        /* Ist die Partie damit vorbei? */
        const lage = SCHACH.lage(neu.stand);
        if (lage.art === "matt") {
            neu.ergebnis = lage.sieger;
            neu.laeuft = false;
        } else if (lage.art === "patt" || lage.art === "remis") {
            neu.ergebnis = "remis";
            neu.laeuft = false;
        }

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * DER ZUG BRICHT AM RISS AB (seit v0.58).
     *
     * Ein Unglückswürfel „Erdbeben" reisst den Boden auf, sobald er
     * eingesammelt wird — und eingesammelt wird er seit v0.53 auch im
     * VORBEIZIEHEN. Wer also mit dem Turm über ihn hinweggleitet, öffnet die
     * Löcher mitten in seinem eigenen Weg. Liegt eines davon noch vor ihm,
     * kommt er nicht mehr daran vorbei: Der Zug endet auf dem letzten freien
     * Feld davor.
     *
     * WARUM DAS HIER STEHT UND NICHT IN `SCHACH.zuege`: Es ist keine Frage der
     * Zugerzeugung. Als der Zug gewählt wurde, war der Weg frei — die Sperre
     * entsteht erst währenddessen. `zuege` bleibt damit unverändert; die
     * Anzeige der möglichen Züge lügt nicht, sie kann es nur nicht wissen.
     *
     * DER SCHLAG FÄLLT MIT AUS. Wer sein Ziel nicht erreicht, schlägt dort auch
     * nichts — die geschlagene Figur kommt zurück aufs Brett und aus den
     * Verlustlisten heraus. Alles andere wäre ein Angriff aus der Ferne.
     *
     * Ausgeschlossen sind drei Fälle:
     *   - Sprünge und Ein-Feld-Züge: Dort gibt es keinen Weg zum Abbrechen.
     *   - die Rochade: Dabei bewegen sich zwei Figuren, und der König geht
     *     nie über einen Würfel (dazwischen darf nichts stehen).
     *   - ein Würfel, der die Brettgrösse geändert hat (Ausdehnung, Einsturz):
     *     Danach zeigen alle gemerkten Feldnummern woanders hin.
     */
    _zugAmRissAbbrechen(runde, altStand, von, nach, farbe, geschlagen, zug,
        zugEintrag, pechFelder) {

        if (zug && zug.rochade) {
            return false;
        }
        if (SCHACH.felderVon(runde.stand) !== SCHACH.felderVon(altStand)) {
            return false;
        }
        if (!Array.isArray(pechFelder) || pechFelder.length === 0) {
            return false;
        }

        const weg = SCHACH.betreteneFelder(altStand, von, nach);
        if (weg.length < 2) {
            return false;
        }

        /*
         * AB WO ZÄHLT EINE SPERRE? Erst ab dem Feld, auf dem der Würfel lag.
         *
         * Vorher war die Figur schon vorbei — ein Riss, der HINTER ihr
         * aufgeht, hält sie nicht auf. Genau das ist beim Bauen zuerst
         * passiert: Der Turm blieb auf seinem Startfeld stehen, weil das
         * Erdbeben zufällig auch ein Feld hinter ihm erwischt hatte.
         */
        let ab = -1;
        for (const feld of pechFelder) {
            const stelle = weg.indexOf(feld);
            if (stelle !== -1 && (ab === -1 || stelle < ab)) {
                ab = stelle;
            }
        }
        if (ab === -1) {
            return false;
        }

        /* Das erste gesperrte Feld HINTER dem Würfel. */
        let sperre = -1;
        for (let stelle = ab + 1; stelle < weg.length; stelle++) {
            if (SCHACH.gesperrt(runde.stand, weg[stelle])) {
                sperre = stelle;
                break;
            }
        }
        if (sperre === -1) {
            return false;
        }

        /*
         * Wo bleibt die Figur stehen? Auf dem letzten freien Feld davor —
         * notfalls auf ihrem Startfeld. Rückwärts gesucht, weil der Riss auch
         * mehrere Felder hintereinander treffen kann und die Figur nie AUF
         * einem Riss enden darf.
         */
        let halt = -1;
        for (let stelle = sperre - 1; stelle >= 0 && halt === -1; stelle--) {
            if (!SCHACH.gesperrt(runde.stand, weg[stelle])) {
                halt = weg[stelle];
            }
        }
        if (halt === -1 && !SCHACH.gesperrt(runde.stand, von)) {
            halt = von;
        }
        if (halt === -1 || halt === nach) {
            /* Nirgends Platz: Dann bleibt der Zug lieber, wie er war — eine
               Figur ohne Feld wäre schlimmer als ein Zug zu viel. */
            return false;
        }

        /*
         * Zurückgesetzt wird auf die URSPRÜNGLICHE Figur: Ein Bauer, der sein
         * Umwandlungsfeld nicht erreicht, bleibt ein Bauer.
         */
        const urspruenglich = SCHACH.figurAuf(altStand, von);
        let brett = SCHACH._brettMit(runde.stand.brett, nach, ".");
        brett = SCHACH._brettMit(brett, halt, urspruenglich);

        if (geschlagen) {
            const zurueck = (farbe === SCHACH.WEISS)
                ? geschlagen.toLowerCase()
                : geschlagen;

            brett = SCHACH._brettMit(brett, nach, zurueck);
            SCHACH_RUNDE._verlustZuruecknehmen(runde, SCHACH.gegner(farbe),
                geschlagen, nach);
        }

        runde.stand = Object.assign({}, runde.stand, {
            brett: brett,
            enPassant: "",

            /* Eine geliehene Figur nimmt ihren Eintrag mit — auch auf dem
               verkürzten Weg (siehe `_geliehenNachfuehren`). */
            geliehen: SCHACH.geliehene(runde.stand).map((eintrag) =>
                (eintrag.feld === nach) ? { feld: halt, bis: eintrag.bis } : eintrag)
        });

        /* Der Zug im Verlauf endet jetzt woanders — sonst wandert die Figur am
           Bildschirm auf ein Feld, auf dem sie gar nicht steht. */
        const breite = SCHACH.breiteVon(runde.stand);
        const hoehe = SCHACH.hoeheVon(runde.stand);

        zugEintrag.nach = halt;
        zugEintrag.wege = [{ von: von, nach: halt }];
        zugEintrag.text += ", abgebrochen auf " + SCHACH.feldName(halt, breite, hoehe);

        /* Und der Unglückswürfel erklärt, warum: Sein Eintrag steht am Ende
           des Verlaufs und bekommt das Haltefeld dazu. */
        const letzter = runde.verlauf[runde.verlauf.length - 1];
        if (letzter && letzter.wirkung === "pech") {
            letzter.text += " — der Zug bricht davor ab";

            if (letzter.felder.indexOf(halt) === -1) {
                letzter.felder.push(halt);
            }
        }

        return true;
    },

    /*
     * Nimmt einen Verlust zurück, wenn der Schlag doch nicht stattgefunden hat
     * (Zugabbruch am Riss). Entfernt je einen Eintrag aus beiden Listen —
     * `gefallen` über das Feld, `verloren` über die Art.
     */
    _verlustZuruecknehmen(runde, farbe, art, feld) {
        const gefallen = runde.gefallen[farbe] || [];

        for (let stelle = gefallen.length - 1; stelle >= 0; stelle--) {
            if (gefallen[stelle].feld === feld && gefallen[stelle].art === art) {
                gefallen.splice(stelle, 1);
                break;
            }
        }

        const verloren = runde.verloren[farbe] || [];
        const stelle = verloren.lastIndexOf(art);

        if (stelle !== -1) {
            verloren.splice(stelle, 1);
        }
    },

    /* ---------------------------------------------------------------- *
     * Abstimmung im Team (nur wenn `regeln.einigkeit` gesetzt ist)
     *
     * Die Hausregel lautet sonst: Wer zuerst zieht, hat gezogen. Wer diese
     * Partie mit Einigkeit angelegt hat, will genau das nicht — dann wird ein
     * Zug erst vorgeschlagen und ausgeführt, sobald ALLE aus dem Team am Zug
     * zugestimmt haben. Der Vorschlagende stimmt automatisch mit zu.
     *
     * Der Vorschlag steht im gemeinsamen Stand: Anders als ein Vorzug ist er
     * kein Geheimnis — das eigene Team muss ihn ja sehen, und dass der Gegner
     * mitliest, ist der Preis dieser Einstellung. Sie steht deshalb in der
     * Auswahl mit diesem Hinweis.
     * ---------------------------------------------------------------- */

    brauchtEinigkeit(runde) {
        return SCHACH_RUNDE.normalisieren(runde).regeln.einigkeit === true;
    },

    /*
     * Wie lange das Team für diese Abstimmung Zeit hat (in Millisekunden).
     *
     * Maßgeblich ist der Säumigste: Wer wiederholt nicht abstimmt, verkürzt die
     * Frist für alle — sonst könnte ein Team mit zwei Leuten gar nichts mehr
     * tun, sobald einer aufhört mitzuspielen.
     */
    fristFuer(runde, farbe) {
        const stand = SCHACH_RUNDE.normalisieren(runde);
        let hoechste = 0;

        for (const id of stand.teams[farbe]) {
            hoechste = Math.max(hoechste, stand.versaeumt[id] || 0);
        }

        const stufe = Math.min(
            Math.floor(hoechste / SCHACH_RUNDE.FRIST_NACH_VERSAEUMNISSEN),
            SCHACH_RUNDE.FRIST_SEKUNDEN.length - 1);

        return SCHACH_RUNDE.FRIST_SEKUNDEN[stufe] * 1000;
    },

    /*
     * Schlägt einen Zug vor. Ist man allein im Team, wird er sofort ausgeführt —
     * Einigkeit mit sich selbst ist keine Abstimmung wert.
     * Liefert die neue Runde oder null.
     */
    zugVorschlagen(runde, spielerId, von, nach, umwandlung, wer, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }
        if (!SCHACH_RUNDE.brauchtEinigkeit(alt)) {
            return SCHACH_RUNDE.ziehen(alt, spielerId, von, nach, umwandlung, wer, zeitpunkt);
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        if (alt.teams[farbe].length <= 1) {
            return SCHACH_RUNDE.ziehen(alt, spielerId, von, nach, umwandlung, wer, zeitpunkt);
        }

        /* Der Zug muss regelkonform sein — sonst stimmt das Team über etwas ab,
           das gar nicht geht. */
        if (!SCHACH.ziehen(alt.stand, von, nach, umwandlung)) {
            return null;
        }

        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        const neu = SCHACH_RUNDE.kopieren(alt);

        neu.vorschlag = {
            art: "zug",
            faehigkeit: "",
            zielFeld: -1,
            von: von,
            nach: nach,
            umwandlung: umwandlung || "D",
            wer: spielerId,
            name: wer || "",
            zugZaehler: alt.zugZaehler,
            frist: wann + SCHACH_RUNDE.fristFuer(alt, farbe),
            stimmen: [spielerId]
        };

        neu.geaendertAm = wann;
        return neu;
    },

    /*
     * Schlägt den Einsatz einer Fähigkeit vor. Wie beim Zug: allein im Team
     * wird sofort eingesetzt, sonst wird abgestimmt.
     */
    faehigkeitVorschlagen(runde, spielerId, art, zielFeld, wer, zeitpunkt, umwandlung) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!SCHACH_RUNDE.darfEinsetzen(alt, spielerId, art)) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        /*
         * Über eine Fähigkeit, die im Gegenzug geht, wird NICHT abgestimmt.
         *
         * Sie lebt davon, schnell zu sein: Bis das Team sich einig ist, hat
         * der Gegner längst gezogen. Und die Abstimmung selbst läuft über den
         * Zugzähler — der wandert beim gegnerischen Zug weiter und macht
         * jeden offenen Vorschlag ungültig.
         */
        if (!SCHACH_RUNDE.brauchtEinigkeit(alt) || alt.teams[farbe].length <= 1
            || beschreibung.imGegenzug) {
            return SCHACH_RUNDE.faehigkeitEinsetzen(
                alt, spielerId, art, zielFeld, wer, zeitpunkt, umwandlung);
        }

        /* Erst prüfen, ob sie überhaupt einsetzbar wäre. */
        if (!SCHACH_RUNDE.faehigkeitEinsetzen(alt, spielerId, art, zielFeld, wer,
            zeitpunkt, umwandlung)) {
            return null;
        }

        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        const neu = SCHACH_RUNDE.kopieren(alt);

        neu.vorschlag = {
            art: "faehigkeit",
            faehigkeit: art,
            zielFeld: Number.isInteger(zielFeld) ? zielFeld : -1,
            von: -1,
            nach: -1,

            /* Auch die Wahl beim Bauernschub gehört in den Vorschlag: Das Team
               stimmt über die fertige Handlung ab, nicht über die halbe. */
            umwandlung: (SCHACH.UMWANDLUNGEN.indexOf(umwandlung) !== -1)
                ? umwandlung : "D",

            wer: spielerId,
            name: wer || "",
            zugZaehler: alt.zugZaehler,
            frist: wann + SCHACH_RUNDE.fristFuer(alt, farbe),
            stimmen: [spielerId]
        };

        neu.geaendertAm = wann;
        return neu;
    },

    /*
     * Stimmt dem offenen Vorschlag zu. Sobald ALLE aus dem Team am Zug
     * zugestimmt haben, wird gezogen.
     */
    zugMittragen(runde, spielerId, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!alt.vorschlag || !SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }
        /* Ein Vorschlag von vor dem letzten Zug ist überholt. */
        if (alt.vorschlag.zugZaehler !== alt.zugZaehler) {
            return null;
        }

        const farbe = SCHACH_RUNDE.teamVon(alt, spielerId);
        const neu = SCHACH_RUNDE.kopieren(alt);

        if (neu.vorschlag.stimmen.indexOf(spielerId) === -1) {
            neu.vorschlag.stimmen.push(spielerId);
        }

        /* Wer mitstimmt, ist wieder dabei: Sein Säumnis-Zähler beginnt von
           vorn, und damit auch die volle Frist. */
        delete neu.versaeumt[spielerId];

        const fehlen = neu.teams[farbe]
            .filter((id) => neu.vorschlag.stimmen.indexOf(id) === -1);

        if (fehlen.length > 0) {
            neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
            return neu;
        }

        return SCHACH_RUNDE._vorschlagAusfuehren(neu, zeitpunkt);
    },

    /*
     * Die Frist ist abgelaufen: Der Vorschlag geht durch, auch ohne alle
     * Stimmen. Wer nicht abgestimmt hat, bekommt einen Strich — beim nächsten
     * Mal ist die Frist dadurch kürzer.
     *
     * Ausgelöst wird das vom ERSTEN Gerät, das den Ablauf bemerkt; die Prüfung
     * über den Zugzähler beim Schreiben sorgt dafür, dass es trotzdem nur
     * einmal passiert.
     */
    fristAbgelaufen(runde, jetzt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!alt.vorschlag || alt.vorschlag.zugZaehler !== alt.zugZaehler) {
            return null;
        }
        if (!alt.vorschlag.frist || jetzt < alt.vorschlag.frist) {
            return null;
        }

        const farbe = alt.stand.amZug;
        const neu = SCHACH_RUNDE.kopieren(alt);

        for (const id of neu.teams[farbe]) {
            if (neu.vorschlag.stimmen.indexOf(id) === -1) {
                neu.versaeumt[id] = (neu.versaeumt[id] || 0) + 1;
            }
        }

        return SCHACH_RUNDE._vorschlagAusfuehren(neu, jetzt);
    },

    /* Führt den offenen Vorschlag aus — Zug oder Fähigkeit. */
    _vorschlagAusfuehren(runde, zeitpunkt) {
        const vorschlag = runde.vorschlag;
        runde.vorschlag = null;

        const ergebnis = (vorschlag.art === "faehigkeit")
            ? SCHACH_RUNDE.faehigkeitEinsetzen(runde, vorschlag.wer, vorschlag.faehigkeit,
                vorschlag.zielFeld, vorschlag.name, zeitpunkt, vorschlag.umwandlung)
            : SCHACH_RUNDE.ziehen(runde, vorschlag.wer, vorschlag.von, vorschlag.nach,
                vorschlag.umwandlung, vorschlag.name, zeitpunkt);

        if (!ergebnis) {
            /* Inzwischen nicht mehr möglich — der Vorschlag fällt weg. */
            runde.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
            return runde;
        }

        /* Die Säumnis-Zähler aus der Abstimmung müssen mitgenommen werden:
           `ziehen` und `faehigkeitEinsetzen` arbeiten auf einer Kopie. */
        ergebnis.versaeumt = runde.versaeumt;
        return ergebnis;
    },

    /* Verwirft den offenen Vorschlag. */
    vorschlagVerwerfen(runde, spielerId, zeitpunkt) {
        const alt = SCHACH_RUNDE.normalisieren(runde);

        if (!alt.vorschlag || !SCHACH_RUNDE.darfZiehen(alt, spielerId)) {
            return null;
        }

        const neu = SCHACH_RUNDE.kopieren(alt);
        neu.vorschlag = null;
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Neue Partie: Brett zurück, Teams bleiben, Bereitschaft muss neu kommen. */
    neuePartie(runde, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);
        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;

        neu.stand = SCHACH.neuerStand(neu.variante);

        /* Eine zweite Partie in derselben Runde bekommt eine ANDERE Armee —
           sonst spielte man dieselbe Aufstellung noch einmal. Deshalb geht der
           Zeitpunkt in die Rechnung ein. Das Brett steht danach im gemeinsamen
           Stand; nachgerechnet wird es nirgends mehr, es kann also gar nicht
           auseinanderlaufen. */
        SCHACH_RUNDE.kreuzAufstellen(neu, "|neu|" + wann);
        SCHACH_RUNDE.armeeAufstellen(neu, "|neu|" + wann);

        neu.zugZaehler = 0;
        neu.laeuft = false;
        neu.ergebnis = "";
        neu.bereit = { weiss: false, schwarz: false };
        neu.faehigkeiten = { weiss: [], schwarz: [] };
        neu.bonusGesammelt = [];
        neu.bonus = [];
        neu.bonusFassung = SCHACH_RUNDE.BONUS_FASSUNG;
        /* Auch die Abklingzeiten fangen von vorn an — der Takt tut es ja
           ebenfalls (neuer Stand). */
        neu.stufeZuletzt = {};
        neu.verloren = { weiss: [], schwarz: [] };
        neu.verlauf = [];

        neu.geaendertAm = wann;
        return neu;
    },

    /* Aufgeben — die andere Seite gewinnt. */
    aufgeben(runde, farbe, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);

        if (farbe !== "weiss" && farbe !== "schwarz") {
            return neu;
        }
        if (!neu.laeuft) {
            return neu;
        }

        neu.ergebnis = (farbe === "weiss") ? "schwarz" : "weiss";
        neu.laeuft = false;
        neu.verlauf.push({
            text: ((farbe === "weiss") ? "Weiss" : "Schwarz") + " gibt auf",
            wer: "",
            farbe: farbe,
            von: -1,
            nach: -1
        });

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Umbenennen — nur Beiwerk, ändert nichts am Spiel. */
    umbenennen(runde, titel, zeitpunkt) {
        const neu = SCHACH_RUNDE.kopieren(runde);
        neu.titel = String(titel || "").trim().substring(0, 40);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /* Kurzer Satz über den Stand der Partie, für die Übersicht. */
    kurzfassung(runde) {
        const stand = SCHACH_RUNDE.normalisieren(runde);

        if (stand.ergebnis === "remis") {
            return "Unentschieden";
        }
        if (stand.ergebnis) {
            return (stand.ergebnis === "weiss") ? "Weiss hat gewonnen" : "Schwarz hat gewonnen";
        }
        if (stand.laeuft) {
            return ((stand.stand.amZug === "weiss") ? "Weiss" : "Schwarz")
                + " ist am Zug (Zug " + stand.stand.zugNummer + ")";
        }
        if (stand.teams.weiss.length === 0 && stand.teams.schwarz.length === 0) {
            return "Wartet auf Mitspieler";
        }
        return "Noch nicht gestartet";
    },

    /* ---------------------------------------------------------------- *
     * Vergleich (steuert das Neuzeichnen)
     * ---------------------------------------------------------------- */

    inhaltGleich(a, b) {
        const einsA = SCHACH_RUNDE.normalisieren(a);
        const einsB = SCHACH_RUNDE.normalisieren(b);

        return einsA.id === einsB.id
            && einsA.titel === einsB.titel
            && einsA.stand.brett === einsB.stand.brett
            && einsA.stand.amZug === einsB.stand.amZug
            && einsA.stand.sprungAktiv === einsB.stand.sprungAktiv
            && einsA.stand.extraZug === einsB.stand.extraZug
            && einsA.zugZaehler === einsB.zugZaehler
            && einsA.laeuft === einsB.laeuft
            && einsA.ergebnis === einsB.ergebnis
            && einsA.bereit.weiss === einsB.bereit.weiss
            && einsA.bereit.schwarz === einsB.bereit.schwarz
            && einsA.teams.weiss.join(",") === einsB.teams.weiss.join(",")
            && einsA.teams.schwarz.join(",") === einsB.teams.schwarz.join(",")
            && einsA.faehigkeiten.weiss.join(",") === einsB.faehigkeiten.weiss.join(",")
            && einsA.faehigkeiten.schwarz.join(",") === einsB.faehigkeiten.schwarz.join(",")
            && SCHACH_RUNDE._vorschlagText(einsA) === SCHACH_RUNDE._vorschlagText(einsB)
            && SCHACH_RUNDE._bonusText(einsA) === SCHACH_RUNDE._bonusText(einsB)
            && einsA.stand.schildFeld === einsB.stand.schildFeld
            && einsA.stand.fesselFeld === einsB.stand.fesselFeld;
    },

    /* Der offene Vorschlag als Zeichenkette — ändert er sich, wird neu gezeichnet. */
    _vorschlagText(runde) {
        if (!runde.vorschlag) {
            return "";
        }
        return runde.vorschlag.von + ">" + runde.vorschlag.nach
            + "@" + runde.vorschlag.zugZaehler
            + ":" + runde.vorschlag.stimmen.slice().sort().join(",");
    },

    _bonusText(runde) {
        return runde.bonus
            .map((eintrag) => eintrag.feld + ":" + eintrag.art + ":" + (eintrag.stufe || ""))
            .sort().join(",");
    },

    /*
     * Die Seltenheitsstufe eines Würfels auf dem Brett — für die Farbe, in der
     * er gezeichnet wird.
     *
     * Seit v3.6 trägt ein Fähigkeitswürfel nur noch seine Stufe; ältere und
     * alle Unglückswürfel tragen ihre Art. Beides muss dieselbe Frage
     * beantworten, deshalb steht sie hier an einer Stelle und nicht dreimal
     * im Bildschirm-Code.
     */
    bonusStufe(bonus) {
        if (!bonus) {
            return SCHACH_VARIANTEN.STUFE_UNBEKANNT;
        }
        if (bonus.pech) {
            return SCHACH_VARIANTEN.pechStufeVon(bonus.art);
        }
        if (bonus.art) {
            return SCHACH_VARIANTEN.stufeVon(bonus.art);
        }
        return SCHACH_VARIANTEN.STUFEN.find((stufe) => stufe.id === bonus.stufe)
            || SCHACH_VARIANTEN.STUFE_UNBEKANNT;
    }
};

/* Für die Tests ausserhalb des Browsers. SCHACH und SCHACH_VARIANTEN müssen
   dort vorher als globale Größen bereitstehen — genau wie im Browser. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_RUNDE;
}
