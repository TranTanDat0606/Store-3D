Start-Sleep -Seconds 4
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5000/api/auth/login' -Method POST -Body '{\"email\":\"admin@store3d.com\",\"password\":\"admin123\"}' -ContentType 'application/json' -ErrorAction Stop
    Write-Host "STATUS: $($r.StatusCode)"
    Write-Host "BODY: $($r.Content)"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
