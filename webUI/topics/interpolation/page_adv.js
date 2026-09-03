"use strict";
/**
 * page_adv.ts
 * Page controller for the Advanced Interpolate Calculator.
 *
 * Display only, for now. It builds the grids and the chart and plots what you
 * paste — the interpolation itself belongs to the calculation service, which
 * does not exist yet. Nothing here calls InterpEngine: the advanced methods are
 * scipy's, and this page must not quietly fall back to the basic page's linear
 * math and pass it off as a cubic spline.
 */
/**
 * "How to use this" panel. Same behaviour as the basic page: <details> does the
 * opening, this only adds dismiss-on-outside-click, dismiss-on-Escape, and the
 * open event. Its own IIFE with its own guard.
 */
(function () {
    const howTo = document.querySelector('details.how-to');
    if (!howTo)
        return;
    const summary = howTo.querySelector('summary');
    howTo.addEventListener('toggle', () => {
        if (howTo.open && window.trackEvent) {
            window.trackEvent('howto_open', { slug: 'interpolation', level: 'advanced' });
        }
    });
    document.addEventListener('click', (e) => {
        if (howTo.open && !howTo.contains(e.target))
            howTo.open = false;
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && howTo.open) {
            howTo.open = false;
            if (summary)
                summary.focus();
        }
    });
})();
(function () {
    const inputHost = document.getElementById('gridContainer');
    const outputHost = document.getElementById('gridContainer_2');
    const chartHost = document.getElementById('chartContainer');
    if (!inputHost || !outputHost || !chartHost) {
        console.warn('[interpolate-adv] calculator markup missing — page not wired');
        return;
    }
    // No fixedColCount, unlike the basic page: this page takes x plus any number
    // of y series, so a wide paste grows the grid instead of alerting.
    const grid = new GridTable(inputHost, {
        rows: 10,
        cols: 4,
        viewportHeight: '100%',
        viewportWidth: '100%'
    });
    const grid_2 = new GridTable(outputHost, {
        rows: 10,
        cols: 4,
        viewportHeight: '100%',
        viewportWidth: '100%',
        readOnly: true
    });
    const chart = new DualSeriesChart(chartHost, {
        height: 'auto',
        xLabel: 'X (column A)',
        yLabel: 'Y',
        aspectRatio: 16 / 9,
        pointRadius: 2.5
    });
    function plotBoth() {
        chart.plotFromGridsIndexed(grid, grid_2);
    }
    grid.on('change', plotBoth);
    grid_2.on('change', plotBoth);
    /* ---------------- Demo data ---------------- */
    // Same seed as the basic page, and the same trap: grid.ts's paste overwrites
    // cell by cell without clearing, so a 2-row paste onto 50 seeded rows would
    // leave 48 demo rows mixed into the visitor's data.
    let demoPristine = false;
    grid.on('change', () => { demoPristine = false; });
    function emptyGrid() {
        return Array.from({ length: 10 }, () => ['', '', '', '']);
    }
    function gridIsEmpty() {
        return grid.getData().every(row => row.every(cell => cell === ''));
    }
    // Capture phase: this must run before grid.ts's own handler on the hidden input.
    inputHost.addEventListener('paste', () => {
        if (!demoPristine)
            return;
        demoPristine = false;
        grid.setData(emptyGrid());
    }, true);
    // spec.json owns the dataset - rules/topics.md: never hardcode one here.
    fetch('/topics/interpolation/spec.json')
        .then(r => r.json())
        .then(spec => {
        const xs = spec.dataset && spec.dataset.x;
        const ys = spec.dataset && spec.dataset.y;
        if (!xs || !xs.length)
            return;
        // The fetch is async. A visitor who pasted while it was in flight keeps
        // their data - seeding over it would be data loss.
        if (!gridIsEmpty())
            return;
        grid.setData(xs.map((x, i) => [String(x), String(ys?.[i] ?? ''), '', '']));
        demoPristine = true;
    })
        .catch(() => { });
})();
//# sourceMappingURL=page_adv.js.map