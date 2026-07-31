/*
 * tabs.js — die Tab-Leiste.
 *
 * Heute gibt es genau einen Tab (Würfel Quizz). Die Leiste ist trotzdem ein
 * eigenes, offenes Register, damit ein zweites Quizz später nur noch
 * registriert werden muss — ohne Umbau an dieser Datei.
 *
 * Ein Tab ist ein Objekt:
 *     {
 *         id:        "wuerfel-quizz",          // eindeutig, auch für die Adresse
 *         titel:     "Wuerfel Quizz",          // Beschriftung in der Leiste
 *         aufbauen(behaelter)                  // zeichnet den Inhalt einmalig
 *     }
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

        /* Inhalt wird beim ersten Öffnen einmal aufgebaut. */
        if (!TABS.aufgebaut[id]) {
            const bereich = document.createElement("section");
            bereich.className = "tab-bereich";
            bereich.dataset.tabId = id;
            TABS.inhaltEl.appendChild(bereich);
            tab.aufbauen(bereich);
            TABS.aufgebaut[id] = true;
            bereich.hidden = false;
        }
    }
};
