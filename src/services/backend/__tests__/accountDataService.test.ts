import fs from 'node:fs';
import path from 'node:path';

import { createMemoryFs } from '../../../history';

import {
  clearLocalHaleData,
  getLocalDataSummary,
  type LocalFileArea,
} from '../accountDataService';

function memoryArea(files: Set<string>): LocalFileArea {
  return {
    list: () => Array.from(files),
    delete: (name) => {
      files.delete(name);
    },
  };
}

describe('local Hale account data service', () => {
  it('handles missing files idempotently', async () => {
    const fsArea = createMemoryFs();
    const recordings = memoryArea(new Set());

    const result = await clearLocalHaleData({ fs: fsArea, recordings });

    expect(result.failures).toEqual([]);
    expect(result.deletedFiles).toEqual([]);
    expect(result).toEqual(
      expect.objectContaining({
        preferences: false,
        checkups: 0,
        trainingState: false,
        microChecks: 0,
        adherenceState: false,
        recordings: 0,
      })
    );
  });

  it('clears expected local stores and preserves unrelated files', async () => {
    const files = new Map<string, string>([
      ['preferences.json', '{}'],
      ['checkup-2026-06-18T10-00-00-000Z.json', '{}'],
      ['training-state.json', '{}'],
      ['microcheck-2026-06-25T10-00-00-000Z.json', '{}'],
      ['adherence-state.json', '{}'],
      ['notes.json', '{}'],
    ]);
    const recordings = new Set(['rec-2026-06-18.jsonl', 'debug.txt']);

    const result = await clearLocalHaleData({
      fs: createMemoryFs(files),
      recordings: memoryArea(recordings),
    });

    expect(result.failures).toEqual([]);
    expect(result.deletedFiles).toEqual(
      expect.arrayContaining([
        'local Hale files/preferences.json',
        'local Hale files/checkup-2026-06-18T10-00-00-000Z.json',
        'local Hale files/training-state.json',
        'local Hale files/microcheck-2026-06-25T10-00-00-000Z.json',
        'local Hale files/adherence-state.json',
        'recordings/rec-2026-06-18.jsonl',
      ])
    );
    expect(Array.from(files.keys())).toEqual(['notes.json']);
    expect(Array.from(recordings)).toEqual([]);
  });

  it('summarizes local Hale data before deletion', async () => {
    const files = new Map<string, string>([
      ['preferences.json', '{}'],
      ['checkup-a.json', '{}'],
      ['checkup-b.json', '{}'],
      ['training-state.json', '{}'],
      ['microcheck-a.json', '{}'],
      ['adherence-state.json', '{}'],
    ]);

    const summary = await getLocalDataSummary({
      fs: createMemoryFs(files),
      recordings: memoryArea(new Set(['rec-a.jsonl'])),
    });

    expect(summary).toEqual({
      preferences: true,
      checkups: 2,
      trainingState: true,
      microChecks: 1,
      adherenceState: true,
      recordings: 1,
    });
  });

  it('does not reference service-role key names in app source', () => {
    const roots = [
      path.join(process.cwd(), 'src/lib'),
      path.join(process.cwd(), 'src/services/backend'),
      path.join(process.cwd(), 'src/components'),
    ];
    const source = roots.flatMap(readSourceFiles).map((file) => fs.readFileSync(file, 'utf8')).join('\n');

    expect(source).not.toMatch(/SUPABASE_SERVICE_ROLE|SERVICE_ROLE_KEY|service_role/i);
  });
});

function readSourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.name === '__tests__') return [];
    if (entry.isDirectory()) return readSourceFiles(fullPath);
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}
