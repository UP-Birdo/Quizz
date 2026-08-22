/*
 * einstellungen.js — der Tab Einstellungen (seit v0.119, Nutzer-Wunsch
 * 22.08.).
 *
 * GERÄTE-Einstellungen, kein gemeinsamer Stand: Was hier gewählt wird, gilt
 * nur für dieses Gerät und liegt im Gerätespeicher — es gibt also auch
 * keinen Speicherpfad und keinen Abgleich.
 *
 * Erster Bewohner ist die DARSTELLUNG: der Wechsel zwischen dem klassischen
 * Brett und dem 3D-Look. Der 3D-Look ist eine Vorschau und wächst in
 * Stufen (ROADMAP, Bündel Z): Stufe 1 sind die Pastell-Kacheln mit Tiefe
 * auf dem Schachbrett; Spielzeug-Figuren und Schräg-Ansicht folgen. Alles
 * hängt an EINER Klasse am body (`design-3d`) — neue Stufen docken dort an,
 * ohne diesen Tab zu ändern.
 */

const EINSTELLUNGEN = {

    id: "einstellungen",
    titel: "Einstellungen",

    /* Die gewählte Darstellung: "klassisch" oder "3d". */
    SCHLUESSEL_DESIGN: "quizz-design",
    design: "klassisch",

    wurzelEl: null,

    /* Beim Start (app.js), VOR dem ersten Zeichnen — sonst blitzt kurz das
       falsche Design auf. */
    laden() {
        try {
            const wert = window.localStorage.getItem(EINSTELLUNGEN.SCHLUESSEL_DESIGN);
            if (wert === "3d" || wert === "klassisch") {
                EINSTELLUNGEN.design = wert;
            }
        } catch (fehler) {
            /* Ohne Gerätespeicher (Privatmodus) bleibt die Vorgabe. */
        }
        EINSTELLUNGEN._anwenden();
    },

    designSetzen(wert) {
        EINSTELLUNGEN.design = (wert === "3d") ? "3d" : "klassisch";
        try {
            window.localStorage.setItem(
                EINSTELLUNGEN.SCHLUESSEL_DESIGN, EINSTELLUNGEN.design);
        } catch (fehler) {
            /* Dann gilt die Wahl eben nur bis zum Neuladen. */
        }
        EINSTELLUNGEN._anwenden();
    },

    _anwenden() {
        if (typeof document === "undefined" || !document.body
            || !document.body.classList) {
            return;
        }
        document.body.classList.toggle("design-3d", EINSTELLUNGEN.design === "3d");
    },

    aufbauen(behaelter) {
        EINSTELLUNGEN.wurzelEl = behaelter;
        EINSTELLUNGEN._zeichnen();
    },

    beimOeffnen() {
        EINSTELLUNGEN._zeichnen();
    },

    _zeichnen() {
        const wurzel = EINSTELLUNGEN.wurzelEl;
        if (!wurzel) {
            return;
        }
        wurzel.innerHTML = "";

        const karte = document.createElement("section");
        karte.className = "karte";

        const kopf = document.createElement("h2");
        kopf.textContent = "Darstellung";
        karte.appendChild(kopf);

        /* Derselbe Kipp-Schalter wie im Anlege-Bildschirm — EIN Muster für
           die ganze App. Die ganze Zeile ist ein label und schaltet um; das
           i steht daneben (siehe die v0.105-Regel: Erklärtexte hinters i). */
        const zeile = document.createElement("label");
        zeile.className = "schalter-zeile";

        const kasten = document.createElement("input");
        kasten.type = "checkbox";
        kasten.className = "schalter-kasten";
        kasten.checked = (EINSTELLUNGEN.design === "3d");
        kasten.addEventListener("change", () => {
            EINSTELLUNGEN.designSetzen(kasten.checked ? "3d" : "klassisch");
        });
        zeile.appendChild(kasten);

        const text = document.createElement("span");
        text.className = "schalter-text";
        const titel = document.createElement("span");
        titel.className = "schalter-titel";
        titel.textContent = "3D-Look (Vorschau)";
        text.appendChild(titel);
        zeile.appendChild(text);

        const halter = document.createElement("div");
        halter.className = "schalter-halter";
        halter.appendChild(zeile);

        const info = document.createElement("button");
        info.type = "button";
        info.className = "info-knopf";
        info.textContent = "i";
        info.setAttribute("aria-label", "Was ist der 3D-Look?");
        info.addEventListener("click", () => DIALOG.hinweis("3D-Look (Vorschau)",
            "Das Schachbrett wird zu Pastell-Kacheln mit Tiefe, wie in einem "
            + "3D-Spiel. Das ist die erste Ausbaustufe — Spielzeug-Figuren und "
            + "eine leichte Schräg-Ansicht folgen nach und nach.\n\n"
            + "Aus bleibt das gewohnte Brett. Die Wahl gilt nur für dieses "
            + "Gerät."));
        halter.appendChild(info);

        karte.appendChild(halter);
        wurzel.appendChild(karte);
    }
};
