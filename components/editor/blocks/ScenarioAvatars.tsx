'use client';

import React from 'react';

export type ScenarioExpression = 'neutral' | 'happy' | 'talking' | 'concerned' | 'frustrated';
export type ScenarioCharacter = 'alex' | 'sloane' | 'mentor';

interface ScenarioAvatarProps {
  expression?: ScenarioExpression;
  character?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  hideBadge?: boolean;
}

export function ScenarioAvatar({
  expression = 'neutral',
  character = 'alex',
  className = 'w-24 h-24 sm:w-28 sm:h-28',
  hideBadge = false,
}: ScenarioAvatarProps) {
  // Normalize character key
  const charKey: ScenarioCharacter =
    character.toLowerCase().includes('sloane') || character.toLowerCase().includes('manager')
      ? 'sloane'
      : character.toLowerCase().includes('mentor') || character.toLowerCase().includes('coach')
      ? 'mentor'
      : 'alex';

  // Expression Badge Pill
  const getExpressionBadge = () => {
    switch (expression) {
      case 'happy':
        return (
          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'talking':
        return (
          <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'concerned':
        return (
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'frustrated':
        return (
          <div className="absolute -bottom-1 -right-1 bg-rose-500 text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="absolute -bottom-1 -right-1 bg-slate-600 text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        );
    }
  };

  // Render SVG Character Vector
  return (
    <div className={`relative ${className} select-none`}>
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-white/80 shadow-xl flex items-center justify-center">
        {charKey === 'alex' && <AlexSvg expression={expression} />}
        {charKey === 'sloane' && <SloaneSvg expression={expression} />}
        {charKey === 'mentor' && <MentorSvg expression={expression} />}
      </div>
      {!hideBadge && getExpressionBadge()}
    </div>
  );
}

// 1. Alex — IT Support / Cybersecurity Analyst
function AlexSvg({ expression }: { expression: ScenarioExpression }) {
  const isHappy = expression === 'happy';
  const isTalking = expression === 'talking';
  const isConcerned = expression === 'concerned';
  const isFrustrated = expression === 'frustrated';

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background radial glow */}
      <circle cx="60" cy="60" r="58" fill="#F1F5F9" />

      {/* Shirt / Polo */}
      <path d="M22 120 C22 92, 42 85, 60 85 C78 85, 98 92, 98 120 Z" fill="#3B82F6" />
      <path d="M48 85 L60 102 L72 85 Z" fill="#1D4ED8" />
      {/* Lanyard / Badge */}
      <path d="M56 102 L56 120 M64 102 L64 120" stroke="#F59E0B" strokeWidth="2" />
      <rect x="52" y="112" width="16" height="12" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />

      {/* Neck */}
      <path d="M50 72 L50 88 L70 88 L70 72 Z" fill="#FBCFE8" opacity="0.9" />

      {/* Head / Face */}
      <ellipse cx="60" cy="58" rx="24" ry="26" fill="#FDE2D4" />

      {/* Hair (Short dark modern crop) */}
      <path d="M36 50 C36 32, 46 22, 60 22 C74 22, 84 32, 84 50 C84 42, 78 30, 60 30 C42 30, 36 42, 36 50 Z" fill="#1E293B" />

      {/* Eyebrows */}
      {isConcerned || isFrustrated ? (
        <>
          <path d="M43 45 Q50 48 53 47" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M77 45 Q70 48 67 47" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : isHappy ? (
        <>
          <path d="M43 45 Q48 42 53 45" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M67 45 Q72 42 77 45" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M43 46 Q48 44 53 46" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          <path d="M67 46 Q72 44 77 46" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Glasses (Modern rounded frames) */}
      <rect x="42" y="48" width="14" height="11" rx="3.5" fill="none" stroke="#0F172A" strokeWidth="2" />
      <rect x="64" y="48" width="14" height="11" rx="3.5" fill="none" stroke="#0F172A" strokeWidth="2" />
      <path d="M56 53 L64 53" stroke="#0F172A" strokeWidth="2" />

      {/* Eyes */}
      <circle cx="49" cy="53" r="2.2" fill="#0F172A" />
      <circle cx="71" cy="53" r="2.2" fill="#0F172A" />
      {/* Light catch */}
      <circle cx="50" cy="52" r="0.8" fill="#FFFFFF" />
      <circle cx="72" cy="52" r="0.8" fill="#FFFFFF" />

      {/* Mouth */}
      {isHappy ? (
        <path d="M51 68 Q60 76 69 68" stroke="#991B1B" strokeWidth="2.2" strokeLinecap="round" fill="#DC2626" />
      ) : isTalking ? (
        <ellipse cx="60" cy="70" rx="4.5" ry="5.5" fill="#991B1B" />
      ) : isFrustrated ? (
        <path d="M52 71 Q60 66 68 71" stroke="#991B1B" strokeWidth="2.2" strokeLinecap="round" />
      ) : isConcerned ? (
        <path d="M53 70 Q60 68 67 70" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M53 69 Q60 71 67 69" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
      )}

      {/* Headset (Cybersecurity / IT helpdesk) */}
      <path d="M35 48 C34 38, 44 32, 60 32 C76 32, 86 38, 85 48" stroke="#64748B" strokeWidth="2.5" fill="none" />
      <rect x="33" y="47" width="5" height="10" rx="2" fill="#0F172A" />
      <path d="M35 55 Q38 68 50 67" stroke="#64748B" strokeWidth="2" fill="none" />
      <circle cx="51" cy="67" r="2.5" fill="#0F172A" />
    </svg>
  );
}

// 2. Sloane — Executive / Team Lead
function SloaneSvg({ expression }: { expression: ScenarioExpression }) {
  const isHappy = expression === 'happy';
  const isTalking = expression === 'talking';
  const isConcerned = expression === 'concerned';
  const isFrustrated = expression === 'frustrated';

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#FDF4FF" />
      {/* Blazer */}
      <path d="M22 120 C22 92, 42 84, 60 84 C78 84, 98 92, 98 120 Z" fill="#0F172A" />
      <path d="M46 84 L60 108 L74 84 Z" fill="#F8FAFC" />
      <path d="M38 86 L54 120 L30 120 Z" fill="#1E293B" />
      <path d="M82 86 L66 120 L90 120 Z" fill="#1E293B" />

      {/* Neck */}
      <path d="M52 70 L52 86 L68 86 L68 70 Z" fill="#F6D5C2" />

      {/* Hair back */}
      <path d="M30 50 C30 28, 42 20, 60 20 C78 20, 90 28, 90 50 C90 70, 84 85, 84 85 L36 85 C36 85, 30 70, 30 50 Z" fill="#7C2D12" />

      {/* Face */}
      <ellipse cx="60" cy="56" rx="22" ry="25" fill="#FCE7D8" />

      {/* Hair front / Styling */}
      <path d="M32 46 C36 30, 48 24, 60 24 C72 24, 86 32, 88 46 C84 36, 74 32, 60 32 C46 32, 36 38, 32 46 Z" fill="#9A3412" />

      {/* Eyebrows */}
      {isConcerned || isFrustrated ? (
        <>
          <path d="M44 44 Q50 47 54 45" stroke="#431407" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M76 44 Q70 47 66 45" stroke="#431407" strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M44 44 Q49 41 54 44" stroke="#431407" strokeWidth="2" strokeLinecap="round" />
          <path d="M66 44 Q71 41 76 44" stroke="#431407" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      <circle cx="49" cy="51" r="2.4" fill="#431407" />
      <circle cx="71" cy="51" r="2.4" fill="#431407" />
      <circle cx="50" cy="50" r="0.8" fill="#FFFFFF" />
      <circle cx="72" cy="50" r="0.8" fill="#FFFFFF" />

      {/* Mouth */}
      {isHappy ? (
        <path d="M52 66 Q60 74 68 66" stroke="#991B1B" strokeWidth="2.2" strokeLinecap="round" fill="#DC2626" />
      ) : isTalking ? (
        <ellipse cx="60" cy="68" rx="4.5" ry="5.5" fill="#991B1B" />
      ) : isFrustrated ? (
        <path d="M52 70 Q60 65 68 70" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" />
      ) : isConcerned ? (
        <path d="M53 69 Q60 67 67 69" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M53 68 Q60 70 67 68" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

// 3. Mentor — Senior Coach / Director
function MentorSvg({ expression }: { expression: ScenarioExpression }) {
  const isHappy = expression === 'happy';
  const isTalking = expression === 'talking';
  const isConcerned = expression === 'concerned';
  const isFrustrated = expression === 'frustrated';

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="58" fill="#ECFDF5" />

      {/* Cardigan / Sweater */}
      <path d="M22 120 C22 92, 42 84, 60 84 C78 84, 98 92, 98 120 Z" fill="#047857" />
      <path d="M48 84 L60 102 L72 84 Z" fill="#E2E8F0" />
      <path d="M60 102 L60 120" stroke="#065F46" strokeWidth="3" />

      {/* Neck */}
      <path d="M51 72 L51 86 L69 86 L69 72 Z" fill="#E2BA9D" />

      {/* Head */}
      <ellipse cx="60" cy="58" rx="23" ry="25" fill="#E8C3A8" />

      {/* Graying Hair */}
      <path d="M35 50 C35 30, 46 22, 60 22 C74 22, 85 30, 85 50 C82 36, 72 30, 60 30 C48 30, 38 36, 35 50 Z" fill="#64748B" />
      <path d="M34 50 L38 48 L37 56 Z" fill="#94A3B8" />
      <path d="M86 50 L82 48 L83 56 Z" fill="#94A3B8" />

      {/* Eyebrows */}
      {isConcerned || isFrustrated ? (
        <>
          <path d="M43 45 Q49 48 54 46" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M77 45 Q71 48 66 46" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M43 45 Q49 42 54 45" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
          <path d="M66 45 Q71 42 77 45" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      <circle cx="49" cy="52" r="2.3" fill="#1E293B" />
      <circle cx="71" cy="52" r="2.3" fill="#1E293B" />
      <circle cx="50" cy="51" r="0.8" fill="#FFFFFF" />
      <circle cx="72" cy="51" r="0.8" fill="#FFFFFF" />

      {/* Mouth */}
      {isHappy ? (
        <path d="M51 68 Q60 76 69 68" stroke="#991B1B" strokeWidth="2.2" strokeLinecap="round" fill="#DC2626" />
      ) : isTalking ? (
        <ellipse cx="60" cy="70" rx="4.5" ry="5.5" fill="#991B1B" />
      ) : isFrustrated ? (
        <path d="M52 72 Q60 67 68 72" stroke="#991B1B" strokeWidth="2" strokeLinecap="round" />
      ) : isConcerned ? (
        <path d="M53 71 Q60 69 67 71" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M53 70 Q60 72 67 70" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}
