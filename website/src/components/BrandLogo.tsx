import Image from 'next/image';

import { brandAssets } from '@/config/brand';

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-logo" aria-label="Hale">
      <Image src={brandAssets.logoMark} alt="" width={compact ? 30 : 36} height={compact ? 30 : 36} priority />
      <span className="brand-logo__word">Hale</span>
    </span>
  );
}
