param(
    [ValidateSet("Health","Backup","Failover")]
    [string]$Mode = "Health",
    [string]$InputFile = "./data/infrastructure.json",
    [ValidateRange(1,100)][int]$CpuThreshold = 85,
    [ValidateRange(1,100)][int]$MemoryThreshold = 85,
    [ValidateRange(1,720)][int]$MaximumBackupAgeHours = 24,
    [string]$SourcePath,
    [string]$BackupPath,
    [string]$FailedNode,
    [switch]$FailOnCritical
)

$ErrorActionPreference = "Stop"

function Read-Inventory {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        throw "Inventory file not found: $Path"
    }
    $inventory = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
    if (-not $inventory.Nodes) {
        throw "Inventory does not contain Nodes."
    }
    return $inventory
}

function Invoke-Health {
    $inventory = Read-Inventory -Path $InputFile
    $findings = New-Object System.Collections.Generic.List[object]

    foreach ($node in $inventory.Nodes) {
        if ($node.Status -ne "Healthy") {
            $findings.Add([pscustomobject]@{Severity="Critical";Node=$node.Name;Check="Status";Detail="Node state is $($node.Status)."})
        }
        if ([int]$node.CpuPct -ge $CpuThreshold) {
            $findings.Add([pscustomobject]@{Severity="Warning";Node=$node.Name;Check="CPU";Detail="CPU is $($node.CpuPct)%."})
        }
        if ([int]$node.MemoryPct -ge $MemoryThreshold) {
            $findings.Add([pscustomobject]@{Severity="Warning";Node=$node.Name;Check="Memory";Detail="Memory is $($node.MemoryPct)%."})
        }
        if ([int]$node.LastBackupHours -gt $MaximumBackupAgeHours) {
            $findings.Add([pscustomobject]@{Severity="Critical";Node=$node.Name;Check="BackupAge";Detail="Backup is $($node.LastBackupHours) hours old."})
        }
    }

    $total = @($inventory.Nodes).Count
    $healthy = @($inventory.Nodes | Where-Object {$_.Status -eq "Healthy"}).Count
    $availability = [math]::Round(($healthy / $total) * 100, 1)

    [pscustomobject]@{
        TimestampUtc=[DateTime]::UtcNow.ToString("o")
        Environment=$inventory.Environment
        TotalNodes=$total
        HealthyNodes=$healthy
        AvailabilityPct=$availability
        FindingCount=$findings.Count
        Findings=$findings
    } | ConvertTo-Json -Depth 6

    $criticalCount = @($findings | Where-Object {$_.Severity -eq "Critical"}).Count
    if ($FailOnCritical -and $criticalCount -gt 0) { exit 2 }
    exit 0
}

function Invoke-Backup {
    if (-not $SourcePath -or -not $BackupPath) {
        throw "SourcePath and BackupPath are required for Backup mode."
    }
    if (-not (Test-Path -LiteralPath $SourcePath)) { throw "Source file not found." }
    if (-not (Test-Path -LiteralPath $BackupPath)) { throw "Backup file not found." }

    $sourceHash = (Get-FileHash -LiteralPath $SourcePath -Algorithm SHA256).Hash
    $backupHash = (Get-FileHash -LiteralPath $BackupPath -Algorithm SHA256).Hash
    $verified = $sourceHash -eq $backupHash

    [pscustomobject]@{
        TimestampUtc=[DateTime]::UtcNow.ToString("o")
        SourceSha256=$sourceHash
        BackupSha256=$backupHash
        IntegrityVerified=$verified
    } | ConvertTo-Json -Depth 4

    if (-not $verified) { exit 3 }
    exit 0
}

function Invoke-Failover {
    if (-not $FailedNode) { throw "FailedNode is required for Failover mode." }
    $inventory = Read-Inventory -Path $InputFile
    $failed = @($inventory.Nodes | Where-Object {$_.Name -eq $FailedNode})
    if ($failed.Count -ne 1) { throw "Failed node was not found exactly once." }

    $role = $failed[0].Role
    $candidates = @($inventory.Nodes | Where-Object {$_.Name -ne $FailedNode -and $_.Role -eq $role -and $_.Status -eq "Healthy"} | Sort-Object Name)
    if ($candidates.Count -eq 0) { throw "No healthy failover candidate is available." }

    $selected = $candidates[0]
    [pscustomobject]@{
        TimestampUtc=[DateTime]::UtcNow.ToString("o")
        Mode="SimulationOnly"
        FailedNode=$FailedNode
        ServiceRole=$role
        SelectedRecoveryNode=$selected.Name
        SelectedDns=$selected.Dns
        SelectedTcpPort=$selected.TcpPort
        ProductionChangeMade=$false
    } | ConvertTo-Json -Depth 4
    exit 0
}

switch ($Mode) {
    "Health" { Invoke-Health }
    "Backup" { Invoke-Backup }
    "Failover" { Invoke-Failover }
}
