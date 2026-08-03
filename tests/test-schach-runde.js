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

pruefe("Wer einem Team beigetreten ist, kann nicht mehr wechseln", () => {
    let runde = SCHACH_RUNDE.teamBeitreten(SCHACH_RUNDE.leereRunde(), "id-anna", "weiss", 1000);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "weiss", "im weissen Team");

    /* Der Beitritt zur Gegenseite prallt ab — sonst könnte man in einer Partie,
       die über Tage läuft, für beide Seiten ziehen. */
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "schwarz", 2000);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "weiss", "bleibt bei Weiss");
    gleich(runde.teams.schwarz.length, 0, "nicht bei Schwarz gelandet");

    /* Erst nach dem ausdrücklichen Verlassen geht es. */
    runde = SCHACH_RUNDE.teamVerlassen(runde, "id-anna", 3000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "schwarz", 3100);
    gleich(SCHACH_RUNDE.teamVon(runde, "id-anna"), "schwarz", "jetzt bei Schwarz");
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

/* Eine laufende Partie in der Spielart mit den Fähigkeiten. */
function faehigkeitenPartie() {
    let runde = SCHACH_RUNDE.leereRunde(1000, "faehigkeiten", "p-f", "Mit Faehigkeiten");
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-bert", "schwarz", 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "weiss", true, 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "schwarz", true, 1000);
    return runde;
}

/* Zieht die Springer hin und her — so lassen sich beliebig viele Halbzuege
   machen, ohne die Stellung zu veraendern. */
function springerZuege(runde, anzahl) {
    const wege = [
        ["id-anna", "b1", "c3"], ["id-bert", "b8", "c6"],
        ["id-anna", "c3", "b1"], ["id-bert", "c6", "b8"]
    ];

    for (let nummer = 0; nummer < anzahl; nummer++) {
        const weg = wege[nummer % wege.length];
        const neu = SCHACH_RUNDE.ziehen(runde, weg[0], SCHACH.feldNummer(weg[1]),
            SCHACH.feldNummer(weg[2]), "D", weg[0], 2000 + nummer);
        wahr(neu !== null, "Zug " + nummer + " (" + weg[1] + "-" + weg[2] + ") erlaubt");
        runde = neu;
    }
    return runde;
}

pruefe("Die Chancen der Stufen ergeben zusammen 100 Prozent", () => {
    const summe = SCHACH_VARIANTEN.STUFEN.reduce((wert, stufe) => wert + stufe.chance, 0);
    gleich(summe, 100, "Summe");
});

pruefe("Jede Stufe hat mindestens eine Faehigkeit, jede Faehigkeit eine Stufe", () => {
    for (const stufe of SCHACH_VARIANTEN.STUFEN) {
        wahr(SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id).length > 0,
            "Stufe " + stufe.id + " ist besetzt");
    }
    for (const art of Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)) {
        const stufe = SCHACH_VARIANTEN.stufeVon(art);
        wahr(!!stufe, "Stufe von " + art);
        wahr(SCHACH_VARIANTEN.chanceVon(art) > 0, "Chance von " + art);
    }
});

pruefe("Die Ziehung trifft jede Stufe in ihrem Bereich", () => {
    /* 0 liegt in der ersten Stufe, 99,9 in der letzten. */
    gleich(SCHACH_VARIANTEN.stufeVon(SCHACH_VARIANTEN.faehigkeitZiehen(0)).id, "gruen", "unten");
    gleich(SCHACH_VARIANTEN.stufeVon(SCHACH_VARIANTEN.faehigkeitZiehen(0.999)).id, "gelb", "oben");

    /* Die Verteilung ueber viele Werte muss zu den Chancen passen. */
    const gezaehlt = {};
    const schritte = 10000;

    for (let nummer = 0; nummer < schritte; nummer++) {
        const stufe = SCHACH_VARIANTEN.stufeVon(SCHACH_VARIANTEN.faehigkeitZiehen(nummer / schritte));
        gezaehlt[stufe.id] = (gezaehlt[stufe.id] || 0) + 1;
    }

    for (const stufe of SCHACH_VARIANTEN.STUFEN) {
        const anteil = (gezaehlt[stufe.id] || 0) / schritte * 100;
        wahr(Math.abs(anteil - stufe.chance) < 0.5,
            "Anteil " + stufe.id + " (" + anteil.toFixed(1) + " statt " + stufe.chance + ")");
    }
});

pruefe("Zu Beginn liegt kein Wuerfel auf dem Brett", () => {
    gleich(SCHACH_RUNDE.offeneBonusFelder(faehigkeitenPartie()).length, 0, "leer");
    gleich(SCHACH_RUNDE.offeneBonusFelder(laufendePartie()).length, 0, "klassisch: nie");
});

pruefe("Wuerfel erscheinen ueber die Zeit, ohne festen Takt", () => {
    /* Seit v2.8 wird nach JEDEM Halbzug neu gewuerfelt. Ueber viele Zuege
       muessen deshalb welche auftauchen — wann genau, ist Sache der Ziehung. */
    const runde = springerZuege(faehigkeitenPartie(), 24);

    wahr(runde.bonus.length >= 1, "nach 24 Halbzuegen liegt mindestens einer");

    for (const eintrag of runde.bonus) {
        wahr(SCHACH.figurAuf(runde.stand, eintrag.feld) === ".", "liegt auf einem leeren Feld");

        /* Seit v3.6 traegt ein Faehigkeitswuerfel nur seine STUFE — was drin
           ist, entscheidet sich erst beim Einsammeln. Ein Unglueckswuerfel
           traegt weiterhin seine Art. */
        if (eintrag.pech) {
            wahr(!!SCHACH_VARIANTEN.PECH[eintrag.art], "Unglueck mit bekannter Art");
        } else {
            wahr(SCHACH_VARIANTEN.STUFEN.some((stufe) => stufe.id === eintrag.stufe),
                "traegt eine bekannte Stufe");
        }
    }

    /* Kein Feld doppelt belegt. */
    const felder = runde.bonus.map((eintrag) => eintrag.feld);
    gleich(new Set(felder).size, felder.length, "jedes Feld nur einmal");
});

pruefe("Die Erscheinungsrate trifft ihren Wert", () => {
    /* Ueber viele Zugzaehler gemittelt muss die Chance stimmen. */
    let treffer = 0;
    const schritte = 4000;

    for (let nummer = 0; nummer < schritte; nummer++) {
        const wert = SCHACH_RUNDE._zufallsWert("p-messung|" + nummer + "|ob") * 100;
        if (wert < SCHACH_VARIANTEN.BONUS_CHANCE) {
            treffer++;
        }
    }

    const anteil = treffer / schritte * 100;
    wahr(Math.abs(anteil - SCHACH_VARIANTEN.BONUS_CHANCE) < 3,
        "Anteil " + anteil.toFixed(1) + " statt " + SCHACH_VARIANTEN.BONUS_CHANCE);
});

pruefe("Die Anzahl der Wuerfel folgt ihren Chancen", () => {
    const summe = SCHACH_VARIANTEN.BONUS_ANZAHL
        .reduce((wert, eintrag) => wert + eintrag.chance, 0);
    gleich(summe, 100, "Summe der Chancen");

    const gezaehlt = {};
    const schritte = 10000;

    for (let nummer = 0; nummer < schritte; nummer++) {
        const anzahl = SCHACH_VARIANTEN.anzahlZiehen(nummer / schritte);
        gezaehlt[anzahl] = (gezaehlt[anzahl] || 0) + 1;
    }

    for (const eintrag of SCHACH_VARIANTEN.BONUS_ANZAHL) {
        const anteil = (gezaehlt[eintrag.anzahl] || 0) / schritte * 100;
        wahr(Math.abs(anteil - eintrag.chance) < 0.5,
            eintrag.anzahl + " Wuerfel: " + anteil.toFixed(1) + " statt " + eintrag.chance);
    }
});

pruefe("Die Ziehung ist auf jedem Geraet dieselbe", () => {
    /* Der Kern der Sache: gerechnet statt gewuerfelt. Zwei getrennte Laeufe
       muessen Feld UND Inhalt gleich ergeben — sonst saehe jedes Geraet ein
       anderes Brett. */
    const einmal = springerZuege(faehigkeitenPartie(), 24);
    const zweimal = springerZuege(faehigkeitenPartie(), 24);

    gleich(SCHACH_RUNDE._bonusText(einmal), SCHACH_RUNDE._bonusText(zweimal),
        "dieselben Wuerfel");
});

pruefe("Zwei Partien ziehen verschiedene Wuerfel", () => {
    /* Die Kennung geht in die Rechnung ein, damit nicht in jeder Partie
       dasselbe passiert. */
    let andere = SCHACH_RUNDE.leereRunde(1000, "faehigkeiten", "p-andere", "Andere");
    andere = SCHACH_RUNDE.teamBeitreten(andere, "id-anna", "weiss", 1000);
    andere = SCHACH_RUNDE.teamBeitreten(andere, "id-bert", "schwarz", 1000);
    andere = SCHACH_RUNDE.bereitSetzen(andere, "weiss", true, 1000);
    andere = SCHACH_RUNDE.bereitSetzen(andere, "schwarz", true, 1000);

    const eine = springerZuege(faehigkeitenPartie(), 24);
    const zwei = springerZuege(andere, 24);

    wahr(SCHACH_RUNDE._bonusText(eine) !== SCHACH_RUNDE._bonusText(zwei), "nicht identisch");
});

/*
 * Seit v3.3 gibt es keine Hoechstzahl mehr (Wunsch [#3]): Der Nachschub darf
 * nicht mitten in der Partie aufhoeren. Geprueft wird deshalb das Gegenteil von
 * frueher - dass es ueber viele Zuege WEITERGEHT - und die einzige verbliebene
 * Grenze: das Brett selbst.
 */
pruefe("Der Nachschub hoert nicht auf", () => {
    const kurz = springerZuege(faehigkeitenPartie(), 24);
    const lang = springerZuege(faehigkeitenPartie(), 80);

    wahr(lang.bonus.length > kurz.bonus.length,
        "nach 80 Halbzuegen liegen mehr als nach 24 ("
        + lang.bonus.length + " gegen " + kurz.bonus.length + ")");
    wahr(lang.bonus.length > 3, "und mehr als die frueheren drei");
});

pruefe("Wuerfel liegen nur auf freien Feldern, jedes hoechstens einmal", () => {
    const runde = springerZuege(faehigkeitenPartie(), 80);

    for (const eintrag of runde.bonus) {
        wahr(SCHACH.figurAuf(runde.stand, eintrag.feld) === ".",
            "Feld " + eintrag.feld + " ist frei");
    }

    const felder = runde.bonus.map((eintrag) => eintrag.feld);
    gleich(new Set(felder).size, felder.length, "kein Feld doppelt belegt");
    wahr(runde.bonus.length <= SCHACH.felderVon(runde.stand),
        "nie mehr Wuerfel als Felder");
});

pruefe("Wer auf einen Wuerfel zieht, sammelt ihn ein", () => {
    let runde = faehigkeitenPartie();

    /* Der Wuerfel wird von Hand auf e4 gelegt — wo er sonst erscheint, ist
       Sache der Ziehung und oben schon geprueft. */
    runde.bonus.push({ feld: SCHACH.feldNummer("e4"), art: "doppelzug" });

    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    wahr(runde !== null, "Zug erlaubt");
    gleich(runde.faehigkeiten.weiss.join(","), "doppelzug", "eingesammelt");
    gleich(runde.bonus.length, 0, "vom Brett verschwunden");
});

pruefe("Ein eingesammelter Wuerfel bleibt weg, auch nach dem Neuladen", () => {
    let runde = faehigkeitenPartie();
    runde.bonus.push({ feld: SCHACH.feldNummer("e4"), art: "doppelzug" });
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    const wieder = SCHACH_RUNDE.normalisieren(JSON.parse(JSON.stringify(runde)));
    gleich(wieder.bonus.length, 0, "kein Wuerfel zurueck");
    gleich(wieder.faehigkeiten.weiss.join(","), "doppelzug", "Faehigkeit bleibt");
});

pruefe("Eine Partie aus der Zeit der festen Felder behaelt sie", () => {
    /* Fassung 1: vier feste Felder, davon eines schon eingesammelt. */
    const alt = {
        variante: "faehigkeiten",
        stand: { brett: SCHACH.GRUNDSTELLUNG, amZug: "weiss" },
        teams: { weiss: ["id-anna"], schwarz: ["id-bert"] },
        laeuft: true,
        zugZaehler: 3,
        bonusGesammelt: [26]
    };

    const runde = SCHACH_RUNDE.normalisieren(alt);
    gleich(runde.bonus.length, 3, "drei Felder liegen noch");
    wahr(!runde.bonus.some((eintrag) => eintrag.feld === 26), "das eingesammelte fehlt");
});

/* ------------------------------------------------------------------ *
 * Die einzelnen Fähigkeiten
 * ------------------------------------------------------------------ */

/* Legt eine Fähigkeit direkt ins Team und setzt sie ein. */
function einsetzen(runde, art, zielFeld, spieler) {
    const wer = spieler || "id-anna";
    const farbe = SCHACH_RUNDE.teamVon(runde, wer);
    const vorbereitet = SCHACH_RUNDE.kopieren(runde);

    vorbereitet.faehigkeiten[farbe].push(art);
    return SCHACH_RUNDE.faehigkeitEinsetzen(vorbereitet, wer, art, zielFeld, wer, 3000);
}

pruefe("Sprung: eine beliebige Figur zieht wie ein Springer", () => {
    const runde = einsetzen(faehigkeitenPartie(), "sprung", -1);
    wahr(runde !== null, "eingesetzt");

    gleich(runde.stand.zusatzMuster, "springer", "Muster gesetzt");
    const ziele = SCHACH.zuege(runde.stand, SCHACH.feldNummer("a1"))
        .map((zug) => SCHACH.feldName(zug.nach)).sort().join(",");
    gleich(ziele, "b3", "der Turm springt");
});

pruefe("Ausweichen: eine beliebige Figur zieht ein Feld weit", () => {
    let runde = faehigkeitenPartie();

    /* Turm a1, daneben und darueber frei — b2 ist nur schraeg zu erreichen. */
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "T...K...",
        amZug: "weiss",
        rochade: ""
    });

    const ohne = SCHACH.zuege(runde.stand, SCHACH.feldNummer("a1"))
        .map((zug) => SCHACH.feldName(zug.nach));
    wahr(ohne.indexOf("b2") === -1, "ohne Faehigkeit kein Schraegzug");

    const mit = einsetzen(runde, "ausweichen", -1);
    wahr(mit !== null, "eingesetzt");
    gleich(mit.stand.zusatzMuster, "ausweichen", "Muster gesetzt");

    const ziele = SCHACH.zuege(mit.stand, SCHACH.feldNummer("a1"))
        .map((zug) => SCHACH.feldName(zug.nach));
    wahr(ziele.indexOf("b2") !== -1, "jetzt auch ein Feld schraeg");
    wahr(ziele.indexOf("a2") !== -1, "und weiterhin gerade");
});

pruefe("Ausweichen schlaegt nicht", () => {
    let runde = faehigkeitenPartie();

    /* Weisser Turm a1, schwarzer Bauer schraeg daneben auf b2. */
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + ".b......"
            + "T...K...",
        amZug: "weiss",
        rochade: ""
    });

    const mit = einsetzen(runde, "ausweichen", -1);
    const ziele = SCHACH.zuege(mit.stand, SCHACH.feldNummer("a1"))
        .map((zug) => SCHACH.feldName(zug.nach));

    wahr(ziele.indexOf("b2") === -1, "der besetzte Nachbar ist kein Ziel");
    wahr(ziele.indexOf("a2") !== -1, "das freie Feld schon");
});

pruefe("Ausweichen geht auch, waehrend der Gegner am Zug ist", () => {
    let runde = faehigkeitenPartie();
    runde.stand.amZug = "schwarz";

    /* Anna ist im weissen Team; Schwarz ist am Zug. */
    runde.faehigkeiten.weiss.push("ausweichen");

    const neu = SCHACH_RUNDE.faehigkeitEinsetzen(
        runde, "id-anna", "ausweichen", -1, "Anna", 3000);

    wahr(neu !== null, "eingesetzt, obwohl Schwarz am Zug ist");
    gleich(neu.stand.amZug, "schwarz", "Schwarz bleibt am Zug");
    gleich(neu.stand.zusatzFarbe, "weiss", "das Muster gehoert Weiss");
    gleich(neu.faehigkeiten.weiss.indexOf("ausweichen"), -1, "verbraucht");
});

pruefe("Andere Faehigkeiten gehen NICHT waehrend des Gegnerzugs", () => {
    let runde = faehigkeitenPartie();
    runde.stand.amZug = "schwarz";
    runde.faehigkeiten.weiss.push("sprung");

    const neu = SCHACH_RUNDE.faehigkeitEinsetzen(
        runde, "id-anna", "sprung", -1, "Anna", 3000);

    gleich(neu, null, "abgewiesen");
});

/* ------------------------------------------------------------------ *
 * Faehigkeiten und das Schach (seit v3.6)
 * ------------------------------------------------------------------ */

/*
 * Weiss steht im Schach: schwarze Dame auf e8, weisser Koenig auf e1, die
 * e-Linie ist frei. Der weisse Turm auf a1 kann nichts dagegen tun.
 */
function partieImSchach() {
    const runde = faehigkeitenPartie();

    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....d..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "B......."
            + "T...K..k",
        amZug: "weiss",
        rochade: ""
    });
    return runde;
}

pruefe("Die Lage im Test ist wirklich Schach", () => {
    wahr(SCHACH.imSchach(partieImSchach().stand, "weiss"), "Weiss steht im Schach");
});

pruefe("Im Schach ist keine Faehigkeit erlaubt, die den Zug beendet", () => {
    /* Wiederbelebung beendet den Zug — danach waere der Koenig einfach weg. */
    const runde = partieImSchach();
    runde.gefallen.weiss.push({ art: "S", feld: SCHACH.feldNummer("b4") });

    const neu = einsetzen(runde, "wiederbelebung", SCHACH.feldNummer("b4"));
    gleich(neu, null, "abgewiesen");
});

pruefe("Im Schach bleibt erlaubt, was den Zug NICHT beendet", () => {
    /* Sprung kostet keinen Zug — man muss danach ohnehin aus dem Schach
       ziehen, und dabei kann er helfen. */
    const neu = einsetzen(partieImSchach(), "sprung", -1);

    wahr(neu !== null, "eingesetzt");
    gleich(neu.stand.amZug, "weiss", "Weiss bleibt am Zug");
});

pruefe("Keine Faehigkeit darf den eigenen Koenig ins Schach stellen", () => {
    /*
     * Weisser Koenig e1, schwarzer Turm auf e3, dazwischen ein weisser Bauer
     * auf e2. Der Bauernschub schiebt ihn weg — und legt den Koenig frei.
     */
    const runde = faehigkeitenPartie();
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "....t..."
            + "....B..."
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    wahr(!SCHACH.imSchach(runde.stand, "weiss"), "vorher steht Weiss nicht im Schach");
    gleich(einsetzen(runde, "bauernschub", -1), null, "der Bauernschub ist abgewiesen");
});

/* ------------------------------------------------------------------ *
 * Wuerfel einsammeln und ihr Inhalt (seit v3.6)
 * ------------------------------------------------------------------ */

pruefe("Ein Turm sammelt auch unterwegs ein", () => {
    const runde = faehigkeitenPartie();

    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "T...K...",
        amZug: "weiss",
        rochade: ""
    });
    /* Ein Wuerfel auf a3 — der Turm zieht von a1 nach a5, also darueber. */
    runde.bonus = [{ feld: SCHACH.feldNummer("a3"), art: "", stufe: "gruen" }];

    const neu = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("a1"), SCHACH.feldNummer("a5"), "D", "Anna", 4000);

    wahr(neu !== null, "gezogen");
    gleich(neu.bonus.filter((eintrag) => eintrag.feld === SCHACH.feldNummer("a3")).length,
        0, "der Wuerfel ist weg");
    gleich(neu.faehigkeiten.weiss.length, 1, "eine Faehigkeit im Vorrat");
});

pruefe("Ein Springer sammelt unterwegs NICHT ein", () => {
    const runde = faehigkeitenPartie();

    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + ".S..K...",
        amZug: "weiss",
        rochade: ""
    });
    /* b2 und b3 liegen auf dem gezeichneten L von b1 nach c3 — betreten wird
       aber nur c3. */
    runde.bonus = [
        { feld: SCHACH.feldNummer("b3"), art: "", stufe: "gruen" },
        { feld: SCHACH.feldNummer("b2"), art: "", stufe: "gruen" }
    ];

    const neu = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("b1"), SCHACH.feldNummer("c3"), "D", "Anna", 4000);

    wahr(neu !== null, "gezogen");
    gleich(neu.bonus.length, 2, "beide Wuerfel liegen noch");
    gleich(neu.faehigkeiten.weiss.length, 0, "nichts eingesammelt");
});

pruefe("Was man schon hat, kommt seltener nach", () => {
    /*
     * Ueber viele Ziehungen gemessen: Mit zwei Stueck „Sprung" im Vorrat muss
     * er deutlich unter einem Drittel liegen (bei drei gewoehnlichen
     * Faehigkeiten waere ein Drittel die Gleichverteilung).
     */
    const schritte = 3000;
    let mitVorrat = 0;
    let ohneVorrat = 0;

    for (let nummer = 0; nummer < schritte; nummer++) {
        const wert = nummer / schritte;

        if (SCHACH_VARIANTEN.faehigkeitAusStufe("gruen", wert, []) === "sprung") {
            ohneVorrat++;
        }
        if (SCHACH_VARIANTEN.faehigkeitAusStufe("gruen", wert,
            ["sprung", "sprung"]) === "sprung") {
            mitVorrat++;
        }
    }

    const ohne = ohneVorrat / schritte * 100;
    const mit = mitVorrat / schritte * 100;

    wahr(Math.abs(ohne - 100 / 3) < 1, "ohne Vorrat gleichverteilt (" + ohne.toFixed(1) + ")");
    wahr(mit < 2, "mit zwei Stueck fast nie (" + mit.toFixed(1) + ")");
});

pruefe("Bei Legendaer ist die Daempfung viel schwaecher", () => {
    /*
     * Der Grund steht in schach-varianten.js: Bei wenigen Faehigkeiten waere
     * eine harte Daempfung dasselbe wie „du bekommst die anderen garantiert
     * zuerst" — dann waere der Zufall weg.
     */
    const schritte = 3000;
    let gruen = 0;
    let gelb = 0;

    const gruenArt = SCHACH_VARIANTEN.faehigkeitenDerStufe("gruen")[0];
    const gelbArt = SCHACH_VARIANTEN.faehigkeitenDerStufe("gelb")[0];

    for (let nummer = 0; nummer < schritte; nummer++) {
        const wert = nummer / schritte;

        if (SCHACH_VARIANTEN.faehigkeitAusStufe("gruen", wert, [gruenArt]) === gruenArt) {
            gruen++;
        }
        if (SCHACH_VARIANTEN.faehigkeitAusStufe("gelb", wert, [gelbArt]) === gelbArt) {
            gelb++;
        }
    }

    wahr(gelb > gruen, "legendaer wiederholt sich eher als gewoehnlich ("
        + gelb + " gegen " + gruen + ")");
});

pruefe("Teleport: eine Figur springt auf ein freies Feld im Umkreis", () => {
    const runde = einsetzen(faehigkeitenPartie(), "teleport", -1);
    wahr(runde !== null, "eingesetzt");

    const ziele = SCHACH.zuege(runde.stand, SCHACH.feldNummer("a1"))
        .map((zug) => SCHACH.feldName(zug.nach)).sort().join(",");
    /* Aus der Grundstellung heraus sind a3, b3 und c3 frei — c1 und c2 sind
       besetzt, geschlagen wird beim Teleport nicht. */
    gleich(ziele, "a3,b3,c3", "nur freie Felder im Umkreis 2");
});

pruefe("Bauernschub: alle eigenen Bauern ruecken ein Feld vor", () => {
    const runde = einsetzen(faehigkeitenPartie(), "bauernschub", -1);
    wahr(runde !== null, "eingesetzt");

    for (const spalte of "abcdefgh") {
        gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer(spalte + "3")), "B",
            "Bauer auf " + spalte + "3");
        gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer(spalte + "2")), ".",
            spalte + "2 ist frei");
    }
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("a7")), "b",
        "schwarze Bauern bleiben stehen");
});

pruefe("Verstaerkung: ein eigener Bauer wird zum Springer", () => {
    const runde = einsetzen(faehigkeitenPartie(), "verstaerkung", SCHACH.feldNummer("e2"));
    wahr(runde !== null, "eingesetzt");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e2")), "S", "jetzt ein Springer");

    gleich(einsetzen(faehigkeitenPartie(), "verstaerkung", SCHACH.feldNummer("e7")),
        null, "nicht auf einen gegnerischen Bauern");
    gleich(einsetzen(faehigkeitenPartie(), "verstaerkung", SCHACH.feldNummer("e1")),
        null, "nicht auf den Koenig");
});

pruefe("Schutzschild: die geschuetzte Figur laesst sich nicht schlagen", () => {
    /* Weisser Turm auf d5, schwarze Dame auf d8 — sie koennte schlagen. */
    let runde = faehigkeitenPartie();
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "...dk..."
            + "........"
            + "........"
            + "...T...."
            + "........"
            + "........"
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    let geschuetzt = einsetzen(runde, "schutzschild", SCHACH.feldNummer("d5"));
    wahr(geschuetzt !== null, "eingesetzt");
    gleich(geschuetzt.stand.schildFeld, SCHACH.feldNummer("d5"), "Schild liegt auf d5");

    /* Weiss zieht mit dem Koenig — das Schild bleibt, weil eine ANDERE Figur
       gezogen hat. Danach ist Schwarz am Zug. */
    geschuetzt = SCHACH_RUNDE.ziehen(geschuetzt, "id-anna",
        SCHACH.feldNummer("e1"), SCHACH.feldNummer("f1"), "D", "Anna", 3100);
    wahr(geschuetzt !== null, "Koenigszug erlaubt");
    gleich(geschuetzt.stand.schildFeld, SCHACH.feldNummer("d5"), "Schild haelt noch");

    /* Die Dame darf d5 nicht schlagen. */
    const ziele = SCHACH.zuege(geschuetzt.stand, SCHACH.feldNummer("d8"))
        .map((zug) => SCHACH.feldName(zug.nach));
    wahr(ziele.indexOf("d5") === -1, "d5 ist kein Ziel mehr");
    wahr(ziele.indexOf("d6") !== -1, "die Dame darf aber davor ziehen");

    gleich(einsetzen(runde, "schutzschild", SCHACH.feldNummer("e1")), null,
        "auf den Koenig wirkt es nicht");
});

pruefe("Fessel: die gefesselte Figur darf einen Zug lang nicht ziehen", () => {
    let runde = einsetzen(faehigkeitenPartie(), "fessel", SCHACH.feldNummer("b8"));
    wahr(runde !== null, "eingesetzt");
    gleich(runde.stand.fesselFeld, SCHACH.feldNummer("b8"), "Fessel liegt");
    gleich(runde.stand.fesselFarbe, "schwarz", "auf Schwarz");

    /* Weiss zieht, damit Schwarz an der Reihe ist. */
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 3050);
    gleich(runde.stand.fesselFeld, SCHACH.feldNummer("b8"), "Fessel haelt noch");

    gleich(SCHACH.zuege(runde.stand, SCHACH.feldNummer("b8")).length, 0,
        "der Springer steht fest");
    wahr(SCHACH.zuege(runde.stand, SCHACH.feldNummer("g8")).length > 0,
        "der andere Springer darf");

    /* Nach dem Zug der gefesselten Seite ist sie wieder frei. */
    const danach = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("g8"), SCHACH.feldNummer("f6"), "D", "Bert", 3100);
    gleich(danach.stand.fesselFeld, -1, "Fessel verfallen");

    gleich(einsetzen(faehigkeitenPartie(), "fessel", SCHACH.feldNummer("e8")), null,
        "der Koenig wird nicht gefesselt");
    gleich(einsetzen(faehigkeitenPartie(), "fessel", SCHACH.feldNummer("b1")), null,
        "und keine eigene Figur");
});

pruefe("Erdbeben: drei Reihen rutschen zur Seite", () => {
    let runde = faehigkeitenPartie();
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "...bbb.."
            + "...b.b.."
            + "...bbb.."
            + "........"
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    /* f5 liegt in der rechten Haelfte - es schiebt nach rechts. Betroffen sind
       die angetippte Reihe und je eine darueber und darunter. */
    const nachher = einsetzen(runde, "erdbeben", SCHACH.feldNummer("f5"));
    wahr(nachher !== null, "eingesetzt");

    gleich(SCHACH.figurAuf(nachher.stand, SCHACH.feldNummer("d6")), ".", "d6 geraeumt");
    gleich(SCHACH.figurAuf(nachher.stand, SCHACH.feldNummer("g6")), "b", "bis g6 gerutscht");
    gleich(SCHACH.figurAuf(nachher.stand, SCHACH.feldNummer("e5")), "b",
        "in der Mittelreihe rueckt d5 nach e5 nach");
});

pruefe("Erdbeben laesst Koenige stehen", () => {
    let runde = faehigkeitenPartie();
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "........"
            + "........"
            + "........"
            + "...k...."
            + "........"
            + "........"
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    /* Rund um d4 steht nur der schwarze Koenig auf d5. */
    gleich(einsetzen(runde, "erdbeben", SCHACH.feldNummer("d4")), null,
        "nichts zu verschieben");
});

pruefe("Wiedergeburt: die zuletzt verlorene Figur kehrt zurueck", () => {
    let runde = faehigkeitenPartie();

    /* Schwarz schlaegt einen weissen Bauern: 1. e4 d5 2. exd5? Nein —
       einfacher von Hand. */
    runde.verloren.weiss.push("T");

    const zurueck = einsetzen(runde, "wiedergeburt", SCHACH.feldNummer("b1"));
    gleich(zurueck, null, "nicht auf ein besetztes Feld");

    /* Platz auf der Grundreihe schaffen. */
    let frei = SCHACH_RUNDE.kopieren(runde);
    frei.stand.brett = SCHACH._brettMit(frei.stand.brett, SCHACH.feldNummer("b1"), ".");
    frei.verloren.weiss.push("T");

    const gelungen = einsetzen(frei, "wiedergeburt", SCHACH.feldNummer("b1"));
    wahr(gelungen !== null, "eingesetzt");
    gleich(SCHACH.figurAuf(gelungen.stand, SCHACH.feldNummer("b1")), "T", "Turm steht wieder da");
    gleich(gelungen.verloren.weiss.length, 1, "einer weniger im Verlust");
});

pruefe("Wiedergeburt geht nur auf der eigenen Grundreihe und nur mit Verlust", () => {
    let runde = faehigkeitenPartie();
    runde.stand = SCHACH._brettMit ? runde.stand : runde.stand;

    gleich(einsetzen(runde, "wiedergeburt", SCHACH.feldNummer("e4")), null,
        "ohne verlorene Figur geht nichts");

    let mitVerlust = SCHACH_RUNDE.kopieren(runde);
    mitVerlust.verloren.weiss.push("D");
    gleich(einsetzen(mitVerlust, "wiedergeburt", SCHACH.feldNummer("e4")), null,
        "nicht mitten auf dem Brett");
});

/* ------------------------------------------------------------------ *
 * Wiederbelebung (seit v3.3): zurueck an den Ort des Falls
 * ------------------------------------------------------------------ */

pruefe("Wiederbelebung holt die Figur genau an ihr Grab", () => {
    let runde = faehigkeitenPartie();

    /* Ein weisser Springer ist auf e4 gefallen. */
    const grab = SCHACH.feldNummer("e4");
    runde.gefallen.weiss.push({ art: "S", feld: grab });

    const gelungen = einsetzen(runde, "wiederbelebung", grab);

    wahr(gelungen !== null, "eingesetzt");
    gleich(SCHACH.figurAuf(gelungen.stand, grab), "S", "der Springer steht wieder da");
    gleich(gelungen.gefallen.weiss.length, 0, "der Eintrag ist verbraucht");
});

pruefe("Wiederbelebung geht nur auf das eigene Grab", () => {
    let runde = faehigkeitenPartie();
    const grab = SCHACH.feldNummer("e4");

    gleich(einsetzen(runde, "wiederbelebung", grab), null,
        "ohne gefallene Figur geht nichts");

    /* Ein Feld, auf dem NICHTS gefallen ist. */
    let mitGrab = SCHACH_RUNDE.kopieren(runde);
    mitGrab.gefallen.weiss.push({ art: "D", feld: grab });
    gleich(einsetzen(mitGrab, "wiederbelebung", SCHACH.feldNummer("d4")), null,
        "nicht auf ein beliebiges Feld");

    /* Das Grab eines GEGNERS zaehlt nicht. */
    let fremdesGrab = SCHACH_RUNDE.kopieren(runde);
    fremdesGrab.gefallen.schwarz.push({ art: "D", feld: grab });
    gleich(einsetzen(fremdesGrab, "wiederbelebung", grab), null,
        "kein fremdes Grab");
});

pruefe("Wiederbelebung geht nicht auf ein besetztes Grab", () => {
    let runde = faehigkeitenPartie();

    /* b1 ist besetzt (Springer in der Grundstellung). */
    const besetzt = SCHACH.feldNummer("b1");
    runde.gefallen.weiss.push({ art: "T", feld: besetzt });

    gleich(einsetzen(runde, "wiederbelebung", besetzt), null,
        "dort steht schon jemand");
});

pruefe("Wiederbelebung kostet den ganzen Zug", () => {
    let runde = faehigkeitenPartie();
    const grab = SCHACH.feldNummer("e4");
    runde.gefallen.weiss.push({ art: "S", feld: grab });

    const nachher = einsetzen(runde, "wiederbelebung", grab);
    gleich(nachher.stand.amZug, "schwarz", "der Gegner ist dran");

    /* Zum Vergleich: eine gewoehnliche Faehigkeit laesst einen am Zug. */
    let andere = faehigkeitenPartie();
    gleich(einsetzen(andere, "sprung", -1).stand.amZug, "weiss", "Sprung nicht");
});

pruefe("Der Doppelzug geht der Wiederbelebung vor", () => {
    let runde = faehigkeitenPartie();
    const grab = SCHACH.feldNummer("e4");
    runde.gefallen.weiss.push({ art: "S", feld: grab });
    runde.stand.extraZug = "weiss";

    const nachher = einsetzen(runde, "wiederbelebung", grab);

    gleich(nachher.stand.amZug, "weiss", "Weiss bleibt am Zug");
    gleich(nachher.stand.extraZug, "", "dafuer ist der Doppelzug aufgebraucht");
});

pruefe("Wer geschlagen wird, kommt mit seinem Feld in die Grabliste", () => {
    let runde = faehigkeitenPartie();

    /* 1. e4 d5 2. exd5 - Weiss schlaegt auf d5. */
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "", "Anna");
    runde = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("d7"), SCHACH.feldNummer("d5"), "", "Bert");
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e4"), SCHACH.feldNummer("d5"), "", "Anna");

    gleich(runde.gefallen.schwarz.length, 1, "ein schwarzer Stein ist gefallen");
    gleich(runde.gefallen.schwarz[0].art, "B", "ein Bauer");
    gleich(runde.gefallen.schwarz[0].feld, SCHACH.feldNummer("d5"), "auf d5");

    /* Die alte Liste bleibt unveraendert - sie traegt weiter nur die Art. */
    gleich(runde.verloren.schwarz.join(","), "B", "verloren unveraendert");
});

pruefe("Die Grabliste ueberlebt das Speichern", () => {
    let runde = faehigkeitenPartie();
    runde.gefallen.weiss.push({ art: "T", feld: SCHACH.feldNummer("h5") });

    const zurueck = SCHACH_RUNDE.normalisieren(JSON.parse(JSON.stringify(runde)));

    gleich(zurueck.gefallen.weiss.length, 1, "ein Eintrag");
    gleich(zurueck.gefallen.weiss[0].feld, SCHACH.feldNummer("h5"), "mit seinem Feld");
});

/* ------------------------------------------------------------------ *
 * Haendler (seit v3.3)
 * ------------------------------------------------------------------ */

pruefe("Jedes Angebot des Haendlers ist ungefaehr gleichwertig", () => {
    const wert = (seite) => (SCHACH_RUNDE.FIGUR_WERT[seite.art] || 0) * seite.anzahl;

    for (const angebot of SCHACH_VARIANTEN.HANDEL) {
        const abstand = Math.abs(wert(angebot.gibt) - wert(angebot.bekommt));

        wahr(abstand <= 1, "Abstand hoechstens 1 bei "
            + angebot.gibt.anzahl + " " + angebot.gibt.art + " gegen "
            + angebot.bekommt.anzahl + " " + angebot.bekommt.art
            + " (war " + abstand + ")");
    }
});

pruefe("Alle Geraete sehen dasselbe Angebot", () => {
    const runde = faehigkeitenPartie();

    const einer = SCHACH_RUNDE.handelsAngebot(runde, "weiss");
    const anderer = SCHACH_RUNDE.handelsAngebot(SCHACH_RUNDE.kopieren(runde), "weiss");

    gleich(JSON.stringify(einer), JSON.stringify(anderer), "gerechnet, nicht gewuerfelt");
});

pruefe("Der Haendler nimmt die hintersten Figuren", () => {
    const runde = faehigkeitenPartie();
    const angebot = SCHACH_RUNDE.handelsAngebot(runde, "weiss");

    if (!angebot) {
        return;
    }

    /* Alles, was weggeht, gehoert mir und ist von der richtigen Art. */
    for (const feld of angebot.gibtFelder) {
        const figur = SCHACH.figurAuf(runde.stand, feld);
        gleich(SCHACH.farbeVon(figur), "weiss", "eigene Figur");
        gleich(SCHACH.artVon(figur), angebot.gibt.art, "richtige Art");
    }
    gleich(angebot.gibtFelder.length, angebot.gibt.anzahl, "genau so viele");
});

pruefe("Ein angenommener Handel tauscht wirklich", () => {
    let runde = faehigkeitenPartie();
    const angebot = SCHACH_RUNDE.handelsAngebot(runde, "weiss");
    wahr(angebot !== null, "es gibt ein Angebot");

    const vorher = angebot.gibtFelder.slice();
    const nachher = einsetzen(runde, "haendler", -1);

    wahr(nachher !== null, "eingesetzt");

    /* Die abgegebenen Felder tragen jetzt entweder nichts oder das Neue. */
    const neueArt = angebot.bekommt.art;
    for (const feld of angebot.bekommtFelder) {
        gleich(SCHACH.artVon(SCHACH.figurAuf(nachher.stand, feld)), neueArt,
            "das Eingetauschte steht da");
    }

    const weg = vorher.filter((feld) => angebot.bekommtFelder.indexOf(feld) === -1);
    for (const feld of weg) {
        gleich(SCHACH.figurAuf(nachher.stand, feld), ".", "abgegeben und leer");
    }
});

pruefe("Der Handel kostet den ganzen Zug", () => {
    const runde = faehigkeitenPartie();
    const nachher = einsetzen(runde, "haendler", -1);

    gleich(nachher.stand.amZug, "schwarz", "der Gegner ist dran");
});

pruefe("Ohne passende Figuren gibt es kein Angebot", () => {
    let runde = faehigkeitenPartie();

    /* Ein leeres Brett bis auf die Koenige: Da ist nichts zu handeln. */
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    gleich(SCHACH_RUNDE.handelsAngebot(runde, "weiss"), null, "kein Angebot");
    gleich(einsetzen(runde, "haendler", -1), null, "und nicht einsetzbar");
});

pruefe("Geschlagene Figuren landen im Verlust", () => {
    let runde = faehigkeitenPartie();
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);
    runde = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("d7"), SCHACH.feldNummer("d5"), "D", "Bert", 2100);
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e4"), SCHACH.feldNummer("d5"), "D", "Anna", 2200);

    gleich(runde.verloren.schwarz.join(","), "B", "Schwarz hat einen Bauern verloren");
    gleich(runde.verloren.weiss.length, 0, "Weiss noch nichts");
});

pruefe("Der Doppelzug laesst dieselbe Seite noch einmal ziehen", () => {
    let runde = einsetzen(faehigkeitenPartie(), "doppelzug", -1);
    wahr(runde !== null, "eingesetzt");
    gleich(runde.stand.extraZug, "weiss", "Doppelzug vorgemerkt");

    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("d2"), SCHACH.feldNummer("d4"), "D", "Anna", 3100);
    gleich(runde.stand.amZug, "weiss", "Weiss ist gleich noch einmal dran");
    gleich(runde.stand.extraZug, "", "und die Faehigkeit ist weg");

    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 3200);
    gleich(runde.stand.amZug, "schwarz", "danach wieder normal");
});

pruefe("Ein Zusatzmuster gilt nur fuer einen Zug", () => {
    let runde = einsetzen(faehigkeitenPartie(), "sprung", -1);
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("a1"), SCHACH.feldNummer("b3"), "D", "Anna", 3100);

    gleich(runde.stand.zusatzMuster, "", "verbraucht");
    gleich(runde.stand.zusatzFarbe, "", "und keine Farbe mehr");
});

pruefe("Faehigkeiten kann nur einsetzen, wer am Zug ist und sie hat", () => {
    const runde = faehigkeitenPartie();

    gleich(SCHACH_RUNDE.faehigkeitEinsetzen(runde, "id-anna", "sprung", -1, "Anna", 2000),
        null, "ohne Faehigkeit geht nichts");

    const mit = SCHACH_RUNDE.kopieren(runde);
    mit.faehigkeiten.schwarz.push("sprung");
    gleich(SCHACH_RUNDE.faehigkeitEinsetzen(mit, "id-bert", "sprung", -1, "Bert", 2000),
        null, "Schwarz ist nicht am Zug");
});

/* ------------------------------------------------------------------ *
 * Einstellungen und Abstimmung
 * ------------------------------------------------------------------ */

/* Eine Partie mit zwei Leuten im weissen Team und Einigkeitspflicht. */
function einigkeitsPartie() {
    let runde = SCHACH_RUNDE.leereRunde(1000, "standard", "p-e", "Mit Einigkeit");
    runde.regeln.einigkeit = true;

    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-cem", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-bert", "schwarz", 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "weiss", true, 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "schwarz", true, 1000);
    return runde;
}

pruefe("Ohne Einigkeitspflicht zieht ein Vorschlag sofort", () => {
    const runde = SCHACH_RUNDE.zugVorschlagen(laufendePartie(), "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    gleich(runde.zugZaehler, 1, "gezogen");
    gleich(runde.vorschlag, null, "kein Vorschlag offen");
});

pruefe("Allein im Team braucht es keine Abstimmung", () => {
    let runde = SCHACH_RUNDE.leereRunde(1000, "standard", "p-a", "Allein");
    runde.regeln.einigkeit = true;
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-anna", "weiss", 1000);
    runde = SCHACH_RUNDE.teamBeitreten(runde, "id-bert", "schwarz", 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "weiss", true, 1000);
    runde = SCHACH_RUNDE.bereitSetzen(runde, "schwarz", true, 1000);

    const danach = SCHACH_RUNDE.zugVorschlagen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    gleich(danach.zugZaehler, 1, "sofort gezogen");
});

pruefe("Mit Einigkeitspflicht wird erst vorgeschlagen, dann gezogen", () => {
    let runde = SCHACH_RUNDE.zugVorschlagen(einigkeitsPartie(), "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    gleich(runde.zugZaehler, 0, "noch nicht gezogen");
    wahr(runde.vorschlag !== null, "ein Vorschlag steht");
    gleich(runde.vorschlag.stimmen.join(","), "id-anna", "der Vorschlagende ist dafuer");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e4")), ".", "Brett unveraendert");

    /* Cem stimmt zu — jetzt sind alle dafuer. */
    runde = SCHACH_RUNDE.zugMittragen(runde, "id-cem", 2100);
    gleich(runde.zugZaehler, 1, "jetzt gezogen");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e4")), "B", "Bauer steht auf e4");
    gleich(runde.vorschlag, null, "Vorschlag ist erledigt");
});

pruefe("Der Gegner kann nicht mitstimmen, und ein Vorschlag laesst sich verwerfen", () => {
    let runde = SCHACH_RUNDE.zugVorschlagen(einigkeitsPartie(), "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    gleich(SCHACH_RUNDE.zugMittragen(runde, "id-bert", 2100), null,
        "Schwarz stimmt nicht mit ab");

    runde = SCHACH_RUNDE.vorschlagVerwerfen(runde, "id-cem", 2200);
    gleich(runde.vorschlag, null, "verworfen");
    gleich(runde.zugZaehler, 0, "und nichts gezogen");
});

pruefe("Auch Faehigkeiten werden abgestimmt", () => {
    let runde = einigkeitsPartie();
    runde.faehigkeiten.weiss.push("bauernschub");

    runde = SCHACH_RUNDE.faehigkeitVorschlagen(runde, "id-anna", "bauernschub", -1,
        "Anna", 2000);

    wahr(runde !== null, "vorgeschlagen");
    gleich(runde.vorschlag.art, "faehigkeit", "als Faehigkeit vermerkt");
    gleich(runde.vorschlag.faehigkeit, "bauernschub", "die richtige");
    gleich(runde.faehigkeiten.weiss.length, 1, "noch nicht verbraucht");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("a3")), ".", "Brett unveraendert");

    runde = SCHACH_RUNDE.zugMittragen(runde, "id-cem", 2100);
    gleich(runde.faehigkeiten.weiss.length, 0, "jetzt verbraucht");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("a3")), "B", "die Bauern sind vor");
    gleich(runde.vorschlag, null, "Abstimmung erledigt");
});

pruefe("Die Frist steht im Vorschlag und laeuft ab", () => {
    let runde = SCHACH_RUNDE.zugVorschlagen(einigkeitsPartie(), "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 10000);

    gleich(runde.vorschlag.frist, 10000 + SCHACH_RUNDE.FRIST_SEKUNDEN[0] * 1000,
        "zehn Sekunden ab dem Vorschlag");

    /* Vorher passiert nichts. */
    gleich(SCHACH_RUNDE.fristAbgelaufen(runde, 12000), null, "vor Ablauf nichts");

    /* Danach geht der Zug durch, auch ohne Cems Stimme. */
    const danach = SCHACH_RUNDE.fristAbgelaufen(runde, 20001);
    wahr(danach !== null, "nach Ablauf ausgefuehrt");
    gleich(danach.zugZaehler, 1, "gezogen");
    gleich(danach.versaeumt["id-cem"], 1, "Cem hat einen Strich");
    gleich(danach.versaeumt["id-anna"], undefined, "Anna nicht");
});

pruefe("Wer zweimal nicht abstimmt, verkuerzt die Frist — bis er wieder mitmacht", () => {
    let runde = einigkeitsPartie();
    gleich(SCHACH_RUNDE.fristFuer(runde, "weiss"), SCHACH_RUNDE.FRIST_SEKUNDEN[0] * 1000,
        "am Anfang die volle Frist");

    runde.versaeumt["id-cem"] = 1;
    gleich(SCHACH_RUNDE.fristFuer(runde, "weiss"), SCHACH_RUNDE.FRIST_SEKUNDEN[0] * 1000,
        "nach einem Mal noch nicht");

    runde.versaeumt["id-cem"] = 2;
    gleich(SCHACH_RUNDE.fristFuer(runde, "weiss"), SCHACH_RUNDE.FRIST_SEKUNDEN[1] * 1000,
        "nach zweimal kuerzer");

    runde.versaeumt["id-cem"] = 4;
    gleich(SCHACH_RUNDE.fristFuer(runde, "weiss"), SCHACH_RUNDE.FRIST_SEKUNDEN[2] * 1000,
        "nach viermal noch kuerzer");

    runde.versaeumt["id-cem"] = 20;
    gleich(SCHACH_RUNDE.fristFuer(runde, "weiss"),
        SCHACH_RUNDE.FRIST_SEKUNDEN[SCHACH_RUNDE.FRIST_SEKUNDEN.length - 1] * 1000,
        "aber nie unter die letzte Stufe");

    /* Stimmt er wieder mit, faengt es von vorn an. */
    let mit = SCHACH_RUNDE.zugVorschlagen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 10000);
    mit = SCHACH_RUNDE.zugMittragen(mit, "id-cem", 10100);

    gleich(mit.versaeumt["id-cem"], undefined, "Zaehler zurueckgesetzt");
    gleich(SCHACH_RUNDE.fristFuer(mit, "weiss"), SCHACH_RUNDE.FRIST_SEKUNDEN[0] * 1000,
        "und wieder die volle Frist");
});

pruefe("Ein Vorschlag muss regelkonform sein", () => {
    gleich(SCHACH_RUNDE.zugVorschlagen(einigkeitsPartie(), "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e5"), "D", "Anna", 2000),
        null, "drei Felder gehen nicht");
});

pruefe("Versteckte Spielarten bleiben gueltig, stehen aber nicht zur Auswahl", () => {
    /*
     * „Fähigkeiten sammeln" ist seit v2.9 versteckt: Dasselbe erreicht man mit
     * „Klassisch" und dem Würfel-Haken. Laufende Partien tragen die Kennung
     * aber weiter im Stand und müssen ihre Spielart behalten.
     */
    const versteckte = SCHACH_VARIANTEN.liste.filter((eintrag) => eintrag.versteckt);
    wahr(versteckte.length > 0, "mindestens eine versteckt");

    for (const variante of versteckte) {
        wahr(SCHACH_VARIANTEN.gibtEs(variante.id), "gilt weiterhin: " + variante.id);
        gleich(SCHACH_VARIANTEN.holen(variante.id).id, variante.id,
            "wird gefunden: " + variante.id);
        wahr(SCHACH_VARIANTEN.zurAuswahl().indexOf(variante) === -1,
            "nicht zur Auswahl: " + variante.id);
    }

    /* Eine laufende Partie in dieser Spielart behaelt alles. */
    const runde = SCHACH_RUNDE.normalisieren({
        variante: "faehigkeiten",
        stand: { brett: SCHACH.GRUNDSTELLUNG, amZug: "weiss" },
        teams: { weiss: ["id-anna"], schwarz: ["id-bert"] },
        laeuft: true
    });

    gleich(runde.variante, "faehigkeiten", "Spielart bleibt");
    gleich(SCHACH_RUNDE.faehigkeitenAn(runde), true, "und die Wuerfel auch");
});

pruefe("Der Schalter fuer Faehigkeiten geht der Spielart vor", () => {
    /* Klassisch, aber mit Würfeln. */
    let runde = SCHACH_RUNDE.leereRunde(1000, "standard", "p-w", "Mit Wuerfeln");
    gleich(SCHACH_RUNDE.faehigkeitenAn(runde), false, "klassisch: ohne");

    runde.regeln.faehigkeiten = true;
    gleich(SCHACH_RUNDE.faehigkeitenAn(runde), true, "eingeschaltet");

    /* Und umgekehrt: Fähigkeiten-Spielart ohne Würfel. */
    const ohne = SCHACH_RUNDE.leereRunde(1000, "faehigkeiten", "p-o", "Ohne");
    gleich(SCHACH_RUNDE.faehigkeitenAn(ohne), true, "Spielart: mit");

    ohne.regeln.faehigkeiten = false;
    gleich(SCHACH_RUNDE.faehigkeitenAn(ohne), false, "abgeschaltet");
});

pruefe("Partien von frueher behalten ihr Verhalten", () => {
    /* Kein `regeln` im Stand: Dann entscheidet die Spielart wie vor v2.5. */
    const alt = SCHACH_RUNDE.normalisieren({
        variante: "faehigkeiten",
        stand: { brett: SCHACH.GRUNDSTELLUNG, amZug: "weiss" },
        teams: { weiss: ["id-anna"], schwarz: ["id-bert"] },
        laeuft: true
    });

    gleich(alt.regeln.faehigkeiten, null, "keine Angabe");
    gleich(SCHACH_RUNDE.faehigkeitenAn(alt), true, "trotzdem mit Wuerfeln");
    gleich(alt.regeln.einigkeit, false, "und ohne Abstimmung");
    gleich(alt.regeln.seltenheitZeigen, true, "Seltenheit sichtbar");
});

pruefe("Jede Bewegung hinterlaesst ihren Weg im Verlauf", () => {
    /* Daraus zeichnet der Bildschirm die Pfeile — auch für Fähigkeiten, die
       mehrere Figuren auf einmal bewegen. */
    let runde = faehigkeitenPartie();

    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);

    let letzter = runde.verlauf[runde.verlauf.length - 1];
    gleich(letzter.wege.length, 1, "ein Zug, ein Weg");
    gleich(letzter.wege[0].von, SCHACH.feldNummer("e2"), "von e2");

    /* Der Bauernschub bewegt bis zu acht Bauern auf einmal. */
    const geschoben = einsetzen(faehigkeitenPartie(), "bauernschub", -1);
    letzter = geschoben.verlauf[geschoben.verlauf.length - 1];
    gleich(letzter.wege.length, 8, "acht Wege");

    for (const weg of letzter.wege) {
        gleich(SCHACH.reiheVon(weg.von) - SCHACH.reiheVon(weg.nach), 1, "je ein Feld vor");
    }
});

pruefe("Die Rochade zeichnet zwei Wege — Koenig und Turm", () => {
    let runde = laufendePartie();
    runde.stand = SCHACH.standNormalisieren({
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "T...K..T",
        amZug: "weiss"
    });

    const lage = SCHACH.rochadeLage(runde.stand, "weiss");
    const kurz = lage.find((eintrag) => eintrag.seite === "kurz");

    const danach = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e1"), kurz.zielFeld, "D", "Anna", 2000);

    const letzter = danach.verlauf[danach.verlauf.length - 1];
    gleich(letzter.wege.length, 2, "zwei Wege");
    gleich(letzter.wege[1].von, SCHACH.feldNummer("h1"), "der Turm kommt von h1");
});

pruefe("Die Bilanz zaehlt Beute und Verlust nach Figurenwert", () => {
    let runde = laufendePartie();

    const leer = SCHACH_RUNDE.bilanz(runde, "weiss");
    gleich(leer.punkte, 0, "am Anfang ausgeglichen");
    gleich(leer.geschlagen.length, 0, "nichts geschlagen");

    /* 1. e4 d5 2. exd5 — Weiss gewinnt einen Bauern. */
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 2000);
    runde = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("d7"), SCHACH.feldNummer("d5"), "D", "Bert", 2100);
    runde = SCHACH_RUNDE.ziehen(runde, "id-anna",
        SCHACH.feldNummer("e4"), SCHACH.feldNummer("d5"), "D", "Anna", 2200);

    const weiss = SCHACH_RUNDE.bilanz(runde, "weiss");
    gleich(weiss.geschlagen.join(","), "B", "ein Bauer erbeutet");
    gleich(weiss.punkte, 1, "ein Punkt Vorsprung");

    const schwarz = SCHACH_RUNDE.bilanz(runde, "schwarz");
    gleich(schwarz.verloren.join(","), "B", "und Schwarz hat ihn verloren");
    gleich(schwarz.punkte, -1, "ein Punkt Rueckstand");
});

pruefe("Frost: eingefroren zieht nicht und wird nicht geschlagen", () => {
    let runde = faehigkeitenPartie();
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "...s...."
            + "........"
            + "...T...."
            + "........"
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    const eingefroren = einsetzen(runde, "frost", SCHACH.feldNummer("d6"));
    wahr(eingefroren !== null, "eingesetzt");
    gleich(eingefroren.stand.frostFeld, SCHACH.feldNummer("d6"), "Frost liegt auf d6");

    /* Der weisse Turm darf den Springer nicht schlagen. */
    const ziele = SCHACH.zuege(eingefroren.stand, SCHACH.feldNummer("d4"))
        .map((zug) => SCHACH.feldName(zug.nach));
    wahr(ziele.indexOf("d6") === -1, "d6 ist unantastbar");
    wahr(ziele.indexOf("d5") !== -1, "davor darf der Turm ziehen");

    /* Und die eingefrorene Figur selbst zieht nicht. */
    const danach = SCHACH_RUNDE.ziehen(eingefroren, "id-anna",
        SCHACH.feldNummer("d4"), SCHACH.feldNummer("d5"), "D", "Anna", 3100);
    gleich(SCHACH.zuege(danach.stand, SCHACH.feldNummer("d6")).length, 0,
        "der Springer steht fest");

    gleich(einsetzen(runde, "frost", SCHACH.feldNummer("e8")), null,
        "der Koenig wird nicht eingefroren");
});

pruefe("Spiegel: eine Figur wird auf ein freies Nachbarfeld verdoppelt", () => {
    const runde = einsetzen(faehigkeitenPartie(), "spiegel", SCHACH.feldNummer("a2"));
    wahr(runde !== null, "eingesetzt");

    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("a2")), "B", "das Original bleibt");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("a3")), "B", "die Kopie daneben");

    gleich(einsetzen(faehigkeitenPartie(), "spiegel", SCHACH.feldNummer("e1")), null,
        "der Koenig wird nicht gespiegelt");
    gleich(einsetzen(faehigkeitenPartie(), "spiegel", SCHACH.feldNummer("e7")), null,
        "und keine gegnerische Figur");
    gleich(einsetzen(faehigkeitenPartie(), "spiegel", SCHACH.feldNummer("b1")), null,
        "ohne freies Nachbarfeld geht es nicht");
});

pruefe("Nudelholz: zwei Spalten rollen in die getippte Richtung", () => {
    let runde = faehigkeitenPartie();
    runde.stand = SCHACH.standNormalisieren({
        variante: "faehigkeiten",
        brett: "....k..."
            + "........"
            + "........"
            + "bb......"
            + "........"
            + "........"
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    /* Oben angetippt: nach oben. */
    const hoch = einsetzen(runde, "nudelholz", SCHACH.feldNummer("a8"));
    wahr(hoch !== null, "eingesetzt");
    gleich(SCHACH.figurAuf(hoch.stand, SCHACH.feldNummer("a6")), "b", "a5 nach a6");
    gleich(SCHACH.figurAuf(hoch.stand, SCHACH.feldNummer("b6")), "b", "b5 nach b6");
    gleich(SCHACH.figurAuf(hoch.stand, SCHACH.feldNummer("a5")), ".", "a5 ist leer");
    gleich(hoch.verlauf[hoch.verlauf.length - 1].wege.length, 2, "zwei Wege im Verlauf");

    /* Unten angetippt: nach unten. */
    const runter = einsetzen(runde, "nudelholz", SCHACH.feldNummer("a1"));
    wahr(runter !== null, "eingesetzt");
    gleich(SCHACH.figurAuf(runter.stand, SCHACH.feldNummer("a4")), "b", "a5 nach a4");

    /* Mitten auf dem Brett gibt es keine Richtung. */
    gleich(einsetzen(runde, "nudelholz", SCHACH.feldNummer("d4")), null,
        "nur am Rand");

    /* Koenige bleiben stehen. */
    gleich(SCHACH.figurAuf(hoch.stand, SCHACH.feldNummer("e8")), "k", "der Koenig blieb");
});

/* ------------------------------------------------------------------ *
 * Unglückswürfel
 * ------------------------------------------------------------------ */

/* Legt einen Unglückswürfel auf ein Feld und zieht mit einer Figur darauf. */
function pechEinsammeln(runde, art, von, nach) {
    const vorbereitet = SCHACH_RUNDE.kopieren(runde);
    vorbereitet.bonus.push({ feld: SCHACH.feldNummer(nach), art: art, pech: true });

    return SCHACH_RUNDE.ziehen(vorbereitet, "id-anna",
        SCHACH.feldNummer(von), SCHACH.feldNummer(nach), "D", "Anna", 4000);
}

pruefe("Jede Stufe hat mindestens einen Unglueckswuerfel", () => {
    for (const stufe of SCHACH_VARIANTEN.STUFEN) {
        wahr(SCHACH_VARIANTEN.pechDerStufe(stufe.id).length > 0, "Stufe " + stufe.id);
    }

    /* Und die Ziehung erreicht auch den zweiten Eintrag einer Stufe. */
    const gezogen = new Set();
    for (let schritt = 0; schritt < 1000; schritt++) {
        gezogen.add(SCHACH_VARIANTEN.pechZiehen(schritt / 1000));
    }

    for (const art of Object.keys(SCHACH_VARIANTEN.PECH)) {
        wahr(gezogen.has(art), "wird gezogen: " + art);
    }
});

pruefe("Volles Glas truebt die Sicht, ohne das Brett zu aendern", () => {
    let runde = faehigkeitenPartie();
    const vorher = runde.stand.brett;

    runde = pechEinsammeln(runde, "vollesGlas", "e2", "e4");
    wahr(runde !== null, "eingesammelt");

    /* Das Brett ist nur um den eigenen Zug veraendert — keine Figur wurde
       verschoben oder getauscht. */
    gleich(runde.stand.glasFarbe, "weiss", "Weiss sieht falsch");
    gleich(runde.stand.glasBis, SCHACH_RUNDE.GLAS_HALBZUEGE + 1, "und zwar begrenzt");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e4")), "B", "der Bauer steht auf e4");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e7")), "b",
        "die gegnerischen Figuren stehen unveraendert");

    /* Und die Regeln bleiben unberuehrt: Schwarz zieht ganz normal. */
    const danach = SCHACH_RUNDE.ziehen(runde, "id-bert",
        SCHACH.feldNummer("e7"), SCHACH.feldNummer("e5"), "D", "Bert", 4100);
    wahr(danach !== null, "Schwarz kann ziehen");
    gleich(danach.stand.glasFarbe, "weiss", "das Glas bleibt bis zum Ablauf");
});

pruefe("Ein Unglueckswuerfel kommt nicht in den Vorrat, sondern wirkt sofort", () => {
    const runde = pechEinsammeln(faehigkeitenPartie(), "stolperstein", "e2", "e4");

    wahr(runde !== null, "Zug erlaubt");
    gleich(runde.faehigkeiten.weiss.length, 0, "nichts im Vorrat");
    gleich(runde.bonus.length, 0, "vom Brett verschwunden");

    const letzter = runde.verlauf[runde.verlauf.length - 1];
    gleich(letzter.wirkung, "pech", "als Unglueck festgehalten");
    wahr(letzter.text.indexOf("Stolperstein") !== -1, "mit Namen im Verlauf");
});

pruefe("Stolperstein wirft die einsammelnde Figur zurueck", () => {
    const runde = pechEinsammeln(faehigkeitenPartie(), "stolperstein", "e2", "e4");

    /* Der Bauer zieht nach e4 und rutscht sofort auf e3 zurueck. */
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e4")), ".", "e4 ist wieder leer");
    gleich(SCHACH.figurAuf(runde.stand, SCHACH.feldNummer("e3")), "B", "der Bauer steht auf e3");

    const letzter = runde.verlauf[runde.verlauf.length - 1];
    gleich(letzter.wege.length, 1, "ein Weg fuer den Pfeil");
});

pruefe("Ausdehnung laesst das Brett wachsen und rechnet alle Felder um", () => {
    /* Links anbauen ist der harte Fall: Jede Feldnummer verschiebt sich. */
    const stand = SCHACH.standNormalisieren({ variante: "standard" });
    const gewachsen = SCHACH.ausdehnung(stand, "links");

    wahr(gewachsen !== null, "gewachsen");
    gleich(SCHACH.breiteVon(gewachsen.stand), 9, "eine Spalte mehr");
    gleich(SCHACH.hoeheVon(gewachsen.stand), 8, "gleich hoch");
    gleich(gewachsen.stand.brett.length, 72, "72 Felder");

    /* Die neue Spalte ist leer, die Figuren sind mitgewandert. */
    for (let reihe = 0; reihe < 8; reihe++) {
        gleich(gewachsen.stand.brett[reihe * 9], ".", "neue Spalte leer in Reihe " + reihe);
    }
    gleich(SCHACH.figurAuf(gewachsen.stand, SCHACH.feldNummer("b8", 9, 8)), "t",
        "der Turm steht jetzt auf b8");

    /* Und die gemerkten Felder stimmen weiterhin: Der Koenig behaelt sein Recht. */
    const lage = SCHACH.rochadeLage(gewachsen.stand, SCHACH.WEISS);
    gleich(lage.length, 2, "zwei Eintraege");
    wahr(lage[0].grund.indexOf("Figur") !== -1, "gesperrt, weil Figuren im Weg stehen");

    /* Nach dem Speichern und Laden bleiben die neuen Masse erhalten. */
    const geladen = SCHACH.standNormalisieren(JSON.parse(JSON.stringify(gewachsen.stand)));
    gleich(SCHACH.breiteVon(geladen), 9, "Breite ueberlebt das Laden");
    gleich(geladen.brett, gewachsen.stand.brett, "und das Brett auch");
});

pruefe("Ausdehnung schiebt auch Schild, Fessel und Frost mit", () => {
    let stand = SCHACH.standNormalisieren({ variante: "standard" });
    stand = Object.assign({}, stand, {
        schildFeld: SCHACH.feldNummer("e2"),
        schildFarbe: "weiss",
        frostFeld: SCHACH.feldNummer("e7"),
        frostFarbe: "schwarz"
    });

    const gewachsen = SCHACH.ausdehnung(stand, "oben");
    wahr(gewachsen !== null, "gewachsen");

    /* Oben angebaut: Jede Reihe rutscht um eine nach unten. */
    gleich(gewachsen.stand.schildFeld, stand.schildFeld + 8, "Schild mitgewandert");
    gleich(gewachsen.stand.frostFeld, stand.frostFeld + 8, "Frost mitgewandert");
    gleich(SCHACH.figurAuf(gewachsen.stand, gewachsen.stand.schildFeld), "B",
        "und da steht auch die geschuetzte Figur");
});

pruefe("Meuterei laesst eine eigene Figur ueberlaufen, nie den Koenig", () => {
    const stand = SCHACH.standNormalisieren({ variante: "standard" });

    /* Ueber alle Wahlwerte: Es trifft nie den Koenig. */
    for (let schritt = 0; schritt < 20; schritt++) {
        const wirkung = SCHACH.meuterei(stand, "weiss", schritt / 20);
        wahr(wirkung !== null, "eine Figur gefunden");

        const feld = wirkung.felder[0];
        gleich(SCHACH.farbeVon(SCHACH.figurAuf(wirkung.stand, feld)), "schwarz",
            "gehoert jetzt Schwarz");
        wahr(SCHACH.artVon(SCHACH.figurAuf(stand, feld)) !== "K", "war kein Koenig");
    }

    /* Der weisse Koenig steht noch. */
    gleich(SCHACH.figurAuf(SCHACH.meuterei(stand, "weiss", 0.5).stand,
        SCHACH.feldNummer("e1")), "K", "Koenig unveraendert");
});

pruefe("Erdrutsch schiebt alle eigenen Figuren zurueck", () => {
    const stand = SCHACH.standNormalisieren({
        brett: "....k..."
            + "........"
            + "........"
            + "...B.B.."
            + "........"
            + "..B....."
            + "........"
            + "....K...",
        amZug: "weiss",
        rochade: ""
    });

    const wirkung = SCHACH.erdrutsch(stand, "weiss");
    wahr(wirkung !== null, "gerutscht");

    /* Zurueck heisst fuer Weiss: nach unten (Richtung Reihe 8). */
    gleich(SCHACH.figurAuf(wirkung.stand, SCHACH.feldNummer("d4")), "B", "d5 nach d4");
    gleich(SCHACH.figurAuf(wirkung.stand, SCHACH.feldNummer("f4")), "B", "f5 nach f4");
    gleich(SCHACH.figurAuf(wirkung.stand, SCHACH.feldNummer("c2")), "B", "c3 nach c2");
    gleich(SCHACH.figurAuf(wirkung.stand, SCHACH.feldNummer("e1")), "K", "der Koenig bleibt");
    gleich(wirkung.wege.length, 3, "drei Wege fuer die Pfeile");
});

pruefe("Der Verlauf verraet nicht, was in einem Wuerfel steckt", () => {
    const runde = springerZuege(faehigkeitenPartie(), 24);
    const eintrag = runde.verlauf.find((zeile) => zeile.wirkung === "erscheint");

    wahr(!!eintrag, "ein Erscheinen im Verlauf");

    for (const art of Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)) {
        wahr(eintrag.text.indexOf(SCHACH_VARIANTEN.faehigkeitTitel(art)) === -1,
            "verraet nicht " + art);
    }
    for (const art of Object.keys(SCHACH_VARIANTEN.PECH)) {
        wahr(eintrag.text.indexOf(SCHACH_VARIANTEN.pechTitel(art)) === -1,
            "verraet nicht " + art);
    }
});

pruefe("Die Zielfelder passen zu dem, was die Wirkung wirklich zulaesst", () => {
    const runde = faehigkeitenPartie();

    gleich(SCHACH_RUNDE.zielFelder(runde, "id-anna", "verstaerkung").length, 8,
        "acht eigene Bauern");

    const schild = SCHACH_RUNDE.zielFelder(runde, "id-anna", "schutzschild");
    gleich(schild.length, 15, "alle eigenen Figuren ausser dem Koenig");
    wahr(schild.indexOf(SCHACH.feldNummer("e1")) === -1, "der Koenig ist nicht dabei");

    const fessel = SCHACH_RUNDE.zielFelder(runde, "id-anna", "fessel");
    gleich(fessel.length, 15, "alle gegnerischen Figuren ausser dem Koenig");
    wahr(fessel.indexOf(SCHACH.feldNummer("e8")) === -1, "der gegnerische Koenig auch nicht");

    gleich(SCHACH_RUNDE.zielFelder(runde, "id-anna", "wiedergeburt").length, 0,
        "ohne verlorene Figur kein Ziel");

    /* Fähigkeiten ohne Ziel liefern keine Felder. */
    gleich(SCHACH_RUNDE.zielFelder(runde, "id-anna", "sprung").length, 0, "Sprung braucht keins");
});

pruefe("Jede Faehigkeit laesst sich einsetzen und wird dabei verbraucht", () => {
    /* Sicherheitsnetz: Kommt eine neue Faehigkeit dazu, ohne dass jemand ihre
       Wirkung baut, faellt es hier auf. */
    const ziele = {
        verstaerkung: "e2",
        schutzschild: "d1",
        fessel: "b8",
        frost: "b8",
        erdbeben: "d4",
        wiedergeburt: "b1",
        /* Das Grab liegt dort, wo die Figur fiel — hier von Hand gesetzt. */
        wiederbelebung: "e4",
        /* a4 bis c4 ist in der Grundstellung frei. */
        mauer: "a4",
        /* Das 2x2-Feld a5/b5/a4/b4 ist frei; Gefallene setzt der Test. */
        friedhof: "a5",
        /* Ein Bauer hat als Einziger ein freies Nachbarfeld. */
        spiegel: "a2",
        /* Am oberen Rand angetippt heisst: nach oben rollen. */
        nudelholz: "a8"
    };

    for (const art of Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)) {
        let runde = faehigkeitenPartie();
        let feld = -1;

        if (ziele[art]) {
            feld = SCHACH.feldNummer(ziele[art]);
        }
        if (art === "wiedergeburt") {
            runde.stand.brett = SCHACH._brettMit(runde.stand.brett, feld, ".");
            runde.verloren.weiss.push("S");
        }
        if (art === "wiederbelebung") {
            runde.gefallen.weiss.push({ art: "S", feld: feld });
        }
        if (art === "friedhof") {
            /* Gefallene GEGNER - sie stehen fuer Weiss wieder auf. */
            runde.gefallen.schwarz.push({ art: "T", feld: SCHACH.feldNummer("h5") });
        }
        if (art === "erdbeben") {
            /* Rund um d4 steht in der Grundstellung nichts — einen Bauern
               hinstellen, damit es etwas zu verschieben gibt. */
            runde.stand.brett = SCHACH._brettMit(runde.stand.brett,
                SCHACH.feldNummer("d5"), "b");
        }
        if (art === "nudelholz") {
            /* In den Spalten a und b muss etwas stehen, das Platz nach oben
               hat. */
            runde.stand.brett = SCHACH._brettMit(runde.stand.brett,
                SCHACH.feldNummer("a5"), "b");
        }

        const nachher = einsetzen(runde, art, feld);
        wahr(nachher !== null, "einsetzbar: " + art);
        gleich(nachher.faehigkeiten.weiss.length, 0, "verbraucht: " + art);
        gleich(nachher.zugZaehler, runde.zugZaehler + 1, "Zugzaehler steigt: " + art);

        const letzter = nachher.verlauf[nachher.verlauf.length - 1];
        gleich(letzter.wirkung, art, "Wirkung im Verlauf: " + art);
    }
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
