// Globals TypeScript cannot see on its own.
// Everything defined in our own .ts files is already global (module: none),
// so only browser/third-party surface and shared shapes belong here.

interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
  trackEvent: (name: string, params?: Record<string, unknown>) => void;
  adsbygoogle: unknown[];
  /** File System Access API. Chromium only — always feature-detect before use. */
  showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;
}

// Minimal File System Access surface: only what the export path calls. TS 5.4's
// DOM lib does not ship these, and the full spec types are far more than we use.
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description?: string; accept: Record<string, string[]> }[];
}

interface SaveFileHandle {
  /** The name the user actually chose. Its extension is what picks the delimiter. */
  name: string;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}

// A CSS length: a number means px, a string is passed through verbatim.
type CssSize = number | string;

// GridTable.getData() / setData() contract: rows of string cells.
type Grid2D = string[][];

// Anything a chart can pull a table out of. GridTable satisfies it structurally,
// so dual-chart.ts stays generic instead of hard-depending on grid.ts.
interface GridSource {
  getData(): Grid2D;
}

// topics/<slug>/spec.json. Source of truth for SEO and the home page.
/** Demo data seeded into a calculator's input grid on first load. */
interface SpecDataset {
  x?: (string | number)[];
  y?: (string | number)[];
}

interface SpecMeta {
  title?: string;
  description?: string;
  /** Method select options, for a level that offers more than one. */
  methods?: string[];
  /** Demo data for this level, when it differs from the topic's. */
  dataset?: SpecDataset;
  /** Output X defaults for this level. */
  range?: { min?: number; max?: number; interval?: number };
}

interface Spec {
  slug: string;
  name?: string;
  insight?: string;
  category?: string;
  difficulty?: string;
  levels?: string[];
  pages?: Record<string, string>;
  blog?: SpecMeta;
  calculator?: SpecMeta;
  /** Demo data seeded into a topic's calculator on first load. */
  dataset?: SpecDataset;
  [level: string]: unknown;
}
