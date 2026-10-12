[CmdletBinding()]
param([switch]$CopyOnly)
$ErrorActionPreference = 'Stop'
$journeyRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$signingPath = Join-Path $journeyRoot '.release-private\world-game-signing.json'
if (-not (Test-Path -LiteralPath $signingPath)) {
    $originalBackup = 'E:\Apps\World Game\.release-private\world-game-signing.json'
    if (Test-Path -LiteralPath $originalBackup) { $signingPath = $originalBackup }
}
if (-not (Test-Path -LiteralPath $signingPath)) {
    throw 'Signing backup not found. Use this helper from the original World Game folder.'
}
$signingJson = [IO.File]::ReadAllText($signingPath)
try { $signingData = $signingJson | ConvertFrom-Json } catch { throw 'Signing backup is not valid JSON.' }
if ($signingData.schemaVersion -ne 1 -or $signingData.storeType -ne 'PKCS12' -or -not $signingData.keystoreBase64) {
    throw 'The signing backup is incomplete. Do not create a replacement key.'
}
Set-Clipboard -Value $signingJson
Write-Output 'Signing configuration copied to clipboard (not displayed).'
Write-Output 'GitHub secret Name: WORLD_GAME_SIGNING'
Write-Output 'Paste into Secret with Ctrl+V, then click Add secret.'
if (-not $CopyOnly) {
    Start-Process 'https://github.com/ancorossie1708/world-game/settings/secrets/actions/new'
}
