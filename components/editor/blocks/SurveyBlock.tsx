'use client';

import React, { useState } from 'react';
import { Block } from '@/lib/types';
import { FileCheck, CheckCircle2, RotateCw, MessageSquare } from 'lucide-react';

interface SurveyBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function SurveyBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
}: SurveyBlockProps) {
  const { subtype, content } = block;

  // -------------------------------------------------------------
  // LIKERT SCALE SURVEY
  // -------------------------------------------------------------
  const likertQuestion =
    (content.question as string) ||
    'I feel confident in my ability to identify and safely report social engineering attempts in my daily work:';

  const likertLabels = (content.labels as string[]) || [
    'Strongly Disagree',
    'Disagree',
    'Neutral',
    'Agree',
    'Strongly Agree',
  ];

  const [selectedLikert, setSelectedLikert] = useState<number | null>(null);
  const [likertSubmitted, setLikertSubmitted] = useState(false);

  // -------------------------------------------------------------
  // FREEFORM TEXT SURVEY
  // -------------------------------------------------------------
  const freeformPrompt =
    (content.prompt as string) ||
    'What additional cybersecurity topics or defense scenarios would you like covered in future training modules?';

  const [freeformText, setFreeformText] = useState('');
  const [freeformSubmitted, setFreeformSubmitted] = useState(false);

  if (subtype === 'survey_freeform') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <span>Survey • Freeform Feedback</span>
        </div>

        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => onChange({ ...content, prompt: e.currentTarget.innerText })}
          className="text-sm sm:text-base font-semibold text-gray-900 leading-snug outline-none"
        >
          {freeformPrompt}
        </div>

        {!freeformSubmitted ? (
          <div className="space-y-4">
            <textarea
              rows={4}
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder="Type your response here..."
              className="w-full p-4 rounded-xl border border-gray-200 focus:border-black outline-none text-xs sm:text-sm text-gray-800 placeholder-gray-400 bg-gray-50/50 resize-y"
            />

            <button
              type="button"
              disabled={!freeformText.trim()}
              onClick={() => setFreeformSubmitted(true)}
              className="px-8 py-2.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-xs hover:scale-102 disabled:opacity-40 transition-all cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Submit Response
            </button>
          </div>
        ) : (
          <div className="p-6 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2 text-center animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-purple-600 mx-auto" />
            <div className="font-bold text-sm text-purple-900">Thank you for your feedback!</div>
            <p className="text-xs text-purple-700">Your response has been recorded anonymously.</p>
            <button
              type="button"
              onClick={() => {
                setFreeformSubmitted(false);
                setFreeformText('');
              }}
              className="mt-2 text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
            >
              Edit Response
            </button>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT: LIKERT SCALE
  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <FileCheck className="w-4 h-4 text-purple-600" />
        <span>Survey • Likert Rating Scale</span>
      </div>

      <div
        contentEditable={!isLearnerMode}
        suppressContentEditableWarning
        onBlur={(e) => onChange({ ...content, question: e.currentTarget.innerText })}
        className="text-sm sm:text-base font-semibold text-gray-900 leading-snug outline-none"
      >
        {likertQuestion}
      </div>

      {!likertSubmitted ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {likertLabels.map((label, idx) => {
              const isSelected = selectedLikert === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedLikert(idx)}
                  className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[90px] cursor-pointer ${
                    isSelected
                      ? 'border-black bg-gray-50 shadow-2xs scale-102'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mb-2"
                    style={{ borderColor: isSelected ? accentColor : '#d1d5db' }}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={selectedLikert === null}
            onClick={() => setLikertSubmitted(true)}
            className="px-8 py-2.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-xs hover:scale-102 disabled:opacity-40 transition-all cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            Submit Response
          </button>
        </div>
      ) : (
        <div className="p-6 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-2 text-center animate-in fade-in">
          <CheckCircle2 className="w-8 h-8 text-purple-600 mx-auto" />
          <div className="font-bold text-sm text-purple-900">Thank you for your rating!</div>
          <p className="text-xs text-purple-700">
            Selected: <span className="font-semibold">{likertLabels[selectedLikert!]}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setLikertSubmitted(false);
              setSelectedLikert(null);
            }}
            className="mt-2 text-xs font-semibold text-purple-700 hover:text-purple-900 underline cursor-pointer"
          >
            Change Rating
          </button>
        </div>
      )}
    </div>
  );
}
