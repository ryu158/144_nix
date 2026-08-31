1. Answer short — essential only, cave-man. Write every `.md` here the same way.
2. LLM wiki. Notion = 0th raw inbox. Claude distills. Markdown = truth.

## Levels
1. Higher number = more processed.
2. 0th = inbox shadow. 1st = distilled. 2nd = contextualized. 3rd = synthesis.
3. Extend forever.
4. Each level tags its pages with its own name — `#1st`, `#2nd`, `#3rd`.
5. There are no index pages. The tag is the index.

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

## Body style
1. As simple as possible.
2. Leave only essential.
3. Numbered lists over prose paragraphs.
4. Short sentences only — no compound or nested clauses.
5. One list item holds one sentence.
6. Skip preamble, hedging, and pleasantries.
7. Code and commands in blocks, never inline in a sentence.
8. Caveman phrasing where it fits.
9. No tables in a content page. A table becomes a numbered list, one item per row.
10. Two files keep tables: `0th/queue.md` and `index.md`. Ledger and gate page, not prose.

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
8. Every Notion page becomes a hub plus children. No exceptions.
9. A one-idea page is a hub plus exactly one child.
10. Split only when a `##` section is useful without the rest.
11. Every promoted page names its source.
12. Deleting a page here is unrecoverable. Git ignores the vault. Syncthing keeps no version.

## Page shape
1. The `wiki-update` skill writes these and owns the detail.
2. Hub — `{YYMMDD}_{HHMM}_{title}.md`: title, then `#1st`, then
   `{YYMMDD}_{HHMM} | {compression}% | {url}`, then a `>` line, then the numbered child links.
3. The hub holds no prose. Marker, header, gist, links, nothing else.
4. Child — `{YYMMDD}_{HHMM}_{nn}_{idea}.md`: title, then `< [[1st/n/{hub}]]`, then the body.
5. `nn` is two digits and equals the child's position in the hub list.
6. The child title never repeats the hub title. `# Rader`, not `# FFT — Rader`.
7. A child has no url, no `%`, no gist line. The hub owns those.
8. **Level tags are the only tags.** `#1st` on a hub, `#2nd` on 2nd, `#3rd` on 3rd.
9. Structural, not topical. They name the level, never the topic.
10. A child carries no tag, so at 1st the tag also means "this is a hub".
11. **No other tag. Anywhere.** The child filenames are the keywords.
12. A sub-topic worth naming becomes a child. One not worth a child is cut.
13. Cross-page connection is 2nd's job, not 1st's.
14. Compression = every child body summed / source chars.
15. Hub header and hub gist do not count. They are not body.
16. Never an average of the children — that hides a bloated child.
17. Above ~40% is a copy, not a distillation.
