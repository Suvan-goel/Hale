import { useState, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The single waitlist form. Every CTA on the page scrolls here. */
export function WaitlistForm({ onSubmit }: { onSubmit: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setError("That doesn't look like an email address — mind checking it?");
      return;
    }
    setStatus("submitting");
    setError("");
    try {
      await onSubmit(trimmed);
    } catch {
      setStatus("error");
      setError("Something went wrong on our side. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email-input" className="sr-only">
          Email address
        </label>
        <input
          id="email-input"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="waitlist-input w-full flex-1 rounded-full border border-bone/25 bg-paper px-5 text-[15px] text-ink placeholder:text-ink/45"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="h-13 shrink-0 rounded-full bg-ink px-7 text-[15px] font-semibold text-bone transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "submitting" ? "Joining…" : "Join the waitlist"}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-3 text-center text-sm text-[#f3d9b0]">
          {error}
        </p>
      )}
      <p className="mt-4 text-center text-sm text-bone/65">
        No spam. Early access and founding-member pricing.
      </p>
    </form>
  );
}
