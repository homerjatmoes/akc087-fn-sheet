# Function sheets

Onboard FN / VIA maps for the boards on this desk.

Static HTML/CSS/JS. Copy [`web/`](web/) onto Unraid nginx. No Node at runtime.

## Boards

- **Ajazz** — AK870, AKC087 (onboard FN, no VIA)
- **Epomaker** — Aula F75 Ultra, EK21, Galaxy65, QK108 (VIA + onboard FN)
- **Royal Kludge** — RK61

Open the nginx URL. Pick a manufacturer, then a model. Hash routes look like `#/epomaker/aula-f75-ultra`.

## Host on Unraid (Krusty-Burger)

nginx document root: `/mnt/user/appdata/nginx/www/`

Mapped on the CachyOS PC as `/mnt/Krusty-Burger/appdata/nginx/www/`

The GitHub repo keeps the site in `web/`. Keep a clone next to `www`, then copy `web/` into the nginx root.

### First clone (CachyOS)

```bash
git clone https://github.com/homerjatmoes/akc087-fn-sheet.git /mnt/Krusty-Burger/appdata/nginx/akc087-fn-sheet
cp -a /mnt/Krusty-Burger/appdata/nginx/akc087-fn-sheet/web/. /mnt/Krusty-Burger/appdata/nginx/www/
```

### Later updates

```bash
cd /mnt/Krusty-Burger/appdata/nginx/akc087-fn-sheet && git pull && cp -a web/. /mnt/Krusty-Burger/appdata/nginx/www/
```

Then hard-refresh the Homarr iframe so `?v=hub3` loads.

Do not `git pull` inside `www/` itself — that folder is the served copy of `web/`, not the git repo.

A local VIA container is **not** a general web server. WebHID needs `https://` (Traefik) or `http://localhost`.
