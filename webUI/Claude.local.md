# CLAUDE.local.md
Personal, uncommitted notes. Add this file to `.gitignore`.

## English
I am a Korean speaker writing in English.
For **every chat message**, before answering:

1. Show my corrected English.
2. Briefly explain what changed and why.
3. Point out Korean-structure patterns when relevant.
4. Then answer my actual question.
Do this even for short messages.

## Machine
* Oracle Linux 9.
* Claude Code: `~/.local/bin/claude` via native installer.
* Claude's runtime is independent of the flake's Node.
* Start sessions with:

```bash
cd <project> && nix develop
claude
```
If a command is `not found`:
* Assume `nix develop` was not entered.
* Tell me to enter the dev shell.
* **Do not install the missing tool.**

Never use `sudo`.
Never assume root.
Do not create root-owned project files.

## Working Style
* Explain reasoning, not just conclusions.
* Challenge flawed plans; do not agree automatically.
* Ask before making unsettled architectural decisions.
* Prefer the smallest solution consistent with project rules.

## Scratch
Keep this section local and messy.

* Prototype: `<path>`
* Deploy: `<url>`
* Queue: convolution, aliasing, windowing, least squares