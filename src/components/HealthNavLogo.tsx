import React from 'react';
import { cn } from '../lib/utils';

interface HealthNavLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  variant?: 'full' | 'icon' | 'badge';
  onClick?: () => void;
}

export const HealthNavLogo: React.FC<HealthNavLogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = true,
  subtitleText = 'Your Health. Clearly Navigated.',
  className,
  variant = 'full',
  onClick,
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', img: 'w-6 h-6', text: 'text-sm', sub: 'text-[9px]' },
    sm: { icon: 'w-8 h-8', img: 'w-8 h-8', text: 'text-base', sub: 'text-[10px]' },
    md: { icon: 'w-10 h-10', img: 'w-10 h-10', text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', img: 'w-12 h-12', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', img: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm' },
  };

  const dimensions = sizeMap[size] || sizeMap.md;

  return (
    <div 
      className={cn("inline-flex items-center gap-3 select-none", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      {/* Glow + Logo Image Container */}
      <div className="relative group shrink-0">
        <div className="absolute -inset-0.5 rounded-2xl bg-emerald-500/20 blur-sm opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className={cn(
          "relative rounded-xl overflow-hidden bg-emerald-950/90 border border-emerald-500/30 flex items-center justify-center p-0.5 shadow-md shadow-emerald-950/60",
          dimensions.icon
        )}>
          <img 
            src="/healthnav-logo.jpg" 
            alt="HealthNav Official Logo" 
            className="w-full h-full object-cover rounded-lg"
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Fallback to SVG if image fails
              const target = e.currentTarget;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML = `
                  <svg viewBox="0 0 100 100" class="w-full h-full text-emerald-400 p-1" fill="none" stroke="currentColor" stroke-width="6">
                    <rect x="35" y="10" width="30" height="80" rx="6" stroke="currentColor" fill="rgba(16,185,129,0.15)" />
                    <rect x="10" y="35" width="80" height="30" rx="6" stroke="currentColor" fill="rgba(16,185,129,0.15)" />
                    <polygon points="50,15 62,45 88,50 62,55 50,85 38,55 12,50 38,45" fill="#10b981" />
                    <circle cx="50" cy="50" r="6" fill="#ffffff" />
                  </svg>
                `;
              }
            }}
          />
        </div>
      </div>

      {/* Typography */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <div className={cn("font-black tracking-tight flex items-baseline gap-0.5", dimensions.text)}>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300">
              Health
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              Nav
            </span>
          </div>
          {showSubtitle && (
            <span className={cn("font-semibold uppercase tracking-wider text-emerald-200/70", dimensions.sub)}>
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
