#!/usr/bin/env python3
"""Seed admin — SQLite ou Postgres via RUNTIME_DATABASE_URL."""
from app.runtime.runtime_real_auth.store import ensure_default_admin
from app.runtime.runtime_real_persistence.schema import bootstrap_schema

if __name__ == "__main__":
    bootstrap_schema()
    ensure_default_admin()
    print("seed ok")
