/*
 * schach-vorschau.js — die Bildanleitung zu jeder Fähigkeit (seit v0.41).
 *
 * Zu jeder Fähigkeit und zu jedem Unglückswürfel gibt es zwei Bilder: VORHER
 * und NACHHER, auf einem kleinen Beispielbrett.
 *
 * DAS NACHHER-BILD WIRD GERECHNET, NICHT GEZEICHNET. Diese Datei beschreibt
 * nur die Ausgangsstellung und den einen Handgriff (welches Feld angetippt
 * wird, welcher Zug folgt) — was daraus wird, rechnen `SCHACH_RUNDE` und
 * `SCHACH` mit genau denselben Funktionen aus, die auch im Spiel laufen.
 * Deshalb kann die Anleitung nicht von der Regel abweichen: Wer eine Fähigkeit
 * ändert, ändert ihr Bild automatisch mit. Dasselbe Prinzip trägt schon die
 * Vorschaubilder der Spielarten (`TEAM_SCHACH._vorschauBauen`).
 *
 * Diese Datei weiss nichts über den Bildschirm — sie liefert Stände und
 * markierte Felder. Gezeichnet wird in `team-schach-auswertung.js`.
 *
 * Das Beispielbrett ist 6 mal 6 Felder gross: klein genug fürs Handy, gross
 * genug für Mauer (drei Felder nebeneinander), Erdbeben (drei Reihen) und
 * Friedhof (ein 2-mal-2-Feld).
 */

const SCHACH_VORSCHAU = {

    BREITE: 6,
    HOEHE: 6,

    /* Der Spieler, der im Beispiel handelt. Er steht im weissen Team. */
    SPIELER: "id-vorschau",
    FARBE: "weiss",

    /*
     * Aus sechs Zeilen wird ein Brett. Geschrieben wird von oben (schwarze
     * Seite) nach unten — so, wie das Brett auch auf dem Bildschirm steht.
     */
    _brett(zeilen) {
        return zeilen.join("");
    },

    /*
     * Feldnummer aus Reihe und Spalte, beide von 0 an. Nur zum Schreiben der
     * Beispiele — im Spiel rechnet `SCHACH` selbst.
     */
    _feld(reihe, spalte) {
        return reihe * SCHACH_VORSCHAU.BREITE + spalte;
    },

    /*
     * Die Beispiele. Jeder Eintrag beschreibt:
     *
     *     brett     Die Ausgangsstellung (6 mal 6 Zeichen).
     *     figur     Feld, um das es geht — im Vorher-Bild markiert. -1 = keines.
     *     ziel      Das angetippte Feld für Fähigkeiten der Art "ziel".
     *               -1 bei allen anderen.
     *     zug       Wahlfrei: [von, nach] — ein Zug, der NACH der Fähigkeit
     *               ausgeführt wird. Nur dort nötig, wo sich die Wirkung erst
     *               im nächsten Zug zeigt (Doppelzug) oder wo der Würfel erst
     *               eingesammelt werden muss (Unglückswürfel).
     *     verloren  Wahlfrei: geschlagene eigene Figuren als Arten
     *               (für die Wiedergeburt).
     *     gefallen  Wahlfrei: eigene Gefallene als [{ art, feld }]
     *               (für die Wiederbelebung — sie braucht den ORT).
     *     beute     Wahlfrei: gefallene GEGNER als [{ art, feld }]
     *               (für den Friedhof).
     *     vorher    Ein Satz unter dem linken Bild.
     *     nachher   Ein Satz unter dem rechten Bild.
     *
     * Die Ausgangsstellungen sind bewusst leer geräumt: Ein Beispiel soll EINE
     * Sache zeigen, nicht eine Partie.
     */
    BEISPIELE: {

        /* ---- Gewöhnlich: zusätzliche Gangarten ---- */

        sprung: {
            brett: [
                "k.....",
                "......",
                "......",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: -1,
            vorher: "Der Turm geht nur gerade — schräg kommt er nirgends hin.",
            nachher: "Mit Sprung darf er zusätzlich wie ein Springer gehen."
        },
        ausweichen: {
            brett: [
                "k.....",
                "......",
                "......",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: -1,
            vorher: "Angegriffen und eingeklemmt: Der Turm kommt schräg nicht weg.",
            nachher: "Ausweichen schenkt ihm ein Feld in jede Richtung — auf ein "
                + "FREIES Feld, geschlagen wird dabei nicht."
        },
        teleport: {
            brett: [
                "k.....",
                "......",
                "......",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: -1,
            vorher: "Wohin der Turm darf, bestimmt seine Gangart.",
            nachher: "Mit Teleport zusätzlich auf jedes freie Feld im Umkreis von "
                + "zwei — über alles hinweg."
        },

        /* ---- Ungewöhnlich: verändert die Stellung ---- */

        bauernschub: {
            brett: [
                "k.....",
                "......",
                "......",
                "......",
                ".BB.B.",
                "K....."
            ],
            figur: -1,
            ziel: -1,
            vorher: "Drei eigene Bauern stehen in der Reihe.",
            nachher: "Alle rücken auf einmal ein Feld vor, soweit Platz ist."
        },
        schutzschild: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            vorher: "Der schwarze Turm steht direkt vor dem eigenen — er schlägt "
                + "als Nächstes.",
            nachher: "Mit dem Schild überlebt die Figur den Schlag: Er verpufft, "
                + "der Angreifer bleibt stehen."
        },
        erdbeben: {
            brett: [
                "k.....",
                "..s.l.",
                "..T.B.",
                "...s..",
                "......",
                "K....."
            ],
            figur: -1,
            ziel: 16,
            vorher: "Angetippt wird ein Feld auf der rechten Seite — dorthin "
                + "rutscht es.",
            nachher: "Drei Reihen rücken um ein Feld zur Seite. Könige bleiben "
                + "stehen, und es wirkt auf beide Seiten."
        },
        nudelholz: {
            brett: [
                "k.....",
                "..s.l.",
                "..B...",
                "...s..",
                "......",
                "K....."
            ],
            figur: -1,
            ziel: 32,
            vorher: "Angetippt wird ein Feld deiner eigenen Grundreihe — unten am "
                + "Brett.",
            nachher: "Alle Figuren in diesen beiden Spalten rücken ein Feld nach "
                + "vorn, von dir weg."
        },
        mauer: {
            brett: [
                "k.....",
                "......",
                "......",
                "..T...",
                "......",
                "K....."
            ],
            figur: -1,
            ziel: 13,
            vorher: "Die Mauer legt sich um das Feld, das du antippst.",
            nachher: "Das angetippte Feld und je eines links und rechts sind gesperrt "
                + "— für beide Seiten. Nur Springer setzen darüber hinweg, und nach "
                + "ein paar Zügen zerfällt die Mauer."
        },

        /* ---- Episch: kostet den Gegner etwas ---- */

        frost: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "......",
                "......",
                "K....."
            ],
            figur: 14,
            ziel: 14,
            vorher: "Die gegnerische Figur, die stören würde.",
            nachher: "Eingefroren: Sie zieht einen Zug lang nicht — und lässt sich "
                + "in dieser Zeit auch nicht schlagen."
        },
        verstaerkung: {
            brett: [
                "k.....",
                "......",
                "......",
                "..B...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            vorher: "Ein eigener Bauer.",
            nachher: "Aus dem Bauern wird ein Springer — Material aus dem Nichts."
        },
        fessel: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "......",
                "......",
                "K....."
            ],
            figur: 14,
            ziel: 14,
            vorher: "Der gegnerische Turm droht zu ziehen.",
            nachher: "Gefesselt: Beim nächsten Zug des Gegners bleibt genau diese "
                + "Figur stehen."
        },

        /* ---- Legendär ---- */

        doppelzug: {
            brett: [
                "k.....",
                "......",
                "......",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: -1,
            zug: [20, 14],
            vorher: "Ein Zug, dann wäre der Gegner dran.",
            nachher: "Der Turm ist gezogen — und das eigene Team ist sofort noch "
                + "einmal am Zug."
        },
        wiedergeburt: {
            brett: [
                "k.....",
                "......",
                "......",
                "......",
                "......",
                "K....."
            ],
            figur: -1,
            ziel: 33,
            verloren: ["D"],
            vorher: "Die eigene Dame ist gefallen. Angetippt wird ein freies Feld "
                + "der eigenen Grundreihe.",
            nachher: "Sie kehrt zurück — hinten, weit weg vom Geschehen."
        },
        spiegel: {
            brett: [
                "k.....",
                "......",
                "......",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            vorher: "Eine eigene Figur, die man gut zweimal gebrauchen könnte.",
            nachher: "Die Kopie erscheint auf einem freien Feld daneben."
        },
        wiederbelebung: {
            brett: [
                "k.....",
                "......",
                "......",
                "......",
                "......",
                "K....."
            ],
            figur: 14,
            ziel: 14,
            gefallen: [{ art: "T", feld: 14 }],
            vorher: "Hier fiel der eigene Turm. Das Feld ist frei.",
            nachher: "Er steht genau dort wieder auf — mitten im Geschehen. Danach "
                + "ist der Gegner am Zug."
        },
        friedhof: {
            brett: [
                "k.....",
                "......",
                "......",
                "......",
                "......",
                "K....."
            ],
            figur: -1,
            ziel: 14,
            beute: [
                { art: "B", feld: 8 },
                { art: "L", feld: 9 },
                { art: "S", feld: 10 },
                { art: "T", feld: 11 }
            ],
            vorher: "Vier geschlagene GEGNER warten. Angetippt wird die linke obere "
                + "Ecke eines freien 2-mal-2-Feldes.",
            nachher: "Sie stehen in DEINER Farbe wieder auf und ziehen wie eigene — "
                + "bis sie nach ein paar Zügen zerfallen."
        },
        /*
         * Der Händler zieht sein Angebot aus dem Spielstand — WELCHES es ist,
         * steht also nicht hier. Deshalb trägt sein Beispiel von jeder
         * Figurenart genug, damit jedes Angebot der Tabelle bedient werden
         * kann. Sonst zeigte die Anleitung eines Tages nichts, weil gerade ein
         * Tausch gezogen wurde, für den die Figuren fehlen.
         */
        haendler: {
            brett: [
                "k.....",
                "......",
                "......",
                "BBBBB.",
                "TT.SL.",
                "K...D."
            ],
            figur: -1,
            ziel: -1,
            vorher: "Fünf Bauern — viel Masse, wenig Durchschlag.",
            nachher: "Der Händler tauscht sie gegen etwas ungefähr Gleichwertiges. "
                + "Was genau er anbietet, wechselt mit jedem Zug."
        }
    },

    /*
     * Die Beispiele zu den Unglückswürfeln. Sie tragen zusätzlich `wuerfel`:
     * das Feld, auf dem der Würfel liegt. Eingesammelt wird er, indem die
     * eigene Figur mit `zug` darauf zieht — auch das läuft durch den echten
     * Weg (`SCHACH_RUNDE.ziehen` sammelt ein und löst aus).
     */
    PECH_BEISPIELE: {
        stolperstein: {
            brett: [
                "k.....",
                "......",
                "..T...",
                "......",
                "......",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Der Turm zieht auf den Würfel — und der ist ein schlechter.",
            nachher: "Die Figur wird ein Feld zurückgeworfen, in Richtung der "
                + "eigenen Grundreihe."
        },
        vollesGlas: {
            brett: [
                "k.....",
                "..s.l.",
                "..T...",
                "......",
                "......",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Die gegnerischen Figuren stehen da, wo sie stehen.",
            nachher: "Eine Weile sehen sie für DICH falsch aus. Sie ziehen wie "
                + "immer — nur der Gegner merkt nichts davon."
        },
        ausdehnung: {
            brett: [
                "k.....",
                "......",
                "..T...",
                "......",
                "......",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Ein Brett mit sechs mal sechs Feldern.",
            nachher: "Es wächst an einer Seite um eine Reihe oder Spalte — alle "
                + "Wege werden länger."
        },
        erdrutsch: {
            brett: [
                "k.....",
                "......",
                "..T...",
                ".B.B..",
                "......",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Der eigene Angriff steht weit vorn.",
            nachher: "Alle eigenen Figuren rutschen ein Feld zurück — der Angriff "
                + "fällt in sich zusammen."
        },
        meuterei: {
            brett: [
                "k.....",
                "......",
                "..T...",
                ".B.B..",
                "......",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Noch gehören alle diese Figuren dir.",
            nachher: "Eine läuft zum Gegner über und kämpft ab sofort gegen dich. "
                + "Könige meutern nicht."
        }
    },

    /* ---------------------------------------------------------------- *
     * Die Bilder
     * ---------------------------------------------------------------- */

    /* Gibt es zu dieser Fähigkeit (oder diesem Unglückswürfel) ein Beispiel? */
    beispielVon(art) {
        return SCHACH_VORSCHAU.BEISPIELE[art]
            || SCHACH_VORSCHAU.PECH_BEISPIELE[art]
            || null;
    },

    /* Baut die Beispiel-Partie: laufend, der Betrachter spielt Weiss. */
    _runde(beispiel) {
        const runde = SCHACH_RUNDE.normalisieren({
            id: "vorschau",
            variante: SCHACH_VARIANTEN.STANDARD,
            laeuft: true,
            zugZaehler: 0,
            teams: { weiss: [SCHACH_VORSCHAU.SPIELER], schwarz: ["id-gegner"] },
            bereit: { weiss: true, schwarz: true },
            bonusFassung: 2,
            bonus: Number.isInteger(beispiel.wuerfel)
                ? [{ feld: beispiel.wuerfel, art: beispiel.art || "", pech: true }]
                : [],
            verloren: {
                weiss: Array.isArray(beispiel.verloren) ? beispiel.verloren : [],
                schwarz: []
            },
            /* Die Gefallenen tragen ihren ORT: Die Wiederbelebung holt die
               eigene Figur genau dorthin zurück, der Friedhof lässt gefallene
               GEGNER auf einem freien Platz aufstehen. */
            gefallen: {
                weiss: Array.isArray(beispiel.gefallen) ? beispiel.gefallen : [],
                schwarz: Array.isArray(beispiel.beute) ? beispiel.beute : []
            },
            stand: {
                brett: SCHACH_VORSCHAU._brett(beispiel.brett),
                breite: SCHACH_VORSCHAU.BREITE,
                hoehe: SCHACH_VORSCHAU.HOEHE,
                amZug: SCHACH_VORSCHAU.FARBE,
                rochade: "",
                rochadeFelder: [],
                rochadeKoenige: []
            }
        });

        return runde;
    },

    /*
     * Zwei Bilder zu einer Fähigkeit:
     *
     *     { vorher: { runde, marken, text }, nachher: { … } }
     *
     * `marken` sind die Felder, auf die es ankommt. Bei einer Fähigkeit mit
     * zusätzlichem Zugmuster sind das im Nachher-Bild die Felder, die NEU
     * erreichbar sind — genau die Auskunft, um die es dort geht.
     *
     * Liefert null, wenn es kein Beispiel gibt oder die Wirkung im Beispiel
     * nicht zustande kommt. Der Bildschirm zeigt dann eben keines; ein Test
     * hält fest, dass das für keine Fähigkeit passiert.
     */
    bilder(art) {
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        if (!beispiel) {
            return null;
        }

        const vorher = SCHACH_VORSCHAU._runde(
            Object.assign({}, beispiel, { art: art }));

        const nachher = SCHACH_VARIANTEN.PECH[art]
            ? SCHACH_VORSCHAU._pechRechnen(vorher, art, beispiel)
            : SCHACH_VORSCHAU._faehigkeitRechnen(vorher, art, beispiel);

        if (!nachher) {
            return null;
        }

        const vorherMarken = [];
        if (Number.isInteger(beispiel.figur) && beispiel.figur >= 0) {
            vorherMarken.push(beispiel.figur);
        }
        if (Number.isInteger(beispiel.ziel) && beispiel.ziel >= 0
            && vorherMarken.indexOf(beispiel.ziel) === -1) {
            vorherMarken.push(beispiel.ziel);
        }

        return {
            vorher: { runde: vorher, marken: vorherMarken, text: beispiel.vorher },
            nachher: nachher
        };
    },

    /*
     * DER ABLAUF ALS FOLGE VON BILDERN (seit v0.41) — das, was der Bildschirm
     * abspielt. Jeder Schritt beantwortet eine Frage:
     *
     *   1. Ausgangsstellung   — worum geht es?
     *   2. Fingerabdruck      — WO tippst du hin? (seit v0.44)
     *   3. (bei einem Zug)    — und wohin dann?
     *   4. Wirkung            — was ist daraus geworden?
     *
     * Ein Schritt trägt:
     *
     *     runde   der Spielstand, der gezeichnet wird
     *     marken  die Felder, um die es geht (kräftige Kontur)
     *     wahl    die übrigen möglichen Felder (helle Kontur)
     *     ziele   Felder mit dem ZUGPUNKT — dieselbe Marke wie im Spiel
     *     tipp    das Feld mit dem Fingerabdruck (-1 = keines)
     *     wege    [{ von, nach }] für die Bewegungspfeile
     *     text    ein Satz dazu
     *
     * Die Auswahlfelder werden nicht aufgezählt, sondern gefragt
     * (`SCHACH_RUNDE.zielFelder` / `SCHACH.zuege`) — sonst stünde die Regel
     * zweimal im Programm.
     */
    schritte(art) {
        const bilder = SCHACH_VORSCHAU.bilder(art);
        if (!bilder) {
            return null;
        }

        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const vorher = bilder.vorher.runde;
        const breite = SCHACH.breiteVon(vorher.stand);
        const hoehe = SCHACH.hoeheVon(vorher.stand);
        const name = (feld) => SCHACH.feldName(feld, breite, hoehe);

        const hatFigur = Number.isInteger(beispiel.figur) && beispiel.figur >= 0;
        const hatZiel = Number.isInteger(beispiel.ziel) && beispiel.ziel >= 0;

        const liste = [SCHACH_VORSCHAU._schritt({
            runde: vorher,
            marken: hatFigur ? [beispiel.figur] : [],
            text: beispiel.vorher
        })];

        if (hatZiel) {
            const moeglich = SCHACH_RUNDE.zielFelder(vorher, SCHACH_VORSCHAU.SPIELER, art);

            liste.push(SCHACH_VORSCHAU._schritt({
                runde: vorher,
                marken: [beispiel.ziel],
                wahl: moeglich.filter((feld) => feld !== beispiel.ziel),
                tipp: beispiel.ziel,
                text: (moeglich.length > 1)
                    ? ("Du tippst " + name(beispiel.ziel) + " an. Hell umrandet "
                        + "sind die anderen Felder, die auch gehen.")
                    : ("Du tippst " + name(beispiel.ziel) + " an.")
            }));

        } else if (beispiel.zug) {
            /*
             * Hier wird gezogen — und ein Zug sind ZWEI Tipper: erst die
             * Figur, dann ihr Ziel. Die Punkte dazwischen sind dieselben, die
             * das echte Brett zeigt.
             */
            const ziele = SCHACH.zuege(vorher.stand, beispiel.zug[0])
                .map((zug) => zug.nach)
                .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle);

            liste.push(SCHACH_VORSCHAU._schritt({
                runde: vorher,
                marken: [beispiel.zug[0]],
                ziele: ziele,
                tipp: beispiel.zug[0],
                text: "Du tippst die Figur auf " + name(beispiel.zug[0])
                    + " an — die Punkte zeigen, wohin sie darf."
            }));

            liste.push(SCHACH_VORSCHAU._schritt({
                runde: vorher,
                marken: [beispiel.zug[1]],
                ziele: ziele,
                tipp: beispiel.zug[1],
                wege: [{ von: beispiel.zug[0], nach: beispiel.zug[1] }],
                text: "Dann tippst du " + name(beispiel.zug[1]) + " an."
            }));
        }

        liste.push(SCHACH_VORSCHAU._schritt({
            runde: bilder.nachher.runde,
            marken: bilder.nachher.marken,
            ziele: bilder.nachher.ziele,
            wege: bilder.nachher.wege,
            text: bilder.nachher.text
        }));

        /*
         * EIN LETZTES BILD: DIE FIGUR ZIEHT WIRKLICH (seit v0.46).
         *
         * Bei den Zugmustern (Sprung, Ausweichen, Teleport) endete die
         * Anleitung bisher bei den Punkten — „hier kämst du hin". Wie das
         * aussieht, blieb offen. Jetzt wird einer dieser Züge im Beispiel auch
         * ausgeführt, mit Pfeil. Gerechnet wird er wie jeder andere Zug; misst
         * einer, geht das Bild verloren, aber nicht die Anleitung.
         */
        const sprung = SCHACH_VORSCHAU._sprungSchritt(art, bilder.nachher, beispiel, name);
        if (sprung) {
            liste.push(sprung);
        }

        return liste;
    },

    /*
     * Führt im Beispiel einen der neu möglichen Züge aus — den, der am
     * deutlichsten zeigt, was das Muster kann: das am weitesten entfernte
     * Zielfeld. Nur für Fähigkeiten mit Zugmuster; sonst null.
     */
    _sprungSchritt(art, nachher, beispiel, name) {
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        const figur = beispiel.figur;

        if (!beschreibung || beschreibung.art !== "zugmuster") {
            return null;
        }
        if (!Number.isInteger(figur) || figur < 0
            || !nachher.ziele || nachher.ziele.length === 0) {
            return null;
        }

        const stand = nachher.runde.stand;
        const breite = SCHACH.breiteVon(stand);
        const abstand = (feld) => {
            const dr = SCHACH.reiheVon(feld, breite) - SCHACH.reiheVon(figur, breite);
            const ds = SCHACH.spalteVon(feld, breite) - SCHACH.spalteVon(figur, breite);
            return (dr * dr) + (ds * ds);
        };

        const ziel = nachher.ziele.slice().sort(
            (einer, anderer) => abstand(anderer) - abstand(einer))[0];

        const gezogen = SCHACH_RUNDE.ziehen(nachher.runde, SCHACH_VORSCHAU.SPIELER,
            figur, ziel, "D", "", 0);

        if (!gezogen) {
            return null;
        }

        return SCHACH_VORSCHAU._schritt({
            runde: gezogen,
            marken: [ziel],
            wege: [{ von: figur, nach: ziel }],
            text: "So sieht der Zug aus: Die Figur geht von "
                + name(figur) + " nach " + name(ziel) + "."
        });
    },

    /* Füllt einen Schritt auf, damit der Bildschirm nie auf Fehlendes trifft. */
    _schritt(roh) {
        return {
            runde: roh.runde,
            marken: roh.marken || [],
            wahl: roh.wahl || [],
            ziele: roh.ziele || [],
            tipp: Number.isInteger(roh.tipp) ? roh.tipp : -1,
            wege: roh.wege || [],
            text: roh.text || ""
        };
    },

    /* Der übliche Weg: Fähigkeit einsetzen, wie im Spiel. */
    _faehigkeitRechnen(vorher, art, beispiel) {
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        if (!beschreibung) {
            return null;
        }

        const vorbereitet = SCHACH_RUNDE.kopieren(vorher);
        vorbereitet.faehigkeiten[SCHACH_VORSCHAU.FARBE].push(art);

        let neu = SCHACH_RUNDE.faehigkeitEinsetzen(vorbereitet,
            SCHACH_VORSCHAU.SPIELER, art,
            Number.isInteger(beispiel.ziel) ? beispiel.ziel : -1, "", 0);

        if (!neu) {
            return null;
        }

        /*
         * Ein zusätzliches Zugmuster ändert das Brett nicht — es ändert, wohin
         * man darf. Die neuen Ziele bekommen deshalb den ZUGPUNKT, dieselbe
         * Marke wie im Spiel: Das Bild sagt „hier kommst du jetzt hin".
         */
        if (beschreibung.art === "zugmuster") {
            return {
                runde: neu,
                marken: Number.isInteger(beispiel.figur) ? [beispiel.figur] : [],
                ziele: SCHACH_VORSCHAU._neueZiele(vorher, neu, beispiel.figur),
                wege: [],
                text: beispiel.nachher
            };
        }

        if (beispiel.zug) {
            const gezogen = SCHACH_RUNDE.ziehen(neu, SCHACH_VORSCHAU.SPIELER,
                beispiel.zug[0], beispiel.zug[1], "D", "", 0);

            if (!gezogen) {
                return null;
            }
            neu = gezogen;

            /* Nach dem Doppelzug ist dieselbe Seite wieder dran: Das Bild zeigt
               den gezogenen Weg UND wohin die Figur jetzt noch einmal darf. */
            return {
                runde: neu,
                marken: [beispiel.zug[1]],
                ziele: SCHACH.zuege(neu.stand, beispiel.zug[1])
                    .map((zug) => zug.nach)
                    .filter((feld, stelle, alle) => alle.indexOf(feld) === stelle),
                wege: [{ von: beispiel.zug[0], nach: beispiel.zug[1] }],
                text: beispiel.nachher
            };
        }

        return {
            runde: neu,
            marken: SCHACH_VORSCHAU._betroffeneFelder(neu),
            ziele: [],
            wege: SCHACH_VORSCHAU._betroffeneWege(neu),
            text: beispiel.nachher
        };
    },

    /*
     * Der Unglückswürfel wird EINGESAMMELT, nicht eingesetzt: Die eigene Figur
     * zieht darauf, und `SCHACH_RUNDE.ziehen` löst die Wirkung aus. Genau so
     * passiert es im Spiel.
     */
    _pechRechnen(vorher, art, beispiel) {
        if (!beispiel.zug) {
            return null;
        }

        const gezogen = SCHACH_RUNDE.ziehen(SCHACH_RUNDE.kopieren(vorher),
            SCHACH_VORSCHAU.SPIELER, beispiel.zug[0], beispiel.zug[1], "D", "", 0);

        if (!gezogen) {
            return null;
        }

        const letzter = gezogen.verlauf[gezogen.verlauf.length - 1];
        if (!letzter || letzter.wirkung !== "pech") {
            return null;
        }

        return {
            runde: gezogen,
            marken: SCHACH_VORSCHAU._betroffeneFelder(gezogen),
            ziele: [],
            wege: SCHACH_VORSCHAU._betroffeneWege(gezogen),
            text: beispiel.nachher
        };
    },

    /* Die Felder, die der letzte Verlaufseintrag als betroffen meldet. */
    _betroffeneFelder(runde) {
        const letzter = runde.verlauf[runde.verlauf.length - 1];
        if (!letzter || !Array.isArray(letzter.felder)) {
            return [];
        }
        return letzter.felder.slice();
    },

    /*
     * Die Wege aus dem letzten Verlaufseintrag — daraus werden die Pfeile.
     *
     * Es sind dieselben Angaben, aus denen das echte Brett die Spur des
     * letzten Zuges färbt: Wer eine Wirkung baut, die Figuren verschiebt,
     * liefert sie ohnehin mit, und die Anleitung zeichnet sie nur.
     */
    _betroffeneWege(runde) {
        const letzter = runde.verlauf[runde.verlauf.length - 1];
        if (!letzter || !Array.isArray(letzter.wege)) {
            return [];
        }

        return letzter.wege
            .filter((weg) => weg && Number.isInteger(weg.von) && Number.isInteger(weg.nach)
                && weg.von >= 0 && weg.nach >= 0 && weg.von !== weg.nach)
            .map((weg) => ({ von: weg.von, nach: weg.nach }));
    },

    /* Welche Ziele sind durch das Zusatzmuster hinzugekommen? */
    _neueZiele(vorher, nachher, feld) {
        if (!Number.isInteger(feld) || feld < 0) {
            return [];
        }

        const alte = SCHACH.zuege(vorher.stand, feld).map((zug) => zug.nach);

        return SCHACH.zuege(nachher.stand, feld)
            .map((zug) => zug.nach)
            .filter((ziel) => alte.indexOf(ziel) === -1)
            .filter((ziel, stelle, alle) => alle.indexOf(ziel) === stelle);
    }
};

/* Für die Tests unter Node; im Browser wird die Datei einfach eingebunden. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_VORSCHAU;
}
