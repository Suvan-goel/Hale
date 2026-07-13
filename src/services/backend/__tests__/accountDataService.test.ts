import fs from 'node:fs';
import path from 'node:path';

import { createMemoryFs } from '../../../history';

import {
  clearLocalPearlData,
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

function noSessionFunnels(): LocalFileArea[] {
  return [memoryArea(new Set())];
}

describe('local Pearl account data service', () => {
  it('handles missing files idempotently', async () => {
    const fsArea = createMemoryFs();
    const recordings = memoryArea(new Set());

    const result = await clearLocalPearlData({
      fs: fsArea,
      recordings,
      sessionFunnels: noSessionFunnels(),
    });

    expect(result.failures).toEqual([]);
    expect(result.deletedFiles).toEqual([]);
    expect(result).toEqual(
      expect.objectContaining({
        preferences: false,
        checkups: 0,
        programmeState: false,
        trainingState: false,
        microChecks: 0,
        adherenceState: false,
        sessionFunnels: 0,
        recordings: 0,
      })
    );
  });

  it('clears expected local stores and preserves unrelated files', async () => {
    const files = new Map<string, string>([
      ['preferences.json', JSON.stringify({
        profile: {
          safetyProfile: {
            painNotes: 'legacy pain note',
            injuryNotes: 'legacy injury note',
          },
        },
      })],
      ['checkup-2026-06-18T10-00-00-000Z.json', '{}'],
      ['programme.json', '{}'],
      ['training-state.json', '{}'],
      ['training-session-in-progress.json', '{"exercise":"private workout snapshot"}'],
      ['microcheck-2026-06-25T10-00-00-000Z.json', '{}'],
      ['adherence-state.json', '{}'],
      ['online-profile-sync.json', '{"lastSyncedFingerprint":"private-hash"}'],
      ['notes.json', '{}'],
    ]);
    const recordings = new Set(['rec-2026-06-18.jsonl', 'debug.txt']);
    const funnels = new Set(['funnel-2026-06-18.json']);

    const result = await clearLocalPearlData({
      fs: createMemoryFs(files),
      recordings: memoryArea(recordings),
      sessionFunnels: [memoryArea(funnels)],
    });

    expect(result.failures).toEqual([]);
    expect(result.deletedFiles).toEqual(
      expect.arrayContaining([
        'local Pearl files/preferences.json',
        'local Pearl files/checkup-2026-06-18T10-00-00-000Z.json',
        'local Pearl files/programme.json',
        'local Pearl files/training-state.json',
        'local Pearl files/training-session-in-progress.json',
        'local Pearl files/microcheck-2026-06-25T10-00-00-000Z.json',
        'local Pearl files/adherence-state.json',
        'local Pearl files/online-profile-sync.json',
        'recordings/rec-2026-06-18.jsonl',
        'session telemetry/funnel-2026-06-18.json',
      ])
    );
    expect(Array.from(files.keys())).toEqual(['notes.json']);
    expect(Array.from(files.values()).join('\n')).not.toMatch(
      /legacy pain note|legacy injury note|private workout snapshot/
    );
    expect(Array.from(recordings)).toEqual([]);
    expect(Array.from(funnels)).toEqual([]);
  });

  it('summarizes local Pearl data before deletion', async () => {
    const files = new Map<string, string>([
      ['preferences.json', '{}'],
      ['checkup-a.json', '{}'],
      ['checkup-b.json', '{}'],
      ['programme.json', '{}'],
      ['training-state.json', '{}'],
      ['microcheck-a.json', '{}'],
      ['adherence-state.json', '{}'],
    ]);

    const summary = await getLocalDataSummary({
      fs: createMemoryFs(files),
      recordings: memoryArea(new Set(['rec-a.jsonl'])),
      sessionFunnels: [memoryArea(new Set(['funnel-a.json']))],
    });

    expect(summary).toEqual({
      preferences: true,
      checkups: 2,
      programmeState: true,
      trainingState: true,
      microChecks: 1,
      adherenceState: true,
      sessionFunnels: 1,
      recordings: 1,
    });
  });

  it('reports a deletion failure instead of claiming the programme state was removed', async () => {
    const files = new Map([['programme.json', '{}']]);
    const failingFs = {
      ...createMemoryFs(files),
      delete: () => {
        throw new Error('delete failed');
      },
    };

    const result = await clearLocalPearlData({
      fs: failingFs,
      recordings: memoryArea(new Set()),
      sessionFunnels: noSessionFunnels(),
    });

    expect(result.programmeState).toBe(true);
    expect(result.deletedFiles).not.toContain('local Pearl files/programme.json');
    expect(result.failures).toEqual([
      expect.objectContaining({ area: 'local Pearl files', name: 'programme.json' }),
    ]);
    expect(Array.from(files.keys())).toEqual(['programme.json']);
  });

  it('reports a destructive list failure even when a later verification read succeeds', async () => {
    const baseFs = createMemoryFs();
    let listCalls = 0;
    const transientlyFailingFs = {
      ...baseFs,
      list: () => {
        listCalls += 1;
        if (listCalls === 1) throw new Error('list failed');
        return [];
      },
    };

    const result = await clearLocalPearlData({
      fs: transientlyFailingFs,
      recordings: memoryArea(new Set()),
      sessionFunnels: noSessionFunnels(),
    });

    expect(result.deletedFiles).toEqual([]);
    expect(result.failures).toEqual([
      expect.objectContaining({ area: 'local Pearl files', name: '*' }),
    ]);
  });

  it('detects a no-op delete and removes the file from the deleted-files claim', async () => {
    const files = new Map([['programme.json', '{}']]);
    const noOpFs = {
      ...createMemoryFs(files),
      delete: () => {},
    };

    const result = await clearLocalPearlData({
      fs: noOpFs,
      recordings: memoryArea(new Set()),
      sessionFunnels: noSessionFunnels(),
    });

    expect(result.deletedFiles).not.toContain('local Pearl files/programme.json');
    expect(result.failures).toEqual([
      expect.objectContaining({ area: 'local Pearl files', name: 'programme.json' }),
    ]);
    expect(files.has('programme.json')).toBe(true);
  });

  it('does not claim deletion when the post-delete verification list fails', async () => {
    const files = new Map([['programme.json', '{}']]);
    let listCalls = 0;
    const unverifiableFs = {
      ...createMemoryFs(files),
      list: () => {
        listCalls += 1;
        if (listCalls > 1) throw new Error('verification failed');
        return Array.from(files.keys());
      },
      delete: () => {},
    };

    const result = await clearLocalPearlData({
      fs: unverifiableFs,
      recordings: memoryArea(new Set()),
      sessionFunnels: noSessionFunnels(),
    });

    expect(result.deletedFiles).toEqual([]);
    expect(result.failures).toEqual([
      expect.objectContaining({ area: 'local Pearl files', name: '*' }),
    ]);
    expect(files.has('programme.json')).toBe(true);
  });

  it('reports recording-directory list failures instead of treating them as empty', async () => {
    const result = await clearLocalPearlData({
      fs: createMemoryFs(),
      recordings: {
        list: () => {
          throw new Error('recordings unavailable');
        },
        delete: () => {},
      },
      sessionFunnels: noSessionFunnels(),
    });

    expect(result.deletedFiles).toEqual([]);
    expect(result.failures).toEqual([
      expect.objectContaining({ area: 'recordings', name: '*' }),
    ]);
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
