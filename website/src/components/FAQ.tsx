'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';

import { analyticsEvents } from '@/lib/analytics-events';
import { trackEvent } from '@/lib/analytics-client';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ({ items }: { items: readonly FAQItem[] }) {
  const [open, setOpen] = React.useState<number | null>(0);

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `faq-panel-${index}`;
        const buttonId = `faq-button-${index}`;
        return (
          <div className="faq-item" key={item.question}>
            <button
              id={buttonId}
              className="faq-item__button"
              type="button"
              aria-expanded={expanded}
              aria-controls={panelId}
              onClick={() => {
                setOpen(expanded ? null : index);
                if (!expanded) {
                  trackEvent(analyticsEvents.faqOpened, { question: item.question });
                }
              }}
            >
              <span>{item.question}</span>
              <ChevronDown aria-hidden="true" size={20} />
            </button>
            <div id={panelId} role="region" aria-labelledby={buttonId} hidden={!expanded} className="faq-item__panel">
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
