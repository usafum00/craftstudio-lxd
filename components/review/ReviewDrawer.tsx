'use client';

import React, { useState, useEffect } from 'react';
import { Lesson, ReviewComment, ReviewCommentCategory, ReviewCommentStatus } from '@/lib/types';
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  Bookmark,
  Trash2,
  RotateCcw,
  User,
  Filter,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ReviewDrawerProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  activeLessonId: string | null;
  onNavigateToLesson?: (lessonId: string) => void;
  accentColor?: string;
  isAuthorView?: boolean;
}

const CATEGORY_CONFIG: Record<
  ReviewCommentCategory,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  comment: {
    label: 'Observation',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: <MessageSquare className="w-3 h-3 text-blue-600" />,
  },
  suggestion: {
    label: 'ID Suggestion',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: <Sparkles className="w-3 h-3 text-amber-600" />,
  },
  correction: {
    label: 'Fix / Issue',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: <AlertCircle className="w-3 h-3 text-rose-600" />,
  },
  praise: {
    label: 'Kudos',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: <ThumbsUp className="w-3 h-3 text-emerald-600" />,
  },
};

export function ReviewDrawer({
  courseId,
  isOpen,
  onClose,
  lessons,
  activeLessonId,
  onNavigateToLesson,
  accentColor = '#ff5722',
  isAuthorView = false,
}: ReviewDrawerProps) {
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New comment inputs
  const [authorName, setAuthorName] = useState('Co-Instructional Designer');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<ReviewCommentCategory>('suggestion');
  const [targetLessonId, setTargetLessonId] = useState<string>(activeLessonId || 'general');

  // Filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'current' | 'open' | 'resolved'>('all');

  // Restore author name from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rise_reviewer_name');
      if (saved) {
        setAuthorName(saved);
      }
    }
  }, []);

  // Update target lesson when active lesson changes
  useEffect(() => {
    if (activeLessonId) {
      setTargetLessonId(activeLessonId);
    } else {
      setTargetLessonId('general');
    }
  }, [activeLessonId]);

  // Load comments
  const loadComments = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}/review-comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to load review comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, courseId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    const chosenLesson = lessons.find((l) => l.id === targetLessonId);
    const lessonTitle = chosenLesson ? chosenLesson.title : 'General Course Feedback';
    const finalLessonId = targetLessonId === 'general' ? null : targetLessonId;

    try {
      const res = await fetch(`/api/courses/${courseId}/review-comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: authorName.trim() || 'Co-Instructional Designer',
          content: content.trim(),
          category,
          lessonId: finalLessonId,
          lessonTitle,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
          setContent('');
          // Save reviewer name in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('rise_reviewer_name', authorName.trim());
          }
        }
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (comment: ReviewComment) => {
    const newStatus: ReviewCommentStatus = comment.status === 'open' ? 'resolved' : 'open';
    try {
      // Optimistic update
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, status: newStatus } : c))
      );

      const res = await fetch(`/api/courses/${courseId}/review-comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on error
        loadComments();
      }
    } catch {
      loadComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      await fetch(`/api/courses/${courseId}/review-comments/${commentId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete comment:', err);
      loadComments();
    }
  };

  // Filtered comments
  const filteredComments = comments.filter((c) => {
    if (activeTab === 'current') {
      if (activeLessonId) return c.lessonId === activeLessonId;
      return !c.lessonId;
    }
    if (activeTab === 'open') return c.status === 'open';
    if (activeTab === 'resolved') return c.status === 'resolved';
    return true;
  });

  const openCount = comments.filter((c) => c.status === 'open').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 text-gray-900 animate-in slide-in-from-right duration-200">
      {/* 1. Header */}
      <div className="h-16 px-5 border-b border-gray-200 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: accentColor }}
          >
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>ID Peer Review Feedback</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {openCount} Open
              </span>
            </h2>
            <p className="text-[11px] text-gray-500">
              {isAuthorView ? 'Feedback from your co-instructional designers' : 'Collaborative review & critique'}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          title="Close review drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Reviewer Name Strip */}
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200/80 flex items-center gap-2">
        <User className="w-3.5 h-3.5 text-gray-500" />
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          Reviewer:
        </span>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Your Name (e.g. Sarah Jenkins, ID)"
          className="flex-1 bg-transparent border-0 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-0 placeholder:text-gray-400"
        />
      </div>

      {/* 3. Filter Tabs */}
      <div className="px-5 pt-3 pb-2 flex items-center gap-1.5 border-b border-gray-100 bg-white">
        {[
          { id: 'all' as const, label: `All (${comments.length})` },
          { id: 'current' as const, label: 'This Lesson' },
          { id: 'open' as const, label: `Open (${openCount})` },
          { id: 'resolved' as const, label: 'Resolved' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Comments Stream & New Comment Form */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* New Comment Card */}
        <form
          onSubmit={handlePostComment}
          className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-gray-500" />
              <span>Target Lesson:</span>
            </span>

            <select
              value={targetLessonId}
              onChange={(e) => setTargetLessonId(e.target.value)}
              className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 max-w-[200px] truncate"
            >
              <option value="general">Course (General Feedback)</option>
              {lessons.map((l, idx) => (
                <option key={l.id} value={l.id}>
                  {idx + 1}. {l.title}
                </option>
              ))}
            </select>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(['suggestion', 'comment', 'correction', 'praise'] as ReviewCommentCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                    isSelected
                      ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-offset-1`
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {cfg.icon}
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Comment Textarea */}
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type constructive feedback, suggest revisions, or note question updates..."
            className="w-full text-xs p-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff5722] focus:border-transparent placeholder:text-gray-400 resize-none"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-gray-400">
              Saved directly to course review database
            </span>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-4 py-1.5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
            </button>
          </div>
        </form>

        {/* Stream of Comments */}
        <div className="space-y-3">
          {loading && comments.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
              Loading review comments...
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2 border-2 border-dashed border-gray-200 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
              <h3 className="text-xs font-bold text-gray-700">No review comments here</h3>
              <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                {activeTab === 'resolved'
                  ? 'No resolved comments yet.'
                  : activeTab === 'current'
                  ? 'No comments for this lesson yet. Leave feedback above!'
                  : 'Be the first to share instructional design thoughts on this course.'}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => {
              const cfg = CATEGORY_CONFIG[comment.category] || CATEGORY_CONFIG.comment;
              const isResolved = comment.status === 'resolved';

              return (
                <div
                  key={comment.id}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isResolved
                      ? 'bg-gray-50/70 border-gray-200 opacity-75'
                      : 'bg-white border-gray-200/90 shadow-2xs hover:border-gray-300'
                  }`}
                >
                  {/* Top Bar: Author, Timestamp, Category */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {comment.authorName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-gray-900 block truncate">
                          {comment.authorName}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                      >
                        {cfg.icon}
                        <span>{cfg.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Target Lesson Pill (Clickable) */}
                  {comment.lessonTitle && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-600 bg-slate-100/80 px-2 py-1 rounded-lg">
                      <Bookmark className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="truncate flex-1 font-medium">{comment.lessonTitle}</span>
                      {comment.lessonId && onNavigateToLesson && (
                        <button
                          type="button"
                          onClick={() => onNavigateToLesson(comment.lessonId!)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <span>Jump</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Comment Body */}
                  <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap font-normal">
                    {comment.content}
                  </div>

                  {/* Footer Actions: Resolve / Reopen / Delete */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(comment)}
                      className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        isResolved
                          ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          : 'text-gray-500 hover:text-emerald-700 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isResolved ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span>{isResolved ? 'Resolved (Reopen)' : 'Mark as Resolved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                      title="Delete comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
