#!/usr/bin/env bash
# One-time privileged setup for DEV MODE (hot reload) behind the real domain:
#
#   internet :80/:443 -> Caddy (systemd, real Let's Encrypt cert)
#                     -> 127.0.0.1:5173 Vite dev server (systemd --user, HMR)
#
# Run as root:  sudo deploy/dev/install.sh [site-host]
# Idempotent: safe to re-run after editing the Caddyfile or the unit.
set -euo pipefail

SITE_HOST="${1:-${SITE_HOST:-binnendifferenzierung.online}}"
DEV_USER="${DEV_USER:-hermesadmin}"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DEV_UID="$(id -u "$DEV_USER")"

say() { printf '\n== %s ==\n' "$1"; }

[ "$(id -u)" -eq 0 ] || { echo "run this as root: sudo $0 $SITE_HOST"; exit 1; }

case "$SITE_HOST" in
  *[!a-zA-Z0-9.-]*|'') echo "refusing: '$SITE_HOST' is not a hostname"; exit 1 ;;
esac

say "0. preflight"
for f in "$REPO_DIR/deploy/dev/Caddyfile" "$REPO_DIR/deploy/dev/lip-dev.service"; do
  [ -f "$f" ] || { echo "missing $f"; exit 1; }
done
# The certificate is bound to the hostname, and ACME only works if DNS already
# points here - otherwise Caddy fails after burning a validation attempt.
public_ip="$(ip -4 -o addr show scope global | awk '{print $4}' | cut -d/ -f1 | head -1)"
dns_ip="$(dig +short A "$SITE_HOST" 2>/dev/null | head -1)"
echo "host public IPv4: ${public_ip:-unknown}"
echo "DNS A $SITE_HOST: ${dns_ip:-none}"
if [ "$public_ip" != "$dns_ip" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "DNS does not point at this host; ACME would fail. Fix DNS or re-run with FORCE=1."
  exit 1
fi

say "1. Caddy"
if command -v caddy >/dev/null 2>&1; then
  echo "already installed: $(caddy version)"
else
  apt-get update -qq
  apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
    | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
    > /etc/apt/sources.list.d/caddy-stable.list
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  if ! apt-get install -y -qq caddy; then
    echo "WARN: install from the Caddy vendor repo failed; retrying with Debian's package"
    rm -f /etc/apt/sources.list.d/caddy-stable.list
    apt-get update -qq
    apt-get install -y -qq caddy
  fi
  echo "installed: $(caddy version)"
fi

say "2. render /etc/caddy/Caddyfile for $SITE_HOST"
if [ -f /etc/caddy/Caddyfile ]; then
  cp -a /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S)"
fi
sed "s/SITE_HOST/${SITE_HOST}/g" "$REPO_DIR/deploy/dev/Caddyfile" > /etc/caddy/Caddyfile
chown root:root /etc/caddy/Caddyfile
chmod 0644 /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

say "3. dev server supervision (systemd --user + linger for $DEV_USER)"
# Linger is what makes a --user unit exist at boot without a login session.
loginctl enable-linger "$DEV_USER"
loginctl show-user "$DEV_USER" -p Linger

install -d -o "$DEV_USER" -g "$DEV_USER" -m 0755 "$(getent passwd "$DEV_USER" | cut -d: -f6)/.config/systemd/user"
install -o "$DEV_USER" -g "$DEV_USER" -m 0644 "$REPO_DIR/deploy/dev/lip-dev.service" \
  "$(getent passwd "$DEV_USER" | cut -d: -f6)/.config/systemd/user/lip-dev.service"

run_as_user() {
  sudo -u "$DEV_USER" \
    env XDG_RUNTIME_DIR="/run/user/$DEV_UID" \
        DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$DEV_UID/bus" "$@"
}

if [ ! -S "/run/user/$DEV_UID/bus" ]; then
  echo "user manager not running yet; starting user@$DEV_UID.service"
  systemctl start "user@$DEV_UID.service"
  sleep 2
fi

run_as_user systemctl --user daemon-reload
run_as_user systemctl --user enable lip-dev.service
run_as_user systemctl --user restart lip-dev.service

say "4. wait for the dev server on 127.0.0.1:5173"
ready=0
for _ in $(seq 1 30); do
  if curl -fsS -m 2 -o /dev/null http://127.0.0.1:5173/; then ready=1; break; fi
  sleep 1
done
if [ "$ready" -ne 1 ]; then
  echo "dev server did not answer; last log lines:"
  run_as_user journalctl --user -u lip-dev -n 30 --no-pager || true
  exit 1
fi
echo "dev server is up"

say "5. start Caddy and wait for the certificate"
systemctl enable caddy
systemctl restart caddy
sleep 3
tls=0
for _ in $(seq 1 30); do
  if curl -fsS -m 5 -o /dev/null "https://$SITE_HOST/"; then tls=1; break; fi
  sleep 2
done
if [ "$tls" -ne 1 ]; then
  echo "https://$SITE_HOST/ is not answering yet. Caddy log:"
  journalctl -u caddy -n 40 --no-pager || true
  echo
  echo "If ACME failed on the challenge, inbound TCP 80/443 is most likely filtered"
  echo "upstream (provider firewall) - a DNS or proxy fault looks the same in the log."
  exit 1
fi
echo "TLS is live"

say "6. acceptance test"
SITE_HOST="$SITE_HOST" "$REPO_DIR/deploy/dev/smoke.sh" "https://$SITE_HOST"
