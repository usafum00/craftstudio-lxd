'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { Course, Lesson, QuizQuestion, QuizSettings } from '@/lib/types';
import { normalizeQuizQuestions, calculateQuizScore, isQuestionAnswered } from '@/lib/quiz-utils';
import { getContrastTextColor, getContrastSubtextColor } from '@/lib/color-utils';
import { TextBlock } from '@/components/editor/blocks/TextBlock';
import { StatementBlock } from '@/components/editor/blocks/StatementBlock';
import { QuoteBlock } from '@/components/editor/blocks/QuoteBlock';
import { ListBlock } from '@/components/editor/blocks/ListBlock';
import { ImageBlock } from '@/components/editor/blocks/ImageBlock';
import { GalleryBlock } from '@/components/editor/blocks/GalleryBlock';
import { MultimediaBlock } from '@/components/editor/blocks/MultimediaBlock';
import { VideoBlock } from '@/components/editor/blocks/VideoBlock';
import { DividerBlock } from '@/components/editor/blocks/DividerBlock';
import { CodeBlock } from '@/components/editor/blocks/CodeBlock';
import { InteractiveBlock } from '@/components/editor/blocks/InteractiveBlock';
import { KnowledgeCheckBlock } from '@/components/editor/blocks/KnowledgeCheckBlock';
import { SurveyBlock } from '@/components/editor/blocks/SurveyBlock';
import { ChartBlock } from '@/components/editor/blocks/ChartBlock';
import { ReviewDrawer } from '@/components/review/ReviewDrawer';
import { Users, MessageSquare } from 'lucide-react';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle2,
  Circle,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Loader2,
  Lock,
  RotateCcw,
  BookOpen,
  HelpCircle,
  ArrowRight,
  AlertCircle,
  Download,
  Share2,
} from 'lucide-react';

type DeviceMode = 'desktop' | 'tablet_landscape' | 'tablet_portrait' | 'mobile_landscape' | 'mobile_portrait';

type QuizAnswerValue = string | number | boolean | string[] | Record<string, string> | null;

export default function CourseReviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { courseId } = resolvedParams;

  const [course, setCourse] = useState<(Course & { lessons: Lesson[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Active view: null means the Course Cover Page is displayed; string is the active lesson ID
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Learner Progress State
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [lessonScrollProgress, setLessonScrollProgress] = useState<Record<string, number>>({});
  const [unlockedContinueIds, setUnlockedContinueIds] = useState<Set<string>>(new Set());
  const [completedInteractions, setCompletedInteractions] = useState<Set<string>>(new Set());

  // Standalone Quiz player state per quiz lesson
  const [quizAnswers, setQuizAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<Record<string, boolean>>({});
  const [quizCurrentQIdx, setQuizCurrentQIdx] = useState<number>(0);
  const [quizValidationError, setQuizValidationError] = useState<string | null>(null);
  const [quizScores, setQuizScores] = useState<
    Record<string, { earned: number; total: number; percent: number; passed: boolean }>
  >({});

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [searchTerm, setSearchTerm] = useState('');
  // Review Drawer state
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(true);
  const [openCommentsCount, setOpenCommentsCount] = useState<number>(0);


  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load review comments count
  useEffect(() => {
    async function fetchCommentStats() {
      try {
        const res = await fetch(`/api/courses/${courseId}/review-comments`);
        if (res.ok) {
          const data = await res.json();
          const openCount = (data.comments || []).filter((c: { status: string }) => c.status === "open").length;
          setOpenCommentsCount(openCount);
        }
      } catch {}
    }
    fetchCommentStats();
    const interval = setInterval(fetchCommentStats, 8000);
    return () => clearInterval(interval);
  }, [courseId]);


  // 1. Load course data and restore progress from localStorage
  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}`);
        const data = await res.json();
        if (data.course) {
          setCourse(data.course);

          // Restore progress from localStorage
          const savedProgress = localStorage.getItem(`rise_progress_review_${courseId}`);
          if (savedProgress) {
            try {
              const parsed = JSON.parse(savedProgress);
              if (parsed.completedLessons) {
                setCompletedLessons(new Set(parsed.completedLessons));
              }
              if (parsed.lessonScrollProgress) {
                setLessonScrollProgress(parsed.lessonScrollProgress);
              }
              if (parsed.unlockedContinueIds) {
                setUnlockedContinueIds(new Set(parsed.unlockedContinueIds));
              }
              if (parsed.completedInteractions) {
                setCompletedInteractions(new Set(parsed.completedInteractions));
              }
              if (parsed.quizScores) {
                setQuizScores(parsed.quizScores);
              }
            } catch (e) {
              console.warn('Failed to parse saved learner progress', e);
            }
          }

          // Check for deep-link URL parameter ?lessonId=...
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const paramLessonId = urlParams.get('lessonId');
            if (paramLessonId) {
              setActiveLessonId(paramLessonId);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load course preview', err);
      } finally {
        setLoading(false);
      }
    }
    loadCourse();
  }, [courseId]);

  // 2. Persist progress changes to localStorage
  const saveProgressToLocalStorage = (
    updatedCompleted: Set<string>,
    updatedScroll: Record<string, number>,
    updatedContinues: Set<string>,
    updatedInteractions: Set<string>,
    updatedQuizScores: Record<
      string,
      { earned: number; total: number; percent: number; passed: boolean }
    >
  ) => {
    try {
      localStorage.setItem(
        `rise_progress_review_${courseId}`,
        JSON.stringify({
          completedLessons: Array.from(updatedCompleted),
          lessonScrollProgress: updatedScroll,
          unlockedContinueIds: Array.from(updatedContinues),
          completedInteractions: Array.from(updatedInteractions),
          quizScores: updatedQuizScores,
        })
      );
    } catch (e) {
      console.warn('Failed to persist progress', e);
    }
  };

  const handleLessonChange = (targetLessonId: string | null) => {
    setActiveLessonId(targetLessonId);
    setQuizCurrentQIdx(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 3. Reset Learner Progress handler
  const handleResetProgress = () => {
    setCompletedLessons(new Set());
    setLessonScrollProgress({});
    setUnlockedContinueIds(new Set());
    setCompletedInteractions(new Set());
    setQuizAnswers({});
    setQuizSubmitted({});
    setQuizCurrentQIdx(0);
    setQuizScores({});
    setActiveLessonId(null);
    try {
      localStorage.removeItem(`rise_progress_review_${courseId}`);
    } catch {}
  };

  // 4. Scroll-spy tracking in lesson view
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!activeLessonId) return;

    const el = e.currentTarget;
    const scrollableHeight = el.scrollHeight - el.clientHeight;
    if (scrollableHeight <= 0) return;

    const currentScroll = el.scrollTop;
    const percent = Math.min(100, Math.round((currentScroll / scrollableHeight) * 100));

    // Update current lesson scroll depth
    const existing = lessonScrollProgress[activeLessonId] || 0;
    if (percent > existing) {
      const nextScroll = { ...lessonScrollProgress, [activeLessonId]: percent };
      setLessonScrollProgress(nextScroll);

      // If learner reached near bottom (>90%), mark as completed
      if (percent >= 90 && !completedLessons.has(activeLessonId)) {
        const nextCompleted = new Set(completedLessons).add(activeLessonId);
        setCompletedLessons(nextCompleted);
        saveProgressToLocalStorage(
          nextCompleted,
          nextScroll,
          unlockedContinueIds,
          completedInteractions,
          quizScores
        );
      } else {
        saveProgressToLocalStorage(
          completedLessons,
          nextScroll,
          unlockedContinueIds,
          completedInteractions,
          quizScores
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <span className="text-xs text-gray-400 font-medium">Loading Player Preview...</span>
      </div>
    );
  }

  if (!course) return null;

  const accentColor = course.themeSettings?.accentColor || '#ff5722';
  const heroTextColor = getContrastTextColor(accentColor);
  const heroSubtextColor = getContrastSubtextColor(accentColor);

  const playableLessons = (course.lessons || []).filter((l) => l.type !== 'section');
  const activeLesson = activeLessonId
    ? course.lessons?.find((l) => l.id === activeLessonId) || null
    : null;

  const currentIndex = playableLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = currentIndex > 0 ? playableLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < playableLessons.length - 1
      ? playableLessons[currentIndex + 1]
      : null;

  // Overall course completion percentage
  const totalPlayable = playableLessons.length;
  const completedCount = completedLessons.size;
  const progressPercent = totalPlayable > 0 ? Math.round((completedCount / totalPlayable) * 100) : 0;

  // Navigation mode check
  const isRestricted = course.publishSettings?.navigationMode === 'restricted';

  const isLessonLocked = (lessonId: string, idx: number) => {
    if (!isRestricted || idx === 0) return false;
    // In restricted mode, lesson is locked if the previous lesson is not completed
    const prevPlayable = playableLessons[idx - 1];
    return prevPlayable ? !completedLessons.has(prevPlayable.id) : false;
  };

  // Continue Gating handler
  const handleUnlockContinue = (blockId: string) => {
    const next = new Set(unlockedContinueIds).add(blockId);
    setUnlockedContinueIds(next);
    saveProgressToLocalStorage(
      completedLessons,
      lessonScrollProgress,
      next,
      completedInteractions,
      quizScores
    );
  };

  // Complete and Next navigation
  const handleCompleteAndNext = () => {
    let nextCompleted = completedLessons;
    if (activeLessonId) {
      nextCompleted = new Set(completedLessons).add(activeLessonId);
      setCompletedLessons(nextCompleted);
    }

    if (nextLesson) {
      setActiveLessonId(nextLesson.id);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }

    saveProgressToLocalStorage(
      nextCompleted,
      lessonScrollProgress,
      unlockedContinueIds,
      completedInteractions,
      quizScores
    );
  };

  // Start / Resume course button action
  const handleStartOrResume = () => {
    // Find first incomplete lesson
    const firstIncomplete = playableLessons.find((l) => !completedLessons.has(l.id));
    const target = firstIncomplete || playableLessons[0];
    if (target) {
      setActiveLessonId(target.id);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Responsive device container width classes
  const deviceContainerClass =
    device === 'desktop'
      ? 'w-full max-w-[1200px]'
      : device === 'tablet_landscape'
      ? 'w-full max-w-[1024px]'
      : device === 'tablet_portrait'
      ? 'w-full max-w-[768px]'
      : device === 'mobile_landscape'
      ? 'w-full max-w-[667px]'
      : 'w-full max-w-[375px]';

  // Calculate locked status for each block in activeLesson
  let isCurrentlyLocked = false;
  const blocksWithLockStatus = (activeLesson?.blocks || []).map((block) => {
    const wasLocked = isCurrentlyLocked;

    if (block.category === 'divider' && block.subtype === 'continue_button') {
      const isUnlocked = unlockedContinueIds.has(block.id);
      if (!isUnlocked) {
        isCurrentlyLocked = true;
      }
    }

    return { block, isHidden: wasLocked };
  });

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col select-none overflow-hidden h-screen">
      {/* 1. Top Preview Bar */}
      <header className="h-14 bg-white border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs flex-shrink-0">
        {/* Left: Exit Link & Course Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold shadow-2xs">
            <Users className="w-3.5 h-3.5" />
            <span>ID Peer Review</span>
          </div>
          <div className="h-4 w-px bg-gray-200 hidden sm:block" />
          <h2 className="text-xs font-bold text-gray-900 truncate max-w-xs hidden sm:block">
            {course.title}
          </h2>
        </div>

        {/* Center: 5 Responsive Device Viewport Toggles */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'desktop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Desktop (100% / 1200px)"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet_landscape')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'tablet_landscape'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Tablet Landscape (1024px)"
          >
            <Tablet className="w-4 h-4 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet_portrait')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'tablet_portrait'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Tablet Portrait (768px)"
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile_landscape')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'mobile_landscape'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Mobile Landscape (667px)"
          >
            <Smartphone className="w-4 h-4 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile_portrait')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              device === 'mobile_portrait'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
            title="Mobile Portrait (375px)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Reset Progress, Progress Bar & Publish */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Course Overall Progress */}
          <div className="hidden md:flex items-center gap-2 mr-1">
            <div className="text-[11px] font-bold text-gray-600">
              {progressPercent}% Complete
            </div>
            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
              />
            </div>
          </div>

          {/* Reset Learner Progress */}
          <button
            type="button"
            onClick={handleResetProgress}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            title="Reset Learner Progress and locked Continue blocks"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setReviewDrawerOpen(!reviewDrawerOpen)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              reviewDrawerOpen
                ? "bg-purple-600 text-white hover:bg-purple-700"
                : "bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>ID Feedback</span>
            {openCommentsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-purple-700 text-[10px] font-black flex items-center justify-center">
                {openCommentsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Stage with Sidebar and Viewport Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Course Outline Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } bg-white border-r border-gray-200 flex flex-col transition-all duration-200 overflow-hidden flex-shrink-0 relative z-30`}
        >
          {/* Top header: Course Title (clicking returns to Cover Page) */}
          <div className="p-4 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setActiveLessonId(null)}
              className="text-left w-full group cursor-pointer"
              title="Return to Course Cover"
            >
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 flex items-center gap-1">
                <span>Course Overview</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 mt-1 line-clamp-2 group-hover:text-black">
                {course.title}
              </h3>
            </button>

            {/* Overall Course Progress Bar */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1">
                <span>{progressPercent}% COMPLETE</span>
                <span>
                  {completedCount}/{totalPlayable} Lessons
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
                />
              </div>
            </div>

            {/* Search across lessons */}
            <div className="relative mt-3">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search course..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>
          </div>

          {/* Lesson Outline list */}
          <div className="p-3 overflow-y-auto flex-1 space-y-1">
            {course.lessons
              ?.filter((l) => !searchTerm || l.title.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((item) => {
                if (item.type === 'section') {
                  return (
                    <div
                      key={item.id}
                      className="pt-4 pb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                    >
                      {item.title}
                    </div>
                  );
                }

                const isActive = item.id === activeLessonId;
                const isCompleted = completedLessons.has(item.id);
                const playableIdx = playableLessons.findIndex((l) => l.id === item.id);
                const locked = isLessonLocked(item.id, playableIdx);
                const scrollProgress = lessonScrollProgress[item.id] || 0;

                return (
                  <button
                    key={item.id}
                    disabled={locked}
                    onClick={() => {
                      if (!locked) {
                        setActiveLessonId(item.id);
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                      locked
                        ? 'opacity-40 cursor-not-allowed bg-transparent text-gray-400'
                        : isActive
                        ? 'bg-gray-100 text-gray-900 font-bold shadow-2xs'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                      <div
                        className="w-1.5 h-6 rounded-full flex-shrink-0 transition-opacity"
                        style={{
                          backgroundColor: accentColor,
                          opacity: isActive ? 1 : 0,
                        }}
                      />
                      <div className="truncate">
                        <span className="text-gray-400 font-semibold mr-1">
                          {playableIdx + 1}.
                        </span>
                        <span>{item.title}</span>
                      </div>
                    </div>

                    {/* Progress Indicator: Solid checkmark if completed, SVG ring if in-progress, or Lock icon */}
                    <div className="flex-shrink-0 ml-1">
                      {locked ? (
                        <Lock className="w-3.5 h-3.5 text-gray-400" />
                      ) : isCompleted ? (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="relative w-4 h-4 flex items-center justify-center">
                          <svg className="w-4 h-4 -rotate-90" viewBox="0 0 20 20">
                            <circle
                              cx="10"
                              cy="10"
                              r="8"
                              className="stroke-gray-200"
                              strokeWidth="2.5"
                              fill="none"
                            />
                            {scrollProgress > 0 && (
                              <circle
                                cx="10"
                                cy="10"
                                r="8"
                                style={{ stroke: accentColor }}
                                strokeWidth="2.5"
                                strokeDasharray={50.26}
                                strokeDashoffset={50.26 - (50.26 * scrollProgress) / 100}
                                strokeLinecap="round"
                                fill="none"
                              />
                            )}
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
          </div>
        </aside>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-3 top-18 z-40 bg-white border border-gray-200 shadow-md p-2 rounded-full text-gray-700 hover:text-black cursor-pointer hover:scale-105 transition-all"
          title={sidebarOpen ? 'Hide course outline' : 'Show course outline'}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Learner Stage Viewport Area */}
        <main
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-900/90"
        >
          <div
            className={`${deviceContainerClass} mx-auto min-h-full transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden bg-white border border-gray-800 flex flex-col justify-between`}
          >
            {/* Top Accent Line */}
            <div className="w-full h-1.5" style={{ backgroundColor: accentColor }} />

            {/* ============================================================== */}
            {/* A. COURSE COVER PAGE MODE (activeLessonId === null)           */}
            {/* ============================================================== */}
            {activeLessonId === null ? (
              <div className="flex-1 flex flex-col">
                {/* HERO COVER according to theme.coverLayout */}
                {course.themeSettings?.coverLayout === 'split' ? (
                  // 50/50 Split Screen Layout
                  <div className="grid grid-cols-1 md:grid-cols-2 min-h-[460px] sm:min-h-[500px]">
                    {/* Left: Brand Accent with Course Title */}
                    <div
                      className="p-8 sm:p-14 flex flex-col justify-between"
                      style={{ backgroundColor: accentColor, color: heroTextColor }}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs ring-1 ring-white/30">
                            {course.authorAvatar || 'MA'}
                          </div>
                          <span className="text-xs font-semibold" style={{ color: heroSubtextColor }}>
                            {course.authorName || 'Mike Afurong'}
                          </span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight pt-2">
                          {course.title}
                        </h1>
                      </div>

                      <div className="pt-8">
                        <button
                          type="button"
                          onClick={handleStartOrResume}
                          className="px-8 py-3.5 text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2 bg-black text-white rounded-full"
                        >
                          <span>{completedCount > 0 ? 'RESUME COURSE' : 'START COURSE'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Right: Full Bleed Cover Photo */}
                    <div className="relative min-h-[260px] md:min-h-full bg-gray-900 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={course.coverImage || course.themeSettings?.coverImageUrl || '/thumbnails/social-engineering.svg'}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : course.themeSettings?.coverLayout === 'overlay' ? (
                  // Full Screen Overlay Layout
                  <div className="relative min-h-[480px] p-8 sm:p-14 flex flex-col justify-between overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.coverImage || course.themeSettings?.coverImageUrl || '/thumbnails/social-engineering.svg'}
                      alt={course.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-black"
                      style={{ opacity: (course.themeSettings?.overlayOpacity ?? 50) / 100 }}
                    />

                    <div className="relative z-10 space-y-4 text-white max-w-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold text-xs">
                          {course.authorAvatar || 'MA'}
                        </div>
                        <span className="text-xs font-semibold text-white/80">{course.authorName}</span>
                      </div>
                      <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                        {course.title}
                      </h1>
                    </div>

                    <div className="relative z-10 pt-8">
                      <button
                        type="button"
                        onClick={handleStartOrResume}
                        className="px-8 py-3.5 rounded-full text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2"
                        style={{ backgroundColor: accentColor }}
                      >
                        <span>{completedCount > 0 ? 'RESUME COURSE' : 'START COURSE'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Centered or Minimal Hero
                  <div className="p-8 sm:p-14 text-center bg-white border-b border-gray-100 flex flex-col items-center">
                    <div className="w-12 h-1.5 rounded-full mb-6" style={{ backgroundColor: accentColor }} />
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-gray-900 max-w-2xl">
                      {course.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-gray-500">
                      <div
                        className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px]"
                        style={{ backgroundColor: accentColor }}
                      >
                        {course.authorAvatar || 'MA'}
                      </div>
                      <span>{course.authorName || 'Mike Afurong'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartOrResume}
                      className="mt-8 px-8 py-3.5 rounded-full text-white text-xs font-bold tracking-wider uppercase shadow-md hover:scale-105 transition-all cursor-pointer flex items-center gap-2"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span>{completedCount > 0 ? 'RESUME COURSE' : 'START COURSE'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Course Description & Outline Jump Links */}
                <div className="p-8 sm:p-14 bg-white max-w-3xl mx-auto w-full">
                  {course.description && (
                    <div className="text-sm sm:text-base text-gray-600 leading-relaxed pb-8 border-b border-gray-100">
                      {course.description}
                    </div>
                  )}

                  <div className="pt-8 space-y-3">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Course Content ({playableLessons.length} Lessons)
                    </div>

                    {(course.lessons || []).map((l) => {
                      if (l.type === 'section') {
                        return (
                          <div
                            key={l.id}
                            className="pt-6 pb-2 font-bold text-xs uppercase tracking-wider text-gray-800 border-b border-gray-100"
                          >
                            {l.title}
                          </div>
                        );
                      }

                      const playableIdx = playableLessons.findIndex((item) => item.id === l.id);
                      const isCompleted = completedLessons.has(l.id);
                      const locked = isLessonLocked(l.id, playableIdx);
                      const isQuiz = l.type === 'quiz';

                      return (
                        <div
                          key={l.id}
                          onClick={() => {
                            if (!locked) {
                              setActiveLessonId(l.id);
                              if (scrollContainerRef.current) {
                                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }
                          }}
                          className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${
                            locked
                              ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                              : 'border-gray-200/90 hover:border-gray-400 hover:shadow-xs bg-white cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isQuiz ? 'bg-amber-50 text-amber-600' : 'bg-sky-50 text-sky-600'
                              }`}
                            >
                              {isQuiz ? <HelpCircle className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-black transition-colors truncate">
                                {playableIdx + 1}. {l.title}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                {isQuiz ? 'Graded Assessment' : 'Interactive Lesson'}
                              </div>
                            </div>
                          </div>

                          <div className="flex-shrink-0">
                            {locked ? (
                              <Lock className="w-4 h-4 text-gray-400" />
                            ) : isCompleted ? (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: accentColor }}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <Circle className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : activeLesson?.type === 'quiz' ? (
              /* ============================================================== */
              /* B. STANDALONE QUIZ / ASSESSMENT VIEW                          */
              /* ============================================================== */
              <div className="p-8 sm:p-14 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    {activeLesson.quizSettings?.mode === 'practice' ? 'Practice Knowledge Check' : 'Graded Assessment'}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
                    {activeLesson.title}
                  </h1>

                  {/* Standalone Quiz Questions / Results Logic */}
                  {(() => {
                    const quizSettings: QuizSettings = activeLesson.quizSettings || {
                      passingScore: 80,
                      retries: 'unlimited',
                      requirePassingScore: true,
                      shuffleQuestions: false,
                      shuffleAnswers: false,
                      revealAnswers: true,
                    };

                    const questions: QuizQuestion[] = normalizeQuizQuestions(activeLesson.blocks || []);

                    const currentQ = questions[quizCurrentQIdx] || questions[0];
                    const isSubmitted = Boolean(quizSubmitted[activeLesson.id]);
                    const score = quizScores[activeLesson.id];

                    if (!currentQ && !isSubmitted) {
                      return (
                        <div className="text-center py-12 text-gray-400 text-xs">
                          No quiz questions configured.
                        </div>
                      );
                    }

                    if (isSubmitted && score) {
                      // Quiz Results Screen
                      return (
                        <div className="text-center space-y-6 py-8">
                          <div
                            className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                              score.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}
                          >
                            {score.passed ? (
                              <CheckCircle2 className="w-10 h-10" />
                            ) : (
                              <AlertCircle className="w-10 h-10" />
                            )}
                          </div>

                          <div className="space-y-2">
                            <span
                              className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                                score.passed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {score.passed ? 'Passed' : 'Did Not Pass'}
                            </span>
                            <h2 className="text-3xl font-extrabold text-gray-900">
                              Your Score: {score.percent}%
                            </h2>
                            <p className="text-xs text-gray-500">
                              Passing score is {quizSettings.passingScore}%. You scored {score.earned} out of{' '}
                              {score.total} total points.
                            </p>
                          </div>

                          <div className="pt-4 flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setQuizSubmitted({ ...quizSubmitted, [activeLesson.id]: false });
                                setQuizCurrentQIdx(0);
                              }}
                              className="px-6 py-2.5 rounded-full text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer uppercase tracking-wider"
                            >
                              Retake Quiz
                            </button>

                            {nextLesson && (
                              <button
                                type="button"
                                onClick={handleCompleteAndNext}
                                className="px-8 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:scale-102 transition-all cursor-pointer uppercase tracking-wider"
                                style={{ backgroundColor: accentColor }}
                              >
                                Continue to Next Lesson
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Active Question Screen
                    const isMulti = (currentQ.type as string) === 'multiple_response' || (currentQ.type as string) === 'multiple_select';
                    const currentAnswer = quizAnswers[currentQ?.id];

                    const handleSelectOption = (optId: string) => {
                      setQuizValidationError(null);
                      if (isMulti) {
                        const currentList = Array.isArray(currentAnswer)
                          ? currentAnswer
                          : currentAnswer
                          ? [String(currentAnswer)]
                          : [];
                        const nextList = currentList.includes(optId)
                          ? currentList.filter((id) => id !== optId)
                          : [...currentList, optId];
                        setQuizAnswers({ ...quizAnswers, [currentQ.id]: nextList });
                      } else {
                        setQuizAnswers({ ...quizAnswers, [currentQ.id]: optId });
                      }
                    };

                    return (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between text-xs text-gray-400 font-semibold border-b border-gray-100 pb-3">
                          <span>
                            Question {quizCurrentQIdx + 1} of {questions.length}
                          </span>
                          <span>{currentQ.points || 10} Points</span>
                        </div>

                        <fieldset className="space-y-4">
                          <legend className="text-base sm:text-lg font-bold text-gray-900 block mb-1">
                            {currentQ.title}
                          </legend>

                          {isMulti && (
                            <p className="text-xs text-gray-500 font-medium">
                              Select all that apply.
                            </p>
                          )}

                          {/* Multiple Choice & Multiple Response options */}
                          {(currentQ.type === 'multiple_choice' || isMulti) && (
                            <div className="space-y-2.5 pt-1" role={isMulti ? undefined : 'radiogroup'}>
                              {(currentQ.options || []).map((opt, optIdx) => {
                                const optText = opt.text || (opt as { label?: string }).label || String(opt);
                                const optId = opt.id || optText;
                                const isSelected = isMulti
                                  ? Array.isArray(currentAnswer) && currentAnswer.includes(optId)
                                  : currentAnswer === optId || currentAnswer === optText;

                                return (
                                  <label
                                    key={opt.id || optIdx}
                                    className={`p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer select-none ${
                                      isSelected
                                        ? 'border-gray-900 bg-gray-50 text-gray-900 shadow-2xs font-semibold'
                                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                                    }`}
                                  >
                                    <input
                                      type={isMulti ? 'checkbox' : 'radio'}
                                      name={`quiz-q-${currentQ.id}`}
                                      value={optId}
                                      checked={Boolean(isSelected)}
                                      onChange={() => handleSelectOption(optId)}
                                      className="sr-only peer"
                                    />
                                    <div
                                      className={`w-4 h-4 flex items-center justify-center flex-shrink-0 transition-all ${
                                        isMulti
                                          ? `rounded border ${isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300'}`
                                          : `rounded-full border ${isSelected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300'}`
                                      }`}
                                    >
                                      {isSelected && (
                                        isMulti ? (
                                          <Check className="w-3 h-3 stroke-[3]" />
                                        ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                        )
                                      )}
                                    </div>
                                    <span className="flex-1">{optText}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}

                          {/* Fill in the blank input */}
                          {currentQ.type === 'fill_in_blank' && (
                            <div className="space-y-4 pt-1">
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                                {currentQ.sentence?.includes('[blank]') ? (
                                  <span>
                                    {currentQ.sentence.split('[blank]')[0]}
                                    <input
                                      type="text"
                                      value={(currentAnswer as string) || ''}
                                      onChange={(e) => {
                                        setQuizValidationError(null);
                                        setQuizAnswers({ ...quizAnswers, [currentQ.id]: e.target.value });
                                      }}
                                      placeholder="Type answer here"
                                      className="mx-2 px-3 py-1.5 border-b-2 font-bold text-center outline-none min-w-[140px] text-sky-700 bg-sky-50/50 rounded-t"
                                      style={{ borderColor: accentColor }}
                                    />
                                    {currentQ.sentence.split('[blank]')[1]}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={(currentAnswer as string) || ''}
                                    onChange={(e) => {
                                      setQuizValidationError(null);
                                      setQuizAnswers({ ...quizAnswers, [currentQ.id]: e.target.value });
                                    }}
                                    placeholder="Type your answer here..."
                                    className="w-full px-4 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:border-black outline-none"
                                  />
                                )}
                              </p>
                            </div>
                          )}

                          {/* Matching pairs input */}
                          {currentQ.type === 'matching' && (
                            <div className="space-y-4 pt-1">
                              <p className="text-xs text-gray-500 font-medium">
                                Step 1: Select an item from the left column. Step 2: Select its matching pair from the right column.
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold text-gray-400 uppercase">Items</span>
                                  {currentQ.matchingPairs?.map((pair) => {
                                    const selectedLeft = quizAnswers[`${currentQ.id}_sel`];
                                    const isSelected = selectedLeft === pair.id;
                                    const matches = (currentAnswer as unknown as Record<string, string>) || {};
                                    const hasMatch = !!matches[pair.id];
                                    return (
                                      <button
                                        type="button"
                                        key={pair.id}
                                        aria-pressed={isSelected}
                                        aria-label={`Select item: ${pair.left}${hasMatch ? ' (Matched)' : ''}`}
                                        onClick={() => {
                                          setQuizValidationError(null);
                                          setQuizAnswers({ ...quizAnswers, [`${currentQ.id}_sel`]: pair.id });
                                        }}
                                        className={`w-full p-3 rounded-xl border text-xs font-bold text-left cursor-pointer flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-black ${
                                          isSelected
                                            ? 'border-black bg-gray-50 ring-1 ring-black'
                                            : hasMatch
                                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                            : 'border-gray-200 bg-white hover:border-gray-400'
                                        }`}
                                      >
                                        <span>{pair.left}</span>
                                        {hasMatch && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="space-y-2">
                                  <span className="text-[11px] font-bold text-gray-400 uppercase">Matches</span>
                                  {currentQ.matchingPairs?.map((pair) => {
                                    const selectedLeft = quizAnswers[`${currentQ.id}_sel`];
                                    return (
                                      <button
                                        type="button"
                                        key={pair.id}
                                        aria-label={`Match with: ${pair.right}`}
                                        onClick={() => {
                                          if (!selectedLeft) return;
                                          setQuizValidationError(null);
                                          const matches = (currentAnswer as unknown as Record<string, string>) || {};
                                          setQuizAnswers({
                                            ...quizAnswers,
                                            [currentQ.id]: { ...matches, [selectedLeft as string]: pair.id },
                                            [`${currentQ.id}_sel`]: null,
                                          });
                                        }}
                                        className="w-full p-3 rounded-xl border border-gray-200 hover:border-black text-xs text-gray-700 bg-white cursor-pointer text-left transition-colors focus:outline-none focus:ring-2 focus:ring-black"
                                      >
                                        {pair.right}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </fieldset>

                        {/* Inline validation alert if unanswered */}
                        {quizValidationError && (
                          <div
                            role="alert"
                            className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold text-amber-800 flex items-center gap-2"
                          >
                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>{quizValidationError}</span>
                          </div>
                        )}

                        {/* Navigation & Submit buttons */}
                        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                          <button
                            type="button"
                            disabled={quizCurrentQIdx === 0}
                            onClick={() => {
                              setQuizValidationError(null);
                              setQuizCurrentQIdx((prev) => Math.max(0, prev - 1));
                            }}
                            className="px-5 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                          >
                            Previous
                          </button>

                          {quizCurrentQIdx === questions.length - 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                // 1. Validate that all questions are answered
                                const unansweredIdx = questions.findIndex(
                                  (q) => !isQuestionAnswered(q, quizAnswers[q.id])
                                );

                                if (unansweredIdx !== -1) {
                                  setQuizValidationError(`Please answer Question ${unansweredIdx + 1} before continuing.`);
                                  setQuizCurrentQIdx(unansweredIdx);
                                  return;
                                }

                                // 2. Calculate score via canonical assessment scoring engine
                                const passingScore = quizSettings.passingScore !== undefined ? quizSettings.passingScore : 80;
                                const scoreResult = calculateQuizScore(questions, quizAnswers, passingScore);
                                const { earned, total, percent, passed } = scoreResult;

                                const updatedScores = {
                                  ...quizScores,
                                  [activeLesson.id]: { earned, total, percent, passed },
                                };
                                setQuizScores(updatedScores);
                                setQuizSubmitted({ ...quizSubmitted, [activeLesson.id]: true });

                                if (passed) {
                                  const nextCompleted = new Set(completedLessons).add(activeLesson.id);
                                  setCompletedLessons(nextCompleted);
                                  saveProgressToLocalStorage(
                                    nextCompleted,
                                    lessonScrollProgress,
                                    unlockedContinueIds,
                                    completedInteractions,
                                    updatedScores
                                  );
                                }
                              }}
                              className="px-8 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:scale-102 transition-all cursor-pointer uppercase tracking-wider"
                              style={{ backgroundColor: accentColor }}
                            >
                              Submit Quiz
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setQuizValidationError(null);
                                setQuizCurrentQIdx((prev) => prev + 1);
                              }}
                              className="px-8 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:scale-102 transition-all cursor-pointer uppercase tracking-wider"
                              style={{ backgroundColor: accentColor }}
                            >
                              Next Question
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              /* ============================================================== */
              /* C. STANDARD LESSON BLOCK VIEWPORT                             */
              /* ============================================================== */
              <div className="p-8 sm:p-14 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Lesson
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
                    {activeLesson?.title}
                  </h1>

                  {/* Render Blocks with Gated Continue Locking */}
                  <div className="space-y-6">
                    {blocksWithLockStatus.map(({ block, isHidden }, idx) => {
                      if (isHidden) return null;

                      const pt =
                        block.settings?.paddingTop === 'small'
                          ? 'pt-4'
                          : block.settings?.paddingTop === 'large'
                          ? 'pt-14'
                          : 'pt-8';
                      const pb =
                        block.settings?.paddingBottom === 'small'
                          ? 'pb-4'
                          : block.settings?.paddingBottom === 'large'
                          ? 'pb-14'
                          : 'pb-8';

                      const bg =
                        block.settings?.backgroundColor === 'gray'
                          ? 'bg-slate-50'
                          : block.settings?.backgroundColor === 'dark'
                          ? 'bg-slate-900 text-white'
                          : block.settings?.backgroundColor === 'brand'
                          ? 'text-white'
                          : 'bg-white';

                      const brandStyle =
                        block.settings?.backgroundColor === 'brand' ? { backgroundColor: accentColor } : {};

                      return (
                        <div
                          key={block.id || idx}
                          className={`${pt} ${pb} px-4 sm:px-6 rounded-2xl ${bg}`}
                          style={brandStyle}
                        >
                          {block.category === 'text' && (
                            <TextBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'statement' && (
                            <StatementBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'quote' && (
                            <QuoteBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'list' && (
                            <ListBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'image' && (
                            <ImageBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'gallery' && (
                            <GalleryBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'multimedia' && (
                            block.subtype === 'video' ? (
                              <VideoBlock
                                block={block}
                                onChange={() => {}}
                                accentColor={accentColor}
                                isLearnerMode={true}
                                onComplete={() => {
                                  // Unlock continue blocks that depend on video completion
                                  if (activeLesson && activeLesson.blocks) {
                                    const nextB = activeLesson.blocks[idx + 1];
                                    if (nextB && nextB.category === 'divider' && nextB.subtype === 'continue_button') {
                                      handleUnlockContinue(nextB.id);
                                    }
                                  }
                                }}
                              />
                            ) : (
                              <MultimediaBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                            )
                          )}
                          {block.category === 'divider' && (
                            <DividerBlock
                              block={block}
                              onChange={() => {}}
                              accentColor={accentColor}
                              isUnlocked={unlockedContinueIds.has(block.id)}
                              onContinueClick={() => handleUnlockContinue(block.id)}
                            />
                          )}
                          {block.category === 'code' && (
                            <CodeBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'interactive' && (
                            <InteractiveBlock
                              block={block}
                              onChange={() => {}}
                              accentColor={accentColor}
                              isLearnerMode={true}
                              courseLessons={course?.lessons || []}
                              onNavigateToLesson={(targetLessonId) => {
                                const target = course?.lessons?.find((l) => l.id === targetLessonId);
                                if (target) setActiveLessonId(target.id);
                              }}
                              onComplete={() => {
                                if (activeLesson && activeLesson.blocks) {
                                  const nextB = activeLesson.blocks[idx + 1];
                                  if (nextB && nextB.category === 'divider' && nextB.subtype === 'continue_button') {
                                    handleUnlockContinue(nextB.id);
                                  }
                                }
                              }}
                            />
                          )}
                          {block.category === 'knowledge_check' && (
                            <KnowledgeCheckBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'survey' && (
                            <SurveyBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                          {block.category === 'chart' && (
                            <ChartBlock block={block} onChange={() => {}} accentColor={accentColor} isLearnerMode={true} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bottom Navigation Banner */}
                <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between">
                  {prevLesson ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonId(prevLesson.id);
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Previous: {prevLesson.title}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveLessonId(null);
                        if (scrollContainerRef.current) {
                          scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Course Cover</span>
                    </button>
                  )}

                  {nextLesson ? (
                    <button
                      type="button"
                      onClick={handleCompleteAndNext}
                      className="px-6 py-2.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm hover:scale-102 cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span>Next Lesson: {nextLesson.title}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (activeLessonId) {
                          const nextCompleted = new Set(completedLessons).add(activeLessonId);
                          setCompletedLessons(nextCompleted);
                          saveProgressToLocalStorage(
                            nextCompleted,
                            lessonScrollProgress,
                            unlockedContinueIds,
                            completedInteractions,
                            quizScores
                          );
                        }
                        setActiveLessonId(null);
                      }}
                      className="px-6 py-2.5 rounded-full text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-sm hover:scale-102 cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete Course</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating feedback button when drawer is closed */}
      {!reviewDrawerOpen && (
        <button
          type="button"
          onClick={() => setReviewDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border-2 border-white cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Leave Peer Feedback</span>
          {openCommentsCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-purple-700 text-[10px] font-black flex items-center justify-center">
              {openCommentsCount}
            </span>
          )}
        </button>
      )}

      {/* ID Peer Review Comments Drawer */}
      <ReviewDrawer
        courseId={courseId}
        isOpen={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
        lessons={playableLessons}
        activeLessonId={activeLessonId}
        onNavigateToLesson={handleLessonChange}
        accentColor={accentColor}
        isAuthorView={false}
      />
    </div>
  );
}
