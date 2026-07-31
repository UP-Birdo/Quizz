/*
 * speicher.js — wo die Tabelle liegt.
 *
 * Es gibt zwei Rückwände mit derselben Schnittstelle. Die App kennt nur die
 * Schnittstelle und weiß nicht, welche Rückwand gerade arbeitet:
 *
 *     art           "lokal" | "gemeinsam"
 *     beschreibung  kurzer Satz für die Statusanzeige im Kopf
 *     laden()       Versprechen auf einen normalisierten Datenstand
 *     speichern(d)  Versprechen; wirft bei Fehler
 *
 * Eine dritte Rückwand (anderer Dienst) wäre eine weitere Klasse hier — sonst
 * ändert sich nichts. Siehe docs\ARCHITECTURE.md.
 */

/* ------------------------------------------------------------------ *
 * Rückwand 1: lokal im Browser des Besuchers
 * ------------------------------------------------------------------ */

class SpeicherLokal {

    constructor(schluessel) {
        this.art = "lokal";
        this.beschreibung = "Nur auf diesem Gerät gespeichert";
        this.schluessel = schluessel;
    }

    async laden() {
        try {
            const text = window.localStorage.getItem(this.schluessel);
            if (!text) {
                return MODELL.leereDaten();
            }
            return MODELL.normalisieren(JSON.parse(text));
        } catch (fehler) {
            /* Kaputter oder gesperrter Browser-Speicher darf die App nicht
               anhalten — dann eben mit leerer Tabelle starten. */
            console.warn("Lokaler Speicher nicht lesbar:", fehler);
            return MODELL.leereDaten();
        }
    }

    async speichern(daten) {
        window.localStorage.setItem(this.schluessel, JSON.stringify(daten));
    }
}

/* ------------------------------------------------------------------ *
 * Rückwand 2: gemeinsam über Firebase Realtime Database
 *
 * Bewusst über die reine REST-Schnittstelle (fetch), NICHT über das
 * Firebase-SDK: keine fremde Programmbibliothek, kein Bauschritt, die Seite
 * bleibt eine Sammlung einfacher Dateien.
 * ------------------------------------------------------------------ */

class SpeicherGemeinsam {

    constructor(basis, pfad) {
        this.art = "gemeinsam";
        this.beschreibung = "Gemeinsame Tabelle für alle Besucher";
        this.basis = String(basis).replace(/\/+$/, "");
        this.pfad = String(pfad).replace(/^\/+|\/+$/g, "");
    }

    get adresse() {
        return this.basis + "/" + this.pfad + ".json";
    }

    async laden() {
        const antwort = await fetch(this.adresse, { cache: "no-store" });
        if (!antwort.ok) {
            throw new Error("Laden fehlgeschlagen (HTTP " + antwort.status + ")");
        }
        return MODELL.normalisieren(await antwort.json());
    }

    async speichern(daten) {
        const antwort = await fetch(this.adresse, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(daten)
        });
        if (!antwort.ok) {
            throw new Error("Speichern fehlgeschlagen (HTTP " + antwort.status + ")");
        }
    }
}

/* ------------------------------------------------------------------ *
 * Auswahl der Rückwand
 * ------------------------------------------------------------------ */

/*
 * Liefert { speicher, hinweis }. Der Hinweis ist leer, wenn alles wie
 * eingestellt läuft — sonst nennt er den Grund für den Rückfall auf "lokal".
 */
function speicherErzeugen(konfig) {
    const einstellung = konfig.speicher;

    if (einstellung.modus === "gemeinsam") {
        if (!einstellung.firebaseBasis) {
            return {
                speicher: new SpeicherLokal(einstellung.lokalerSchluessel),
                hinweis: "Gemeinsamer Modus ist eingestellt, aber in js\\konfig.js "
                    + "steht keine Datenbank-Adresse. Es wird nur lokal gespeichert."
            };
        }
        return {
            speicher: new SpeicherGemeinsam(einstellung.firebaseBasis, einstellung.pfad),
            hinweis: ""
        };
    }

    return {
        speicher: new SpeicherLokal(einstellung.lokalerSchluessel),
        hinweis: ""
    };
}
