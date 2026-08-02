/*
 * rangliste.js — der Tab "Rangliste": ein Punktestand über ALLE Spiele.
 *
 * Bisher hatte jedes Spiel seinen eigenen Stand. Hier kommt beides zusammen:
 * die Punkte aus dem Würfel Quizz und die Punkte aus den Schachpartien,
 * addiert zu einer Gesamtwertung mit Platzierung.
 *
 * AUSNAHME VON DER HAUSREGEL, BEWUSST
 * Sonst gilt: kein Zustand zwischen den Spielen. Dieser Tab liest beide Stände
 * — aber NUR lesend und nur zur Anzeige. Er schreibt nichts, hat keinen eigenen
 * Pfad in der Datenbank und keine eigenen Daten. Damit bleibt die Trennung der
 * Spiele erhalten: Nähme man diesen Tab weg, änderte sich an keinem Spiel etwas.
 *
 * WO DIE PUNKTE HERKOMMEN
 *   Würfel Quizz  MODELL.ergebnis() — die Regeln stehen dort und nur dort.
 *   Team Schach   die Konstanten unten, gerechnet in schachPunkte().
 * Wie im Würfel-Quizz gilt: Zahlen, Rechnung und der angezeigte Erklärungstext
 * stehen in derselben Datei, damit die angezeigte Regel nicht von der
 * gerechneten abweichen kann.
 */

const RANGLISTE = {

    id: "rangliste",
    titel: "Rangliste",

    /* Punkte im Schach, je beendeter Partie. */
    PUNKTE_SIEG: 30,
    PUNKTE_REMIS: 10,
    PUNKTE_TEILNAHME: 2,

    wurzelEl: null,

    /* ---------------------------------------------------------------- *
     * Rechnen (ohne Bildschirm — deshalb testbar)
     * ---------------------------------------------------------------- */

    /*
     * Punkte aus allen beendeten Schachpartien, je Spieler-Kennung.
     * Liefert { "<id>": { punkte, siege, remis, partien } }.
     *
     * Gewertet wird nur, was vorbei ist: Eine laufende Partie hat noch kein
     * Ergebnis, und ein Zwischenstand wäre reine Vermutung.
     */
    schachPunkte(tafel) {
        const ergebnis = {};

        const eintragen = (id) => {
            if (!ergebnis[id]) {
                ergebnis[id] = { punkte: 0, siege: 0, remis: 0, partien: 0 };
            }
            return ergebnis[id];
        };

        for (const partie of SCHACH_TAFEL.liste(tafel)) {
            if (!partie.ergebnis) {
                continue;
            }

            for (const farbe of ["weiss", "schwarz"]) {
                for (const id of partie.teams[farbe]) {
                    const eintrag = eintragen(id);
                    eintrag.partien++;
                    eintrag.punkte += RANGLISTE.PUNKTE_TEILNAHME;

                    if (partie.ergebnis === farbe) {
                        eintrag.siege++;
                        eintrag.punkte += RANGLISTE.PUNKTE_SIEG;
                    } else if (partie.ergebnis === "remis") {
                        eintrag.remis++;
                        eintrag.punkte += RANGLISTE.PUNKTE_REMIS;
                    }
                }
            }
        }

        return ergebnis;
    },

    /*
     * Die Gesamtwertung, absteigend sortiert. Liefert eine Liste aus
     * { id, name, gesamt, quizz, schach, siege, remis, partien }.
     *
     * Grundlage der Namen ist der Würfel-Quizz: Dort steht, wer mitspielt. Wer
     * dort entfernt wurde, taucht auch hier nicht mehr auf — sonst stünden
     * Kennungen ohne Namen in der Liste.
     */
    gesamt(quizzDaten, schachTafel) {
        const quizz = MODELL.ergebnis(quizzDaten);
        const schach = RANGLISTE.schachPunkte(schachTafel);

        const liste = quizz.map((eintrag) => {
            const dazu = schach[eintrag.id] || { punkte: 0, siege: 0, remis: 0, partien: 0 };

            return {
                id: eintrag.id,
                name: eintrag.name,
                quizz: eintrag.punkte,
                schach: dazu.punkte,
                gesamt: eintrag.punkte + dazu.punkte,
                siege: dazu.siege,
                remis: dazu.remis,
                partien: dazu.partien
            };
        });

        liste.sort((a, b) => {
            if (b.gesamt !== a.gesamt) {
                return b.gesamt - a.gesamt;
            }
            return a.name.localeCompare(b.name, "de");
        });

        return liste;
    },

    /* Die Regeln im Wortlaut, aus denselben Konstanten wie die Rechnung. */
    erklaerung() {
        return "Die Rangliste zählt beide Spiele zusammen.\n\n"
            + "WÜRFEL QUIZZ\n"
            + "Es zählen die Punkte aus dem Punktestand des Spiels. Wie sie "
            + "entstehen, steht dort hinter dem i-Knopf.\n\n"
            + "TEAM SCHACH\n"
            + "Gewertet wird jede beendete Partie, für jeden, der zu diesem "
            + "Zeitpunkt in einem der beiden Teams stand:\n"
            + "Sieg: " + RANGLISTE.PUNKTE_SIEG + " Punkte.\n"
            + "Unentschieden: " + RANGLISTE.PUNKTE_REMIS + " Punkte.\n"
            + "Dabeigewesen: " + RANGLISTE.PUNKTE_TEILNAHME + " Punkte, "
            + "zusätzlich zum Ergebnis.\n\n"
            + "Laufende Partien zählen nicht mit — erst das Ergebnis bringt "
            + "Punkte. Alle aus dem Siegerteam bekommen dieselben Punkte; wer "
            + "wie viele Züge gemacht hat, spielt keine Rolle. Das ist gewollt, "
            + "denn im Team gibt es keine Reihenfolge.\n\n"
            + "Bei Gleichstand entscheidet der Name, nicht der Zufall.";
    },

    /* ---------------------------------------------------------------- *
     * Bildschirm
     * ---------------------------------------------------------------- */

    aufbauen(behaelter) {
        RANGLISTE.wurzelEl = document.createElement("div");
        RANGLISTE.wurzelEl.className = "rangliste";
        behaelter.appendChild(RANGLISTE.wurzelEl);
    },

    /* Wird bei jedem Tab-Wechsel und nach jeder Datenänderung gerufen. */
    beimOeffnen() {
        RANGLISTE.zeichnen();
    },

    zeichnen() {
        const wurzel = RANGLISTE.wurzelEl;
        if (!wurzel) {
            return;
        }

        wurzel.innerHTML = "";

        const quizzDaten = (WUERFEL_QUIZZ.abgleich && WUERFEL_QUIZZ.abgleich.daten)
            ? WUERFEL_QUIZZ.abgleich.daten
            : MODELL.leereDaten();
        const schachTafel = (TEAM_SCHACH.abgleich && TEAM_SCHACH.abgleich.daten)
            ? TEAM_SCHACH.abgleich.daten
            : SCHACH_TAFEL.leereTafel();

        const liste = RANGLISTE.gesamt(quizzDaten, schachTafel);

        const bereich = RANGLISTE._element("section", "karte karte-ergebnis");

        const kopf = RANGLISTE._element("div", "karte-kopf");
        kopf.appendChild(RANGLISTE._element("h3", "", "Gesamtwertung"));
        kopf.appendChild(RANGLISTE._infoKnopfBauen());
        bereich.appendChild(kopf);

        if (liste.length === 0) {
            bereich.appendChild(RANGLISTE._element("p", "erklaerung",
                "Noch niemand dabei. Melde dich im Tab Würfel Quizz an."));
            wurzel.appendChild(bereich);
            return;
        }

        const tabelle = document.createElement("table");
        tabelle.className = "ergebnis-tabelle";

        const tabellenkopf = document.createElement("thead");
        const kopfzeile = document.createElement("tr");
        for (const titel of ["Platz", "Name", "Punkte"]) {
            const zelle = document.createElement("th");
            zelle.textContent = titel;
            kopfzeile.appendChild(zelle);
        }
        tabellenkopf.appendChild(kopfzeile);
        tabelle.appendChild(tabellenkopf);

        const koerper = document.createElement("tbody");
        const ich = ICH.person();
        let platz = 0;
        let letztePunkte = null;
        let gezaehlt = 0;

        for (const eintrag of liste) {
            gezaehlt++;
            if (eintrag.gesamt !== letztePunkte) {
                platz = gezaehlt;
                letztePunkte = eintrag.gesamt;
            }

            const zeile = document.createElement("tr");
            if (ich && eintrag.id === ich.id) {
                zeile.className = "zeile-ich";
            }

            const platzZelle = document.createElement("td");
            platzZelle.textContent = platz + ".";
            zeile.appendChild(platzZelle);

            const nameZelle = document.createElement("td");
            nameZelle.appendChild(RANGLISTE._element("span", "", eintrag.name));
            nameZelle.appendChild(RANGLISTE._element(
                "span", "ergebnis-detail",
                "Würfel " + eintrag.quizz + ", Schach " + eintrag.schach
                    + (eintrag.partien > 0
                        ? " (" + eintrag.siege + " Siege aus " + eintrag.partien + ")"
                        : "")
            ));
            zeile.appendChild(nameZelle);

            const punkteZelle = document.createElement("td");
            punkteZelle.className = "ergebnis-punkte";
            punkteZelle.appendChild(RANGLISTE._element("span", "punkte-zahl",
                String(eintrag.gesamt)));
            zeile.appendChild(punkteZelle);

            koerper.appendChild(zeile);
        }
        tabelle.appendChild(koerper);

        bereich.appendChild(tabelle);
        bereich.appendChild(RANGLISTE._element("p", "erklaerung",
            "Gezählt wird beides zusammen: die Punkte aus dem Würfel Quizz und "
            + "die Punkte aus beendeten Schachpartien. Die Rechnung steht hinter dem i."));

        wurzel.appendChild(bereich);
    },

    _infoKnopfBauen() {
        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "info-knopf";
        knopf.textContent = "i";
        knopf.setAttribute("aria-label", "Wie entsteht die Gesamtwertung?");
        knopf.title = "Wie entsteht die Gesamtwertung?";
        knopf.addEventListener("click", () => {
            DIALOG.hinweis("Gesamtwertung", RANGLISTE.erklaerung());
        });
        return knopf;
    },

    _element(tag, klasse, text) {
        const element = document.createElement(tag);
        if (klasse) {
            element.className = klasse;
        }
        if (text !== undefined) {
            element.textContent = text;
        }
        return element;
    }
};

/* Für die Tests ausserhalb des Browsers: MODELL und SCHACH_TAFEL müssen dort
   vorher als globale Größen bereitstehen — genau wie im Browser. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = RANGLISTE;
}
