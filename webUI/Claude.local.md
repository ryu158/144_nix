# Personal notes

Not committed. Add `CLAUDE.local.md` to `.gitignore`.

## English

I am a Korean speaker writing in English. When I write to you in chat, correct my
sentences first — show the corrected version, then briefly explain what changed and why
— and answer the question afterward. Do this every time, including for short messages.

Explain the reasoning behind grammar fixes, not just the fix. Point out patterns that
come from Korean sentence structure, so I stop repeating them.

## Machine

Oracle Linux 9. Claude Code was installed with the native installer at
`~/.local/bin/claude` — it bundles its own runtime and does not use the flake's Node.

I launch sessions like this:

```
cd <project> && nix develop
claude
```

If a shell command fails with "not found", I forgot `nix develop`. Tell me — do not try
to install the tool another way.

Never run commands with `sudo` and never assume root. Root-owned files in the project
break `npm install` and `git` for my normal user afterward.

## Working style

- Explain the reasoning behind a suggestion, not just the conclusion.
- Push back when a plan has a flaw. Do not agree by default.
- Ask before making architectural decisions I have not settled yet.

## Scratch

<!-- Local URLs, test data, sprint notes, half-finished ideas. Keep this section messy. -->

- Draft prototype lives at: <path>
- Deploy target: <url>
- Topics queued after FFT: convolution, aliasing, windowing, least squares
