/*
 * imposter-tafel.js — die Sammlung aller Imposter-Räume.
 *
 * Bis v3.1 lag unter dem Imposter-Pfad genau EINE Runde, und jeder stellte
 * Thema und Anzahl neu ein. Seit v3.2 legt EINE Person einen Raum mit seinen
 * Regeln an, die anderen treten bei — dasselbe Muster wie beim Schach
 * (schach-tafel.js), aus denselben Gründen:
 *
 *   - Ein Objekt statt einer Liste, weil Firebase Listen mit Lücken
 *     unzuverlässig speichert.
 *   - Beim Schreiben wird nur der EIGENE Raum eingesetzt, nie die ganze
 *     Sammlung überschrieben — sonst löscht ein Gerät mit veraltetem Stand die
 *     Räume weg, die inzwischen woanders entstanden sind.
 *
 * UMSTIEG VON EINER EINZELNEN RUNDE
 * Ein Stand aus der Zeit davor hat `spieler` und `phase` an der Wurzel, aber
 * kein `raeume`. Er wird zum Raum mit der Kennung "start" — eine angefangene
 * Runde läuft damit ohne Bruch weiter.
 *
 * DIE WORTBIBLIOTHEK LIEGT AUF DER TAFEL, NICHT IM RAUM
 * Ergänzte Wörter gelten für alle Räume; sie stehen deshalb EINMAL an der
 * Wurzel. Beim Normalisieren bekommt jeder Raum eine Abschrift, damit
 * IMPOSTER_RUNDE weiterhin allein aus der Runde rechnen kann (das Wort, die
 * Ziehung, die Tests). Geschrieben wird immer nur die Wurzel — sonst gäbe es
 * zwei Wahrheiten darüber, welche Wörter es gibt.
 */

const IMPOSTER_TAFEL = {

    DATEN_VERSION: 2,

    /* Kennung des Raums, zu dem ein alter Einzel-Stand wird. */
    ERSTE_ID: "start",

    leereTafel(zeitpunkt) {
        return {
            datenVersion: IMPOSTER_TAFEL.DATEN_VERSION,
            geaendertAm: (zeitpunkt === undefined) ? 0 : zeitpunkt,

            /* Die gemeinsame Wortbibliothek, je Gruppe eine Liste. */
            eigeneWoerter: {},

            raeume: {}
        };
    },

    normalisieren(roh) {
        const tafel = IMPOSTER_TAFEL.leereTafel();

        if (!roh || typeof roh !== "object") {
            return tafel;
        }

        if (typeof roh.geaendertAm === "number" && isFinite(roh.geaendertAm)) {
            tafel.geaendertAm = roh.geaendertAm;
        }

        /* Die Prüfung der Wörter steht in IMPOSTER_RUNDE — sie hier ein zweites
           Mal zu schreiben hiesse, sie zweimal pflegen zu müssen. */
        tafel.eigeneWoerter = IMPOSTER_RUNDE.normalisieren(
            { eigeneWoerter: roh.eigeneWoerter }).eigeneWoerter;

        /* Der Umstieg: ein Stand aus der Zeit der einzelnen Runde. Ihre
           ergänzten Wörter wandern dabei hoch auf die Tafel. */
        if (!roh.raeume && IMPOSTER_TAFEL._istEinzelneRunde(roh)) {
            const einzelne = IMPOSTER_RUNDE.normalisieren(roh);
            einzelne.id = IMPOSTER_TAFEL.ERSTE_ID;
            einzelne.titel = einzelne.titel || "Erster Raum";

            if (Object.keys(tafel.eigeneWoerter).length === 0) {
                tafel.eigeneWoerter = einzelne.eigeneWoerter;
            }

            tafel.raeume[IMPOSTER_TAFEL.ERSTE_ID] = einzelne;
            IMPOSTER_TAFEL._bibliothekVerteilen(tafel);
            return tafel;
        }

        if (roh.raeume && typeof roh.raeume === "object") {
            for (const id of Object.keys(roh.raeume)) {
                const raum = IMPOSTER_RUNDE.normalisieren(roh.raeume[id]);
                raum.id = id;
                if (!raum.titel) {
                    raum.titel = "Raum";
                }
                tafel.raeume[id] = raum;
            }
        }

        IMPOSTER_TAFEL._bibliothekVerteilen(tafel);
        return tafel;
    },

    /*
     * Setzt die Bibliothek der Tafel in jeden Raum — bedingungslos, auch wenn
     * sie leer ist. Nur so wirkt ein entferntes Wort wirklich überall; würde
     * hier ein „nur wenn nicht leer" stehen, käme es aus einem alten Raum
     * wieder zurück.
     */
    _bibliothekVerteilen(tafel) {
        for (const id of Object.keys(tafel.raeume)) {
            /* Eine eigene Abschrift je Raum: Dieselbe Liste an mehreren Stellen
               liegen zu haben, führt früher oder später dazu, dass eine
               Änderung an einer Stelle unbemerkt überall wirkt. */
            const abschrift = {};
            for (const gruppe of Object.keys(tafel.eigeneWoerter)) {
                abschrift[gruppe] = tafel.eigeneWoerter[gruppe].slice();
            }
            tafel.raeume[id].eigeneWoerter = abschrift;
        }
    },

    /*
     * Sieht der Stand aus wie eine einzelne Runde von früher?
     * Geprüft wird auf den Inhalt, nicht auf `datenVersion` — die Zahl könnte
     * auch in einer leeren Ablage stehen.
     */
    _istEinzelneRunde(roh) {
        return !!(roh.spieler || roh.salz
            || ["warten", "laeuft", "aufloesung"].indexOf(roh.phase) !== -1);
    },

    kopieren(tafel) {
        return IMPOSTER_TAFEL.normalisieren(tafel);
    },

    raum(tafel, id) {
        return IMPOSTER_TAFEL.normalisieren(tafel).raeume[id] || null;
    },

    anzahl(tafel) {
        return Object.keys(IMPOSTER_TAFEL.normalisieren(tafel).raeume).length;
    },

    /*
     * Alle Räume als Liste: erst die laufenden, dann die wartenden, zuletzt
     * die aufgelösten — innerhalb jeder Gruppe der zuletzt geänderte zuerst.
     */
    liste(tafel) {
        const stand = IMPOSTER_TAFEL.normalisieren(tafel);

        const rang = (raum) => {
            if (raum.phase === "aufloesung") {
                return 2;
            }
            return (raum.phase === "laeuft") ? 0 : 1;
        };

        return Object.keys(stand.raeume)
            .map((id) => stand.raeume[id])
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

    /* Setzt EINEN Raum in die Tafel. Alles andere bleibt unangetastet. */
    raumEinsetzen(tafel, raum, zeitpunkt) {
        const neu = IMPOSTER_TAFEL.kopieren(tafel);

        if (!raum || !raum.id) {
            return neu;
        }

        neu.raeume[raum.id] = IMPOSTER_RUNDE.normalisieren(raum);
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    raumEntfernen(tafel, id, zeitpunkt) {
        const neu = IMPOSTER_TAFEL.kopieren(tafel);
        delete neu.raeume[id];
        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        return neu;
    },

    /*
     * Legt einen Raum an und liefert { tafel, raum }.
     * Die Kennung enthält den Zeitpunkt, damit zwei Geräte im selben Moment
     * nicht dieselbe erwischen; bei einer Kollision wird hochgezählt.
     */
    raumAnlegen(tafel, titel, einstellungen, zeitpunkt) {
        const neu = IMPOSTER_TAFEL.kopieren(tafel);
        const wann = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;

        let id = "r-" + wann.toString(36);
        let nummer = 1;
        while (neu.raeume[id]) {
            nummer++;
            id = "r-" + wann.toString(36) + "-" + nummer;
        }

        const raum = IMPOSTER_RUNDE.leereRunde(wann);
        raum.id = id;
        raum.titel = String(titel || "").trim().substring(0, 40) || "Neuer Raum";

        if (einstellungen && typeof einstellungen === "object") {
            if (IMPOSTER_WOERTER.gibtEs(einstellungen.gruppe)) {
                raum.gruppe = einstellungen.gruppe;
            }
            if (Number.isInteger(einstellungen.impostermenge)
                && einstellungen.impostermenge >= 1
                && einstellungen.impostermenge <= IMPOSTER_RUNDE.IMPOSTER_HOECHSTENS) {
                raum.impostermenge = einstellungen.impostermenge;
            }
        }

        neu.raeume[id] = raum;
        neu.geaendertAm = wann;

        return { tafel: neu, raum: raum };
    },

    /* ---------------------------------------------------------------- *
     * Die Wortbibliothek
     *
     * Beide Funktionen reichen an IMPOSTER_RUNDE durch und heben das Ergebnis
     * wieder auf die Tafel — die Regeln (was ist ein gültiges Wort, was ist
     * doppelt) stehen dort und nur dort.
     * ---------------------------------------------------------------- */

    woerterErgaenzen(tafel, gruppeId, text, zeitpunkt) {
        const neu = IMPOSTER_TAFEL.kopieren(tafel);
        const ergebnis = IMPOSTER_RUNDE.woerterErgaenzen(
            { eigeneWoerter: neu.eigeneWoerter }, gruppeId, text, zeitpunkt);

        neu.eigeneWoerter = ergebnis.runde.eigeneWoerter;
        if (ergebnis.hinzugefuegt > 0) {
            neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        }
        IMPOSTER_TAFEL._bibliothekVerteilen(neu);

        return {
            tafel: neu,
            hinzugefuegt: ergebnis.hinzugefuegt,
            uebersprungen: ergebnis.uebersprungen
        };
    },

    wortEntfernen(tafel, gruppeId, wort, zeitpunkt) {
        const neu = IMPOSTER_TAFEL.kopieren(tafel);

        neu.eigeneWoerter = IMPOSTER_RUNDE.wortEntfernen(
            { eigeneWoerter: neu.eigeneWoerter }, gruppeId, wort, zeitpunkt).eigeneWoerter;

        neu.geaendertAm = (zeitpunkt === undefined) ? Date.now() : zeitpunkt;
        IMPOSTER_TAFEL._bibliothekVerteilen(neu);
        return neu;
    },

    /* ---------------------------------------------------------------- *
     * Vergleich und Zusammenführen
     * ---------------------------------------------------------------- */

    inhaltGleich(a, b) {
        const einsA = IMPOSTER_TAFEL.normalisieren(a);
        const einsB = IMPOSTER_TAFEL.normalisieren(b);

        if (IMPOSTER_TAFEL._bibliothekText(einsA)
            !== IMPOSTER_TAFEL._bibliothekText(einsB)) {
            return false;
        }

        const idsA = Object.keys(einsA.raeume).sort();
        const idsB = Object.keys(einsB.raeume).sort();

        if (idsA.join(",") !== idsB.join(",")) {
            return false;
        }

        for (const id of idsA) {
            if (!IMPOSTER_RUNDE.inhaltGleich(einsA.raeume[id], einsB.raeume[id])) {
                return false;
            }
            if (einsA.raeume[id].titel !== einsB.raeume[id].titel) {
                return false;
            }
        }

        return true;
    },

    _bibliothekText(tafel) {
        return Object.keys(tafel.eigeneWoerter).sort()
            .map((gruppe) => gruppe + "=" + tafel.eigeneWoerter[gruppe].join(","))
            .join("|");
    },

    /*
     * Führt den eigenen Stand mit dem vom Server zusammen: Je Raum gilt die
     * Regel aus IMPOSTER_RUNDE (jeder ist Herr über seinen eigenen Eintrag),
     * Räume, die es nur auf einer Seite gibt, bleiben erhalten.
     *
     * Die Bibliothek wird VEREINIGT, nicht ersetzt: Zwei Geräte, die
     * gleichzeitig Wörter ergänzen, sollen beide Ergänzungen behalten. Das
     * Entfernen eines Wortes läuft deshalb nicht über diesen Weg, sondern über
     * einen eigenen Schreibvorgang mit vorherigem Laden (siehe imposter.js) —
     * sonst käme das entfernte Wort hier sofort wieder zurück.
     */
    zusammenfuehren(fremd, eigen, eigeneId) {
        const ziel = IMPOSTER_TAFEL.normalisieren(fremd);
        const meine = IMPOSTER_TAFEL.normalisieren(eigen);

        for (const gruppe of Object.keys(meine.eigeneWoerter)) {
            const vorhanden = ziel.eigeneWoerter[gruppe] || [];

            ziel.eigeneWoerter[gruppe] = vorhanden.concat(
                meine.eigeneWoerter[gruppe].filter(
                    (wort) => vorhanden.indexOf(wort) === -1));
        }

        for (const id of Object.keys(meine.raeume)) {
            ziel.raeume[id] = ziel.raeume[id]
                ? IMPOSTER_RUNDE.zusammenfuehren(ziel.raeume[id], meine.raeume[id], eigeneId)
                : meine.raeume[id];

            ziel.raeume[id].id = id;
            ziel.raeume[id].titel = meine.raeume[id].titel || ziel.raeume[id].titel;
        }

        IMPOSTER_TAFEL._bibliothekVerteilen(ziel);

        ziel.geaendertAm = Math.max(ziel.geaendertAm, meine.geaendertAm);
        return ziel;
    }
};

/* Für die Tests ausserhalb des Browsers. IMPOSTER_WOERTER und IMPOSTER_RUNDE
   müssen dort vorher als globale Größen bereitstehen. */
if (typeof module !== "undefined" && module.exports) {
    module.exports = IMPOSTER_TAFEL;
}
