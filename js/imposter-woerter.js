/*
 * imposter-woerter.js — der Wortkatalog für das Spiel Imposter.
 *
 * Eine reine Datentabelle, keine Logik. Wer Wörter ergänzen will, schreibt sie
 * in die passende Gruppe — sonst ist nichts zu tun.
 *
 * WARUM DIE LISTE HANDGEMACHT IST
 * Sie stammt nicht aus einer fremden Quelle: Eine heruntergeladene Wortliste
 * wäre auf einer öffentlichen Seite eine Rechtefrage, und die meisten sind für
 * dieses Spiel ohnehin unbrauchbar. Gebraucht werden Wörter, die man
 * BESCHREIBEN kann, ohne sie zu nennen — kein "Konjunktiv", kein "Umstand".
 *
 * Jede Gruppe hat:
 *     id       Kennung im gespeicherten Stand — NIE ändern.
 *     titel    Beschriftung auf dem Bildschirm.
 *     art      "thema" (worüber) oder "wortart" (welche Sorte Wort).
 *     woerter  Die Wörter selbst. Reihenfolge egal; gezogen wird gerechnet.
 *
 * REGEL FÜR NEUE WÖRTER
 * Nur Wörter, die jeder am Tisch kennt und in einem Satz umschreiben kann.
 * Nichts, was auf eine Person zeigt, nichts Anstößiges — gespielt wird das im
 * Freundeskreis und im Haus.
 */

const IMPOSTER_WOERTER = {

    gruppen: [
        {
            id: "alltag",
            titel: "Alltag",
            art: "thema",
            woerter: [
                "Zahnbürste", "Kaffeetasse", "Regenschirm", "Schlüsselbund",
                "Waschmaschine", "Staubsauger", "Bügeleisen", "Wecker",
                "Fernbedienung", "Geldbeutel", "Einkaufswagen", "Türklingel",
                "Kopfkissen", "Handtuch", "Mülleimer", "Spiegel",
                "Treppenhaus", "Fahrstuhl", "Briefkasten", "Fußmatte",
                "Kühlschrank", "Küchenuhr", "Schuhregal", "Nachttisch",
                "Wäscheleine", "Sofakissen", "Blumentopf", "Gartenschlauch"
            ]
        },
        {
            id: "essen",
            titel: "Essen und Trinken",
            art: "thema",
            woerter: [
                "Spaghetti", "Kartoffelsalat", "Rührei", "Brezel",
                "Kaugummi", "Wassermelone", "Zwiebel", "Senf",
                "Currywurst", "Milchreis", "Pfannkuchen", "Popcorn",
                "Erdnussbutter", "Zimtschnecke", "Gurkenscheibe", "Nudelsuppe",
                "Schokoriegel", "Apfelsaft", "Sprudelwasser", "Kakao",
                "Grillkohle", "Butterbrot", "Käsereibe", "Marmeladenglas",
                "Eiswürfel", "Backblech", "Zuckerwatte", "Fischstäbchen"
            ]
        },
        {
            id: "natur",
            titel: "Natur und Tiere",
            art: "thema",
            woerter: [
                "Regenwurm", "Eichhörnchen", "Gewitter", "Schneeflocke",
                "Sonnenblume", "Ameisenhaufen", "Wasserfall", "Nebel",
                "Igel", "Fledermaus", "Seerose", "Tannenzapfen",
                "Sandstrand", "Vogelnest", "Bergsee", "Waldweg",
                "Marienkäfer", "Regenbogen", "Maulwurf", "Bachlauf",
                "Herbstlaub", "Spinnennetz", "Wüstensand", "Möwe",
                "Schilfrohr", "Lawine", "Vollmond", "Grashalm"
            ]
        },
        {
            id: "technik",
            titel: "Technik und Arbeit",
            art: "thema",
            woerter: [
                "Bildschirm", "Tastatur", "Drucker", "Netzkabel",
                "Aktenordner", "Kaffeeautomat", "Besprechung", "Locher",
                "Serverraum", "Ladegerät", "Kopfhörer", "Taschenrechner",
                "Bohrmaschine", "Zollstock", "Schraubenzieher", "Leiter",
                "Werkzeugkasten", "Sicherung", "Steckdose", "Klebeband",
                "Aktenvernichter", "Whiteboard", "Notizzettel", "Bürostuhl",
                "Kabelbinder", "Handscanner", "Gabelstapler", "Zeiterfassung"
            ]
        },
        {
            id: "freizeit",
            titel: "Sport und Freizeit",
            art: "thema",
            woerter: [
                "Fahrradkette", "Schwimmbad", "Trampolin", "Angelrute",
                "Skistock", "Fußballtor", "Kartenspiel", "Grillabend",
                "Zeltplatz", "Wanderschuh", "Achterbahn", "Kinosaal",
                "Sprungbrett", "Bowlingkugel", "Federball", "Schaukel",
                "Rucksack", "Taschenlampe", "Lagerfeuer", "Schlittschuh",
                "Kletterwand", "Springseil", "Dartscheibe", "Segelboot",
                "Picknickdecke", "Schneemann", "Drachen", "Turnhalle"
            ]
        },
        {
            id: "nomen",
            titel: "Nur Nomen",
            art: "wortart",
            woerter: [
                "Brücke", "Fenster", "Teppich", "Kerze", "Koffer", "Leiter",
                "Schere", "Uhr", "Zaun", "Ballon", "Besen", "Eimer",
                "Flasche", "Gabel", "Hammer", "Kamm", "Laterne", "Messer",
                "Nadel", "Ofen", "Pinsel", "Rad", "Seil", "Tasche",
                "Vase", "Waage", "Ziegel", "Anker"
            ]
        },
        {
            id: "verben",
            titel: "Nur Verben",
            art: "wortart",
            woerter: [
                "schlafen", "klettern", "flüstern", "stolpern", "gähnen",
                "winken", "schwimmen", "lachen", "schieben", "graben",
                "pfeifen", "hüpfen", "rühren", "schleichen", "werfen",
                "bügeln", "streicheln", "niesen", "klopfen", "rutschen",
                "sammeln", "träumen", "verstecken", "wiegen",
                "zittern", "schnarchen", "putzen", "warten"
            ]
        },
        {
            id: "adjektive",
            titel: "Nur Adjektive",
            art: "wortart",
            woerter: [
                "durstig", "eckig", "flauschig", "glitschig", "hektisch",
                "klebrig", "leise", "müde", "neugierig", "peinlich",
                "rostig", "salzig", "schüchtern", "spitz", "staubig",
                "stolz", "trocken", "verschwitzt", "wackelig", "winzig",
                "zerknittert", "gemütlich", "hohl", "kratzig",
                "matschig", "prall", "sauer", "zerbrechlich"
            ]
        }
    ],

    /* Eine Gruppe zu ihrer Kennung; unbekannte ergeben die erste. */
    gruppe(id) {
        const gefunden = IMPOSTER_WOERTER.gruppen.find((eintrag) => eintrag.id === id);
        return gefunden || IMPOSTER_WOERTER.gruppen[0];
    },

    gibtEs(id) {
        return IMPOSTER_WOERTER.gruppen.some((eintrag) => eintrag.id === id);
    },

    /* Wie viele Wörter gibt es insgesamt? Nur für die Anzeige. */
    anzahl() {
        return IMPOSTER_WOERTER.gruppen
            .reduce((summe, gruppe) => summe + gruppe.woerter.length, 0);
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = IMPOSTER_WOERTER;
}
