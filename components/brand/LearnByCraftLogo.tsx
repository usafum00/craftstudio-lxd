import React from 'react';

interface LearnByCraftLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'compact';
  theme?: 'light' | 'dark' | 'ivory';
  subtitle?: string;
  showTagline?: boolean;
}

/**
 * LearnByCraft Official Brand Colors
 * Deep Teal:  #115E59
 * Craft Amber:#F4B544
 * Warm Ivory: #FAF7F0
 * Ink:        #172B35
 * Soft Sage:  #DCE8DF
 */

export function LearnByCraftMark({
  className = 'w-8 h-8',
  theme = 'light',
}: {
  className?: string;
  theme?: 'light' | 'dark' | 'ivory';
}) {
  const isDark = theme === 'dark';
  const mainTeal = isDark ? '#FFFFFF' : '#115E59';
  const innerTeal = isDark ? '#E2E8F0' : '#0D4C47';
  const topFacet = isDark ? '#CBD5E1' : '#14716B';
  const amber = '#F4B544';

  return (
    <svg
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LearnByCraft Logo Mark"
    >
      {/* Left Column / Vertical Stem */}
      <path
        d="M20 32 L52 14 L52 98 L20 116 Z"
        fill={mainTeal}
      />
      
      {/* Top Angled Facet of Stem */}
      <path
        d="M20 32 L36 23 L68 41 L52 50 Z"
        fill={topFacet}
        opacity={isDark ? 0.9 : 0.85}
      />

      {/* Inner Recess / Fold Face */}
      <path
        d="M52 50 L68 41 L68 89 L52 98 Z"
        fill={innerTeal}
      />

      {/* Base Ribbon / Horizontal Fold (L shape base) */}
      <path
        d="M20 116 L52 98 L84 116 L52 134 Z"
        fill={innerTeal}
      />
      <path
        d="M52 134 L84 116 L112 100 L80 118 Z"
        fill={mainTeal}
      />

      {/* Right Fold Branch / Wing (Upward Diagonal) */}
      <path
        d="M52 68 L80 52 L102 68 L74 84 Z"
        fill={mainTeal}
      />
      <path
        d="M74 84 L102 68 L102 100 L74 116 Z"
        fill={innerTeal}
      />

      {/* Craft Amber Origami Fold Tip (#F4B544) */}
      <path
        d="M80 52 L98 42 L116 58 L102 68 Z"
        fill={amber}
      />
      <path
        d="M98 42 L116 58 L108 63 L90 47 Z"
        fill="#E5A330"
      />
    </svg>
  );
}

export function LearnByCraftLogo({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'light',
  subtitle = 'AUTHORING TOOL',
  showTagline = false,
}: LearnByCraftLogoProps) {
  const isDark = theme === 'dark';

  const markSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };

  const subtitleSizes = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-xs',
  };

  if (variant === 'mark') {
    return <LearnByCraftMark className={markSizes[size]} theme={theme} />;
  }

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="flex-shrink-0">
        <LearnByCraftMark className={markSizes[size]} theme={theme} />
      </div>

      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight ${titleSizes[size]} ${
              isDark ? 'text-white' : 'text-[#172B35]'
            }`}
          >
            Learn<span className="text-[#115E59]">By</span>Craft
          </span>
        </div>

        {subtitle && (
          <span
            className={`font-bold tracking-[0.22em] uppercase mt-1 ${subtitleSizes[size]} ${
              isDark ? 'text-teal-200/80' : 'text-[#115E59]'
            }`}
          >
            {subtitle}
          </span>
        )}

        {showTagline && (
          <span
            className={`text-[11px] font-medium mt-1.5 ${
              isDark ? 'text-slate-300' : 'text-gray-500'
            }`}
          >
            Your brand. Learning by design.
          </span>
        )}
      </div>
    </div>
  );
}
