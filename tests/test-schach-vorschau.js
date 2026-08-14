/*
 * test-schach-vorschau.js — die Bildanleitung zu den Fähigkeiten (seit v0.41).
 *
 * Der wichtigste Test dieser Datei ist der erste: ZU JEDER Fähigkeit und zu
 * jedem Unglückswürfel muss es zwei Bilder geben, und das Nachher-Bild wird
 * mit den echten Regeln gerechnet. Fehlt ein Beispiel oder passt es nicht mehr
 * zur Regel (falsches Zielfeld, Zug nicht mehr erlaubt), schlägt er fehl —
 * genau dann, wenn jemand eine Fähigkeit ändert und die Anleitung vergisst.
 *
 * Aufruf: siehe tests\README.md
 */

const pfad = require("path");

globalThis.SCHACH_VARIANTEN = require(pfad.join(__dirname, "..", "js", "schach-varianten.js"));
globalThis.SCHACH = require(pfad.join(__dirname, "..", "js", "schach.js"));
globalThis.SCHACH_RUNDE = require(pfad.join(__dirname, "..", "js", "schach-runde.js"));

const SCHACH_VARIANTEN = globalThis.SCHACH_VARIANTEN;
const SCHACH = globalThis.SCHACH;
const SCHACH_VORSCHAU = require(pfad.join(__dirname, "..", "js", "schach-vorschau.js"));

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

function gleich(ist, soll, was) {
    if (ist !== soll) {
        throw new Error((was || "Wert") + ": erwartet <" + soll + ">, war <" + ist + ">");
    }
}

function wahr(bedingung, was) {
    if (!bedingung) {
        throw new Error((was || "Bedingung") + " war nicht erfüllt");
    }
}

/* Alle Fähigkeiten und alle Unglückswürfel, jeweils mit ihrem Titel. */
const alleArten = Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)
    .concat(Object.keys(SCHACH_VARIANTEN.PECH));

/* ------------------------------------------------------------------ *
 * Vollständigkeit
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Bildanleitung fuer " + art, () => {
        const bilder = SCHACH_VORSCHAU.bilder(art);

        wahr(bilder !== null, "es gibt zwei Bilder");
        wahr(typeof bilder.vorher.text === "string" && bilder.vorher.text.length > 10,
            "das Vorher-Bild hat einen Satz");
        wahr(typeof bilder.nachher.text === "string" && bilder.nachher.text.length > 10,
            "das Nachher-Bild hat einen Satz");
    });
}

/* ------------------------------------------------------------------ *
 * Die Bilder sagen wirklich etwas
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Das Nachher-Bild zeigt eine Aenderung: " + art, () => {
        const bilder = SCHACH_VORSCHAU.bilder(art);
        const vorher = bilder.vorher.runde.stand;
        const nachher = bilder.nachher.runde.stand;

        /*
         * Entweder das Brett hat sich geaendert, oder es sind Felder markiert,
         * die es vorher nicht waren, oder eine Wirkung liegt jetzt im Stand
         * (Schild, Fessel, Frost, Mauer, Zusatzmuster, Extrazug, Glas). Ein
         * Bild, bei dem nichts davon zutrifft, zeigt dem Nutzer nichts.
         */
        const brettAnders = (vorher.brett !== nachher.brett)
            || (vorher.breite !== nachher.breite)
            || (vorher.hoehe !== nachher.hoehe);

        const wirkungImStand = !!(nachher.zusatzMuster || nachher.extraZug
            || nachher.schildFeld >= 0 || nachher.fesselFeld >= 0
            || nachher.frostFeld >= 0 || nachher.glasFarbe
            || SCHACH.mauern(nachher).length > 0
            || SCHACH.geliehene(nachher).length > 0);

        wahr(brettAnders || wirkungImStand || bilder.nachher.marken.length > 0,
            "Vorher und Nachher unterscheiden sich sichtbar");
    });
}

/* ------------------------------------------------------------------ *
 * Der Ablauf: die Schritte, die der Bildschirm abspielt
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Der Ablauf hat Schritte mit Text: " + art, () => {
        const schritte = SCHACH_VORSCHAU.schritte(art);

        wahr(Array.isArray(schritte) && schritte.length >= 2,
            "mindestens Ausgangsstellung und Wirkung");

        for (const schritt of schritte) {
            wahr(!!schritt.runde && !!schritt.runde.stand, "jeder Schritt hat ein Brett");
            wahr(Array.isArray(schritt.marken), "jeder Schritt hat Marken");
            wahr(Array.isArray(schritt.wahl), "jeder Schritt hat eine Auswahl");
            wahr(typeof schritt.text === "string" && schritt.text.length > 10,
                "jeder Schritt hat einen Satz");
        }
    });
}

pruefe("Faehigkeiten mit Zielfeld zeigen den Handgriff als eigenen Schritt", () => {
    /*
     * Der Schritt mit dem Fingerabdruck ist der, den ein Vorher-Bild nicht
     * zeigen kann: dass man selbst ein Feld aussucht — und welche zur Auswahl
     * stehen.
     *
     * GESUCHT WIRD ER, NICHT GEZAEHLT (seit v0.58): Eine Anleitung darf jetzt
     * vorne ein Bild mehr haben (`todeszug`, Wiedergeburt) und hinten auch
     * (`nachspiel`). Ein fester Index waere damit nur noch zufaellig richtig.
     */
    const mitZiel = Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)
        .filter((art) => SCHACH_VARIANTEN.FAEHIGKEITEN[art].art === "ziel");

    wahr(mitZiel.length > 0, "es gibt Faehigkeiten mit Zielfeld");

    for (const art of mitZiel) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const zielSchritt = schritte.filter((schritt) => schritt.tipp >= 0);

        wahr(schritte.length >= 4, art + ": mindestens vier Schritte");
        gleich(zielSchritt.length, 1, art + ": genau ein Handgriff aufs Brett");
        gleich(zielSchritt[0].marken.length, 1, art + ": genau ein angetipptes Feld");
        gleich(zielSchritt[0].marken[0], beispiel.ziel,
            art + ": und zwar das aus dem Beispiel");
    }
});

pruefe("Der Vorrat-Knopf steht in JEDEM Bild, der Finger nur in einem (v0.58)", () => {
    /*
     * BIS v0.57 KAM DIE MARKE MIT EINEM BILD UND VERSCHWAND WIEDER — die
     * Anleitung sprang dadurch bei jedem Takt in der Hoehe, und das Auge folgte
     * dem Sprung statt dem Brett. Jetzt steht sie durchgehend da; `knopfTipp`
     * sagt, in welchem Bild sie gedrueckt wird.
     *
     * Unglueckswuerfel bekommen keine Marke: Sie werden nie gedrueckt, sondern
     * eingesammelt.
     */
    for (const art of Object.keys(SCHACH_VARIANTEN.FAEHIGKEITEN)) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const titel = SCHACH_VARIANTEN.faehigkeitTitel(art);

        for (const schritt of schritte) {
            gleich(schritt.knopf, titel, art + ": die Marke steht in jedem Bild");
        }

        const gedrueckt = schritte.filter((schritt) => schritt.knopfTipp);
        gleich(gedrueckt.length, 1, art + ": genau ein Bild zeigt das Druecken");
        gleich(gedrueckt[0].tipp, -1, art + ": und dabei keinen Finger auf dem Brett");
    }

    for (const art of Object.keys(SCHACH_VARIANTEN.PECH)) {
        for (const schritt of SCHACH_VORSCHAU.schritte(art)) {
            gleich(schritt.knopf, "", art + ": ein Unglueckswuerfel wird nicht gedrueckt");
            gleich(schritt.knopfTipp, false, art + ": und nicht angetippt");
        }
    }
});

pruefe("Ohne Zielfeld und ohne Zug bleiben Stellung, Griff und Wirkung", () => {
    gleich(SCHACH_VORSCHAU.schritte("bauernschub").length, 3, "bauernschub: drei Schritte");
});

pruefe("Der Haendler zeigt sein Angebot als eigenes Bild (v0.58)", () => {
    /*
     * Er ist die einzige Faehigkeit mit einer Rueckfrage — und genau die fehlte
     * in der Anleitung: Man sah den Griff an den Vorrat und dann das Ergebnis,
     * aber nie das Angebot dazwischen.
     */
    const schritte = SCHACH_VORSCHAU.schritte("haendler");
    const angebot = SCHACH_RUNDE.handelsAngebot(schritte[0].runde, SCHACH_VORSCHAU.FARBE);

    gleich(schritte.length, 4, "Stellung, Griff, Angebot, Wirkung");
    wahr(!!angebot, "es gibt ein Angebot");
    wahr(schritte[2].text.indexOf(angebot.text) !== -1,
        "das Bild nennt den konkreten Tausch");

    /* Markiert ist, was weggeht und wo Neues erscheint — beides zusammen. */
    for (const feld of angebot.gibtFelder.concat(angebot.bekommtFelder)) {
        wahr(schritte[2].marken.indexOf(feld) !== -1, "Feld " + feld + " ist markiert");
    }
});

pruefe("Die Wiedergeburt zeigt zuerst den Tod der Figur (v0.58)", () => {
    /*
     * Bis v0.57 stand die Dame einfach in `verloren`, und das erste Bild
     * behauptete, sie sei gefallen — zu sehen war davon nichts. Der Schlag
     * wird jetzt mit den echten Regeln gerechnet, also stimmen Brett und
     * Verlustliste zwangslaeufig ueberein.
     */
    const beispiel = SCHACH_VORSCHAU.beispielVon("wiedergeburt");
    const schritte = SCHACH_VORSCHAU.schritte("wiedergeburt");

    wahr(Array.isArray(beispiel.todeszug), "das Beispiel hat einen Todeszug");

    /* Bild 1: Die Figur lebt noch. Bild 2: Sie ist geschlagen. */
    const lebt = SCHACH.figurAuf(schritte[0].runde.stand, beispiel.todeszug[1]);
    gleich(lebt, "D", "im ersten Bild steht die Dame noch da");

    gleich(SCHACH.figurAuf(schritte[1].runde.stand, beispiel.todeszug[1]), "t",
        "im zweiten steht der Turm auf ihrem Feld");
    gleich(schritte[1].runde.verloren.weiss.join(","), "D",
        "und sie zaehlt als verloren");
    gleich(schritte[1].wege.length, 1, "ein Pfeil zeigt den Schlag");

    /* Und am Ende steht sie wieder auf der eigenen Grundreihe. */
    const letzter = schritte[schritte.length - 1];
    gleich(SCHACH.figurAuf(letzter.runde.stand, beispiel.ziel), "D",
        "am Ende steht sie wieder da");
});

pruefe("Wo eine Faehigkeit den Zug laesst, zieht das Beispiel danach (v0.58)", () => {
    /*
     * DAS PLUSZEICHEN WIRD SICHTBAR. Es steht zwar im Text, war aber nie zu
     * sehen. Jede dieser Faehigkeiten fuehrt jetzt im letzten Bild den Zug vor,
     * den sie einem laesst — und der bringt etwas ein.
     */
    const mitNachspiel = ["mauer", "nudelholz", "schutzschild", "fessel", "frost"];

    for (const art of mitNachspiel) {
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const letzter = schritte[schritte.length - 1];

        wahr(Array.isArray(beispiel.nachspiel), art + ": das Beispiel hat ein Nachspiel");
        wahr(SCHACH_VARIANTEN.zeigtPlus(art), art + ": sie traegt auch wirklich das Plus");

        gleich(letzter.wege.length, 1, art + ": ein Pfeil zeigt den Zug");
        gleich(letzter.wege[0].von, beispiel.nachspiel[0], art + ": von der richtigen Figur");
        gleich(letzter.wege[0].nach, beispiel.nachspiel[1], art + ": auf das richtige Feld");
        gleich(SCHACH.figurAuf(letzter.runde.stand, beispiel.nachspiel[0]), ".",
            art + ": das alte Feld ist frei");
    }
});

pruefe("Die Zugmuster haben ein Bild mehr: den Zug selbst", () => {
    /* v0.46: Was die neuen Punkte bedeuten, sieht man erst, wenn die Figur
       einmal wirklich dorthin zieht. Seit v0.50 kommt der Griff an den
       Vorrat davor. */
    for (const art of ["sprung", "ausweichen", "teleport"]) {
        gleich(SCHACH_VORSCHAU.schritte(art).length, 4, art + ": vier Schritte");
    }
});

pruefe("Wo gezogen wird, sind es vier Schritte", () => {
    /*
     * Ein Zug sind ZWEI Tipper — erst die Figur, dann ihr Ziel. Beide bekommen
     * ihr eigenes Bild mit Fingerabdruck, sonst fehlt der halbe Handgriff.
     */
    for (const art of ["doppelzug", "meuterei", "stolperstein", "erdrutsch"]) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const mitFinger = schritte.filter((schritt) => schritt.tipp >= 0);

        gleich(mitFinger.length, 2, art + ": zwei Tipper aufs Brett");
        gleich(mitFinger[0].tipp, beispiel.zug[0], art + ": erst die Figur antippen");
        gleich(mitFinger[1].tipp, beispiel.zug[1], art + ": dann ihr Ziel");
        wahr(mitFinger[0].ziele.length > 0, art + ": die Zugpunkte sind dabei");
    }
});

pruefe("Jeder Handgriff traegt einen Fingerabdruck", () => {
    /*
     * Der Fingerabdruck beantwortet die Frage, die Bilder sonst offen lassen:
     * WO muss ich hindrücken? Er gehört auf jeden Schritt, in dem getippt wird
     * — und auf keinen anderen.
     */
    for (const art of alleArten) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const mitFinger = schritte.filter((schritt) => schritt.tipp >= 0);

        if (Number.isInteger(beispiel.ziel) && beispiel.ziel >= 0) {
            gleich(mitFinger.length, 1, art + ": ein Tipper (das Zielfeld)");
            gleich(mitFinger[0].tipp, beispiel.ziel, art + ": auf dem Zielfeld");
        } else if (beispiel.zug) {
            gleich(mitFinger.length, 2, art + ": zwei Tipper (Figur und Ziel)");
        } else {
            gleich(mitFinger.length, 0, art + ": hier wird das Brett nicht getippt");
        }

        /* Der erste und der letzte Schritt zeigen nie einen Finger — dort ist
           nichts zu drücken, sondern etwas zu sehen. */
        gleich(schritte[0].tipp, -1, art + ": kein Finger auf der Ausgangsstellung");
        gleich(schritte[schritte.length - 1].tipp, -1, art + ": keiner auf der Wirkung");
    }
});

pruefe("Wo sich etwas bewegt, gibt es Pfeile", () => {
    for (const art of ["doppelzug", "stolperstein", "erdrutsch", "bauernschub"]) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const mitPfeil = schritte.filter((schritt) => schritt.wege.length > 0);

        wahr(mitPfeil.length > 0, art + ": mindestens ein Bild mit Pfeil");

        for (const schritt of mitPfeil) {
            for (const weg of schritt.wege) {
                wahr(Number.isInteger(weg.von) && Number.isInteger(weg.nach)
                    && weg.von !== weg.nach, art + ": der Weg hat zwei Enden");
            }
        }
    }
});

/* ------------------------------------------------------------------ *
 * Die Probe aufs Exempel: Zeigt die Anleitung, was die Regel erlaubt?
 *
 * Das ist der wichtigste Test dieser Datei. Ein Bild, das an einer Stelle
 * einen Fingerabdruck zeigt, an der man in Wirklichkeit nicht tippen kann,
 * ist schlimmer als gar keines — es leitet in die Irre.
 * ------------------------------------------------------------------ */

for (const art of alleArten) {
    pruefe("Wo der Finger liegt, geht es auch wirklich: " + art, () => {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const istFaehigkeit = !!SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        for (const schritt of schritte) {
            if (schritt.tipp < 0) {
                continue;
            }

            /*
             * Zwei Arten von Tippern gibt es: auf ein Zielfeld einer
             * Faehigkeit (dann muss `zielFelder` es kennen) und auf ein Feld
             * eines Zuges (dann muss es die Figur oder eines ihrer Ziele
             * sein). Beides wird hier gegen die ECHTE Regel geprueft.
             */
            const zielFelder = istFaehigkeit
                ? SCHACH_RUNDE.zielFelder(schritt.runde, SCHACH_VORSCHAU.SPIELER, art)
                : [];

            const istZugfeld = SCHACH.farbeVon(
                SCHACH.figurAuf(schritt.runde.stand, schritt.tipp)) === SCHACH_VORSCHAU.FARBE;

            wahr(zielFelder.indexOf(schritt.tipp) !== -1
                || istZugfeld
                || schritt.ziele.indexOf(schritt.tipp) !== -1,
                art + ": auf Feld " + schritt.tipp + " laesst sich wirklich tippen");
        }
    });
}

for (const art of alleArten) {
    pruefe("Markiert ist genau das Moegliche: " + art, () => {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const istFaehigkeit = !!SCHACH_VARIANTEN.FAEHIGKEITEN[art];

        for (const schritt of schritte) {
            /* Die helle Auswahl: jedes Feld muss ein gueltiges Ziel sein. */
            if (schritt.wahl.length > 0 && istFaehigkeit) {
                const moeglich = SCHACH_RUNDE.zielFelder(
                    schritt.runde, SCHACH_VORSCHAU.SPIELER, art);

                for (const feld of schritt.wahl) {
                    wahr(moeglich.indexOf(feld) !== -1,
                        art + ": Feld " + feld + " ist als Auswahl markiert und geht auch");
                }

                /* Und andersherum: KEIN gueltiges Feld fehlt. Sonst waere
                   etwas moeglich, das die Anleitung verschweigt. */
                gleich(schritt.wahl.length + 1, moeglich.length,
                    art + ": alle moeglichen Felder sind markiert");
            }

            /* Die Zugpunkte: genau die Zuege der markierten Figur. */
            for (const feld of schritt.ziele) {
                const dort = SCHACH.figurAuf(schritt.runde.stand, feld);
                wahr(SCHACH.farbeVon(dort) !== SCHACH_VORSCHAU.FARBE,
                    art + ": auf einen Zugpunkt zieht man nicht die eigene Figur");
            }
        }
    });
}

pruefe("Die Zugpunkte sind genau die Zuege der Figur", () => {
    /*
     * Stichprobe an den drei Zugmustern: Was als Punkt dasteht, muss
     * `SCHACH.zuege` genauso liefern — sonst zeigt die Anleitung Felder, auf
     * die man nicht darf, oder verschweigt welche.
     */
    for (const art of ["sprung", "ausweichen", "teleport"]) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);

        /* Der vorletzte Schritt zeigt die neuen Ziele. */
        const mitPunkten = schritte[schritte.length - 2];
        const echte = SCHACH.zuege(mitPunkten.runde.stand, beispiel.figur)
            .map((zug) => zug.nach);

        for (const feld of mitPunkten.ziele) {
            wahr(echte.indexOf(feld) !== -1,
                art + ": Punkt auf " + feld + " ist ein echter Zug");
        }
    }
});

pruefe("Bei den Zugmustern zieht die Figur am Ende wirklich", () => {
    for (const art of ["sprung", "ausweichen", "teleport"]) {
        const schritte = SCHACH_VORSCHAU.schritte(art);
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const letzter = schritte[schritte.length - 1];

        gleich(letzter.wege.length, 1, art + ": ein Pfeil zeigt den Zug");
        gleich(letzter.wege[0].von, beispiel.figur, art + ": er beginnt bei der Figur");
        gleich(SCHACH.figurAuf(letzter.runde.stand, beispiel.figur), ".",
            art + ": die Figur steht nicht mehr auf ihrem alten Feld");
        gleich(SCHACH.figurAuf(letzter.runde.stand, letzter.wege[0].nach), "T",
            art + ": sie steht jetzt am Ende des Pfeils");
    }
});

pruefe("Die Mauer liegt um das angetippte Feld herum", () => {
    /*
     * v0.46: Das angetippte Feld ist die MITTE. Vorher war es das linke Ende —
     * am Bildschirm sah es aus, als erscheine die Sperre daneben.
     */
    const schritte = SCHACH_VORSCHAU.schritte("mauer");
    const beispiel = SCHACH_VORSCHAU.beispielVon("mauer");
    const mauern = SCHACH.mauern(schritte[schritte.length - 1].runde.stand);

    gleich(mauern.length, 1, "eine Mauer");
    wahr(mauern[0].felder.indexOf(beispiel.ziel) !== -1,
        "das angetippte Feld gehoert zur Mauer");
    gleich(mauern[0].felder[1], beispiel.ziel, "und liegt in ihrer Mitte");
});

pruefe("Das Nudelholz schiebt von der eigenen Grundreihe nach vorn", () => {
    /*
     * v0.46: Aus Sicht des Spielers immer nach oben — man tippt unten an, die
     * Figuren rollen weg. Fuer Schwarz ist „unten" die andere Brettseite, weil
     * das Brett gedreht wird.
     */
    const schritte = SCHACH_VORSCHAU.schritte("nudelholz");
    const vorher = schritte[0].runde;
    const breite = SCHACH.breiteVon(vorher.stand);
    const hoehe = SCHACH.hoeheVon(vorher.stand);
    const moeglich = SCHACH_RUNDE.zielFelder(vorher, SCHACH_VORSCHAU.SPIELER, "nudelholz");

    wahr(moeglich.length > 0, "es gibt Felder zum Antippen");

    for (const feld of moeglich) {
        gleich(SCHACH.reiheVon(feld, breite), hoehe - 1,
            "Feld " + feld + " liegt auf der eigenen Grundreihe");
    }

    /* Und die Figuren wandern zur Gegenseite, also nach oben. */
    const letzter = schritte[schritte.length - 1];
    for (const weg of letzter.wege) {
        wahr(SCHACH.reiheVon(weg.nach, breite) < SCHACH.reiheVon(weg.von, breite),
            "die Figur rueckt nach vorn");
    }
});

pruefe("Die Auswahl im mittleren Schritt kommt aus der Regel", () => {
    /*
     * Nicht aufgezaehlt, sondern gefragt: `zielFelder` probiert jedes Feld
     * durch. Deshalb kann die Anleitung keine Felder anbieten, die es nicht
     * gibt — und keines vergessen.
     */
    const schritte = SCHACH_VORSCHAU.schritte("mauer");
    const beispiel = SCHACH_VORSCHAU.beispielVon("mauer");
    const moeglich = SCHACH_RUNDE.zielFelder(schritte[0].runde,
        SCHACH_VORSCHAU.SPIELER, "mauer");

    /* Seit v0.50 steht der Griff an den Vorrat davor — das Zielfeld ist Bild 3. */
    const zielSchritt = schritte[2];

    gleich(zielSchritt.wahl.length, moeglich.length - 1,
        "alle moeglichen Felder ausser dem angetippten");
    wahr(zielSchritt.wahl.indexOf(beispiel.ziel) === -1,
        "das angetippte steht nicht zweimal drin");
});

/* ------------------------------------------------------------------ *
 * Einzelne Beispiele, damit die Aussage stimmt
 * ------------------------------------------------------------------ */

pruefe("Sprung: das Nachher-Bild markiert Springerziele", () => {
    const bilder = SCHACH_VORSCHAU.bilder("sprung");
    /* Das Turmfeld steht im Beispiel, nicht hier — sonst muss dieser Test bei
       jeder neuen Ausgangsstellung mitgeaendert werden (v0.50 gelernt). */
    const turm = SCHACH_VORSCHAU.beispielVon("sprung").figur;

    gleich(bilder.nachher.runde.stand.zusatzMuster, "springer", "Muster gesetzt");
    wahr(bilder.nachher.ziele.length >= 4, "mehrere neue Ziele");

    /* Ein Springerzug vom Turmfeld aus: zwei Felder in die eine, eines in die
       andere Richtung — auf diesem Brett also nichts, was ein Turm koennte. */
    for (const feld of bilder.nachher.ziele) {
        const spalte = feld % SCHACH_VORSCHAU.BREITE;
        const reihe = Math.floor(feld / SCHACH_VORSCHAU.BREITE);
        const abstandSpalte = Math.abs(spalte - turm % SCHACH_VORSCHAU.BREITE);
        const abstandReihe = Math.abs(reihe - Math.floor(turm / SCHACH_VORSCHAU.BREITE));

        gleich(abstandSpalte * abstandReihe, 2, "Feld " + feld + " ist ein Springerziel");
    }
});

pruefe("Sprung: das letzte Bild zeigt wirklich den Schlag (v0.50)", () => {
    /*
     * Die Ausgangsstellung ist so gebaut, dass der vorgefuehrte Zug die
     * gegnerische Dame schlaegt — sonst zeigte die Anleitung einen Sprung ins
     * Leere, und der Satz darunter behauptete etwas anderes als das Bild.
     */
    const schritte = SCHACH_VORSCHAU.schritte("sprung");
    const letzter = schritte[schritte.length - 1];
    const beispiel = SCHACH_VORSCHAU.beispielVon("sprung");

    gleich(letzter.wege.length, 1, "ein Weg");
    gleich(letzter.wege[0].von, beispiel.figur, "vom Turmfeld");

    const dame = SCHACH_VORSCHAU._brett(beispiel.brett).indexOf("d");
    gleich(letzter.wege[0].nach, dame, "auf das Feld der Dame");
    gleich(SCHACH.figurAuf(letzter.runde.stand, dame), "T", "dort steht jetzt der Turm");
});

pruefe("Verstaerkung: aus dem Bauern wird wirklich ein Springer", () => {
    const bilder = SCHACH_VORSCHAU.bilder("verstaerkung");

    gleich(SCHACH.figurAuf(bilder.vorher.runde.stand, 20), "B", "vorher ein Bauer");
    gleich(SCHACH.figurAuf(bilder.nachher.runde.stand, 20), "S", "nachher ein Springer");
});

pruefe("Ausweichen: die Notbremse fuehrt auf ein SICHERES Feld (v0.74)", () => {
    /*
     * MELDUNG I4: „Im Ausweichen-Bild flieht der Turm nach b4, wo ihn der
     * schwarze Bauer von a5 schlaegt — die Notbremse fuehrt im Bild ins
     * Verderben."
     *
     * Der Test rechnet nach, was das Bild zeigt: Wohin die Figur ausweicht,
     * entscheiden die echten Regeln — geprueft wird, dass dieses Feld danach
     * von Schwarz NICHT bedroht ist. Ein Test, der ein bestimmtes Feld
     * verlangt, wuerde jede neue Stellung blockieren (Hausregel seit v0.50).
     */
    const bilder = SCHACH_VORSCHAU.bilder("ausweichen");
    const nachher = bilder.nachher.runde.stand;
    const ziele = bilder.nachher.ziele || [];

    wahr(ziele.length > 0, "das Bild zeigt ueberhaupt ein Fluchtfeld");

    /*
     * Bedroht Schwarz eines davon? Gefragt wird das Regelwerk (dieselbe
     * Funktion, die auch ueber Schach entscheidet) — nicht die Anschauung.
     * Genau daran ist die alte Szene gescheitert. Geprueft werden ALLE
     * gezeigten Ziele: Der Nutzer sieht sie alle und darf jedes waehlen.
     */
    for (const feld of ziele) {
        if (SCHACH._feldBedroht(nachher, feld, SCHACH.SCHWARZ)) {
            throw new Error("das gezeigte Fluchtfeld " + feld
                + " ist von Schwarz bedroht");
        }
    }
});

pruefe("Mauer: das Nachher-Bild traegt drei gesperrte Felder", () => {
    const bilder = SCHACH_VORSCHAU.bilder("mauer");
    const mauern = SCHACH.mauern(bilder.nachher.runde.stand);

    gleich(mauern.length, 1, "eine Mauer");
    gleich(mauern[0].felder.length, SCHACH.MAUER_LAENGE, "ueber drei Felder");
});

pruefe("Ausdehnung: das Brett im Nachher-Bild ist groesser", () => {
    const bilder = SCHACH_VORSCHAU.bilder("ausdehnung");
    const vorher = bilder.vorher.runde.stand;
    const nachher = bilder.nachher.runde.stand;

    wahr(nachher.breite * nachher.hoehe > vorher.breite * vorher.hoehe,
        "mehr Felder als vorher");
});

pruefe("Doppelzug: nach dem Zug ist dieselbe Seite wieder dran", () => {
    const bilder = SCHACH_VORSCHAU.bilder("doppelzug");

    gleich(bilder.nachher.runde.stand.amZug, SCHACH_VORSCHAU.FARBE,
        "Weiss ist noch einmal am Zug");
    wahr(bilder.nachher.marken.length > 0, "und hat Ziele");
});

pruefe("Jedes Beispielbrett hat genau 6 mal 6 Felder", () => {
    for (const art of alleArten) {
        const beispiel = SCHACH_VORSCHAU.beispielVon(art);
        const brett = SCHACH_VORSCHAU._brett(beispiel.brett);

        gleich(brett.length, SCHACH_VORSCHAU.BREITE * SCHACH_VORSCHAU.HOEHE,
            "Brettlaenge bei " + art);
    }
});

pruefe("In den Beispielen steht kein Koenig herum (v0.58)", () => {
    /*
     * BIS v0.57 STAND IN JEDEM BEISPIEL EIN KOENIGSPAAR, mit der Begruendung,
     * das Regelwerk brauche es. Am 08.08. nachgemessen: `imSchach` liefert ohne
     * Koenig schlicht `false`, und die Bilder laufen durch. Die beiden lenkten
     * also nur ab.
     *
     * Koenige gehoeren nur noch dorthin, wo Schach zur Sache gehoert — derzeit
     * nirgends. Kommt einmal eine Szene dazu, in der es um Matt geht, wird
     * dieser Test entsprechend geoeffnet.
     */
    for (const art of alleArten) {
        const brett = SCHACH_VORSCHAU._brett(SCHACH_VORSCHAU.beispielVon(art).brett);

        wahr(brett.indexOf("K") === -1 && brett.indexOf("k") === -1,
            "kein Koenig im Beispiel " + art);
    }
});

pruefe("Beide Seiten haben in jedem Beispiel noch etwas zu ziehen (v0.58)", () => {
    /*
     * TEUER GELERNT BEIM BAU VON v0.58: Wer in einer Szene die letzte Figur
     * einer Seite schlagen laesst, beendet die Partie — `SCHACH_RUNDE.ziehen`
     * erkennt Patt und setzt ein Ergebnis. Danach laesst sich keine Faehigkeit
     * mehr einsetzen, und die ganze Anleitung faellt weg (bei der Wiedergeburt
     * genau so passiert).
     *
     * Deshalb steht hier die Mindestbedingung: Auf jedem Beispielbrett hat
     * jede Seite wenigstens eine Figur.
     */
    for (const art of alleArten) {
        const brett = SCHACH_VORSCHAU._brett(SCHACH_VORSCHAU.beispielVon(art).brett);

        wahr(/[BTSLDK]/.test(brett), "Weiss hat eine Figur im Beispiel " + art);
        wahr(/[btsldk]/.test(brett), "Schwarz hat eine Figur im Beispiel " + art);
    }
});

/* ------------------------------------------------------------------ *
 * Ergebnis
 * ------------------------------------------------------------------ */

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
