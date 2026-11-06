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
import { WAIST_FADE_MASK_STYLE, removeBackgroundClient } from '@/lib/bg-removal';

interface CharacterSelectionResult {
  character: CharacterItem;
  pose: CharacterPose;
  poseUrl: string;
  name: string;
  role?: string;
}

interface CharacterPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: CharacterSelectionResult) => void;
  initialPose?: CharacterPose;
}

const POSE_METADATA: { id: CharacterPose; label: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'neutral', label: 'Neutral', desc: 'Arms crossed, relaxed stance', icon: User },
  { id: 'talking', label: 'Talking', desc: 'Active speaking & explaining', icon: MessageSquare },
  { id: 'happy', label: 'Happy', desc: 'Smiling, approving & encouraging', icon: Smile },
  { id: 'concerned', label: 'Concerned / Thinking', desc: 'Reflective, engaged consideration', icon: HelpCircle },
  { id: 'frustrated', label: 'Frustrated', desc: 'Disapproving, perplexed reaction', icon: Frown },
  { id: 'presenting', label: 'Presenting', desc: 'Pointing towards content stage', icon: Zap },
];

export default function CharacterPickerModal({
  isOpen,
  onClose,
  onSelect,
  initialPose = 'neutral',
}: CharacterPickerModalProps) {
  const [characters, setCharacters] = useState<CharacterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clothingFilter, setClothingFilter] = useState<CharacterClothing>('all');
  const [genderFilter, setGenderFilter] = useState<CharacterGender>('all');
  const [ageFilter, setAgeFilter] = useState<CharacterAgeGroup>('all');
  const [styleFilter, setStyleFilter] = useState<CharacterStyle>('all');

  // Step 2: Expression picker state
  const [selectedChar, setSelectedChar] = useState<CharacterItem | null>(null);
  const [activePose, setActivePose] = useState<CharacterPose>(initialPose);

  // AI Generator Panel state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiName, setAiName] = useState('');
  const [aiClothing, setAiClothing] = useState<CharacterClothing>('business_casual');
  const [aiGender, setAiGender] = useState<CharacterGender>('female');
  const [aiAge, setAiAge] = useState<CharacterAgeGroup>('20s_30s');
  const [aiEthnicity, setAiEthnicity] = useState('');
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
    const poseUrl = selectedChar.expressions?.[pose] || selectedChar.transparentPngUrl;
    onSelect({
      character: selectedChar,
      pose,
      poseUrl,
      name: selectedChar.name,
      role: selectedChar.role,
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
      // 1. Try client background removal or fallback to server
      const blob = await removeBackgroundClient(file, (p) => setUploadProgress(p));
      const cleanFile = new File([blob], `cutout-${Date.now()}.png`, { type: 'image/png' });

      // 2. Upload transparent PNG to server
      const formData = new FormData();
      formData.append('file', cleanFile);

      const res = await fetch('/api/characters/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const transparentUrl = data.url;

      // 3. Create character record
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
          ethnicity: aiEthnicity.trim() || 'Diverse',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center space-x-3">
            {selectedChar && (
              <button
                onClick={() => setSelectedChar(null)}
                className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors"
                title="Back to all characters"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                {selectedChar ? `Select Expression for ${selectedChar.name}` : 'Select Character'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold uppercase tracking-wider">
                  Transparent Cutouts
                </span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {selectedChar
                  ? 'Pick the posture and expression that best matches your scenario beat.'
                  : 'Transparent background cutouts that blend seamlessly onto any stage, photo, or card.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!selectedChar && (
              <>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 transition-colors shadow-sm disabled:opacity-50"
                  title="Upload photo from Mac and auto-strip to transparent PNG"
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

                <button
                  onClick={() => setShowAiGenerator((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>✨ Create Custom Cutout</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI GENERATOR DRAWER */}
        {showAiGenerator && !selectedChar && (
          <div className="px-6 py-4 bg-indigo-50/70 border-b border-indigo-100 flex flex-col gap-3 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-950">
                  ✨ AI Transparent Cutout Generator
                </h4>
                <span className="text-xs text-indigo-700">
                  Generates an isolated studio portrait and automatically strips the background into a transparent PNG.
                </span>
              </div>
              <button
                onClick={() => setShowAiGenerator(false)}
                className="text-xs text-indigo-700 hover:text-indigo-950 font-medium"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Character Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maya Lin, Marcus Vance"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Clothing</label>
                <select
                  value={aiClothing}
                  onChange={(e) => setAiClothing(e.target.value as CharacterClothing)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white"
                >
                  <option value="business_casual">Business Casual</option>
                  <option value="corporate">Corporate Suit</option>
                  <option value="medical">Medical / Scrubs</option>
                  <option value="industry">Industry / Safety Vest</option>
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
                <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Age</label>
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

              <div className="flex items-end">
                <button
                  onClick={handleGenerateAi}
                  disabled={isGenerating || !aiName.trim()}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Cutout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EXPRESSION & POSE PICKER */}
        {selectedChar ? (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
            {/* Spotlight of selected character */}
            <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl mb-8 p-6 bg-gradient-to-b from-zinc-50 to-zinc-100 rounded-2xl border border-zinc-200">
              <div className="w-48 h-56 relative flex items-end justify-center overflow-hidden rounded-xl bg-white/80 border border-zinc-200/80 shadow-inner">
                <img
                  src={selectedChar.expressions?.[activePose] || selectedChar.transparentPngUrl}
                  alt={selectedChar.name}
                  className="max-h-52 object-contain drop-shadow-md"
                  style={WAIST_FADE_MASK_STYLE}
                />
              </div>

              <div className="flex-1 text-center md:text-left">
                <span className="text-xs uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {selectedChar.clothing.replace('_', ' ')} • {selectedChar.gender}
                </span>
                <h3 className="text-2xl font-black text-zinc-900 mt-2">{selectedChar.name}</h3>
                <p className="text-sm text-zinc-600 mt-1">{selectedChar.role || 'Scenario Subject'}</p>
                {selectedChar.ethnicity && (
                  <p className="text-xs text-zinc-400 mt-0.5">{selectedChar.ethnicity}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="text-xs px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded">
                    Age: {selectedChar.ageGroup.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-zinc-200 text-zinc-700 rounded">
                    Style: {selectedChar.style}
                  </span>
                </div>
              </div>
            </div>

            {/* Expression Picker Grid */}
            <div className="w-full max-w-4xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                Choose Pose / Expression for this Scenario Beat:
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {POSE_METADATA.map((p) => {
                  const isCurrent = activePose === p.id;
                  const poseUrl = selectedChar.expressions?.[p.id] || selectedChar.transparentPngUrl;

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePose(p.id);
                        handleConfirmPose(p.id);
                      }}
                      className={`relative flex items-center p-3 rounded-xl border text-left transition-all group ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <div className="w-14 h-16 mr-3 flex-shrink-0 relative flex items-end justify-center rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden">
                        <img
                          src={poseUrl}
                          alt={p.label}
                          className="max-h-14 object-contain"
                          style={WAIST_FADE_MASK_STYLE}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                            {p.label}
                          </p>
                          {isCurrent && <Check className="w-4 h-4 text-indigo-600" />}
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
          /* STEP 1: BROWSE ALL CHARACTERS WITH FILTER SIDEBAR */
          <div className="flex flex-1 overflow-hidden">
            {/* Left Filter Sidebar */}
            <aside className="w-60 border-r border-zinc-200 bg-zinc-50/60 p-4 flex flex-col gap-5 overflow-y-auto shrink-0">
              {/* Search */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Search
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search name, role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Clothing Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Clothing
                </label>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Clothing' },
                    { id: 'business_casual', label: 'Business Casual' },
                    { id: 'casual', label: 'Casual' },
                    { id: 'corporate', label: 'Corporate' },
                    { id: 'industry', label: 'Industry & Safety' },
                    { id: 'medical', label: 'Medical & Scrubs' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setClothingFilter(item.id as CharacterClothing)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        clothingFilter === item.id
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-200/70'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'female', label: 'Female' },
                    { id: 'male', label: 'Male' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setGenderFilter(g.id as CharacterGender)}
                      className={`text-center py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        genderFilter === g.id
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age Group Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Age Group
                </label>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Ages' },
                    { id: '20s_30s', label: '20s - 30s' },
                    { id: '40s_50s', label: '40s - 50s' },
                    { id: '60s_plus', label: '60s+' },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAgeFilter(a.id as CharacterAgeGroup)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        ageFilter === a.id
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-200/70'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                  Style
                </label>
                <div className="space-y-1">
                  {[
                    { id: 'all', label: 'All Styles' },
                    { id: 'photographic', label: 'Photographic Cutout' },
                    { id: 'illustrated', label: 'Illustrated Vector' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyleFilter(s.id as CharacterStyle)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        styleFilter === s.id
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-200/70'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main 4-Column Character Grid */}
            <main className="flex-1 p-6 overflow-y-auto bg-zinc-100/40">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-zinc-500">
                  Showing <strong className="text-zinc-900">{filteredCharacters.length}</strong> transparent characters
                </span>

                {(clothingFilter !== 'all' || genderFilter !== 'all' || ageFilter !== 'all' || styleFilter !== 'all' || search) && (
                  <button
                    onClick={() => {
                      setClothingFilter('all');
                      setGenderFilter('all');
                      setAgeFilter('all');
                      setStyleFilter('all');
                      setSearch('');
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-2" />
                  <p className="text-xs">Loading transparent cutout library...</p>
                </div>
              ) : filteredCharacters.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-zinc-400 bg-white rounded-xl border border-dashed border-zinc-300 p-8">
                  <User className="w-10 h-10 text-zinc-300 mb-2" />
                  <p className="text-sm font-semibold text-zinc-700">No characters match your filters</p>
                  <p className="text-xs text-zinc-400 mt-1 mb-4 text-center">
                    Try broadening your search or click below to generate a custom character.
                  </p>
                  <button
                    onClick={() => setShowAiGenerator(true)}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700"
                  >
                    ✨ Create Custom Cutout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredCharacters.map((char) => (
                    <div
                      key={char.id}
                      onClick={() => handleSelectCharacter(char)}
                      className="group relative bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col items-center p-3 text-center min-h-[220px]"
                    >
                      {/* Character Transparent Cutout Image */}
                      <div className="w-full h-36 flex items-end justify-center relative pointer-events-none mb-2">
                        <img
                          src={char.transparentPngUrl}
                          alt={char.name}
                          className="max-h-36 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-200"
                          style={WAIST_FADE_MASK_STYLE}
                        />
                      </div>

                      {/* Character Details */}
                      <div className="w-full">
                        <p className="text-xs font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                          {char.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {char.role || char.clothing.replace('_', ' ')}
                        </p>
                      </div>

                      {/* Hover Scrim + Center [ SELECT ] Pill Button (Matching Articulate Rise exactly) */}
                      <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3 backdrop-blur-[0.5px]">
                        <span className="px-4 py-1.5 bg-white text-zinc-950 font-black text-xs tracking-wider uppercase rounded-full shadow-lg transform group-hover:scale-105 transition-transform">
                          SELECT
                        </span>
                      </div>
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
