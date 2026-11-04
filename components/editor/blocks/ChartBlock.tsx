'use client';

import React from 'react';
import { Block } from '@/lib/types';
import { BarChart2, TrendingUp, PieChart as PieIcon, Plus, Trash2 } from 'lucide-react';

interface ChartBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

interface ChartDataPoint {
  label: string;
  value: number;
}

export function ChartBlock({
  block,
  onChange,
  accentColor = '#ff5722',
  isLearnerMode = false,
}: ChartBlockProps) {
  const { subtype, content } = block;

  const title = (content.title as string) || 'Primary Attack Vectors in Corporate Breaches';
  const subtitle =
    (content.subtitle as string) || 'Percentage distribution of initial entry points reported in 2025';

  const defaultData: ChartDataPoint[] = [
    { label: 'Phishing & Pretexting', value: 43 },
    { label: 'Stolen Credentials', value: 27 },
    { label: 'Vulnerability Exploit', value: 16 },
    { label: 'Insider Threat', value: 9 },
    { label: 'Misconfiguration', value: 5 },
  ];

  const data = (content.data as ChartDataPoint[]) || defaultData;
  const maxValue = Math.max(...data.map((d) => d.value), 10);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0) || 1;

  const handleUpdateItem = (idx: number, field: 'label' | 'value', val: string | number) => {
    const next = [...data];
    next[idx] = { ...next[idx], [field]: val };
    onChange({ ...content, data: next });
  };

  const handleAddItem = () => {
    const next = [...data, { label: `Category ${data.length + 1}`, value: 15 }];
    onChange({ ...content, data: next });
  };

  const handleDeleteItem = (idx: number) => {
    if (data.length <= 2) return;
    const next = data.filter((_, i) => i !== idx);
    onChange({ ...content, data: next });
  };

  // Color generator based on index and accentColor
  const getBarColor = (idx: number) => {
    if (idx === 0) return accentColor;
    const colors = ['#0284c7', '#059669', '#d97706', '#7c3aed', '#dc2626', '#4f46e5'];
    return colors[(idx - 1) % colors.length];
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          {subtype === 'line_chart' ? (
            <TrendingUp className="w-4 h-4 text-sky-600" />
          ) : subtype === 'pie_chart' ? (
            <PieIcon className="w-4 h-4 text-emerald-600" />
          ) : (
            <BarChart2 className="w-4 h-4 text-amber-600" />
          )}
          <span>
            {subtype === 'line_chart'
              ? 'Line Chart'
              : subtype === 'pie_chart'
              ? 'Pie / Donut Chart'
              : 'Bar Chart'}
          </span>
        </div>

        <h3
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => onChange({ ...content, title: e.currentTarget.innerText })}
          className="text-base sm:text-lg font-bold text-gray-900 outline-none"
        >
          {title}
        </h3>
        <p
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => onChange({ ...content, subtitle: e.currentTarget.innerText })}
          className="text-xs text-gray-500 outline-none"
        >
          {subtitle}
        </p>
      </div>

      {/* Chart Visualizations */}
      {subtype === 'line_chart' ? (
        /* LINE CHART (SVG POLYLINE) */
        <div className="py-4">
          <div className="h-64 w-full relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`gradient-${block.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.25" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area polygon */}
              {data.length > 1 && (
                <polygon
                  points={`0,200 ${data
                    .map((d, i) => {
                      const x = (i / (data.length - 1)) * 500;
                      const y = 200 - (d.value / maxValue) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')} 500,200`}
                  fill={`url(#gradient-${block.id})`}
                />
              )}

              {/* Line path */}
              {data.length > 1 && (
                <polyline
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={data
                    .map((d, i) => {
                      const x = (i / (data.length - 1)) * 500;
                      const y = 200 - (d.value / maxValue) * 160;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {/* Nodes */}
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * 500;
                const y = 200 - (d.value / maxValue) * 160;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="5"
                    fill="white"
                    stroke={accentColor}
                    strokeWidth="2.5"
                    className="hover:scale-150 transition-transform cursor-pointer"
                  />
                );
              })}
            </svg>

            {/* Bottom Labels */}
            <div className="flex justify-between text-[11px] font-semibold text-gray-500 mt-3 pt-2 border-t border-gray-100">
              {data.map((d, i) => (
                <div key={i} className="text-center truncate max-w-[80px]">
                  <div>{d.label}</div>
                  <div className="font-bold text-gray-900">{d.value}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : subtype === 'pie_chart' ? (
        /* PIE / DONUT CHART */
        <div className="py-4 flex flex-col md:flex-row items-center justify-around gap-8">
          <div className="relative w-48 h-48 flex-shrink-0">
            {/* Donut Chart with SVG Segments */}
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {(() => {
                let cumulativePercent = 0;
                return data.map((d, i) => {
                  const percent = (d.value / totalValue) * 100;
                  const strokeDasharray = `${percent} ${100 - percent}`;
                  const strokeDashoffset = -cumulativePercent;
                  cumulativePercent += percent;
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r="35"
                      fill="transparent"
                      stroke={getBarColor(i)}
                      strokeWidth="18"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      className="hover:opacity-80 transition-opacity"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900">{totalValue}%</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2.5 max-w-sm w-full">
            {data.map((d, i) => {
              const pct = Math.round((d.value / totalValue) * 100);
              return (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getBarColor(i) }}
                    />
                    <span className="font-medium text-gray-800 truncate">{d.label}</span>
                  </div>
                  <span className="font-bold text-gray-900 flex-shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* DEFAULT: BAR CHART */
        <div className="space-y-4 py-2">
          {data.map((d, i) => {
            const widthPct = Math.min(100, Math.round((d.value / maxValue) * 100));
            return (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-800">{d.label}</span>
                  <span className="font-bold text-gray-900">{d.value}%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      backgroundColor: getBarColor(i),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Authoring Data Row Editor */}
      {!isLearnerMode && (
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="text-xs font-bold text-gray-600">Chart Data Values:</div>
          <div className="space-y-2">
            {data.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={d.label}
                  onChange={(e) => handleUpdateItem(i, 'label', e.target.value)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded flex-1 focus:outline-none focus:border-black"
                  placeholder="Category label"
                />
                <input
                  type="number"
                  value={d.value}
                  onChange={(e) => handleUpdateItem(i, 'value', parseInt(e.target.value) || 0)}
                  className="px-2.5 py-1 text-xs border border-gray-300 rounded w-20 focus:outline-none focus:border-black font-mono text-right"
                  placeholder="Value"
                />
                {data.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(i)}
                    className="p-1 text-gray-400 hover:text-rose-600 rounded"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black pt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Data Point</span>
          </button>
        </div>
      )}
    </div>
  );
}
