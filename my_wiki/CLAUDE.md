Answer short — essential only, 'cave man' style. Write every .md here the same way.

LLM wiki. Notion = 0th, raw inbox. Claude processes. Markdown = truth.

Levels
Number = processing level. Higher = more processed.
0th = raw inbox shadow. 1st = distilled. 2nd = contextualized. 3rd = higher
synthesis. Extend forever.

0th holds no content. Notion is still the raw source. 0th/n/queue.md is the ingest
ledger: what Notion holds, what is distilled, what changed. Phase A rewrites it
from Notion metadata. Phase B distills only what it flagged.

Folders
<level>/n/ = .md only. These are the pages.
<level>/i/ = images.
<level>/r/ = everything else (pdf, csv, zip, audio).
New level = `mkdir -p 4th/{n,i,r}`. Nothing else changes.

Links
Same level: ![](../i/plot.png), [data](../r/run.csv)
Cross level: [[2nd/n/topic]] — full page path.

HARD RULES
Promote N -> N+1. Never edit a lower level in place.
Never write back to Notion. 0th is read-only. Markdown is truth.
Every promoted page links back to its source page.
A 1st page names its Notion source on one line, so the wiki is its own ledger:
`{created date} | {compression}% | {notion url}`
No keys. Position carries meaning. Never repeat the page id — the url holds it.
Then a contents line: every `##` heading, ` · ` separated, in a `>` blockquote.
Cut each entry at its em-dash gloss. Navigation, not body — does not count as body.
Compression = distilled body chars / source chars. Above ~40% is a copy, not a
distillation. Measure it, never estimate.
Never a .md outside n/. That keeps the page list clean.
Two exceptions, both SilverBullet's own and both at the space root: CONFIG.md and
index.md. Do not move them, do not copy the pattern.
1st mirrors Notion 1:1. One Notion page -> one .md file. Sub-topics become #tags
in that file, never extra files.
Name a 1st page `{created date}_{keywords}` — created date from Notion, not today.
Tags = Notion's own tag property + one per sub-topic you would have split out.
One page = one idea applies from 2nd up. That is where splitting is the work.
Do not invent. If the source does not say it, it does not go in.
Trust the source text, not memory of it.

Attachments
SilverBullet cannot configure the attachment folder (upstream #884). Pasted files land
next to the page. Claude puts new files in i/ or r/ when writing; a pasted one is moved
by hand. Discipline, not enforcement.

Server
SilverBullet serves this folder. Shell commands are off (SB_SHELL_BACKEND=off) - a page
cannot run anything on the box. 127.0.0.1:35909, nginx fronts it at
https://ryuora144sb.duckdns.org. Syncthing syncs the tree to other devices.
Flakes in ../my_wiki_servers/. Content here is gitignored; this file is not.
