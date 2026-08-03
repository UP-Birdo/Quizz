/*
 * imposter-woerter.js — der Wortkatalog für das Spiel Imposter.
 *
 * Eine reine Datentabelle, keine Logik. Wer Wörter ergänzen will, schreibt sie
 * in die passende Gruppe und dort unter die passende Wortart — sonst ist nichts
 * zu tun.
 *
 * WARUM DIE LISTE HANDGEMACHT IST
 * Sie stammt nicht aus einer fremden Quelle: Eine heruntergeladene Wortliste
 * wäre auf einer öffentlichen Seite eine Rechtefrage, und die meisten sind für
 * dieses Spiel ohnehin unbrauchbar. Gebraucht werden Wörter, die man
 * BESCHREIBEN kann, ohne sie zu nennen — kein "Konjunktiv", kein "Umstand".
 *
 * THEMA UND WORTART SIND ZWEI FRAGEN (seit v3.7)
 * Bis v3.6 standen „Nur Verben" und „Alltag" nebeneinander in derselben Liste,
 * als wären sie dasselbe. Sind sie nicht: **Jedes Wort hat ein Thema UND eine
 * Wortart.** Seitdem wählt man beides getrennt — ein Thema (oder alle) und eine
 * Wortart (oder alle). „Nur Verben quer durch alle Themen" ist damit einfach
 * die Auswahl „alle Themen" plus „Verb".
 *
 * Jede Gruppe hat:
 *     id           Kennung im gespeicherten Stand — NIE ändern.
 *     titel        Beschriftung auf dem Bildschirm.
 *     versteckt    true = steht nicht mehr zur Auswahl, bleibt aber gültig.
 *                  Laufende Räume tragen ihre Kennung im Stand und verlören
 *                  sonst ihr Thema — dieselbe Regel wie bei den Spielarten des
 *                  Schachs.
 *     nachWortart  Die Wörter, je Wortart eine Liste.
 *
 * REGEL FÜR NEUE WÖRTER
 * Nur Wörter, die jeder am Tisch kennt und in einem Satz umschreiben kann.
 * Nichts, was auf eine Person zeigt, nichts Anstößiges — gespielt wird das im
 * Freundeskreis und im Haus.
 *
 * DIE REIHENFOLGE DARF SICH NIE ÄNDERN. Die Ziehung rechnet mit der Länge der
 * Liste und greift auf eine Stelle darin zu; wer ein Wort dazwischenschiebt,
 * ändert das Wort jeder laufenden Runde. Neue Wörter kommen deshalb HINTEN an
 * ihre Liste.
 */

const IMPOSTER_WOERTER = {

    /* Kennung für „alles zusammen" — gilt für Thema und für Wortart. */
    ALLE: "alle",

    /*
     * Die Wortarten. Ihre Reihenfolge bestimmt auch die Reihenfolge, in der die
     * Wörter einer Gruppe zusammengesetzt werden (siehe `woerter`).
     */
    WORTARTEN: [
        { id: "nomen", titel: "Nomen", frage: "Ist es ein Ding oder ein Begriff?" },
        { id: "verb", titel: "Verb", frage: "Ist es etwas, das man tut?" },
        { id: "adjektiv", titel: "Adjektiv", frage: "Beschreibt es, wie etwas ist?" }
    ],

    /* Die Wortart, die gilt, wenn nichts anderes bekannt ist. */
    STANDARD_WORTART: "nomen",

    gruppen: [
        {
            id: "alltag",
            titel: "Alltag",
            nachWortart: {
                nomen: [
                    "Zahnbürste", "Kaffeetasse", "Regenschirm", "Schlüsselbund",
                    "Waschmaschine", "Staubsauger", "Bügeleisen", "Wecker",
                    "Fernbedienung", "Geldbeutel", "Einkaufswagen", "Türklingel",
                    "Kopfkissen", "Handtuch", "Mülleimer", "Spiegel",
                    "Treppenhaus", "Fahrstuhl", "Briefkasten", "Fußmatte",
                    "Kühlschrank", "Küchenuhr", "Schuhregal", "Nachttisch",
                    "Wäscheleine", "Sofakissen", "Blumentopf", "Gartenschlauch"
                ]
            }
        },
        {
            id: "essen",
            titel: "Essen und Trinken",
            nachWortart: {
                nomen: [
                    "Spaghetti", "Kartoffelsalat", "Rührei", "Brezel",
                    "Kaugummi", "Wassermelone", "Zwiebel", "Senf",
                    "Currywurst", "Milchreis", "Pfannkuchen", "Popcorn",
                    "Erdnussbutter", "Zimtschnecke", "Gurkenscheibe", "Nudelsuppe",
                    "Schokoriegel", "Apfelsaft", "Sprudelwasser", "Kakao",
                    "Grillkohle", "Butterbrot", "Käsereibe", "Marmeladenglas",
                    "Eiswürfel", "Backblech", "Zuckerwatte", "Fischstäbchen"
                ]
            }
        },
        {
            id: "natur",
            titel: "Natur und Tiere",
            nachWortart: {
                nomen: [
                    "Regenwurm", "Eichhörnchen", "Gewitter", "Schneeflocke",
                    "Sonnenblume", "Ameisenhaufen", "Wasserfall", "Nebel",
                    "Igel", "Fledermaus", "Seerose", "Tannenzapfen",
                    "Sandstrand", "Vogelnest", "Bergsee", "Waldweg",
                    "Marienkäfer", "Regenbogen", "Maulwurf", "Bachlauf",
                    "Herbstlaub", "Spinnennetz", "Wüstensand", "Möwe",
                    "Schilfrohr", "Lawine", "Vollmond", "Grashalm"
                ]
            }
        },
        {
            id: "technik",
            titel: "Technik und Arbeit",
            nachWortart: {
                nomen: [
                    "Bildschirm", "Tastatur", "Drucker", "Netzkabel",
                    "Aktenordner", "Kaffeeautomat", "Besprechung", "Locher",
                    "Serverraum", "Ladegerät", "Kopfhörer", "Taschenrechner",
                    "Bohrmaschine", "Zollstock", "Schraubenzieher", "Leiter",
                    "Werkzeugkasten", "Sicherung", "Steckdose", "Klebeband",
                    "Aktenvernichter", "Whiteboard", "Notizzettel", "Bürostuhl",
                    "Kabelbinder", "Handscanner", "Gabelstapler", "Zeiterfassung"
                ]
            }
        },
        {
            id: "freizeit",
            titel: "Sport und Freizeit",
            nachWortart: {
                nomen: [
                    "Fahrradkette", "Schwimmbad", "Trampolin", "Angelrute",
                    "Skistock", "Fußballtor", "Kartenspiel", "Grillabend",
                    "Zeltplatz", "Wanderschuh", "Achterbahn", "Kinosaal",
                    "Sprungbrett", "Bowlingkugel", "Federball", "Schaukel",
                    "Rucksack", "Taschenlampe", "Lagerfeuer", "Schlittschuh",
                    "Kletterwand", "Springseil", "Dartscheibe", "Segelboot",
                    "Picknickdecke", "Schneemann", "Drachen", "Turnhalle"
                ]
            }
        },

        /*
         * Querbeet (seit v3.7) — hier stehen die Wörter, die zu keinem der
         * fünf Themen gehören.
         *
         * Es sind genau die Wörter der drei alten Gruppen „Nur Nomen", „Nur
         * Verben" und „Nur Adjektive". Sie sind nicht verloren gegangen: Aus
         * den drei Gruppen wurde EIN Thema mit drei Wortarten — das war der
         * ganze Sinn des Umbaus.
         */
        {
            id: "gemischt",
            titel: "Querbeet",
            nachWortart: {
                /* „Leiter" fehlt hier mit Absicht: Das Wort steht schon unter
                   „Technik und Arbeit". Ein Wort in zwei Themen käme bei der
                   Auswahl „Alle Themen" doppelt vor und damit doppelt so oft —
                   dieselbe Überlegung wie beim Ergänzen (imposter-runde.js).
                   In der versteckten Gruppe „Nur Nomen" steht es weiter, damit
                   Räume von vor v3.7 unverändert bleiben. */
                nomen: [
                    "Brücke", "Fenster", "Teppich", "Kerze", "Koffer", "Trichter",
                    "Schere", "Uhr", "Zaun", "Ballon", "Besen", "Eimer",
                    "Flasche", "Gabel", "Hammer", "Kamm", "Laterne", "Messer",
                    "Nadel", "Ofen", "Pinsel", "Rad", "Seil", "Tasche",
                    "Vase", "Waage", "Ziegel", "Anker"
                ],
                verb: [
                    "schlafen", "klettern", "flüstern", "stolpern", "gähnen",
                    "winken", "schwimmen", "lachen", "schieben", "graben",
                    "pfeifen", "hüpfen", "rühren", "schleichen", "werfen",
                    "bügeln", "streicheln", "niesen", "klopfen", "rutschen",
                    "sammeln", "träumen", "verstecken", "wiegen",
                    "zittern", "schnarchen", "putzen", "warten"
                ],
                adjektiv: [
                    "durstig", "eckig", "flauschig", "glitschig", "hektisch",
                    "klebrig", "leise", "müde", "neugierig", "peinlich",
                    "rostig", "salzig", "schüchtern", "spitz", "staubig",
                    "stolz", "trocken", "verschwitzt", "wackelig", "winzig",
                    "zerknittert", "gemütlich", "hohl", "kratzig",
                    "matschig", "prall", "sauer", "zerbrechlich"
                ]
            }
        },

        /*
         * DIE DREI ALTEN WORTART-GRUPPEN — nicht mehr zur Auswahl, aber
         * weiterhin gültig.
         *
         * Ein Raum, der vor v3.7 mit „Nur Verben" angelegt wurde, trägt die
         * Kennung `verben` im Stand. Würden diese Einträge gelöscht, verlöre er
         * sein Thema mitten im Spiel. Dieselbe Regel wie bei den versteckten
         * Spielarten des Schachs: **löschen nie, verstecken ja.**
         *
         * Ihre Wörter stehen inhaltsgleich auch unter „Querbeet" — hier bleiben
         * sie stehen, damit die Ziehung einer laufenden Runde Zeichen für
         * Zeichen dieselbe bleibt.
         */
        {
            id: "nomen",
            titel: "Nur Nomen",
            versteckt: true,
            nachWortart: {
                nomen: [
                    "Brücke", "Fenster", "Teppich", "Kerze", "Koffer", "Leiter",
                    "Schere", "Uhr", "Zaun", "Ballon", "Besen", "Eimer",
                    "Flasche", "Gabel", "Hammer", "Kamm", "Laterne", "Messer",
                    "Nadel", "Ofen", "Pinsel", "Rad", "Seil", "Tasche",
                    "Vase", "Waage", "Ziegel", "Anker"
                ]
            }
        },
        {
            id: "verben",
            titel: "Nur Verben",
            versteckt: true,
            nachWortart: {
                verb: [
                    "schlafen", "klettern", "flüstern", "stolpern", "gähnen",
                    "winken", "schwimmen", "lachen", "schieben", "graben",
                    "pfeifen", "hüpfen", "rühren", "schleichen", "werfen",
                    "bügeln", "streicheln", "niesen", "klopfen", "rutschen",
                    "sammeln", "träumen", "verstecken", "wiegen",
                    "zittern", "schnarchen", "putzen", "warten"
                ]
            }
        },
        {
            id: "adjektive",
            titel: "Nur Adjektive",
            versteckt: true,
            nachWortart: {
                adjektiv: [
                    "durstig", "eckig", "flauschig", "glitschig", "hektisch",
                    "klebrig", "leise", "müde", "neugierig", "peinlich",
                    "rostig", "salzig", "schüchtern", "spitz", "staubig",
                    "stolz", "trocken", "verschwitzt", "wackelig", "winzig",
                    "zerknittert", "gemütlich", "hohl", "kratzig",
                    "matschig", "prall", "sauer", "zerbrechlich"
                ]
            }
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

    /* Die Themen, die beim Anlegen eines Raums zur Auswahl stehen. */
    zurAuswahl() {
        return IMPOSTER_WOERTER.gruppen.filter((eintrag) => !eintrag.versteckt);
    },

    /* Gibt es diese Wortart? „alle" gilt nicht als eine. */
    gibtEsWortart(id) {
        return IMPOSTER_WOERTER.WORTARTEN.some((eintrag) => eintrag.id === id);
    },

    wortartTitel(id) {
        const eintrag = IMPOSTER_WOERTER.WORTARTEN.find((wortart) => wortart.id === id);
        return eintrag ? eintrag.titel : "";
    },

    /*
     * Die Wörter einer Gruppe, wahlweise auf eine Wortart eingeschränkt.
     *
     * `gruppeId` darf `ALLE` sein — dann kommen die Wörter aller Themen, die zur
     * Auswahl stehen (versteckte bleiben aussen vor, sonst stünde jedes Wort aus
     * „Querbeet" zweimal darin).
     *
     * DIE REIHENFOLGE IST FEST: erst die Wortarten in der Reihenfolge von
     * WORTARTEN, bei mehreren Themen diese in der Reihenfolge der Tabelle. Ohne
     * eine feste Reihenfolge zöge jede Runde ein anderes Wort, sobald irgendwo
     * etwas ergänzt wird.
     */
    woerter(gruppeId, wortart) {
        const arten = IMPOSTER_WOERTER.gibtEsWortart(wortart)
            ? [wortart]
            : IMPOSTER_WOERTER.WORTARTEN.map((eintrag) => eintrag.id);

        const gruppen = (gruppeId === IMPOSTER_WOERTER.ALLE)
            ? IMPOSTER_WOERTER.zurAuswahl()
            : [IMPOSTER_WOERTER.gruppe(gruppeId)];

        const liste = [];

        for (const gruppe of gruppen) {
            for (const art of arten) {
                for (const wort of (gruppe.nachWortart[art] || [])) {
                    liste.push(wort);
                }
            }
        }

        return liste;
    },

    /*
     * Welche Wortart hat dieses Wort im festen Katalog? Leer, wenn es nicht
     * darin steht (dann entscheidet die Bibliothek, siehe imposter-runde.js).
     */
    wortartVon(wort) {
        const gesucht = String(wort || "").toLowerCase();

        for (const gruppe of IMPOSTER_WOERTER.gruppen) {
            for (const art of Object.keys(gruppe.nachWortart)) {
                if (gruppe.nachWortart[art].some(
                    (eintrag) => eintrag.toLowerCase() === gesucht)) {
                    return art;
                }
            }
        }

        return "";
    },

    /* Wie viele Wörter gibt es insgesamt? Nur für die Anzeige — versteckte
       Gruppen zählen nicht mit, ihre Wörter stehen unter „Querbeet". */
    anzahl() {
        return IMPOSTER_WOERTER.zurAuswahl().reduce(
            (summe, gruppe) => summe + IMPOSTER_WOERTER.woerter(gruppe.id).length, 0);
    }
};

/* Damit die Regressionstests die Datei außerhalb des Browsers laden können. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = IMPOSTER_WOERTER;
}
