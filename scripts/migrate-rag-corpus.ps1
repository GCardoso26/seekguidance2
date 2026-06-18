# Migra corpus RAG (chunks, documents, games) do Supabase antigo para rjgzaakhzuzdzcooywva.
#
# Uso:
#   $env:TARGET_DATABASE_URL = "postgresql+asyncpg://postgres.rjgzaakhzuzdzcooywva:SENHA@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
#   $env:DATABASE_SSL = "require"
#   pwsh scripts/migrate-rag-corpus.ps1              # dry-run
#   pwsh scripts/migrate-rag-corpus.ps1 -Confirm     # executa migração

param(
    [switch]$Confirm
)

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

# Origem: .env da API (udtpsgdhknlanyndilyo)
$apiEnv = Join-Path $repo "services\api\.env"
if (-not $env:SOURCE_DATABASE_URL -and (Test-Path $apiEnv)) {
    Get-Content $apiEnv | ForEach-Object {
        if ($_ -match '^\s*DATABASE_URL=(.+)$') {
            $env:SOURCE_DATABASE_URL = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $env:SOURCE_DATABASE_URL) {
    Write-Host "Defina SOURCE_DATABASE_URL (projeto udtpsgdhknlanyndilyo)." -ForegroundColor Red
    exit 1
}

if (-not $env:TARGET_DATABASE_URL) {
    Write-Host @"

TARGET_DATABASE_URL não definida.

No Supabase (rjgzaakhzuzdzcooywva) → Settings → Database → Connection string → Session pooler:

  `$env:TARGET_DATABASE_URL = "postgresql+asyncpg://postgres.rjgzaakhzuzdzcooywva:SUA_SENHA@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
  `$env:DATABASE_SSL = "require"

Senha com # → use %23 na URL.

"@ -ForegroundColor Yellow
    exit 1
}

$env:PYTHONPATH = Join-Path $repo "services\ingestion"
$args = @("$repo\scripts\migrate_rag_corpus.py")
if ($Confirm) { $args += "--confirm" }

Write-Host "Migração RAG: udtpsgdhknlanyndilyo → rjgzaakhzuzdzcooywva" -ForegroundColor Cyan
if (-not $Confirm) {
    Write-Host "Modo dry-run. Use -Confirm para executar." -ForegroundColor Yellow
}

python @args
exit $LASTEXITCODE
