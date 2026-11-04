'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, BookOpen, HelpCircle, FolderPlus, GripVertical } from 'lucide-react';
import { LessonType } from '@/lib/types';

interface AddLessonRowProps {
  onAddLesson: (title: string, type: LessonType) => Promise<void>;
}

export function AddLessonRow({ onAddLesson }: AddLessonRowProps) {
  const [title, setTitle] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = title.trim();
      if (!trimmed || isSubmitting) return;

      const type: LessonType = e.shiftKey ? 'section' : 'lesson';
      setIsSubmitting(true);
      try {
        await onAddLesson(trimmed, type);
        setTitle('');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSelectType = async (type: LessonType) => {
    setDropdownOpen(false);
    const trimmed = title.trim() || (type === 'section' ? 'New Section' : type === 'quiz' ? 'New Quiz' : 'New Lesson');
    setIsSubmitting(true);
    try {
      await onAddLesson(trimmed, type);
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-white border border-gray-200 rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs hover:border-gray-300 transition-all focus-within:ring-2 focus-within:ring-gray-300 focus-within:border-gray-400">
        <div className="flex items-center gap-3 flex-1 mr-2">
          <div className="text-gray-300 p-0.5">
            <GripVertical className="w-4 h-4 opacity-40" />
          </div>

          <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
            <Plus className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a title..."
            disabled={isSubmitting}
            className="w-full text-xs font-medium text-gray-900 placeholder:text-gray-400 bg-transparent outline-none border-none py-1.5 focus:ring-0"
          />
        </div>

        {/* Right side: "Add Content" black pill button with dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={isSubmitting}
            className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <span>Add Content</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
              <button
                type="button"
                onClick={() => handleSelectType('lesson')}
                className="w-full px-3.5 py-2 text-left text-xs text-gray-800 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
              >
                <div className="p-1 rounded bg-sky-50 text-sky-600">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Lesson</div>
                  <div className="text-[10px] text-gray-400">Standard interactive content page</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('quiz')}
                className="w-full px-3.5 py-2 text-left text-xs text-gray-800 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
              >
                <div className="p-1 rounded bg-amber-50 text-amber-600">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Quiz</div>
                  <div className="text-[10px] text-gray-400">Graded assessment check</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectType('section')}
                className="w-full px-3.5 py-2 text-left text-xs text-gray-800 hover:bg-gray-50 flex items-center gap-2.5 transition-colors border-t border-gray-100"
              >
                <div className="p-1 rounded bg-gray-100 text-gray-600">
                  <FolderPlus className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold">Section Header</div>
                  <div className="text-[10px] text-gray-400">Organize lessons into modules</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Helpful keyboard hint */}
      <div className="px-2 mt-2 flex items-center gap-2 text-[11px] text-gray-400">
        <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-600">Enter</kbd> to add a lesson</span>
        <span>•</span>
        <span>Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-600">Shift + Enter</kbd> to add a section</span>
      </div>
    </div>
  );
}
