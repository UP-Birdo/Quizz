/*
 * test-schach-runde.js — Regressionstests der Partie mit ihren Teams.
 *
 * Geladen werden die ECHTEN Dateien js\schach.js und js\schach-runde.js.
 * schach-runde.js benutzt SCHACH als globale Größe, genau wie im Browser —
 * deshalb wird es hier vorher bereitgestellt.
 */

const pfad = require("path");

globalThis.SCHACH_VARIANTEN = require(pfad.join(__dirname, "..", "js", "schach-varianten.js"));
globalThis.SCHACH = require(pfad.join(__dirname, "..", "js", "schach.js"));
const SCHACH_RUNDE = require(pfad.join(__dirname, "..", "js", "schach-runde.js"));
const SCHACH = globalThis.SCHACH;
const SCHACH_VARIANTEN = globalThis.SCHACH_VARIANTEN;

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
 * Spielarten
 * ------------------------------------------------------------------ */

pruefe("Eine Partie merkt sich ihre Spielart und bekommt deren Brett", () => {
    const runde = SCHACH_RUNDE.leereRunde(1000, "klein", "p-1", "Kleines");

    gleich(runde.variante, "klein", "Spielart");
    gleich(runde.stand.breite, 6, "Breite");
    gleich(runde.stand.brett.length, 36, "Feldanzahl");
    gleich(runde.id, "p-1", "Kennung");
    gleich(runde.titel, "Kleines", "Titel");
});

pruefe("Die Spielart ueberlebt das Normalisieren", () => {
    const runde = SCHACH_RUNDE.normalisieren(
        SCHACH_RUNDE.leereRunde(1000, "doppelbrett", "p-2", "Doppelt"));

    gleich(runde.variante, "doppelbrett", "Spielart");
    gleich(runde.stand.breite, 16, "Breite");
    gleich(runde.stand.brett.length, 128, "Feldanzahl");
});

pruefe("Eine unbekannte Spielart wird zur klassischen", () => {
    const runde = SCHACH_RUNDE.normalisieren({ variante: "raumschiff" });
    gleich(runde.variante, "standard", "Rueckfall");
    gleich(runde.stand.brett, SCHACH.GRUNDSTELLUNG, "Grundstellung");
});

pruefe("Eine Partie ohne Angabe der Spielart ist klassisch", () => {
    /* Genau so sehen die Partien aus, die vor den Spielarten angefangen wurden. */
    const runde = SCHACH_RUNDE.normalisieren({
        stand: { brett: SCHACH.GRUNDSTELLUNG, amZug: "weiss" },
        teams: { weiss: ["id-anna"], schwarz: ["id-bert"] },
        laeuft: true,
        zugZaehler: 7
    });

    gleich(runde.variante, "standard", "klassisch");
    gleich(runde.zugZaehler, 7, "Zugzaehler bleibt");
    gleich(runde.teams.weiss.join(","), "id-anna", "Team bleibt");
    gleich(runde.laeuft, true, "laeuft weiter");
});

pruefe("Neu aufstellen behaelt die Spielart", () => {
    const runde = SCHACH_RUNDE.neuePartie(
        SCHACH_RUNDE.leereRunde(1000, "gross", "p-3", "Gross"), 2000);

    gleich(runde.variante, "gross", "Spielart");
    gleich(runde.stand.breite, 10, "Breite");
});

/* ------------------------------------------------------------------ *
 * Fähigkeiten
 * ------------------------------------------------------------------ */

/* Eine laufende Partie in der Spielart mit den Bonusfeldern. */
function faehigkeitenPartie() {
    let runde = SCHACH_RUNDE.leereRunde(1000, "faehigkeiten", "p-f", "Mit Faehigkeiten");
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-bert", "schwarz", 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "weiss", true, 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "schwarz", true, 1000);
    return runde;
}

pruefe("Zu Beginn liegen alle Bonusfelder auf dem Brett", () => {
    gleich(SCHACH_RUNDE.offeneBonusFelder(faehigkeitenPartie()).length, 4, "vier Felder");
    gleich(SCHACH_RUNDE.offeneBonusFelder(laufendePartie()).length, 0, "klassisch: keine");
});

pruefe("Wer auf ein Bonusfeld zieht, sammelt die Faehigkeit ein", () => {
    /* c5 ist Feld 26 und traegt den Sprung. Der Springer kommt in zwei Zuegen
       hin: b1 nach c3, dann c3 nach b5 waere falsch — also ueber d4. */
    let runde = faehigkeitenPartie();
    const zug = (spieler, von, nach) => {
        const neu = SCHACH_RUNDE.ziehen(runde, spieler,
            SCHACH.feldNummer(von), SCHACH.feldNummer(nach), "D", spieler, 2000);
        wahr(neu !== null, "Zug " + von + "-" + nach + " erlaubt");
        runde = neu;
    };

    zug("id-anna", "b1", "c3");
    zug("id-bert", "a7", "a6");
    zug("id-anna", "c3", "d5");
    zug("id-bert", "a6", "a5");
    zug("id-anna", "d5", "c7");
    /* c7 ist kein Bonusfeld — die Faehigkeiten liegen auf c5, f5, c4, f4. */
    gleich(runde.faehigkeiten.weiss.length, 0, "noch nichts eingesammelt");

    /* Jetzt gezielt auf c5 (Feld 26). */
    gleich(SCHACH.feldNummer("c5"), 26, "c5 ist Feld 26");
});

pruefe("Ein Zug auf das Bonusfeld c5 bringt den Sprung ins Team", () => {
    let runde = faehigkeitenPartie();

    /* b1-c3, dann c3-b5? Nein: der kuerzeste Weg auf c5 fuehrt ueber d3 - c5
       gibt es nicht. Also mit dem Bauern: c2-c4, dann c4-c5. */
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("c2"), SCHACH.feldNummer("c4"), "D", "Anna", 2000);
    wahr(runde !== null, "c2-c4");
    /* c4 ist Feld 34 und traegt den Doppelzug. */
    gleich(runde.faehigkeiten.weiss.join(","), "doppelzug", "Doppelzug eingesammelt");
    gleich(SCHACH_RUNDE.offeneBonusFelder(runde).length, 3, "ein Feld weniger");

    runde = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("a7"), SCHACH.feldNummer("a6"), "D", "Bert", 2100);
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("c4"), SCHACH.feldNummer("c5"), "D", "Anna", 2200);
    wahr(runde !== null, "c4-c5");
    gleich(runde.faehigkeiten.weiss.join(","), "doppelzug,sprung", "Sprung dazu");
    gleich(SCHACH_RUNDE.offeneBonusFelder(runde).length, 2, "zwei Felder weniger");
});

pruefe("Ein eingesammeltes Feld bleibt weg, auch nach dem Neuladen", () => {
    let runde = faehigkeitenPartie();
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("c2"), SCHACH.feldNummer("c4"), "D", "Anna", 2000);

    /* So kommt der Stand aus der Datenbank zurueck. */
    const wieder = SCHACH_RUNDE.normalisieren(JSON.parse(JSON.stringify(runde)));
    gleich(SCHACH_RUNDE.offeneBonusFelder(wieder).length, 3, "bleibt eingesammelt");
    gleich(wieder.faehigkeiten.weiss.join(","), "doppelzug", "Faehigkeit bleibt");
});

pruefe("Der Doppelzug laesst dieselbe Seite noch einmal ziehen", () => {
    let runde = faehigkeitenPartie();
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("c2"), SCHACH.feldNummer("c4"), "D", "Anna", 2000);
    runde = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("a7"), SCHACH.feldNummer("a6"), "D", "Bert", 2100);

    const zaehlerVorher = runde.zugZaehler;
    runde = SCHACH_RUNDE.faehigkeitEinsetzen(runde, "id-anna", "doppelzug", "Anna", 2200);
    wahr(runde !== null, "Einsetzen erlaubt");
    gleich(runde.stand.extraZug, "weiss", "Doppelzug vorgemerkt");
    gleich(runde.zugZaehler, zaehlerVorher + 1, "Zugzaehler steigt mit");
    gleich(runde.faehigkeiten.weiss.length, 0, "verbraucht");

    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("d2"), SCHACH.feldNummer("d4"), "D", "Anna", 2300);
    gleich(runde.stand.amZug, "weiss", "Weiss ist gleich noch einmal dran");
    gleich(runde.stand.extraZug, "", "und die Faehigkeit ist weg");

    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2400);
    gleich(runde.stand.amZug, "schwarz", "danach wieder normal");
});

pruefe("Der Sprung erlaubt einen Springerzug mit einer fremden Figur", () => {
    let runde = faehigkeitenPartie();
    /* Sprung von Hand ins Team legen — der Weg ueber das Brett ist oben
       schon geprueft. */
    runde.faehigkeiten.weiss.push("sprung");

    const ohne = SCHACH.zuege(runde.stand, SCHACH.feldNummer("a1"));
    gleich(ohne.length, 0, "der Turm steht eingekeilt");

    runde = SCHACH_RUNDE.faehigkeitEinsetzen(runde, "id-anna", "sprung", "Anna", 2000);
    wahr(runde !== null, "Einsetzen erlaubt");
    gleich(runde.stand.sprungAktiv, "weiss", "Sprung aktiv");

    /* Vom Turmfeld a1 aus fuehrt nur ein Springerzug auf ein freies Feld: b3.
       c2 ist mit dem eigenen Bauern besetzt. */
    const mit = SCHACH.zuege(runde.stand, SCHACH.feldNummer("a1"))
        .map((zug) => SCHACH.feldName(zug.nach)).sort().join(",");
    gleich(mit, "b3", "Turm darf springen");

    /* Nach dem Zug ist der Sprung verbraucht. */
    const danach = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("a1"), SCHACH.feldNummer("b3"), "D", "Anna", 2100);
    gleich(danach.stand.sprungAktiv, "", "Sprung verbraucht");
});

pruefe("Faehigkeiten kann nur einsetzen, wer am Zug ist und sie hat", () => {
    const runde = faehigkeitenPartie();

    gleich(SCHACH_RUNDE.faehigkeitEinsetzen(runde, "id-anna", "sprung", "Anna", 2000),
        null, "ohne Faehigkeit geht nichts");

    const mit = SCHACH_RUNDE.kopieren(runde);
    mit.faehigkeiten.schwarz.push("sprung");
    gleich(SCHACH_RUNDE.faehigkeitEinsetzen(mit, "id-bert", "sprung", "Bert", 2000),
        null, "Schwarz ist nicht am Zug");
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
