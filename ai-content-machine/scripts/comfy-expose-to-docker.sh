#!/usr/bin/env bash
# Forward host 127.0.0.1:8188 (SSH -R tunnel from the GPU PC) to the Docker bridge
# so the API container can use COMFY_BASE_URL=http://host.docker.internal:8188
#
# ssh -R binds the VPS loopback by default. host.docker.internal is the docker0
# gateway (not 127.0.0.1), which is why a raw tunnel is invisible to compose.
set -euo pipefail

PORT="${COMFY_PORT:-8188}"
echo "Enabling route_localnet + DNAT ${PORT} → 127.0.0.1:${PORT} (docker bridge → SSH tunnel)"
sudo sysctl -w net.ipv4.conf.all.route_localnet=1 >/dev/null
sudo sysctl -w net.ipv4.conf.docker0.route_localnet=1 >/dev/null 2>/dev/null || true

# Idempotent: skip if an identical DNAT already exists.
if ! sudo iptables -t nat -C OUTPUT -p tcp --dport "$PORT" -j DNAT --to-destination "127.0.0.1:${PORT}" 2>/dev/null; then
  sudo iptables -t nat -I OUTPUT -p tcp --dport "$PORT" -j DNAT --to-destination "127.0.0.1:${PORT}"
fi
if ! sudo iptables -t nat -C PREROUTING -p tcp --dport "$PORT" -j DNAT --to-destination "127.0.0.1:${PORT}" 2>/dev/null; then
  sudo iptables -t nat -I PREROUTING -p tcp --dport "$PORT" -j DNAT --to-destination "127.0.0.1:${PORT}"
fi

echo "Keep 8188 closed on the OCI Security List / NSG."
echo "Test from the api container: wget -qO- http://host.docker.internal:${PORT}/system_stats"
