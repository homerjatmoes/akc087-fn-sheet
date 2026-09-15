# Keyboard FN sheets

Onboard FN / VIA maps for the boards on this desk.

Static HTML/CSS/JS. Copy [`web/`](web/) onto Unraid nginx. No Node at runtime.

## Boards

- **Ajazz** — AK870, AKC087 (onboard FN, no VIA)
- **Epomaker** — Aula F75 Ultra, EK21, Galaxy65, QK108 (VIA + onboard FN)
- **Royal Kludge** — RK61

Open the nginx URL. Pick a manufacturer, then a model. Hash routes look like `#/epomaker/aula-f75-ultra`.

## Host on Unraid (Krusty-Burger)

nginx serves the site from `/mnt/user/appdata/nginx/www/kbfn/`

Mapped on the CachyOS PC as `/mnt/Krusty-Burger/appdata/nginx/www/kbfn/`

The GitHub repo keeps the site in `web/`. Clone it on the CachyOS PC under Documents, then copy `web/` onto nginx.

### First clone (CachyOS)

```bash
git clone https://github.com/homerjatmoes/keyboard-fn-sheets.git /home/mark/Documents/Dev/kbfn
mkdir -p /mnt/Krusty-Burger/appdata/nginx/www/kbfn
cp -a /home/mark/Documents/Dev/kbfn/web/. /mnt/Krusty-Burger/appdata/nginx/www/kbfn/
```

### Later updates

```bash
cd /home/mark/Documents/Dev/kbfn && git pull && cp -a web/. /mnt/Krusty-Burger/appdata/nginx/www/kbfn/
```

Then hard-refresh so `?v=hub4` loads.

Do not `git pull` inside the nginx `www/kbfn/` folder — that is the served copy of `web/`, not the git repo.

## `web/json/`

Function-sheet data is `maker--slug.json`. USB VIA definitions (the files VIA’s Design tab loads) keep the names from [via-browser-connect](https://github.com/homerjatmoes/via-browser-connect):

- `AULA_F75_ULTRA.json`
- `EPOMAKER_EK21.json`
- `EPOMAKER_GALAXY65.json`
- `EPOMAKER_QK108.json`
- `RK61.json`

The **VIA JSON** button downloads that USB file from this folder. USB only — no 2.4 GHz JSON.

A local VIA container is **not** a general web server. WebHID needs `https://` (Traefik) or `http://localhost`.
