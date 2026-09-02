"use strict";
/**
 * page.ts
 * Page controller for the Interpolate Calculator.
 * Owns grid/chart instantiation and wiring — nothing here belongs
 * in grid.ts / chart.ts / dual-chart.ts / interp_engine.ts.
 */
/**
 * "How to use this" panel. Its own IIFE with its own guard: the panel and the
 * calculator must not be able to break each other.
 *
 * <details> does the opening. This only adds what a floating panel needs -
 * dismiss on outside click, dismiss on Escape - plus the open event.
 */
(function () {
    const howTo = document.querySelector('details.how-to');
    if (!howTo)
        return;
    const summary = howTo.querySelector('summary');
    howTo.addEventListener('toggle', () => {
        // Pageviews cannot tell whether anyone actually reads the manual.
        // trackEvent no-ops until consent is granted, so no gating needed here.
        if (howTo.open && window.trackEvent) {
            window.trackEvent('howto_open', { slug: 'interpolation' });
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
    const genRangeBtn = document.getElementById('genRangeBtn');
    const xMinEl = document.querySelector('#outputXMin');
    const xMaxEl = document.querySelector('#outputXMax');
    const xIntervalEl = document.querySelector('#outputXInterval');
    // One guard for the whole page: the constructors below need real elements,
    // and a half-wired calculator is worse than an obvious warning.
    if (!inputHost || !outputHost || !chartHost || !genRangeBtn
        || !xMinEl || !xMaxEl || !xIntervalEl) {
        console.warn('[interpolate] calculator markup missing — page not wired');
        return;
    }
    // Narrowed aliases. The guard proves these exist, but a hoisted function
    // declaration cannot see that proof — a fresh const carries it in.
    const xMin = xMinEl, xMax = xMaxEl, xInterval = xIntervalEl;
    const grid = new GridTable(inputHost, {
        rows: 10,
        cols: 4,
        viewportHeight: '100%',
        viewportWidth: '100%',
        fixedColCount: true
    });
    const grid_2 = new GridTable(outputHost, {
        rows: 10,
        cols: 4,
        viewportHeight: '100%',
        viewportWidth: '100%',
        fixedColCount: true,
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
    function getQueryXs() {
        return grid_2.getData()
            .map(row => row[0])
            .filter(v => v !== '' && v !== undefined && v !== null)
            .map(Number)
            .filter(x => !Number.isNaN(x));
    }
    function getManualRangeXs() {
        return InterpEngine.generateRange(xMin.value, xMax.value, xInterval.value);
    }
    function interpolateAndPlotManual() {
        const inputData = grid.getData();
        const queryXs = getManualRangeXs();
        if (!queryXs.length) {
            plotBoth();
            return;
        }
        const outputTable = InterpEngine.buildOutputTable(inputData, queryXs);
        grid_2.setData(outputTable);
        plotBoth();
        if (window.trackEvent)
            window.trackEvent('interpolate_run', { query_count: queryXs.length });
    }
    genRangeBtn.addEventListener('click', interpolateAndPlotManual);
    function interpolateAndPlot() {
        const inputData = grid.getData();
        const queryXs = getQueryXs();
        if (!queryXs.length) {
            plotBoth();
            return;
        }
        const outputTable = InterpEngine.buildOutputTable(inputData, queryXs);
        grid_2.setData(outputTable);
        plotBoth();
    }
    grid.on('change', interpolateAndPlot);
    grid_2.on('change', plotBoth);
    /* ---------------- Demo data ---------------- */
    // Still holding the seeded demo, untouched by the visitor.
    let demoPristine = false;
    grid.on('change', () => { demoPristine = false; });
    function emptyGrid() {
        return Array.from({ length: 10 }, () => ['', '', '', '']);
    }
    function gridIsEmpty() {
        return grid.getData().every(row => row.every(cell => cell === ''));
    }
    // Capture phase, on the container: this runs before grid.ts's own paste
    // handler on the hidden input, which overwrites cell by cell and would
    // otherwise leave the demo's remaining rows mixed into the visitor's data.
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
        // The fetch is async. If the visitor already typed or pasted while it was
        // in flight, their data wins - seeding over it would be data loss.
        if (!gridIsEmpty())
            return;
        grid.setData(xs.map((x, i) => [String(x), String(ys?.[i] ?? ''), '', '']));
        demoPristine = true;
    })
        .catch(() => { });
})();
//# sourceMappingURL=page.js.map