'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  RotateCcw,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Coins,
} from 'lucide-react';

interface CreditLog {
  id: string;
  action: string;
  creditsCost: number;
  modelUsed: string;
  details?: string;
  createdAt: string;
}

interface WorkspaceCredits {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  planTier: string;
}

interface AICreditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsUpdated?: (credits: WorkspaceCredits) => void;
}

export function AICreditHistoryModal({
  isOpen,
  onClose,
  onCreditsUpdated,
}: AICreditHistoryModalProps) {
  const [credits, setCredits] = useState<WorkspaceCredits | null>(null);
  const [logs, setLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchCredits = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/ai/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setLogs(data.logs || []);
        if (onCreditsUpdated) onCreditsUpdated(data.credits);
      }
    } catch (err) {
      console.error('Failed to load credits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCredits();
    }
  }, [isOpen]);

  const handleTopUp = async (amount = 10000) => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/v1/ai/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'topup', amount }),
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setLogs(data.logs || []);
        setMessage(`Successfully topped up ${amount.toLocaleString()} credits!`);
        window.dispatchEvent(new Event('ai_credits_updated'));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage('Failed to top up credits');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      setActionLoading(true);
      const res = await fetch('/api/v1/ai/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
        setLogs(data.logs || []);
        setMessage('Credits reset to 25,000!');
        window.dispatchEvent(new Event('ai_credits_updated'));
        setTimeout(() => setMessage(null), 3000);
      }
    } catch {
      setMessage('Failed to reset credits');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const total = credits?.totalCredits || 25000;
  const remaining = credits?.remainingCredits ?? 25000;
  const used = credits?.usedCredits || 0;
  const percentUsed = Math.min(100, Math.round((used / total) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div
          style={{ backgroundColor: '#09090b', color: '#ffffff' }}
          className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 text-white"
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
              className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white">AI Studio Credits & Multi-Tenant Engine</h2>
              <p className="text-[11px] text-zinc-400">Plan: <span className="font-semibold text-indigo-400">PRO_STUDIO</span> • Gemini 2.5/3.0 Powered</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {message && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Balance card */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Available AI Balance</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-zinc-900 tracking-tight">
                    {remaining.toLocaleString()}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">/ {total.toLocaleString()} credits</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded-full">
                  {percentUsed}% Used
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            {/* Top-up buttons */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => handleTopUp(10000)}
                disabled={actionLoading}
                style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                className="flex-1 btn-primary-indigo hover:opacity-95 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <PlusCircle className="w-3.5 h-3.5 text-white" />}
                <span className="text-white">+ Top Up 10,000 Credits</span>
              </button>
              <button
                onClick={handleReset}
                disabled={actionLoading}
                className="bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 text-xs font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                title="Reset balance to full 25,000 for testing"
              >
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                <span>Reset (25k)</span>
              </button>
            </div>
          </div>

          {/* Cost Schedule */}
          <div>
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5 text-[#115E59]" />
              <span>Credit Cost Schedule</span>
            </h3>
            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div className="font-bold text-zinc-800">✨ Block Transform</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Rewrite / Convert Block</div>
                <div className="mt-2 text-xs font-extrabold text-[#115E59]">25 credits</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div className="font-bold text-zinc-800">❓ Quiz Generator</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">Knowledge Check with Rationale</div>
                <div className="mt-2 text-xs font-extrabold text-[#115E59]">50 credits</div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80">
                <div className="font-bold text-zinc-800">🚀 Full Course AI</div>
                <div className="text-[11px] text-zinc-500 mt-0.5">SOP to Multi-Lesson Build</div>
                <div className="mt-2 text-xs font-extrabold text-[#115E59]">250 credits</div>
              </div>
            </div>
          </div>

          {/* Usage History */}
          <div>
            <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" />
              <span>Recent Credit Activity</span>
            </h3>
            {loading ? (
              <div className="py-8 flex items-center justify-center text-zinc-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-xs">Loading ledger...</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-6 text-center text-zinc-400 text-xs bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                No credits consumed yet. Use the Magic LXD Transformer or AI Course Architect to begin!
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-50 transition-colors">
                    <div>
                      <div className="font-bold text-zinc-800">{log.action}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                        <span>{log.modelUsed}</span>
                        {log.details && <span>• {log.details}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${log.creditsCost > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {log.creditsCost > 0 ? `-${log.creditsCost}` : `+${Math.abs(log.creditsCost)}`} credits
                      </span>
                      <div className="text-[10px] text-zinc-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500">
            Powered by Google Gemini & LearnByCraft LXD Framework
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-200 hover:bg-zinc-300 text-zinc-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
