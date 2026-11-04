'use client';

import React, { useState, useEffect, useRef, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Course,
  Lesson,
  Block,
  QuizQuestion,
  QuizSettings,
  QuestionType,
  QuestionBank,
} from '@/lib/types';
import {
  normalizeQuizQuestions,
  calculateQuizScore,
  isQuestionAnswered,
} from '@/lib/quiz-utils';
import {
  ChevronLeft,
  Settings as SettingsIcon,
  Play,
  Edit3,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  HelpCircle,
  Check,
  X,
  Award,
  Database,
} from 'lucide-react';

interface QuizPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

const defaultSettings: QuizSettings = {
  passingScore: 80,
  retries: 'unlimited',
  requirePassingScore: true,
  shuffleQuestions: false,
  shuffleAnswers: false,
  revealAnswers: true,
};

const defaultSeedQuestions: QuizQuestion[] = [
  {
    id: 'q-1',
    type: 'multiple_choice',
    title: 'You receive an email claiming to be from "Microsoft IT Support" with the subject "CRITICAL: Mailbox Storage Exceeded - Click Here to Retain Emails". The sender address is "support@msft-tenant-verify.net". What is the safest, correct course of action?',
    points: 10,
    options: [
      { id: 'opt-1-1', text: 'Click the link immediately to clear your inbox storage before email access is cut off.', isCorrect: false },
      { id: 'opt-1-2', text: 'Report the email using [Your Security Reporting Button / PhishAlarm] and do not click any links.', isCorrect: true },
      { id: 'opt-1-3', text: 'Reply to the sender asking them to verify their employee credentials.', isCorrect: false },
      { id: 'opt-1-4', text: 'Forward the email to your personal email account to inspect the link safely on your phone.', isCorrect: false },
    ],
    feedback: {
      correct: 'Explanatory Analysis: The domain "msft-tenant-verify.net" is an external lookalike domain (typosquatting). Reporting the message alerts the security operations team to block the domain across the entire enterprise.',
      incorrect: 'Explanatory Analysis: Never click links or interact with lookalike domains. Legitimate system notifications will never direct you to external third-party domains.',
    },
  },
  {
    id: 'q-2',
    type: 'multiple_response',
    title: 'Select all confirmed indicators of a voice phishing (vishing) or telephone pretexting attack:',
    points: 10,
    options: [
      { id: 'opt-2-1', text: 'Caller claims to be an executive assistant demanding immediate wire transfer approval for an off-cycle transaction.', isCorrect: true },
      { id: 'opt-2-2', text: 'Caller asks you to read back a 6-digit one-time passcode sent to your phone or approve an unsolicited push.', isCorrect: true },
      { id: 'opt-2-3', text: 'Caller instructs you to bypass standard verification protocols due to an urgent executive "emergency".', isCorrect: true },
      { id: 'opt-2-4', text: 'Caller directs you to submit a standard helpdesk ticket via the official internal IT portal.', isCorrect: false },
    ],
    feedback: {
      correct: 'Explanatory Analysis: Well done! Demands for immediate wires, urgency bypasses, and requests for one-time codes or Authenticator approvals are classic vishing attack indicators.',
      incorrect: 'Explanatory Analysis: Directing a user to submit a standard ticket via an internal portal is standard legitimate procedure. Demands for immediate wires, urgency bypasses, and requests for one-time codes are vishing attacks.',
    },
  },
];

export default function StandaloneQuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const { courseId, lessonId } = use(params);

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  // Canonical Quiz State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const questionsRef = useRef<QuizQuestion[]>([]);
  questionsRef.current = questions;

  const [quizSettings, setQuizSettings] = useState<QuizSettings>(defaultSettings);
  const quizSettingsRef = useRef<QuizSettings>(defaultSettings);
  quizSettingsRef.current = quizSettings;

  const [savingStatus, setSavingStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Lesson Title edit state
  const [lessonTitle, setLessonTitle] = useState('');

  // UI & Active Question Selection
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Question Banks state
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Learner Take Quiz State (Standalone Preview)
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentLearnerQIdx, setCurrentLearnerQIdx] = useState(0);
  const [learnerAnswers, setLearnerAnswers] = useState<Record<string, unknown>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizValidationError, setQuizValidationError] = useState<string | null>(null);

  // 1. Persistence Engine
  const saveToServer = useCallback(
    async (qs: QuizQuestion[], settings?: QuizSettings, customTitle?: string) => {
      setSavingStatus('saving');
      try {
        const targetSettings = settings || quizSettingsRef.current;
        const payload: Record<string, unknown> = {
          blocks: qs as unknown as Block[],
          quizSettings: targetSettings,
        };
        if (customTitle !== undefined) {
          payload.title = customTitle;
        }
        const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setSavingStatus('saved');
          setTimeout(() => setSavingStatus('idle'), 2500);
        } else {
          setSavingStatus('error');
        }
      } catch (err) {
        console.error('Error saving quiz:', err);
        setSavingStatus('error');
      }
    },
    [courseId, lessonId]
  );

  const debouncedSave = useCallback(
    (qs: QuizQuestion[], settings?: QuizSettings, customTitle?: string) => {
      setSavingStatus('unsaved');
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        saveToServer(qs, settings, customTitle);
        saveTimerRef.current = null;
      }, 400);
    },
    [saveToServer]
  );

  const immediateSave = useCallback(
    (qs: QuizQuestion[], settings?: QuizSettings, customTitle?: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      saveToServer(qs, settings, customTitle);
    },
    [saveToServer]
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blocks: questionsRef.current as unknown as Block[],
            quizSettings: quizSettingsRef.current,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    };
  }, [courseId, lessonId]);

  // 2. Fetch Course and Lesson Data on Mount
  useEffect(() => {
    async function fetchData() {
      try {
        const cRes = await fetch(`/api/courses/${courseId}`);
        const cData = await cRes.json();
        const loadedCourse = cData.course || cData;
        setCourse(loadedCourse);

        const lRes = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`);
        const lData = await lRes.json();
        const loadedLesson: Lesson = lData.lesson || lData;
        setLesson(loadedLesson);
        setLessonTitle(loadedLesson.title || 'Untitled Assessment');

        let initialQuestions: QuizQuestion[] = [];
        if (loadedLesson.blocks && Array.isArray(loadedLesson.blocks) && loadedLesson.blocks.length > 0) {
          initialQuestions = normalizeQuizQuestions(loadedLesson.blocks);
        } else {
          initialQuestions = defaultSeedQuestions;
          saveToServer(initialQuestions, loadedLesson.quizSettings || defaultSettings);
        }

        setQuestions(initialQuestions);
        questionsRef.current = initialQuestions;

        const initialSettings: QuizSettings = {
          ...defaultSettings,
          ...(loadedLesson.quizSettings || {}),
        };
        setQuizSettings(initialSettings);
        quizSettingsRef.current = initialSettings;
      } catch (err) {
        console.error('Error fetching quiz data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [courseId, lessonId, saveToServer]);

  // 3. Question Banks
  useEffect(() => {
    if (showBankModal) {
      loadQuestionBanks();
    }
  }, [showBankModal]);

  const loadQuestionBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch('/api/question-banks');
      const data = await res.json();
      if (Array.isArray(data)) setQuestionBanks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBanks(false);
    }
  };

  const accentColor = course?.themeSettings?.accentColor || '#ff5722';

  // 4. Robust Functional State Updaters (Developer Priorities 1 & 2)

  // Update question-level fields (title, points, sentence, caseSensitive)
  const handleUpdateActiveQuestion = (updates: Partial<QuizQuestion>) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur) return prev;
      next[selectedQuestionIdx] = { ...cur, ...updates };
      questionsRef.current = next;
      debouncedSave(next);
      return next;
    });
  };

  // Multiple Choice / Multiple Response Option Updates
  const handleUpdateOption = (optIdx: number, updates: Partial<{ text: string; isCorrect: boolean }>) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur || !cur.options) return prev;
      const nextOpts = [...cur.options];
      nextOpts[optIdx] = { ...nextOpts[optIdx], ...updates };
      next[selectedQuestionIdx] = { ...cur, options: nextOpts };
      questionsRef.current = next;
      debouncedSave(next);
      return next;
    });
  };

  const handleSetCorrectOption = (optIdx: number, isMulti: boolean) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur || !cur.options) return prev;
      const nextOpts = cur.options.map((opt, i) => {
        if (isMulti) {
          return i === optIdx ? { ...opt, isCorrect: !opt.isCorrect } : opt;
        } else {
          return { ...opt, isCorrect: i === optIdx };
        }
      });
      next[selectedQuestionIdx] = { ...cur, options: nextOpts };
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
  };

  const handleAddOption = () => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur) return prev;
      const nextOpts = [
        ...(cur.options || []),
        { id: `opt-${Date.now()}`, text: `New Choice Option`, isCorrect: false },
      ];
      next[selectedQuestionIdx] = { ...cur, options: nextOpts };
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
  };

  const handleDeleteOption = (optIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur || !cur.options || cur.options.length <= 2) return prev;
      const nextOpts = cur.options.filter((_, i) => i !== optIdx);
      next[selectedQuestionIdx] = { ...cur, options: nextOpts };
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
  };

  // Fill in the Blank Accepted Answers
  const handleUpdateAcceptedAnswers = (raw: string) => {
    const list = raw.split(',').map((s) => s.trim()).filter(Boolean);
    handleUpdateActiveQuestion({ acceptedAnswers: list });
  };

  // Matching Pairs Updates
  const handleUpdateMatchingPair = (pairIdx: number, side: 'left' | 'right', val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur || !cur.matchingPairs) return prev;
      const nextPairs = [...cur.matchingPairs];
      nextPairs[pairIdx] = { ...nextPairs[pairIdx], [side]: val };
      next[selectedQuestionIdx] = { ...cur, matchingPairs: nextPairs };
      questionsRef.current = next;
      debouncedSave(next);
      return next;
    });
  };

  const handleAddMatchingPair = () => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur) return prev;
      const nextPairs = [
        ...(cur.matchingPairs || []),
        { id: `m-${Date.now()}`, left: 'New Term', right: 'New Definition' },
      ];
      next[selectedQuestionIdx] = { ...cur, matchingPairs: nextPairs };
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
  };

  const handleDeleteMatchingPair = (pairIdx: number) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur || !cur.matchingPairs || cur.matchingPairs.length <= 2) return prev;
      const nextPairs = cur.matchingPairs.filter((_, i) => i !== pairIdx);
      next[selectedQuestionIdx] = { ...cur, matchingPairs: nextPairs };
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
  };

  // Feedback Messages
  const handleUpdateFeedback = (type: 'correct' | 'incorrect', val: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const cur = next[selectedQuestionIdx];
      if (!cur) return prev;
      const nextFeedback = { ...(cur.feedback || {}), [type]: val };
      next[selectedQuestionIdx] = { ...cur, feedback: nextFeedback };
      questionsRef.current = next;
      debouncedSave(next);
      return next;
    });
  };

  // Add Question
  const handleAddQuestion = (type: QuestionType) => {
    setShowAddMenu(false);
    let newQ: QuizQuestion;
    const id = `q-${Date.now()}`;

    if (type === 'multiple_response') {
      newQ = {
        id,
        type: 'multiple_response',
        title: 'Select all statements that apply:',
        points: 10,
        options: [
          { id: `opt-${Date.now()}-1`, text: 'Primary learning objective outcome', isCorrect: true },
          { id: `opt-${Date.now()}-2`, text: 'Formative feedback checkpoint', isCorrect: true },
          { id: `opt-${Date.now()}-3`, text: 'Extraneous non-essential concept', isCorrect: false },
        ],
        feedback: {
          correct: 'Correct! All applicable statements were selected.',
          incorrect: 'Review the lesson concepts and try again.',
        },
      };
    } else if (type === 'fill_in_blank') {
      newQ = {
        id,
        type: 'fill_in_blank',
        title: 'Enter the missing term to complete the sentence:',
        sentence: 'Instructional scaffolding provides temporary support to learners until they reach [blank].',
        acceptedAnswers: ['mastery', 'independence', 'proficiency'],
        caseSensitive: false,
        points: 10,
        feedback: {
          correct: 'Correct! Scaffolding is gradually removed as mastery is achieved.',
          incorrect: 'The missing term is "mastery".',
        },
      };
    } else if (type === 'matching') {
      newQ = {
        id,
        type: 'matching',
        title: 'Match each instructional concept with its definition:',
        points: 10,
        matchingPairs: [
          { id: `m-${Date.now()}-1`, left: 'Formative Assessment', right: 'Ongoing checks for understanding during instruction' },
          { id: `m-${Date.now()}-2`, left: 'Summative Assessment', right: 'Cumulative evaluation at the conclusion of a module' },
          { id: `m-${Date.now()}-3`, left: 'Cognitive Load', right: 'Mental capacity utilized in working memory' },
        ],
        feedback: {
          correct: 'All pairs matched correctly!',
          incorrect: 'Review definitions of instructional concepts.',
        },
      };
    } else {
      newQ = {
        id,
        type: 'multiple_choice',
        title: 'Select the best answer for the following question:',
        points: 10,
        options: [
          { id: `opt-${Date.now()}-1`, text: 'Correct answer option', isCorrect: true },
          { id: `opt-${Date.now()}-2`, text: 'Plausible distractor option', isCorrect: false },
          { id: `opt-${Date.now()}-3`, text: 'Alternative distractor option', isCorrect: false },
        ],
        feedback: {
          correct: 'Excellent! You selected the correct answer.',
          incorrect: 'Incorrect. Please review the course materials.',
        },
      };
    }

    setQuestions((prev) => {
      const next = [...prev, newQ];
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
    setSelectedQuestionIdx(questionsRef.current.length);
  };

  // Delete Question
  const handleDeleteQuestion = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuestions((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
    setSelectedQuestionIdx((prevIdx) => Math.max(0, prevIdx - 1));
  };

  // Draw Questions from Question Bank
  const handleImportFromBank = (bankQuestions: QuizQuestion[]) => {
    const cloned = bankQuestions.map((q) => ({
      ...q,
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));
    setQuestions((prev) => {
      const next = [...prev, ...cloned];
      questionsRef.current = next;
      immediateSave(next);
      return next;
    });
    setShowBankModal(false);
  };

  // Update Quiz Settings
  const handleSaveSettings = (newSettings: QuizSettings) => {
    setQuizSettings(newSettings);
    quizSettingsRef.current = newSettings;
    immediateSave(questionsRef.current, newSettings);
    setShowSettingsModal(false);
  };

  // -------------------------------------------------------------
  // ACTIVE QUESTION SELECTION
  // -------------------------------------------------------------
  const activeQuestion = questions[selectedQuestionIdx] || questions[0];

  // Standalone Preview Retake
  const handleRetakeQuiz = () => {
    setLearnerAnswers({});
    setCurrentLearnerQIdx(0);
    setQuizCompleted(false);
    setQuizValidationError(null);
    setQuizStarted(true);
  };

  if (loading || !course || !lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <RotateCw className="w-4 h-4 animate-spin text-gray-400" />
          <span>Loading quiz editor...</span>
        </div>
      </div>
    );
  }

  const scoreResult = calculateQuizScore(questions, learnerAnswers, quizSettings.passingScore);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">
      {/* 1. TOP UTILITY BAR */}
      <header className="h-14 bg-white border-b border-gray-200/80 px-6 flex items-center justify-between sticky top-0 z-40 shadow-2xs">
        {/* Left: Back Link & Breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Outline</span>
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/courses/${courseId}`}
            className="text-xs text-gray-400 hover:text-gray-700 truncate max-w-[200px]"
            title={course.title}
          >
            {course.title || 'Untitled Course'}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-bold text-gray-900 truncate max-w-[250px]" title={lessonTitle}>
            {lessonTitle || 'Untitled Assessment'}
          </span>
        </div>

        {/* Right: Saving Indicator, Settings & Preview / Edit Toggle */}
        <div className="flex items-center gap-3">
          {/* Real-time Saving Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {savingStatus === 'unsaved' && (
              <span className="flex items-center gap-1 text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">Unsaved</span>
              </span>
            )}
            {savingStatus === 'saving' && (
              <span className="flex items-center gap-1 text-amber-600 font-medium animate-pulse">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="hidden sm:inline">Saving...</span>
              </span>
            )}
            {savingStatus === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
            {savingStatus === 'error' && (
              <span className="flex items-center gap-1 text-rose-600 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Failed</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Quiz Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPreviewMode(!isPreviewMode);
              setQuizStarted(false);
              setQuizCompleted(false);
              setCurrentLearnerQIdx(0);
              setLearnerAnswers({});
              setQuizValidationError(null);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              isPreviewMode
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-black text-white hover:bg-gray-800 shadow-xs'
            }`}
          >
            {isPreviewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPreviewMode ? 'Edit Questions' : 'Preview Quiz'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      {isPreviewMode ? (
        /* ================= LEARNER QUIZ PLAYER MODE ================= */
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl bg-white border border-gray-200 rounded-3xl shadow-md overflow-hidden p-8 sm:p-12 space-y-8 animate-in fade-in">
            {!quizStarted ? (
              /* Quiz Intro Screen */
              <div className="text-center space-y-6 py-6">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white shadow-md"
                  style={{ backgroundColor: accentColor }}
                >
                  <Award className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    {quizSettings.mode === 'practice' ? 'Practice Knowledge Check' : 'Graded Assessment'}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {lesson.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                    {quizSettings.mode === 'practice'
                      ? 'Test your knowledge with these formative practice questions. This activity is ungraded and designed for practice.'
                      : `Demonstrate your mastery of course learning objectives. You must score at least ${quizSettings.passingScore}% to pass.`}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-gray-500 py-2 border-y border-gray-100 max-w-sm mx-auto">
                  <div>
                    <span className="font-bold text-gray-900">{questions.length}</span> Questions
                  </div>
                  <div>•</div>
                  <div>
                    Passing Score: <span className="font-bold text-gray-900">{quizSettings.passingScore}%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuizStarted(true);
                    setLearnerAnswers({});
                    setCurrentLearnerQIdx(0);
                    setQuizValidationError(null);
                  }}
                  className="px-8 py-3 rounded-full text-xs font-bold text-white shadow-md hover:scale-105 transition-all cursor-pointer uppercase tracking-wider"
                  style={{ backgroundColor: accentColor }}
                >
                  Start Quiz
                </button>
              </div>
            ) : !quizCompleted ? (
              /* Active Learner Question Screen */
              (() => {
                const q = questions[currentLearnerQIdx];
                if (!q) return null;
                const currentAnswer = learnerAnswers[q.id];

                return (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between text-xs text-gray-400 font-semibold border-b border-gray-100 pb-3">
                      <span>
                        Question {currentLearnerQIdx + 1} of {questions.length}
                      </span>
                      <span>{q.points || 10} Points</span>
                    </div>

                    <div className="space-y-2">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">{q.title}</h2>
                      {q.type === 'multiple_response' && (
                        <p className="text-xs text-gray-400 font-medium">Select all that apply.</p>
                      )}
                    </div>

                    {/* Question Choices / Inputs */}
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-3" role="radiogroup">
                        {q.options?.map((opt) => {
                          const isSelected = currentAnswer === opt.id || currentAnswer === opt.text;
                          return (
                            <label
                              key={opt.id}
                              className={`p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer select-none ${
                                isSelected ? 'border-black bg-gray-50 shadow-2xs font-semibold' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`preview-q-${q.id}`}
                                value={opt.id}
                                checked={Boolean(isSelected)}
                                onChange={() => {
                                  setQuizValidationError(null);
                                  setLearnerAnswers((prev) => ({ ...prev, [q.id]: opt.id }));
                                }}
                                className="sr-only peer"
                              />
                              <div
                                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-black"
                                style={{ borderColor: isSelected ? accentColor : '#d1d5db' }}
                              >
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                                )}
                              </div>
                              <span className="text-gray-800 flex-1">{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'multiple_response' && (
                      <div className="space-y-3">
                        {q.options?.map((opt) => {
                          let isSelected = false;
                          if (Array.isArray(currentAnswer)) {
                            isSelected = currentAnswer.includes(opt.id) || currentAnswer.includes(opt.text);
                          } else if (typeof currentAnswer === 'object' && currentAnswer !== null) {
                            isSelected = !!(currentAnswer as Record<string, boolean>)[opt.id];
                          }

                          return (
                            <label
                              key={opt.id}
                              className={`p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center gap-3 cursor-pointer select-none ${
                                isSelected ? 'border-black bg-gray-50 shadow-2xs font-semibold' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                name={`preview-q-${q.id}`}
                                value={opt.id}
                                checked={Boolean(isSelected)}
                                onChange={() => {
                                  setQuizValidationError(null);
                                  setLearnerAnswers((prev) => {
                                    let curList: string[] = [];
                                    if (Array.isArray(prev[q.id])) {
                                      curList = prev[q.id] as string[];
                                    } else if (typeof prev[q.id] === 'object' && prev[q.id] !== null) {
                                      curList = Object.keys(prev[q.id] as Record<string, boolean>).filter((k) => (prev[q.id] as Record<string, boolean>)[k]);
                                    }
                                    const nextList = curList.includes(opt.id)
                                      ? curList.filter((id) => id !== opt.id)
                                      : [...curList, opt.id];
                                    return { ...prev, [q.id]: nextList };
                                  });
                                }}
                                className="sr-only peer"
                              />
                              <div
                                className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 peer-focus-visible:ring-2 peer-focus-visible:ring-black"
                                style={{
                                  borderColor: isSelected ? accentColor : '#d1d5db',
                                  backgroundColor: isSelected ? accentColor : '#ffffff',
                                }}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </div>
                              <span className="text-gray-800 flex-1">{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'fill_in_blank' && (
                      <div className="space-y-4">
                        <p className="text-xs sm:text-sm text-gray-700">
                          {q.sentence?.includes('[blank]') ? (
                            <span>
                              {q.sentence.split('[blank]')[0]}
                              <input
                                type="text"
                                value={(currentAnswer as string) || ''}
                                onChange={(e) => {
                                  setQuizValidationError(null);
                                  setLearnerAnswers((prev) => ({ ...prev, [q.id]: e.target.value }));
                                }}
                                placeholder="Type answer here"
                                className="mx-2 px-3 py-1 border-b-2 font-bold text-center outline-none focus:border-black min-w-[140px] text-sky-700 bg-sky-50/50 rounded-t"
                                style={{ borderColor: accentColor }}
                              />
                              {q.sentence.split('[blank]')[1]}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={(currentAnswer as string) || ''}
                              onChange={(e) => {
                                setQuizValidationError(null);
                                setLearnerAnswers((prev) => ({ ...prev, [q.id]: e.target.value }));
                              }}
                              placeholder="Type your answer here..."
                              className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-black"
                            />
                          )}
                        </p>
                      </div>
                    )}

                    {q.type === 'matching' && (
                      <div className="space-y-4">
                        <p className="text-xs text-gray-500 font-medium">
                          Step 1: Select an item from the left column. Step 2: Select its matching pair from the right column.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase">Items</span>
                            {q.matchingPairs?.map((pair) => {
                              const selectedLeft = learnerAnswers[`${q.id}_sel`];
                              const isSelected = selectedLeft === pair.id;
                              const matches = (currentAnswer as Record<string, string>) || {};
                              const hasMatch = !!matches[pair.id];
                              return (
                                <button
                                  type="button"
                                  key={pair.id}
                                  aria-pressed={isSelected}
                                  aria-label={`Select item: ${pair.left}${hasMatch ? ' (Matched)' : ''}`}
                                  onClick={() => {
                                    setQuizValidationError(null);
                                    setLearnerAnswers((prev) => ({ ...prev, [`${q.id}_sel`]: pair.id }));
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
                            {q.matchingPairs?.map((pair) => {
                              const selectedLeft = learnerAnswers[`${q.id}_sel`];
                              return (
                                <button
                                  type="button"
                                  key={pair.id}
                                  aria-label={`Match with: ${pair.right}`}
                                  onClick={() => {
                                    if (!selectedLeft) return;
                                    setQuizValidationError(null);
                                    const matches = (currentAnswer as Record<string, string>) || {};
                                    setLearnerAnswers((prev) => ({
                                      ...prev,
                                      [q.id]: { ...matches, [selectedLeft as string]: pair.id },
                                      [`${q.id}_sel`]: null,
                                    }));
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

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={currentLearnerQIdx === 0}
                        onClick={() => {
                          setQuizValidationError(null);
                          setCurrentLearnerQIdx((prev) => Math.max(0, prev - 1));
                        }}
                        className="px-5 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-30 cursor-pointer"
                      >
                        Previous
                      </button>

                      {currentLearnerQIdx === questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            // Validate that all questions are answered
                            const unansweredIdx = questions.findIndex(
                              (item) => !isQuestionAnswered(item, learnerAnswers[item.id])
                            );
                            if (unansweredIdx !== -1) {
                              setQuizValidationError(
                                `Please answer Question ${unansweredIdx + 1} before continuing.`
                              );
                              setCurrentLearnerQIdx(unansweredIdx);
                              return;
                            }
                            setQuizCompleted(true);
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
                            setCurrentLearnerQIdx((prev) => prev + 1);
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
              })()
            ) : (
              /* Quiz Results Screen */
              <div className="text-center space-y-6 py-6">
                <div
                  className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
                    scoreResult.passed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {scoreResult.passed ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                </div>

                <div className="space-y-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      scoreResult.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {scoreResult.passed ? 'Passed' : 'Did Not Pass'}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                    Your Score: {scoreResult.percent}%
                  </h2>
                  <p className="text-xs text-gray-500">
                    Passing score is {quizSettings.passingScore}%. You scored {scoreResult.earned} out of{' '}
                    {scoreResult.total} total points.
                  </p>
                </div>

                {/* Retake Button */}
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRetakeQuiz}
                    className="flex items-center gap-2 px-8 py-2.5 rounded-full text-xs font-bold text-white shadow-xs hover:scale-105 transition-all cursor-pointer uppercase tracking-wider"
                    style={{ backgroundColor: accentColor }}
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retake Quiz</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= QUIZ AUTHORING EDITOR MODE ================= */
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Question List */}
          <aside className="w-80 border-r border-gray-200 bg-white flex flex-col justify-between flex-shrink-0">
            {/* Top Question List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Questions ({questions.length})
                </span>
                <span className="text-[11px] font-semibold text-gray-400">
                  {questions.reduce((sum, q) => sum + (q.points || 10), 0)} Total Pts
                </span>
              </div>

              {questions.map((q, idx) => {
                const isSelected = selectedQuestionIdx === idx;
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionIdx(idx)}
                    className={`p-3 rounded-xl border transition-all text-left flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'border-black bg-gray-50/80 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-gray-900 truncate">
                          {q.title || 'Untitled Question'}
                        </div>
                        <div className="text-[10px] text-gray-400 font-medium capitalize mt-0.5">
                          {q.type.replace(/_/g, ' ')} • {q.points || 10} pts
                        </div>
                      </div>
                    </div>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        aria-label={`Delete question ${idx + 1}: ${q.title || 'Untitled'}`}
                        onClick={(e) => handleDeleteQuestion(idx, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-rose-600 rounded transition-opacity"
                        title="Delete Question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions: Add Question & Draw from Bank */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 space-y-2 relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Question</span>
                </button>

                {showAddMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="w-full p-2.5 text-left text-xs font-semibold text-gray-800 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                      <div>
                        <div>Multiple Choice</div>
                        <div className="text-[10px] text-gray-400 font-normal">Single correct answer</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('multiple_response')}
                      className="w-full p-2.5 text-left text-xs font-semibold text-gray-800 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                      <div>
                        <div>Multiple Response</div>
                        <div className="text-[10px] text-gray-400 font-normal">Check all that apply</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('fill_in_blank')}
                      className="w-full p-2.5 text-left text-xs font-semibold text-gray-800 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                      <div>
                        <div>Fill in the Blank</div>
                        <div className="text-[10px] text-gray-400 font-normal">Learner types missing word</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('matching')}
                      className="w-full p-2.5 text-left text-xs font-semibold text-gray-800 hover:bg-gray-50 rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-500" />
                      <div>
                        <div>Matching</div>
                        <div className="text-[10px] text-gray-400 font-normal">Pair terms with definitions</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowBankModal(true)}
                className="w-full py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-gray-500" />
                <span>Draw from Question Bank</span>
              </button>
            </div>
          </aside>

          {/* Center Canvas: Active Question Editor */}
          <main className="flex-1 overflow-y-auto p-8 sm:p-12">
            {/* Assessment Title Header Block */}
            <div className="max-w-2xl mx-auto bg-white border border-gray-200/80 rounded-2xl shadow-xs p-6 mb-6">
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                {quizSettings.mode === 'practice' ? 'Practice Knowledge Check' : 'Graded Assessment'}
              </div>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => {
                  setLessonTitle(e.target.value);
                  setSavingStatus('unsaved');
                }}
                onBlur={() => {
                  if (lessonTitle.trim() && lessonTitle !== lesson?.title) {
                    debouncedSave(questionsRef.current, quizSettingsRef.current, lessonTitle);
                    if (lesson) setLesson({ ...lesson, title: lessonTitle });
                  }
                }}
                placeholder="Enter Assessment Title..."
                className="w-full text-xl sm:text-2xl font-extrabold text-gray-900 border-none outline-none focus:ring-1 focus:ring-sky-500/50 rounded-lg p-1 -ml-1 transition-all"
              />
            </div>

            {activeQuestion ? (
              <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-xs space-y-8">
                {/* Question Header & Points */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Question {selectedQuestionIdx + 1} • {activeQuestion.type.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500">Points:</span>
                    <input
                      type="number"
                      value={activeQuestion.points || 10}
                      onChange={(e) =>
                        handleUpdateActiveQuestion({ points: parseInt(e.target.value) || 0 })
                      }
                      className="w-16 px-2 py-1 text-xs border rounded-lg font-mono text-center outline-none focus:border-black"
                    />
                  </div>
                </div>

                {/* Question Prompt Stem */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Question Prompt</label>
                  <textarea
                    rows={2}
                    value={activeQuestion.title}
                    onChange={(e) => handleUpdateActiveQuestion({ title: e.target.value })}
                    placeholder="Enter the question scenario..."
                    className="w-full p-3 text-xs sm:text-sm font-semibold border border-gray-200 rounded-xl outline-none focus:border-black resize-y"
                  />
                </div>

                {/* Multiple Choice Editor */}
                {activeQuestion.type === 'multiple_choice' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-700">Answer Choices (Select correct option)</label>
                    {activeQuestion.options?.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(idx, false)}
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer"
                          style={{ borderColor: opt.isCorrect ? accentColor : '#d1d5db' }}
                        >
                          {opt.isCorrect && (
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: accentColor }} />
                          )}
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOption(idx, { text: e.target.value })}
                          className="flex-1 p-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                        />

                        {(activeQuestion.options?.length || 0) > 2 && (
                          <button
                            type="button"
                            aria-label={`Delete option ${idx + 1}`}
                            onClick={() => handleDeleteOption(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Choice Option</span>
                    </button>
                  </div>
                )}

                {/* Multiple Response Editor */}
                {activeQuestion.type === 'multiple_response' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-700">Answer Choices (Check all correct options)</label>
                    {activeQuestion.options?.map((opt, idx) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(idx, true)}
                          className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer"
                          style={{
                            borderColor: opt.isCorrect ? accentColor : '#d1d5db',
                            backgroundColor: opt.isCorrect ? accentColor : '#ffffff',
                          }}
                        >
                          {opt.isCorrect && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleUpdateOption(idx, { text: e.target.value })}
                          className="flex-1 p-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                        />

                        {(activeQuestion.options?.length || 0) > 2 && (
                          <button
                            type="button"
                            aria-label={`Delete option ${idx + 1}`}
                            onClick={() => handleDeleteOption(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Choice Option</span>
                    </button>
                  </div>
                )}

                {/* Fill in the Blank Editor */}
                {activeQuestion.type === 'fill_in_blank' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Sentence with [blank] placeholder</label>
                      <input
                        type="text"
                        value={activeQuestion.sentence || ''}
                        onChange={(e) => handleUpdateActiveQuestion({ sentence: e.target.value })}
                        placeholder="e.g. Attacks manipulate [blank] behavior."
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700">Accepted Answers (comma-separated)</label>
                      <input
                        type="text"
                        value={(activeQuestion.acceptedAnswers || []).join(', ')}
                        onChange={(e) => handleUpdateAcceptedAnswers(e.target.value)}
                        placeholder="e.g. social, human, trust"
                        className="w-full p-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                      />
                    </div>
                  </div>
                )}

                {/* Matching Editor */}
                {activeQuestion.type === 'matching' && (
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-700">Matching Pairs (Term and Matching Definition)</label>
                    {activeQuestion.matchingPairs?.map((pair, idx) => (
                      <div key={pair.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => handleUpdateMatchingPair(idx, 'left', e.target.value)}
                          placeholder="Term"
                          className="w-1/3 p-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                        />
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => handleUpdateMatchingPair(idx, 'right', e.target.value)}
                          placeholder="Definition / Match"
                          className="flex-1 p-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                        />
                        {(activeQuestion.matchingPairs?.length || 0) > 2 && (
                          <button
                            type="button"
                            aria-label={`Delete matching pair ${idx + 1}`}
                            onClick={() => handleDeleteMatchingPair(idx)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMatchingPair}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black pt-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Matching Pair</span>
                    </button>
                  </div>
                )}

                {/* Feedback Messages */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-700">Feedback Messages</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-emerald-700 block mb-1">Correct Feedback</label>
                      <input
                        type="text"
                        value={activeQuestion.feedback?.correct || ''}
                        onChange={(e) => handleUpdateFeedback('correct', e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-rose-700 block mb-1">Incorrect Feedback</label>
                      <input
                        type="text"
                        value={activeQuestion.feedback?.incorrect || ''}
                        onChange={(e) => handleUpdateFeedback('incorrect', e.target.value)}
                        className="w-full p-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-black"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 text-xs">
                No question selected. Click &quot;Add Question&quot; on the left to create one.
              </div>
            )}
          </main>
        </div>
      )}

      {/* 3. QUIZ SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 sm:p-8 max-w-md w-full space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">Quiz Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-gray-400 hover:text-black rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Assessment Mode: Graded vs Ungraded Practice */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Assessment Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ ...quizSettings, mode: 'graded' })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      (quizSettings.mode || 'graded') === 'graded'
                        ? 'border-gray-900 bg-gray-50 font-bold text-gray-900 ring-1 ring-black'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div>Graded Assessment</div>
                    <div className="text-[10px] font-normal text-gray-400">Counts toward course completion</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveSettings({ ...quizSettings, mode: 'practice' })}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-colors ${
                      quizSettings.mode === 'practice'
                        ? 'border-gray-900 bg-gray-50 font-bold text-gray-900 ring-1 ring-black'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div>Practice Mode</div>
                    <div className="text-[10px] font-normal text-gray-400">Ungraded formative check</div>
                  </button>
                </div>
              </div>

              {/* Passing Score */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Passing Score Percentage: {quizSettings.passingScore}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={quizSettings.passingScore}
                  onChange={(e) =>
                    handleSaveSettings({ ...quizSettings, passingScore: parseInt(e.target.value) })
                  }
                  className="w-full accent-orange-600 cursor-pointer"
                />
              </div>

              {/* Retries */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Quiz Retries Allowed</label>
                <select
                  value={quizSettings.retries}
                  onChange={(e) =>
                    handleSaveSettings({
                      ...quizSettings,
                      retries: e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value),
                    })
                  }
                  className="w-full p-2 border rounded-xl"
                >
                  <option value="unlimited">Unlimited Retries</option>
                  <option value="1">1 Retry</option>
                  <option value="3">3 Retries</option>
                  <option value="5">5 Retries</option>
                </select>
              </div>

              {/* Boolean Toggles */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-gray-700">Require passing score to continue</span>
                  <input
                    type="checkbox"
                    checked={quizSettings.requirePassingScore}
                    onChange={(e) =>
                      handleSaveSettings({ ...quizSettings, requirePassingScore: e.target.checked })
                    }
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-gray-700">Shuffle question order</span>
                  <input
                    type="checkbox"
                    checked={quizSettings.shuffleQuestions}
                    onChange={(e) =>
                      handleSaveSettings({ ...quizSettings, shuffleQuestions: e.target.checked })
                    }
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-gray-700">Shuffle answer choices</span>
                  <input
                    type="checkbox"
                    checked={quizSettings.shuffleAnswers}
                    onChange={(e) =>
                      handleSaveSettings({ ...quizSettings, shuffleAnswers: e.target.checked })
                    }
                    className="rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="font-medium text-gray-700">Reveal correct answers upon completion</span>
                  <input
                    type="checkbox"
                    checked={quizSettings.revealAnswers}
                    onChange={(e) =>
                      handleSaveSettings({ ...quizSettings, revealAnswers: e.target.checked })
                    }
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. DRAW FROM QUESTION BANK MODAL */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 sm:p-8 max-w-xl w-full space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Draw from Question Bank</h3>
                <p className="text-xs text-gray-500 mt-0.5">Select a bank to import verified question items.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="p-1 text-gray-400 hover:text-black rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingBanks ? (
              <div className="text-center py-8 text-xs text-gray-400">Loading question banks...</div>
            ) : questionBanks.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">No question banks found.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {questionBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="p-4 border rounded-2xl hover:border-black transition-colors flex items-center justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-gray-900 group-hover:text-sky-600">
                        {bank.title}
                      </div>
                      <p className="text-[11px] text-gray-500">{bank.description}</p>
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                        {bank.questions.length} questions
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleImportFromBank(bank.questions)}
                      className="px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-xs cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      Import All
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
