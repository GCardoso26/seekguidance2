# Testa ligacao Postgres (Supabase) antes da ingestao
# Uso: pwsh scripts/test-db-connection.ps1

param([switch]$ForceEnvFile)

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

if ($env:DATABASE_URL -and -not $ForceEnvFile) {
    Write-Host "Usando DATABASE_URL da sessao PowerShell (nao carrega .env)." -ForegroundColor Cyan
} else {
    . (Join-Path $repo "scripts\load-ingest-env.ps1") -Force:$ForceEnvFile
}
if (-not $env:DATABASE_URL) { exit 1 }

$py = @"
import asyncio
import os
import sys
sys.path.insert(0, r"$repo\services\ingestion")
from tcg_judge_ingestion.storage.dsn import asyncpg_connect_kwargs, normalize_asyncpg_dsn

async def main():
    dsn = normalize_asyncpg_dsn(os.environ["DATABASE_URL"])
    url, kwargs = asyncpg_connect_kwargs(os.environ["DATABASE_URL"])
    import asyncpg
    conn = await asyncpg.connect(url, **kwargs)
    row = await conn.fetchrow("SELECT current_user, current_database()")
    n = await conn.fetchval("SELECT count(*) FROM tcg_judge.games WHERE enabled = true")
    await conn.close()
    print(f"OK user={row['current_user']} db={row['current_database']} games_enabled={n}")

asyncio.run(main())
"@

$tmp = Join-Path $env:TEMP "tcg_test_db.py"
Set-Content -Path $tmp -Value $py -Encoding UTF8
$env:PYTHONPATH = Join-Path $repo "services\ingestion"

Write-Host "A testar ligacao..." -ForegroundColor Cyan
python $tmp
if ($LASTEXITCODE -eq 0) {
    Write-Host "Ligacao OK — pode correr ingestao." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Se aparecer 'tenant/user ... not found':" -ForegroundColor Yellow
    Write-Host "  1. Supabase Dashboard -> Settings -> Database" -ForegroundColor Yellow
    Write-Host "  2. Copie 'Session pooler' (porta 5432) OU 'Direct connection' (host db.xxx.supabase.co)" -ForegroundColor Yellow
    Write-Host "  3. Troque postgresql:// por postgresql+asyncpg://" -ForegroundColor Yellow
    Write-Host "  4. Senha com # -> %23 na URL" -ForegroundColor Yellow
    Write-Host "  5. Direct: user postgres | Pooler: user postgres.PROJECT_REF" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Teste ligacao DIRECTA (copie a senha do Dashboard):" -ForegroundColor Cyan
    Write-Host '  $env:DATABASE_URL = "postgresql+asyncpg://postgres:SENHA%23...@db.udtpsgdhknlanyndilyo.supabase.co:5432/postgres"' -ForegroundColor Gray
    Write-Host '  $env:DATABASE_SSL = "require"' -ForegroundColor Gray
    Write-Host "  pwsh scripts/test-db-connection.ps1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "O ficheiro .env na raiz pode ter URL errada. O script ja nao sobrescreve DATABASE_URL definida na sessao." -ForegroundColor Yellow
    exit 1
}
