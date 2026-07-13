/**
 * HEALTH DATA IS LOCAL-ONLY, APP-WIDE (2026-07-06 rulings: ambiguity 6 for
 * the programme module; extended the same day to the legacy fields —
 * menopauseStage, symptomPicture, safetyProfile / safety_json). Nothing
 * health-shaped is written to or read from Supabase until a deliberate
 * special-category-consent + encryption review adds sync as its own feature.
 *
 * Structural containment in the fluencyPrivacy style: the backend service
 * layer's CODE (comments stripped, test files excluded — fixtures legitimately
 * construct legacy rows to prove they are ignored) must not import the
 * programme module or name any health field/store. A future sync surface
 * cannot pick health data up by accident; it would have to defeat this test
 * deliberately.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BACKEND_DIR = join(__dirname, '..', '..', 'services', 'backend');

function backendSourceFiles(dir: string = BACKEND_DIR): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === '__tests__') continue;
      out.push(...backendSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Crude but sufficient comment stripper: bans apply to code, not to the comments documenting the ruling. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

describe('no health data in backup shapes', () => {
  const sources = backendSourceFiles().map((file) => ({
    file,
    code: stripComments(readFileSync(file, 'utf8')),
  }));

  it('finds the backend service layer (guard against a moved directory silently passing)', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it('never imports from src/programme', () => {
    for (const { file, code } of sources) {
      expect({ file, imports: /from '[^']*\/programme[/']/.test(code) }).toEqual({
        file,
        imports: false,
      });
    }
  });

  it('keeps legacy check-up/restore services out of the live backend barrel', () => {
    const barrel = readFileSync(join(BACKEND_DIR, 'index.ts'), 'utf8');
    expect(barrel).not.toMatch(/checkupSyncService|restoreService|dataExportService/);
  });

  it('never references programme health state or the legacy health fields', () => {
    const banned = [
      // Programme engine v2 (never synced from day one)
      'programme.json',
      'ProgrammeStore',
      'ProgrammeState',
      'ProgrammeProfile',
      'pelvicRouting',
      'gentleStartActive',
      'jointFlags',
      'diastasisFlag',
      'consentHealthData',
      // Legacy health fields (sync removed 2026-07-06)
      'safety_json',
      'safetyProfile',
      'menopauseStage',
      'symptomPicture',
      'MovementSafetyProfile',
    ];
    for (const { file, code } of sources) {
      for (const token of banned) {
        // The local deletion service must know the filename in order to erase
        // it. This is device cleanup, not a backup/sync shape; every other
        // programme or health token remains banned there too.
        if (token === 'programme.json' && file.endsWith('accountDataService.ts')) {
          continue;
        }
        expect({ file, token, present: code.includes(token) }).toEqual({
          file,
          token,
          present: false,
        });
      }
    }
  });
});
