'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
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
import { Course, Lesson, Block, BlockCategory, BlockSettings, ThemeSettings, PublishSettings } from '@/lib/types';
import { BlockWrapper } from '@/components/editor/BlockWrapper';
import { BlockLibraryDrawer } from '@/components/editor/BlockLibraryDrawer';
import { BlockSettingsDrawer } from '@/components/editor/BlockSettingsDrawer';
import { ThemeSettingsModal } from '@/components/outline/ThemeSettingsModal';
import { PublishModal } from '@/components/publish/PublishModal';
import { SnapshotDropdown } from '@/components/snapshots/SnapshotDropdown';
import { ShareReviewModal } from '@/components/review/ShareReviewModal';
import { ReviewDrawer } from '@/components/review/ReviewDrawer';
import {
  ChevronLeft,
  ChevronDown,
  Undo2,
  Redo2,
  Palette,
  Settings as SettingsIcon,
  Eye,
  Plus,
  Check,
  Loader2,
  BookOpen,
  HelpCircle,
  Share2,
  MessageSquare,
} from 'lucide-react';

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const resolvedParams = use(params);
  const { courseId, lessonId } = resolvedParams;
  const router = useRouter();

  const [course, setCourse] = useState<(Course & { lessons: Lesson[] }) | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle');

  // Title inline edit
  const [title, setTitle] = useState('');

  // Lesson switcher dropdown
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  // Library Drawer
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [insertTargetIndex, setInsertTargetIndex] = useState(0);

  // Settings / Edit Drawer
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeSettingsBlockId, setActiveSettingsBlockId] = useState<string | null>(null);
  const [settingsDrawerTab, setSettingsDrawerTab] = useState<'content' | 'settings'>('content');

  // Theme / Settings modal
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [themeModalTab, setThemeModalTab] = useState<'theme' | 'settings'>('theme');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // Undo / Redo History Stack for Blocks
  const [blockHistory, setBlockHistory] = useState<Block[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [courseRes, lessonRes] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/lessons/${lessonId}`),
      ]);
      const courseData = await courseRes.json();
      const lessonData = await lessonRes.json();

      if (courseData.course) {
        setCourse(courseData.course);
      }
      if (lessonData.lesson) {
        setLesson(lessonData.lesson);
        setTitle(lessonData.lesson.title);
        if (lessonData.lesson.blocks) {
          setBlockHistory([lessonData.lesson.blocks]);
          setHistoryIndex(0);
        }
      }
    } catch (err) {
      console.error('Failed to load lesson editor data', err);
    } finally {
      setLoading(false);
    }
  };

  const pushBlockHistory = (blocks: Block[]) => {
    setBlockHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, blocks];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = async () => {
    if (historyIndex > 0 && lesson) {
      const prevBlocks = blockHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setLesson({ ...lesson, blocks: prevBlocks });
      await saveBlocks(prevBlocks, false);
    }
  };

  const handleRedo = async () => {
    if (historyIndex < blockHistory.length - 1 && lesson) {
      const nextBlocks = blockHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setLesson({ ...lesson, blocks: nextBlocks });
      await saveBlocks(nextBlocks, false);
    }
  };

  // Keyboard shortcut for Undo / Redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (historyIndex < blockHistory.length - 1) {
            e.preventDefault();
            handleRedo();
          }
        } else {
          if (historyIndex > 0) {
            e.preventDefault();
            handleUndo();
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        if (historyIndex < blockHistory.length - 1) {
          e.preventDefault();
          handleRedo();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, blockHistory, lesson]);

  useEffect(() => {
    loadData();
  }, [courseId, lessonId]);

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

  // Persist updated blocks array to SQLite
  const saveBlocks = async (updatedBlocks: Block[], addToHistory = true) => {
    if (!lesson) return;
    if (addToHistory) {
      pushBlockHistory(updatedBlocks);
    }
    try {
      setSavingStatus('saving');
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: updatedBlocks }),
      });
      if (res.ok) {
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2500);
      } else {
        setSavingStatus('error');
      }
    } catch (err) {
      console.error('Failed to save blocks', err);
      setSavingStatus('error');
    }
  };

  // Update Lesson Title onBlur
  const handleTitleBlur = async () => {
    if (!lesson || title === lesson.title) return;
    try {
      setSavingStatus('saving');
      const res = await fetch(`/api/courses/${courseId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        setLesson({ ...lesson, title });
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2500);
      } else {
        setSavingStatus('error');
      }
    } catch (err) {
      console.error('Failed to update lesson title', err);
      setSavingStatus('error');
    }
  };

  // Insert block from Library Drawer
  const handleInsertBlockVariant = async (
    category: BlockCategory,
    subtype: string,
    targetIndex: number
  ) => {
    if (!lesson) return;

    // Create realistic initial content per variant
    let initialContent: Record<string, unknown> = {};
    const initialSettings: BlockSettings = {
      paddingTop: 'medium',
      paddingBottom: 'medium',
      backgroundColor: 'white',
    };

    if (category === 'text') {
      if (subtype === 'heading') initialContent = { heading: 'New Section Heading' };
      else if (subtype === 'subheading') initialContent = { subheading: 'Key Operational Principle' };
      else if (subtype === 'paragraph_heading') {
        initialContent = {
          heading: 'Critical Defense Takeaways',
          body: '<p>Social engineers prey on cognitive biases. Establishing strict procedural boundaries protects the entire workforce from deception.</p>',
        };
      } else if (subtype === 'paragraph_subheading') {
        initialContent = {
          subheading: 'Verification Procedures',
          body: '<p>When a caller claims urgent executive authority, consult the verified employee database before taking any requested actions.</p>',
        };
      } else if (subtype === 'two_column') {
        initialContent = {
          columnLeft: '<p><strong>Internal Verification:</strong> Confirm requests through approved Slack/Teams channels.</p>',
          columnRight: '<p><strong>External Escapes:</strong> Hang up and dial the official public phone directory.</p>',
        };
      } else if (subtype === 'table') {
        initialContent = {
          table: {
            headers: ['Threat Vector', 'Initial Indicator', 'Resolution Path'],
            rows: [
              ['Spear Phishing', 'Urgent wire transfer or gift cards', 'Escalate immediately to SOC'],
              ['Vishing Call', 'Claims to be IT Helpdesk', 'Verify caller extension in company directory'],
            ],
          },
        };
      } else {
        initialContent = {
          body: '<p>Security awareness training shifts employees from vulnerable entry points to vigilant human sensors.</p>',
        };
      }
    } else if (category === 'statement') {
      initialContent = {
        statement: 'Security is not a product—it is a continuous operational mindset.',
        subtext: 'Defending against human exploitation requires awareness at every level of the organization.',
      };
    } else if (category === 'quote') {
      initialContent = {
        quote: 'Amateurs hack systems, professionals hack people.',
        author: 'Bruce Schneier',
        role: 'Internationally Renowned Security Technologist',
        avatar: '/thumbnails/social-engineering.svg',
        bgImage: '/thumbnails/conflict-resolution.svg',
      };
    } else if (category === 'list') {
      initialContent = {
        title: 'Core Rules of Engagement',
        items: [
          'Scrutinize sender addresses and lookalike domain characters.',
          'Validate financial instruction changes with dual-party approval.',
          'Never execute unknown script attachments or macro documents.',
        ],
      };
    } else if (category === 'image') {
      initialContent = {
        url: '/thumbnails/social-engineering.svg',
        caption: 'Enter some text',
        title: 'Workplace Security Alert',
        text: 'Routine monitoring and prompt reporting minimize the impact of targeted phishing campaigns.',
      };
    } else if (category === 'gallery') {
      initialContent = {
        images: [
          { url: '/thumbnails/social-engineering.svg', caption: 'Incident Response Stage 1' },
          { url: '/thumbnails/conflict-resolution.svg', caption: 'Incident Response Stage 2' },
          { url: '/thumbnails/ask-boss.svg', caption: 'Incident Response Stage 3' },
        ],
      };
    } else if (category === 'multimedia') {
      if (subtype === 'video') {
        initialContent = {
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          posterUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&q=80',
          filename: 'Coastline.mp4',
          caption: '',
        };
        initialSettings.contentWidth = 'M';
        initialSettings.paddingTop = 30;
        initialSettings.paddingBottom = 30;
        initialSettings.paddingLinked = true;
        initialSettings.borderRadius = 0;
        initialSettings.allowForwardSeeking = true;
        initialSettings.backgroundColor = 'light';
      } else if (subtype === 'audio') {
        initialContent = {
          audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          transcript: 'Full transcript for the audio briefing detailing modern social engineering defense tactics.',
        };
      } else {
        initialContent = {
          attachment: {
            name: 'Social_Engineering_Checklist_2026.pdf',
            size: '1.2 MB',
            url: '#',
          },
        };
      }
    } else if (category === 'divider') {
      if (subtype === 'continue_button') {
        initialContent = { label: 'Continue' };
        initialSettings.buttonText = 'Continue';
        initialSettings.completionRequirement = 'none';
      } else if (subtype === 'numbered_divider') {
        initialContent = { number: (lesson.blocks || []).length + 1 };
      } else if (subtype === 'spacer') {
        initialSettings.spacerHeight = 48;
      }
    } else if (category === 'code') {
      if (subtype === 'code_embed') {
        initialContent = {
          htmlCode: `<div style="font-family: sans-serif; text-align: center; padding: 2rem; background: #0f172a; color: white; border-radius: 12px;">\n  <h2 style="color: #38bdf8; margin-bottom: 0.5rem;">Interactive Security Widget</h2>\n  <p style="color: #94a3b8; font-size: 14px;">This custom embed runs in a safe sandboxed iframe environment.</p>\n  <button onclick="alert('Simulation: Unauthorized access blocked!')" style="background: #ff5722; color: white; border: none; padding: 10px 20px; border-radius: 99px; font-weight: bold; cursor: pointer; margin-top: 1rem;">\n    Test Defense Trigger\n  </button>\n</div>`,
        };
      } else if (subtype === 'code_web_project') {
        initialContent = {
          projectUrl: '',
          projectFileName: '',
          projectFilesCount: 0,
        };
      } else {
        initialContent = {
          language: 'javascript',
          code: `// Verify MFA token signature\nif (!user.validateToken(token)) {\n  auditLog.warn("Suspicious login attempt detected");\n  throw new UnauthorizedException();\n}`,
        };
      }
    } else if (category === 'interactive') {
      if (subtype === 'accordion') {
        initialContent = {
          items: [
            {
              title: 'Embracing Discovery',
              content: 'Discovery is the foundation of deep learning. By actively exploring unfamiliar concepts, learners develop resilient problem-solving frameworks and intuitive judgment.',
              imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
            },
            {
              title: 'Gaining Insight',
              content: 'True insight emerges at the intersection of reflection and application. Synthesize key takeaways to formulate actionable strategies that can be tested in real-world scenarios.',
              imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
            },
            {
              title: 'Making It Real',
              content: 'Theoretical knowledge becomes practical wisdom through disciplined execution. Establish concrete milestones, calibrate feedback loops, and hold yourself accountable.',
              imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
            },
          ],
        };
        initialSettings.keepOpen = false;
        initialSettings.iconStyle = 'plus';
      } else if (subtype === 'tabs') {
        initialContent = {
          tabs: [
            {
              title: 'Embracing Discovery',
              content: 'Discovery encourages teams to question baseline assumptions, conduct targeted user interviews, and uncover systemic opportunities that competitors overlook.',
              imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
              imagePosition: 'right',
            },
            {
              title: 'Gaining Insight',
              content: 'Synthesize field observations and quantitative metrics into unified mental models that guide high-conviction decision-making across product sprints.',
              imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
              imagePosition: 'right',
            },
            {
              title: 'Making It Real',
              content: 'Transform verified insights into reliable deliverables through iterative sprint cadences, modular architecture, and rigorous quality verification.',
              imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80',
              imagePosition: 'right',
            },
          ],
        };
      } else if (subtype === 'labeled_graphic') {
        initialContent = {
          imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80',
          hotspots: [
            {
              id: 'hs-1',
              x: 20,
              y: 35,
              title: 'Elevation & Thermal Currents',
              text: 'Thermal wind columns dictating optimal ascent altitude and directional steering vector during flight maneuvers.',
              iconType: '+',
              mediaUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
            },
            {
              id: 'hs-2',
              x: 45,
              y: 70,
              title: 'Burner Propulsion Rig',
              text: 'Dual liquid propane burner system delivering 15 million BTUs for responsive vertical climb and atmospheric stabilization.',
              iconType: 'i',
            },
            {
              id: 'hs-3',
              x: 80,
              y: 45,
              title: 'Apex Air Release Vent',
              text: 'Parachute valve at envelope summit triggered by pilot lanyard to facilitate gradual thermal deceleration and safe touchdown.',
              iconType: '?',
            },
          ],
        };
        initialSettings.markerColor = '#ff5722';
        initialSettings.zoomOnClick = true;
      } else if (subtype === 'process') {
        initialContent = {
          hasIntro: true,
          introTitle: 'Incident Response Procedure',
          introText: 'Follow these step-by-step procedures when identifying potential phishing campaigns in corporate environments.',
          hasSummary: true,
          summaryTitle: 'Protocol Finished',
          summaryText: 'Prompt incident reporting defends the entire enterprise from lateral movement and credential theft.',
          steps: [
            {
              title: 'Understand Your Physical Being',
              text: 'Acknowledge instinctual panic and maintain composure before responding to emergency or phishing alerts.',
              imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
            },
            {
              title: 'Isolate Endpoint Connections',
              text: 'Disconnect Ethernet cabling and disable Wi-Fi immediately to prevent lateral network propagation across subnets.',
              imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
            },
            {
              title: 'Alert Internal Security Operations',
              text: 'Submit incident logs through emergency SOC hotlines or verified out-of-band communication channels.',
              imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
            },
          ],
        };
        initialSettings.stepLabel = 'Step';
        initialSettings.showStepNumbers = true;
      } else if (subtype === 'sorting_activity') {
        initialContent = {
          categories: [
            { id: 'cat-1', name: 'Safe Workplace Action' },
            { id: 'cat-2', name: 'Social Engineering Threat' },
          ],
          cards: [
            { id: 'c-1', text: 'Reporting suspicious email via corporate PhishAlarm button', categoryId: 'cat-1' },
            { id: 'c-2', text: 'Approving an unexpected Duo 2FA push notification while driving', categoryId: 'cat-2' },
            { id: 'c-3', text: 'Verifying IT support requests by calling back via internal directory', categoryId: 'cat-1' },
            { id: 'c-4', text: 'Purchasing retail gift cards for an executive requesting urgent help', categoryId: 'cat-2' },
          ],
        };
      } else if (subtype === 'flashcards' || subtype === 'flashcard_stack') {
        initialContent = {
          cards: [
            {
              front: 'What is Vishing?',
              back: 'Voice phishing attacks where deceptive callers impersonate IT or management to extract credentials.',
              frontMode: 'text',
              backMode: 'text',
            },
            {
              front: 'What is Quishing?',
              back: 'QR code phishing engineered to redirect mobile devices past email perimeter scanners to harvest credentials.',
              frontMode: 'text',
              backMode: 'text',
            },
            {
              front: 'What is Pretexting?',
              back: 'Fabricating an elaborate fictional scenario to establish unearned trust prior to demanding sensitive access.',
              frontMode: 'text',
              backMode: 'text',
            },
          ],
        };
      } else if (subtype === 'timeline') {
        initialContent = {
          events: [
            {
              yearOrDate: 'Hour 0',
              title: 'Target Reconnaissance',
              description: 'Adversaries harvest employee organizational structures, executive travel, and directory email patterns.',
              imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
            },
            {
              yearOrDate: 'Hour 2',
              title: 'Spear Phishing Delivery',
              description: 'Personalized lure emails with spoofed headers deliver malicious attachments bypassing perimeter gateway filters.',
              imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
            },
            {
              yearOrDate: 'Hour 4',
              title: 'Incident Contained',
              description: 'Employee reports lure via phishing button; SOC revokes compromised session tokens and blocks malicious C2 domains.',
              imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&q=80',
            },
          ],
        };
      } else if (subtype === 'scenario') {
        initialContent = {
          backgroundImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
          characterName: 'Alex (IT Support)',
          scenes: [
            {
              id: 'sc-1',
              title: 'Scene 1: Urgent IT Request',
              type: 'dialogue',
              expression: 'concerned',
              dialogue: 'Hi there, this is Alex from Corporate IT Helpdesk. We detected abnormal login attempts on your workstation right now. Could you please read aloud the 6-digit verification code you just received on your phone so we can secure your session?',
              responses: [
                {
                  text: 'Sure, let me check my authenticator app and read it to you right away.',
                  feedback: 'Compromised! Alex logs into your account and locks you out. Security teams will NEVER ask you to read authenticator codes over the phone.',
                  reactionExpression: 'frustrated',
                  targetSceneId: 'sc-2',
                },
                {
                  text: 'I cannot read codes over the phone. Let me hang up and verify this through our official IT Slack channel.',
                  feedback: 'Outstanding decision! You halted a real-time vishing attack by verifying through an approved secondary channel.',
                  reactionExpression: 'happy',
                  targetSceneId: 'sc-3',
                },
                {
                  text: 'Who is your manager? I need to verify your ticket number first.',
                  feedback: 'The caller becomes agitated and hangs up. Asking for verification details often deters casual attackers.',
                  reactionExpression: 'talking',
                  targetSceneId: 'sc-3',
                },
              ],
            },
            {
              id: 'sc-2',
              title: 'Scene 2: Incident Remediation',
              type: 'info',
              expression: 'frustrated',
              dialogue: 'Security Alert: Because your session credentials were leaked, your workstation has been isolated and assigned mandatory security refresher training.',
              continueTargetSceneId: 'sc-1',
            },
            {
              id: 'sc-3',
              title: 'Scene 3: Threat Neutralized',
              type: 'info',
              expression: 'happy',
              dialogue: 'Victory! Your caution prevented unauthorized enterprise network penetration. The security operations team has logged the suspicious number.',
              continueTargetSceneId: 'end',
            },
          ],
        };
      } else if (subtype === 'button' || subtype === 'button_stack') {
        initialContent = {
          buttons: [
            { label: 'Report Incident to Security Operations', actionType: 'email', target: 'security@company.com', style: 'primary' },
            { label: 'Read Corporate Acceptable Use Policy', actionType: 'url', target: 'https://security.example.com/policy', style: 'outline' },
          ],
        };
        initialSettings.buttonAlignment = 'center';
        initialSettings.buttonRadius = 9999;
      } else if (subtype === 'storyline' || subtype === 'code_storyline' || subtype === 'custom_interactive') {
        initialContent = {
          elements: [
            {
              id: 'el-1',
              type: 'text',
              x: 100,
              y: 80,
              width: 400,
              height: 80,
              text: 'Interactive Security Simulation Canvas',
            },
            {
              id: 'el-2',
              type: 'button',
              x: 100,
              y: 200,
              width: 180,
              height: 48,
              text: 'Test Defense Trigger',
              triggers: [{ action: 'Show Layer', event: 'User clicks', target: 'Feedback Layer' }],
            },
          ],
        };
      }
    } else if (category === 'knowledge_check') {
      if (subtype === 'multiple_response') {
        initialContent = {
          question: 'Select all indicators that suggest an incoming phone call is a voice phishing attempt:',
          options: [
            { text: 'Caller claims your VPN token expired and asks you to approve an authenticator push.', isCorrect: true },
            { text: 'Caller demands immediate action to avoid disciplinary review from leadership.', isCorrect: true },
            { text: 'Caller speaks in a calm, professional, and courteous manner.', isCorrect: false },
            { text: 'Caller requests that you read aloud a 6-digit one-time passcode.', isCorrect: true },
          ],
          explanation: 'Legitimate IT support will never request your one-time passwords or unsolicited authenticator push approvals.',
        };
      } else if (subtype === 'fill_in_blank') {
        initialContent = {
          sentence: 'Attackers exploit trust and urgency in [blank] engineering attacks.',
          acceptedAnswers: ['social', 'human'],
          caseSensitive: false,
          explanation: 'Social engineering bypasses technological firewalls by hacking human psychology.',
        };
      } else if (subtype === 'matching') {
        initialContent = {
          matchingPairs: [
            { id: 'm-1', left: 'Vishing', right: 'Deceptive voice calls requesting login credentials' },
            { id: 'm-2', left: 'Smishing', right: 'Fraudulent SMS text messages with malicious links' },
            { id: 'm-3', left: 'Spear Phishing', right: 'Highly tailored lure emails directed at specific employees' },
            { id: 'm-4', left: 'Quishing', right: 'Embedded malicious QR codes bypassing gateway filters' },
          ],
        };
      } else {
        initialContent = {
          question: 'An unknown caller claiming to be from Microsoft asks for remote access to your laptop. What should you do?',
          options: [
            { text: 'Comply since they say they work with your company.', isCorrect: false },
            { text: 'Hang up and report the incident to your internal IT team.', isCorrect: true },
            { text: 'Ask them to email you a code and then grant access.', isCorrect: false },
          ],
          explanation: 'Legitimate software providers will never cold-call employees requesting unsolicited computer control.',
        };
      }
    } else if (category === 'survey') {
      if (subtype === 'survey_freeform') {
        initialContent = {
          prompt: 'What additional cybersecurity topics or defense scenarios would you like covered in future training modules?',
        };
      } else {
        initialContent = {
          question: 'I feel confident in my ability to identify and safely report social engineering attempts in my daily work:',
          labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
        };
      }
    } else if (category === 'chart') {
      initialContent = {
        title: 'Primary Attack Vectors in Corporate Breaches',
        subtitle: 'Percentage distribution of initial entry points reported in 2025',
        data: [
          { label: 'Phishing & Pretexting', value: 43 },
          { label: 'Stolen Credentials', value: 27 },
          { label: 'Vulnerability Exploit', value: 16 },
          { label: 'Insider Threat', value: 9 },
          { label: 'Misconfiguration', value: 5 },
        ],
      };
    }

    const newBlock: Block = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      subtype,
      content: initialContent,
      settings: initialSettings,
    };

    const currentBlocks = lesson.blocks || [];
    const updated = [
      ...currentBlocks.slice(0, targetIndex),
      newBlock,
      ...currentBlocks.slice(targetIndex),
    ];

    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Insert multiple blocks (e.g. from Block Template)
  const handleInsertBlocks = (blocksToInsert: Block[], targetIndex: number) => {
    if (!lesson) return;
    const currentBlocks = lesson.blocks || [];
    const cloned = blocksToInsert.map((b) => ({
      ...b,
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: JSON.parse(JSON.stringify(b.content)),
      settings: JSON.parse(JSON.stringify(b.settings || {})),
    }));
    const updated = [
      ...currentBlocks.slice(0, targetIndex),
      ...cloned,
      ...currentBlocks.slice(targetIndex),
    ];
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Update block content
  const handleUpdateBlockContent = (blockId: string, newContent: Record<string, unknown>) => {
    if (!lesson) return;
    const updated = lesson.blocks.map((b) => (b.id === blockId ? { ...b, content: newContent } : b));
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Replace/transform block with new category, subtype, and content
  const handleTransformBlock = (blockId: string, newBlockData: Partial<Block>) => {
    if (!lesson) return;
    const updated = lesson.blocks.map((b) => (b.id === blockId ? { ...b, ...newBlockData } : b));
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Insert a newly generated block immediately below current block
  const handleInsertBlockBelow = (afterBlockId: string, newBlock: Block) => {
    if (!lesson) return;
    const idx = lesson.blocks.findIndex((b) => b.id === afterBlockId);
    const updated = [...lesson.blocks];
    if (idx === -1) {
      updated.push(newBlock);
    } else {
      updated.splice(idx + 1, 0, newBlock);
    }
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Update block settings
  const handleUpdateBlockSettings = (blockId: string, newSettings: BlockSettings) => {
    if (!lesson) return;
    const updated = lesson.blocks.map((b) =>
      b.id === blockId ? { ...b, settings: { ...b.settings, ...newSettings } } : b
    );
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Move block up or down
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    if (!lesson) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= lesson.blocks.length) return;

    const updated = arrayMove(lesson.blocks, index, targetIdx);
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Duplicate block
  const handleDuplicateBlock = (blockId: string) => {
    if (!lesson) return;
    const idx = lesson.blocks.findIndex((b) => b.id === blockId);
    if (idx === -1) return;

    const source = lesson.blocks[idx];
    const cloned: Block = {
      ...source,
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      content: JSON.parse(JSON.stringify(source.content)),
      settings: JSON.parse(JSON.stringify(source.settings || {})),
    };

    const updated = [...lesson.blocks.slice(0, idx + 1), cloned, ...lesson.blocks.slice(idx + 1)];
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    if (!lesson) return;
    const updated = lesson.blocks.filter((b) => b.id !== blockId);
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Open Settings Drawer
  const handleOpenSettings = (blockId: string, initialTab: 'content' | 'settings') => {
    setActiveSettingsBlockId(blockId);
    setSettingsDrawerTab(initialTab);
    setSettingsOpen(true);
  };

  // Save Settings Drawer updates
  const handleSaveSettingsDrawer = (
    blockId: string,
    updatedContent: Record<string, unknown>,
    updatedSettings: BlockSettings
  ) => {
    if (!lesson) return;
    const updated = lesson.blocks.map((b) =>
      b.id === blockId ? { ...b, content: updatedContent, settings: updatedSettings } : b
    );
    setLesson({ ...lesson, blocks: updated });
    saveBlocks(updated);
  };

  // Media file upload handler
  const handleUploadMedia = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      return data.url || null;
    } catch (err) {
      console.error('Upload error', err);
      return null;
    }
  };

  // Drag and Drop End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!lesson || !over || active.id === over.id) return;

    const oldIndex = lesson.blocks.findIndex((b) => b.id === active.id);
    const newIndex = lesson.blocks.findIndex((b) => b.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const updated = arrayMove(lesson.blocks, oldIndex, newIndex);
      setLesson({ ...lesson, blocks: updated });
      saveBlocks(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <span className="text-xs text-gray-400 font-medium">Loading Lesson Canvas...</span>
      </div>
    );
  }

  if (!lesson || !course) return null;

  const accentColor = course.themeSettings?.accentColor || '#ff5722';
  const activeSettingsBlock =
    (lesson.blocks || []).find((b) => b.id === activeSettingsBlockId) || null;

  return (
    <div className="min-h-screen bg-gray-50/70 pb-32 flex flex-col">
      {/* 1. Top Utility Header */}
      <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        {/* Left: Lesson Switcher Dropdown & Snapshots */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={switcherRef}>
            <button
              type="button"
              onClick={() => setSwitcherOpen(!switcherOpen)}
              className="flex items-center gap-2 text-xs font-semibold text-gray-800 hover:text-black hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer max-w-sm truncate"
            >
              <ChevronLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">{title || 'Untitled Lesson'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
            </button>

            {switcherOpen && (
              <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <Link
                  href={`/courses/${courseId}`}
                  className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-b border-gray-100"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-400" />
                  <span>Back to Course Outline</span>
                </Link>

                <div className="px-3 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Jump to Lesson in Course
                </div>

                <div className="max-h-72 overflow-y-auto px-1">
                  {(course.lessons || []).map((l) => {
                    if (l.type === 'section') {
                      return (
                        <div
                          key={l.id}
                          className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400"
                        >
                          {l.title}
                        </div>
                      );
                    }

                    const isCurrent = l.id === lessonId;
                    const isQuiz = l.type === 'quiz';

                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setSwitcherOpen(false);
                          router.push(`/courses/${courseId}/lessons/${l.id}`);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-sky-50 text-sky-700 font-bold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {isQuiz ? (
                          <HelpCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{l.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <SnapshotDropdown courseId={courseId} onRestore={loadData} />
        </div>

        {/* Center: Save Status */}
        <div className="h-4 flex items-center gap-1.5 text-[11px] text-gray-400">
          {savingStatus === 'unsaved' && (
            <span className="flex items-center gap-1.5 text-gray-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Unsaved changes</span>
            </span>
          )}
          {savingStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
              <span>Saving block changes...</span>
            </span>
          )}
          {savingStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />
              <span>Saved to database</span>
            </span>
          )}
          {savingStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Save Failed</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Undo / Redo */}
          <div className="flex items-center text-gray-500 mr-2 border-r border-gray-200 pr-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Undo (Cmd+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= blockHistory.length - 1}
              className="p-1.5 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
              title="Redo (Cmd+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Theme Palette */}
          <Link
            href={`/courses/${courseId}/theme`}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Theme Settings"
          >
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Theme</span>
          </Link>

          {/* Settings */}
          <Link
            href={`/courses/${courseId}/settings`}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Course Settings & Navigation"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          {/* Review Feedback Button */}
          <button
            type="button"
            onClick={() => setCommentsDrawerOpen(!commentsDrawerOpen)}
            className="p-2 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="View Peer Review Feedback for this course"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
            {commentsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                {commentsCount}
              </span>
            )}
          </button>

          {/* Share with IDs Button */}
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5 ml-1 cursor-pointer shadow-2xs"
            title="Share interactive preview & review link with instructional designers"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-600" />
            <span>Share with IDs</span>
          </button>

          {/* Publish */}
          <button
            onClick={() => setPublishModalOpen(true)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ml-1 cursor-pointer ${
              course.status === 'published'
                ? course.hasUnpublishedChanges
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {course.status === 'published' && <Check className="w-3.5 h-3.5" />}
            <span>
              {course.status === 'published'
                ? course.hasUnpublishedChanges
                  ? 'Published (Unpublished Changes)'
                  : 'Published'
                : 'Publish'}
            </span>
          </button>

          {/* Black Preview Pill Button */}
          <button
            onClick={() => router.push(`/courses/${courseId}/preview`)}
            className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm ml-1 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </header>

      {/* 2. Main Full-Bleed Lesson Canvas */}
      <main className="w-full mt-6 pb-28">
        {/* Lesson Header Container (Centered 4xl reading width) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-8">
          <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs p-8 sm:p-12">
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              {lesson.type === 'quiz' ? 'Quiz / Assessment' : 'Lesson'}
            </div>

            {/* Inline Editable Lesson Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Lesson Title"
              className="w-full text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight outline-none border-b border-transparent hover:border-gray-200 focus:border-sky-500 pb-1 transition-colors bg-transparent"
            />

            {/* Author Badge Row */}
            <div className="flex items-center gap-2.5 py-3">
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
          </div>
        </div>

        {/* 3. Full-Bleed Block Stack with DnD & Hover Controls */}
        <div className="w-full space-y-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={(lesson.blocks || []).map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {(lesson.blocks || []).map((block, index) => (
                <BlockWrapper
                  key={block.id}
                  block={block}
                  index={index}
                  totalBlocks={lesson.blocks.length}
                  accentColor={accentColor}
                  onUpdateContent={handleUpdateBlockContent}
                  onUpdateSettings={handleUpdateBlockSettings}
                  onOpenSettings={handleOpenSettings}
                  onMoveBlock={handleMoveBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onOpenLibrary={(idx) => {
                    setInsertTargetIndex(idx);
                    setLibraryOpen(true);
                  }}
                  onUploadMedia={handleUploadMedia}
                  courseLessons={course?.lessons || []}
                  onTransformBlock={handleTransformBlock}
                  onInsertBlockBelow={handleInsertBlockBelow}
                  lessonTitle={lesson.title}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Bottom Add Block Trigger */}
          <div className="pt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setInsertTargetIndex((lesson.blocks || []).length);
                setLibraryOpen(true);
              }}
              className="px-6 py-3 rounded-full bg-black hover:bg-gray-800 text-white text-xs font-semibold flex items-center gap-2 shadow-md hover:scale-102 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Block from Library</span>
            </button>
          </div>
        </div>
      </main>

      {/* Slide-Out Block Library Drawer */}
      <BlockLibraryDrawer
        isOpen={libraryOpen}
        insertIndex={insertTargetIndex}
        onClose={() => setLibraryOpen(false)}
        onSelectVariant={handleInsertBlockVariant}
        onInsertBlocks={handleInsertBlocks}
        accentColor={accentColor}
      />

      {/* Slide-Out Block Style & Settings Drawer */}
      <BlockSettingsDrawer
        isOpen={settingsOpen}
        block={activeSettingsBlock}
        initialTab={settingsDrawerTab}
        accentColor={accentColor}
        onClose={() => {
          setSettingsOpen(false);
          setActiveSettingsBlockId(null);
        }}
        onSave={handleSaveSettingsDrawer}
        onUploadMedia={handleUploadMedia}
      />

      {/* Theme & Settings Modal */}
      <ThemeSettingsModal
        isOpen={themeModalOpen}
        initialTab={themeModalTab}
        themeSettings={course.themeSettings}
        publishSettings={course.publishSettings}
        onClose={() => setThemeModalOpen(false)}
        onSave={async (newTheme, newPublish) => {
          await fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              themeSettings: newTheme,
              publishSettings: newPublish,
            }),
          });
          setCourse({ ...course, themeSettings: newTheme, publishSettings: newPublish });
        }}
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

      {/* Share for Review Modal */}
      <ShareReviewModal
        courseId={courseId}
        courseTitle={course.title}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        accentColor={accentColor}
      />

      {/* ID Peer Review Comments Drawer */}
      <ReviewDrawer
        courseId={courseId}
        isOpen={commentsDrawerOpen}
        onClose={() => setCommentsDrawerOpen(false)}
        lessons={course.lessons}
        activeLessonId={lessonId}
        onNavigateToLesson={(targetLessonId) => {
          if (targetLessonId !== lessonId) {
            router.push(`/courses/${courseId}/lessons/${targetLessonId}`);
          }
        }}
        accentColor={accentColor}
        isAuthorView={true}
      />
    </div>
  );
}
