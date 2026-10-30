# Empuja fractal-film a GitHub para render en la nube (Actions gratis).
# La PC local solo hace push; el render corre en la nube (REGLAS.md regla 3).
# Uso: .\scripts\push-a-nube.ps1 -RemoteUrl https://github.com/TU_USUARIO/fractal-film.git
param(
    [Parameter(Mandatory = $true)][string]$RemoteUrl
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Node en PATH (Windows)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

if (-not (Test-Path .git)) {
    git init
    git branch -M main
    Write-Output "[1/4] Repo local inicializado (rama main)."
} else {
    Write-Output "[1/4] Repo local ya existe."
}

git add -A
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "render: push a nube ($timestamp)" 2>&1 | Out-Null
Write-Output "[2/4] Commit realizado (.gitignore excluye node_modules/, out/, .venv-kokoro/)."

git remote remove origin 2>$null
git remote add origin $RemoteUrl
Write-Output "[3/4] Remoto configurado: $RemoteUrl"

Write-Output "[4/4] PUSH (requiere tu login de GitHub la primera vez):"
Write-Output "      git push -u origin main"
Write-Output ""
Write-Output "Tras el push: la pestaña Actions de GitHub ejecuta 'render-film' automaticamente."
Write-Output "Descarga: Actions > run > artifact 'film-mp4' (retencion 30 dias)."
