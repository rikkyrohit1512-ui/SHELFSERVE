<#
.SYNOPSIS
    ShelfSense Spring Boot Backend Runner
    Detects Java 17, Maven (or downloads portable Maven), and starts the Spring Boot application.
#>

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "      ShelfSense - Smart Library Management System        " -ForegroundColor Green
Write-Host "             Spring Boot 3.x Backend Starter               " -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan

# 1. Locate Java 17
$javaExe = $null
$defaultJdk = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"

if ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $javaExe = "$env:JAVA_HOME\bin\java.exe"
} elseif (Test-Path "$defaultJdk\bin\java.exe") {
    $env:JAVA_HOME = $defaultJdk
    $javaExe = "$defaultJdk\bin\java.exe"
} else {
    $cmd = Get-Command java -ErrorAction SilentlyContinue
    if ($cmd) {
        $javaExe = $cmd.Source
    }
}

if (-not $javaExe) {
    Write-Host "[ERROR] Java 17 JDK not found! Please ensure Java 17 is installed." -ForegroundColor Red
    exit 1
}

$javaVersion = & $javaExe -version 2>&1 | Select-Object -First 1
Write-Host "[OK] Using Java: $javaVersion" -ForegroundColor Green
Write-Host "     Path: $javaExe" -ForegroundColor Gray

# 2. Locate or Download Maven
$mvnExe = $null
$systemMvn = Get-Command mvn -ErrorAction SilentlyContinue
if ($systemMvn) {
    $mvnExe = $systemMvn.Source
} elseif (Test-Path "$scriptDir\.tools\apache-maven-3.9.6\bin\mvn.cmd") {
    $mvnExe = "$scriptDir\.tools\apache-maven-3.9.6\bin\mvn.cmd"
} else {
    Write-Host "[INFO] Maven not found in PATH. Preparing portable Apache Maven 3.9.6..." -ForegroundColor Yellow
    $toolsDir = "$scriptDir\.tools"
    if (-not (Test-Path $toolsDir)) {
        New-Item -ItemType Directory -Path $toolsDir | Out-Null
    }
    
    $zipPath = "$toolsDir\apache-maven-3.9.6-bin.zip"
    $mvnUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
    
    if (-not (Test-Path $zipPath)) {
        Write-Host "       Downloading Maven from $mvnUrl..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $mvnUrl -OutFile $zipPath
    }
    
    Write-Host "       Extracting Maven..." -ForegroundColor Cyan
    Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    $mvnExe = "$toolsDir\apache-maven-3.9.6\bin\mvn.cmd"
}

Write-Host "[OK] Using Maven: $mvnExe" -ForegroundColor Green

# 3. Check MySQL Connection (informational)
Write-Host "[INFO] Checking MySQL availability on localhost:3306..." -ForegroundColor Cyan
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $iar = $tcp.BeginConnect("127.0.0.1", 3306, $null, $null)
    $success = $iar.AsyncWaitHandle.WaitOne(2000, $false)
    if ($success -and $tcp.Connected) {
        $tcp.EndConnect($iar)
        $tcp.Close()
        Write-Host "[OK] MySQL is active on port 3306." -ForegroundColor Green
    } else {
        Write-Host "[WARN] MySQL port 3306 did not respond. Please ensure MySQL Service is running and 'shelfsense_db' database is created." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Could not probe port 3306: $_" -ForegroundColor Yellow
}

# 4. Launch Spring Boot
Write-Host ""
Write-Host "Starting Spring Boot application on http://localhost:8080..." -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate the server at any time." -ForegroundColor Gray
Write-Host "-----------------------------------------------------------" -ForegroundColor Gray

& $mvnExe spring-boot:run

