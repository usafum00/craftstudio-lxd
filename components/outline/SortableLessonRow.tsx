'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lesson, LessonType } from '@/lib/types';
import {
  GripVertical,
  BookOpen,
  HelpCircle,
  FolderOpen,
  MoreVertical,
  Trash2,
  Copy,
  RefreshCw,
  Edit2,
  Check,
} from 'lucide-react';

interface SortableLessonRowProps {
  lesson: Lesson;
  courseId: string;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateType: (id: string, type: LessonType) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function SortableLessonRow({
  lesson,
  courseId,
  onUpdateTitle,
  onUpdateType,
  onDelete,
  onDuplicate,
}: SortableLessonRowProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(lesson.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    setTitleValue(lesson.title);
  }, [lesson.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditing(false);
    if (titleValue.trim() && titleValue.trim() !== lesson.title) {
      onUpdateTitle(lesson.id, titleValue.trim());
    } else {
      setTitleValue(lesson.title);
    }
  };

  // Section Header Rendering
  if (lesson.type === 'section') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group mt-6 mb-2 flex items-center justify-between border-b border-gray-200 pb-2 px-1"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-300 hover:text-gray-500 p-0.5 rounded transition-colors touch-none"
            title="Drag to reorder section"
          >
            <GripVertical className="w-4 h-4" />
          </button>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                ref={inputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleValue(lesson.title);
                    setIsEditing(false);
                  }
                }}
                className="font-bold text-xs uppercase tracking-wider text-gray-800 bg-gray-50 border border-gray-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                onClick={handleTitleSubmit}
                className="text-emerald-600 hover:text-emerald-700 p-1"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <h4
              onClick={() => setIsEditing(true)}
              className="font-bold text-xs uppercase tracking-wider text-gray-700 cursor-pointer hover:text-black transition-colors truncate"
              title="Click to rename section"
            >
              {lesson.title}
            </h4>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            title="Rename section"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(lesson.id)}
            className="p-1 text-gray-400 hover:text-rose-600 rounded"
            title="Delete section"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Lesson or Quiz Row Rendering
  const isQuiz = lesson.type === 'quiz';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3.5 mb-2.5 flex items-center justify-between group transition-all duration-150 shadow-2xs hover:shadow-xs"
    >
      {/* Left: Drag Handle, Icon, Title, Subtitle */}
      <div className="flex items-center gap-3 flex-1 min-w-0 pr-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-300 hover:text-gray-600 p-0.5 rounded transition-colors touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isQuiz ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
          }`}
        >
          {isQuiz ? <HelpCircle className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
        </div>

        {/* Title and Subtitle */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTitleValue(lesson.title);
                    setIsEditing(false);
                  }
                }}
                className="text-xs font-semibold text-gray-900 bg-gray-50 border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                onClick={handleTitleSubmit}
                className="text-emerald-600 hover:text-emerald-700 p-1"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <div
                onClick={() => setIsEditing(true)}
                className="text-xs font-semibold text-gray-900 cursor-pointer hover:text-sky-600 transition-colors truncate"
                title="Click to rename"
              >
                {lesson.title}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5 capitalize">
                {isQuiz ? 'Quiz' : 'Lesson'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: "Edit Content" Pill Button & More Menu */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() =>
            router.push(
              isQuiz
                ? `/courses/${courseId}/quizzes/${lesson.id}`
                : `/courses/${courseId}/lessons/${lesson.id}`
            )
          }
          className="border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-xs font-medium px-4 py-1.5 rounded-full transition-colors cursor-pointer"
        >
          Edit Content
        </button>

        {/* 3-dots dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onUpdateType(lesson.id, isQuiz ? 'lesson' : 'quiz');
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                <span>Change to {isQuiz ? 'Lesson' : 'Quiz'}</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onUpdateType(lesson.id, 'section');
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                <span>Change to Section</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  setIsEditing(true);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(lesson.id);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Duplicate</span>
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(lesson.id);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-gray-100"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
