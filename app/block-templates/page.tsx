'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BlockTemplate, Block } from '@/lib/types';
import {
  Layers,
  Plus,
  Search,
  Trash2,
  Loader2,
  Eye,
  X,
} from 'lucide-react';

export default function BlockTemplatesPage() {
  const [templates, setTemplates] = useState<BlockTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<BlockTemplate | null>(null);

  // Create Template Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [isCreating, setIsCreating] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this block template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        if (previewTemplate?.id === id) setPreviewTemplate(null);
      }
    } catch (err) {
      console.error('Failed to delete template', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsCreating(true);
      // Sample starter blocks for a new template
      const starterBlocks: Block[] = [
        {
          id: `b-${Date.now()}-1`,
          category: 'statement',
          subtype: 'statement_accent',
          content: {
            statement: name.trim(),
            subtext: description.trim() || 'Reusable instructional block template',
          },
          settings: {
            paddingTop: 'medium',
            paddingBottom: 'medium',
            backgroundColor: 'white',
          },
        },
      ];

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          blocks: starterBlocks,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTemplates((prev) => [created, ...prev]);
        setCreateModalOpen(false);
        setName('');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create template', err);
    } finally {
      setIsCreating(false);
    }
  };

  const filtered = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'custom', 'scenario', 'checklist', 'assessment', 'callout'];

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
            <span className="text-gray-900 font-semibold">Block Templates</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="bg-black hover:bg-gray-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Block Template</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Title & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Block Templates</h1>
              <p className="text-xs text-gray-500 mt-1">
                Save and reuse customized instructional block groups across any lesson in your workspace.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 border-b border-gray-100 pb-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="text-xs">Loading templates...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center max-w-md mx-auto my-12">
              <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900">No Block Templates Found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                {searchTerm
                  ? 'No templates match your search query.'
                  : 'Create your first reusable block template or save one directly from any lesson block.'}
              </p>
              <button
                onClick={() => setCreateModalOpen(true)}
                className="mt-4 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Template</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((template) => {
                const blockCount = Array.isArray(template.blocks) ? template.blocks.length : 0;
                return (
                  <div
                    key={template.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-gray-100 text-gray-700">
                          {template.category}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {blockCount} {blockCount === 1 ? 'block' : 'blocks'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-sky-700 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setPreviewTemplate(template)}
                        className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gray-400" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={(e) => handleDelete(template.id, e)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{previewTemplate.name}</h3>
                <p className="text-xs text-gray-500">{previewTemplate.description}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Contained Blocks ({previewTemplate.blocks.length})
              </div>
              {previewTemplate.blocks.map((b, idx) => (
                <div key={b.id || idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-gray-800 capitalize">
                      {idx + 1}. {b.category} ({b.subtype})
                    </span>
                    <span className="text-[10px] text-gray-400">{b.id}</span>
                  </div>
                  <pre className="text-[11px] text-gray-600 overflow-x-auto bg-white p-2.5 rounded border border-gray-100">
                    {JSON.stringify(b.content, null, 2)}
                  </pre>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">New Block Template</h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Incident Response Protocol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe when to use this template..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-gray-900 focus:ring-1 focus:ring-gray-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white"
                >
                  <option value="custom">Custom</option>
                  <option value="scenario">Scenario & Decision</option>
                  <option value="checklist">Checklist & Job Aid</option>
                  <option value="assessment">Assessment</option>
                  <option value="callout">Callout & Warning</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {isCreating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
