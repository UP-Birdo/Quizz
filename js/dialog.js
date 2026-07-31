/*
 * dialog.js — eigene Dialoge.
 *
 * Haus-Regel: kein confirm() und kein alert(). Beide sehen auf jedem Gerät
 * anders aus, blockieren die Seite und lassen sich nicht gestalten.
 *
 * Verwendung:
 *     const ja = await DIALOG.frage("Zeile loeschen?", "…", "Loeschen");
 *     await DIALOG.hinweis("Titel", "Text");
 */

const DIALOG = {

    /* Wird von app.js beim Start gesetzt (das <div id="dialog"> aus index.html). */
    behaelter: null,

    aufbauen(behaelter) {
        DIALOG.behaelter = behaelter;
    },

    /*
     * Rückfrage mit zwei Knöpfen. Liefert true bei Bestätigung.
     * Der Schalter `gefaehrlich` färbt den Bestätigen-Knopf rot (Löschen).
     */
    frage(titel, text, bestaetigenText, gefaehrlich) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            knoepfe: [
                { beschriftung: "Abbrechen", wert: false, stil: "knopf-still" },
                {
                    beschriftung: bestaetigenText || "OK",
                    wert: true,
                    stil: gefaehrlich ? "knopf-gefahr" : "knopf-haupt"
                }
            ]
        });
    },

    /* Reine Mitteilung mit einem Knopf. */
    hinweis(titel, text) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            knoepfe: [{ beschriftung: "Verstanden", wert: true, stil: "knopf-haupt" }]
        });
    },

    /*
     * Abfrage eines kurzen Textes (z. B. des eigenen Namens).
     * Liefert den eingegebenen Text oder null bei Abbruch.
     * Mit `abbrechbar = false` gibt es keinen Abbrechen-Knopf — für die Frage
     * beim ersten Besuch, ohne die es nicht weitergeht.
     */
    eingabe(titel, text, vorgabe, bestaetigenText, abbrechbar) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            eingabe: {
                wert: vorgabe || "",
                platzhalter: "Name"
            },
            knoepfe: (abbrechbar === false)
                ? [{ beschriftung: bestaetigenText || "Weiter", wert: true, stil: "knopf-haupt" }]
                : [
                    { beschriftung: "Abbrechen", wert: false, stil: "knopf-still" },
                    { beschriftung: bestaetigenText || "Weiter", wert: true, stil: "knopf-haupt" }
                ]
        });
    },

    _zeigen(vorgabe) {
        return new Promise((erfuellen) => {
            const behaelter = DIALOG.behaelter;
            behaelter.innerHTML = "";

            const kasten = document.createElement("div");
            kasten.className = "dialog-kasten";
            kasten.setAttribute("role", "dialog");
            kasten.setAttribute("aria-modal", "true");

            const ueberschrift = document.createElement("h2");
            ueberschrift.textContent = vorgabe.titel;
            kasten.appendChild(ueberschrift);

            const absatz = document.createElement("p");
            absatz.textContent = vorgabe.text;
            kasten.appendChild(absatz);

            /* Optionales Eingabefeld. */
            let feld = null;
            if (vorgabe.eingabe) {
                feld = document.createElement("input");
                feld.type = "text";
                feld.className = "dialog-feld";
                feld.value = vorgabe.eingabe.wert;
                feld.placeholder = vorgabe.eingabe.platzhalter || "";
                feld.setAttribute("aria-label", vorgabe.titel);
                kasten.appendChild(feld);
            }

            const leiste = document.createElement("div");
            leiste.className = "dialog-knopfleiste";

            /*
             * Ergebnis eines Dialogs:
             *   ohne Eingabefeld -> true / false
             *   mit Eingabefeld  -> der Text bei Bestätigung, sonst null
             */
            const schliessen = (wert) => {
                document.removeEventListener("keydown", beiTaste);
                behaelter.hidden = true;
                behaelter.innerHTML = "";

                if (!feld) {
                    erfuellen(wert);
                    return;
                }
                erfuellen(wert ? feld.value.trim() : null);
            };

            /* Bei erzwungener Eingabe (nur ein Knopf) bleibt Escape wirkungslos. */
            const escapeErlaubt = !(vorgabe.eingabe && vorgabe.knoepfe.length === 1);

            const beiTaste = (ereignis) => {
                if (ereignis.key === "Escape" && escapeErlaubt) {
                    schliessen(false);
                }
            };

            let bestaetigenKnopf = null;

            for (const knopfVorgabe of vorgabe.knoepfe) {
                const knopf = document.createElement("button");
                knopf.type = "button";
                knopf.className = "knopf " + knopfVorgabe.stil;
                knopf.textContent = knopfVorgabe.beschriftung;
                knopf.addEventListener("click", () => schliessen(knopfVorgabe.wert));
                leiste.appendChild(knopf);

                if (knopfVorgabe.wert === true) {
                    bestaetigenKnopf = knopf;
                }
            }

            /* Ein leeres Eingabefeld darf nicht bestätigt werden. */
            if (feld && bestaetigenKnopf) {
                const knopfPruefen = () => {
                    bestaetigenKnopf.disabled = (feld.value.trim() === "");
                };
                feld.addEventListener("input", knopfPruefen);
                feld.addEventListener("keydown", (ereignis) => {
                    if (ereignis.key === "Enter" && feld.value.trim() !== "") {
                        schliessen(true);
                    }
                });
                knopfPruefen();
            }

            kasten.appendChild(leiste);
            behaelter.appendChild(kasten);
            behaelter.hidden = false;

            document.addEventListener("keydown", beiTaste);

            if (feld) {
                feld.focus();
                feld.select();
            } else {
                const letzterKnopf = leiste.lastElementChild;
                if (letzterKnopf) {
                    letzterKnopf.focus();
                }
            }
        });
    }
};
