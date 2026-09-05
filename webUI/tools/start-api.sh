#!/usr/bin/env bash
#
# Start the webUI backend in a detached tmux session.
#
#   tools/start-api.sh          start, or restart if already running
#   tmux attach -t api          watch it live; detach with ctrl-b then d
#   tmux kill-session -t api    stop it
#
# Why tmux and not systemd: the user's call, 2026-09-05. A detached session
# survives closing VS Code and logging out, and you can attach to see the
# server's own output without going through a log daemon.
#
# It does NOT restart after a crash. If /api/ starts returning 502, check
# whether the session is still there before assuming nginx is at fault.
#
# Called by the @reboot crontab line, so every path here is absolute and
# nothing depends on the caller's PATH or working directory.

set -euo pipefail

SESSION=api

# The flake's launcher, through its out-link. Two reasons this is not `nix run .`:
#
#   1. `nix run .` does `cd "${self}"` - a store snapshot of git-TRACKED files.
#      nginx serves this repo directly, so that would put an uncommitted
#      api_interp.py edit live on the page and invisible to the API at once.
#      This launcher cd's to the working tree instead.
#   2. The out-link is a GC root. Without it the only thing holding the python
#      closure is the running process, and a nix-collect-garbage while the
#      server is stopped would delete the interpreter.
#
# Rebuild it after any flake.nix change:
#   cd ~/nix/webUI && nix build .#interp-api --out-link ~/.local/state/nix/interp-api
LAUNCHER=/home/opc/.local/state/nix/interp-api/bin/interp-api

TMUX=/usr/bin/tmux

if [ ! -x "$LAUNCHER" ]; then
  echo "start-api: $LAUNCHER is missing." >&2
  echo "Rebuild it:" >&2
  echo "  cd ~/nix/webUI && nix build .#interp-api --out-link ~/.local/state/nix/interp-api" >&2
  exit 1
fi

# Idempotent on purpose: this is both the start command and the restart command,
# and @reboot must not fail if something already claimed the name.
if "$TMUX" has-session -t "$SESSION" 2>/dev/null; then
  "$TMUX" kill-session -t "$SESSION"
fi

"$TMUX" new-session -d -s "$SESSION" "$LAUNCHER"

echo "start-api: session '$SESSION' started"
echo "  watch:   tmux attach -t $SESSION      (detach: ctrl-b then d)"
echo "  stop:    tmux kill-session -t $SESSION"
