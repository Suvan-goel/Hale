import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BetaSignupForm } from '@/components/BetaSignupForm';
import { FAQ } from '@/components/FAQ';
import { StoreButtons } from '@/components/StoreButtons';
import {
  betaReassurance,
  betaValueList,
  checkupActivities,
  credibilityPoints,
  exampleResult,
  faqs,
  finalCta,
  firstMonthPlan,
  founderNote,
  heroFocusCopy,
  howItWorks,
  measurementDomains,
  problemPoints,
  trainingMessages,
  trustDetails,
  trustStrip,
  valueCase,
} from '@/content/landing';

describe('conversion components', () => {
  it('falls back to beta signup CTA when store links are missing', () => {
    render(<StoreButtons links={[]} ctaLocation="test" />);
    const link = screen.getByRole('link', { name: /join the hale beta/i });
    expect(link).toHaveAttribute('href', '#beta-access');
  });

  it('does not render dead store links', () => {
    render(
      <StoreButtons
        ctaLocation="test"
        links={[
          {
            platform: 'ios',
            href: 'https://testflight.apple.com/join/example',
            label: 'Apple beta access',
            shortLabel: 'iPhone beta',
            ariaLabel: 'Open Hale beta access for iPhone',
          },
        ]}
      />
    );
    expect(screen.getByRole('link', { name: /iphone/i })).toHaveAttribute('href', 'https://testflight.apple.com/join/example');
    expect(screen.queryByRole('link', { name: /android/i })).not.toBeInTheDocument();
  });

  it('submits the signup form and shows a real success state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true, message: 'Saved.' }),
      })
    );
    window.history.pushState({}, '', '/?utm_source=google');

    render(<BetaSignupForm />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'person@example.com' } });
    fireEvent.change(screen.getByLabelText(/platform/i), { target: { value: 'android' } });
    fireEvent.click(screen.getByRole('button', { name: /get beta access/i }));

    await waitFor(() => expect(screen.getByText(/you are on the hale beta list/i)).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledWith(
      '/api/beta-signup',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('shows an error when persistence fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false, message: 'Persistence failed.' }),
      })
    );

    render(<BetaSignupForm />);
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'person@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /get beta access/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Persistence failed.'));
  });

  it('renders accessible FAQ buttons', () => {
    render(<FAQ items={faqs.slice(0, 2)} />);
    const button = screen.getByRole('button', { name: /what is hale/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: /who is hale designed for/i }));
    expect(screen.getByRole('button', { name: /who is hale designed for/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps landing equipment positioning truthful for beta', () => {
    const text = [
      ...trainingMessages,
      ...checkupActivities.flatMap((item) => [item.title, item.body]),
      ...trustStrip.flatMap((item) => [item.title, item.body]),
      ...faqs.flatMap((item) => [item.question, item.answer]),
    ].join(' ');

    expect(text).toMatch(/sturdy chair and a wall or counter/i);
    expect(text).toMatch(/No specialist gym equipment is needed to begin/i);
    expect(text).toMatch(/resistance band is recommended/i);
    expect(text).toMatch(/required for pulling exercises/i);
    expect(text).not.toMatch(/zero equipment|nothing but your phone|just your phone|only your phone|every workout needs no equipment/i);
  });

  it('keeps proof, result, and beta reassurance truthful', () => {
    const text = [
      exampleResult.eyebrow,
      exampleResult.title,
      exampleResult.body,
      ...exampleResult.domains.flatMap((item) => [item.label, item.value, item.body]),
      exampleResult.plan.label,
      exampleResult.plan.title,
      exampleResult.plan.body,
      ...credibilityPoints.flatMap((item) => [item.title, item.body]),
      ...betaReassurance,
      ...faqs.flatMap((item) => [item.question, item.answer]),
    ].join(' ');

    expect(exampleResult.eyebrow).toMatch(/example result/i);
    expect(text).toMatch(/chair-stand results/i);
    expect(text).toMatch(/source-backed chair-stand ranges/i);
    expect(text).toMatch(/email, optional first name and platform preference/i);
    expect(text).toMatch(/price before payment is collected/i);
    expect(text).toMatch(/not medical labels/i);
    expect(text).not.toMatch(/movement-age|movement age|body age|diagnos|fall risk|payment details are collected by this page/i);
  });

  // Mirrors MENOPAUSE_CLAIM_COPY in src/haleFlow/__tests__/copyGuardrails.test.ts
  // (2026-07-05 repositioning red lines). Claim-shaped patterns only: honest
  // disclaimers ("does not measure bone density") stay legal.
  it('keeps menopause positioning wellness-side: no bone, hormone, or treatment claims', () => {
    const menopauseClaimCopy =
      /fracture risk|osteoporosis|osteopenia|hormone replacement|\bHRT\b|bone density (score|test|result|reading)|(?<!not |never )(measures?|estimates?|tracks?|predicts?) (your )?(bone density|hormones?)|(treats?|relieves?|cures?|reverses?) (your )?menopause|menopause (treatment|therapy|cure)/i;

    const text = [
      ...Object.values(heroFocusCopy),
      ...problemPoints,
      ...howItWorks.flatMap((item) => [item.title, item.body]),
      ...checkupActivities.flatMap((item) => [item.title, item.body]),
      exampleResult.body,
      ...measurementDomains.flatMap((item) => [item.title, item.body]),
      ...credibilityPoints.flatMap((item) => [item.title, item.body]),
      ...trainingMessages,
      ...firstMonthPlan.flatMap((item) => [item.title, item.body]),
      founderNote.quote,
      valueCase.title,
      valueCase.costComparison,
      finalCta.title,
      finalCta.body,
      ...betaValueList,
      ...trustDetails,
      ...faqs.flatMap((item) => [item.question, item.answer]),
    ].join(' ');

    expect(text).not.toMatch(menopauseClaimCopy);
    // The repositioning itself is pinned: the hero leads with the menopause
    // frame, and the result is named the Strength Profile.
    expect(heroFocusCopy.general).toMatch(/menopause/i);
    expect(text).toMatch(/Strength Profile/);
    expect(text).not.toMatch(/Movement Profile/);
  });
});
