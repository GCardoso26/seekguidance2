#!/usr/bin/env bash
# Wire the CWM API to the in-compose ComfyUI (A1 CPU path) and recreate api/comfy.
# Does not rebuild images. Does not touch OLLAMA_*/KOKORO_* or publish kill switches.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"

upsert() {
  local key="$1" val="$2"
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "${key}=${val}" > "$ENV_FILE"
    return
  fi
  if grep -qE "^${key}=" "$ENV_FILE"; then
    sed -i -E "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  elif grep -qE "^# ?${key}=" "$ENV_FILE"; then
    sed -i -E "s|^# ?${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

upsert COMFY_BASE_URL 'http://comfy:8188'
upsert COMFY_WORKFLOW 'image_a1_cpu'
upsert COMFY_CHECKPOINT 'v1-5-pruned-emaonly.safetensors'
upsert COMFY_TIMEOUT_MS '900000'
upsert COMFY_POLL_MS '3000'
upsert COMFY_WIDTH '512'
upsert COMFY_HEIGHT '768'
upsert COMFY_STEPS '4'

echo "Wrote Comfy A1 keys to $ENV_FILE"
grep -E '^COMFY_' "$ENV_FILE" || true

docker compose --profile comfy --env-file "$ENV_FILE" up -d --force-recreate api comfy
echo
echo "Waiting for Comfy /system_stats (first CPU boot can take 1–3 min)…"
ready=0
for i in $(seq 1 36); do
  if curl -fsS --max-time 5 http://127.0.0.1:8188/system_stats >/dev/null 2>&1; then
    echo "Comfy is up."
    ready=1
    break
  fi
  echo "  … still starting ($i/36)"
  sleep 5
done
if [[ "$ready" -ne 1 ]]; then
  echo "WARN: /system_stats still not ready. Showing diagnostics anyway."
fi
"$ROOT/scripts/comfy-status.sh"
