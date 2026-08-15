# Setup

Where each file goes, and what to do before the first session.

## Placement

```
<project>/
├── CLAUDE.md                          # committed
├── CLAUDE.local.md                    # gitignored — personal
├── flake.nix                          # committed
├── flake.lock                         # committed (generated on first `nix develop`)
├── .envrc                             # committed
├── .gitignore                         # committed
└── .claude/
    ├── rules/
    │   ├── topics.md                  # committed — loads inside topics/
    │   └── kit.md                     # committed — loads inside src/kit/, src/shell/
    └── skills/
        └── new-topic/SKILL.md         # committed — loads when starting a topic
```

Delete this file once you have read it. It is not part of the project.

## Why the files are split

`CLAUDE.md` loads into context at the start of every session, and adherence drops as it
grows past roughly 200 lines. So only always-true facts live there.

The `.claude/rules/` files carry `paths:` frontmatter and load only when a matching file
is opened — topic rules stay out of context while you work on the shell, and vice versa.

The skill loads only when the task matches its description, so the per-topic checklist
costs nothing during unrelated work.

## First run

```bash
cd <project>

# 1. Enable flakes if not already (skip if using the Determinate installer)
mkdir -p ~/.config/nix
echo 'experimental-features = nix-command flakes' >> ~/.config/nix/nix.conf

# 2. Build the shell — this generates flake.lock. Commit it.
nix develop

# 3. Optional but recommended: auto-enter the shell on cd
#    (install direnv first, then)
direnv allow

# 4. Confirm Claude Code is reachable from inside the shell
which claude          # expect ~/.local/bin/claude
claude doctor         # expect install type: native

# 5. Start a session
claude
```

## Before the first real session

- [ ] Replace the **Stack** section of `CLAUDE.md` with your actual framework and the
      real scripts from `package.json`. The Astro assumption is a placeholder.
- [ ] Fill in the **Scratch** section of `CLAUDE.local.md`.
- [ ] Run `/context` inside a session and confirm `CLAUDE.md` and `CLAUDE.local.md`
      appear under **Memory files**. If they do not, Claude cannot see them.
- [ ] If the project already has code, run `/init` — with a `CLAUDE.md` present it
      proposes improvements from your real codebase instead of overwriting.

## Maintaining these files

Add a rule when you correct Claude about the same project fact twice. Remove any older
rule the new one contradicts — conflicting instructions are worse than missing ones,
because Claude may pick either.

Do not add rules after one frustrating session. That is how these files fill up with
exceptions that no longer apply.
