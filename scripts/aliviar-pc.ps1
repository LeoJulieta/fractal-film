# Alivia la PC local: libera disco/temporales y reporta presión de RAM.
# Seguro por diseño: NO mata procesos ni borra datos del usuario (REGLAS.md regla 5).
# Uso: .\scripts\aliviar-pc.ps1
$ErrorActionPreference = 'SilentlyContinue'

Write-Output "=== ALIVIO DE PC LOCAL (fallback, no prioridad) ==="
Write-Output ""

# 1. Reporte de memoria ANTES
$os = Get-CimInstance Win32_OperatingSystem
$usedBefore = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB, 2)
$freeBefore = [math]::Round($os.FreePhysicalMemory / 1MB, 2)
Write-Output ("RAM antes:  {0} GB usada / {1} GB libre" -f $usedBefore, $freeBefore)

# 2. Top 8 procesos por RAM (solo reporte — nada se cierra)
Write-Output ""
Write-Output "Top 8 procesos por RAM (reporte, no se cierra ninguno):"
Get-Process | Group-Object ProcessName |
    Select-Object Name, Count, @{N = 'RAM_MB'; E = {[math]::Round(($_.Group | Measure-Object WorkingSet64 -Sum).Sum / 1MB, 0)}} |
    Sort-Object RAM_MB -Descending | Select-Object -First 8 |
    Format-Table -AutoSize | Out-String | Write-Output

# 3. Limpieza de temporales (solo los desbloqueados; el SO protege los en uso)
$targets = @($env:TEMP, "$env:LOCALAPPDATA\Temp", "C:\Windows\Temp")
$freed = 0
foreach ($t in $targets) {
    if (Test-Path $t) {
        $before = (Get-ChildItem $t -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        Get-ChildItem $t -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
            Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
        $after = (Get-ChildItem $t -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        $freed += ($before - $after)
    }
}
Write-Output ("Temporales liberados: {0} MB" -f [math]::Round($freed / 1MB, 1))

# 4. Memoria DESPUÉS
$os2 = Get-CimInstance Win32_OperatingSystem
$freeAfter = [math]::Round($os2.FreePhysicalMemory / 1MB, 2)
Write-Output ("RAM despues: {0} GB libre (antes {1})" -f $freeAfter, $freeBefore)

# 5. Recomendación honesta
Write-Output ""
if ($freeAfter -lt 2.0) {
    Write-Output "AVISO: menos de 2 GB libres. Cierra Edge/pestañas pesadas ANTES de cualquier tarea local."
    Write-Output "Recordatorio (REGLAS.md): renders y cómputo pesado van a la nube (Colab/Kaggle/Actions), nunca a esta PC."
} else {
    Write-Output "Estado OK. La PC queda ligera; la carga pesada va a la nube gratuita."
}
