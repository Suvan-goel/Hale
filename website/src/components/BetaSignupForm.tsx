'use client';

import * as React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { platformLabels } from '@/content/landing';
import { collectAttribution } from '@/lib/attribution';
import { analyticsEvents } from '@/lib/analytics-events';
import { trackEvent } from '@/lib/analytics-client';
import type { PlatformPreference } from '@/config/site';

interface SignupResponse {
  ok: boolean;
  message?: string;
}

export function BetaSignupForm({ ctaLocation = 'beta-section' }: { ctaLocation?: string }) {
  const [email, setEmail] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [platform, setPlatform] = React.useState<PlatformPreference>('either');
  const [company, setCompany] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');
  const started = React.useRef(false);

  function markStarted() {
    if (started.current) return;
    started.current = true;
    trackEvent(analyticsEvents.betaSignupStarted, { cta_location: ctaLocation });
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === 'submitting' || status === 'success') return;
    setStatus('submitting');
    setMessage('');

    try {
      const attribution = collectAttribution(window.location.search, window.location.pathname);
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName,
          platform,
          company,
          attribution,
          sourcePath: window.location.pathname,
        }),
      });
      const payload = (await response.json()) as SignupResponse;
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || 'We could not save your signup. Please try again.');
      }
      setStatus('success');
      setMessage(payload.message || 'You are on the Hale beta list. We will send the next access step by email.');
      trackEvent(analyticsEvents.betaSignupSubmitted, { cta_location: ctaLocation, platform });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : 'We could not save your signup. Please try again.';
      setStatus('error');
      setMessage(nextMessage);
      trackEvent(analyticsEvents.betaSignupFailed, { cta_location: ctaLocation, platform, reason: nextMessage });
    }
  }

  if (status === 'success') {
    return (
      <div className="signup-success" role="status">
        <CheckCircle2 aria-hidden="true" size={28} />
        <div>
          <p className="signup-success__title">You are on the Hale beta list.</p>
          <p>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form className="signup-form" onSubmit={submit} noValidate>
      <div className="form-field">
        <label htmlFor="signup-email">Email address</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          required
          onFocus={markStarted}
          onChange={(event) => setEmail(event.target.value)}
          aria-describedby="signup-privacy signup-message"
          placeholder="you@example.com"
          suppressHydrationWarning
        />
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="signup-first-name">First name <span>optional</span></label>
          <input
            id="signup-first-name"
            name="firstName"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onFocus={markStarted}
            onChange={(event) => setFirstName(event.target.value)}
            placeholder="First name"
            suppressHydrationWarning
          />
        </div>

        <div className="form-field">
          <label htmlFor="signup-platform">Platform</label>
          <select
            id="signup-platform"
            name="platform"
            value={platform}
            onFocus={markStarted}
            onChange={(event) => setPlatform(event.target.value as PlatformPreference)}
          >
            {(['either', 'iphone', 'android'] as const).map((value) => (
              <option key={value} value={value}>
                {platformLabels[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="honeypot" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          suppressHydrationWarning
        />
      </div>

      <button className="button button--primary signup-form__submit" type="submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? <Loader2 className="spin" aria-hidden="true" size={18} /> : null}
        {status === 'submitting' ? 'Saving...' : 'Get beta access'}
      </button>

      <p id="signup-privacy" className="form-note">
        We will use your email to send Hale beta access and product updates. No health details are collected here.
      </p>
      <p id="signup-message" className={`form-message form-message--${status}`} role={status === 'error' ? 'alert' : 'status'}>
        {message}
      </p>
    </form>
  );
}
