# AKC087 FN sheet

Onboard shortcuts for the Ajazz AKC087 TKL. Pairing works without the Windows driver. Lighting is stored on the board.

Interactive page for Homarr/nginx: copy the [`web/`](web/) folder onto Unraid. No Node at runtime.

**Kill RGB**

1. `FN + X` — on / off
2. `FN + ↓` — dim until dark
3. `FN + \` — cycle the 18 effects until the off one

## Host on Unraid (Krusty-Burger)

nginx is enough. This is a few kilobytes of HTML/CSS/JS.

| Piece | Role |
| --- | --- |
| **nginx** | File server. Serves `web/`. |
| **Traefik** (later) | Hostname + TLS in front of nginx. Does not replace nginx. |
| **NPM** (now) | nginx + a GUI. Fine until you switch. |

When you move to Traefik: keep nginx as the container that holds these files. Traefik routes `fn.your.tld` → that container.

1. Copy `web/` to `/mnt/user/appdata/akc087-fn/`
2. Copy `deploy/nginx.conf` to `/mnt/user/appdata/akc087-fn/nginx.conf`
3. Docker → add `nginx:alpine`
   - Port: host `8787` → container `80`
   - Path: `/mnt/user/appdata/akc087-fn` → `/usr/share/nginx/html` (read only)
   - Path: `/mnt/user/appdata/akc087-fn/nginx.conf` → `/etc/nginx/conf.d/default.conf` (read only)
4. Open `http://krusty-burger:8787/`
5. Homarr → iframe widget → that URL (must load from the PC that opens Homarr)

A local VIA container is **not** a general web server. Same nginx can host VIA later as a second folder or hostname. WebHID needs `https://` (Traefik) or `http://localhost` — not plain `http://192.168.x.x`.

## RGB

| Chord | Hold | Action |
| --- | --- | --- |
| FN + \\ | | Cycle 18 effects (off is in the loop) |
| FN + ↑ | | Brightness up (5 steps; flashes 3× at max) |
| FN + ↓ | | Brightness down (off at the bottom) |
| FN + ← | | Effect direction |
| FN + → | | Color: RGB, red, orange, yellow, green, cyan, blue, purple, white |
| FN + − | | Speed down |
| FN + = | | Speed up |
| FN + X | | Lights on / off |
| FN + 1 | | FPS preset (WASD, arrows, 1) |
| FN + 2 | | MOBA preset |
| FN + 3 | | Alphas / office preset |
| FN + ` | | Record a preset: pick 1/2/3 first, tap keys to cycle 8 colors, FN+` saves |

## Connect

Confirmed on the AKC087 listing.

| Chord | Hold | Action |
| --- | --- | --- |
| FN + Q | 3s to pair | Bluetooth 1 (Q flashes blue) |
| FN + W | 3s to pair | Bluetooth 2 |
| FN + E | 3s to pair | Bluetooth 3 |
| FN + R | 3s to pair | 2.4 GHz (R flashes green) |
| FN + Tab | | Wired USB-C (backlight flashes 3×) |

## Media (F-row)

Bindings follow Win / Mac mode.

| Chord | Windows | Mac |
| --- | --- | --- |
| FN + F1 | Media player | Display brightness − |
| FN + F2 | Volume − | Display brightness + |
| FN + F3 | Volume + | Mission Control |
| FN + F4 | Mute | Launchpad |
| FN + F5 | Stop | Keyboard light − |
| FN + F6 | Previous track | Keyboard light + |
| FN + F7 | Play / pause | Previous track |
| FN + F8 | Next track | Play / pause |
| FN + F9 | Mail | Next track |
| FN + F10 | Browser | Mute |
| FN + F11 | This PC | Volume − |
| FN + F12 | Calculator | Volume + |

## System

| Chord | Hold | Action |
| --- | --- | --- |
| FN + A | | Win / Mac swap (one of A or S) |
| FN + S | | Win / Mac swap (the other) |
| FN + Win | | Lock Windows key |
| FN + Space | 3–5s | Factory reset — flashes 3×, clears lighting and wireless pairings |

Ajazz manuals disagree on whether A or S is Mac. Tap both once and watch whether Cmd/Win swap.

## Sources

- **Confirmed on AKC087:** FN+Q / W / E / R (Amazon listing).
- **Family firmware:** RGB cycle, brightness, color, presets, Win lock, and factory reset follow Ajazz tri-mode TKL boards of that year (AK873 / AC081). If `FN + \` does nothing, try `FN + Ins` — some inserts print the nav-cluster variant.

Linux and Mac never need the Windows installer.
