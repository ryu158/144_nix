import { fetchInterpolation } from './api.js';
import { collectData, validateCell } from './dataProcessor.js';

const gridBody = document.getElementById('gridBody');
const headerRow = document.getElementById('headerRow');
const addColBtn = document.getElementById('addColBtn');
const addRowBtn = document.getElementById('addRowBtn');
const errorBanner = document.getElementById('errorBanner');
let chartInstance = null;

function numCols() {
  return headerRow.querySelectorAll('th.series-header').length;
}

function makeCell(value) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value !== undefined ? value : '';
  input.addEventListener('blur', () => validateCell(input));
  input.addEventListener('paste', onPaste);
  td.appendChild(input);
  return td;
}

function addRow(values) {
  const tr = document.createElement('tr');
  const cols = numCols() + 1; // +1 for X column
  for (let c = 0; c < cols; c++) {
    tr.appendChild(makeCell(values ? values[c] : ''));
  }
  const removeTd = document.createElement('td');
  removeTd.style.border = 'none';
  const removeSpan = document.createElement('span');
  removeSpan.className = 'row-remove';
  removeSpan.textContent = '\u2715';
  removeSpan.title = 'Remove row';
  removeSpan.addEventListener('click', () => {
    if (gridBody.rows.length > 2) tr.remove();
  });
  removeTd.appendChild(removeSpan);
  tr.appendChild(removeTd);
  gridBody.appendChild(tr);
}

function addColumn(label) {
  const th = document.createElement('th');
  th.className = 'series-header';
  const input = document.createElement('input');
  input.className = 'header-input';
  input.value = label || `Series ${numCols() + 1}`;
  th.appendChild(input);

  const removeSpan = document.createElement('span');
  removeSpan.className = 'col-remove';
  removeSpan.textContent = '\u2715';
  removeSpan.title = 'Remove series';
  removeSpan.addEventListener('click', () => {
    if (numCols() > 1) removeColumn(th);
  });
  th.appendChild(removeSpan);

  headerRow.insertBefore(th, headerRow.querySelector('.add-col-cell'));

  Array.from(gridBody.rows).forEach(row => {
    const cell = makeCell('');
    row.insertBefore(cell, row.lastElementChild);
  });
}

function removeColumn(th) {
  const idx = Array.from(headerRow.children).indexOf(th);
  th.remove();
  Array.from(gridBody.rows).forEach(row => {
    row.children[idx].remove();
  });
}

function initHeader() {
  const firstHeader = headerRow.querySelector('th:not(.add-col-cell)');
  firstHeader.classList.add('series-header');
  const removeSpan = document.createElement('span');
  removeSpan.className = 'col-remove';
  removeSpan.textContent = '\u2715';
  removeSpan.title = 'Remove series';
  removeSpan.addEventListener('click', () => {
    if (numCols() > 1) removeColumn(firstHeader);
  });
  firstHeader.appendChild(removeSpan);
}

// Paste Utilities
function getCellPosition(input) {
  const td = input.closest('td');
  const tr = td.closest('tr');
  const rowIndex = Array.from(gridBody.rows).indexOf(tr);
  const colIndex = Array.from(tr.children).indexOf(td);
  return { rowIndex, colIndex };
}

function ensureRows(count) {
  while (gridBody.rows.length < count) addRow();
}

function ensureCols(count) {
  while (numCols() + 1 < count) addColumn();
}

function onPaste(e) {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!text || (text.indexOf('\t') === -1 && text.indexOf('\n') === -1)) return;
  e.preventDefault();

  const input = e.target;
  const { rowIndex, colIndex } = getCellPosition(input);
  const rows = text.replace(/\r/g, '').split('\n').filter((r, i, arr) => !(i === arr.length - 1 && r === ''));
  const grid = rows.map(r => r.split('\t'));

  ensureRows(rowIndex + grid.length);
  ensureCols(colIndex + Math.max(...grid.map(r => r.length)));

  for (let r = 0; r < grid.length; r++) {
    const tr = gridBody.rows[rowIndex + r];
    for (let c = 0; c < grid[r].length; c++) {
      const td = tr.children[colIndex + c];
      const cellInput = td.querySelector('input');
      cellInput.value = grid[r][c].trim();
      validateCell(cellInput);
    }
  }
}

// Error Rendering
function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.style.display = 'block';
}

function clearError() {
  errorBanner.style.display = 'none';
  errorBanner.textContent = '';
}

// Main Submit Pipeline
document.getElementById('runBtn').addEventListener('click', async () => {
  clearError();

  const { xNums, seriesResult, errors } = collectData(gridBody, headerRow);

  const newXStart = document.getElementById('newXStart').value.trim();
  const newXFinish = document.getElementById('newXFinish').value.trim();
  const newXInterval = document.getElementById('newXInterval').value.trim();
  const method = document.getElementById('methodSelect').value;

  if (xNums.length < 2) errors.push('X must have at least 2 values.');
  if ([newXStart, newXFinish, newXInterval].some(v => v === '' || isNaN(Number(v)))) {
    errors.push('New X start/finish/interval must all be filled with numeric values.');
  }

  if (errors.length > 0) {
    showError('Please fix the following:\n- ' + errors.join('\n- '));
    return;
  }

  const payload = {
    x: xNums,
    y_series: seriesResult,
    method,
    new_x_start: Number(newXStart),
    new_x_finish: Number(newXFinish),
    new_x_interval: Number(newXInterval),
  };

  const useClientSide = document.getElementById('clientSideToggle').checked;

  if (useClientSide) {
    if (typeof Interp === 'undefined') {
      showError('Client-side engine (interpolate.js) failed to load.');
      return;
    }
    const result = Interp.run(payload);
    if (result.error) {
      showError(result.error);
      return;
    }
    renderChart(result);
    return;
  }

  try {
    const data = await fetchInterpolation(payload);
    renderChart(data);
  } catch (err) {
    showError(err.message);
  }
});

// Chart.js Rendering
function renderChart(data) {
  const ctx = document.getElementById('chart').getContext('2d');
  const colors = ['#2b6cb0', '#c0392b', '#27823f', '#8e44ad', '#d68910', '#16a085'];
  const datasets = [];

  data.series.forEach((s, i) => {
    const color = colors[i % colors.length];
    datasets.push({
      type: 'scatter',
      label: s.label + ' (original)',
      data: data.x_original.map((x, j) => ({ x, y: s.y_original[j] })),
      backgroundColor: color,
      pointRadius: 5,
      showLine: false,
    });

    datasets.push({
      type: 'line',
      label: s.label + ' (interpolated)',
      data: data.x_new.map((x, j) => ({ x, y: s.y_interp[j] })),
      borderColor: color,
      backgroundColor: 'transparent',
      pointRadius: 0,
      borderWidth: 2,
      tension: 0,
    });
  });

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      scales: {
        x: { type: 'linear', title: { display: true, text: 'X' } },
        y: { title: { display: true, text: 'Y' } },
      },
      plugins: { legend: { position: 'top' } },
    },
  });
}

// Elements Initialization
addColBtn.addEventListener('click', () => addColumn());
addRowBtn.addEventListener('click', () => addRow());

initHeader();
addRow(['1', '2']);
addRow(['2', '4']);
addRow(['3', '6']);
addRow(['4', '8']);
addRow(['5', '10']);
document.getElementById('newXStart').value = '1';
document.getElementById('newXFinish').value = '5';
document.getElementById('newXInterval').value = '0.1';
