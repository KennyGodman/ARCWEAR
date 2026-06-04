# Embed arcc.png as base64 into both email template files

$logoPath = "c:\Users\HP\Documents\ARCWEAR\public\arcc.png"
$bytes = [System.IO.File]::ReadAllBytes($logoPath)
$b64 = [Convert]::ToBase64String($bytes)
$dataUri = "data:image/png;base64,$b64"

Write-Host "Logo base64 length: $($b64.Length) chars"

# ── 1. Update send-confirmation.js ──────────────────────────
$apiFile = "c:\Users\HP\Documents\ARCWEAR\api\send-confirmation.js"
$apiContent = Get-Content $apiFile -Raw
$oldSrc = 'src="https://arcwear.vercel.app/arcc.png"'
$newSrc = 'src="' + $dataUri + '"'
$apiContent = $apiContent -replace [regex]::Escape($oldSrc), $newSrc
Set-Content $apiFile -Value $apiContent -NoNewline
Write-Host "Updated api/send-confirmation.js"

# ── 2. Update vite.config.js ────────────────────────────────
$viteFile = "c:\Users\HP\Documents\ARCWEAR\vite.config.js"
$viteContent = Get-Content $viteFile -Raw

$oldLogoText = '<p style="color:#c47d2a;font-size:22px;font-weight:800;margin:0;">` + String.fromCharCode(9676) + ` ARCWEAR</p>'

# Just replace the entire logo section with an inline-image version
$oldLogoSection = '<p style="color:#c47d2a;font-size:22px;font-weight:800;margin:0;">' + [char]9676 + ' ARCWEAR</p>'
$newLogoSection = '<img src="' + $dataUri + '" alt="ArcWear" style="height:48px;object-fit:contain;"/>'

$viteContent = $viteContent.Replace($oldLogoSection, $newLogoSection)
Set-Content $viteFile -Value $viteContent -NoNewline
Write-Host "Updated vite.config.js"

Write-Host ""
Write-Host "Done! Logo embedded as base64 in both email templates."
