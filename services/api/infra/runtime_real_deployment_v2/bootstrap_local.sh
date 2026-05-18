#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/../.."
pip install -r requirements.txt
mkdir -p generated/runtime_real_minimal
export RUNTIME_AUTH_SECRET="${RUNTIME_AUTH_SECRET:-local-dev-secret}"
python -c "from app.runtime.runtime_real_auth.store import ensure_default_admin; ensure_default_admin()"
python -c "from app.runtime.runtime_real_persistence.schema import bootstrap_schema; bootstrap_schema()"
echo "Bootstrap OK."
