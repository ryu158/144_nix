1. style.css apply fail
 a. it can be found in index.html
 b. it can be seen in browser dev tools as source
 c. script.js applied well
 -> nginx.conf -> root directory or index file setting (index.html -> /index.html)


 260708
 Bug log — grid/chart build:

css not load. link tag fail. fix: css inline in html.
click no work. header divs cover whole grid (full-size transparent layer, high z-index). fix: pointer-events none on header container, auto on header cell only.
scroll break past ~20 rows, big blank space. cause: sticky "canvas" sized to full content height not viewport. fix: set canvas width/height = scrollEl.clientWidth/clientHeight in js, not css 100%.
want select whole row/col + select all. add: mousedown+mouseenter on header cells, corner cell = select all, ctrl+a.
want multi-row/col context menu. add: detect if right-click target inside existing multi-selection, act on whole range not just one.
fixed width option not applying. cause: gave user code snippet but never actually wrote it into index.html file. fix: applied edit for real.
percent width/height not working, grid shows all rows no scroll. cause: css % height needs every ancestor to have explicit height, body/container had none → resolves to auto. fix: use vh for height (no ancestor needed), % fine for width.
layout heavy again + no scrollbar after adding flex page layout. cause: grid root height was never set (only width was), so root grew to fit all content, virtualizer thought everything visible. fix: mirror height onto root same as width. bonus: throttled chart's mousemove redraw via rAF, was redrawing full canvas every pixel of mouse movement.

Pattern across most bugs: something (css link, height mirror, actual file edit) got skipped in one layer while working in another — always check the full render chain (css load → pointer-events → sizing → percent/ancestor chain), not just the JS logic.
