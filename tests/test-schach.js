/*
 * test-schach.js — Regressionstests der Schachregeln.
 *
 * Geladen wird die ECHTE Datei js\schach.js. Schachregeln sind der Bereich,
 * in dem sich Fehler am leichtesten verstecken (Rochade, en passant, Fesselung),
 * deshalb sind die Sonderfälle hier ausführlich abgedeckt.
 *
 * Aufruf: siehe tests\README.md
 */

const pfad = require("path");

/* schach.js liest die Spielarten (Brettmaße, Sonderregeln) aus dieser Tabelle
   und erwartet sie als globale Größe — genau wie im Browser, wo sie davor
   eingebunden ist. */
globalThis.SCHACH_VARIANTEN = require(pfad.join(__dirname, "..", "js", "schach-varianten.js"));
const SCHACH_VARIANTEN = globalThis.SCHACH_VARIANTEN;
const SCHACH = require(pfad.join(__dirname, "..", "js", "schach.js"));

let anzahlOk = 0;
let anzahlFehler = 0;

function pruefe(bezeichnung, funktion) {
    try {
        funktion();
        anzahlOk++;
    } catch (fehler) {
        anzahlFehler++;
        console.error("FEHLER: " + bezeichnung);
        console.error("        " + fehler.message);
    }
}

function gleich(ist, soll, was) {
    if (ist !== soll) {
        throw new Error((was || "Wert") + ": erwartet <" + soll + ">, war <" + ist + ">");
    }
}

function wahr(bedingung, was) {
    if (!bedingung) {
        throw new Error((was || "Bedingung") + " war nicht erfüllt");
    }
}

/*
 * Baut ein Brett aus einer Belegung: { "e1": "K", "e8": "k" } — alles andere
 * ist leer. So bleiben die Tests lesbar.
 */
function brettAus(belegung) {
    let brett = "................................................................";
    for (const feldName of Object.keys(belegung)) {
        const feld = SCHACH.feldNummer(feldName);
        brett = brett.substring(0, feld) + belegung[feldName] + brett.substring(feld + 1);
    }
    return brett;
}

function standAus(belegung, amZug, zusatz) {
    return SCHACH.standNormalisieren(Object.assign({
        brett: brettAus(belegung),
        amZug: amZug || SCHACH.WEISS,
        rochade: "",
        enPassant: ""
    }, zusatz || {}));
}

/* Zielfelder eines Zuges als sortierte Liste von Feldnamen. */
function ziele(stand, vonName) {
    return SCHACH.zuege(stand, SCHACH.feldNummer(vonName))
        .map((zug) => SCHACH.feldName(zug.nach))
        .filter((name, stelle, liste) => liste.indexOf(name) === stelle)
        .sort()
        .join(",");
}

/* ------------------------------------------------------------------ *
 * Felder
 * ------------------------------------------------------------------ */

pruefe("Feldnamen und Feldnummern passen zusammen", () => {
    gleich(SCHACH.feldNummer("a8"), 0, "a8");
    gleich(SCHACH.feldNummer("h1"), 63, "h1");
    gleich(SCHACH.feldNummer("e4"), 36, "e4");
    gleich(SCHACH.feldName(0), "a8", "Feld 0");
    gleich(SCHACH.feldName(63), "h1", "Feld 63");
    gleich(SCHACH.feldName(36), "e4", "Feld 36");
    gleich(SCHACH.feldNummer("x9"), -1, "Unsinn");
});

pruefe("Die Grundstellung hat 32 Figuren am richtigen Platz", () => {
    const stand = SCHACH.neuerStand();
    gleich(stand.brett.length, 64, "Brettlänge");
    gleich(stand.brett.split(".").length - 1, 32, "leere Felder");
    gleich(SCHACH.figurAuf(stand, SCHACH.feldNummer("e1")), "K", "weisser König");
    gleich(SCHACH.figurAuf(stand, SCHACH.feldNummer("e8")), "k", "schwarzer König");
    gleich(SCHACH.figurAuf(stand, SCHACH.feldNummer("a1")), "T", "weisser Turm");
    gleich(SCHACH.figurAuf(stand, SCHACH.feldNummer("d8")), "d", "schwarze Dame");
    gleich(stand.amZug, SCHACH.WEISS, "Weiss beginnt");
});

/* ------------------------------------------------------------------ *
 * Gangarten
 * ------------------------------------------------------------------ */

pruefe("Der Bauer zieht eins, aus der Grundstellung zwei", () => {
    const stand = standAus({ "e2": "B", "e1": "K", "e8": "k" });
    gleich(ziele(stand, "e2"), "e3,e4", "Bauer auf e2");

    const gezogen = standAus({ "e3": "B", "e1": "K", "e8": "k" });
    gleich(ziele(gezogen, "e3"), "e4", "Bauer auf e3");
});

pruefe("Der Bauer schlägt schräg, nicht gerade", () => {
    const stand = standAus({ "e4": "B", "d5": "b", "e5": "b", "e1": "K", "e8": "k" });
    gleich(ziele(stand, "e4"), "d5", "nur schräg schlagen, e5 blockiert");
});

pruefe("Der Springer springt über Figuren", () => {
    const stand = standAus({ "g1": "S", "g2": "B", "f2": "B", "e1": "K", "e8": "k" });
    gleich(ziele(stand, "g1"), "e2,f3,h3", "Springer aus der Ecke");
});

pruefe("Turm, Läufer und Dame ziehen bis zum Hindernis", () => {
    const turm = standAus({ "a1": "T", "a4": "B", "e1": "K", "e8": "k" });
    gleich(ziele(turm, "a1"), "a2,a3,b1,c1,d1", "Turm bis vor den eigenen Bauern");

    const laeufer = standAus({ "c1": "L", "e3": "b", "e1": "K", "e8": "k" });
    gleich(ziele(laeufer, "c1"), "a3,b2,d2,e3", "Läufer schlägt auf e3");
});

pruefe("Der König zieht ein Feld weit", () => {
    const stand = standAus({ "e4": "K", "e8": "k" });
    gleich(ziele(stand, "e4"), "d3,d4,d5,e3,e5,f3,f4,f5", "König in der Mitte");
});

pruefe("Wer nicht am Zug ist, kann nicht ziehen", () => {
    const stand = standAus({ "e2": "B", "e1": "K", "e8": "k", "e7": "b" }, SCHACH.WEISS);
    gleich(ziele(stand, "e7"), "", "schwarzer Bauer bei Weiss am Zug");
});

/* ------------------------------------------------------------------ *
 * Schach, Fesselung, Matt, Patt
 * ------------------------------------------------------------------ */

pruefe("Ein Schach wird erkannt", () => {
    const stand = standAus({ "e1": "K", "e8": "t", "a1": "k" });
    wahr(SCHACH.imSchach(stand, SCHACH.WEISS), "Weiss steht im Schach");
    wahr(!SCHACH.imSchach(stand, SCHACH.SCHWARZ), "Schwarz nicht");
});

pruefe("Eine gefesselte Figur darf die Fesselung nicht verlassen", () => {
    /* Der Läufer auf e2 steht zwischen König e1 und Turm e8. */
    const stand = standAus({ "e1": "K", "e2": "L", "e8": "t", "a8": "k" });
    gleich(ziele(stand, "e2"), "", "Läufer ist gefesselt");
});

pruefe("Der König darf nicht in ein bedrohtes Feld ziehen", () => {
    const stand = standAus({ "e1": "K", "d8": "t", "a8": "k" });
    /* d-Linie ist bedroht, also kein d1 und kein d2. */
    gleich(ziele(stand, "e1"), "e2,f1,f2", "König weicht aus");
});

pruefe("Schachmatt wird erkannt", () => {
    /* Klassisches Turmmatt: König a8, Türme b1 und a-Linie. */
    const stand = standAus({ "a8": "k", "h8": "T", "g7": "T", "e1": "K" }, SCHACH.SCHWARZ);
    const lage = SCHACH.lage(stand);
    gleich(lage.art, "matt", "Matt");
    gleich(lage.sieger, SCHACH.WEISS, "Weiss gewinnt");
});

pruefe("Patt wird erkannt und ist kein Matt", () => {
    /* Schwarz am Zug, König a8, keine Zugmöglichkeit, aber kein Schach. */
    const stand = standAus({ "a8": "k", "b6": "D", "e1": "K" }, SCHACH.SCHWARZ);
    const lage = SCHACH.lage(stand);
    gleich(lage.art, "patt", "Patt");
    gleich(lage.sieger, "", "kein Sieger");
});

pruefe("Im Schach zaehlen nur Zuege, die es beenden", () => {
    /* Turm gibt Schach auf der e-Linie; der Bauer auf a2 darf nicht ziehen. */
    const stand = standAus({ "e1": "K", "e8": "t", "a2": "B", "h8": "k" });
    gleich(ziele(stand, "a2"), "", "Bauer darf nicht");
    wahr(ziele(stand, "e1").length > 0, "der König schon");
});

/* ------------------------------------------------------------------ *
 * Rochade
 * ------------------------------------------------------------------ */

pruefe("Die kurze Rochade ist moeglich, wenn alles frei ist", () => {
    const stand = standAus({ "e1": "K", "h1": "T", "e8": "k" }, SCHACH.WEISS, { rochade: "KD" });
    wahr(ziele(stand, "e1").indexOf("g1") !== -1, "g1 ist erreichbar");

    const ergebnis = SCHACH.ziehen(stand, SCHACH.feldNummer("e1"), SCHACH.feldNummer("g1"));
    wahr(ergebnis !== null, "Rochade wird ausgefuehrt");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("g1")), "K", "König auf g1");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("f1")), "T", "Turm auf f1");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("h1")), ".", "h1 ist leer");
    gleich(ergebnis.stand.rochade.indexOf("K"), -1, "Recht verbraucht");
});

pruefe("Die lange Rochade zieht den Turm nach d1", () => {
    const stand = standAus({ "e1": "K", "a1": "T", "e8": "k" }, SCHACH.WEISS, { rochade: "KD" });
    const ergebnis = SCHACH.ziehen(stand, SCHACH.feldNummer("e1"), SCHACH.feldNummer("c1"));

    wahr(ergebnis !== null, "Rochade wird ausgefuehrt");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("c1")), "K", "König auf c1");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("d1")), "T", "Turm auf d1");
});

pruefe("Rochade ist verboten im Schach, ueber ein bedrohtes Feld und ohne Recht", () => {
    const imSchach = standAus({ "e1": "K", "h1": "T", "e8": "t", "a8": "k" },
        SCHACH.WEISS, { rochade: "K" });
    wahr(ziele(imSchach, "e1").indexOf("g1") === -1, "nicht aus dem Schach heraus");

    const ueberBedroht = standAus({ "e1": "K", "h1": "T", "f8": "t", "a8": "k" },
        SCHACH.WEISS, { rochade: "K" });
    wahr(ziele(ueberBedroht, "e1").indexOf("g1") === -1, "nicht ueber f1");

    const ohneRecht = standAus({ "e1": "K", "h1": "T", "e8": "k" }, SCHACH.WEISS, { rochade: "" });
    wahr(ziele(ohneRecht, "e1").indexOf("g1") === -1, "ohne Recht gar nicht");

    const besetzt = standAus({ "e1": "K", "h1": "T", "f1": "S", "e8": "k" },
        SCHACH.WEISS, { rochade: "K" });
    wahr(ziele(besetzt, "e1").indexOf("g1") === -1, "nicht durch eigene Figuren");
});

pruefe("Ein Koenigszug nimmt beide Rochaderechte", () => {
    const stand = standAus({ "e1": "K", "a1": "T", "h1": "T", "e8": "k" },
        SCHACH.WEISS, { rochade: "KD" });
    const ergebnis = SCHACH.ziehen(stand, SCHACH.feldNummer("e1"), SCHACH.feldNummer("e2"));
    gleich(ergebnis.stand.rochade, "", "beide Rechte weg");
});

/* ------------------------------------------------------------------ *
 * En passant und Umwandlung
 * ------------------------------------------------------------------ */

pruefe("En passant ist genau einen Zug lang moeglich", () => {
    /* Schwarzer Bauer zieht d7-d5, weisser Bauer steht auf e5. */
    const vorher = standAus({ "d7": "b", "e5": "B", "e1": "K", "e8": "k" }, SCHACH.SCHWARZ);
    const doppelschritt = SCHACH.ziehen(vorher, SCHACH.feldNummer("d7"), SCHACH.feldNummer("d5"));

    gleich(doppelschritt.stand.enPassant, "d6", "Feld hinter dem Bauern gemerkt");
    wahr(ziele(doppelschritt.stand, "e5").indexOf("d6") !== -1, "Schlagen moeglich");

    const geschlagen = SCHACH.ziehen(doppelschritt.stand,
        SCHACH.feldNummer("e5"), SCHACH.feldNummer("d6"));
    gleich(SCHACH.figurAuf(geschlagen.stand, SCHACH.feldNummer("d6")), "B", "Bauer steht auf d6");
    gleich(SCHACH.figurAuf(geschlagen.stand, SCHACH.feldNummer("d5")), ".", "geschlagener Bauer ist weg");
});

pruefe("Ein Bauer auf der letzten Reihe wandelt um", () => {
    const stand = standAus({ "a7": "B", "e1": "K", "h8": "k" });

    const zurDame = SCHACH.ziehen(stand, SCHACH.feldNummer("a7"), SCHACH.feldNummer("a8"), "D");
    gleich(SCHACH.figurAuf(zurDame.stand, SCHACH.feldNummer("a8")), "D", "wird Dame");

    const zumSpringer = SCHACH.ziehen(stand, SCHACH.feldNummer("a7"), SCHACH.feldNummer("a8"), "S");
    gleich(SCHACH.figurAuf(zumSpringer.stand, SCHACH.feldNummer("a8")), "S", "wird Springer");
});

/* ------------------------------------------------------------------ *
 * Ziehen allgemein
 * ------------------------------------------------------------------ */

pruefe("Ein unerlaubter Zug wird abgewiesen", () => {
    const stand = SCHACH.neuerStand();
    gleich(SCHACH.ziehen(stand, SCHACH.feldNummer("e2"), SCHACH.feldNummer("e5")), null, "drei Felder");
    gleich(SCHACH.ziehen(stand, SCHACH.feldNummer("e7"), SCHACH.feldNummer("e5")), null, "falsche Farbe");
    gleich(SCHACH.ziehen(stand, SCHACH.feldNummer("e4"), SCHACH.feldNummer("e5")), null, "leeres Feld");
});

pruefe("Nach dem Zug ist die andere Seite dran", () => {
    const stand = SCHACH.neuerStand();
    const ergebnis = SCHACH.ziehen(stand, SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"));

    gleich(ergebnis.stand.amZug, SCHACH.SCHWARZ, "Schwarz am Zug");
    gleich(ergebnis.stand.zugNummer, 1, "noch Zug 1");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("e2")), ".", "e2 ist leer");
    gleich(SCHACH.figurAuf(ergebnis.stand, SCHACH.feldNummer("e4")), "B", "Bauer auf e4");
    gleich(stand.brett, SCHACH.GRUNDSTELLUNG, "Ausgangsstand unveraendert");
});

pruefe("Die Zugnummer steigt nach dem Zug von Schwarz", () => {
    let stand = SCHACH.neuerStand();
    stand = SCHACH.ziehen(stand, SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4")).stand;
    stand = SCHACH.ziehen(stand, SCHACH.feldNummer("e7"), SCHACH.feldNummer("e5")).stand;
    gleich(stand.zugNummer, 2, "zweiter Zug");
});

pruefe("Der Zugtext ist lesbar", () => {
    const stand = SCHACH.neuerStand();
    const ergebnis = SCHACH.ziehen(stand, SCHACH.feldNummer("g1"), SCHACH.feldNummer("f3"));
    gleich(ergebnis.text, "Springer g1 nach f3", "Zugtext");
});

pruefe("Ein kaputter Stand wird zu einem gueltigen", () => {
    const stand = SCHACH.standNormalisieren({ brett: "Unsinn", amZug: "gelb" });
    gleich(stand.brett, SCHACH.GRUNDSTELLUNG, "Grundstellung");
    gleich(stand.amZug, SCHACH.WEISS, "Weiss");
    gleich(SCHACH.standNormalisieren(null).brett, SCHACH.GRUNDSTELLUNG, "null");
});

/* ------------------------------------------------------------------ *
 * Spielarten: andere Brettmaße
 *
 * Die Regeln müssen mit jedem Brett zurechtkommen. Geprüft wird deshalb
 * jede Größe einmal komplett durch — Umrechnung der Felder, Bauernzüge,
 * Umwandlung und das Ende der Partie.
 * ------------------------------------------------------------------ */

pruefe("Jede Spielart hat ein Brett in der angegebenen Groesse", () => {
    for (const variante of SCHACH_VARIANTEN.liste) {
        gleich(variante.aufstellung.length, variante.breite * variante.hoehe,
            "Feldanzahl von " + variante.id);
        wahr(variante.aufstellung.indexOf("K") !== -1, "weisser Koenig in " + variante.id);
        wahr(variante.aufstellung.indexOf("k") !== -1, "schwarzer Koenig in " + variante.id);
    }
});

pruefe("Feldnamen rechnen auf jedem Brett richtig", () => {
    /* Klassisch bleibt alles wie bisher. */
    gleich(SCHACH.feldNummer("a8"), 0, "a8");
    gleich(SCHACH.feldNummer("h1"), 63, "h1");

    /* Kleines Brett: 6 mal 6. */
    gleich(SCHACH.feldNummer("a6", 6, 6), 0, "a6 klein");
    gleich(SCHACH.feldNummer("f1", 6, 6), 35, "f1 klein");
    gleich(SCHACH.feldName(0, 6, 6), "a6", "Feld 0 klein");
    gleich(SCHACH.feldName(35, 6, 6), "f1", "Feld 35 klein");

    /* Doppelbrett: 16 Spalten, also bis p. */
    gleich(SCHACH.feldName(15, 16, 8), "p8", "Feld 15 doppelt");
    gleich(SCHACH.feldNummer("p1", 16, 8), 127, "p1 doppelt");

    /* Ausserhalb des Brettes gibt es kein Feld. */
    gleich(SCHACH.feldNummer("i1"), -1, "i gibt es auf 8 Spalten nicht");
    gleich(SCHACH.feldNummer("a1", 6, 6), 30, "a1 auf dem kleinen Brett");
    gleich(SCHACH.feldNummer("a7", 6, 6), -1, "a7 gibt es auf 6 Reihen nicht");
    gleich(SCHACH.feldNummer("g1", 6, 6), -1, "g gibt es auf 6 Spalten nicht");
});

pruefe("Auf dem kleinen Brett zieht der Bauer wie erwartet", () => {
    const stand = SCHACH.neuerStand("klein");
    gleich(stand.breite, 6, "Breite");
    gleich(stand.brett.length, 36, "Felder");

    /* c2 auf dem 6er-Brett ist die Bauernreihe. */
    const von = SCHACH.feldNummer("c2", 6, 6);
    const ziele = SCHACH.zuege(stand, von)
        .map((zug) => SCHACH.feldName(zug.nach, 6, 6)).sort().join(",");
    gleich(ziele, "c3,c4", "Einzel- und Doppelschritt");
});

pruefe("Auf dem kleinen Brett gibt es keine Rochade", () => {
    const stand = SCHACH.neuerStand("klein");
    gleich(stand.rochade, "", "keine Rechte");
});

/* Baut ein leeres Brett der Spielart und setzt einzelne Figuren hinein:
   { 11: "B", 70: "K" } — die Zahlen sind Feldnummern. */
function brettDer(varianteId, belegung) {
    const variante = SCHACH_VARIANTEN.holen(varianteId);
    const felder = new Array(variante.breite * variante.hoehe).fill(".");

    for (const feld of Object.keys(belegung)) {
        felder[Number(feld)] = belegung[feld];
    }
    return felder.join("");
}

pruefe("Auf dem grossen Brett wandelt der Bauer auf der letzten Reihe um", () => {
    /* 10 Spalten, 8 Reihen: Feld 11 ist b7, Feld 1 ist b8. */
    const stand = SCHACH.standNormalisieren({
        variante: "gross",
        brett: brettDer("gross", { 11: "B", 70: "K", 9: "k" }),
        amZug: "weiss"
    });

    gleich(stand.breite, 10, "Breite");
    gleich(SCHACH.feldName(11, 10, 8), "b7", "Feld 11 ist b7");

    const zuege = SCHACH.zuege(stand, 11).filter((zug) => zug.umwandlung !== "");
    gleich(zuege.length, 4, "vier Umwandlungen");
    gleich(zuege[0].nach, 1, "auf die letzte Reihe");
});

pruefe("Auf dem Doppelbrett gibt es kein Schach, aber schlagbare Koenige", () => {
    const stand = SCHACH.neuerStand("doppelbrett");

    gleich(stand.breite, 16, "Breite");
    gleich(SCHACH.koenigFelder(stand, SCHACH.WEISS).length, 2, "zwei weisse Koenige");
    gleich(SCHACH.imSchach(stand, SCHACH.WEISS), false, "kein Schach-Begriff");
    gleich(SCHACH.lage(stand).art, "laeuft", "die Partie laeuft");
});

pruefe("Auf dem Doppelbrett gewinnt, wer beide Koenige uebrig behaelt", () => {
    /* Schwarz hat nur noch einen Koenig (Feld 0), und der wird geschlagen. */
    const stand = SCHACH.standNormalisieren({
        variante: "doppelbrett",
        brett: brettDer("doppelbrett", { 0: "k", 16: "D", 127: "K" }),
        amZug: "weiss"
    });

    const ergebnis = SCHACH.ziehen(stand, 16, 0);
    wahr(ergebnis !== null, "die Dame darf den Koenig schlagen");
    gleich(SCHACH.lage(ergebnis.stand).art, "matt", "Partie vorbei");
    gleich(SCHACH.lage(ergebnis.stand).sieger, SCHACH.WEISS, "Weiss gewinnt");
});

/* ------------------------------------------------------------------ *
 * Ergebnis
 * ------------------------------------------------------------------ */

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
