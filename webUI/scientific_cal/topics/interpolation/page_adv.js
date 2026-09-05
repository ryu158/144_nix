"use strict";
/**
 * page_adv.ts
 * Page controller for the Advanced Interpolate Calculator.
 *
 * dev_basic/calc-page.ts owns the grids, the chart, the status line, file
 * import/export and the demo seed. What is left here is this page's whole
 * reason to exist: it computes NOTHING itself, posting the table to
 * /api/interpolation/<method> and rendering what comes back.
 *
 * Nothing here calls InterpEngine, and the page does not load it. The advanced
 * methods are scipy's, and falling back to the basic page's linear math while
 * the select reads "cubic spline" would be a lie told by the page.
 */
(function () {
    // No fixedColCount, unlike the basic page: this page takes x plus any number
    // of y series, so a wide paste or import grows the grid instead of alerting.
    const page = initCalcPage({
        slug: 'interpolation',
        level: 'advanced',
        cols: 4,
        fixedColCount: false
    });
    if (!page)
        return;
    const { input, output, runBtn, plotBoth, setStatus } = page;
    const { xMin, xMax, xInterval } = page;
    // Every method goes over the wire, so the select is not optional here.
    const method = page.method;
    if (!method) {
        console.warn('[interpolation:advanced] method select missing — page not wired');
        return;
    }
    /* ---------------- Calculation, over HTTP ---------------- */
    async function run() {
        // Disabled while a request is in flight: a second click would fire a
        // second request and the answers could land out of order.
        runBtn.disabled = true;
        setStatus('computing…');
        try {
            const res = await fetch(`/scientific_cal/api/interpolation/${method.value}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: input.getData(),
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
            output.setData(rows);
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
    // Editing the input only re-plots. It does NOT re-run: every run is a network
    // round trip, and firing one per keystroke would hammer a shared service.
    // This is the one wiring line that differs from the basic page.
    input.on('change', plotBoth);
})();
//# sourceMappingURL=page_adv.js.map