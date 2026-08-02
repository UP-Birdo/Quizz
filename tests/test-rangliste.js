/*
 * test-rangliste.js — Regressionstests der Gesamtwertung über beide Spiele.
 *
 * Geladen werden die ECHTEN Dateien js\rangliste.js, js\modell.js und die
 * Schach-Dateien. Geprüft wird nur der rechnende Teil; der Bildschirm-Teil
 * braucht einen Browser und steht in der Prüfliste in docs\DEPLOYMENT.md.
 *
 * Aufruf: siehe tests\README.md
 */

const pfad = require("path");

globalThis.MODELL = require(pfad.join(__dirname, "..", "js", "modell.js"));
globalThis.SCHACH_VARIANTEN = require(pfad.join(__dirname, "..", "js", "schach-varianten.js"));
globalThis.SCHACH = require(pfad.join(__dirname, "..", "js", "schach.js"));
globalThis.SCHACH_RUNDE = require(pfad.join(__dirname, "..", "js", "schach-runde.js"));
globalThis.SCHACH_TAFEL = require(pfad.join(__dirname, "..", "js", "schach-tafel.js"));
const RANGLISTE = require(pfad.join(__dirname, "..", "js", "rangliste.js"));

const MODELL = globalThis.MODELL;
const SCHACH_RUNDE = globalThis.SCHACH_RUNDE;
const SCHACH_TAFEL = globalThis.SCHACH_TAFEL;

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

/* Drei Mitspieler im Würfel-Quizz, noch ohne Punkte. */
function quizzMitDrei() {
    let daten = MODELL.leereDaten(1000);
    daten = MODELL.spielerHinzufuegen(daten, "Anna", "id-anna", 1000);
    daten = MODELL.spielerHinzufuegen(daten, "Bert", "id-bert", 1000);
    daten = MODELL.spielerHinzufuegen(daten, "Cem", "id-cem", 1000);
    return daten;
}

/* Eine beendete Partie mit dem angegebenen Ergebnis. */
function beendetePartie(tafel, titel, ergebnis, zeitpunkt) {
    const angelegt = SCHACH_TAFEL.partieAnlegen(tafel, "standard", titel, zeitpunkt);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", zeitpunkt);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", zeitpunkt);
    partie.ergebnis = ergebnis;
    partie.laeuft = false;

    return SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, zeitpunkt);
}

/* ------------------------------------------------------------------ *
 * Schachpunkte
 * ------------------------------------------------------------------ */

pruefe("Ohne beendete Partie gibt es keine Schachpunkte", () => {
    const tafel = SCHACH_TAFEL.partieAnlegen(
        SCHACH_TAFEL.leereTafel(1000), "standard", "Laeuft noch", 2000).tafel;

    gleich(Object.keys(RANGLISTE.schachPunkte(tafel)).length, 0, "keine Wertung");
});

pruefe("Ein Sieg bringt Sieg- und Teilnahmepunkte", () => {
    const tafel = beendetePartie(SCHACH_TAFEL.leereTafel(1000), "Erste", "weiss", 2000);
    const punkte = RANGLISTE.schachPunkte(tafel);

    gleich(punkte["id-anna"].punkte, RANGLISTE.PUNKTE_SIEG + RANGLISTE.PUNKTE_TEILNAHME,
        "Siegerin");
    gleich(punkte["id-anna"].siege, 1, "ein Sieg");
    gleich(punkte["id-bert"].punkte, RANGLISTE.PUNKTE_TEILNAHME, "Verlierer");
    gleich(punkte["id-bert"].siege, 0, "kein Sieg");
});

pruefe("Unentschieden bringt beiden Seiten dasselbe", () => {
    const tafel = beendetePartie(SCHACH_TAFEL.leereTafel(1000), "Remis", "remis", 2000);
    const punkte = RANGLISTE.schachPunkte(tafel);

    const erwartet = RANGLISTE.PUNKTE_REMIS + RANGLISTE.PUNKTE_TEILNAHME;
    gleich(punkte["id-anna"].punkte, erwartet, "Weiss");
    gleich(punkte["id-bert"].punkte, erwartet, "Schwarz");
    gleich(punkte["id-anna"].remis, 1, "als Remis gezaehlt");
});

pruefe("Mehrere Partien werden zusammengezaehlt", () => {
    let tafel = beendetePartie(SCHACH_TAFEL.leereTafel(1000), "Erste", "weiss", 2000);
    tafel = beendetePartie(tafel, "Zweite", "weiss", 2100);
    tafel = beendetePartie(tafel, "Dritte", "schwarz", 2200);

    const punkte = RANGLISTE.schachPunkte(tafel);
    gleich(punkte["id-anna"].siege, 2, "zwei Siege fuer Anna");
    gleich(punkte["id-bert"].siege, 1, "ein Sieg fuer Bert");
    gleich(punkte["id-anna"].partien, 3, "drei Partien");
    gleich(punkte["id-anna"].punkte,
        2 * RANGLISTE.PUNKTE_SIEG + 3 * RANGLISTE.PUNKTE_TEILNAHME, "Summe Anna");
});

/* ------------------------------------------------------------------ *
 * Gesamtwertung
 * ------------------------------------------------------------------ */

pruefe("Ohne Spieler ist die Wertung leer", () => {
    gleich(RANGLISTE.gesamt(MODELL.leereDaten(1000), SCHACH_TAFEL.leereTafel(1000)).length,
        0, "leer");
});

pruefe("Jeder Mitspieler steht in der Wertung, auch ohne Punkte", () => {
    const liste = RANGLISTE.gesamt(quizzMitDrei(), SCHACH_TAFEL.leereTafel(1000));

    gleich(liste.length, 3, "drei Eintraege");
    gleich(liste[0].gesamt, 0, "noch keine Punkte");
});

pruefe("Schachpunkte entscheiden die Reihenfolge, wenn das Quizz gleich steht", () => {
    const tafel = beendetePartie(SCHACH_TAFEL.leereTafel(1000), "Erste", "weiss", 2000);
    const liste = RANGLISTE.gesamt(quizzMitDrei(), tafel);

    gleich(liste[0].name, "Anna", "Anna vorn");
    gleich(liste[0].schach, RANGLISTE.PUNKTE_SIEG + RANGLISTE.PUNKTE_TEILNAHME, "Schachpunkte");
    gleich(liste[1].name, "Bert", "Bert danach");
    gleich(liste[2].name, "Cem", "Cem ohne Partie");
    gleich(liste[2].schach, 0, "keine Schachpunkte");
});

pruefe("Wuerfel- und Schachpunkte werden addiert", () => {
    /* Bert deckt auf, Cem hat auf ihn genau getippt — das gibt Quizz-Punkte. */
    let daten = quizzMitDrei();
    for (let spalte = 0; spalte < MODELL.WUERFEL_ANZAHL; spalte++) {
        daten = MODELL.tippSetzen(daten, "id-cem", "id-bert", spalte, "3", 1100);
    }
    daten = MODELL.aufdecken(daten, "id-bert", ["3", "3", "3", "3", "3"], true, 1200);

    const quizzPunkte = MODELL.ergebnis(daten).find((eintrag) => eintrag.id === "id-cem").punkte;
    wahr(quizzPunkte > 0, "Cem hat Quizz-Punkte");

    const tafel = beendetePartie(SCHACH_TAFEL.leereTafel(1000), "Erste", "weiss", 2000);
    const cem = RANGLISTE.gesamt(daten, tafel).find((eintrag) => eintrag.id === "id-cem");

    gleich(cem.quizz, quizzPunkte, "Quizz-Punkte uebernommen");
    gleich(cem.schach, 0, "keine Schachpunkte");
    gleich(cem.gesamt, quizzPunkte, "Summe");
});

pruefe("Wer aus dem Quizz entfernt wurde, steht nicht mehr in der Wertung", () => {
    const tafel = beendetePartie(SCHACH_TAFEL.leereTafel(1000), "Erste", "weiss", 2000);
    const ohneAnna = MODELL.spielerEntfernen(quizzMitDrei(), "id-anna", 1300);
    const liste = RANGLISTE.gesamt(ohneAnna, tafel);

    gleich(liste.length, 2, "zwei uebrig");
    wahr(!liste.some((eintrag) => eintrag.id === "id-anna"), "Anna ist weg");
});

pruefe("Die Erklaerung nennt dieselben Zahlen wie die Rechnung", () => {
    const text = RANGLISTE.erklaerung();

    wahr(text.indexOf(String(RANGLISTE.PUNKTE_SIEG)) !== -1, "Siegpunkte genannt");
    wahr(text.indexOf(String(RANGLISTE.PUNKTE_REMIS)) !== -1, "Remispunkte genannt");
    wahr(text.indexOf(String(RANGLISTE.PUNKTE_TEILNAHME)) !== -1, "Teilnahme genannt");
});

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
