/*
 * test-schach-runde.js — Regressionstests der Partie mit ihren Teams.
 *
 * Geladen werden die ECHTEN Dateien js\schach.js und js\schach-runde.js.
 * schach-runde.js benutzt SCHACH als globale Größe, genau wie im Browser —
 * deshalb wird es hier vorher bereitgestellt.
 */

const pfad = require("path");

globalThis.SCHACH = require(pfad.join(__dirname, "..", "js", "schach.js"));
const SCHACH_RUNDE = require(pfad.join(__dirname, "..", "js", "schach-runde.js"));
const SCHACH = globalThis.SCHACH;

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

/* Eine laufende Partie mit Anna (Weiss) und Bert (Schwarz). */
function laufendePartie() {
    let runde = SCHACH_RUNDE.leereRunde(1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-bert", "schwarz", 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "weiss", true, 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "schwarz", true, 1000);
    return runde;
}

/* ------------------------------------------------------------------ *
 * Grundstrukturen
 * ------------------------------------------------------------------ */

pruefe("Eine leere Runde steht auf der Grundstellung und laeuft nicht", () => {
    const runde = SCHACH_RUNDE.leereRunde();
    gleich(runde.stand.brett, SCHACH.GRUNDSTELLUNG, "Grundstellung");
    gleich(runde.laeuft, false, "laeuft nicht");
    gleich(runde.zugZaehler, 0, "Zugzaehler");
    gleich(runde.teams.weiss.length, 0, "kein weisses Team");
});

pruefe("Unsinn wird zu einer gueltigen Runde", () => {
    gleich(SCHACH_RUNDE.normalisieren(null).laeuft, false, "null");
    gleich(SCHACH_RUNDE.normalisieren("kaputt").stand.brett, SCHACH.GRUNDSTELLUNG, "Text");
    gleich(SCHACH_RUNDE.normalisieren({ teams: "keine Liste" }).teams.weiss.length, 0, "Teams");
    gleich(SCHACH_RUNDE.normalisieren({ ergebnis: "gelb" }).ergebnis, "", "unbekanntes Ergebnis");
});

/* ------------------------------------------------------------------ *
 * Teams
 * ------------------------------------------------------------------ */

pruefe("Man tritt einem Team bei und steht dann nur dort", () => {
    let runde = SCHACH_RUNDE.teamBeitreten(SCHACH_RUNDE.leereRunde(), "id-anna", "weiss", 1000);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "weiss", "im weissen Team");

    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "schwarz", 2000);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "schwarz", "gewechselt");
    gleich(runde.teams.weiss.length, 0, "nicht mehr bei Weiss");
});

pruefe("Ein Team nimmt mehrere Leute auf, aber niemanden doppelt", () => {
    let runde = SCHACH_RUNDE.teamBeitreten(SCHACH_RUNDE.leereRunde(), "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-cem", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);

    gleich(runde.teams.weiss.length, 2, "zwei Leute");
});

pruefe("Verlassen entfernt aus beiden Teams", () => {
    let runde = SCHACH_RUNDE.teamBeitreten(SCHACH_RUNDE.leereRunde(), "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamVerlassen(runde, "id-anna", 2000);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "", "in keinem Team");
});

pruefe("Beitreten geht auch waehrend das Spiel laeuft", () => {
    let runde = laufendePartie();
    gleich(runde.laeuft, true, "laeuft");

    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-cem", "weiss", 3000);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-cem"), "weiss", "mitten im Spiel dazu");
    gleich(runde.laeuft, true, "laeuft weiter");
});

/* ------------------------------------------------------------------ *
 * Starten
 * ------------------------------------------------------------------ */

pruefe("Die Partie startet erst, wenn beide Seiten besetzt und bereit sind", () => {
    let runde = SCHACH_RUNDE.leereRunde();

    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "weiss", true, 1000);
    gleich(runde.laeuft, false, "eine Seite reicht nicht");

    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-bert", "schwarz", 1000);
    gleich(runde.laeuft, false, "Bereitschaft von Schwarz fehlt");

    runde = SCHACH_RUNDE.bereitSetzen(runde, "schwarz", true, 1000);
    gleich(runde.laeuft, true, "jetzt laeuft es");
});

/* ------------------------------------------------------------------ *
 * Zugrecht — die Hausregel dieser Partie
 * ------------------------------------------------------------------ */

pruefe("Nur wer im Team am Zug ist, darf ziehen", () => {
    const runde = laufendePartie();

    wahr(SCHACH_RUNDE.darfZiehen(runde, "id-anna"), "Weiss ist dran");
    wahr(!SCHACH_RUNDE.darfZiehen(runde, "id-bert"), "Schwarz nicht");
    wahr(!SCHACH_RUNDE.darfZiehen(runde, "id-fremd"), "Aussenstehende nie");
});

pruefe("Innerhalb des Teams darf JEDER ziehen, ohne Reihenfolge", () => {
    /* Das ist die ausdrückliche Regel: wer zuerst zieht, hat gezogen. */
    let runde = laufendePartie();
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-cem", "weiss", 2000);

    wahr(SCHACH_RUNDE.darfZiehen(runde, "id-anna"), "Anna darf");
    wahr(SCHACH_RUNDE.darfZiehen(runde, "id-cem"), "Cem darf genauso");

    /* Cem zieht zuerst — danach ist das ganze Team nicht mehr dran. */
    const gezogen = SCHACH_RUNDE.ziehen(runde, "id-cem",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Cem", 3000);

    wahr(gezogen !== null, "Zug ging durch");
    wahr(!SCHACH_RUNDE.darfZiehen(gezogen, "id-anna"), "Anna ist nicht mehr dran");
    wahr(!SCHACH_RUNDE.darfZiehen(gezogen, "id-cem"), "Cem auch nicht");
    wahr(SCHACH_RUNDE.darfZiehen(gezogen, "id-bert"), "jetzt Schwarz");
});

pruefe("Vor dem Start und nach dem Ende darf niemand ziehen", () => {
    const vorStart = SCHACH_RUNDE.teamBeitreten(SCHACH_RUNDE.leereRunde(), "id-anna", "weiss", 1000);
    wahr(!SCHACH_RUNDE.darfZiehen(vorStart, "id-anna"), "vor dem Start");

    const beendet = SCHACH_RUNDE.aufgeben(laufendePartie(), "weiss", 2000);
    wahr(!SCHACH_RUNDE.darfZiehen(beendet, "id-anna"), "nach dem Ende");
});

/* ------------------------------------------------------------------ *
 * Ziehen
 * ------------------------------------------------------------------ */

pruefe("Ein Zug erhoeht den Zugzaehler und schreibt den Verlauf", () => {
    const runde = laufendePartie();
    const neu = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    gleich(neu.zugZaehler, 1, "Zaehler");
    gleich(neu.verlauf.length, 1, "ein Eintrag");
    gleich(neu.verlauf[0].wer, "Anna", "wer gezogen hat");
    gleich(neu.verlauf[0].farbe, "weiss", "Farbe");
    gleich(neu.stand.amZug, "schwarz", "Schwarz ist dran");
    gleich(runde.zugZaehler, 0, "Ausgangsstand unveraendert");
});

pruefe("Unerlaubte Zuege werden abgewiesen", () => {
    const runde = laufendePartie();

    gleich(SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("e7"), SCHACH.feldNummer("e5"), "D", "Bert", 2000),
        null, "falsches Team");
    gleich(SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e5"), "D", "Anna", 2000),
        null, "Regelverstoss");
    gleich(SCHACH_RUNDE.ziehen(runde, "id-fremd",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Fremd", 2000),
        null, "kein Team");
});

pruefe("Der Verlauf bleibt kurz", () => {
    let runde = laufendePartie();
    /* Springer hin und her, bis der Verlauf überläuft. */
    const hin = [["g1", "f3"], ["g8", "f6"], ["f3", "g1"], ["f6", "g8"]];

    for (let i = 0; i < 12; i++) {
        const zug = hin[i % 4];
        const wer = (i % 2 === 0) ? "id-anna" : "id-bert";
        const neu = SCHACH_RUNDE.ziehen(runde, wer,
            SCHACH.feldNummer(zug[0]), SCHACH.feldNummer(zug[1]), "D", wer, 2000 + i);
        if (neu) {
            runde = neu;
        }
    }

    wahr(runde.verlauf.length <= SCHACH_RUNDE.VERLAUF_LAENGE, "Verlauf begrenzt");
    wahr(runde.verlauf.length > 0, "aber nicht leer");
});

/* ------------------------------------------------------------------ *
 * Spielende
 * ------------------------------------------------------------------ */

pruefe("Ein Matt beendet die Partie und benennt den Sieger", () => {
    /* Narrenmatt: f2-f3, e7-e5, g2-g4, Dd8-h4 matt. */
    let runde = laufendePartie();
    const zuege = [
        ["id-anna", "f2", "f3"],
        ["id-bert", "e7", "e5"],
        ["id-anna", "g2", "g4"],
        ["id-bert", "d8", "h4"]
    ];

    for (const zug of zuege) {
        const neu = SCHACH_RUNDE.ziehen(runde, zug[0],
            SCHACH.feldNummer(zug[1]), SCHACH.feldNummer(zug[2]), "D", zug[0], 2000);
        wahr(neu !== null, "Zug " + zug[1] + "-" + zug[2] + " ging durch");
        runde = neu;
    }

    gleich(runde.ergebnis, "schwarz", "Schwarz gewinnt");
    gleich(runde.laeuft, false, "Partie ist vorbei");
    wahr(!SCHACH_RUNDE.darfZiehen(runde, "id-anna"), "niemand zieht mehr");
});

pruefe("Aufgeben laesst die andere Seite gewinnen", () => {
    const runde = SCHACH_RUNDE.aufgeben(laufendePartie(), "weiss", 2000);
    gleich(runde.ergebnis, "schwarz", "Schwarz gewinnt");
    gleich(runde.laeuft, false, "vorbei");
});

pruefe("Eine neue Partie behaelt die Teams und verlangt neue Bereitschaft", () => {
    let runde = SCHACH_RUNDE.ziehen(laufendePartie(), "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);
    runde = SCHACH_RUNDE.neuePartie(runde, 3000);

    gleich(runde.stand.brett, SCHACH.GRUNDSTELLUNG, "Brett zurueckgesetzt");
    gleich(runde.zugZaehler, 0, "Zaehler zurueck");
    gleich(runde.laeuft, false, "laeuft nicht");
    gleich(runde.bereit.weiss, false, "Bereitschaft weg");
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "weiss", "Team bleibt");
});

/* ------------------------------------------------------------------ *
 * Vergleich
 * ------------------------------------------------------------------ */

pruefe("Der Vergleich erkennt Zuege, Teams und Bereitschaft", () => {
    const runde = laufendePartie();
    const gezogen = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    wahr(SCHACH_RUNDE.inhaltGleich(runde, SCHACH_RUNDE.kopieren(runde)), "gleich");
    wahr(!SCHACH_RUNDE.inhaltGleich(runde, gezogen), "Zug erkannt");
    wahr(!SCHACH_RUNDE.inhaltGleich(runde,
        SCHACH_RUNDE.teamBeitreten(runde, "id-cem", "weiss", 2000)), "Team erkannt");
});

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
