'use client';

import React from 'react';
import { Block } from '@/lib/types';
import { isBlockDark } from '@/lib/contrast';
import { Info } from 'lucide-react';

interface StatementBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function StatementBlock({ block, onChange, accentColor = '#ff5722', isLearnerMode = false }: StatementBlockProps) {
  const { subtype, content } = block;
  const isDark = isBlockDark(block.settings);

  const statementColorClass = isDark ? 'text-white' : 'text-gray-900';
  const subtextColorClass = isDark ? 'text-zinc-300' : 'text-gray-500';
  const borderClass = isDark ? 'border-white/20' : 'border-gray-200/90';

  const handleBlur = (field: string, text: string) => {
    onChange({
      ...content,
      [field]: text,
    });
  };

  const statementText =
    (content.statement as string) ||
    'Cybercriminals do not hack systems when they can simply hack humans.';
  const subtext =
    (content.subtext as string) ||
    'Over 85% of corporate cybersecurity breaches begin through deceptive social engineering techniques.';

  if (subtype === 'statement_a') {
    // Statement A: Centered serif/bold statement between top and bottom thin horizontal borders
    return (
      <div className={`w-full text-center py-6 border-y ${borderClass} my-2`}>
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('statement', e.currentTarget.innerText)}
          className={`font-serif text-xl sm:text-2xl font-bold ${statementColorClass} tracking-tight leading-snug rounded px-2 py-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {statementText}
        </div>
        {subtext && (
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('subtext', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm ${subtextColorClass} font-sans mt-3 max-w-xl mx-auto leading-relaxed rounded px-2 py-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {subtext}
          </div>
        )}
      </div>
    );
  }

  if (subtype === 'statement_b') {
    // Statement B: Centered statement with a short thick top accent bar in the course brand color
    return (
      <div className="w-full text-center flex flex-col items-center py-4">
        <div
          className="w-12 h-1.5 rounded-full mb-6 transition-colors duration-300"
          style={{ backgroundColor: accentColor }}
        />
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('statement', e.currentTarget.innerText)}
          className={`text-lg sm:text-2xl font-bold ${statementColorClass} tracking-tight leading-snug rounded px-2 py-1 max-w-2xl ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {statementText}
        </div>
        {subtext && (
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('subtext', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm ${subtextColorClass} mt-3 max-w-xl leading-relaxed rounded px-2 py-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {subtext}
          </div>
        )}
      </div>
    );
  }

  if (subtype === 'statement_c') {
    // Statement C: Left-aligned statement inside a full-width background card (crisp white if dark, or soft gray)
    return (
      <div className={`w-full rounded-2xl p-6 sm:p-8 ${isDark ? 'bg-zinc-900/90 text-white border border-zinc-700 shadow-xl' : 'bg-gray-50/90 border border-gray-100 text-gray-900'}`}>
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('statement', e.currentTarget.innerText)}
          className={`text-base sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} tracking-tight leading-snug rounded p-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {statementText}
        </div>
        {subtext && (
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('subtext', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm ${isDark ? 'text-zinc-300' : 'text-gray-600'} mt-2 leading-relaxed rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {subtext}
          </div>
        )}
      </div>
    );
  }

  if (subtype === 'statement_d') {
    // Statement D: Left-aligned bold statement with a short top accent bar
    return (
      <div className="w-full py-2">
        <div
          className="w-10 h-1.5 rounded-full mb-4 transition-colors duration-300"
          style={{ backgroundColor: accentColor }}
        />
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('statement', e.currentTarget.innerText)}
          className={`text-base sm:text-xl font-bold ${statementColorClass} tracking-tight leading-snug rounded p-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {statementText}
        </div>
        {subtext && (
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => !isLearnerMode && handleBlur('subtext', e.currentTarget.innerText)}
            className={`text-xs sm:text-sm ${subtextColorClass} mt-2 leading-relaxed rounded p-1 ${
              isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
            }`}
          >
            {subtext}
          </div>
        )}
      </div>
    );
  }

  // Note: Callout box with info icon and rounded colored border matching accent color
  return (
    <div
      className="w-full rounded-2xl p-5 sm:p-6 border bg-white flex items-start gap-4 shadow-2xs transition-colors"
      style={{ borderColor: accentColor }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
      >
        <Info className="w-4 h-4 stroke-[2.5]" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('statement', e.currentTarget.innerText)}
          className={`font-bold text-xs sm:text-sm text-gray-900 rounded p-0.5 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {(content.statement as string) || 'Security Protocol Reminder'}
        </div>
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleBlur('subtext', e.currentTarget.innerText)}
          className={`text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed rounded p-0.5 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {subtext ||
            'Never reveal your multi-factor authentication (MFA) code over the telephone, regardless of who claims to be calling.'}
        </div>
      </div>
    </div>
  );
}
