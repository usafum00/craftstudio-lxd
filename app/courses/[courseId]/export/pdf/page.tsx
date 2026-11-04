'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Course, Lesson, Block } from '@/lib/types';
import {
  Printer,
  ChevronLeft,
  BookOpen,
  HelpCircle,
  Loader2,
  Layers,
} from 'lucide-react';

interface ChoiceItem {
  text?: string;
  label?: string;
  isCorrect?: boolean;
  correct?: boolean;
}

interface CustomItem {
  title?: string;
  text?: string;
  body?: string;
  content?: string;
  description?: string;
  front?: string;
  back?: string;
}

interface BlockContentModel {
  heading?: string;
  subheading?: string;
  body?: string;
  col1?: string;
  col2?: string;
  text?: string;
  quote?: string;
  author?: string;
  title?: string;
  caption?: string;
  url?: string;
  imageUrl?: string;
  buttonText?: string;
  language?: string;
  code?: string;
  question?: string;
  stem?: string;
  feedback?: string;
  items?: (string | CustomItem)[];
  tabs?: CustomItem[];
  steps?: CustomItem[];
  cards?: CustomItem[];
  hotspots?: CustomItem[];
  choices?: ChoiceItem[];
  options?: ChoiceItem[];
}

export default function CoursePdfExportPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const resolvedParams = use(params);
  const { courseId } = resolvedParams;

  const [course, setCourse] = useState<(Course & { lessons: Lesson[] }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}`);
        const data = await res.json();
        if (data.course) {
          setCourse(data.course);
        }
      } catch (err) {
        console.error('Failed to load course for PDF export', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
        <span className="text-xs text-gray-400 font-medium">Generating Document View...</span>
      </div>
    );
  }

  if (!course) return null;

  const accentColor = course.themeSettings?.accentColor || '#ff5722';
  const playableLessons = (course.lessons || []).filter((l) => l.type !== 'section');

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white text-gray-900 font-sans pb-24 print:pb-0">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            font-size: 11pt !important;
          }
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          .avoid-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Floating Top Bar (Hidden during printing) */}
      <header className="no-print sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Course</span>
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-xs font-bold text-gray-900 truncate max-w-md">
            {course.title} — Printable View
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: accentColor }}
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </header>

      {/* Main Document Content Container */}
      <main className="max-w-4xl mx-auto my-8 print:my-0 bg-white shadow-xl print:shadow-none border border-gray-200 print:border-none rounded-2xl print:rounded-none overflow-hidden">
        {/* Cover Page Header */}
        <section className="p-10 sm:p-14 border-b border-gray-200 avoid-break">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              {course.authorAvatar || 'MA'}
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">
                {course.authorName || 'Mike Afurong'}
              </div>
              <div className="text-[11px] text-gray-500">Course Author</div>
            </div>
          </div>

          <div className="w-16 h-1.5 rounded-full mb-6" style={{ backgroundColor: accentColor }} />

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            {course.title}
          </h1>

          {course.description && (
            <div className="text-sm text-gray-600 leading-relaxed max-w-2xl">
              {course.description}
            </div>
          )}

          {/* Table of Contents */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Table of Contents ({playableLessons.length} Lessons & Quizzes)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {course.lessons?.map((l) => {
                if (l.type === 'section') {
                  return (
                    <div
                      key={l.id}
                      className="col-span-full pt-3 font-bold text-gray-400 uppercase tracking-wider text-[11px]"
                    >
                      {l.title}
                    </div>
                  );
                }
                return (
                  <div key={l.id} className="flex items-center gap-2 text-gray-700 py-1">
                    {l.type === 'quiz' ? (
                      <HelpCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{l.title}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lessons & Quizzes */}
        <div className="divide-y divide-gray-200">
          {(course.lessons || []).map((lesson, lessonIdx) => {
            if (lesson.type === 'section') {
              return (
                <div
                  key={lesson.id}
                  className="p-8 bg-gray-50 text-center font-bold text-sm uppercase tracking-widest text-gray-500 page-break-before avoid-break"
                >
                  — Section: {lesson.title} —
                </div>
              );
            }

            const isQuiz = lesson.type === 'quiz';

            return (
              <article
                key={lesson.id}
                className="p-10 sm:p-14 page-break-before space-y-8"
              >
                {/* Lesson Header */}
                <div className="border-b border-gray-100 pb-6 avoid-break">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: accentColor }}
                    >
                      {isQuiz ? 'Quiz / Assessment' : 'Lesson'}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">
                      Lesson {lessonIdx + 1}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                    {lesson.title}
                  </h2>
                </div>

                {/* Blocks rendering */}
                <div className="space-y-8">
                  {isQuiz ? (
                    /* Render Quiz questions */
                    <div className="space-y-6 avoid-break">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                        <span className="font-bold">Graded Quiz:</span> Passing score is{' '}
                        {lesson.quizSettings?.passingScore ?? 80}%.
                      </div>

                      {(lesson.blocks || []).map((qBlock, qIdx) => {
                        const question =
                          typeof qBlock.content?.question === 'string'
                            ? qBlock.content.question
                            : typeof qBlock.content?.stem === 'string'
                            ? qBlock.content.stem
                            : `Question ${qIdx + 1}`;
                        const choices = (qBlock.content?.choices ||
                          qBlock.content?.options ||
                          []) as ChoiceItem[];
                        const rawFb = qBlock.content?.feedback;
                        const feedback =
                          typeof rawFb === 'string'
                            ? rawFb
                            : rawFb && typeof rawFb === 'object'
                            ? (rawFb as { correct?: string; incorrect?: string }).correct ||
                              (rawFb as { correct?: string; incorrect?: string }).incorrect ||
                              ''
                            : typeof qBlock.content?.explanation === 'string'
                            ? qBlock.content.explanation
                            : '';

                        return (
                          <div
                            key={qBlock.id || qIdx}
                            className="p-6 border border-gray-200 rounded-xl bg-gray-50/50 space-y-3 avoid-break"
                          >
                            <div className="text-xs font-bold text-gray-500">
                              Question {qIdx + 1}
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {question}
                            </div>
                            <div className="space-y-1.5 pt-2">
                              {(choices as ChoiceItem[]).map((choice: ChoiceItem, cIdx: number) => {
                                const isCorrect = choice.isCorrect || choice.correct;
                                return (
                                  <div
                                    key={cIdx}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                                      isCorrect
                                        ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                                        : 'bg-white border-gray-200 text-gray-700'
                                    }`}
                                  >
                                    <span>{choice.text || choice.label || JSON.stringify(choice)}</span>
                                    {isCorrect && (
                                      <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">
                                        ✓ Correct Answer
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {feedback && (
                              <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200 mt-2">
                                <span className="font-bold text-gray-800">Feedback: </span>
                                {feedback}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Render Standard Blocks */
                    (lesson.blocks || []).map((block, bIdx) => (
                      <div key={block.id || bIdx} className="avoid-break space-y-3">
                        {renderExpandedBlock(block, accentColor)}
                      </div>
                    ))
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/**
 * Renders every block type in an expanded, clean layout optimized for printing
 */
function renderExpandedBlock(block: Block, accentColor: string) {
  const content: BlockContentModel = (block.content || {}) as BlockContentModel;

  switch (block.category) {
    case 'text':
      return (
        <div className="space-y-2">
          {content.heading && (
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{content.heading}</h3>
          )}
          {content.subheading && (
            <h4 className="text-sm font-semibold text-gray-500">{content.subheading}</h4>
          )}
          {content.body && (
            <div
              className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: content.body }}
            />
          )}
          {content.col1 && content.col2 && (
            <div className="grid grid-cols-2 gap-6 text-sm text-gray-700 pt-2">
              <div dangerouslySetInnerHTML={{ __html: content.col1 }} />
              <div dangerouslySetInnerHTML={{ __html: content.col2 }} />
            </div>
          )}
        </div>
      );

    case 'statement':
      return (
        <div className="p-6 bg-slate-50 border-l-4 rounded-r-xl" style={{ borderColor: accentColor }}>
          <div className="text-base font-semibold text-gray-900 leading-relaxed italic">
            &ldquo;{content.text || content.body || 'Statement text'}&rdquo;
          </div>
        </div>
      );

    case 'quote':
      return (
        <blockquote className="p-6 border-l-4 bg-gray-50 rounded-r-xl" style={{ borderColor: accentColor }}>
          <div className="text-sm text-gray-800 italic leading-relaxed">
            &ldquo;{content.quote || content.text || 'Quote'}&rdquo;
          </div>
          {content.author && (
            <footer className="text-xs font-bold text-gray-600 mt-2">
              — {content.author} {content.title ? `, ${content.title}` : ''}
            </footer>
          )}
        </blockquote>
      );

    case 'list':
      const items = (content.items || []) as (string | CustomItem)[];
      return (
        <div className="space-y-2">
          {content.title && <h4 className="text-xs font-bold text-gray-500 uppercase">{content.title}</h4>}
          <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-700 pl-2">
            {items.map((item: string | CustomItem, i: number) => (
              <li key={i}>{typeof item === 'string' ? item : item.text || item.title}</li>
            ))}
          </ul>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-2 text-center">
          {content.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.url}
              alt={content.caption || 'Image'}
              className="max-h-80 mx-auto rounded-xl border border-gray-200 object-cover"
            />
          )}
          {content.caption && (
            <p className="text-xs text-gray-500 italic">{content.caption}</p>
          )}
        </div>
      );

    case 'divider':
      return (
        <div className="py-2">
          {block.subtype === 'continue_button' ? (
            <div className="p-3 bg-gray-100 rounded-xl text-center text-xs font-bold text-gray-700 border border-gray-300">
              ▼ [Continue] — {content.buttonText || 'Continue'}
            </div>
          ) : (
            <hr className="border-t border-gray-200" />
          )}
        </div>
      );

    case 'code':
      return (
        <div className="space-y-2">
          {content.language && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {content.language}
            </span>
          )}
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto">
            <code>{content.code || '// code snippet'}</code>
          </pre>
        </div>
      );

    case 'interactive':
      // Expand all interactive components
      if (block.subtype === 'accordion') {
        const accordionItems = (content.items || []) as CustomItem[];
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Accordion Items (All Expanded)</span>
            </div>
            <div className="space-y-2">
              {accordionItems.map((item: CustomItem, i: number) => (
                <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="text-xs font-bold text-gray-900 mb-1">
                    {i + 1}. {item.title}
                  </div>
                  <div
                    className="text-xs text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: item.body || item.content || '' }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (block.subtype === 'tabs') {
        const tabItems = (content.tabs || []) as CustomItem[];
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Tabs (All Expanded)
            </div>
            <div className="space-y-2">
              {tabItems.map((tab: CustomItem, i: number) => (
                <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="text-xs font-bold text-gray-900 mb-1 border-b pb-1">
                    Tab {i + 1}: {tab.title}
                  </div>
                  <div
                    className="text-xs text-gray-700 leading-relaxed pt-1"
                    dangerouslySetInnerHTML={{ __html: tab.body || tab.content || '' }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (block.subtype === 'process') {
        const steps = (content.steps || []) as CustomItem[];
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Process Steps (All Sequential Steps)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {steps.map((step: CustomItem, i: number) => (
                <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-1">
                  <div
                    className="text-[10px] font-bold px-2 py-0.5 rounded text-white inline-block"
                    style={{ backgroundColor: accentColor }}
                  >
                    Step {i + 1}
                  </div>
                  <div className="text-xs font-bold text-gray-900">{step.title}</div>
                  <div className="text-xs text-gray-600">{step.description || step.body}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (block.subtype === 'flashcard_grid' || block.subtype === 'flashcard_stack') {
        const cards = (content.cards || []) as CustomItem[];
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Flashcards (Front & Back)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {cards.map((card: CustomItem, i: number) => (
                <div key={i} className="p-4 border border-gray-200 rounded-xl bg-white space-y-2">
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Card {i + 1} Front:
                    </span>
                    <span className="text-xs font-semibold text-gray-900">{card.front}</span>
                  </div>
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                    <span className="text-[10px] font-bold text-sky-600 uppercase block mb-1">
                      Card {i + 1} Back:
                    </span>
                    <span className="text-xs text-gray-800">{card.back}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      if (block.subtype === 'labeled_graphic') {
        const hotspots = (content.hotspots || []) as CustomItem[];
        return (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Labeled Graphic Markers
            </div>
            {content.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.imageUrl}
                alt="Graphic"
                className="max-h-60 mx-auto rounded-xl border border-gray-200 object-cover"
              />
            )}
            <div className="space-y-2">
              {hotspots.map((hs: CustomItem, i: number) => (
                <div key={i} className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-xs">
                  <span className="font-bold text-gray-900">Marker {i + 1}: {hs.title} — </span>
                  <span className="text-gray-700">{hs.text || hs.description}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700">
          <span className="font-bold uppercase tracking-wider text-gray-500 block mb-1">
            {block.subtype?.replace(/_/g, ' ') || 'Interactive Block'}
          </span>
          <div>{content.title || content.text || JSON.stringify(content)}</div>
        </div>
      );

    case 'knowledge_check':
      const kcChoices = (content.choices || content.options || []) as ChoiceItem[];
      return (
        <div className="p-5 border border-gray-300 rounded-xl bg-gray-50/50 space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Knowledge Check
          </div>
          <div className="text-sm font-bold text-gray-900">
            {typeof content.question === 'string'
              ? content.question
              : typeof content.stem === 'string'
              ? content.stem
              : 'Knowledge Check'}
          </div>
          <div className="space-y-1.5 pt-1">
            {kcChoices.map((c: ChoiceItem, i: number) => {
              const isCorrect = c.isCorrect || c.correct;
              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                      : 'bg-white border-gray-200 text-gray-700'
                  }`}
                >
                  <span>{c.text || c.label || JSON.stringify(c)}</span>
                  {isCorrect && <span className="text-[10px] font-bold text-emerald-700">✓ Correct</span>}
                </div>
              );
            })}
          </div>
          {typeof content.feedback === 'string' && (
            <div className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200 mt-2">
              <span className="font-bold text-gray-800">Feedback: </span>
              {content.feedback}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="p-4 border border-gray-200 rounded-xl text-xs text-gray-600">
          <span className="font-bold text-gray-800 capitalize">{block.category}: </span>
          {content.title || content.text || content.body || ''}
        </div>
      );
  }
}
