#!/usr/bin/env bash
# Gera .env.production a partir do AWS Secrets Manager.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

SECRET_ID="${AWS_SECRET_ID:-tcg-judge/production/api}"
REGION="${AWS_REGION:-us-east-1}"
OUT="${ENV_OUT:-.env.production}"

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI não encontrado" >&2
  exit 1
fi

echo "Carregando secret: $SECRET_ID ($REGION)"
RAW="$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text)"

python3 - <<'PY' "$RAW" "$OUT"
import json
import sys
from urllib.parse import quote

raw, out = sys.argv[1], sys.argv[2]
data = json.loads(raw)

lines = [
    "ENVIRONMENT=production",
    "LOG_LEVEL=INFO",
    f"DATABASE_URL={data.get('DATABASE_URL', '')}",
    "DATABASE_SSL=require",
    f"REDIS_URL={data.get('REDIS_URL', 'redis://redis:6379/0')}",
    f"OPENAI_API_KEY={data.get('OPENAI_API_KEY', '')}",
    f"OPENAI_EMBEDDING_MODEL={data.get('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-large')}",
    f"OPENAI_EMBEDDING_DIMENSIONS={data.get('OPENAI_EMBEDDING_DIMENSIONS', '1536')}",
]

auth = data.get("RUNTIME_AUTH_SECRET") or data.get("JWT_SECRET") or data.get("API_SECRET")
if not auth:
    import secrets
    auth = secrets.token_urlsafe(48)
    print("AVISO: RUNTIME_AUTH_SECRET ausente no secret; gerado valor temporário.", file=sys.stderr)
lines.append(f"RUNTIME_AUTH_SECRET={auth}")

rt = data.get("RUNTIME_DATABASE_URL", "")
if not rt and data.get("DATABASE_URL"):
    u = data["DATABASE_URL"]
    for prefix in ("postgresql+asyncpg://", "postgresql+psycopg2://"):
        if u.startswith(prefix):
            rt = "postgresql://" + u[len(prefix) :]
            break
if rt:
    lines.append(f"RUNTIME_DATABASE_URL={rt}")

lines.extend([
    f"RUNTIME_PROMETHEUS={data.get('RUNTIME_PROMETHEUS', 'false')}",
    f"RUNTIME_OTLP={data.get('RUNTIME_OTLP', 'false')}",
])

from pathlib import Path

Path(out).write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Escrito: {out}")
PY

chmod 600 "$OUT" 2>/dev/null || true
echo "OK: $OUT"
