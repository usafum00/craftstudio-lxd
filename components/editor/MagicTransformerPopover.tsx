'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  HelpCircle,
  Wand2,
  ListOrdered,
  CreditCard,
  MessageSquare,
  RotateCcw,
  Check,
  Loader2,
  ChevronRight,
  Split,
  FileCheck2,
} from 'lucide-react';
import { Block } from '@/lib/types';

interface MagicTransformerPopoverProps {
  block: Block;
  lessonTitle?: string;
  onTransformBlock?: (blockId: string, newBlockData: Partial<Block>) => void;
  onInsertBlockBelow?: (afterBlockId: string, newBlock: Block) => void;
  onUpdateContent: (blockId: string, newContent: Record<string, unknown>) => void;
}

export function MagicTransformerPopover({
  block,
  lessonTitle = 'Operational Mastery',
  onTransformBlock,
  onInsertBlockBelow,
  onUpdateContent,
}: MagicTransformerPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = async (actionType: 'transform' | 'rewrite' | 'quiz', target: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      let payload: Record<string, unknown> = {};

      if (actionType === 'transform') {
        setLoadingAction(`Converting to ${target}...`);
        payload = {
          action: 'transform_block',
          targetSubtype: target,
          block,
        };
      } else if (actionType === 'rewrite') {
        setLoadingAction(`Rewriting tone (${target})...`);
        payload = {
          action: 'rewrite_block',
          tone: target,
          block,
        };
      } else if (actionType === 'quiz') {
        setLoadingAction('Generating scenario question with rationale...');
        payload = {
          action: 'generate_quiz_below',
          lessonTitle,
          block,
        };
      }

      const res = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'AI generation failed');
      }

      const response = await res.json();
      const generated = response.data;

      // Apply the generated result
      if (actionType === 'transform') {
        if (onTransformBlock) {
          onTransformBlock(block.id, {
            category: generated.category || 'interactive',
            subtype: generated.subtype || target,
            content: generated.content,
          });
        } else {
          onUpdateContent(block.id, generated.content);
        }
        setSuccessMsg(`Converted to ${target.replace('_', ' ')}!`);
      } else if (actionType === 'rewrite') {
        onUpdateContent(block.id, generated);
        setSuccessMsg('Tone rewritten & applied!');
      } else if (actionType === 'quiz') {
        const newQuizBlock: Block = {
          id: `blk-${Date.now()}-kc`,
          category: 'knowledge_check',
          subtype: generated.subtype || 'multiple_choice',
          content: generated.content,
          settings: {
            backgroundColor: 'white',
          },
        };
        if (onInsertBlockBelow) {
          onInsertBlockBelow(block.id, newQuizBlock);
          setSuccessMsg('Knowledge Check added below!');
        } else if (onTransformBlock) {
          onTransformBlock(block.id, newQuizBlock);
          setSuccessMsg('Replaced with Knowledge Check!');
        }
      }

      window.dispatchEvent(new Event('ai_credits_updated'));
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Transformation failed');
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button with High-Contrast Indigo & Amber accents */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
        className="btn-primary-indigo hover:opacity-95 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-indigo-500/30 group"
        title="✨ Magic LXD Transformer: Convert to interactive block, rewrite tone, or generate quiz"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
        <span className="tracking-tight text-white">✨ AI Transform</span>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200/90 py-2.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          {/* Header */}
          <div className="px-3.5 pb-2 mb-1.5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-[#115E59]/10 text-[#115E59] flex items-center justify-center">
                <Wand2 className="w-3 h-3 text-[#115E59]" />
              </div>
              <span className="font-extrabold text-xs text-zinc-900 tracking-tight">Magic LXD Transformer</span>
            </div>
            <span className="text-[10px] font-bold text-[#115E59] bg-[#115E59]/10 px-1.5 py-0.5 rounded-md">
              25 - 50 cr
            </span>
          </div>

          {/* Status notices */}
          {loading && (
            <div className="p-3 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2 text-xs text-[#115E59] font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
              <span>{loadingAction || 'Processing with Gemini...'}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border-b border-emerald-100">
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-semibold border-b border-rose-100">
              {errorMsg}
            </div>
          )}

          {/* Section 1: Convert to Interactive Block */}
          <div className="px-3 py-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Convert into Interactive Block (25 cr)
            </span>
            <div className="space-y-0.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('transform', 'accordion')}
                className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-[#FAF7F0] rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-[#115E59]" />
                  <span>Accordion (3–5 expandable panels)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('transform', 'tabs')}
                className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-[#FAF7F0] rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Split className="w-3.5 h-3.5 text-[#115E59]" />
                  <span>Tabs (Comparative breakdown)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('transform', 'process')}
                className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-[#FAF7F0] rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-3.5 h-3.5 text-[#115E59]" />
                  <span>Process Carousel (Step-by-step SOP)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('transform', 'sorting_activity')}
                className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-[#FAF7F0] rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5 text-[#115E59]" />
                  <span>Sorting Activity (Buckets & cards)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('transform', 'flashcards')}
                className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-[#FAF7F0] rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5 text-[#115E59]" />
                  <span>Flashcard Deck (Flip terms & rules)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('transform', 'scenario')}
                className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-[#FAF7F0] rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-[#115E59]" />
                  <span>Branching Scenario (Dilemma & feedback)</span>
                </div>
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
          </div>

          {/* Section 2: Generate Assessment */}
          <div className="px-3 py-1 border-t border-zinc-100 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Assessment (50 cr)
            </span>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAction('quiz', 'multiple_choice')}
              className="w-full px-2.5 py-1.5 text-left text-xs font-bold text-amber-900 bg-amber-50/70 hover:bg-amber-100/70 rounded-lg flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-3.5 h-3.5 text-[#F4B544]" />
                <span>Generate Knowledge Check Below</span>
              </div>
              <span className="text-[10px] text-amber-700 font-extrabold">+50 cr</span>
            </button>
          </div>

          {/* Section 3: Polish & Rewrite Tone */}
          <div className="px-3 py-1 border-t border-zinc-100 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">
              Polish & Rewrite Tone (25 cr)
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('rewrite', 'action_oriented')}
                className="p-1.5 text-left text-zinc-700 hover:bg-zinc-100 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                ⚡ Action-Oriented
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('rewrite', 'scenario_hook')}
                className="p-1.5 text-left text-zinc-700 hover:bg-zinc-100 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                🎣 Scenario Hook
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('rewrite', 'simplify_reading')}
                className="p-1.5 text-left text-zinc-700 hover:bg-zinc-100 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                📖 Simplify Reading
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAction('rewrite', 'expand_examples')}
                className="p-1.5 text-left text-zinc-700 hover:bg-zinc-100 rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                🔍 Add Examples
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
