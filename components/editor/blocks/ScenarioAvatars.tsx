'use client';

import React from 'react';
import { Check, MessageSquare, AlertCircle, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';
import { WAIST_FADE_MASK_STYLE } from '@/lib/bg-removal';

export type ScenarioExpression =
  | 'neutral'
  | 'happy'
  | 'talking'
  | 'concerned'
  | 'worried'
  | 'frustrated'
  | 'disappointed'
  | 'confused'
  | 'thinking'
  | 'presenting';

export interface ScenarioCharacterDef {
  key: string;
  name: string;
  role: string;
  photoUrl: string;
}

export const SCENARIO_CHARACTERS: ScenarioCharacterDef[] = [
  {
    key: 'maya',
    name: 'Maya',
    role: 'Store Lead / Retail Director',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80',
  },
  {
    key: 'alex',
    name: 'Alex',
    role: 'Cybersecurity & IT Specialist',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
  },
  {
    key: 'david',
    name: 'David',
    role: 'Senior Managing Director',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80',
  },
  {
    key: 'sarah',
    name: 'Sarah',
    role: 'Head of Clinical Operations',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&q=80',
  },
  {
    key: 'elena',
    name: 'Elena',
    role: 'Deal Desk & Customer Experience',
    photoUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80',
  },
  {
    key: 'marcus',
    name: 'Marcus',
    role: 'Lead Software Architect',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80',
  },
];

export const SCENARIO_ENVIRONMENTS = [
  {
    id: 'cafe',
    name: 'Bright Cup Café / Retail',
    description: 'Warm cafe counter and busy retail front of house',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=70',
  },
  {
    id: 'office',
    name: 'Modern Glass Office',
    description: 'Bright open-plan corporate headquarters',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=70',
  },
  {
    id: 'boardroom',
    name: 'Executive Boardroom',
    description: 'High-stakes boardroom and conference table',
    url: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=300&q=70',
  },
  {
    id: 'tech-lab',
    name: 'Tech Lab / Server Room',
    description: 'Data center, servers and engineering workstations',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=300&q=70',
  },
  {
    id: 'clinic',
    name: 'Medical Clinic',
    description: 'Clean medical treatment and patient consultation office',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=300&q=70',
  },
  {
    id: 'warehouse',
    name: 'Warehouse & Logistics Floor',
    description: 'Supply chain distribution floor and inventory facility',
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80',
    thumb: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300&q=70',
  },
];

// High-polish expression badge
export function ScenarioExpressionBadge({
  expression = 'neutral',
  className = '',
}: {
  expression?: ScenarioExpression;
  className?: string;
}) {
  switch (expression) {
    case 'happy':
      return (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-lg border border-emerald-400/40 backdrop-blur-md ${className}`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Approved</span>
        </div>
      );
    case 'talking':
      return (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-600 text-white text-[11px] font-bold shadow-lg border border-sky-400/40 backdrop-blur-md ${className}`}
        >
          <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Speaking</span>
        </div>
      );
    case 'concerned':
      return (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[11px] font-bold shadow-lg border border-amber-300/40 backdrop-blur-md ${className}`}
        >
          <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Thinking</span>
        </div>
      );
    case 'frustrated':
      return (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-lg border border-rose-400/40 backdrop-blur-md ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Concerned</span>
        </div>
      );
    default:
      return (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-white text-[11px] font-semibold shadow-lg border border-white/20 backdrop-blur-md ${className}`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-300" />
          <span>Listening</span>
        </div>
      );
  }
}

// Find character photo helper
export function getCharacterPhoto(characterName?: string, customPhotoUrl?: string): string {
  if (customPhotoUrl) return customPhotoUrl;
  if (!characterName) return SCENARIO_CHARACTERS[0].photoUrl;
  const lower = characterName.toLowerCase();
  const found = SCENARIO_CHARACTERS.find((c) => lower.includes(c.key) || lower.includes(c.name.toLowerCase()));
  return found ? found.photoUrl : SCENARIO_CHARACTERS[0].photoUrl;
}

// Theatrical Grounded Character Figure (Anchored to Stage Bottom-Left)
export function ScenarioCharacterFigure({
  characterName = 'Maya',
  characterRole,
  customPhotoUrl,
  expression = 'neutral',
  framing = 'half_body',
  className = '',
}: {
  characterName?: string;
  characterRole?: string;
  customPhotoUrl?: string;
  expression?: ScenarioExpression;
  framing?: 'half_body' | 'full_body';
  className?: string;
}) {
  const photo = getCharacterPhoto(characterName, customPhotoUrl);

  // Detect transparent cutouts
  const isCutout =
    photo.includes('/uploads/characters/') ||
    photo.endsWith('.svg') ||
    photo.includes('cutout') ||
    photo.includes('_full.png') ||
    (photo.includes('.png') && !photo.includes('unsplash'));

  return (
    <div className={`relative flex flex-col items-center justify-end select-none ${className}`}>
      {/* Ground Silhouette Shadow */}
      <div className="absolute -bottom-2 inset-x-8 h-6 bg-black/70 blur-xl rounded-full pointer-events-none" />

      {isCutout ? (
        /* True Transparent Cutout Figure grounded directly on the stage (NO floating forehead badges or chest boxes) */
        <div className="relative flex flex-col items-center justify-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={characterName}
            className={`w-auto object-contain drop-shadow-2xl transition-all duration-300 hover:scale-[1.01] ${
              framing === 'full_body'
                ? 'max-h-[500px] md:max-h-[560px]'
                : 'max-h-[440px] md:max-h-[500px]'
            }`}
            style={framing === 'full_body' ? undefined : WAIST_FADE_MASK_STYLE}
          />
        </div>
      ) : (
        /* Box frame fallback for legacy non-transparent photos */
        <div className="relative w-56 sm:w-64 md:w-72 aspect-[3/4] max-h-[480px] rounded-t-3xl overflow-hidden border-t-2 border-x-2 border-white/30 shadow-2xl bg-gradient-to-t from-black/80 via-transparent to-transparent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={characterName}
            className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
          />
        </div>
      )}
    </div>
  );
}

// Compact Scenario Avatar (Used in drawer list, headers, etc.)
export function ScenarioAvatar({
  expression = 'neutral',
  character = 'maya',
  customPhotoUrl,
  className = 'w-12 h-12',
  hideBadge = false,
}: {
  expression?: ScenarioExpression;
  character?: string;
  customPhotoUrl?: string;
  className?: string;
  hideBadge?: boolean;
}) {
  const photo = getCharacterPhoto(character, customPhotoUrl);

  return (
    <div className={`relative ${className} select-none flex-shrink-0`}>
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white shadow-md bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={character} className="w-full h-full object-cover" />
      </div>
      {!hideBadge && (
        <div className="absolute -bottom-1 -right-1 scale-75 origin-bottom-right">
          <ScenarioExpressionBadge expression={expression} />
        </div>
      )}
    </div>
  );
}
