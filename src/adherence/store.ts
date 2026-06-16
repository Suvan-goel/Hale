import { HistoryFs } from '../history';
import {
  defaultAdherenceStoreState,
  deserializeAdherenceState,
  serializeAdherenceState,
} from './serialize';
import type { AdherenceStoreState } from './types';

const ADHERENCE_FILE = 'adherence-state.json';

export class AdherenceStore {
  private readonly fs: HistoryFs;

  constructor(fs: HistoryFs) {
    this.fs = fs;
  }

  async load(): Promise<AdherenceStoreState> {
    const json = await this.fs.read(ADHERENCE_FILE);
    if (!json) return defaultAdherenceStoreState();
    return deserializeAdherenceState(json) ?? defaultAdherenceStoreState();
  }

  save(state: AdherenceStoreState): void {
    this.fs.write(ADHERENCE_FILE, serializeAdherenceState(state));
  }
}
