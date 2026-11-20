$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$release = Join-Path $root 'release'
$payload = Join-Path $release 'Krypt-portable'
$bundle = Join-Path $release 'installer-bundle'
$stage = Join-Path $release 'setup-stage'
$setup = Join-Path $release 'Krypt-Setup-1.0.0.exe'
$iexpress = 'C:\Windows\System32\iexpress.exe'
$rcedit = Join-Path $root 'node_modules\electron-winstaller\vendor\rcedit.exe'

if (!(Test-Path -LiteralPath $payload)) { throw 'release/Krypt-portable est introuvable. Créez d’abord la version portable.' }
if (!(Test-Path -LiteralPath (Join-Path $payload 'Krypt.exe'))) { throw 'Krypt.exe est introuvable dans le payload.' }
if (!(Test-Path -LiteralPath $iexpress)) { throw 'IExpress est introuvable sur ce Windows.' }
foreach ($target in @($bundle, $stage)) {
  if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Recurse -Force }
}
New-Item -ItemType Directory -Path $bundle, $stage | Out-Null

Copy-Item -Path (Join-Path $root 'node_modules\electron\dist\*') -Destination $bundle -Recurse
Rename-Item -LiteralPath (Join-Path $bundle 'electron.exe') -NewName 'KryptInstaller.exe'
$defaultApp = Join-Path $bundle 'resources\default_app.asar'
if (Test-Path -LiteralPath $defaultApp) { Remove-Item -LiteralPath $defaultApp -Force }
Copy-Item -LiteralPath (Join-Path $root 'assets') -Destination (Join-Path $bundle 'resources\assets') -Recurse
$app = Join-Path $bundle 'resources\app'
New-Item -ItemType Directory -Path $app | Out-Null
Copy-Item -LiteralPath (Join-Path $root 'installer\main.js') -Destination (Join-Path $app 'main.js')
Copy-Item -LiteralPath (Join-Path $root 'installer\preload.js') -Destination (Join-Path $app 'preload.js')
Copy-Item -LiteralPath (Join-Path $root 'installer\krypt-installer.html') -Destination (Join-Path $app 'krypt-installer.html')
Copy-Item -LiteralPath (Join-Path $root 'build') -Destination (Join-Path $app 'build') -Recurse
@'
{
  "name": "krypt-installer",
  "version": "1.0.0",
  "main": "main.js"
}
'@ | Set-Content -LiteralPath (Join-Path $app 'package.json') -Encoding UTF8
Copy-Item -LiteralPath $payload -Destination (Join-Path $bundle 'resources\app-payload') -Recurse
if (Test-Path -LiteralPath $rcedit) {
  & $rcedit (Join-Path $bundle 'KryptInstaller.exe') --set-icon (Join-Path $root 'build\icon.ico')
  & $rcedit (Join-Path $bundle 'resources\app-payload\Krypt.exe') --set-icon (Join-Path $root 'build\icon.ico')
}

$zip = Join-Path $stage 'installer-bundle.zip'
Compress-Archive -Path (Join-Path $bundle '*') -DestinationPath $zip -CompressionLevel Optimal
@'
@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%~dp0installer-bundle.zip' -DestinationPath '%~dp0bundle' -Force; Start-Process -FilePath '%~dp0bundle\KryptInstaller.exe' -Wait"
'@ | Set-Content -LiteralPath (Join-Path $stage 'launch-installer.cmd') -Encoding ASCII

$sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=1
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=$setup
FriendlyName=Krypt Setup
IconFile=$root\build\icon.ico
AppLaunched=launch-installer.cmd
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=0
[Strings]
FILE0="installer-bundle.zip"
FILE1="launch-installer.cmd"
[SourceFiles]
SourceFiles0=$stage\
[SourceFiles0]
%FILE0%=
%FILE1%=
"@
$sedPath = Join-Path $stage 'setup.sed'
Set-Content -LiteralPath $sedPath -Value $sed -Encoding ASCII
& $iexpress /N /Q $sedPath
if ($LASTEXITCODE -ne 0 -or !(Test-Path -LiteralPath $setup)) { throw 'IExpress n’a pas produit Krypt-Setup-1.0.0.exe.' }
Get-Item -LiteralPath $setup | Select-Object FullName, Length
