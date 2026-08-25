# HANDOVER

Current status only. Not history — daily detail in .claude/log/.
Scope: /home/opc/nix as a whole. webUI/ has its own CLAUDE.md, HANDOVER and rules — that
project is self-contained, do not manage it from here.

## Reality
Oracle Linux 9, aarch64. Nix, no NixOS. Every dir with a flake.nix is its own flake.
`nginx/` = the one system service (systemd, runs as nginx:nginx).
`webUI/` = the static site. nginx root IS that dir.
`my_wiki/` = markdown wiki content. Gitignored except CLAUDE.md.
`my_wiki_servers/` = flakes for silverbullet + syncthing.
`pyt/` = python scratch. `log/work_plan/` = pre-work plans.

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
`ryuora144.duckdns.org` -> webUI site. `/syncthing/` -> syncthing GUI.
`ryuora144sb.duckdns.org` -> silverbullet. Separate cert, issued 2026-08-22, expires 11-20.
Both certs via `cd nginx && nix run --impure .#get_SSL -- <domain>`. That stops nginx for
~30s (standalone challenge needs port 80). certbot has its own renew task.

## nginx — the only config that matters
Master template: `nginx/configs/nginx.conf`, with `@name@` placeholders.
Values: `nginx/nginx-secrets.nix` (domain, web_root, sb_domain, sb_port, st_port, ports).
Deploy: `cd nginx && nix run --impure .#update_nginx_conf`.
`webUI/nginx.conf` is a stale near-copy. NOT the master. Ignore or delete it.
nginx root is `webUI/`, NOT the repo root. So `webUI/CLAUDE.md` and `webUI/.claude/` ARE
public (webUI documents this), while repo-root `.claude/`, `flake.nix`, `my_wiki/` and
`nginx/` are not reachable — verified 404.
nginx/ is pinned nixos-24.05 and still uses `pkgs.substituteAll`. Do not "modernise" it —
substituteAll was REMOVED in 25.11, so a pin bump breaks that flake.

Syncthing block sends `proxy_set_header Host localhost`, not `$host`. Syncthing 403s any
Host it does not recognise while bound to loopback. The official syncthing docs snippet
uses `$host` and does not work here.

## Servers — no systemd, by choice
Nothing starts on boot. Start by hand:
```
cd my_wiki_servers/silverbullet && nohup nix run .#sb_start >~/sb.log 2>&1 &
cd my_wiki_servers/syncthing    && nohup nix run .#st_start >~/st.log 2>&1 &
```
Or `nix run .#servers_init` at the repo root — does nginx + both.
Plain `&` without nohup dies at logout. Both password apps already use nohup.

## Passwords
`sb_ps_update` — you edit `~/.config/silverbullet/env` (`SB_USER=user:password`, mode 600),
then run it. It validates, kills the process holding 35909, restarts, and proves login is
on before reporting ok. A bad file kills nothing.
`st_ps_update` — no prompt. You hand-edit `<gui><user>`/`<password>` in
`~/.local/state/syncthing/config.xml` yourself, plaintext password is fine. Syncthing
does NOT auto-hash a plaintext password on startup — it just fails auth — so the app
kills the process, blanks `<password>` and runs `syncthing generate --gui-password=-`
to hash your plaintext in place (blanking first is required: `generate` silently
skips the write if the plaintext it's given already string-equals what's in the
file), then restarts and proves login works. Already-hashed password = applied but
not re-verified.
Both: password never in argv. Never `pkill -f <name>` — `-f` matches any shell that merely
mentions the string, and it will kill yours. Kill by port owner via `ss`.

## Two traps that look like success
- SilverBullet `/` returns **200 with no login** — it serves the login shell openly.
  `/.fs/<page>` = 401 is the only proof auth is on. A 200 there means the wiki is OPEN.
- SB `/.auth` returns **302 on failure too** (to `/.auth?error=1`). Cookie + a real content
  fetch is the only honest check.

## my_wiki
Space root for silverbullet. `<level>/n/` = .md pages, `/i/` = images, `/r/` = the rest.
Rules in `my_wiki/CLAUDE.md`. New level = `mkdir -p 4th/{n,i,r}`, nothing else.
SilverBullet owns two files at the space root: `CONFIG.md` and `.silverbullet.db.json`.
`SB_SHELL_BACKEND=off` — a page cannot run shell commands. Keep it off, the wiki is public.
SilverBullet cannot configure its attachment folder (upstream #884), so i/ and r/ are held
by discipline. A pasted image lands next to the page and gets moved by hand.

## Version pins
webUI + nginx: nixos-24.05. webUI also has nixpkgs-unstable for yt-dlp ONLY.
my_wiki_servers/*: nixos-25.11 alone — 24.05's silverbullet 0.7.7 is the wrong major and
its syncthing 1.27.7 predates the SQLite rewrite.
Do not merge these. Each flake pins what it needs.

## Not done
- Syncthing has no folder shared and no device paired. GUI -> add `/home/opc/nix/my_wiki`.
- Nothing survives reboot. Cost of dropping systemd, accepted.
- `enable-linger opc` still set. Harmless, no user services left.
- Syncthing GUI "support bundle" link is absolute (`/rest/debug/support`), lands on webUI,
  404s. Only broken link under /syncthing/.
- No Notion -> 1st ingest yet. That is a Claude job, run by hand, not a service.

## Confirmed, don't touch
- nginx/ stays on 24.05 with substituteAll.
- `Host localhost` in the syncthing proxy block.
- No env file for syncthing's password — a bcrypt hash on disk beats a plaintext one.
- webUI/ is out of scope from here.
