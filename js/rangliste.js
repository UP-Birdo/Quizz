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

    /*
     * Punkte im Schach, je beendeter Partie.
     *
     * WIE DIE ZAHLEN ZUEINANDER PASSEN (Stand v3.1)
     * Alle drei Spiele sollen sich lohnen, keines soll die Rangliste allein
     * entscheiden. Als Maßstab dient eine gute Runde:
     *   Würfel Quizz  eine gute Runde bringt rund 30 bis 50 Punkte,
     *   Team Schach   ein Sieg bringt 30 plus Beute, also etwa 35 bis 45,
     *   Imposter      eine gute Runde bringt rund 30 bis 45.
     * Wer eine Zahl ändert, prüft sie gegen diese drei Zeilen.
     */
    PUNKTE_SIEG: 30,
    PUNKTE_REMIS: 10,
    PUNKTE_TEILNAHME: 2,

    /*
     * Teilpunkte für geschlagene Figuren: Auch eine verlorene Partie war Arbeit,
     * wenn man dem Gegner die Dame abgenommen hat.
     *
     * Gerechnet wird auf den Figurenwert (Bauer 1 … Dame 9) mal diesem Faktor,
     * gedeckelt, damit eine einzige Schlachtplatte keinen Sieg überholt. Ein
     * ausgeglichenes Ende bringt so ein paar Punkte, ein klarer Materialvorteil
     * etwa ein Drittel eines Sieges.
     */
    PUNKTE_JE_FIGURENWERT: 0.8,
    PUNKTE_BEUTE_HOECHSTENS: 12,

    wurzelEl: null,

    /* ---------------------------------------------------------------- *
     * Rechnen (ohne Bildschirm — deshalb testbar)
     * ---------------------------------------------------------------- */

    /*
     * Punkte aus allen beendeten Schachpartien, je Spieler-Kennung.
     * Liefert { "<id>": { punkte, siege, remis, partien } }.
     *
     * Gerechnet wird aus der CHRONIK der Tafel, nicht aus den Partien selbst.
     * Das ist der Unterschied seit v2.4: Ein Ergebnis wird beim Beenden einmal
     * festgeschrieben und bleibt dann stehen — auch wenn die Partie später
     * geschlossen oder gelöscht wird. Vorher nahm ein Löschen allen
     * Beteiligten ihre Punkte wieder weg.
     *
     * Gewertet wird weiterhin nur, was vorbei ist: Eine laufende Partie hat
     * noch kein Ergebnis, und ein Zwischenstand wäre reine Vermutung.
     */
    schachPunkte(tafel) {
        const ergebnis = {};

        const eintragen = (id) => {
            if (!ergebnis[id]) {
                ergebnis[id] = { punkte: 0, siege: 0, remis: 0, partien: 0, beute: 0 };
            }
            return ergebnis[id];
        };

        for (const partie of SCHACH_TAFEL.normalisieren(tafel).chronik) {
            for (const farbe of ["weiss", "schwarz"]) {
                /* Teilpunkte für die Beute — gedeckelt, damit sie einen Sieg
                   ergänzen und nicht ersetzen. */
                const beute = Math.min(
                    Math.round((partie.beute[farbe] || 0) * RANGLISTE.PUNKTE_JE_FIGURENWERT),
                    RANGLISTE.PUNKTE_BEUTE_HOECHSTENS);

                for (const id of partie.teams[farbe]) {
                    const eintrag = eintragen(id);
                    eintrag.partien++;
                    eintrag.punkte += RANGLISTE.PUNKTE_TEILNAHME + beute;
                    eintrag.beute += beute;

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
    /*
     * Punkte aus dem Imposter, je Spieler-Kennung.
     *
     * Gewertet wird nur eine aufgelöste Runde — vorher stünden Rollen und Wort
     * noch nicht fest. Anders als beim Schach gibt es hier keine Chronik: Es
     * läuft immer nur EINE Runde, und mit der nächsten sind die alten Punkte
     * weg. Wer das ändern will, braucht dieselbe Lösung wie beim Schach.
     */
    imposterPunkte(runde) {
        const ergebnis = {};
        const stand = IMPOSTER_RUNDE.normalisieren(runde);

        if (stand.phase !== "aufloesung") {
            return ergebnis;
        }

        for (const eintrag of IMPOSTER_RUNDE.ergebnis(stand)) {
            ergebnis[eintrag.id] = { punkte: eintrag.punkte, imposter: eintrag.imposter };
        }

        return ergebnis;
    },

    gesamt(quizzDaten, schachTafel, imposterRunde) {
        const quizz = MODELL.ergebnis(quizzDaten);
        const schach = RANGLISTE.schachPunkte(schachTafel);
        const imposter = RANGLISTE.imposterPunkte(imposterRunde);

        const liste = quizz.map((eintrag) => {
            const dazu = schach[eintrag.id] || { punkte: 0, siege: 0, remis: 0, partien: 0 };
            const drittes = imposter[eintrag.id] || { punkte: 0 };

            return {
                id: eintrag.id,
                name: eintrag.name,
                quizz: eintrag.punkte,
                schach: dazu.punkte,
                imposter: drittes.punkte,
                gesamt: eintrag.punkte + dazu.punkte + drittes.punkte,
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
        return "Die Rangliste zählt alle Spiele zusammen.\n\n"
            + "WÜRFEL QUIZZ\n"
            + "Es zählen die Punkte aus dem Punktestand des Spiels. Wie sie "
            + "entstehen, steht dort hinter dem i-Knopf.\n\n"
            + "TEAM SCHACH\n"
            + "Gewertet wird jede beendete Partie, für jeden, der zu diesem "
            + "Zeitpunkt in einem der beiden Teams stand:\n"
            + "Sieg: " + RANGLISTE.PUNKTE_SIEG + " Punkte.\n"
            + "Unentschieden: " + RANGLISTE.PUNKTE_REMIS + " Punkte.\n"
            + "Dabeigewesen: " + RANGLISTE.PUNKTE_TEILNAHME + " Punkte, "
            + "zusätzlich zum Ergebnis.\n"
            + "Geschlagene Figuren: " + RANGLISTE.PUNKTE_JE_FIGURENWERT
            + " Punkte je Figurenwert (Bauer 1, Springer und Läufer 3, Turm 5, "
            + "Dame 9), höchstens " + RANGLISTE.PUNKTE_BEUTE_HOECHSTENS
            + " Punkte je Partie. Auch eine verlorene Partie war Arbeit, wenn "
            + "man dem Gegner die Dame abgenommen hat.\n\n"
            + "Laufende Partien zählen nicht mit — erst das Ergebnis bringt "
            + "Punkte. Alle aus dem Siegerteam bekommen dieselben Punkte; wer "
            + "wie viele Züge gemacht hat, spielt keine Rolle. Das ist gewollt, "
            + "denn im Team gibt es keine Reihenfolge.\n\n"
            + "IMPOSTER\n"
            + "Gewertet wird die zuletzt aufgelöste Runde. Wie die Punkte dort "
            + "entstehen, steht im Spiel hinter dem i-Knopf. Mit der nächsten "
            + "Runde zählen die neuen Punkte statt der alten — anders als beim "
            + "Schach, wo jedes Ergebnis dauerhaft festgeschrieben wird.\n\n"
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
        const imposterRunde = (IMPOSTER.abgleich && IMPOSTER.abgleich.daten)
            ? IMPOSTER.abgleich.daten
            : IMPOSTER_RUNDE.leereRunde();

        const liste = RANGLISTE.gesamt(quizzDaten, schachTafel, imposterRunde);

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
