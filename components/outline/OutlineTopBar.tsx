'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SnapshotDropdown } from '@/components/snapshots/SnapshotDropdown';
import { ShareReviewModal } from '@/components/review/ShareReviewModal';
import {
  ChevronLeft,
  Undo2,
  Redo2,
  Palette,
  Settings as SettingsIcon,
  Eye,
  Check,
  Share2,
  MessageSquare,
} from 'lucide-react';

interface OutlineTopBarProps {
  courseId: string;
  courseTitle: string;
  onOpenThemeModal?: () => void;
  onOpenSettingsModal?: () => void;
  onPublish: () => void;
  isPublished: boolean;
  hasUnpublishedChanges?: boolean;
  lastPublishedAt?: string | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onRestoreSnapshot?: () => void;
  onToggleComments?: () => void;
  commentsCount?: number;
}

export function OutlineTopBar({
  courseId,
  courseTitle,
  onPublish,
  isPublished,
  hasUnpublishedChanges = false,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRestoreSnapshot = () => {},
  onToggleComments,
  commentsCount = 0,
}: OutlineTopBarProps) {
  const router = useRouter();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Keyboard shortcut for Undo / Redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo && onRedo) {
            e.preventDefault();
            onRedo();
          }
        } else {
          if (canUndo && onUndo) {
            e.preventDefault();
            onUndo();
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        if (canRedo && onRedo) {
          e.preventDefault();
          onRedo();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Back Link, Breadcrumb & Snapshots Dropdown */}
      <div className="flex items-center gap-2 overflow-hidden max-w-lg">
        <Link
          href="/"
          className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Library</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-xs font-semibold text-gray-800 truncate" title={courseTitle}>
          {courseTitle || 'Untitled Course'}
        </span>
        <SnapshotDropdown courseId={courseId} onRestore={onRestoreSnapshot} />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Undo / Redo */}
        <div className="flex items-center text-gray-500 mr-2 border-r border-gray-200 pr-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Undo (Cmd+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-gray-100 hover:text-gray-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
            title="Redo (Cmd+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Theme (Palette) */}
        <Link
          href={`/courses/${courseId}/theme`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title="Customize Theme"
        >
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline">Theme</span>
        </Link>

        {/* Settings (Gear) */}
        <Link
          href={`/courses/${courseId}/settings`}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          title="Course Settings & Navigation"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>

        {/* Review Comments Trigger (if provided) */}
        {onToggleComments && (
          <button
            type="button"
            onClick={onToggleComments}
            className="p-2 text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            title="View Peer Review Feedback"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feedback</span>
            {commentsCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center">
                {commentsCount}
              </span>
            )}
          </button>
        )}

        {/* Share with IDs Button */}
        <button
          type="button"
          onClick={() => setShareModalOpen(true)}
          className="px-3.5 py-1.5 rounded-full text-xs font-bold border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5 ml-1 cursor-pointer shadow-2xs"
          title="Share interactive preview & review link with instructional designers"
        >
          <Share2 className="w-3.5 h-3.5 text-purple-600" />
          <span>Share with IDs</span>
        </button>

        {/* Publish */}
        <button
          onClick={onPublish}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors flex items-center gap-1.5 ml-1 cursor-pointer ${
            isPublished
              ? hasUnpublishedChanges
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isPublished && <Check className="w-3.5 h-3.5" />}
          <span>
            {isPublished
              ? hasUnpublishedChanges
                ? 'Published (Unpublished Changes)'
                : 'Published'
              : 'Publish'}
          </span>
        </button>

        {/* Preview Button */}
        <button
          onClick={() => router.push(`/courses/${courseId}/preview`)}
          className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-colors shadow-sm ml-1 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Preview</span>
        </button>
      </div>

      {/* Share for Review Modal */}
      <ShareReviewModal
        courseId={courseId}
        courseTitle={courseTitle}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </header>
  );
}
