# Verify unauthenticated requests return 401
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:5000/api/rewards/my-coupons" -Method GET -ErrorAction Stop
    Write-Host "401 FAIL: got 200 instead of 401"
    exit 1
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host "401 OK: unauthenticated request correctly rejected"
    } else {
        Write-Host "401 FAIL: got $code instead of 401"
        exit 1
    }
}
