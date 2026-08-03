/*
 * test-bildschirm.js — lässt den Bildschirm-Code gegen ein NACHGEBAUTES DOM laufen.
 *
 * Warum es diese Datei gibt: Die übrigen Tests prüfen Regeln und Daten. Fehler
 * im Bildschirm-Code (ein falsch geschriebener Aufruf, ein Feld, das es nicht
 * mehr gibt) fallen dort nicht auf — sie fliegen erst im Browser auseinander,
 * beim Klick. Genau so blieb in v1.2 ein ganzer Tab leer.
 *
 * Hier wird deshalb ein winziges DOM nachgebaut (nur so viel, wie der Code
 * anfasst) und jeder Bildschirm einmal gezeichnet: die Übersicht, jede
 * Spielart, eine beendete Partie, die Rangliste.
 *
 * WAS DIESER TEST NICHT KANN
 * Er sagt nichts über das Aussehen: keine Stildatei, keine echten Größen, keine
 * Farben. Er beantwortet nur die Frage „läuft der Code durch, ohne zu stolpern".
 * Die Prüfliste in docs\DEPLOYMENT.md ersetzt er nicht.
 *
 * Aufruf: siehe tests\README.md
 */

const pfad = require("path");
const dateisystem = require("fs");
const vm = require("vm");

const projekt = pfad.join(__dirname, "..");
const jsOrdner = pfad.join(projekt, "js");

let anzahlOk = 0;
let anzahlFehler = 0;

function pruefe(bezeichnung, funktion) {
    try {
        funktion();
        anzahlOk++;
    } catch (fehler) {
        anzahlFehler++;
        console.error("FEHLER: " + bezeichnung);
        console.error("        " + fehler.message);
    }
}

/*
 * Sucht das Brett im gerade gezeichneten Bereich.
 *
 * Nach Klasse statt nach Stelle: Über und um das Brett sind schon mehrfach
 * Sachen dazugekommen (Randbeschriftung, Rahmen), und jedes Mal brachen sonst
 * alle Tests auf einmal.
 */
function brettSuchen() {
    const suchen = (element) => {
        for (const kind of element.kinder || []) {
            if (kind.className === "brett" || kind.className === "brett brett-gedreht") {
                return kind;
            }
            const gefunden = suchen(kind);
            if (gefunden) {
                return gefunden;
            }
        }
        return null;
    };

    const brett = suchen(TEAM_SCHACH.wurzelEl);
    if (!brett) {
        throw new Error("kein Brett gezeichnet");
    }
    return brett;
}

/* ------------------------------------------------------------------ *
 * Das nachgebaute DOM
 *
 * Nur die Mitglieder, die der Bildschirm-Code wirklich benutzt. Wer dort
 * etwas Neues verwendet, muss es hier ergänzen — das ist Absicht: So bleibt
 * sichtbar, wie viel Browser die App überhaupt braucht.
 * ------------------------------------------------------------------ */

function neuesElement(tag) {
    const element = {
        tagName: tag,
        kinder: [],
        className: "",
        dataset: {},
        attribute: {},
        style: {
            setProperty(name, wert) { this[name] = wert; }
        },

        /* Eine Feldbreite ungleich null, damit die Zugbewegung wirklich läuft. */
        offsetWidth: 40,

        appendChild(kind) {
            this.kinder.push(kind);
            return kind;
        },

        classList: {
            liste: [],
            add(...namen) { this.liste.push(...namen); },
            remove(name) { this.liste = this.liste.filter((eintrag) => eintrag !== name); },
            toggle(name, an) { if (an) { this.add(name); } else { this.remove(name); } },

            /*
             * Prüft AUCH die Klassen aus `className`. Im Browser sind beide
             * dasselbe; hier waren sie es lange nicht, und ein Test hat
             * deshalb eine Klasse nicht gefunden, die sichtbar da war.
             */
            contains(name) {
                if (this.liste.indexOf(name) !== -1) {
                    return true;
                }
                const fest = this.besitzer ? String(this.besitzer.className || "") : "";
                return fest.split(" ").indexOf(name) !== -1;
            }
        },

        addEventListener(art, behandler) {
            this.hoerer = this.hoerer || {};
            this.hoerer[art] = behandler;
        },

        setAttribute(name, wert) { this.attribute[name] = wert; },

        /* Versteht genau zwei Sucharten: nach data-feld und nach einer Klasse. */
        querySelector(wahl) {
            const feld = wahl.match(/data-feld="(\d+)"/);
            const klasse = wahl.match(/^\.([a-z-]+)$/);

            const passt = (element) => {
                if (feld) {
                    return element.dataset && element.dataset.feld === feld[1];
                }
                if (klasse) {
                    return typeof element.className === "string"
                        && element.className.split(" ").indexOf(klasse[1]) !== -1;
                }
                return false;
            };

            const suchen = (element) => {
                for (const kind of element.kinder || []) {
                    if (passt(kind)) {
                        return kind;
                    }
                    const gefunden = suchen(kind);
                    if (gefunden) {
                        return gefunden;
                    }
                }
                return null;
            };

            return suchen(this);
        },

        querySelectorAll() { return []; },

        set innerHTML(wert) { this.kinder = []; },
        get innerHTML() { return ""; }
    };

    /* Eigene Liste je Element — sonst teilen sich alle dieselbe. Der
       Rückbezug lässt `contains` auch die Klassen aus `className` sehen. */
    element.classList = Object.assign({}, element.classList,
        { liste: [], besitzer: element });
    return element;
}

const umgebung = {
    console: console,
    document: {
        createElement: neuesElement,
        /* Für den Pfeil des letzten Zuges (SVG). Der Namensraum spielt hier
           keine Rolle — geprüft wird, dass der Code durchläuft. */
        createElementNS(namensraum, tag) { return neuesElement(tag); },
        addEventListener() { /* wird beim Zeichnen nicht gebraucht */ },
        hidden: false
    },
    window: {
        requestAnimationFrame(funktion) { funktion(); },
        setTimeout() { return 0; },
        localStorage: { getItem() { return null; }, setItem() { /* leer */ } }
    }
};
umgebung.globalThis = umgebung;
vm.createContext(umgebung);

/* Stellvertreter für die Teile, die hier nicht mitspielen. */
umgebung.ICH = {
    person: () => ({ id: "id-anna", name: "Anna" }),

    /* Der Gerätespeicher, so weit der Bildschirm ihn braucht. */
    _gesehen: {},
    abschlussGesehen(id) { return umgebung.ICH._gesehen[id] === true; },
    abschlussMerken(id) { umgebung.ICH._gesehen[id] = true; }
};
umgebung.DIALOG = { hinweis: async () => true, frage: async () => true };

/*
 * Alle Dateien in EINEM Lauf übersetzen: Ein `const` auf oberster Ebene gehört
 * zum Bereich des jeweiligen Skripts, nicht zum globalen Objekt. Getrennte
 * Läufe sähen sich also gegenseitig nicht — mehrere script-Blöcke im Browser
 * sehr wohl. Am Ende werden die Bausteine global bereitgestellt, damit dieser
 * Test sie greifen kann.
 */
const bausteinNamen = ["MODELL", "SCHACH_VARIANTEN", "SCHACH", "SCHACH_RUNDE",
    "SCHACH_TAFEL", "TEAM_SCHACH", "IMPOSTER_WOERTER", "IMPOSTER_RUNDE", "IMPOSTER",
    "RANGLISTE"];

const dateien = ["konfig.js", "modell.js", "schach-varianten.js", "schach.js",
    "schach-runde.js", "schach-tafel.js", "team-schach.js", "imposter-woerter.js",
    "imposter-runde.js", "imposter.js", "rangliste.js"];

const quelltext = dateien
    .map((name) => dateisystem.readFileSync(pfad.join(jsOrdner, name), "utf8"))
    .join("\n;\n")
    + "\n" + bausteinNamen.map((name) => "globalThis." + name + " = " + name + ";").join("\n");

vm.runInContext(quelltext, umgebung, { filename: "alle.js" });

const MODELL = umgebung.MODELL;
const SCHACH = umgebung.SCHACH;
const SCHACH_VARIANTEN = umgebung.SCHACH_VARIANTEN;
const SCHACH_RUNDE = umgebung.SCHACH_RUNDE;
const SCHACH_TAFEL = umgebung.SCHACH_TAFEL;
const TEAM_SCHACH = umgebung.TEAM_SCHACH;
const IMPOSTER_RUNDE = umgebung.IMPOSTER_RUNDE;
const IMPOSTER = umgebung.IMPOSTER;
const RANGLISTE = umgebung.RANGLISTE;

/* ------------------------------------------------------------------ *
 * Ausgangslage: zwei Mitspieler, je eine laufende Partie pro Spielart
 * ------------------------------------------------------------------ */

let quizzDaten = MODELL.leereDaten(1000);
quizzDaten = MODELL.spielerHinzufuegen(quizzDaten, "Anna", "id-anna", 1000);
quizzDaten = MODELL.spielerHinzufuegen(quizzDaten, "Bert", "id-bert", 1000);
umgebung.WUERFEL_QUIZZ = { abgleich: { daten: quizzDaten } };

let tafel = SCHACH_TAFEL.leereTafel(1000);
const kennungen = {};
let zeitpunkt = 2000;

for (const variante of SCHACH_VARIANTEN.liste) {
    zeitpunkt += 10;
    const angelegt = SCHACH_TAFEL.partieAnlegen(tafel, variante.id, variante.titel, zeitpunkt);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", zeitpunkt);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", zeitpunkt);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, zeitpunkt);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, zeitpunkt);

    tafel = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, zeitpunkt);
    kennungen[variante.id] = partie.id;
}

TEAM_SCHACH.abgleich = { daten: tafel, speicher: { art: "lokal" } };
TEAM_SCHACH.aufbauen(neuesElement("div"));

/* ------------------------------------------------------------------ *
 * Team Schach
 * ------------------------------------------------------------------ */

pruefe("Die Uebersicht der Partien zeichnet", () => {
    TEAM_SCHACH.zeichnen(tafel);
    if (TEAM_SCHACH.wurzelEl.kinder.length === 0) {
        throw new Error("nichts gezeichnet");
    }
});

for (const variante of SCHACH_VARIANTEN.liste) {
    pruefe("Die Partie zeichnet in der Spielart " + variante.id, () => {
        TEAM_SCHACH.partieOeffnen(kennungen[variante.id]);

        /* Kopf, Standleiste, Teams, Brett, Verlauf, Fussleiste. */
        if (TEAM_SCHACH.wurzelEl.kinder.length < 6) {
            throw new Error("nur " + TEAM_SCHACH.wurzelEl.kinder.length + " Bereiche gezeichnet");
        }
    });
}

pruefe("Das Brett hat so viele Felder wie die Spielart Stellen", () => {
    for (const variante of SCHACH_VARIANTEN.liste) {
        TEAM_SCHACH.partieOeffnen(kennungen[variante.id]);

        const brett = brettSuchen();
        const erwartet = variante.breite * variante.hoehe;

        /* Neben den Feldern kann der Pfeil des letzten Zuges im Brett liegen —
           gezählt werden nur Felder. */
        const felder = brett.kinder.filter((kind) => kind.dataset
            && kind.dataset.feld !== undefined).length;

        if (felder !== erwartet) {
            throw new Error(variante.id + ": erwartet " + erwartet
                + " Felder, waren " + felder);
        }
    }
});

pruefe("Die Auswahl der Spielart zeigt je eine Kachel mit Vorschaubild", () => {
    TEAM_SCHACH.partieAnlegen();

    if (!TEAM_SCHACH.auswahlOffen) {
        throw new Error("Auswahl nicht geoeffnet");
    }

    /* Nach Klasse suchen statt nach Stelle — sonst kippt der Test, sobald
       darüber etwas dazukommt (wie die Einstellungen in v2.5). */
    const feld = TEAM_SCHACH.wurzelEl.kinder.find(
        (kind) => kind.className === "spielart-feld");

    if (!feld) {
        throw new Error("kein Kachelfeld gezeichnet");
    }
    /* Versteckte Spielarten (etwa „Fähigkeiten sammeln" seit v2.9) stehen
       nicht mehr zur Auswahl, bleiben aber gültig. */
    const auswahl = SCHACH_VARIANTEN.zurAuswahl();

    if (auswahl.length >= SCHACH_VARIANTEN.liste.length) {
        throw new Error("keine Spielart ist versteckt — Test veraltet?");
    }
    if (feld.kinder.length !== auswahl.length) {
        throw new Error("erwartet " + auswahl.length
            + " Kacheln, waren " + feld.kinder.length);
    }

    /* Jedes Vorschaubild hat so viele Felder wie das Brett der Spielart. */
    for (let stelle = 0; stelle < auswahl.length; stelle++) {
        const variante = auswahl[stelle];
        const vorschau = feld.kinder[stelle].kinder[0];
        const erwartet = variante.breite * variante.hoehe;

        if (vorschau.kinder.length !== erwartet) {
            throw new Error(variante.id + ": Vorschau mit " + vorschau.kinder.length
                + " statt " + erwartet + " Feldern");
        }
    }

    TEAM_SCHACH.auswahlSchliessen();
    if (TEAM_SCHACH.auswahlOffen) {
        throw new Error("Auswahl nicht geschlossen");
    }
});

pruefe("Der Koenig macht den eigenen Turm zum Rochade-Ziel", () => {
    /* Eine eigene Partie mit freier Grundreihe. */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Rochade", 4000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 4000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 4000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 4000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 4000);

    /* Freie Grundreihe: Koenig auf e1, Tuerme auf a1 und h1. */
    partie.stand = SCHACH.standNormalisieren({
        brett: "....k..."
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "........"
            + "T...K..T",
        amZug: "weiss",
        rochade: "KD"
    });

    const tafel = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 4000);
    TEAM_SCHACH.abgleich.daten = tafel;
    TEAM_SCHACH.partieOeffnen(partie.id);

    const person = { id: "id-anna", name: "Anna" };
    const offene = SCHACH_TAFEL.partie(tafel, partie.id);

    TEAM_SCHACH.feldAngetippt(offene, person, SCHACH.feldNummer("e1"));

    const turmKurz = SCHACH.feldNummer("h1");
    if (TEAM_SCHACH.rochadeZiele[turmKurz] !== SCHACH.feldNummer("g1")) {
        throw new Error("der Turm h1 fuehrt nicht auf g1");
    }

    const turmLang = SCHACH.feldNummer("a1");
    if (TEAM_SCHACH.rochadeZiele[turmLang] !== SCHACH.feldNummer("c1")) {
        throw new Error("der Turm a1 fuehrt nicht auf c1");
    }
});

/* Sucht den Pfeil im gerade gezeichneten Brett. */
function pfeilImBrett() {
    const brett = brettSuchen();
    return brett.kinder.find((kind) => kind.attribute
        && kind.attribute["class"] === "zug-pfeil") || null;
}

pruefe("Ohne Zug gibt es keinen Pfeil, nach einem Zug schon", () => {
    /* Eine eigene Partie, damit der Test nicht von der Reihenfolge abhaengt. */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Pfeil", 5000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 5000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 5000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 5000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 5000);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 5000);
    TEAM_SCHACH.partieOeffnen(partie.id);

    if (pfeilImBrett()) {
        throw new Error("ohne Zug darf kein Pfeil da sein");
    }

    const gezogen = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 5100);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, gezogen, 5100);
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    const pfeil = pfeilImBrett();
    if (!pfeil) {
        throw new Error("kein Pfeil gezeichnet");
    }

    /* Maske und maskierte Gruppe; die Striche stecken in der Gruppe. */
    const gruppe = pfeil.kinder.find((kind) => kind.tagName === "g");
    if (!gruppe) {
        throw new Error("keine maskierte Gruppe");
    }

    const maske = pfeil.kinder.find((kind) => kind.tagName === "mask");
    if (!maske) {
        throw new Error("keine Maske — der Pfeil wuerde die Figuren ueberdecken");
    }

    /* Zwei Lagen aus je Strich und Spitze. */
    if (gruppe.kinder.length !== 4) {
        throw new Error("Pfeil hat " + gruppe.kinder.length + " Teile statt 4");
    }

    /*
     * Ein Loch je besetztem Feld, dazu die weisse Grundfläche — ABER nicht für
     * Start und Ziel: Dort bleibt der Pfeil ganz. Nach 1. e4 stehen 31 Figuren
     * auf anderen Feldern (32 minus dem Bauern auf e4), macht 32 Teile.
     */
    if (maske.kinder.length !== 32) {
        throw new Error("Maske hat " + maske.kinder.length + " Teile statt 32");
    }

    /* Und auf dem Zielfeld darf kein Loch sitzen. */
    const ziel = pfeilImBrett && SCHACH.feldNummer("e4");
    const punkte = maske.kinder
        .filter((kind) => kind.tagName === "circle")
        .map((kind) => kind.attribute.cx + "/" + kind.attribute.cy);

    if (punkte.indexOf("4.5/4.5") !== -1) {
        throw new Error("das Zielfeld e4 ist maskiert — der Pfeil waere abgeschnitten");
    }
    if (ziel < 0) {
        throw new Error("Zielfeld nicht gefunden");
    }
});

pruefe("Eine Figur antippen zeigt ihre Ziele", () => {
    TEAM_SCHACH.partieOeffnen(kennungen.standard);
    const partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.standard);

    TEAM_SCHACH.feldAngetippt(partie, { id: "id-anna", name: "Anna" },
        SCHACH.feldNummer("e2"));

    if (TEAM_SCHACH.moeglicheZiele.length !== 2) {
        throw new Error("erwartet 2 Ziele, waren " + TEAM_SCHACH.moeglicheZiele.length);
    }
});

pruefe("Nach einem Zug laeuft die Bewegung — und nur einmal", () => {
    TEAM_SCHACH.partieOeffnen(kennungen.standard);

    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.standard);
    partie = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 3000);

    const neueTafel = SCHACH_TAFEL.partieEinsetzen(TEAM_SCHACH.abgleich.daten, partie, 3000);
    TEAM_SCHACH.abgleich.daten = neueTafel;
    TEAM_SCHACH.zeichnen(neueTafel);

    const zielfeld = "[data-feld=\"" + SCHACH.feldNummer("e4") + "\"]";
    const zelle = TEAM_SCHACH.wurzelEl.querySelector(zielfeld);
    if (!zelle) {
        throw new Error("Zielfeld nicht gezeichnet");
    }

    const figur = zelle.kinder[0];
    if (!figur || !figur.classList.contains("figur-zieht")) {
        throw new Error("Bewegung nicht ausgeloest");
    }
    if (figur.style.transform !== "") {
        throw new Error("Verschiebung nicht zurueckgenommen");
    }

    /* Gezeichnet wird alle drei Sekunden — die Bewegung darf sich dabei nicht
       wiederholen. Dafuer gibt es TEAM_SCHACH.animiertBis. */
    TEAM_SCHACH.zeichnen(neueTafel);
    const nochmal = TEAM_SCHACH.wurzelEl.querySelector(zielfeld).kinder[0];
    if (nochmal.classList.contains("figur-zieht")) {
        throw new Error("Bewegung wiederholt sich bei jedem Zeichnen");
    }
});

pruefe("Eine Partie mit Wuerfel und eingesammelter Faehigkeit zeichnet", () => {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.faehigkeiten);

    /* Ein Würfel auf c4, ein zweiter bleibt liegen — beides muss gezeichnet
       werden: der eingesammelte im Vorrat, der liegende auf dem Brett. */
    partie.bonus.push({ feld: SCHACH.feldNummer("c4"), art: "erdbeben" });
    partie.bonus.push({ feld: SCHACH.feldNummer("e5"), art: "sprung" });

    partie = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("c2"), SCHACH.feldNummer("c4"), "D", "Anna", 3100);

    if (partie.faehigkeiten.weiss.length !== 1) {
        throw new Error("Faehigkeit nicht eingesammelt");
    }
    if (partie.bonus.length !== 1) {
        throw new Error("der zweite Wuerfel muss liegen bleiben");
    }

    const neueTafel = SCHACH_TAFEL.partieEinsetzen(TEAM_SCHACH.abgleich.daten, partie, 3100);
    TEAM_SCHACH.abgleich.daten = neueTafel;
    TEAM_SCHACH.partieOeffnen(kennungen.faehigkeiten);
});

pruefe("Wer verliert, bekommt den Abschluss-Bildschirm", () => {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.klein);
    partie = SCHACH_RUNDE.aufgeben(partie, "weiss", 3200);

    const neueTafel = SCHACH_TAFEL.partieEinsetzen(TEAM_SCHACH.abgleich.daten, partie, 3200);
    TEAM_SCHACH.abgleich.daten = neueTafel;
    TEAM_SCHACH.partieOeffnen(kennungen.klein);

    /* Anna spielt Weiss und hat aufgegeben — sie sieht den Verlierer-Schirm. */
    if (!TEAM_SCHACH.abschluss || TEAM_SCHACH.abschluss.schritt !== 1) {
        throw new Error("kein Abschluss-Bildschirm");
    }

    const flaeche = TEAM_SCHACH.wurzelEl.kinder[0];
    if (!flaeche.classList.contains("abschluss-niederlage")) {
        throw new Error("nicht als Niederlage gezeichnet");
    }

    /* Zweiter Schritt: der Punktestand. */
    TEAM_SCHACH.abschluss.schritt = 2;
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    if (!TEAM_SCHACH.wurzelEl.kinder[0].classList.contains("abschluss-stand")) {
        throw new Error("kein Punktestand");
    }

    /* Danach zurück in die Übersicht — und nicht wieder von vorn. */
    TEAM_SCHACH.abschlussSchliessen(kennungen.klein);

    if (TEAM_SCHACH.abschluss || TEAM_SCHACH.offeneId) {
        throw new Error("Abschluss nicht geschlossen");
    }

    TEAM_SCHACH.partieOeffnen(kennungen.klein);
    if (TEAM_SCHACH.abschluss) {
        throw new Error("der Abschluss darf nicht erneut kommen");
    }
    TEAM_SCHACH.offeneId = "";
});

pruefe("Beendete Partien stehen nicht mehr zwischen den offenen", () => {
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    /* Kopf, dann die offenen Karten, dann der zugeklappte Kasten. */
    const kasten = TEAM_SCHACH.wurzelEl.kinder.find((kind) => kind.tagName === "details");
    if (!kasten) {
        throw new Error("kein Kasten fuer beendete Partien");
    }
    const beschriftung = String(kasten.kinder[0].textContent || "");
    if (beschriftung.indexOf("Beendet") === -1) {
        throw new Error("Kasten falsch beschriftet: " + beschriftung);
    }
});

pruefe("Ein Wuerfel auf dem Brett wird gezeichnet", () => {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.faehigkeiten);
    partie = SCHACH_RUNDE.kopieren(partie);
    partie.bonus.push({ feld: SCHACH.feldNummer("d5"), art: "erdbeben" });

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, partie, 3150);
    TEAM_SCHACH.partieOeffnen(partie.id);

    const zelle = TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("d5") + "\"]");
    if (!zelle) {
        throw new Error("Feld nicht gezeichnet");
    }

    const wuerfel = zelle.kinder.find((kind) => kind.attribute
        && kind.attribute["class"] === "wuerfel");
    if (!wuerfel) {
        throw new Error("kein Wuerfel auf dem Feld");
    }
    /* Drei Seitenflächen und das Fragezeichen. */
    if (wuerfel.kinder.length !== 4) {
        throw new Error("Wuerfel hat " + wuerfel.kinder.length + " Teile statt 4");
    }
});

pruefe("Wartet eine Faehigkeit auf ihr Ziel, sind die Felder markiert", () => {
    const partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.faehigkeiten);
    const felder = SCHACH_RUNDE.zielFelder(partie, "id-anna", "verstaerkung");

    if (felder.length !== 8) {
        throw new Error("erwartet 8 eigene Bauern, waren " + felder.length);
    }

    TEAM_SCHACH.zielFaehigkeit = "verstaerkung";
    TEAM_SCHACH.zielFelder = felder;
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    const zelle = TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("e2") + "\"]");
    if (!zelle || !zelle.classList.contains("feld-wahl")) {
        throw new Error("das Zielfeld ist nicht markiert");
    }

    TEAM_SCHACH._auswahlAufheben();
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
});

pruefe("Die Faehigkeiten-Uebersicht zeigt jede Stufe mit ihren Eintraegen", () => {
    TEAM_SCHACH.faehigkeitenOeffnen();

    const karten = TEAM_SCHACH.wurzelEl.kinder.filter(
        (kind) => String(kind.className || "").indexOf("stufen-karte") !== -1);

    if (karten.length !== SCHACH_VARIANTEN.STUFEN.length) {
        throw new Error("erwartet " + SCHACH_VARIANTEN.STUFEN.length
            + " Stufen, waren " + karten.length);
    }

    /* Je Stufe: Kopfzeile, die Fähigkeiten und der Unglückswürfel. */
    for (let stelle = 0; stelle < karten.length; stelle++) {
        const stufe = SCHACH_VARIANTEN.STUFEN[stelle];
        const eintraege = karten[stelle].kinder.filter(
            (kind) => String(kind.className || "").indexOf("stufen-eintrag") !== -1);

        const erwartet = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id).length + 1;
        if (eintraege.length !== erwartet) {
            throw new Error(stufe.id + ": " + eintraege.length + " Eintraege statt " + erwartet);
        }

        const pech = eintraege.find(
            (kind) => String(kind.className || "").indexOf("stufen-pech") !== -1);
        if (!pech) {
            throw new Error(stufe.id + ": kein Unglueckswuerfel");
        }
    }

    TEAM_SCHACH.infoSchliessen();
    if (TEAM_SCHACH.infoOffen) {
        throw new Error("Uebersicht nicht geschlossen");
    }
});

pruefe("Ein Unglueckswuerfel traegt ein umgedrehtes Fragezeichen", () => {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.faehigkeiten);
    partie = SCHACH_RUNDE.kopieren(partie);
    /* Ein noch freies Feld — auf d5 liegt aus einem frueheren Test schon einer,
       und je Feld gilt der erste Eintrag. */
    partie.bonus.push({ feld: SCHACH.feldNummer("g5"), art: "erdrutsch", pech: true });

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, partie, 5500);
    TEAM_SCHACH.partieOeffnen(partie.id);

    const zelle = TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("g5") + "\"]");
    const wuerfel = zelle.kinder.find((kind) => kind.attribute
        && kind.attribute["class"] === "wuerfel");

    if (!wuerfel) {
        throw new Error("kein Wuerfel");
    }

    const zeichen = wuerfel.kinder.find((kind) => kind.tagName === "text");
    if (!zeichen || !zeichen.attribute.transform) {
        throw new Error("das Fragezeichen steht nicht auf dem Kopf");
    }

    /* Und der Titel verraet weiterhin nicht, was drin ist. */
    if (String(zelle.title).indexOf("Erdrutsch") !== -1) {
        throw new Error("der Titel verraet den Inhalt");
    }
});

pruefe("Wer nicht am Zug ist, kann das Brett nicht bedienen", () => {
    /*
     * Vorzuege gibt es seit v2.8 nicht mehr (siehe docs\DECISIONS.md). Das
     * Brett ist gesperrt, solange das eigene Team nicht am Zug ist.
     */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Wartend", 6000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 6000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 6000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 6000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 6000);
    partie = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("a2"), SCHACH.feldNummer("a3"), "D", "Anna", 6100);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 6100);
    TEAM_SCHACH.partieOeffnen(partie.id);

    const person = { id: "id-anna", name: "Anna" };
    const offene = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, partie.id);

    if (SCHACH_RUNDE.darfZiehen(offene, person.id)) {
        throw new Error("Anna duerfte gar nicht ziehen");
    }

    TEAM_SCHACH.feldAngetippt(offene, person, SCHACH.feldNummer("e2"));
    if (TEAM_SCHACH.gewaehltesFeld !== -1 || TEAM_SCHACH.moeglicheZiele.length !== 0) {
        throw new Error("das Brett haette nicht reagieren duerfen");
    }

    /* Und die Felder sind gesperrt. */
    const zelle = TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("e2") + "\"]");
    if (!zelle.disabled) {
        throw new Error("das Feld ist nicht gesperrt");
    }

    TEAM_SCHACH.offeneId = "";
});

pruefe("Wird die offene Partie geloescht, landet man in der Uebersicht", () => {
    /* Genau die Partie öffnen, die gleich verschwindet. */
    TEAM_SCHACH.partieOeffnen(kennungen.klein);

    const neueTafel = SCHACH_TAFEL.partieEntfernen(
        TEAM_SCHACH.abgleich.daten, kennungen.klein, 3300);

    TEAM_SCHACH.abgleich.daten = neueTafel;
    TEAM_SCHACH.zeichnen(neueTafel);

    if (TEAM_SCHACH.offeneId !== "") {
        throw new Error("die geloeschte Partie gilt weiter als offen");
    }
});

pruefe("Ohne Anmeldung kommt der Hinweis statt eines Bretts", () => {
    umgebung.ICH.person = () => null;
    try {
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
        if (TEAM_SCHACH.wurzelEl.kinder.length !== 1) {
            throw new Error("erwartet genau einen Hinweis");
        }
    } finally {
        umgebung.ICH.person = () => ({ id: "id-anna", name: "Anna" });
    }
});

/* ------------------------------------------------------------------ *
 * Rangliste
 * ------------------------------------------------------------------ */

pruefe("Die Rangliste zeichnet mit Mitspielern", () => {
    RANGLISTE.aufbauen(neuesElement("div"));
    RANGLISTE.zeichnen();

    if (RANGLISTE.wurzelEl.kinder.length === 0) {
        throw new Error("nichts gezeichnet");
    }
});

pruefe("Die Rangliste zeichnet auch ohne Mitspieler", () => {
    umgebung.WUERFEL_QUIZZ.abgleich = { daten: MODELL.leereDaten(1000) };
    try {
        RANGLISTE.zeichnen();
    } finally {
        umgebung.WUERFEL_QUIZZ.abgleich = { daten: quizzDaten };
    }
});

pruefe("Die Rangliste zeichnet, bevor Daten da sind", () => {
    const gemerkt = TEAM_SCHACH.abgleich;
    TEAM_SCHACH.abgleich = null;
    try {
        RANGLISTE.zeichnen();
    } finally {
        TEAM_SCHACH.abgleich = gemerkt;
    }
});

/* ------------------------------------------------------------------ *
 * Imposter
 * ------------------------------------------------------------------ */

/* Der Tab braucht seinen eigenen Abgleich-Stellvertreter. */
IMPOSTER.aufbauen(neuesElement("div"));
IMPOSTER.verbinden({
    daten: IMPOSTER_RUNDE.leereRunde(1000),
    speicher: { art: "lokal" },
    aendern(neueDaten) { this.daten = neueDaten; }
});

/* Anna und Bert sitzen in derselben Runde; Anna ist dieses Gerät. */
function imposterMitZweien() {
    let runde = IMPOSTER_RUNDE.beitreten(IMPOSTER_RUNDE.leereRunde(1000), "id-anna", 1000);
    runde = IMPOSTER_RUNDE.beitreten(runde, "id-bert", 1000);
    return runde;
}

pruefe("Imposter: der Wartebildschirm zeichnet", () => {
    IMPOSTER.abgleich.daten = imposterMitZweien();
    IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);

    if (IMPOSTER.wurzelEl.kinder.length === 0) {
        throw new Error("nichts gezeichnet");
    }
});

pruefe("Imposter: die laufende Runde zeigt das Wort — oder die Rolle", () => {
    let runde = imposterMitZweien();
    runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-anna", true, 1000);
    runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-bert", true, 1000);
    runde = IMPOSTER_RUNDE.starten(runde, "testsalz", 2000);

    IMPOSTER.abgleich.daten = runde;
    IMPOSTER.zeichnen(runde);

    const kasten = IMPOSTER.wurzelEl.kinder[0];
    if (String(kasten.className).indexOf("imposter-wort") === -1) {
        throw new Error("kein Wortkasten");
    }

    const gezeigt = kasten.kinder[1].textContent;
    const istImposter = IMPOSTER_RUNDE.istImposter(runde, "id-anna");

    if (istImposter) {
        if (gezeigt !== "Imposter") {
            throw new Error("der Imposter sieht das Wort: " + gezeigt);
        }
    } else if (gezeigt !== IMPOSTER_RUNDE.wortVon(runde)) {
        throw new Error("das Wort fehlt");
    }
});

pruefe("Imposter: die Aufloesung zeichnet mit Punkten", () => {
    let runde = imposterMitZweien();
    runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-anna", true, 1000);
    runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-bert", true, 1000);
    runde = IMPOSTER_RUNDE.starten(runde, "testsalz", 2000);
    runde = IMPOSTER_RUNDE.fertigSetzen(runde, "id-anna", true, 3000);
    runde = IMPOSTER_RUNDE.fertigSetzen(runde, "id-bert", true, 3100);

    IMPOSTER.abgleich.daten = runde;
    IMPOSTER.zeichnen(runde);

    const kasten = IMPOSTER.wurzelEl.kinder[0];
    if (kasten.kinder[1].textContent !== IMPOSTER_RUNDE.wortVon(runde)) {
        throw new Error("das Wort wird nicht aufgeloest");
    }

    /* Die Punkte stehen in der Auflösungskarte. */
    const karte = IMPOSTER.wurzelEl.kinder.find(
        (kind) => kind.kinder.some((enkel) => enkel.textContent === "Auflösung"));

    if (!karte) {
        throw new Error("keine Aufloesung");
    }
});

pruefe("Imposter: ohne Anmeldung wird nur ein Hinweis gezeigt", () => {
    const gemerkt = umgebung.ICH.person;
    umgebung.ICH.person = () => null;

    try {
        IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);
        if (IMPOSTER.wurzelEl.kinder.length !== 1) {
            throw new Error("erwartet nur den Hinweis");
        }
    } finally {
        umgebung.ICH.person = gemerkt;
    }
});

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
