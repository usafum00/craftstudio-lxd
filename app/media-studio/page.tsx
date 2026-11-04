'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { UnifiedMediaModal } from '@/components/media/UnifiedMediaModal';
import { Sparkles } from 'lucide-react';

export default function MediaStudioPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#fcfcfc] text-gray-900 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header Bar */}
        <header className="h-14 px-8 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Library
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-semibold">Media Studio</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Open Media Studio Modal</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl w-full mx-auto flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#ff5722] shadow-sm">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Google Media Studio & Asset Library</h1>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-2">
              Generate photorealistic imagery and course assets with your linked Google One AI Pro account or Google AI Studio API, with real-time dropzone synchronization.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-[#ff5722] hover:bg-[#f4511e] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch Studio & Asset Manager</span>
            </button>
            <Link
              href="/"
              className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
            >
              Back to Course Library
            </Link>
          </div>
        </main>
      </div>

      {/* Unified Media Modal */}
      <UnifiedMediaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(url) => {
          navigator.clipboard.writeText(url);
          alert(`Asset URL copied to clipboard: ${url}`);
          setModalOpen(false);
        }}
        initialTab="flow"
        mediaType="all"
      />
    </div>
  );
}
