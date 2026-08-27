1. Answer short — essential only, cave-man. Write every `.md` here the same way.
2. LLM wiki. Notion = 0th raw inbox. Claude distills. Markdown = truth.

## Levels
1. Higher number = more processed.
2. 0th = inbox shadow. 1st = distilled. 2nd = contextualized. 3rd = synthesis.
3. Extend forever.

## Folders
1. 1st and up: `n/` = .md pages, `i/` = images, `r/` = everything else.
2. New level:

```
mkdir -p 4th/{n,i,r}
```

3. 0th is flat — one file, `0th/queue.md`, the ingest ledger. No `n/ i/ r/`, no index.

## Links
1. Same level: `![](../i/plot.png)`, `[data](../r/run.csv)`
2. Cross level: `[[2nd/n/topic]]` — full page path.

## Hard rules
1. Promote N -> N+1. Never edit a lower level in place.
2. Never write back to Notion. 0th is read-only.
3. Do not invent. If the source does not say it, it does not go in.
4. Trust the source text, not memory of it.
5. Never a `.md` outside `n/`. Exactly four exceptions: this file, `CONFIG.md`,
   `index.md`, `0th/queue.md`. No others.
6. `CONFIG.md` and `index.md` are SilverBullet's own, at the space root. `0th/queue.md`
   is the ledger, not a level.
7. One page = one idea, at 1st too.
8. A Notion page holding several ideas splits into a hub plus one child per idea.
9. A page holding one idea stays one file — no hub.
10. Split only when a `##` section is useful without the rest. Default is not to split.
11. Every promoted page names its source.

## Page shape
1. The `wiki-update` skill writes these and owns the detail.
2. Single file or hub — `{YYMMDD}_{keywords}.md`: title, #tags, then
   `{date} | {compression}% | {url}`, then a `>` line, then the body.
3. On a hub the `>` line lists the children instead of the headings.
4. Child — `{hub basename}__{idea}.md`: title, then `< [[1st/n/{hub}]]`, then the body.
5. A child has no tags, no url, no `%`. The hub owns those.
6. Compression = body chars / source chars.
7. On a hub it is every child body summed over the one source.
8. Never an average of the children — that hides a bloated child.
9. Above ~40% is a copy, not a distillation.
