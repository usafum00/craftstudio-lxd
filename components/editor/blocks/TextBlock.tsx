'use client';

import React, { useRef } from 'react';
import { Block } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

interface TextBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function TextBlock({ block, onChange, accentColor = '#ff5722', isLearnerMode = false }: TextBlockProps) {
  const { subtype, content } = block;

  const handleContentBlur = (field: string, html: string) => {
    onChange({
      ...content,
      [field]: html,
    });
  };

  // Table Data helpers
  const tableData = (content.table as { headers: string[]; rows: string[][] }) || {
    headers: ['Topic / Principle', 'Security Standard', 'Verification Protocol'],
    rows: [
      ['Incoming Phone Calls', 'No sensitive credentials disclosed', 'Verify caller via IT Helpdesk extension'],
      ['Urgent Wire Transfers', 'Dual executive sign-off required', 'Out-of-band phone confirmation'],
      ['External Vendor Links', 'Domain whitelist inspection', 'Inspect SSL certificate and SPF/DKIM'],
    ],
  };

  const handleUpdateCell = (rowIndex: number, colIndex: number, text: string) => {
    const newRows = tableData.rows.map((row, rIdx) =>
      rIdx === rowIndex ? row.map((cell, cIdx) => (cIdx === colIndex ? text : cell)) : row
    );
    onChange({
      ...content,
      table: { ...tableData, rows: newRows },
    });
  };

  const handleUpdateHeader = (colIndex: number, text: string) => {
    const newHeaders = tableData.headers.map((h, i) => (i === colIndex ? text : h));
    onChange({
      ...content,
      table: { ...tableData, headers: newHeaders },
    });
  };

  const handleAddRow = () => {
    const emptyRow = new Array(tableData.headers.length).fill('Editable cell');
    onChange({
      ...content,
      table: { ...tableData, rows: [...tableData.rows, emptyRow] },
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    if (tableData.rows.length <= 1) return;
    const newRows = tableData.rows.filter((_, i) => i !== rowIndex);
    onChange({
      ...content,
      table: { ...tableData, rows: newRows },
    });
  };

  const handleAddColumn = () => {
    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map((row) => [...row, 'Editable cell']);
    onChange({
      ...content,
      table: { headers: newHeaders, rows: newRows },
    });
  };

  if (subtype === 'heading') {
    return (
      <div className="w-full">
        <h2
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('heading', e.currentTarget.innerHTML)}
          className={`text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight rounded p-1 transition-all ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{ __html: (content.heading as string) || 'Enter your heading...' }}
        />
      </div>
    );
  }

  if (subtype === 'subheading') {
    return (
      <div className="w-full">
        <h3
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('subheading', e.currentTarget.innerHTML)}
          className={`text-lg sm:text-xl font-semibold text-gray-800 tracking-tight rounded p-1 transition-all ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{ __html: (content.subheading as string) || 'Enter your subheading...' }}
        />
      </div>
    );
  }

  if (subtype === 'paragraph_heading') {
    return (
      <div className="w-full space-y-3">
        <h2
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('heading', e.currentTarget.innerHTML)}
          className={`text-xl sm:text-2xl font-bold text-gray-900 tracking-tight rounded p-1 transition-all ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{ __html: (content.heading as string) || 'Understanding Phishing Tactics' }}
        />
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('body', e.currentTarget.innerHTML)}
          className={`text-sm sm:text-base text-gray-700 leading-relaxed rounded p-1 transition-all prose prose-slate max-w-none ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{
            __html:
              (content.body as string) ||
              '<p>Social engineering relies on human psychology rather than software vulnerabilities. Attackers exploit trust, curiosity, urgency, and fear to convince employees to bypass security protocols.</p>',
          }}
        />
      </div>
    );
  }

  if (subtype === 'paragraph_subheading') {
    return (
      <div className="w-full space-y-2">
        <h3
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('subheading', e.currentTarget.innerHTML)}
          className={`text-base sm:text-lg font-semibold text-gray-800 tracking-tight rounded p-1 transition-all ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{ __html: (content.subheading as string) || 'Key Vulnerability Patterns' }}
        />
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('body', e.currentTarget.innerHTML)}
          className={`text-sm sm:text-base text-gray-700 leading-relaxed rounded p-1 transition-all prose prose-slate max-w-none ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{
            __html:
              (content.body as string) ||
              '<p>Phishing campaigns have evolved from generic spam to highly personalized spear-phishing messages targeting specific employees with access to critical infrastructure.</p>',
          }}
        />
      </div>
    );
  }

  if (subtype === 'two_column') {
    return (
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('columnLeft', e.currentTarget.innerHTML)}
          className={`text-sm sm:text-base text-gray-700 leading-relaxed rounded p-1 transition-all border-r border-transparent md:border-gray-100 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{
            __html:
              (content.columnLeft as string) ||
              '<p><strong>Column 1: External Threats</strong><br>Attackers gather intelligence from professional networking websites, corporate press releases, and social media to formulate persuasive pretexts before initiating contact.</p>',
          }}
        />
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && handleContentBlur('columnRight', e.currentTarget.innerHTML)}
          className={`text-sm sm:text-base text-gray-700 leading-relaxed rounded p-1 transition-all ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
          dangerouslySetInnerHTML={{
            __html:
              (content.columnRight as string) ||
              '<p><strong>Column 2: Internal Protections</strong><br>Routine verification protocols, out-of-band verification via official phone directories, and multi-factor authentication mitigate the likelihood of credential compromise.</p>',
          }}
        />
      </div>
    );
  }

  if (subtype === 'table') {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-gray-400">
            Interactive Data Table
          </span>
          {!isLearnerMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddRow}
                className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
              <button
                type="button"
                onClick={handleAddColumn}
                className="px-2.5 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Column</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50 text-gray-900 font-semibold">
              <tr>
                {tableData.headers.map((header, colIdx) => (
                  <th key={colIdx} className="p-3 sm:p-4 min-w-[140px]">
                    {isLearnerMode ? (
                      <span className="font-semibold text-gray-900">{header}</span>
                    ) : (
                      <input
                        type="text"
                        value={header}
                        onChange={(e) => handleUpdateHeader(colIdx, e.target.value)}
                        className="bg-transparent font-semibold text-gray-900 outline-none w-full border-b border-transparent focus:border-gray-400"
                      />
                    )}
                  </th>
                ))}
                {!isLearnerMode && <th className="w-10 p-2"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {tableData.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50/60 group">
                  {row.map((cell, colIdx) => (
                    <td key={colIdx} className="p-3 sm:p-4">
                      {isLearnerMode ? (
                        <span className="text-gray-700">{cell}</span>
                      ) : (
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => handleUpdateCell(rowIdx, colIdx, e.target.value)}
                          className="bg-transparent text-gray-700 outline-none w-full border-b border-transparent focus:border-sky-500"
                        />
                      )}
                    </td>
                  ))}
                  {!isLearnerMode && (
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rowIdx)}
                        className="p-1 rounded text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Default Paragraph
  return (
    <div className="w-full">
      <div
        contentEditable={!isLearnerMode}
        suppressContentEditableWarning
        onBlur={(e) => !isLearnerMode && handleContentBlur('body', e.currentTarget.innerHTML)}
        className={`text-sm sm:text-base text-gray-700 leading-relaxed rounded p-1 transition-all prose prose-slate max-w-none ${
          isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
        }`}
        dangerouslySetInnerHTML={{
          __html:
            (content.body as string) ||
            '<p>Security awareness training enables organizations to convert employees from passive vulnerability points into an active human detection grid.</p>',
        }}
      />
    </div>
  );
}
