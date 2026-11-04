'use client';

import React, { useState } from 'react';
import { Block } from '@/lib/types';
import {
  Sliders,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  RotateCw,
  BookOpen,
  Compass,
  CheckCircle2,
  Award,
} from 'lucide-react';

interface SimulationLabBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
  onComplete?: () => void;
}

export function SimulationLabBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
  onComplete,
}: SimulationLabBlockProps) {
  const content = block.content || {};

  // Content Configuration (Authorable)
  const title = (content.title as string) || 'Interactive Simulation Lab: Margin Shield & Concession Trade';
  const subtitle = (content.subtitle as string) || 'Tell–Show–Do Multi-Turn KPI Negotiation Simulation';
  
  // Guided concept text (Tell)
  const conceptBrief = (content.conceptBrief as string) || 
    'A 10% discount does not mean a 10% profit reduction. Because fixed product costs remain static, unbudgeted price concessions can wipe out over 50% of your gross margin dollars.';
  
  // Guided example (Show)
  const guidedExample = (content.guidedExample as {
    scenario: string;
    listPrice: number;
    unitCost: number;
    discountPercent: number;
    impactExplanation: string;
  }) || {
    scenario: 'Enterprise SaaS Deal: 500 Seats with a 15% end-of-quarter discount request',
    listPrice: 50000,
    unitCost: 30000,
    discountPercent: 15,
    impactExplanation: 'At $50k list with $30k cost, base profit is $20k (40% margin). Granting 15% ($7.5k discount) reduces profit to $12.5k — an instant 37.5% collapse in gross profit dollars!',
  };

  // Interactive Parameters (Do)
  const defaultBaseValue = typeof content.baseValue === 'number' ? content.baseValue : 50000;
  const defaultTargetMargin = typeof content.targetMargin === 'number' ? content.targetMargin : 40;
  const defaultDiscount = typeof content.discountRate === 'number' ? content.discountRate : 12;
  const defaultVolumeTier = typeof content.volumeTier === 'number' ? content.volumeTier : 2;

  // Local interactive state for learner exploration
  const [activeTab, setActiveTab] = useState<'tell' | 'show' | 'do'>('tell');
  const [baseValue, setBaseValue] = useState<number>(defaultBaseValue);
  const [targetMargin, setTargetMargin] = useState<number>(defaultTargetMargin);
  const [discountRate, setDiscountRate] = useState<number>(defaultDiscount);
  const [volumeTier, setVolumeTier] = useState<number>(defaultVolumeTier);
  const [tradedConcession, setTradedConcession] = useState<boolean>(false);
  const [hasSimulated, setHasSimulated] = useState<boolean>(false);

  // Instant KPI Calculations
  const calculatedCost = baseValue * (1 - targetMargin / 100);
  const actualSellingPrice = baseValue * (1 - discountRate / 100);
  const netProfitDollars = actualSellingPrice - calculatedCost;
  const realizedMarginPercent = actualSellingPrice > 0 ? (netProfitDollars / actualSellingPrice) * 100 : 0;
  
  // Concession Bonus
  const finalRealizedMargin = tradedConcession ? realizedMarginPercent + 3.5 : realizedMarginPercent;
  const dealScore = Math.min(100, Math.max(0, Math.round(
    (finalRealizedMargin / targetMargin) * 70 + (tradedConcession ? 20 : 0) + (volumeTier * 5)
  )));

  const isHealthyDeal = dealScore >= 75;
  const isBreached = finalRealizedMargin < 15;

  const handleSimulate = () => {
    setHasSimulated(true);
    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    setBaseValue(defaultBaseValue);
    setTargetMargin(defaultTargetMargin);
    setDiscountRate(defaultDiscount);
    setVolumeTier(defaultVolumeTier);
    setTradedConcession(false);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 text-white rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Sliders className="w-4 h-4" />
            <span>Simulation Lab (Tell–Show–Do)</span>
          </div>
          <h3 className="text-xl font-extrabold text-white mt-1">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* 3 Pedagogical Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('tell')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'tell'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. Tell (Concept)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('show')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'show'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>2. Show (Worked)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('do')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'do'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3. Do (Interactive)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TELL (Concept Brief) */}
      {activeTab === 'tell' && (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>Core Instructional Principle</span>
          </div>
          <div
            contentEditable={!isLearnerMode}
            suppressContentEditableWarning
            onBlur={(e) => onChange({ ...content, conceptBrief: e.currentTarget.innerText })}
            className="text-sm sm:text-base text-slate-200 leading-relaxed outline-none focus:ring-1 focus:ring-amber-500 rounded p-1"
          >
            {conceptBrief}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">List Price Principle</div>
              <div className="text-lg font-black text-white mt-1">100% Revenue</div>
              <div className="text-xs text-slate-500 mt-1">Discounts come directly out of profit, not raw operating costs.</div>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Cost Base Anchor</div>
              <div className="text-lg font-black text-rose-400 mt-1">Static Baseline</div>
              <div className="text-xs text-slate-500 mt-1">Production and delivery cost never shrink when discounting.</div>
            </div>
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Concession Trade</div>
              <div className="text-lg font-black text-emerald-400 mt-1">Non-Zero-Sum</div>
              <div className="text-xs text-slate-500 mt-1">Never give price without capturing contract terms or prepayments.</div>
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab('show')}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
            >
              Continue to Worked Example &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SHOW (Worked Example) */}
      {activeTab === 'show' && (
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-6 space-y-5 animate-in fade-in">
          <div>
            <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">Guided Walkthrough</div>
            <h4 className="text-base font-bold text-white mt-0.5">{guidedExample.scenario}</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">List Contract</div>
              <div className="text-base font-black text-white">${guidedExample.listPrice.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Unit Cost Floor</div>
              <div className="text-base font-black text-slate-300">${guidedExample.unitCost.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Requested Discount</div>
              <div className="text-base font-black text-rose-400">{guidedExample.discountPercent}%</div>
            </div>
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Base Profit Dollars</div>
              <div className="text-base font-black text-emerald-400">
                ${(guidedExample.listPrice - guidedExample.unitCost).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm leading-relaxed">
            {guidedExample.impactExplanation}
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              type="button"
              onClick={() => setActiveTab('tell')}
              className="text-xs text-slate-400 hover:text-white"
            >
              &larr; Back to Concept
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('do')}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
            >
              Open Interactive Simulator &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: DO (Interactive Simulator) */}
      {activeTab === 'do' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/80 p-6 rounded-2xl border border-slate-800">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">Base Deal Value</span>
                  <span className="font-mono text-amber-400 font-bold">${baseValue.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={200000}
                  step={5000}
                  value={baseValue}
                  onChange={(e) => setBaseValue(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">Target Gross Margin</span>
                  <span className="font-mono text-sky-400 font-bold">{targetMargin}%</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={70}
                  step={1}
                  value={targetMargin}
                  onChange={(e) => setTargetMargin(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">Discount Concession</span>
                  <span className={`font-mono font-bold ${discountRate > 20 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {discountRate}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  step={1}
                  value={discountRate}
                  onChange={(e) => setDiscountRate(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-300">Volume Commitment Tier</span>
                  <span className="font-mono text-emerald-400 font-bold">Tier {volumeTier}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[1, 2, 3].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setVolumeTier(t)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        volumeTier === t
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      Tier {t} ({t === 1 ? '100' : t === 2 ? '500' : '1k+'} seats)
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={tradedConcession}
                    onChange={(e) => setTradedConcession(e.target.checked)}
                    className="mt-0.5 rounded accent-amber-500"
                  />
                  <div className="text-xs">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Trade High-Value Non-Price Concession</span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Customer grants annual prepayment, 3-year term, or co-marketing case study (+3.5% margin yield).
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={handleSimulate}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Execute Simulation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live KPI Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Selling Price</div>
              <div className="text-xl font-black text-white mt-1">${Math.round(actualSellingPrice).toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Post-discount revenue</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Profit Yield</div>
              <div className={`text-xl font-black mt-1 ${netProfitDollars < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                ${Math.round(netProfitDollars).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Gross profit dollars</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Realized Margin</div>
              <div className={`text-xl font-black mt-1 ${isBreached ? 'text-rose-400' : 'text-amber-400'}`}>
                {finalRealizedMargin.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">vs. {targetMargin}% target</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deal Score</div>
              <div className={`text-xl font-black mt-1 ${isHealthyDeal ? 'text-emerald-400' : 'text-amber-400'}`}>
                {dealScore} / 100
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{isHealthyDeal ? 'Approved by Desk' : 'Review Required'}</div>
            </div>
          </div>

          {/* Feedback Banner */}
          {hasSimulated && (
            <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 animate-in fade-in ${
              isHealthyDeal
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
            }`}>
              {isHealthyDeal ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <strong>{isHealthyDeal ? 'Deal Approved:' : 'Sub-Optimal Structure:'}</strong>{' '}
                {isHealthyDeal
                  ? 'Your concession trading protected the deal margin dollars while securing volume commitment.'
                  : 'Discount exceeded margin guardrails without capturing enough non-price value from the buyer.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
