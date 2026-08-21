"use strict";
/**
 * page.ts
 * Page controller for the Interpolate Calculator.
 * Owns grid/chart instantiation and wiring — nothing here belongs
 * in grid.ts / chart.ts / dual-chart.ts / interp_engine.ts.
 */
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
})();
//# sourceMappingURL=page.js.map