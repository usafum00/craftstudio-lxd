'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopNav } from '@/components/dashboard/TopNav';
import { CourseCard } from '@/components/dashboard/CourseCard';
import { CreateCourseModal } from '@/components/dashboard/CreateCourseModal';
import { Course, CourseType } from '@/lib/types';
import {
  Search,
  Filter,
  ArrowUpDown,
  User,
  LayoutGrid,
  List as ListIcon,
  FolderClosed,
  Bookmark,
  Users,
  Globe,
  HelpCircle,
  Trash2,
  Plus,
} from 'lucide-react';

export default function LibraryPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [ownerFilter, setOwnerFilter] = useState('anyone');
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Create course modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [newCourseType, setNewCourseType] = useState<CourseType>('course');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterType !== 'all') params.set('filter', filterType);
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/courses?${params.toString()}`);
      const data = await res.json();
      if (data.courses) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error('Failed to load courses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, filterType, sortBy]);

  const handleCreateNew = (type: CourseType) => {
    setNewCourseType(type);
    setModalOpen(true);
  };

  const handleModalSubmit = async (title: string, type: CourseType) => {
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          status: 'draft',
          coverImage: null,
        }),
      });
      const data = await res.json();
      if (data.course) {
        setModalOpen(false);
        router.push(`/courses/${data.course.id}`);
      }
    } catch (err) {
      console.error('Error creating course', err);
    }
  };

  const handleDuplicate = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}/duplicate`, { method: 'POST' });
      if (res.ok) {
        await fetchCourses();
      }
    } catch (err) {
      console.error('Failed to duplicate course', err);
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchCourses();
      }
    } catch (err) {
      console.error('Failed to delete course', err);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', icon: null },
    { id: 'folders', label: 'Private & Team Folders', icon: FolderClosed },
    { id: 'shortcuts', label: 'Shortcuts', icon: Bookmark },
    { id: 'shared', label: 'Shared with me', icon: Users },
    { id: 'localized', label: 'Localized', icon: Globe },
    { id: 'banks', label: 'Question Banks', icon: HelpCircle },
    { id: 'deleted', label: 'Deleted', icon: Trash2 },
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Navigation Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          onCreateNew={handleCreateNew}
          onImportSuccess={async (importedId) => {
            await fetchCourses();
            if (importedId) {
              router.push(`/courses/${importedId}`);
            }
          }}
        />

        <main className="p-8 max-w-7xl mx-auto w-full flex-1">
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Library</h1>
            <p className="text-xs text-gray-500 mt-1">
              Search, manage, or edit all of your drafts and published content.
            </p>
          </div>

          {/* Controls Bar: Search, Filters, View Modes */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search all content"
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-xs text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all shadow-xs"
              />
            </div>

            {/* Filter & Sort Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <div className="relative inline-flex items-center">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-xs font-medium text-gray-700 py-2 pl-3 pr-8 rounded-lg shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="all">All content</option>
                  <option value="course">Courses only</option>
                  <option value="microlearning">Microlearning only</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
              </div>

              {/* Sort Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-xs font-medium text-gray-700 py-2 pl-3 pr-8 rounded-lg shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="recent">Recently updated</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="oldest">Oldest first</option>
                </select>
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
              </div>

              {/* Owner Filter */}
              <div className="relative inline-flex items-center">
                <select
                  value={ownerFilter}
                  onChange={(e) => setOwnerFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 hover:border-gray-300 text-xs font-medium text-gray-700 py-2 pl-3 pr-8 rounded-lg shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-400"
                >
                  <option value="anyone">Owned by anyone</option>
                  <option value="me">Owned by me</option>
                </select>
                <User className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
              </div>

              {/* Grid / List View Toggles */}
              <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-white shadow-xs ml-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List view"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Sub-nav Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-4 mb-6 border-b border-gray-100 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'banks') {
                      router.push('/question-banks');
                      return;
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#115E59] text-white shadow-xs font-semibold'
                      : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Courses Grid / List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl h-64"></div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <FolderClosed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-900">No content found</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                No courses or microlearning matched your current search and filter settings.
              </p>
              <button
                onClick={() => handleCreateNew('course')}
                className="mt-4 px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Create new Course
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => router.push(`/courses/${course.id}`)}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded bg-gray-100 overflow-hidden relative">
                      {course.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={course.coverImage} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-900">{course.title}</h4>
                      <p className="text-[11px] text-gray-400">
                        {course.type === 'microlearning' ? 'Microlearning' : `Course • ${course.lessonCount || 0} lessons`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        course.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {course.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom count footer */}
          <div className="mt-8 text-xs text-gray-400 font-medium">
            1-{courses.length} of {courses.length}
          </div>
        </main>
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={modalOpen}
        type={newCourseType}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
}
