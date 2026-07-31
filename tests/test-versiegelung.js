/*
 * test-versiegelung.js — Regressionstests des Siegels.
 *
 * Das Siegel ist der Kern des Spiels: Es muss die Würfel verbergen und
 * trotzdem beweisen, dass niemand nachträglich einen anderen Wurf behauptet.
 * Geprüft wird die ECHTE Datei js\versiegelung.js.
 *
 * versiegelung.js benutzt MODELL zum Sortieren — deshalb wird modell.js
 * vorher als globale Größe bereitgestellt, genau wie im Browser.
 */

const pfad = require("path");

globalThis.MODELL = require(pfad.join(__dirname, "..", "js", "modell.js"));
const VERSIEGELUNG = require(pfad.join(__dirname, "..", "js", "versiegelung.js"));

let anzahlOk = 0;
let anzahlFehler = 0;

/* Die Prüfungen sind asynchron (die Krypto-Funktion des Browsers ist es auch),
   deshalb laufen sie nacheinander in einer Liste. */
const pruefungen = [];

function pruefe(bezeichnung, funktion) {
    pruefungen.push({ bezeichnung: bezeichnung, funktion: funktion });
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

/* ------------------------------------------------------------------ */

pruefe("Die Krypto-Funktion steht zur Verfügung", async () => {
    wahr(VERSIEGELUNG.verfuegbar(), "crypto.subtle vorhanden");
});

pruefe("Ein Salz ist lang genug und jedes Mal anders", async () => {
    const eins = VERSIEGELUNG.salzErzeugen();
    const zwei = VERSIEGELUNG.salzErzeugen();
    gleich(eins.length, 32, "16 Byte als Hex");
    wahr(eins !== zwei, "zwei Salze verschieden");
});

pruefe("Gleiche Würfel und gleiches Salz ergeben denselben Prüfwert", async () => {
    const wuerfel = ["1", "3", "3", "5", "STERN"];
    const eins = await VERSIEGELUNG.pruefwertBilden(wuerfel, "salz");
    const zwei = await VERSIEGELUNG.pruefwertBilden(wuerfel, "salz");
    gleich(eins, zwei, "gleicher Prüfwert");
    gleich(eins.length, 64, "SHA-256 als Hex");
});

pruefe("Die Reihenfolge der Würfel spielt keine Rolle", async () => {
    const eins = await VERSIEGELUNG.pruefwertBilden(["1", "3", "3", "5", "STERN"], "salz");
    const zwei = await VERSIEGELUNG.pruefwertBilden(["STERN", "5", "3", "3", "1"], "salz");
    gleich(eins, zwei, "gleiche Menge, gleicher Prüfwert");
});

pruefe("Ein anderer Wurf ergibt einen anderen Prüfwert", async () => {
    const eins = await VERSIEGELUNG.pruefwertBilden(["1", "3", "3", "5", "STERN"], "salz");
    const zwei = await VERSIEGELUNG.pruefwertBilden(["1", "3", "3", "5", "5"], "salz");
    wahr(eins !== zwei, "unterschiedlich");
});

pruefe("Ein anderes Salz ergibt einen anderen Prüfwert", async () => {
    const wuerfel = ["1", "3", "3", "5", "STERN"];
    const eins = await VERSIEGELUNG.pruefwertBilden(wuerfel, "salz-eins");
    const zwei = await VERSIEGELUNG.pruefwertBilden(wuerfel, "salz-zwei");
    wahr(eins !== zwei, "unterschiedlich");
});

pruefe("Die Prüfung erkennt den richtigen Wurf", async () => {
    const wuerfel = ["2", "2", "4", "5", "STERN"];
    const salz = VERSIEGELUNG.salzErzeugen();
    const pruefwert = await VERSIEGELUNG.pruefwertBilden(wuerfel, salz);

    wahr(await VERSIEGELUNG.pruefen(wuerfel, salz, pruefwert), "passt");
    wahr(await VERSIEGELUNG.pruefen(["STERN", "5", "4", "2", "2"], salz, pruefwert),
        "passt auch umsortiert");
});

pruefe("Die Prüfung erkennt einen nachträglich geänderten Wurf", async () => {
    const wuerfel = ["2", "2", "4", "5", "STERN"];
    const salz = VERSIEGELUNG.salzErzeugen();
    const pruefwert = await VERSIEGELUNG.pruefwertBilden(wuerfel, salz);

    wahr(!await VERSIEGELUNG.pruefen(["2", "2", "4", "5", "5"], salz, pruefwert), "anderer Wurf");
    wahr(!await VERSIEGELUNG.pruefen(wuerfel, "anderes-salz", pruefwert), "anderes Salz");
    wahr(!await VERSIEGELUNG.pruefen(wuerfel, salz, ""), "ohne Prüfwert");
});

pruefe("Aus dem Prüfwert lässt sich der Wurf nicht ablesen", async () => {
    /* Das ist keine mathematische Sicherheitsaussage, sondern die Zusicherung,
       dass der veröffentlichte Wert die Werte nicht im Klartext enthält. */
    const pruefwert = await VERSIEGELUNG.pruefwertBilden(["1", "2", "3", "4", "STERN"], "salz");
    wahr(pruefwert.indexOf("STERN") === -1, "kein Klartext");
    wahr(/^[0-9a-f]{64}$/.test(pruefwert), "reine Hex-Zeichenkette");
});

/* ------------------------------------------------------------------ *
 * Spieler-PIN
 * ------------------------------------------------------------------ */

pruefe("Die richtige PIN wird erkannt, eine falsche nicht", async () => {
    const salz = VERSIEGELUNG.salzErzeugen();
    const pruefwert = await VERSIEGELUNG.pinPruefwertBilden("1234", salz);

    wahr(await VERSIEGELUNG.pinPruefen("1234", salz, pruefwert), "richtige PIN");
    wahr(!await VERSIEGELUNG.pinPruefen("1235", salz, pruefwert), "falsche PIN");
    wahr(!await VERSIEGELUNG.pinPruefen("1234", "anderes-salz", pruefwert), "anderes Salz");
    wahr(!await VERSIEGELUNG.pinPruefen("1234", salz, ""), "ohne Pruefwert");
});

pruefe("Gleiche PIN bei zwei Spielern ergibt verschiedene Pruefwerte", async () => {
    /* Dafuer ist das Salz da: Sonst sähe man in der Datenbank sofort, wer
       dieselbe PIN benutzt. */
    const eins = await VERSIEGELUNG.pinPruefwertBilden("1234", VERSIEGELUNG.salzErzeugen());
    const zwei = await VERSIEGELUNG.pinPruefwertBilden("1234", VERSIEGELUNG.salzErzeugen());
    wahr(eins !== zwei, "unterschiedlich");
});

pruefe("Der Pruefwert einer PIN enthaelt die Ziffern nicht", async () => {
    const pruefwert = await VERSIEGELUNG.pinPruefwertBilden("1234", "salz");
    wahr(pruefwert.indexOf("1234") === -1, "keine Ziffernfolge");
    wahr(/^[0-9a-f]{64}$/.test(pruefwert), "reine Hex-Zeichenkette");
});

/* ------------------------------------------------------------------ *
 * Verwaltungs-Passwort
 * ------------------------------------------------------------------ */

pruefe("Der hinterlegte Verwaltungs-Pruefwert passt zum vereinbarten Passwort", async () => {
    /* Der Wert stammt aus js\konfig.js. Stimmt er nicht mehr, kommt niemand
       mehr in die Verwaltung — genau das soll dieser Test verhindern. */
    const dateisystem = require("fs");
    const konfig = dateisystem.readFileSync(pfad.join(__dirname, "..", "js", "konfig.js"), "utf8");
    const treffer = konfig.match(/pruefwert:\s*"([0-9a-f]{64})"/);
    wahr(treffer !== null, "Pruefwert in konfig.js gefunden");

    wahr(await VERSIEGELUNG.verwaltungPruefen("660932", treffer[1]), "vereinbartes Passwort passt");
    wahr(!await VERSIEGELUNG.verwaltungPruefen("660933", treffer[1]), "anderes Passwort passt nicht");
});

pruefe("Ohne hinterlegten Pruefwert kommt niemand in die Verwaltung", async () => {
    wahr(!await VERSIEGELUNG.verwaltungPruefen("660932", ""), "leerer Pruefwert");
});

/* ------------------------------------------------------------------ */

(async () => {
    for (const pruefung of pruefungen) {
        try {
            await pruefung.funktion();
            anzahlOk++;
        } catch (fehler) {
            anzahlFehler++;
            console.error("FEHLER: " + pruefung.bezeichnung);
            console.error("        " + fehler.message);
        }
    }

    console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
    process.exit(anzahlFehler === 0 ? 0 : 1);
})();
