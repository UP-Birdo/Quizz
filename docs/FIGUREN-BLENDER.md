# Die 3D-Figuren für das Quizz-Schach — Vorgabe für den Blender-Bau

Diese Datei ist die **Übergabe an den Chat (oder Menschen), der beim Bauen
der Figuren in Blender hilft.** Sie beschreibt, wie die Figuren AUSSEHEN
sollen und was genau geliefert wird. Der Einbau in die App passiert danach
im Quizz-Projekt (siehe `ROADMAP.md`, Bündel Z3 — dort steht derselbe
Liefervertrag).

## Wofür die Figuren sind

Eine Web-Schach-App bekommt einen schaltbaren „3D-Look": abgerundete
Brett-Kacheln mit Tiefe, Hüpf-Züge, weiche Animationen. Vorbild ist ein
Dribbble-Video mit einem Spielzeug-Schachbrett — knetartige, runde Figuren
auf dicken Kachel-Klötzen. Die Figuren werden als **fertige Bilder (PNG)**
eingebaut, nicht als 3D-Modelle: Die App zeigt je Feld ein Bild.

## Der Stil — Spielzeug, nicht Turnier

- **Weich und rund wie Knete oder Spielzeug:** überall großzügige
  Rundungen, keine scharfen Kanten, keine feinen Rillen oder Ornamente.
  Lieber zu einfach als zu detailliert.
- **Matte Oberfläche:** wie mattes Plastik oder Ton. KEIN starker Glanz,
  keine Spiegelungen — höchstens ein sehr weiches, breites Glanzlicht.
- **Einfache, kräftige Silhouetten:** Die Figuren werden am Handy auf
  Feldern von teils nur **25 bis 40 Pixeln** Kantenlänge gezeigt. Jede
  Figur muss allein an ihrem UMRISS erkennbar sein. Im Zweifel Details
  weglassen und die Kopfform übertreiben.
- **Standfest:** breite, runde Basis (gemeinsamer Sockel-Look für alle
  sechs Arten), damit sie auf den Kacheln „stehen".

## Die sechs Arten und ihre Erkennungszeichen

| Figur | Erkennungszeichen der Silhouette | Relative Höhe |
|---|---|---|
| Bauer | Kugelkopf auf kurzem Kegel | 0,55 |
| Turm | Zylinder mit 3–4 dicken, runden Zinnen | 0,70 |
| Springer | Stilisierter Pferdekopf mit Mähne-Bogen | 0,75 |
| Läufer | Tropfenform mit runder Kugelspitze und schräger Kerbe | 0,75 |
| Dame | Krone aus kleinen Kugeln (wie im Vorbild-Video) | 0,90 |
| König | Höchste Figur, Krone mit Kreuz oder klarer Einzelzacke | 1,00 |

Relative Höhe = Anteil an der Königshöhe. Alle stehen auf gleich großen
Sockeln.

## Die zwei Farben

- **Weiss:** warmes Creme (Richtwert `#f2ecdf`), nicht klinisch reinweiß.
- **Schwarz:** dunkles Anthrazit (Richtwert `#2b2e35`), NICHT reines
  Schwarz — sonst ersaufen die Formen. Gleiche Materialeinstellungen wie
  Weiss, nur die Farbe wechselt.

Beide müssen auf hellen UND dunklen Kacheln lesbar sein (die App zeigt
weiße und blaue Felder, hell wie dunkel).

## Szene, Kamera, Licht — EINMAL bauen, für alle 12 Bilder

- **Eine einzige Szene** für alle Renderings: Kamera und Licht werden
  eingerichtet und dann NIE mehr angefasst — nur die Figur wird
  ausgetauscht. Sonst passen die Figuren am Brett nicht zusammen.
- **Kamera:** leicht von schräg oben, etwa **15 bis 25 Grad** gekippt
  (man sieht die Figur fast frontal, aber mit etwas Draufsicht — wie im
  Vorbild-Video). **Lange Brennweite (85 bis 135 mm)** oder gleich
  orthografisch, damit hohe und niedrige Figuren gleich wenig verzerrt
  sind.
- **Licht:** ein großes, weiches Hauptlicht von oben links, dazu sanfte
  Umgebungsaufhellung, damit die Schattenseite nicht absäuft. Für alle
  zwölf Bilder identisch.
- **KEIN Bodenschatten im Bild:** Der Schatten auf der Kachel kommt von
  der App (CSS). Also Boden/„Shadow Catcher" ausschalten — die Figur
  schwebt frei auf durchsichtigem Grund.

## Die Lieferung — genau das kommt heraus

1. **12 Dateien**, exakt so benannt (Kleinbuchstaben, ohne Umlaute):
   `figur-bauer-weiss.png`, `figur-bauer-schwarz.png`,
   `figur-springer-weiss.png`, `figur-springer-schwarz.png`,
   `figur-laeufer-weiss.png`, `figur-laeufer-schwarz.png`,
   `figur-turm-weiss.png`, `figur-turm-schwarz.png`,
   `figur-dame-weiss.png`, `figur-dame-schwarz.png`,
   `figur-koenig-weiss.png`, `figur-koenig-schwarz.png`
2. **PNG mit durchsichtigem Hintergrund** (RGBA), quadratisch,
   **512 × 512 px**.
3. **Figur mittig**, Sockel-Unterkante bei allen zwölf auf derselben Höhe
   (etwa 8 % Luft zum unteren Bildrand), oben je nach Figurhöhe mehr oder
   weniger Luft — die Höhenverhältnisse aus der Tabelle müssen IM BILD
   stimmen, weil die App alle Bilder gleich groß anzeigt.
4. **Alle 12 zusammen möglichst unter 1 MB** (bei 512er-PNGs gut machbar;
   notfalls mit einem PNG-Verkleinerer nachhelfen).
5. **Ablage:** in den Ordner `img\figuren\` des Quizz-Projekts legen und
   dem Quizz-Chat Bescheid geben — er baut sie hinter dem 3D-Schalter ein.

## Prüfliste vor der Abgabe

- [ ] Alle 12 Dateien da, Namen exakt wie oben?
- [ ] Hintergrund wirklich durchsichtig (kein weißes Quadrat)?
- [ ] Auf 40 Pixel verkleinert noch unterscheidbar (Bauer vs. Läufer vs.
      Dame)?
- [ ] König sichtbar am höchsten, Bauer am kleinsten, Sockel gleich groß?
- [ ] Kein Bodenschatten, kein Glanz-Gewitter?
- [ ] Kamera und Licht bei allen 12 identisch?
