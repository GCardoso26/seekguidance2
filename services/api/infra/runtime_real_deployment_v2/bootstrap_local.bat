@echo off
cd /d %~dp0\..\..
pip install -r requirements.txt
if not exist generated\runtime_real_minimal mkdir generated\runtime_real_minimal
set RUNTIME_AUTH_SECRET=local-dev-secret
python -c "from app.runtime.runtime_real_auth.store import ensure_default_admin; ensure_default_admin()"
python -c "from app.runtime.runtime_real_persistence.schema import bootstrap_schema; bootstrap_schema()"
echo Bootstrap OK.
