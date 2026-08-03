/*
 * wunsch.js — der Wunsch-Knopf im Kopf der Seite.
 *
 * Der Weg eines Wunsches, vom Einfall bis zur Umsetzung:
 *
 *     App  ->  vorbefülltes GitHub-Formular  ->  Eintrag im Repo
 *          ->  tools\Wuensche-Abholen.ps1  ->  TODO.md "## Anfragen"
 *          ->  Nutzer schreibt "bestätigt" dahinter  ->  ROADMAP.md
 *
 * Dasselbe Muster wie im Lernheft-Projekt. Warum über ein Formular und nicht
 * über die GitHub-Schnittstelle: Ein Schreib-Token müsste dafür in der
 * öffentlichen Seite stehen — jeder Besucher könnte damit ins Repo schreiben.
 * Der Umweg über das Formular kostet einen Klick und braucht kein Geheimnis.
 */

const WUNSCH = {

    KONTO: "up-birdo",
    REPO: "Quizz",

    /* Hängt den Knopf in den Kopf der Seite. */
    aufbauen(behaelter) {
        if (!behaelter) {
            return;
        }

        const knopf = document.createElement("button");
        knopf.type = "button";
        knopf.className = "knopf knopf-still knopf-klein";
        knopf.textContent = "Wunsch";
        knopf.title = "Einen Wunsch oder Fehler melden";
        knopf.addEventListener("click", () => WUNSCH.oeffnen());

        behaelter.appendChild(knopf);
    },

    async oeffnen() {
        const text = await DIALOG.eingabe(
            "Wunsch oder Fehler",
            "Was fehlt dir, was stört dich? Ein Satz genügt. Der Text landet als "
                + "Eintrag auf GitHub — von dort wandert er in die Aufgabenliste.",
            "",
            "Weiter",
            true
        );

        if (text === null || text.trim() === "") {
            return;
        }

        const adresse = "https://github.com/" + WUNSCH.KONTO + "/" + WUNSCH.REPO
            + "/issues/new?template=wunsch.yml"
            + "&idee=" + encodeURIComponent(text.trim())
            + "&stelle=" + encodeURIComponent(WUNSCH._stelle())
            + "&fassung=" + encodeURIComponent("v" + KONFIG.APP_VERSION);

        const fenster = window.open(adresse, "_blank", "noopener");

        if (!fenster) {
            /* Blockiert der Browser das Fenster, bleibt der Text nicht liegen. */
            await DIALOG.hinweis("Fenster blockiert",
                "Der Browser hat das GitHub-Formular nicht geöffnet. Dein Text:\n\n"
                + text.trim());
        }
    },

    /* Welcher Tab ist gerade offen? Hilft beim Einordnen des Wunsches. */
    _stelle() {
        const tab = TABS.liste.find((eintrag) => eintrag.id === TABS.aktiveId);
        return tab ? tab.titel : "Quizz";
    }
};
