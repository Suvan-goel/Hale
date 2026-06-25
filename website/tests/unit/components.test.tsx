import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BetaSignupForm } from '@/components/BetaSignupForm';
import { FAQ } from '@/components/FAQ';
import { StoreButtons } from '@/components/StoreButtons';
import {
  betaReassurance,
  checkupActivities,
  credibilityPoints,
  exampleResult,
  faqs,
  trainingMessages,
  trustStrip,
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
    expect(text).toMatch(/movement-age style ranges/i);
    expect(text).toMatch(/email, optional first name and platform preference/i);
    expect(text).toMatch(/price before payment is collected/i);
    expect(text).toMatch(/not a diagnosis/i);
    expect(text).not.toMatch(/diagnoses|diagnostic|fall risk|payment details are collected by this page/i);
  });
});
