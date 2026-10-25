#!/usr/bin/env bash
# Acceptance test for the dev-mode site (Caddy on :443 -> Vite dev server on 127.0.0.1:5173).
# Usage: deploy/dev/smoke.sh [base-url]
#   deploy/dev/smoke.sh                                  # https://$SITE_HOST
#   deploy/dev/smoke.sh https://binnendifferenzierung.online
set -uo pipefail

BASE="${1:-https://${SITE_HOST:?set SITE_HOST or pass a base url}}"
BASE="${BASE%/}"
HOST="${BASE#https://}"
HOST="${HOST%%/*}"
pass=0
fail=0

ok()  { printf 'PASS  %s\n' "$1"; pass=$((pass + 1)); }
bad() { printf 'FAIL  %s\n' "$1"; fail=$((fail + 1)); }
code() { curl -sS -o /dev/null -m 10 -w '%{http_code}' "$1" 2>/dev/null || echo 000; }
hdr()  { curl -sSI -m 10 "$1" 2>/dev/null | tr -d '\r' | grep -i "^$2:" | head -1; }

# 1. Index over HTTPS. curl fails on any cert problem, so this also proves the
#    chain is publicly trusted, not self-signed.
c="$(code "$BASE/")"
[ "$c" = 200 ] && ok "GET / -> 200 over TLS" || bad "GET / -> 200 over TLS (got $c)"

body="$(curl -fsS -m 10 "$BASE/" 2>/dev/null || true)"

# 2. It is the real app shell.
case "$body" in
  *'Learning in Progress'*) ok "index.html contains the app title" ;;
  *) bad "index.html contains the app title" ;;
esac

# 3. It is the DEV server, not a production bundle.
case "$body" in
  *'/@vite/client'*) ok "index.html is served by Vite in dev mode (HMR client injected)" ;;
  *) bad "index.html is served by Vite in dev mode (HMR client injected)" ;;
esac

# 4. Vite's client script is fetchable through the proxy.
v="$(code "$BASE/@vite/client")"
[ "$v" = 200 ] && ok "GET /@vite/client -> 200" || bad "GET /@vite/client -> 200 (got $v)"

# 5. On-the-fly TSX transform works, i.e. the dev pipeline is live end to end.
t="$(curl -sS -o /dev/null -m 10 -w '%{content_type}' "$BASE/src/main.tsx" 2>/dev/null || echo none)"
case "$t" in
  *javascript*) ok "GET /src/main.tsx -> transformed to javascript" ;;
  *) bad "GET /src/main.tsx -> transformed to javascript (got '$t')" ;;
esac

# 6. HMR websocket upgrades through the proxy. Vite expects the vite-hmr
#    subprotocol; curl keeps the socket open, so the timeout is expected.
ws="$(curl -sS -i -m 3 --http1.1 \
  -H 'Connection: Upgrade' -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' \
  -H "Sec-WebSocket-Key: $(head -c 16 /dev/urandom | base64)" \
  -H 'Sec-WebSocket-Protocol: vite-hmr' "$BASE/" 2>/dev/null || true)"
case "$ws" in
  *'101 Switching Protocols'*) ok "HMR websocket -> 101 Switching Protocols" ;;
  *) bad "HMR websocket -> 101 Switching Protocols" ;;
esac

# 7. Plain HTTP is upgraded, not served.
r="$(code "http://$HOST/")"
case "$r" in
  301|302|307|308) ok "http://$HOST/ -> redirect ($r)" ;;
  *) bad "http://$HOST/ -> redirect (got $r)" ;;
esac

# 8. Nothing is cached: a cached module would silently defeat hot reload.
cc="$(hdr "$BASE/" cache-control)"
case "${cc:-}" in
  *no-store*) ok "index.html is not cached (Cache-Control: no-store)" ;;
  *) bad "index.html is not cached (got '${cc:-none}')" ;;
esac

printf '\n%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
