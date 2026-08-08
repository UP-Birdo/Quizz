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
    /*
     * `zusatz` ist wahlfrei: ein fertiges Element, das unter dem Text steht —
     * gedacht für Bilder, die eine Frage beantworten, bevor man sie stellt
     * (die Bildanleitung zu einer Fähigkeit, seit v0.41). Es bleibt bei EINER
     * Dialog-Funktion; wer nichts übergibt, bekommt genau den Dialog von
     * vorher.
     */
    frage(titel, text, bestaetigenText, gefaehrlich, zusatz) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            zusatz: zusatz || null,
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

    /*
     * Reine Mitteilung mit einem Knopf. `zusatz` ist wahlfrei und wirkt wie bei
     * `frage`: ein fertiges Element unter dem Text — gebraucht wird es für die
     * Bildanleitung einer Fähigkeit, die man nur ansieht (seit v0.48).
     */
    hinweis(titel, text, zusatz) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            zusatz: zusatz || null,
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

    /*
     * Eingabe einer Zahlenfolge (PIN). Liefert die Ziffern als Zeichenkette
     * oder null bei Abbruch. Bestätigen geht erst, wenn genau `stellen`
     * Ziffern eingegeben sind.
     */
    zahlen(titel, text, stellen, bestaetigenText, abbrechbar) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            eingabe: {
                wert: "",
                platzhalter: "".padStart(stellen, "0"),
                nurZiffern: true,
                stellen: stellen
            },
            knoepfe: (abbrechbar === false)
                ? [{ beschriftung: bestaetigenText || "Weiter", wert: true, stil: "knopf-haupt" }]
                : [
                    { beschriftung: "Abbrechen", wert: false, stil: "knopf-still" },
                    { beschriftung: bestaetigenText || "Weiter", wert: true, stil: "knopf-haupt" }
                ]
        });
    },

    /*
     * Auswahl aus einer Liste. `eintraege` ist eine Liste aus
     * { beschriftung, hinweis, wert }. Liefert den gewählten Wert oder null.
     * Für die Frage beim ersten Besuch: Bist du einer dieser Spieler?
     */
    liste(titel, text, eintraege, abbrechenText) {
        return DIALOG._zeigen({
            titel: titel,
            text: text,
            liste: eintraege,
            knoepfe: [
                { beschriftung: abbrechenText || "Abbrechen", wert: null, stil: "knopf-still" }
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

            /* Optionaler Zusatz: ein fertiges Element unter dem Text. */
            if (vorgabe.zusatz) {
                kasten.appendChild(vorgabe.zusatz);
            }

            /* Optionale Auswahlliste (jeder Eintrag ein eigener Knopf). */
            if (vorgabe.liste) {
                const liste = document.createElement("div");
                liste.className = "dialog-liste";

                for (const eintrag of vorgabe.liste) {
                    const knopf = document.createElement("button");
                    knopf.type = "button";
                    knopf.className = "dialog-listeneintrag";

                    knopf.appendChild(DIALOG._zeile("dialog-listenname", eintrag.beschriftung));
                    if (eintrag.hinweis) {
                        knopf.appendChild(DIALOG._zeile("dialog-listenhinweis", eintrag.hinweis));
                    }

                    knopf.addEventListener("click", () => schliessen(eintrag.wert));
                    liste.appendChild(knopf);
                }

                kasten.appendChild(liste);
            }

            /* Optionales Eingabefeld. */
            let feld = null;
            if (vorgabe.eingabe) {
                feld = document.createElement("input");
                feld.className = "dialog-feld";
                feld.value = vorgabe.eingabe.wert;
                feld.placeholder = vorgabe.eingabe.platzhalter || "";
                feld.setAttribute("aria-label", vorgabe.titel);

                if (vorgabe.eingabe.nurZiffern) {
                    /* Auf dem Handy soll der Zahlenblock erscheinen, und es
                       sollen nur Ziffern hineinkommen. */
                    feld.type = "text";
                    feld.inputMode = "numeric";
                    feld.autocomplete = "off";
                    feld.maxLength = vorgabe.eingabe.stellen;
                    feld.classList.add("dialog-feld-zahlen");
                    feld.addEventListener("input", () => {
                        const nurZiffern = feld.value.replace(/[^0-9]/g, "");
                        if (feld.value !== nurZiffern) {
                            feld.value = nurZiffern;
                        }
                    });
                } else {
                    feld.type = "text";
                }

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
                    schliessen(vorgabe.liste ? null : false);
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

            /*
             * Bestätigen ist gesperrt, solange die Eingabe unvollständig ist:
             * bei Text ein leeres Feld, bei Ziffern eine falsche Anzahl.
             */
            if (feld && bestaetigenKnopf) {
                const vollstaendig = () => {
                    const wert = feld.value.trim();
                    if (vorgabe.eingabe.nurZiffern) {
                        return wert.length === vorgabe.eingabe.stellen;
                    }
                    return wert !== "";
                };

                const knopfPruefen = () => {
                    bestaetigenKnopf.disabled = !vollstaendig();
                };

                feld.addEventListener("input", knopfPruefen);
                feld.addEventListener("keydown", (ereignis) => {
                    if (ereignis.key === "Enter" && vollstaendig()) {
                        schliessen(true);
                    }
                });
                knopfPruefen();
            }

            kasten.appendChild(leiste);
            behaelter.appendChild(kasten);
            behaelter.hidden = false;

            document.addEventListener("keydown", beiTaste);

            if (vorgabe.liste) {
                const ersterEintrag = kasten.querySelector(".dialog-listeneintrag");
                if (ersterEintrag) {
                    ersterEintrag.focus();
                }
            } else if (feld) {
                feld.focus();
                feld.select();
            } else {
                const letzterKnopf = leiste.lastElementChild;
                if (letzterKnopf) {
                    letzterKnopf.focus();
                }
            }
        });
    },

    /* Eine Textzeile innerhalb eines Listeneintrags. */
    _zeile(klasse, text) {
        const zeile = document.createElement("span");
        zeile.className = klasse;
        zeile.textContent = text;
        return zeile;
    }
};
