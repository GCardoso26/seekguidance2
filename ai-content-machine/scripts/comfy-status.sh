#!/usr/bin/env bash
# Diagnose ComfyUI + CWM factory visual status on the VPS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== compose ==="
docker compose --profile comfy ps api comfy 2>/dev/null || docker compose ps api comfy

echo
echo "=== comfy logs (tail) ==="
docker compose --profile comfy logs --tail 40 comfy 2>/dev/null || docker compose logs --tail 40 comfy

echo
echo "=== host :8188 /system_stats ==="
if curl -fsS --max-time 8 http://127.0.0.1:8188/system_stats; then
  echo
else
  echo "FAIL: Comfy still starting, crashed, or not bound to 127.0.0.1:8188"
fi

echo
echo "=== api → http://comfy:8188/system_stats ==="
docker compose exec -T api node -e '
fetch("http://comfy:8188/system_stats", { signal: AbortSignal.timeout(8000) })
  .then(async (r) => { console.log("http", r.status); console.log(await r.text()); })
  .catch((e) => { console.error("FAIL", e.message || e); process.exitCode = 1; })
' || true

echo
echo "=== GET /api/factory/status visual ==="
docker compose exec -T api node -e '
fetch("http://127.0.0.1:8787/api/factory/status", { signal: AbortSignal.timeout(8000) })
  .then(async (r) => {
    const j = await r.json();
    console.log(JSON.stringify(j.visual, null, 2));
    if (!j.visual || j.visual.comfy !== "READY") process.exitCode = 2;
  })
  .catch((e) => { console.error("FAIL", e.message || e); process.exitCode = 1; })
' || true

echo
echo "Expect visual.comfy=READY and comfyProbe.status=READY."
echo "NOT_CONFIGURED → falta COMFY_BASE_URL=http://comfy:8188 (rode ./scripts/comfy-enable-a1.sh)."
echo "ERROR → Comfy crash-loop (ex. ModuleNotFoundError: requests) ou ainda a arrancar."
echo "  docker compose --profile comfy logs --tail 80 comfy"
echo "  Se faltar requests: git pull && docker compose --profile comfy up -d --build comfy"
