import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { BRAND } from '..';

/**
 * Brand-token lint (REPOSITION_TDD §3.4, approved 2026-07-06): production
 * source must never hardcode the brand name in a string literal — every
 * user-facing mention interpolates BRAND.appName so the rename is one edit to
 * brand/brand.js (plus the asset work listed there).
 *
 * Case-sensitive \bPearl\b on purpose: lowercase infra identity (slug, scheme,
 * storage keys, asset filenames) is deliberately not brand-tokenized, and
 * identifiers like PearlLifecycleState/PearlDataExport have no word boundary so
 * they never match. Comments are stripped before scanning.
 */

const ROOT = process.cwd();
const BRAND_WORD = /\bPearl\b/;

// The one permitted production literal: the frozen data-export machine format
// id (founder decision 2026-07-06 — old backups must always restore). The
// type-literal declaration plus the single value assignment.
const ALLOWLIST: Record<string, { pattern: RegExp; maxOccurrences: number }> = {
  'src/services/backend/dataExportService.ts': {
    pattern: /app: 'Pearl'/,
    maxOccurrences: 2,
  },
};

function productionFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === '__tests__' || name === 'testing' || name === 'node_modules') continue;
      productionFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');
}

describe('brand token', () => {
  it('exposes the app name from brand/brand.js (single source shared with app.config.js)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const brandJs = require('../../../brand/brand') as { appName: string };
    expect(BRAND.appName).toBe(brandJs.appName);
    expect(BRAND.appName.length).toBeGreaterThan(0);
  });

  it('feeds the Expo display name (F6: config reads the token, slug/scheme stay infra)', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const configFn = require('../../../app.config.js') as (input: { config: object }) => {
      name: string;
      slug: string;
    };
    const config = configFn({ config: {} });
    expect(config.name).toBe(BRAND.appName);
    expect(config.slug).toBe('pearl'); // infra identity, deliberately not tokenized
  });

  it('finds no hardcoded brand name in production string source outside the allowlist', () => {
    const files = [join(ROOT, 'App.tsx'), ...productionFiles(join(ROOT, 'src'))];
    const violations: string[] = [];
    for (const file of files) {
      const rel = relative(ROOT, file);
      if (rel === join('src', 'brand', 'index.ts')) continue;
      const text = stripComments(readFileSync(file, 'utf8'));
      const matches = text.match(new RegExp(BRAND_WORD, 'g')) ?? [];
      if (matches.length === 0) continue;
      const allowed = ALLOWLIST[rel.split('\\').join('/')];
      if (!allowed || matches.length > allowed.maxOccurrences || !allowed.pattern.test(text)) {
        violations.push(`${rel}: ${matches.length} occurrence(s)`);
      }
    }
    expect(violations).toEqual([]);
  });
});
