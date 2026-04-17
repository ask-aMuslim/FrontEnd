param(
    [string]$Image = 'nginx:1.29.8',
    [int]$Port = 8080,
    [string]$ContainerName = 'aam-prod-routing-smoke',
    [switch]$PreferLocalServer
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "[smoke-prod-routing] $Message"
}

function Wait-ForHttpReady {
    param(
        [string]$Url,
        [int]$Attempts = 40
    )

    for ($i = 0; $i -lt $Attempts; $i++) {
        try {
            $null = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 2 -MaximumRedirection 1
            return $true
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }

    return $false
}

function Test-Routes {
    param(
        [string]$BaseUrl,
        [string[]]$Routes
    )

    $failures = New-Object System.Collections.Generic.List[string]

    Write-Step "Checking HTTP status for SPA deep links at $BaseUrl ..."
    foreach ($route in $Routes) {
        $url = "$BaseUrl$route"
        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -MaximumRedirection 5
            $statusCode = [int]$response.StatusCode
            if ($statusCode -ne 200) {
                $failures.Add("$url => HTTP $statusCode")
            } else {
                Write-Host "  PASS  $url => HTTP $statusCode"
            }
        } catch {
            $message = $_.Exception.Message
            $status = ''
            if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
                $status = [int]$_.Exception.Response.StatusCode
            }
            if ($status) {
                $failures.Add("$url => HTTP $status ($message)")
            } else {
                $failures.Add("$url => ERROR ($message)")
            }
        }
    }

    return ,$failures
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$distPath = Join-Path $repoRoot 'dist/AskAMuslim'
$nginxConfigPath = Join-Path $repoRoot 'scripts/nginx.spa.local.conf'

if (-not (Test-Path $nginxConfigPath)) {
    throw "Missing nginx config: $nginxConfigPath"
}

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
$useDocker = $null -ne $dockerCmd -and -not $PreferLocalServer

Write-Step 'Building Angular app with production configuration...'
Push-Location $repoRoot
try {
    & npm run build -- --configuration=production
    if ($LASTEXITCODE -ne 0) {
        throw "Production build failed with exit code $LASTEXITCODE"
    }

    if (-not (Test-Path $distPath)) {
        throw "Expected dist output not found: $distPath"
    }

    $routes = @(
        '/',
        '/academy',
        '/academy/',
        '/academy/course/123',
        '/academy/course/123/lesson/456'
    )

    $baseUrl = "http://localhost:$Port"
    $failures = New-Object System.Collections.Generic.List[string]

    if ($useDocker) {
        Write-Step 'Stopping previous smoke container if it exists...'
        & docker rm -f $ContainerName 2>$null | Out-Null

        Write-Step "Starting nginx container $ContainerName on port $Port..."
        & docker run --rm -d `
            --name $ContainerName `
            -p "${Port}:80" `
            -v "${distPath}:/usr/share/nginx/html:ro" `
            -v "${nginxConfigPath}:/etc/nginx/conf.d/default.conf:ro" `
            $Image | Out-Null

        if ($LASTEXITCODE -ne 0) {
            throw 'Failed to start nginx container.'
        }

        if (-not (Wait-ForHttpReady -Url "$baseUrl/")) {
            throw 'Nginx container started but HTTP endpoint did not become ready.'
        }

        $failures = Test-Routes -BaseUrl $baseUrl -Routes $routes

        Write-Step 'Stopping nginx container...'
        & docker rm -f $ContainerName | Out-Null
    }
    else {
        if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
            throw 'Neither Docker nor npx is available. Install Docker Desktop or Node.js tooling to run this smoke test.'
        }

        Write-Step 'Docker not found (or local mode requested); falling back to static SPA server via serve.'
        $serveProcess = $null
        try {
            $serveArgs = @('--yes', 'serve', '-s', $distPath, '-l', "$Port")
            $serveProcess = Start-Process -FilePath 'npx.cmd' `
                -ArgumentList $serveArgs `
                -PassThru `
                -WindowStyle Hidden

            if (-not (Wait-ForHttpReady -Url "$baseUrl/")) {
                throw 'Local static server did not become ready.'
            }

            $failures = Test-Routes -BaseUrl $baseUrl -Routes $routes
        }
        finally {
            if ($serveProcess -and -not $serveProcess.HasExited) {
                Stop-Process -Id $serveProcess.Id -Force
            }
        }
    }

    if (@($failures).Count -gt 0) {
        Write-Host ''
        Write-Host 'Smoke test failed:' -ForegroundColor Red
        $failures | ForEach-Object { Write-Host "  FAIL  $_" }
        exit 1
    }

    Write-Host ''
    Write-Host 'Smoke test passed: all tested production deep links returned HTTP 200.' -ForegroundColor Green
    exit 0
}
finally {
    Pop-Location
}
