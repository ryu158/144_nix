/**
 * page.ts
 * Page controller for the Interpolate Calculator.
 *
 * dev_basic/calc-page.ts owns the grids, the chart, the status line, file
 * import/export and the demo seed. What is left here is the one thing that is
 * this topic's and this level's: the calculation, which runs in the browser
 * through InterpEngine and never leaves it.
 */
(function () {
  // Locked to 4 columns - x plus three y series. rules/topics.md and the how-to
  // panel both state that, and grid.ts alerts and truncates a wider paste.
  const page = initCalcPage({
    slug: 'interpolation',
    level: 'calculator',
    cols: 4,
    fixedColCount: true
  });
  if (!page) return;

  const { input, output, plotBoth, xMin, xMax, xInterval } = page;

  function getQueryXs(): number[] {
    return output.getData()
      .map(row => row[0])
      .filter(v => v !== '' && v !== undefined && v !== null)
      .map(Number)
      .filter(x => !Number.isNaN(x));
  }

  function getManualRangeXs(): number[] {
    return InterpEngine.generateRange(xMin.value, xMax.value, xInterval.value);
  }

  function interpolateAndPlotManual() {
    const inputData = input.getData();
    const queryXs = getManualRangeXs();
    if (!queryXs.length) { plotBoth(); return; }

    const outputTable = InterpEngine.buildOutputTable(inputData, queryXs);
    output.setData(outputTable);
    plotBoth();
    if (window.trackEvent) window.trackEvent('interpolate_run', { query_count: queryXs.length });
  }

  page.runBtn.addEventListener('click', interpolateAndPlotManual);

  // Editing the input re-runs immediately. It costs nothing: the math is local,
  // which is the whole difference between this page and the advanced one.
  function interpolateAndPlot() {
    const inputData = input.getData();
    const queryXs = getQueryXs();
    if (!queryXs.length) { plotBoth(); return; }

    const outputTable = InterpEngine.buildOutputTable(inputData, queryXs);
    output.setData(outputTable);
    plotBoth();
  }

  input.on('change', interpolateAndPlot);
})();
