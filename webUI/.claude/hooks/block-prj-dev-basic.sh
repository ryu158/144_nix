#!/usr/bin/env bash
f=$(jq -r '.tool_input.file_path // empty')
case "$f" in
  */prj/dev_basic/*)
    jq -n '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: "prj/dev_basic is a stale duplicate — edit the root dev_basic/ instead (see CLAUDE.md)."}}'
    ;;
esac
