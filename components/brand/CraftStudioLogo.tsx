import React from 'react';

interface CraftStudioLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'mark' | 'compact';
  theme?: 'dark' | 'light';
  showBadge?: boolean;
}

export function CraftStudioMark({
  className = 'w-7 h-7',
  theme = 'dark',
}: {
  className?: string;
  theme?: 'dark' | 'light';
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CraftStudio Emblem"
    >
      <defs>
        <linearGradient id="cs-indigo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id="cs-facet-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C7D2FE" />
        </linearGradient>
      </defs>

      {/* Outer Hex / Cube Prism */}
      <rect x="8" y="8" width="84" height="84" rx="22" fill={theme === 'dark' ? '#18181B' : '#EEF2FF'} stroke="#4F46E5" strokeWidth="2.5" />
      
      {/* Dynamic Geometric Fold: C & S glyph */}
      <path
        d="M28 32 L52 18 L52 82 L28 68 Z"
        fill="url(#cs-indigo-grad)"
      />
      <path
        d="M28 32 L44 24 L68 38 L52 46 Z"
        fill="url(#cs-facet-grad)"
      />
      <path
        d="M52 46 L74 34 L74 54 L52 66 Z"
        fill="#4F46E5"
      />
      <path
        d="M52 66 L74 54 L74 74 L52 86 Z"
        fill="#3730A3"
      />
      {/* Cyan/Violet Accent Dot */}
      <circle cx="74" cy="24" r="5" fill="#38BDF8" />
    </svg>
  );
}

export function CraftStudioLogo({
  className = '',
  size = 'md',
  variant = 'full',
  theme = 'dark',
  showBadge = true,
}: CraftStudioLogoProps) {
  const markSizes = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl',
  };

  if (variant === 'mark') {
    return <CraftStudioMark className={markSizes[size]} theme={theme} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <CraftStudioMark className={markSizes[size]} theme={theme} />

      <div className="flex items-center gap-1.5 leading-none">
        <span
          className={`font-black tracking-tight ${titleSizes[size]} ${
            theme === 'dark' ? 'text-white' : 'text-zinc-900'
          }`}
        >
          Craft<span className="text-indigo-400">Studio</span>
        </span>

        {showBadge && (
          <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider">
            PRO
          </span>
        )}
      </div>
    </div>
  );
}
