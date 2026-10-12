param(
  [ValidateRange(1, 65535)] [int] $Port = 4173,
  [switch] $SkipOpenBrowser
)

$ErrorActionPreference = 'Stop'
$journeyRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$journeyUrl = "http://localhost:$Port/"
$journeyProbeUrl = "http://127.0.0.1:$Port/"

function Get-JourneyLocalJson([string] $Path) {
  $journeyResponse = $null
  $journeyReader = $null
  try {
    # Bypass system proxies and automatic proxy discovery for this local check.
    # HttpWebRequest is available in Windows PowerShell 5.1 without IE setup.
    $journeyRequest = [System.Net.HttpWebRequest]::Create($journeyProbeUrl + $Path)
    $journeyRequest.Proxy = $null
    $journeyRequest.Timeout = 700
    $journeyRequest.ReadWriteTimeout = 700
    $journeyRequest.AllowAutoRedirect = $false
    $journeyResponse = $journeyRequest.GetResponse()
    $journeyReader = New-Object IO.StreamReader($journeyResponse.GetResponseStream(), [Text.Encoding]::UTF8)
    return ($journeyReader.ReadToEnd() | ConvertFrom-Json)
  } catch {
    return $null
  } finally {
    if ($journeyReader) { $journeyReader.Dispose() }
    if ($journeyResponse) { $journeyResponse.Dispose() }
  }
}

function Test-JourneyServer {
  $journeyHealth = Get-JourneyLocalJson '__journey_health__'
  if ($journeyHealth -and $journeyHealth.app -eq 'world-game') { return $true }
  # Vite preview has no health endpoint. Its manifest identifies the same game.
  $journeyManifest = Get-JourneyLocalJson 'manifest.webmanifest'
  return [bool] ($journeyManifest -and
    $journeyManifest.name -eq $journeyExpectedManifest.name -and
    $journeyManifest.lang -eq 'he' -and $journeyManifest.dir -eq 'rtl')
}

function Test-JourneyPortInUse {
  $journeyClient = New-Object Net.Sockets.TcpClient
  try {
    $journeyConnect = $journeyClient.BeginConnect('127.0.0.1', $Port, $null, $null)
    if (-not $journeyConnect.AsyncWaitHandle.WaitOne(700)) { return $false }
    $journeyClient.EndConnect($journeyConnect)
    return $true
  } catch {
    return $false
  } finally {
    $journeyClient.Dispose()
  }
}

try {
  Write-Host 'Checking the game files...'
  $journeyDist = Join-Path $journeyRoot 'dist'
  if (-not (Test-Path -LiteralPath (Join-Path $journeyDist 'index.html'))) {
    throw 'The game build is missing. In this folder, run npm install and npm run build, then open Open-Game.cmd again.'
  }
  $journeyExpectedManifest = Get-Content -LiteralPath (Join-Path $journeyDist 'manifest.webmanifest') -Raw -Encoding UTF8 | ConvertFrom-Json
  $journeyRunning = Test-JourneyServer
  if ($journeyRunning) {
    Write-Host 'The game is already running.'
  } else {
    if (Test-JourneyPortInUse) {
      throw "Another app is using port $Port. Close that app, then open Open-Game.cmd again."
    }
    $journeyNode = Get-Command node.exe -ErrorAction SilentlyContinue
    if (-not $journeyNode) {
      throw 'Node.js is missing. Install the current Node.js LTS version from https://nodejs.org, then open Open-Game.cmd again.'
    }
    Write-Host 'Starting the game...'
    $journeyLogDirectory = Join-Path $journeyRoot '.preview-logs'
    New-Item -ItemType Directory -Path $journeyLogDirectory -Force | Out-Null
    $journeyScript = Join-Path $journeyRoot 'scripts\preview-server.mjs'
    $journeyServerProcess = Start-Process -FilePath $journeyNode.Source -ArgumentList @('"' + $journeyScript + '"', '--port', "$Port") -WorkingDirectory $journeyRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $journeyLogDirectory "server-$Port.log") -RedirectStandardError (Join-Path $journeyLogDirectory "error-$Port.log") -PassThru
    $journeyServerProcess.Id | Set-Content -LiteralPath (Join-Path $journeyLogDirectory "server-$Port.pid") -Encoding ASCII
    $journeyDeadline = [DateTime]::UtcNow.AddSeconds(10)
    do {
      Start-Sleep -Milliseconds 200
      $journeyRunning = Test-JourneyServer
      if ($journeyRunning) { break }
      $journeyServerProcess.Refresh()
      if ($journeyServerProcess.HasExited) {
        $journeyError = Get-Content -LiteralPath (Join-Path $journeyLogDirectory "error-$Port.log") -Raw -ErrorAction SilentlyContinue
        throw "The game server stopped. $journeyError"
      }
    } while ([DateTime]::UtcNow -lt $journeyDeadline)
    if (-not $journeyRunning) {
      throw "The game did not become ready. See $journeyLogDirectory\error-$Port.log."
    }
  }
  if ($SkipOpenBrowser) {
    Write-Host "The game is ready at $journeyUrl"
  } else {
    Write-Host 'Opening your browser. Press F11 there for full screen.'
    Start-Process -FilePath $journeyUrl
    Write-Host 'The game is open. You may close this window.'
  }
  exit 0
} catch {
  Write-Host ("Could not open World Game: " + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
