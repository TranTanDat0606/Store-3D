# Full game session flow: login -> test-start -> game-complete -> my-coupons
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Step 1: Login
$loginBody = Get-Content -Raw -Path "$PSScriptRoot\login-body.json"
$resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -WebSession $session -ErrorAction Stop
$cookies = $session.Cookies.GetCookies("http://localhost:5000")
$tokenCookie = $cookies | Where-Object { $_.Name -eq "token" }
if (-not $tokenCookie) { Write-Host "FLOW FAIL: no token cookie"; exit 1 }
Write-Host "STEP1 LOGIN OK (cookie)"

# Step 2: test-start
$startBody = Get-Content -Raw -Path "$PSScriptRoot\test-start-body.json"
$resp2 = Invoke-RestMethod -Uri "http://localhost:5000/api/rewards/game/test-start" -Method POST -Body $startBody -ContentType "application/json" -WebSession $session -ErrorAction Stop
$sessionId = $resp2.data.sessionId
if (-not $sessionId) { Write-Host "FLOW FAIL: no sessionId"; exit 1 }
Write-Host "STEP2 TEST-START OK: sessionId=$sessionId"

# Step 3: game-complete
$completeBody = Get-Content -Raw -Path "$PSScriptRoot\game-complete-body.json"
$completeBody = $completeBody.Replace("PLACEHOLDER", $sessionId)
$resp3 = Invoke-RestMethod -Uri "http://localhost:5000/api/rewards/game/complete" -Method POST -Body $completeBody -ContentType "application/json" -WebSession $session -ErrorAction Stop
Write-Host "STEP3 GAME-COMPLETE OK: coupon=$($resp3.data.coupon.code)"

# Step 4: my-coupons
$resp4 = Invoke-RestMethod -Uri "http://localhost:5000/api/rewards/my-coupons" -Method GET -WebSession $session -ErrorAction Stop
$count = @($resp4.data).Count
Write-Host "STEP4 MY-COUPONS OK: $count coupons"
