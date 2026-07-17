# Run BOTH Flutter apps in BACKEND mode so data persists to the Node server / SQLite
# (customers, journey, orders). In standalone/default mode the apps use in-memory
# mocks and NOTHING is saved — that is why the CMS showed no data.
#
# Usage (from repo root or anywhere):
#   powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1 -BackendHost 10.0.1.12
#
# Prereqs (start these first, in their own terminals):
#   cd server ; npm start          # backend API + WS on :3000
#   cd cms    ; npm run dev         # CMS admin on :4000
param(
  [string]$BackendHost = ""
)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$frontend = Join-Path $root "frontend"

# 1) Resolve the host LAN IP the phones/box connect to.
if (-not $BackendHost) {
  $BackendHost = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -like "10.0.*" -or $_.IPAddress -like "192.168.*" } |
    Select-Object -First 1 -ExpandProperty IPAddress
}
Write-Host "==> BACKEND_HOST = $BackendHost" -ForegroundColor Cyan

# 2) Discover devices: the box is the network device (ip:5555); the phone is the rest.
$devs  = (adb devices) -split "`r?`n" | Where-Object { $_ -match "\tdevice$" } | ForEach-Object { ($_ -split "\t")[0] }
$box   = $devs | Where-Object { $_ -like "*:5555" } | Select-Object -First 1
$phone = $devs | Where-Object { $_ -notlike "*:5555" } | Select-Object -First 1
Write-Host "==> Display(box)=$box  Mobile(phone)=$phone" -ForegroundColor Cyan

function Deploy($app, $pkg, $device) {
  if (-not $device) { Write-Host "   (skip $app - no device)" -ForegroundColor Yellow; return }
  Write-Host "==> Building + installing $app on $device ..." -ForegroundColor Green
  Push-Location (Join-Path $frontend $app)
  try {
    flutter build apk --debug --dart-define=BACKEND=true --dart-define=BACKEND_HOST=$BackendHost
    adb -s $device install -r "build\app\outputs\flutter-apk\app-debug.apk"
    adb -s $device shell monkey -p $pkg -c android.intent.category.LAUNCHER 1 | Out-Null
  } finally { Pop-Location }
}

Deploy "display_app" "com.ebanitech.display_app" $box
Deploy "mobile_app"  "com.ebanitech.mobile_app"  $phone

Write-Host "`nDone. Both apps launched in BACKEND mode -> data now saves to :3000 / SQLite; watch it in the CMS (:4000)." -ForegroundColor Cyan
