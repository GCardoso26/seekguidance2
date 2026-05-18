#!/usr/bin/env sh
set -e
# EC2: usar compose na raiz do monorepo
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
exec "$ROOT/scripts/ec2/deploy_production.sh"
