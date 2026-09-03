import fs from 'node:fs';
import path from 'node:path';

/**
 * spec.json is the source of truth for SEO and the home page (.claude/rules/topics.md).
 * Tests assert against it, never against strings copied out of the HTML — that
 * is the whole point of the drift check.
 */
export interface SpecMeta {
  title: string;
  description: string;
  methods?: string[];
  /** Present when a level seeds different demo data from the topic's own. */
  dataset?: { x?: (string | number)[]; y?: (string | number)[] };
  range?: { min?: number; max?: number; interval?: number };
}

export interface Spec {
  slug: string;
  name: string;
  pages: Record<string, string>;
  levels: string[];
  insight: string;
  parameters: Array<{ name: string; type: string; values?: string[]; default?: unknown }>;
  /** Demo data seeded into the calculator's input grid on first load. */
  dataset?: { x?: (string | number)[]; y?: (string | number)[] };
  [level: string]: unknown;
}

const REPO_ROOT = path.resolve(__dirname, '../..');

export function loadSpec(slug: string): Spec {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'topics', slug, 'spec.json'), 'utf8'));
}

export function meta(spec: Spec, level: string): SpecMeta {
  return spec[level] as unknown as SpecMeta;
}

/** The public origin baked into canonical/og:url tags. Not the test baseURL. */
export const CANONICAL_ORIGIN = 'https://ryuora144.duckdns.org';
