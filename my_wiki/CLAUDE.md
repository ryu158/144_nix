1. Write every `.md` here the same way I answer — see repo-root Communication Style.
2. LLM wiki project. Work inside `my_wiki/`. Never manage it from the repo root.

## Scope
1. Touch nothing outside `my_wiki/`. No read, no write, no list, no glance. Not to "check". Not for background. No exception.
2. Paths are written from the repo root. That is a path base, not permission.
3. Need an outside file? Ask first. Name the one file. Say why. Wait for yes.

## Layout
1. `my_wiki_vault/` — the SilverBullet space.
2. Vault has **its own rules** in `my_wiki_vault/CLAUDE.md`. Read it before touching any page.
3. Vault content is gitignored. Syncthing rewrites it constantly.
4. `my_wiki_vault/0th/queue.md` is the ledger. It lists every page and doc. Read it first, before any work on the vault.

## Two CLAUDE.md, on purpose
1. This one is private. The vault one is **served publicly by SilverBullet**.
2. Never merge them. Never copy rules between them.

## Ingest
1. Notion = 0th. Raw inbox. Read only. **Never write back.**
2. `update my_wiki` runs the `wiki-update` skill.
3. The skill owns the procedure. Never restate it here or in the ledger.

## Danger
1. Syncthing is paired with external devices.
2. Moving or renaming `my_wiki_vault/` while syncthing runs propagates deletions to that device.
3. Stop syncthing. Edit the path in `~/.local/state/syncthing/config.xml`. Restart.
4. Pins: 25.11 here, 24.05 in the rest of the repo. Never merge them.
