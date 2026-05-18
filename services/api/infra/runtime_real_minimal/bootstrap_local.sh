#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/../.."
python -m pip install -r requirements.txt
mkdir -p generated/runtime_real_minimal
export RUNTIME_DATA_DIR="${RUNTIME_DATA_DIR:-generated/runtime_real_minimal}"
python -c "from app.runtime.runtime_real_auth.store import ensure_default_admin; ensure_default_admin()"
echo "Bootstrap OK. Run: uvicorn app.main:app --reload"
