#!/usr/bin/env python3
"""Launcher — injects TCGHub keys from env and runs unified scraper."""
import os
import subprocess
import sys


def _require_env(name: str) -> str:
    value = (os.environ.get(name) or "").strip()
    if not value:
        raise SystemExit(f"Missing required env var: {name}")
    return value


env = os.environ.copy()
env.setdefault("TCGHUB_SUPABASE_URL", os.environ.get("SUPABASE_URL", ""))
env["TCGHUB_SERVICE_ROLE_KEY"] = _require_env("TCGHUB_SERVICE_ROLE_KEY")
env["FIRECRAWL_API_KEY"] = _require_env("FIRECRAWL_API_KEY")
env["SCRAPE_CARDS_PER_GAME"] = os.environ.get("SCRAPE_CARDS_PER_GAME", "10")

args = sys.argv[1:] if len(sys.argv) > 1 else []
script = os.path.join(os.path.dirname(__file__), "scrape_liga_unified.py")
sys.exit(subprocess.run([sys.executable, script, *args], env=env).returncode)
