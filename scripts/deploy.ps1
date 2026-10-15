$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$manifestPath = [System.IO.Path]::GetTempFileName()
& vercel deploy --dry --format=json | Out-File -LiteralPath $manifestPath -Encoding utf8
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& .\.venv\Scripts\python.exe scripts/vercel-audit.py $manifestPath
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& vercel deploy --prod --yes
exit $LASTEXITCODE
