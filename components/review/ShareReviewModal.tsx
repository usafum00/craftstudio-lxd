'use client';

import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Users,
  Shield,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface ShareReviewModalProps {
  courseId: string;
  courseTitle: string;
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export function ShareReviewModal({
  courseId,
  courseTitle,
  isOpen,
  onClose,
  accentColor = '#115E59',
}: ShareReviewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const reviewUrl = `${origin}/courses/${courseId}/preview?review=true`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const input = document.getElementById('review-url-input') as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Share for Peer Review</h2>
              <p className="text-xs text-gray-500 truncate max-w-xs">{courseTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* URL Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Dedicated Reviewer Link
            </label>
            <div className="flex items-center gap-2">
              <input
                id="review-url-input"
                type="text"
                readOnly
                value={reviewUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-gray-50 text-xs font-mono text-gray-800 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: copied ? '#10b981' : accentColor }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feature Highlights for Reviewers */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <span className="text-xs font-bold text-gray-900 block">
              What your co-instructional designer can do:
            </span>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Full Interactive Preview:</strong> Test lessons, interactive tabs, process blocks, and quizzes across Desktop, Tablet, and Mobile frames.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>ID Peer Review Comments Drawer:</strong> Post timestamped feedback, suggestions, and corrections pinned to specific lessons or blocks.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Protected & Clean:</strong> Reviewers cannot edit, move, or delete course content. No author passcode or account required.
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <a
              href={reviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Reviewer View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-black transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
