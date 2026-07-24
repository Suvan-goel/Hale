/**
 * UK/GDPR consent for the Meta Pixel. The pixel loads only after Accept;
 * declining changes nothing about how the page or form works. Reopenable via
 * the footer's "Cookie preferences".
 */
export function ConsentBanner({
  onChoice,
  onPrivacy,
}: {
  onChoice: (choice: "accepted" | "declined") => void;
  onPrivacy: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-md rounded-2xl border border-line bg-paper/95 p-4 text-ink shadow-[0_16px_48px_rgba(56,39,28,0.18)] backdrop-blur md:inset-x-auto md:right-6 md:mx-0"
    >
      <p className="text-sm leading-relaxed text-ink/75">
        We use one optional cookie (Meta Pixel) to measure our ads. Decline and everything here
        still works. Details are in our{" "}
        <button
          onClick={onPrivacy}
          className="font-medium text-pine underline underline-offset-2 hover:text-blush"
        >
          privacy policy
        </button>
        .
      </p>
      <div className="mt-3 flex items-center gap-4">
        <button
          onClick={() => onChoice("accepted")}
          className="rounded-xl bg-pine px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#69364F]"
        >
          Accept
        </button>
        <button
          onClick={() => onChoice("declined")}
          className="text-sm font-medium text-pine underline underline-offset-4 hover:text-blush"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
