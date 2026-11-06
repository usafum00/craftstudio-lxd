'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Block, Lesson } from '@/lib/types';
import { SimulationLabBlock } from './SimulationLabBlock';
import { ScenarioCharacterFigure, ScenarioAvatar, ScenarioExpression, SCENARIO_ENVIRONMENTS } from './ScenarioAvatars';
import {
  Plus,
  Minus,
  Trash2,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  HelpCircle,
  Info,
  Calendar,
  ExternalLink,
  Mail,
  BookOpen,
  ArrowRight,
  MoveRight,
  Sparkles,
  Trophy,
  Layers,
  Volume2,
  Play,
  Pause,
  ZoomIn,
  MessageSquare,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  LogOut,
  MousePointer,
  Shuffle,
  ShieldCheck,
} from 'lucide-react';

export const DEFAULT_SCENARIO_SCENES = [
  {
    id: 'sc-1',
    title: 'Scene 1: Urgent IT Request',
    type: 'dialogue' as const,
    expression: 'concerned' as const,
    dialogue:
      'Hi there, this is Alex from Corporate IT Helpdesk. We detected abnormal login attempts on your workstation right now. Could you please read aloud the 6-digit verification code you just received on your phone so we can secure your session?',
    responses: [
      {
        text: 'Sure, let me check my authenticator app and read it to you right away.',
        feedback:
          'Compromised! Alex logs into your account and locks you out. Security teams will NEVER ask you to read authenticator codes over the phone.',
        reactionExpression: 'frustrated' as const,
        targetSceneId: 'sc-2',
      },
      {
        text: 'I cannot read codes over the phone. Let me hang up and verify this through our official IT Slack channel.',
        feedback:
          'Outstanding decision! You halted a real-time vishing attack by verifying through an approved secondary channel.',
        reactionExpression: 'happy' as const,
        targetSceneId: 'sc-3',
      },
      {
        text: 'Who is your manager? I need to verify your ticket number first.',
        feedback:
          'The caller becomes agitated and hangs up. Asking for verification details often deters casual attackers.',
        reactionExpression: 'talking' as const,
        targetSceneId: 'sc-3',
      },
    ],
  },
  {
    id: 'sc-2',
    title: 'Scene 2: Incident Remediation',
    type: 'info' as const,
    expression: 'frustrated' as const,
    dialogue:
      'Security Alert: Because your session credentials were leaked, your workstation has been isolated and assigned mandatory security refresher training.',
    continueTargetSceneId: 'sc-1',
  },
  {
    id: 'sc-3',
    title: 'Scene 3: Threat Neutralized',
    type: 'info' as const,
    expression: 'happy' as const,
    dialogue:
      'Victory! Your caution prevented unauthorized enterprise network penetration. The security operations team has logged the suspicious number.',
    continueTargetSceneId: 'end',
  },
];

interface InteractiveBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
  onComplete?: () => void;
  courseLessons?: Lesson[];
  onNavigateToLesson?: (lessonId: string) => void;
}

export function InteractiveBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
  onComplete,
  courseLessons = [],
  onNavigateToLesson,
}: InteractiveBlockProps) {
  const { subtype, content, settings = {} } = block;

  // Track completion state once per block mount
  const [completedReported, setCompletedReported] = useState(false);
  const markCompleted = () => {
    if (!completedReported) {
      setCompletedReported(true);
      if (onComplete) onComplete();
    }
  };

  // =============================================================
  // 1. ACCORDION BLOCK
  // =============================================================
  const defaultAccordionItems = [
    {
      title: 'Embracing Discovery',
      content:
        'Discovery is the foundation of deep learning. By actively exploring unfamiliar concepts, learners develop resilient problem-solving frameworks and intuitive judgment.',
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    },
    {
      title: 'Gaining Insight',
      content:
        'True insight emerges at the intersection of reflection and application. Synthesize key takeaways to formulate actionable strategies that can be tested in real-world scenarios.',
      imageUrl: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    },
    {
      title: 'Making It Real',
      content:
        'Theoretical knowledge becomes practical wisdom through disciplined execution. Establish concrete milestones, calibrate feedback loops, and hold yourself accountable.',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
    },
  ];

  const accordionItems = (content.items as Array<{ title: string; content: string; imageUrl?: string }>) || defaultAccordionItems;
  const keepOpen = settings.keepOpen === true;
  const iconStyle = settings.iconStyle || 'plus'; // 'plus' or 'chevron'
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true });
  const [visitedAccordionItems, setVisitedAccordionItems] = useState<Set<number>>(new Set([0]));

  const toggleAccordionItem = (idx: number) => {
    setVisitedAccordionItems((prev) => {
      const next = new Set(prev).add(idx);
      if (next.size >= accordionItems.length) {
        markCompleted();
      }
      return next;
    });

    setOpenItems((prev) => {
      if (keepOpen) {
        return { ...prev, [idx]: !prev[idx] };
      } else {
        return { [idx]: !prev[idx] };
      }
    });
  };

  // =============================================================
  // 2. TABS BLOCK
  // =============================================================
  const defaultTabs = [
    {
      title: 'Embracing Discovery',
      content:
        'Discovery encourages teams to question baseline assumptions, conduct targeted user interviews, and uncover systemic opportunities that competitors overlook.',
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80',
      imagePosition: 'right' as const,
    },
    {
      title: 'Gaining Insight',
      content:
        'Synthesize field observations and quantitative metrics into unified mental models that guide high-conviction decision-making across product sprints.',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
      imagePosition: 'right' as const,
    },
    {
      title: 'Making It Real',
      content:
        'Transform verified insights into reliable deliverables through iterative sprint cadences, modular architecture, and rigorous quality verification.',
      imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80',
      imagePosition: 'right' as const,
    },
  ];

  const tabs = (content.tabs as Array<{ title: string; content: string; imageUrl?: string; imagePosition?: string }>) || defaultTabs;
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([0]));

  const handleTabClick = (idx: number) => {
    setActiveTabIndex(idx);
    setVisitedTabs((prev) => {
      const next = new Set(prev).add(idx);
      if (next.size >= tabs.length) {
        markCompleted();
      }
      return next;
    });
  };

  // =============================================================
  // 3. LABELED GRAPHIC BLOCK (With Dragging, Popover & Prev/Next)
  // =============================================================
  const defaultHotspots = [
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
  ];

  const labeledGraphicImage =
    (content.imageUrl as string) || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1600&q=80';
  const hotspots = (content.hotspots as Array<{
    id: string;
    x: number;
    y: number;
    title: string;
    text: string;
    iconType?: string;
    mediaUrl?: string;
    mediaType?: string;
  }>) || defaultHotspots;

  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [visitedHotspots, setVisitedHotspots] = useState<Set<string>>(new Set());
  const [draggingHotspotId, setDraggingHotspotId] = useState<string | null>(null);
  const graphicContainerRef = useRef<HTMLDivElement>(null);

  const markerColor = (settings.markerColor as string) || accentColor;
  const zoomOnClick = settings.zoomOnClick !== false;

  const handleMarkerClick = (hsId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveHotspotId(hsId);
    setVisitedHotspots((prev) => {
      const next = new Set(prev).add(hsId);
      if (next.size >= hotspots.length) {
        markCompleted();
      }
      return next;
    });
  };

  const handleGraphicClick = (e: React.MouseEvent) => {
    if (isLearnerMode) {
      setActiveHotspotId(null);
      return;
    }
    if (!graphicContainerRef.current) return;
    const rect = graphicContainerRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100)));

    const newHotspot = {
      id: `hs-${Date.now()}`,
      x,
      y,
      title: `Marker ${hotspots.length + 1}`,
      text: 'Enter your detailed marker description here.',
      iconType: '+',
    };
    const next = [...hotspots, newHotspot];
    onChange({ ...content, hotspots: next });
    setActiveHotspotId(newHotspot.id);
  };

  // Dragging support for author mode
  const handleMarkerMouseDown = (hsId: string, e: React.MouseEvent) => {
    if (isLearnerMode) return;
    e.stopPropagation();
    setDraggingHotspotId(hsId);
  };

  useEffect(() => {
    if (!draggingHotspotId) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!graphicContainerRef.current) return;
      const rect = graphicContainerRef.current.getBoundingClientRect();
      const x = Math.round(Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100)));
      const y = Math.round(Math.max(2, Math.min(98, ((e.clientY - rect.top) / rect.height) * 100)));

      const next = hotspots.map((hs) => (hs.id === draggingHotspotId ? { ...hs, x, y } : hs));
      onChange({ ...content, hotspots: next });
    };

    const handleMouseUp = () => {
      setDraggingHotspotId(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingHotspotId, hotspots, content, onChange]);

  // Sequential Next / Prev for markers popover
  const currentHotspotIndex = hotspots.findIndex((h) => h.id === activeHotspotId);
  const activeHotspot = hotspots[currentHotspotIndex] || null;

  const handleNextHotspot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentHotspotIndex < hotspots.length - 1) {
      const nextHs = hotspots[currentHotspotIndex + 1];
      setActiveHotspotId(nextHs.id);
      setVisitedHotspots((prev) => new Set(prev).add(nextHs.id));
    }
  };

  const handlePrevHotspot = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentHotspotIndex > 0) {
      const prevHs = hotspots[currentHotspotIndex - 1];
      setActiveHotspotId(prevHs.id);
      setVisitedHotspots((prev) => new Set(prev).add(prevHs.id));
    }
  };

  // =============================================================
  // 4. PROCESS CAROUSEL BLOCK
  // =============================================================
  const defaultSteps = [
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
  ];

  const hasIntro = content.hasIntro !== false;
  const introTitle = (content.introTitle as string) || 'Incident Response Procedure';
  const introText = (content.introText as string) || 'Follow these step-by-step procedures when identifying potential phishing campaigns.';
  const hasSummary = content.hasSummary !== false;
  const summaryTitle = (content.summaryTitle as string) || 'Protocol Finished';
  const summaryText = (content.summaryText as string) || 'Prompt incident reporting defends the entire enterprise from lateral movement.';
  const steps = (content.steps as Array<{ title: string; text: string; imageUrl?: string }>) || defaultSteps;

  const stepLabel = (settings.stepLabel as string) || 'Step';
  const showStepNumbers = settings.showStepNumbers !== false;

  // Process view index: -1 = intro, 0..N-1 = steps, N = summary
  const [processIndex, setProcessIndex] = useState(hasIntro ? -1 : 0);

  const goToProcessSlide = (idx: number) => {
    setProcessIndex(idx);
    if (idx === steps.length || (!hasSummary && idx === steps.length - 1)) {
      markCompleted();
    }
  };

  // =============================================================
  // 5. SORTING ACTIVITY BLOCK
  // =============================================================
  const defaultSortingCategories = [
    { id: 'cat-1', name: 'Safe Workplace Action' },
    { id: 'cat-2', name: 'Social Engineering Threat' },
  ];

  const defaultSortingCards = [
    { id: 'c-1', text: 'Reporting suspicious email via corporate PhishAlarm button', categoryId: 'cat-1' },
    { id: 'c-2', text: 'Approving an unexpected Duo 2FA push notification while driving', categoryId: 'cat-2' },
    { id: 'c-3', text: 'Verifying IT support requests by calling back via internal directory', categoryId: 'cat-1' },
    { id: 'c-4', text: 'Purchasing retail gift cards for an executive requesting urgent help', categoryId: 'cat-2' },
  ];

  const sortingCategories = (content.categories as Array<{ id: string; name: string }>) || defaultSortingCategories;
  const sortingCards = (content.cards as Array<{ id: string; text: string; categoryId: string }>) || defaultSortingCards;

  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [shakeCard, setShakeCard] = useState(false);
  const [sortedCount, setSortedCount] = useState(0);
  const [sortingCompleted, setSortingCompleted] = useState(false);

  const currentSortingCard = sortingCards[activeCardIndex] || null;

  const handleSortCard = (chosenCatId: string) => {
    if (!currentSortingCard) return;

    if (currentSortingCard.categoryId === chosenCatId) {
      // Correct!
      const nextSorted = sortedCount + 1;
      setSortedCount(nextSorted);

      if (activeCardIndex + 1 < sortingCards.length) {
        setActiveCardIndex(activeCardIndex + 1);
      } else {
        setSortingCompleted(true);
        markCompleted();
      }
    } else {
      // Incorrect! Shake animation and snap back
      setShakeCard(true);
      setTimeout(() => setShakeCard(false), 600);
    }
  };

  const handleResetSorting = () => {
    setActiveCardIndex(0);
    setSortedCount(0);
    setSortingCompleted(false);
  };

  // =============================================================
  // 6. FLASHCARDS & FLASHCARD STACK BLOCKS
  // =============================================================
  const defaultFlashcards = [
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
  ];

  const flashcards = (content.cards as Array<{
    front: string;
    back: string;
    frontImage?: string;
    backImage?: string;
    frontMode?: string;
    backMode?: string;
  }>) || defaultFlashcards;

  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [activeStackIndex, setActiveStackIndex] = useState(0);

  const toggleCardFlip = (idx: number) => {
    setFlippedCards((prev) => {
      const next = { ...prev, [idx]: !prev[idx] };
      if (Object.keys(next).length >= flashcards.length) {
        markCompleted();
      }
      return next;
    });
  };

  // =============================================================
  // 7. TIMELINE BLOCK
  // =============================================================
  const defaultTimelineEvents = [
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
  ];

  const timelineEvents = (content.events as Array<{ yearOrDate: string; title: string; description: string; imageUrl?: string }>) || defaultTimelineEvents;

  // =============================================================
  // 8. SCENARIO BLOCK (Branching Storyline Conversation)
  // =============================================================
  const scenarioBg = (content.backgroundImage as string) || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80';
  const scenarioCharacterName = (content.characterName as string) || 'Alex (IT Support)';
  const scenarioScenes = (content.scenes as typeof DEFAULT_SCENARIO_SCENES) || DEFAULT_SCENARIO_SCENES;

  const [currentSceneId, setCurrentSceneId] = useState(scenarioScenes[0]?.id || 'sc-1');
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
  const [currentExpressionOverride, setCurrentExpressionOverride] = useState<string | null>(null);

  const activeScene = scenarioScenes.find((s) => s.id === currentSceneId) || scenarioScenes[0];

  const handleSelectScenarioResponse = (rIdx: number) => {
    setSelectedResponseIndex(rIdx);
    if (activeScene && activeScene.responses && activeScene.responses[rIdx]) {
      setCurrentExpressionOverride(activeScene.responses[rIdx].reactionExpression);
    }
  };

  const handleProceedScenario = (targetId: string) => {
    if (targetId === 'end' || !targetId) {
      markCompleted();
      return;
    }
    if (targetId === 'next') {
      const currIdx = scenarioScenes.findIndex((s) => s.id === currentSceneId);
      if (currIdx < scenarioScenes.length - 1) {
        setCurrentSceneId(scenarioScenes[currIdx + 1].id);
      } else {
        markCompleted();
      }
    } else {
      setCurrentSceneId(targetId);
    }
    setSelectedResponseIndex(null);
    setCurrentExpressionOverride(null);
  };

  // =============================================================
  // 9. BUTTON & BUTTON STACK BLOCKS
  // =============================================================
  const defaultButtons = [
    {
      label: 'Report Incident to Security Operations',
      actionType: 'email' as const,
      target: 'security@company.com',
      style: 'primary' as const,
    },
    {
      label: 'Read Corporate Acceptable Use Policy',
      actionType: 'url' as const,
      target: 'https://security.example.com/policy',
      style: 'outline' as const,
    },
  ];

  const actionButtons = (content.buttons as Array<{
    label: string;
    actionType: 'lesson' | 'url' | 'email' | 'exit';
    target: string;
    style?: 'primary' | 'outline' | 'secondary';
  }>) || defaultButtons;

  const buttonAlignment = (settings.buttonAlignment as 'left' | 'center' | 'right') || 'center';
  const buttonRadius = typeof settings.buttonRadius === 'number' ? settings.buttonRadius : 9999;

  const handleButtonClick = (btn: (typeof actionButtons)[0]) => {
    markCompleted();
    if (btn.actionType === 'lesson' && btn.target) {
      if (onNavigateToLesson) {
        onNavigateToLesson(btn.target);
      } else {
        window.location.hash = `#${btn.target}`;
      }
    } else if (btn.actionType === 'url' && btn.target) {
      window.open(btn.target, '_blank', 'noopener,noreferrer');
    } else if (btn.actionType === 'email' && btn.target) {
      window.location.href = `mailto:${btn.target}`;
    } else if (btn.actionType === 'exit') {
      alert('Course completed. You may now close this browser tab.');
    }
  };

  // =============================================================
  // 10. STORYLINE / CUSTOM INTERACTIVE CANVAS BLOCK
  // =============================================================
  const defaultElements = [
    {
      id: 'el-1',
      type: 'text' as const,
      x: 100,
      y: 80,
      width: 400,
      height: 80,
      text: 'Interactive Security Simulation Canvas',
    },
    {
      id: 'el-2',
      type: 'button' as const,
      x: 100,
      y: 200,
      width: 180,
      height: 48,
      text: 'Test Defense Trigger',
      triggers: [{ action: 'Show Layer', event: 'User clicks', target: 'Feedback Layer' }],
    },
  ];

  const slideElements = (content.elements as Array<{
    id: string;
    type: 'text' | 'image' | 'button' | 'hotspot';
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    imageUrl?: string;
    triggers?: Array<{ action: string; event: string; target?: string }>;
  }>) || defaultElements;

  const [activeStorylineLayer, setActiveStorylineLayer] = useState<string | null>(null);

  const handleStorylineElementClick = (el: (typeof slideElements)[0]) => {
    if (el.triggers && el.triggers.length > 0) {
      const tr = el.triggers[0];
      if (tr.action === 'Show Layer') {
        setActiveStorylineLayer(tr.target || 'Active Layer');
        markCompleted();
      }
    }
  };

  // =============================================================
  // RENDER BLOCKS
  // =============================================================

  // 1. ACCORDION
  if (subtype === 'accordion') {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-2.5 select-none">
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 shadow-xs bg-white overflow-hidden">
          {accordionItems.map((item, idx) => {
            const isOpen = !!openItems[idx];
            return (
              <div key={idx} className="transition-colors">
                <div
                  onClick={() => toggleAccordionItem(idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                >
                  <span className="font-semibold text-sm sm:text-base text-gray-900 pr-4">
                    {item.title}
                  </span>

                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all flex-shrink-0"
                    style={{
                      backgroundColor: isOpen ? `${accentColor}18` : '#f8fafc',
                      color: isOpen ? accentColor : '#64748b',
                    }}
                  >
                    {iconStyle === 'chevron' ? (
                      isOpen ? <ChevronUp className="w-4 h-4 stroke-[2.5]" /> : <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      isOpen ? <Minus className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-gray-600 leading-relaxed space-y-3.5 bg-slate-50/30 animate-in fade-in duration-150">
                    <p className="whitespace-pre-line">{item.content}</p>

                    {item.imageUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video max-w-xl shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 2. TABS
  if (subtype === 'tabs') {
    const activeTab = tabs[activeTabIndex] || tabs[0];
    const imagePos = activeTab?.imagePosition || 'right';

    return (
      <div className="w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden select-none">
        {/* Horizontal Tab Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto no-scrollbar">
          {tabs.map((tab, idx) => {
            const isActive = activeTabIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleTabClick(idx)}
                style={{
                  borderTopColor: isActive ? accentColor : 'transparent',
                }}
                className={`px-6 py-4 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap border-t-4 ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-slate-100/50'
                }`}
              >
                {tab.title}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body with Smooth Fade */}
        <div className="p-6 sm:p-8 animate-in fade-in duration-200">
          <div
            className={`flex flex-col gap-6 ${
              imagePos === 'left'
                ? 'md:flex-row-reverse items-center'
                : imagePos === 'right'
                ? 'md:flex-row items-center'
                : imagePos === 'top'
                ? 'flex-col-reverse'
                : 'flex-col'
            }`}
          >
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">{activeTab?.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {activeTab?.content}
              </p>
            </div>

            {activeTab?.imageUrl && (
              <div
                className={`rounded-xl overflow-hidden border border-slate-200 bg-black shadow-xs flex-shrink-0 ${
                  imagePos === 'top' || imagePos === 'bottom'
                    ? 'w-full aspect-21/9'
                    : 'w-full md:w-1/2 aspect-video'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeTab.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. LABELED GRAPHIC
  if (subtype === 'labeled_graphic') {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-3 select-none">
        <div
          ref={graphicContainerRef}
          onClick={handleGraphicClick}
          className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md group select-none min-h-[360px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={labeledGraphicImage}
            alt="Interactive Labeled Graphic Diagram"
            className="w-full h-auto object-cover max-h-[640px]"
          />

          {/* Hotspot Markers */}
          {hotspots.map((hs) => {
            const isActive = activeHotspotId === hs.id;
            const isVisited = visitedHotspots.has(hs.id);

            return (
              <div
                key={hs.id}
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                onMouseDown={(e) => handleMarkerMouseDown(hs.id, e)}
              >
                <button
                  type="button"
                  onClick={(e) => handleMarkerClick(hs.id, e)}
                  style={{ backgroundColor: markerColor }}
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-xl transition-all cursor-pointer ${
                    isActive ? 'scale-120 ring-4 ring-white' : 'hover:scale-110'
                  }`}
                >
                  {/* Concentric Pulse Ring Animation until viewed */}
                  {!isVisited && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-65"
                      style={{ backgroundColor: markerColor }}
                    />
                  )}

                  <span className="relative z-10 text-xs font-bold">
                    {isVisited && !isActive ? '✓' : hs.iconType || '+'}
                  </span>
                </button>
              </div>
            );
          })}

          {/* Floating Marker Popover Card (Auto-positioned & bounded) */}
          {activeHotspot && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute z-30 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-5 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: `${Math.min(75, Math.max(25, activeHotspot.x))}%`,
                top: `${Math.min(75, Math.max(25, activeHotspot.y))}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Marker {currentHotspotIndex + 1} of {hotspots.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveHotspotId(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeHotspot.mediaUrl && (
                <div className="rounded-lg overflow-hidden bg-black aspect-video mb-3 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeHotspot.mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <h4 className="font-bold text-sm text-gray-900 mb-1.5">{activeHotspot.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">{activeHotspot.text}</p>

              {/* Bottom Next / Prev Arrows */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-semibold text-gray-700">
                <button
                  type="button"
                  disabled={currentHotspotIndex === 0}
                  onClick={handlePrevHotspot}
                  className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="text-[11px] text-gray-400">
                  {currentHotspotIndex + 1} / {hotspots.length}
                </span>

                <button
                  type="button"
                  disabled={currentHotspotIndex === hotspots.length - 1}
                  onClick={handleNextHotspot}
                  className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. PROCESS CAROUSEL
  if (subtype === 'process') {
    const isIntro = processIndex === -1;
    const isSummary = processIndex === steps.length;
    const currentStep = !isIntro && !isSummary ? steps[processIndex] : null;

    const canGoPrev = hasIntro ? processIndex > -1 : processIndex > 0;
    const canGoNext = hasSummary ? processIndex < steps.length : processIndex < steps.length - 1;

    return (
      <div className="w-full max-w-3xl mx-auto space-y-4 select-none">
        <div className="relative flex items-center">
          {/* Circular Left Navigation Button */}
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => goToProcessSlide(processIndex - 1)}
            className="absolute -left-5 z-20 w-11 h-11 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 disabled:opacity-20 disabled:pointer-events-none"
            title="Previous step"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Centered White Card Carousel */}
          <div className="w-full bg-white rounded-3xl border border-slate-200/90 shadow-md p-8 sm:p-10 min-h-[380px] flex flex-col justify-between animate-in fade-in duration-150">
            {isIntro && (
              <div className="space-y-4 text-center my-auto">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                  style={{ backgroundColor: accentColor }}
                >
                  Introduction
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{introTitle}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto whitespace-pre-line">
                  {introText}
                </p>
              </div>
            )}

            {currentStep && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white shadow-2xs"
                    style={{ backgroundColor: accentColor }}
                  >
                    {showStepNumbers ? `${stepLabel} ${processIndex + 1}` : stepLabel}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">
                    {processIndex + 1} of {steps.length}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{currentStep.title}</h3>

                {currentStep.imageUrl && (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-lg border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentStep.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{currentStep.text}</p>
              </div>
            )}

            {isSummary && (
              <div className="space-y-4 text-center my-auto">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-2xs">
                  ✓ Finished
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{summaryTitle}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto whitespace-pre-line">
                  {summaryText}
                </p>
              </div>
            )}

            {/* Bottom Interactive Step Indicators: Introduction > 1 • 2 • 3 • ✓ */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold">
              {hasIntro && (
                <button
                  type="button"
                  onClick={() => goToProcessSlide(-1)}
                  className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    processIndex === -1 ? 'bg-slate-900 text-white' : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  Intro
                </button>
              )}

              {steps.map((_, sIdx) => {
                const isActive = processIndex === sIdx;
                return (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => goToProcessSlide(sIdx)}
                    style={{
                      backgroundColor: isActive ? accentColor : undefined,
                    }}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                      isActive ? 'text-white shadow-xs' : 'bg-slate-100 text-gray-500 hover:bg-slate-200'
                    }`}
                  >
                    {sIdx + 1}
                  </button>
                );
              })}

              {hasSummary && (
                <button
                  type="button"
                  onClick={() => goToProcessSlide(steps.length)}
                  className={`w-7 h-7 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    processIndex === steps.length
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-gray-500 hover:bg-slate-200'
                  }`}
                >
                  ✓
                </button>
              )}
            </div>
          </div>

          {/* Circular Right Navigation Button */}
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => goToProcessSlide(processIndex + 1)}
            className="absolute -right-5 z-20 w-11 h-11 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 disabled:opacity-20 disabled:pointer-events-none"
            title="Next step"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    );
  }

  // 5. SORTING ACTIVITY
  if (subtype === 'sorting_activity') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 select-none">
        {!sortingCompleted ? (
          <div className="space-y-6">
            {/* Top Draggable Card */}
            {currentSortingCard && (
              <div className="flex flex-col items-center">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Card {activeCardIndex + 1} of {sortingCards.length}
                </div>

                <div
                  className={`w-full max-w-md bg-white shadow-lg rounded-2xl border-t-4 p-8 text-center font-semibold text-gray-800 cursor-grab active:cursor-grabbing hover:shadow-xl transition-all ${
                    shakeCard ? 'animate-shake ring-2 ring-rose-500 bg-rose-50/30' : ''
                  }`}
                  style={{ borderTopColor: accentColor }}
                >
                  <p className="text-base text-gray-900">{currentSortingCard.text}</p>
                  <div className="text-[11px] text-gray-400 font-normal mt-3">
                    Drag or click a category below to sort this card
                  </div>
                </div>
              </div>
            )}

            {/* Category Dropzones */}
            <div
              className={`grid gap-4 ${
                sortingCategories.length === 2
                  ? 'grid-cols-2'
                  : sortingCategories.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
              }`}
            >
              {sortingCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSortCard(cat.id)}
                  className="bg-slate-50 hover:bg-slate-100/90 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px] group"
                >
                  <span className="font-bold text-sm text-gray-800 group-hover:text-black">
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">Click to sort here</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Victory Completion Banner */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-md animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {sortingCards.length}/{sortingCards.length} Correct!
            </h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              You have accurately categorized all statements according to company defense protocols.
            </p>
            <button
              type="button"
              onClick={handleResetSorting}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer shadow-sm transition-transform hover:scale-105 inline-flex items-center gap-2"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Replay Activity</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // 6. FLASHCARDS (Grid & Stack)
  if (subtype === 'flashcards' || subtype === 'flashcard_stack') {
    const isStack = subtype === 'flashcard_stack';
    const activeCard = flashcards[activeStackIndex] || flashcards[0];

    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 select-none">
        {isStack ? (
          /* Flashcard Stack Mode (Single Large Card) */
          <div className="flex flex-col items-center space-y-4">
            <div
              onClick={() => toggleCardFlip(activeStackIndex)}
              className="w-full max-w-md h-72 cursor-pointer perspective-1000"
            >
              <div
                className={`relative w-full h-full rounded-2xl shadow-md transition-transform duration-500 transform-style-3d ${
                  flippedCards[activeStackIndex] ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between text-center shadow-xs">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Front of Card
                  </div>
                  <div className="my-auto space-y-3">
                    {activeCard.frontImage && (
                      <div className="h-28 rounded-lg overflow-hidden bg-slate-100 mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeCard.frontImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h4 className="text-base font-bold text-gray-900">{activeCard.front}</h4>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                    <RotateCw className="w-3 h-3" />
                    <span>Click to flip</span>
                  </div>
                </div>

                {/* Back Side */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 text-white rounded-2xl p-6 flex flex-col justify-between text-center shadow-md">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Back of Card
                  </div>
                  <div className="my-auto space-y-3">
                    {activeCard.backImage && (
                      <div className="h-28 rounded-lg overflow-hidden bg-slate-800 mx-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={activeCard.backImage} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <p className="text-sm text-slate-200 leading-relaxed">{activeCard.back}</p>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                    <RotateCw className="w-3 h-3" />
                    <span>Click to flip back</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stack Next / Prev Controls */}
            <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
              <button
                type="button"
                disabled={activeStackIndex === 0}
                onClick={() => setActiveStackIndex(activeStackIndex - 1)}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Card {activeStackIndex + 1} of {flashcards.length}
              </span>
              <button
                type="button"
                disabled={activeStackIndex === flashcards.length - 1}
                onClick={() => setActiveStackIndex(activeStackIndex + 1)}
                className="p-2 rounded-full border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Flashcard Grid Mode (Multi-Column) */
          <div
            className={`grid gap-4 ${
              flashcards.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
            }`}
          >
            {flashcards.map((card, idx) => {
              const isFlipped = !!flippedCards[idx];
              return (
                <div
                  key={idx}
                  onClick={() => toggleCardFlip(idx)}
                  className="h-64 cursor-pointer perspective-1000"
                >
                  <div
                    className={`relative w-full h-full rounded-2xl shadow-sm transition-transform duration-500 transform-style-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    <div className="absolute inset-0 backface-hidden bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between text-center">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Prompt
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 my-auto">{card.front}</h4>
                      <div className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                        <RotateCw className="w-3 h-3" />
                        <span>Flip</span>
                      </div>
                    </div>

                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between text-center shadow-md">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Answer
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed my-auto">{card.back}</p>
                      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                        <RotateCw className="w-3 h-3" />
                        <span>Flip back</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 7. TIMELINE
  if (subtype === 'timeline') {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6 select-none relative">
        <div className="relative pl-8 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {timelineEvents.map((ev, idx) => (
            <div key={idx} className="relative group">
              {/* Node Marker along vertical line */}
              <div
                className="absolute -left-8 sm:-left-10 top-1 w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 border-white text-white font-bold text-xs flex items-center justify-center shadow-md"
                style={{ backgroundColor: accentColor }}
              >
                {idx + 1}
              </div>

              {/* Event Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-3">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-gray-700 font-bold text-xs">
                  {ev.yearOrDate}
                </span>

                <h4 className="text-base font-bold text-gray-900 tracking-tight">{ev.title}</h4>

                {ev.imageUrl && (
                  <div className="rounded-xl overflow-hidden bg-black aspect-video max-w-md border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ev.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{ev.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 8. SCENARIO (Articulate Rise-Style Theatrical Stage)
  if (subtype === 'scenario') {
    const isDialogue = activeScene.type === 'dialogue';
    const activeExpression = currentExpressionOverride || activeScene.expression || 'neutral';
    const characterRole = (content.characterRole as string) || '';
    const customPhotoUrl = (content.characterPhotoUrl as string) || '';
    const scenarioBgUrl = scenarioBg || SCENARIO_ENVIRONMENTS[0].url;
    const activeSceneIndex = Math.max(0, scenarioScenes.findIndex((s) => s.id === activeScene.id));

    return (
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-950 border border-zinc-800/80 select-none relative min-h-[540px] md:min-h-[580px] flex flex-col justify-end">
        {/* Layer 1: High-Resolution Full-Bleed Environment Backdrop */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scenarioBgUrl}
            alt="Workplace Environment"
            className="w-full h-full object-cover object-center filter brightness-[0.78] contrast-[1.05]"
          />
          {/* Subtle Depth-of-field blur & lighting scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/25 backdrop-blur-[1.5px]" />
          {/* Floor Shadow for Character Grounding */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />
        </div>

        {/* Layer 2: Theatrical Stage Layout (Character on Left + Floating Card on Right) */}
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-6 p-6 sm:p-10 pt-10 min-h-[540px] md:min-h-[580px]">
          {/* Left Character Stage: Realistic Cutout Figure Grounded to Floor */}
          <div className="w-full md:w-5/12 flex justify-center md:justify-start md:pl-6 self-end z-10">
            <ScenarioCharacterFigure
              characterName={scenarioCharacterName}
              characterRole={characterRole}
              customPhotoUrl={customPhotoUrl}
              expression={activeExpression as ScenarioExpression}
              className="w-full max-w-xs md:max-w-sm"
            />
          </div>

          {/* Right Floating Elevated Dialogue Card */}
          <div className="w-full md:w-7/12 flex justify-center md:justify-end my-auto z-10 py-4">
            <div className="w-full max-w-xl bg-white text-zinc-900 rounded-2xl md:rounded-3xl p-7 sm:p-9 shadow-2xl border border-zinc-200/90 text-left space-y-5 animate-in fade-in duration-200">
              {/* Scene Eyebrow & Title */}
              <div className="space-y-1.5 border-b border-zinc-100 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {activeScene.title || 'Workplace Scenario'}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                    Scene {activeSceneIndex + 1} of {scenarioScenes.length}
                  </span>
                </div>
              </div>

              {/* Character Speech Quote or Narrative Hook */}
              <div className="space-y-2">
                <div className="border-l-4 border-indigo-600 pl-4 py-1">
                  <p className="text-sm sm:text-base font-semibold text-zinc-900 leading-relaxed">
                    &ldquo;{activeScene.dialogue}&rdquo;
                  </p>
                </div>
              </div>

              {/* Interactive Response Options (Dialogue Mode) */}
              {isDialogue && selectedResponseIndex === null && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    Choose your action:
                  </div>
                  {(activeScene.responses || []).map((resp, rIdx) => (
                    <button
                      key={rIdx}
                      type="button"
                      onClick={() => handleSelectScenarioResponse(rIdx)}
                      className="w-full text-left p-3.5 rounded-xl border border-zinc-200/90 hover:border-indigo-500 hover:bg-indigo-50/40 text-xs sm:text-sm font-semibold text-zinc-800 transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-start gap-3 group"
                    >
                      <span className="w-4 h-4 rounded-full border-2 border-zinc-300 group-hover:border-indigo-600 mt-0.5 flex-shrink-0 transition-colors" />
                      <span className="leading-snug">{resp.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Consequence Feedback Panel (After Choice) */}
              {isDialogue && selectedResponseIndex !== null && activeScene.responses && (
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                      Outcome & Assessment
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                    {activeScene.responses[selectedResponseIndex]?.feedback}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        handleProceedScenario(
                          activeScene.responses![selectedResponseIndex].targetSceneId
                        )
                      }
                      className="bg-[#2b5c8f] hover:bg-[#20446b] text-white font-bold px-7 py-2.5 rounded-full text-xs tracking-widest uppercase cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Informational Scene: Pill-Shaped Continue Button */}
              {!isDialogue && (
                <div className="pt-4 flex justify-end border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() =>
                      handleProceedScenario(activeScene.continueTargetSceneId || 'next')
                    }
                    className="bg-[#2b5c8f] hover:bg-[#20446b] text-white font-bold px-8 py-2.5 rounded-full text-xs tracking-widest uppercase cursor-pointer shadow-md transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-1.5"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. BUTTON & BUTTON STACK
  if (subtype === 'button' || subtype === 'button_stack') {
    const alignClass =
      buttonAlignment === 'left' ? 'justify-start' : buttonAlignment === 'right' ? 'justify-end' : 'justify-center';

    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 select-none">
        <div className={`flex flex-wrap items-center gap-3 ${alignClass}`}>
          {actionButtons.map((btn, bIdx) => (
            <button
              key={bIdx}
              type="button"
              onClick={() => handleButtonClick(btn)}
              style={{
                backgroundColor: btn.style === 'outline' ? 'transparent' : accentColor,
                borderColor: accentColor,
                borderRadius: `${buttonRadius}px`,
                color: btn.style === 'outline' ? accentColor : '#ffffff',
              }}
              className="px-6 py-3 border font-bold text-xs sm:text-sm transition-all shadow-sm hover:scale-103 cursor-pointer flex items-center gap-2"
            >
              <span>{btn.label}</span>
              {btn.actionType === 'url' && <ExternalLink className="w-3.5 h-3.5" />}
              {btn.actionType === 'email' && <Mail className="w-3.5 h-3.5" />}
              {btn.actionType === 'lesson' && <ArrowRight className="w-3.5 h-3.5" />}
              {btn.actionType === 'exit' && <LogOut className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 10. SIMULATION LAB (TELL-SHOW-DO)
  if (subtype === 'simulation_lab') {
    return (
      <SimulationLabBlock
        block={block}
        onChange={onChange}
        accentColor={accentColor}
        isLearnerMode={isLearnerMode}
        onComplete={markCompleted}
      />
    );
  }

  // 11. STORYLINE / CUSTOM INTERACTIVE CANVAS BLOCK
  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 shadow-xl aspect-16/9 relative select-none">
      {/* Slide Canvas Elements */}
      {slideElements.map((el) => (
        <div
          key={el.id}
          onClick={() => handleStorylineElementClick(el)}
          style={{
            left: `${(el.x / 960) * 100}%`,
            top: `${(el.y / 540) * 100}%`,
          }}
          className="absolute z-10 cursor-pointer"
        >
          {el.type === 'button' && (
            <button
              type="button"
              className="px-5 py-2.5 rounded-full font-bold text-xs text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: accentColor }}
            >
              {el.text || 'Action Button'}
            </button>
          )}

          {el.type === 'text' && (
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white text-sm font-semibold max-w-xs border border-white/20">
              {el.text}
            </div>
          )}

          {el.type === 'hotspot' && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xl animate-pulse"
              style={{ backgroundColor: accentColor }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
          )}
        </div>
      ))}

      {/* Slide Active Feedback Layer */}
      {activeStorylineLayer && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-3">
            <h4 className="font-bold text-base text-gray-900">{activeStorylineLayer}</h4>
            <p className="text-xs text-gray-600">
              Trigger successfully executed! Interactive condition criteria satisfied.
            </p>
            <button
              type="button"
              onClick={() => setActiveStorylineLayer(null)}
              className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Close Layer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
