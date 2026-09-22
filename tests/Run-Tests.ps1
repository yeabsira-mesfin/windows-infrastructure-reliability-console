$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
Push-Location $root

try {
    Write-Host "Health validation"
    & pwsh -NoProfile -File "./scripts/InfrastructureLab.ps1" -Mode Health -InputFile "./data/infrastructure.json"
    if ($LASTEXITCODE -ne 0) { throw "Health validation failed." }

    Write-Host "Backup verification"
    $temp = Join-Path ([System.IO.Path]::GetTempPath()) "windows-reliability-lab"
    New-Item -ItemType Directory -Force -Path $temp | Out-Null
    $source = Join-Path $temp "source.txt"
    $backup = Join-Path $temp "backup.txt"
    "verified-content" | Set-Content -LiteralPath $source
    Copy-Item -LiteralPath $source -Destination $backup -Force
    & pwsh -NoProfile -File "./scripts/InfrastructureLab.ps1" -Mode Backup -SourcePath $source -BackupPath $backup
    if ($LASTEXITCODE -ne 0) { throw "Backup validation failed." }

    Write-Host "Failover simulation"
    & pwsh -NoProfile -File "./scripts/InfrastructureLab.ps1" -Mode Failover -InputFile "./data/infrastructure.json" -FailedNode "WEB-01"
    if ($LASTEXITCODE -ne 0) { throw "Failover simulation failed." }

    Write-Host "All infrastructure checks passed."
}
finally {
    Pop-Location
}
