'use client';

import React, { useState, useEffect } from 'react';
import { Block } from '@/lib/types';
import { Check, Lock, Unlock } from 'lucide-react';

interface DividerBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isUnlocked?: boolean;
  onContinueClick?: () => void;
}

export function DividerBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isUnlocked = false,
  onContinueClick,
}: DividerBlockProps) {
  const { subtype, content, settings } = block;

  const label = (content.label as string) || settings?.buttonText || 'Continue';
  const number = (content.number as number) || 1;
  const spacerHeight = settings?.spacerHeight || 48; // in px
  const requirement = settings?.completionRequirement || 'none';

  // Smooth unlock transition state
  const [hasAnimatedUnlock, setHasAnimatedUnlock] = useState(false);
  const [prevUnlocked, setPrevUnlocked] = useState(isUnlocked);

  useEffect(() => {
    if (!prevUnlocked && isUnlocked && requirement !== 'none') {
      setHasAnimatedUnlock(true);
      const timer = setTimeout(() => {
        setHasAnimatedUnlock(false);
      }, 700);
      setPrevUnlocked(isUnlocked);
      return () => clearTimeout(timer);
    }
    setPrevUnlocked(isUnlocked);
  }, [isUnlocked, prevUnlocked, requirement]);

  if (subtype === 'numbered_divider') {
    return (
      <div className="w-full flex items-center justify-center my-4">
        <div className="h-px bg-gray-200 flex-1" />
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onChange({ ...content, number: parseInt(e.currentTarget.innerText) || 1 })}
          className="w-8 h-8 rounded-full border-2 text-xs font-bold flex items-center justify-center mx-4 bg-white shadow-2xs outline-none focus:ring-1 focus:ring-sky-500"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          {number}
        </div>
        <div className="h-px bg-gray-200 flex-1" />
      </div>
    );
  }

  if (subtype === 'spacer') {
    return (
      <div
        className="w-full flex items-center justify-center border border-dashed border-gray-200/60 rounded-lg group text-gray-300 text-[10px] select-none"
        style={{ height: `${spacerHeight}px` }}
      >
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">Spacer ({spacerHeight}px)</span>
      </div>
    );
  }

  if (subtype === 'continue_button') {
    const isLocked = requirement !== 'none' && !isUnlocked;

    if (isLocked) {
      return (
        <div className="w-full flex flex-col items-center justify-center py-6 select-none">
          <div className="w-full max-w-md py-4 px-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300">
            <div className="w-8 h-8 rounded-full bg-slate-200/70 text-slate-500 flex items-center justify-center shadow-2xs">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs font-semibold text-slate-700">
              🔒 Complete the content above before moving on
            </div>
            <p className="text-[11px] text-slate-400">
              {requirement === 'block_above'
                ? 'Interact with or complete the block directly above to unlock this section.'
                : 'Complete all activities and interactions above to unlock this section.'}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full flex flex-col items-center justify-center py-4">
        <button
          type="button"
          onClick={onContinueClick}
          className={`px-8 py-3 rounded-full text-white text-xs sm:text-sm font-semibold shadow-sm transition-all duration-500 flex items-center gap-2 cursor-pointer ${
            hasAnimatedUnlock
              ? 'scale-105 ring-4 ring-orange-400/40 shadow-xl'
              : 'hover:scale-102 hover:shadow-md scale-100'
          }`}
          style={{ backgroundColor: accentColor }}
        >
          {requirement !== 'none' ? (
            hasAnimatedUnlock ? (
              <Unlock className="w-4 h-4 stroke-[2.5] animate-bounce text-amber-200" />
            ) : (
              <Check className="w-4 h-4 stroke-[3]" />
            )
          ) : null}
          <span
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onChange({ ...content, label: e.currentTarget.innerText })}
            className="outline-none"
          >
            {label}
          </span>
        </button>

        {requirement !== 'none' && (
          <div className="mt-2 text-[10px] text-emerald-600 font-medium flex items-center gap-1 animate-in fade-in duration-300">
            <Check className="w-3 h-3" />
            <span>Section unlocked — continue your lesson</span>
          </div>
        )}
      </div>
    );
  }

  // Default: divider_line
  return (
    <div className="w-full py-4 flex items-center justify-center">
      <div className="w-full h-px bg-gray-200" />
    </div>
  );
}

