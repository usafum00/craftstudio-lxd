'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/lib/types';
import { BookOpen, Zap, MoreVertical, Copy, Trash2, Download } from 'lucide-react';

interface CourseCardProps {
  course: Course;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename?: (id: string, currentTitle: string) => void;
}

const getCourseGradient = (id: string, type: string) => {
  if (type === 'microlearning') {
    return 'from-amber-500 via-orange-500 to-rose-500';
  }
  const gradients = [
    'from-[#115E59] via-[#0E4B47] to-[#172B35]',
    'from-slate-900 via-indigo-950 to-blue-900',
    'from-teal-700 via-emerald-800 to-slate-900',
    'from-blue-600 via-indigo-600 to-violet-700',
    'from-violet-700 via-purple-800 to-indigo-900',
    'from-sky-600 via-blue-700 to-indigo-950',
  ];
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return gradients[sum % gradients.length];
};

export function CourseCard({ course, onDuplicate, onDelete, onRename }: CourseCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMaster = [
    'course-social-eng',
    'course-conflict',
    'course-ask-boss',
    'course-perf',
    'micro-spot-phish',
    'micro-better-naps',
    'course-articulate-ai',
  ].includes(course.id);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAdmin(localStorage.getItem('lxd_admin_unlocked') === 'true');
      const handler = () => {
        setIsAdmin(localStorage.getItem('lxd_admin_unlocked') === 'true');
      };
      window.addEventListener('admin_status_changed', handler);
      return () => window.removeEventListener('admin_status_changed', handler);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCardClick = () => {
    router.push(`/courses/${course.id}`);
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const diffMs = Date.now() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return 'Updated 1 hour ago';
      if (diffHours < 24) return `Updated ${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Updated 1 day ago';
      return `Updated ${diffDays} days ago`;
    } catch {
      return 'Updated recently';
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between cursor-pointer group relative"
    >
      {/* Thumbnail area with fallback gradient */}
      <div className="aspect-[16/9] w-full relative bg-gray-100 overflow-hidden select-none">
        {course.coverImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.coverImage}
            alt=""
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-tr ${getCourseGradient(course.id, course.type)} flex flex-col items-center justify-center p-4 text-center relative overflow-hidden group-hover:scale-105 transition-transform duration-300`}
          >
            {/* Ambient background glows */}
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-black/20 blur-xl pointer-events-none" />

            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-2 shadow-sm">
              {course.type === 'microlearning' ? (
                <Zap className="w-5 h-5 text-amber-200" />
              ) : (
                <BookOpen className="w-5 h-5 text-sky-200" />
              )}
            </div>
            <span className="text-white font-bold text-xs line-clamp-1 px-4 drop-shadow-sm">
              {course.title}
            </span>
            <span className="text-white/70 text-[10px] uppercase tracking-wider font-medium mt-0.5">
              {course.type === 'microlearning' ? 'Microlearning' : 'Course'}
            </span>
          </div>
        )}

        {/* Avatar overlay */}
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#ec4899] text-white flex items-center justify-center font-bold text-[10px] shadow-md ring-2 ring-white z-10">
          {course.authorAvatar || 'MA'}
        </div>

        {/* 3-dots actions menu button */}
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2.5 right-2.5"
        >
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
            title="Course actions"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(course.id);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Duplicate to Sandbox</span>
              </button>
              <a
                href={`/api/courses/${course.id}/export-json`}
                onClick={() => setMenuOpen(false)}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                <span>Export JSON Backup</span>
              </a>
              {(!isMaster || isAdmin) ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
                      onDelete(course.id);
                    }
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete</span>
                </button>
              ) : (
                <div
                  className="w-full px-3 py-1.5 text-left text-[11px] text-gray-400 flex items-center gap-1.5 border-t border-gray-100 select-none bg-gray-50/50"
                  title="Master showcase courses are protected. Duplicate to edit or delete."
                >
                  <span>🔒 Master Protected</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          {/* Course type & lesson count */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1.5">
            {course.type === 'microlearning' ? (
              <span className="text-amber-600 flex items-center gap-1 font-semibold">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Microlearning
              </span>
            ) : (
              <span className="text-sky-700 flex items-center gap-1.5 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                Course • {course.lessonCount ?? 0} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-xs leading-snug text-gray-900 line-clamp-2 min-h-[2rem] group-hover:text-sky-600 transition-colors">
            {course.title}
          </h3>

          {/* Timestamp */}
          <div className="text-[11px] text-gray-400 mt-2 font-normal">
            {formatTimeAgo(course.updatedAt)}
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          {course.status === 'published' ? (
            course.hasUnpublishedChanges ? (
              <span className="inline-block bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Published (Unpublished Changes)
              </span>
            ) : (
              <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Published
              </span>
            )
          ) : (
            <span className="inline-block bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Draft
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
