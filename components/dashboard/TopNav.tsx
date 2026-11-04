'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, BookOpen, Zap, Upload, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { CourseType } from '@/lib/types';
import { LearnByCraftMark } from '@/components/brand/LearnByCraftLogo';
import { AICourseArchitectModal } from '@/components/dashboard/AICourseArchitectModal';

interface TopNavProps {
  onCreateNew: (type: CourseType) => void;
  onImportSuccess?: (importedCourseId?: string) => void;
}

export function TopNav({ onCreateNew, onImportSuccess }: TopNavProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [aiArchitectOpen, setAiArchitectOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportError(null);
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch('/api/courses/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to import course JSON');
      }

      const result = await res.json();
      if (onImportSuccess) {
        onImportSuccess(result.course?.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid course JSON file';
      setImportError(msg);
      setTimeout(() => setImportError(null), 5000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <header className="h-14 bg-white border-b border-zinc-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="p-1 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
          <LearnByCraftMark className="w-5 h-5" theme="light" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-zinc-900 text-sm tracking-tight">Learn<span className="text-indigo-600">By</span>Craft</span>
          <span className="text-[10px] font-black tracking-wider text-indigo-700 uppercase bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-md">AUTHORING TOOL</span>
        </div>
        {importError && (
          <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Hidden file input for course JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Import Course JSON Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          title="Import course from JSON backup file"
        >
          {isImporting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
          ) : (
            <Upload className="w-3.5 h-3.5 text-zinc-500" />
          )}
          <span>{isImporting ? 'Importing...' : 'Import Course'}</span>
        </button>

        {/* AI Co-Pilot Course Architect Button */}
        <button
          onClick={() => setAiArchitectOpen(true)}
          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          title="Build full interactive course from SOP or topic using AI Co-Pilot"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span className="font-bold text-xs text-indigo-700">Build with AI Co-Pilot</span>
        </button>

        {/* Create New Course Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
            className="btn-primary-indigo hover:opacity-95 active:scale-[0.98] text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
            <span className="text-white text-xs font-bold tracking-tight">Create new</span>
            <ChevronDown className={`w-3.5 h-3.5 text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onCreateNew('course');
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors"
              >
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">Course</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    A multi-lesson, responsive course for in-depth learning.
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onCreateNew('microlearning');
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors border-t border-gray-100"
              >
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-xs text-gray-900">Microlearning</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    A single-topic, focused learning experience.
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Course Architect Modal */}
      <AICourseArchitectModal
        isOpen={aiArchitectOpen}
        onClose={() => setAiArchitectOpen(false)}
      />
    </header>
  );
}
