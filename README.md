# Function sheets

Onboard FN / VIA maps for the boards on this desk.

Interactive page for Homarr/nginx: copy the [`web/`](web/) folder onto Unraid. No Node at runtime.

## Boards

- **Ajazz** — AK870, AKC087 (onboard FN, no VIA)
- **Epomaker** — Aula F75 Ultra, EK21, Galaxy65, QK108 (VIA + onboard FN)
- **Royal Kludge** — RK61

Open `web/index.html` (or the nginx URL). Pick a manufacturer, then a model.

## Host on Unraid (Krusty-Burger)

nginx is enough. This is HTML/CSS/JS.

1. Copy `web/` to `/mnt/user/appdata/akc087-fn/`
2. Copy `deploy/nginx.conf` to `/mnt/user/appdata/akc087-fn/nginx.conf`
3. Docker → `nginx:alpine`
   - Port: host `8787` → container `80`
   - Path: `/mnt/user/appdata/akc087-fn` → `/usr/share/nginx/html` (read only)
   - Path: `/mnt/user/appdata/akc087-fn/nginx.conf` → `/etc/nginx/conf.d/default.conf` (read only)
4. Open `http://krusty-burger:8787/`
5. Homarr → iframe widget → that URL

Replace the old `web/` contents when you pull this update — hash routes (`#/epomaker/aula-f75-ultra`) need this `index.html` + `data.json` + `app.js`.

A local VIA container is **not** a general web server. WebHID needs `https://` (Traefik) or `http://localhost`.
