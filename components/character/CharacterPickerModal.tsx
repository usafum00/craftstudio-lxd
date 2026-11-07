'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Search,
  Sparkles,
  Upload,
  ChevronLeft,
  Loader2,
  Check,
  User,
  Smile,
  MessageSquare,
  HelpCircle,
  Frown,
  Zap,
} from 'lucide-react';
import {
  CharacterItem,
  CharacterClothing,
  CharacterGender,
  CharacterAgeGroup,
  CharacterStyle,
  CharacterPose,
} from '@/lib/types';
import { removeBackgroundClient } from '@/lib/bg-removal';

export interface CharacterSelectionResult {
  character: CharacterItem;
  pose: CharacterPose;
  poseUrl: string;
  name: string;
  role?: string;
  framing?: 'half_body' | 'full_body';
  expressions?: Record<string, string>;
}

interface CharacterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: CharacterSelectionResult) => void;
  initialPose?: CharacterPose;
  initialFraming?: 'half_body' | 'full_body';
}

const POSE_METADATA: {
  id: CharacterPose;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'neutral', label: 'Neutral', desc: 'Calm, relaxed stance', icon: User },
  { id: 'talking', label: 'Talking', desc: 'Active speaking & explaining', icon: MessageSquare },
  { id: 'happy', label: 'Happy', desc: 'Warm genuine smile, approving', icon: Smile },
  { id: 'concerned', label: 'Worried / Concerned', desc: 'Furrowed brow, serious look', icon: HelpCircle },
  { id: 'frustrated', label: 'Frustrated / Disappointed', desc: 'Frowning, displeased reaction', icon: Frown },
  { id: 'confused', label: 'Confused / Thinking', desc: 'Tilted head, puzzled consideration', icon: HelpCircle },
];

export default function CharacterPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialPose = 'neutral',
  initialFraming = 'half_body',
}: CharacterPickerModalProps) {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clothingFilter, setClothingFilter] = useState<CharacterClothing>('all');
  const [genderFilter, setGenderFilter] = useState<CharacterGender>('all');
  const [ageFilter, setAgeFilter] = useState<CharacterAgeGroup>('all');
  const [styleFilter, setStyleFilter] = useState<CharacterStyle>('all');
  const [cropFilter, setCropFilter] = useState<'all' | 'half_body' | 'full_body'>('all');

  // Step 2: Expression picker state & Framing
  const [selectedChar, setSelectedChar] = useState<CharacterItem | null>(null);
  const [activePose, setActivePose] = useState<CharacterPose>(initialPose);
  const [selectedFraming, setSelectedFraming] = useState<'half_body' | 'full_body'>(initialFraming);

  // AI Generator Panel state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiName, setAiName] = useState('');
  const [aiClothing, setAiClothing] = useState<CharacterClothing>('business_casual');
  const [aiGender, setAiGender] = useState<CharacterGender>('female');
  const [aiAge, setAiAge] = useState<CharacterAgeGroup>('20s_30s');
  const [aiRole, setAiRole] = useState('');

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load characters on open
  useEffect(() => {
    if (isOpen) {
      fetchCharacters();
      setSelectedChar(null);
      setActivePose(initialPose);
      setShowAiGenerator(false);
    }
  }, [isOpen, initialPose]);

  const fetchCharacters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/characters');
      if (res.ok) {
        const data = await res.json();
        setCharacters(data.characters || []);
      }
    } catch (err) {
      console.error('Failed to load characters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCharacters = useMemo(() => {
    return characters.filter((c) => {
      if (clothingFilter !== 'all' && c.clothing !== clothingFilter) return false;
      if (genderFilter !== 'all' && c.gender !== genderFilter) return false;
      if (ageFilter !== 'all' && c.ageGroup !== ageFilter) return false;
      if (styleFilter !== 'all' && c.style !== styleFilter) return false;
      if (search.trim()) {
        const term = search.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(term);
        const matchesRole = (c.role || '').toLowerCase().includes(term);
        const matchesEthnicity = (c.ethnicity || '').toLowerCase().includes(term);
        if (!matchesName && !matchesRole && !matchesEthnicity) return false;
      }
      return true;
    });
  }, [characters, clothingFilter, genderFilter, ageFilter, styleFilter, search]);

  const handleSelectCharacter = (char: CharacterItem) => {
    setSelectedChar(char);
  };

  const handleConfirmPose = (pose: CharacterPose) => {
    if (!selectedChar) return;
    let poseUrl = selectedChar.expressions?.[pose] || selectedChar.transparentPngUrl;
    if (selectedFraming === 'full_body') {
      if (poseUrl.includes('-half.png')) poseUrl = poseUrl.replace('-half.png', '-full.png');
      else if (poseUrl.includes('.png') && !poseUrl.includes('-full.png')) poseUrl = poseUrl.replace('.png', '-full.png');
    } else {
      if (poseUrl.includes('-full.png')) poseUrl = poseUrl.replace('-full.png', '-half.png').replace('-half.png', '.png');
    }

    // Resolve expressions dictionary with matching framing
    const resolvedExpressions: Record<string, string> = {};
    if (selectedChar.expressions) {
      for (const [k, v] of Object.entries(selectedChar.expressions)) {
        let u = v;
        if (selectedFraming === 'full_body') {
          if (u.includes('-half.png')) u = u.replace('-half.png', '-full.png');
          else if (u.includes('.png') && !u.includes('-full.png')) u = u.replace('.png', '-full.png');
        } else {
          if (u.includes('-full.png')) u = u.replace('-full.png', '-half.png').replace('-half.png', '.png');
        }
        resolvedExpressions[k] = u;
      }
    }

    onSelect({
      character: selectedChar,
      pose,
      poseUrl,
      name: selectedChar.name,
      role: selectedChar.role,
      framing: selectedFraming,
      expressions: resolvedExpressions,
    });
    onClose();
  };

  // Upload handler with automatic background removal
  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const blob = await removeBackgroundClient(file, (p) => setUploadProgress(p));
      const cleanFile = new File([blob], `cutout-${Date.now()}.png`, { type: 'image/png' });

      const formData = new FormData();
      formData.append('file', cleanFile);

      const res = await fetch('/api/characters/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const transparentUrl = data.url;

      const charName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') || 'Custom Character';
      const createRes = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: charName,
          gender: 'female',
          clothing: 'business_casual',
          ageGroup: '20s_30s',
          style: 'photographic',
          crop: 'half_body',
          transparentPngUrl: transparentUrl,
        }),
      });

      if (createRes.ok) {
        const createdData = await createRes.json();
        setCharacters((prev) => [createdData.character, ...prev]);
        setSelectedChar(createdData.character);
      }
    } catch (err) {
      console.error('Failed to upload and remove background:', err);
      alert('Could not remove background automatically. Please ensure the image is accessible.');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // AI Cutout Generator handler
  const handleGenerateAi = async () => {
    if (!aiName.trim()) {
      alert('Please enter a character name');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/characters/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: aiName.trim(),
          clothing: aiClothing === 'all' ? 'business_casual' : aiClothing,
          gender: aiGender === 'all' ? 'female' : aiGender,
          ageGroup: aiAge === 'all' ? '20s_30s' : aiAge,
          ethnicity: 'Diverse',
          role: aiRole.trim() || 'Professional Specialist',
          style: 'photographic',
          crop: 'half_body',
        }),
      });

      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.character) {
        setCharacters((prev) => [data.character, ...prev]);
        setSelectedChar(data.character);
        setShowAiGenerator(false);
        setAiName('');
        setAiRole('');
      }
    } catch (err) {
      console.error('Failed to generate AI cutout:', err);
      alert('AI cutout generation encountered an issue. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const hasActiveFilters =
    clothingFilter !== 'all' || genderFilter !== 'all' || ageFilter !== 'all' || styleFilter !== 'all' || search.trim() !== '';

  const clearAllFilters = () => {
    setClothingFilter('all');
    setGenderFilter('all');
    setAgeFilter('all');
    setStyleFilter('all');
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-zinc-200">
        {/* Top Header: Articulate Rise Exact Specification */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            {selectedChar && (
              <button
                onClick={() => setSelectedChar(null)}
                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-600 transition-colors"
                title="Back to all characters"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900">
                {selectedChar ? `Select Expression • ${selectedChar.name}` : 'SELECT CHARACTER'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!selectedChar && (
              <>
                {/* Search Bar */}
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search character..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white placeholder-zinc-400"
                  />
                </div>

                {/* Upload Photo Button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleUploadPhoto}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  title="Upload photo and auto-strip background"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                      <span>Stripping BG ({uploadProgress || 0}%)...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Upload & Strip BG</span>
                    </>
                  )}
                </button>

                {/* Visible, High-Contrast Sparkle Button */}
                <button
                  type="button"
                  onClick={() => setShowAiGenerator((prev) => !prev)}
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-white font-semibold">✨ Generate Photo Cutout</span>
                </button>
              </>
            )}

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI GENERATOR DRAWER */}
        {showAiGenerator && !selectedChar && (
          <div className="px-6 py-4 bg-indigo-50/80 border-b border-indigo-100 flex flex-col gap-3 animate-in slide-in-from-top-3 duration-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                  AI Photographic Cutout Studio
                </h4>
                <span className="text-xs text-indigo-700 font-normal">
                  — Generates a photorealistic studio portrait and isolates subject to transparent PNG.
                </span>
              </div>
              <button
                onClick={() => setShowAiGenerator(false)}
                className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maya Lin, Craig Thompson"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Attire / Sector</label>
                <select
                  value={aiClothing}
                  onChange={(e) => setAiClothing(e.target.value as CharacterClothing)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="business_casual">Business Casual</option>
                  <option value="corporate">Corporate (Suits/Blazers)</option>
                  <option value="industry">Industry (Hard Hat / Vest)</option>
                  <option value="medical">Medical (Scrubs / Lab Coat)</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Gender</label>
                <select
                  value={aiGender}
                  onChange={(e) => setAiGender(e.target.value as CharacterGender)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Age Bracket</label>
                <select
                  value={aiAge}
                  onChange={(e) => setAiAge(e.target.value as CharacterAgeGroup)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="20s_30s">20s - 30s</option>
                  <option value="40s_50s">40s - 50s</option>
                  <option value="60s_plus">60s+</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-1">
              <button
                onClick={handleGenerateAi}
                disabled={isGenerating || !aiName.trim()}
                className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating Photorealistic Cutout...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generate & Add to Library</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EXPRESSION & POSE PICKER */}
        {selectedChar ? (
          <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center bg-white">
            <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-3xl mb-8 p-6 bg-zinc-50 rounded-2xl border border-zinc-200">
              <div className="w-48 h-60 relative flex items-end justify-center overflow-hidden">
                <img
                  src={(() => {
                    let u = selectedChar.expressions?.[activePose] || selectedChar.transparentPngUrl;
                    if (selectedFraming === 'full_body') {
                      if (u.includes('-half.png')) u = u.replace('-half.png', '-full.png');
                      else if (u.includes('.png') && !u.includes('-full.png')) u = u.replace('.png', '-full.png');
                    } else {
                      if (u.includes('-full.png')) u = u.replace('-full.png', '-half.png').replace('-half.png', '.png');
                    }
                    return u;
                  })()}
                  alt={selectedChar.name}
                  className="max-h-60 object-contain object-bottom drop-shadow-md"
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-bold text-zinc-500">
                  {selectedChar.clothing.replace('_', ' ')} • {selectedChar.gender}
                </span>
                <h3 className="text-2xl font-bold text-zinc-900 mt-1">{selectedChar.name}</h3>
                <p className="text-sm text-zinc-600 mt-0.5">{selectedChar.role || 'Scenario Subject'}</p>
                {selectedChar.ethnicity && (
                  <p className="text-xs text-zinc-400 mt-0.5">{selectedChar.ethnicity}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="text-xs px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 rounded-md font-medium">
                    Age: {selectedChar.ageGroup.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-white border border-zinc-200 text-zinc-700 rounded-md font-medium">
                    Style: Photographic
                  </span>
                </div>

                {/* Body Framing Switch */}
                <div className="mt-4 flex items-center gap-3 justify-center md:justify-start">
                  <span className="text-xs font-bold text-zinc-700">Framing:</span>
                  <div className="flex rounded-lg border border-zinc-200 p-0.5 bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setSelectedFraming('half_body')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                        selectedFraming === 'half_body'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Half-Body (Waist-Up)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedFraming('full_body')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                        selectedFraming === 'full_body'
                          ? 'bg-zinc-900 text-white shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Full-Body Standing
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expression Picker Grid */}
            <div className="w-full max-w-4xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
                Choose Pose / Expression for this Scenario Beat:
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {POSE_METADATA.map((p) => {
                  const isCurrent = activePose === p.id;
                  let poseUrl = selectedChar.expressions?.[p.id] || selectedChar.transparentPngUrl;
                  if (selectedFraming === 'full_body') {
                    if (poseUrl.includes('-half.png')) poseUrl = poseUrl.replace('-half.png', '-full.png');
                    else if (poseUrl.includes('.png') && !poseUrl.includes('-full.png')) poseUrl = poseUrl.replace('.png', '-full.png');
                  } else {
                    if (poseUrl.includes('-full.png')) poseUrl = poseUrl.replace('-full.png', '-half.png').replace('-half.png', '.png');
                  }

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePose(p.id);
                        handleConfirmPose(p.id);
                      }}
                      className={`relative flex items-center p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                        isCurrent
                          ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="w-14 h-16 mr-3 flex-shrink-0 relative flex items-end justify-center overflow-hidden">
                        <img
                          src={poseUrl}
                          alt={p.label}
                          className="max-h-16 object-contain object-bottom"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                            {p.label}
                          </p>
                          {isCurrent && <Check className="w-4 h-4 text-zinc-900 stroke-[2.5]" />}
                        </div>
                        <p className="text-[11px] text-zinc-500 line-clamp-1">{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 1: BROWSE ALL CHARACTERS WITH ARTICULATE RISE BORDERLESS GRID & CLEAN CHECKMARK SIDEBAR */
          <div className="flex flex-1 overflow-hidden">
            {/* Left Filter Sidebar: Rise Exact Vertical Filter List with Checkmarks */}
            <aside className="w-52 border-r border-zinc-200 bg-white p-5 flex flex-col gap-6 overflow-y-auto shrink-0 select-none">
              {/* Category 1: Clothing */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 mb-2">Clothing</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'All Clothing' },
                    { id: 'business_casual', label: 'Business Casual' },
                    { id: 'casual', label: 'Casual' },
                    { id: 'corporate', label: 'Corporate' },
                    { id: 'industry', label: 'Industry' },
                    { id: 'medical', label: 'Medical' },
                  ].map((item) => {
                    const isSelected = clothingFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setClothingFilter(item.id as CharacterClothing)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 2: Gender */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 mb-2">Gender</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'female', label: 'Female' },
                    { id: 'male', label: 'Male' },
                  ].map((g) => {
                    const isSelected = genderFilter === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenderFilter(g.id as CharacterGender)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <span>{g.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 3: Age */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 mb-2">Age</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'All Ages' },
                    { id: '20s_30s', label: '20s - 30s' },
                    { id: '40s_50s', label: '40s - 50s' },
                    { id: '60s_plus', label: '60s+' },
                  ].map((a) => {
                    const isSelected = ageFilter === a.id;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAgeFilter(a.id as CharacterAgeGroup)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <span>{a.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category 4: Framing */}
              <div>
                <h3 className="text-xs font-bold text-zinc-900 mb-2">Framing</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'All Framing' },
                    { id: 'half_body', label: 'Half-Body (Waist-Up)' },
                    { id: 'full_body', label: 'Full-Body Standing' },
                  ].map((item) => {
                    const isSelected = cropFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCropFilter(item.id as any)}
                        className={`w-full text-left py-1.5 px-2.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {hasActiveFilters && (
                <div className="pt-2 border-t border-zinc-100">
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 font-medium cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </aside>

            {/* Main Character Grid: Articulate Rise Exact Borderless Grid & Hover State */}
            <main className="flex-1 p-8 overflow-y-auto bg-white">
              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-2" />
                  <p className="text-xs">Loading photographic character library...</p>
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 p-8 text-center">
                  <User className="w-10 h-10 text-zinc-300 mb-2" />
                  <p className="text-sm font-semibold text-zinc-700">No characters match your filters</p>
                  <p className="text-xs text-zinc-400 mt-1 mb-4">
                    Try selecting different clothing or age categories, or generate a custom cutout.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-zinc-100 text-zinc-800 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-10">
                  {filteredCharacters.map((char) => (
                    <div
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="group relative flex flex-col items-center cursor-pointer select-none"
                    >
                      {/* Character Image Stage with Hover Scrim (Zero black borders) */}
                      <div className="w-full aspect-[4/5] max-h-52 relative rounded-xl overflow-hidden flex items-end justify-center transition-all">
                        {/* Real Photographic Human Cutout */}
                        <img
                          src={char.transparentPngUrl}
                          alt={char.name}
                          className="w-full h-full object-contain object-bottom drop-shadow-xs group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Articulate Rise Hover Overlay (Only visible on hover with centered pill button) */}
                        <div className="character-select-scrim absolute inset-0 bg-zinc-800/60 backdrop-blur-[1px] flex items-center justify-center p-4">
                          <span className="border-2 border-white text-white bg-zinc-900/60 backdrop-blur-sm px-6 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase shadow-md transform group-hover:scale-105 transition-transform">
                            SELECT
                          </span>
                        </div>
                      </div>

                      {/* Centered Name Below (Matching Rise's 15px font) */}
                      <p className="mt-3 text-[15px] font-medium text-zinc-800 text-center tracking-tight group-hover:text-zinc-950 transition-colors">
                        {char.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
