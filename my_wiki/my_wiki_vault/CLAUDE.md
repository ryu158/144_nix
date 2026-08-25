Answer short — essential only, cave-man. Write every .md here the same way.

LLM wiki. Notion = 0th raw inbox. Claude distills. Markdown = truth.

Levels
Higher number = more processed. 0th = inbox shadow. 1st = distilled.
2nd = contextualized. 3rd = synthesis. Extend forever.

Folders
1st and up: `n/` = .md pages, `i/` = images, `r/` = everything else.
New level = `mkdir -p 4th/{n,i,r}`.
0th is flat — one file, `0th/queue.md`, the ingest ledger. No n/ i/ r/, no index.

Links
Same level: ![](../i/plot.png), [data](../r/run.csv)
Cross level: [[2nd/n/topic]] — full page path.

HARD RULES
Promote N -> N+1. Never edit a lower level in place.
Never write back to Notion. 0th is read-only.
Do not invent. If the source does not say it, it does not go in. Trust the source
text, not memory of it.
Never a .md outside n/. Four exceptions: this file, CONFIG.md and index.md (space root,
the last two SilverBullet's own), and 0th/queue.md (ledger, not a level). No others.
1st mirrors Notion 1:1 — one Notion page, one file. Sub-topics become #tags, never
extra files. `one page = one idea` starts at 2nd; that is where splitting is the work.
Every promoted page names its source.

1st page shape. The `wiki-update` skill writes these and owns the detail:
`{created date}_{keywords}.md` — title, #tags, then `{date} | {compression}% | {url}`,
then a `>` contents line, then the body. Compression = body chars / source chars;
above ~40% is a copy, not a distillation.

Server
SilverBullet serves this folder on 127.0.0.1:35909, nginx fronts
https://ryuora144sb.duckdns.org. `SB_SHELL_BACKEND=off` — a page cannot run anything.
Syncthing syncs the tree to other devices. Flakes in ../servers/.
Content gitignored; this file is not.
SB cannot set its attachment folder (upstream #884) — pasted files land beside the page
and get moved by hand. Discipline, not enforcement.
