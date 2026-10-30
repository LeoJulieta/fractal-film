# Registra una entrada en BITACORA_VIVA.md (registro perpetuo, REGLAS.md).
# Uso: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\registrar.ps1 -Tipo avance -Mensaje "descripcion"
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('avance', 'decision', 'error', 'verificacion')]
    [string]$Tipo,

    [Parameter(Mandatory = $true)]
    [string]$Mensaje
)

$log = Join-Path (Split-Path -Parent $PSScriptRoot) 'BITACORA_VIVA.md'
$fecha = Get-Date -Format 'yyyy-MM-dd HH:mm'
$line = "- [$fecha] [$Tipo] $Mensaje"
Add-Content -Path $log -Value $line -Encoding UTF8
Write-Output "REGISTRADO en BITACORA_VIVA.md:"
Write-Output $line
