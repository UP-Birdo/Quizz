/*
 * app.js — der Startpunkt: verdrahtet Speicher, Abgleich, Tabs und Dialoge.
 *
 * Es gibt zwei Spiele mit je eigenem Stand in der Datenbank:
 *   Würfel Quizz  ->  KONFIG.speicher.pfad
 *   Team Schach   ->  KONFIG.speicher.schachPfad (seit v1.4 mehrere Partien)
 *
 * Beide teilen sich die Speicher- und Abgleich-Schicht, wissen aber nichts
 * voneinander. Gemeinsam ist ihnen nur, wer an diesem Gerät sitzt (ich.js) —
 * angemeldet wird im Würfel Quizz, weil dort die Namen und PINs stehen.
 *
 * Dazu kommt der Tab Rangliste. Er hat KEINEN eigenen Stand: Er liest die
 * beiden vorhandenen nur und zeigt sie zusammen. Deshalb wird er nach jeder
 * Änderung an einem der beiden Spiele neu gezeichnet.
 *
 * Reihenfolge beim Start:
 *   1. Dialoge bereitstellen,
 *   2. beide Speicher-Rückwände wählen,
 *   3. beide Abgleiche erzeugen und den Tabs bekannt machen,
 *   4. Tab-Leiste zeichnen (baut die Gerüste auf),
 *   5. Daten laden,
 *   6. anmelden — erst jetzt ist bekannt, wer schon mitspielt.
 */

const APP = {

    statusEl: null,
    statusTextEl: null,

    starten() {
        DIALOG.aufbauen(document.getElementById("dialog"));

        document.getElementById("app-version").textContent = "v" + KONFIG.APP_VERSION;

        APP.statusEl = document.getElementById("status");
        APP.statusTextEl = document.getElementById("status-text");

        /* ---- Würfel Quizz ---- */
        const quizzSpeicher = speicherErzeugen(
            KONFIG,
            KONFIG.speicher.pfad,
            KONFIG.speicher.lokalerSchluessel,
            (roh) => MODELL.normalisieren(roh)
        );

        if (quizzSpeicher.hinweis) {
            APP.hinweisZeigen(quizzSpeicher.hinweis);
        }

        const quizzAbgleich = new Abgleich(quizzSpeicher.speicher, KONFIG.speicher, {
            beiDaten: (daten) => {
                WUERFEL_QUIZZ.zeichnen(daten);
                RANGLISTE.zeichnen();
            },
            beiStatus: (status, text) => APP.statusZeigen(status, text),
            leereDaten: () => MODELL.leereDaten(),
            inhaltGleich: (a, b) => MODELL.inhaltGleich(a, b),
            zusammenfuehren: (fremd, eigen, id) => MODELL.zusammenfuehren(fremd, eigen, id)
        });

        WUERFEL_QUIZZ.verbinden(quizzAbgleich);

        /* ---- Team Schach ---- */
        const schachSpeicher = speicherErzeugen(
            KONFIG,
            KONFIG.speicher.schachPfad,
            KONFIG.speicher.lokalerSchluesselSchach,
            (roh) => SCHACH_TAFEL.normalisieren(roh)
        );

        /* Ohne `zusammenfuehren`: Beim Schach ändert ein Zug den gemeinsamen
           Stand, es gibt keinen "eigenen Eintrag" je Person. Geschrieben wird
           deshalb nicht über den Abgleich, sondern über
           TEAM_SCHACH._sendenMitPruefung — dort wird der Stand vom Server
           geholt, der Zugzähler geprüft und nur die eine geänderte Partie
           eingesetzt. */
        const schachAbgleich = new Abgleich(schachSpeicher.speicher, KONFIG.speicher, {
            beiDaten: (tafel) => {
                TEAM_SCHACH.zeichnen(tafel);
                RANGLISTE.zeichnen();
            },
            beiStatus: () => { /* Der Kopf zeigt den Stand des Würfel-Quizz. */ },
            leereDaten: () => SCHACH_TAFEL.leereTafel(),
            inhaltGleich: (a, b) => SCHACH_TAFEL.inhaltGleich(a, b)
        });

        TEAM_SCHACH.verbinden(schachAbgleich);

        /* ---- Imposter ---- */
        const imposterSpeicher = speicherErzeugen(
            KONFIG,
            KONFIG.speicher.imposterPfad,
            KONFIG.speicher.lokalerSchluesselImposter,
            (roh) => IMPOSTER_RUNDE.normalisieren(roh)
        );

        /* MIT `zusammenfuehren`: Hier hat jeder seinen eigenen Eintrag (Tipps,
           bereit, fertig) — wie im Würfel-Quizz. Ohne das löschte ein Gerät mit
           veraltetem Stand die Tipps der anderen weg. */
        const imposterAbgleich = new Abgleich(imposterSpeicher.speicher, KONFIG.speicher, {
            beiDaten: (runde) => {
                IMPOSTER.zeichnen(runde);
                RANGLISTE.zeichnen();
            },
            beiStatus: () => { /* Der Kopf zeigt den Stand des Würfel-Quizz. */ },
            leereDaten: () => IMPOSTER_RUNDE.leereRunde(),
            inhaltGleich: (a, b) => IMPOSTER_RUNDE.inhaltGleich(a, b),
            zusammenfuehren: (fremd, eigen, id) => IMPOSTER_RUNDE.zusammenfuehren(fremd, eigen, id)
        });

        IMPOSTER.verbinden(imposterAbgleich);

        /* ---- Tabs ---- */
        TABS.registrieren(WUERFEL_QUIZZ);
        TABS.registrieren(TEAM_SCHACH);
        TABS.registrieren(IMPOSTER);
        TABS.registrieren(RANGLISTE);
        TABS.starten(
            document.getElementById("tab-leiste"),
            document.getElementById("tab-inhalt")
        );

        quizzAbgleich.starten().then(() => {
            WUERFEL_QUIZZ.anmelden();

            /* Die eigene Kennung braucht der Imposter-Abgleich zum
               Zusammenführen — sie steht erst nach der Anmeldung fest. */
            const person = ICH.person();
            if (person) {
                imposterAbgleich.eigeneIdSetzen(person.id);
            }
        });
        schachAbgleich.starten();
        imposterAbgleich.starten();
    },

    /* status ist einer von: laedt, bereit, schreibt, fehler */
    statusZeigen(status, text) {
        if (!APP.statusEl) {
            return;
        }
        APP.statusEl.dataset.status = status;
        APP.statusTextEl.textContent = text;
    },

    hinweisZeigen(text) {
        const balken = document.getElementById("hinweis");
        balken.textContent = text;
        balken.hidden = false;
    }
};

document.addEventListener("DOMContentLoaded", APP.starten);
