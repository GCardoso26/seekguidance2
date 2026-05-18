@echo off
cd /d %~dp0\..\..
python -m pip install -r requirements.txt
if not exist generated\runtime_real_minimal mkdir generated\runtime_real_minimal
set RUNTIME_DATA_DIR=generated\runtime_real_minimal
python -c "from app.runtime.runtime_real_auth.store import ensure_default_admin; ensure_default_admin()"
echo Bootstrap OK. Run: uvicorn app.main:app --reload
