# Ingestão Sorcery — PDF local obrigatório em data/ingest/sorcery/
# Uso: pwsh scripts/ingest-sorcery-local.ps1

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
$sorceryDir = Join-Path $repo "data\ingest\sorcery"
$names = @(
    "Sorcery-Contested-Realm-Rulebook-October-2024.pdf",
    "Sorcery-Contested-Realm-Rulebook.pdf",
    "Sorcery-Rulebook.pdf",
    "sorcery-rulebook.pdf"
)

$found = $null
foreach ($n in $names) {
    $p = Join-Path $sorceryDir $n
    if (Test-Path $p) { $found = $p; break }
}

if (-not $found) {
    Write-Host "Nenhum PDF em $sorceryDir" -ForegroundColor Red
    Write-Host "Baixe o rulebook: https://sorcerytcg.com/how-to-play" -ForegroundColor Yellow
    Write-Host "Ver: data/ingest/sorcery/README.md"
    exit 1
}

Write-Host "PDF: $found" -ForegroundColor Green

Set-Location $repo
if (-not $env:PYTHONPATH) { $env:PYTHONPATH = Join-Path $repo "services\ingestion" }
if (-not $env:DATABASE_URL -and (Test-Path (Join-Path $repo "scripts\load-ingest-env.ps1"))) {
    . (Join-Path $repo "scripts\load-ingest-env.ps1")
}
if (-not $env:DATABASE_SSL) { $env:DATABASE_SSL = "require" }

python scripts/ingest_tcg.py --game sorcery --all
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Sorcery ingestão concluída." -ForegroundColor Green
