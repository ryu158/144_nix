import fs from 'node:fs';
import path from 'node:path';

const TOPIC_DIR = path.resolve(__dirname, '../../scientific_cal/topics/interpolation');

/** Read a tab-separated fixture (test_in_data.md / test_out_data.md) straight from the topic folder. */
export function loadFixture(name: string): string[][] {
  const raw = fs.readFileSync(path.join(TOPIC_DIR, name), 'utf8');
  return raw.replace(/\r/g, '').split('\n').filter(l => l.length).map(l => l.split('\t'));
}

/** Fixture rows narrowed to the columns the calculator's locked 4-column grid can hold. */
export function fixtureAsTsv(rows: string[][], cols: number): string {
  return rows.map(r => r.slice(0, cols).join('\t')).join('\n');
}

/**
 * Reference linear interpolation, written independently of interp_engine.ts.
 *
 * Deliberately NOT the same algorithm — the engine bisects, this sorts and
 * scans. Copying the implementation under test would prove nothing.
 * Returns null outside the known domain: no extrapolation, same contract.
 */
export function referenceInterp(points: Array<[number, number]>, x: number): number | null {
  const pts = [...points].sort((a, b) => a[0] - b[0]);
  if (!pts.length) return null;
  if (x < pts[0][0] || x > pts[pts.length - 1][0]) return null;

  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    if (x < x1 || x > x2) continue;
    if (x2 === x1) return y1;
    return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
  }
  return pts[pts.length - 1][1]; // x lands exactly on the last point
}

/** Series column (1-based) as {x, y} pairs, dropping cells the engine would also drop. */
export function seriesFrom(rows: string[][], col: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (const row of rows) {
    const xRaw = row[0], yRaw = row[col];
    if (xRaw === undefined || xRaw === '' || yRaw === undefined || yRaw === '') continue;
    const x = Number(xRaw), y = Number(yRaw);
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    pts.push([x, y]);
  }
  return pts;
}

export function xDomain(rows: string[][]): [number, number] {
  const xs = rows.map(r => Number(r[0])).filter(x => !Number.isNaN(x));
  return [Math.min(...xs), Math.max(...xs)];
}
