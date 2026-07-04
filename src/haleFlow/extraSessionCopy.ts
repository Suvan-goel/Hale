export const EXTRA_SESSION_CARD_TITLES: Record<string, string> = {
  'preset-mobility-reset': 'Mobility reset',
  'preset-gentle-restart': 'Gentle restart',
  'preset-steady-balance': 'Steady balance',
  'preset-no-equipment-strength': 'Chair and wall strength',
  'preset-band-upper-back': 'Upper-back band work',
  'preset-stairs-confidence': 'Stairs confidence',
  'preset-quick-full-body': 'Quick full body',
};

export const EXTRA_SESSION_CARD_BODY: Record<string, string> = {
  'preset-mobility-reset': 'A light mobility reset.',
  'preset-gentle-restart': 'An easy way back in.',
  'preset-steady-balance': 'Balance and ankle control.',
  'preset-no-equipment-strength': 'Strength with a chair and wall.',
  'preset-band-upper-back': 'Upper-back support work.',
  'preset-stairs-confidence': 'Step practice for stairs.',
  'preset-quick-full-body': 'A short all-round session.',
};

export const EXTRA_SESSION_DETAIL_BODY: Record<string, string> = {
  'preset-mobility-reset':
    'Use this short mobility session when today\'s session is already done, before a re-test, after travel, or when you want something calmer.',
  'preset-gentle-restart':
    'A calm way back in when you want a clean slate. This session keeps the work light, familiar, and easy to complete.',
  'preset-steady-balance':
    'Focused balance and ankle support at a steady pace. Keep a wall or counter nearby and move without rushing.',
  'preset-no-equipment-strength':
    'A simple strength session using the core home setup: chair, wall, and clear space. It keeps balance and mobility in the mix.',
  'preset-band-upper-back':
    'Upper-back pulling work for days when a resistance band is available, with shoulder and trunk mobility to keep the session comfortable.',
  'preset-stairs-confidence':
    'Step, ankle, and balance practice for everyday stair confidence. Use a bottom stair and keep support nearby.',
  'preset-quick-full-body':
    'A concise Hale session that touches strength, balance, and mobility when you want a shorter option outside the main plan.',
};

export function extraSessionCardTitle(presetId: string, fallback: string): string {
  return EXTRA_SESSION_CARD_TITLES[presetId] ?? fallback;
}

export function extraSessionCardBody(presetId: string, fallback: string): string {
  return EXTRA_SESSION_CARD_BODY[presetId] ?? fallback;
}

export function extraSessionDetailBody(presetId: string | undefined, fallback: string): string {
  if (!presetId) return fallback;
  return EXTRA_SESSION_DETAIL_BODY[presetId] ?? fallback;
}
