/*
 * abgleich.js — hält den angezeigten Stand und den gespeicherten Stand zusammen.
 *
 * Aufgaben:
 *   1. beim Start einmal laden,
 *   2. eigene Änderungen VERZÖGERT schreiben (nicht bei jedem Tastendruck),
 *   3. im gemeinsamen Modus regelmäßig nachsehen, ob jemand anders etwas
 *      geändert hat.
 *
 * Regeln bei gleichzeitigem Arbeiten (bewusst einfach gehalten, siehe
 * docs\DECISIONS.md): Der zuletzt geschriebene Stand gewinnt. Solange eine
 * eigene Änderung aussteht, wird kein fremder Stand übernommen — sonst würde
 * die eigene Eingabe während des Tippens überschrieben.
 */

class Abgleich {

    /*
     * speicher     — Rückwand aus speicher.js
     * einstellung  — KONFIG.speicher
     * rueckrufe    — {
     *                    beiDaten(daten), beiStatus(status, text),
     *                    leereDaten(), inhaltGleich(a, b),
     *                    zusammenfuehren(fremd, eigen, eigeneId)   // optional
     *                }
     *
     * Die drei Datenfunktionen kommen von aussen, weil sich zwei Spiele diese
     * Schicht teilen: Das Würfel-Quizz und das Team-Schach haben ganz
     * verschiedene Stände. Fehlt `zusammenfuehren`, wird der Stand so
     * geschrieben, wie er ist — das ist beim Schach richtig, wo ein Zug den
     * gemeinsamen Stand ändert und die Absicherung über den Zugzähler läuft.
     */
    constructor(speicher, einstellung, rueckrufe) {
        this.speicher = speicher;
        this.einstellung = einstellung;
        this.beiDaten = rueckrufe.beiDaten;
        this.beiStatus = rueckrufe.beiStatus;
        this.leereDaten = rueckrufe.leereDaten;
        this.inhaltGleich = rueckrufe.inhaltGleich;
        this.zusammenfuehren = rueckrufe.zusammenfuehren || null;

        this.daten = this.leereDaten();
        this.schreibZeitgeber = null;
        this.schreibtGerade = false;
        this.aenderungOffen = false;
        this.abfrageZeitgeber = null;

        /* Kennung des eigenen Spielers — nötig, um beim Schreiben zu wissen,
           welcher Eintrag der eigene ist. Wird von wuerfel-quizz.js gesetzt. */
        this.eigeneId = null;

        /* Steht eine Änderung an, die absichtlich fremde Einträge betrifft
           (neue Runde, Spieler entfernen)? Dann wird nicht zusammengeführt. */
        this.globaleAenderung = false;

        /*
         * Wie viele eigene Schreibvorgänge gerade laufen, die NICHT über
         * `schreiben()` gehen (seit v3.8).
         *
         * Schach und Imposter schreiben selbst: Sie holen den Stand vom
         * Server, setzen eine einzelne Partie oder einen einzelnen Raum hinein
         * und speichern (siehe TEAM_SCHACH._sendenMitPruefung). Der Abgleich
         * weiss davon nichts — und genau in dieser Zeit könnte seine
         * regelmässige Abfrage antworten und den noch nicht geschriebenen
         * eigenen Zug mit dem alten Server-Stand überschreiben. Auf dem
         * Bildschirm sieht das aus, als spränge die Figur zurück.
         *
         * Ein Zähler und kein Schalter: Es können mehrere Vorgänge gleichzeitig
         * offen sein (Zug abschicken, während eine Abstimmung ausläuft).
         */
        this.eigeneVorgaenge = 0;
    }

    /* Ein eigener Schreibvorgang beginnt — bis er endet, wird kein fremder
       Stand übernommen. */
    eigenerVorgangBeginnt() {
        this.eigeneVorgaenge++;
    }

    eigenerVorgangEndet() {
        this.eigeneVorgaenge = Math.max(0, this.eigeneVorgaenge - 1);
    }

    /* Wird gesetzt, sobald feststeht, wer an diesem Gerät sitzt. */
    eigeneIdSetzen(id) {
        this.eigeneId = id;
    }

    /* Erstes Laden; danach läuft die regelmäßige Abfrage. */
    async starten() {
        this.melden("laedt", "Wird geladen …");
        try {
            this.daten = await this.speicher.laden();
            this.beiDaten(this.daten);
            this.melden("bereit", this.speicher.beschreibung);
        } catch (fehler) {
            this.melden("fehler", "Laden fehlgeschlagen: " + fehler.message);
        }

        if (this.speicher.art === "gemeinsam") {
            this.abfrageZeitgeber = window.setInterval(
                () => this.fremdenStandHolen(),
                this.einstellung.abfrageIntervallMs
            );

            /*
             * Sobald die Seite wieder sichtbar wird, sofort nachsehen — nicht
             * erst nach dem nächsten Zeitabstand. Zusammen mit der Sperre in
             * fremdenStandHolen() heißt das: im Hintergrund wird gar nicht
             * abgefragt, beim Zurückkommen dafür ohne Verzögerung.
             */
            document.addEventListener("visibilitychange", () => {
                if (!document.hidden) {
                    this.fremdenStandHolen();
                }
            });
        }
    }

    /*
     * Eine Änderung aus der Oberfläche übernehmen.
     *
     * neuZeichnen = false bei Eingaben, die das Feld selbst schon zeigt
     * (Tippen, Auswahl umstellen) — würde man dabei neu zeichnen, entstünde
     * genau unter den Fingern des Nutzers ein neues Feld.
     * neuZeichnen = true bei Struktur-Änderungen (Zeile hinzu oder weg).
     *
     * `global` = true nur für Aktionen, die absichtlich fremde Einträge ändern
     * (neue Runde, Spieler entfernen). Dann wird der Stand geschrieben wie er
     * ist; sonst wird er in den Stand vom Server eingefügt.
     */
    aendern(neueDaten, neuZeichnen, global) {
        this.daten = neueDaten;
        this.aenderungOffen = true;
        if (global === true) {
            this.globaleAenderung = true;
        }
        if (neuZeichnen !== false) {
            this.beiDaten(this.daten);
        }
        this.schreibenPlanen();
    }

    schreibenPlanen() {
        if (this.schreibZeitgeber !== null) {
            window.clearTimeout(this.schreibZeitgeber);
        }
        this.schreibZeitgeber = window.setTimeout(
            () => this.schreiben(),
            this.einstellung.schreibVerzoegerungMs
        );
    }

    async schreiben() {
        this.schreibZeitgeber = null;
        this.schreibtGerade = true;
        this.melden("schreibt", "Wird gespeichert …");

        try {
            /*
             * Vor dem Schreiben den Stand vom Server holen und den eigenen
             * Eintrag hineinsetzen, statt alles zu überschreiben. Sonst löscht
             * ein Gerät mit veraltetem Stand die Mitspieler weg, die sich
             * inzwischen angemeldet haben (siehe MODELL.zusammenfuehren).
             *
             * Ausgenommen: Aktionen, die absichtlich fremde Einträge ändern.
             * Und der lokale Speicher, wo es niemanden gibt, mit dem man sich
             * abstimmen müsste.
             */
            if (this.zusammenfuehren && this.speicher.art === "gemeinsam"
                && !this.globaleAenderung && this.eigeneId) {
                try {
                    const fremd = await this.speicher.laden();
                    this.daten = this.zusammenfuehren(fremd, this.daten, this.eigeneId);
                } catch (ladefehler) {
                    /* Kein Kontakt zum Server: dann eben ohne Abgleich schreiben,
                       der Versuch ist besser als gar nichts zu speichern. */
                    console.warn("Zusammenführen übersprungen:", ladefehler);
                }
            }

            await this.speicher.speichern(this.daten);
            this.aenderungOffen = false;
            this.globaleAenderung = false;
            this.beiDaten(this.daten);
            this.melden("bereit", this.speicher.beschreibung);
        } catch (fehler) {
            /* Die Änderung bleibt offen und wird beim nächsten Versuch erneut
               geschrieben — nichts geht verloren, solange das Fenster offen ist. */
            this.melden("fehler", "Nicht gespeichert: " + fehler.message);
            this.schreibenPlanen();
        } finally {
            this.schreibtGerade = false;
        }
    }

    async fremdenStandHolen() {
        if (this.schreibtGerade || this.aenderungOffen || this.schreibZeitgeber !== null
            || this.eigeneVorgaenge > 0) {
            return;
        }

        /*
         * Liegt die Seite im Hintergrund (anderer Tab, Handy in der Tasche),
         * wird nicht abgefragt. Gespielt wird über mobile Daten, und eine
         * Abfrage alle drei Sekunden über einen ganzen Tag wäre reine
         * Verschwendung von Datenvolumen und Akku. Beim Zurückkommen holt der
         * Anschluss in starten() den Stand sofort nach.
         */
        if (typeof document !== "undefined" && document.hidden) {
            return;
        }

        try {
            const fremd = await this.speicher.laden();
            if (!this.inhaltGleich(fremd, this.daten)) {
                this.daten = fremd;
                this.beiDaten(this.daten);
            }
            this.melden("bereit", this.speicher.beschreibung);
        } catch (fehler) {
            this.melden("fehler", "Keine Verbindung: " + fehler.message);
        }
    }

    melden(status, text) {
        if (this.beiStatus) {
            this.beiStatus(status, text);
        }
    }
}
