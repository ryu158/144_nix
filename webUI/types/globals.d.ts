// Globals TypeScript cannot see on its own.
// Everything defined in our own .ts files is already global (module: none),
// so only browser/third-party surface and shared shapes belong here.

interface Window {
  dataLayer: unknown[];
  gtag: (...args: unknown[]) => void;
  trackEvent: (name: string, params?: Record<string, unknown>) => void;
  adsbygoogle: unknown[];
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
interface SpecMeta {
  title?: string;
  description?: string;
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
  dataset?: { x?: (string | number)[]; y?: (string | number)[] };
  [level: string]: unknown;
}
