# Valida URLs do catálogo de ingestão (HEAD → PDF)
# Uso: pwsh scripts/e2e/validate-ingestion-catalog.ps1

$ErrorActionPreference = "Continue"
$repo = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$py = @"
import sys
sys.path.insert(0, r"$repo\services\ingestion")
from tcg_judge_ingestion.crawler.tcg_official_sources import TCG_OFFICIAL_PDFS

for game, pdfs in sorted(TCG_OFFICIAL_PDFS.items()):
    for p in pdfs:
        print(f"{game}\t{p.doc_type}\t{p.url}")
"@

$lines = python -c $py 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao carregar catálogo Python: $lines" -ForegroundColor Red
    exit 1
}

$fail = 0
$ok = 0
Write-Host "=== Validação catálogo ingestão (PDF URLs) ===" -ForegroundColor Cyan
foreach ($line in $lines) {
    if (-not $line.Trim()) { continue }
    $parts = $line -split "`t", 3
    if ($parts.Count -lt 3) { continue }
    $game, $doc, $url = $parts[0], $parts[1], $parts[2]
    try {
        $r = Invoke-WebRequest -Uri $url -Method Head -MaximumRedirection 5 -TimeoutSec 25 -UseBasicParsing
        $ct = $r.Headers["Content-Type"]
        if ($ct -match "pdf" -or $url -match "\.pdf") {
            Write-Host "[OK] $game / $doc" -ForegroundColor Green
            $ok++
        } else {
            Write-Host "[WARN] $game / $doc — Content-Type: $ct" -ForegroundColor Yellow
            $ok++
        }
    } catch {
        Write-Host "[FAIL] $game / $doc — $url" -ForegroundColor Red
        Write-Host "       $($_.Exception.Message)"
        $fail++
    }
}

Write-Host ""
Write-Host "URLs OK: $ok | Falhas: $fail"
if ($fail -gt 0) { exit 1 }
exit 0
