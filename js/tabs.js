/*
 * tabs.js — die Tab-Leiste.
 *
 * Ein offenes Register: Ein weiteres Spiel muss nur registriert werden, ohne
 * Umbau an dieser Datei.
 *
 * Ein Tab ist ein Objekt:
 *     {
 *         id:        "wuerfel-quizz",          // eindeutig, auch für die Adresse
 *         titel:     "Würfel Quizz",           // Beschriftung in der Leiste
 *         aufbauen(behaelter),                 // legt das Gerüst einmalig an
 *         beimOeffnen()                        // optional: bei jedem Wechsel
 *     }
 *
 * Warum es `beimOeffnen` braucht: Das Gerüst eines Tabs entsteht erst, wenn er
 * zum ersten Mal geöffnet wird. Seine Daten können lange vorher geladen worden
 * sein — der Zeichen-Aufruf lief dann ins Leere, weil es den Bereich noch nicht
 * gab. Ohne diesen Haken bliebe ein Tab leer, bis sich zufällig etwas ändert.
 * Genau das war der Fehler, mit dem Team Schach in v1.1 nichts anzeigte.
 */

const TABS = {

    liste: [],
    aktiveId: null,
    leisteEl: null,
    inhaltEl: null,
    aufgebaut: {},

    registrieren(tab) {
        TABS.liste.push(tab);
    },

    /* Zeichnet die Leiste und öffnet den ersten Tab. */
    starten(leisteEl, inhaltEl) {
        TABS.leisteEl = leisteEl;
        TABS.inhaltEl = inhaltEl;
        TABS.leisteEl.innerHTML = "";

        for (const tab of TABS.liste) {
            const knopf = document.createElement("button");
            knopf.type = "button";
            knopf.className = "tab-knopf";
            knopf.textContent = tab.titel;
            knopf.dataset.tabId = tab.id;
            knopf.setAttribute("role", "tab");
            knopf.addEventListener("click", () => TABS.wechseln(tab.id));
            TABS.leisteEl.appendChild(knopf);
        }

        if (TABS.liste.length > 0) {
            TABS.wechseln(TABS.liste[0].id);
        }
    },

    wechseln(id) {
        const tab = TABS.liste.find((eintrag) => eintrag.id === id);
        if (!tab) {
            return;
        }

        TABS.aktiveId = id;

        for (const knopf of TABS.leisteEl.querySelectorAll(".tab-knopf")) {
            const istAktiv = knopf.dataset.tabId === id;
            knopf.classList.toggle("tab-knopf-aktiv", istAktiv);
            knopf.setAttribute("aria-selected", istAktiv ? "true" : "false");
        }

        for (const bereich of TABS.inhaltEl.querySelectorAll(".tab-bereich")) {
            bereich.hidden = bereich.dataset.tabId !== id;
        }

        /* Das Gerüst wird beim ersten Öffnen einmal aufgebaut. */
        if (!TABS.aufgebaut[id]) {
            const bereich = document.createElement("section");
            bereich.className = "tab-bereich";
            bereich.dataset.tabId = id;
            TABS.inhaltEl.appendChild(bereich);
            tab.aufbauen(bereich);
            TABS.aufgebaut[id] = true;
            bereich.hidden = false;
        }

        /* Danach zeichnet der Tab seinen aktuellen Stand — jedes Mal, nicht nur
           beim ersten Öffnen. Siehe Erklärung im Kopf dieser Datei. */
        if (typeof tab.beimOeffnen === "function") {
            tab.beimOeffnen();
        }
    }
};
