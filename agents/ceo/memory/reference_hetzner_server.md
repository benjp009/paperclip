---
name: Hetzner server infrastructure
description: Amorce Studio production server details — Hetzner VPS at 91.98.27.15 running Caddy, PM2, Docker, Node 22
type: reference
---

Amorce Studio production server: 91.98.27.15 (Hetzner, Ubuntu)

- **Reverse proxy**: Caddy v2.11.2 on port 80/443, config at `/etc/caddy/Caddyfile`
- **amorce.studio** → PM2 `amorce-website` on port 3001 (`/var/www/amorce-website`, Next.js 16)
- **panel.amorce.studio** → Docker Compose Paperclip on port 3100 (`/opt/paperclip`, Docker Compose with external Postgres)
- **Paperclip data**: `/opt/paperclip-data` (Docker volume mount to `/paperclip`)
- **Paperclip DB**: Postgres 17 in Docker container, accessible via `docker compose -f /opt/paperclip/docker-compose.yml exec db psql -U paperclip -d paperclip`
- **Old api PM2 process**: stopped (was at `/root/amorce-agent-system` on port 3000)
- **SSL**: Auto-provisioned by Caddy (Let's Encrypt)
- **Node**: v22.22.0, pnpm 10.32.1
- **Docker**: v28.2.2, Docker Compose v2.37.1
- **PM2**: Process manager, `pm2 save` persists across reboots
- **nginx**: Installed but not active (port 80 used by Caddy)
- **Domain**: amorce.studio and panel.amorce.studio both DNS pointed to 91.98.27.15 (live)

**How to apply:** When deploying updates or debugging production issues, SSH to this server. Use Caddy (not nginx) for routing. PM2 for the website, Docker Compose for Paperclip.
