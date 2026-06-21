'use client';

import * as React from 'react';

const consentKey = 'hale.analytics-consent';

export function ConsentBanner() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const open = () => setVisible(true);
    window.addEventListener('hale-open-consent', open);
    const timer = window.setTimeout(() => setVisible(window.localStorage.getItem(consentKey) === null), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('hale-open-consent', open);
    };
  }, []);

  function setConsent(value: 'yes' | 'no') {
    window.localStorage.setItem(consentKey, value);
    window.dispatchEvent(new Event('hale-consent-changed'));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="consent" aria-label="Privacy preferences">
      <div>
        <p className="consent__title">Privacy preferences</p>
        <p className="consent__body">
          Hale can use privacy-friendly analytics to improve this beta page. Necessary beta signup functionality works either way.
        </p>
      </div>
      <div className="consent__actions">
        <button className="button button--secondary button--small" type="button" onClick={() => setConsent('no')}>
          Keep off
        </button>
        <button className="button button--primary button--small" type="button" onClick={() => setConsent('yes')}>
          Allow analytics
        </button>
      </div>
    </aside>
  );
}

export function ConsentPreferencesButton() {
  return (
    <button
      className="footer-link footer-link--button"
      type="button"
      onClick={() => window.dispatchEvent(new Event('hale-open-consent'))}
    >
      Privacy preferences
    </button>
  );
}
