'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CourseSnapshot } from '@/lib/types';
import {
  History,
  ChevronDown,
  Plus,
  RotateCcw,
  Trash2,
  Loader2,
  Check,
  Clock,
  Sparkles,
} from 'lucide-react';

interface SnapshotDropdownProps {
  courseId: string;
  onRestore: () => void;
  accentColor?: string;
}

export function SnapshotDropdown({
  courseId,
  onRestore,
  accentColor = '#ff5722',
}: SnapshotDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<CourseSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load snapshots when dropdown opens
  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen]);

  const loadSnapshots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}/snapshots`);
      const data = await res.json();
      if (data.snapshots) {
        setSnapshots(data.snapshots);
      }
    } catch (err) {
      console.error('Failed to load snapshots', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      setCreating(true);
      const name = newSnapshotName.trim() || `Snapshot ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const res = await fetch(`/api/courses/${courseId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setNewSnapshotName('');
        setShowInput(false);
        await loadSnapshots();
      }
    } catch (err) {
      console.error('Failed to create snapshot', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreSnapshot = async (snapshotId: string) => {
    if (!confirm('Are you sure you want to restore this snapshot? Any unsaved changes will be reverted.')) {
      return;
    }
    try {
      setRestoringId(snapshotId);
      const res = await fetch(`/api/courses/${courseId}/snapshots/${snapshotId}`, {
        method: 'POST',
      });
      if (res.ok) {
        setIsOpen(false);
        onRestore();
      }
    } catch (err) {
      console.error('Failed to restore snapshot', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/courses/${courseId}/snapshots/${snapshotId}`, {
        method: 'DELETE',
      });
      setSnapshots(snapshots.filter((s) => s.id !== snapshotId));
    } catch (err) {
      console.error('Failed to delete snapshot', err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-gray-100 text-xs font-semibold text-gray-600 hover:text-black transition-colors cursor-pointer border border-transparent hover:border-gray-200"
        title="Course Snapshots (Version History)"
      >
        <History className="w-3.5 h-3.5 text-gray-500" />
        <span className="hidden sm:inline">Snapshots</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 px-1">
            <span className="font-bold text-gray-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-orange-600" />
              <span>Version History ({snapshots.length})</span>
            </span>
            <button
              type="button"
              onClick={() => setShowInput(!showInput)}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Checkpoint</span>
            </button>
          </div>

          {/* New Snapshot Input */}
          {showInput && (
            <div className="pt-2 pb-2 px-1 border-b border-gray-100 flex items-center gap-1.5">
              <input
                type="text"
                placeholder="Checkpoint name (e.g. Pre-Publish v1)"
                value={newSnapshotName}
                onChange={(e) => setNewSnapshotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateSnapshot();
                }}
                className="flex-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs outline-none focus:border-black"
                autoFocus
              />
              <button
                type="button"
                disabled={creating}
                onClick={handleCreateSnapshot}
                className="px-3 py-1 rounded-lg text-white font-bold cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </button>
            </div>
          )}

          {/* Snapshots List */}
          <div className="max-h-64 overflow-y-auto py-1 space-y-1">
            {loading ? (
              <div className="py-6 text-center text-gray-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading checkpoints...</span>
              </div>
            ) : snapshots.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-[11px]">
                No checkpoints saved yet. Click &quot;+ Checkpoint&quot; to freeze a version anytime.
              </div>
            ) : (
              snapshots.map((s) => (
                <div
                  key={s.id}
                  className="p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-bold text-gray-900 truncate">{s.name}</div>
                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(s.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={restoringId === s.id}
                      onClick={() => handleRestoreSnapshot(s.id)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-[11px] font-bold text-gray-700 flex items-center gap-1 cursor-pointer"
                      title="Restore to this checkpoint"
                    >
                      {restoringId === s.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-gray-600" />
                      ) : (
                        <RotateCcw className="w-3 h-3" />
                      )}
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSnapshot(s.id, e)}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete checkpoint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
