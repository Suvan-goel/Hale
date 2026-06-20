/**
 * Family page data — a LOCAL MOCK for V1 (see docs/decisions.md). A real
 * shared-family view would need accounts + a backend + a privacy/consent model,
 * all explicit V1 non-goals; this fixture lets us prototype the experience
 * without any of that. No network, no real other users.
 *
 * Tone follows Law 5 (no streak-shaming, no leaderboards): we surface gentle,
 * supportive status, never a competitive ranking.
 */

export type MemberStatus = 'on-track' | 'retest-due' | 'resting';

export interface FamilyMember {
  id: string;
  name: string;
  /** Relationship label, e.g. "Mum", "Brother". */
  relation: string;
  /** Sample home-estimate midpoint for mock UI only, or null if they have not checked up yet. */
  movementAge: number | null;
  /** Sessions completed in the last 7 days. */
  weeklySessions: number;
  /** Human-friendly "last active" label. */
  lastActive: string;
  status: MemberStatus;
}

export const STATUS_LABEL: Record<MemberStatus, string> = {
  'on-track': 'On track this week',
  'retest-due': 'Ready for a re-test',
  resting: 'Taking a rest',
};

/** Sample household — placeholder data until a real shared backend is decided. */
export const FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'margaret',
    name: 'Margaret',
    relation: 'Mum',
    movementAge: 61,
    weeklySessions: 3,
    lastActive: 'Today',
    status: 'on-track',
  },
  {
    id: 'david',
    name: 'David',
    relation: 'Dad',
    movementAge: 66,
    weeklySessions: 1,
    lastActive: '2 days ago',
    status: 'retest-due',
  },
  {
    id: 'susan',
    name: 'Susan',
    relation: 'Sister',
    movementAge: 52,
    weeklySessions: 4,
    lastActive: 'Yesterday',
    status: 'on-track',
  },
  {
    id: 'tom',
    name: 'Tom',
    relation: 'Brother',
    movementAge: null,
    weeklySessions: 0,
    lastActive: 'Not started yet',
    status: 'resting',
  },
];
