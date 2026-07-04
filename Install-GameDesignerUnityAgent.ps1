$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$pluginName = "ainvil"
$legacyPluginNames = @("game-designer-unity-agent")
$oldMarketplaceName = "game-designer-local"
$personalMarketplaceName = "personal"

$pluginSourcePath = Join-Path $repoRoot "plugins\$pluginName"
$pluginManifestPath = Join-Path $pluginSourcePath ".codex-plugin\plugin.json"
$unityPackageSourcePath = Join-Path $pluginSourcePath "unity-package\Packages\com.codex.unity-bridge"
$unityPackageMirrorPath = Join-Path $repoRoot "UnityPackage\Packages\com.codex.unity-bridge"
$unityPackageTargets = @(
    (Join-Path (Split-Path -Parent $repoRoot) "UnityBridge\unity-package\Packages\com.codex.unity-bridge")
)
$personalMarketplaceRoot = Join-Path $env:USERPROFILE ".agents\plugins"
$personalPluginsRoot = Join-Path $personalMarketplaceRoot "plugins"
$personalPluginPath = Join-Path $personalPluginsRoot $pluginName
$personalMarketplacePath = Join-Path $personalMarketplaceRoot "marketplace.json"
$configPath = Join-Path $env:USERPROFILE ".codex\config.toml"
$codexPluginCacheRoot = Join-Path $env:USERPROFILE ".codex\plugins\cache"
$personalPluginCacheParent = Join-Path $codexPluginCacheRoot "$personalMarketplaceName\$pluginName"

function Remove-TomlTableBlock {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Text,

        [Parameter(Mandatory = $true)]
        [string] $Header
    )

    $escapedHeader = [regex]::Escape($Header)
    $pattern = "(?ms)^$escapedHeader\r?\n.*?(?=^\[|\z)"
    return [regex]::Replace($Text, $pattern, "")
}

function Remove-DirectoryIfSafe {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path,

        [Parameter(Mandatory = $true)]
        [string] $AllowedRoot
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $resolvedPath = (Resolve-Path -LiteralPath $Path).Path
    $resolvedRoot = (Resolve-Path -LiteralPath $AllowedRoot).Path

    if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove unexpected path: $resolvedPath"
    }

    Remove-Item -LiteralPath $resolvedPath -Recurse -Force
}

function Get-CodexCommand {
    $npmCodex = Join-Path $env:APPDATA "npm\codex.cmd"
    if (Test-Path -LiteralPath $npmCodex) {
        return $npmCodex
    }

    $pathCodex = Get-Command codex.cmd -ErrorAction SilentlyContinue
    if ($pathCodex) {
        return $pathCodex.Source
    }

    return $null
}

function Invoke-NodeCheck {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ScriptPath
    )

    $nodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCommand) {
        throw "Node.js was not found on PATH. The Unity Bridge MCP server requires node."
    }

    & $nodeCommand.Source $ScriptPath
    if ($LASTEXITCODE -ne 0) {
        throw "Node validation failed: $ScriptPath"
    }
}

function Copy-DirectoryContents {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Source,

        [Parameter(Mandatory = $true)]
        [string] $Destination
    )

    if (-not (Test-Path -LiteralPath $Source)) {
        throw "Source directory not found: $Source"
    }

    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Get-ChildItem -LiteralPath $Source -Force | ForEach-Object {
        Copy-Item -LiteralPath $_.FullName -Destination $Destination -Recurse -Force
    }
}

if (-not (Test-Path -LiteralPath $pluginManifestPath)) {
    throw "Plugin manifest not found: $pluginManifestPath"
}

$pluginManifest = Get-Content -Raw -LiteralPath $pluginManifestPath | ConvertFrom-Json
if ($pluginManifest.name -ne $pluginName) {
    throw "Expected plugin name '$pluginName' but found '$($pluginManifest.name)' in $pluginManifestPath"
}

Invoke-NodeCheck -ScriptPath (Join-Path $pluginSourcePath "scripts\validate-mcp-server.mjs")
Invoke-NodeCheck -ScriptPath (Join-Path $pluginSourcePath "scripts\validate-ainvil-plugin.mjs")

Copy-DirectoryContents -Source $unityPackageSourcePath -Destination $unityPackageMirrorPath
Write-Host "Synced plugin Unity package mirror: $unityPackageMirrorPath"
foreach ($unityPackageTarget in $unityPackageTargets) {
    if (Test-Path -LiteralPath $unityPackageTarget) {
        Copy-DirectoryContents -Source $unityPackageSourcePath -Destination $unityPackageTarget
        Write-Host "Updated Unity package target: $unityPackageTarget"
    }
}

New-Item -ItemType Directory -Force -Path $personalPluginsRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $configPath) | Out-Null

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

if (Test-Path -LiteralPath $configPath) {
    $configBackupPath = "$configPath.bak-$pluginName-$timestamp"
    Copy-Item -LiteralPath $configPath -Destination $configBackupPath -Force
    Write-Host "Backed up Codex config: $configBackupPath"

    $configText = Get-Content -Raw -LiteralPath $configPath
    $configText = Remove-TomlTableBlock -Text $configText -Header "[plugins.`"$pluginName@$oldMarketplaceName`"]"
    $configText = Remove-TomlTableBlock -Text $configText -Header "[plugins.`"$pluginName@$personalMarketplaceName`"]"
    foreach ($legacyPluginName in $legacyPluginNames) {
        $configText = Remove-TomlTableBlock -Text $configText -Header "[plugins.`"$legacyPluginName@$personalMarketplaceName`"]"
    }
    $configText = $configText.TrimEnd() + "`r`n"
    Set-Content -LiteralPath $configPath -Value $configText -NoNewline -Encoding UTF8
}

if (Test-Path -LiteralPath $personalMarketplacePath) {
    $marketplaceBackupPath = "$personalMarketplacePath.bak-$pluginName-$timestamp"
    Copy-Item -LiteralPath $personalMarketplacePath -Destination $marketplaceBackupPath -Force
    Write-Host "Backed up personal marketplace: $marketplaceBackupPath"
}

Remove-DirectoryIfSafe -Path $personalPluginPath -AllowedRoot $personalPluginsRoot
foreach ($legacyPluginName in $legacyPluginNames) {
    $legacyPersonalPluginPath = Join-Path $personalPluginsRoot $legacyPluginName
    Remove-DirectoryIfSafe -Path $legacyPersonalPluginPath -AllowedRoot $personalPluginsRoot
}
Copy-Item -LiteralPath $pluginSourcePath -Destination $personalPluginPath -Recurse -Force
Write-Host "Copied plugin to personal marketplace plugins folder: $personalPluginPath"

if (Test-Path -LiteralPath $personalMarketplacePath) {
    $marketplace = Get-Content -Raw -LiteralPath $personalMarketplacePath | ConvertFrom-Json
} else {
    $marketplace = [pscustomobject]@{
        name = $personalMarketplaceName
        interface = [pscustomobject]@{
            displayName = "Personal"
        }
        plugins = @()
    }
}

$marketplace.name = $personalMarketplaceName
if ($null -eq $marketplace.interface) {
    $marketplace | Add-Member -NotePropertyName interface -NotePropertyValue ([pscustomobject]@{ displayName = "Personal" })
}
if ($null -eq $marketplace.plugins) {
    $marketplace | Add-Member -NotePropertyName plugins -NotePropertyValue @()
}

$entry = [pscustomobject]@{
    name = $pluginName
    source = [pscustomobject]@{
        source = "local"
        path = "./plugins/$pluginName"
    }
    policy = [pscustomobject]@{
        installation = "AVAILABLE"
        authentication = "ON_INSTALL"
    }
    category = "Developer Tools"
}

$remainingPlugins = @($marketplace.plugins | Where-Object { $_.name -ne $pluginName -and $legacyPluginNames -notcontains $_.name })
$marketplace.plugins = @($remainingPlugins + $entry)
$marketplace | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $personalMarketplacePath -Encoding UTF8
Write-Host "Updated personal marketplace: $personalMarketplacePath"

$version = $pluginManifest.version
if ([string]::IsNullOrWhiteSpace($version)) {
    throw "Plugin version is missing from $pluginManifestPath"
}

$personalPluginCachePath = Join-Path $personalPluginCacheParent $version
New-Item -ItemType Directory -Force -Path $codexPluginCacheRoot | Out-Null
Remove-DirectoryIfSafe -Path $personalPluginCacheParent -AllowedRoot $codexPluginCacheRoot
foreach ($legacyPluginName in $legacyPluginNames) {
    $legacyPluginCacheParent = Join-Path $codexPluginCacheRoot "$personalMarketplaceName\$legacyPluginName"
    Remove-DirectoryIfSafe -Path $legacyPluginCacheParent -AllowedRoot $codexPluginCacheRoot
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $personalPluginCachePath) | Out-Null
Copy-Item -LiteralPath $pluginSourcePath -Destination $personalPluginCachePath -Recurse -Force
Write-Host "Installed plugin cache: $personalPluginCachePath"

if (-not (Test-Path -LiteralPath $configPath)) {
    New-Item -ItemType File -Force -Path $configPath | Out-Null
}

$configText = Get-Content -Raw -LiteralPath $configPath
$configText = Remove-TomlTableBlock -Text $configText -Header "[plugins.`"$pluginName@$oldMarketplaceName`"]"
$configText = Remove-TomlTableBlock -Text $configText -Header "[plugins.`"$pluginName@$personalMarketplaceName`"]"
foreach ($legacyPluginName in $legacyPluginNames) {
    $configText = Remove-TomlTableBlock -Text $configText -Header "[plugins.`"$legacyPluginName@$personalMarketplaceName`"]"
}
$pluginBlock = @"
[plugins."$pluginName@$personalMarketplaceName"]
enabled = true
"@
$configText = $configText.TrimEnd() + "`r`n`r`n$pluginBlock`r`n"
Set-Content -LiteralPath $configPath -Value $configText -NoNewline -Encoding UTF8
Write-Host "Enabled plugin in Codex config: $pluginName@$personalMarketplaceName"

$codexCommand = Get-CodexCommand
if ($codexCommand) {
    try {
        & $codexCommand plugin marketplace remove $oldMarketplaceName | Out-Host
        Write-Host "Removed old repo marketplace: $oldMarketplaceName"
    } catch {
        Write-Host "Old repo marketplace '$oldMarketplaceName' was not registered or could not be removed; continuing."
    }
} else {
    Write-Host "codex.cmd was not found; skipped removing old repo marketplace."
}

Write-Host ""
Write-Host "Done."
Write-Host "Restart Codex completely, then open a new thread."
Write-Host "The plugin is now installed directly as: $pluginName@$personalMarketplaceName"
Write-Host "Legacy personal plugin names removed: $($legacyPluginNames -join ', ')"
Write-Host "Do not install 'Game Designer Local'; that was the old repo marketplace display name."
