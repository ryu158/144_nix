---
name: compress
description: Cut a file to its essentials without breaking it. Use for "compress this", "too verbose", "make it shorter", "tighten this", "distill this file", "maximize compression".
---

# Compress

Cave-man. Essential only. The file must still do its job afterwards.

## 1. Measure first

Never estimate — a file feels distilled at 64%. Copy the original, then measure:

```
cp F /tmp/.../F.bak
python3 -c "
o=len(open('/tmp/.../F.bak').read()); n=len(open('F').read())
print(f'{o} -> {n}, {round(100*n/o)}%')"
```

## 2. Split fixed from compressible

A whole-file percentage lies when part of the file cannot shrink. Fixed: code, commands,
identifiers, IDs, URLs, frontmatter, API names, exact strings something greps for.
Everything else is prose, and prose is the only thing you are cutting.

```
python3 - <<'PY'
import re
s=open('F').read()
fm=(re.match(r'---\n.*?\n---\n',s,re.S) or [''])[0]
code=''.join(re.findall(r'```.*?```',s,re.S))
print(f'total {len(s)} | fixed {len(fm)+len(code)} | prose {len(s)-len(fm)-len(code)}')
PY
```

Report both numbers. "66% overall, 45% off the prose" is honest; "66%" alone is not.

## 3. Cut

Go: filler, restatement, rationale that changes no decision, section-by-section
paraphrase, hedging, transitions, anything the reader can recover from a link.

Stay: every hard number, named source, exact command, identifier. Any guard that encodes
a mistake actually made — those sentences are the file's scar tissue and cost the most to
relearn. One line of "do not X, it broke last time" outweighs a paragraph of theory.

Never drop a claim to hit a number. If the target needs a claim gone, the target is wrong.

Prose distilled from a source: **under ~40%**, or it is a copy, not a distillation.
Instruction and config files: judge on prose only, and function beats any percentage.

## 4. Prove it still works

Compression is also an audit — cutting forces you to read every line, which is when stale
content surfaces. Expect to find at least one thing that was already broken.

- Run every command the file contains. They must pass against the real tree, not in theory.
- Resolve every link and path it names.
- If it is a skill or config, re-read it cold and ask whether it is still executable by
  someone who was not here.
- `diff` against the backup and read what left. Anything surprising goes back.

Report: before -> after, both percentages, what was cut, and anything the pass uncovered.
