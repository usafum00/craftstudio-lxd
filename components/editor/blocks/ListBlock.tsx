'use client';

import React, { useState } from 'react';
import { Block } from '@/lib/types';
import { Plus, Trash2, Check, ArrowUp, ArrowDown } from 'lucide-react';

interface ListBlockProps {
  block: Block;
  onChange: (updatedContent: Record<string, unknown>) => void;
  accentColor?: string;
  isLearnerMode?: boolean;
}

export function ListBlock({ block, onChange, accentColor = '#ff5722', isLearnerMode = false }: ListBlockProps) {
  const { subtype, content } = block;

  const items: string[] = (content.items as string[]) || [
    'Verify sender email headers and domain spelling prior to replying.',
    'Confirm unusual wire transfer requests via internal communication channels.',
    'Never input company login credentials into unverified web forms.',
    'Immediately escalate suspicious incoming messages to the SOC team.',
  ];

  const title = (content.title as string) || '';

  // Interactive checked states (for checkbox_list)
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});

  const handleUpdateItem = (index: number, newText: string) => {
    const updated = items.map((it, i) => (i === index ? newText : it));
    onChange({ ...content, items: updated });
  };

  const handleAddItem = () => {
    onChange({
      ...content,
      items: [...items, 'New list item. Click to edit...'],
    });
  };

  const handleDeleteItem = (index: number) => {
    if (items.length <= 1) return;
    const updated = items.filter((_, i) => i !== index);
    onChange({ ...content, items: updated });
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange({ ...content, items: updated });
  };

  const toggleCheck = (index: number) => {
    setCheckedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="w-full space-y-4">
      {/* Optional List Title */}
      {(title || subtype === 'numbered_list') && (
        <div
          contentEditable={!isLearnerMode}
          suppressContentEditableWarning
          onBlur={(e) => !isLearnerMode && onChange({ ...content, title: e.currentTarget.innerText })}
          className={`font-bold text-sm sm:text-base text-gray-900 rounded p-1 ${
            isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'
          }`}
        >
          {title || 'Essential Action Steps'}
        </div>
      )}

      {/* List items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 group/item rounded-xl p-1.5 hover:bg-gray-50/80 transition-colors"
          >
            {/* Left Badge / Icon based on subtype */}
            {subtype === 'numbered_list' && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0 mt-0.5 shadow-xs"
                style={{ backgroundColor: accentColor }}
              >
                {index + 1}
              </div>
            )}

            {subtype === 'checkbox_list' && (
              <button
                type="button"
                onClick={() => toggleCheck(index)}
                className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all cursor-pointer ${
                  checkedMap[index]
                    ? 'border-transparent text-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
                style={{
                  backgroundColor: checkedMap[index] ? accentColor : 'transparent',
                }}
              >
                {checkedMap[index] && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            )}

            {subtype === 'bulleted_list' && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-2 transition-colors"
                style={{ backgroundColor: accentColor }}
              />
            )}

            {/* Editable Content */}
            <div
              contentEditable={!isLearnerMode}
              suppressContentEditableWarning
              onBlur={(e) => !isLearnerMode && handleUpdateItem(index, e.currentTarget.innerText)}
              className={`flex-1 text-xs sm:text-sm text-gray-800 leading-relaxed rounded px-1.5 py-0.5 ${
                checkedMap[index] && subtype === 'checkbox_list' ? 'line-through text-gray-400' : ''
              } ${isLearnerMode ? 'outline-none' : 'outline-none focus:ring-1 focus:ring-sky-500/50'}`}
            >
              {item}
            </div>

            {/* Hover Actions: Move Up / Down / Delete (Only in Author Mode) */}
            {!isLearnerMode && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => handleMoveItem(index, 'up')}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  title="Move item up"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  disabled={index === items.length - 1}
                  onClick={() => handleMoveItem(index, 'down')}
                  className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                  title="Move item down"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(index)}
                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Item Button (Only in Author Mode) */}
      {!isLearnerMode && (
        <button
          type="button"
          onClick={handleAddItem}
          className="text-xs font-semibold text-gray-600 hover:text-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add List Item</span>
        </button>
      )}
    </div>
  );
}
