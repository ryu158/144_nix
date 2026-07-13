/**
 * page.js
 * Page controller for the Interpolate Calculator.
 * Owns grid/chart instantiation and wiring — nothing here belongs
 * in grid.js / chart.js / dual-chart.js / interp_engine.js.
 */

const grid = new GridTable(document.getElementById('gridContainer'), {
  rows: 10,
  cols: 4,
  viewportHeight: '100%',
  viewportWidth: '100%',
  fixedColCount: true
});

const grid_2 = new GridTable(document.getElementById('gridContainer_2'), {
  rows: 10,
  cols: 4,
  viewportHeight: '100%',
  viewportWidth: '100%',
  fixedColCount: true,
  readOnly: false
});

const chart = new DualSeriesChart(document.getElementById('chartContainer'), {
  height: 'auto',
  xLabel: 'X (column A)',
  yLabel: 'Y',
  aspectRatio: 16 / 9
});

function plotBoth() {
  chart.plotFromGrids(grid_2, grid, { labelA: 'Output', labelB: 'Input' });
}

function getQueryXs() {
  return grid_2.getData()
    .map(row => row[0])
    .filter(v => v !== '' && v !== undefined && v !== null)
    .map(Number)
    .filter(x => !Number.isNaN(x));
}

function getManualRangeXs() {
  const min = document.getElementById('outputXMin').value;
  const max = document.getElementById('outputXMax').value;
  const interval = document.getElementById('outputXInterval').value;
  return InterpEngine.generateRange(min, max, interval);
}

// 👇 INSERT NEAR interpolateAndPlot() 👇
function interpolateAndPlotManual() {
  const inputData = grid.getData();
  const queryXs = getManualRangeXs();
  if (!queryXs.length) { plotBoth(); return; }

  const outputTable = InterpEngine.buildOutputTable(inputData, queryXs);
  grid_2.setData(outputTable);
  plotBoth();
}

// 👇 INSERT AT BOTTOM, ALONGSIDE EXISTING LISTENERS 👇
document.getElementById('genRangeBtn').addEventListener('click', interpolateAndPlotManual);

function interpolateAndPlot() {
  const inputData = grid.getData();
  const queryXs = getQueryXs();
  if (!queryXs.length) { plotBoth(); return; }

  const outputTable = InterpEngine.buildOutputTable(inputData, queryXs);
  grid_2.setData(outputTable);
  plotBoth();
}

document.getElementById('plotBtn').addEventListener('click', interpolateAndPlot);
grid.on('change', interpolateAndPlot);
grid_2.on('change', plotBoth);
