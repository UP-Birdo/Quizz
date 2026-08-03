#requires -Version 7.0
<#
.SYNOPSIS
    Holt offene Wuensche von GitHub und traegt sie in TODO.md ein.

.DESCRIPTION
    Gegenstueck zum Wunsch-Knopf in der App. Der Weg eines Wunsches:

        App  ->  vorbefuelltes GitHub-Formular  ->  Eintrag im Repo
             ->  DIESES SKRIPT  ->  TODO.md "## Anfragen"
             ->  Nutzer schreibt "bestaetigt" dahinter  ->  ROADMAP.md

    Die Anfragen landen bewusst UEBER dem Abschnitt "Neu": Sie sind noch nicht
    angenommen. Erst wenn hinter einer Zeile das Wort "bestaetigt" steht, wird
    sie beim naechsten Triagieren eingeordnet und priorisiert.

    Lesen braucht KEINEN Zugangsschluessel, solange das Repo oeffentlich ist
    (GitHub erlaubt 60 anonyme Abfragen je Stunde). Nur das Schliessen eines
    erledigten Eintrags braucht einen Token — dafuer wird derselbe benutzt wie
    beim Deploy (tools\Deploy-Quizz.ps1 -SetToken).

    Doppelte Eintraege sind ausgeschlossen: Jede Zeile traegt die Nummer des
    GitHub-Eintrags als [#12]. Was in TODO.md schon steht, wird uebersprungen —
    auch dann, wenn der Punkt bereits unter "## Erledigt" liegt.

    Pfade relativ zu diesem Skript (Haus-Regel).

.PARAMETER Zeigen
    Nur anzeigen, was uebernommen wuerde. Schreibt nichts.

.PARAMETER Schliessen
    Nummern der Eintraege, die auf GitHub geschlossen werden sollen.

.EXAMPLE
    .\tools\Wuensche-Abholen.ps1 -Zeigen
    .\tools\Wuensche-Abholen.ps1
    .\tools\Wuensche-Abholen.ps1 -Schliessen 12,14
#>
[CmdletBinding()]
param(
    [switch] $Zeigen,
    [int[]]  $Schliessen
)

$ErrorActionPreference = "Stop"

$hier          = Split-Path -Parent $MyInvocation.MyCommand.Path
$projektOrdner = Split-Path -Parent $hier
$todoDatei     = Join-Path $projektOrdner "TODO.md"
$tokenDatei    = Join-Path $hier "github-token.dat"

$Besitzer   = "up-birdo"
$Repository = "Quizz"

# ---------------------------------------------------------------------
# Hilfsmittel
# ---------------------------------------------------------------------

function Token-Lesen {
    if (-not (Test-Path -LiteralPath $tokenDatei)) {
        throw "Kein Token hinterlegt. Einmalig anlegen mit: tools\Deploy-Quizz.ps1 -SetToken"
    }

    $verschluesselt = [System.IO.File]::ReadAllText($tokenDatei).Trim()
    $sicher = ConvertTo-SecureString -String $verschluesselt
    return [System.Net.NetworkCredential]::new("", $sicher).Password
}

function Anfragen-Holen {
    $adresse = "https://api.github.com/repos/$Besitzer/$Repository/issues?state=open&per_page=100"
    $kopf = @{ "Accept" = "application/vnd.github+json"; "User-Agent" = "Quizz-Wuensche" }

    try {
        return Invoke-RestMethod -Uri $adresse -Headers $kopf -TimeoutSec 30
    } catch {
        throw "GitHub nicht erreichbar: $($_.Exception.Message)"
    }
}

# Zieht aus dem Formular-Text die eigentliche Idee heraus.
function Idee-Auslesen {
    param([string] $Rumpf)

    if (-not $Rumpf) { return "" }

    # Das Formular liefert Abschnitte als "### Ueberschrift" gefolgt vom Text.
    $zeilen = $Rumpf -split "`r?`n"
    $sammeln = $false
    $text = @()

    foreach ($zeile in $zeilen) {
        if ($zeile -match "^###\s") {
            $sammeln = ($zeile -match "wünschst|wunschst|Was")
            continue
        }
        if ($sammeln -and $zeile.Trim() -ne "" -and $zeile.Trim() -ne "_No response_") {
            $text += $zeile.Trim()
        }
    }

    if ($text.Count -eq 0) {
        # Kein Formular — dann der ganze Rumpf, auf eine Zeile gebracht.
        return ($Rumpf -replace "`r?`n", " ").Trim()
    }
    return ($text -join " ")
}

# ---------------------------------------------------------------------
# Schliessen (eigener Weg, schreibt nichts in TODO.md)
# ---------------------------------------------------------------------

if ($Schliessen) {
    $token = Token-Lesen
    $kopf = @{
        "Accept"        = "application/vnd.github+json"
        "Authorization" = "Bearer $token"
        "User-Agent"    = "Quizz-Wuensche"
    }

    foreach ($nummer in $Schliessen) {
        $adresse = "https://api.github.com/repos/$Besitzer/$Repository/issues/$nummer"
        $koerper = @{ state = "closed" } | ConvertTo-Json

        Invoke-RestMethod -Uri $adresse -Method Patch -Headers $kopf -Body $koerper `
                          -ContentType "application/json" | Out-Null
        Write-Host "Eintrag #$nummer geschlossen." -ForegroundColor Green
    }
    exit 0
}

# ---------------------------------------------------------------------
# Holen und eintragen
# ---------------------------------------------------------------------

$anfragen = Anfragen-Holen | Where-Object { -not $_.pull_request }

if ($anfragen.Count -eq 0) {
    Write-Host "Keine offenen Wuensche." -ForegroundColor Green
    exit 0
}

$todoText = [System.IO.File]::ReadAllText($todoDatei)
$neue = @()

foreach ($anfrage in $anfragen) {
    $marke = "[#$($anfrage.number)]"

    if ($todoText.Contains($marke)) {
        continue
    }

    $idee = Idee-Auslesen -Rumpf $anfrage.body
    if (-not $idee) { $idee = $anfrage.title }

    $neue += [PSCustomObject]@{
        Nummer = $anfrage.number
        Text   = $idee
        Von    = $anfrage.user.login
        Marke  = $marke
    }
}

if ($neue.Count -eq 0) {
    Write-Host "Nichts Neues — alle $($anfragen.Count) offenen Wuensche stehen schon in TODO.md." -ForegroundColor Green
    exit 0
}

Write-Host "$($neue.Count) neue(r) Wunsch/Wuensche:" -ForegroundColor Cyan
foreach ($eintrag in $neue) {
    Write-Host "   $($eintrag.Marke) $($eintrag.Text)"
}

if ($Zeigen) {
    Write-Host ""
    Write-Host "Nur angezeigt - es wurde nichts geschrieben." -ForegroundColor Yellow
    exit 0
}

# Zeilen bauen und ueber "## Neu" einsetzen.
$zeilen = foreach ($eintrag in $neue) {
    "- $($eintrag.Marke) $($eintrag.Text) — von $($eintrag.Von)"
}

$abschnitt = "## Anfragen"

if ($todoText.Contains($abschnitt)) {
    # Direkt unter die vorhandene Ueberschrift.
    $stelle = $todoText.IndexOf($abschnitt) + $abschnitt.Length
    $einfuegen = "`n`n" + ($zeilen -join "`n")
    $todoText = $todoText.Insert($stelle, $einfuegen)
} else {
    # Abschnitt anlegen, direkt ueber "## Neu".
    $vorNeu = $todoText.IndexOf("## Neu")
    if ($vorNeu -lt 0) {
        throw "In TODO.md fehlt der Abschnitt '## Neu' — bitte pruefen."
    }

    $kopfzeilen = @(
        $abschnitt
        ""
        "Kommt vom Wunsch-Knopf in der App (ueber GitHub). Noch nicht angenommen:"
        "Erst wenn hinter einer Zeile **bestaetigt** steht, wird sie eingeordnet"
        "und priorisiert."
        ""
    ) -join "`n"

    $todoText = $todoText.Insert($vorNeu, $kopfzeilen + ($zeilen -join "`n") + "`n`n")
}

$ohneBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($todoDatei, $todoText, $ohneBom)

Write-Host ""
Write-Host "In TODO.md unter '## Anfragen' eingetragen." -ForegroundColor Green
Write-Host "Schreib 'bestaetigt' hinter die Zeilen, die umgesetzt werden sollen." -ForegroundColor Green
