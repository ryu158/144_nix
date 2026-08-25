# HANDOVER

Current status only. History lives in `.claude/log/`.
Scope: `/home/opc/nix`. `webUI/` and `my_wiki/` are self-contained — each has its own
CLAUDE.md, HANDOVER and rules. Do not manage either from here.

## Reality
Oracle Linux 9, aarch64. Nix, no NixOS. Every dir with a flake.nix is its own flake.
`nginx/` = the one system service (systemd, nginx:nginx). `webUI/` = static site, nginx
root IS that dir. `my_wiki/` = the wiki project — vault, its two server flakes, own .claude/. `pyt/` = python scratch.

## Ports
| port | what | exposure |
|---|---|---|
| 80/443 | nginx | public |
| 35908 | nginx, plain | public, /etc/nginx/prj/35908 |
| 35909 | silverbullet | **loopback only**, nginx fronts it |
| 8384 | syncthing GUI | **loopback only**, nginx fronts it |
| 22000 | syncthing sync | public, tcp + udp |
| 21027/udp | syncthing discovery | public |

firewall-cmd has 35909/35910 open from an older setup. Nothing binds them publicly.

## Domains
`ryuora144.duckdns.org` -> webUI. `/syncthing/` -> syncthing GUI.
`ryuora144sb.duckdns.org` -> silverbullet. Own cert, issued 2026-08-22, expires 11-20.
Both via `cd nginx && nix run --impure .#get_SSL -- <domain>` — stops nginx ~30s, the
standalone challenge needs port 80. certbot has its own renew task.

## nginx — the only config that matters
Master: `nginx/configs/nginx.conf`, `@name@` placeholders.
Values: `nginx/nginx-secrets.nix`. Deploy: `cd nginx && nix run --impure .#update_nginx_conf`.
`webUI/nginx.conf` is a stale near-copy. NOT the master.
nginx root is `webUI/`, not the repo root — so `webUI/CLAUDE.md` and `webUI/.claude/` are
public, while repo-root `.claude/`, `flake.nix`, `my_wiki/`, `nginx/` are not. Verified 404.
Pinned nixos-24.05 and uses `pkgs.substituteAll`. Do NOT modernise — substituteAll was
removed in 25.11, so a pin bump breaks the flake.
Syncthing block sends `proxy_set_header Host localhost`, not `$host`. Syncthing 403s any
Host it does not recognise while on loopback; the official docs snippet does not work here.

## Servers — no systemd, by choice
Nothing starts on boot. `nix run .#servers_init` at repo root does nginx + both, or:
```
cd my_wiki/servers/silverbullet && nohup nix run .#sb_start >~/sb.log 2>&1 &
cd my_wiki/servers/syncthing    && nohup nix run .#st_start >~/st.log 2>&1 &
```
Plain `&` without nohup dies at logout.

## Passwords
`sb_ps_update` — edit `~/.config/silverbullet/env` (`SB_USER=user:password`, mode 600),
then run it. Validates, kills the process on 35909, restarts, proves login. Bad file kills
nothing.
`st_ps_update` — hand-edit `<gui><user>`/`<password>` in
`~/.local/state/syncthing/config.xml`, plaintext is fine. Syncthing does NOT hash a
plaintext password on startup, it just fails auth — so the app blanks `<password>` first,
then runs `syncthing generate --gui-password=-`. Blanking is required: `generate` silently
skips the write if the plaintext equals what is already in the file. Already-hashed =
applied, not re-verified.
Both: password never in argv. Never `pkill -f <name>` — `-f` matches any shell merely
mentioning the string and will kill yours. Kill by port owner via `ss`.

## Traps that look like success
- SilverBullet `/` returns **200 with no login** — it serves the login shell openly.
  `/.fs/<page>` = 401 is the only proof auth is on. 200 there means the wiki is OPEN.
- SB `/.auth` returns **302 on failure too** (`/.auth?error=1`). Cookie + a real content
  fetch is the only honest check.
- **Adding an MCP server or a skill does not hot-load it.** Both load at session start.
  Invisible until `/exit` then `claude --continue`.

## Not done
- Nothing survives reboot. Cost of dropping systemd, accepted.
- `enable-linger opc` still set. Harmless, no user services left.
- Syncthing GUI "support bundle" link is absolute (`/rest/debug/support`), lands on webUI,
  404s. Only broken link under `/syncthing/`.

## Confirmed, don't touch
- nginx/ stays on 24.05 with substituteAll.
- `Host localhost` in the syncthing proxy block.
- No env file for syncthing's password — a bcrypt hash on disk beats a plaintext one.
- webUI/ and my_wiki/ are out of scope from here — each has its own HANDOVER.
- Pins: webUI + nginx on nixos-24.05 (webUI also has nixpkgs-unstable for yt-dlp ONLY);
  `my_wiki/servers/*` on nixos-25.11 alone — 24.05 ships silverbullet 0.7.7, wrong major,
  and syncthing 1.27.7, pre-SQLite-rewrite. Do not merge them.
