Answer short — essential only, cave-man. Write every .md here the same way.

LLM wiki project. Self-contained: work inside `my_wiki/`, do not manage it from the repo root.

Layout
`my_wiki_vault/` — the SilverBullet space. **Its own rules live in
`my_wiki_vault/CLAUDE.md`** — read that before touching any page. Content is gitignored
(syncthing rewrites it constantly); two files are carved out and tracked — that rules
file and `0th/queue.md`, the ledger git cannot rebuild.
`servers/silverbullet/`, `servers/syncthing/` — one flake each, pinned nixos-25.11.
`.claude/` — HANDOVER, logs, work plans, the `wiki-update` skill.

Two CLAUDE.md on purpose. This one is private project rules. The vault one is **served
publicly by SilverBullet**. Do not merge them, do not copy rules between them.

Ingest
Notion = 0th, raw inbox, read only. **Never write back.**
`update my_wiki` runs the `wiki-update` skill: Phase A reads metadata and rewrites
`my_wiki_vault/0th/queue.md`, Phase B fetches only what A flagged and distills to `1st/n/`.
The skill owns the procedure. Do not restate it here or in the ledger.

Danger
Syncthing is paired with the notebook. Moving or renaming `my_wiki_vault/` while syncthing
runs makes it propagate deletions to that device. Stop it first, edit the path in
`~/.local/state/syncthing/config.xml`, then restart.

Pins are 25.11 here and 24.05 in the rest of the repo. Do not merge them.
