'use client';

import React, { useState } from 'react';
import { Course, Lesson } from '@/lib/types';
import {
  X,
  Download,
  FileText,
  Globe,
  Layers,
  CheckCircle2,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course & { lessons: Lesson[] };
  onPublishSuccess?: () => void;
}

interface AuditIssue {
  id: string;
  type: 'media' | 'placeholder' | 'a11y' | 'quiz';
  severity: 'warning' | 'error';
  lessonId: string;
  lessonTitle: string;
  message: string;
  fixUrl: string;
}

export function PublishModal({
  isOpen,
  onClose,
  course,
  onPublishSuccess,
}: PublishModalProps) {
  const [activeTab, setActiveTab] = useState<'lms' | 'web' | 'pdf'>('lms');
  
  // Initialize canonical settings directly from course.publishSettings
  const [format, setFormat] = useState<'scorm12' | 'scorm2004'>(
    course.publishSettings?.scormStandard === 'scorm2004' ? 'scorm2004' : 'scorm12'
  );
  const [trackingMode, setTrackingMode] = useState<'completion' | 'quiz'>(
    course.publishSettings?.trackingType === 'quiz' ? 'quiz' : 'completion'
  );
  const [completionPercentage, setCompletionPercentage] = useState<number>(
    course.publishSettings?.completionPercentage ?? 100
  );
  
  // Find quizzes in course
  const quizLessons = (course.lessons || []).filter((l) => l.type === 'quiz');
  const [selectedQuizId, setSelectedQuizId] = useState<string>(
    course.publishSettings?.selectedQuizId || (quizLessons.length > 0 ? quizLessons[0].id : '')
  );
  
  const [reportingStatus, setReportingStatus] = useState<
    'passed_incomplete' | 'passed_failed' | 'completed_incomplete' | 'completed_failed'
  >(course.publishSettings?.reportingStatus || 'passed_incomplete');
  
  const [includeExitLink, setIncludeExitLink] = useState(
    course.publishSettings?.includeExitLink ?? true
  );
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAllIssues, setShowAllIssues] = useState(false);

  // Pre-Publish Quality & Accessibility Scan
  const auditIssues = React.useMemo<AuditIssue[]>(() => {
    const issues: AuditIssue[] = [];

    // Course level placeholders
    if (!course.title || course.title.trim() === 'Untitled Course' || course.title.trim() === 'Add a title...') {
      issues.push({
        id: 'course-title',
        type: 'placeholder',
        severity: 'error',
        lessonId: '',
        lessonTitle: 'Course Title',
        message: 'Course title is set to default placeholder.',
        fixUrl: `/courses/${course.id}/settings`,
      });
    }

    if (!course.description || course.description.trim() === 'Describe your course...') {
      issues.push({
        id: 'course-desc',
        type: 'placeholder',
        severity: 'warning',
        lessonId: '',
        lessonTitle: 'Course Description',
        message: 'Course description is using default placeholder text.',
        fixUrl: `/courses/${course.id}`,
      });
    }

    (course.lessons || []).forEach((lesson, lIdx) => {
      const lTitle = lesson.title || `Lesson ${lIdx + 1}`;
      const fixUrl = lesson.type === 'quiz'
        ? `/courses/${course.id}/quizzes/${lesson.id}`
        : `/courses/${course.id}/lessons/${lesson.id}`;

      // Placeholder lesson or quiz title / blank title
      if (!lesson.title || lesson.title.trim() === '' || lesson.title.trim() === 'Untitled Lesson' || lesson.title.trim() === 'Add a title...') {
        issues.push({
          id: `les-${lesson.id}-title`,
          type: 'placeholder',
          severity: 'error',
          lessonId: lesson.id,
          lessonTitle: lTitle,
          message: `${lesson.type === 'quiz' ? 'Quiz' : 'Lesson'} has a blank or default placeholder heading.`,
          fixUrl,
        });
      }

      // Quiz verification
      if (lesson.type === 'quiz') {
        const questions = (lesson.blocks || []) as unknown as Array<{
          id: string;
          type: string;
          title?: string;
          options?: Array<{ id: string; text: string; isCorrect: boolean }>;
          sentence?: string;
          acceptedAnswers?: string[];
          matchingPairs?: Array<{ id: string; left: string; right: string }>;
        }>;

        if (!questions || questions.length === 0) {
          issues.push({
            id: `quiz-${lesson.id}-empty`,
            type: 'quiz',
            severity: 'error',
            lessonId: lesson.id,
            lessonTitle: lTitle,
            message: 'Quiz contains 0 questions.',
            fixUrl,
          });
        } else {
          questions.forEach((q, qIdx) => {
            // Check for missing question prompt
            if (!q.title || q.title.trim() === '' || q.title.trim() === 'Untitled Question') {
              issues.push({
                id: `quiz-${lesson.id}-q-${qIdx}-noprompt`,
                type: 'quiz',
                severity: 'error',
                lessonId: lesson.id,
                lessonTitle: lTitle,
                message: `Question ${qIdx + 1} has a missing or blank question prompt.`,
                fixUrl,
              });
            }

            if (q.type === 'multiple_choice' || q.type === 'multiple_response') {
              // Fewer than 2 choices
              if (!q.options || q.options.length < 2) {
                issues.push({
                  id: `quiz-${lesson.id}-q-${qIdx}-minchoices`,
                  type: 'quiz',
                  severity: 'error',
                  lessonId: lesson.id,
                  lessonTitle: lTitle,
                  message: `Question ${qIdx + 1} has fewer than 2 answer choices.`,
                  fixUrl,
                });
              } else {
                const hasCorrect = q.options.some((o) => o.isCorrect === true);
                if (!hasCorrect) {
                  issues.push({
                    id: `quiz-${lesson.id}-q-${qIdx}-nocorrect`,
                    type: 'quiz',
                    severity: 'error',
                    lessonId: lesson.id,
                    lessonTitle: lTitle,
                    message: `Question ${qIdx + 1} has no designated correct answer selected.`,
                    fixUrl,
                  });
                }
              }
            } else if (q.type === 'fill_in_blank') {
              if (!q.acceptedAnswers || q.acceptedAnswers.length === 0 || !q.acceptedAnswers.some(a => a.trim() !== '')) {
                issues.push({
                  id: `quiz-${lesson.id}-q-${qIdx}-noanswer`,
                  type: 'quiz',
                  severity: 'error',
                  lessonId: lesson.id,
                  lessonTitle: lTitle,
                  message: `Question ${qIdx + 1} has no accepted correct answers configured.`,
                  fixUrl,
                });
              }
            } else if (q.type === 'matching') {
              if (!q.matchingPairs || q.matchingPairs.length < 2) {
                issues.push({
                  id: `quiz-${lesson.id}-q-${qIdx}-minpairs`,
                  type: 'quiz',
                  severity: 'error',
                  lessonId: lesson.id,
                  lessonTitle: lTitle,
                  message: `Question ${qIdx + 1} must have at least 2 matching pairs.`,
                  fixUrl,
                });
              }
            }
          });
        }
      }

      // Blocks scan
      (lesson.blocks || []).forEach((b, bIdx) => {
        const content = b.content || {};

        // Broken or missing media URLs
        if (b.category === 'image' || b.subtype?.includes('image')) {
          const url = content.url as string | undefined;
          if (!url || url.trim() === '') {
            issues.push({
              id: `block-${b.id || bIdx}-nourl`,
              type: 'media',
              severity: 'error',
              lessonId: lesson.id,
              lessonTitle: lTitle,
              message: 'Image block is missing an image file or source URL.',
              fixUrl,
            });
          }

          // Missing Alt text
          const alt = (content.alt as string | undefined)?.trim() || (b.settings?.altText as string | undefined)?.trim();
          const isDecorative = (b.settings as Record<string, unknown> | undefined)?.isDecorative === true;
          if (url && !isDecorative && (!alt || alt === '')) {
            issues.push({
              id: `block-${b.id || bIdx}-noalt`,
              type: 'a11y',
              severity: 'warning',
              lessonId: lesson.id,
              lessonTitle: lTitle,
              message: 'Image is missing accessible Alt Text for screen readers.',
              fixUrl,
            });
          }

          // Default placeholder caption
          if (content.caption === 'Enter some text' || content.caption === 'Type caption here...') {
            issues.push({
              id: `block-${b.id || bIdx}-caption`,
              type: 'placeholder',
              severity: 'warning',
              lessonId: lesson.id,
              lessonTitle: lTitle,
              message: 'Image caption contains default placeholder text.',
              fixUrl,
            });
          }
        }

        // Inline Knowledge Check Block validation
        if (b.category === 'knowledge_check') {
          const qText = (content.question as string | undefined)?.trim();
          if (!qText || qText === 'Enter question here...' || qText === 'Untitled Question') {
            issues.push({
              id: `block-${b.id || bIdx}-kc-noprompt`,
              type: 'quiz',
              severity: 'error',
              lessonId: lesson.id,
              lessonTitle: lTitle,
              message: 'Inline Knowledge Check has missing or placeholder prompt.',
              fixUrl,
            });
          }
          if (b.subtype === 'multiple_choice' || b.subtype === 'multiple_response' || !b.subtype) {
            const opts = (content.options as Array<{ text: string; isCorrect: boolean }> | undefined) || [];
            if (opts.length < 2) {
              issues.push({
                id: `block-${b.id || bIdx}-kc-minopts`,
                type: 'quiz',
                severity: 'error',
                lessonId: lesson.id,
                lessonTitle: lTitle,
                message: 'Inline Knowledge Check has fewer than 2 choices.',
                fixUrl,
              });
            } else if (!opts.some(o => o.isCorrect)) {
              issues.push({
                id: `block-${b.id || bIdx}-kc-nocorrect`,
                type: 'quiz',
                severity: 'error',
                lessonId: lesson.id,
                lessonTitle: lTitle,
                message: 'Inline Knowledge Check has no correct answer selected.',
                fixUrl,
              });
            }
          }
        }

        // General text placeholder detection
        const placeholderPhrases = ['Enter some text', 'Heading', 'Subheading', 'Add statement here', 'Describe your course...'];
        const textValues = [
          content.heading as string,
          content.subheading as string,
          content.body as string,
          content.statement as string,
          content.lead as string,
        ].filter(Boolean);

        for (const val of textValues) {
          if (placeholderPhrases.some(p => val.trim() === p)) {
            issues.push({
              id: `block-${b.id || bIdx}-placeholder`,
              type: 'placeholder',
              severity: 'warning',
              lessonId: lesson.id,
              lessonTitle: lTitle,
              message: `Block contains default placeholder text "${val}".`,
              fixUrl,
            });
            break;
          }
        }
      });
    });

    return issues;
  }, [course]);

  if (!isOpen) return null;

  const accentColor = course.themeSettings?.accentColor || '#ff5722';

  const handleExport = async (exportFormat: 'scorm12' | 'scorm2004' | 'web') => {
    try {
      setIsExporting(true);
      setSuccessMessage(null);
      setErrorMessage(null);

      const res = await fetch(`/api/courses/${course.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: exportFormat,
          trackingMode,
          completionPercentage,
          quizId: trackingMode === 'quiz' ? selectedQuizId : undefined,
          reportingStatus,
          includeExitLink,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server returned ${res.status}`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (course.title || 'course')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      a.download = `${safeTitle}-${exportFormat}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage(
        exportFormat === 'web'
          ? 'Web package exported successfully!'
          : `${exportFormat === 'scorm12' ? 'SCORM 1.2' : 'SCORM 2004 4th Edition'} package exported successfully!`
      );

      // Sync settings and update publish status on the course
      try {
        await fetch(`/api/courses/${course.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'published',
            hasUnpublishedChanges: false,
            lastPublishedAt: new Date().toISOString(),
            publishSettings: {
              ...course.publishSettings,
              scormStandard: exportFormat === 'scorm2004' ? 'scorm2004' : 'scorm12',
              trackingType: trackingMode,
              completionPercentage,
              selectedQuizId: trackingMode === 'quiz' ? selectedQuizId : undefined,
              reportingStatus,
              includeExitLink,
            },
          }),
        });
      } catch (syncErr) {
        console.warn('Could not sync publish settings:', syncErr);
      }

      if (onPublishSuccess) {
        onPublishSuccess();
      }
    } catch (err) {
      console.error('Export error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <h2 className="text-base font-bold text-gray-900">Publish Course</h2>
            <span className="text-xs text-gray-500 font-medium truncate max-w-xs">
              — {course.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-gray-200 bg-gray-50/70 flex gap-6">
          <button
            onClick={() => {
              setActiveTab('lms');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'lms'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>LMS / SCORM</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('web');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'web'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Web (HTML5)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pdf');
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'pdf'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>PDF / Print</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl">
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* Pre-Publish Quality & Accessibility Readiness Check */}
          <div className="rounded-xl border border-gray-200 p-4 transition-all overflow-hidden bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {auditIssues.length === 0 ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-gray-900">
                      Pre-Publish Quality & Accessibility Scan
                    </h3>
                    {auditIssues.length === 0 ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        All Checks Passed
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {auditIssues.length} {auditIssues.length === 1 ? 'Notice' : 'Notices'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {auditIssues.length === 0
                      ? 'Media assets verified, no empty placeholders detected, WCAG alt text present, and quiz logic ready.'
                      : 'Review quality, placeholder, and accessibility warnings below before exporting.'}
                  </p>
                </div>
              </div>

              {auditIssues.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAllIssues(!showAllIssues)}
                  className="text-xs text-gray-500 hover:text-gray-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAllIssues ? 'Collapse' : 'View Details'}</span>
                  {showAllIssues ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>

            {/* List of issues when expanded or always previewed */}
            {auditIssues.length > 0 && showAllIssues && (
              <div className="mt-3.5 pt-3.5 border-t border-gray-100 space-y-2 max-h-56 overflow-y-auto">
                {auditIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                          issue.type === 'media'
                            ? 'bg-rose-100 text-rose-700'
                            : issue.type === 'quiz'
                            ? 'bg-purple-100 text-purple-700'
                            : issue.type === 'a11y'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {issue.type}
                      </span>
                      <span className="text-gray-700 font-medium truncate" title={issue.message}>
                        {issue.message}
                      </span>
                    </div>

                    <a
                      href={issue.fixUrl}
                      onClick={onClose}
                      className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-white hover:bg-sky-50 border border-gray-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Fix in {issue.lessonTitle}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TAB 1: LMS / SCORM */}
          {activeTab === 'lms' && (
            <div className="space-y-6">
              {/* LMS Standard */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  LMS Standard
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat('scorm12')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      format === 'scorm12'
                        ? 'border-gray-900 bg-gray-50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900">SCORM 1.2</span>
                      {format === 'scorm12' && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Most universal standard. Compatible with Workday, Cornerstone, Moodle, Blackboard, and Canvas.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('scorm2004')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      format === 'scorm2004'
                        ? 'border-gray-900 bg-gray-50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900">SCORM 2004 4th Edition</span>
                      {format === 'scorm2004' && (
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: accentColor }}
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Advanced standard with enhanced tracking, 64k suspend data buffer, and strict sequencing controls.
                    </p>
                  </button>
                </div>
              </div>

              {/* Tracking */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Tracking
                </label>
                <div className="space-y-3">
                  {/* Option 1: Course completion */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      trackingMode === 'completion'
                        ? 'border-gray-900 bg-gray-50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="trackingMode"
                      checked={trackingMode === 'completion'}
                      onChange={() => setTrackingMode('completion')}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-bold text-gray-900 block">
                        Track using course completion
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5 mb-2.5">
                        LMS marks course as completed when learner visits the required percentage of lessons.
                      </p>
                      {trackingMode === 'completion' && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">Require:</span>
                          <select
                            value={completionPercentage}
                            onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                            className="text-xs font-semibold border border-gray-300 rounded-lg px-2.5 py-1 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                          >
                            <option value={100}>100% of lessons</option>
                            <option value={90}>90% of lessons</option>
                            <option value={80}>80% of lessons</option>
                            <option value={70}>70% of lessons</option>
                            <option value={50}>50% of lessons</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Option 2: Quiz result */}
                  <label
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      trackingMode === 'quiz'
                        ? 'border-gray-900 bg-gray-50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="trackingMode"
                      checked={trackingMode === 'quiz'}
                      onChange={() => setTrackingMode('quiz')}
                      className="mt-0.5 text-orange-600 focus:ring-orange-500"
                      disabled={quizLessons.length === 0}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">
                          Track using quiz result
                        </span>
                        {quizLessons.length === 0 && (
                          <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                            No quizzes in course
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 mb-2.5">
                        LMS records learner score and marks passed when learner meets the passing threshold.
                      </p>
                      {trackingMode === 'quiz' && quizLessons.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 font-medium">Select Quiz:</span>
                          <select
                            value={selectedQuizId}
                            onChange={(e) => setSelectedQuizId(e.target.value)}
                            className="text-xs font-semibold border border-gray-300 rounded-lg px-2.5 py-1 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                          >
                            {quizLessons.map((q) => (
                              <option key={q.id} value={q.id}>
                                {q.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Reporting Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Reporting Status to LMS
                </label>
                <select
                  value={reportingStatus}
                  onChange={(e) =>
                    setReportingStatus(
                      e.target.value as
                        | 'passed_incomplete'
                        | 'passed_failed'
                        | 'completed_incomplete'
                        | 'completed_failed'
                    )
                  }
                  className="w-full text-xs font-medium border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="passed_incomplete">Passed / Incomplete (Recommended for most LMSs)</option>
                  <option value="passed_failed">Passed / Failed</option>
                  <option value="completed_incomplete">Completed / Incomplete</option>
                  <option value="completed_failed">Completed / Failed</option>
                </select>
              </div>

              {/* LMS Navigation Options */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeExitLink}
                    onChange={(e) => setIncludeExitLink(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300"
                  />
                  <span className="text-xs font-semibold text-gray-800">
                    Include &quot;Exit Course&quot; link in player header
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 ml-6.5 mt-0.5">
                  Sends LMSFinish / Terminate call and safely closes or redirects the LMS course window.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: WEB (HTML5) */}
          {activeTab === 'web' && (
            <div className="space-y-4">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-2xs border border-gray-200 text-gray-800">
                  <Globe className="w-6 h-6 text-gray-800" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Standalone Web Package
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Export your course as a zero-dependency HTML5 package. It runs offline or on any standard web hosting server (AWS S3, Netlify, Cloudflare Pages, Nginx, or local file system).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Key Features Included:</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Local storage persistence: learner progress and quiz answers save automatically</li>
                  <li>Offline media bundling: all uploaded project files, images, and audio stored inside</li>
                  <li>Responsive design: automatic desktop, tablet, and smartphone layout scaling</li>
                  <li>Instant launch: double-click <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">index.html</code> to test anywhere</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: PDF / PRINT */}
          {activeTab === 'pdf' && (
            <div className="space-y-4">
              <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-white rounded-xl shadow-2xs border border-gray-200 text-gray-800">
                  <FileText className="w-6 h-6 text-gray-800" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Printable Document View
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    View the entire course in a single, high-fidelity printable document. All interactive accordions, tab panels, process steps, flashcards, and quizzes are automatically expanded.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  <span>Document Features:</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li>Optimized print stylesheets with clean page breaks between lessons</li>
                  <li>High resolution graphic rendering and typography</li>
                  <li>Save as PDF using your browser&apos;s standard Print dialog (Cmd+P / Ctrl+P)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'lms' && (
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport(format)}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Packaging SCORM...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Publish SCORM Package (.zip)</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'web' && (
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleExport('web')}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Packaging Web...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export Web Package (.zip)</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'pdf' && (
            <a
              href={`/courses/${course.id}/export/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Print / PDF View</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
