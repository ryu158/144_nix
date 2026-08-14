---
name: component-summary
description: Write or update the summary doc for a dev_basic/*.js component after adding or changing it. Use after editing chart.js, dual-chart.js, grid.js, ads.js, bmc.js, style.css, or adding a new shared component under dev_basic/.
---

Maintain `dev_basic/summary/<component>.md` for the component you just added
or changed, matching the format already used by `chart.md`, `dual-chart.md`,
`grid.md`, and `style.md`:

1. Read the existing summary (if any) and the current component source.
2. Read `dev_basic/summary/dual-chart.md` as the format reference:
   - `# <file>.js — Summary` header.
   - One-line bolded description of the main export (class or object), noting
     what it extends/wraps and why, if relevant.
   - Numbered list of methods in the order they're defined in the source —
     one line each, describing behavior, not restating the method name.
   - If the file also exports standalone helper functions, list them after
     the methods under a `**Standalone helper functions:**` subheading,
     continuing the numbering.
3. Write the updated summary to `dev_basic/summary/<component>.md`,
   overwriting stale entries rather than appending.
4. Keep descriptions behavioral (what it does, what it overrides, why),
   not just a method-name restatement.
