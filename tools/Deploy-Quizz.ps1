<#
    Deploy-Quizz.ps1 - laedt das Projekt nach GitHub, ohne git und ohne
    Weboberflaeche. Reine PowerShell-Aufrufe gegen die GitHub-Programmier-
    schnittstelle.

    ERSTE EINRICHTUNG (einmalig, macht der Nutzer selbst):

        powershell -ExecutionPolicy Bypass -File "tools\Deploy-Quizz.ps1" -SetToken

    Das Skript fragt dann nach einem Zugriffsschluessel (Token). Er wird mit
    Windows-Bordmitteln (DPAPI) verschluesselt neben dem Skript abgelegt und
    laesst sich nur von DIESEM Windows-Konto auf DIESEM Rechner wieder lesen.
    Der Schluessel steht danach in keiner Datei im Klartext und wird nie
    hochgeladen.

    Token anlegen: github.com -> Settings -> Developer settings ->
    Personal access tokens -> Fine-grained tokens -> Generate new token
      - Repository access: Only select repositories -> Quizz
      - Permissions -> Repository permissions -> Contents: Read and write
    Mehr Rechte werden nicht gebraucht.

    NORMALER AUFRUF (laedt alle geaenderten Dateien in EINEM Commit hoch):

        powershell -ExecutionPolicy Bypass -File "tools\Deploy-Quizz.ps1"

    Nur nachsehen, was sich geaendert hat, ohne etwas zu senden:

        powershell -ExecutionPolicy Bypass -File "tools\Deploy-Quizz.ps1" -NurAnzeigen

    Warum ein einziger Commit? GitHub Pages baut die Seite nach jedem Commit
    neu und erlaubt nur wenige Bauvorgaenge je Stunde. Ein Commit fuer alle
    Dateien bleibt weit darunter.

    Das Skript findet seine Pfade relativ zu sich selbst.
#>

param(
    [switch]$SetToken,
    [switch]$NurAnzeigen,
    [string]$Nachricht = ""
)

$ErrorActionPreference = "Stop"

$hier          = Split-Path -Parent $MyInvocation.MyCommand.Path
$projektOrdner = Split-Path -Parent $hier
$tokenDatei    = Join-Path $hier "github-token.dat"

$Besitzer   = "up-birdo"
$Repository = "Quizz"
$Zweig      = "main"

# ---------------------------------------------------------------------
# Was wird hochgeladen
#
# Freigegeben sind die Einstiegsdatei und die unten genannten Ordner.
# Alles andere bleibt liegen - insbesondere die interne Planung und der
# Zugriffsschluessel.
# ---------------------------------------------------------------------

$freigegebeneDateien = @("index.html", "README.md", "CHANGELOG.md")
$freigegebeneOrdner  = @("css", "js", "docs", "tests", "tools")
$gesperrteDateien    = @("TODO.md", "ROADMAP.md", "CLAUDE.md", "github-token.dat")

# ---------------------------------------------------------------------
# Zugriffsschluessel hinterlegen
# ---------------------------------------------------------------------

if ($SetToken) {
    Write-Host ""
    Write-Host "Zugriffsschluessel fuer GitHub hinterlegen" -ForegroundColor Cyan
    Write-Host "Der Schluessel wird verschluesselt abgelegt und nicht angezeigt."
    Write-Host ""

    $geheim = Read-Host -Prompt "Token einfuegen" -AsSecureString
    if (-not $geheim -or $geheim.Length -eq 0) {
        Write-Host "Nichts eingegeben - abgebrochen." -ForegroundColor Yellow
        exit 1
    }

    # Bewusst WriteAllText statt Set-Content: Set-Content haengt einen
    # Zeilenumbruch an, und ConvertTo-SecureString kann mit dem beim Lesen
    # nichts anfangen ("The input string was not in a correct format").
    $verschluesselt = ConvertFrom-SecureString -SecureString $geheim
    [System.IO.File]::WriteAllText($tokenDatei, $verschluesselt, [System.Text.ASCIIEncoding]::new())
    Write-Host "Gespeichert unter: $tokenDatei" -ForegroundColor Green
    Write-Host "Diese Datei gehoert NICHT ins Repository (steht auf der Sperrliste)."
    exit 0
}

if (-not (Test-Path -LiteralPath $tokenDatei)) {
    Write-Host "Kein Zugriffsschluessel hinterlegt." -ForegroundColor Red
    Write-Host "Einmalig einrichten mit:  Deploy-Quizz.ps1 -SetToken"
    exit 1
}

# Entschluesseln - klappt nur im selben Windows-Konto auf demselben Rechner.
try {
    # Trim: aeltere Ablagen (und jede von Hand erzeugte) koennen einen
    # Zeilenumbruch am Ende haben - der wuerde das Entschluesseln sprengen.
    $gespeichert = (Get-Content -LiteralPath $tokenDatei -Raw).Trim()
    $geheim = ConvertTo-SecureString -String $gespeichert
    $roh    = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($geheim)
    $token  = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($roh)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($roh)
} catch {
    Write-Host "Der hinterlegte Schluessel laesst sich nicht lesen: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Neu hinterlegen mit:  Deploy-Quizz.ps1 -SetToken"
    exit 1
}

$kopfzeilen = @{
    "Authorization" = "Bearer $token"
    "Accept"        = "application/vnd.github+json"
    "User-Agent"    = "Deploy-Quizz"
}

# ---------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------

function Invoke-GitHub {
    param(
        [string]$Pfad,
        [string]$Methode = "GET",
        $Koerper = $null
    )

    $adresse = "https://api.github.com/repos/$Besitzer/$Repository$Pfad"

    if ($null -ne $Koerper) {
        $text  = $Koerper | ConvertTo-Json -Depth 12 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
        return Invoke-RestMethod -Uri $adresse -Method $Methode -Headers $kopfzeilen `
                                 -Body $bytes -ContentType "application/json; charset=utf-8"
    }

    return Invoke-RestMethod -Uri $adresse -Method $Methode -Headers $kopfzeilen
}

# Git-Kennung einer Datei (so, wie Git sie selbst bildet). Damit erkennt das
# Skript ohne Hochladen, ob sich eine Datei ueberhaupt geaendert hat.
function Get-BlobKennung {
    param([string]$Inhalt)

    $bytes  = [System.Text.Encoding]::UTF8.GetBytes($Inhalt)
    $kopf   = [System.Text.Encoding]::ASCII.GetBytes("blob $($bytes.Length)" + [char]0)
    $gesamt = New-Object byte[] ($kopf.Length + $bytes.Length)
    [Array]::Copy($kopf, 0, $gesamt, 0, $kopf.Length)
    [Array]::Copy($bytes, 0, $gesamt, $kopf.Length, $bytes.Length)

    $sha = [System.Security.Cryptography.SHA1]::Create()
    return (($sha.ComputeHash($gesamt) | ForEach-Object { $_.ToString("x2") }) -join "")
}

# ---------------------------------------------------------------------
# Dateien einsammeln
# ---------------------------------------------------------------------

$dateien = New-Object System.Collections.Generic.List[object]

function Add-Datei {
    param([System.IO.FileInfo]$Datei)

    if ($gesperrteDateien -contains $Datei.Name) {
        return
    }

    $relativ = $Datei.FullName.Substring($projektOrdner.Length + 1).Replace("\", "/")
    $inhalt  = [System.IO.File]::ReadAllText($Datei.FullName, [System.Text.UTF8Encoding]::new($false))

    $dateien.Add([pscustomobject]@{
        Pfad    = $relativ
        Inhalt  = $inhalt
        Kennung = Get-BlobKennung -Inhalt $inhalt
    })
}

foreach ($name in $freigegebeneDateien) {
    $voll = Join-Path $projektOrdner $name
    if (Test-Path -LiteralPath $voll -PathType Leaf) {
        Add-Datei -Datei (Get-Item -LiteralPath $voll)
    }
}

foreach ($ordner in $freigegebeneOrdner) {
    $voll = Join-Path $projektOrdner $ordner
    if (Test-Path -LiteralPath $voll -PathType Container) {
        Get-ChildItem -LiteralPath $voll -Recurse -File | ForEach-Object { Add-Datei -Datei $_ }
    }
}

if ($dateien.Count -eq 0) {
    Write-Host "Keine Dateien gefunden - nichts zu tun." -ForegroundColor Yellow
    exit 1
}

# Version fuer die Commit-Beschreibung aus js\konfig.js lesen.
$version = "?"
$konfigDatei = Join-Path $projektOrdner "js\konfig.js"
if (Test-Path -LiteralPath $konfigDatei) {
    $konfigText = Get-Content -LiteralPath $konfigDatei -Raw
    if ($konfigText -match 'APP_VERSION:\s*"([^"]+)"') {
        $version = $Matches[1]
    }
}

if (-not $Nachricht) {
    $Nachricht = "Quizz v$version"
}

# ---------------------------------------------------------------------
# Mit dem Stand auf GitHub vergleichen
# ---------------------------------------------------------------------

Write-Host ""
Write-Host "Quizz v$version -> $Besitzer/$Repository ($Zweig)" -ForegroundColor Cyan

try {
    $ref       = Invoke-GitHub -Pfad "/git/ref/heads/$Zweig"
    $commitAlt = Invoke-GitHub -Pfad "/git/commits/$($ref.object.sha)"
    $baum      = Invoke-GitHub -Pfad "/git/trees/$($commitAlt.tree.sha)?recursive=1"
} catch {
    Write-Host "Kein Zugriff auf das Repository: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Stimmen Token und Rechte (Contents: Read and write)?"
    exit 1
}

$vorhanden = @{}
foreach ($eintrag in $baum.tree) {
    if ($eintrag.type -eq "blob") {
        $vorhanden[$eintrag.path] = $eintrag.sha
    }
}

$geaendert = @()
foreach ($datei in $dateien) {
    if (-not $vorhanden.ContainsKey($datei.Pfad)) {
        $geaendert += [pscustomobject]@{ Datei = $datei; Art = "neu" }
    } elseif ($vorhanden[$datei.Pfad] -ne $datei.Kennung) {
        $geaendert += [pscustomobject]@{ Datei = $datei; Art = "geaendert" }
    }
}

Write-Host "Geprueft: $($dateien.Count) Dateien, davon zu senden: $($geaendert.Count)"
foreach ($eintrag in $geaendert) {
    Write-Host ("   {0,-10} {1}" -f $eintrag.Art, $eintrag.Datei.Pfad)
}

if ($geaendert.Count -eq 0) {
    Write-Host "Alles auf dem neuesten Stand." -ForegroundColor Green
    exit 0
}

if ($NurAnzeigen) {
    Write-Host "Nur angezeigt - es wurde nichts gesendet." -ForegroundColor Yellow
    exit 0
}

# ---------------------------------------------------------------------
# In einem einzigen Commit hochladen
# ---------------------------------------------------------------------

Write-Host ""
Write-Host "Wird gesendet ..." -ForegroundColor Cyan

$baumEintraege = @()
foreach ($eintrag in $geaendert) {
    $baumEintraege += @{
        path    = $eintrag.Datei.Pfad
        mode    = "100644"
        type    = "blob"
        content = $eintrag.Datei.Inhalt
    }
}

$neuerBaum = Invoke-GitHub -Pfad "/git/trees" -Methode "POST" -Koerper @{
    base_tree = $commitAlt.tree.sha
    tree      = $baumEintraege
}

$neuerCommit = Invoke-GitHub -Pfad "/git/commits" -Methode "POST" -Koerper @{
    message = $Nachricht
    tree    = $neuerBaum.sha
    parents = @($ref.object.sha)
}

Invoke-GitHub -Pfad "/git/refs/heads/$Zweig" -Methode "PATCH" -Koerper @{
    sha = $neuerCommit.sha
} | Out-Null

Write-Host ""
Write-Host "Fertig. Commit: $($neuerCommit.sha.Substring(0,7)) - $Nachricht" -ForegroundColor Green
Write-Host "Die Seite ist in ein bis zwei Minuten aktuell:"
Write-Host "   https://$Besitzer.github.io/$Repository/"
exit 0
