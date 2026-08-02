/*
 * schach-varianten.js — die Spielarten des Team-Schachs.
 *
 * Eine reine Datentabelle, keine Logik: Jede Variante beschreibt nur, WIE das
 * Brett aussieht und welche Sonderregeln gelten. Wer eine neue Spielart
 * hinzufügen will, ergänzt hier einen Eintrag und muss sonst nichts anfassen —
 * schach.js liest die Maße und Schalter, schach-runde.js den Rest.
 *
 * Warum die Tabelle VOR schach.js steht: Die Regeln brauchen die Maße des
 * Bretts, sobald ein Stand entsteht. Die Abhängigkeit geht also nur in eine
 * Richtung (schach.js liest hier, hier wird nichts über Regeln gewusst).
 *
 * Felder einer Variante:
 *
 *     id             Kennung im gespeicherten Stand — NIE ändern, sonst
 *                    verlieren laufende Partien ihre Spielart.
 *     titel          Beschriftung auf dem Bildschirm.
 *     beschreibung   Ein Satz für die Auswahl beim Anlegen einer Partie.
 *     breite, hoehe  Anzahl der Spalten und Reihen.
 *     aufstellung    Startbrett, Zeile für Zeile von oben (Reihe der schwarzen
 *                    Figuren) nach unten. Länge = breite * hoehe.
 *     rochade        Ist die Rochade erlaubt? Nur beim klassischen Brett, weil
 *                    sie an den Standardplätzen von König und Turm hängt.
 *     koenigSchlagbar  true = es gibt kein Schach und kein Matt; Könige werden
 *                    geschlagen wie jede andere Figur, und wer keinen König
 *                    mehr hat, verliert. Nötig für Bretter mit mehreren
 *                    Königen je Seite (Doppelbrett).
 *     bonusFelder    Fähigkeiten, die auf dem Brett liegen:
 *                    [ { feld: <Nummer>, art: "sprung" } ]. Leer = keine.
 */

const SCHACH_VARIANTEN = {

    /* Kennung der Spielart, die gilt, wenn nichts anderes gespeichert ist.
       Alle Partien aus der Zeit vor den Spielarten sind klassisch. */
    STANDARD: "standard",

    /*
     * Die Fähigkeiten, die man auf einem Bonusfeld aufsammeln kann.
     * Wirkung: siehe schach.js (sprungAktiv, extraZug im Stand).
     */
    FAEHIGKEITEN: {
        sprung: {
            titel: "Sprung",
            beschreibung: "Beim nächsten Zug darf eine beliebige eigene Figur "
                + "zusätzlich wie ein Springer ziehen."
        },
        doppelzug: {
            titel: "Doppelzug",
            beschreibung: "Nach dem nächsten Zug ist dein Team sofort noch "
                + "einmal am Zug."
        }
    },

    liste: [
        {
            id: "standard",
            titel: "Klassisch",
            beschreibung: "Das gewohnte Brett mit 8 mal 8 Feldern und allen Regeln.",
            breite: 8,
            hoehe: 8,
            aufstellung:
                "tsldklst"
                + "bbbbbbbb"
                + "........"
                + "........"
                + "........"
                + "........"
                + "BBBBBBBB"
                + "TSLDKLST",
            rochade: true,
            koenigSchlagbar: false,
            bonusFelder: []
        },
        {
            id: "klein",
            titel: "Kleines Brett",
            beschreibung: "6 mal 6 Felder, ohne Läufer und ohne Rochade — kurze Partien.",
            breite: 6,
            hoehe: 6,
            aufstellung:
                "tsdkst"
                + "bbbbbb"
                + "......"
                + "......"
                + "BBBBBB"
                + "TSDKST",
            rochade: false,
            koenigSchlagbar: false,
            bonusFelder: []
        },
        {
            id: "gross",
            titel: "Großes Brett",
            beschreibung: "10 mal 8 Felder mit je zwei Läuferpaaren — mehr Platz, längere Partien.",
            breite: 10,
            hoehe: 8,
            aufstellung:
                "tslldkllst"
                + "bbbbbbbbbb"
                + ".........."
                + ".........."
                + ".........."
                + ".........."
                + "BBBBBBBBBB"
                + "TSLLDKLLST",
            rochade: false,
            koenigSchlagbar: false,
            bonusFelder: []
        },
        {
            id: "doppelbrett",
            titel: "Doppelbrett",
            beschreibung: "Zwei Bretter nebeneinander (16 mal 8), zwei Armeen je Seite. "
                + "Die Figuren dürfen überall hinziehen. Kein Schach und kein Matt: "
                + "Wer zuerst beide Könige verliert, verliert die Partie.",
            breite: 16,
            hoehe: 8,
            aufstellung:
                "tsldklsttsldklst"
                + "bbbbbbbbbbbbbbbb"
                + "................"
                + "................"
                + "................"
                + "................"
                + "BBBBBBBBBBBBBBBB"
                + "TSLDKLSTTSLDKLST",
            rochade: false,
            koenigSchlagbar: true,
            bonusFelder: []
        },
        {
            id: "faehigkeiten",
            titel: "Fähigkeiten sammeln",
            beschreibung: "Klassisches Brett, auf dem vier Fähigkeiten liegen. "
                + "Wer mit einer Figur daraufzieht, sammelt sie für sein Team ein.",
            breite: 8,
            hoehe: 8,
            aufstellung:
                "tsldklst"
                + "bbbbbbbb"
                + "........"
                + "........"
                + "........"
                + "........"
                + "BBBBBBBB"
                + "TSLDKLST",
            rochade: true,
            koenigSchlagbar: false,
            /* Die vier Felder liegen spiegelbildlich auf den mittleren Reihen,
               damit keine Seite näher dran ist: c5, f5, c4, f4. */
            bonusFelder: [
                { feld: 26, art: "sprung" },
                { feld: 29, art: "doppelzug" },
                { feld: 34, art: "doppelzug" },
                { feld: 37, art: "sprung" }
            ]
        }
    ],

    /* Die Variante zu einer Kennung; unbekannte Kennungen ergeben die klassische. */
    holen(id) {
        const gefunden = SCHACH_VARIANTEN.liste.find((eintrag) => eintrag.id === id);
        return gefunden || SCHACH_VARIANTEN.liste[0];
    },

    /* Gibt es diese Kennung? */
    gibtEs(id) {
        return SCHACH_VARIANTEN.liste.some((eintrag) => eintrag.id === id);
    },

    /* Titel einer Fähigkeit, für den Bildschirm. */
    faehigkeitTitel(art) {
        const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        return eintrag ? eintrag.titel : "";
    },

    faehigkeitBeschreibung(art) {
        const eintrag = SCHACH_VARIANTEN.FAEHIGKEITEN[art];
        return eintrag ? eintrag.beschreibung : "";
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_VARIANTEN;
}
