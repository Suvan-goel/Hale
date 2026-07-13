jest.mock('expo-file-system', () => {
  const files = new Map<string, string>();
  let listError: Error | null = null;
  let deleteMode: 'normal' | 'noop' | 'throw' = 'normal';

  class File {
    readonly name: string;

    constructor(...segments: unknown[]) {
      this.name = String(segments[segments.length - 1]);
    }

    get exists(): boolean {
      return files.has(this.name);
    }

    async text(): Promise<string> {
      return files.get(this.name) ?? '';
    }

    write(content: string): void {
      files.set(this.name, content);
    }

    delete(): void {
      if (deleteMode === 'throw') throw new Error('delete failed');
      if (deleteMode === 'normal') files.delete(this.name);
    }
  }

  class Directory {
    readonly exists = true;

    constructor(..._segments: unknown[]) {}

    create(): void {}

    list(): File[] {
      if (listError) throw listError;
      return Array.from(files.keys(), (name) => new File(this, name));
    }
  }

  return {
    Directory,
    File,
    Paths: { document: '/documents' },
    __mockFileSystem: {
      files,
      reset() {
        files.clear();
        listError = null;
        deleteMode = 'normal';
      },
      setListError(error: Error | null) {
        listError = error;
      },
      setDeleteMode(mode: 'normal' | 'noop' | 'throw') {
        deleteMode = mode;
      },
    },
  };
});

import { createExpoHistoryFs } from '../fsAdapter';

interface MockFileSystem {
  files: Map<string, string>;
  reset(): void;
  setListError(error: Error | null): void;
  setDeleteMode(mode: 'normal' | 'noop' | 'throw'): void;
}

const mockFileSystem = (
  jest.requireMock('expo-file-system') as { __mockFileSystem: MockFileSystem }
).__mockFileSystem;

describe('Expo history filesystem deletion modes', () => {
  beforeEach(() => {
    mockFileSystem.reset();
  });

  it('preserves best-effort list behavior for ordinary store callers', () => {
    mockFileSystem.setListError(new Error('list unavailable'));

    expect(createExpoHistoryFs().list()).toEqual([]);
  });

  it('surfaces list failures to destructive callers in strict mode', () => {
    mockFileSystem.setListError(new Error('list unavailable'));

    expect(() => createExpoHistoryFs({ strictErrors: true }).list()).toThrow('list unavailable');
  });

  it('surfaces no-op deletes in strict mode while ordinary cleanup remains idempotent', () => {
    mockFileSystem.files.set('programme.json', '{}');
    mockFileSystem.setDeleteMode('noop');

    expect(() => createExpoHistoryFs().delete?.('programme.json')).not.toThrow();
    expect(() => createExpoHistoryFs({ strictErrors: true }).delete?.('programme.json')).toThrow(
      'File still exists after deletion: programme.json'
    );
  });
});
