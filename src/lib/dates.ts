/**
 * Pearl's one user-facing date style: "15 Jul 2026" (en-GB day, short month,
 * year). Every surface that shows a date uses this helper so formats never
 * drift between screens again. Charts may use tighter month-only labels, but
 * date *rows* always come through here.
 */
export function formatPearlDate(
  iso: string,
  { year = true }: { year?: boolean } = {}
): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(year ? { year: 'numeric' as const } : {}),
  }).format(date);
}
