[CmdletBinding()]
param(
    [ValidateSet('Debug', 'Release')]
    [string]$Configuration = 'Debug',
    [switch]$SkipFrontendBuild,
    [string]$GradleExecutable = 'gradle',
    [string]$ManifestUrl = ''
)

$ErrorActionPreference = 'Stop'
$journeyRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$journeyAndroidRoot = Join-Path $journeyRoot 'android'

if (-not (Get-Command java -ErrorAction SilentlyContinue)) {
    throw 'Building an APK needs JDK 17. Install it or use the Android APK GitHub Actions workflow.'
}
if (-not (Get-Command $GradleExecutable -ErrorAction SilentlyContinue)) {
    throw 'Gradle 8.11.1 is required. Put it on PATH, pass -GradleExecutable, or use GitHub Actions.'
}
$journeySdkRoot = $env:ANDROID_HOME
if (-not $journeySdkRoot) { $journeySdkRoot = $env:ANDROID_SDK_ROOT }
if (-not $journeySdkRoot -or -not (Test-Path -LiteralPath (Join-Path $journeySdkRoot 'platforms\android-35\android.jar'))) {
    throw 'Set ANDROID_HOME to an Android SDK with platform android-35 and build-tools 35.0.0 installed.'
}
if ($Configuration -eq 'Release') {
    foreach ($journeySecretName in @('ANDROID_KEYSTORE_PATH', 'ANDROID_KEYSTORE_PASSWORD', 'ANDROID_KEY_ALIAS', 'ANDROID_KEY_PASSWORD')) {
        if (-not [Environment]::GetEnvironmentVariable($journeySecretName)) {
            throw "A signed Release build requires the $journeySecretName environment variable."
        }
    }
}

Push-Location $journeyRoot
try {
    if (-not $SkipFrontendBuild) {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }
    }
    if (-not (Test-Path -LiteralPath (Join-Path $journeyRoot 'dist\index.html'))) {
        throw 'dist/index.html is missing. Build the frontend before packaging Android.'
    }
    $journeyGradleVersion = (& $GradleExecutable --version 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0 -or $journeyGradleVersion -notmatch 'Gradle 8\.11\.1(?:\s|$)') {
        throw 'This project is validated against Gradle 8.11.1; use that version.'
    }
    $journeyBuildTask = 'assemble' + $Configuration
    $journeyArguments = @('-p', $journeyAndroidRoot, '--no-daemon', $journeyBuildTask)
    if ($ManifestUrl) { $journeyArguments += "-PworldGameManifestUrl=$ManifestUrl" }
    & $GradleExecutable @journeyArguments
    if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
    $journeyVariant = $Configuration.ToLowerInvariant()
    $journeyApkPath = Join-Path $journeyAndroidRoot "app\build\outputs\apk\$journeyVariant\app-$journeyVariant.apk"
    if (-not (Test-Path -LiteralPath $journeyApkPath)) { throw 'The Android build did not produce the expected APK.' }
    Write-Output "APK ready: $journeyApkPath"
    Get-FileHash -LiteralPath $journeyApkPath -Algorithm SHA256 | Select-Object Hash, Path
}
finally {
    Pop-Location
}
