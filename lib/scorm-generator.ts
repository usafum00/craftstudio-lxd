import path from 'path';
import fs from 'fs';
import AdmZip from 'adm-zip';
import { Course, Lesson } from './types';

export interface ScormExportOptions {
  format: 'scorm12' | 'scorm2004' | 'web';
  trackingMode: 'completion' | 'quiz';
  completionPercentage?: number;
  quizId?: string;
  reportingStatus?: 'passed_incomplete' | 'passed_failed' | 'completed_incomplete' | 'completed_failed';
  includeExitLink?: boolean;
}

/**
 * Generates standards-compliant imsmanifest.xml for SCORM 1.2 or SCORM 2004 4th Edition
 */
export function generateImsManifest(course: Course, options: ScormExportOptions): string {
  const is12 = options.format === 'scorm12';
  const courseId = `course_${course.id.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  const title = escapeXml(course.title);

  if (is12) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${courseId}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd
                      http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd
                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${title}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="index.html">
      <file href="index.html" />
      <file href="scorm-driver.js" />
      <file href="course-data.js" />
    </resource>
  </resources>
</manifest>`;
  }

  // SCORM 2004 4th Edition
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${courseId}" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                      http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                      http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                      http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                      http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>
  <organizations default="org_1">
    <organization identifier="org_1">
      <title>${title}</title>
      <item identifier="item_1" identifierref="resource_1">
        <title>${title}</title>
        <imsss:sequencing>
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />
        </imsss:sequencing>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormType="sco" href="index.html">
      <file href="index.html" />
      <file href="scorm-driver.js" />
      <file href="course-data.js" />
    </resource>
  </resources>
</manifest>`;
}

/**
 * Universal SCORM 1.2 and SCORM 2004 Driver JavaScript source
 */
export function getScormDriverCode(): string {
  return `/**
 * Universal SCORM 1.2 / 2004 API Driver
 * Automatically finds API bridge across parent frames and window.opener
 */
(function(window) {
  'use strict';

  var SCORM = {
    version: null, // '1.2' or '2004'
    api: null,
    isInitialized: false,

    findAPI: function(win) {
      var findAttempts = 0;
      var maxAttempts = 20;

      while ((!win.API && !win.API_1484_11) && (win.parent && win.parent !== win) && (findAttempts < maxAttempts)) {
        findAttempts++;
        win = win.parent;
      }

      if (win.API_1484_11) {
        SCORM.version = '2004';
        return win.API_1484_11;
      } else if (win.API) {
        SCORM.version = '1.2';
        return win.API;
      }

      return null;
    },

    getAPI: function() {
      if (SCORM.api) return SCORM.api;
      var api = SCORM.findAPI(window);
      if (!api && window.opener && typeof window.opener !== 'undefined') {
        api = SCORM.findAPI(window.opener);
      }
      SCORM.api = api;
      return api;
    },

    init: function() {
      if (SCORM.isInitialized) return true;
      var api = SCORM.getAPI();
      if (!api) {
        console.warn('[SCORM] No LMS API found. Running in standalone local mode.');
        return false;
      }

      var result = false;
      if (SCORM.version === '1.2') {
        result = (api.LMSInitialize("") === "true" || api.LMSInitialize("") === true);
      } else if (SCORM.version === '2004') {
        result = (api.Initialize("") === "true" || api.Initialize("") === true);
      }

      SCORM.isInitialized = result;
      console.log('[SCORM] Session initialized:', result, 'Version:', SCORM.version);
      return result;
    },

    getValue: function(element) {
      var api = SCORM.getAPI();
      if (!api || !SCORM.isInitialized) return "";
      if (SCORM.version === '1.2') {
        return api.LMSGetValue(element) || "";
      } else {
        return api.GetValue(element) || "";
      }
    },

    setValue: function(element, value) {
      var api = SCORM.getAPI();
      if (!api || !SCORM.isInitialized) return false;
      var result = false;
      if (SCORM.version === '1.2') {
        result = api.LMSSetValue(element, value);
      } else {
        result = api.SetValue(element, value);
      }
      return (result === "true" || result === true);
    },

    commit: function() {
      var api = SCORM.getAPI();
      if (!api || !SCORM.isInitialized) return false;
      if (SCORM.version === '1.2') {
        return api.LMSCommit("") === "true";
      } else {
        return api.Commit("") === "true";
      }
    },

    finish: function() {
      if (!SCORM.isInitialized) return false;
      var api = SCORM.getAPI();
      if (!api) return false;

      var result = false;
      if (SCORM.version === '1.2') {
        result = api.LMSFinish("");
      } else {
        result = api.Terminate("");
      }
      SCORM.isInitialized = false;
      return (result === "true" || result === true);
    },

    // Suspend Data helpers (stores JSON state)
    getSuspendData: function() {
      var raw = SCORM.getValue('cmi.suspend_data');
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return null;
      }
    },

    setSuspendData: function(dataObj) {
      try {
        var str = JSON.stringify(dataObj);
        SCORM.setValue('cmi.suspend_data', str);
        SCORM.commit();
        return true;
      } catch (e) {
        return false;
      }
    },

    // Status helpers
    setCompletion: function(status, success) {
      if (!SCORM.isInitialized) return;
      if (SCORM.version === '1.2') {
        // Status: 'completed', 'incomplete', 'passed', 'failed'
        var val = success ? 'passed' : status;
        SCORM.setValue('cmi.core.lesson_status', val);
      } else {
        // SCORM 2004: completion_status ('completed', 'incomplete') and success_status ('passed', 'failed')
        SCORM.setValue('cmi.completion_status', status);
        if (typeof success !== 'undefined') {
          SCORM.setValue('cmi.success_status', success ? 'passed' : 'failed');
        }
      }
      SCORM.commit();
    },

    // Score helpers
    setScore: function(rawScore, min, max, scaled) {
      if (!SCORM.isInitialized) return;
      if (SCORM.version === '1.2') {
        SCORM.setValue('cmi.core.score.raw', String(rawScore));
        SCORM.setValue('cmi.core.score.min', String(min || 0));
        SCORM.setValue('cmi.core.score.max', String(max || 100));
      } else {
        SCORM.setValue('cmi.score.raw', String(rawScore));
        SCORM.setValue('cmi.score.min', String(min || 0));
        SCORM.setValue('cmi.score.max', String(max || 100));
        if (typeof scaled !== 'undefined') {
          SCORM.setValue('cmi.score.scaled', String(scaled));
        }
      }
      SCORM.commit();
    }
  };

  // Auto clean-up on window unload
  window.addEventListener('beforeunload', function() {
    SCORM.commit();
    SCORM.finish();
  });

  window.SCORM = SCORM;
})(window);
`;
}

/**
 * HTML5 Self-Contained Learner Player Template
 */
export function generateStandalonePlayerHtml(course: Course, options: ScormExportOptions): string {
  const accentColor = course.themeSettings?.accentColor || '#ff5722';
  const fontHeading = course.themeSettings?.fontHeading || 'Plus Jakarta Sans';
  const fontBody = course.themeSettings?.fontBody || 'Inter';
  const isScorm = options.format !== 'web';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeXml(course.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  ${isScorm ? '<script src="scorm-driver.js"></script>' : ''}
  <script src="course-data.js"></script>
  <style>
    :root {
      --brand-accent: ${accentColor};
      --font-heading: '${fontHeading}', sans-serif;
      --font-body: '${fontBody}', sans-serif;
    }
    body {
      font-family: var(--font-body);
      color: #111827;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
      overflow-x: hidden;
    }
    h1, h2, h3, h4, .font-heading {
      font-family: var(--font-heading);
    }
    .brand-accent-bg { background-color: var(--brand-accent); }
    .brand-accent-text { color: var(--brand-accent); }
    .brand-accent-border { border-color: var(--brand-accent); }
    .brand-accent-ring { outline-color: var(--brand-accent); }
    /* Circular Progress Ring */
    .progress-ring-circle {
      transition: stroke-dashoffset 0.35s;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-shake { animation: shake 0.5s ease-in-out; }
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 99px; }
    ::-webkit-scrollbar-track { background: transparent; }
  </style>
</head>
<body class="min-h-screen flex flex-col">
  <div id="player-root" class="min-h-screen flex flex-col"></div>

  <script>
    (function() {
      'use strict';
      var course = window.COURSE_DATA || {};
      var isScorm = ${isScorm ? 'true' : 'false'};
      var options = ${JSON.stringify(options)};

      // State Management
      var state = {
        view: 'cover', // 'cover' or 'lesson'
        activeLessonId: null,
        completedLessons: [],
        lessonScrollProgress: {}, // lessonId -> percentage (0 - 100)
        unlockedContinueIds: [],
        completedInteractions: {}, // blockId -> boolean
        quizScores: {}, // quizId -> score (0 - 100)
        sidebarOpen: true,
        searchQuery: '',
      };

      // Load Saved State
      if (isScorm && window.SCORM) {
        window.SCORM.init();
        var saved = window.SCORM.getSuspendData();
        if (saved) {
          state.completedLessons = saved.completedLessons || [];
          state.activeLessonId = saved.activeLessonId || null;
          state.unlockedContinueIds = saved.unlockedContinueIds || [];
          state.quizScores = saved.quizScores || {};
          if (state.completedLessons.length > 0 && state.activeLessonId) {
            state.view = 'lesson';
          }
        }
      } else {
        var local = localStorage.getItem('rise_progress_' + course.id);
        if (local) {
          try {
            var parsed = JSON.parse(local);
            state.completedLessons = parsed.completedLessons || [];
            state.activeLessonId = parsed.activeLessonId || null;
            state.unlockedContinueIds = parsed.unlockedContinueIds || [];
            state.quizScores = parsed.quizScores || {};
            if (state.completedLessons.length > 0 && state.activeLessonId) {
              state.view = 'lesson';
            }
          } catch(e) {}
        }
      }

      function persistState() {
        var payload = {
          completedLessons: state.completedLessons,
          activeLessonId: state.activeLessonId,
          unlockedContinueIds: state.unlockedContinueIds,
          quizScores: state.quizScores,
        };

        if (isScorm && window.SCORM) {
          window.SCORM.setSuspendData(payload);
          evaluateScormCompletion();
        } else {
          localStorage.setItem('rise_progress_' + course.id, JSON.stringify(payload));
        }
      }

      function evaluateScormCompletion() {
        if (!isScorm || !window.SCORM) return;
        var playable = (course.lessons || []).filter(function(l) { return l.type !== 'section'; });
        var total = playable.length;
        var completedCount = state.completedLessons.length;
        var pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        if (options.trackingMode === 'quiz' && options.quizId) {
          var quizScore = state.quizScores[options.quizId] || 0;
          var passingScore = 80;
          var quizLesson = (course.lessons || []).find(function(l) { return l.id === options.quizId; });
          if (quizLesson && quizLesson.quizSettings && quizLesson.quizSettings.passingScore) {
            passingScore = quizLesson.quizSettings.passingScore;
          }
          var passed = quizScore >= passingScore;
          window.SCORM.setScore(quizScore, 0, 100, quizScore / 100);
          window.SCORM.setCompletion(passed ? 'completed' : 'incomplete', passed);
        } else {
          var reqPct = options.completionPercentage || 100;
          var isDone = pct >= reqPct;
          window.SCORM.setScore(pct, 0, 100, pct / 100);
          window.SCORM.setCompletion(isDone ? 'completed' : 'incomplete', isDone);
        }
      }

      function render() {
        var root = document.getElementById('player-root');
        if (!root) return;

        if (state.view === 'cover') {
          root.innerHTML = renderCoverPage();
          attachCoverEvents();
        } else {
          root.innerHTML = renderLessonPage();
          attachLessonEvents();
        }
      }

      function renderCoverPage() {
        var lessons = (course.lessons || []);
        var playable = lessons.filter(function(l) { return l.type !== 'section'; });
        var hasProgress = state.completedLessons.length > 0;
        var coverImg = course.coverImage || course.themeSettings?.coverImageUrl || './assets/cover.jpg';
        var layout = course.themeSettings?.coverLayout || 'split';

        var outlineHtml = '';
        lessons.forEach(function(l, i) {
          if (l.type === 'section') {
            outlineHtml += '<div class="pt-6 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">' + escapeXml(l.title) + '</div>';
          } else {
            var isDone = state.completedLessons.indexOf(l.id) !== -1;
            outlineHtml += '<div data-lesson-id="' + l.id + '" class="cursor-pointer py-3.5 px-3 rounded-xl hover:bg-gray-50 flex items-center justify-between group transition-colors">' +
              '<div class="flex items-center gap-3">' +
                '<span class="text-xs font-bold text-gray-400 w-5">' + (i + 1) + '</span>' +
                '<span class="text-xs font-semibold text-gray-800 group-hover:text-black">' + escapeXml(l.title) + '</span>' +
              '</div>' +
              (isDone ? '<span class="w-5 h-5 rounded-full brand-accent-bg text-white flex items-center justify-center text-[10px]">✓</span>' : '<span class="text-[11px] text-gray-400">' + (l.type === 'quiz' ? 'Quiz' : 'Lesson') + '</span>') +
            '</div>';
          }
        });

        if (layout === 'overlay') {
          return '<div class="relative min-h-screen flex flex-col justify-between bg-slate-900 text-white overflow-hidden">' +
            '<div class="absolute inset-0 bg-cover bg-center" style="background-image: url(' + coverImg + '); opacity: 0.35;"></div>' +
            '<header class="relative z-10 px-8 py-6 flex items-center justify-between">' +
              '<div class="text-xs font-bold tracking-widest uppercase opacity-75">' + escapeXml(course.authorName || 'LearnByCraft') + '</div>' +
            '</header>' +
            '<main class="relative z-10 max-w-3xl mx-auto px-6 text-center space-y-6 my-auto py-12">' +
              '<h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">' + escapeXml(course.title) + '</h1>' +
              '<p class="text-sm sm:text-base text-gray-200 leading-relaxed max-w-xl mx-auto">' + escapeXml(course.description || '') + '</p>' +
              '<button id="btn-start-course" class="brand-accent-bg text-white px-10 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-xl hover:scale-105 transition-transform">' + (hasProgress ? 'Resume Course' : 'Start Course') + '</button>' +
            '</main>' +
            '<footer class="relative z-10 px-8 py-6 text-center text-xs opacity-60">' + playable.length + ' Lessons • Passing Score 80%</footer>' +
          '</div>';
        }

        // Default 50/50 Split Screen Cover Page
        return '<div class="min-h-screen bg-white flex flex-col md:flex-row">' +
          '<div class="w-full md:w-1/2 p-8 sm:p-14 flex flex-col justify-between border-r border-gray-100">' +
            '<div class="space-y-6">' +
              '<div class="flex items-center gap-2">' +
                '<span class="w-2.5 h-2.5 rounded-full brand-accent-bg"></span>' +
                '<span class="text-xs font-bold uppercase tracking-wider text-gray-400">Course</span>' +
              '</div>' +
              '<h1 class="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-snug">' + escapeXml(course.title) + '</h1>' +
              '<p class="text-xs sm:text-sm text-gray-600 leading-relaxed">' + escapeXml(course.description || '') + '</p>' +
              '<button id="btn-start-course" class="brand-accent-bg text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer">' + (hasProgress ? 'Resume Course' : 'Start Course') + '</button>' +
            '</div>' +
            '<div class="mt-12 space-y-2">' +
              '<div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Course Outline</div>' +
              '<div class="divide-y divide-gray-50 max-h-72 overflow-y-auto pr-2">' + outlineHtml + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="w-full md:w-1/2 bg-slate-100 min-h-[300px] md:min-h-screen relative overflow-hidden">' +
            '<img src="' + coverImg + '" alt="Course Cover" class="w-full h-full object-cover" />' +
          '</div>' +
        '</div>';
      }

      function renderLessonPage() {
        var lessons = (course.lessons || []);
        var activeLesson = lessons.find(function(l) { return l.id === state.activeLessonId; }) || lessons.find(function(l) { return l.type !== 'section'; });
        if (!activeLesson) return '<div class="p-8 text-center">No lessons found.</div>';

        var playable = lessons.filter(function(l) { return l.type !== 'section'; });
        var currentIdx = playable.findIndex(function(l) { return l.id === activeLesson.id; });
        var nextLesson = currentIdx < playable.length - 1 ? playable[currentIdx + 1] : null;
        var prevLesson = currentIdx > 0 ? playable[currentIdx - 1] : null;
        var pctComplete = playable.length > 0 ? Math.round((state.completedLessons.length / playable.length) * 100) : 0;

        // Render Sidebar Lesson List
        var sidebarListHtml = '';
        var isNavRestricted = course.themeSettings?.navigationMode === 'restricted' || course.publishSettings?.navigationMode === 'restricted';
        var prevIsDone = true;

        lessons.forEach(function(l, i) {
          if (l.type === 'section') {
            sidebarListHtml += '<div class="pt-5 pb-1 px-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">' + escapeXml(l.title) + '</div>';
          } else {
            var isActive = l.id === activeLesson.id;
            var isDone = state.completedLessons.indexOf(l.id) !== -1;
            var isLocked = isNavRestricted && !prevIsDone && !isDone && !isActive;

            sidebarListHtml += '<div data-sidebar-lesson="' + l.id + '" class="p-3 rounded-xl flex items-center justify-between text-xs transition-colors ' +
              (isActive ? 'bg-gray-100 font-bold text-gray-900' : isLocked ? 'opacity-40 cursor-not-allowed text-gray-400' : 'hover:bg-gray-50 text-gray-700 cursor-pointer') + '">' +
              '<div class="flex items-center gap-2.5 truncate pr-2">' +
                '<span class="text-gray-400 text-[10px]">' + (i + 1) + '</span>' +
                '<span class="truncate">' + escapeXml(l.title) + '</span>' +
              '</div>' +
              '<div class="flex-shrink-0">' +
                (isLocked ? '<span class="text-gray-400">🔒</span>' : isDone ? '<span class="w-4 h-4 rounded-full brand-accent-bg text-white flex items-center justify-center text-[9px] font-bold">✓</span>' : '<span class="w-3.5 h-3.5 rounded-full border border-gray-300"></span>') +
              '</div>' +
            '</div>';

            prevIsDone = isDone;
          }
        });

        // Render Lesson Blocks or Quiz
        var contentBodyHtml = '';
        if (activeLesson.type === 'quiz') {
          contentBodyHtml = renderQuizAssessment(activeLesson);
        } else {
          var isLocked = false;
          (activeLesson.blocks || []).forEach(function(b) {
            if (isLocked) return;
            contentBodyHtml += renderSingleBlock(b);
            if (b.category === 'divider' && b.subtype === 'continue_button') {
              var isUnlocked = state.unlockedContinueIds.indexOf(b.id) !== -1;
              if (!isUnlocked) isLocked = true;
            }
          });
        }

        return '<div class="min-h-screen flex flex-col bg-white">' +
          '<header class="h-14 border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-30">' +
            '<div class="flex items-center gap-3">' +
              '<button id="btn-toggle-sidebar" class="p-1.5 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 cursor-pointer">☰</button>' +
              '<span id="btn-return-cover" class="text-xs font-bold text-gray-900 truncate max-w-xs cursor-pointer hover:underline">' + escapeXml(course.title) + '</span>' +
            '</div>' +
            '<div class="flex items-center gap-4">' +
              '<div class="flex items-center gap-2">' +
                '<div class="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">' +
                  '<div class="h-full brand-accent-bg" style="width: ' + pctComplete + '%"></div>' +
                '</div>' +
                '<span class="text-[11px] font-bold text-gray-400">' + pctComplete + '%</span>' +
              '</div>' +
              (options.includeExitLink ? '<button id="btn-exit-course" class="text-xs text-gray-500 hover:text-rose-600 font-semibold cursor-pointer">Exit Course ✕</button>' : '') +
            '</div>' +
          '</header>' +

          '<div class="flex-1 flex overflow-hidden">' +
            // Sidebar
            '<aside id="player-sidebar" class="w-72 border-r border-gray-100 bg-[#fbfbfb] p-4 flex flex-col justify-between flex-shrink-0 overflow-y-auto ' + (state.sidebarOpen ? '' : 'hidden') + '">' +
              '<div class="space-y-1">' +
                '<div class="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Lessons</div>' +
                sidebarListHtml +
              '</div>' +
            '</aside>' +

            // Main Lesson Canvas
            '<main id="lesson-viewport" class="flex-1 overflow-y-auto px-6 sm:px-12 py-10">' +
              '<div class="max-w-3xl mx-auto space-y-10">' +
                '<div class="space-y-2 pb-6 border-b border-gray-100">' +
                  '<div class="text-[11px] font-bold uppercase tracking-widest text-gray-400">' + (activeLesson.type === 'quiz' ? 'Quiz / Assessment' : 'Lesson') + '</div>' +
                  '<h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">' + escapeXml(activeLesson.title) + '</h1>' +
                '</div>' +

                '<div class="space-y-8">' + contentBodyHtml + '</div>' +

                // Next Lesson Banner
                (nextLesson ?
                  '<div id="banner-next-lesson" data-next-id="' + nextLesson.id + '" class="mt-16 p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer flex items-center justify-between group transition-all">' +
                    '<div>' +
                      '<div class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Next Lesson</div>' +
                      '<div class="text-sm font-bold text-gray-900 group-hover:text-black">' + escapeXml(nextLesson.title) + '</div>' +
                    '</div>' +
                    '<span class="w-8 h-8 rounded-full brand-accent-bg text-white flex items-center justify-center font-bold text-sm">↓</span>' +
                  '</div>' :
                  '<div class="mt-16 p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">' +
                    '<div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">✓</div>' +
                    '<h3 class="text-base font-bold text-emerald-950">Congratulations! You finished all lessons.</h3>' +
                    '<p class="text-xs text-emerald-700">Your progress has been recorded and submitted to the LMS.</p>' +
                  '</div>'
                ) +
              '</div>' +
            '</main>' +
          '</div>' +
        '</div>';
      }

      function renderSingleBlock(b) {
        var content = b.content || {};
        var subtype = b.subtype || '';

        // Text
        if (b.category === 'text') {
          var h = content.heading ? '<h3 class="text-lg font-bold text-gray-900 mb-2">' + escapeXml(content.heading) + '</h3>' : '';
          var body = content.body || '<p>Text content</p>';
          return '<div class="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed">' + h + body + '</div>';
        }

        // Statement
        if (b.category === 'statement') {
          var st = content.statement || '';
          var sub = content.subtext ? '<p class="text-xs text-gray-500 mt-2">' + escapeXml(content.subtext) + '</p>' : '';
          if (subtype === 'statement_b') {
            return '<div class="py-6 text-center space-y-3"><div class="w-10 h-1 mx-auto rounded brand-accent-bg"></div><h2 class="text-base sm:text-xl font-bold text-gray-900 leading-snug">' + escapeXml(st) + '</h2>' + sub + '</div>';
          }
          if (subtype === 'note') {
            return '<div class="p-5 rounded-xl bg-gray-50 border-l-4 brand-accent-border space-y-1"><h4 class="font-bold text-xs sm:text-sm text-gray-900">' + escapeXml(st) + '</h4>' + sub + '</div>';
          }
          if (subtype === 'statement_warning') {
            return '<div class="p-5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1"><h4 class="font-bold text-xs sm:text-sm">⚠️ ' + escapeXml(st) + '</h4>' + sub + '</div>';
          }
          return '<div class="p-6 rounded-2xl bg-gray-100 text-center"><h2 class="text-base sm:text-lg font-bold text-gray-900">' + escapeXml(st) + '</h2>' + sub + '</div>';
        }

        // Quote
        if (b.category === 'quote') {
          return '<blockquote class="p-6 rounded-2xl bg-white border border-gray-100 shadow-2xs text-center space-y-2"><div class="text-2xl text-gray-300 font-serif">“</div><p class="text-sm sm:text-base font-semibold text-gray-800 italic">' + escapeXml(content.quote || '') + '</p><cite class="block text-xs font-bold text-gray-400 uppercase tracking-wider not-italic">— ' + escapeXml(content.author || 'Anonymous') + '</cite></blockquote>';
        }

        // List
        if (b.category === 'list') {
          var items = content.items || ['Item 1', 'Item 2'];
          var itemsHtml = '';
          items.forEach(function(it, idx) {
            itemsHtml += '<li class="flex items-center gap-3"><span class="w-5 h-5 rounded-full brand-accent-bg text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">' + (idx + 1) + '</span><span class="text-xs sm:text-sm text-gray-700">' + escapeXml(it) + '</span></li>';
          });
          return '<ul class="space-y-3 p-4 bg-white rounded-2xl border border-gray-100">' + itemsHtml + '</ul>';
        }

        // Image
        if (b.category === 'image') {
          var url = content.url || './assets/cover.jpg';
          return '<div class="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50"><img src="' + url + '" alt="' + escapeXml(content.alt || '') + '" class="w-full h-auto object-cover" />' + (content.caption ? '<p class="text-center text-xs text-gray-400 py-2">' + escapeXml(content.caption) + '</p>' : '') + '</div>';
        }

        // Interactive: Accordion
        if (b.category === 'interactive' && subtype === 'accordion') {
          var accItems = content.items || [];
          var accHtml = '';
          accItems.forEach(function(item, idx) {
            accHtml += '<div class="border border-gray-200 rounded-xl overflow-hidden bg-white mb-2">' +
              '<button type="button" class="btn-acc-toggle w-full p-4 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-gray-800 hover:bg-gray-50">' +
                '<span>' + escapeXml(item.title) + '</span>' +
                '<span class="text-gray-400 text-base">+</span>' +
              '</button>' +
              '<div class="acc-body hidden p-4 pt-0 text-xs sm:text-sm text-gray-600 border-t border-gray-50 bg-gray-50/50">' + escapeXml(item.content) + '</div>' +
            '</div>';
          });
          return '<div class="space-y-2">' + accHtml + '</div>';
        }

        // Interactive: Flashcards
        if (b.category === 'interactive' && (subtype === 'flashcards' || subtype === 'flashcard_stack')) {
          var cards = content.cards || [];
          var cardsHtml = '';
          cards.forEach(function(c) {
            cardsHtml += '<div class="flashcard-item p-6 rounded-2xl border border-gray-200 bg-white min-h-[160px] flex flex-col justify-between cursor-pointer select-none shadow-2xs hover:shadow-md transition-all">' +
              '<span class="text-[10px] font-bold text-gray-400 uppercase">Click to flip</span>' +
              '<div class="card-text text-sm sm:text-base font-bold text-gray-900 text-center" data-front="' + escapeXml(c.front) + '" data-back="' + escapeXml(c.back) + '">' + escapeXml(c.front) + '</div>' +
              '<span class="text-[10px] font-semibold text-gray-400 text-right">🔄</span>' +
            '</div>';
          });
          return '<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">' + cardsHtml + '</div>';
        }

        // Knowledge Check: Multiple Choice
        if (b.category === 'knowledge_check') {
          var opts = content.options || [];
          var qTitle = content.question || 'Knowledge Check';
          var optsHtml = '';
          opts.forEach(function(o, idx) {
            optsHtml += '<button type="button" data-kc-opt="' + idx + '" data-is-correct="' + (o.isCorrect ? 'true' : 'false') + '" class="btn-kc-choice w-full p-3.5 rounded-xl border border-gray-200 hover:border-gray-400 bg-white text-left text-xs sm:text-sm font-medium transition-all mb-2 flex items-center justify-between">' +
              '<span>' + escapeXml(o.text) + '</span>' +
            '</button>';
          });
          return '<div class="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">' +
            '<div class="text-xs font-bold uppercase tracking-wider text-sky-600">Knowledge Check</div>' +
            '<h4 class="text-sm sm:text-base font-bold text-gray-900">' + escapeXml(qTitle) + '</h4>' +
            '<div>' + optsHtml + '</div>' +
            '<div class="kc-feedback hidden p-4 rounded-xl text-xs leading-relaxed"></div>' +
          '</div>';
        }

        // Continue Button with Gating
        if (b.category === 'divider' && subtype === 'continue_button') {
          var isUnlocked = state.unlockedContinueIds.indexOf(b.id) !== -1;
          return '<div class="py-8 flex flex-col items-center justify-center">' +
            '<button type="button" data-continue-id="' + b.id + '" class="btn-continue px-8 py-3 rounded-full text-white text-xs font-bold uppercase tracking-wider brand-accent-bg shadow-md hover:scale-105 transition-all cursor-pointer">' +
              (isUnlocked ? '✓ Completed' : escapeXml(content.label || 'Continue')) +
            '</button>' +
          '</div>';
        }

        // Default Divider
        if (b.category === 'divider') {
          return '<hr class="border-gray-200 my-6" />';
        }

        return '<div class="py-2 text-xs text-gray-400">[' + b.category + ' block]</div>';
      }

      function renderQuizAssessment(lesson) {
        var qs = lesson.blocks || [];
        var passingScore = (lesson.quizSettings && lesson.quizSettings.passingScore) || 80;
        var existingResult = state.quizScores[lesson.id];

        if (existingResult && existingResult.submitted) {
          var isPassed = existingResult.score >= passingScore;
          return '<div class="p-8 sm:p-12 rounded-3xl bg-white border border-gray-200 shadow-sm text-center space-y-6 max-w-2xl mx-auto">' +
            '<div class="w-16 h-16 rounded-full ' + (isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') + ' flex items-center justify-center text-3xl font-bold mx-auto">' +
              (isPassed ? '✓' : '✕') +
            '</div>' +
            '<div class="space-y-2">' +
              '<div class="text-xs font-bold uppercase tracking-widest text-gray-400">Quiz Results</div>' +
              '<h2 class="text-2xl font-black text-gray-900">' + (isPassed ? 'Assessment Passed' : 'Assessment Not Passed') + '</h2>' +
              '<div class="text-3xl font-extrabold ' + (isPassed ? 'text-emerald-600' : 'text-rose-600') + '">' + existingResult.score + '%</div>' +
              '<p class="text-xs text-gray-500">Your Score: ' + existingResult.earned + ' out of ' + existingResult.total + ' points • Passing score is ' + passingScore + '%</p>' +
            '</div>' +
            '<button id="btn-retake-quiz" data-quiz-id="' + lesson.id + '" class="brand-accent-bg text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer">Retake Assessment</button>' +
          '</div>';
        }

        var html = '<div class="max-w-2xl mx-auto space-y-8" id="scorm-quiz-container">' +
          '<div class="text-center space-y-2 border-b border-gray-100 pb-6">' +
            '<div class="text-xs font-bold uppercase tracking-widest text-gray-400">Graded Assessment</div>' +
            '<h2 class="text-2xl font-black text-gray-900">' + escapeXml(lesson.title) + '</h2>' +
            '<p class="text-xs text-gray-500">Passing score required: ' + passingScore + '%</p>' +
          '</div>';

        html += '<div id="quiz-error-alert" role="alert" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold text-center">Please answer all questions before submitting your assessment.</div>';

        qs.forEach(function(q, qIdx) {
          var qTitle = q.title || ('Question ' + (qIdx + 1));
          var isMulti = q.type === 'multiple_response';
          var inputType = isMulti ? 'checkbox' : 'radio';

          html += '<fieldset class="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-4">' +
            '<legend class="font-bold text-sm text-gray-900 px-1">' + (qIdx + 1) + '. ' + escapeXml(qTitle) + '</legend>' +
            '<div class="text-[11px] text-gray-400 font-medium">' + (isMulti ? 'Select all that apply:' : 'Select one answer:') + '</div>' +
            '<div class="space-y-2">';

          var opts = q.options || [];
          opts.forEach(function(opt, oIdx) {
            var optId = opt.id || ('opt-' + qIdx + '-' + oIdx);
            var optName = 'quiz-q-' + (q.id || qIdx);
            html += '<label class="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 cursor-pointer transition-all text-xs text-gray-800">' +
              '<input type="' + inputType + '" name="' + optName + '" value="' + optId + '" data-q-idx="' + qIdx + '" class="scorm-quiz-input mt-0.5 accent-gray-900" />' +
              '<span>' + escapeXml(opt.text) + '</span>' +
            '</label>';
          });

          html += '</div></fieldset>';
        });

        html += '<div class="text-center pt-4">' +
          '<button id="btn-submit-scorm-quiz" data-quiz-id="' + lesson.id + '" class="brand-accent-bg text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer">Submit Assessment</button>' +
        '</div></div>';

        return html;
      }

      function attachCoverEvents() {
        var btn = document.getElementById('btn-start-course');
        if (btn) {
          btn.addEventListener('click', function() {
            var firstPlayable = (course.lessons || []).find(function(l) { return l.type !== 'section'; });
            if (firstPlayable) {
              state.activeLessonId = firstPlayable.id;
              state.view = 'lesson';
              persistState();
              render();
            }
          });
        }

        document.querySelectorAll('[data-lesson-id]').forEach(function(el) {
          el.addEventListener('click', function() {
            var id = this.getAttribute('data-lesson-id');
            state.activeLessonId = id;
            state.view = 'lesson';
            persistState();
            render();
          });
        });
      }

      function attachLessonEvents() {
        var toggleBtn = document.getElementById('btn-toggle-sidebar');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', function() {
            state.sidebarOpen = !state.sidebarOpen;
            render();
          });
        }

        var returnCoverBtn = document.getElementById('btn-return-cover');
        if (returnCoverBtn) {
          returnCoverBtn.addEventListener('click', function() {
            state.view = 'cover';
            render();
          });
        }

        var exitBtn = document.getElementById('btn-exit-course');
        if (exitBtn) {
          exitBtn.addEventListener('click', function() {
            if (isScorm && window.SCORM) {
              window.SCORM.commit();
              window.SCORM.finish();
            }
            window.close();
          });
        }

        // Sidebar Lesson Clicks
        document.querySelectorAll('[data-sidebar-lesson]').forEach(function(el) {
          el.addEventListener('click', function() {
            var id = this.getAttribute('data-sidebar-lesson');
            state.activeLessonId = id;
            persistState();
            render();
          });
        });

        // Next Lesson Banner Click
        var nextBanner = document.getElementById('banner-next-lesson');
        if (nextBanner) {
          nextBanner.addEventListener('click', function() {
            var nextId = this.getAttribute('data-next-id');
            if (state.activeLessonId && state.completedLessons.indexOf(state.activeLessonId) === -1) {
              state.completedLessons.push(state.activeLessonId);
            }
            state.activeLessonId = nextId;
            persistState();
            render();
          });
        }

        // Accordion Toggles
        document.querySelectorAll('.btn-acc-toggle').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var body = this.nextElementSibling;
            if (body) {
              body.classList.toggle('hidden');
              this.querySelector('span:last-child').innerText = body.classList.contains('hidden') ? '+' : '−';
            }
          });
        });

        // Flashcard Flip
        document.querySelectorAll('.flashcard-item').forEach(function(card) {
          card.addEventListener('click', function() {
            var textEl = this.querySelector('.card-text');
            var front = textEl.getAttribute('data-front');
            var back = textEl.getAttribute('data-back');
            if (textEl.innerText === front) {
              textEl.innerText = back;
            } else {
              textEl.innerText = front;
            }
          });
        });

        // Knowledge Check Choices
        document.querySelectorAll('.btn-kc-choice').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var isCorrect = this.getAttribute('data-is-correct') === 'true';
            var parent = this.closest('.rounded-2xl');
            var feedback = parent.querySelector('.kc-feedback');
            if (feedback) {
              feedback.classList.remove('hidden');
              if (isCorrect) {
                feedback.className = 'kc-feedback p-4 rounded-xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-200';
                feedback.innerHTML = '<strong>Correct!</strong> Great job identifying the defense safeguard.';
                this.classList.add('bg-emerald-50', 'border-emerald-400');
              } else {
                feedback.className = 'kc-feedback p-4 rounded-xl text-xs bg-rose-50 text-rose-900 border border-rose-200';
                feedback.innerHTML = '<strong>Incorrect.</strong> Review the lesson materials and try again.';
                this.classList.add('bg-rose-50', 'border-rose-300');
              }
            }
          });
        });

        // Continue Button Click
        document.querySelectorAll('.btn-continue').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var id = this.getAttribute('data-continue-id');
            if (state.unlockedContinueIds.indexOf(id) === -1) {
              state.unlockedContinueIds.push(id);
              persistState();
              render();
            }
          });
        });

        // Quiz Submit Button
        var quizSubmitBtn = document.getElementById('btn-submit-scorm-quiz');
        if (quizSubmitBtn) {
          quizSubmitBtn.addEventListener('click', function() {
            var qId = this.getAttribute('data-quiz-id');
            var lesson = (course.lessons || []).find(function(l) { return l.id === qId; });
            if (!lesson) return;

            var questions = lesson.blocks || [];
            var alertEl = document.getElementById('quiz-error-alert');

            // Verify all questions are answered
            var allAnswered = true;
            questions.forEach(function(q, qIdx) {
              var optName = 'quiz-q-' + (q.id || qIdx);
              var checked = document.querySelectorAll('input[name="' + optName + '"]:checked');
              if (checked.length === 0) {
                allAnswered = false;
              }
            });

            if (!allAnswered) {
              if (alertEl) {
                alertEl.classList.remove('hidden');
                alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              return;
            }

            if (alertEl) alertEl.classList.add('hidden');

            // Calculate score
            var totalPoints = 0;
            var earnedPoints = 0;

            questions.forEach(function(q, qIdx) {
              var pts = Number(q.points) || 10;
              totalPoints += pts;

              var optName = 'quiz-q-' + (q.id || qIdx);
              var selectedInputs = Array.prototype.slice.call(document.querySelectorAll('input[name="' + optName + '"]:checked'));
              var selectedIds = selectedInputs.map(function(inp) { return inp.value; });

              var opts = q.options || [];
              var isQuestionCorrect = false;

              if (q.type === 'multiple_response') {
                var allCorrectChosen = opts.every(function(opt, oIdx) {
                  var optId = opt.id || ('opt-' + qIdx + '-' + oIdx);
                  var isSelected = selectedIds.indexOf(optId) !== -1;
                  return opt.isCorrect ? isSelected : !isSelected;
                });
                isQuestionCorrect = allCorrectChosen;
              } else {
                // Single choice
                var correctOpt = opts.find(function(o) { return o.isCorrect === true; });
                var correctOptId = correctOpt ? (correctOpt.id || ('opt-' + qIdx + '-' + opts.indexOf(correctOpt))) : null;
                isQuestionCorrect = correctOptId && selectedIds.length === 1 && selectedIds[0] === correctOptId;
              }

              if (isQuestionCorrect) {
                earnedPoints += pts;
              }
            });

            var scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
            var passingScore = (lesson.quizSettings && lesson.quizSettings.passingScore) || 80;
            var isPassed = scorePercent >= passingScore;

            state.quizScores[qId] = {
              submitted: true,
              earned: earnedPoints,
              total: totalPoints,
              score: scorePercent,
              passed: isPassed
            };

            // Report to SCORM LMS
            if (window.API) {
              try {
                window.API.LMSSetValue('cmi.core.score.raw', String(scorePercent));
                window.API.LMSSetValue('cmi.core.lesson_status', isPassed ? 'passed' : 'failed');
                window.API.LMSCommit('');
              } catch (e) {}
            }
            if (window.API_1484_11) {
              try {
                window.API_1484_11.SetValue('cmi.score.raw', String(scorePercent));
                window.API_1484_11.SetValue('cmi.success_status', isPassed ? 'passed' : 'failed');
                window.API_1484_11.Commit('');
              } catch (e) {}
            }

            if (isPassed && state.completedLessons.indexOf(qId) === -1) {
              state.completedLessons.push(qId);
            }

            persistState();
            render();
          });
        }

        // Retake Quiz Button
        var retakeBtn = document.getElementById('btn-retake-quiz');
        if (retakeBtn) {
          retakeBtn.addEventListener('click', function() {
            var qId = this.getAttribute('data-quiz-id');
            delete state.quizScores[qId];
            persistState();
            render();
          });
        }
      }

      function escapeXml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
          switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return m;
          }
        });
      }

      // Initial Render
      render();
    })();
  </script>
</body>
</html>`;
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return m;
    }
  });
}

/**
 * Builds the complete working .zip archive with XML manifests, JavaScript bridges,
 * standalone HTML player, and all bundled local media files.
 */
export async function buildScormZipArchive(
  course: Course & { lessons: Lesson[] },
  options: ScormExportOptions
): Promise<Buffer> {
  const zip = new AdmZip();

  // 1. Add manifest if SCORM 1.2 or 2004
  if (options.format !== 'web') {
    const manifestXml = generateImsManifest(course, options);
    zip.addFile('imsmanifest.xml', Buffer.from(manifestXml, 'utf-8'));

    const scormDriverJs = getScormDriverCode();
    zip.addFile('scorm-driver.js', Buffer.from(scormDriverJs, 'utf-8'));
  }

  // 2. Bundle course data JSON & rewritten asset URLs
  const localAssetsDir = path.join(process.cwd(), 'public');
  const bundledCourse = JSON.parse(JSON.stringify(course));

  // Scan and copy assets referenced in course to zip/assets/
  const referencedUrls: string[] = [];

  function collectUrls(obj: unknown) {
    if (!obj || typeof obj !== 'object') return;
    const record = obj as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const val = record[key];
      if (typeof val === 'string' && (val.startsWith('/thumbnails/') || val.startsWith('/uploads/'))) {
        referencedUrls.push(val);
      } else if (typeof val === 'object') {
        collectUrls(val);
      }
    }
  }

  collectUrls(bundledCourse);

  // Copy each referenced asset into the zip
  const uniqueUrls = Array.from(new Set(referencedUrls));
  for (const relUrl of uniqueUrls) {
    const diskPath = path.join(localAssetsDir, relUrl);
    if (fs.existsSync(diskPath) && !fs.statSync(diskPath).isDirectory()) {
      const fileData = fs.readFileSync(diskPath);
      const zipAssetPath = path.join('assets', path.basename(relUrl));
      zip.addFile(zipAssetPath, fileData);
    }
  }

  // Add default cover asset if it exists
  const defaultCover = path.join(localAssetsDir, 'thumbnails', 'social-engineering.svg');
  if (fs.existsSync(defaultCover)) {
    zip.addFile('assets/cover.jpg', fs.readFileSync(defaultCover));
  }

  // Course data script
  const courseDataJs = `window.COURSE_DATA = ${JSON.stringify(bundledCourse, null, 2)};`;
  zip.addFile('course-data.js', Buffer.from(courseDataJs, 'utf-8'));

  // 3. Add standalone HTML5 Player
  const playerHtml = generateStandalonePlayerHtml(bundledCourse, options);
  zip.addFile('index.html', Buffer.from(playerHtml, 'utf-8'));

  // Return the zip buffer
  return zip.toBuffer();
}
