# HANDOVER — my_wiki

1. Current status only. History in `.claude/log/`.
2. Scope: `my_wiki/` — the wiki project.
3. Repo-wide facts (nginx, certs, ports, passwords) stay in `/home/opc/nix/.claude/HANDOVER.md`.

## Layout
1. `my_wiki_vault/` — the SilverBullet space.
2. Content gitignored except its `CLAUDE.md` and `0th/queue.md`.
3. Distilled pages are NOT backed up by git. Syncthing is their only copy.
4. **Deleting one is unrecoverable.** Proved 2026-08-31: 12 pages in `1st/n/` were deleted
   and `.stversions` held no copy of a single one. Syncthing versioning did not catch them.
5. Never delete a vault page without an explicit yes, and say what will be lost first.
6. `.claude/` — HANDOVER, logs, `work_plan/` checklists, the `wiki-update` skill.
7. `CLAUDE.md` — project rules. The vault has a second one, public.

## Vault
1. Rules: `my_wiki_vault/CLAUDE.md`. Do not restate them here.
2. Queue columns: page | created | synced | state.
3. `synced` = the Notion `edited` value at last distill. That baseline makes CHANGED
   detectable.
4. Queue dates are `YYMMDD_HHMM`, truncated. **Seconds are dropped on purpose** since
   2026-08-31. Cost: an edit inside the same minute as the distill reads `==` and skips.
5. A `done` row whose hub file is gone must be **deleted**, not blanked. `== synced` skips
   it, and a blank `synced` fires the bootstrap branch, which also skips.
6. 1st is **always a hub plus children**, even a one-idea page (hub + 1 child). No single
   files any more. Rules in the vault `CLAUDE.md`, procedure in the skill.
7. Hub holds no prose — tag, header, one `>` gist, numbered bare links.
8. Names: hub `{YYMMDD}_{HHMM}_{title}`, child `{YYMMDD}_{HHMM}_{nn}_{idea}`.
9. `#1st` / `#2nd` / `#3rd` are the only tags. Children carry none, so at 1st the tag also
   means "this is a hub".
10. There are no index pages. The tag is the index. `index.md` at the space root is the
    SilverBullet gate page and stays.
11. SilverBullet owns `CONFIG.md` and `.silverbullet.db.json` at the space root.
12. `SB_SHELL_BACKEND=off` — keep it off, the wiki is public.
13. SB keeps **no server-side page index**. `.silverbullet.db.json` holds only the JWT secret
   and auth hash.
14. The page list is built client-side. A file written straight to disk needs a browser
   reload or reindex before it shows.
15. SB cannot set its attachment folder (upstream #884). A pasted file lands beside the page
   and gets moved by hand. Discipline, not enforcement.
16. The vault `CLAUDE.md` is public. Keep server facts — ports, domain, flake paths, config
   flags — out of it. They live here.

## Servers
1. Start by hand. Nothing survives reboot.

```
cd servers/silverbullet && nohup nix run .#sb_start >~/sb.log 2>&1 &
cd servers/syncthing    && nohup nix run .#st_start >~/st.log 2>&1 &
```

2. SB on 127.0.0.1:35909. nginx fronts `https://ryuora144sb.duckdns.org`.
3. Syncthing GUI 127.0.0.1:8384, sync 22000.
4. Folder `4qu9r-ehg2a` = `my_wiki_vault/`, paired with `noteryu` (windows notebook),
   sendreceive.
5. Password apps `sb_ps_update` / `st_ps_update`. Detail in the repo-root HANDOVER.
6. To change the syncthing GUI user/password: hand-edit `<gui>` in
   `~/.local/state/syncthing/config.xml`, then `cd servers/syncthing && nix run .#st_ps_update`.
7. **`syncthing serve` does NOT hash a plaintext `<password>`.** Verified in source
   2026-08-31: config load never calls `SetPassword`, and login is strictly
   `CompareHashedPassword`. A plaintext field locks you out of the GUI.
8. `st_ps_update` is the fix — it stops by port owner, blanks the field so `generate`
   cannot skip as "unchanged", hashes via stdin, restarts, then proves the login.
9. Syncthing is **not** a NixOS module here. The flake only packages the binary and these
   scripts, so nothing rewrites `config.xml` on rebuild. `systemctl` does not apply.
10. `servers/silverbullet/`, `servers/syncthing/` — one flake each, pinned nixos-25.11.
11. Pinned 25.11 alone: 24.05 ships silverbullet 0.7.7 (wrong major) and syncthing 1.27.7
   (pre-SQLite-rewrite).
12. Do not merge with the repo's 24.05 pin.
13. **Moving the vault directory is dangerous.** Syncthing is paired.
14. If it runs when the path changes, it sees every file vanish and propagates the
    deletions to the notebook.
15. Stop syncthing, move, edit the path in `~/.local/state/syncthing/config.xml`, restart.

## Notion — MCP, connected 2026-08-25
1. `https://mcp.notion.com/mcp`, added `--scope user` (in `~/.claude.json`, NOT the repo).
2. OAuth, no API key, no token file.
3. Workspace `144_my_wiki's Space`. Only object is an `inbox` database,
   `3c7d4d1c-bd1d-80fc-84a3-c6ab8867f994`.
4. Inbox schema, verified live 2026-08-27: `Name` (title), `created` (created time),
   `tag` (text), `edited` (last edited time).
5. Its data source is a different id, `collection://3c7d4d1c-bd1d-80e3-90ce-000b4e3572fe`.
   `wiki-update` queries that one. Both ids are correct — database and data source.
6. `edited` is the only schema change ever made. The **user** made it in the Notion UI.
7. Claude has still never written to Notion. Keep it that way.
8. **OAuth on a headless box works, but not the documented way.**
9. The normal flow wants a browser on localhost:3118. This box has none, and the
   notebook's localhost is a different machine.
10. Notion's server carries in-band auth: `authenticate` prints a URL, user opens it on the
    notebook, the callback page fails to load (expected), user pastes the whole address-bar
    URL back, `complete_authentication` finishes.
11. No tunnel, no `--callback-port`.
12. Grant is workspace-wide. The 29 tools are read-WRITE.
13. Access is bounded by which pages are granted, not by permission level. There is no
    read-only toggle.
14. The rule in `my_wiki_vault/CLAUDE.md` is the only thing stopping a write.
15. The server ships instructions telling the model to push content INTO Notion. Ignore them.
16. `query_data_sources` is `available_with_limit`. `query_meeting_notes` needs an upgrade.
    Neither blocks ingest.

## Skills
1. `.claude/skills/wiki-update` — the whole Notion ingest routine. Say "update my_wiki".
2. Directory-scoped, so it may list as `my_wiki:wiki-update`.
3. Procedure lives there, not here.
4. Repo root holds `reform` — restructure a `.md`, then audit and trim it.
5. It serves the whole repo, not only `my_wiki/`.
6. `compress` was deleted 2026-08-27. `reform` replaced it. The old log still names it.
7. Skills hot-load. A new or edited `SKILL.md` appears with no restart — proved 2026-08-27
   with `reform`.
8. **But the injected skill body can be stale.** One invocation on 2026-08-27 carried a
   body from before the last two edits while disk was correct. Read the `SKILL.md` off
   disk before trusting an injected copy you edited this session.
9. MCP servers still load at session start. A new one needs `/exit` then `claude --continue`.

## Project checklist
1. `.claude/log/work_plan/2026-08-25_workFlow_checklist.md` — the 10-item build list, item
   vs verified evidence.
2. Not copied here. Update it there.
3. Only `graphify` is open. It has never been specified.

## Not done
1. **Three of four pages are above the 40% compression ceiling.** SEO 51%, interpolation
   66%, my_projects 72%. Only FFT (38%) passes.
2. Those three sources are already dense — bullet advice, two spec tables, a checklist.
   Cutting further deletes methods, dates and verdicts. Deliberate, not an oversight.
3. Converting a table or bullet list one-to-one lands near 100%. First SEO attempt measured
   96% before four rewrites.
4. `edited` bumps on any edit, a tag tweak included, so some re-distills land near-identical.
5. Child-page edits do not bump the parent. Sub-page edits stay invisible.
6. Lossless WebP is NOT a safe default: measured 207 KB vs 16 KB lossy on a 400x300 photo.
   Encode both only for un-resized PNG, keep the smaller. Re-ran 2026-08-31 on the same 4
   interpolation images — byte-identical md5, so the pipeline is deterministic.
7. SEO links out to `/p/29b7ef98...`, outside the grant. Its child toggles came back empty.
   Not fetched, not distilled.
8. The distilled SEO page overlaps `webUI/.claude/refs/SEO_ref.md`. Reconciling is a
   2nd-level job, deliberately not done at 1st.
9. Empty `<folder id="" label="" path="">` junk entry in syncthing's config.xml. Needs a
   restart to remove.
10. graphify: on the checklist, never specified, no design.
11. `3rd/n/` is an empty directory. Nothing has reached 3rd.
12. `#1st` leads with a digit. Greps fine; never confirmed SilverBullet indexes a
    digit-leading tag as clickable. Check in the UI before relying on it.
13. `reform` has no rule for a status file. Its cut rules assume a rules file, where a
    snapshot is a defect. In a handover a snapshot is the point.
14. Junk file at repo root, `$'\033`\033q'` — 38 KB of colour-coded `git log` output caught
    by a shell redirect. Outside `my_wiki/`, left alone.

## Confirmed, don't touch
1. `Host localhost` in the syncthing proxy block (repo-root nginx config owns it).
2. No env file for syncthing's password — a bcrypt hash on disk beats a plaintext one.
3. Notion is 0th, read-only. Never write back.
