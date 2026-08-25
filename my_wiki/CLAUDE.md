Answer short — essential only, 'cave man' style. Write every .md here the same way.

LLM wiki. Notion = 0th, raw inbox. Claude processes. Markdown = truth.

Levels
Number = processing level. Higher = more processed.
1st = distilled. 2nd = contextualized. 3rd = higher synthesis. Extend forever.

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
Every promoted page links back to its source page.
Never a .md outside n/. That keeps the page list clean.
Two exceptions, both SilverBullet's own and both at the space root: CONFIG.md and
index.md. Do not move them, do not copy the pattern.
One page = one idea.
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
