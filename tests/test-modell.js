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
 * PIN (Anmeldung von einem anderen Gerät)
 * ------------------------------------------------------------------ */

pruefe("Ein neuer Spieler hat noch keine PIN", () => {
    const daten = rundeMitAnnaUndBert();
    wahr(!MODELL.hatPin(MODELL.spielerFinden(daten, "id-anna")), "ohne PIN");
});

pruefe("Die PIN wird als Pruefsumme mit Salz hinterlegt, nie als Ziffern", () => {
    const daten = MODELL.pinSetzen(rundeMitAnnaUndBert(), "id-anna", "abc123", "salz", 5000);
    const anna = MODELL.spielerFinden(daten, "id-anna");

    gleich(anna.pinPruefwert, "abc123", "Pruefwert");
    gleich(anna.pinSalz, "salz", "Salz");
    wahr(MODELL.hatPin(anna), "hat jetzt eine PIN");
    /* Der Spieler-Eintrag darf kein Feld mit der PIN selbst bekommen. */
    wahr(Object.keys(anna).indexOf("pin") === -1, "kein Feld pin");
});

pruefe("Ohne Salz oder ohne Pruefwert gilt die PIN als nicht gesetzt", () => {
    const nurWert = MODELL.pinSetzen(rundeMitAnnaUndBert(), "id-anna", "abc", "", 5000);
    const nurSalz = MODELL.pinSetzen(rundeMitAnnaUndBert(), "id-anna", "", "salz", 5000);

    wahr(!MODELL.hatPin(MODELL.spielerFinden(nurWert, "id-anna")), "ohne Salz");
    wahr(!MODELL.hatPin(MODELL.spielerFinden(nurSalz, "id-anna")), "ohne Pruefwert");
});

pruefe("Eine neue Runde loescht die PIN NICHT", () => {
    /* Sonst muesste sich nach jeder Runde jeder neu anmelden. */
    let daten = MODELL.pinSetzen(rundeMitAnnaUndBert(), "id-anna", "abc", "salz", 5000);
    daten = MODELL.neueRunde(daten, 6000);

    wahr(MODELL.hatPin(MODELL.spielerFinden(daten, "id-anna")), "PIN bleibt");
});

pruefe("PIN-Angaben ueberleben das Normalisieren", () => {
    const roh = { spieler: [{ id: "a", name: "Anna", pinPruefwert: "abc", pinSalz: "salz" }] };
    const daten = MODELL.normalisieren(roh);

    gleich(daten.spieler[0].pinPruefwert, "abc", "Pruefwert");
    gleich(daten.spieler[0].pinSalz, "salz", "Salz");
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

/* ------------------------------------------------------------------ *
 * Punkte
 * ------------------------------------------------------------------ */

pruefe("Ein genau getroffener Würfel bringt volle Punkte", () => {
    const alles = MODELL.punkte(["1", "2", "3", "4", "5"], ["5", "4", "3", "2", "1"]);
    gleich(alles.exakt, 5, "fünf genau");
    gleich(alles.nah, 0, "nichts knapp");
    gleich(alles.punkte, 5 * MODELL.PUNKTE_EXAKT, "volle Punktzahl");
});

pruefe("Knapp daneben bringt Teilpunkte nach Abstand", () => {
    /* Wurf 1,2,3,4,5 gegen Tipp 1,2,3,4,4: vier genau, die 4 liegt um 1 neben der 5. */
    const knapp = MODELL.punkte(["1", "2", "3", "4", "5"], ["1", "2", "3", "4", "4"]);
    gleich(knapp.exakt, 4, "vier genau");
    gleich(knapp.nah, 1, "einer knapp");
    gleich(knapp.punkte, 4 * MODELL.PUNKTE_EXAKT + MODELL.PUNKTE_NAH[0], "Beispiel aus der Erklärung");

    /* Abstand 2 bringt weniger. */
    const zwei = MODELL.punkte(["5", "", "", "", ""], ["3", "", "", "", ""]);
    gleich(zwei.punkte, MODELL.PUNKTE_NAH[1], "Abstand 2");

    /* Abstand 3 bringt nichts mehr. */
    const drei = MODELL.punkte(["5", "", "", "", ""], ["2", "", "", "", ""]);
    gleich(drei.punkte, 0, "Abstand 3");
});

pruefe("Die Restwerte werden so gepaart, wie es fuer den Rater am besten ist", () => {
    /* Echt 1 und 5, getippt 2 und 4: die richtige Paarung ist 1-2 und 5-4
       (zweimal Abstand 1), nicht 1-4 und 5-2. */
    const wertung = MODELL.punkte(["1", "5", "", "", ""], ["2", "4", "", "", ""]);
    gleich(wertung.exakt, 0, "nichts genau");
    gleich(wertung.nah, 2, "zwei knapp");
    gleich(wertung.punkte, 2 * MODELL.PUNKTE_NAH[0], "beste Paarung");
});

pruefe("Der Stern zaehlt nur genau getroffen", () => {
    const genau = MODELL.punkte(["STERN", "", "", "", ""], ["STERN", "", "", "", ""]);
    gleich(genau.punkte, MODELL.PUNKTE_EXAKT, "Stern auf Stern");

    const daneben = MODELL.punkte(["STERN", "", "", "", ""], ["5", "", "", "", ""]);
    gleich(daneben.punkte, 0, "Zahl statt Stern");

    const andersrum = MODELL.punkte(["5", "", "", "", ""], ["STERN", "", "", "", ""]);
    gleich(andersrum.punkte, 0, "Stern statt Zahl");
});

pruefe("Doppelte Werte zaehlen nur so oft, wie sie vorkommen", () => {
    const wertung = MODELL.punkte(["1", "1", "3", "5", "STERN"], ["1", "3", "3", "5", "5"]);
    gleich(wertung.exakt, 3, "eine 1, eine 3, eine 5");
    /* Rest echt: 1 und Stern (Stern zaehlt nicht) -> [1]
       Rest Tipp: 3 und 5 -> [3, 5]; gepaart wird 1 mit 3 = Abstand 2. */
    gleich(wertung.nah, 1, "ein Paar knapp");
    gleich(wertung.punkte, 3 * MODELL.PUNKTE_EXAKT + MODELL.PUNKTE_NAH[1], "Summe");
});

pruefe("Ein leerer Tipp bringt keine Punkte", () => {
    gleich(MODELL.punkte(["1", "2", "3", "4", "5"], ["", "", "", "", ""]).punkte, 0, "leer");
});

pruefe("Der Bonus geht an den besten Tipp auf eine Person", () => {
    let daten = rundeMitAnnaUndBert();
    daten = MODELL.spielerHinzufuegen(daten, "Cem", "id-cem", 1000);

    /* Bert wuerfelt 2,2,2,2,2. Anna tippt dreimal die 2, Cem einmal. */
    for (let spalte = 0; spalte < 3; spalte++) {
        daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", spalte, "2", 2000);
    }
    daten = MODELL.tippSetzen(daten, "id-cem", "id-bert", 0, "2", 2000);
    daten = MODELL.aufdecken(daten, "id-bert", ["2", "2", "2", "2", "2"], true, 3000);

    const ergebnis = MODELL.ergebnis(daten);
    const anna = ergebnis.find((eintrag) => eintrag.id === "id-anna");
    const cem = ergebnis.find((eintrag) => eintrag.id === "id-cem");

    gleich(anna.bonus, MODELL.PUNKTE_BONUS, "Anna lag am besten");
    gleich(cem.bonus, 0, "Cem nicht");
    gleich(anna.punkte, 3 * MODELL.PUNKTE_EXAKT + MODELL.PUNKTE_BONUS, "mit Bonus");
});

pruefe("Bei Gleichstand bekommen alle den Bonus, bei null Punkten niemand", () => {
    let daten = rundeMitAnnaUndBert();
    daten = MODELL.spielerHinzufuegen(daten, "Cem", "id-cem", 1000);

    daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", 0, "2", 2000);
    daten = MODELL.tippSetzen(daten, "id-cem", "id-bert", 0, "2", 2000);
    daten = MODELL.aufdecken(daten, "id-bert", ["2", "2", "2", "2", "2"], true, 3000);

    const gleichstand = MODELL.ergebnis(daten);
    gleich(gleichstand.find((e) => e.id === "id-anna").bonus, MODELL.PUNKTE_BONUS, "Anna");
    gleich(gleichstand.find((e) => e.id === "id-cem").bonus, MODELL.PUNKTE_BONUS, "Cem");

    /* Niemand hat getippt: kein Bonus zu verteilen. */
    let leer = rundeMitAnnaUndBert();
    leer = MODELL.aufdecken(leer, "id-bert", ["2", "2", "2", "2", "2"], true, 3000);
    gleich(MODELL.ergebnis(leer).find((e) => e.id === "id-anna").bonus, 0, "kein Bonus");
});

pruefe("Die Punkteerklaerung nennt die geltenden Werte", () => {
    const text = MODELL.punkteErklaerung();
    wahr(text.indexOf(String(MODELL.PUNKTE_EXAKT)) !== -1, "Punkte fuer genau");
    wahr(text.indexOf(String(MODELL.PUNKTE_NAH[0])) !== -1, "Punkte fuer Abstand 1");
    wahr(text.indexOf(String(MODELL.PUNKTE_BONUS)) !== -1, "Bonus");
});

pruefe("Das Ergebnis zählt nur gegen aufgedeckte Spieler", () => {
    let daten = rundeMitAnnaUndBert();
    daten = MODELL.spielerHinzufuegen(daten, "Cem", "id-cem", 1000);

    /* Anna tippt auf beide, Bert deckt auf, Cem nicht. */
    for (let spalte = 0; spalte < 5; spalte++) {
        daten = MODELL.tippSetzen(daten, "id-anna", "id-bert", spalte, "2", 2000);
        daten = MODELL.tippSetzen(daten, "id-anna", "id-cem", spalte, "4", 2000);
    }
    daten = MODELL.aufdecken(daten, "id-bert", ["2", "2", "2", "2", "2"], true, 3000);

    const ergebnis = MODELL.ergebnis(daten);
    const anna = ergebnis.find((eintrag) => eintrag.id === "id-anna");

    /* Fuenf genau auf Bert plus Bonus; Cem ist nicht aufgedeckt und zaehlt nicht. */
    gleich(anna.exakt, 5, "fuenf genau auf Bert");
    gleich(anna.punkte, 5 * MODELL.PUNKTE_EXAKT + MODELL.PUNKTE_BONUS, "Punkte");
    gleich(anna.moeglich, MODELL.punkteMaximum(), "nur Bert zählt mit");
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
    gleich(ergebnis[0].exakt, 3, "drei genau");
    gleich(ergebnis[0].punkte, 3 * MODELL.PUNKTE_EXAKT + MODELL.PUNKTE_BONUS, "mit Bonus");
    gleich(ergebnis[1].name, "Anna", "danach Anna");
    gleich(ergebnis[1].punkte, MODELL.PUNKTE_EXAKT, "ein genauer Treffer");
    gleich(ergebnis[2].name, "Bert", "Bert hat nicht getippt");
    gleich(ergebnis[2].punkte, 0, "keine Punkte");
});

/* ------------------------------------------------------------------ *
 * Zusammenführen — der Schutz gegen gegenseitiges Überschreiben
 * ------------------------------------------------------------------ */

pruefe("Fremde Spieler bleiben erhalten, der eigene Eintrag gewinnt", () => {
    /* Auf dem Server hat sich Cem angemeldet; das eigene Geraet weiss davon
       nichts und hat inzwischen den eigenen Namen geaendert. */
    const fremd = MODELL.spielerHinzufuegen(rundeMitAnnaUndBert(), "Cem", "id-cem", 3000);
    const eigen = MODELL.nameSetzen(rundeMitAnnaUndBert(), "id-anna", "Anne", 4000);

    const vereint = MODELL.zusammenfuehren(fremd, eigen, "id-anna");

    gleich(vereint.spieler.length, 3, "Cem bleibt erhalten");
    gleich(MODELL.spielerFinden(vereint, "id-anna").name, "Anne", "eigener Eintrag gewinnt");
    wahr(MODELL.spielerFinden(vereint, "id-cem") !== null, "Cem ist dabei");
});

pruefe("Ein gerade angelegter eigener Eintrag wird angehaengt", () => {
    /* Genau der Fall, der frueher zum Rauswurf fuehrte: Der Server kennt mich
       noch nicht, weil ich mich gerade erst angemeldet habe. */
    const fremd = MODELL.spielerHinzufuegen(MODELL.leereDaten(), "Bert", "id-bert", 1000);
    const eigen = MODELL.spielerHinzufuegen(MODELL.leereDaten(), "Anna", "id-anna", 2000);

    const vereint = MODELL.zusammenfuehren(fremd, eigen, "id-anna");

    gleich(vereint.spieler.length, 2, "beide da");
    wahr(MODELL.spielerFinden(vereint, "id-anna") !== null, "ich bin dabei");
    wahr(MODELL.spielerFinden(vereint, "id-bert") !== null, "Bert auch");
});

pruefe("Fremde Aenderungen an fremden Eintraegen werden uebernommen", () => {
    /* Bert hat auf dem Server aufgedeckt; mein Stand ist aelter. */
    const fremd = MODELL.aufdecken(rundeMitAnnaUndBert(), "id-bert",
        ["1", "1", "1", "1", "1"], true, 3000);
    const eigen = rundeMitAnnaUndBert();

    const vereint = MODELL.zusammenfuehren(fremd, eigen, "id-anna");
    const bert = MODELL.spielerFinden(vereint, "id-bert");

    gleich(bert.aufgedeckt, true, "Bert ist aufgedeckt");
    gleich(bert.wuerfel.join("|"), "1|1|1|1|1", "mit seinen Wuerfeln");
});

pruefe("Meine eigenen Tipps ueberleben das Zusammenfuehren", () => {
    const fremd = rundeMitAnnaUndBert();
    const eigen = MODELL.tippSetzen(rundeMitAnnaUndBert(), "id-anna", "id-bert", 0, "3", 2000);

    const vereint = MODELL.zusammenfuehren(fremd, eigen, "id-anna");
    gleich(MODELL.tippLesen(vereint, "id-anna", "id-bert").join("|"), "3||||", "Tipp bleibt");
});

pruefe("Ohne eigenen Eintrag bleibt der fremde Stand unveraendert", () => {
    const fremd = rundeMitAnnaUndBert();
    const vereint = MODELL.zusammenfuehren(fremd, MODELL.leereDaten(), "gibt-es-nicht");
    gleich(vereint.spieler.length, 2, "nichts verloren");
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
