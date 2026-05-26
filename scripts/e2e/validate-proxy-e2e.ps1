# Validação E2E — proxy judgetcg.com.br → seekguidance.onrender.com
# Uso: pwsh scripts/e2e/validate-proxy-e2e.ps1

$ErrorActionPreference = "Continue"
$RENDER = "https://seekguidance.onrender.com"
$SITE = "https://judgetcg.com.br"
$fail = 0

function Test-Endpoint {
  param(
    [string]$Name,
    [string]$Method = "GET",
    [string]$Url,
    [string]$Body = $null,
    [int[]]$ExpectStatus = @(200)
  )
  $args = @("-sS", "-w", "`n%{http_code}", "-X", $Method, $Url, "-H", "Content-Type: application/json")
  if ($Body) { $args += @("--data-raw", $Body) }
  $raw = & curl.exe @args 2>&1
  $lines = $raw -split "`n"
  $code = [int]$lines[-1]
  $text = ($lines[0..($lines.Length - 2)] -join "`n")
  $preview = if ($text.Length -gt 100) { $text.Substring(0, 100) + "..." } else { $text }
  $ok = $ExpectStatus -contains $code
  if (-not $ok) { $script:fail++ }
  $mark = if ($ok) { "OK" } else { "FAIL" }
  Write-Host "[$mark] $Name → HTTP $code"
  if (-not $ok -or $text -match "DNS_HOSTNAME|INFINITE_LOOP|api_proxy") {
    Write-Host "       $preview"
  }
  return @{ ok = $ok; code = $code; body = $text }
}

Write-Host "=== E2E Proxy Validation ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "--- Render (API directa) ---" -ForegroundColor Yellow
Test-Endpoint "Render /v1/health" "GET" "$RENDER/v1/health"
Test-Endpoint "Render /auth/login" "POST" "$RENDER/auth/login" '{"username":"admin","password":"admin"}'
Test-Endpoint "Render /v1/games" "GET" "$RENDER/v1/games"
Test-Endpoint "Render URL errada (tcg-judge-api)" "GET" "https://tcg-judge-api.onrender.com/v1/health" $null @(404)

Write-Host ""
Write-Host "--- Vercel (proxy same-origin) ---" -ForegroundColor Yellow
$h = Test-Endpoint "Proxy /v1/health" "GET" "$SITE/api/proxy/v1/health"
$l = Test-Endpoint "Proxy /auth/login" "POST" "$SITE/api/proxy/auth/login" '{"username":"admin","password":"admin"}'
Test-Endpoint "Site /judge" "GET" "$SITE/judge"

Write-Host ""
Write-Host "--- Diagnóstico ---" -ForegroundColor Yellow
if ($h.body -match "DNS_HOSTNAME_RESOLVED_PRIVATE") {
  Write-Host "PROBLEMA: proxy Vercel ainda usa fetch serverless para host privado (deploy antigo ou vercel.json ignorado)." -ForegroundColor Red
  Write-Host "  → Root Directory deve ser frontend/runtime_console_v3 OU usar vercel.json na raiz do repo." -ForegroundColor Red
  Write-Host "  → Redeploy com Clear cache após commit 9efecb7+." -ForegroundColor Red
}
if ($h.body -match '"status"\s*:\s*"ok"') {
  Write-Host "Proxy OK — Vercel → Render funcional." -ForegroundColor Green
}
if ($l.body -match '"authenticated"\s*:\s*true') {
  Write-Host "Login via proxy OK." -ForegroundColor Green
}

Write-Host ""
if ($fail -eq 0) { Write-Host "Todos os testes passaram." -ForegroundColor Green; exit 0 }
Write-Host "$fail teste(s) falharam." -ForegroundColor Red
exit 1
