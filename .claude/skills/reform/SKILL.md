---
name: reform
description: Restructure a .md into house style, then audit every rule for essentiality and cut the dead ones. Use for "reform this md", "reform and trim", "restructure this file", "audit each bullet", "is every rule essential", "check term by term".
---

# Reform

Rebuild the file's shape. Then delete what earns nothing.

Standalone. Reads no other skill, no outside style file, no helper. Everything needed is here.

## 0. House style

This is the target style. 

1. As simple as possible.
2. Leave only essential.
3. Numbered lists over prose paragraphs.
4. Short sentences only — no compound or nested clauses.
5. Skip preamble, hedging, and pleasantries.
6. Code and commands in blocks, never inline in a sentence.
7. Caveman phrasing where it fits.

Override: if the repo defines its own style file, that wins. Read it and say which one
you used. Never merge the two silently.

## 1. Read and measure

1. Read the target end to end.
2. Note which style applies — section 0, or the repo's own if it has one.
3. Back it up, then measure. Never estimate — a file feels trimmed at 80%.

```
cp F "$SCRATCH/F.bak"
python3 - <<'PY'
import re
s=open('F').read()
fm=(re.match(r'---\n.*?\n---\n',s,re.S) or [''])[0]
code=''.join(re.findall(r'```.*?```',s,re.S))
print(f'total {len(s)} | fixed {len(fm)+len(code)} | prose {len(s)-len(fm)-len(code)}')
PY
```

4. Fixed = frontmatter, code blocks, commands, identifiers, IDs, URLs, exact strings.
   None of it can shrink.
5. Prose is the only thing you cut. Report both numbers.
6. "19% overall, 26% off the prose" is honest. "19%" alone is not.

## 2. Reform the shape

1. Prose paragraphs become numbered items.
2. Group items under `## Section` headers.
3. Numbering restarts at `1.` in each section.
4. One idea per item. Split any item holding two.
5. Apply section 0 to every item.
6. Shape only in this step. Change no meaning yet.

## 3. Audit every prose unit

1. Prose unit = one idea. One numbered item, or one paragraph before reform.
2. A unit may span several lines. Walk the unit, never the raw line.
3. Cut test: remove the unit. Does behavior change? No change means cut.
4. Sort every unit CUT / MERGE / KEEP. One reason each, one line each.

## 4. Cut rules

1. Redundant — another unit already says it.
2. Restates another file's job — a skill, a handover, a README.
3. Snapshot not rule — a count, a file list, a git state. It goes stale.
4. Discoverable — `ls`, `git status`, or the code answers it.
5. Named instance where a general rule already covers it. One general rule beats a list.
6. A list of forbidden things invites "not on the list, so allowed". Prefer the absolute.

## 5. Keep rules

1. Never trim danger. Data loss, destructive commands, irreversible steps stay whole.
2. Keep any guard that encodes a real past mistake. That is scar tissue, the costliest
   thing to relearn.
3. Keep every hard number, named source, exact command, identifier.
4. Keep the loophole-closers. A rule that exists because someone argued around the last one.
5. Never drop a claim to hit a size target. If the target needs a claim gone, the target
   is wrong.

## 6. Facts move, they do not die

1. A fact is not a rule. "Two files are tracked" is a fact. "Read the ledger first" is a rule.
2. Before cutting a fact, find where else it lives. Name that file and line.
3. Never delete a fact that lives nowhere else.

## 7. Propose, do not apply

1. Report the audit: CUT list, MERGE list, KEEP list. Reason per unit.
2. Name the weakest keeper and say why it survived.
3. Report line and char count, before and projected.
4. Wait for yes.

## 8. Ask: term by term?

1. Ask exactly: **"Check term by term manually?"**
2. Yes — walk one prose unit at a time. Take keep / cut / reword per unit. Wait after each.
3. No — apply the whole proposal in one shot.

## 9. Final self-review

The test is whole-content preservation, not per-unit tidiness.

1. Read the original and the finished file side by side. Both end to end.
2. Never judge from the diff. A diff shows what moved, not what survived.
3. List every distinct claim the original carried. For each, name where it lives now:
   kept as unit N, folded into unit N, moved to `HANDOVER.md`, or cut on purpose with reason.
4. Nothing may be unaccounted for. One orphan idea means the trim failed.
5. Meaning intact. No dropped `not` / `never` / `only`. No softened absolute.
6. Still one coherent document, not a pile of survivors.
7. Section order and headers still make sense after the cuts.
8. Style matches section 0, or the repo's own style file if one applied.
9. No new redundancy created by a merge.
10. Re-run the step 1 script on the result. Report the ratio, four numbers:

```
lines  110 -> 93
total  6635 -> 5529   83%
fixed  145  -> 145
prose  6490 -> 5384   83%
```

11. Ratio = new / old. Under 100% is a trim. Over 100% means the reform grew the file.
12. Growth is not a failure. Numbering and one-idea-per-item cost characters. Say so plainly.
13. Never cut a claim to push the ratio down. The ratio reports the work, it does not set it.
14. Name any other file pointing at a cut unit. It is now stale. Do not fix it unasked.
15. Found a problem? Say it. Never silently re-edit.
