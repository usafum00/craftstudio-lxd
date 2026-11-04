'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderClosed,
  Settings,
  HelpCircle,
  Sparkles,
  PanelLeftClose,
  Lock,
  Unlock,
  RotateCcw,
  Check,
  ShieldAlert,
  Coins,
} from 'lucide-react';
import { LearnByCraftLogo, LearnByCraftMark } from '@/components/brand/LearnByCraftLogo';
import { AICreditHistoryModal } from '@/components/dashboard/AICreditHistoryModal';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  // Admin lock modal & state
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // AI Credits state & modal
  const [credits, setCredits] = useState<{ totalCredits: number; usedCredits: number; remainingCredits: number } | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);

  const loadCredits = async () => {
    try {
      const res = await fetch('/api/v1/ai/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data.credits);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadCredits();
    const handleCreditsUpdate = () => loadCredits();
    window.addEventListener('ai_credits_updated', handleCreditsUpdate);
    return () => window.removeEventListener('ai_credits_updated', handleCreditsUpdate);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lxd_admin_unlocked');
      if (stored === 'true') {
        setIsAdmin(true);
      }
    }
  }, []);

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === 'lxd2026') {
      setIsAdmin(true);
      localStorage.setItem('lxd_admin_unlocked', 'true');
      setShowAdminModal(false);
      setPinInput('');
      setPinError(false);
      // Dispatch custom event so settings & courses update instantly
      window.dispatchEvent(new Event('admin_status_changed'));
    } else {
      setPinError(true);
    }
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    localStorage.removeItem('lxd_admin_unlocked');
    setShowAdminModal(false);
    window.dispatchEvent(new Event('admin_status_changed'));
  };

  const handleResetDemoCourses = async () => {
    if (!confirm('Restore all master showcase courses (Social Engineering, Conflict Resolution, etc.) to their pristine state?')) {
      return;
    }
    try {
      setResettingDemo(true);
      const res = await fetch('/api/courses/reset-sample', {
        method: 'POST',
        headers: {
          'x-admin-pin': 'lxd2026',
        },
      });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => {
          setResetSuccess(false);
          setShowAdminModal(false);
          window.location.reload();
        }, 1200);
      } else {
        alert('Failed to reset demo courses.');
      }
    } catch (err) {
      console.error(err);
      alert('Error resetting demo courses');
    } finally {
      setResettingDemo(false);
    }
  };

  const navItems = [
    { label: 'Courses', href: '/', icon: FolderClosed, active: pathname === '/' || pathname.startsWith('/courses') },
    { label: 'Block Templates', href: '/block-templates', icon: LayoutDashboard, active: pathname.startsWith('/block-templates') },
    { label: 'Question Banks', href: '/question-banks', icon: HelpCircle, active: pathname.startsWith('/question-banks') },
    { label: 'Media Vault', href: '/media-studio', icon: Sparkles, active: pathname.startsWith('/media-studio') },
    { label: 'Studio Settings & API', href: '/settings', icon: Settings, active: pathname.startsWith('/settings') },
  ];

  return (
    <aside
      className={`bg-white text-zinc-800 border-r border-zinc-200 flex flex-col justify-between transition-all duration-200 select-none ${
        collapsed ? 'w-16' : 'w-64'
      } h-screen sticky top-0 flex-shrink-0 z-40`}
    >
      {/* Top Header */}
      <div>
        <div className="h-14 px-4 flex items-center justify-between border-b border-zinc-200 bg-white">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
            {collapsed ? (
              <div className="p-1 rounded-xl bg-indigo-50 border border-indigo-100 hover:border-indigo-400 transition-colors" title="LearnByCraft Authoring Tool">
                <LearnByCraftMark className="w-6 h-6" theme="light" />
              </div>
            ) : (
              <LearnByCraftLogo size="md" theme="light" subtitle="AUTHORING TOOL" />
            )}
          </Link>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Toggle sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600 shadow-xs pl-2.5'
                    : 'text-zinc-800 hover:text-indigo-600 hover:bg-zinc-50 font-medium'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-600' : 'text-zinc-500 group-hover:text-indigo-600'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-zinc-200 space-y-3 bg-white">
        {/* AI Studio Credits Card */}
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-zinc-800 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Studio Credits</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCreditsModal(true)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                Top Up
              </button>
            </div>
            <div className="flex items-baseline justify-between text-[10px] text-zinc-600 mb-1">
              <span>{credits ? credits.remainingCredits.toLocaleString() : '25,000'} left</span>
              <span>{credits ? credits.totalCredits.toLocaleString() : '25,000'}</span>
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${
                    credits
                      ? Math.max(5, Math.round((credits.remainingCredits / credits.totalCredits) * 100))
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCreditsModal(true)}
            className="w-full p-2 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-indigo-600 hover:border-indigo-400 transition-colors cursor-pointer"
            title="AI Studio Credits"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        )}

        {/* User Profile & Admin Lock */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
              MA
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-zinc-900 truncate">Mike</div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {isAdmin ? 'Admin Mode (Unlocked)' : 'Lead LXD Architect'}
                </div>
              </div>
            )}
          </div>

          {/* Discreet Admin Lock Button */}
          <button
            type="button"
            onClick={() => setShowAdminModal(true)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isAdmin
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-200'
            }`}
            title={isAdmin ? 'Admin Mode Unlocked — Click to manage' : 'Unlock Author / Admin Mode'}
          >
            {isAdmin ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Admin Unlock & Reset Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full p-6 text-left animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  {isAdmin ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    {isAdmin ? 'Admin Controls Active' : 'Author & Admin Access'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {isAdmin ? 'You have full master course control' : 'Enter Admin PIN to unlock full rights'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminModal(false);
                  setPinInput('');
                  setPinError(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {!isAdmin ? (
              <form onSubmit={handleUnlockAdmin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Security Passcode
                  </label>
                  <input
                    type="password"
                    placeholder="Enter PIN"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-black font-mono tracking-widest text-center"
                  />
                  {pinError && (
                    <div className="text-[11px] text-rose-500 mt-1 font-semibold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Incorrect PIN. Showcase mode remains active.</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-gray-500 leading-relaxed">
                  💡 In <strong>Public Showcase Mode</strong>, visitors can freely duplicate courses, build blocks, and test previews without corrupting master courses.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdminModal(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-black text-white hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Unlock Admin
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Admin Mode Unlocked</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    You have unrestricted access to edit API keys, manage master templates, and reset courses.
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <button
                    type="button"
                    onClick={handleResetDemoCourses}
                    disabled={resettingDemo}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resettingDemo ? 'animate-spin' : ''}`} />
                    <span>{resetSuccess ? 'Restored Pristine State!' : resettingDemo ? 'Resetting Demo Courses...' : 'Reset Demo Courses to Master Clean'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLockAdmin}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                  >
                    Relock to Public Showcase Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Credit History & Top-Up Modal */}
      <AICreditHistoryModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        onCreditsUpdated={(newCreds) => setCredits(newCreds)}
      />
    </aside>
  );
}
