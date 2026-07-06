/**
 * UK/GDPR consent for the Meta Pixel. The pixel loads only after Accept;
 * declining changes nothing about how the page or form works.
 */
export function ConsentBanner({
  onChoice,
}: {
  onChoice: (choice: "accepted" | "declined") => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl bg-ink/95 p-4 text-bone shadow-[0_16px_48px_rgba(5,10,8,0.4)] backdrop-blur md:inset-x-auto md:right-6 md:mx-0"
    >
      <p className="text-sm leading-relaxed text-bone/85">
        We use one optional cookie (Meta Pixel) to measure our ads. Decline and everything here
        still works.
      </p>
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onChoice("accepted")}
          className="rounded-full bg-bone px-5 py-2 text-sm font-semibold text-ink transition-opacity hover:opacity-90"
        >
          Accept
        </button>
        <button
          onClick={() => onChoice("declined")}
          className="text-sm font-medium text-bone/70 underline underline-offset-4 hover:text-bone"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
