'use client';

import React, { useState } from 'react';
import { Block } from '@/lib/types';
import {
  HelpCircle,
  Check,
  X,
  AlertCircle,
  RotateCw,
  Plus,
  Trash2,
  CheckCircle2,
  CheckSquare,
  Square,
  Link as LinkIcon,
} from 'lucide-react';

interface KnowledgeCheckBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function KnowledgeCheckBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
}: KnowledgeCheckBlockProps) {
  const { subtype, content } = block;

  // -------------------------------------------------------------
  // 1. MULTIPLE CHOICE
  // -------------------------------------------------------------
  const mcQuestion =
    (content.question as string) ||
    'Which instructional design model emphasizes an iterative five-phase process of Analysis, Design, Development, Implementation, and Evaluation?';

  const mcOptions = (content.options as Array<{ text: string; isCorrect: boolean }>) || [
    { text: 'ADDIE Model', isCorrect: true },
    { text: 'Bloom’s Taxonomy', isCorrect: false },
    { text: 'Kirkpatrick Evaluation Framework', isCorrect: false },
    { text: 'Gagné’s Nine Events of Instruction', isCorrect: false },
  ];

  const mcExplanation =
    (content.explanation as string) ||
    'The ADDIE framework guides learning designers systematically from needs analysis through final outcome evaluation.';

  const mcCorrectFeedback = (content.correctFeedback as string) || (content.feedback as { correct?: string })?.correct || '';
  const mcIncorrectFeedback = (content.incorrectFeedback as string) || (content.feedback as { incorrect?: string })?.incorrect || '';

  const [selectedMCOption, setSelectedMCOption] = useState<number | null>(null);
  const [mcSubmitted, setMcSubmitted] = useState(false);

  const isMCCorrect = selectedMCOption !== null && mcOptions[selectedMCOption]?.isCorrect;

  const handleUpdateMCOption = (idx: number, text: string) => {
    const next = [...mcOptions];
    next[idx] = { ...next[idx], text };
    onChange({ ...content, options: next });
  };

  const handleSetMCCorrect = (idx: number) => {
    const next = mcOptions.map((opt, i) => ({ ...opt, isCorrect: i === idx }));
    onChange({ ...content, options: next });
  };

  const handleAddMCOption = () => {
    const next = [...mcOptions, { text: `New answer option ${mcOptions.length + 1}`, isCorrect: false }];
    onChange({ ...content, options: next });
  };

  const handleDeleteMCOption = (idx: number) => {
    if (mcOptions.length <= 2) return;
    const next = mcOptions.filter((_, i) => i !== idx);
    onChange({ ...content, options: next });
  };

  // -------------------------------------------------------------
  // 2. MULTIPLE RESPONSE
  // -------------------------------------------------------------
  const mrQuestion =
    (content.question as string) ||
    'Select all elements that contribute to effective universal design for learning (UDL):';

  const mrOptions = (content.options as Array<{ text: string; isCorrect: boolean }>) || [
    { text: 'Multiple means of representation (visual, auditory, tactile)', isCorrect: true },
    { text: 'Multiple means of action and expression for learners', isCorrect: true },
    { text: 'Single rigid path of assessment with no alternatives', isCorrect: false },
    { text: 'Multiple means of learner engagement and motivation', isCorrect: true },
  ];

  const [selectedMROptions, setSelectedMROptions] = useState<Record<number, boolean>>({});
  const [mrSubmitted, setMrSubmitted] = useState(false);

  const handleToggleMROption = (idx: number) => {
    if (mrSubmitted) return;
    setSelectedMROptions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const isMRCorrect =
    mrSubmitted &&
    mrOptions.every((opt, idx) => {
      const isSelected = !!selectedMROptions[idx];
      return opt.isCorrect ? isSelected : !isSelected;
    });

  const handleToggleMRCorrect = (idx: number) => {
    const next = [...mrOptions];
    next[idx] = { ...next[idx], isCorrect: !next[idx].isCorrect };
    onChange({ ...content, options: next });
  };

  // -------------------------------------------------------------
  // 3. FILL IN THE BLANK
  // -------------------------------------------------------------
  const fitbSentence =
    (content.sentence as string) ||
    'Effective instructional design aligns assessments directly with learning [blank] to measure mastery.';

  const fitbAnswers = (content.acceptedAnswers as string[]) || ['objectives', 'outcomes', 'goals'];
  const fitbCaseSensitive = (content.caseSensitive as boolean) || false;

  const [fitbInput, setFitbInput] = useState('');
  const [fitbSubmitted, setFitbSubmitted] = useState(false);

  const isFitbCorrect =
    fitbSubmitted &&
    fitbAnswers.some((ans) =>
      fitbCaseSensitive
        ? fitbInput.trim() === ans.trim()
        : fitbInput.trim().toLowerCase() === ans.trim().toLowerCase()
    );

  // -------------------------------------------------------------
  // 4. MATCHING
  // -------------------------------------------------------------
  interface MatchingPair {
    id: string;
    left: string;
    right: string;
  }

  const defaultMatchingPairs: MatchingPair[] = [
    { id: 'm-1', left: 'Formative Assessment', right: 'Ongoing checks for understanding during instruction' },
    { id: 'm-2', left: 'Summative Assessment', right: 'Evaluates cumulative student learning at the conclusion of a unit' },
    { id: 'm-3', left: 'Scaffolding', right: 'Temporary instructional support gradually removed as learners gain mastery' },
    { id: 'm-4', left: 'Cognitive Load', right: 'Total amount of mental effort being used in working memory' },
  ];

  const matchingPairs = (content.matchingPairs as MatchingPair[]) || defaultMatchingPairs;

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({}); // leftId -> rightId
  const [matchingSubmitted, setMatchingSubmitted] = useState(false);

  const handleSelectLeft = (id: string) => {
    if (matchingSubmitted) return;
    setSelectedLeft(id);
  };

  const handleSelectRight = (id: string) => {
    if (matchingSubmitted || !selectedLeft) return;
    setMatches((prev) => ({ ...prev, [selectedLeft]: id }));
    setSelectedLeft(null);
  };

  const isMatchingAllCorrect =
    matchingSubmitted &&
    matchingPairs.every((pair) => matches[pair.id] === pair.id);

  // -------------------------------------------------------------
  // RENDER FILL IN THE BLANK
  // -------------------------------------------------------------
  if (subtype === 'fill_in_blank') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Knowledge Check • Fill in the Blank</span>
        </div>

        {/* Prompt with underline input */}
        <div className="text-sm sm:text-base font-semibold text-gray-900 leading-relaxed">
          {fitbSentence.includes('[blank]') ? (
            <span>
              {fitbSentence.split('[blank]')[0]}
              <input
                type="text"
                value={fitbInput}
                disabled={fitbSubmitted}
                onChange={(e) => setFitbInput(e.target.value)}
                placeholder="Type answer here"
                className="inline-block mx-2 px-3 py-1 border-b-2 font-bold text-center outline-none focus:border-black transition-colors min-w-[140px] text-sky-700 bg-sky-50/50 rounded-t"
                style={{ borderColor: fitbInput.trim() ? accentColor : '#9ca3af' }}
              />
              {fitbSentence.split('[blank]')[1]}
            </span>
          ) : (
            <div className="space-y-3">
              <p>{fitbSentence}</p>
              <input
                type="text"
                value={fitbInput}
                disabled={fitbSubmitted}
                onChange={(e) => setFitbInput(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full max-w-md px-4 py-2 border rounded-xl font-medium outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          )}
        </div>

        {/* Edit mode helpers */}
        {!isLearnerMode && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-2">
            <div className="font-bold text-gray-700">Authoring Settings:</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Accepted Answers (comma-separated):</span>
              <input
                type="text"
                value={fitbAnswers.join(', ')}
                onChange={(e) =>
                  onChange({
                    ...content,
                    acceptedAnswers: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
                className="px-2 py-1 bg-white border border-gray-300 rounded text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fitb-case"
                checked={fitbCaseSensitive}
                onChange={(e) => onChange({ ...content, caseSensitive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="fitb-case" className="text-gray-600 cursor-pointer">
                Case sensitive matching
              </label>
            </div>
          </div>
        )}

        {/* Submit and Feedback */}
        <div className="flex items-center gap-3 pt-2">
          {!fitbSubmitted ? (
            <button
              type="button"
              disabled={!fitbInput.trim()}
              onClick={() => setFitbSubmitted(true)}
              className="px-8 py-2.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-xs hover:scale-102 disabled:opacity-40 transition-all cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFitbSubmitted(false);
                setFitbInput('');
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Take Again</span>
            </button>
          )}
        </div>

        {fitbSubmitted && (
          <div
            className={`p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-in fade-in duration-200 ${
              isFitbCorrect
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold flex items-center gap-2 mb-1.5">
              {isFitbCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Correct!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Incorrect. The correct answer is: {fitbAnswers.join(' or ')}</span>
                </>
              )}
            </div>
            <div>{mcExplanation}</div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER MATCHING
  // -------------------------------------------------------------
  if (subtype === 'matching') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Knowledge Check • Matching Activity</span>
        </div>

        <p className="text-xs sm:text-sm text-gray-600">
          Step 1: Select an item from the left column. Step 2: Select its matching definition from the right column:
        </p>

        {/* Two-Column Matching Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Terms</span>
            {matchingPairs.map((pair) => {
              const isSelected = selectedLeft === pair.id;
              const hasMatch = !!matches[pair.id];
              return (
                <button
                  type="button"
                  key={pair.id}
                  disabled={matchingSubmitted}
                  aria-pressed={isSelected}
                  aria-label={`Select term: ${pair.left}${hasMatch ? ' (Matched)' : ''}`}
                  onClick={() => handleSelectLeft(pair.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-black ${
                    isSelected
                      ? 'border-black bg-gray-50 shadow-xs scale-102 ring-1 ring-black'
                      : hasMatch
                      ? 'border-emerald-300 bg-emerald-50/40 text-emerald-900'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-800">{pair.left}</span>
                  {hasMatch && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Definitions</span>
            {matchingPairs.map((pair) => {
              const isMatchedToSelected = selectedLeft && matches[selectedLeft] === pair.id;
              const isMatchedByAny = Object.values(matches).includes(pair.id);
              return (
                <button
                  type="button"
                  key={pair.id}
                  disabled={matchingSubmitted}
                  aria-label={`Match with: ${pair.right}`}
                  onClick={() => handleSelectRight(pair.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left cursor-pointer text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black ${
                    isMatchedToSelected
                      ? 'border-black bg-gray-50 ring-1 ring-black'
                      : isMatchedByAny
                      ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800'
                      : selectedLeft
                      ? 'border-dashed border-gray-300 hover:border-black bg-gray-50/50'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {pair.right}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Controls */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          {!matchingSubmitted ? (
            <button
              type="button"
              disabled={Object.keys(matches).length < matchingPairs.length}
              onClick={() => setMatchingSubmitted(true)}
              className="px-8 py-2.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-xs hover:scale-102 disabled:opacity-40 transition-all cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Submit Matches
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMatchingSubmitted(false);
                setMatches({});
                setSelectedLeft(null);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Take Again</span>
            </button>
          )}
        </div>

        {matchingSubmitted && (
          <div
            className={`p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-in fade-in duration-200 ${
              isMatchingAllCorrect
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold flex items-center gap-2 mb-1.5">
              {isMatchingAllCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Perfect Match!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Some pairs were matched incorrectly. Review and try again!</span>
                </>
              )}
            </div>
            <div>{mcExplanation}</div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER MULTIPLE RESPONSE
  // -------------------------------------------------------------
  if (subtype === 'multiple_response') {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <HelpCircle className="w-4 h-4 text-sky-600" />
          <span>Knowledge Check • Multiple Response</span>
        </div>

        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => onChange({ ...content, question: e.currentTarget.innerText })}
          className="text-sm sm:text-base font-bold text-gray-900 leading-snug outline-none"
        >
          {mrQuestion}
        </div>

        <div className="space-y-3">
          {mrOptions.map((opt, idx) => {
            const isSelected = !!selectedMROptions[idx];
            return (
              <label
                key={idx}
                className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer select-none ${
                  mrSubmitted
                    ? opt.isCorrect
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                      : isSelected
                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                      : 'border-gray-200 bg-white text-gray-500 opacity-60'
                    : isSelected
                    ? 'border-black bg-gray-50 font-semibold'
                    : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                  <input
                    type="checkbox"
                    name={`kc-mr-${block.id}`}
                    disabled={mrSubmitted}
                    checked={isSelected}
                    onChange={() => handleToggleMROption(idx)}
                    className="sr-only peer"
                  />
                  <div
                    className="w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-black"
                    style={{
                      borderColor: isSelected ? accentColor : '#d1d5db',
                      backgroundColor: isSelected ? accentColor : '#ffffff',
                    }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>

                  <span
                    contentEditable={!isLearnerMode}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const next = [...mrOptions];
                      next[idx] = { ...next[idx], text: e.currentTarget.innerText };
                      onChange({ ...content, options: next });
                    }}
                    className="outline-none"
                  >
                    {opt.text}
                  </span>
                </div>

                {!isLearnerMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleMRCorrect(idx);
                    }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      opt.isCorrect
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {opt.isCorrect ? 'Correct Answer' : 'Incorrect'}
                  </button>
                )}
              </label>
            );
          })}
        </div>

        {/* Authoring custom feedback inputs for multiple response */}
        {!isLearnerMode && (
          <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 text-xs space-y-3">
            <div className="font-bold text-gray-700">Formative Feedback:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-emerald-700 block mb-1">Feedback when Correct</label>
                <input
                  type="text"
                  value={(content.correctFeedback as string) || ''}
                  onChange={(e) => onChange({ ...content, correctFeedback: e.target.value })}
                  placeholder="e.g. Correct! All applicable UDL elements identified."
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-rose-700 block mb-1">Feedback when Incorrect</label>
                <input
                  type="text"
                  value={(content.incorrectFeedback as string) || ''}
                  onChange={(e) => onChange({ ...content, incorrectFeedback: e.target.value })}
                  placeholder="e.g. UDL requires flexible pathways rather than rigid barriers."
                  className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit Button & Take Again */}
        <div className="flex items-center gap-3 pt-2">
          {!mrSubmitted ? (
            <button
              type="button"
              disabled={Object.values(selectedMROptions).filter(Boolean).length === 0}
              onClick={() => setMrSubmitted(true)}
              className="px-8 py-2.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-xs hover:scale-102 disabled:opacity-40 transition-all cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Submit
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMrSubmitted(false);
                setSelectedMROptions({});
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Take Again</span>
            </button>
          )}
        </div>

        {mrSubmitted && (
          <div
            className={`p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-in fade-in duration-200 ${
              isMRCorrect
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            <div className="font-bold flex items-center gap-2 mb-1.5">
              {isMRCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Correct! All correct options were selected.</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Incorrect. You must select all correct choices to pass.</span>
                </>
              )}
            </div>
            <div className="space-y-1">
              {isMRCorrect && (content.correctFeedback as string) && (
                <div className="font-medium text-emerald-800">{content.correctFeedback as string}</div>
              )}
              {!isMRCorrect && (content.incorrectFeedback as string) && (
                <div className="font-medium text-rose-800">{content.incorrectFeedback as string}</div>
              )}
              <div>{mcExplanation}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DEFAULT: MULTIPLE CHOICE
  // -------------------------------------------------------------
  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
        <HelpCircle className="w-4 h-4 text-sky-600" />
        <span>Knowledge Check • Multiple Choice</span>
      </div>

      <div
        contentEditable={!isLearnerMode}
        suppressContentEditableWarning
        onBlur={(e) => onChange({ ...content, question: e.currentTarget.innerText })}
        className="text-sm sm:text-base font-bold text-gray-900 leading-snug outline-none"
      >
        {mcQuestion}
      </div>

      <div className="space-y-3" role="radiogroup">
        {mcOptions.map((opt, idx) => {
          const isSelected = selectedMCOption === idx;
          return (
            <label
              key={idx}
              className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer select-none ${
                mcSubmitted
                  ? opt.isCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : isSelected
                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                    : 'border-gray-200 bg-white text-gray-500 opacity-60'
                  : isSelected
                  ? 'border-black bg-gray-50 font-semibold'
                  : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
                <input
                  type="radio"
                  name={`kc-mc-${block.id}`}
                  disabled={mcSubmitted}
                  checked={isSelected}
                  onChange={() => {
                    if (!mcSubmitted) setSelectedMCOption(idx);
                  }}
                  className="sr-only peer"
                />
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-black"
                  style={{
                    borderColor: isSelected ? accentColor : '#d1d5db',
                  }}
                >
                  {isSelected && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </div>

                <span
                  contentEditable={!isLearnerMode}
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateMCOption(idx, e.currentTarget.innerText)}
                  className="outline-none"
                >
                  {opt.text}
                </span>
              </div>

              {!isLearnerMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSetMCCorrect(idx);
                  }}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                    opt.isCorrect
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.isCorrect ? 'Correct Answer' : 'Set as Correct'}
                </button>
              )}
            </label>
          );
        })}
      </div>

      {!isLearnerMode && (
        <button
          type="button"
          onClick={handleAddMCOption}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Choice Option</span>
        </button>
      )}

      {/* Authoring custom feedback inputs for formative practice */}
      {!isLearnerMode && (
        <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100 text-xs space-y-3">
          <div className="font-bold text-gray-700 flex items-center gap-1.5">
            <span>Formative Feedback (Why it’s right or wrong):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-emerald-700 block mb-1">Feedback when Correct</label>
              <input
                type="text"
                value={mcCorrectFeedback}
                onChange={(e) => onChange({ ...content, correctFeedback: e.target.value })}
                placeholder="e.g. Great job! The ADDIE model provides..."
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-rose-700 block mb-1">Feedback when Incorrect</label>
              <input
                type="text"
                value={mcIncorrectFeedback}
                onChange={(e) => onChange({ ...content, incorrectFeedback: e.target.value })}
                placeholder="e.g. Note that Bloom's Taxonomy classifies cognitive levels..."
                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit Button & Take Again */}
      <div className="flex items-center gap-3 pt-2">
        {!mcSubmitted ? (
          <button
            type="button"
            disabled={selectedMCOption === null}
            onClick={() => setMcSubmitted(true)}
            className="px-8 py-2.5 rounded-full text-xs font-bold text-white uppercase tracking-wider shadow-xs hover:scale-102 disabled:opacity-40 transition-all cursor-pointer"
            style={{ backgroundColor: accentColor }}
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMcSubmitted(false);
              setSelectedMCOption(null);
            }}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-full border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Take Again</span>
          </button>
        )}
      </div>

      {mcSubmitted && (
        <div
          className={`p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed animate-in fade-in duration-200 ${
            isMCCorrect
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}
        >
          <div className="font-bold flex items-center gap-2 mb-1.5">
            {isMCCorrect ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Correct!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>Incorrect</span>
              </>
            )}
          </div>
          <div className="space-y-1">
            {isMCCorrect && mcCorrectFeedback && (
              <div className="font-medium text-emerald-800">{mcCorrectFeedback}</div>
            )}
            {!isMCCorrect && mcIncorrectFeedback && (
              <div className="font-medium text-rose-800">{mcIncorrectFeedback}</div>
            )}
            <div>{mcExplanation}</div>
          </div>
        </div>
      )}
    </div>
  );
}
