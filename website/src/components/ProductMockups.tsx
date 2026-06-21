import { Activity, CalendarCheck2, LineChart, Radar } from 'lucide-react';

import { productTour } from '@/content/landing';

const iconMap = [CalendarCheck2, Radar, Activity, LineChart] as const;

export function HeroPhoneMockup() {
  return (
    <div className="hero-phone" aria-label="Product example showing Hale's Today view">
      <div className="hero-phone__top">
        <span>Today</span>
        <span>Beta</span>
      </div>
      <div className="hero-phone__profile">
        <p>Your movement profile</p>
        <div className="ring">
          <span>3</span>
          <small>domains</small>
        </div>
      </div>
      <div className="hero-phone__rows">
        <MockRow label="Strength" value="Measured" />
        <MockRow label="Balance" value="Focus" />
        <MockRow label="Mobility" value="Measured" />
      </div>
      <div className="hero-phone__action">
        <span>Next session</span>
        <strong>Steady strength at home</strong>
      </div>
    </div>
  );
}

export function ProductTour() {
  return (
    <div className="product-tour" aria-label="Hale product flow examples">
      {productTour.map((item, index) => {
        const Icon = iconMap[index] ?? CalendarCheck2;
        return (
          <article className="phone-card" key={item.title}>
            <div className="phone-card__chrome">
              <span />
            </div>
            <div className="phone-card__header">
              <Icon aria-hidden="true" size={22} />
              <span>{item.title}</span>
            </div>
            <div className="phone-card__metric">
              <strong>{item.metric}</strong>
              <span>{item.label}</span>
            </div>
            <p>{item.caption}</p>
            <div className="phone-card__nav" aria-hidden="true">
              <span className={index === 0 ? 'active' : ''}>Today</span>
              <span className={index === 2 ? 'active' : ''}>Plan</span>
              <span className={index === 3 ? 'active' : ''}>Progress</span>
              <span>Explore</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MockRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mock-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
