/*
 * test-modell.js — Regressionstests der Spiel- und Datenlogik.
 *
 * Wichtig: Die Tests laden die ECHTE Datei js\modell.js (require unten) und
 * enthalten KEINE Kopie der Funktionen. Kopien driften mit der Zeit auseinander
 * und testen dann etwas, das es nicht mehr gibt.
 *
 * Aufruf: siehe tests\README.md
 */

const pfad = require("path");
const MODELL = require(pfad.join(__dirname, "..", "js", "modell.js"));

/* ------------------------------------------------------------------ *
 * Winziges Test-Gerüst
 * ------------------------------------------------------------------ */

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

/* Eine Runde mit zwei Spielern, feste Kennungen für vergleichbare Tests. */
function rundeMitAnnaUndBert() {
    let daten = MODELL.spielerHinzufuegen(MODELL.leereDaten(), "Anna", "id-anna", 1000);
    daten = MODELL.spielerHinzufuegen(daten, "Bert", "id-bert", 1000);
    return daten;
}

/* ------------------------------------------------------------------ *
 * Werte
 * ------------------------------------------------------------------ */

pruefe("Jeder hat genau fünf Würfel", () => {
    gleich(MODELL.WUERFEL_ANZAHL, 5, "WUERFEL_ANZAHL");
});

pruefe("Die Auswahl bietet 1 bis 5 und Stern", () => {
    gleich(MODELL.WERTE.join(","), "1,2,3,4,5,STERN", "WERTE");
});

pruefe("Gültige Werte werden angenommen, ungültige abgelehnt", () => {
    wahr(MODELL.wertGueltig("1"), "1 gültig");
    wahr(MODELL.wertGueltig("STERN"), "STERN gültig");
    wahr(MODELL.wertGueltig(""), "leer gültig");
    wahr(!MODELL.wertGueltig("6"), "6 ungültig");
    wahr(!MODELL.wertGueltig("stern"), "Kleinschreibung ungültig");
});

pruefe("Beschriftungen sind lesbar", () => {
    gleich(MODELL.wertBeschriftung("3"), "3", "Zahl");
    gleich(MODELL.wertBeschriftung("STERN"), "Stern", "Stern");
    gleich(MODELL.wertBeschriftung(""), "—", "leer");
});

pruefe("Würfellisten werden auf genau fünf gültige Werte gebracht", () => {
    gleich(MODELL.wuerfelNormalisieren(["1"]).join("|"), "1||||", "aufgefüllt");
    gleich(MODELL.wuerfelNormalisieren(["1", "2", "3", "4", "5", "STERN"]).join("|"),
        "1|2|3|4|5", "abgeschnitten");
    gleich(MODELL.wuerfelNormalisieren(["9", "STERN", "abc", null, "4"]).join("|"),
        "|STERN|||4", "bereinigt");
    gleich(MODELL.wuerfelNormalisieren("Unsinn").join("|"), "||||", "kein Feld");
});

pruefe("Vollständig ist ein Wurf erst mit fünf Werten", () => {
    wahr(MODELL.wuerfelVollstaendig(["1", "2", "3", "4", "STERN"]), "voll");
    wahr(!MODELL.wuerfelVollstaendig(["1", "2", "3", "4", ""]), "eines fehlt");
    wahr(!MODELL.wuerfelVollstaendig([]), "leer");
});

pruefe("Würfel werden für die Anzeige sortiert, Stern zuletzt", () => {
    gleich(MODELL.wuerfelSortiert(["STERN", "3", "1", "5", "1"]).join("|"),
        "1|1|3|5|STERN", "sortiert");
    gleich(MODELL.wuerfelSortiert(["", "2", "", "1", ""]).join("|"),
        "1|2|||", "Leeres ans Ende");
});

/* ------------------------------------------------------------------ *
 * Grundstrukturen
 * ------------------------------------------------------------------ */

pruefe("Eine leere Runde ist in der Phase raten", () => {
    const daten = MODELL.leereDaten();
    gleich(daten.datenVersion, MODELL.DATEN_VERSION, "datenVersion");
    gleich(daten.phase, MODELL.PHASE_RATEN, "phase");
    gleich(daten.spieler.length, 0, "Spielerzahl");
});

pruefe("Ein neuer Spieler hat weder Würfel noch Siegel noch Tipps", () => {
    const spieler = MODELL.neuerSpieler("Anna", "id-1");
    gleich(spieler.id, "id-1", "id");
    gleich(spieler.name, "Anna", "name");
    gleich(spieler.pruefwert, "", "pruefwert");
    gleich(spieler.wuerfel.length, 0, "keine Würfel");
    gleich(spieler.aufgedeckt, false, "nicht aufgedeckt");
    gleich(Object.keys(spieler.tipps).length, 0, "keine Tipps");
});

pruefe("Kennungen sind unterschiedlich", () => {
    wahr(MODELL.idErzeugen() !== MODELL.idErzeugen(), "zwei Kennungen verschieden");
});

/* ------------------------------------------------------------------ *
 * normalisieren — die Nachrüst-Stelle des Datenvertrags
 * ------------------------------------------------------------------ */

pruefe("Unsinn als Eingabe ergibt eine leere, gültige Runde", () => {
    gleich(MODELL.normalisieren(null).spieler.length, 0, "null");
    gleich(MODELL.normalisieren("kaputt").spieler.length, 0, "Text");
    gleich(MODELL.normalisieren({}).spieler.length, 0, "leeres Objekt");
    gleich(MODELL.normalisieren({ spieler: "keine Liste" }).spieler.length, 0, "falscher Typ");
});

pruefe("Ein Stand der Fassung 1 wird übernommen", () => {
    /* Fassung 1 kannte "zeilen" mit offen sichtbaren Würfeln. */
    const alt = { zeilen: [{ id: "a", name: "Anna", wuerfel: ["1", "2", "3", "4", "5"] }] };
    const daten = MODELL.normalisieren(alt);

    gleich(daten.datenVersion, MODELL.DATEN_VERSION, "auf neue Fassung gehoben");
    gleich(daten.spieler.length, 1, "Spieler übernommen");
    gleich(daten.spieler[0].name, "Anna", "Name bleibt");
    gleich(daten.spieler[0].pruefwert, "", "gilt als nicht festgelegt");
    gleich(daten.spieler[0].wuerfel.length, 0, "Würfel nicht offen übernommen");
});

pruefe("Würfel erscheinen nur bei aufgedeckten Spielern", () => {
    const roh = {
        spieler: [
            { id: "a", name: "Anna", wuerfel: ["1", "1", "1", "1", "1"], aufgedeckt: false },
            { id: "b", name: "Bert", wuerfel: ["2", "2", "2", "2", "2"], aufgedeckt: true }
        ]
    };
    const daten = MODELL.normalisieren(roh);
    gleich(daten.spieler[0].wuerfel.length, 0, "verdeckt bleibt leer");
    gleich(daten.spieler[1].wuerfel.join("|"), "2|2|2|2|2", "aufgedeckt sichtbar");
});

pruefe("Tipps werden auf fünf Werte gebracht", () => {
    const roh = {
        spieler: [{ id: "a", name: "Anna", tipps: { "b": ["1", "9"] } }]
    };
    const daten = MODELL.normalisieren(roh);
    gleich(daten.spieler[0].tipps["b"].join("|"), "1||||", "Tipp bereinigt");
});

pruefe("Spieler ohne Kennung bekommen eine", () => {
    const daten = MODELL.normalisieren({ spieler: [{ name: "Ohne" }] });
    wahr(typeof daten.spieler[0].id === "string" && daten.spieler[0].id.length > 0, "Kennung erzeugt");
});

/* ------------------------------------------------------------------ *
 * Spieler verwalten
 * ------------------------------------------------------------------ */

pruefe("Spieler hinzufügen lässt den Ausgangsstand unberührt", () => {
    const vorher = MODELL.spielerHinzufuegen(MODELL.leereDaten(), "Anna", "id-anna", 1000);
    const nachher = MODELL.spielerHinzufuegen(vorher, "Bert", "id-bert", 2000);

    gleich(vorher.spieler.length, 1, "Ausgangsstand unverändert");
    gleich(nachher.spieler.length, 2, "neuer Stand");
    gleich(nachher.spieler[1].name, "Bert", "Reihenfolge");
});

pruefe("Spieler suchen: nach Kennung und nach Namen", () => {
    const daten = rundeMitAnnaUndBert();

    gleich(MODELL.spielerFinden(daten, "id-bert").name, "Bert", "nach Kennung");
    gleich(MODELL.spielerFinden(daten, "gibt-es-nicht"), null, "unbekannte Kennung");
    gleich(MODELL.spielerNachName(daten, "anna").id, "id-anna", "Name ohne Rücksicht auf Schreibweise");
    gleich(MODELL.spielerNachName(daten, "  Bert ").id, "id-bert", "Leerzeichen werden entfernt");
    gleich(MODELL.spielerNachName(daten, ""), null, "leerer Name");
});

pruefe("Wer austritt, verschwindet auch aus den Tipps der anderen", () => {
    let daten = rundeMitAnnaUndBert();
    daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", 0, "3", 2000);

    const ohneBert = MODELL.spielerEntfernen(daten, "id-bert", 3000);
    gleich(ohneBert.spieler.length, 1, "ein Spieler weg");
    gleich(Object.keys(ohneBert.spieler[0].tipps).length, 0, "Tipp auf ihn entfernt");
});

pruefe("Namen setzen ändert nur den gemeinten Spieler", () => {
    const daten = rundeMitAnnaUndBert();
    const neu = MODELL.nameSetzen(daten, "id-bert", "Bertram", 4000);

    gleich(neu.spieler[0].name, "Anna", "erster unberührt");
    gleich(neu.spieler[1].name, "Bertram", "zweiter geändert");
    gleich(daten.spieler[1].name, "Bert", "Ausgangsstand unverändert");
});

/* ------------------------------------------------------------------ *
 * Festlegen (Siegel)
 * ------------------------------------------------------------------ */

pruefe("Festlegen veröffentlicht nur den Prüfwert", () => {
    const daten = MODELL.pruefwertSetzen(rundeMitAnnaUndBert(), "id-anna", "abc123", 5000);
    const anna = MODELL.spielerFinden(daten, "id-anna");

    gleich(anna.pruefwert, "abc123", "Prüfwert");
    gleich(anna.festgelegtAm, 5000, "Zeitpunkt");
    gleich(anna.festlegungen, 1, "erste Festlegung");
    gleich(anna.wuerfel.length, 0, "keine Würfel im gemeinsamen Stand");
});

pruefe("Erneutes Festlegen wird mitgezählt", () => {
    let daten = MODELL.pruefwertSetzen(rundeMitAnnaUndBert(), "id-anna", "abc", 5000);
    daten = MODELL.pruefwertSetzen(daten, "id-anna", "def", 6000);

    const anna = MODELL.spielerFinden(daten, "id-anna");
    gleich(anna.festlegungen, 2, "zweimal festgelegt");
    gleich(anna.festgelegtAm, 6000, "letzter Zeitpunkt");
});

pruefe("Ein neues Siegel macht ein früheres Aufdecken ungültig", () => {
    let daten = MODELL.pruefwertSetzen(rundeMitAnnaUndBert(), "id-anna", "abc", 5000);
    daten = MODELL.aufdecken(daten, "id-anna", ["1", "2", "3", "4", "5"], true, 6000);
    daten = MODELL.pruefwertSetzen(daten, "id-anna", "xyz", 7000);

    const anna = MODELL.spielerFinden(daten, "id-anna");
    gleich(anna.aufgedeckt, false, "nicht mehr aufgedeckt");
    gleich(anna.bestaetigt, false, "nicht mehr bestätigt");
    gleich(anna.wuerfel.length, 0, "Würfel wieder verdeckt");
});

/* ------------------------------------------------------------------ *
 * Tipps
 * ------------------------------------------------------------------ */

pruefe("Ein Tipp landet beim Rater, nicht beim Ziel", () => {
    const daten = MODELL.tippSetzen(rundeMitAnnaUndBert(), "id-anna", "id-bert", 2, "STERN", 2000);

    gleich(MODELL.tippLesen(daten, "id-anna", "id-bert").join("|"), "||STERN||", "Tipp gesetzt");
    gleich(MODELL.tippLesen(daten, "id-bert", "id-anna").join("|"), "||||", "Ziel hat nichts");
});

pruefe("Ungültige Tipps ändern nichts", () => {
    let daten = MODELL.tippSetzen(rundeMitAnnaUndBert(), "id-anna", "id-bert", 0, "1", 2000);

    gleich(MODELL.tippLesen(MODELL.tippSetzen(daten, "id-anna", "id-bert", 0, "7", 3000),
        "id-anna", "id-bert").join("|"), "1||||", "Wert 7 abgelehnt");
    gleich(MODELL.tippLesen(MODELL.tippSetzen(daten, "id-anna", "id-bert", 9, "2", 3000),
        "id-anna", "id-bert").join("|"), "1||||", "Spalte 9 abgelehnt");
    gleich(MODELL.tippLesen(MODELL.tippSetzen(daten, "id-anna", "id-anna", 1, "2", 3000),
        "id-anna", "id-anna").join("|"), "||||", "kein Tipp auf sich selbst");
});

pruefe("Ein Tipp lässt sich wieder leeren", () => {
    let daten = MODELL.tippSetzen(rundeMitAnnaUndBert(), "id-anna", "id-bert", 0, "4", 2000);
    daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", 0, "", 3000);
    gleich(MODELL.tippLesen(daten, "id-anna", "id-bert").join("|"), "||||", "wieder leer");
});

pruefe("Auf einen aufgedeckten Spieler kann niemand mehr tippen", () => {
    /* Sonst könnte man nach dem Aufdecken die richtige Antwort eintragen —
       das ist die Sperre, die das Aufdecken je Person erst möglich macht. */
    let daten = MODELL.tippSetzen(rundeMitAnnaUndBert(), "id-anna", "id-bert", 0, "1", 2000);
    daten = MODELL.aufdecken(daten, "id-bert", ["2", "2", "2", "2", "2"], true, 3000);

    const versuch = MODELL.tippSetzen(daten, "id-anna", "id-bert", 1, "2", 4000);
    gleich(MODELL.tippLesen(versuch, "id-anna", "id-bert").join("|"), "1||||", "Tipp unverändert");
});

pruefe("Tipps auf unbekannte Spieler werden abgewiesen", () => {
    const daten = MODELL.tippSetzen(rundeMitAnnaUndBert(), "id-anna", "gibt-es-nicht", 0, "1", 2000);
    gleich(MODELL.tippLesen(daten, "id-anna", "gibt-es-nicht").join("|"), "||||", "nichts gesetzt");
});

/* ------------------------------------------------------------------ *
 * Aufdecken, neue Runde
 * ------------------------------------------------------------------ */

pruefe("Aufdecken schreibt Würfel und Siegel-Ergebnis", () => {
    const daten = MODELL.aufdecken(rundeMitAnnaUndBert(), "id-anna",
        ["1", "1", "3", "5", "STERN"], true, 5000);
    const anna = MODELL.spielerFinden(daten, "id-anna");

    gleich(anna.aufgedeckt, true, "aufgedeckt");
    gleich(anna.bestaetigt, true, "bestätigt");
    gleich(anna.wuerfel.join("|"), "1|1|3|5|STERN", "Würfel");
});

pruefe("Eine neue Runde behält die Spieler und leert den Rest", () => {
    let daten = MODELL.pruefwertSetzen(rundeMitAnnaUndBert(), "id-anna", "abc", 5000);
    daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", 0, "3", 5000);
    daten = MODELL.aufdecken(daten, "id-anna", ["1", "1", "1", "1", "1"], true, 6000);

    const neu = MODELL.neueRunde(daten, 7000);
    const anna = MODELL.spielerFinden(neu, "id-anna");

    gleich(neu.spieler.length, 2, "Spieler bleiben");
    gleich(anna.pruefwert, "", "Siegel weg");
    gleich(anna.festlegungen, 0, "Zähler zurück");
    gleich(anna.wuerfel.length, 0, "Würfel weg");
    gleich(anna.aufgedeckt, false, "nicht aufgedeckt");
    gleich(Object.keys(anna.tipps).length, 0, "Tipps weg");
});

/* ------------------------------------------------------------------ *
 * Auswertung — das Herz des Spiels
 * ------------------------------------------------------------------ */

pruefe("Treffer zählen ohne Rücksicht auf die Reihenfolge", () => {
    gleich(MODELL.treffer(["1", "2", "3", "4", "5"], ["5", "4", "3", "2", "1"]), 5, "alles richtig");
    gleich(MODELL.treffer(["1", "2", "3", "4", "5"], ["1", "2", "3", "4", "5"]), 5, "gleiche Reihenfolge");
});

pruefe("Ein doppelt geratener Wert zählt nur so oft, wie er vorkommt", () => {
    /* echt: eine 1, eine 3, eine 5, dazu zwei weitere Werte */
    gleich(MODELL.treffer(["1", "1", "3", "5", "STERN"], ["1", "3", "3", "5", "5"]), 3, "Beispiel aus der Doku");
    gleich(MODELL.treffer(["1", "2", "3", "4", "5"], ["1", "1", "1", "1", "1"]), 1, "eine 1 vorhanden");
    gleich(MODELL.treffer(["1", "1", "1", "1", "1"], ["1", "1", "1", "1", "1"]), 5, "fünf Einsen");
});

pruefe("Leere Felder zählen nie als Treffer", () => {
    gleich(MODELL.treffer(["1", "2", "3", "4", "5"], ["", "", "", "", ""]), 0, "leerer Tipp");
    gleich(MODELL.treffer([], ["1", "2", "3", "4", "5"]), 0, "nichts aufgedeckt");
});

pruefe("Das Ergebnis zählt nur gegen aufgedeckte Spieler", () => {
    let daten = rundeMitAnnaUndBert();
    daten = MODELL.spielerHinzufuegen(daten, "Cem", "id-cem", 1000);

    /* Anna tippt auf beide, Bert deckt auf, Cem nicht. */
    for (let spalte = 0; spalte < 5; spalte++) {
        daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", spalte, "2", 2000);
        daten = MODELL.tippSetzen(daten, "id-anna", "id-cem", spalte, "4", 2000);
    }
    daten = MODELL.aufdecken(daten, "id-bert", ["2", "2", "1", "1", "1"], true, 3000);

    const ergebnis = MODELL.ergebnis(daten);
    const anna = ergebnis.find((eintrag) => eintrag.id === "id-anna");

    gleich(anna.punkte, 2, "zwei Zweien getroffen");
    gleich(anna.moeglich, 5, "nur Bert zählt mit");
});

pruefe("Das Ergebnis steht nach Punkten sortiert", () => {
    let daten = rundeMitAnnaUndBert();
    daten = MODELL.spielerHinzufuegen(daten, "Cem", "id-cem", 1000);

    /* Cem trifft dreimal, Anna einmal. */
    for (let spalte = 0; spalte < 3; spalte++) {
        daten = MODELL.tippSetzen(daten, "id-cem", "id-bert", spalte, "2", 2000);
    }
    daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", 0, "2", 2000);
    daten = MODELL.aufdecken(daten, "id-bert", ["2", "2", "2", "1", "1"], true, 3000);

    const ergebnis = MODELL.ergebnis(daten);
    gleich(ergebnis[0].name, "Cem", "Bester zuerst");
    gleich(ergebnis[0].punkte, 3, "drei Treffer");
    gleich(ergebnis[1].name, "Anna", "danach Anna");
    gleich(ergebnis[1].punkte, 1, "ein Treffer");
    gleich(ergebnis[2].name, "Bert", "Bert hat nicht getippt");
    gleich(ergebnis[2].punkte, 0, "null Treffer");
});

/* ------------------------------------------------------------------ *
 * Vergleich (steuert das Neuzeichnen beim gemeinsamen Speicher)
 * ------------------------------------------------------------------ */

pruefe("Gleicher Inhalt mit anderem Zeitstempel gilt als gleich", () => {
    const a = MODELL.spielerHinzufuegen(MODELL.leereDaten(), "Anna", "id-anna", 1000);
    const b = MODELL.spielerHinzufuegen(MODELL.leereDaten(), "Anna", "id-anna", 9999);
    wahr(MODELL.inhaltGleich(a, b), "inhaltlich gleich");
});

pruefe("Jede echte Änderung wird erkannt", () => {
    const a = rundeMitAnnaUndBert();

    wahr(!MODELL.inhaltGleich(a, MODELL.nameSetzen(a, "id-anna", "Anne", 2000)), "Name");
    wahr(!MODELL.inhaltGleich(a, MODELL.pruefwertSetzen(a, "id-anna", "abc", 2000)), "Siegel");
    wahr(!MODELL.inhaltGleich(a, MODELL.tippSetzen(a, "id-anna", "id-bert", 0, "1", 2000)), "Tipp");
    wahr(!MODELL.inhaltGleich(a, MODELL.spielerEntfernen(a, "id-bert", 2000)), "Spielerzahl");
    wahr(!MODELL.inhaltGleich(a, MODELL.aufdecken(a, "id-anna", ["1", "1", "1", "1", "1"], true, 2000)),
        "Aufdecken");
});

/* ------------------------------------------------------------------ *
 * Ergebnis
 * ------------------------------------------------------------------ */

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
