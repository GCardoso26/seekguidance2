# E2E: judge multi-TCG — não deve responder "em breve" para jogos com corpus
# Uso: pwsh scripts/e2e/validate-judge-multi-tcg.ps1
# Opcional: $env:E2E_BASE = "https://judgetcg.com.br/api/proxy"

$ErrorActionPreference = "Continue"
$BASE = if ($env:E2E_BASE) { $env:E2E_BASE.TrimEnd("/") } else { "https://judgetcg.com.br/api/proxy" }

$tcgs = @(
    @{ id = "magic"; q = "What happens during upkeep?" },
    @{ id = "flesh_and_blood"; q = "How does go again work?" },
    @{ id = "digimon"; q = "How does digivolution work?" },
    @{ id = "gundam"; q = "How do you win the game?" },
    @{ id = "dragon_ball"; q = "What is the energy cost?" },
    @{ id = "sorcery"; q = "How do you win the game?" },
    @{ id = "vanguard"; q = "What is a vanguard?" },
    @{ id = "riftbound"; q = "How do runes work?" },
    @{ id = "union_arena"; q = "What is the attack phase?" }
)

$fail = 0
Write-Host "=== E2E Judge Multi-TCG ($BASE) ===" -ForegroundColor Cyan

foreach ($t in $tcgs) {
    $body = (@{ tcg = $t.id; question = $t.q } | ConvertTo-Json -Compress)
    try {
        $raw = curl.exe -sS -w "`n%{http_code}" -X POST "$BASE/runtime/judge/query" `
            -H "Content-Type: application/json" --data-raw $body 2>&1
        $lines = $raw -split "`n"
        $code = [int]$lines[-1]
        $json = ($lines[0..($lines.Length - 2)] -join "`n") | ConvertFrom-Json
        $answer = [string]$json.answer
        $soon = $answer -match "em breve|estará disponível"
        $ok = ($code -eq 200) -and -not $soon
        if (-not $ok) { $script:fail++ }
        $mark = if ($ok) { "OK" } else { "FAIL" }
        $preview = if ($answer.Length -gt 80) { $answer.Substring(0, 80) + "..." } else { $answer }
        Write-Host "[$mark] $($t.id) HTTP $code — $preview"
    } catch {
        $script:fail++
        Write-Host "[FAIL] $($t.id) — $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Star Wars Unlimited deve continuar "em breve"
$swuBody = '{"tcg":"swu","question":"test"}'
$swuRaw = curl.exe -sS -w "`n%{http_code}" -X POST "$BASE/runtime/judge/query" -H "Content-Type: application/json" --data-raw $swuBody 2>&1
$swuLines = $swuRaw -split "`n"
$swuJson = ($swuLines[0..($swuLines.Length - 2)] -join "`n") | ConvertFrom-Json
if ($swuJson.answer -match "em breve|Star Wars") {
    Write-Host "[OK] swu → resposta coming-soon esperada" -ForegroundColor Green
} else {
    Write-Host "[FAIL] swu deveria estar em breve: $($swuJson.answer)" -ForegroundColor Red
    $fail++
}

Write-Host ""
if ($fail -eq 0) { Write-Host "Todos os testes judge multi-TCG passaram." -ForegroundColor Green; exit 0 }
Write-Host "$fail teste(s) falharam." -ForegroundColor Red
exit 1
