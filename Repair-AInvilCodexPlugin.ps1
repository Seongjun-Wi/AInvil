$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "[AInvil repair] $Message"
}

function Backup-File {
    param(
        [string]$Path,
        [string]$Stamp
    )

    if (Test-Path -LiteralPath $Path) {
        $backupPath = "$Path.bak-ainvil-repair-$Stamp"
        Copy-Item -LiteralPath $Path -Destination $backupPath -Force
        Write-Step "Backed up $Path to $backupPath"
    }
}

function Rename-PathToBackup {
    param(
        [string]$Path,
        [string]$Stamp
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $parent = Split-Path -Parent $Path
    $name = Split-Path -Leaf $Path
    $backupPath = Join-Path $parent "$name.bak-ainvil-repair-$Stamp"

    if (Test-Path -LiteralPath $backupPath) {
        $backupPath = Join-Path $parent "$name.bak-ainvil-repair-$Stamp-$(Get-Random)"
    }

    Rename-Item -LiteralPath $Path -NewName (Split-Path -Leaf $backupPath)
    Write-Step "Renamed $Path to $backupPath"
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$workspaceMarketplace = Join-Path $repoRoot "marketplace.json"
$legacyClaudeMarketplace = Join-Path $repoRoot ".claude-plugin\marketplace.json"
$workspacePlugin = Join-Path $repoRoot "plugins\ainvil"
$workspacePluginManifest = Join-Path $workspacePlugin ".codex-plugin\plugin.json"

$codexHome = Join-Path $env:USERPROFILE ".codex"
$agentsPluginsHome = Join-Path $env:USERPROFILE ".agents\plugins"
$configPath = Join-Path $codexHome "config.toml"
$personalMarketplacePath = Join-Path $agentsPluginsHome "marketplace.json"
$personalAInvilSource = Join-Path $agentsPluginsHome "plugins\ainvil"
$personalAInvilCache = Join-Path $codexHome "plugins\cache\personal\ainvil"
$personalAInvilCacheParent = Split-Path -Parent $personalAInvilCache
$legacyUnityBridgeCache = Join-Path $codexHome "plugins\cache\unity-bridge-local"
$gameDesignerLocalCache = Join-Path $codexHome "plugins\cache\game-designer-local"

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$utcNow = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")

Write-Step "Repo root: $repoRoot"

if (-not (Test-Path -LiteralPath $workspacePluginManifest)) {
    throw "Missing AInvil plugin manifest: $workspacePluginManifest"
}

$manifest = Get-Content -Raw -LiteralPath $workspacePluginManifest | ConvertFrom-Json
if ($manifest.name -ne "ainvil") {
    throw "AInvil manifest name must be ainvil, got '$($manifest.name)'."
}

Write-Step "Workspace AInvil version: $($manifest.version)"

if (-not (Test-Path -LiteralPath $configPath)) {
    throw "Missing Codex config: $configPath"
}

Backup-File -Path $configPath -Stamp $stamp
Backup-File -Path $personalMarketplacePath -Stamp $stamp

$config = Get-Content -Raw -LiteralPath $configPath

$config = [regex]::Replace($config, '(?ms)^\[plugins\."unity-bridge@unity-bridge-local"\]\r?\nenabled = (true|false)\r?\n\r?\n?', '')

$config = [regex]::Replace(
    $config,
    '(?ms)^\[\[skills\.config\]\]\r?\nname = "game-designer-unity-agent:[^"]+"\r?\nenabled = false\r?\n\r?\n?',
    ''
)

$config = [regex]::Replace($config, '(?ms)^\[plugins\."ainvil@personal"\]\r?\nenabled = (true|false)\r?\n\r?\n?', '')
$config = [regex]::Replace($config, '(?ms)^\[plugins\."ainvil@game-designer-local"\]\r?\nenabled = (true|false)\r?\n\r?\n?', '')
$config = [regex]::Replace($config, '(?ms)^\[marketplaces\.game-designer-local\]\r?\n(?:.*?\r?\n)*?(?=^\[|\z)', '')

$config = $config.TrimEnd() + "`r`n`r`n[plugins.`"ainvil@personal`"]`r`nenabled = true`r`n"
Set-Content -LiteralPath $configPath -Value $config -Encoding UTF8
Write-Step "Updated Codex config: enabled ainvil@personal and removed stale game-designer-local/unity-bridge entries."

if (-not (Test-Path -LiteralPath $agentsPluginsHome)) {
    New-Item -ItemType Directory -Path $agentsPluginsHome | Out-Null
}

if (-not (Test-Path -LiteralPath (Join-Path $agentsPluginsHome "plugins"))) {
    New-Item -ItemType Directory -Path (Join-Path $agentsPluginsHome "plugins") | Out-Null
}

if (Test-Path -LiteralPath $personalAInvilSource) {
    Rename-PathToBackup -Path $personalAInvilSource -Stamp $stamp
}

Copy-Item -LiteralPath $workspacePlugin -Destination $personalAInvilSource -Recurse -Force
Write-Step "Copied latest AInvil plugin to $personalAInvilSource"

$personalMarketplace = [ordered]@{
    name = "personal"
    interface = [ordered]@{
        displayName = "Personal"
    }
    plugins = @(
        [ordered]@{
            name = "ainvil"
            source = [ordered]@{
                source = "local"
                path = "./plugins/ainvil"
            }
            policy = [ordered]@{
                installation = "AVAILABLE"
                authentication = "ON_INSTALL"
            }
            category = "Developer Tools"
        }
    )
}

$personalMarketplace | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $personalMarketplacePath -Encoding UTF8
Write-Step "Wrote personal marketplace entry for AInvil."

Rename-PathToBackup -Path $personalAInvilCache -Stamp $stamp
Rename-PathToBackup -Path $legacyUnityBridgeCache -Stamp $stamp
Rename-PathToBackup -Path $gameDesignerLocalCache -Stamp $stamp
Rename-PathToBackup -Path $workspaceMarketplace -Stamp $stamp
Rename-PathToBackup -Path $legacyClaudeMarketplace -Stamp $stamp

if (-not (Test-Path -LiteralPath $personalAInvilCacheParent)) {
    New-Item -ItemType Directory -Path $personalAInvilCacheParent -Force | Out-Null
}

$versionedAInvilCache = Join-Path $personalAInvilCache $manifest.version
Copy-Item -LiteralPath $workspacePlugin -Destination $versionedAInvilCache -Recurse -Force
Write-Step "Seeded AInvil cache at $versionedAInvilCache"

Write-Step "Skipped CLI marketplace cleanup; stale repo-local files were already disabled directly."

Write-Step "Done. Fully quit and reopen the Codex desktop app, then start a new thread."
Write-Step "Expected plugin id: ainvil@personal"
