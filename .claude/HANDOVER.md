# HANDOVER

1. Current status only. History lives in `.claude/log/`.
2. Scope: `/home/opc/nix`.
3. `webUI/` and `my_wiki/` are self-contained. Each has its own CLAUDE.md, HANDOVER and rules.
4. Do not manage either from here.

## Reality
1. Oracle Linux 9, aarch64.
2. Nix, no NixOS. Every dir with a `flake.nix` is its own flake.
3. `nginx/` = the one system service (systemd, nginx:nginx).
4. `webUI/` = static site. nginx root IS that dir.
5. `my_wiki/` = the wiki project — vault, its two server flakes, own `.claude/`.
6. `pyt/` = python scratch.

## Ports
| port | what | exposure |
|---|---|---|
| 80/443 | nginx | public |
| 35908 | nginx, plain | public, /etc/nginx/prj/35908 |
| 35909 | silverbullet | **loopback only**, nginx fronts it |
| 8384 | syncthing GUI | **loopback only**, nginx fronts it |
| 22000 | syncthing sync | public, tcp + udp |
| 21027/udp | syncthing discovery | public |

1. firewall-cmd has 35909/35910 open from an older setup. Nothing binds them publicly.

## Domains
1. `ryuora144.duckdns.org` -> webUI. `/syncthing/` -> syncthing GUI.
2. `ryuora144sb.duckdns.org` -> silverbullet.
3. Own cert, issued 2026-08-22, expires 11-20.
4. Issue either with:

```
cd nginx && nix run --impure .#get_SSL -- <domain>
```

5. That stops nginx ~30s. The standalone challenge needs port 80.
6. certbot has its own renew task.

## nginx — the only config that matters
1. Master: `nginx/configs/nginx.conf`, `@name@` placeholders.
2. Values: `nginx/nginx-secrets.nix`.
3. Deploy with:

```
cd nginx && nix run --impure .#update_nginx_conf
```

4. `webUI/nginx.conf` is a stale near-copy. NOT the master.
5. nginx root is `webUI/`, not the repo root.
6. So `webUI/CLAUDE.md` and `webUI/.claude/` are public. Repo-root `.claude/`, `flake.nix`,
   `my_wiki/`, `nginx/` are not. Verified 404.
7. Pinned nixos-24.05 and uses `pkgs.substituteAll`.
8. Do NOT modernise. substituteAll was removed in 25.11, so a pin bump breaks the flake.
9. Syncthing block sends `proxy_set_header Host localhost`, not `$host`.
10. Syncthing 403s any Host it does not recognise while on loopback. The official docs
    snippet does not work here.

## Servers — no systemd, by choice
1. Nothing starts on boot. Cost of dropping systemd, accepted.
2. Start everything from the repo root:

```
nix run .#servers_init
```

3. Or by hand:

```
cd my_wiki/servers/silverbullet && nohup nix run .#sb_start >~/sb.log 2>&1 &
cd my_wiki/servers/syncthing    && nohup nix run .#st_start >~/st.log 2>&1 &
```

4. Plain `&` without nohup dies at logout.

## Passwords
1. `sb_ps_update` — edit `~/.config/silverbullet/env` (`SB_USER=user:password`, mode 600),
   then run it.
2. It validates, kills the process on 35909, restarts, proves login. A bad file kills nothing.
3. `st_ps_update` — hand-edit `<gui><user>`/`<password>` in
   `~/.local/state/syncthing/config.xml`. Plaintext is fine.
4. Syncthing does NOT hash a plaintext password on startup. It just fails auth.
5. So the app blanks `<password>` first, then runs `syncthing generate --gui-password=-`.
6. Blanking is required: `generate` silently skips the write if the plaintext equals what is
   already in the file.
7. Already-hashed = applied, not re-verified.
8. Both: password never in argv.
9. Never `pkill -f <name>` — `-f` matches any shell merely mentioning the string and will
   kill yours. Kill by port owner via `ss`.

## Traps that look like success
1. SilverBullet `/` returns **200 with no login**. It serves the login shell openly.
2. `/.fs/<page>` = 401 is the only proof auth is on. 200 there means the wiki is OPEN.
3. SB `/.auth` returns **302 on failure too** (`/.auth?error=1`). Cookie plus a real content
   fetch is the only honest check.
4. Adding an **MCP server** does not hot-load it. It loads at session start. Invisible
   until `/exit` then `claude --continue`.
5. A **skill** does hot-load — proved 2026-08-27 with `reform`, four times, no restart.
   The 08-25 log says otherwise. That was wrong.
6. **But the injected skill body can be stale.** One invocation carried a body from before
   the last two edits while disk was correct. Read the `SKILL.md` off disk before trusting
   an injected copy you edited this session.

## Skills
1. `.claude/skills/reform/` — restructure a `.md` into house style, then audit and trim it.
   Repo-wide.
2. `compress` deleted 2026-08-27. `reform` replaced it and carries its measurement inline.
3. `caveman` plugin installed at user scope, `JuliusBrussee/caveman`. Its two hooks and five
   of its skills are `node` scripts. **There is no `node` on this box**, so those fail.

## Not done
1. `enable-linger opc` still set. Harmless, no user services left.
2. Syncthing GUI "support bundle" link is absolute (`/rest/debug/support`), lands on webUI,
   404s. Only broken link under `/syncthing/`.

## Confirmed, don't touch
1. No env file for syncthing's password — a bcrypt hash on disk beats a plaintext one.
2. Pins: webUI + nginx on nixos-24.05. webUI also has nixpkgs-unstable for yt-dlp ONLY.
3. `my_wiki/servers/*` on nixos-25.11 alone — 24.05 ships silverbullet 0.7.7, wrong major,
   and syncthing 1.27.7, pre-SQLite-rewrite.
4. Do not merge them.
