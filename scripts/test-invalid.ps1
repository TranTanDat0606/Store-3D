# Verify invalid credentials return 400
$invalidBody = Get-Content -Raw -Path "$PSScriptRoot\test-invalid-body.json"
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $invalidBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "INVALID FAIL: got 200 instead of 400"
    exit 1
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "INVALID OK: bad credentials correctly rejected (400)"
    } else {
        Write-Host "INVALID FAIL: got $code instead of 400"
        exit 1
    }
}
