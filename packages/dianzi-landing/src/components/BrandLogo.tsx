import { ArrowRight } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

interface BrandLogoProps {
  compact?: boolean;
}

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

const ArrowRightIcon = ArrowRight as unknown as IconComponent;

export function BrandLogo({ compact = false }: BrandLogoProps) {
  return (
    <div className={compact ? 'brand-logo brand-logo--compact' : 'brand-logo'} aria-label="点子 DIANZI">
      <div className="brand-logo__mark">
        <img src="/materials/dianzi-icon.jpg" alt="" />
      </div>
      <div className="brand-logo__copy">
        <span>点子 DIANZI</span>
        {!compact && <small>让生活里的想法，遇见需要它的人。</small>}
      </div>
      {!compact && (
        <div className="brand-logo__arrow" aria-hidden="true">
          <ArrowRightIcon size={18} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
}
