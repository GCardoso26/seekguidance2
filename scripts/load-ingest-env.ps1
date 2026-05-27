# Carrega DATABASE_URL e OPENAI_API_KEY para ingestão local (PowerShell)
# Uso: . .\scripts\load-ingest-env.ps1
# Não sobrescreve variáveis já definidas na sessão (ex.: $env:DATABASE_URL = "...")
# Prioridade nos ficheiros (último ganha): api/.env < .env < .env.production

param([switch]$Force)

$repo = Split-Path $PSScriptRoot -Parent

$files = @(
    "$repo\services\api\.env",
    "$repo\.env",
    "$repo\.env.production"
)

$loaded = @()
foreach ($f in $files) {
    if (-not (Test-Path $f)) { continue }
    Get-Content $f | ForEach-Object {
        $line = $_.Trim()
        if (-not $line -or $line.StartsWith("#")) { return }
        if ($line -match '^\s*([^#=]+)=(.*)$') {
            $name = $Matches[1].Trim()
            $val = $Matches[2].Trim().Trim('"').Trim("'")
            if ($name -notin @("DATABASE_URL", "OPENAI_API_KEY", "OPENAI_EMBEDDING_MODEL", "OPENAI_EMBEDDING_DIMENSIONS", "DATABASE_SSL")) {
                return
            }
            if (-not $Force -and (Test-Path "env:$name")) {
                $existing = (Get-Item "env:$name").Value
                if ($existing) { return }
            }
            Set-Item -Path "env:$name" -Value $val
        }
    }
    $loaded += (Split-Path $f -Leaf)
}

if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL nao encontrada." -ForegroundColor Red
    Write-Host "Crie .env.production (copie de .env.supabase.example)" -ForegroundColor Yellow
    Write-Host "Supabase: Settings -> Database -> Connection string" -ForegroundColor Yellow
    return
}

if (-not $env:OPENAI_API_KEY) {
    Write-Host "OPENAI_API_KEY nao encontrada em $($loaded -join ', ')" -ForegroundColor Red
    return
}

# Diagnóstico seguro (sem senha)
try {
    if ($env:DATABASE_URL -match '@([^/:]+)') { $host = $Matches[1] }
    if ($env:DATABASE_URL -match 'postgresql(\+asyncpg)?://([^:]+)') { $user = $Matches[2] }
    Write-Host "OK: carregado de $($loaded -join ' -> ')" -ForegroundColor Green
    Write-Host "  user: $user"
    Write-Host "  host: $host"
    if ($host -match 'pooler\.supabase') {
        Write-Host "  modo: Session pooler (confirme regiao aws-X no Dashboard)" -ForegroundColor DarkYellow
    } elseif ($host -match 'db\..*\.supabase\.co') {
        Write-Host "  modo: ligacao directa (recomendado para ingestao longa)" -ForegroundColor DarkGreen
    }
} catch {
    Write-Host "OK: carregado de $($loaded -join ', ')" -ForegroundColor Green
}

Write-Host "OPENAI_API_KEY: sk-...$(($env:OPENAI_API_KEY).Substring([Math]::Max(0, $env:OPENAI_API_KEY.Length - 4)))"
