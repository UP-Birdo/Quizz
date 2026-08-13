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

/*
 * Die Zeilen der Fähigkeiten-Karte (eine je Farbe). Gesucht wird die Klasse,
 * nicht die Überschrift: Der sichtbare Text darf sich ändern, die Klasse trägt
 * die Bedeutung.
 */
function faehigkeitenZeilen() {
    const gefunden = [];
    const suchen = (element) => {
        for (const kind of element.kinder || []) {
            if (String(kind.className || "").indexOf("faehigkeit-zeile") !== -1) {
                gefunden.push(kind);
            }
            suchen(kind);
        }
    };

    suchen(TEAM_SCHACH.wurzelEl);
    return gefunden;
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

        /* Beide seit v0.44: Die Bildanleitung tauscht ihr Brett beim Weiter-
           schalten aus, und ein zugeklappter Bibliothekseintrag raeumt seinen
           Inhalt weg (damit sein Takt aufhoert). */
        removeChild(kind) {
            this.kinder = this.kinder.filter((eintrag) => eintrag !== kind);
            return kind;
        },

        replaceChild(neu, alt) {
            this.kinder = this.kinder.map((eintrag) => (eintrag === alt) ? neu : eintrag);
            return alt;
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

        /*
         * Löst ein gemerktes Ereignis aus — damit ein Test einen Fingertipp
         * nachstellen kann, statt die Behandlungsfunktion direkt aufzurufen.
         * Der Unterschied ist wichtig: So wird auch geprüft, dass der Knopf
         * überhaupt verdrahtet wurde.
         */
        ausloesen(art) {
            if (!this.hoerer || !this.hoerer[art]) {
                throw new Error("kein Behandler fuer " + art + " an diesem Element");
            }
            this.hoerer[art]({ preventDefault() { }, stopPropagation() { } });
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

/*
 * Ein `fetch`, das sich steuern laesst — fuer die Pruefung des Zeitlimits.
 * `haengt = true` heisst: Der Aufruf antwortet nie, wie im Funkloch.
 */
const netz = { haengt: false, abgebrochen: false, sofort: false };

async function fetchNachbau(adresse, einstellungen) {
    if (!netz.haengt) {
        return { ok: true, async json() { return {}; } };
    }

    const signal = einstellungen && einstellungen.signal;

    const abbruchFehler = () => {
        netz.abgebrochen = true;
        const fehler = new Error("abgebrochen");
        fehler.name = "AbortError";
        return fehler;
    };

    /*
     * WICHTIG: Das Signal kann SCHON abgebrochen sein, bevor fetch ueberhaupt
     * gerufen wird — im Test feuert der Zeitgeber sofort. Echtes fetch lehnt
     * dann unmittelbar ab; ohne diese Zeile wartete der Nachbau auf ein
     * Ereignis, das nie mehr kommt, und der ganze Testlauf endete still.
     */
    if (signal && signal.aborted) {
        throw abbruchFehler();
    }

    return new Promise((_, ablehnen) => {
        if (!signal) {
            return;
        }
        signal.addEventListener("abort", () => ablehnen(abbruchFehler()));
    });
}

const umgebung = {
    console: console,
    fetch: fetchNachbau,
    AbortController: AbortController,
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
        /*
         * Zeitgeber laufen normalerweise NIE ab — sonst ruft sich die Uhr des
         * Imposter-Raums endlos selbst auf. Nur wo ein Test es ausdruecklich
         * verlangt (`netz.sofort`), feuert der Zeitgeber sofort: So muss die
         * Pruefung des Zeitlimits nicht acht Sekunden warten und loest den
         * Abbruch trotzdem echt aus.
         */
        setTimeout(funktion) {
            if (netz.sofort && typeof funktion === "function") { funktion(); }
            return 0;
        },
        clearTimeout() { /* nichts zu tun */ },

        /*
         * Der Takt der Bildanleitung (seit v0.41). Er feuert hier NIE: Geprüft
         * wird, dass die Anleitung entsteht und der Takt sauber angemeldet und
         * wieder beendet wird — nicht, wie sie aussieht, wenn sie läuft.
         */
        setInterval() { return 0; },
        clearInterval() { /* nichts zu tun */ },

        /* Ohne Angabe gilt: normale Bewegung erlaubt. */
        matchMedia() { return { matches: false }; },
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
    abschlussMerken(id) { umgebung.ICH._gesehen[id] = true; },

    /* Verwaltungs-Zugang: Seit v3.7 haengt der Bibliotheks-Knopf im Imposter
       daran. Standardmaessig aus — ein Test schaltet ihn gezielt ein. */
    _verwaltung: false,
    verwaltungAktiv() { return umgebung.ICH._verwaltung === true; },
    verwaltungSetzen(an) { umgebung.ICH._verwaltung = (an === true); }
};
/*
 * Die Dialoge sagen immer ab: `eingabe` und `liste` liefern null. So laufen
 * Abläufe, die etwas erfragen, sauber in ihren Abbruch-Zweig — geprüft wird
 * hier, dass der Bildschirm-Code durchläuft, nicht der Dialog selbst.
 */
umgebung.DIALOG = {
    hinweis: async () => true,
    frage: async () => true,
    eingabe: async () => null,
    liste: async () => null
};

/*
 * Alle Dateien in EINEM Lauf übersetzen: Ein `const` auf oberster Ebene gehört
 * zum Bereich des jeweiligen Skripts, nicht zum globalen Objekt. Getrennte
 * Läufe sähen sich also gegenseitig nicht — mehrere script-Blöcke im Browser
 * sehr wohl. Am Ende werden die Bausteine global bereitgestellt, damit dieser
 * Test sie greifen kann.
 */
const bausteinNamen = ["MODELL", "SCHACH_VARIANTEN", "SCHACH", "SCHACH_RUNDE",
    "SCHACH_TAFEL", "SCHACH_VORSCHAU", "TEAM_SCHACH", "IMPOSTER_WOERTER",
    "IMPOSTER_RUNDE", "IMPOSTER_TAFEL", "IMPOSTER", "RANGLISTE", "SpeicherGemeinsam"];

/* Die Reihenfolge ist dieselbe wie in index.html — die drei team-schach-Teile
   ergänzen das Objekt und müssen nach ihm kommen. */
const dateien = ["konfig.js", "modell.js", "speicher.js", "schach-varianten.js",
    "schach.js", "schach-runde.js", "schach-tafel.js", "schach-vorschau.js",
    "team-schach.js",
    "team-schach-uebersicht.js", "team-schach-brett.js", "team-schach-auswertung.js",
    "imposter-woerter.js", "imposter-runde.js", "imposter-tafel.js", "imposter.js",
    "rangliste.js"];

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
const IMPOSTER_TAFEL = umgebung.IMPOSTER_TAFEL;
const IMPOSTER = umgebung.IMPOSTER;
const RANGLISTE = umgebung.RANGLISTE;
const SpeicherGemeinsam = umgebung.SpeicherGemeinsam;

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

/*
 * Der Abgleich-Stellvertreter. `eigenerVorgangBeginnt`/`-Endet` gehoeren dazu,
 * seit der Bildschirm seine eigenen Schreibvorgaenge anmeldet (v3.8) — der
 * echte Abgleich haelt damit die regelmaessige Abfrage an.
 */
TEAM_SCHACH.abgleich = {
    daten: tafel,
    speicher: { art: "lokal" },
    vorgaenge: 0,
    eigenerVorgangBeginnt() { this.vorgaenge++; },
    eigenerVorgangEndet() { this.vorgaenge = Math.max(0, this.vorgaenge - 1); }
};
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

    /*
     * SEIT v0.63 ZEIGT DAS FELD NUR DIE SPIELARTEN EINER FORM (Wunsch #22).
     * Geprueft wird deshalb Form fuer Form — und am Ende, dass die drei
     * zusammen jede sichtbare Spielart abdecken. Sonst koennte eine neue
     * Spielart ohne Form in keiner Liste landen und waere unerreichbar.
     */
    let gesehen = 0;

    for (const form of SCHACH_VARIANTEN.FORMEN) {
        TEAM_SCHACH.gewaehlteForm = form.id;
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

        const dieses = TEAM_SCHACH.wurzelEl.kinder.find(
            (kind) => kind.className === "spielart-feld");
        const erwartete = SCHACH_VARIANTEN.zurAuswahlNachForm(form.id);

        if (dieses.kinder.length !== erwartete.length) {
            throw new Error(form.id + ": erwartet " + erwartete.length
                + " Kacheln, waren " + dieses.kinder.length);
        }
        if (erwartete.length === 0) {
            throw new Error(form.id + ": keine einzige Spielart");
        }
        gesehen += erwartete.length;

        /* Jedes Vorschaubild hat so viele Felder wie das Brett der Spielart. */
        for (let stelle = 0; stelle < erwartete.length; stelle++) {
            const variante = erwartete[stelle];
            const vorschau = dieses.kinder[stelle].kinder[0];
            const erwartet = variante.breite * variante.hoehe;

            if (vorschau.kinder.length !== erwartet) {
                throw new Error(variante.id + ": Vorschau mit " + vorschau.kinder.length
                    + " statt " + erwartet + " Feldern");
            }
        }
    }

    if (gesehen !== auswahl.length) {
        throw new Error("die Formen zeigen " + gesehen + " von " + auswahl.length
            + " Spielarten — eine hat keine passende Form");
    }

    TEAM_SCHACH.gewaehlteForm = "klassisch";
    TEAM_SCHACH.auswahlSchliessen();
    if (TEAM_SCHACH.auswahlOffen) {
        throw new Error("Auswahl nicht geschlossen");
    }
});

pruefe("Die Rochade steht als Zugpunkt beim Koenig", () => {
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

    /*
     * SEIT v0.44 GIBT ES NUR NOCH EINEN WEG: Koenig antippen, Zugpunkt
     * antippen. Das Turmfeld ist kein eigener Knopf mehr (`rochadeZiele` ist
     * ausgebaut) — der Rochadezug steht als ganz normaler Koenigszug in den
     * moeglichen Zielen.
     */
    if (TEAM_SCHACH.moeglicheZiele.indexOf(SCHACH.feldNummer("g1")) === -1) {
        throw new Error("die kurze Rochade fehlt unter den Zielen");
    }
    if (TEAM_SCHACH.moeglicheZiele.indexOf(SCHACH.feldNummer("c1")) === -1) {
        throw new Error("die lange Rochade fehlt unter den Zielen");
    }
    if (TEAM_SCHACH.moeglicheZiele.indexOf(SCHACH.feldNummer("h1")) !== -1
        || TEAM_SCHACH.moeglicheZiele.indexOf(SCHACH.feldNummer("a1")) !== -1) {
        throw new Error("das Turmfeld ist noch ein Ziel");
    }

    /* Und der Zugpunkt fuehrt die Rochade wirklich aus. */
    const gezogen = SCHACH_RUNDE.ziehen(offene, "id-anna",
        SCHACH.feldNummer("e1"), SCHACH.feldNummer("g1"), "D", "Anna", 4100);

    if (!gezogen || SCHACH.figurAuf(gezogen.stand, SCHACH.feldNummer("f1")) !== "T") {
        throw new Error("der Turm steht nach der Rochade nicht auf f1");
    }

    TEAM_SCHACH._auswahlAufheben();
});

/* Die Klassen eines Feldes im gerade gezeichneten Brett. */
function feldKlassen(feld) {
    const zelle = brettSuchen().kinder.find((kind) => kind.dataset
        && kind.dataset.feld === String(feld));

    if (!zelle) {
        throw new Error("Feld " + feld + " nicht im Brett");
    }
    return String(zelle.className || "").split(" ").concat(zelle.classList.liste);
}

pruefe("Ohne Zug gibt es keine Spur, nach einem Zug schon", () => {
    /* Eine eigene Partie, damit der Test nicht von der Reihenfolge abhaengt. */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Spur", 5000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 5000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 5000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 5000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 5000);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 5000);
    TEAM_SCHACH.partieOeffnen(partie.id);

    if (feldKlassen(SCHACH.feldNummer("e4")).indexOf("feld-spur") !== -1) {
        throw new Error("ohne Zug darf keine Spur da sein");
    }

    const gezogen = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("e2"), SCHACH.feldNummer("e4"), "D", "Anna", 5100);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, gezogen, 5100);
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    /* e2 und e4 sind die Enden, e3 liegt dazwischen. */
    for (const name of ["e2", "e3", "e4"]) {
        if (feldKlassen(SCHACH.feldNummer(name)).indexOf("feld-spur") === -1) {
            throw new Error(name + " gehoert zum Weg, ist aber nicht eingefaerbt");
        }
    }
    for (const name of ["e2", "e4"]) {
        if (feldKlassen(SCHACH.feldNummer(name)).indexOf("feld-spur-ende") === -1) {
            throw new Error(name + " ist ein Ende und muesste kraeftiger sein");
        }
    }
    if (feldKlassen(SCHACH.feldNummer("e3")).indexOf("feld-spur-ende") !== -1) {
        throw new Error("e3 ist kein Ende des Weges");
    }
    if (feldKlassen(SCHACH.feldNummer("d4")).indexOf("feld-spur") !== -1) {
        throw new Error("d4 liegt nicht auf dem Weg");
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
    /* „erdbeben" ist seit v0.54 ein UNGLUECKSwuerfel — als Faehigkeit auf dem
       Brett wuerde er sofort wirken statt eingesammelt zu werden. */
    partie.bonus.push({ feld: SCHACH.feldNummer("c4"), art: "nudelholz" });
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

pruefe("Anlegen und Loeschen melden sich beim Abgleich an (v0.52)", () => {
    /*
     * DER GEMELDETE FEHLER: „Wenn ich einen Raum erstelle, springe ich nicht
     * direkt rein — ich bleibe in dem Menue, wo man auf die Groesse tippt."
     *
     * Ursache war ein Rennen mit der regelmaessigen Abfrage: Sie lief waehrend
     * des Namensdialogs und des Speicherns weiter und ersetzte `abgleich.daten`
     * durch den Stand vom SERVER — ohne die eben angelegte Partie. Die eiserne
     * Regel dagegen heisst `eigenerVorgangBeginnt`; Zuege und der Imposter
     * halten sie seit v3.8, das Anlegen und das Loeschen nicht.
     *
     * Geprueft wird die ANMELDUNG, nicht der Bildschirm: Ein Test kann das
     * Rennen nicht zuverlaessig nachstellen, die Sperre dagegen schon. Gezaehlt
     * wird mit dem Stellvertreter aus dieser Datei.
     */
    const quelltext = String(TEAM_SCHACH.spielartGewaehlt)
        + String(TEAM_SCHACH.partieLoeschen);

    if (quelltext.indexOf("eigenerVorgangBeginnt") === -1) {
        throw new Error("Anlegen oder Loeschen meldet sich nicht an");
    }
    if (quelltext.indexOf("eigenerVorgangEndet") === -1) {
        throw new Error("die Anmeldung wird nicht wieder zurueckgenommen");
    }

    /* Und die Sperre zaehlt wirklich hoch und wieder herunter. */
    const abgleich = TEAM_SCHACH.abgleich;
    const vorher = abgleich.vorgaenge;

    abgleich.eigenerVorgangBeginnt();
    if (abgleich.vorgaenge !== vorher + 1) {
        throw new Error("Anmeldung zaehlt nicht hoch");
    }
    abgleich.eigenerVorgangEndet();
    if (abgleich.vorgaenge !== vorher) {
        throw new Error("Anmeldung wird nicht zurueckgenommen");
    }
});

pruefe("Das i beim Wuerfel-Haken fuehrt in die Bibliothek (v0.55)", () => {
    /*
     * „Ich meinte bei dem i neben Zufallswuerfel an das ganze Menue mit den
     * Faehigkeiten, welche es gibt, mit Animationen und co."
     *
     * Moeglich ist das ohne Umbau, weil `zeichnen` die Bibliothek VOR der
     * Spielart-Auswahl abfragt — und `infoSchliessen` bringt einen deshalb
     * genau dorthin zurueck. Genau das prueft dieser Test.
     */
    TEAM_SCHACH.partieAnlegen();
    TEAM_SCHACH.neueRegeln.faehigkeiten = true;

    TEAM_SCHACH.faehigkeitenOeffnen();

    if (!TEAM_SCHACH.infoOffen) {
        throw new Error("die Bibliothek ist nicht offen");
    }
    if (!TEAM_SCHACH.auswahlOffen) {
        throw new Error("die Spielart-Auswahl darf darunter offen bleiben");
    }

    /* Gezeichnet wird die Bibliothek, nicht die Auswahl. */
    const ueberschrift = TEAM_SCHACH.wurzelEl.kinder
        .find((kind) => String(kind.className || "").indexOf("partie-kopf") !== -1);
    if (!ueberschrift) {
        throw new Error("kein Kopf gezeichnet");
    }

    /* Und zurueck landet man wieder bei der Auswahl. */
    TEAM_SCHACH.infoSchliessen();
    if (TEAM_SCHACH.infoOffen) {
        throw new Error("die Bibliothek ist nicht zugegangen");
    }

    const feld = TEAM_SCHACH.wurzelEl.kinder
        .find((kind) => kind.className === "spielart-feld");
    if (!feld) {
        throw new Error("nach dem Zurueck fehlt die Spielart-Auswahl");
    }

    TEAM_SCHACH.auswahlSchliessen();
});

pruefe("Der Abschluss schluesselt die Punkte auf (v0.53)", () => {
    /*
     * „Beim Endscreen soll aufgelistet werden, mit Ueberschrift links und
     * rechts, wie viele Punkte man dadurch bekommen hat — und ganz oben gross
     * die Punktzahl."
     *
     * Geprueft wird, dass die grosse Zahl aus DERSELBEN Rechnung kommt wie die
     * Rangliste (frueher stand dort eine eigene Summe ohne die Beute) und dass
     * die Aufschluesselung Zeilen hat.
     */
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.klein);
    partie = SCHACH_RUNDE.kopieren(partie);
    partie.ergebnis = "weiss";

    const teil = RANGLISTE.schachPunkteJePartie(
        SCHACH_TAFEL._chronikEintrag(partie), "weiss");

    const liste = TEAM_SCHACH._aufschluesselungBauen(partie, "weiss", teil);
    const posten = liste.kinder.filter((kind) =>
        String(kind.className || "") === "abschluss-posten");

    if (posten.length < 2) {
        throw new Error("erwartet mindestens Mitspielen und Sieg, waren " + posten.length);
    }

    /* Jede Zeile hat links eine Sache und rechts einen Wert. */
    for (const zeile of posten) {
        if (zeile.kinder.length !== 2) {
            throw new Error("eine Zeile ohne zwei Spalten");
        }
    }

    /* Und die Summe stimmt mit der Rangliste ueberein. */
    if (teil.punkte !== RANGLISTE.PUNKTE_TEILNAHME + RANGLISTE.PUNKTE_SIEG + teil.beute) {
        throw new Error("die grosse Zahl passt nicht zur Rangliste");
    }
});

pruefe("Wer verliert, bekommt den Abschluss-Bildschirm", () => {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.klein);
    partie = SCHACH_RUNDE.aufgeben(partie, "weiss", 3200);

    const neueTafel = SCHACH_TAFEL.partieEinsetzen(TEAM_SCHACH.abgleich.daten, partie, 3200);
    TEAM_SCHACH.abgleich.daten = neueTafel;
    TEAM_SCHACH.partieOeffnen(kennungen.klein);

    /*
     * SEIT v0.61 KOMMT DIE RÜCKSCHAU ZUERST (Schritt 0, Wunsch #7): erst
     * WARUM es so ausging, dann Gewonnen/Verloren, dann der Punktestand.
     */
    if (!TEAM_SCHACH.abschluss || TEAM_SCHACH.abschluss.schritt !== 0) {
        throw new Error("kein Abschluss-Bildschirm");
    }

    if (!TEAM_SCHACH.wurzelEl.kinder[0].classList.contains("abschluss-rueckschau")) {
        throw new Error("die Rueckschau fehlt");
    }

    /* Erster Schritt weiter: Anna spielt Weiss und hat aufgegeben — sie sieht
       den Verlierer-Schirm. */
    TEAM_SCHACH.abschluss.schritt = 1;
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

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
    if (beschriftung.indexOf("beendeten Partien") === -1) {
        throw new Error("Kasten falsch beschriftet: " + beschriftung);
    }
});

/*
 * NUR DIE EIGENE HISTORIE (v0.59, Wunsch #8) — und mit Sieger und Verlierer
 * beschriftet (Wunsch #18).
 *
 * Anna spielt in jeder Partie mit; die beendete kleine Partie steht also in
 * ihrem Kasten. Wird sie aus beiden Teams entfernt, verschwindet der Kasten
 * ganz — die Partie selbst bleibt dabei in der Tafel stehen.
 */
pruefe("Die Historie zeigt nur eigene Partien, mit Sieger und Verlierer (v0.59)", () => {
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    const kastenSuchen = () => TEAM_SCHACH.wurzelEl.kinder
        .find((kind) => kind.tagName === "details");

    const kasten = kastenSuchen();
    if (!kasten) {
        throw new Error("kein Kasten fuer beendete Partien");
    }

    /* Irgendwo im Kasten steht, wer Sieger und wer Verlierer war. */
    let gefunden = "";
    const durchsuchen = (element) => {
        if (String(element.className || "").indexOf("team-namen") !== -1) {
            gefunden += String(element.textContent || "");
        }
        for (const kind of element.kinder || []) {
            durchsuchen(kind);
        }
    };
    durchsuchen(kasten);

    if (gefunden.indexOf("Sieger") === -1 || gefunden.indexOf("Verlierer") === -1) {
        throw new Error("Sieger/Verlierer fehlen: " + gefunden);
    }

    /* Ohne Anna in den Teams ist es nicht mehr ihre Partie. */
    const vorher = TEAM_SCHACH.abgleich.daten;
    let partie = SCHACH_RUNDE.kopieren(SCHACH_TAFEL.partie(vorher, kennungen.klein));
    partie.teams.weiss = [];
    partie.teams.schwarz = [];

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(vorher, partie, 3210);
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    if (kastenSuchen()) {
        throw new Error("fremde beendete Partie steht in der eigenen Historie");
    }

    /* Ausgangslage wiederherstellen — die folgenden Tests rechnen damit. */
    TEAM_SCHACH.abgleich.daten = vorher;
    TEAM_SCHACH.zeichnen(vorher);
});

pruefe("Ein Wuerfel auf dem Brett wird gezeichnet", () => {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.faehigkeiten);
    partie = SCHACH_RUNDE.kopieren(partie);
    partie.bonus.push({ feld: SCHACH.feldNummer("d5"), art: "nudelholz" });

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

/*
 * Der Fehler aus v3.3: Die Karte hing an der Spielart statt am Schalter der
 * Partie. Wer klassisch mit zugeschalteten Wuerfeln spielte, sah die Wuerfel
 * auf dem Brett, konnte das Eingesammelte aber nirgends einsetzen.
 */
pruefe("Klassisch mit zugeschalteten Wuerfeln zeigt die Faehigkeiten-Karte", () => {
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Klassisch mit Wuerfeln", 6100,
        { faehigkeiten: true, seltenheitZeigen: true, einigkeit: false });

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 6100);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 6100);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 6100);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 6100);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 6100);
    TEAM_SCHACH.partieOeffnen(partie.id);

    if (faehigkeitenZeilen().length === 0) {
        throw new Error("keine Faehigkeiten-Karte trotz eingeschalteter Wuerfel");
    }
});

pruefe("Klassisch ohne Wuerfel zeigt die Karte weiterhin nicht", () => {
    TEAM_SCHACH.partieOeffnen(kennungen.standard);

    if (faehigkeitenZeilen().length !== 0) {
        throw new Error("Faehigkeiten-Karte trotz abgeschalteter Wuerfel");
    }

    /* Ausgangslage fuer die folgenden Tests wiederherstellen. */
    TEAM_SCHACH.partieOeffnen(kennungen.faehigkeiten);
});

pruefe("Wartet eine Faehigkeit auf ihr Ziel, sind die Felder markiert", () => {
    /*
     * Eine frische, laufende Partie, in der Anna wirklich am Zug ist. Seit
     * v4.0 wirft der Bildschirm eine Auswahl weg, sobald man nicht (mehr)
     * ziehen darf — der Test muss also eine Lage herstellen, die es im echten
     * Ablauf auch gibt.
     */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "faehigkeiten", "Zielwahl", 9400);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 9400);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 9400);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 9400);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 9400);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 9400);

    /* Seit v0.56 wertet die Verstaerkung jede eigene Figur auf: 16 Steine
       minus dem einen Koenig, der stehen bleiben muss. */
    const felder = SCHACH_RUNDE.zielFelder(partie, "id-anna", "verstaerkung");
    if (felder.length !== 15) {
        throw new Error("erwartet 15 aufwertbare Figuren, waren " + felder.length);
    }

    TEAM_SCHACH.partieOeffnen(partie.id);
    TEAM_SCHACH.zielFaehigkeit = "verstaerkung";
    TEAM_SCHACH.zielFelder = felder;

    /* Die Auswahl gehoert zu DIESER Stellung — ohne den Zaehler wirft
       _auswahlPruefen sie beim naechsten Zeichnen weg (seit v4.0). */
    TEAM_SCHACH.auswahlZaehler = partie.zugZaehler;

    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    const zelle = TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("e2") + "\"]");
    if (!zelle || !zelle.classList.contains("feld-wahl")) {
        throw new Error("das Zielfeld ist nicht markiert");
    }

    TEAM_SCHACH._auswahlAufheben();
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
});

pruefe("Ein Tipp setzt den Vorschau-Kasten, statt sofort einzusetzen (v0.57)", () => {
    /*
     * BIS v0.56 WIRKTE DER ERSTE TIPP SOFORT. Bei Mauer (drei Felder) und
     * Frost (2x2) sah man dabei nie, WO die Wirkung landet. Jetzt setzt der
     * Tipp den Kasten, und ausgefuehrt wird ueber "Einsetzen" unter dem Brett.
     */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "faehigkeiten", "Vorschau", 9500);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 9500);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 9500);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 9500);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 9500);
    partie.faehigkeiten.weiss.push("mauer");

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 9500);
    TEAM_SCHACH.partieOeffnen(partie.id);

    TEAM_SCHACH.zielFaehigkeit = "mauer";
    TEAM_SCHACH.zielFelder = SCHACH_RUNDE.zielFelder(partie, "id-anna", "mauer");
    TEAM_SCHACH.auswahlZaehler = partie.zugZaehler;

    const mitte = SCHACH.feldNummer("d4");
    TEAM_SCHACH.feldAngetippt(partie, { id: "id-anna", name: "Anna" }, mitte);

    /* Der Tipp darf NICHTS eingesetzt haben — die Faehigkeit liegt noch da. */
    if (TEAM_SCHACH.zielVorschau !== mitte) {
        throw new Error("der Kasten liegt nicht auf dem angetippten Feld");
    }
    if (TEAM_SCHACH.zielUmriss.length !== SCHACH.MAUER_LAENGE) {
        throw new Error("erwartet " + SCHACH.MAUER_LAENGE + " Felder im Umriss, waren "
            + TEAM_SCHACH.zielUmriss.length);
    }

    /* Und die drei Felder tragen den Rahmen, aussen mit Kanten. */
    for (const name of ["c4", "d4", "e4"]) {
        const zelle = TEAM_SCHACH.wurzelEl.querySelector(
            "[data-feld=\"" + SCHACH.feldNummer(name) + "\"]");

        if (!zelle || !zelle.classList.contains("feld-vorschau")) {
            throw new Error(name + " traegt keinen Vorschau-Rahmen");
        }
        if (!zelle.classList.contains("kante-oben")) {
            throw new Error(name + " hat keine Oberkante");
        }
    }

    const links = TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("c4") + "\"]");
    if (!links.classList.contains("kante-links")) {
        throw new Error("das linke Ende hat keine linke Kante");
    }
    if (links.classList.contains("kante-rechts")) {
        throw new Error("innen darf keine Kante stehen");
    }

    TEAM_SCHACH._auswahlAufheben();
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
});

pruefe("Abbrechen raeumt den Vorschau-Kasten wieder weg (v0.57)", () => {
    TEAM_SCHACH.zielFaehigkeit = "mauer";
    TEAM_SCHACH.zielFelder = [1, 2, 3];
    TEAM_SCHACH.zielVorschau = 2;
    TEAM_SCHACH.zielUmriss = [1, 2, 3];

    TEAM_SCHACH.zielVerwerfen();

    if (TEAM_SCHACH.zielFaehigkeit !== "" || TEAM_SCHACH.zielVorschau !== -1
        || TEAM_SCHACH.zielUmriss.length !== 0) {
        throw new Error("nach dem Abbrechen liegt noch etwas herum");
    }
});

pruefe("Die Faehigkeiten-Uebersicht zeigt jede Stufe mit ihren Eintraegen", () => {
    TEAM_SCHACH.faehigkeitenOeffnen();

    const karten = TEAM_SCHACH.wurzelEl.kinder.filter(
        (kind) => String(kind.className || "").indexOf("stufen-karte") !== -1);

    if (karten.length !== SCHACH_VARIANTEN.STUFEN.length) {
        throw new Error("erwartet " + SCHACH_VARIANTEN.STUFEN.length
            + " Stufen, waren " + karten.length);
    }

    /*
     * Je Stufe: Kopfzeile, die Fähigkeiten und ALLE Unglückswürfel dieser
     * Stufe. „Alle" seit v0.41 — in der gewoehnlichen Stufe liegen zwei, und
     * der zweite fehlte bis dahin in der Bibliothek.
     */
    for (let stelle = 0; stelle < karten.length; stelle++) {
        const stufe = SCHACH_VARIANTEN.STUFEN[stelle];
        const eintraege = karten[stelle].kinder.filter(
            (kind) => String(kind.className || "").indexOf("stufen-eintrag") !== -1);

        const erwartet = SCHACH_VARIANTEN.faehigkeitenDerStufe(stufe.id).length
            + SCHACH_VARIANTEN.pechDerStufe(stufe.id).length;
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

/*
 * Der schwebende Zurück-Knopf (v0.59, Wunsch #5). Er hängt am Bildschirm statt
 * am Text — deshalb steht er als eigenes Kind unter der Wurzel und nicht im
 * Kopf. Wer ihn wegnimmt, macht die längste Ansicht der App wieder zur
 * Sackgasse für alle, die unten stehen.
 */
pruefe("Die Bibliothek hat einen schwebenden Zurueck-Knopf (v0.59)", () => {
    TEAM_SCHACH.faehigkeitenOeffnen();

    const schwebend = TEAM_SCHACH.wurzelEl.kinder.find(
        (kind) => String(kind.className || "").indexOf("schwebe-zurueck") !== -1);

    if (!schwebend) {
        throw new Error("kein schwebender Zurueck-Knopf");
    }

    /* Und er tut dasselbe wie der Knopf im Kopf. */
    schwebend.ausloesen("click");
    if (TEAM_SCHACH.infoOffen) {
        throw new Error("der schwebende Knopf schliesst die Bibliothek nicht");
    }
});

/* Der erste Eintrag der ersten Stufenkarte in der offenen Bibliothek. */
function ersterBibliothekEintrag() {
    const karte = TEAM_SCHACH.wurzelEl.kinder.find(
        (kind) => String(kind.className || "").indexOf("stufen-karte") !== -1);

    if (!karte) {
        throw new Error("keine Stufenkarte gezeichnet");
    }

    const eintrag = karte.kinder.find(
        (kind) => String(kind.className || "").indexOf("stufen-eintrag") !== -1);

    if (!eintrag) {
        throw new Error("kein Eintrag in der Stufenkarte");
    }
    return eintrag;
}

pruefe("Ein Eintrag der Bibliothek klappt seine Anleitung auf", () => {
    /*
     * v0.41: Der Eintrag SELBST ist der Knopf — wer auf die Fähigkeit tippt,
     * sieht ihre Bildanleitung. Gebaut wird sie erst dabei; alle 23 auf einmal
     * wären über zweitausend Elemente.
     */
    TEAM_SCHACH.faehigkeitenOeffnen();
    const eintrag = ersterBibliothekEintrag();

    const kopf = eintrag.kinder.find((kind) => kind.className === "stufen-kopf");
    if (!kopf || kopf.tagName !== "summary") {
        throw new Error("der Eintrag hat keine aufklappbare Kopfzeile");
    }

    /*
     * Zugeklappt steht die Ueberschrift da — und seit v0.47 die Zeichen der
     * Faehigkeit (Pluszeichen, Blitz). Die BESCHREIBUNG erst beim Aufklappen.
     */
    if (String(kopf.kinder[0].className || "").indexOf("stufen-name") === -1) {
        throw new Error("die Ueberschrift steht nicht zuerst");
    }
    for (const kind of kopf.kinder.slice(1)) {
        const klasse = String(kind.className
            || (kind.attribute && kind.attribute["class"]) || "");

        if (klasse.indexOf("faehigkeit-zeichen") === -1
            && klasse.indexOf("faehigkeit-blitz") === -1) {
            throw new Error("zugeklappt steht mehr als Ueberschrift und Zeichen da");
        }
    }
    if (eintrag.querySelector(".anleitung") || eintrag.querySelector(".stufen-text")) {
        throw new Error("der Inhalt steht schon da, bevor jemand aufklappt");
    }

    eintrag.open = true;
    eintrag.ausloesen("toggle");

    if (!eintrag.querySelector(".stufen-text")) {
        throw new Error("nach dem Aufklappen fehlt die Beschreibung");
    }
    /* Und die Erklaerung, was die Zeichen kosten (seit v0.47). */
    if (!eintrag.querySelector(".stufen-kosten")) {
        throw new Error("nach dem Aufklappen fehlt die Erklaerung zum Pluszeichen");
    }
    if (!eintrag.querySelector(".anleitung")) {
        throw new Error("nach dem Aufklappen fehlt die Anleitung");
    }
    if (TEAM_SCHACH.anleitungTakte.length === 0) {
        throw new Error("kein Takt angemeldet — die Anleitung liefe nicht");
    }
});

pruefe("Die Bibliothek wird nicht bei jeder Abfrage neu gezeichnet", () => {
    /*
     * Sie hängt an keinem Spielstand. Würde die regelmässige Abfrage sie neu
     * bauen, klappte jeder Eintrag alle drei Sekunden wieder zu und jede
     * Anleitung finge von vorn an.
     */
    const eintrag = ersterBibliothekEintrag();
    if (!eintrag.querySelector(".anleitung")) {
        throw new Error("Voraussetzung fehlt: der Eintrag ist nicht aufgeklappt");
    }

    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    if (ersterBibliothekEintrag() !== eintrag) {
        throw new Error("die Bibliothek wurde neu gebaut");
    }
    if (!eintrag.querySelector(".anleitung")) {
        throw new Error("die aufgeklappte Anleitung ist verschwunden");
    }

    /* Beim Schliessen wird sie sehr wohl neu gebaut. */
    TEAM_SCHACH.infoSchliessen();
    if (TEAM_SCHACH.anleitungTakte.length !== 0) {
        throw new Error("die Takte laufen weiter, obwohl neu gezeichnet wurde");
    }
});

pruefe("Es ist immer nur ein Eintrag aufgeklappt", () => {
    /*
     * v0.44: Wer die naechste Faehigkeit ansieht, hat die vorige hinter sich
     * gelassen. Ihr Inhalt wird weggeraeumt — daran merkt der Takt ihrer
     * Anleitung, dass er aufhoeren kann.
     */
    TEAM_SCHACH.faehigkeitenOeffnen();

    const karte = TEAM_SCHACH.wurzelEl.kinder.find(
        (kind) => String(kind.className || "").indexOf("stufen-karte") !== -1);
    const eintraege = karte.kinder.filter(
        (kind) => String(kind.className || "").indexOf("stufen-eintrag") !== -1);

    if (eintraege.length < 2) {
        throw new Error("zum Pruefen braucht es zwei Eintraege");
    }

    const erster = eintraege[0];
    const zweiter = eintraege[1];

    erster.open = true;
    erster.ausloesen("toggle");
    if (!erster.querySelector(".anleitung")) {
        throw new Error("der erste zeigt keine Anleitung");
    }

    zweiter.open = true;
    zweiter.ausloesen("toggle");

    if (erster.open) {
        throw new Error("der erste Eintrag ist noch offen");
    }
    if (erster.querySelector(".anleitung")) {
        throw new Error("die Anleitung des ersten steht noch da");
    }
    if (!zweiter.querySelector(".anleitung")) {
        throw new Error("der zweite zeigt keine Anleitung");
    }

    TEAM_SCHACH.infoSchliessen();
});

/*
 * Zeichnet einen Unglueckswuerfel auf g5 und liefert seine Zelle zurueck.
 * `pechZeigen` ist der Haken aus v0.49.
 */
function unglueckswuerfelZeichnen(pechZeigen, wann) {
    let partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.faehigkeiten);
    partie = SCHACH_RUNDE.kopieren(partie);
    partie.regeln.pechZeigen = pechZeigen;

    /* Ein noch freies Feld — auf d5 liegt aus einem frueheren Test schon einer,
       und je Feld gilt der erste Eintrag. */
    if (!partie.bonus.some((eintrag) => eintrag.feld === SCHACH.feldNummer("g5"))) {
        partie.bonus.push({ feld: SCHACH.feldNummer("g5"), art: "erdrutsch", pech: true });
    }

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, partie, wann);
    TEAM_SCHACH.partieOeffnen(partie.id);

    return TEAM_SCHACH.wurzelEl.querySelector(
        "[data-feld=\"" + SCHACH.feldNummer("g5") + "\"]");
}

pruefe("Mit Haken traegt ein Unglueckswuerfel ein umgedrehtes Fragezeichen", () => {
    const zelle = unglueckswuerfelZeichnen(true, 5500);
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

pruefe("Ohne Haken ist ein Unglueckswuerfel nicht zu erkennen (v0.49)", () => {
    /*
     * DER PUNKT AUS DEM EINGANGSKORB: Grau gelassen sollen die Unglueckswuerfel
     * aussehen wie die guten — gleiche Farbe, Fragezeichen richtig herum. Bis
     * v0.48 war das Gegenteil eine EISERNE REGEL.
     */
    const zelle = unglueckswuerfelZeichnen(false, 5600);
    const wuerfel = zelle.kinder.find((kind) => kind.attribute
        && kind.attribute["class"] === "wuerfel");

    if (!wuerfel) {
        throw new Error("kein Wuerfel");
    }

    const zeichen = wuerfel.kinder.find((kind) => kind.tagName === "text");
    if (!zeichen) {
        throw new Error("kein Fragezeichen");
    }
    if (zeichen.attribute.transform) {
        throw new Error("das Fragezeichen steht auf dem Kopf, obwohl der Haken aus ist");
    }
    if (String(zelle.title).indexOf("Unglück") !== -1) {
        throw new Error("der Titel verraet das Unglueck");
    }
});

/*
 * DER STREIFEN NACH EINEM UNGLÜCKSWÜRFEL (v0.59, Wunsch #13).
 *
 * Er wird aus dem letzten Verlaufseintrag gelesen. Gebaut wird der Fall hier
 * über einen echten Zug auf einen Unglückswürfel — dann steht der Eintrag im
 * Verlauf, so wie er im Spiel entsteht.
 */
pruefe("Ein eingesammelter Unglueckswuerfel wird angesagt (v0.59)", () => {
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Unglueck", 5700);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 5700);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 5700);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 5700);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 5700);

    /* Ein Unglückswürfel genau dort, wohin der Bauer zieht. */
    partie = SCHACH_RUNDE.kopieren(partie);
    partie.regeln.faehigkeiten = true;
    partie.bonus.push({ feld: SCHACH.feldNummer("a3"), art: "erdrutsch", pech: true });

    partie = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("a2"), SCHACH.feldNummer("a3"), "D", "Anna", 5710);

    const vorher = TEAM_SCHACH.abgleich.daten;
    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        angelegt.tafel, partie, 5710);
    TEAM_SCHACH.partieOeffnen(partie.id);

    const letzter = partie.verlauf[partie.verlauf.length - 1];
    if (!letzter || letzter.wirkung !== "pech") {
        throw new Error("der Zug hat gar keinen Unglueckswuerfel ausgeloest");
    }

    const streifen = TEAM_SCHACH.wurzelEl.kinder.find(
        (kind) => String(kind.className || "").indexOf("unglueck-meldung") !== -1);

    if (!streifen) {
        throw new Error("kein Streifen nach dem Unglueckswuerfel");
    }

    /* Er steht ueber dem Brett, nicht darunter: direkt hinter der Standleiste. */
    const stelle = TEAM_SCHACH.wurzelEl.kinder.indexOf(streifen);
    if (stelle !== 2) {
        throw new Error("der Streifen steht an Stelle " + stelle + " statt ueber dem Brett");
    }

    /* Und nach einem gewoehnlichen Zug ist er wieder weg. */
    partie = SCHACH_RUNDE.ziehen(partie, "id-bert",
        SCHACH.feldNummer("h7"), SCHACH.feldNummer("h6"), "D", "Bert", 5720);
    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, partie, 5720);
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    if (TEAM_SCHACH.wurzelEl.kinder.some(
        (kind) => String(kind.className || "").indexOf("unglueck-meldung") !== -1)) {
        throw new Error("der Streifen bleibt nach dem naechsten Zug stehen");
    }

    TEAM_SCHACH.offeneId = "";
    TEAM_SCHACH.abgleich.daten = vorher;
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

pruefe("Ein Tipp auf den Namen fuehrt ins Profil und wieder zurueck", () => {
    RANGLISTE.profilSchliessen();
    RANGLISTE.zeichnen();

    /* Den Namensknopf in der Tabelle suchen und ausloesen — genau das, was ein
       Fingertipp tut. */
    const knoepfe = [];
    const sammeln = (element) => {
        if (String(element.className).indexOf("name-knopf") !== -1) {
            knoepfe.push(element);
        }
        for (const kind of element.kinder || []) {
            sammeln(kind);
        }
    };
    sammeln(RANGLISTE.wurzelEl);

    if (knoepfe.length === 0) {
        throw new Error("kein anklickbarer Name in der Wertung");
    }

    knoepfe[0].ausloesen("click");

    if (!RANGLISTE.offenesProfil) {
        throw new Error("das Profil hat sich nicht geoeffnet");
    }
    if (RANGLISTE.wurzelEl.kinder.length === 0) {
        throw new Error("das Profil zeichnet nichts");
    }

    /* Der Zurueck-Knopf steht im Kopf und fuehrt in die Wertung. */
    const kopf = RANGLISTE.wurzelEl.kinder.find(
        (kind) => String(kind.className).indexOf("partie-kopf") !== -1);

    if (!kopf) {
        throw new Error("kein Kopf mit Zurueck-Knopf");
    }
    kopf.kinder[0].ausloesen("click");

    if (RANGLISTE.offenesProfil !== "") {
        throw new Error("Zurueck hat das Profil nicht geschlossen");
    }
});

pruefe("Ein Profil ohne Partien bricht nicht", () => {
    /* Cem ist angemeldet, hat aber nie gespielt. */
    RANGLISTE.profilOeffnen("id-cem");
    try {
        if (RANGLISTE.wurzelEl.kinder.length === 0) {
            throw new Error("nichts gezeichnet");
        }
    } finally {
        RANGLISTE.profilSchliessen();
    }
});

pruefe("Ein Profil eines entfernten Spielers faellt in die Wertung zurueck", () => {
    RANGLISTE.profilOeffnen("id-gibtsnicht");
    RANGLISTE.zeichnen();

    if (RANGLISTE.offenesProfil !== "") {
        throw new Error("der Tab haengt an einem Spieler, den es nicht gibt");
    }
});

/* ------------------------------------------------------------------ *
 * Der Weg einer Bewegung (seit v3.6; loest den Zugpfeil ab)
 * ------------------------------------------------------------------ */

/* Ein Stand vom klassischen Brett genuegt — gerechnet wird nur mit den Massen. */
const wegStand = SCHACH.neuerStand("standard");

/* Kurzform: Feldnamen statt Nummern, damit die Tests lesbar bleiben. */
function wegVon(vonName, nachName) {
    return SCHACH.wegFelder(wegStand,
        SCHACH.feldNummer(vonName), SCHACH.feldNummer(nachName))
        .map((feld) => SCHACH.feldName(feld));
}

/* Und dasselbe fuer die Felder, die WIRKLICH betreten werden. */
function betretenVon(vonName, nachName) {
    return SCHACH.betreteneFelder(wegStand,
        SCHACH.feldNummer(vonName), SCHACH.feldNummer(nachName))
        .map((feld) => SCHACH.feldName(feld));
}

pruefe("Ein Turm betritt jedes Feld auf seinem Weg, das Startfeld nicht", () => {
    const betreten = betretenVon("a1", "a4").join(" ");

    if (betreten !== "a2 a3 a4") {
        throw new Error("erwartet 'a2 a3 a4', war '" + betreten + "'");
    }
});

pruefe("Ein Springer betritt nur sein Zielfeld", () => {
    const betreten = betretenVon("b1", "c3").join(" ");

    if (betreten !== "c3") {
        throw new Error("erwartet 'c3', war '" + betreten + "'");
    }
});

pruefe("Auch der Teleport betritt nur sein Zielfeld", () => {
    const betreten = betretenVon("d4", "f7").join(" ");

    if (betreten !== "f7") {
        throw new Error("erwartet 'f7', war '" + betreten + "'");
    }
});

pruefe("Ein gerader Zug faerbt jedes Feld dazwischen", () => {
    const weg = wegVon("a1", "a4").join(" ");

    if (weg !== "a1 a2 a3 a4") {
        throw new Error("erwartet 'a1 a2 a3 a4', war '" + weg + "'");
    }
});

pruefe("Ein diagonaler Zug faerbt die Diagonale", () => {
    const weg = wegVon("c1", "f4").join(" ");

    if (weg !== "c1 d2 e3 f4") {
        throw new Error("erwartet 'c1 d2 e3 f4', war '" + weg + "'");
    }
});

pruefe("Ein Springersprung faerbt das L, nicht die Diagonale", () => {
    /* b1 nach c3: zwei Felder hoch, eines zur Seite. Der Knick liegt am Ende
       der LANGEN Achse — also senkrecht ueber dem Start. */
    const weg = wegVon("b1", "c3").join(" ");

    if (weg !== "b1 b2 b3 c3") {
        throw new Error("erwartet 'b1 b2 b3 c3', war '" + weg + "'");
    }
});

pruefe("Auch die flache L-Bewegung knickt richtig", () => {
    /* b1 nach d2: zwei Felder zur Seite, eines hoch. */
    const weg = wegVon("b1", "d2").join(" ");

    if (weg !== "b1 c1 d1 d2") {
        throw new Error("erwartet 'b1 c1 d1 d2', war '" + weg + "'");
    }
});

pruefe("Beim Teleport gehoert nur Anfang und Ende zum Weg", () => {
    /* Zwei Felder schraeg — kein Muster, das ueber Felder fuehrt. */
    const weg = wegVon("d4", "f7").join(" ");

    if (weg !== "d4 f7") {
        throw new Error("erwartet 'd4 f7', war '" + weg + "'");
    }
});

pruefe("Ein Weg ohne Laenge ist genau ein Feld", () => {
    const weg = wegVon("e4", "e4").join(" ");

    if (weg !== "e4") {
        throw new Error("erwartet 'e4', war '" + weg + "'");
    }
});

/* ------------------------------------------------------------------ *
 * Die Zeichen am Faehigkeiten-Vorrat (seit v3.6)
 * ------------------------------------------------------------------ */

/*
 * Die Klassen aller Kinder einer Marke, als eine Zeichenkette.
 *
 * SEIT v0.48 SIND DIE ZEICHEN EIGENSCHAFTEN DER FAEHIGKEIT: Sie stehen immer
 * und ueberall, auch beim Gegner und auch, waehrend der Gegner am Zug ist.
 * Zwischen v0.41 und v0.47 fragten sie den Spielstand — deshalb bekommt dieser
 * Helfer weiterhin mit, wer am Zug ist, und deshalb prueft ein eigener Test,
 * dass es keinen Unterschied mehr macht.
 */
function zeichenAn(art, amZug) {
    const partie = SCHACH_RUNDE.kopieren(
        SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.standard));

    partie.laeuft = true;
    partie.ergebnis = "";
    partie.stand.amZug = amZug || "weiss";

    const marke = TEAM_SCHACH._faehigkeitMarkeBauen(
        partie, { id: "id-anna", name: "Anna" }, art, false);

    return marke.kinder
        .map((kind) => String(kind.className || (kind.attribute && kind.attribute["class"]) || ""))
        .join(" ");
}

pruefe("Ausweichen traegt nur noch den Blitz (v0.58)", () => {
    /*
     * Bis v0.57 trug es beides. Seit es NUR im Gegenzug geht, faellt das
     * Pluszeichen von selbst weg: Wer am Zug ist, darf es gar nicht einsetzen
     * — es gibt also keinen Zug zu behalten. Der Blitz bleibt und ist jetzt
     * das einzige Zeichen an ihm.
     */
    const zeichen = zeichenAn("ausweichen");

    if (zeichen.indexOf("faehigkeit-zeichen") !== -1) {
        throw new Error("Pluszeichen, obwohl Ausweichen nur im Gegenzug geht");
    }
    if (zeichen.indexOf("faehigkeit-blitz") === -1) {
        throw new Error("kein Blitz — Ausweichen geht im Gegenzug");
    }
});

pruefe("Der Friedhof traegt keines von beiden", () => {
    const zeichen = zeichenAn("friedhof");

    if (zeichen.indexOf("faehigkeit-zeichen") !== -1) {
        throw new Error("Pluszeichen, obwohl der Friedhof den Zug beendet");
    }
    if (zeichen.indexOf("faehigkeit-blitz") !== -1) {
        throw new Error("Blitz, obwohl der Friedhof nur am eigenen Zug geht");
    }
});

pruefe("Die Mauer traegt das Pluszeichen, aber keinen Blitz", () => {
    const zeichen = zeichenAn("mauer");

    if (zeichen.indexOf("faehigkeit-zeichen") === -1) {
        throw new Error("kein Pluszeichen — danach zieht man noch normal");
    }
    if (zeichen.indexOf("faehigkeit-blitz") !== -1) {
        throw new Error("Blitz, obwohl sie nur am eigenen Zug geht");
    }
});

pruefe("Der Bauernschub hat sein Pluszeichen verloren (v0.56)", () => {
    /*
     * Bis v0.55 trug er es: Er aendert ja nur die Stellung. Er schiebt aber
     * bis zu acht Figuren, und mit dem Zug obendrauf war das zu stark —
     * gemeldet vom Nutzer am 08.08. Nach der Regel von v0.47 nimmt man einer
     * zu starken Faehigkeit das Pluszeichen, statt ihre Stufe zu verschieben.
     */
    const zeichen = zeichenAn("bauernschub");

    if (zeichen.indexOf("faehigkeit-zeichen") !== -1) {
        throw new Error("Pluszeichen, obwohl der Bauernschub den Zug beendet");
    }
    if (zeichen.indexOf("faehigkeit-blitz") !== -1) {
        throw new Error("Blitz, obwohl er nur am eigenen Zug geht");
    }
});

pruefe("Der Sprung traegt kein Pluszeichen", () => {
    /* Seit v0.48: Er IST der Zug — danach bleibt kein normaler uebrig. */
    const zeichen = zeichenAn("sprung");

    if (zeichen.indexOf("faehigkeit-zeichen") !== -1) {
        throw new Error("Pluszeichen, obwohl der Sprung der Zug selbst ist");
    }
});

pruefe("Die Zeichen stehen auch im Gegnerzug (v0.48)", () => {
    /*
     * DIE UMKEHR VON v0.41.
     *
     * Zwischen v0.41 und v0.47 verschwand das Pluszeichen, sobald der Gegner am
     * Zug war — es beantwortete die Frage „habe ich JETZT danach noch einen
     * Zug". Damit war es kein Merkmal der Faehigkeit mehr, sondern ein
     * flackernder Zustand, und bei gegnerischen Faehigkeiten stand es nie.
     * Seit v0.48 sagt es, was die Faehigkeit IST — und ist deshalb von der
     * Frage, wer am Zug ist, unabhaengig.
     */
    /*
     * Geprueft wird das seit v0.58 an der MAUER (Pluszeichen) und am
     * AUSWEICHEN (Blitz): Ausweichen hat sein Pluszeichen verloren, taugt
     * also nicht mehr, um beide Zeichen an einer Faehigkeit zu zeigen. Die
     * Aussage bleibt dieselbe — die Zeichen haengen an der Faehigkeit, nicht
     * daran, wer gerade am Zug ist.
     */
    for (const amZug of ["weiss", "schwarz"]) {
        if (zeichenAn("mauer", amZug).indexOf("faehigkeit-zeichen") === -1) {
            throw new Error("kein Pluszeichen an der Mauer bei amZug=" + amZug);
        }
        if (zeichenAn("ausweichen", amZug).indexOf("faehigkeit-blitz") === -1) {
            throw new Error("kein Blitz bei amZug=" + amZug);
        }
    }
});

pruefe("Auch eine fremde Faehigkeit laesst sich antippen (v0.48)", () => {
    /*
     * Wer nicht einsetzen darf, bekommt Beschreibung und Anleitung zu sehen.
     * Dafuer muss die Marke ein KNOPF sein — bis v0.47 war sie ein totes
     * Schildchen.
     */
    const partie = SCHACH_RUNDE.kopieren(
        SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.standard));

    partie.laeuft = true;
    partie.ergebnis = "";

    const marke = TEAM_SCHACH._faehigkeitMarkeBauen(
        partie, { id: "id-anna", name: "Anna" }, "friedhof", false);

    if (String(marke.tagName || "").toLowerCase() !== "button") {
        throw new Error("erwartet ein button, war '" + marke.tagName + "'");
    }
    if (String(marke.className || "").indexOf("faehigkeit-knopf-fremd") === -1) {
        throw new Error("fremde Faehigkeit ohne eigene Klasse");
    }
});

pruefe("Ein Zug steht sofort auf dem Brett, bevor gespeichert ist", () => {
    /*
     * Der Kern von v3.8: Nicht erst warten, bis die Datenbank bestaetigt hat.
     *
     * Geprueft wird das mit einem Speicher, der NIE fertig wird. Der Aufruf von
     * `_sendenMitPruefung` wird bewusst nicht abgewartet — alles vor dem ersten
     * `await` laeuft synchron, und genau dort muss der Zug schon stehen.
     */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Sofort", 7000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 7000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 7000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 7000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 7000);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 7000);
    TEAM_SCHACH.partieOeffnen(partie.id);

    const gezogen = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("d2"), SCHACH.feldNummer("d4"), "D", "Anna", 7100);

    const gemerkt = TEAM_SCHACH.abgleich.speicher;
    TEAM_SCHACH.abgleich.speicher = {
        art: "lokal",
        /* Loest nie auf: So bleibt der Ablauf genau an der Stelle stehen, an
           der frueher der Bildschirm gewartet haette. */
        speichern() { return new Promise(() => undefined); }
    };

    try {
        TEAM_SCHACH._sendenMitPruefung(gezogen, partie.zugZaehler);

        const jetzt = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, partie.id);
        if (!jetzt || jetzt.zugZaehler !== gezogen.zugZaehler) {
            throw new Error("der Zug steht noch nicht im Stand");
        }
        if (SCHACH.figurAuf(jetzt.stand, SCHACH.feldNummer("d4")) !== "B") {
            throw new Error("der Bauer steht nicht auf d4");
        }
        if (TEAM_SCHACH.abgleich.vorgaenge !== 1) {
            throw new Error("der Schreibvorgang ist beim Abgleich nicht angemeldet");
        }
    } finally {
        TEAM_SCHACH.abgleich.speicher = gemerkt;
        TEAM_SCHACH.abgleich.vorgaenge = 0;
    }
});

pruefe("Eine Auswahl ueberlebt den naechsten Zug nicht", () => {
    /*
     * Der gemeldete Fehler (Screenshot v3.9): Zielpunkte und rote Schlagringe
     * blieben nach einem Zug auf dem Brett stehen — sie leben im
     * Bildschirm-Objekt, nicht im Spielstand. Darunter stand dabei „Warte, bis
     * dein Team wieder am Zug ist".
     */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Auswahl", 9000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 9000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 9000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 9000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 9000);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 9000);
    TEAM_SCHACH.partieOeffnen(partie.id);

    /* Anna tippt einen Bauern an — die Ziele erscheinen. */
    TEAM_SCHACH.feldAngetippt(partie, { id: "id-anna", name: "Anna" },
        SCHACH.feldNummer("e2"));

    if (TEAM_SCHACH.moeglicheZiele.length === 0) {
        throw new Error("keine Ziele markiert");
    }

    /* Jetzt zieht jemand — hier Anna selbst, also wechselt das Zugrecht. */
    const gezogen = SCHACH_RUNDE.ziehen(partie, "id-anna",
        SCHACH.feldNummer("d2"), SCHACH.feldNummer("d4"), "D", "Anna", 9100);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, gezogen, 9100);
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    if (TEAM_SCHACH.moeglicheZiele.length !== 0
        || TEAM_SCHACH.gewaehltesFeld !== -1) {
        throw new Error("die alte Auswahl steht noch auf dem Brett");
    }

    /* Und auf dem gezeichneten Brett darf keine Marke mehr kleben. */
    const marken = brettSuchen().kinder.filter((zelle) => {
        const klassen = String(zelle.className || "").split(" ")
            .concat(zelle.classList.liste);
        return klassen.indexOf("feld-ziel") !== -1
            || klassen.indexOf("feld-schlag") !== -1
            || klassen.indexOf("feld-gewaehlt") !== -1;
    });

    if (marken.length !== 0) {
        throw new Error(marken.length + " Felder tragen noch eine Auswahl-Marke");
    }
});

pruefe("Wer nicht am Zug ist, sieht keine Zielpunkte", () => {
    /* Eine eigene, frische Partie — die gemeinsamen sind durch fruehere Tests
       schon bewegt worden. */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Warten", 9300);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 9300);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 9300);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 9300);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 9300);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 9300);
    TEAM_SCHACH.partieOeffnen(partie.id);

    TEAM_SCHACH.feldAngetippt(partie, { id: "id-anna", name: "Anna" },
        SCHACH.feldNummer("e2"));

    if (TEAM_SCHACH.moeglicheZiele.length === 0) {
        throw new Error("keine Ziele markiert");
    }

    /* Dieselbe Stellung, aber Schwarz ist am Zug: Anna darf nicht ziehen. */
    const fremd = SCHACH_RUNDE.kopieren(partie);
    fremd.stand.amZug = "schwarz";

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(
        TEAM_SCHACH.abgleich.daten, fremd, 9200);
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    if (TEAM_SCHACH.moeglicheZiele.length !== 0) {
        throw new Error("Ziele bleiben stehen, obwohl das Team nicht am Zug ist");
    }
});

pruefe("Eine geoeffnete Partie schliesst die Spielart-Auswahl", () => {
    /*
     * DER GEMELDETE FEHLER (v0.44): Wer eine Partie anlegte, gab den Namen ein,
     * bestaetigte — und stand wieder vor den Spielart-Kacheln. Die Partie war
     * laengst angelegt und geoeffnet, aber `zeichnen` fragt die Auswahl VOR der
     * offenen Partie ab, und die stand noch auf offen.
     */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Frisch angelegt", 9400);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 9400);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 9400);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 9400);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 9400);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 9400);

    /* So steht es unmittelbar nach dem Anlegen: die Auswahl ist noch offen. */
    TEAM_SCHACH.auswahlOffen = true;
    TEAM_SCHACH.partieOeffnen(partie.id);

    if (TEAM_SCHACH.auswahlOffen) {
        throw new Error("die Spielart-Auswahl ist noch offen");
    }
    if (!brettSuchen()) {
        throw new Error("statt des Bretts steht etwas anderes im Tab");
    }
});

pruefe("Ein eigenes Zielfeld ist kein Schlagfeld", () => {
    /*
     * v0.44: Der rote Schlagring galt fuer jedes besetzte Zielfeld. Bei der
     * Rochade steht dort die EIGENE Figur — auf sechs Feldern Breite landet der
     * Koenig genau auf dem Turm. Das sah aus, als schluege man ihn.
     */
    TEAM_SCHACH.partieOeffnen(kennungen.gross);
    const partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.gross);
    const breite = SCHACH.breiteVon(partie.stand);
    const hoehe = SCHACH.hoeheVon(partie.stand);

    const eigenerTurm = SCHACH.feldNummer("a1", breite, hoehe);
    const fremderTurm = SCHACH.feldNummer("a8", breite, hoehe);

    TEAM_SCHACH.gewaehltesFeld = SCHACH.feldNummer("a2", breite, hoehe);
    TEAM_SCHACH.moeglicheZiele = [eigenerTurm, fremderTurm];
    TEAM_SCHACH.auswahlZaehler = partie.zugZaehler;
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

    const klassenVon = (feld) => {
        const zelle = brettSuchen().kinder.find(
            (kind) => kind.dataset && kind.dataset.feld === String(feld));
        if (!zelle) {
            throw new Error("Feld " + feld + " nicht gezeichnet");
        }
        return String(zelle.className || "").split(" ").concat(zelle.classList.liste);
    };

    if (klassenVon(eigenerTurm).indexOf("feld-schlag") !== -1) {
        throw new Error("die eigene Figur ist als Schlagfeld markiert");
    }
    if (klassenVon(eigenerTurm).indexOf("feld-ziel") === -1) {
        throw new Error("die eigene Figur traegt keine Zielmarke");
    }
    if (klassenVon(fremderTurm).indexOf("feld-schlag") === -1) {
        throw new Error("die gegnerische Figur traegt keinen Schlagring");
    }

    TEAM_SCHACH._auswahlAufheben();
    TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);
});

pruefe("Ein Abschluss verdraengt keine laufende Partie", () => {
    /*
     * Der gemeldete Haenger: Lag irgendeine beendete Partie herum, deren
     * Abschluss man nie weggeklickt hatte, kam sie bei JEDEM Zeichnen wieder —
     * also alle drei Sekunden — und man kam nicht mehr ans Brett.
     */
    let tafelJetzt = TEAM_SCHACH.abgleich.daten;

    /* Eine beendete Partie, in der Anna mitgespielt hat. */
    const beendet = SCHACH_TAFEL.partieAnlegen(tafelJetzt, "standard", "Vorbei", 8000);
    let alt = SCHACH_RUNDE.teamBeitreten(beendet.partie, "id-anna", "weiss", 8000);
    alt = SCHACH_RUNDE.teamBeitreten(alt, "id-bert", "schwarz", 8000);
    alt = SCHACH_RUNDE.bereitSetzen(alt, "weiss", true, 8000);
    alt = SCHACH_RUNDE.bereitSetzen(alt, "schwarz", true, 8000);
    alt = SCHACH_RUNDE.aufgeben(alt, "schwarz", 8100);
    tafelJetzt = SCHACH_TAFEL.partieEinsetzen(beendet.tafel, alt, 8100);

    /* Und eine zweite, die noch laeuft. */
    const laufend = SCHACH_TAFEL.partieAnlegen(tafelJetzt, "standard", "Laeuft", 8200);
    let neu = SCHACH_RUNDE.teamBeitreten(laufend.partie, "id-anna", "weiss", 8200);
    neu = SCHACH_RUNDE.teamBeitreten(neu, "id-bert", "schwarz", 8200);
    neu = SCHACH_RUNDE.bereitSetzen(neu, "weiss", true, 8200);
    neu = SCHACH_RUNDE.bereitSetzen(neu, "schwarz", true, 8200);
    tafelJetzt = SCHACH_TAFEL.partieEinsetzen(laufend.tafel, neu, 8200);

    TEAM_SCHACH.abschluss = null;
    TEAM_SCHACH.abgleich.daten = tafelJetzt;
    TEAM_SCHACH.partieOeffnen(neu.id);

    if (TEAM_SCHACH.abschluss) {
        throw new Error("der Abschluss der alten Partie hat die laufende verdraengt");
    }
    if (!brettSuchen()) {
        throw new Error("kein Brett gezeichnet");
    }

    /* Verlaesst man die laufende Partie, darf er kommen — sonst saehe man ihn
       nie wieder. */
    TEAM_SCHACH.uebersichtOeffnen();

    if (!TEAM_SCHACH.abschluss || TEAM_SCHACH.abschluss.id !== alt.id) {
        throw new Error("in der Uebersicht muesste der Abschluss erscheinen");
    }

    TEAM_SCHACH.abschlussSchliessen(alt.id);
});

pruefe("Waehrend ein Zug unterwegs ist, sagt es die Leiste", () => {
    /* Ohne diese Marke tippt man ins Leere: Das Brett nimmt nichts mehr an,
       sagt es aber niemandem. */
    TEAM_SCHACH.partieOeffnen(kennungen.standard);
    const partie = SCHACH_TAFEL.partie(TEAM_SCHACH.abgleich.daten, kennungen.standard);

    TEAM_SCHACH.ziehtGerade = true;
    try {
        TEAM_SCHACH.zeichnen(TEAM_SCHACH.abgleich.daten);

        const leiste = TEAM_SCHACH.wurzelEl.kinder.find((kind) =>
            String(kind.className || "").indexOf("stand-leiste") !== -1);

        if (!leiste) {
            throw new Error("keine Standleiste gefunden");
        }
        const marken = leiste.kinder.map((kind) => kind.textInhalt || kind.text || "");
        if (!leiste.kinder.some((kind) =>
            String(kind.textContent || "").indexOf("gesendet") !== -1)) {
            throw new Error("keine Marke 'Wird gesendet': " + marken.join(" | "));
        }
    } finally {
        TEAM_SCHACH.ziehtGerade = false;
    }
});

pruefe("Ein Tipp neben die Zielfelder bricht die Faehigkeit ab", () => {
    /* Bis v3.5 passierte hier gar nichts — das sah aus, als haenge die Seite. */
    const angelegt = SCHACH_TAFEL.partieAnlegen(
        TEAM_SCHACH.abgleich.daten, "standard", "Abbruch", 6000);

    let partie = SCHACH_RUNDE.teamBeitreten(angelegt.partie, "id-anna", "weiss", 6000);
    partie = SCHACH_RUNDE.teamBeitreten(partie, "id-bert", "schwarz", 6000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "weiss", true, 6000);
    partie = SCHACH_RUNDE.bereitSetzen(partie, "schwarz", true, 6000);

    TEAM_SCHACH.abgleich.daten = SCHACH_TAFEL.partieEinsetzen(angelegt.tafel, partie, 6000);
    TEAM_SCHACH.partieOeffnen(partie.id);

    if (!SCHACH_RUNDE.darfZiehen(partie, "id-anna")) {
        throw new Error("Anna muesste am Zug sein");
    }

    TEAM_SCHACH.zielFaehigkeit = "schutzschild";
    TEAM_SCHACH.zielFelder = [SCHACH.feldNummer("e2")];

    TEAM_SCHACH.feldAngetippt(partie, { id: "id-anna", name: "Anna" },
        SCHACH.feldNummer("h8"));

    if (TEAM_SCHACH.zielFaehigkeit !== "") {
        throw new Error("die Zielauswahl laeuft noch");
    }
});

pruefe("Ein schlagender Bauer bekommt seine Spur", () => {
    /* Genau der Fall, in dem der alte Pfeil fehlte: eine Strecke von einem
       Feld war kuerzer als Rand plus Spitze und wurde gar nicht gezeichnet. */
    const weg = wegVon("e4", "d5").join(" ");

    if (weg !== "e4 d5") {
        throw new Error("erwartet 'e4 d5', war '" + weg + "'");
    }
});

/* ------------------------------------------------------------------ *
 * Imposter
 * ------------------------------------------------------------------ */

/* Der Tab braucht seinen eigenen Abgleich-Stellvertreter. */
IMPOSTER.aufbauen(neuesElement("div"));
IMPOSTER.verbinden({
    daten: IMPOSTER_TAFEL.leereTafel(1000),
    speicher: {
        art: "lokal",
        async speichern() { return true; }
    },
    aendern(neueDaten) { this.daten = neueDaten; },
    vorgaenge: 0,
    eigenerVorgangBeginnt() { this.vorgaenge++; },
    eigenerVorgangEndet() { this.vorgaenge = Math.max(0, this.vorgaenge - 1); }
});

/*
 * Eine Tafel mit EINEM Raum, in dem Anna und Bert sitzen; Anna ist dieses
 * Gerät. Der Raum wird gleich geöffnet — sonst zeigt der Tab die Übersicht.
 */
function imposterMitRaum(umbauen) {
    const angelegt = IMPOSTER_TAFEL.raumAnlegen(
        IMPOSTER_TAFEL.leereTafel(1000), "Testraum",
        { gruppe: "alltag", impostermenge: 1 }, 1000);

    let raum = IMPOSTER_RUNDE.beitreten(angelegt.raum, "id-anna", 1000);
    raum = IMPOSTER_RUNDE.beitreten(raum, "id-bert", 1000);

    if (umbauen) {
        raum = umbauen(raum);
    }

    IMPOSTER.offeneId = raum.id;
    return IMPOSTER_TAFEL.raumEinsetzen(angelegt.tafel, raum, 1000);
}

/* Sucht ein gezeichnetes Element über seine Klasse — Indizes würden bei jeder
   zusätzlichen Zeile im Bildschirm brechen. */
function imposterSuchen(klasse) {
    return IMPOSTER.wurzelEl.kinder.find(
        (kind) => String(kind.className).split(" ").indexOf(klasse) !== -1);
}

pruefe("Imposter: die Uebersicht zeigt jeden Raum", () => {
    const tafel = imposterMitRaum();
    IMPOSTER.offeneId = "";
    IMPOSTER.abgleich.daten = tafel;
    IMPOSTER.zeichnen(tafel);

    const karte = IMPOSTER.wurzelEl.kinder.find(
        (kind) => kind.kinder.some((enkel) => enkel.kinder.some(
            (urenkel) => urenkel.textContent === "Testraum")));

    if (!karte) {
        throw new Error("der Raum steht nicht in der Uebersicht");
    }
});

pruefe("Imposter: die Ansicht zum Anlegen zeigt jedes Thema plus „Alle“", () => {
    IMPOSTER.abgleich.daten = IMPOSTER_TAFEL.leereTafel(1000);
    IMPOSTER.raumAnlegen();

    const feld = imposterSuchen("spielart-feld");
    if (!feld) {
        throw new Error("keine Kacheln");
    }

    /* Eine Kachel je Thema, das zur Auswahl steht — plus „Alle Themen".
       Versteckte Gruppen (die alten Wortart-Gruppen) sind nicht dabei. */
    const erwartet = umgebung.IMPOSTER_WOERTER.zurAuswahl().length + 1;
    if (feld.kinder.length !== erwartet) {
        throw new Error("erwartet " + erwartet + " Kacheln, sind: " + feld.kinder.length);
    }

    IMPOSTER.auswahlSchliessen();
});

pruefe("Imposter: der Wortart-Filter laesst sich umstellen", () => {
    IMPOSTER.abgleich.daten = IMPOSTER_TAFEL.leereTafel(1000);
    IMPOSTER.raumAnlegen();

    if (IMPOSTER.neueEinstellungen.wortart !== umgebung.IMPOSTER_WOERTER.ALLE) {
        throw new Error("die Vorgabe muesste 'alle' sein");
    }

    IMPOSTER.wortartWaehlen("verb");
    if (IMPOSTER.neueEinstellungen.wortart !== "verb") {
        throw new Error("der Filter wurde nicht uebernommen");
    }

    /* Ein Thema ohne Verben muss jetzt gesperrt sein — sonst tippt man darauf
       und bekommt einen Raum ohne ein einziges Wort. */
    const feld = imposterSuchen("spielart-feld");
    const gesperrt = feld.kinder.filter((kachel) => kachel.disabled).length;

    if (gesperrt === 0) {
        throw new Error("kein Thema gesperrt, obwohl die meisten keine Verben haben");
    }

    IMPOSTER.auswahlSchliessen();
});

pruefe("Imposter: der Wartebildschirm zeichnet", () => {
    IMPOSTER.abgleich.daten = imposterMitRaum();
    IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);

    if (IMPOSTER.wurzelEl.kinder.length === 0) {
        throw new Error("nichts gezeichnet");
    }
    if (!imposterSuchen("partie-kopf")) {
        throw new Error("kein Raum-Kopf");
    }
});

pruefe("Imposter: die laufende Runde zeigt das Wort — oder die Rolle", () => {
    const tafel = imposterMitRaum((raum) => {
        let neu = IMPOSTER_RUNDE.bereitSetzen(raum, "id-anna", true, 1000);
        neu = IMPOSTER_RUNDE.bereitSetzen(neu, "id-bert", true, 1000);
        return IMPOSTER_RUNDE.starten(neu, "testsalz", 2000);
    });

    IMPOSTER.abgleich.daten = tafel;
    IMPOSTER.zeichnen(tafel);

    const raum = IMPOSTER_TAFEL.raum(tafel, IMPOSTER.offeneId);
    const kasten = imposterSuchen("imposter-wort");

    if (!kasten) {
        throw new Error("kein Wortkasten");
    }

    const gezeigt = kasten.kinder[1].textContent;

    if (IMPOSTER_RUNDE.istImposter(raum, "id-anna")) {
        if (gezeigt !== "Imposter") {
            throw new Error("der Imposter sieht das Wort: " + gezeigt);
        }
    } else if (gezeigt !== IMPOSTER_RUNDE.wortVon(raum)) {
        throw new Error("das Wort fehlt");
    }
});

pruefe("Imposter: die Aufloesung zeichnet mit Punkten", () => {
    const tafel = imposterMitRaum((raum) => {
        let neu = IMPOSTER_RUNDE.bereitSetzen(raum, "id-anna", true, 1000);
        neu = IMPOSTER_RUNDE.bereitSetzen(neu, "id-bert", true, 1000);
        neu = IMPOSTER_RUNDE.starten(neu, "testsalz", 2000);
        neu = IMPOSTER_RUNDE.fertigSetzen(neu, "id-anna", true, 3000);
        return IMPOSTER_RUNDE.fertigSetzen(neu, "id-bert", true, 3100);
    });

    IMPOSTER.abgleich.daten = tafel;
    IMPOSTER.zeichnen(tafel);

    const raum = IMPOSTER_TAFEL.raum(tafel, IMPOSTER.offeneId);
    const kasten = imposterSuchen("imposter-wort");

    if (!kasten || kasten.kinder[1].textContent !== IMPOSTER_RUNDE.wortVon(raum)) {
        throw new Error("das Wort wird nicht aufgeloest");
    }

    /* Die Punkte stehen in der Auflösungskarte. */
    const karte = IMPOSTER.wurzelEl.kinder.find(
        (kind) => kind.kinder.some((enkel) => enkel.textContent === "Auflösung"));

    if (!karte) {
        throw new Error("keine Aufloesung");
    }
});

pruefe("Imposter: ein geloeschter Raum fuehrt zurueck in die Uebersicht", () => {
    IMPOSTER.abgleich.daten = imposterMitRaum();
    IMPOSTER.abgleich.daten = IMPOSTER_TAFEL.raumEntfernen(
        IMPOSTER.abgleich.daten, IMPOSTER.offeneId, 2000);

    IMPOSTER.zeichnen(IMPOSTER.abgleich.daten);

    if (IMPOSTER.offeneId !== "") {
        throw new Error("der Tab haengt an einem Raum, den es nicht mehr gibt");
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

/* ------------------------------------------------------------------ *
 * Das Zeitlimit der Datenbank-Aufrufe (seit v3.9)
 *
 * Diese Pruefungen muessen WARTEN koennen und laufen deshalb am Ende, nach
 * allen anderen. `pruefe` ist synchron und wuerde ein Versprechen einfach
 * durchwinken — ein Test, der immer besteht, waere schlimmer als keiner.
 * ------------------------------------------------------------------ */

async function pruefeMitWarten(bezeichnung, funktion) {
    try {
        await funktion();
        anzahlOk++;
    } catch (fehler) {
        anzahlFehler++;
        console.error("FEHLER: " + bezeichnung);
        console.error("        " + fehler.message);
    }
}

async function zeitlimitPruefen() {
    const speicher = new SpeicherGemeinsam(
        "https://beispiel.example", "team-schach", (roh) => roh);

    await pruefeMitWarten("Ein haengendes Laden bricht nach dem Zeitlimit ab", async () => {
        netz.haengt = true;
        netz.sofort = true;
        netz.abgebrochen = false;

        try {
            await speicher.laden();
            throw new Error("kein Abbruch — der Aufruf haette ewig gehangen");
        } catch (fehler) {
            if (fehler.message.indexOf("zu lange gedauert") === -1) {
                throw new Error("falscher Fehler: " + fehler.message);
            }
            if (!netz.abgebrochen) {
                throw new Error("der Aufruf wurde nicht wirklich abgebrochen");
            }
        } finally {
            netz.haengt = false;
            netz.sofort = false;
        }
    });

    await pruefeMitWarten("Auch ein haengendes Speichern bricht ab", async () => {
        netz.haengt = true;
        netz.sofort = true;

        try {
            await speicher.speichern({});
            throw new Error("kein Abbruch beim Speichern");
        } catch (fehler) {
            if (fehler.message.indexOf("zu lange gedauert") === -1) {
                throw new Error("falscher Fehler: " + fehler.message);
            }
        } finally {
            netz.haengt = false;
            netz.sofort = false;
        }
    });

    await pruefeMitWarten("Ein antwortender Aufruf laeuft ganz normal durch", async () => {
        netz.haengt = false;
        await speicher.laden();
    });

    console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
    process.exit(anzahlFehler === 0 ? 0 : 1);
}

zeitlimitPruefen();
