# Quizz - Entscheidungen / Offen, Nutzer-Entscheidungen noetig, bewusst abgelehnt

## Warum die Abstimmung eine Frist braucht

Mit „Team muss sich einig sein" konnte ein Team komplett stillstehen: Zwei
Leute, einer hört auf mitzuspielen — und der andere kann nie wieder ziehen. Das
ist kein theoretischer Fall, sondern der Normalfall bei einer Partie über
mehrere Tage.

Deshalb läuft die Abstimmung jetzt gegen die Uhr: zehn Sekunden, dann gilt der
Vorschlag. Wer **zweimal** nicht abstimmt, verkürzt sie auf fünf, dann auf drei
Sekunden — und sobald er wieder mitstimmt, gilt wieder die volle Zeit. Die
Staffelung bestraft also nicht das einmalige Verpassen, sondern nur das
dauerhafte Fernbleiben.

Die Frist steht **im gemeinsamen Stand**, nicht in jedem Browser: Sonst liefe
sie auf jedem Gerät anders, und wer eine langsame Verbindung hat, wäre immer der
Säumige. Ausgelöst wird sie vom ersten Gerät, das den Ablauf bemerkt; die
Zugzähler-Prüfung sorgt dafür, dass sie trotzdem nur einmal greift.

## Bewusst abgelehnt

| Idee | Warum nicht |
|---|---|
| Anmeldung mit Passwort/Konten | Widerspricht dem Zweck: Seite aufrufen, Namen eintragen, dabei sein. |
| Verschlüsselung der ganzen Runde | Der Schlüssel müsste in der öffentlichen Seite stehen — Scheinsicherheit. Für die Würfel löst das Siegel das Problem richtig. |
| Punkte nach Position (richtiger Wert an richtiger Stelle) | Fünf gewürfelte Würfel haben keine Reihenfolge. |
| Gemeinsames Auflösen für alle auf Knopfdruck | Bis v0.2 so gebaut, auf Wunsch ersetzt: Jeder deckt nur sich selbst auf. Das Feld `phase` bleibt als Altbestand im Datenvertrag, ohne Wirkung. |
| Automatisches Auflösen zu einer festen Uhrzeit | Mehr Technik als Nutzen; jeder deckt auf, wann er will. |
| Chat oder Fragenprotokoll in der App | Die Fragen stellt man sich im echten Leben — genau das ist das Spiel. |
| Emojis für die Würfelwerte | Haus-Regel. |

## Braucht eine Nutzer-Entscheidung (nicht ungefragt bauen)

- **Firebase-Konto anlegen und Adresse eintragen** — bis dahin läuft die App im
  lokalen Rückfall (Hinweisbalken oben), und Mitspielen ist nicht möglich.
- **Regeln der Datenbank**: offen für alle (heute nötig) oder später einschränken.
- **Lizenz** für das öffentliche Repository.
- Ob es eine **Runden-Historie** geben soll (heute überschreibt eine neue Runde
  die alte).
- **Wie weit „weniger Tokens" gehen soll.** Die Aufteilung grosser Dateien ist
  gemacht (v3.2). Weiter sparen ginge nur an den Kommentaren und damit an den
  Begründungen. Drei Wege stehen in `ROADMAP.md`, Punkt 2; bis zur Entscheidung
  wird nichts gekürzt.
