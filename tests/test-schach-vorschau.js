/*
 * test-schach-vorschau.js — die Bildanleitung zu den Fähigkeiten (seit v0.41).
 *
 * Der wichtigste Test dieser Datei ist der erste: ZU JEDER Fähigkeit und zu
 * jedem Unglückswürfel muss es zwei Bilder geben, und das Nachher-Bild wird
 * mit den echten Regeln gerechnet. Fehlt ein Beispiel oder passt es nicht mehr
 * zur Regel (falsches Zielfeld, Zug nicht mehr erlaubt), schlägt er fehl —
 * genau dann, wenn jemand eine Fähigkeit ändert und die Anleitung vergisst.
 *
 * Aufruf: siehe tests\README.md
 */

const pfad = require("path");

globalThis.SCHACH_VARIANTEN = require(pfad.join(__dirname, "..", "js", "schach-varianten.js"));
globalThis.SCHACH = require(pfad.join(__dirname, "..", "js", "schach.js"));
globalThis.SCHACH_RUNDE = require(pfad.join(__dirname, "..", "js", "schach-runde.js"));

const SCHACH_VARIANTEN = globalThis.SCHACH_VARIANTEN;
const SCHACH = globalThis.SCHACH;
const SCHACH_VORSCHAU = require(pfad.join(__dirname, "..", "js", "schach-vorschau.js"));

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

/* Alle Fähigkeiten und alle Unglückswürfel, jeweils mit ihrem Titel. */
const alleArten = Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)
    .concat(Object.keys(SCHACH_VARIANTEN.PECH));

/* ------------------------------------------------------------------ *
 * Vollständigkeit
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Bildanleitung fuer " + art, () => {
        const bilder = SCHACH_VORSCHAU.bilder(art);

        wahr(bilder !== null, "es gibt zwei Bilder");
        wahr(typeof bilder.vorher.text === "string" && bilder.vorher.text.length > 10,
            "das Vorher-Bild hat einen Satz");
        wahr(typeof bilder.nachher.text === "string" && bilder.nachher.text.length > 10,
            "das Nachher-Bild hat einen Satz");
    });
}

/* ------------------------------------------------------------------ *
 * Die Bilder sagen wirklich etwas
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Das Nachher-Bild zeigt eine Aenderung: " + art, () => {
        const bilder = SCHACH_VORSCHAU.bilder(art);
        const vorher = bilder.vorher.runde.stand;
        const nachher = bilder.nachher.runde.stand;

        /*
         * Entweder das Brett hat sich geaendert, oder es sind Felder markiert,
         * die es vorher nicht waren, oder eine Wirkung liegt jetzt im Stand
         * (Schild, Fessel, Frost, Mauer, Zusatzmuster, Extrazug, Glas). Ein
         * Bild, bei dem nichts davon zutrifft, zeigt dem Nutzer nichts.
         */
        const brettAnders = (vorher.brett !== nachher.brett)
            || (vorher.breite !== nachher.breite)
            || (vorher.hoehe !== nachher.hoehe);

        const wirkungImStand = !!(nachher.zusatzMuster || nachher.extraZug
            || nachher.schildFeld >= 0 || nachher.fesselFeld >= 0
            || nachher.frostFeld >= 0 || nachher.glasFarbe
            || SCHACH.mauern(nachher).length > 0
            || SCHACH.geliehene(nachher).length > 0);

        wahr(brettAnders || wirkungImStand || bilder.nachher.marken.length > 0,
            "Vorher und Nachher unterscheiden sich sichtbar");
    });
}

/* ------------------------------------------------------------------ *
 * Der Ablauf: die Schritte, die der Bildschirm abspielt
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Der Ablauf hat Schritte mit Text: " + art, () => {
        const schritte = SCHACH_VORSCHAU.schritte(art);

        wahr(Array.isArray(schritte) && schritte.length >= 2,
            "mindestens Ausgangsstellung und Wirkung");

        for (const schritt of schritte) {
            wahr(!!schritt.runde && !!schritt.runde.stand, "jeder Schritt hat ein Brett");
            wahr(Array.isArray(schritt.marken), "jeder Schritt hat Marken");
            wahr(Array.isArray(schritt.wahl), "jeder Schritt hat eine Auswahl");
            wahr(typeof schritt.text === "string" && schritt.text.length > 10,
                "jeder Schritt hat einen Satz");
        }
    });
}

pruefe("Faehigkeiten mit Zielfeld zeigen den Handgriff als eigenen Schritt", () => {
    /*
     * Der mittlere Schritt ist der, den ein Vorher-Bild nicht zeigen kann:
     * dass man selbst ein Feld aussucht — und welche zur Auswahl stehen.
     */
    const mitZiel = Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)
        .filter((art) => SCHACH_VARIANTEN.FAEHIGKEITEN[art].art === "ziel");

    wahr(mitZiel.length > 0, "es gibt Faehigkeiten mit Zielfeld");

    for (const art of mitZiel) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);

        gleich(schritte.length, 3, art + ": drei Schritte");
        gleich(schritte[1].marken.length, 1, art + ": genau ein angetipptes Feld");
        gleich(schritte[1].marken[0], beispiel.ziel, art + ": und zwar das aus dem Beispiel");
    }
});

pruefe("Ohne Zielfeld und ohne Zug gibt es zwei Schritte", () => {
    for (const art of ["sprung", "ausweichen", "teleport", "bauernschub", "haendler"]) {
        gleich(SCHACH_VORSCHAU.schritte(art).length, 2, art + ": zwei Schritte");
    }
});

pruefe("Wo gezogen wird, sind es vier Schritte", () => {
    /*
     * Ein Zug sind ZWEI Tipper — erst die Figur, dann ihr Ziel. Beide bekommen
     * ihr eigenes Bild mit Fingerabdruck, sonst fehlt der halbe Handgriff.
     */
    for (const art of ["doppelzug", "meuterei", "stolperstein", "erdrutsch"]) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);

        gleich(schritte.length, 4, art + ": vier Schritte");
        gleich(schritte[1].tipp, beispiel.zug[0], art + ": erst die Figur antippen");
        gleich(schritte[2].tipp, beispiel.zug[1], art + ": dann ihr Ziel");
        wahr(schritte[1].ziele.length > 0, art + ": die Zugpunkte sind dabei");
    }
});

pruefe("Jeder Handgriff traegt einen Fingerabdruck", () => {
    /*
     * Der Fingerabdruck beantwortet die Frage, die Bilder sonst offen lassen:
     * WO muss ich hindrücken? Er gehört auf jeden Schritt, in dem getippt wird
     * — und auf keinen anderen.
     */
    for (const art of alleArten) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const mitFinger = schritte.filter((schritt) => schritt.tipp >= 0);

        if (Number.isInteger(beispiel.ziel) && beispiel.ziel >= 0) {
            gleich(mitFinger.length, 1, art + ": ein Tipper (das Zielfeld)");
            gleich(mitFinger[0].tipp, beispiel.ziel, art + ": auf dem Zielfeld");
        } else if (beispiel.zug) {
            gleich(mitFinger.length, 2, art + ": zwei Tipper (Figur und Ziel)");
        } else {
            gleich(mitFinger.length, 0, art + ": hier wird das Brett nicht getippt");
        }

        /* Der erste und der letzte Schritt zeigen nie einen Finger — dort ist
           nichts zu drücken, sondern etwas zu sehen. */
        gleich(schritte[0].tipp, -1, art + ": kein Finger auf der Ausgangsstellung");
        gleich(schritte[schritte.length - 1].tipp, -1, art + ": keiner auf der Wirkung");
    }
});

pruefe("Wo sich etwas bewegt, gibt es Pfeile", () => {
    for (const art of ["doppelzug", "stolperstein", "erdrutsch", "bauernschub"]) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const mitPfeil = schritte.filter((schritt) => schritt.wege.length > 0);

        wahr(mitPfeil.length > 0, art + ": mindestens ein Bild mit Pfeil");

        for (const schritt of mitPfeil) {
            for (const weg of schritt.wege) {
                wahr(Number.isInteger(weg.von) && Number.isInteger(weg.nach)
                    && weg.von !== weg.nach, art + ": der Weg hat zwei Enden");
            }
        }
    }
});

pruefe("Die Auswahl im mittleren Schritt kommt aus der Regel", () => {
    /*
     * Nicht aufgezaehlt, sondern gefragt: `zielFelder` probiert jedes Feld
     * durch. Deshalb kann die Anleitung keine Felder anbieten, die es nicht
     * gibt — und keines vergessen.
     */
    const schritte = SCHACH_VORSCHAU.schritte("mauer");
    const beispiel = SCHACH_VORSCHAU.beispielVon("mauer");
    const moeglich = SCHACH_RUNDE.zielFelder(schritte[0].runde,
        SCHACH_VORSCHAU.SPIELER, "mauer");

    gleich(schritte[1].wahl.length, moeglich.length - 1,
        "alle moeglichen Felder ausser dem angetippten");
    wahr(schritte[1].wahl.indexOf(beispiel.ziel) === -1,
        "das angetippte steht nicht zweimal drin");
});

/* ------------------------------------------------------------------ *
 * Einzelne Beispiele, damit die Aussage stimmt
 * ------------------------------------------------------------------ */

pruefe("Sprung: das Nachher-Bild markiert Springerziele", () => {
    const bilder = SCHACH_VORSCHAU.bilder("sprung");

    gleich(bilder.nachher.runde.stand.zusatzMuster, "springer", "Muster gesetzt");
    wahr(bilder.nachher.ziele.length >= 4, "mehrere neue Ziele");

    /* Ein Springerzug vom Turmfeld aus: zwei Felder in die eine, eines in die
       andere Richtung — auf diesem Brett also nichts, was ein Turm koennte. */
    for (const feld of bilder.nachher.ziele) {
        const spalte = feld % SCHACH_VORSCHAU.BREITE;
        const reihe = Math.floor(feld / SCHACH_VORSCHAU.BREITE);
        const abstandSpalte = Math.abs(spalte - 20 % SCHACH_VORSCHAU.BREITE);
        const abstandReihe = Math.abs(reihe - Math.floor(20 / SCHACH_VORSCHAU.BREITE));

        gleich(abstandSpalte * abstandReihe, 2, "Feld " + feld + " ist ein Springerziel");
    }
});

pruefe("Verstaerkung: aus dem Bauern wird wirklich ein Springer", () => {
    const bilder = SCHACH_VORSCHAU.bilder("verstaerkung");

    gleich(SCHACH.figurAuf(bilder.vorher.runde.stand, 20), "B", "vorher ein Bauer");
    gleich(SCHACH.figurAuf(bilder.nachher.runde.stand, 20), "S", "nachher ein Springer");
});

pruefe("Mauer: das Nachher-Bild traegt drei gesperrte Felder", () => {
    const bilder = SCHACH_VORSCHAU.bilder("mauer");
    const mauern = SCHACH.mauern(bilder.nachher.runde.stand);

    gleich(mauern.length, 1, "eine Mauer");
    gleich(mauern[0].felder.length, SCHACH.MAUER_LAENGE, "ueber drei Felder");
});

pruefe("Ausdehnung: das Brett im Nachher-Bild ist groesser", () => {
    const bilder = SCHACH_VORSCHAU.bilder("ausdehnung");
    const vorher = bilder.vorher.runde.stand;
    const nachher = bilder.nachher.runde.stand;

    wahr(nachher.breite * nachher.hoehe > vorher.breite * vorher.hoehe,
        "mehr Felder als vorher");
});

pruefe("Doppelzug: nach dem Zug ist dieselbe Seite wieder dran", () => {
    const bilder = SCHACH_VORSCHAU.bilder("doppelzug");

    gleich(bilder.nachher.runde.stand.amZug, SCHACH_VORSCHAU.FARBE,
        "Weiss ist noch einmal am Zug");
    wahr(bilder.nachher.marken.length > 0, "und hat Ziele");
});

pruefe("Jedes Beispielbrett hat genau 6 mal 6 Felder", () => {
    for (const art of alleArten) {
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const brett = SCHACH_VORSCHAU._brett(beispiel.brett);

        gleich(brett.length, SCHACH_VORSCHAU.BREITE * SCHACH_VORSCHAU.HOEHE,
            "Brettlaenge bei " + art);
        wahr(brett.indexOf("K") !== -1 && brett.indexOf("k") !== -1,
            "beide Koenige stehen im Beispiel " + art);
    }
});

/* ------------------------------------------------------------------ *
 * Ergebnis
 * ------------------------------------------------------------------ */

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
