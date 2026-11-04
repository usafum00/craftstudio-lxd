'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Course, Lesson, LessonType, ThemeSettings, PublishSettings } from '@/lib/types';
import { OutlineTopBar } from '@/components/outline/OutlineTopBar';
import { SortableLessonRow } from '@/components/outline/SortableLessonRow';
import { AddLessonRow } from '@/components/outline/AddLessonRow';
import { ThemeSettingsModal } from '@/components/outline/ThemeSettingsModal';
import { PublishModal } from '@/components/publish/PublishModal';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';
import { ReviewDrawer } from '@/components/review/ReviewDrawer';
import { Camera, Image as ImageIcon, Check, Loader2 } from 'lucide-react';

export default function CourseOutlinePage({ params }: { params: Promise<{ courseId: string }> }) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.courseId;
  const router = useRouter();

  const [course, setCourse] = useState<(Course & { lessons: Lesson[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Title & description local state for auto-save
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'theme' | 'settings'>('theme');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // Undo / Redo History Stack
  const [lessonHistory, setLessonHistory] = useState<Lesson[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      if (data.course) {
        setCourse(data.course);
        setTitle(data.course.title);
        setDescription(data.course.description || '');
        if (data.course.lessons) {
          setLessonHistory([data.course.lessons]);
          setHistoryIndex(0);
        }
      }
    } catch (err) {
      console.error('Failed to load course', err);
    } finally {
      setLoading(false);
    }
  };

  const pushHistory = (newLessons: Lesson[]) => {
    setLessonHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newLessons];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = async () => {
    if (historyIndex > 0 && course) {
      const prevLessons = lessonHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setCourse({ ...course, lessons: prevLessons });
      await fetch(`/api/courses/${courseId}/lessons/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonIds: prevLessons.map((l) => l.id) }),
      });
    }
  };

  const handleRedo = async () => {
    if (historyIndex < lessonHistory.length - 1 && course) {
      const nextLessons = lessonHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setCourse({ ...course, lessons: nextLessons });
      await fetch(`/api/courses/${courseId}/lessons/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonIds: nextLessons.map((l) => l.id) }),
      });
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    async function loadCommentStats() {
      try {
        const res = await fetch(`/api/courses/${courseId}/review-comments`);
        if (res.ok) {
          const data = await res.json();
          const open = (data.comments || []).filter((c: { status: string }) => c.status === 'open').length;
          setCommentsCount(open);
        }
      } catch {}
    }
    loadCommentStats();
    const interval = setInterval(loadCommentStats, 8000);
    return () => clearInterval(interval);
  }, [courseId]);

  // Auto-save Course Title and Description on debounce
  const updateCourseMeta = async (newTitle: string, newDesc: string) => {
    if (!course) return;
    try {
      setSavingStatus('saving');
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
        }),
      });
      if (res.ok) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      }
    } catch (err) {
      console.error('Failed to update course meta', err);
      setSavingStatus('idle');
    }
  };

  const handleTitleBlur = () => {
    if (course && title !== course.title) {
      updateCourseMeta(title, description);
    }
  };

  const handleDescriptionBlur = () => {
    if (course && description !== course.description) {
      updateCourseMeta(title, description);
    }
  };

  // Reorder lessons with drag and drop
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!course || !over || active.id === over.id) return;

    const oldIndex = course.lessons.findIndex((l) => l.id === active.id);
    const newIndex = course.lessons.findIndex((l) => l.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newLessons = arrayMove(course.lessons, oldIndex, newIndex);
      setCourse({ ...course, lessons: newLessons });
      pushHistory(newLessons);

      try {
        await fetch(`/api/courses/${courseId}/lessons/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lessonIds: newLessons.map((l) => l.id),
          }),
        });
      } catch (err) {
        console.error('Failed to persist lesson order', err);
        // revert on failure
        fetchCourse();
      }
    }
  };

  // Add lesson, quiz, or section
  const handleAddLesson = async (lessonTitle: string, type: LessonType) => {
    if (!course) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lessonTitle,
          type,
          sortOrder: course.lessons.length,
          blocks: [],
        }),
      });
      const data = await res.json();
      if (data.lesson) {
        const nextLessons = [...course.lessons, data.lesson];
        setCourse({
          ...course,
          lessons: nextLessons,
          lessonCount: (course.lessonCount || 0) + 1,
        });
        pushHistory(nextLessons);
      }
    } catch (err) {
      console.error('Failed to add lesson', err);
    }
  };

  // Update lesson title
  const handleUpdateLessonTitle = async (lessonId: string, newTitle: string) => {
    if (!course) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setCourse({
          ...course,
          lessons: course.lessons.map((l) => (l.id === lessonId ? { ...l, title: newTitle } : l)),
        });
      }
    } catch (err) {
      console.error('Failed to rename lesson', err);
    }
  };

  // Update lesson type (convert between lesson/quiz/section)
  const handleUpdateLessonType = async (lessonId: string, newType: LessonType) => {
    if (!course) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType }),
      });
      if (res.ok) {
        setCourse({
          ...course,
          lessons: course.lessons.map((l) => (l.id === lessonId ? { ...l, type: newType } : l)),
        });
      }
    } catch (err) {
      console.error('Failed to change lesson type', err);
    }
  };

  // Delete lesson
  const handleDeleteLesson = async (lessonId: string) => {
    if (!course) return;
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const nextLessons = course.lessons.filter((l) => l.id !== lessonId);
        setCourse({
          ...course,
          lessons: nextLessons,
          lessonCount: Math.max(0, (course.lessonCount || 1) - 1),
        });
        pushHistory(nextLessons);
      }
    } catch (err) {
      console.error('Failed to delete lesson', err);
    }
  };

  // Duplicate lesson
  const handleDuplicateLesson = async (lessonId: string) => {
    if (!course) return;
    const target = course.lessons.find((l) => l.id === lessonId);
    if (!target) return;

    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${target.title} (Copy)`,
          type: target.type,
          blocks: target.blocks,
          sortOrder: course.lessons.length,
        }),
      });
      const data = await res.json();
      if (data.lesson) {
        const nextLessons = [...course.lessons, data.lesson];
        setCourse({
          ...course,
          lessons: nextLessons,
          lessonCount: (course.lessonCount || 0) + 1,
        });
        pushHistory(nextLessons);
      }
    } catch (err) {
      console.error('Failed to duplicate lesson', err);
    }
  };

  // Toggle publish status
  const handleTogglePublish = async () => {
    if (!course) return;
    const newStatus = course.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCourse({ ...course, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to toggle publish', err);
    }
  };

  // Save Theme & Settings modal
  const handleSaveThemeSettings = async (newTheme: ThemeSettings, newPublish: PublishSettings) => {
    if (!course) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeSettings: newTheme,
          publishSettings: newPublish,
        }),
      });
      if (res.ok) {
        setCourse({
          ...course,
          themeSettings: newTheme,
          publishSettings: newPublish,
        });
      }
    } catch (err) {
      console.error('Failed to save theme settings', err);
    }
  };

  // Cover image upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !course) return;

    try {
      setUploadingCover(true);
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (data.url) {
        const updateRes = await fetch(`/api/courses/${courseId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ coverImage: data.url }),
        });
        if (updateRes.ok) {
          setCourse({ ...course, coverImage: data.url });
        }
      }
    } catch (err) {
      console.error('Failed to upload cover image', err);
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <span className="text-xs text-gray-400 font-medium">Loading Course Outline...</span>
      </div>
    );
  }

  if (!course) return null;

  const accentColor = course.themeSettings?.accentColor || '#ff5722';

  return (
    <div className="min-h-screen bg-gray-50/60 pb-24">
      {/* Top Utility Bar */}
      <OutlineTopBar
        courseId={courseId}
        courseTitle={title}
        onOpenThemeModal={() => {
          setModalTab('theme');
          setModalOpen(true);
        }}
        onOpenSettingsModal={() => {
          setModalTab('settings');
          setModalOpen(true);
        }}
        onPublish={() => setPublishModalOpen(true)}
        isPublished={course.status === 'published'}
        hasUnpublishedChanges={Boolean(course.hasUnpublishedChanges)}
        lastPublishedAt={course.lastPublishedAt}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < lessonHistory.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onRestoreSnapshot={fetchCourse}
        onToggleComments={() => setCommentsDrawerOpen(!commentsDrawerOpen)}
        commentsCount={commentsCount}
      />

      {/* Main Centered Document Outline Container */}
      <main className="max-w-3xl mx-auto mt-8 bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden p-8 sm:p-12 transition-all">
        {/* Cover Photo Header */}
        <div className="relative group mb-8 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
          {course.coverImage ? (
            <div className="aspect-[21/9] w-full relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={course.coverImage}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className="bg-white/95 hover:bg-white text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-600" />
                  <span>Media Studio & Cover Photo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl">
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
                <span>Media Studio & Add Cover</span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>

        {/* Course Header Area */}
        <div className="space-y-4">
          {/* Auto-save status indicator */}
          <div className="h-4 flex items-center gap-1.5 text-[11px] text-gray-400">
            {savingStatus === 'saving' && (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                <span>Saving outline changes...</span>
              </>
            )}
            {savingStatus === 'saved' && (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 font-medium">All changes saved locally</span>
              </>
            )}
          </div>

          {/* Inline Editable Course Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Course Title"
            className="w-full text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight outline-none border-b border-transparent hover:border-gray-200 focus:border-sky-500 pb-1 transition-colors bg-transparent"
          />

          {/* Author Badge Row */}
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-7 h-7 rounded-full bg-[#ec4899] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {course.authorAvatar || 'MA'}
            </div>
            <span className="text-xs font-semibold text-gray-700">
              {course.authorName || 'Mike Afurong'}
            </span>
          </div>

          {/* Thick Horizontal Brand Accent Bar */}
          <div
            className="w-full h-1.5 rounded-full transition-colors duration-300"
            style={{ backgroundColor: accentColor }}
          />

          {/* Inline Editable Course Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Describe your course..."
            rows={2}
            className="w-full text-xs sm:text-sm text-gray-600 placeholder:text-gray-400 leading-relaxed outline-none border-b border-transparent hover:border-gray-200 focus:border-sky-500 pb-1 transition-colors resize-none bg-transparent"
          />
        </div>

        {/* Outline List (Sortable Lessons & Quizzes) */}
        <div className="mt-10">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={course.lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {course.lessons.map((lesson) => (
                  <SortableLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    courseId={courseId}
                    onUpdateTitle={handleUpdateLessonTitle}
                    onUpdateType={handleUpdateLessonType}
                    onDelete={handleDeleteLesson}
                    onDuplicate={handleDuplicateLesson}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Lesson Creation Mechanics Row */}
          <AddLessonRow onAddLesson={handleAddLesson} />
        </div>
      </main>

      {/* Theme & Settings Modal */}
      <ThemeSettingsModal
        isOpen={modalOpen}
        initialTab={modalTab}
        themeSettings={course.themeSettings}
        publishSettings={course.publishSettings}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveThemeSettings}
      />

      {/* Publish Modal */}
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        course={course}
        onPublishSuccess={() => {
          setCourse({ ...course, status: 'published' });
        }}
      />

      {/* Unified Media Modal */}
      <UnifiedMediaModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelect={async (url) => {
          if (!course) return;
          setCourse({ ...course, coverImage: url });
          await fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coverImage: url }),
          });
        }}
        currentUrl={course.coverImage || ''}
        accentColor={accentColor}
      />

      {/* ID Peer Review Comments Drawer */}
      <ReviewDrawer
        courseId={courseId}
        isOpen={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        lessons={course.lessons}
        activeLessonId={null}
        onNavigateToLesson={(lessonId) => {
          router.push(`/courses/${courseId}/lessons/${lessonId}`);
        }}
        accentColor={accentColor}
        isAuthorView={true}
      />
    </div>
  );
}
