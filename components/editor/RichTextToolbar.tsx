'use client';

import React from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Palette,
  Type,
} from 'lucide-react';

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  accentColor?: string;
  className?: string;
}

export function RichTextToolbar({ onFormat, accentColor = '#ff5722', className = '' }: RichTextToolbarProps) {
  const handleAction = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    e.stopPropagation();
    onFormat(command, value);
  };

  return (
    <div
      className={`bg-white border border-gray-200/90 shadow-lg rounded-xl p-1 flex items-center gap-0.5 text-gray-700 select-none animate-in fade-in duration-100 ${className}`}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={(e) => handleAction(e, 'bold')}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={(e) => handleAction(e, 'italic')}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={(e) => handleAction(e, 'underline')}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <button
        type="button"
        onClick={(e) => handleAction(e, 'justifyLeft')}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Align Left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={(e) => handleAction(e, 'justifyCenter')}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Align Center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={(e) => handleAction(e, 'justifyRight')}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Align Right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-gray-200 mx-1" />

      <button
        type="button"
        onClick={(e) => {
          const url = prompt('Enter link URL (e.g. https://...):');
          if (url) handleAction(e, 'createLink', url);
        }}
        className="p-1.5 hover:bg-gray-100 rounded text-gray-700 hover:text-black transition-colors"
        title="Insert Link"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={(e) => handleAction(e, 'foreColor', accentColor)}
        className="p-1.5 hover:bg-gray-100 rounded flex items-center gap-1 transition-colors"
        title="Apply Brand Color"
      >
        <Palette className="w-3.5 h-3.5" style={{ color: accentColor }} />
      </button>
    </div>
  );
}
