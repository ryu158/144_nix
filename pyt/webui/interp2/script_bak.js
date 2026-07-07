const gridBody = document.getElementById('gridBody');
const headerRow = document.getElementById('headerRow');
const addColBtn = document.getElementById('addColBtn');
const addRowBtn = document.getElementById('addRowBtn');
const errorBanner = document.getElementById('errorBanner');
let chartInstance = null;

// ---------- Grid construction ----------

function numCols() {
  // columns = header cells minus the X column and the "add col" button cell
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
  const colIndex = numCols() + 1; // 1-based index within row (0 = X)
  removeSpan.addEventListener('click', () => {
    if (numCols() > 1) removeColumn(th);
  });
  th.appendChild(removeSpan);

  headerRow.insertBefore(th, headerRow.querySelector('.add-col-cell'));

  // add matching empty cell to every existing row (before the remove-row cell)
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

// initial: attach remove-listener to the first header's remove icon (none yet, add it)
function initHeader() {
  const firstHeader = headerRow.querySelector('th:not(.add-col-cell)');
  firstHeader.classList.add('series-header');
  // add remove icon to the initial series header too
  const removeSpan = document.createElement('span');
  removeSpan.className = 'col-remove';
  removeSpan.textContent = '\u2715';
  removeSpan.title = 'Remove series';
  removeSpan.addEventListener('click', () => {
    if (numCols() > 1) removeColumn(firstHeader);
  });
  firstHeader.appendChild(removeSpan);
}

addColBtn.addEventListener('click', () => addColumn());
addRowBtn.addEventListener('click', () => addRow());

// ---------- Validation ----------

function validateCell(input) {
  const v = input.value.trim();
  if (v === '') {
    input.classList.remove('invalid');
    return;
  }
  if (isNaN(Number(v))) {
    input.classList.add('invalid');
  } else {
    input.classList.remove('invalid');
  }
}

// ---------- Paste handling ----------

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
  // count = total data columns needed (including X at index 0)
  while (numCols() + 1 < count) addColumn();
}

function onPaste(e) {
  const text = (e.clipboardData || window.clipboardData).getData('text');
  if (!text || text.indexOf('\t') === -1 && text.indexOf('\n') === -1) {
    // single value paste, let default behavior happen
    return;
  }
  e.preventDefault();

  const input = e.target;
  const { rowIndex, colIndex } = getCellPosition(input);

  const rows = text.replace(/\r/g, '').split('\n').filter((r, i, arr) => !(i === arr.length - 1 && r === ''));
  const grid = rows.map(r => r.split('\t'));

  const neededRows = rowIndex + grid.length;
  const neededCols = colIndex + Math.max(...grid.map(r => r.length));

  ensureRows(neededRows);
  ensureCols(neededCols);

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

// ---------- Data collection ----------

function collectData() {
  const numDataCols = numCols() + 1; // including X
  const rows = Array.from(gridBody.rows).map(tr =>
    Array.from(tr.children).slice(0, numDataCols).map(td => td.querySelector('input').value.trim())
  );

  // keep only rows where X is non-empty
  const usableRows = rows.filter(r => r[0] !== '');

  const xValues = [];
  const seriesRaw = [];
  for (let c = 1; c < numDataCols; c++) seriesRaw.push([]);

  usableRows.forEach(r => {
    xValues.push(r[0]);
    for (let c = 1; c < numDataCols; c++) {
      seriesRaw[c - 1].push(r[c]);
    }
  });

  const labels = Array.from(headerRow.querySelectorAll('th.series-header input')).map(i => i.value.trim() || 'Series');

  const errors = [];

  // numeric check for X
  const xNums = xValues.map(Number);
  if (xValues.some(v => v === '' || isNaN(Number(v)))) {
    errors.push('X column contains empty or non-numeric values.');
  }

  const seriesResult = [];
  seriesRaw.forEach((col, idx) => {
    const label = labels[idx] || `Series ${idx + 1}`;
    const filled = col.filter(v => v !== '').length;

    if (filled === 0) {
      errors.push(`Series '${label}' has no values.`);
      return;
    }
    if (filled < col.length && col.some((v, i) => v === '' )) {
      // check for gaps vs simple shortness
      const firstEmpty = col.indexOf('');
      const hasGapAfter = col.slice(firstEmpty).some(v => v !== '');
      if (hasGapAfter) {
        errors.push(`Series '${label}' is missing a value in the middle of the range — every X needs a matching Y.`);
      } else {
        errors.push(`Series '${label}' has ${filled} values but X has ${col.length} — missing values at the end.`);
      }
      return;
    }

    const nums = col.map(Number);
    if (nums.some(isNaN)) {
      errors.push(`Series '${label}' contains non-numeric values.`);
      return;
    }

    seriesResult.push({ label, y: nums });
  });

  return { xNums, seriesResult, errors };
}

// ---------- Submit ----------

function showError(msg) {
  errorBanner.textContent = msg;
  errorBanner.style.display = 'block';
}

function clearError() {
  errorBanner.style.display = 'none';
  errorBanner.textContent = '';
}

document.getElementById('runBtn').addEventListener('click', async () => {
  clearError();

  const { xNums, seriesResult, errors } = collectData();

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
    // Pure TypeScript/JS engine, no network call at all.
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
    const resp = await fetch('/interpolate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await resp.text();
      showError(
        `Server returned an unexpected (non-JSON) response, HTTP ${resp.status}.\n` +
        `First 200 chars of response:\n${text.slice(0, 200)}`
      );
      return;
    }

    const data = await resp.json();

    if (!resp.ok) {
      showError(data.error || `Request failed with HTTP ${resp.status}.`);
      return;
    }

    renderChart(data);
  } catch (err) {
    showError('Request failed: ' + err.message);
  }
});

// ---------- Chart rendering ----------

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
      plugins: {
        legend: { position: 'top' },
      },
    },
  });
}

// ---------- Init ----------

initHeader();
addRow(['1', '2']);
addRow(['2', '4']);
addRow(['3', '6']);
addRow(['4', '8']);
addRow(['5', '10']);
document.getElementById('newXStart').value = '1';
document.getElementById('newXFinish').value = '5';
document.getElementById('newXInterval').value = '0.1';
