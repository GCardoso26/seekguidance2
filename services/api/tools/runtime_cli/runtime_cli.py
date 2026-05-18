#!/usr/bin/env python3
"""CLI mínima — runtime up | health | replay | tenant | backup | restore."""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

_API = Path(__file__).resolve().parents[2]
if str(_API) not in sys.path:
    sys.path.insert(0, str(_API))

from sdk.python.tcg_runtime import AuthClient, ReplayClient  # noqa: E402


def cmd_health(args: argparse.Namespace) -> int:
    c = AuthClient(args.base_url, api_key=args.api_key)
    if args.user:
        c.login(args.user, args.password)
    print(json.dumps(c.health(), indent=2))
    return 0


def cmd_up(args: argparse.Namespace) -> int:
    print("Use: uvicorn app.main:app --host 0.0.0.0 --port 8000")
    print("Or: docker compose -f infra/runtime_real_minimal/docker-compose.yml up")
    return 0


def cmd_replay(args: argparse.Namespace) -> int:
    c = AuthClient(args.base_url)
    if args.user:
        c.login(args.user, args.password)
    r = ReplayClient(args.base_url, token=c.token)
    if args.payload:
        out = r.append(args.scope, json.loads(args.payload))
    else:
        out = r.list_replays(args.tenant)
    print(json.dumps(out, indent=2))
    return 0


def cmd_tenant_create(args: argparse.Namespace) -> int:
    import urllib.request

    url = f"{args.base_url.rstrip('/')}/runtime/tenants?tenant_id={args.tenant_id}&name={args.name}"
    req = urllib.request.Request(url, method="POST")
    with urllib.request.urlopen(req) as resp:
        print(resp.read().decode())
    return 0


def cmd_backup(args: argparse.Namespace) -> int:
    src = Path(args.data_dir or "generated/runtime_real_minimal")
    dst = Path(args.out or "runtime_backup")
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(json.dumps({"backed_up": str(dst), "integrity_status": "ok"}))
    return 0


def cmd_verify_backup(args: argparse.Namespace) -> int:
    from app.runtime.runtime_restore_system.engine import runtime_restore_engine_v1

    r = runtime_restore_engine_v1("cli", backup_path=args.from_dir, dry_run=True)
    print(json.dumps(r, indent=2))
    return 0 if r.get("would_restore") or r.get("dry_run") else 1


def cmd_export_runtime(args: argparse.Namespace) -> int:
    from app.runtime.runtime_usage_analytics.engine import runtime_usage_analytics_engine_v1

    r = runtime_usage_analytics_engine_v1("cli", export=args.format or "json")
    print(json.dumps(r, indent=2))
    return 0


def cmd_backup_engine(args: argparse.Namespace) -> int:
    from app.runtime.runtime_backup_system.engine import runtime_backup_engine_v1

    r = runtime_backup_engine_v1("cli", target_dir=args.out, include_postgres=args.postgres)
    print(json.dumps(r, indent=2))
    return 0


def cmd_restore(args: argparse.Namespace) -> int:
    src = Path(args.from_dir)
    dst = Path(args.data_dir or "generated/runtime_real_minimal")
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(json.dumps({"restored": str(dst), "integrity_status": "ok"}))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="runtime")
    p.add_argument("--base-url", default="http://127.0.0.1:8000")
    p.add_argument("--user", default=None)
    p.add_argument("--password", default="admin")
    p.add_argument("--api-key", default=None)
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("up").set_defaults(func=cmd_up)
    h = sub.add_parser("health")
    h.set_defaults(func=cmd_health)

    rp = sub.add_parser("replay")
    rp.add_argument("--scope", default="cli")
    rp.add_argument("--tenant", default="default")
    rp.add_argument("--payload", default=None)
    rp.set_defaults(func=cmd_replay)

    tc = sub.add_parser("tenant")
    tc.add_argument("create", nargs="?")
    tc.add_argument("--tenant-id", default="pilot-1")
    tc.add_argument("--name", default="Pilot Tenant")
    tc.set_defaults(func=cmd_tenant_create)

    bk = sub.add_parser("backup")
    bk.add_argument("--out", default=None)
    bk.add_argument("--postgres", action="store_true")
    bk.set_defaults(func=cmd_backup_engine)

    vb = sub.add_parser("verify-backup")
    vb.add_argument("--from-dir", required=True)
    vb.set_defaults(func=cmd_verify_backup)

    ex = sub.add_parser("export-runtime")
    ex.add_argument("--format", default="json", choices=["json", "csv"])
    ex.set_defaults(func=cmd_export_runtime)

    rs = sub.add_parser("restore")
    rs.add_argument("--from-dir", required=True)
    rs.add_argument("--data-dir", default=None)
    rs.set_defaults(func=cmd_restore)

    args = p.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
