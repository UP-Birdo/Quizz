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
     * JEDE STELLUNG ERZÄHLT, WARUM MAN DIE FÄHIGKEIT NEHMEN WÜRDE (seit v0.50).
     *
     * Bis v0.49 standen auf fast jedem Beispielbrett nur zwei Könige und die
     * eine Figur, um die es ging — der Gegner fehlte, und damit fehlte der
     * Grund. Bei „Ausweichen" behauptete der Satz sogar „angegriffen und
     * eingeklemmt", während weit und breit nichts angriff. Jetzt steht in jeder
     * Stellung, was die Fähigkeit löst: ein Angreifer, eine Sperre, eine Lücke.
     *
     * DIE BEIDEN KÖNIGE BLEIBEN. Sie sind kein Beiwerk: Die Bilder werden mit
     * den ECHTEN Regeln gerechnet, und `SCHACH.zuege` prüft für jeden Zug, ob
     * der eigene König danach im Schach steht. Ein Brett ohne Könige wäre keine
     * Stellung, die das Regelwerk je zu sehen bekommt. Sie stehen deshalb
     * bewusst aus der Sache heraus — nicht im Weg, aber da.
     *
     * Die Ausgangsstellungen bleiben trotzdem leer geräumt: Ein Beispiel soll
     * EINE Sache zeigen, nicht eine Partie.
     */
    BEISPIELE: {

        /* ---- Gewöhnlich: zusätzliche Gangarten ---- */

        /*
         * Der Turm steht so, dass ihn nur ein Springerzug an die Dame bringt.
         * Die übrigen drei Sprungfelder sind mit EIGENEN Bauern besetzt — damit
         * bleibt genau ein neues Zielfeld übrig, und das letzte Bild
         * (`_sprungSchritt` zieht dorthin) zeigt wirklich den Schlag. Ohne die
         * Bauern wären alle Sprungfelder gleich weit weg, und es hinge vom
         * Zufall ab, welchen Zug die Anleitung vorführt.
         */
        sprung: {
            brett: [
                "k.....",
                "......",
                "d.....",
                "......",
                ".T....",
                ".....K"
            ],
            figur: 25,
            ziel: -1,
            vorher: "Die schwarze Dame steht schräg versetzt — gerade kommt der Turm "
                + "dort nie hin.",
            nachher: "Mit Sprung geht er wie ein Springer. Vier neue Punkte stehen "
                + "auf dem Brett — und auf einem davon steht die Dame."
        },
        ausweichen: {
            brett: [
                "k.....",
                "......",
                "..B...",
                ".BTB..",
                "..B...",
                "K....."
            ],
            figur: 20,
            ziel: -1,
            vorher: "Der Turm ist von den eigenen Leuten zugestellt — kein einziger "
                + "Zug bleibt ihm.",
            nachher: "Ausweichen öffnet ihm ein Feld in jede Richtung, auch schräg. "
                + "Nur auf FREIE Felder, geschlagen wird dabei nicht."
        },
        teleport: {
            brett: [
                "k.....",
                "......",
                "......",
                ".sss..",
                "..T...",
                ".....K"
            ],
            figur: 26,
            ziel: -1,
            vorher: "Drei gegnerische Springer riegeln die Reihe ab. Vorbei kommt "
                + "hier niemand.",
            nachher: "Der Teleport setzt über alles hinweg — auf jedes freie Feld "
                + "im Umkreis von zwei, auch hinter der Sperre."
        },

        /* ---- Ungewöhnlich: verändert die Stellung ---- */

        bauernschub: {
            brett: [
                "k.....",
                "......",
                "......",
                "...t..",
                ".BB.B.",
                "K....."
            ],
            figur: -1,
            ziel: -1,
            vorher: "Drei eigene Bauern, und der Gegner steht schon in Reichweite.",
            nachher: "Alle rücken auf einmal ein Feld vor: Die ganze Reihe steht "
                + "plötzlich weiter vorn."
        },
        schutzschild: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "..D...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            vorher: "Der schwarze Turm steht deiner Dame gegenüber — er schlägt sie "
                + "als Nächstes.",
            nachher: "Mit dem Schild überlebt sie den Schlag: Er verpufft, der "
                + "Angreifer bleibt stehen."
        },
        /* Das Erdbeben ist seit v0.54 ein Unglückswürfel — sein Beispiel steht
           weiter unten bei `PECH_BEISPIELE`. */
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
                "..t...",
                "......",
                "......",
                "......",
                "K.D..."
            ],
            figur: -1,
            ziel: 14,
            vorher: "Der schwarze Turm zielt die ganze Spalte hinunter auf deine Dame.",
            nachher: "Die Mauer legt sich um das angetippte Feld und sperrt die "
                + "Spalte — für beide Seiten. Nur Springer setzen darüber hinweg."
        },

        /* ---- Episch: kostet den Gegner etwas ---- */

        frost: {
            brett: [
                "k.....",
                "......",
                "..s...",
                "......",
                "...D..",
                "K....."
            ],
            figur: 14,
            ziel: 14,
            vorher: "Der Springer greift deine Dame an — im nächsten Zug ist sie weg.",
            nachher: "Eingefroren: Er zieht einen Zug lang nicht und lässt sich in "
                + "dieser Zeit auch nicht schlagen."
        },
        verstaerkung: {
            brett: [
                "k.....",
                ".t.t..",
                "......",
                "..B...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            vorher: "Ein einzelner Bauer. An die beiden Türme kommt er nie heran.",
            nachher: "Aus dem Bauern wird ein Springer — und der bedroht von hier "
                + "aus gleich beide."
        },
        fessel: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "......",
                "..L...",
                "K....."
            ],
            figur: 14,
            ziel: 14,
            vorher: "Der Turm nimmt deinen Läufer ins Visier.",
            nachher: "Gefesselt: Beim nächsten Zug des Gegners bleibt genau diese "
                + "Figur stehen."
        },

        /* ---- Legendär ---- */

        doppelzug: {
            brett: [
                "k.....",
                "......",
                "..b...",
                "..T...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: -1,
            zug: [20, 14],
            vorher: "Der Turm kann den Bauern schlagen — und stünde danach allein "
                + "vorn.",
            nachher: "Geschlagen, und dein Team ist sofort wieder am Zug: Er kann "
                + "im selben Atemzug zurück."
        },
        wiedergeburt: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "......",
                "......",
                "K....."
            ],
            figur: -1,
            ziel: 33,
            verloren: ["D"],
            vorher: "Deine Dame ist gefallen, der Gegner drückt. Angetippt wird ein "
                + "freies Feld deiner Grundreihe.",
            nachher: "Sie kehrt zurück — hinten, weit weg vom Geschehen. Danach ist "
                + "der Gegner am Zug."
        },
        spiegel: {
            brett: [
                "k.....",
                "......",
                "......",
                "..D...",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            vorher: "Eine Dame ist gut. Zwei sind besser.",
            nachher: "Die Kopie erscheint auf einem freien Feld daneben — aus dem "
                + "Nichts steht dort eine zweite."
        },
        wiederbelebung: {
            brett: [
                "k.....",
                "......",
                "..t...",
                "......",
                "......",
                "K....."
            ],
            figur: 20,
            ziel: 20,
            gefallen: [{ art: "T", feld: 20 }],
            vorher: "Hier fiel dein Turm — direkt vor dem gegnerischen. Das Feld ist "
                + "frei.",
            nachher: "Er steht genau dort wieder auf, mitten im Geschehen, und hält "
                + "den Gegner sofort auf."
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
            /*
             * SEIT v0.54 MÜSSEN DIE GEFALLENEN IM BLOCK LIEGEN. Die Fähigkeit
             * weckt, wer GENAU DORT fiel — also stehen sie hier auf den vier
             * Feldern des 2×2-Blocks, dessen linke obere Ecke `ziel` ist
             * (14, 15, 20, 21). Lägen sie woanders, zeigte die Anleitung eine
             * Wirkung, die es nicht gibt.
             */
            beute: [
                { art: "B", feld: 14 },
                { art: "L", feld: 15 },
                { art: "S", feld: 20 },
                { art: "T", feld: 21 }
            ],
            vorher: "Hier sind vier GEGNER gefallen — blass siehst du, wo. Angetippt "
                + "wird die linke obere Ecke des 2-mal-2-Feldes.",
            nachher: "Genau die, die dort fielen, stehen in DEINER Farbe wieder auf "
                + "— jeder auf seinem Feld, bis sie nach 8 Halbzügen zerfallen."
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
    /*
     * JEDES DIESER BILDER ZEIGT EINEN SCHADEN (seit v0.50). Ein Unglückswürfel
     * ist keine Belohnung, und das Beispiel soll das auch nicht so aussehen
     * lassen: In der Ausgangsstellung steht immer etwas, das durch den Würfel
     * kaputtgeht — ein Angriff, der zusammenfällt, eine Figur, die überläuft.
     */
    PECH_BEISPIELE: {
        stolperstein: {
            brett: [
                "k.....",
                "......",
                "..T...",
                "......",
                "...b..",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Der Turm rückt vor und hat den schwarzen Bauern im Blick — "
                + "auf dem Feld liegt aber ein Würfel.",
            nachher: "Es war ein schlechter: Die Figur fliegt ein Feld zurück, der "
                + "Angriff ist dahin."
        },
        vollesGlas: {
            brett: [
                "k.....",
                "..s.l.",
                "..T...",
                "...t..",
                "......",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Drei gegnerische Figuren, und du weisst genau, welche welche "
                + "ist.",
            nachher: "Jetzt nicht mehr: Für DICH sehen sie eine Weile falsch aus. "
                + "Sie ziehen wie immer — der Gegner merkt nichts davon."
        },
        ausdehnung: {
            brett: [
                "k.....",
                "......",
                "..T...",
                "......",
                "....b.",
                "K....."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Zwei Felder noch, dann hat der Turm den Bauern.",
            nachher: "Das Brett wächst an einer zufälligen Seite: Plötzlich ist "
                + "alles weiter weg als eben noch."
        },
        schrumpfung: {
            /*
             * Der weisse König steht auf d1, NICHT auf a1: Ein schwarzer Bauer
             * auf b2 würde a1 angreifen, und dann wäre Weiss im Schach — der
             * Zug im Beispiel liesse sich gar nicht ausführen, und die ganze
             * Anleitung fiele weg. Beim Schreiben eines Beispiels also immer
             * mitdenken, wen die eigenen Figuren gerade bedrohen.
             */
            brett: [
                "k.....",
                "......",
                "..T...",
                "......",
                ".b...b",
                "...K.."
            ],
            figur: 20,
            wuerfel: 20,
            zug: [14, 20],
            vorher: "Ein Brett mit sechs mal sechs Feldern, und zwei gegnerische "
                + "Bauern stehen am Rand.",
            nachher: "Eine ganze Reihe oder Spalte bricht weg — was dort stand, "
                + "stürzt mit. Nur Seiten mit einem König bleiben verschont."
        },
        erdbeben: {
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
            vorher: "Der Turm zieht vor — auf dem Feld liegt ein Würfel.",
            nachher: "Der Boden reisst auf: Diese Felder sind ab sofort gesperrt, "
                + "und zwar für den Rest der Partie. Nur Springer setzen darüber."
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
            vorher: "Dein Angriff steht weit vorn, alles ist vorbereitet.",
            nachher: "Alle eigenen Figuren rutschen ein Feld zurück — der Angriff "
                + "fällt in sich zusammen, und du fängst von vorne an."
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
            nachher: "Eine läuft zum Gegner über und kämpft ab sofort GEGEN dich — "
                + "der Unterschied ist doppelt so gross wie ein Verlust. Könige "
                + "meutern nicht."
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

        /*
         * ZUERST DRÜCKT MAN DIE FÄHIGKEIT (seit v0.50).
         *
         * Bis v0.49 begann die Anleitung beim Brett — bei „Bauernschub" und
         * „Händler" zeigte sie überhaupt keinen Handgriff, und bei Sprung,
         * Ausweichen und Teleport sprang sie von der Ausgangsstellung direkt zu
         * den neuen Punkten. Wer die Fähigkeit zum ersten Mal einsetzt, sucht
         * aber genau das: WO fange ich an? Der erste Griff geht immer an den
         * Vorrat, und der ist jetzt ein eigenes Bild.
         *
         * Unglückswürfel bekommen es nicht: Sie werden nie gedrückt, sondern
         * eingesammelt — dort ist der erste Griff die eigene Figur.
         */
        const beschreibung = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        if (beschreibung) {
            liste.push(SCHACH_VORSCHAU._schritt({
                runde: vorher,
                marken: hatFigur ? [beispiel.figur] : [],
                knopf: beschreibung.titel,
                text: "Du tippst " + beschreibung.titel + " in deinem Vorrat an."
                    + (hatZiel || beispiel.zug
                        ? " Danach fragt das Brett nach dem Rest."
                        : " Mehr ist nicht zu tun — sie wirkt sofort.")
            }));
        }

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

            /*
             * `knopf` (seit v0.50): Nicht auf dem Brett wird getippt, sondern
             * auf die Fähigkeit im Vorrat. Der Bildschirm zeichnet dann unter
             * dem Brett die Marke mit dem Fingerabdruck darauf. Leer heisst:
             * In diesem Bild wird kein Knopf gedrückt.
             */
            knopf: roh.knopf || "",
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
         *
         * Kostet die Fähigkeit den Zug (Sprung, Teleport seit v0.47), muss im
         * Beispiel erst der Gegner ziehen — sonst zeigte das Bild Punkte für
         * eine Seite, die gar nicht am Zug ist. Gezogen wird ein echter Zug,
         * kein gestellter.
         */
        if (beschreibung.art === "zugmuster") {
            const dran = (neu.stand.amZug === SCHACH_VORSCHAU.FARBE)
                ? neu
                : SCHACH_VORSCHAU._gegnerZiehtEinmal(neu);

            if (!dran) {
                return null;
            }

            return {
                runde: dran,
                marken: Number.isInteger(beispiel.figur) ? [beispiel.figur] : [],
                ziele: SCHACH_VORSCHAU._neueZiele(vorher, dran, beispiel.figur),
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

    /*
     * Lässt den Gegner EINEN Zug machen — den ersten regelgerechten, den es
     * gibt. Gebraucht wird das nur im Beispiel: Eine Fähigkeit, die den Zug
     * abgibt, wirkt ja erst, wenn man wieder dran ist.
     */
    _gegnerZiehtEinmal(runde) {
        const stand = runde.stand;
        const gegner = stand.amZug;

        for (let feld = 0; feld < SCHACH.felderVon(stand); feld++) {
            if (SCHACH.farbeVon(SCHACH.figurAuf(stand, feld)) !== gegner) {
                continue;
            }

            for (const zug of SCHACH.zuege(stand, feld)) {
                const gezogen = SCHACH_RUNDE.ziehen(runde, "id-gegner",
                    feld, zug.nach, "D", "", 0);

                if (gezogen) {
                    return gezogen;
                }
            }
        }

        return null;
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
