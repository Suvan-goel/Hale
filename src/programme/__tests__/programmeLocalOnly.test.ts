/**
 * LOCAL-ONLY PIN (2026-07-06 ruling, ambiguity 6): the programme state holds
 * UK GDPR special-category health flags and is EXCLUDED from Supabase backup
 * shapes. Health data stays on the device until a deliberate consent +
 * encryption review adds sync as its own feature.
 *
 * Structural containment in the fluencyPrivacy style: the backend service
 * layer must not import the programme module, reference its store file, or
 * name its health fields — so a future sync surface cannot pick the state up
 * by accident; it would have to defeat this test deliberately.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BACKEND_DIR = join(__dirname, '..', '..', 'services', 'backend');

function backendSourceFiles(dir: string = BACKEND_DIR): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...backendSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe('programme state never enters backup shapes', () => {
  const sources = backendSourceFiles().map((file) => ({
    file,
    text: readFileSync(file, 'utf8'),
  }));

  it('finds the backend service layer (guard against a moved directory silently passing)', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it('never imports from src/programme', () => {
    for (const { file, text } of sources) {
      expect({ file, imports: /from '[^']*\/programme[/']/.test(text) }).toEqual({
        file,
        imports: false,
      });
    }
  });

  it('never references the programme store file or its health fields', () => {
    const banned = [
      'programme.json',
      'ProgrammeStore',
      'ProgrammeState',
      'ProgrammeProfile',
      'pelvicRouting',
      'gentleStartActive',
      'jointFlags',
      'diastasisFlag',
      'consentHealthData',
    ];
    for (const { file, text } of sources) {
      for (const token of banned) {
        expect({ file, token, present: text.includes(token) }).toEqual({
          file,
          token,
          present: false,
        });
      }
    }
  });
});
