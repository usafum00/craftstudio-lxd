'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { QuestionBank, QuizQuestion, QuestionType } from '@/lib/types';
import {
  HelpCircle,
  Plus,
  Search,
  ChevronLeft,
  Trash2,
  Copy,
  CheckCircle2,
  Check,
  AlertCircle,
  ListOrdered,
  CheckSquare,
  FileText,
  GitCompare,
  ArrowUpDown,
  MoreVertical,
  ChevronDown,
  ArrowLeft,
  FolderClosed,
  Loader2,
  Save,
} from 'lucide-react';

export default function QuestionBanksPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // New Bank Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newBankTitle, setNewBankTitle] = useState('');
  const [newBankDescription, setNewBankDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Active Editing Bank State
  const [currentBank, setCurrentBank] = useState<QuestionBank | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'saving'>('idle');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
  const [addQuestionMenuOpen, setAddQuestionMenuOpen] = useState(false);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/question-banks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setBanks(data);
      }
    } catch (err) {
      console.error('Failed to load question banks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  // When a bank is selected, initialize currentBank
  useEffect(() => {
    if (selectedBankId) {
      const found = banks.find((b) => b.id === selectedBankId);
      if (found) {
        setCurrentBank(JSON.parse(JSON.stringify(found)));
      }
    } else {
      setCurrentBank(null);
    }
  }, [selectedBankId, banks]);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBankTitle.trim()) return;

    try {
      setIsCreating(true);
      const res = await fetch('/api/question-banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBankTitle.trim(),
          description: newBankDescription.trim(),
          questions: [],
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setBanks((prev) => [created, ...prev]);
        setCreateModalOpen(false);
        setNewBankTitle('');
        setNewBankDescription('');
        setSelectedBankId(created.id);
      }
    } catch (err) {
      console.error('Failed to create question bank', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBank = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question bank? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/question-banks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanks((prev) => prev.filter((b) => b.id !== id));
        if (selectedBankId === id) {
          setSelectedBankId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete question bank', err);
    }
  };

  // Save currentBank changes
  const saveCurrentBank = async (bankToSave: QuestionBank) => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');
      const res = await fetch(`/api/question-banks/${bankToSave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bankToSave.title,
          description: bankToSave.description,
          questions: bankToSave.questions,
        }),
      });

      if (res.ok) {
        setBanks((prev) => prev.map((b) => (b.id === bankToSave.id ? bankToSave : b)));
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    } catch (err) {
      console.error('Failed to save question bank', err);
      setSaveStatus('idle');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Question to currentBank
  const handleAddQuestion = (type: QuestionType) => {
    if (!currentBank) return;

    let newQ: QuizQuestion;
    const qId = `q-${Date.now()}`;

    switch (type) {
      case 'multiple_choice':
        newQ = {
          id: qId,
          type: 'multiple_choice',
          title: 'New Multiple Choice Question',
          points: 10,
          options: [
            { id: 'opt-1', text: 'Correct Answer', isCorrect: true },
            { id: 'opt-2', text: 'Alternative Choice', isCorrect: false },
          ],
          feedback: {
            correct: 'Correct! You understood the key principle.',
            incorrect: 'Incorrect. Please review this topic.',
          },
        };
        break;
      case 'multiple_response':
        newQ = {
          id: qId,
          type: 'multiple_response',
          title: 'New Multiple Response Question',
          points: 10,
          options: [
            { id: 'opt-1', text: 'First Correct Answer', isCorrect: true },
            { id: 'opt-2', text: 'Second Correct Answer', isCorrect: true },
            { id: 'opt-3', text: 'Distractor Choice', isCorrect: false },
          ],
          feedback: {
            correct: 'Excellent. You identified all matching options.',
            incorrect: 'Not all correct options were selected.',
          },
        };
        break;
      case 'fill_in_blank':
        newQ = {
          id: qId,
          type: 'fill_in_blank',
          title: 'New Fill in the Blank Question',
          points: 10,
          sentence: 'Type your sentence here with [blank] representing the missing term.',
          acceptedAnswers: ['answer'],
          caseSensitive: false,
          feedback: {
            correct: 'Correct response entered!',
            incorrect: 'Review the accepted terms.',
          },
        };
        break;
      case 'matching':
        newQ = {
          id: qId,
          type: 'matching',
          title: 'New Matching Activity Question',
          points: 10,
          matchingPairs: [
            { id: 'pair-1', left: 'Concept A', right: 'Definition A' },
            { id: 'pair-2', left: 'Concept B', right: 'Definition B' },
          ],
          feedback: {
            correct: 'All pairs connected accurately!',
            incorrect: 'Some pairs were mismatched.',
          },
        };
        break;
    }

    const updatedBank = {
      ...currentBank,
      questions: [...currentBank.questions, newQ],
    };
    setCurrentBank(updatedBank);
    setAddQuestionMenuOpen(false);
    saveCurrentBank(updatedBank);
  };

  const handleDuplicateQuestion = (index: number) => {
    if (!currentBank) return;
    const target = currentBank.questions[index];
    const cloned: QuizQuestion = {
      ...JSON.parse(JSON.stringify(target)),
      id: `q-${Date.now()}`,
      title: `${target.title} (Copy)`,
    };
    const updated = [...currentBank.questions];
    updated.splice(index + 1, 0, cloned);
    const updatedBank = { ...currentBank, questions: updated };
    setCurrentBank(updatedBank);
    saveCurrentBank(updatedBank);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!currentBank) return;
    const updated = currentBank.questions.filter((_, i) => i !== index);
    const updatedBank = { ...currentBank, questions: updated };
    setCurrentBank(updatedBank);
    saveCurrentBank(updatedBank);
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!currentBank) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentBank.questions.length) return;

    const list = [...currentBank.questions];
    const [moved] = list.splice(index, 1);
    list.splice(targetIdx, 0, moved);

    const updatedBank = { ...currentBank, questions: list };
    setCurrentBank(updatedBank);
    saveCurrentBank(updatedBank);
  };

  const filteredBanks = banks.filter(
    (b) =>
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Navigation Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-gray-200 px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {selectedBankId && (
              <button
                onClick={() => setSelectedBankId(null)}
                className="text-gray-500 hover:text-gray-900 p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>All Banks</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 text-sm">
                {selectedBankId ? currentBank?.title || 'Question Bank' : 'Question Banks'}
              </span>
              {saveStatus === 'saving' && (
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!selectedBankId ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Question Bank</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setAddQuestionMenuOpen(!addQuestionMenuOpen)}
                  className="bg-black hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Question</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {addQuestionMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50">
                    <button
                      onClick={() => handleAddQuestion('multiple_choice')}
                      className="w-full px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <ListOrdered className="w-4 h-4 text-sky-600" />
                      <div>
                        <div className="font-medium text-gray-900">Multiple Choice</div>
                        <div className="text-[10px] text-gray-400">Single correct option</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAddQuestion('multiple_response')}
                      className="w-full px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-medium text-gray-900">Multiple Response</div>
                        <div className="text-[10px] text-gray-400">Multiple correct choices</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAddQuestion('fill_in_blank')}
                      className="w-full px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <FileText className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-medium text-gray-900">Fill in the Blank</div>
                        <div className="text-[10px] text-gray-400">Sentence with text slot</div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAddQuestion('matching')}
                      className="w-full px-4 py-2.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                    >
                      <GitCompare className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-medium text-gray-900">Matching Activity</div>
                        <div className="text-[10px] text-gray-400">Pair terms with matches</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* View 1: Banks List Overview */}
        {!selectedBankId && (
          <main className="p-8 max-w-7xl mx-auto w-full flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Question Banks</h1>
              <p className="text-xs text-gray-500 mt-1">
                Create and organize reusable pools of verified assessment questions to draw into any course quiz.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-md mb-8">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search question banks by title or description"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 shadow-2xs"
              />
            </div>

            {/* Banks Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 h-48 border border-gray-200"></div>
                ))}
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">No question banks found</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Create your first question bank to start building reusable assessment items.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Question Bank
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBanks.map((bank) => (
                  <div
                    key={bank.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#ff5722] flex items-center justify-center font-bold text-sm">
                          <HelpCircle className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          {bank.questions?.length || 0} {bank.questions?.length === 1 ? 'question' : 'questions'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900 group-hover:text-[#ff5722] transition-colors line-clamp-1">
                        {bank.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {bank.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400">
                        {new Date(bank.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteBank(bank.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Bank"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedBankId(bank.id)}
                          className="px-3.5 py-1.5 bg-black hover:bg-gray-800 text-white rounded-full text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          Manage Questions
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}

        {/* View 2: Detailed Bank Question Manager */}
        {selectedBankId && currentBank && (
          <main className="p-8 max-w-4xl mx-auto w-full flex-1">
            {/* Bank Metadata Card */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-8 shadow-xs">
              <div className="space-y-3">
                <input
                  type="text"
                  value={currentBank.title}
                  onChange={(e) => {
                    const updated = { ...currentBank, title: e.target.value };
                    setCurrentBank(updated);
                  }}
                  onBlur={() => saveCurrentBank(currentBank)}
                  className="text-xl font-bold text-gray-900 w-full border-b border-transparent hover:border-gray-300 focus:border-[#ff5722] focus:outline-none pb-1 transition-colors"
                  placeholder="Question Bank Title"
                />
                <textarea
                  value={currentBank.description}
                  onChange={(e) => {
                    const updated = { ...currentBank, description: e.target.value };
                    setCurrentBank(updated);
                  }}
                  onBlur={() => saveCurrentBank(currentBank)}
                  rows={2}
                  className="text-xs text-gray-600 w-full border border-transparent hover:border-gray-200 focus:border-[#ff5722] focus:outline-none p-2 rounded-lg resize-none transition-colors"
                  placeholder="Describe the topics covered in this question bank..."
                />
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100 mt-4">
                <span>{currentBank.questions.length} questions in this bank</span>
                <button
                  onClick={() => saveCurrentBank(currentBank)}
                  disabled={isSaving}
                  className="text-xs text-gray-600 hover:text-black font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Checkpoint</span>
                </button>
              </div>
            </div>

            {/* Questions Stack */}
            {currentBank.questions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">No questions yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Click the &quot;+ Add Question&quot; button in the top right to insert Multiple Choice, Multiple Response, Fill in
                  the Blank, or Matching questions.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentBank.questions.map((q, idx) => (
                  <div
                    key={q.id || idx}
                    className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Question Header Bar */}
                    <div className="bg-gray-50/70 border-b border-gray-100 px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                        <span
                          className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                            q.type === 'multiple_choice'
                              ? 'bg-sky-100 text-sky-700'
                              : q.type === 'multiple_response'
                              ? 'bg-emerald-100 text-emerald-700'
                              : q.type === 'fill_in_blank'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {q.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Points badge */}
                        <div className="flex items-center gap-1 text-xs text-gray-500 mr-2">
                          <span>Points:</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={q.points || 10}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 10;
                              const updatedQuestions = [...currentBank.questions];
                              updatedQuestions[idx] = { ...q, points: val };
                              const updatedBank = { ...currentBank, questions: updatedQuestions };
                              setCurrentBank(updatedBank);
                            }}
                            onBlur={() => saveCurrentBank(currentBank)}
                            className="w-12 px-1.5 py-0.5 text-center text-xs font-semibold bg-white border border-gray-200 rounded"
                          />
                        </div>

                        {/* Move Up / Down */}
                        <button
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronLeft className="w-4 h-4 rotate-90" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === currentBank.questions.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronLeft className="w-4 h-4 -rotate-90" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicateQuestion(idx)}
                          className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                          title="Duplicate Question"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteQuestion(idx)}
                          className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content Body */}
                    <div className="p-6 space-y-4">
                      {/* Question Stem / Title */}
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Question Prompt / Stem
                        </label>
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => {
                            const updatedQuestions = [...currentBank.questions];
                            updatedQuestions[idx] = { ...q, title: e.target.value };
                            setCurrentBank({ ...currentBank, questions: updatedQuestions });
                          }}
                          onBlur={() => saveCurrentBank(currentBank)}
                          className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg p-2.5 focus:border-[#ff5722] focus:outline-none"
                          placeholder="Type question prompt..."
                        />
                      </div>

                      {/* Type-Specific Interactive Editors */}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2 pt-2">
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Answer Choices (Select single correct answer)
                          </label>
                          <div className="space-y-2">
                            {(q.options || []).map((opt, optIdx) => (
                              <div key={opt.id || optIdx} className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedOpts = (q.options || []).map((o, i) => ({
                                      ...o,
                                      isCorrect: i === optIdx,
                                    }));
                                    const updatedQuestions = [...currentBank.questions];
                                    updatedQuestions[idx] = { ...q, options: updatedOpts };
                                    const updatedBank = { ...currentBank, questions: updatedQuestions };
                                    setCurrentBank(updatedBank);
                                    saveCurrentBank(updatedBank);
                                  }}
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors flex-shrink-0 cursor-pointer ${
                                    opt.isCorrect
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Mark as correct answer"
                                >
                                  {opt.isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>

                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updatedOpts = [...(q.options || [])];
                                    updatedOpts[optIdx] = { ...opt, text: e.target.value };
                                    const updatedQuestions = [...currentBank.questions];
                                    updatedQuestions[idx] = { ...q, options: updatedOpts };
                                    setCurrentBank({ ...currentBank, questions: updatedQuestions });
                                  }}
                                  onBlur={() => saveCurrentBank(currentBank)}
                                  className={`flex-1 text-xs border rounded-lg px-3 py-2 focus:outline-none ${
                                    opt.isCorrect
                                      ? 'border-emerald-300 bg-emerald-50/30'
                                      : 'border-gray-200 focus:border-gray-400'
                                  }`}
                                  placeholder={`Choice #${optIdx + 1}`}
                                />

                                {(q.options?.length || 0) > 2 && (
                                  <button
                                    onClick={() => {
                                      const updatedOpts = (q.options || []).filter((_, i) => i !== optIdx);
                                      const updatedQuestions = [...currentBank.questions];
                                      updatedQuestions[idx] = { ...q, options: updatedOpts };
                                      const updatedBank = { ...currentBank, questions: updatedQuestions };
                                      setCurrentBank(updatedBank);
                                      saveCurrentBank(updatedBank);
                                    }}
                                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newOpt = {
                                id: `opt-${Date.now()}`,
                                text: `Choice #${(q.options?.length || 0) + 1}`,
                                isCorrect: false,
                              };
                              const updatedQuestions = [...currentBank.questions];
                              updatedQuestions[idx] = { ...q, options: [...(q.options || []), newOpt] };
                              const updatedBank = { ...currentBank, questions: updatedQuestions };
                              setCurrentBank(updatedBank);
                              saveCurrentBank(updatedBank);
                            }}
                            className="mt-2 text-xs text-[#ff5722] hover:text-[#e04d1f] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Choice</span>
                          </button>
                        </div>
                      )}

                      {q.type === 'multiple_response' && (
                        <div className="space-y-2 pt-2">
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Answer Choices (Check all correct answers)
                          </label>
                          <div className="space-y-2">
                            {(q.options || []).map((opt, optIdx) => (
                              <div key={opt.id || optIdx} className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedOpts = [...(q.options || [])];
                                    updatedOpts[optIdx] = { ...opt, isCorrect: !opt.isCorrect };
                                    const updatedQuestions = [...currentBank.questions];
                                    updatedQuestions[idx] = { ...q, options: updatedOpts };
                                    const updatedBank = { ...currentBank, questions: updatedQuestions };
                                    setCurrentBank(updatedBank);
                                    saveCurrentBank(updatedBank);
                                  }}
                                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors flex-shrink-0 cursor-pointer ${
                                    opt.isCorrect
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  title="Toggle correct status"
                                >
                                  {opt.isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>

                                <input
                                  type="text"
                                  value={opt.text}
                                  onChange={(e) => {
                                    const updatedOpts = [...(q.options || [])];
                                    updatedOpts[optIdx] = { ...opt, text: e.target.value };
                                    const updatedQuestions = [...currentBank.questions];
                                    updatedQuestions[idx] = { ...q, options: updatedOpts };
                                    setCurrentBank({ ...currentBank, questions: updatedQuestions });
                                  }}
                                  onBlur={() => saveCurrentBank(currentBank)}
                                  className={`flex-1 text-xs border rounded-lg px-3 py-2 focus:outline-none ${
                                    opt.isCorrect
                                      ? 'border-emerald-300 bg-emerald-50/30'
                                      : 'border-gray-200 focus:border-gray-400'
                                  }`}
                                  placeholder={`Option #${optIdx + 1}`}
                                />

                                {(q.options?.length || 0) > 2 && (
                                  <button
                                    onClick={() => {
                                      const updatedOpts = (q.options || []).filter((_, i) => i !== optIdx);
                                      const updatedQuestions = [...currentBank.questions];
                                      updatedQuestions[idx] = { ...q, options: updatedOpts };
                                      const updatedBank = { ...currentBank, questions: updatedQuestions };
                                      setCurrentBank(updatedBank);
                                      saveCurrentBank(updatedBank);
                                    }}
                                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newOpt = {
                                id: `opt-${Date.now()}`,
                                text: `Option #${(q.options?.length || 0) + 1}`,
                                isCorrect: false,
                              };
                              const updatedQuestions = [...currentBank.questions];
                              updatedQuestions[idx] = { ...q, options: [...(q.options || []), newOpt] };
                              const updatedBank = { ...currentBank, questions: updatedQuestions };
                              setCurrentBank(updatedBank);
                              saveCurrentBank(updatedBank);
                            }}
                            className="mt-2 text-xs text-[#ff5722] hover:text-[#e04d1f] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Option</span>
                          </button>
                        </div>
                      )}

                      {q.type === 'fill_in_blank' && (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              Sentence with [blank] placeholder
                            </label>
                            <input
                              type="text"
                              value={q.sentence || ''}
                              onChange={(e) => {
                                const updatedQuestions = [...currentBank.questions];
                                updatedQuestions[idx] = { ...q, sentence: e.target.value };
                                setCurrentBank({ ...currentBank, questions: updatedQuestions });
                              }}
                              onBlur={() => saveCurrentBank(currentBank)}
                              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:border-[#ff5722] focus:outline-none"
                              placeholder="e.g. Always verify suspicious emails with [blank] authentication."
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                              Accepted Answers (Comma separated)
                            </label>
                            <input
                              type="text"
                              value={(q.acceptedAnswers || []).join(', ')}
                              onChange={(e) => {
                                const split = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                                const updatedQuestions = [...currentBank.questions];
                                updatedQuestions[idx] = { ...q, acceptedAnswers: split };
                                setCurrentBank({ ...currentBank, questions: updatedQuestions });
                              }}
                              onBlur={() => saveCurrentBank(currentBank)}
                              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:border-[#ff5722] focus:outline-none"
                              placeholder="multi-factor, 2FA, MFA"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={q.caseSensitive || false}
                              onChange={(e) => {
                                const updatedQuestions = [...currentBank.questions];
                                updatedQuestions[idx] = { ...q, caseSensitive: e.target.checked };
                                const updatedBank = { ...currentBank, questions: updatedQuestions };
                                setCurrentBank(updatedBank);
                                saveCurrentBank(updatedBank);
                              }}
                              className="rounded border-gray-300 text-[#ff5722] focus:ring-[#ff5722]"
                            />
                            <span>Require exact case matching</span>
                          </label>
                        </div>
                      )}

                      {q.type === 'matching' && (
                        <div className="space-y-3 pt-2">
                          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                            Matching Pairs (Concept & Definition)
                          </label>
                          <div className="space-y-2">
                            {(q.matchingPairs || []).map((pair, pIdx) => (
                              <div key={pair.id || pIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={pair.left}
                                  onChange={(e) => {
                                    const updatedPairs = [...(q.matchingPairs || [])];
                                    updatedPairs[pIdx] = { ...pair, left: e.target.value };
                                    const updatedQuestions = [...currentBank.questions];
                                    updatedQuestions[idx] = { ...q, matchingPairs: updatedPairs };
                                    setCurrentBank({ ...currentBank, questions: updatedQuestions });
                                  }}
                                  onBlur={() => saveCurrentBank(currentBank)}
                                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:border-[#ff5722] focus:outline-none"
                                  placeholder={`Item #${pIdx + 1}`}
                                />
                                <span className="text-xs text-gray-400 font-bold">⇄</span>
                                <input
                                  type="text"
                                  value={pair.right}
                                  onChange={(e) => {
                                    const updatedPairs = [...(q.matchingPairs || [])];
                                    updatedPairs[pIdx] = { ...pair, right: e.target.value };
                                    const updatedQuestions = [...currentBank.questions];
                                    updatedQuestions[idx] = { ...q, matchingPairs: updatedPairs };
                                    setCurrentBank({ ...currentBank, questions: updatedQuestions });
                                  }}
                                  onBlur={() => saveCurrentBank(currentBank)}
                                  className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:border-[#ff5722] focus:outline-none"
                                  placeholder={`Matches with #${pIdx + 1}`}
                                />

                                {(q.matchingPairs?.length || 0) > 2 && (
                                  <button
                                    onClick={() => {
                                      const updatedPairs = (q.matchingPairs || []).filter((_, i) => i !== pIdx);
                                      const updatedQuestions = [...currentBank.questions];
                                      updatedQuestions[idx] = { ...q, matchingPairs: updatedPairs };
                                      const updatedBank = { ...currentBank, questions: updatedQuestions };
                                      setCurrentBank(updatedBank);
                                      saveCurrentBank(updatedBank);
                                    }}
                                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newPair = {
                                id: `pair-${Date.now()}`,
                                left: `Concept #${(q.matchingPairs?.length || 0) + 1}`,
                                right: `Definition #${(q.matchingPairs?.length || 0) + 1}`,
                              };
                              const updatedQuestions = [...currentBank.questions];
                              updatedQuestions[idx] = { ...q, matchingPairs: [...(q.matchingPairs || []), newPair] };
                              const updatedBank = { ...currentBank, questions: updatedQuestions };
                              setCurrentBank(updatedBank);
                              saveCurrentBank(updatedBank);
                            }}
                            className="mt-2 text-xs text-[#ff5722] hover:text-[#e04d1f] font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Matching Pair</span>
                          </button>
                        </div>
                      )}

                      {/* Feedback Accordion */}
                      <div className="pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setExpandedFeedbackId(expandedFeedbackId === q.id ? null : q.id)}
                          className="text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              expandedFeedbackId === q.id ? 'rotate-180' : ''
                            }`}
                          />
                          <span>{expandedFeedbackId === q.id ? 'Hide Feedback Messages' : 'Configure Feedback Messages'}</span>
                        </button>

                        {expandedFeedbackId === q.id && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                                Correct Answer Feedback
                              </label>
                              <textarea
                                value={q.feedback?.correct || ''}
                                onChange={(e) => {
                                  const updatedQuestions = [...currentBank.questions];
                                  updatedQuestions[idx] = {
                                    ...q,
                                    feedback: { ...q.feedback, correct: e.target.value },
                                  };
                                  setCurrentBank({ ...currentBank, questions: updatedQuestions });
                                }}
                                onBlur={() => saveCurrentBank(currentBank)}
                                rows={2}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:border-emerald-500 focus:outline-none resize-none bg-white"
                                placeholder="Explain why this answer is correct..."
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-1">
                                Incorrect Answer Feedback
                              </label>
                              <textarea
                                value={q.feedback?.incorrect || ''}
                                onChange={(e) => {
                                  const updatedQuestions = [...currentBank.questions];
                                  updatedQuestions[idx] = {
                                    ...q,
                                    feedback: { ...q.feedback, incorrect: e.target.value },
                                  };
                                  setCurrentBank({ ...currentBank, questions: updatedQuestions });
                                }}
                                onBlur={() => saveCurrentBank(currentBank)}
                                rows={2}
                                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:border-rose-500 focus:outline-none resize-none bg-white"
                                placeholder="Explain key concepts to review..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        )}
      </div>

      {/* New Bank Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 mb-1">New Question Bank</h3>
            <p className="text-xs text-gray-500 mb-4">
              Create a reusable pool of questions organized by topic or competency.
            </p>

            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Bank Title</label>
                <input
                  type="text"
                  required
                  value={newBankTitle}
                  onChange={(e) => setNewBankTitle(e.target.value)}
                  placeholder="e.g. SOC2 Compliance & Access Control"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={newBankDescription}
                  onChange={(e) => setNewBankDescription(e.target.value)}
                  rows={3}
                  placeholder="e.g. Questions evaluating identity verification, MFA policies, and incident response."
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-black resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newBankTitle.trim()}
                  className="px-5 py-2 text-xs font-semibold bg-black hover:bg-gray-800 text-white rounded-full transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Bank</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
