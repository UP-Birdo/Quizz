/*
 * test-imposter.js — Regressionstests des Spiels Imposter.
 *
 * Geladen werden die ECHTEN Dateien js\imposter-woerter.js und
 * js\imposter-runde.js. Der Wortkatalog steht dort als globale Größe bereit,
 * genau wie im Browser.
 */

const pfad = require("path");

globalThis.IMPOSTER_WOERTER = require(pfad.join(__dirname, "..", "js", "imposter-woerter.js"));
globalThis.IMPOSTER_RUNDE = require(pfad.join(__dirname, "..", "js", "imposter-runde.js"));
const IMPOSTER_RUNDE = globalThis.IMPOSTER_RUNDE;
const IMPOSTER_TAFEL = require(pfad.join(__dirname, "..", "js", "imposter-tafel.js"));
const IMPOSTER_WOERTER = globalThis.IMPOSTER_WOERTER;

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

/* Eine Runde mit vier Mitspielern, alle bereit. */
function bereiteRunde(anzahl) {
    let runde = IMPOSTER_RUNDE.leereRunde(1000);

    for (let nummer = 1; nummer <= (anzahl || 4); nummer++) {
        runde = IMPOSTER_RUNDE.beitreten(runde, "id-" + nummer, 1000);
        runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-" + nummer, true, 1000);
    }
    return runde;
}

/* Eine gestartete Runde. */
function laufendeRunde(anzahl, salz) {
    return IMPOSTER_RUNDE.starten(bereiteRunde(anzahl), salz || "abc123", 2000);
}

/* ------------------------------------------------------------------ *
 * Wortkatalog
 * ------------------------------------------------------------------ */

pruefe("Der Katalog hat Gruppen mit genug Woertern", () => {
    wahr(IMPOSTER_WOERTER.gruppen.length >= 5, "mindestens fuenf Gruppen");
    wahr(IMPOSTER_WOERTER.anzahl() >= 150, "mindestens 150 Woerter insgesamt");

    for (const gruppe of IMPOSTER_WOERTER.gruppen) {
        wahr(gruppe.woerter.length >= 20, gruppe.id + " hat genug Woerter");
        wahr(["thema", "wortart"].indexOf(gruppe.art) !== -1, gruppe.id + " hat eine Art");
    }
});

pruefe("Kein Wort steht doppelt in derselben Gruppe", () => {
    for (const gruppe of IMPOSTER_WOERTER.gruppen) {
        const einmalig = new Set(gruppe.woerter.map((wort) => wort.toLowerCase()));
        gleich(einmalig.size, gruppe.woerter.length, "Gruppe " + gruppe.id);
    }
});

pruefe("Unbekannte Gruppen fallen auf die erste zurueck", () => {
    gleich(IMPOSTER_WOERTER.gruppe("gibtsnicht").id, IMPOSTER_WOERTER.gruppen[0].id,
        "Rueckfall");
    gleich(IMPOSTER_WOERTER.gibtEs("gibtsnicht"), false, "gibtEs sagt nein");
    gleich(IMPOSTER_WOERTER.gibtEs("alltag"), true, "und bei einer echten ja");
});

/* ------------------------------------------------------------------ *
 * Eigene Wörter (Bibliothek)
 * ------------------------------------------------------------------ */

pruefe("Eingefuegte Woerter landen hinten in der Gruppe", () => {
    const gruppe = IMPOSTER_WOERTER.gruppen[0];
    const vorher = gruppe.woerter.length;

    const ergebnis = IMPOSTER_RUNDE.woerterErgaenzen(IMPOSTER_RUNDE.leereRunde(1000),
        gruppe.id, "Kaminfeuer\nDachrinne\n\n  Fensterbank  ", 2000);

    gleich(ergebnis.hinzugefuegt, 3, "drei Woerter");
    gleich(ergebnis.uebersprungen, 0, "nichts uebersprungen");

    const alle = IMPOSTER_RUNDE.woerterVon(ergebnis.runde, gruppe.id);
    gleich(alle.length, vorher + 3, "Liste ist gewachsen");
    gleich(alle[vorher], "Kaminfeuer", "das erste neue steht hinten");
    gleich(alle[vorher + 2], "Fensterbank", "und ist beschnitten");

    /* Der feste Katalog bleibt unberuehrt. */
    gleich(gruppe.woerter.length, vorher, "Katalog unveraendert");
});

pruefe("Was schon dasteht, wird uebersprungen", () => {
    const gruppe = IMPOSTER_WOERTER.gruppen[0];
    const schonDa = gruppe.woerter[0];

    let ergebnis = IMPOSTER_RUNDE.woerterErgaenzen(IMPOSTER_RUNDE.leereRunde(1000),
        gruppe.id, schonDa + "\n" + schonDa.toLowerCase() + "\nGanzNeu", 2000);

    gleich(ergebnis.hinzugefuegt, 1, "nur das neue");
    gleich(ergebnis.uebersprungen, 2, "zwei uebersprungen");

    /* Auch gegen die schon ergaenzten. */
    ergebnis = IMPOSTER_RUNDE.woerterErgaenzen(ergebnis.runde, gruppe.id, "GanzNeu", 2100);
    gleich(ergebnis.hinzugefuegt, 0, "kein zweites Mal");
});

pruefe("Ergaenzte Woerter lassen sich wieder entfernen", () => {
    const gruppe = IMPOSTER_WOERTER.gruppen[0];
    let runde = IMPOSTER_RUNDE.woerterErgaenzen(IMPOSTER_RUNDE.leereRunde(1000),
        gruppe.id, "Kaminfeuer", 2000).runde;

    runde = IMPOSTER_RUNDE.wortEntfernen(runde, gruppe.id, "Kaminfeuer", 2100);

    gleich(IMPOSTER_RUNDE.woerterVon(runde, gruppe.id).length, gruppe.woerter.length,
        "wieder wie vorher");
    gleich(runde.eigeneWoerter[gruppe.id], undefined, "leere Liste faellt weg");
});

pruefe("Ein ergaenztes Wort kann auch gezogen werden", () => {
    const gruppe = IMPOSTER_WOERTER.gruppen[0];
    let runde = bereiteRunde(3);
    runde = IMPOSTER_RUNDE.einstellen(runde, gruppe.id, 1, 1000);
    runde = IMPOSTER_RUNDE.woerterErgaenzen(runde, gruppe.id, "Kaminfeuer", 1500).runde;

    /* Ueber viele Salze muss das neue Wort irgendwann drankommen. */
    let getroffen = false;
    for (let nummer = 0; nummer < 200 && !getroffen; nummer++) {
        const gestartet = IMPOSTER_RUNDE.starten(runde, "w" + nummer, 2000);
        if (IMPOSTER_RUNDE.wortVon(gestartet) === "Kaminfeuer") {
            getroffen = true;
        }
    }

    wahr(getroffen, "das ergaenzte Wort wird gezogen");
});

pruefe("Eigene Woerter ueberleben das Speichern und Laden", () => {
    const gruppe = IMPOSTER_WOERTER.gruppen[0];
    const runde = IMPOSTER_RUNDE.woerterErgaenzen(IMPOSTER_RUNDE.leereRunde(1000),
        gruppe.id, "Kaminfeuer", 2000).runde;

    const wieder = IMPOSTER_RUNDE.normalisieren(JSON.parse(JSON.stringify(runde)));
    gleich(wieder.eigeneWoerter[gruppe.id].join(","), "Kaminfeuer", "steht noch da");

    /* Unsinn wird weggeworfen. */
    const kaputt = IMPOSTER_RUNDE.normalisieren({
        eigeneWoerter: { gibtsnicht: ["x"], alltag: ["", "   ", 42, "Gut"] }
    });
    gleich(kaputt.eigeneWoerter.gibtsnicht, undefined, "unbekannte Gruppe weg");
    gleich(kaputt.eigeneWoerter.alltag.join(","), "Gut", "nur das brauchbare bleibt");
});

/* ------------------------------------------------------------------ *
 * Grundstrukturen
 * ------------------------------------------------------------------ */

pruefe("Eine leere Runde wartet und hat niemanden", () => {
    const runde = IMPOSTER_RUNDE.leereRunde();

    gleich(runde.phase, "warten", "Phase");
    gleich(runde.spieler.length, 0, "keine Spieler");
    gleich(runde.salz, "", "kein Salz");
    gleich(IMPOSTER_RUNDE.wortVon(runde), "", "und kein Wort");
});

pruefe("Unsinn wird zu einer gueltigen Runde", () => {
    gleich(IMPOSTER_RUNDE.normalisieren(null).phase, "warten", "null");
    gleich(IMPOSTER_RUNDE.normalisieren("kaputt").spieler.length, 0, "Text");
    gleich(IMPOSTER_RUNDE.normalisieren({ phase: "gelb" }).phase, "warten", "Phase");
    gleich(IMPOSTER_RUNDE.normalisieren({ impostermenge: 99 }).impostermenge, 1, "zu viele");
    gleich(IMPOSTER_RUNDE.normalisieren({ salz: "!!!" }).salz, "", "unsauberes Salz");
});

pruefe("Man tritt bei und wird nicht doppelt aufgenommen", () => {
    let runde = IMPOSTER_RUNDE.beitreten(IMPOSTER_RUNDE.leereRunde(1000), "id-1", 1000);
    runde = IMPOSTER_RUNDE.beitreten(runde, "id-1", 1000);
    runde = IMPOSTER_RUNDE.beitreten(runde, "id-2", 1000);

    gleich(runde.spieler.length, 2, "zwei Mitspieler");

    runde = IMPOSTER_RUNDE.verlassen(runde, "id-1", 1100);
    gleich(runde.spieler.length, 1, "einer weg");
});

pruefe("Gestartet wird erst, wenn zwei da und alle bereit sind", () => {
    let runde = IMPOSTER_RUNDE.beitreten(IMPOSTER_RUNDE.leereRunde(1000), "id-1", 1000);
    gleich(IMPOSTER_RUNDE.kannStarten(runde), false, "allein nicht");

    runde = IMPOSTER_RUNDE.beitreten(runde, "id-2", 1000);
    gleich(IMPOSTER_RUNDE.kannStarten(runde), false, "ohne bereit nicht");

    runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-1", true, 1000);
    gleich(IMPOSTER_RUNDE.kannStarten(runde), false, "einer allein reicht nicht");

    runde = IMPOSTER_RUNDE.bereitSetzen(runde, "id-2", true, 1000);
    gleich(IMPOSTER_RUNDE.kannStarten(runde), true, "jetzt geht es");

    gleich(IMPOSTER_RUNDE.starten(IMPOSTER_RUNDE.leereRunde(1000), "abc", 2000), null,
        "eine leere Runde startet nicht");
});

/* ------------------------------------------------------------------ *
 * Wort und Rollen — der Kern
 * ------------------------------------------------------------------ */

pruefe("Weder Wort noch Rollen stehen im gespeicherten Stand", () => {
    const runde = laufendeRunde(4);
    const wort = IMPOSTER_RUNDE.wortVon(runde);

    wahr(!!wort, "es gibt ein Wort");

    /*
     * Der Kern der Geheimhaltung: Was gespeichert wird, verrät weder das Wort
     * noch, wer Imposter ist. In der Datenbank steht nur das Salz.
     */
    const gespeichert = JSON.stringify(runde);

    wahr(gespeichert.indexOf(wort) === -1, "das Wort steht nicht drin");
    wahr(gespeichert.indexOf("imposter\":true") === -1, "keine Rolle steht drin");

    for (const id of IMPOSTER_RUNDE.imposterListe(runde)) {
        const eintrag = IMPOSTER_RUNDE.spielerFinden(runde, id);
        gleich(Object.keys(eintrag).sort().join(","),
            "bereit,fertig,id,tipps,wortTipp", "der Eintrag hat kein Rollenfeld");
    }
});

pruefe("Wort und Rollen sind auf jedem Geraet dieselben", () => {
    const eine = laufendeRunde(4, "salz01");
    const zwei = laufendeRunde(4, "salz01");

    gleich(IMPOSTER_RUNDE.wortVon(eine), IMPOSTER_RUNDE.wortVon(zwei), "dasselbe Wort");
    gleich(IMPOSTER_RUNDE.imposterListe(eine).join(","),
        IMPOSTER_RUNDE.imposterListe(zwei).join(","), "dieselben Rollen");
});

pruefe("Ein anderes Salz ergibt eine andere Runde", () => {
    const eine = laufendeRunde(4, "salz01");
    const zwei = laufendeRunde(4, "salz02");

    wahr(IMPOSTER_RUNDE.wortVon(eine) !== IMPOSTER_RUNDE.wortVon(zwei)
        || IMPOSTER_RUNDE.imposterListe(eine).join(",")
            !== IMPOSTER_RUNDE.imposterListe(zwei).join(","), "nicht identisch");
});

pruefe("Das Wort stammt aus der gewaehlten Gruppe", () => {
    for (const gruppe of IMPOSTER_WOERTER.gruppen) {
        let runde = IMPOSTER_RUNDE.einstellen(bereiteRunde(4), gruppe.id, 1, 1000);
        runde = IMPOSTER_RUNDE.starten(runde, "abc123", 2000);

        wahr(gruppe.woerter.indexOf(IMPOSTER_RUNDE.wortVon(runde)) !== -1,
            "Wort aus " + gruppe.id);
    }
});

pruefe("Es ist NIE jeder Imposter — mindestens einer kennt das Wort", () => {
    /* Auch wenn jemand zehn Imposter bei vier Mitspielern einstellt. */
    for (let salz = 0; salz < 60; salz++) {
        let runde = IMPOSTER_RUNDE.einstellen(bereiteRunde(4), "alltag", 10, 1000);
        runde = IMPOSTER_RUNDE.starten(runde, "s" + salz, 2000);

        const imposter = IMPOSTER_RUNDE.imposterListe(runde);
        wahr(imposter.length <= runde.spieler.length - 1,
            "bei Salz s" + salz + " sind es " + imposter.length + " von 4");
    }
});

pruefe("Es koennen weniger Imposter sein als eingestellt, manchmal keiner", () => {
    let hoechstens = 0;
    let ohne = 0;

    for (let salz = 0; salz < 200; salz++) {
        let runde = IMPOSTER_RUNDE.einstellen(bereiteRunde(5), "alltag", 2, 1000);
        runde = IMPOSTER_RUNDE.starten(runde, "z" + salz, 2000);

        const anzahl = IMPOSTER_RUNDE.imposterListe(runde).length;
        wahr(anzahl <= 2, "nie mehr als eingestellt");

        if (anzahl === 2) {
            hoechstens++;
        }
        if (anzahl === 0) {
            ohne++;
        }
    }

    wahr(hoechstens > 0, "meistens die volle Zahl");
    wahr(ohne > 0, "aber manchmal gar keiner");
    wahr(ohne < 20, "und das selten (" + ohne + " von 200)");
});

/* ------------------------------------------------------------------ *
 * Ablauf
 * ------------------------------------------------------------------ */

pruefe("Tipps lassen sich setzen und wieder zuruecknehmen", () => {
    let runde = laufendeRunde(3);

    runde = IMPOSTER_RUNDE.tippSetzen(runde, "id-1", "id-2", "imposter", 2100);
    gleich(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").tipps["id-2"], "imposter", "gesetzt");

    runde = IMPOSTER_RUNDE.tippSetzen(runde, "id-1", "id-2", "save", 2200);
    gleich(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").tipps["id-2"], "save", "geaendert");

    /* „neutral" ist der Grundzustand und wird nicht gespeichert. */
    runde = IMPOSTER_RUNDE.tippSetzen(runde, "id-1", "id-2", "neutral", 2300);
    gleich(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").tipps["id-2"], undefined, "zurueck");
});

pruefe("Auf sich selbst und auf Fremde tippt niemand", () => {
    let runde = laufendeRunde(3);

    runde = IMPOSTER_RUNDE.tippSetzen(runde, "id-1", "id-1", "imposter", 2100);
    gleich(Object.keys(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").tipps).length, 0,
        "nicht auf sich selbst");

    runde = IMPOSTER_RUNDE.tippSetzen(runde, "id-1", "id-99", "imposter", 2100);
    gleich(Object.keys(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").tipps).length, 0,
        "nicht auf Unbeteiligte");
});

pruefe("Sind alle fertig, loest sich die Runde auf", () => {
    let runde = laufendeRunde(3);

    runde = IMPOSTER_RUNDE.fertigSetzen(runde, "id-1", true, 3000);
    gleich(runde.phase, "laeuft", "einer reicht nicht");

    runde = IMPOSTER_RUNDE.fertigSetzen(runde, "id-2", true, 3100);
    runde = IMPOSTER_RUNDE.fertigSetzen(runde, "id-3", true, 3200);

    gleich(runde.phase, "aufloesung", "jetzt aufgeloest");
    gleich(runde.endeAm, 3200, "mit Endzeitpunkt");
});

pruefe("Waehrend der Runde aendert niemand mehr die Einstellungen", () => {
    let runde = laufendeRunde(3);
    const vorher = runde.gruppe;

    runde = IMPOSTER_RUNDE.einstellen(runde, "technik", 3, 2500);
    gleich(runde.gruppe, vorher, "Gruppe unveraendert");
    gleich(runde.impostermenge, 1, "Anzahl unveraendert");

    runde = IMPOSTER_RUNDE.beitreten(runde, "id-neu", 2500);
    gleich(runde.spieler.length, 3, "und niemand kommt mehr dazu");
});

pruefe("Eine neue Runde setzt alles zurueck, die Mitspieler bleiben", () => {
    let runde = laufendeRunde(3);
    runde = IMPOSTER_RUNDE.tippSetzen(runde, "id-1", "id-2", "imposter", 2100);
    runde = IMPOSTER_RUNDE.wortTippSetzen(runde, "id-1", "Regenschirm", 2200);

    runde = IMPOSTER_RUNDE.neueRunde(runde, 4000);

    gleich(runde.phase, "warten", "wartet wieder");
    gleich(runde.salz, "", "kein Salz mehr");
    gleich(runde.spieler.length, 3, "alle noch da");
    gleich(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").bereit, false, "nicht mehr bereit");
    gleich(Object.keys(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").tipps).length, 0,
        "keine Tipps mehr");
    gleich(IMPOSTER_RUNDE.spielerFinden(runde, "id-1").wortTipp, "", "kein Worttipp mehr");
});

/* ------------------------------------------------------------------ *
 * Das geratene Wort
 * ------------------------------------------------------------------ */

pruefe("Beim Wort zaehlen Gross- und Kleinschreibung nicht", () => {
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "regenschirm"), "klein");
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "REGENSCHIRM"), "gross");
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "  Regenschirm  "), "mit Leerzeichen");
});

pruefe("Ein Buchstabe daneben zaehlt noch als richtig", () => {
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "Regenschrim"), "vertauscht");
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "Regenschir"), "einer fehlt");
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "Regenschirms"), "einer zu viel");
    wahr(IMPOSTER_RUNDE.wortPasst("Regenschirm", "Ragenschirm"), "einer falsch");

    gleich(IMPOSTER_RUNDE.wortPasst("Regenschirm", "Ragenschrim"), false, "zwei sind zu viel");
    gleich(IMPOSTER_RUNDE.wortPasst("Regenschirm", "Sonnenschirm"), false, "anderes Wort");
    gleich(IMPOSTER_RUNDE.wortPasst("Regenschirm", ""), false, "nichts geraten");
});

/* ------------------------------------------------------------------ *
 * Auswertung
 * ------------------------------------------------------------------ */

pruefe("Wer richtig tippt, bekommt Punkte", () => {
    let runde = laufendeRunde(4, "abc123");
    const imposter = IMPOSTER_RUNDE.imposterListe(runde);
    wahr(imposter.length > 0, "es gibt einen Imposter");

    const ehrlich = runde.spieler.find((eintrag) => imposter.indexOf(eintrag.id) === -1);

    /* Der Ehrliche tippt den Imposter richtig. */
    runde = IMPOSTER_RUNDE.tippSetzen(runde, ehrlich.id, imposter[0], "imposter", 2100);

    for (const spieler of runde.spieler) {
        runde = IMPOSTER_RUNDE.fertigSetzen(runde, spieler.id, true, 3000);
    }

    const ergebnis = IMPOSTER_RUNDE.ergebnis(runde);
    const seiner = ergebnis.find((eintrag) => eintrag.id === ehrlich.id);

    gleich(seiner.richtig, 1, "ein richtiger Tipp");
    gleich(seiner.falsch, 0, "kein falscher");
    wahr(seiner.punkte >= IMPOSTER_RUNDE.PUNKTE_RICHTIG_GETIPPT, "Punkte dafuer");
});

pruefe("Ein unentdeckter Imposter bekommt seine Punkte", () => {
    let runde = laufendeRunde(4, "abc123");
    const imposter = IMPOSTER_RUNDE.imposterListe(runde)[0];

    /* Niemand tippt ihn. */
    for (const spieler of runde.spieler) {
        runde = IMPOSTER_RUNDE.fertigSetzen(runde, spieler.id, true, 3000);
    }

    const seiner = IMPOSTER_RUNDE.ergebnis(runde)
        .find((eintrag) => eintrag.id === imposter);

    gleich(seiner.imposter, true, "war Imposter");
    wahr(seiner.punkte >= IMPOSTER_RUNDE.PUNKTE_IMPOSTER_UNENTDECKT, "unentdeckt belohnt");
});

pruefe("Ein enttarnter Imposter bekommt sie nicht", () => {
    let runde = laufendeRunde(4, "abc123");
    const imposter = IMPOSTER_RUNDE.imposterListe(runde)[0];

    /* Alle anderen tippen ihn. */
    for (const spieler of runde.spieler) {
        if (spieler.id !== imposter) {
            runde = IMPOSTER_RUNDE.tippSetzen(runde, spieler.id, imposter, "imposter", 2100);
        }
        runde = IMPOSTER_RUNDE.fertigSetzen(runde, spieler.id, true, 3000);
    }

    const seiner = IMPOSTER_RUNDE.ergebnis(runde)
        .find((eintrag) => eintrag.id === imposter);

    wahr(seiner.punkte < IMPOSTER_RUNDE.PUNKTE_IMPOSTER_UNENTDECKT, "keine Punkte fuers Verstecken");
});

pruefe("Der Imposter bekommt Punkte, wenn er das Wort erraet", () => {
    let runde = laufendeRunde(4, "abc123");
    const imposter = IMPOSTER_RUNDE.imposterListe(runde)[0];
    const wort = IMPOSTER_RUNDE.wortVon(runde);

    runde = IMPOSTER_RUNDE.wortTippSetzen(runde, imposter, wort.toLowerCase(), 2200);
    for (const spieler of runde.spieler) {
        runde = IMPOSTER_RUNDE.fertigSetzen(runde, spieler.id, true, 3000);
    }

    const seiner = IMPOSTER_RUNDE.ergebnis(runde)
        .find((eintrag) => eintrag.id === imposter);

    gleich(seiner.wortRichtig, true, "Wort erraten");
    wahr(seiner.punkte >= IMPOSTER_RUNDE.PUNKTE_WORT_ERRATEN, "und belohnt");
});

pruefe("Ein Ehrlicher bekommt keine Wort-Punkte, auch wenn er es hinschreibt", () => {
    let runde = laufendeRunde(4, "abc123");
    const imposter = IMPOSTER_RUNDE.imposterListe(runde);
    const ehrlich = runde.spieler.find((eintrag) => imposter.indexOf(eintrag.id) === -1);

    runde = IMPOSTER_RUNDE.wortTippSetzen(runde, ehrlich.id,
        IMPOSTER_RUNDE.wortVon(runde), 2200);
    for (const spieler of runde.spieler) {
        runde = IMPOSTER_RUNDE.fertigSetzen(runde, spieler.id, true, 3000);
    }

    const seiner = IMPOSTER_RUNDE.ergebnis(runde)
        .find((eintrag) => eintrag.id === ehrlich.id);

    gleich(seiner.wortRichtig, false, "er kannte es ja");
});

pruefe("Eine schnelle Runde bringt allen einen Zuschlag", () => {
    let schnell = laufendeRunde(3, "abc123");
    for (const spieler of schnell.spieler) {
        schnell = IMPOSTER_RUNDE.fertigSetzen(schnell, spieler.id, true, 2000 + 60000);
    }

    let langsam = laufendeRunde(3, "abc123");
    for (const spieler of langsam.spieler) {
        langsam = IMPOSTER_RUNDE.fertigSetzen(langsam, spieler.id, true,
            2000 + (IMPOSTER_RUNDE.TEMPO_SEKUNDEN + 60) * 1000);
    }

    const einer = IMPOSTER_RUNDE.ergebnis(schnell)[0];
    const anderer = IMPOSTER_RUNDE.ergebnis(langsam)[0];

    gleich(einer.punkte - anderer.punkte, IMPOSTER_RUNDE.PUNKTE_TEMPO, "Zuschlag");
});

pruefe("Die Erklaerung nennt dieselben Zahlen wie die Rechnung", () => {
    const text = IMPOSTER_RUNDE.punkteErklaerung();

    for (const zahl of [IMPOSTER_RUNDE.PUNKTE_TEILNAHME, IMPOSTER_RUNDE.PUNKTE_RICHTIG_GETIPPT,
        IMPOSTER_RUNDE.PUNKTE_IMPOSTER_UNENTDECKT, IMPOSTER_RUNDE.PUNKTE_WORT_ERRATEN,
        IMPOSTER_RUNDE.PUNKTE_TEMPO]) {
        wahr(text.indexOf(String(zahl)) !== -1, "Zahl " + zahl + " steht im Text");
    }
});

/* ------------------------------------------------------------------ *
 * Zusammenführen und Vergleich
 * ------------------------------------------------------------------ */

pruefe("Beim Zusammenfuehren bleibt jeder Herr ueber seinen Eintrag", () => {
    const start = laufendeRunde(3, "abc123");

    /* Zwei Geräte ändern gleichzeitig verschiedene Einträge. */
    const einer = IMPOSTER_RUNDE.tippSetzen(start, "id-1", "id-2", "imposter", 2100);
    const anderer = IMPOSTER_RUNDE.tippSetzen(start, "id-3", "id-2", "save", 2200);

    const zusammen = IMPOSTER_RUNDE.zusammenfuehren(anderer, einer, "id-1");

    gleich(IMPOSTER_RUNDE.spielerFinden(zusammen, "id-1").tipps["id-2"], "imposter",
        "mein Tipp bleibt");
    gleich(IMPOSTER_RUNDE.spielerFinden(zusammen, "id-3").tipps["id-2"], "save",
        "der fremde auch");
});

pruefe("Wer startet, setzt sich durch", () => {
    const wartend = bereiteRunde(3);
    const gestartet = IMPOSTER_RUNDE.starten(wartend, "abc123", 2000);

    /* Mein Gerät hat gestartet, der Server kennt noch die wartende Runde. */
    const zusammen = IMPOSTER_RUNDE.zusammenfuehren(wartend, gestartet, "id-1");

    gleich(zusammen.phase, "laeuft", "die Runde laeuft");
    gleich(zusammen.salz, gestartet.salz, "mit meinem Salz");
});

pruefe("Der Vergleich erkennt Aenderungen", () => {
    const einer = laufendeRunde(3, "abc123");

    wahr(IMPOSTER_RUNDE.inhaltGleich(einer, IMPOSTER_RUNDE.kopieren(einer)), "gleich");

    const mitTipp = IMPOSTER_RUNDE.tippSetzen(einer, "id-1", "id-2", "imposter", 2100);
    gleich(IMPOSTER_RUNDE.inhaltGleich(einer, mitTipp), false, "Tipp faellt auf");

    const fertig = IMPOSTER_RUNDE.fertigSetzen(einer, "id-1", true, 2100);
    gleich(IMPOSTER_RUNDE.inhaltGleich(einer, fertig), false, "Fertig faellt auf");
});

/* ------------------------------------------------------------------ *
 * Die Tafel: mehrere Räume nebeneinander (seit v3.2)
 * ------------------------------------------------------------------ */

/* Eine Tafel mit einem Raum, in dem `anzahl` Mitspieler sitzen. */
function tafelMitRaum(anzahl, titel) {
    const angelegt = IMPOSTER_TAFEL.raumAnlegen(
        IMPOSTER_TAFEL.leereTafel(1000), titel || "Raum",
        { gruppe: "essen", impostermenge: 2 }, 1000);

    let raum = angelegt.raum;
    for (let nummer = 1; nummer <= (anzahl || 2); nummer++) {
        raum = IMPOSTER_RUNDE.beitreten(raum, "id-" + nummer, 1000);
    }

    return { tafel: IMPOSTER_TAFEL.raumEinsetzen(angelegt.tafel, raum, 1000), id: raum.id };
}

pruefe("Ein angelegter Raum behaelt Name und Einstellungen", () => {
    const stand = tafelMitRaum(2, "Feierabend");
    const raum = IMPOSTER_TAFEL.raum(stand.tafel, stand.id);

    gleich(raum.titel, "Feierabend", "Name");
    gleich(raum.gruppe, "essen", "Thema");
    gleich(raum.impostermenge, 2, "Anzahl");
    gleich(raum.spieler.length, 2, "Mitspieler");
});

pruefe("Name und Einstellungen ueberleben das Speichern", () => {
    const stand = tafelMitRaum(2, "Feierabend");

    /* Wie bei Firebase: einmal durch JSON und zurueck. */
    const zurueck = IMPOSTER_TAFEL.normalisieren(JSON.parse(JSON.stringify(stand.tafel)));
    const raum = IMPOSTER_TAFEL.raum(zurueck, stand.id);

    gleich(raum.titel, "Feierabend", "Name");
    gleich(raum.id, stand.id, "Kennung");
    gleich(raum.gruppe, "essen", "Thema");
});

pruefe("Zwei Raeume stehen unabhaengig nebeneinander", () => {
    const erster = tafelMitRaum(2, "Erster");
    const zweiter = IMPOSTER_TAFEL.raumAnlegen(erster.tafel, "Zweiter",
        { gruppe: "natur", impostermenge: 1 }, 2000);

    gleich(IMPOSTER_TAFEL.anzahl(zweiter.tafel), 2, "zwei Raeume");
    gleich(IMPOSTER_TAFEL.raum(zweiter.tafel, erster.id).titel, "Erster", "der erste bleibt");
    gleich(IMPOSTER_TAFEL.raum(zweiter.tafel, zweiter.raum.id).gruppe, "natur", "eigenes Thema");
});

pruefe("Ein Raum laesst sich entfernen, ohne die anderen zu treffen", () => {
    const erster = tafelMitRaum(2, "Erster");
    const zweiter = IMPOSTER_TAFEL.raumAnlegen(erster.tafel, "Zweiter", {}, 2000);

    const ohne = IMPOSTER_TAFEL.raumEntfernen(zweiter.tafel, zweiter.raum.id, 3000);

    gleich(IMPOSTER_TAFEL.anzahl(ohne), 1, "einer bleibt");
    wahr(IMPOSTER_TAFEL.raum(ohne, erster.id) !== null, "und zwar der erste");
});

pruefe("Eine alte Einzel-Runde wird zum Raum 'start'", () => {
    /* Genau der Stand, der bis v3.1 in der Datenbank lag. */
    let alt = IMPOSTER_RUNDE.beitreten(IMPOSTER_RUNDE.leereRunde(1000), "id-1", 1000);
    alt = IMPOSTER_RUNDE.beitreten(alt, "id-2", 1000);
    alt = IMPOSTER_RUNDE.bereitSetzen(alt, "id-1", true, 1000);
    alt = IMPOSTER_RUNDE.bereitSetzen(alt, "id-2", true, 1000);
    alt = IMPOSTER_RUNDE.starten(alt, "altsalz", 2000);

    const tafel = IMPOSTER_TAFEL.normalisieren(alt);
    const raum = IMPOSTER_TAFEL.raum(tafel, IMPOSTER_TAFEL.ERSTE_ID);

    wahr(raum !== null, "der Raum entsteht");
    gleich(raum.phase, "laeuft", "die Runde laeuft weiter");
    gleich(raum.salz, "altsalz", "mit demselben Salz");
    gleich(raum.spieler.length, 2, "mit denselben Mitspielern");
    gleich(IMPOSTER_RUNDE.wortVon(raum), IMPOSTER_RUNDE.wortVon(alt), "und demselben Wort");
});

pruefe("Eine leere Ablage wird nicht zum Raum", () => {
    gleich(IMPOSTER_TAFEL.anzahl(IMPOSTER_TAFEL.normalisieren(null)), 0, "aus null");
    gleich(IMPOSTER_TAFEL.anzahl(IMPOSTER_TAFEL.normalisieren({})), 0, "aus leer");
});

pruefe("Die Wortbibliothek gilt fuer alle Raeume", () => {
    const erster = tafelMitRaum(2, "Erster");
    const zweiter = IMPOSTER_TAFEL.raumAnlegen(erster.tafel, "Zweiter", {}, 2000);

    const ergebnis = IMPOSTER_TAFEL.woerterErgaenzen(
        zweiter.tafel, "essen", "Kartoffelpuffer\nSpaghetti", 3000);

    gleich(ergebnis.hinzugefuegt, 1, "eines ist neu");
    gleich(ergebnis.uebersprungen, 1, "Spaghetti gibt es schon");

    for (const raum of IMPOSTER_TAFEL.liste(ergebnis.tafel)) {
        wahr(IMPOSTER_RUNDE.woerterVon(raum, "essen").indexOf("Kartoffelpuffer") !== -1,
            "der Raum " + raum.titel + " kennt das Wort");
    }
});

pruefe("Ein entferntes Wort kommt nicht aus einem Raum zurueck", () => {
    const stand = tafelMitRaum(2, "Erster");
    const mit = IMPOSTER_TAFEL.woerterErgaenzen(stand.tafel, "essen", "Kartoffelpuffer", 2000);
    const ohne = IMPOSTER_TAFEL.wortEntfernen(mit.tafel, "essen", "Kartoffelpuffer", 3000);

    /* Der Weg ueber JSON ist der entscheidende: Beim Laden darf das Wort nicht
       aus dem Raum wieder auf die Tafel wandern. */
    const zurueck = IMPOSTER_TAFEL.normalisieren(JSON.parse(JSON.stringify(ohne)));
    const raum = IMPOSTER_TAFEL.raum(zurueck, stand.id);

    gleich(IMPOSTER_RUNDE.woerterVon(raum, "essen").indexOf("Kartoffelpuffer"), -1,
        "das Wort ist weg");
});

pruefe("Zusammenfuehren behaelt fremde Raeume und fremde Woerter", () => {
    const gemeinsam = tafelMitRaum(2, "Gemeinsam");

    /* Der Server kennt zusaetzlich einen Raum, den jemand anders angelegt hat. */
    const fremd = IMPOSTER_TAFEL.raumAnlegen(gemeinsam.tafel, "Fremd", {}, 2000).tafel;
    const fremdMitWort = IMPOSTER_TAFEL.woerterErgaenzen(
        fremd, "essen", "Ofenkaese", 2100).tafel;

    /* Mein Stand kennt den fremden Raum nicht, dafuer ein eigenes Wort. */
    const meinsMitWort = IMPOSTER_TAFEL.woerterErgaenzen(
        gemeinsam.tafel, "essen", "Kartoffelpuffer", 2200).tafel;

    const zusammen = IMPOSTER_TAFEL.zusammenfuehren(fremdMitWort, meinsMitWort, "id-1");

    gleich(IMPOSTER_TAFEL.anzahl(zusammen), 2, "beide Raeume");

    const woerter = zusammen.eigeneWoerter.essen;
    wahr(woerter.indexOf("Ofenkaese") !== -1, "das fremde Wort bleibt");
    wahr(woerter.indexOf("Kartoffelpuffer") !== -1, "das eigene Wort kommt dazu");
});

pruefe("Zusammenfuehren rettet den eigenen Tipp in einem Raum", () => {
    const stand = tafelMitRaum(3, "Runde");

    let raum = IMPOSTER_TAFEL.raum(stand.tafel, stand.id);
    for (let nummer = 1; nummer <= 3; nummer++) {
        raum = IMPOSTER_RUNDE.bereitSetzen(raum, "id-" + nummer, true, 1000);
    }
    raum = IMPOSTER_RUNDE.starten(raum, "salzsalz", 2000);

    const gestartet = IMPOSTER_TAFEL.raumEinsetzen(stand.tafel, raum, 2000);

    /* Auf dem Server tippt id-2, bei mir tippt id-1. Beide muessen bleiben. */
    const fremd = IMPOSTER_TAFEL.raumEinsetzen(gestartet,
        IMPOSTER_RUNDE.tippSetzen(raum, "id-2", "id-3", "imposter", 2100), 2100);
    const meins = IMPOSTER_TAFEL.raumEinsetzen(gestartet,
        IMPOSTER_RUNDE.tippSetzen(raum, "id-1", "id-3", "imposter", 2200), 2200);

    const zusammen = IMPOSTER_TAFEL.zusammenfuehren(fremd, meins, "id-1");
    const ergebnis = IMPOSTER_TAFEL.raum(zusammen, stand.id);

    gleich(IMPOSTER_RUNDE.spielerFinden(ergebnis, "id-1").tipps["id-3"], "imposter",
        "mein Tipp");
    gleich(IMPOSTER_RUNDE.spielerFinden(ergebnis, "id-2").tipps["id-3"], "imposter",
        "der fremde Tipp");
});

pruefe("Der Vergleich der Tafel erkennt neue Raeume und neue Woerter", () => {
    const stand = tafelMitRaum(2, "Erster");

    wahr(IMPOSTER_TAFEL.inhaltGleich(stand.tafel, IMPOSTER_TAFEL.kopieren(stand.tafel)),
        "gleich bleibt gleich");

    const mehr = IMPOSTER_TAFEL.raumAnlegen(stand.tafel, "Zweiter", {}, 2000).tafel;
    gleich(IMPOSTER_TAFEL.inhaltGleich(stand.tafel, mehr), false, "ein Raum mehr faellt auf");

    const mitWort = IMPOSTER_TAFEL.woerterErgaenzen(
        stand.tafel, "essen", "Kartoffelpuffer", 2000).tafel;
    gleich(IMPOSTER_TAFEL.inhaltGleich(stand.tafel, mitWort), false, "ein Wort mehr faellt auf");
});

console.log(anzahlOk + " ok, " + anzahlFehler + " Fehler");
process.exit(anzahlFehler === 0 ? 0 : 1);
