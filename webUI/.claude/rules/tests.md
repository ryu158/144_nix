---
paths:
  - "tests/**/*"
---

# Playwright suite rules

Break these and tests fail for the wrong reason.

1. page.ts keeps grid and chart private. Tests drive the UI — paste/copy events, DOM cells — never internals. Keep it that way.
2. Stub third parties with `route.fulfill`, never `abort`. Both pages call `kofiWidgetOverlay.draw(...)` inline, and an aborted script leaves that throwing.
3. Assertions read spec.json. Never copy a string from the HTML into a test — that is what the drift check exists to catch.
4. The grid is virtualized, so off-screen rows have no DOM node. Read bulk data with `copyFromGrid`, not cell locators.
5. `.hover()` on an element the pointer already sits on fires no new `mouseenter`. Move the mouse away first, or a hover test asserts nothing.
