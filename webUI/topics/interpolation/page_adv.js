"use strict";
/**
 * page_adv.ts
 * Page controller for the Advanced Interpolate Calculator.
 *
 * Unlike page.ts, this page computes nothing itself. It posts the table to
 * /api/interpolation/<method> and renders what comes back. Nothing here calls
 * InterpEngine on purpose: the advanced methods are scipy's, and falling back
 * to the basic page's linear math while the select reads "cubic spline" would
 * be a lie told by the page.
 */
(function () {
    const inputHost = document.getElementById('gridContainer');
    const outputHost = document.getElementById('gridContainer_2');
    const chartHost = document.getElementById('chartContainer');
    const runBtn = document.querySelector('#genRangeBtn');
    const statusEl = document.querySelector('#status');
    const methodEl = document.querySelector('#methodSelect');
    const xMinEl = document.querySelector('#outputXMin');
    const xMaxEl = document.querySelector('#outputXMax');
    const xIntervalEl = document.querySelector('#outputXInterval');
    if (!inputHost || !outputHost || !chartHost || !runBtn || !statusEl
        || !methodEl || !xMinEl || !xMaxEl || !xIntervalEl) {
        console.warn('[interpolate-adv] calculator markup missing — page not wired');
        return;
    }
    // Narrowed aliases: the guard proves these exist, but a hoisted function
    // declaration cannot see that proof.
    const status = statusEl, method = methodEl;
    const xMin = xMinEl, xMax = xMaxEl, xInterval = xIntervalEl;
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
    grid_2.on('change', plotBoth);
    /* ---------------- Calculation, over HTTP ---------------- */
    function setStatus(text) {
        status.textContent = text;
    }
    async function run() {
        // Disabled while a request is in flight: a second click would fire a
        // second request and the answers could land out of order.
        runBtn.disabled = true;
        setStatus('computing…');
        try {
            const res = await fetch(`/api/interpolation/${method.value}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: grid.getData(),
                    rangeMin: xMin.value,
                    rangeMax: xMax.value,
                    interval: xInterval.value
                })
            });
            // The server answers a bad request with {"error": "..."} and a 4xx.
            // Anything else means it is down or nginx has no /api/ route, and the
            // body will not be JSON - hence the catch around parsing.
            let payload = null;
            try {
                payload = await res.json();
            }
            catch {
                setStatus(`calculation service unavailable (HTTP ${res.status})`);
                return;
            }
            if (!res.ok) {
                const message = payload?.error || `HTTP ${res.status}`;
                setStatus(`error: ${message}`);
                return;
            }
            const rows = payload;
            grid_2.setData(rows);
            plotBoth();
            setStatus(`${rows.length} rows, ${method.value}`);
            if (window.trackEvent) {
                window.trackEvent('interpolate_run', { level: 'advanced', method: method.value, query_count: rows.length });
            }
        }
        catch {
            // fetch itself rejected: offline, DNS, TLS, connection refused.
            setStatus('calculation service unreachable');
        }
        finally {
            runBtn.disabled = false;
        }
    }
    runBtn.addEventListener('click', run);
    /* ---------------- Import / export ---------------- */
    // dev_basic/csv.ts owns the file handling. It finds its own buttons by id and
    // knows nothing about interpolation; the two grids and this page's identity
    // are the only things it cannot work out for itself.
    initCsvIo({ slug: 'interpolation', level: 'advanced', input: grid, output: grid_2 });
    // Editing the input only re-plots. It does NOT re-run: every run is a network
    // round trip, and firing one per keystroke would hammer a shared service.
    grid.on('change', plotBoth);
    /* ---------------- Demo data ---------------- */
    // This page seeds its OWN demo, not the basic page's. The basic one is smooth
    // enough that all four methods agree to about 1e-2, which hides the only thing
    // this page exists to show. spec.json advanced.dataset explains the choice.
    //
    // The trap is the basic page's: grid.ts's paste overwrites cell by cell
    // without clearing, so a 2-row paste onto a seeded grid would leave the
    // remaining demo rows mixed into the visitor's data.
    let demoPristine = false;
    grid.on('change', () => { demoPristine = false; });
    const GRID_COLS = 4;
    function emptyGrid() {
        return Array.from({ length: 10 }, () => new Array(GRID_COLS).fill(''));
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
    // spec.json owns the dataset and the range - rules/topics.md: never hardcode
    // either here. advanced.* first, falling back to the topic's own.
    fetch('/topics/interpolation/spec.json')
        .then(r => r.json())
        .then(spec => {
        const level = (spec.advanced || {});
        const range = level.range;
        if (range) {
            // The HTML carries a static copy for crawlers; spec.json is the truth.
            if (range.min !== undefined)
                xMin.value = String(range.min);
            if (range.max !== undefined)
                xMax.value = String(range.max);
            if (range.interval !== undefined)
                xInterval.value = String(range.interval);
        }
        const data = level.dataset || spec.dataset;
        const xs = data && data.x;
        const ys = data && data.y;
        if (!xs || !xs.length)
            return;
        // The fetch is async. A visitor who pasted while it was in flight keeps
        // their data - seeding over it would be data loss.
        if (!gridIsEmpty())
            return;
        grid.setData(xs.map((x, i) => {
            const row = new Array(GRID_COLS).fill('');
            row[0] = String(x);
            row[1] = String(ys?.[i] ?? '');
            return row;
        }));
        demoPristine = true;
    })
        .catch(() => { });
})();
//# sourceMappingURL=page_adv.js.map