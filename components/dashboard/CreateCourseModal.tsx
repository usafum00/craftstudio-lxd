'use client';

import React, { useState } from 'react';
import { CourseType } from '@/lib/types';
import { X, BookOpen, Zap } from 'lucide-react';

interface CreateCourseModalProps {
  isOpen: boolean;
  type: CourseType;
  onClose: () => void;
  onSubmit: (title: string, type: CourseType) => Promise<void>;
}

export function CreateCourseModal({ isOpen, type, onClose, onSubmit }: CreateCourseModalProps) {
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), type);
      setTitle('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${type === 'course' ? 'bg-teal-50 text-[#115E59]' : 'bg-amber-50 text-amber-700'}`}>
              {type === 'course' ? <BookOpen className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Create new {type === 'course' ? 'Course' : 'Microlearning'}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {type === 'course' ? 'Multi-lesson responsive learning experience' : 'Single-topic focused bite'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Title
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'course' ? 'e.g. Cybersecurity Fundamentals for Hybrid Teams' : 'e.g. 3 Steps to Spot Phishing'}
            className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#115E59] focus:border-[#115E59] transition-all"
          />

          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="px-5 py-2 rounded-full text-xs font-semibold bg-[#115E59] text-white hover:bg-[#0D4C47] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create & Outline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
