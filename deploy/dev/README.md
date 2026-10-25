# Dev mode on the real domain

`https://binnendifferenzierung.online/` serves the **Vite dev server** (hot reload),
not a production build. Edits to `client/src/` appear in the browser without a
reload.

```
internet :80/:443 -> Caddy (system systemd unit, Let's Encrypt cert)
                  -> 127.0.0.1:5173  Vite dev server (systemd --user: lip-dev)
                  -> /api -> localhost:8000 (Vite's own proxy, unchanged)
```

| File | Purpose |
| --- | --- |
| `Caddyfile` | Site template; `SITE_HOST` is substituted at install time |
| `lip-dev.service` | systemd **--user** unit running Vite on loopback |
| `install.sh` | The one privileged command: Caddy, config, linger, unit |
| `smoke.sh` | Acceptance test (TLS, dev mode, HMR socket, redirect, no-cache) |

## Why a proxy instead of exposing Vite directly

Vite needs port 5173, but a domain without a port needs 443, and binding 443 means
root. Running the dev server itself as root is not acceptable, so Caddy terminates
TLS and forwards — including the HMR websocket. Vite stays on loopback.

`vite.config.ts` is driven by env vars (`DEV_HOST`, `DEV_PORT`,
`DEV_ALLOWED_HOSTS`, `DEV_HMR_CLIENT_PORT`); with none set it behaves exactly as
before, so local development on a laptop is unchanged.

## Setup (once, needs root)

```sh
cd ~/learning-in-progress
sudo deploy/dev/install.sh            # defaults to binnendifferenzierung.online
sudo deploy/dev/install.sh app.example.com   # or another host
```

It is idempotent: safe to re-run after changing the Caddyfile or the unit. It
refuses to run if the apex `A` record does not point at this host, because ACME
would fail after burning a validation attempt.

The dev server unit alone needs no root — only `loginctl enable-linger` (boot
persistence), the Caddy package, and `/etc/caddy/Caddyfile` do.

## Everyday use

```sh
systemctl --user status lip-dev      # is the dev server up
systemctl --user restart lip-dev     # after changing vite.config.ts or the .env
journalctl --user -u lip-dev -f      # Vite output
sudo systemctl status caddy          # the public entry point
sudo journalctl -u caddy -n 30       # certificate / proxy problems
deploy/dev/smoke.sh https://binnendifferenzierung.online
```

Vite is launched directly (not via `npm run dev`), so the unit's main PID is the
server. Editing files under `client/src/` needs nothing: HMR handles it.

## Certificate details

- Caddy obtains and renews the cert automatically via HTTP-01 on port 80.
- Inbound TCP **80 and 443 must be open** at the provider's firewall. A blocked
  port and a DNS mistake look identical in the Caddy log ("ACME challenge
  failed"); check DNS with `dig +short A binnendifferenzierung.online` first.
- Certs live in `/var/lib/caddy/.local/share/caddy` — deleting that re-issues on
  the next start (subject to Let's Encrypt's 50/week per-domain limit).

## Deliberate omissions (this is dev mode)

- **No HSTS.** Browsers would then refuse plain HTTP for months, which is hostile
  to a development host.
- **`Cache-Control: no-store`** on every response, so a stale module can never
  mask a hot update.
- **Loopback-only dev server.** Only Caddy can reach 5173.
- **`/api` is unauthenticated.** Vite proxies it to `localhost:8000`; while the
  Python server is not running those calls fail, the page still loads.
- **Not a production deployment.** There is no built artifact, no minification and
  no `tsc` gate. For that, see the TLS production plan in
  `.hermes/plans/2026-10-24_231500-serve-client-https-root.md`, and stop this unit
  first so it does not compete for the origin.

## Rollback

```sh
sudo systemctl disable --now caddy
sudo apt purge -y caddy
systemctl --user disable --now lip-dev
sudo loginctl disable-linger hermesadmin
```
