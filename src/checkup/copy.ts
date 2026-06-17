const COUNT_WORDS: Record<number, string> = {
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
  10: 'ten',
};

export function checkupIntroCaption(itemCount: number): string {
  const count = COUNT_WORDS[itemCount] ?? String(itemCount);
  return `We'll guide you through ${count} short movements to check strength, balance, and mobility.`;
}
