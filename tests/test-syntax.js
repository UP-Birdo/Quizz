/*
 * test-syntax.js — prüft alle Programmdateien, die nur im Browser laufen.
 *
 * `test-modell.js` prüft die Datenlogik inhaltlich. Die übrigen Dateien
 * (Bildschirm, Speicher, Start) brauchen einen Browser und lassen sich hier
 * nicht ausführen — wohl aber ÜBERSETZEN. Genau das macht dieser Test: jede
 * Datei wird kompiliert, ohne sie zu starten. Damit fallen Tippfehler,
 * vergessene Klammern und die im Haus bekannte Falle der typografischen
 * Anführungszeichen sofort auf und nicht erst beim Aufruf der Seite.
 *
 * Zusätzlich wird geprüft, dass jede Datei in index.html eingebunden ist —
 * eine neue Datei zu schreiben und das Einbinden zu vergessen, ist ein
 * lautloser Fehler.
 */

const pfad = require("path");
const dateisystem = require("fs");
const vm = require("vm");

const projekt = pfad.join(__dirname, "..");
const jsOrdner = pfad.join(projekt, "js");

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

const dateien = dateisystem.readdirSync(jsOrdner)
    .filter((name) => name.endsWith(".js"))
    .sort();

pruefe("Der Ordner js enthält Programmdateien", () => {
    if (dateien.length === 0) {
        throw new Error("keine .js-Datei gefunden");
    }
});

/* Übersetzbarkeit jeder einzelnen Datei. */
for (const name of dateien) {
    pruefe("js/" + name + " ist syntaktisch fehlerfrei", () => {
        const quelltext = dateisystem.readFileSync(pfad.join(jsOrdner, name), "utf8");
        /* new vm.Script übersetzt, führt aber nichts aus. */
        new vm.Script(quelltext, { filename: name });
    });
}

/* Einbindung in index.html. */
const seite = dateisystem.readFileSync(pfad.join(projekt, "index.html"), "utf8");

for (const name of dateien) {
    pruefe("js/" + name + " ist in index.html eingebunden", () => {
        if (seite.indexOf("js/" + name) === -1) {
            throw new Error("kein script-Verweis auf js/" + name + " in index.html");
        }
    });
}

/*
 * Aufrufe ins Modell und in die Versiegelung müssen es wirklich geben.
 *
 * Das fängt die typische Umbau-Falle: Eine Funktion wird umbenannt, eine
 * Bildschirmdatei ruft sie weiter unter dem alten Namen auf. Syntaktisch ist
 * das fehlerfrei, im Browser fliegt es erst beim Klick auseinander.
 */
globalThis.MODELL = require(pfad.join(jsOrdner, "modell.js"));
globalThis.SCHACH_VARIANTEN = require(pfad.join(jsOrdner, "schach-varianten.js"));
globalThis.SCHACH = require(pfad.join(jsOrdner, "schach.js"));
globalThis.SCHACH_RUNDE = require(pfad.join(jsOrdner, "schach-runde.js"));
globalThis.SCHACH_TAFEL = require(pfad.join(jsOrdner, "schach-tafel.js"));
globalThis.IMPOSTER_WOERTER = require(pfad.join(jsOrdner, "imposter-woerter.js"));
globalThis.IMPOSTER_RUNDE = require(pfad.join(jsOrdner, "imposter-runde.js"));
globalThis.IMPOSTER_TAFEL = require(pfad.join(jsOrdner, "imposter-tafel.js"));

const bausteine = {
    MODELL: globalThis.MODELL,
    SCHACH: globalThis.SCHACH,
    SCHACH_VARIANTEN: globalThis.SCHACH_VARIANTEN,
    SCHACH_RUNDE: globalThis.SCHACH_RUNDE,
    SCHACH_TAFEL: globalThis.SCHACH_TAFEL,
    IMPOSTER_WOERTER: globalThis.IMPOSTER_WOERTER,
    IMPOSTER_RUNDE: globalThis.IMPOSTER_RUNDE,
    IMPOSTER_TAFEL: globalThis.IMPOSTER_TAFEL,
    RANGLISTE: require(pfad.join(jsOrdner, "rangliste.js")),
    VERSIEGELUNG: require(pfad.join(jsOrdner, "versiegelung.js"))
};

for (const name of dateien) {
    const quelltext = dateisystem.readFileSync(pfad.join(jsOrdner, name), "utf8");

    for (const baustein of Object.keys(bausteine)) {
        /* Der Rückblick verhindert, dass SCHACH auch in TEAM_SCHACH trifft —
           sonst prüft der Test Eigenschaften am falschen Baustein. */
        const muster = new RegExp("(?<![A-Za-z0-9_])" + baustein + "\\.([A-Za-z][A-Za-z0-9_]*)", "g");
        const benutzt = new Set();

        let treffer = muster.exec(quelltext);
        while (treffer !== null) {
            benutzt.add(treffer[1]);
            treffer = muster.exec(quelltext);
        }

        for (const eigenschaft of benutzt) {
            pruefe("js/" + name + ": " + baustein + "." + eigenschaft + " gibt es", () => {
                if (!(eigenschaft in bausteine[baustein])) {
                    throw new Error(baustein + "." + eigenschaft + " ist nicht definiert");
                }
            });
        }
    }
}

/* Die Stildatei ebenfalls. */
pruefe("css/stil.css ist in index.html eingebunden", () => {
    if (seite.indexOf("css/stil.css") === -1) {
        throw new Error("kein Verweis auf css/stil.css in index.html");
    }
});

/* Die Version muss an genau einer Stelle stehen und im CHANGELOG auftauchen. */
pruefe("Version aus konfig.js steht im CHANGELOG", () => {
    const konfig = dateisystem.readFileSync(pfad.join(jsOrdner, "konfig.js"), "utf8");
    const treffer = konfig.match(/APP_VERSION:\s*"([^"]+)"/);
    if (!treffer) {
        throw new Error("APP_VERSION nicht in js/konfig.js gefunden");
    }

    const version = treffer[1];
    const changelog = dateisystem.readFileSync(pfad.join(projekt, "CHANGELOG.md"), "utf8");
    if (changelog.indexOf("v" + version) === -1) {
        throw new Error("v" + version + " fehlt in CHANGELOG.md");
    }
});

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
