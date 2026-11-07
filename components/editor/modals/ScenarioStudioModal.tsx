'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GripVertical,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Edit2,
  MessageSquare,
  FileText,
  Volume2,
  Mic,
  Upload,
  Play,
  Pause,
  ArrowRight,
  MoreVertical,
  Check,
  Sparkles,
  HelpCircle,
  Smile,
  Frown,
  Meh,
  Image as ImageIcon,
  User,
} from 'lucide-react';
import { Block } from '@/lib/types';
import {
  SCENARIO_ENVIRONMENTS,
  ScenarioExpression,
} from '../blocks/ScenarioAvatars';
import { WAIST_FADE_MASK_STYLE } from '@/lib/bg-removal';
import CharacterPickerModal from '@/components/character/CharacterPickerModal';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';

// ==========================================
// SCENARIO DATA TYPES
// ==========================================
export interface ScenarioResponseItem {
  id: string;
  text: string;
  feedback: string;
  reactionExpression: ScenarioExpression;
  goTo: string; // 'next' | 'tryAgain' | 'end' | stepId
}

export interface ScenarioStepItem {
  id: string;
  type: 'dialogue' | 'text';
  title?: string;
  prompt?: string;
  bodyText?: string;
  hasCharacter: boolean;
  expression: ScenarioExpression;
  sceneDescription?: string;
  audioUrl?: string;
  goTo?: string;
  responses?: ScenarioResponseItem[];
}

export interface ScenarioSceneItem {
  id: string;
  title: string;
  backgroundUrl: string;
  blurBackground: boolean;
  characterName: string;
  characterRole?: string;
  characterPhotoUrl: string;
  characterFraming?: 'half_body' | 'full_body';
  characterExpressions?: Record<string, string>;
  showCharacter: boolean;
  steps: ScenarioStepItem[];
}

interface ScenarioStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block;
  onUpdateContent: (content: Record<string, unknown>) => void;
  accentColor?: string;
}

const mapScenarioExpressionToPose = (expr?: ScenarioExpression): import('@/lib/types').CharacterPose => {
  if (expr === 'worried') return 'concerned';
  if (expr === 'disappointed') return 'frustrated';
  if (expr === 'thinking') return 'confused';
  if (expr === 'talking' || expr === 'happy' || expr === 'concerned' || expr === 'frustrated' || expr === 'confused' || expr === 'presenting') {
    return expr;
  }
  return 'neutral';
};

const EXPRESSION_OPTIONS: {
  id: ScenarioExpression;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'neutral', label: 'Neutral', icon: Meh },
  { id: 'happy', label: 'Happy', icon: Smile },
  { id: 'talking', label: 'Talking', icon: MessageSquare },
  { id: 'concerned', label: 'Worried / Concerned', icon: HelpCircle },
  { id: 'frustrated', label: 'Frustrated / Disappointed', icon: Frown },
  { id: 'confused', label: 'Confused', icon: HelpCircle },
];

// Helper to normalize content into 2-level ScenarioSceneItem[]
function normalizeScenarioData(content: Record<string, unknown>): {
  scenes: ScenarioSceneItem[];
} {
  const globalBg =
    (content.backgroundImage as string) || SCENARIO_ENVIRONMENTS[0].url;
  const globalCharName = (content.characterName as string) || 'Jet';
  const globalCharRole =
    (content.characterRole as string) || 'Product Success Manager';
  const globalCharPhoto =
    (content.characterPhotoUrl as string) ||
    '/uploads/characters/jet-neutral-half.png';
  const globalCharExpressions =
    (content.characterExpressions as Record<string, string>) || {
      neutral: '/uploads/characters/jet-neutral-half.png',
      talking: '/uploads/characters/jet-talking-half.png',
      happy: '/uploads/characters/jet-happy-half.png',
      concerned: '/uploads/characters/jet-worried-half.png',
      worried: '/uploads/characters/jet-worried-half.png',
      frustrated: '/uploads/characters/jet-frustrated-half.png',
      confused: '/uploads/characters/jet-confused-half.png',
      presenting: '/uploads/characters/jet-presenting-half.png',
    };

  // If already rich format
  if (Array.isArray(content.richScenes) && content.richScenes.length > 0) {
    return { scenes: content.richScenes as ScenarioSceneItem[] };
  }

  // If legacy flat scenes exist
  const legacyScenes = Array.isArray(content.scenes) ? content.scenes : [];
  if (legacyScenes.length > 0) {
    // Check if first legacy item has .steps
    if (legacyScenes[0] && Array.isArray(legacyScenes[0].steps)) {
      return { scenes: legacyScenes as ScenarioSceneItem[] };
    }

    // Convert flat scenes to Scene 1 with multiple steps
    const convertedSteps: ScenarioStepItem[] = legacyScenes.map(
      (sc: any, idx: number) => ({
        id: sc.id || `step-1-${idx + 1}`,
        type: sc.type === 'info' ? 'text' : 'dialogue',
        title: sc.title || `Step 1.${idx + 1}`,
        prompt: sc.dialogue || '',
        bodyText: sc.dialogue || '',
        hasCharacter: true,
        expression: (sc.expression as ScenarioExpression) || 'neutral',
        goTo: sc.continueTargetSceneId || 'next',
        responses: Array.isArray(sc.responses)
          ? sc.responses.map((r: any, rIdx: number) => ({
              id: `resp-${idx}-${rIdx}`,
              text: r.text || '',
              feedback: r.feedback || '',
              reactionExpression:
                (r.reactionExpression as ScenarioExpression) || 'happy',
              goTo: r.targetSceneId || 'next',
            }))
          : [],
      })
    );

    return {
      scenes: [
        {
          id: 'scene-1',
          title: 'Scene 1',
          backgroundUrl: globalBg,
          blurBackground: true,
          characterName: globalCharName,
          characterRole: globalCharRole,
          characterPhotoUrl: globalCharPhoto,
          characterFraming: 'half_body',
          characterExpressions: globalCharExpressions,
          showCharacter: true,
          steps: convertedSteps,
        },
      ],
    };
  }

  // Default empty scaffold
  return {
    scenes: [
      {
        id: 'scene-1',
        title: 'Scene 1',
        backgroundUrl: globalBg,
        blurBackground: true,
        characterName: 'Jet',
        characterRole: 'Product Success Manager',
        characterPhotoUrl: '/uploads/characters/jet-neutral-half.png',
        characterFraming: 'half_body',
        characterExpressions: globalCharExpressions,
        showCharacter: true,
        steps: [
          {
            id: 'step-1-1',
            type: 'text',
            title: 'Welcome to the Scenario',
            bodyText:
              'In this simulation, you will navigate a high-stakes workplace decision. Assess the incoming situation carefully before choosing how to respond.',
            hasCharacter: true,
            expression: 'neutral',
            goTo: 'next',
          },
          {
            id: 'step-1-2',
            type: 'dialogue',
            title: 'Customer Escalation',
            prompt:
              'A key customer has reported a severe compliance issue and demands an immediate off-policy workaround. What do we tell them?',
            hasCharacter: true,
            expression: 'concerned',
            responses: [
              {
                id: 'resp-1',
                text: 'Offer to immediately apply the workaround to keep them satisfied.',
                feedback:
                  'Risk flag! Bypassing security protocols violates our SLA and exposes company data to audit penalties.',
                reactionExpression: 'frustrated',
                goTo: 'next',
              },
              {
                id: 'resp-2',
                text: 'Explain the policy constraint transparently and offer the approved accelerated escalation path.',
                feedback:
                  'Excellent choice! You maintained regulatory compliance while proactively offering a verified solution.',
                reactionExpression: 'happy',
                goTo: 'next',
              },
            ],
          },
        ],
      },
    ],
  };
}

export default function ScenarioStudioModal({
  isOpen,
  onClose,
  block,
  onUpdateContent,
  accentColor = '#2b5c8f',
}: ScenarioStudioModalProps) {
  const content = block.content || {};

  // Normalized 2-level state
  const initialData = useMemo(() => normalizeScenarioData(content), [content]);
  const [scenes, setScenes] = useState<ScenarioSceneItem[]>(initialData.scenes);

  // Selection state: { type: 'scene' | 'step', sceneIndex: number, stepIndex?: number }
  const [selectedTarget, setSelectedTarget] = useState<{
    type: 'scene' | 'step';
    sceneIndex: number;
    stepIndex?: number;
  }>({ type: 'scene', sceneIndex: 0 });

  // Scene collapse state
  const [collapsedScenes, setCollapsedScenes] = useState<Record<string, boolean>>(
    {}
  );

  // Undo/Redo stack
  const [history, setHistory] = useState<ScenarioSceneItem[][]>([
    initialData.scenes,
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // In-modal Interactive Preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewSceneIndex, setPreviewSceneIndex] = useState(0);
  const [previewStepIndex, setPreviewStepIndex] = useState(0);
  const [previewSelectedResponse, setPreviewSelectedResponse] = useState<
    number | null
  >(null);
  const [previewReactionOverride, setPreviewReactionOverride] = useState<
    string | null
  >(null);

  // Modals for Background & Character Picker
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState(false);
  const [editingTargetForModal, setEditingTargetForModal] = useState<
    'scene' | 'step' | 'response'
  >('scene');
  const [editingResponseIndex, setEditingResponseIndex] = useState<number | null>(
    null
  );

  // Sync external changes
  useEffect(() => {
    const data = normalizeScenarioData(block.content || {});
    setScenes(data.scenes);
  }, [block.content]);

  // Push to history and save
  const commitChange = (nextScenes: ScenarioSceneItem[]) => {
    setScenes(nextScenes);
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(nextScenes);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);

    // Save back to block content with both richScenes and backwards-compatible flat scenes
    const flatScenes = nextScenes.flatMap((sc, sIdx) =>
      sc.steps.map((st, stIdx) => ({
        id: st.id,
        title: st.title || `${sc.title} - Step ${stIdx + 1}`,
        type: st.type === 'text' ? 'info' : 'dialogue',
        expression: st.expression,
        dialogue: st.type === 'text' ? st.bodyText || '' : st.prompt || '',
        continueTargetSceneId: st.goTo,
        responses: (st.responses || []).map((r) => ({
          text: r.text,
          feedback: r.feedback,
          reactionExpression: r.reactionExpression,
          targetSceneId: r.goTo,
        })),
      }))
    );

    const activeScene = nextScenes[0];
    onUpdateContent({
      ...content,
      richScenes: nextScenes,
      scenes: flatScenes,
      backgroundImage: activeScene?.backgroundUrl,
      characterName: activeScene?.characterName,
      characterRole: activeScene?.characterRole,
      characterPhotoUrl: activeScene?.characterPhotoUrl,
      characterExpressions: activeScene?.characterExpressions,
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setScenes(prev);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setScenes(next);
    }
  };

  // Scene Operations
  const handleAddScene = () => {
    const newIdx = scenes.length + 1;
    const newScene: ScenarioSceneItem = {
      id: `scene-${Date.now()}`,
      title: `Scene ${newIdx}`,
      backgroundUrl:
        scenes[0]?.backgroundUrl || SCENARIO_ENVIRONMENTS[0].url,
      blurBackground: true,
      characterName: scenes[0]?.characterName || 'Jet',
      characterRole: scenes[0]?.characterRole || 'Product Success Manager',
      characterPhotoUrl:
        scenes[0]?.characterPhotoUrl ||
        '/uploads/characters/jet-neutral-half.png',
      characterFraming: scenes[0]?.characterFraming || 'half_body',
      characterExpressions: scenes[0]?.characterExpressions,
      showCharacter: true,
      steps: [
        {
          id: `step-${newIdx}-1`,
          type: 'text',
          title: `Scene ${newIdx} Briefing`,
          bodyText:
            'A new phase of the scenario begins. Review the details below before proceeding.',
          hasCharacter: true,
          expression: 'neutral',
          goTo: 'next',
        },
      ],
    };
    const next = [...scenes, newScene];
    commitChange(next);
    setSelectedTarget({ type: 'scene', sceneIndex: next.length - 1 });
  };

  const handleMoveScene = (sceneIndex: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? sceneIndex - 1 : sceneIndex + 1;
    if (targetIdx < 0 || targetIdx >= scenes.length) return;
    const next = [...scenes];
    const [moved] = next.splice(sceneIndex, 1);
    next.splice(targetIdx, 0, moved);
    commitChange(next);
    setSelectedTarget({ type: 'scene', sceneIndex: targetIdx });
  };

  const handleDuplicateScene = (sceneIndex: number) => {
    const src = scenes[sceneIndex];
    const copy: ScenarioSceneItem = {
      ...JSON.parse(JSON.stringify(src)),
      id: `scene-${Date.now()}`,
      title: `${src.title} (Copy)`,
    };
    const next = [...scenes];
    next.splice(sceneIndex + 1, 0, copy);
    commitChange(next);
    setSelectedTarget({ type: 'scene', sceneIndex: sceneIndex + 1 });
  };

  const handleDeleteScene = (sceneIndex: number) => {
    if (scenes.length <= 1) return;
    const next = scenes.filter((_, i) => i !== sceneIndex);
    commitChange(next);
    setSelectedTarget({
      type: 'scene',
      sceneIndex: Math.min(sceneIndex, next.length - 1),
    });
  };

  // Step Operations
  const handleAddStep = (sceneIndex: number) => {
    const sc = scenes[sceneIndex];
    const newStepNum = `${sceneIndex + 1}.${sc.steps.length + 1}`;
    const newStep: ScenarioStepItem = {
      id: `step-${Date.now()}`,
      type: 'dialogue',
      title: `Step ${newStepNum}`,
      prompt: 'What strategy should we implement next?',
      hasCharacter: true,
      expression: 'talking',
      responses: [
        {
          id: `resp-${Date.now()}-1`,
          text: 'Proceed with strategic option A',
          feedback:
            'Good outcome! This maintains operational velocity and safety.',
          reactionExpression: 'happy',
          goTo: 'next',
        },
        {
          id: `resp-${Date.now()}-2`,
          text: 'Delay and escalate to external counsel',
          feedback:
            'Caution! Escalation introduces unnecessary delays without changing the core constraints.',
          reactionExpression: 'worried',
          goTo: 'next',
        },
      ],
    };
    const next = [...scenes];
    next[sceneIndex] = {
      ...sc,
      steps: [...sc.steps, newStep],
    };
    commitChange(next);
    setSelectedTarget({
      type: 'step',
      sceneIndex,
      stepIndex: next[sceneIndex].steps.length - 1,
    });
  };

  const handleMoveStep = (
    sceneIndex: number,
    stepIndex: number,
    direction: 'up' | 'down'
  ) => {
    const sc = scenes[sceneIndex];
    const targetIdx = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (targetIdx < 0 || targetIdx >= sc.steps.length) return;
    const nextSteps = [...sc.steps];
    const [moved] = nextSteps.splice(stepIndex, 1);
    nextSteps.splice(targetIdx, 0, moved);
    const next = [...scenes];
    next[sceneIndex] = { ...sc, steps: nextSteps };
    commitChange(next);
    setSelectedTarget({ type: 'step', sceneIndex, stepIndex: targetIdx });
  };

  const handleDuplicateStep = (sceneIndex: number, stepIndex: number) => {
    const sc = scenes[sceneIndex];
    const src = sc.steps[stepIndex];
    const copy: ScenarioStepItem = {
      ...JSON.parse(JSON.stringify(src)),
      id: `step-${Date.now()}`,
      title: `${src.title || 'Step'} (Copy)`,
    };
    const nextSteps = [...sc.steps];
    nextSteps.splice(stepIndex + 1, 0, copy);
    const next = [...scenes];
    next[sceneIndex] = { ...sc, steps: nextSteps };
    commitChange(next);
    setSelectedTarget({
      type: 'step',
      sceneIndex,
      stepIndex: stepIndex + 1,
    });
  };

  const handleDeleteStep = (sceneIndex: number, stepIndex: number) => {
    const sc = scenes[sceneIndex];
    if (sc.steps.length <= 1) return;
    const nextSteps = sc.steps.filter((_, i) => i !== stepIndex);
    const next = [...scenes];
    next[sceneIndex] = { ...sc, steps: nextSteps };
    commitChange(next);
    setSelectedTarget({
      type: 'step',
      sceneIndex,
      stepIndex: Math.min(stepIndex, nextSteps.length - 1),
    });
  };

  const handleUpdateActiveScene = (patch: Partial<ScenarioSceneItem>) => {
    const sIdx = selectedTarget.sceneIndex;
    const next = [...scenes];
    next[sIdx] = { ...next[sIdx], ...patch };
    commitChange(next);
  };

  const handleUpdateActiveStep = (patch: Partial<ScenarioStepItem>) => {
    const { sceneIndex, stepIndex } = selectedTarget;
    if (stepIndex === undefined) return;
    const next = [...scenes];
    const sc = next[sceneIndex];
    const nextSteps = [...sc.steps];
    nextSteps[stepIndex] = { ...nextSteps[stepIndex], ...patch };
    next[sceneIndex] = { ...sc, steps: nextSteps };
    commitChange(next);
  };

  // Active items
  const activeScene = scenes[selectedTarget.sceneIndex] || scenes[0];
  const activeStep =
    selectedTarget.stepIndex !== undefined
      ? activeScene.steps[selectedTarget.stepIndex] || activeScene.steps[0]
      : null;

  // Expression aliases map
  const EXPRESSION_ALIASES: Record<string, string> = {
    concerned: 'worried',
    disappointed: 'frustrated',
    thinking: 'confused',
    smiling: 'happy',
    speaking: 'talking',
  };

  // Resolve photo for active character and expression
  const resolvePhoto = (
    sc: ScenarioSceneItem,
    expression: ScenarioExpression | string = 'neutral',
    framingOverride?: 'half_body' | 'full_body'
  ) => {
    const framing = framingOverride || sc.characterFraming || 'half_body';
    const norm = (EXPRESSION_ALIASES[expression] || expression) as ScenarioExpression;

    let url: string | undefined = undefined;
    if (sc.characterExpressions) {
      url =
        sc.characterExpressions[norm] ||
        sc.characterExpressions[expression as ScenarioExpression] ||
        sc.characterExpressions['neutral'];
    }
    if (!url) url = sc.characterPhotoUrl;
    if (!url) return '';

    if (framing === 'full_body') {
      if (url.includes('-half.png')) url = url.replace('-half.png', '-full.png');
      else if (url.includes('.png') && !url.includes('-full.png')) url = url.replace('.png', '-full.png');
    } else {
      if (url.includes('-full.png')) url = url.replace('-full.png', '-half.png').replace('-half.png', '.png');
    }
    return url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col select-none overflow-hidden animate-in fade-in duration-150">
      {/* ======================================================== */}
      {/* A. TOP BAR                                               */}
      {/* ======================================================== */}
      <header className="h-14 border-b border-zinc-200 px-6 flex items-center justify-between shrink-0 bg-white z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 tracking-tight">
              Scenario Studio
            </h1>
            <p className="text-[11px] text-zinc-500 font-medium">
              Branching theatrical stage, character cutout poses & decision trees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Undo"
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
            className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-200 mx-1" />

          {/* In-Modal Preview Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsPreviewMode(!isPreviewMode);
              setPreviewSceneIndex(0);
              setPreviewStepIndex(0);
              setPreviewSelectedResponse(null);
              setPreviewReactionOverride(null);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isPreviewMode
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50'
            }`}
          >
            {isPreviewMode ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
            )}
            <span>{isPreviewMode ? 'Edit Mode' : 'Preview'}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-900 hover:bg-black text-white px-5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shadow-xs transition-colors ml-2"
          >
            Close
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* MAIN WORKSPACE BODY: SPLIT-PANE                          */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ====================================================== */}
        {/* B. LEFT SIDEBAR: CONTENT ORDER TREE                     */}
        {/* ====================================================== */}
        <aside className="w-80 bg-zinc-50 border-r border-zinc-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-zinc-50 z-10">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Content Order
            </span>
            <button
              type="button"
              onClick={handleAddScene}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-zinc-200 hover:border-indigo-300 px-2.5 py-1 rounded-md shadow-2xs inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Scene</span>
            </button>
          </div>

          {/* Tree Structure */}
          <div className="p-3 space-y-4 flex-1">
            {scenes.map((sc, sIdx) => {
              const sceneNum = `${sIdx + 1}.0`;
              const isSceneSelected =
                selectedTarget.type === 'scene' &&
                selectedTarget.sceneIndex === sIdx;
              const isCollapsed = collapsedScenes[sc.id];

              return (
                <div
                  key={sc.id}
                  className="rounded-xl border border-zinc-200/90 bg-white shadow-2xs overflow-hidden"
                >
                  {/* LEVEL 1: SCENE ROOT ROW */}
                  <div
                    onClick={() =>
                      setSelectedTarget({ type: 'scene', sceneIndex: sIdx })
                    }
                    className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSceneSelected
                        ? 'bg-indigo-50/80 border-b border-indigo-100'
                        : 'hover:bg-zinc-50 border-b border-zinc-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* Collapse Caret */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCollapsedScenes((prev) => ({
                            ...prev,
                            [sc.id]: !prev[sc.id],
                          }));
                        }}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-700 cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Scene Title */}
                      <span className="text-xs font-bold text-zinc-900 truncate">
                        {sceneNum} {sc.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveScene(sIdx, 'up');
                        }}
                        disabled={sIdx === 0}
                        className="p-0.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveScene(sIdx, 'down');
                        }}
                        disabled={sIdx === scenes.length - 1}
                        className="p-0.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Mini 48x32 Composite Thumbnail */}
                      <div className="w-12 h-8 rounded border border-zinc-200 overflow-hidden relative bg-zinc-900 shrink-0 ml-1">
                        <img
                          src={sc.backgroundUrl}
                          alt="bg"
                          className="w-full h-full object-cover"
                        />
                        {sc.showCharacter && (
                          <img
                            src={sc.characterPhotoUrl}
                            alt="char"
                            className="absolute bottom-0 left-1 h-7 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2: CONTENT STEPS */}
                  {!isCollapsed && (
                    <div className="p-2 space-y-1.5 bg-zinc-50/50">
                      {sc.steps.map((st, stIdx) => {
                        const stepNum = `${sIdx + 1}.${stIdx + 1}`;
                        const isStepSelected =
                          selectedTarget.type === 'step' &&
                          selectedTarget.sceneIndex === sIdx &&
                          selectedTarget.stepIndex === stIdx;
                        const previewText =
                          st.type === 'text'
                            ? st.title || st.bodyText
                            : st.prompt;

                        return (
                          <div
                            key={st.id}
                            onClick={() =>
                              setSelectedTarget({
                                type: 'step',
                                sceneIndex: sIdx,
                                stepIndex: stIdx,
                              })
                            }
                            className={`p-2 pl-3 rounded-lg border text-left cursor-pointer transition-all flex items-start justify-between gap-2 group ${
                              isStepSelected
                                ? 'bg-white border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                                : 'bg-white/80 border-zinc-200 hover:border-zinc-300 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              {/* Step Number + Type Icon */}
                              <div className="flex flex-col items-center mt-0.5 shrink-0">
                                <span className="text-[11px] font-bold text-zinc-900 font-mono">
                                  {stepNum}
                                </span>
                                <span className="text-[10px] mt-0.5">
                                  {st.type === 'dialogue' ? '💬' : '🗐'}
                                </span>
                              </div>

                              {/* 2-Line Preview */}
                              <p className="text-[11px] text-zinc-600 line-clamp-2 leading-relaxed font-medium">
                                {previewText || 'Empty content beat'}
                              </p>
                            </div>

                            {/* Up / Down Reorder Arrows */}
                            <div className="flex flex-col items-center opacity-60 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStep(sIdx, stIdx, 'up');
                                }}
                                disabled={stIdx === 0}
                                className="p-0.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 cursor-pointer"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStep(sIdx, stIdx, 'down');
                                }}
                                disabled={stIdx === sc.steps.length - 1}
                                className="p-0.5 text-zinc-400 hover:text-zinc-800 disabled:opacity-20 cursor-pointer"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* + Add Content Button */}
                      <button
                        type="button"
                        onClick={() => handleAddStep(sIdx)}
                        className="w-full py-2 rounded-lg border border-dashed border-zinc-300 hover:border-indigo-500 hover:bg-indigo-50/50 text-[11px] font-bold text-zinc-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 cursor-pointer transition-all mt-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Content</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ====================================================== */}
        {/* C. RIGHT MAIN CANVAS                                    */}
        {/* ====================================================== */}
        <main className="flex-1 overflow-y-auto px-8 md:px-14 py-8 bg-white">
          {isPreviewMode ? (
            /* ================================================== */
            /* IN-MODAL INTERACTIVE PLAYER PREVIEW               */
            /* ================================================== */
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Interactive Learner Preview
                  </h2>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  Scene {previewSceneIndex + 1} of {scenes.length} • Step{' '}
                  {previewStepIndex + 1} of{' '}
                  {scenes[previewSceneIndex]?.steps.length || 1}
                </span>
              </div>

              {(() => {
                const pScene = scenes[previewSceneIndex] || scenes[0];
                const pStep =
                  pScene?.steps[previewStepIndex] || pScene?.steps[0];
                if (!pStep) return null;

                const isDialogue = pStep.type === 'dialogue';
                const curExpression =
                  (previewReactionOverride as ScenarioExpression) ||
                  pStep.expression ||
                  'neutral';
                const photoUrl = resolvePhoto(pScene, curExpression);

                return (
                  <div className="w-full rounded-3xl overflow-hidden shadow-2xl bg-zinc-950 border border-zinc-800 relative min-h-[520px] md:min-h-[580px] flex flex-col justify-end">
                    {/* Layer 1: Background */}
                    <div className="absolute inset-0 z-0">
                      <img
                        src={pScene.backgroundUrl}
                        alt="bg"
                        className={`w-full h-full object-cover filter brightness-[0.8] ${
                          pScene.blurBackground ? 'blur-[4px]' : ''
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-black/30" />
                      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950 to-transparent" />
                    </div>

                    {/* Layer 2: Character Left + Card Right */}
                    <div className="relative z-10 w-full flex flex-col md:flex-row items-center md:items-end justify-between gap-6 p-6 sm:p-10 pt-10 min-h-[520px]">
                      {/* Character Left */}
                      <div className="w-full md:w-5/12 flex justify-center md:justify-start md:pl-6 self-end z-10">
                        {pScene.showCharacter && pStep.hasCharacter && (
                          <div className="relative flex flex-col items-center justify-end select-none">
                            <img
                              src={photoUrl}
                              alt={pScene.characterName}
                              className={`w-auto object-contain object-bottom drop-shadow-2xl transition-all duration-300 ${
                                pScene.characterFraming === 'full_body'
                                  ? 'max-h-[500px] md:max-h-[540px]'
                                  : 'max-h-[440px] md:max-h-[480px]'
                              }`}
                              style={
                                pScene.characterFraming === 'full_body'
                                  ? undefined
                                  : WAIST_FADE_MASK_STYLE
                              }
                            />
                          </div>
                        )}
                      </div>

                      {/* Elevated Card Right */}
                      <div className="w-full md:w-7/12 flex justify-center md:justify-end my-auto z-10 py-4">
                        <div className="w-full max-w-xl bg-white text-zinc-900 rounded-3xl p-7 sm:p-9 shadow-2xl border border-zinc-200/90 text-left space-y-5 animate-in fade-in duration-200">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                              {pStep.title || pScene.title}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                              Step {previewSceneIndex + 1}.{previewStepIndex + 1}
                            </span>
                          </div>

                          {/* Body or Dialogue Prompt */}
                          {isDialogue ? (
                            <div className="border-l-4 border-indigo-600 pl-4 py-1">
                              <p className="text-sm sm:text-base font-semibold text-zinc-900 leading-relaxed">
                                &ldquo;{pStep.prompt}&rdquo;
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {pStep.title && (
                                <h3 className="text-lg font-bold text-zinc-900">
                                  {pStep.title}
                                </h3>
                              )}
                              <p className="text-sm text-zinc-700 leading-relaxed font-normal whitespace-pre-wrap">
                                {pStep.bodyText}
                              </p>
                            </div>
                          )}

                          {/* Dialogue Choices */}
                          {isDialogue && previewSelectedResponse === null && (
                            <div className="space-y-2.5 pt-2">
                              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                                Choose your response:
                              </div>
                              {(pStep.responses || []).map((resp, rIdx) => (
                                <button
                                  key={rIdx}
                                  type="button"
                                  onClick={() => {
                                    setPreviewSelectedResponse(rIdx);
                                    setPreviewReactionOverride(
                                      resp.reactionExpression
                                    );
                                  }}
                                  className="w-full text-left p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-xs sm:text-sm font-semibold text-zinc-800 transition-all cursor-pointer flex items-start gap-3 group"
                                >
                                  <span className="w-5 h-5 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-700 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                                    0{rIdx + 1}
                                  </span>
                                  <span className="leading-snug">{resp.text}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Dialogue Feedback */}
                          {isDialogue &&
                            previewSelectedResponse !== null &&
                            pStep.responses && (
                              <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 space-y-3.5 animate-in fade-in duration-150">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                  <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                                    Outcome & Reaction
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-medium">
                                  {
                                    pStep.responses[previewSelectedResponse]
                                      ?.feedback
                                  }
                                </p>
                                <div className="pt-2 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const resp =
                                        pStep.responses![
                                          previewSelectedResponse
                                        ];
                                      setPreviewSelectedResponse(null);
                                      setPreviewReactionOverride(null);
                                      if (resp.goTo === 'tryAgain') {
                                        // Stay on step
                                      } else if (
                                        previewStepIndex <
                                        pScene.steps.length - 1
                                      ) {
                                        setPreviewStepIndex(
                                          previewStepIndex + 1
                                        );
                                      } else if (
                                        previewSceneIndex <
                                        scenes.length - 1
                                      ) {
                                        setPreviewSceneIndex(
                                          previewSceneIndex + 1
                                        );
                                        setPreviewStepIndex(0);
                                      } else {
                                        alert('Scenario completed!');
                                      }
                                    }}
                                    className="bg-zinc-900 hover:bg-black text-white font-bold px-7 py-2.5 rounded-full text-xs tracking-widest uppercase cursor-pointer shadow-md inline-flex items-center gap-1.5 transition-all"
                                  >
                                    <span>Continue</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            )}

                          {/* Text Step Continue Button */}
                          {!isDialogue && (
                            <div className="pt-4 flex justify-end border-t border-zinc-100">
                              <button
                                type="button"
                                onClick={() => {
                                  if (previewStepIndex < pScene.steps.length - 1) {
                                    setPreviewStepIndex(previewStepIndex + 1);
                                  } else if (
                                    previewSceneIndex <
                                    scenes.length - 1
                                  ) {
                                    setPreviewSceneIndex(previewSceneIndex + 1);
                                    setPreviewStepIndex(0);
                                  } else {
                                    alert('Scenario completed!');
                                  }
                                }}
                                className="bg-zinc-900 hover:bg-black text-white font-bold px-8 py-2.5 rounded-full text-xs tracking-widest uppercase cursor-pointer shadow-md inline-flex items-center gap-1.5 transition-all"
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
              })()}
            </div>
          ) : selectedTarget.type === 'scene' ? (
            /* ================================================== */
            /* 1. SCENE ROOT: "SCENE STAGE SETUP VIEW"            */
            /* ================================================== */
            <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-150">
              {/* Heading */}
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                  {activeScene.title}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Edit the environment background and character for this scene.
                </p>
              </div>

              {/* Live Composite Banner Preview */}
              <div className="w-full h-64 rounded-xl overflow-hidden relative border border-zinc-200 shadow-sm bg-zinc-950 select-none">
                <img
                  src={activeScene.backgroundUrl}
                  alt="Scene Background"
                  className={`w-full h-full object-cover filter brightness-[0.8] ${
                    activeScene.blurBackground ? 'blur-[4px]' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/20" />
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-950 to-transparent" />

                {/* Character cutout grounded on left */}
                {activeScene.showCharacter && (
                  <div className="absolute bottom-0 left-8 z-10 flex flex-col items-center">
                    <img
                      src={resolvePhoto(activeScene, 'neutral')}
                      alt={activeScene.characterName}
                      className={`w-auto object-contain object-bottom drop-shadow-2xl ${
                        activeScene.characterFraming === 'full_body'
                          ? 'max-h-56'
                          : 'max-h-48'
                      }`}
                      style={
                        activeScene.characterFraming === 'full_body'
                          ? undefined
                          : WAIST_FADE_MASK_STYLE
                      }
                    />
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                  Live Stage Preview
                </div>
              </div>

              {/* Two Side-by-Side Control Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Background */}
                <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-zinc-700" />
                      <h4 className="text-sm font-bold text-zinc-900">
                        Background
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBgModalOpen(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-zinc-200 px-3 py-1 rounded-lg shadow-2xs cursor-pointer hover:border-indigo-300 inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="w-full h-28 rounded-lg overflow-hidden border border-zinc-200 relative bg-zinc-200">
                    <img
                      src={activeScene.backgroundUrl}
                      alt="bg preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Blur toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                    <span className="text-xs font-medium text-zinc-700">
                      Blur background throughout scene
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateActiveScene({
                          blurBackground: !activeScene.blurBackground,
                        })
                      }
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        activeScene.blurBackground ? 'bg-zinc-900' : 'bg-zinc-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          activeScene.blurBackground ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Card 2: Character */}
                <div className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/60 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-zinc-700" />
                      <h4 className="text-sm font-bold text-zinc-900">
                        Character
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTargetForModal('scene');
                        setIsCharModalOpen(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-white border border-zinc-200 px-3 py-1 rounded-lg shadow-2xs cursor-pointer hover:border-indigo-300 inline-flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-zinc-200">
                    <div className="w-12 h-14 rounded-md overflow-hidden bg-zinc-100 flex items-end justify-center shrink-0 border border-zinc-100">
                      <img
                        src={resolvePhoto(activeScene, 'neutral')}
                        alt={activeScene.characterName}
                        className="max-h-14 object-contain object-bottom"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-zinc-900 truncate">
                        {activeScene.characterName}
                      </h5>
                      <p className="text-[11px] text-zinc-500 truncate">
                        {activeScene.characterRole || 'Scenario Subject'}
                      </p>
                    </div>
                  </div>

                  {/* Framing Toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-zinc-700">Body Framing</span>
                    <div className="flex rounded-lg border border-zinc-200 p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateActiveScene({ characterFraming: 'half_body' })
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                          activeScene.characterFraming !== 'full_body'
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Half-Body
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateActiveScene({ characterFraming: 'full_body' })
                        }
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-all ${
                          activeScene.characterFraming === 'full_body'
                            ? 'bg-zinc-900 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-900'
                        }`}
                      >
                        Full-Body
                      </button>
                    </div>
                  </div>

                  {/* Show Character Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                    <span className="text-xs font-medium text-zinc-700">
                      Show character throughout scene
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateActiveScene({
                          showCharacter: !activeScene.showCharacter,
                        })
                      }
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        activeScene.showCharacter ? 'bg-zinc-900' : 'bg-zinc-300'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          activeScene.showCharacter ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeStep ? (
            /* ================================================== */
            /* 2. CONTENT STEP: "STEP EDITOR VIEW"               */
            /* ================================================== */
            <div className="max-w-3xl mx-auto space-y-7 animate-in fade-in duration-150">
              {/* Step Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-zinc-900 font-mono">
                    {selectedTarget.sceneIndex + 1}.
                    {(selectedTarget.stepIndex ?? 0) + 1}
                  </span>
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">
                    Content Step
                  </span>
                </div>

                {/* Content Type Dropdown */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-500">
                    Type:
                  </span>
                  <select
                    value={activeStep.type}
                    onChange={(e) =>
                      handleUpdateActiveStep({
                        type: e.target.value as 'dialogue' | 'text',
                      })
                    }
                    className="text-xs font-bold text-zinc-800 bg-zinc-50 border border-zinc-300 rounded-lg px-3 py-1.5 cursor-pointer hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  >
                    <option value="dialogue">💬 Dialogue</option>
                    <option value="text">🗐 Text</option>
                  </select>
                </div>
              </div>

              {/* LIVE STAGE PREVIEW FOR THIS STEP */}
              <div className="w-full h-52 rounded-2xl overflow-hidden relative shadow-lg bg-zinc-950 border border-zinc-200">
                <img
                  src={activeScene.backgroundUrl}
                  alt="Stage Environment"
                  className={`w-full h-full object-cover filter brightness-[0.8] ${
                    activeScene.blurBackground ? 'blur-[3px]' : ''
                  }`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-black/20" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />

                {/* Character cutout with active expression */}
                {activeScene.showCharacter && activeStep.hasCharacter && (
                  <div className="absolute bottom-0 left-8 z-10 flex flex-col items-center">
                    <img
                      src={resolvePhoto(activeScene, activeStep.expression)}
                      alt={activeScene.characterName}
                      className={`w-auto object-contain object-bottom drop-shadow-2xl transition-all duration-300 ${
                        activeScene.characterFraming === 'full_body'
                          ? 'max-h-48'
                          : 'max-h-44'
                      }`}
                      style={
                        activeScene.characterFraming === 'full_body'
                          ? undefined
                          : WAIST_FADE_MASK_STYLE
                      }
                    />
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                  LIVE STAGE PREVIEW • {activeStep.expression.toUpperCase()}
                </div>
              </div>

              {/* IF STEP TYPE === TEXT */}
              {activeStep.type === 'text' ? (
                <div className="space-y-6">
                  {/* Heading Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Heading
                    </label>
                    <input
                      type="text"
                      value={activeStep.title || ''}
                      onChange={(e) =>
                        handleUpdateActiveStep({ title: e.target.value })
                      }
                      placeholder="e.g. A Course—or a Different Solution?"
                      className="w-full text-base font-bold text-zinc-900 px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900"
                    />
                  </div>

                  {/* Body Text Editor */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        Body Text (max 500 characters)
                      </label>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {(activeStep.bodyText || '').length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      maxLength={500}
                      value={activeStep.bodyText || ''}
                      onChange={(e) =>
                        handleUpdateActiveStep({ bodyText: e.target.value })
                      }
                      placeholder="Add summary, reflection, or key takeaways for this beat..."
                      className="w-full text-sm text-zinc-800 px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 leading-relaxed"
                    />
                  </div>

                  {/* Character Section */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">
                          Show character on this step
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateActiveStep({
                            hasCharacter: !activeStep.hasCharacter,
                          })
                        }
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                          activeStep.hasCharacter ? 'bg-zinc-900' : 'bg-zinc-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            activeStep.hasCharacter
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {activeStep.hasCharacter && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
                        {/* Circular Avatar Thumbnail */}
                        <div className="w-10 h-10 rounded-full border border-zinc-300 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                          <img
                            src={resolvePhoto(
                              activeScene,
                              activeStep.expression
                            )}
                            alt={activeScene.characterName}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        {/* Expression Dropdown */}
                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                            Facial Expression & Pose:
                          </label>
                          <select
                            value={activeStep.expression}
                            onChange={(e) =>
                              handleUpdateActiveStep({
                                expression: e.target.value as ScenarioExpression,
                              })
                            }
                            className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          >
                            {EXPRESSION_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scene Description (Accessibility) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Scene Description (Accessibility)
                    </label>
                    <input
                      type="text"
                      value={activeStep.sceneDescription || ''}
                      onChange={(e) =>
                        handleUpdateActiveStep({
                          sceneDescription: e.target.value,
                        })
                      }
                      placeholder="Add description here for screen readers..."
                      className="w-full text-xs text-zinc-800 px-3.5 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  {/* Audio Section */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-zinc-600" />
                        <span className="text-xs font-bold text-zinc-900">
                          Audio
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        Record, upload or create with AI
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            'Audio recorder ready: connect microphone or upload .mp3 audio voiceover.'
                          )
                        }
                        className="px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 rounded-lg text-xs font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-500" />
                        <span>Record Mic</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          alert('Upload .mp3, .wav, or .m4a audio file')
                        }
                        className="px-3 py-1.5 bg-white border border-zinc-200 hover:border-zinc-400 rounded-lg text-xs font-semibold text-zinc-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Upload Audio</span>
                      </button>
                    </div>

                    {/* Inline audio bar mock */}
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-zinc-200">
                      <button
                        type="button"
                        className="w-6 h-6 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0"
                      >
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      </button>
                      <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-indigo-600 rounded-full" />
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        0:08
                      </span>
                      <span className="text-[11px] font-bold text-zinc-600">
                        1x
                      </span>
                      <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* Footer Navigation: Go To */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                    <span className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      Go To:
                    </span>
                    <select
                      value={activeStep.goTo || 'next'}
                      onChange={(e) =>
                        handleUpdateActiveStep({ goTo: e.target.value })
                      }
                      className="text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                    >
                      <option value="next">Next in Scene</option>
                      <option value="scene-1">Scene 1</option>
                      {scenes.length > 1 && (
                        <option value="scene-2">Scene 2</option>
                      )}
                      <option value="end">End Scenario</option>
                    </select>
                  </div>
                </div>
              ) : (
                /* IF STEP TYPE === DIALOGUE */
                <div className="space-y-6">
                  {/* Prompt Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                      {activeScene.characterName} says:
                    </label>
                    <textarea
                      rows={3}
                      value={activeStep.prompt || ''}
                      onChange={(e) =>
                        handleUpdateActiveStep({ prompt: e.target.value })
                      }
                      placeholder="What does the character say to prompt the learner?"
                      className="w-full text-sm font-medium text-zinc-900 px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 leading-relaxed"
                    />
                  </div>

                  {/* Character Section */}
                  <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">
                        Show character on this dialogue beat
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateActiveStep({
                            hasCharacter: !activeStep.hasCharacter,
                          })
                        }
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                          activeStep.hasCharacter ? 'bg-zinc-900' : 'bg-zinc-300'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            activeStep.hasCharacter
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {activeStep.hasCharacter && (
                      <div className="flex items-center gap-3 pt-2 border-t border-zinc-200">
                        <div className="w-10 h-10 rounded-full border border-zinc-300 overflow-hidden bg-white shrink-0 flex items-center justify-center">
                          <img
                            src={resolvePhoto(
                              activeScene,
                              activeStep.expression
                            )}
                            alt={activeScene.characterName}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        <div className="flex-1">
                          <label className="text-[11px] font-semibold text-zinc-500 block mb-1">
                            Facial Expression while speaking:
                          </label>
                          <select
                            value={activeStep.expression}
                            onChange={(e) =>
                              handleUpdateActiveStep({
                                expression: e.target.value as ScenarioExpression,
                              })
                            }
                            className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                          >
                            {EXPRESSION_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Change Character Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTargetForModal('scene');
                            setIsCharModalOpen(true);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white border border-zinc-200 px-3 py-1.5 rounded-lg shadow-2xs cursor-pointer hover:border-indigo-300 inline-flex items-center gap-1 shrink-0 mt-4"
                          title="Change Character"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Change Character</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Responses Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                        Responses (Learner Options & Character Reactions)
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          const current = activeStep.responses || [];
                          const newR: ScenarioResponseItem = {
                            id: `resp-${Date.now()}`,
                            text: '',
                            feedback: '',
                            reactionExpression: 'happy',
                            goTo: 'next',
                          };
                          handleUpdateActiveStep({
                            responses: [...current, newR],
                          });
                        }}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-md cursor-pointer inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Response</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(activeStep.responses || []).map((resp, rIdx) => {
                        const numLabel = rIdx + 1 < 10 ? `0${rIdx + 1}` : `${rIdx + 1}`;

                        return (
                          <div
                            key={resp.id || rIdx}
                            className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-4 shadow-2xs"
                          >
                            {/* Response Header */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black font-mono text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1 rounded-md">
                                {numLabel}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const current = activeStep.responses || [];
                                  if (current.length <= 1) return;
                                  handleUpdateActiveStep({
                                    responses: current.filter(
                                      (_, i) => i !== rIdx
                                    ),
                                  });
                                }}
                                className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Response Text */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                                Learner Option Text:
                              </label>
                              <input
                                type="text"
                                value={resp.text}
                                onChange={(e) => {
                                  const nextR = [...(activeStep.responses || [])];
                                  nextR[rIdx] = {
                                    ...nextR[rIdx],
                                    text: e.target.value,
                                  };
                                  handleUpdateActiveStep({ responses: nextR });
                                }}
                                placeholder="Enter learner response choice..."
                                className="w-full text-xs font-semibold text-zinc-900 px-3.5 py-2.5 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                              />
                            </div>

                            {/* Character Reaction for this response */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              {/* Left: Reaction Expression */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                                  Character Reaction:
                                </label>
                                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-zinc-200">
                                  <div className="w-8 h-8 rounded-full border border-zinc-200 overflow-hidden shrink-0">
                                    <img
                                      src={resolvePhoto(
                                        activeScene,
                                        resp.reactionExpression
                                      )}
                                      alt="reaction"
                                      className="w-full h-full object-cover object-top"
                                    />
                                  </div>
                                  <select
                                    value={resp.reactionExpression}
                                    onChange={(e) => {
                                      const nextR = [
                                        ...(activeStep.responses || []),
                                      ];
                                      nextR[rIdx] = {
                                        ...nextR[rIdx],
                                        reactionExpression: e.target
                                          .value as ScenarioExpression,
                                      };
                                      handleUpdateActiveStep({
                                        responses: nextR,
                                      });
                                    }}
                                    className="text-xs font-bold text-zinc-800 bg-transparent flex-1 focus:outline-none"
                                  >
                                    {EXPRESSION_OPTIONS.map((opt) => (
                                      <option key={opt.id} value={opt.id}>
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Right: Go to Branching Target */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                                  Go To:
                                </label>
                                <select
                                  value={resp.goTo || 'next'}
                                  onChange={(e) => {
                                    const nextR = [
                                      ...(activeStep.responses || []),
                                    ];
                                    nextR[rIdx] = {
                                      ...nextR[rIdx],
                                      goTo: e.target.value,
                                    };
                                    handleUpdateActiveStep({
                                      responses: nextR,
                                    });
                                  }}
                                  className="w-full text-xs font-bold text-zinc-800 bg-white border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                                >
                                  <option value="next">Next in Scene</option>
                                  <option value="tryAgain">
                                    Try Again (Stay on this step)
                                  </option>
                                  <option value="scene-1">Scene 1</option>
                                  {scenes.length > 1 && (
                                    <option value="scene-2">Scene 2</option>
                                  )}
                                  <option value="end">End Scenario</option>
                                </select>
                              </div>
                            </div>

                            {/* Character Feedback Reply Text */}
                            <div className="space-y-1 pt-1">
                              <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                                Character Feedback Reply:
                              </label>
                              <textarea
                                rows={2}
                                value={resp.feedback}
                                onChange={(e) => {
                                  const nextR = [
                                    ...(activeStep.responses || []),
                                  ];
                                  nextR[rIdx] = {
                                    ...nextR[rIdx],
                                    feedback: e.target.value,
                                  };
                                  handleUpdateActiveStep({ responses: nextR });
                                }}
                                placeholder="What does the character say back to explain the consequence?"
                                className="w-full text-xs text-zinc-800 px-3.5 py-2 rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>

      {/* ======================================================== */}
      {/* MODALS: CHARACTER PICKER & BACKGROUND MEDIA VAULT       */}
      {/* ======================================================== */}
      <CharacterPickerModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        onSelect={(result) => {
          const expressions =
            result.character?.expressions || {
              neutral: result.poseUrl,
              talking: result.poseUrl,
              happy: result.poseUrl,
              concerned: result.poseUrl,
              worried: result.poseUrl,
              frustrated: result.poseUrl,
              confused: result.poseUrl,
              presenting: result.poseUrl,
            };

          handleUpdateActiveScene({
            characterName: result.name,
            characterRole: result.role,
            characterPhotoUrl: result.poseUrl,
            characterExpressions: expressions as Record<string, string>,
          });
          setIsCharModalOpen(false);
        }}
        initialPose={mapScenarioExpressionToPose(activeStep?.expression)}
      />

      <UnifiedMediaModal
        isOpen={isBgModalOpen}
        onClose={() => setIsBgModalOpen(false)}
        mediaType="image"
        onSelect={(url) => {
          handleUpdateActiveScene({ backgroundUrl: url });
          setIsBgModalOpen(false);
        }}
        currentUrl={activeScene.backgroundUrl}
        accentColor={accentColor}
      />
    </div>
  );
}
