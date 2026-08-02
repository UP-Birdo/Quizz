/*
 * schach-tafel.js — die Sammlung aller Schachpartien.
 *
 * Bis v1.3 lag unter dem Schach-Pfad genau EINE Partie. Seit v1.4 liegen dort
 * beliebig viele nebeneinander; jede einzelne ist unverändert das, was
 * schach-runde.js beschreibt. Diese Datei kennt nur die Sammlung und niemals
 * die Schachregeln.
 *
 * Datenvertrag:
 *
 *     {
 *         "datenVersion": 2,
 *         "geaendertAm": 1750000000000,
 *         "partien": {
 *             "start": { … eine Runde, siehe schach-runde.js … },
 *             "p-l3k9": { … }
 *         }
 *     }
 *
 * UMSTIEG VON EINER EINZELNEN PARTIE (die wichtigste Aufgabe dieser Datei)
 * Ein Stand aus der Zeit davor sieht aus wie eine Runde: Er hat `stand` und
 * `teams` an der Wurzel, aber kein `partien`. Ein solcher Stand wird
 * übernommen und wird zur Partie mit der Kennung "start". Damit läuft eine
 * angefangene Partie ohne Bruch weiter — Brett, Teams, Bereitschaft, Verlauf
 * und Zugzähler bleiben, wie sie waren.
 *
 * WARUM DIE PARTIEN EIN OBJEKT SIND UND KEINE LISTE
 * Firebase speichert Listen mit Lücken unzuverlässig und macht aus einer Liste
 * mit fehlenden Stellen ein Objekt. Bei einem Objekt mit Kennungen als
 * Schlüssel gibt es diese Überraschung nicht, und das Einsetzen einer einzelnen
 * Partie in einen fremden Stand ist eine einzige Zuweisung — genau das, was
 * das gleichzeitige Spielen an mehreren Partien braucht.
 */

const SCHACH_TAFEL = {

    DATEN_VERSION: 2,

    /* Kennung der Partie, zu der ein alter Einzel-Stand wird. */
    ERSTE_ID: "start",

    leereTafel(zeitpunkt) {
        return {
            datenVersion: SCHACH_TAFEL.DATEN_VERSION,
            geaendertAm: (zeitpunkt === undefined) ? 0 : zeitpunkt,
            partien: {}
        };
    },

    normalisieren(roh) {
        const tafel = SCHACH_TAFEL.leereTafel();

        if (!roh || typeof roh !== "object") {
            return tafel;
        }

        if (typeof roh.geaendertAm === "number" && isFinite(roh.geaendertAm)) {
            tafel.geaendertAm = roh.geaendertAm;
        }

        /* Der Umstieg: ein Stand aus der Zeit der einzelnen Partie. */
        if (!roh.partien && SCHACH_TAFEL._istEinzelnePartie(roh)) {
            const einzelne = SCHACH_RUNDE.normalisieren(roh);
            einzelne.id = SCHACH_TAFEL.ERSTE_ID;
            einzelne.titel = einzelne.titel || "Erste Partie";
            tafel.partien[SCHACH_TAFEL.ERSTE_ID] = einzelne;
            return tafel;
        }

        if (roh.partien && typeof roh.partien === "object") {
            for (const id of Object.keys(roh.partien)) {
                const partie = SCHACH_RUNDE.normalisieren(roh.partien[id]);
                partie.id = id;
                if (!partie.titel) {
                    partie.titel = "Partie";
                }
                tafel.partien[id] = partie;
            }
        }

        return tafel;
    },

    /*
     * Sieht der Stand aus wie eine einzelne Partie von früher?
     * Geprüft wird auf die Felder, die es nur dort gibt — `datenVersion` allein
     * genügt nicht, weil die Zahl 1 auch in einer leeren Ablage stehen könnte.
     */
    _istEinzelnePartie(roh) {
        return !!(roh.stand || roh.teams || roh.verlauf
            || typeof roh.zugZaehler === "number");
    },

    kopieren(tafel) {
        return SCHACH_TAFEL.normalisieren(tafel);
    },

    /* Eine einzelne Partie, oder null. */
    partie(tafel, id) {
        const stand = SCHACH_TAFEL.normalisieren(tafel);
        return stand.partien[id] || null;
    },

    /* Wie viele Partien gibt es? */
    anzahl(tafel) {
        return Object.keys(SCHACH_TAFEL.normalisieren(tafel).partien).length;
    },

    /*
     * Alle Partien als Liste, sortiert für die Übersicht:
     * erst die laufenden, dann die noch nicht gestarteten, zuletzt die
     * beendeten — innerhalb jeder Gruppe die zuletzt geänderte zuerst.
     */
    liste(tafel) {
        const stand = SCHACH_TAFEL.normalisieren(tafel);

        const rang = (partie) => {
            if (partie.ergebnis) {
                return 2;
            }
            return partie.laeuft ? 0 : 1;
        };

        return Object.keys(stand.partien)
            .map((id) => stand.partien[id])
            .sort((a, b) => {
                if (rang(a) !== rang(b)) {
                    return rang(a) - rang(b);
                }
                if (b.geaendertAm !== a.geaendertAm) {
                    return b.geaendertAm - a.geaendertAm;
                }
                return a.id < b.id ? -1 : 1;
            });
    },

    /*
     * Setzt EINE Partie in die Tafel. Alles andere bleibt unangetastet.
     *
     * Das ist beim Schach dieselbe Regel wie im Würfel-Quizz bei
     * MODELL.zusammenfuehren: Wer schreibt, ändert nur seinen Teil. Sonst
     * löscht ein Gerät mit einer veralteten Tafel die Partien weg, die
     * inzwischen woanders angelegt oder gezogen wurden.
     */
    partieEinsetzen(tafel, partie, zeitpunkt) {
        const neu = SCHACH_TAFEL.kopieren(tafel);

        if (!partie || !partie.id) {
            return neu;
        }

        neu.partien[partie.id] = SCHACH_RUNDE.normalisieren(partie);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    partieEntfernen(tafel, id, zeitpunkt) {
        const neu = SCHACH_TAFEL.kopieren(tafel);
        delete neu.partien[id];
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Legt eine Partie an und liefert { tafel, partie }.
     *
     * Die Kennung enthält den Zeitpunkt, damit zwei Geräte, die im selben
     * Moment eine Partie anlegen, nicht dieselbe erwischen. Ganz ausschliessen
     * lässt sich das ohne Server nicht — deshalb wird bei einer Kollision
     * hochgezählt.
     */
    partieAnlegen(tafel, varianteId, titel, zeitpunkt) {
        const neu = SCHACH_TAFEL.kopieren(tafel);
        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;

        let id = "p-" + wann.toString(36);
        let nummer = 1;
        while (neu.partien[id]) {
            nummer++;
            id = "p-" + wann.toString(36) + "-" + nummer;
        }

        const partie = SCHACH_RUNDE.leereRunde(
            wann,
            varianteId,
            id,
            String(titel || "").trim().substring(0, 40) || "Neue Partie"
        );

        neu.partien[id] = partie;
        neu.geaendertAm = wann;

        return { tafel: neu, partie: partie };
    },

    /* ---------------------------------------------------------------- *
     * Vergleich (steuert das Neuzeichnen)
     * ---------------------------------------------------------------- */

    inhaltGleich(a, b) {
        const einsA = SCHACH_TAFEL.normalisieren(a);
        const einsB = SCHACH_TAFEL.normalisieren(b);

        const idsA = Object.keys(einsA.partien).sort();
        const idsB = Object.keys(einsB.partien).sort();

        if (idsA.join(",") !== idsB.join(",")) {
            return false;
        }

        for (const id of idsA) {
            if (!SCHACH_RUNDE.inhaltGleich(einsA.partien[id], einsB.partien[id])) {
                return false;
            }
        }

        return true;
    }
};

/* Für die Tests ausserhalb des Browsers. SCHACH, SCHACH_VARIANTEN und
   SCHACH_RUNDE müssen dort vorher als globale Größen bereitstehen. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = SCHACH_TAFEL;
}
