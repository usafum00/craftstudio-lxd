'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Course, Lesson, PublishSettings, ThemeSettings, NavigationMode, SidebarState } from '@/lib/types';
import {
  ChevronLeft,
  Navigation,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export default function CourseSettingsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);

  const [course, setCourse] = useState<(Course & { lessons: Lesson[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'navigation' | 'tracking'>('navigation');

  // Form states
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('free');
  const [sidebarState, setSidebarState] = useState<SidebarState>('open');
  const [showPrevNextButtons, setShowPrevNextButtons] = useState(true);
  const [showLessonNumbers, setShowLessonNumbers] = useState(true);
  const [allowSearch, setAllowSearch] = useState(true);

  // LMS Tracking states
  const [scormStandard, setScormStandard] = useState<'scorm12' | 'scorm2004'>('scorm12');
  const [trackingType, setTrackingType] = useState<'completion' | 'quiz'>('completion');
  const [completionPercentage, setCompletionPercentage] = useState<number>(100);
  const [passingScore, setPassingScore] = useState<number>(80);
  const [reportingStatus, setReportingStatus] = useState<
    'passed_incomplete' | 'passed_failed' | 'completed_incomplete' | 'completed_failed'
  >('passed_incomplete');
  const [includeExitLink, setIncludeExitLink] = useState(true);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        const c = data.course as Course & { lessons: Lesson[] };
        setCourse(c);

        // Populate navigation settings
        if (c.publishSettings) {
          setNavigationMode(c.publishSettings.navigationMode || 'free');
          setShowLessonNumbers(c.publishSettings.showLessonNumbers ?? true);
          setAllowSearch(c.publishSettings.allowSearch ?? true);
          setPassingScore(c.publishSettings.passingScore ?? 80);
          setScormStandard(c.publishSettings.scormStandard || 'scorm12');
          setTrackingType(c.publishSettings.trackingType || 'completion');
          setCompletionPercentage(c.publishSettings.completionPercentage ?? 100);
          setReportingStatus(c.publishSettings.reportingStatus || 'passed_incomplete');
          setIncludeExitLink(c.publishSettings.includeExitLink ?? true);
        }

        // Theme navigation flags
        if (c.themeSettings) {
          setSidebarState(c.themeSettings.sidebarState || c.publishSettings?.sidebarState || 'open');
          setShowPrevNextButtons(
            c.themeSettings.showPrevNextButtons ?? c.publishSettings?.showPrevNextButtons ?? true
          );
        }
      }
    } catch (err) {
      console.error('Failed to load course settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const handleSave = async () => {
    if (!course) return;
    try {
      setSaving(true);
      setSaveSuccess(false);

      const updatedPublishSettings: PublishSettings = {
        ...course.publishSettings,
        navigationMode,
        showLessonNumbers,
        allowSearch,
        completionCriteria: trackingType === 'quiz' ? 'quiz_pass' : 'all_lessons',
        passingScore,
        scormVersion: scormStandard === 'scorm2004' ? '2004_4th_edition' : '1.2',
        scormStandard,
        trackingType,
        completionPercentage,
        reportingStatus,
        includeExitLink,
        showPrevNextButtons,
        sidebarState,
      };

      const updatedThemeSettings: ThemeSettings = {
        ...course.themeSettings,
        sidebarState,
        showPrevNextButtons,
        showLessonNumbers,
      };

      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publishSettings: updatedPublishSettings,
          themeSettings: updatedThemeSettings,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        alert('Failed to save settings.');
      }
    } catch (err) {
      console.error('Error saving settings', err);
      alert('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fcfcfc] text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-xs">Loading course settings...</span>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-gray-500 gap-3">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <h2 className="text-sm font-bold text-gray-900">Course Not Found</h2>
        <Link href="/" className="text-xs text-sky-600 hover:underline">
          Return to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-gray-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <header className="h-14 px-8 border-b border-gray-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 overflow-hidden max-w-lg text-xs">
          <Link
            href={`/courses/${courseId}`}
            className="text-gray-500 hover:text-gray-900 flex items-center gap-1 font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Course Outline</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-800 truncate" title={course.title}>
            {course.title}
          </span>
          <span className="text-gray-300">/</span>
          <span className="font-bold text-gray-900">Settings</span>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Settings Saved!
            </span>
          )}

          <Link
            href={`/courses/${courseId}`}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5"
          >
            Done
          </Link>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-black hover:bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Settings</span>
          </button>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-4xl w-full mx-auto p-8 space-y-6 flex-1">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Course Settings & Navigation</h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure learner pacing, interface navigation controls, and default LMS tracking rules.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('navigation')}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'navigation'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Navigation & Display</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'tracking'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>LMS Tracking & Reporting</span>
          </button>
        </div>

        {/* TAB 1: Navigation & Display */}
        {activeTab === 'navigation' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Navigation Mode */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-gray-900">Learner Navigation Mode</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    navigationMode === 'free'
                      ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900">Free Navigation</span>
                    <input
                      type="radio"
                      name="navMode"
                      value="free"
                      checked={navigationMode === 'free'}
                      onChange={() => setNavigationMode('free')}
                      className="accent-gray-900"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Learners can jump directly to any lesson in the course in whatever order they choose.
                  </p>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    navigationMode === 'restricted'
                      ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900">Restricted (Sequential)</span>
                    <input
                      type="radio"
                      name="navMode"
                      value="restricted"
                      checked={navigationMode === 'restricted'}
                      onChange={() => setNavigationMode('restricted')}
                      className="accent-gray-900"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Learners must complete lessons sequentially. Subsequent lessons remain locked until the current lesson is finished.
                  </p>
                </label>
              </div>
            </section>

            {/* Sidebar State */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-gray-900">Course Outline Sidebar</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'open', label: 'Open (Default)', desc: 'Expanded by default on desktop screens.' },
                  { id: 'closed', label: 'Closed (Collapsible)', desc: 'Collapsed to icon bar by default.' },
                  { id: 'disabled', label: 'Disabled (Hidden)', desc: 'Completely hides outline sidebar.' },
                ].map((s) => (
                  <label
                    key={s.id}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                      sidebarState === s.id
                        ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-gray-900">{s.label}</span>
                      <input
                        type="radio"
                        name="sidebarState"
                        value={s.id}
                        checked={sidebarState === s.id}
                        onChange={() => setSidebarState(s.id as SidebarState)}
                        className="accent-gray-900"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">{s.desc}</p>
                  </label>
                ))}
              </div>
            </section>

            {/* Navigation Controls Toggles */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-gray-900">Interface Controls</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-gray-800">Previous & Next Buttons</span>
                    <p className="text-[11px] text-gray-500">
                      Display bottom navigation buttons allowing learners to advance between lessons.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showPrevNextButtons}
                    onChange={(e) => setShowPrevNextButtons(e.target.checked)}
                    className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                  />
                </label>

                <label className="flex items-center justify-between py-2 border-b border-gray-100 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-gray-800">Show Lesson Numbers</span>
                    <p className="text-[11px] text-gray-500">
                      Prefix lesson titles with numbering in the sidebar and header (e.g. 1. Introduction).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLessonNumbers}
                    onChange={(e) => setShowLessonNumbers(e.target.checked)}
                    className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                  />
                </label>

                <label className="flex items-center justify-between py-2 cursor-pointer">
                  <div>
                    <span className="text-xs font-semibold text-gray-800">Allow Course Search</span>
                    <p className="text-[11px] text-gray-500">
                      Display a search bar in the sidebar for searching text across lesson blocks.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={allowSearch}
                    onChange={(e) => setAllowSearch(e.target.checked)}
                    className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                  />
                </label>
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: LMS Tracking & Reporting */}
        {activeTab === 'tracking' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* SCORM Standard */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-gray-900">Default SCORM Standard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    scormStandard === 'scorm12'
                      ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900">SCORM 1.2 (Default)</span>
                    <input
                      type="radio"
                      name="scormStd"
                      value="scorm12"
                      checked={scormStandard === 'scorm12'}
                      onChange={() => setScormStandard('scorm12')}
                      className="accent-gray-900"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Highest compatibility across traditional LMS platforms (Moodle, Blackboard, Cornerstone, Canvas).
                  </p>
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    scormStandard === 'scorm2004'
                      ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900">SCORM 2004 4th Edition</span>
                    <input
                      type="radio"
                      name="scormStd"
                      value="scorm2004"
                      checked={scormStandard === 'scorm2004'}
                      onChange={() => setScormStandard('scorm2004')}
                      className="accent-gray-900"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Supports detailed question interactions, objective tracking, and rich completion status.
                  </p>
                </label>
              </div>
            </section>

            {/* Tracking Mode */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-gray-900">LMS Tracking Mode</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    trackingType === 'completion'
                      ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900">Course Completion %</span>
                    <input
                      type="radio"
                      name="trackingType"
                      value="completion"
                      checked={trackingType === 'completion'}
                      onChange={() => setTrackingType('completion')}
                      className="accent-gray-900"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    LMS marks course complete based on percentage of lessons viewed.
                  </p>
                  {trackingType === 'completion' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Completion Threshold: {completionPercentage}%
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        step={5}
                        value={completionPercentage}
                        onChange={(e) => setCompletionPercentage(Number(e.target.value))}
                        className="w-full accent-gray-900"
                      />
                    </div>
                  )}
                </label>

                <label
                  className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all ${
                    trackingType === 'quiz'
                      ? 'border-gray-900 bg-gray-50/50 shadow-2xs'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-gray-900">Quiz Assessment Result</span>
                    <input
                      type="radio"
                      name="trackingType"
                      value="quiz"
                      checked={trackingType === 'quiz'}
                      onChange={() => setTrackingType('quiz')}
                      className="accent-gray-900"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    LMS reports pass/fail and final score based on the graded course assessment.
                  </p>
                  {trackingType === 'quiz' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Passing Score: {passingScore}%
                      </label>
                      <input
                        type="range"
                        min={50}
                        max={100}
                        step={5}
                        value={passingScore}
                        onChange={(e) => setPassingScore(Number(e.target.value))}
                        className="w-full accent-gray-900"
                      />
                    </div>
                  )}
                </label>
              </div>
            </section>

            {/* Reporting Status */}
            <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-bold text-gray-900">LMS Reporting Status Value</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { id: 'passed_incomplete', label: 'Passed / Incomplete (Recommended)' },
                  { id: 'passed_failed', label: 'Passed / Failed' },
                  { id: 'completed_incomplete', label: 'Completed / Incomplete' },
                  { id: 'completed_failed', label: 'Completed / Failed' },
                ].map((r) => (
                  <label
                    key={r.id}
                    className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                      reportingStatus === r.id
                        ? 'border-gray-900 bg-gray-50 font-semibold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span>{r.label}</span>
                    <input
                      type="radio"
                      name="reportingStatus"
                      value={r.id}
                      checked={reportingStatus === r.id}
                      onChange={() =>
                        setReportingStatus(
                          r.id as
                            | 'passed_incomplete'
                            | 'passed_failed'
                            | 'completed_incomplete'
                            | 'completed_failed'
                        )
                      }
                      className="accent-gray-900"
                    />
                  </label>
                ))}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={includeExitLink}
                    onChange={(e) => setIncludeExitLink(e.target.checked)}
                    className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                  />
                  <span className="font-semibold text-gray-800">
                    Include &quot;Exit Course&quot; button in course player to send SCORM termination commit
                  </span>
                </label>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
