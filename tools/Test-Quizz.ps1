# Test-Quizz.ps1 — die ganze Testkette mit EINEM Aufruf (Haus-Standard:
# tools\Test-<App>.ps1 in jedem Projekt gleich). Reicht nur an die bestehende
# Kette tests\Tests-Ausfuehren.ps1 durch; deren Aufruf bleibt weiter gueltig.

$ErrorActionPreference = 'Stop'
$kette = Join-Path (Split-Path -Parent $PSScriptRoot) 'tests\Tests-Ausfuehren.ps1'
& powershell -ExecutionPolicy Bypass -File $kette
exit $LASTEXITCODE
