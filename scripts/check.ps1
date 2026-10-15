$ErrorActionPreference='Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$env:PYTHONUTF8='1'
$env:GENVM_VERSION='v0.2.16'
& .\.venv\Scripts\genvm-lint.exe check contracts/clash_lock.py
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& .\.venv\Scripts\gltest.exe tests/direct -q --tb=short
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& node --test tests/receipts.test.mjs
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& npm run test --workspace frontend
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& npm run typecheck --workspace frontend
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
& npm run build --workspace frontend
exit $LASTEXITCODE
