'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { LearnByCraftMark } from '@/components/brand/LearnByCraftLogo';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Please enter the author passcode');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect author passcode');
        setLoading(false);
        return;
      }

      // Success - navigate to target
      router.push(from);
      router.refresh();
    } catch {
      setError('Failed to authenticate. Please check your network connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172B35] via-[#0E2028] to-[#0A171D] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Subtle Background Glows in Deep Teal & Craft Amber */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#115E59]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#F4B544]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-gray-100 p-8 sm:p-10 space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center flex flex-col items-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-teal-50/80 border border-teal-100 flex items-center justify-center shadow-xs mb-2">
            <LearnByCraftMark className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-[#172B35] tracking-tight">
            Learn<span className="text-[#115E59]">By</span>Craft
          </h1>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-[#115E59] text-[10px] font-bold tracking-widest uppercase">
            Authoring Tool
          </div>
          <p className="text-xs text-gray-500 font-medium pt-1">
            Thoughtfully built. Human by design.
          </p>
        </div>

        {/* Protection Notice */}
        <div className="bg-[#FAF7F0] border border-[#DCE8DF] rounded-2xl p-4 text-xs text-gray-700 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#115E59] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-[#172B35] block">Author Access Gate</span>
            <p className="text-[11px] leading-relaxed text-gray-600">
              Enter your author passcode to access your courses, block studio, and workspace settings.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2 animate-shake">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase">
              Author Passcode
            </label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (default: lxd2026)"
                autoFocus
                className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#115E59] focus:border-transparent text-sm bg-white font-mono text-gray-900 placeholder:font-sans placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                title={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-[#115E59] hover:bg-[#0D4C47] transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Unlocking Studio...</span>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Unlock Authoring Studio</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Reviewer Note */}
        <div className="pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Are you a Peer Reviewer or SME?</strong>
            <br />
            Review links (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-700">/review/[id]</code>) do not require a passcode. Ask your instructional designer for their shareable review link.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginForm />
    </Suspense>
  );
}
