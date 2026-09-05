"use strict";
/**
 * The "How to use this" panel, shared by every calculator page.
 *
 * Extracted from page.ts on 2026-09-03, when the advanced page became the
 * second user (CLAUDE.md: extract on second use).
 *
 * <details> still does the opening, so the manual is in the HTML before any
 * script runs and keyboard users get Tab + Enter for free. This adds only what
 * a floating panel needs:
 *
 *   hover in    -> opens          (pointer devices only)
 *   hover out   -> closes
 *   click       -> pins it open
 *   Escape, or a click outside -> closes and unpins
 *
 * Hover is gated behind (hover: hover) and (pointer: fine). A touch device
 * reports neither, and without that gate the manual would be unreachable on a
 * phone - there is no hovering there, only the click <details> already handles.
 */
(function () {
    const howTo = document.querySelector('details.how-to');
    if (!howTo)
        return;
    const summary = howTo.querySelector('summary');
    // Opened by a click, so leaving with the pointer must not close it.
    let pinned = false;
    let openTimer = 0;
    let closeTimer = 0;
    // Brushing past the summary on the way somewhere else should not throw a
    // panel over the grids; leaving briefly should not snatch it away mid-read.
    const OPEN_DELAY = 120;
    const CLOSE_DELAY = 220;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    // The panel names its own topic, the way the seo.js tag does. The component
    // is shared, so it cannot know which topic it is on.
    const slug = howTo.dataset.slug || '';
    const level = howTo.dataset.level || '';
    // Hover would fire this on every pass of the mouse. One per page load is the
    // honest signal: it says the manual was opened, not how twitchy the pointer is.
    let reported = false;
    howTo.addEventListener('toggle', () => {
        if (!howTo.open || reported)
            return;
        reported = true;
        // trackEvent no-ops until consent is granted, so no gating needed here.
        if (window.trackEvent)
            window.trackEvent('howto_open', { slug, level });
    });
    function clearTimers() {
        window.clearTimeout(openTimer);
        window.clearTimeout(closeTimer);
    }
    function close() {
        clearTimers();
        pinned = false;
        howTo.open = false;
    }
    if (canHover) {
        howTo.addEventListener('mouseenter', () => {
            clearTimers();
            if (howTo.open)
                return;
            openTimer = window.setTimeout(() => { howTo.open = true; }, OPEN_DELAY);
        });
        howTo.addEventListener('mouseleave', () => {
            clearTimers();
            if (pinned)
                return;
            closeTimer = window.setTimeout(() => { howTo.open = false; }, CLOSE_DELAY);
        });
        // Without this, clicking a panel the hover already opened would toggle it
        // shut - the one gesture a visitor uses to say "keep this open".
        summary?.addEventListener('click', e => {
            clearTimers();
            if (howTo.open && !pinned) {
                e.preventDefault();
                pinned = true;
                return;
            }
            // Opening by click pins straight away; closing by click unpins.
            pinned = !howTo.open;
        });
    }
    document.addEventListener('click', e => {
        if (howTo.open && !howTo.contains(e.target))
            close();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && howTo.open) {
            close();
            if (summary)
                summary.focus();
        }
    });
})();
//# sourceMappingURL=how-to.js.map