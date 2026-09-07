# Login and extract token from cookie
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$body = Get-Content -Raw -Path "$PSScriptRoot\login-body.json"
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json" -WebSession $session -ErrorAction Stop
    $cookies = $session.Cookies.GetCookies("http://localhost:5000")
    $tokenCookie = $cookies | Where-Object { $_.Name -eq "token" }
    if ($tokenCookie) {
        $tokenCookie.Value | Out-File -FilePath "$PSScriptRoot\auth-token.txt" -NoNewline -Encoding ascii
        Write-Host "LOGIN OK (cookie-based auth)"
    } else {
        Write-Host "LOGIN FAIL: no token cookie found"
        Write-Host "COOKIES: $($cookies | ForEach-Object { $_.Name })"
    }
} catch {
    Write-Host "LOGIN FAIL: $($_.Exception.Message)"
}
